import type { Metadata, Viewport } from "next";
import { Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MotionProvider } from "@/components/MotionProvider";
import { MarketTickerTape } from "@/components/MarketTickerTape";
import { MobileActionBar } from "@/components/MobileActionBar";
import { ScrollProgress } from "@/components/ScrollProgress";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import rawDeals from "@/data/deals.json";

/**
 * Type system.
 *
 * 1. Interface & Data: APPLE'S OWN FACE. `-apple-system` resolves to SF Pro
 *    on macOS, iOS and iPadOS - the same face as the platform the reader is
 *    on, with the optical sizing, tracking tables and legibility tuning a
 *    webfont cannot buy. SF Pro cannot be redistributed as a webfont (Apple
 *    licenses it for Apple platforms), so the honest way to ship it is to ASK
 *    for it, and that is what the stack in tailwind.config.ts does.
 *    Everywhere else the platform grotesque answers: Segoe UI on Windows,
 *    Roboto on Android. No webfont is downloaded for the interface - the
 *    site's fastest font is the one already on the device.
 *
 * 2. Long-Form Prose: Source Serif 4, self-hosted through next/font.
 *    The "broadsheet" half of the publication identity: used strictly for
 *    reading arguments (guides body, methodology prose, glossary explanations,
 *    disclosure panels). Never touches tables, figures, chips or nav.
 *
 * 3. Figures & Numerals: JetBrains Mono, self-hosted through next/font.
 *    A number is a different object from a sentence and it wants tabular
 *    monospaced digits that never jitter. Labels are sentences, so they are
 *    set in the site's face, not in this one.
 */
const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
  adjustFontFallback: true,
  fallback: [
    "Georgia",
    "Cambria",
    "Times New Roman",
    "Times",
    "serif",
  ],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  adjustFontFallback: true,
});

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
    default: "Will the AI Bubble Burst? — 12-Month Outlook & Spending Tracker | AI Capital Tracker",
    template: "%s | AI Capital Tracker",
  },
  description:
    "An independent research desk tracking $2.87T in AI spending and $214.9B in debt to calculate one number: the chance the AI bubble bursts within 12 months. No hype, just verified filings.",
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
    title: "Will the AI Bubble Burst? — 12-Month Outlook & Spending Tracker | AI Capital Tracker",
    description:
      "A receipt-backed model that tracks $2.87T of AI spending, $214.9B of debt, and turns SEC filings and credit spreads into a 12-month bubble burst probability.",
    url: baseUrl,
    siteName: "AI Capital Tracker",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Will the AI Bubble Burst? — 12-Month Outlook & Spending Tracker | AI Capital Tracker",
    description:
      "An empirical model that turns corporate filings, Big Tech capex, and debt commitments into a 12-month AI bubble burst probability.",
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

/**
 * Motion boot (2026-10-20).
 *
 * The OS preference is the default (the stylesheet's prefers-reduced-motion
 * block handles it). This only applies an EXPLICIT reader choice, before first
 * paint, so a reader who forced motion on never sees a frozen tape first.
 */
const motionBootScript = `(function(){try{var m=localStorage.getItem("aict-motion");if(m==="on"||m==="off"){document.documentElement.setAttribute("data-motion",m);}}catch(e){}})();`;
const newsDensityBootScript = `(function(){try{var d=localStorage.getItem("aict-news-density");if(d==="compact"||d==="comfortable"){document.documentElement.setAttribute("data-news-density",d);}}catch(e){}})();`;

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sourceSerif4.variable} ${jetbrainsMono.variable}`}
      data-band={model.band}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: revealBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: motionBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: newsDensityBootScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="min-h-dvh bg-canvas font-sans text-ink antialiased">
        <ScrollProgress />
        <MotionProvider>
          <ThemeProvider>
            <div className="flex min-h-dvh flex-col">
            <a href="#main" className="skip-link">
              Skip to content
            </a>
            <MarketTickerTape />
            <Navbar
              burstProbability={model.burstProbability}
              band={model.band}
            />
            <main
              id="main"
              className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 pb-24 sm:px-6 sm:py-10 sm:pb-10"
            >
              {children}
            </main>
            <Footer
              burstProbability={model.burstProbability}
              dealCount={dealCount}
              totalDisclosedTrillions={(totalDisclosedUsd / 1e12).toFixed(2)}
            />
            {/* Phones only: the thumb bar for search, verdict, ledger and markets */}
            <MobileActionBar />
          </div>
          </ThemeProvider>
        </MotionProvider>
      </body>
    </html>
  );
}