const RESERVED_SITE_SLUGS = new Set([
  'www',
  'app',
  'api',
  'dashboard',
  'editor',
  'auth',
  'docs',
  'documentation',
  'pricing',
  'legal',
]);

export const normalizeSiteSlug = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const slug = value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug || slug.length > 63 || RESERVED_SITE_SLUGS.has(slug)) return null;

  return slug;
};

export const getRootDomain = () => process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'luniobuilder.com';

export const getSiteSlugFromHost = (host: string | null): string | null => {
  if (!host) return null;

  const hostname = host.split(':')[0].toLowerCase().replace(/\.$/, '');
  const rootDomain = getRootDomain().toLowerCase().replace(/^https?:\/\//, '').split(':')[0].replace(/\.$/, '');
  if (!hostname.endsWith(`.${rootDomain}`)) return null;

  const subdomain = hostname.slice(0, -(rootDomain.length + 1));
  if (!subdomain || subdomain.includes('.')) return null;

  return normalizeSiteSlug(subdomain);
};
