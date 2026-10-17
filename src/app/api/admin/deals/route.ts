import { NextResponse } from 'next/server';
import { DealFormSchema } from '../../../../lib/validation/deal';
import { createServerClient, createServiceClient } from '../../../../lib/supabase/server';
import { DataRepository } from '../../../../lib/data/db';

// Basic in-memory rate limit: 20 requests / minute / IP.
const rateBuckets = new Map<string, number[]>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function getClientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    return fwd.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    rateBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  return false;
}

type AdminCheck =
  | { ok: true }
  | { ok: false; status: 401 | 403; message: string };

async function requireAdmin(request: Request): Promise<AdminCheck> {
  // Service-role bypass for server-to-server calls.
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const authHeader = request.headers.get('authorization');
    if (serviceKey && authHeader === `Bearer ${serviceKey}`) {
      return { ok: true };
    }
  } catch {
    // ignore and continue with user auth
  }

  const supabase = await createServerClient();
  if (!supabase) {
    // No Supabase configured (local dataset mode) — allow through;
    // POST will echo with persisted:false.
    return { ok: true };
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, status: 401, message: 'Authentication required' };
    }
    const bootstrap = process.env.ADMIN_BOOTSTRAP_EMAIL;
    if (bootstrap && user.email?.toLowerCase() === bootstrap.toLowerCase()) {
      return { ok: true };
    }
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error || !data) {
      return { ok: false, status: 403, message: 'Forbidden: admin access required' };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 401, message: 'Authentication check failed' };
  }
}

/** Trim strings, normalize slug/currency, cap lengths before Zod validation. */
function sanitizeDealInput(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) {
    return raw;
  }
  const body = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...body };
  const cleanStr = (v: unknown, max = 5000): unknown =>
    typeof v === 'string' ? v.trim().slice(0, max) : v;

  for (const k of ['title', 'summary', 'geography', 'confidence_note']) {
    if (k in out) {
      out[k] = cleanStr(out[k]);
    }
  }
  if (typeof out.slug === 'string') {
    out.slug = out.slug.trim().toLowerCase().slice(0, 200);
  }
  if (typeof out.amount_currency === 'string') {
    out.amount_currency = out.amount_currency.trim().toUpperCase().slice(0, 3);
  }
  if (Array.isArray(out.parties)) {
    out.parties = out.parties.map((p) => {
      if (typeof p !== 'object' || p === null) {
        return p;
      }
      const pp = { ...(p as Record<string, unknown>) };
      if (typeof pp.company_id === 'string') {
        pp.company_id = pp.company_id.trim();
      }
      if (typeof pp.role === 'string') {
        pp.role = pp.role.trim();
      }
      if (typeof pp.direction_note === 'string') {
        const note = pp.direction_note.trim().slice(0, 1000);
        pp.direction_note = note === '' ? null : note;
      }
      return pp;
    });
  }
  if (Array.isArray(out.sources)) {
    out.sources = out.sources.map((s) => {
      if (typeof s !== 'object' || s === null) {
        return s;
      }
      const ss = { ...(s as Record<string, unknown>) };
      for (const k of ['url', 'title', 'publisher', 'supporting_note']) {
        if (typeof ss[k] === 'string') {
          ss[k] = (ss[k] as string).trim();
        }
      }
      return ss;
    });
  }
  return out;
}

export async function GET(request: Request) {
  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const service = createServiceClient();
  if (service) {
    try {
      const { data, error } = await service
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) {
        return NextResponse.json({ success: true, persisted: true, deals: data });
      }
    } catch {
      // fall through to dataset fallback
    }
  }

  const deals = (await DataRepository.getDeals()).slice(0, 20);
  return NextResponse.json({ success: true, persisted: false, deals });
}

export async function POST(request: Request) {
  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const body = await request.json();

    // Enforce strict Zod schema validation on sanitized input
    const parsed = DealFormSchema.safeParse(sanitizeDealInput(body));
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const validDeal = parsed.data;

    // Publish check: Must have at least 1 verified source citation
    if (validDeal.is_published && (!validDeal.sources || validDeal.sources.length === 0)) {
      return NextResponse.json(
        {
          error: 'Integrity rule violation: A published deal requires at least one verified source citation.',
        },
        { status: 422 }
      );
    }

    const service = createServiceClient();
    if (!service) {
      // No Supabase configured — echo success without persisting.
      return NextResponse.json({
        success: true,
        persisted: false,
        deal: validDeal,
        message: validDeal.is_published
          ? 'Deal validated and queued for public ledger'
          : 'Draft saved to internal review queue',
      });
    }

    try {
      const dealRow = {
        title: validDeal.title,
        slug: validDeal.slug,
        summary: validDeal.summary,
        deal_type: validDeal.deal_type,
        status: validDeal.status,
        announcement_date: validDeal.announcement_date ?? null,
        effective_date: validDeal.effective_date ?? null,
        maturity_date: validDeal.maturity_date ?? null,
        amount_value: validDeal.amount_value ?? null,
        amount_currency: validDeal.amount_currency ?? 'USD',
        amount_basis: validDeal.amount_basis ?? null,
        amount_period: validDeal.amount_period ?? null,
        amount_disclosed: validDeal.amount_disclosed ?? false,
        geography: validDeal.geography ?? null,
        evidence_level: validDeal.evidence_level,
        confidence_note: validDeal.confidence_note ?? null,
        is_published: validDeal.is_published ?? false,
      };
      const { data: inserted, error: dealError } = await service
        .from('deals')
        .insert(dealRow)
        .select('id')
        .single();
      if (dealError || !inserted) {
        throw new Error(dealError?.message || 'Failed to persist deal');
      }
      const dealId = (inserted as { id: string }).id;

      if (validDeal.parties && validDeal.parties.length > 0) {
        const { error: partiesError } = await service.from('deal_parties').insert(
          validDeal.parties.map((p) => ({
            deal_id: dealId,
            company_id: p.company_id,
            role: p.role,
            direction_note: p.direction_note ?? null,
          }))
        );
        if (partiesError) {
          throw new Error(partiesError.message);
        }
      }

      if (validDeal.sources && validDeal.sources.length > 0) {
        for (const s of validDeal.sources) {
          const { data: src, error: srcError } = await service
            .from('sources')
            .insert({
              url: s.url,
              title: s.title,
              publisher: s.publisher ?? null,
              source_type: s.source_type,
              published_date: s.published_date ?? null,
              notes: s.supporting_note ?? null,
            })
            .select('id')
            .single();
          if (srcError || !src) {
            throw new Error(srcError?.message || 'Failed to persist source');
          }
          const sourceId = (src as { id: string }).id;
          const { error: linkError } = await service.from('deal_sources').insert({
            deal_id: dealId,
            source_id: sourceId,
            supporting_note: s.supporting_note,
            is_primary_support: s.is_primary_support ?? false,
          });
          if (linkError) {
            throw new Error(linkError.message);
          }
        }
      }

      return NextResponse.json(
        {
          success: true,
          persisted: true,
          id: dealId,
          deal: validDeal,
          message: validDeal.is_published
            ? 'Deal validated and queued for public ledger'
            : 'Draft saved to internal review queue',
        },
        { status: 201 }
      );
    } catch (dbErr: unknown) {
      return NextResponse.json(
        { error: dbErr instanceof Error ? dbErr.message : 'Database persist failed' },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
