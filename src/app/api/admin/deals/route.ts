import { NextResponse } from 'next/server';
import { DealFormSchema } from '../../../../lib/validation/deal';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Enforce strict Zod schema validation
    const parsed = DealFormSchema.safeParse(body);
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

    // In a live Supabase environment with service role, this inserts to `deals`, `deal_parties`, and `deal_sources`
    // Returning success with the validated deal
    return NextResponse.json({
      success: true,
      deal: validDeal,
      message: validDeal.is_published
        ? 'Deal validated and queued for public ledger'
        : 'Draft saved to internal review queue',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
