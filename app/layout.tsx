import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd } from "./components/seo/JsonLd";
import {
  DEFAULT_KEYWORDS,
  SITE_DESCRIPTION,
  SITE_NAME,
  getMetadataBase,
  getSiteUrl,
} from "./lib/site-config";

const geistSans = Roboto({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Roboto({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111114" },
  ],
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: `${SITE_NAME} — Drag-and-Drop No-Code Website Builder`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: "LUNIO Studios", url: siteUrl }],
  creator: "LUNIO Studios",
  publisher: "LUNIO Studios",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Drag-and-Drop No-Code Website Builder`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/socials/og.png",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Drag-and-Drop No-Code Website Builder`,
    description: SITE_DESCRIPTION,
    images: {
      url: "/socials/og.png",
      alt: SITE_NAME,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

const organizationSchema = {
  "@context": "https://www.luniobuilder.com/",
  "@type": "Organization",
  name: SITE_NAME,
  url: siteUrl,
  description: SITE_DESCRIPTION,
  logo: `${siteUrl}/socials/og.png`,
};

const webSiteSchema = {
  "@context": "https://www.luniobuilder.com/",
  "@type": "WebSite",
  name: SITE_NAME,
  url: siteUrl,
  description: SITE_DESCRIPTION,
  publisher: { "@type": "Organization", name: "LUNIO Studios", url: siteUrl },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd schema={organizationSchema} />
        <JsonLd schema={webSiteSchema} />
        <Analytics />
        {children}
        {/*Start of Tawk.to Script*/}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
              (function(){
                var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
                s1.async = true;
                s1.src = 'https://embed.tawk.to/69f383549c20d41c33c4080f/1jnfji0t8';
                s1.charset = 'UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
              })();
            `,
          }}
        />
        {/*End of Tawk.to Script*/}
      </body>
    </html>
  );
}
