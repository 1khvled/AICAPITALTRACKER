import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MarketTickerTape } from "@/components/MarketTickerTape";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aicapitaltracker.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "AI Capital Tracker — 12-Month Bubble Burst Probability & 159-Deal Ledger",
    template: "%s | AI Capital Tracker",
  },
  description:
    "Empirical 12-month AI bubble burst probability model converting verified SEC filings, reported CDS spreads, private lab revenues, and token economics into quantifiable financial risk.",
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
    title: "AI Capital Tracker — 12-Month Bubble Burst Probability & 159-Deal Ledger",
    description:
      "A receipt-backed empirical model converting verified SEC filings, Oracle CDS spreads, lab revenues, and token economics into an empirical bubble burst probability.",
    url: baseUrl,
    siteName: "AI Capital Tracker",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Capital Tracker — 12-Month Bubble Burst Probability & 159-Deal Ledger",
    description:
      "Empirical 12-month AI bubble burst probability model converting verified SEC filings and debt commitments into quantifiable financial risk.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          "An open, receipt-backed empirical financial model converting verified SEC filings, credit default swap spreads, lab multiples, and GPU debt facilities into a 12-month bubble burst probability.",
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
        name: "AI Capital Allocation & Debt Ledger (159 Deals)",
        description:
          "Comprehensive database of 159 verified AI infrastructure financings totaling $2.81T, including convertible debt, cloud leases, GPU asset-backed credit facilities, and equity rounds.",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@300;400;500;600;700;800&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 antialiased font-sans selection:bg-emerald-500 selection:text-black text-base">
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <MarketTickerTape />
            <Header />
            <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
