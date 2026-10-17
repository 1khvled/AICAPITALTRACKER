import { NextResponse } from 'next/server';
import { SecEdgarClient } from '../../../../lib/crawlers/sec-edgar';
import { createServerClient } from '../../../../lib/supabase/server';

const CIK_RE = /^\d{1,10}$/;

function extractProvidedSecret(request: Request, searchParams: URLSearchParams): string | null {
  const fromQuery = searchParams.get('secret');
  if (fromQuery) {
    return fromQuery;
  }
  const headerSecret = request.headers.get('x-cron-secret');
  if (headerSecret) {
    return headerSecret;
  }
  const auth = request.headers.get('authorization');
  if (auth && /^bearer\s+/i.test(auth)) {
    return auth.replace(/^bearer\s+/i, '').trim();
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cik = (searchParams.get('cik') || '0001045810').trim();

  if (!CIK_RE.test(cik)) {
    return NextResponse.json(
      { success: false, error: 'Invalid cik parameter. Must be 1-10 digits.' },
      { status: 400 }
    );
  }

  // If CRON_SECRET is set, require it or an admin session.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const provided = extractProvidedSecret(request, searchParams);
    if (provided !== cronSecret) {
      let authorized = false;
      try {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const authHeader = request.headers.get('authorization');
        if (serviceKey && authHeader === `Bearer ${serviceKey}`) {
          authorized = true;
        } else {
          const supabase = await createServerClient();
          if (supabase) {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              const bootstrap = process.env.ADMIN_BOOTSTRAP_EMAIL;
              if (bootstrap && user.email?.toLowerCase() === bootstrap.toLowerCase()) {
                authorized = true;
              } else {
                const { data, error } = await supabase
                  .from('admin_users')
                  .select('user_id')
                  .eq('user_id', user.id)
                  .maybeSingle();
                if (!error && data) {
                  authorized = true;
                }
              }
            }
          }
        }
      } catch {
        authorized = false;
      }
      if (!authorized) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: valid CRON_SECRET or admin session required' },
          { status: 401 }
        );
      }
    }
  }

  try {
    const filings = await SecEdgarClient.getCompanySubmissions(cik);
    return NextResponse.json(
      {
        success: true,
        cik,
        filingsFound: filings.length,
        filings,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
