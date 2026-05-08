import type { Metadata } from "next";
import { SITE_NAME } from "../../lib/site-config";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${SITE_NAME} to create and manage projects.`,
  alternates: { canonical: "/auth/signin" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
