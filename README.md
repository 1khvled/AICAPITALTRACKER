# AI Capital Tracker — Macro Risk & Quantitative Stress Terminal

> **Live Market Intelligence Platform** tracking **$2.75T** in disclosed AI compute capital, hyperscaler debt issuances, credit default swaps (CDS), and speculative bubble risk metrics.

[![24h Automated Market Data Sync](https://github.com/1khvled/AICAPITALTRACKER/actions/workflows/update-data.yml/badge.svg)](https://github.com/1khvled/AICAPITALTRACKER/actions/workflows/update-data.yml)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

---

## ⚡ Executive Summary

AI Capital Tracker monitors the real-time financial health, infrastructure commitments, and systemic fragility of the generative artificial intelligence boom. By cross-referencing **158 verified institutional deals** ($2.75T aggregate volume) against real-time credit default swaps (CDS), hyperscaler debt service burdens, GPU inference cost deflation curves, and Polymarket decentralized crowd odds, the platform outputs an empirical **Burst Probability Index**.

---

## 🚀 Key Modules & Architecture

### 1. 🧮 Quantitative Stress Model
* **Calibrated Sigmoid Response**: Translates composite stress points ($S \in [0, 100]$) into a non-linear 12-month burst probability via $\mathcal{P}(\text{burst}) = \frac{1}{1 + e^{-(S - 55)/9}} \times 100\%$.
* **8 Core Risk & Damper Factors**:
  * *Hyperscaler CDS Spread Spikes* (Oracle, Microsoft, Amazon 5Y CDS)
  * *Debt Leverage Ratio in Deal Structure* ($801B debt / 29.1% leverage)
  * *Frontier Lab Price-to-Sales Multiples* (Mistral 139×, xAI 100×, OpenAI 42×)
  * *Infrastructure Capex vs Software Revenue Gap* (-$237B structural deficit)
  * *Polymarket Crowd Consensus Odds* (Live decentralized prediction markets)
  * *Token Unit Inference Cost Deflation* (Stabilizing damper: -200× price drop)
  * *Enterprise API Token Consumption Velocity* (Organic demand offset)
  * *GPU Cluster Resale Depreciation*

### 2. 📊 Institutional Deal Ledger & Visual Treemap
* **158 Verified Deals** amounting to **$2.75T** in disclosed transactions.
* Search by company, preset volume brackets ($50B+, $10B+, Mega-Rounds), category chips (Debt, Equity, Capacity, M&A, Energy), and year toggles.
* Scaled SVG Treemap and Timeline Deployment Matrix with high-contrast institutional typography.

### 3. 📈 Live Market Feeds & Stock Monitors
* **Real-time stock ticker tape & monitor**: NVDA, MSFT, ORCL, GOOGL, AMZN, TSM, AMD, META, AAPL with live prices, intraday deltas, and institutional health ratings.
* **Polymarket Integration**: Deep integration with AI Bubble, ORCL debt, and AI lab IPO prediction markets with live consensus pricing, potential payout/ROI calculator, and referral partner routing (`?r=AIbubble`).
* **Live News Feed**: Zero-latency financial news aggregator parsing macro semiconductor, datacenter power, and credit rating agency actions.

### 4. 🌐 Open REST API (`/api/v1`)
* Zero-authentication, public REST JSON endpoints:
  * `GET /api/v1/model`: Current composite risk score, burst probability, and regime band.
  * `GET /api/v1/factors`: Granular weightings, earned points, and status metrics.
  * `GET /api/v1/deals`: Paginated, filterable access to all 158 verified transactions.
  * `GET /api/v1/news`: Real-time aggregated financial intelligence feed.
* Interactive in-browser API explorer with cURL, JavaScript, and Python code generation at `/api-docs`.

### 5. 🤖 Automated 24h Data Sync Workflow
* Configured GitHub Actions cron workflow (`.github/workflows/update-data.yml`) executing daily at 00:00 UTC.
* Automatically fetches live market signals, validates schema integrity, executes a zero-error Next.js build, and pushes updates directly to the repository.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 14 (App Router)
* **Styling**: Tailwind CSS, PostCSS, Lucide React Icons
* **Typography**: Geist Sans & Geist Mono
* **Language**: TypeScript 5
* **Automation**: Node.js ESM script (`scripts/update-data.mjs`), GitHub Actions

---

## 📦 Getting Started

### Prerequisites
* Node.js 18.17+ or 20+
* npm or pnpm

### Installation

```bash
git clone https://github.com/1khvled/AICAPITALTRACKER.git
cd AICAPITALTRACKER
npm install
```

### Development Server

```bash
npm run dev
# Open http://localhost:3000 in your browser
```

### Production Build

```bash
npm run build
npm run start
```

### Run 24h Market Data Sync Locally

```bash
npm run update-data
```

---

## 📄 License

MIT License. Designed and maintained for quantitative macro research.
