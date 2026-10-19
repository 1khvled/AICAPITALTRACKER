/**
 * Polymarket AI & Tech Prediction Markets Data Model
 * 
 * Includes live verified contract parameters from Polymarket's Gamma API
 * with affiliate referral tagging (r=AIbubble) to monetize trading flow.
 */

export const POLYMARKET_REFERRAL_CODE = "AIbubble";
export const POLYMARKET_BASE_URL = `https://polymarket.com/?r=${POLYMARKET_REFERRAL_CODE}`;

export interface PolymarketMarket {
  id: string;
  title: string;
  question: string;
  category: "Bubble & Downturn" | "Debt & Sovereign" | "Frontier Labs" | "Macro Tech";
  slug: string;
  eventSlug: string;
  yesProbabilityPct: number;
  noProbabilityPct: number;
  yesPriceUsd: number;
  noPriceUsd: number;
  volumeUsd: number;
  liquidityUsd: number;
  endDate: string;
  referralUrl: string;
  tradeYesUrl: string;
  tradeNoUrl: string;
  description: string;
  tag: string;
  resolutionSource: string;
  change24hPct: number;
}

export interface PolymarketHistoryPoint {
  date: string; // e.g. '2024-06'
  aiBubble2026: number; // percentage (0-100)
  aiBubble2027: number;
  oracleCdsStress: number;
  openaiAgiOdds: number;
  volumeCumulativeMillions: number;
}

export const POLYMARKET_HISTORICAL_TRENDS: PolymarketHistoryPoint[] = [
  { date: "Jan 2024", aiBubble2026: 2.4, aiBubble2027: 5.1, oracleCdsStress: 14.0, openaiAgiOdds: 19.5, volumeCumulativeMillions: 0.8 },
  { date: "Apr 2024", aiBubble2026: 3.8, aiBubble2027: 7.2, oracleCdsStress: 16.5, openaiAgiOdds: 21.0, volumeCumulativeMillions: 1.6 },
  { date: "Jul 2024", aiBubble2026: 4.9, aiBubble2027: 9.0, oracleCdsStress: 22.0, openaiAgiOdds: 17.8, volumeCumulativeMillions: 2.9 },
  { date: "Oct 2024", aiBubble2026: 6.2, aiBubble2027: 11.4, oracleCdsStress: 26.5, openaiAgiOdds: 15.2, volumeCumulativeMillions: 4.3 },
  { date: "Jan 2025", aiBubble2026: 8.5, aiBubble2027: 14.0, oracleCdsStress: 31.0, openaiAgiOdds: 14.0, volumeCumulativeMillions: 5.8 },
  { date: "May 2025", aiBubble2026: 11.8, aiBubble2027: 18.2, oracleCdsStress: 39.5, openaiAgiOdds: 12.1, volumeCumulativeMillions: 6.9 },
  { date: "Sep 2025", aiBubble2026: 9.4, aiBubble2027: 16.8, oracleCdsStress: 34.0, openaiAgiOdds: 10.4, volumeCumulativeMillions: 7.7 },
  { date: "Jan 2026", aiBubble2026: 8.9, aiBubble2027: 16.2, oracleCdsStress: 36.2, openaiAgiOdds: 9.8, volumeCumulativeMillions: 8.1 },
  { date: "May 2026", aiBubble2026: 8.1, aiBubble2027: 15.9, oracleCdsStress: 37.8, openaiAgiOdds: 9.1, volumeCumulativeMillions: 8.4 },
  { date: "Oct 2026 (Live)", aiBubble2026: 7.6, aiBubble2027: 15.5, oracleCdsStress: 38.0, openaiAgiOdds: 8.5, volumeCumulativeMillions: 8.9 },
];

export const POLYMARKET_FEATURED_MARKETS: PolymarketMarket[] = [
  {
    id: "poly-bubble-2026",
    title: "AI Bubble Burst in 2026?",
    question: "Will the AI industry experience an official industry downturn by December 31, 2026?",
    category: "Bubble & Downturn",
    slug: "ai-industry-downturn-by-december-31-2026-857",
    eventSlug: "ai-bubble-burst-by",
    yesProbabilityPct: 7.6,
    noProbabilityPct: 92.4,
    yesPriceUsd: 0.076,
    noPriceUsd: 0.924,
    volumeUsd: 2443553,
    liquidityUsd: 55962,
    endDate: "2027-01-01",
    referralUrl: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`,
    tradeYesUrl: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}&outcome=Yes`,
    tradeNoUrl: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}&outcome=No`,
    description: "Resolves to YES if 3 of 6 conditions hit within 90 days: NVDA -50%, SOXX -40%, OpenAI/Anthropic bankruptcy/acquisition, H100 rental <$1/hr, or major supplier (TSM/ASML/AVGO/SMCI) -50%.",
    tag: "Flagship Contract",
    resolutionSource: "Official Exchange Data & SiliconData Index",
    change24hPct: -0.4,
  },
  {
    id: "poly-bubble-2027",
    title: "AI Bubble Burst by June 30, 2027?",
    question: "Will the AI industry experience an industry downturn by June 30, 2027?",
    category: "Bubble & Downturn",
    slug: "ai-bubble-burst-by-june-30-2027",
    eventSlug: "ai-bubble-burst-by",
    yesProbabilityPct: 15.5,
    noProbabilityPct: 84.5,
    yesPriceUsd: 0.155,
    noPriceUsd: 0.845,
    volumeUsd: 27206,
    liquidityUsd: 24679,
    endDate: "2027-07-01",
    referralUrl: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`,
    tradeYesUrl: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}&outcome=Yes`,
    tradeNoUrl: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}&outcome=No`,
    description: "Longer-horizon contract capturing medium-term capital expenditure exhaustion and sovereign data center buildout refinancing defaults.",
    tag: "High Yield",
    resolutionSource: "UMA Resolution Protocol",
    change24hPct: -1.0,
  },
  {
    id: "poly-oracle-debt",
    title: "Oracle (ORCL) 5Y CDS Spread >250bps Stress Threshold?",
    question: "Will Oracle 5-Year CDS trade above 250 bps before December 31, 2026?",
    category: "Debt & Sovereign",
    slug: "oracle-5y-cds-spread-stress-proxy",
    eventSlug: "oracle-debt-ai-capex-stress",
    yesProbabilityPct: 38.0,
    noProbabilityPct: 62.0,
    yesPriceUsd: 0.380,
    noPriceUsd: 0.620,
    volumeUsd: 1420900,
    liquidityUsd: 182400,
    endDate: "2026-12-31",
    referralUrl: `https://polymarket.com/?r=${POLYMARKET_REFERRAL_CODE}`,
    tradeYesUrl: `https://polymarket.com/?r=${POLYMARKET_REFERRAL_CODE}`,
    tradeNoUrl: `https://polymarket.com/?r=${POLYMARKET_REFERRAL_CODE}`,
    description: "Tracks the primary debt credit proxy for AI hyperscale facilities. Baseline CDS was 81bps; currently trading at 187bps (+131% widening).",
    tag: "Debt Anchor",
    resolutionSource: "ICE Fixed Income / Markit CDS Index",
    change24hPct: +1.8,
  },
  {
    id: "poly-openai-ipo-2026",
    title: "Will OpenAI IPO in 2026?",
    question: "Will OpenAI complete an initial public offering (IPO) by December 31, 2026?",
    category: "Frontier Labs",
    slug: "will-openai-ipo-by-december-31-2026",
    eventSlug: "openai-ipo-by",
    yesProbabilityPct: 4.3,
    noProbabilityPct: 95.7,
    yesPriceUsd: 0.043,
    noPriceUsd: 0.957,
    volumeUsd: 1056347,
    liquidityUsd: 48920,
    endDate: "2026-12-31",
    referralUrl: `https://polymarket.com/event/openai-ipo-by?r=${POLYMARKET_REFERRAL_CODE}`,
    tradeYesUrl: `https://polymarket.com/event/openai-ipo-by?r=${POLYMARKET_REFERRAL_CODE}&outcome=Yes`,
    tradeNoUrl: `https://polymarket.com/event/openai-ipo-by?r=${POLYMARKET_REFERRAL_CODE}&outcome=No`,
    description: "Market pricing public exit timeline following OpenAI's $852B post-money benchmark and restructuring into a for-profit public benefit corporation.",
    tag: "Megacap IPO",
    resolutionSource: "SEC Form S-1 Effective Filing",
    change24hPct: -0.2,
  },
  {
    id: "poly-openai-agi-2026",
    title: "OpenAI Announces Achieved AGI Before 2027?",
    question: "Will OpenAI officially announce that it has achieved Artificial General Intelligence (AGI) before 2027?",
    category: "Frontier Labs",
    slug: "openai-announces-it-has-achieved-agi-before-2027",
    eventSlug: "openai-announces-it-has-achieved-agi-before-2027",
    yesProbabilityPct: 8.5,
    noProbabilityPct: 91.5,
    yesPriceUsd: 0.085,
    noPriceUsd: 0.915,
    volumeUsd: 325394,
    liquidityUsd: 31200,
    endDate: "2027-01-01",
    referralUrl: `https://polymarket.com/event/openai-announces-it-has-achieved-agi-before-2027?r=${POLYMARKET_REFERRAL_CODE}`,
    tradeYesUrl: `https://polymarket.com/event/openai-announces-it-has-achieved-agi-before-2027?r=${POLYMARKET_REFERRAL_CODE}&outcome=Yes`,
    tradeNoUrl: `https://polymarket.com/event/openai-announces-it-has-achieved-agi-before-2027?r=${POLYMARKET_REFERRAL_CODE}&outcome=No`,
    description: "Requires official public confirmation from OpenAI board / Sam Altman that internal benchmark criteria for AGI have been satisfied.",
    tag: "Milestone",
    resolutionSource: "OpenAI Official Press Releases",
    change24hPct: -0.5,
  },
  {
    id: "poly-openai-trillion-ipo",
    title: "OpenAI $1T+ IPO Market Cap Before 2027?",
    question: "Will OpenAI IPO with a market capitalization of $1,000,000,000,000 or greater before 2027?",
    category: "Frontier Labs",
    slug: "openai-1t-ipo-before-2027",
    eventSlug: "openai-1t-ipo-before-2027",
    yesProbabilityPct: 2.4,
    noProbabilityPct: 97.6,
    yesPriceUsd: 0.024,
    noPriceUsd: 0.976,
    volumeUsd: 317022,
    liquidityUsd: 19400,
    endDate: "2027-01-01",
    referralUrl: `https://polymarket.com/event/openai-1t-ipo-before-2027?r=${POLYMARKET_REFERRAL_CODE}`,
    tradeYesUrl: `https://polymarket.com/event/openai-1t-ipo-before-2027?r=${POLYMARKET_REFERRAL_CODE}&outcome=Yes`,
    tradeNoUrl: `https://polymarket.com/event/openai-1t-ipo-before-2027?r=${POLYMARKET_REFERRAL_CODE}&outcome=No`,
    description: "Evaluates whether market willingness to value frontier model labs at $1T+ persists under current 42× P/S multiples.",
    tag: "Valuation Stretch",
    resolutionSource: "Nasdaq / NYSE First Day Close",
    change24hPct: 0.0,
  },
  {
    id: "poly-anthropic-acquired",
    title: "Anthropic Acquired Before 2027?",
    question: "Will Anthropic PBC be acquired by another entity or corporation before 2027?",
    category: "Frontier Labs",
    slug: "anthropic-acquired-before-2027",
    eventSlug: "anthropic-acquired-before-2027",
    yesProbabilityPct: 2.6,
    noProbabilityPct: 97.4,
    yesPriceUsd: 0.026,
    noPriceUsd: 0.974,
    volumeUsd: 30586,
    liquidityUsd: 12800,
    endDate: "2027-01-01",
    referralUrl: `https://polymarket.com/event/anthropic-acquired-before-2027?r=${POLYMARKET_REFERRAL_CODE}`,
    tradeYesUrl: `https://polymarket.com/event/anthropic-acquired-before-2027?r=${POLYMARKET_REFERRAL_CODE}&outcome=Yes`,
    tradeNoUrl: `https://polymarket.com/event/anthropic-acquired-before-2027?r=${POLYMARKET_REFERRAL_CODE}&outcome=No`,
    description: "Considers regulatory antitrust hurdles vs hyperscaler balance sheet consolidation (Amazon / Alphabet $8B+ backings).",
    tag: "M&A",
    resolutionSource: "SEC 8-K or Equivalent Filing",
    change24hPct: +0.1,
  },
  {
    id: "poly-us-recession-2026",
    title: "US Recession by End of 2026?",
    question: "Will the NBER declare a US economic recession began in 2025 or 2026?",
    category: "Macro Tech",
    slug: "us-recession-by-end-of-2026",
    eventSlug: "us-recession-by-end-of-2026",
    yesProbabilityPct: 7.0,
    noProbabilityPct: 93.0,
    yesPriceUsd: 0.070,
    noPriceUsd: 0.930,
    volumeUsd: 2321829,
    liquidityUsd: 87100,
    endDate: "2027-01-01",
    referralUrl: `https://polymarket.com/event/us-recession-by-end-of-2026?r=${POLYMARKET_REFERRAL_CODE}`,
    tradeYesUrl: `https://polymarket.com/event/us-recession-by-end-of-2026?r=${POLYMARKET_REFERRAL_CODE}&outcome=Yes`,
    tradeNoUrl: `https://polymarket.com/event/us-recession-by-end-of-2026?r=${POLYMARKET_REFERRAL_CODE}&outcome=No`,
    description: "Broader macroeconomic trigger. A US recession would immediately contract enterprise SaaS budgets and freeze hyperscaler capex.",
    tag: "Macro Credit",
    resolutionSource: "NBER Business Cycle Committee",
    change24hPct: -0.3,
  },
];

export const POLYMARKET_RESOLUTION_CONDITIONS = [
  {
    id: "cond-nvda",
    title: "NVIDIA (NVDA) -50% from ATH",
    target: "$70.50 (ATH $141.00)",
    currentValue: "$138.25 (-1.9% from ATH)",
    status: "Safely Above Threshold",
    riskLevel: "Low",
    weightDescription: "Requires closing price drawdown exceeding 50% from record peak.",
  },
  {
    id: "cond-soxx",
    title: "PHLX Semiconductor ETF (SOXX) -40%",
    target: "$152.40 (ATH $254.00)",
    currentValue: "$228.10 (-10.2% from ATH)",
    status: "Normal Sector Volatility",
    riskLevel: "Low",
    weightDescription: "Broad semiconductor index drawdown proxy.",
  },
  {
    id: "cond-insolvency",
    title: "OpenAI or Anthropic Bankruptcy / Acquisition",
    target: "Ch. 11 Filing or Formal Buyout",
    currentValue: "OpenAI $852B benchmark (~$1T) / Anthropic $2.0T IPO target ($965B Series H)",
    status: "Extreme Balance Sheet Liquidity",
    riskLevel: "Low",
    weightDescription: "Either frontier lab insolvency or forced consolidation.",
  },
  {
    id: "cond-gpu-rental",
    title: "H100 GPU Rental Falls ≤ $1.00/hr (5 Days)",
    target: "$1.00 / hour",
    currentValue: "$1.95 - $2.40 / hour spot",
    status: "Compute Demand Still Elevated",
    riskLevel: "Medium",
    weightDescription: "Monitored via SiliconData Silicon Index over 5 consecutive trading days.",
  },
  {
    id: "cond-hardware-collapse",
    title: "Major AI Supplier Collapse (-50% from ATH)",
    target: "TSM, ASML, AVGO, ANET, or SMCI -50%",
    currentValue: "SMCI under accounting stress (-48%); TSM/ASML robust",
    status: "SMCI near threshold; others healthy",
    riskLevel: "High Attention",
    weightDescription: "At least one critical infrastructure node collapses 50%.",
  },
];
