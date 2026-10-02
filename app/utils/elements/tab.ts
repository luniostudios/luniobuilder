import type { StyleProperties } from '../../types/builder';
import type { ElementDefaults } from './elementDefaults';

export const getTabElementDefaults = (): ElementDefaults => ({
  name: 'Tab',
  props: { text: 'New tab' },
  styles: {
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
  } satisfies StyleProperties,
  children: [
    { id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', name: 'Tab heading', props: { text: 'Tab title', level: 1 }, styles: { desktop: { fontSize: '24px' }, tablet: {}, mobile: {}, widescreen: {}, laptop: {}, mobileLandscape: {} }, children: [], parentId: null, locked: false, hidden: false },
    { id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`, type: 'paragraph', name: 'Tab paragraph', props: { text: 'A clear place to start' }, styles: { desktop: { fontSize: '16px' }, tablet: {}, mobile: {}, widescreen: {}, laptop: {}, mobileLandscape: {} }, children: [], parentId: null, locked: false, hidden: false },
  ],
});
