import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: {
    default: 'AI Capital Tracker — Financial Intelligence & Capital Flow Database',
    template: '%s | AI Capital Tracker',
  },
  description:
    'Independent, source-backed research database tracking investments, debt facilities, GPU collateral, cloud commitments, and power agreements behind AI infrastructure.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://aicapitaltracker.com'),
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
    url: 'https://aicapitaltracker.com',
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AI Capital Tracker',
    url: 'https://aicapitaltracker.com',
    description: 'Source-backed financial research database tracking capital flows into AI companies and infrastructure.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://aicapitaltracker.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
