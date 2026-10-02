import type { StyleProperties } from '../../types/builder';
import type { ElementDefaults } from './elementDefaults';

export const getSlideElementDefaults = (): ElementDefaults => ({
  name: 'Slide',
  props: {},
  styles: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '420px',
    paddingTop: '64px',
    paddingRight: '64px',
    paddingBottom: '64px',
    paddingLeft: '64px',
    backgroundColor: '#f1f5f9',
  } satisfies StyleProperties,
  children: [
    { id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', name: 'Slide heading', props: { text: 'Slide title', level: 1 }, styles: { desktop: { fontSize: '48px', fontWeight: '700', marginBottom: '16px' }, tablet: {}, mobile: {}, widescreen: {}, laptop: {}, mobileLandscape: {} }, children: [], parentId: null, locked: false, hidden: false },
    { id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`, type: 'paragraph', name: 'Slide paragraph', props: { text: 'Slide content' }, styles: { desktop: { fontSize: '18px', lineHeight: '1.6' }, tablet: {}, mobile: {}, widescreen: {}, laptop: {}, mobileLandscape: {} }, children: [], parentId: null, locked: false, hidden: false },
  ],
});
