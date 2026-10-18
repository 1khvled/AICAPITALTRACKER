import liveStocksData from "./live-stocks.json";

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
    athUsd: 217.20,
    drawdownFromAthPct: -1.4,
    role: "AI Silicon & Ecosystem Anchor",
    marketCapDisplay: "$5.27T",
  },
  {
    ticker: "ORCL",
    name: "Oracle Corporation",
    priceUsd: 128.23,
    change24hPct: -4.6,
    category: "Hyperscaler",
    athUsd: 178.50,
    drawdownFromAthPct: -28.2,
    role: "5Y CDS Credit Proxy & GPU Cluster Debt Anchor",
    marketCapDisplay: "$353B",
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    priceUsd: 529.05,
    change24hPct: -1.9,
    category: "Hyperscaler",
    athUsd: 555.00,
    drawdownFromAthPct: -4.7,
    role: "OpenAI Cloud Anchor & Nuclear Power Off-taker",
    marketCapDisplay: "$3.93T",
  },
  {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    priceUsd: 340.59,
    change24hPct: -2.5,
    category: "Hyperscaler",
    athUsd: 355.00,
    drawdownFromAthPct: -4.1,
    role: "Custom TPU V5e/V6 & Anthropic Backer",
    marketCapDisplay: "$4.19T",
  },
  {
    ticker: "AMZN",
    name: "Amazon.com Inc.",
    priceUsd: 250.00,
    change24hPct: -1.9,
    category: "Hyperscaler",
    athUsd: 260.00,
    drawdownFromAthPct: -3.8,
    role: "AWS Bedrock & Anthropic $8B Strategic Partner",
    marketCapDisplay: "$2.61T",
  },
  {
    ticker: "META",
    name: "Meta Platforms Inc.",
    priceUsd: 709.32,
    change24hPct: -3.7,
    category: "Hyperscaler",
    athUsd: 740.00,
    drawdownFromAthPct: -4.1,
    role: "Llama Open Weights & 600k H100 Cluster Buyer",
    marketCapDisplay: "$1.79T",
  },
  {
    ticker: "TSM",
    name: "Taiwan Semiconductor (TSMC)",
    priceUsd: 412.61,
    change24hPct: -2.3,
    category: "Semiconductor",
    athUsd: 430.00,
    drawdownFromAthPct: -4.0,
    role: "CoWoS Packaging & 3nm/2nm Monopolist",
    marketCapDisplay: "$1.07T",
  },
  {
    ticker: "AVGO",
    name: "Broadcom Inc.",
    priceUsd: 328.75,
    change24hPct: -4.5,
    category: "Semiconductor",
    athUsd: 360.00,
    drawdownFromAthPct: -8.7,
    role: "Custom AI XPU ASIC & PCIe Switching",
    marketCapDisplay: "$1.54T",
  },
  {
    ticker: "SMCI",
    name: "Super Micro Computer",
    priceUsd: 31.63,
    change24hPct: -9.9,
    category: "Power & Infrastructure",
    athUsd: 122.90,
    drawdownFromAthPct: -74.3,
    role: "GPU Server Integrator (Polymarket Trigger Risk)",
    marketCapDisplay: "$18.5B",
  },
  {
    ticker: "CEG",
    name: "Constellation Energy",
    priceUsd: 271.37,
    change24hPct: -1.3,
    category: "Power & Infrastructure",
    athUsd: 290.00,
    drawdownFromAthPct: -6.4,
    role: "Three Mile Island Nuclear Restart for Microsoft",
    marketCapDisplay: "$85.2B",
  },
  {
    ticker: "PLTR",
    name: "Palantir Technologies",
    priceUsd: 186.03,
    change24hPct: -7.2,
    category: "Frontier Lab Partner",
    athUsd: 205.00,
    drawdownFromAthPct: -9.3,
    role: "Enterprise AIP & Defense AI Contract Bellwether",
    marketCapDisplay: "$415B",
  },
];

export interface MacroIndicator {
  symbol: string;
  name: string;
  valueDisplay: string;
  changeDisplay: string;
  changePct: number;
  isRiskPositive: boolean; // true if higher = more stress
  category: "Treasury & Rates" | "Inflation & Fed" | "Credit & Debt";
  description: string;
}

export const STATIC_MACRO_INDICATORS: MacroIndicator[] = [
  {
    symbol: "US10Y",
    name: "10-Year Treasury Yield",
    valueDisplay: "4.42%",
    changeDisplay: "+8.4 bps",
    changePct: 1.94,
    isRiskPositive: true,
    category: "Treasury & Rates",
    description: "Benchmark risk-free rate pricing long-duration tech discount curves",
  },
  {
    symbol: "US02Y",
    name: "2-Year Treasury Yield",
    valueDisplay: "4.28%",
    changeDisplay: "+5.1 bps",
    changePct: 1.21,
    isRiskPositive: true,
    category: "Treasury & Rates",
    description: "Short-end rate pricing near-term Federal Reserve policy stance",
  },
  {
    symbol: "CPI",
    name: "Headline CPI Inflation",
    valueDisplay: "2.9% YoY",
    changeDisplay: "+0.2%",
    changePct: 7.4,
    isRiskPositive: true,
    category: "Inflation & Fed",
    description: "Consumer price index measuring inflation stickiness vs 2.0% Fed target",
  },
  {
    symbol: "FEDFUNDS",
    name: "Fed Funds Rate",
    valueDisplay: "4.75%",
    changeDisplay: "+25bp hike",
    changePct: 0.0,
    isRiskPositive: true,
    category: "Inflation & Fed",
    description: "Overnight policy target; markets pricing higher-for-longer regime",
  },
  {
    symbol: "AI-DEBT",
    name: "Annual AI Debt Issuance",
    valueDisplay: "$85.0B/yr",
    changeDisplay: "+215% YoY",
    changePct: 215.0,
    isRiskPositive: true,
    category: "Credit & Debt",
    description: "Annualized pace of corporate AI bonds, converts & private GPU credit lines",
  },
  {
    symbol: "HY-OAS",
    name: "US High Yield Spread",
    valueDisplay: "328 bps",
    changeDisplay: "+24 bps",
    changePct: 7.89,
    isRiskPositive: true,
    category: "Credit & Debt",
    description: "ICE BofA US High Yield option-adjusted spread measuring junk credit stress",
  },
];

export const LIVE_STOCKS: StockQuote[] = (liveStocksData?.stocks as unknown as StockQuote[]) || STATIC_STOCKS;
export const LIVE_MACRO_INDICATORS: MacroIndicator[] = (liveStocksData?.macro as unknown as MacroIndicator[]) || STATIC_MACRO_INDICATORS;

