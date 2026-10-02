import type { BuilderElement, StyleProperties } from '../../types/builder';
import type { ElementDefaults } from './elementDefaults';

const makeNavHeading = (): BuilderElement => ({
  id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`,
  type: 'heading',
  name: 'Nav Logo',
  props: { text: 'MyLogo', level: 1 },
  styles: {
    desktop: { fontSize: '24px', fontWeight: '700', margin: '0' },
    tablet: {},
    mobile: {},
    widescreen: { fontSize: '24px', fontWeight: '700', margin: '0' },
    laptop: { fontSize: '24px', fontWeight: '700', margin: '0' },
    mobileLandscape: {},
  },
  children: [],
  parentId: null,
  locked: false,
  hidden: false,
});

const makeNavIcon = (): BuilderElement => ({
  id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`,
  type: 'icon',
  name: 'Hamburger',
  props: { iconName: 'Menu' },
  styles: {
    desktop: { display: 'none', cursor: 'pointer', width: '40px', height: '40px', alignItems: 'center', justifyContent: 'center', color: '#111827' },
    tablet: { display: 'flex' },
    mobile: { display: 'flex' },
    widescreen: { display: 'none' },
    laptop: { display: 'none' },
    mobileLandscape: { display: 'flex' },
  },
  children: [],
  parentId: null,
  locked: false,
  hidden: false,
});

const makeNavLink = (text: string): BuilderElement => ({
  id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`,
  type: 'link',
  name: 'Nav Item',
  props: { text, href: '#' },
  styles: { desktop: { margin: '0' }, tablet: {}, mobile: {}, widescreen: { margin: '0' }, laptop: { margin: '0' }, mobileLandscape: { margin: '0' } },
  children: [],
  parentId: null,
  locked: false,
  hidden: false,
});

const makeNavMenu = (): BuilderElement => ({
  id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`,
  type: 'list',
  name: 'Nav Links',
  props: { isNavMenu: true },
  styles: {
    desktop: { display: 'flex', alignItems: 'center', gap: '16px', listStyle: 'none', margin: '0 0 0 auto', padding: '0' },
    tablet: { display: 'none' },
    mobile: { display: 'none' },
    widescreen: { display: 'flex', alignItems: 'center', gap: '16px', listStyle: 'none', margin: '0 0 0 auto', padding: '0' },
    laptop: { display: 'flex', alignItems: 'center', gap: '16px', listStyle: 'none', margin: '0 0 0 auto', padding: '0' },
    mobileLandscape: { display: 'none' },
  },
  children: [makeNavLink('Home'), makeNavLink('Services')],
  parentId: null,
  locked: false,
  hidden: false,
});

export const getNavbarElementDefaults = (): ElementDefaults => ({
  name: 'Navigation',
  props: {},
  styles: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: '16px',
    paddingTop: '16px',
    paddingLeft: '20px',
    paddingRight: '20px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    position: 'relative',
    zIndex: '100',
  } satisfies StyleProperties,
  children: [makeNavHeading(), makeNavIcon(), makeNavMenu()],
});
