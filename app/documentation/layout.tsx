import type { Metadata } from "next";
import {
  DEFAULT_KEYWORDS,
  SITE_NAME,
} from "../lib/site-config";

export const metadata: Metadata = {
  title: "Documentation",
  description: `Official documentation for ${SITE_NAME}. Learn layout, styling, exporting, publishing, and more.`,
  keywords: [...DEFAULT_KEYWORDS, "documentation", "help", "guide"],
  alternates: { canonical: "/documentation" },
  openGraph: {
    title: `Documentation — ${SITE_NAME}`,
    description: `Learn how to use ${SITE_NAME}.`,
    type: "article",
    url: "/documentation",
  },
};

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
