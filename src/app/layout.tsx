import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

// Matches `--terminal` in globals.css so the mobile browser chrome is the
// same near-black the hero and footer paint.
export const viewport: Viewport = {
  themeColor: '#09090b',
  colorScheme: 'light',
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aicapitaltracker.com';

export const metadata: Metadata = {
  title: {
    default: 'AI Capital Tracker — Financial Intelligence & Capital Flow Database',
    template: '%s | AI Capital Tracker',
  },
  description:
    'Independent, source-backed research database tracking investments, debt facilities, GPU collateral, cloud commitments, and power agreements behind AI infrastructure.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://aicapitaltracker.com'),
  creator: 'AI Capital Tracker Research Desk',
  publisher: 'AI Capital Tracker',
  icons: { icon: '/icon.svg' },
  keywords: [
    'AI infrastructure financing',
    'GPU debt facilities',
    'AI data center capital',
    'AI power purchase agreements',
    'NVIDIA GPU collateral',
    'CoreWeave financing',
    'AI cloud commitments',
  ],
  authors: [{ name: 'AI Capital Tracker Research Desk' }],
  openGraph: {
    title: 'AI Capital Tracker — Financial Intelligence & Capital Flow Database',
    description:
      'Transparent, source-backed tracking of capital flows into AI companies, data centers, and power infrastructure.',
    url: siteUrl,
    siteName: 'AI Capital Tracker',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Capital Tracker',
    description: 'Transparent, source-backed database of AI infrastructure financing.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrlValue = process.env.NEXT_PUBLIC_SITE_URL || 'https://aicapitaltracker.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AI Capital Tracker',
    url: siteUrlValue,
    description: 'Source-backed financial research database tracking capital flows into AI companies and infrastructure.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrlValue}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AI Capital Tracker',
    url: siteUrlValue,
    description:
      'Independent, source-backed research database tracking investments, debt facilities, GPU collateral, cloud commitments, and power agreements behind AI infrastructure.',
  };

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:inline-flex focus:items-center focus:gap-2 focus:rounded-panel focus:border focus:border-emerald-500/40 focus:bg-zinc-950 focus:px-4 focus:py-2.5 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.08em] focus:text-emerald-300 focus:shadow-glow"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
