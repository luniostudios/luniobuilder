import type { BuilderElement, StyleProperties } from '../../types/builder';
import type { ElementDefaults } from './elementDefaults';

const makeHeading = (): BuilderElement => ({
  id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`,
  type: 'heading',
  name: 'Hero Heading',
  props: { text: 'Welcome to Our Website', level: 1 },
  styles: {
    desktop: { fontSize: '64px', fontWeight: '700', marginBottom: '24px' },
    tablet: { fontSize: '48px', marginBottom: '16px' },
    mobile: { fontSize: '36px', marginBottom: '12px' },
    widescreen: { fontSize: '64px', fontWeight: '700', marginBottom: '24px' },
    laptop: { fontSize: '64px', fontWeight: '700', marginBottom: '24px' },
    mobileLandscape: { fontSize: '48px', marginBottom: '16px' },
  },
  children: [],
  parentId: null,
  locked: false,
  hidden: false,
});

const makeParagraph = (): BuilderElement => ({
  id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`,
  type: 'paragraph',
  name: 'Hero Paragraph',
  props: { text: 'Discover our amazing products and services.' },
  styles: {
    desktop: { fontSize: '20px', lineHeight: '1.6', marginBottom: '24px' },
    tablet: { fontSize: '18px', lineHeight: '1.5', marginBottom: '16px' },
    mobile: { fontSize: '16px', lineHeight: '1.4', marginBottom: '12px' },
    widescreen: { fontSize: '20px', lineHeight: '1.6', marginBottom: '24px' },
    laptop: { fontSize: '20px', lineHeight: '1.6', marginBottom: '24px' },
    mobileLandscape: { fontSize: '18px', lineHeight: '1.5', marginBottom: '16px' },
  },
  children: [],
  parentId: null,
  locked: false,
  hidden: false,
});

export const getHeroElementDefaults = (): ElementDefaults => ({
  name: 'Hero',
  props: {},
  styles: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'screen',
    minHeight: '600px',
    paddingRight: '100px',
    paddingLeft: '40px',
    paddingTop: '80px',
    paddingBottom: '80px',
    backgroundColor: '#f8fafc',
    textAlign: 'center',
  } satisfies StyleProperties,
  children: [makeHeading(), makeParagraph()],
});
