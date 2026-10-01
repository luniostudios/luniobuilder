import type { BuilderElement, Page, StyleProperties } from '../types/builder';

export const GOOGLE_FONT_OPTIONS = [
  'Arial',
  'Helvetica',
  'Roboto, sans-serif',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Inter',
  'Oswald',
  'Source Sans',
  'Nunito',
  'Raleway',
  'Work Sans',
  'Ubuntu',
  'Fira Sans',
  'Karla',
  'DM Sans',
  'Hind',
  'Oxygen',
  'Quicksand',
  'Muli',
  'Cabin',
  'Josefin Sans',
  'Space Grotesk',
  'Nunito Sans',
  'Sora',
  'Manrope',
  'Mukta',
  'Bai Jamjuree',
  'Lexend',
  'Cairo',
  'Tajawal',
  'Heebo',
  'Anton',
  'Bebas Neue',
  'Merriweather',
  'Roboto Slab',
  'Noto Serif',
  'Spectral',
  'PT Serif',
  'Domine',
  'Crimson Pro',
  'Cardo',
  'Pacifico',
  'Dancing Script',
  'Great Vibes',
  'Satisfy',
  'Amatic SC',
  'Bangers',
  'Yellowtail',
  'Lobster',
  'Roboto Mono',
  'Fira Code',
  'Source Code Pro',
  'JetBrains Mono',
  'Space Mono',
  'Inconsolata',
  'Courier Prime',
];

const normalizeFontFamily = (fontFamily: string) => String(fontFamily)
  .split(',')[0]
  .trim()
  .replace(/^['"]+|['"]+$/g, '');

export const getGoogleFontStylesheetUrl = (fontFamily: string) => {
  const fontName = normalizeFontFamily(fontFamily);
  const option = GOOGLE_FONT_OPTIONS.find(value => normalizeFontFamily(value).toLowerCase() === fontName.toLowerCase());
  if (!option || fontName === 'Arial' || fontName === 'Helvetica') return null;

  const family = encodeURIComponent(fontName).replace(/%20/g, '+');
  return `https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;600;700;800;900&display=swap`;
};

const loadedGoogleFonts = new Set<string>();

export const loadGoogleFont = (fontFamily: string) => {
  if (typeof document === 'undefined') return;
  const href = getGoogleFontStylesheetUrl(fontFamily);
  if (!href || loadedGoogleFonts.has(href)) return;

  if (!document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
  loadedGoogleFonts.add(href);
};

export const getGoogleFontStylesheetUrls = (pages: Page[]) => {
  const urls = new Set<string>();
  const addFont = (styles?: StyleProperties) => {
    if (!styles?.fontFamily) return;
    const url = getGoogleFontStylesheetUrl(styles.fontFamily);
    if (url) urls.add(url);
  };

  const visit = (element: BuilderElement) => {
    Object.values(element.styles || {}).forEach(addFont);
    Object.values(element.pseudoClassStyles || {}).forEach(responsiveStyles => {
      (Object.values(responsiveStyles || {}) as StyleProperties[]).forEach(addFont);
    });
    element.children.forEach(visit);
  };

  pages.forEach(page => page.elements.forEach(visit));
  return Array.from(urls);
};