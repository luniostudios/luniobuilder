export interface SiteMetadata {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImageAlt: string;
  openGraphLocale: string;
  twitterCard: 'summary' | 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterSite: string;
  twitterCreator: string;
  themeColor: string;
}

export const createDefaultSiteMetadata = (title = ''): SiteMetadata => ({
  title,
  description: '',
  keywords: '',
  canonicalUrl: '',
  robotsIndex: true,
  robotsFollow: true,
  openGraphTitle: '',
  openGraphDescription: '',
  openGraphImageAlt: '',
  openGraphLocale: 'en_US',
  twitterCard: 'summary_large_image',
  twitterTitle: '',
  twitterDescription: '',
  twitterSite: '',
  twitterCreator: '',
  themeColor: '',
});

export const normalizeSiteMetadata = (value: unknown, fallbackTitle = ''): SiteMetadata => {
  const source = value && typeof value === 'object' ? value as Partial<SiteMetadata> : {};
  const defaults = createDefaultSiteMetadata(fallbackTitle);
  const stringValue = (key: keyof SiteMetadata) => typeof source[key] === 'string' ? source[key] as string : defaults[key] as string;

  return {
    title: stringValue('title') || fallbackTitle,
    description: stringValue('description'),
    keywords: stringValue('keywords'),
    canonicalUrl: stringValue('canonicalUrl'),
    robotsIndex: typeof source.robotsIndex === 'boolean' ? source.robotsIndex : defaults.robotsIndex,
    robotsFollow: typeof source.robotsFollow === 'boolean' ? source.robotsFollow : defaults.robotsFollow,
    openGraphTitle: stringValue('openGraphTitle'),
    openGraphDescription: stringValue('openGraphDescription'),
    openGraphImageAlt: stringValue('openGraphImageAlt'),
    openGraphLocale: stringValue('openGraphLocale'),
    twitterCard: source.twitterCard === 'summary' ? 'summary' : 'summary_large_image',
    twitterTitle: stringValue('twitterTitle'),
    twitterDescription: stringValue('twitterDescription'),
    twitterSite: stringValue('twitterSite'),
    twitterCreator: stringValue('twitterCreator'),
    themeColor: stringValue('themeColor'),
  };
};