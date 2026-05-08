import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editor",
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
