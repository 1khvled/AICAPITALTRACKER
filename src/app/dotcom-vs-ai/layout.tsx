import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The 2000 dot-com bubble vs the 2026 AI boom compared",
  description:
    "Comparing the 2000 telecom crash and 2026 AI build-out side by side across real cash flows, debt, and hardware use.",
  alternates: {
    canonical: "/dotcom-vs-ai",
  },
  openGraph: {
    title: "The 2000 dot-com bubble vs the 2026 AI boom compared",
    description:
      "Comparing the 2000 telecom crash and 2026 AI build-out side by side across real cash flows, debt, and hardware use.",
    url: "/dotcom-vs-ai",
    type: "website",
  },
};

export default function DotComVsAiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}