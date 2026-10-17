import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact the Research Desk',
  description:
    'Contact AI Capital Tracker analysts: submit statutory filings, report capital amendments, or transmit market intelligence securely.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
