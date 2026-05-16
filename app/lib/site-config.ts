/**
 * Canonical base URL for metadata, OG images, and sitemap.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://yourdomain.com).
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  return "http://localhost:3000";
}

export function getMetadataBase(): URL {
  return new URL(`${getSiteUrl()}/`);
}

export const SITE_NAME = "LUNIO Builder";

export const SITE_DESCRIPTION =
  "LUNIO Builder is a no-code website builder that allows you to create stunning websites with ease. With its intuitive drag-and-drop interface, you can design and publish your website in minutes, without any coding knowledge.";

export const SITE_TAGLINE =
  "LUNIO Builder — Drag-and-Drop No-Code Website Builder to Design and Publish Fast.";

export const DEFAULT_KEYWORDS = [
  "LUNIO Builder",
  "no-code website builder",
  "drag-and-drop website builder",
  "website builder",
  "create websites without coding",
  "visual editor",
];
