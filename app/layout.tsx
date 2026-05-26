import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

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


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111114" },
  ],
};

export const metadata: Metadata = {
  title: "LUNIO Builder - Drag-and-Drop No Code Website Builder",
  description: "LUNIO Builder is a no-code website builder that allows you to create stunning websites with ease. With its intuitive drag-and-drop interface, you can design and publish your website in minutes, without any coding knowledge",
  keywords: [
    "LUNIO Builder",
    "no-code website builder",
    "drag-and-drop website builder",
    "website builder",
    "create websites without coding",
    "visual editor",
  ],
  alternates: {
    canonical: "https://www.luniobuilder.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} bg-[#111114]`}>
      <head>
        <meta property="og:image" content="/socials/og.png" />
        <meta property="og:image:alt" content="LUNIO Builder" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="twitter:image" content="/socials/og.png" />
        <meta property="twitter:image:alt" content="LUNIO Builder" />
        <meta property="twitter:image:type" content="image/png" />
        <meta property="twitter:image:width" content="1200" />
        <meta property="twitter:image:height" content="630" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <Analytics />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
        window.$crisp=[];window.CRISP_WEBSITE_ID="f49a14fc-d01b-432a-a6b5-2b9d5c0ae78f";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`,}}
        />
      </body>
    </html>
  );
}
