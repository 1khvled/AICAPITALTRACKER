import { NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { createServiceClient } from '../../../lib/supabase/server';

const CorrectionsSchema = z.object({
  name: z.string().min(2, 'Name is required').max(200),
  email: z.string().email('Valid email is required'),
  message: z.string().min(10, 'Explanation must be at least 10 characters').max(10000),
  transactionSlug: z.string().max(300).optional(),
  field: z.string().max(100).optional(),
  currentValue: z.string().max(2000).optional(),
  correctValue: z.string().max(2000).optional(),
  proofUrl: z.string().max(2000).optional(),
});

async function appendToQueue(entry: Record<string, unknown>) {
  try {
    const queuePath = path.join(process.cwd(), 'data', 'corrections_queue.json');
    let existing: Record<string, unknown>[] = [];
    try {
      const raw = await fs.readFile(queuePath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        existing = parsed as Record<string, unknown>[];
      }
    } catch {
      existing = [];
    }
    existing.push(entry);
    await fs.mkdir(path.dirname(queuePath), { recursive: true });
    await fs.writeFile(queuePath, JSON.stringify(existing, null, 2), 'utf8');
  } catch {
    // Queue persistence is best-effort; API still returns success.
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = CorrectionsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = {
      name: parsed.data.name.trim().slice(0, 200),
      email: parsed.data.email.trim().slice(0, 320),
      message: parsed.data.message.trim().slice(0, 10000),
      transactionSlug: parsed.data.transactionSlug?.trim().slice(0, 300) || null,
      field: parsed.data.field?.trim().slice(0, 100) || null,
      currentValue: parsed.data.currentValue?.trim().slice(0, 2000) || null,
      correctValue: parsed.data.correctValue?.trim().slice(0, 2000) || null,
      proofUrl: parsed.data.proofUrl?.trim().slice(0, 2000) || null,
    };

    const entry = { id: `correction-${Date.now()}`, receivedAt: new Date().toISOString(), ...input };

    // Persist to Supabase when configured (best-effort), always append to local queue.
    const service = createServiceClient();
    if (service) {
      try {
        await service.from('correction_submissions').insert({
          name: input.name,
          email: input.email,
          message: input.message,
          transaction_slug: input.transactionSlug,
          field: input.field,
          current_value: input.currentValue,
          correct_value: input.correctValue,
          proof_url: input.proofUrl,
        });
      } catch {
        // Table may not exist yet — fall through to file queue.
      }
    }
    await appendToQueue(entry);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
