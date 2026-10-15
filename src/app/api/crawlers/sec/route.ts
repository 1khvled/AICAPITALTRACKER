import { NextResponse } from 'next/server';
import { SecEdgarClient } from '../../../../lib/crawlers/sec-edgar';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cik = searchParams.get('cik') || '0001045810'; // Default to NVIDIA CIK

  try {
    const filings = await SecEdgarClient.getCompanySubmissions(cik);
    return NextResponse.json({
      success: true,
      cik,
      filingsFound: filings.length,
      filings,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
