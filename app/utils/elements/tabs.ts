import type { BuilderElement, ResponsiveStyles, StyleProperties } from '../../types/builder';
import type { ElementDefaults } from './elementDefaults';

const createTab = (title: string, heading: string, body: string): BuilderElement => ({
  id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`,
  type: 'tab',
  name: title,
  props: { text: title },
  styles: {
    desktop: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 16px',
      border: '1px solid transparent',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    widescreen: {},
    laptop: {},
    tablet: {},
    mobileLandscape: {},
    mobile: {},
  } satisfies ResponsiveStyles,
  children: [
    { id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', name: heading, props: { text: heading, level: 1 }, styles: { desktop: { fontSize: '24px' }, tablet: {}, mobile: {}, widescreen: {}, laptop: {}, mobileLandscape: {} }, children: [], parentId: null, locked: false, hidden: false },
    { id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`, type: 'paragraph', name: body, props: { text: body }, styles: { desktop: { fontSize: '16px' }, tablet: {}, mobile: {}, widescreen: {}, laptop: {}, mobileLandscape: {} }, children: [], parentId: null, locked: false, hidden: false },
  ],
  parentId: null,
  locked: false,
  hidden: false,
});

export const getTabsElementDefaults = (): ElementDefaults => ({
  name: 'Tabs',
  props: {
    selectorOrientation: 'horizontal',
    selectorGap: '4px',
    selectorPadding: '4px',
    selectorBackgroundColor: '#eef2f7',
    selectorBorder: '1px solid #e2e8f0',
    selectorBorderRadius: '12px',
    activeTabBackgroundColor: '#ffffff',
    activeTabColor: '#172033',
    inactiveTabBackgroundColor: 'transparent',
    inactiveTabColor: '#64748b',
    panelPadding: '24px',
    panelBackgroundColor: '#ffffff',
    panelBorderColor: '#e2e8f0',
    panelBorderRadius: '12px',
  },
  styles: { display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' } satisfies StyleProperties,
  children: [
    createTab('Overview', 'A clear place to start', 'Organize related content into focused panels.'),
    createTab('Details', 'More details', 'Give each section its own content and visual style.'),
  ],
});
