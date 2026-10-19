import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MarketTickerTape } from "@/components/MarketTickerTape";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import rawDeals from "@/data/deals.json";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aicapitaltracker.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e11" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "AI Capital Tracker — Will the AI Bubble Burst in the Next 12 Months?",
    template: "%s | AI Capital Tracker",
  },
  description:
    "The chance the AI bubble bursts within 12 months, read from filings and daily credit spreads — plus the full ledger of sourced AI deals. No spin.",
  keywords: [
    "AI bubble",
    "AI bubble burst probability",
    "AI capital tracker",
    "AI debt ledger",
    "Oracle 5Y CDS",
    "Anthropic debt Broadcom",
    "OpenAI valuation multiple",
    "hyperscaler GPU capex",
    "CoreWeave convertible notes",
    "AI credit stress",
    "Polymarket AI bubble odds",
    "circular financing AI",
    "US10Y Treasury tech multiples",
    "GPU depreciation drag",
  ],
  authors: [{ name: "AI Capital Tracker Research Group" }],
  creator: "AI Capital Tracker",
  publisher: "AI Capital Tracker",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AI Capital Tracker — Will the AI Bubble Burst in the Next 12 Months?",
    description:
      "A receipt-backed model that converts SEC filings, credit default swap spreads, lab revenue and token economics into a 12-month bubble burst probability.",
    url: baseUrl,
    siteName: "AI Capital Tracker",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Capital Tracker — Will the AI Bubble Burst in the Next 12 Months?",
    description:
      "An empirical model that turns SEC filings and debt commitments into a 12-month AI bubble burst probability.",
    creator: "@aicapitaltracker",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/**
 * Applied before first paint so a returning reader never sees a white flash
 * on the dark terminal chrome. Mirrors ThemeProvider's storage key.
 */
const themeBootScript = `(function(){try{var t=localStorage.getItem("theme");document.documentElement.classList.toggle("dark",t!=="light");}catch(e){document.documentElement.classList.add("dark");}})();`;

/**
 * Motion boot (2026-10-19, design pass).
 *
 * `js-reveal` is the single switch that lets the stylesheet hold a reveal in
 * its "not yet arrived" state. It is added ONLY when JavaScript is running
 * and only when the browser can observe intersections — a crawler, a no-JS
 * reader and a print export therefore see the final, static page.
 *
 * The failsafe: if hydration never happens (a crashed bundle, a blocked
 * script), the class is dropped after 4 seconds so the page can never stay
 * blank. The first <Reveal> to mount clears the timer immediately.
 */
const revealBootScript = `(function(){try{if(typeof window.IntersectionObserver!=="function")return;var d=document.documentElement;d.classList.add("js-reveal");window.__aictRevealFailsafe=window.setTimeout(function(){d.classList.remove("js-reveal");},4000);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const model = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  const dealCount = rawDeals.length;
  const totalDisclosedUsd = rawDeals.reduce((sum, deal) => sum + (deal.amount_usd || 0), 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${baseUrl}/#webapp`,
        name: "AI Capital Tracker",
        url: baseUrl,
        applicationCategory: "FinanceApplication",
        operatingSystem: "All",
        description:
          "An open, receipt-backed model converting verified SEC filings, credit default swap spreads, lab revenue run-rates and GPU debt facilities into a 12-month bubble burst probability.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        publisher: {
          "@type": "Organization",
          name: "AI Capital Tracker Research Group",
          url: baseUrl,
        },
      },
      {
        "@type": "Dataset",
        "@id": `${baseUrl}/#dataset`,
        name: "AI Capital Allocation & Debt Ledger",
        description: `Database of ${dealCount} verified AI infrastructure financings totalling $${(totalDisclosedUsd / 1e12).toFixed(2)}T, including convertible debt, cloud leases, GPU asset-backed credit facilities and equity rounds.`,
        url: `${baseUrl}/ledger`,
        creator: {
          "@type": "Organization",
          name: "AI Capital Tracker Research Group",
        },
        license: "https://creativecommons.org/licenses/by/4.0/",
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: revealBootScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="min-h-dvh bg-canvas font-sans text-ink antialiased">
        <ThemeProvider>
          <div className="flex min-h-dvh flex-col">
            <a href="#main" className="skip-link">
              Skip to content
            </a>
            <MarketTickerTape />
            <Navbar burstProbability={model.burstProbability} band={model.band} />
            <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
              {children}
            </main>
            <Footer
              burstProbability={model.burstProbability}
              dealCount={dealCount}
              totalDisclosedTrillions={(totalDisclosedUsd / 1e12).toFixed(2)}
            />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}