import liveStocksData from "./live-stocks.json";

/**
 * Fallback mirror of live-stocks.json — synced 19 Oct 2026.
 *
 * Every market cap below is the value carried in live-stocks.json (the
 * file the 24h pipeline writes). The caps were refreshed from filing
 * cover-page share counts × the Oct 16/19 close: AMZN $2.61T → $2.70T,
 * ORCL $353B → $387.8B, CEG $86.5B → $96.1B, NBIS $35.5B → $45.0B,
 * SMCI $18.5B → $20.8B, and CRWV $53.2B → $33.9B (adjudicated 19 Oct 2026
 * per the EDGAR verdict: 551,536,602 shares outstanding, 10-Q cover
 * 31 Jul 2026, × $61.39; the $53.2B / 866.6M-share figure appears in no
 * filing). If live-stocks.json ever fails to load, this list must not
 * reintroduce the rejected numbers.
 */

export interface StockQuote {
  ticker: string;
  name: string;
  priceUsd: number;
  change24hPct: number;
  category: "Hyperscaler" | "Frontier Lab Partner" | "Semiconductor" | "Power & Infrastructure";
  athUsd: number;
  drawdownFromAthPct: number;
  role: string;
  marketCapDisplay: string;
}

const STATIC_STOCKS: StockQuote[] = [
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    priceUsd: 214.13,
    change24hPct: -1.4,
    category: "Semiconductor",
    athUsd: 243.37,
    drawdownFromAthPct: -12.0,
    role: "AI Silicon & Ecosystem Anchor",
    marketCapDisplay: "$5.27T",
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    priceUsd: 529.05,
    change24hPct: -1.9,
    category: "Hyperscaler",
    athUsd: 553.72,
    drawdownFromAthPct: -4.5,
    role: "OpenAI Cloud Anchor & Nuclear Power Off-taker",
    marketCapDisplay: "$3.93T",
  },
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    priceUsd: 343.46,
    change24hPct: 0.4,
    category: "Hyperscaler",
    athUsd: 348.15,
    drawdownFromAthPct: -1.3,
    role: "Edge AI Device Monopoly & $136B+ Free Cash Flow Engine",
    marketCapDisplay: "$5.18T",
  },
  {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    priceUsd: 340.59,
    change24hPct: -2.5,
    category: "Hyperscaler",
    athUsd: 408.61,
    drawdownFromAthPct: -16.6,
    role: "Custom TPU V5e/V6 & Anthropic Backer",
    marketCapDisplay: "$4.19T",
  },
  {
    ticker: "AMZN",
    name: "Amazon.com Inc.",
    priceUsd: 250.00,
    change24hPct: -1.9,
    category: "Hyperscaler",
    athUsd: 287.20,
    drawdownFromAthPct: -13.0,
    role: "AWS Bedrock & Anthropic $8B Strategic Partner",
    marketCapDisplay: "$2.70T", // live-stocks.json (19 Oct 2026): 10,786,313,572 sh (10-Q cover 22 Jul 2026) × $250.00
  },
  {
    ticker: "META",
    name: "Meta Platforms Inc.",
    priceUsd: 709.33,
    change24hPct: -3.7,
    category: "Hyperscaler",
    athUsd: 779.82,
    drawdownFromAthPct: -9.0,
    role: "Llama Open Weights & 600k H100 Cluster Buyer",
    marketCapDisplay: "$1.79T",
  },
  {
    ticker: "SPCX",
    name: "SpaceX (Space Exploration Technologies)",
    priceUsd: 146.03,
    change24hPct: -1.7,
    category: "Hyperscaler",
    athUsd: 225.64,
    drawdownFromAthPct: -35.3,
    role: "AI Supercomputing, Starlink & xAI Colossus Parent",
    marketCapDisplay: "$2.05T",
  },
  {
    ticker: "ORCL",
    name: "Oracle Corporation",
    priceUsd: 128.23,
    change24hPct: -4.6,
    category: "Hyperscaler",
    athUsd: 289.24,
    drawdownFromAthPct: -55.7,
    role: "5Y CDS Credit Proxy & GPU Cluster Debt Anchor",
    marketCapDisplay: "$387.8B", // live-stocks.json (19 Oct 2026): 3,023,736,000 sh (10-Q cover 7 Sep 2026) × $128.23
  },
  {
    ticker: "TSM",
    name: "Taiwan Semiconductor (TSMC)",
    priceUsd: 412.61,
    change24hPct: -2.3,
    category: "Semiconductor",
    athUsd: 487.47,
    drawdownFromAthPct: -15.4,
    role: "CoWoS Packaging & 3nm/2nm Monopolist",
    marketCapDisplay: "$1.07T",
  },
  {
    ticker: "AVGO",
    name: "Broadcom Inc.",
    priceUsd: 328.75,
    change24hPct: -4.5,
    category: "Semiconductor",
    athUsd: 495.00,
    drawdownFromAthPct: -33.6,
    role: "Custom AI XPU ASIC & PCIe Switching",
    marketCapDisplay: "$1.54T",
  },
  {
    ticker: "CRWV",
    name: "CoreWeave Inc.",
    priceUsd: 61.39,
    change24hPct: -11.9,
    category: "Power & Infrastructure",
    athUsd: 141.79,
    drawdownFromAthPct: -56.7,
    role: "Specialized GPU Neocloud & NVIDIA Blackwell Partner",
    marketCapDisplay: "$33.9B", // live-stocks.json (19 Oct 2026): 551,536,602 sh (10-Q cover 31 Jul 2026) × $61.39 — the $53.2B figure was adjudicated out
  },
  {
    ticker: "PLTR",
    name: "Palantir Technologies",
    priceUsd: 186.03,
    change24hPct: -7.2,
    category: "Frontier Lab Partner",
    athUsd: 212.94,
    drawdownFromAthPct: -12.6,
    role: "Enterprise AIP & Defense AI Contract Bellwether",
    marketCapDisplay: "$418B",
  },
  {
    ticker: "AMD",
    name: "Advanced Micro Devices",
    priceUsd: 528.75,
    change24hPct: -6.0,
    category: "Semiconductor",
    athUsd: 658.52,
    drawdownFromAthPct: -19.7,
    role: "MI300X/MI325X AI GPU Competitor & ROCm",
    marketCapDisplay: "$856B",
  },
  {
    ticker: "INTC",
    name: "Intel Corporation",
    priceUsd: 89.85,
    change24hPct: -5.8,
    category: "Semiconductor",
    athUsd: 142.35,
    drawdownFromAthPct: -36.9,
    role: "Gaudi AI Accelerators & Datacenter Foundry",
    marketCapDisplay: "$386B",
  },
  {
    ticker: "ASML",
    name: "ASML Holding",
    priceUsd: 1641.52,
    change24hPct: -1.0,
    category: "Semiconductor",
    athUsd: 1999.96,
    drawdownFromAthPct: -17.9,
    role: "EUV Lithography Monopoly for AI Silicon",
    marketCapDisplay: "$645B",
  },
  {
    ticker: "QCOM",
    name: "Qualcomm Inc.",
    priceUsd: 172.11,
    change24hPct: -3.5,
    category: "Semiconductor",
    athUsd: 259.92,
    drawdownFromAthPct: -33.8,
    role: "Snapdragon NPU & Edge AI Inference Silicon",
    marketCapDisplay: "$191B",
  },
  {
    ticker: "CEG",
    name: "Constellation Energy",
    priceUsd: 271.37,
    change24hPct: -1.3,
    category: "Power & Infrastructure",
    athUsd: 406.04,
    drawdownFromAthPct: -33.2,
    role: "Three Mile Island Nuclear Restart for Microsoft",
    marketCapDisplay: "$96.1B", // live-stocks.json (19 Oct 2026): 354,307,379 sh (10-Q cover 31 Jul 2026) × $271.37
  },
  {
    ticker: "VST",
    name: "Vistra Corp.",
    priceUsd: 152.02,
    change24hPct: -1.4,
    category: "Power & Infrastructure",
    athUsd: 205.50,
    drawdownFromAthPct: -26.0,
    role: "Nuclear & Datacenter Power IPP Provider",
    marketCapDisplay: "$52.8B",
  },
  {
    ticker: "GEV",
    name: "GE Vernova",
    priceUsd: 921.20,
    change24hPct: -0.6,
    category: "Power & Infrastructure",
    athUsd: 1195.94,
    drawdownFromAthPct: -23.0,
    role: "Electrical Grid Transformers & Gas Turbines",
    marketCapDisplay: "$252B",
  },
  {
    ticker: "DELL",
    name: "Dell Technologies",
    priceUsd: 451.71,
    change24hPct: -4.6,
    category: "Power & Infrastructure",
    athUsd: 595.51,
    drawdownFromAthPct: -24.1,
    role: "PowerEdge AI Server Racks & Liquid Cooling",
    marketCapDisplay: "$322B",
  },
  {
    ticker: "SMCI",
    name: "Super Micro Computer",
    priceUsd: 31.63,
    change24hPct: -9.9,
    category: "Power & Infrastructure",
    athUsd: 56.60,
    drawdownFromAthPct: -44.1,
    role: "GPU Server Integrator (Polymarket Trigger Risk)",
    marketCapDisplay: "$20.8B", // live-stocks.json (19 Oct 2026): 656,965,384 sh (FY2026 10-K cover 31 Jul 2026) × $31.63
  },
  {
    ticker: "NBIS",
    name: "Nebius Group",
    priceUsd: 165.47,
    change24hPct: -12.2,
    category: "Power & Infrastructure",
    athUsd: 299.86,
    drawdownFromAthPct: -44.8,
    role: "AI Neocloud & $17.4B Microsoft Compute Partner",
    marketCapDisplay: "$45.0B", // live-stocks.json (19 Oct 2026): 271,855,218 sh (Q2 2026 release) × $165.47
  },
  {
    ticker: "CRWD",
    name: "CrowdStrike Holdings",
    priceUsd: 227.39,
    change24hPct: -7.0,
    category: "Frontier Lab Partner",
    athUsd: 286.99,
    drawdownFromAthPct: -20.8,
    role: "Enterprise AI Cybersecurity & Charlotte AI",
    marketCapDisplay: "$55.4B",
  },
  {
    ticker: "ANET",
    name: "Arista Networks",
    priceUsd: 176.98,
    change24hPct: -4.6,
    category: "Power & Infrastructure",
    athUsd: 217.41,
    drawdownFromAthPct: -18.6,
    role: "AI Cluster 800G/1.6T Ethernet Switching",
    marketCapDisplay: "$55.6B",
  },
  {
    ticker: "SNPS",
    name: "Synopsys Inc.",
    priceUsd: 454.63,
    change24hPct: -2.9,
    category: "Semiconductor",
    athUsd: 539.48,
    drawdownFromAthPct: -15.7,
    role: "EDA Silicon Design IP & AI Chip Verification",
    marketCapDisplay: "$69.8B",
  },
];

export interface MacroIndicator {
  symbol: string;
  name: string;
  valueDisplay: string;
  changeDisplay: string;
  changePct: number;
  isRiskPositive: boolean; // true if higher = more stress
  category: "Treasury & Rates" | "Inflation & Fed" | "Credit & Debt" | "Commodities & Compute";
  description: string;
}

export const STATIC_MACRO_INDICATORS: MacroIndicator[] = [
  {
    symbol: "US10Y",
    name: "10-Year Treasury Yield",
    valueDisplay: "5.10%",
    changeDisplay: "+0.2 bps", // live-stocks.json (19 Oct 2026)
    changePct: 0.0,
    isRiskPositive: true,
    category: "Treasury & Rates",
    description: "Benchmark risk-free rate pricing long-duration tech discount curves",
  },
  {
    symbol: "US02Y",
    name: "2-Year Treasury Yield",
    valueDisplay: "4.75%",
    changeDisplay: "+0.0 bps",
    changePct: 0.0,
    isRiskPositive: true,
    category: "Treasury & Rates",
    description: "Short-end rate pricing near-term Federal Reserve policy stance",
  },
  {
    symbol: "CPI",
    name: "Headline CPI Inflation",
    // FRED CPIAUCSL, Sep 2026 y/y: 336.298 vs Sep 2025 324.245 = +3.72% (19 Oct 2026).
    // The old 2.9% anchor was stale.
    valueDisplay: "3.72% YoY",
    // 2026-10-19 (round-2 consolidation): the old changeDisplay "+0.8%" / changePct 28.3 was a
    // base-effect artifact of the previous published display anchor (2.9% YoY) and read as
    // "CPI up 28.3%". The prior-year YoY needed for a real period change is NOT verified, so no
    // percentage is published: the move is stated as the gap to the prior anchor and changePct
    // is 0. Mirrors src/data/live-stocks.json and scripts/update-data.mjs.
    changeDisplay: "+0.8pp vs 2.9% anchor",
    changePct: 0,
    isRiskPositive: true,
    category: "Inflation & Fed",
    description: "Consumer price index measuring inflation stickiness vs 2.0% Fed target",
  },
  {
    symbol: "FEDFUNDS",
    name: "Fed Funds Rate",
    // FRED FEDFUNDS, Sep 2026 monthly observation = 3.75% (2026 cut cycle). The old
    // 4.75% "+25bp hike" literal was stale.
    valueDisplay: "3.75%",
    changeDisplay: "-100bp cut cycle",
    changePct: 0.0,
    isRiskPositive: true,
    category: "Inflation & Fed",
    description: "Overnight policy target; markets pricing higher-for-longer regime",
  },
  {
    symbol: "AI-DEBT",
    name: "Annual AI Debt Issuance",
    valueDisplay: "$85.0B/yr",
    // 2026-10-19 (round-2 consolidation): the old "+215% YoY" / changePct 215.0 had NO source —
    // no verified 2025 AI debt issuance pace exists in the tracked set, so both the implied 2025
    // base and the "+$58B" it would imply are unsourced derivations. The derived percentage is
    // blanked and the badge says plainly that no YoY source exists.
    changeDisplay: "no YoY source",
    changePct: 0,
    isRiskPositive: true,
    category: "Credit & Debt",
    description: "Annualized pace of corporate AI bonds, converts & private GPU credit lines",
  },
  {
    symbol: "HY-OAS",
    name: "US High Yield Spread",
    // FRED BAMLH0A0HYM2 = 323bp (15 Oct 2026) — the canonical reading. live-stocks.json
    // may carry a later intraday print (329bp); do not publish anything but the
    // dated FRED value here.
    valueDisplay: "323 bps",
    changeDisplay: "+6 bps",
    changePct: 0.4,
    isRiskPositive: true,
    category: "Credit & Debt",
    description: "ICE BofA US High Yield option-adjusted spread measuring junk credit stress",
  },
  {
    symbol: "BAA-SPREAD",
    name: "Moody's Baa Corporate Spread",
    valueDisplay: "148 bps", // FRED BAA10YM, Sep 2026 observation (live-stocks.json, 19 Oct 2026)
    changeDisplay: "+6 bps",
    changePct: 3.4,
    isRiskPositive: true,
    category: "Credit & Debt",
    description: "Moody's Baa corporate bond spread over Treasuries measuring investment-grade credit risk",
  },
  {
    symbol: "GPU-RENT",
    name: "H100 GPU Spot Rental Rate",
    valueDisplay: "$2.15/GPU-h",
    changeDisplay: "-8.5% MoM",
    changePct: -8.5,
    isRiskPositive: false,
    category: "Commodities & Compute",
    description: "H100 SXM5 80GB hourly cloud spot rental rate tracking AI compute supply-demand dynamics",
  },
  {
    symbol: "COPPER-GOLD",
    name: "Copper / Gold Ratio",
    valueDisplay: "0.198",
    changeDisplay: "-2.1%",
    changePct: -2.1,
    isRiskPositive: false,
    category: "Commodities & Compute",
    description: "Doctor Copper to Gold ratio acting as macro industrial demand and economic growth proxy",
  },
  {
    symbol: "VIX",
    name: "CBOE Volatility Index",
    valueDisplay: "18.31", // live-stocks.json (19 Oct 2026)
    changeDisplay: "-8.4%",
    changePct: -8.4,
    isRiskPositive: true,
    category: "Credit & Debt",
    description: "Equity market implied volatility and systemic tail-risk sentiment",
  },
  {
    symbol: "HYG",
    name: "High Yield Corporate Bond ETF",
    // Not carried in live-stocks.json (19 Oct 2026) — retained from the Oct 2026
    // snapshot so the fallback list keeps its shape.
    valueDisplay: "$76.86",
    changeDisplay: "-0.48%",
    changePct: -0.48,
    isRiskPositive: false,
    category: "Credit & Debt",
    description: "iShares iBoxx $ High Yield Corporate Bond ETF pricing corporate junk bond liquidity",
  },
];

export const LIVE_STOCKS: StockQuote[] = (liveStocksData?.stocks as unknown as StockQuote[]) || STATIC_STOCKS;
export const LIVE_MACRO_INDICATORS: MacroIndicator[] = (liveStocksData?.macro as unknown as MacroIndicator[]) || STATIC_MACRO_INDICATORS;

