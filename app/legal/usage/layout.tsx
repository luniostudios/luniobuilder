import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Usage Policy",
  description: "Usage policy for LUNIO Builder — acceptable use and platform guidelines.",
  alternates: { canonical: "/legal/usage" },
};

export default function UsageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
