import type { MetadataRoute } from "next";
import { getSiteUrl } from "./lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/editor", "/api/"],
    },
    sitemap: `${site}/sitemap.xml`,
    host: site.replace(/^https?:\/\//, ""),
  };
}
