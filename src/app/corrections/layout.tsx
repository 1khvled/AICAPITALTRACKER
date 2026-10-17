import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Corrections & Dispute Resolution Policy',
  description:
    'Challenge a record under the 48-hour statutory audit protocol. AICapitalTracker reviews every factual dispute against primary sources.',
};

export default function CorrectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
