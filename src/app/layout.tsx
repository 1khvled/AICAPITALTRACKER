import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MarketTickerTape } from "@/components/MarketTickerTape";

export const metadata: Metadata = {
  title: "AI Capital Tracker — 12-Month Bubble Burst Probability & 159-Deal Ledger",
  description: "A transparent, receipt-backed model converting verified SEC filings, reported CDS spreads, private lab revenues, and token economics into an empirical bubble probability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@300;400;500;600;700;800&display=swap"
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
