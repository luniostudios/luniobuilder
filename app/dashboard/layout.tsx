import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LUNIO BUilder - Dashboard",
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
