import type { BuilderElement, StyleProperties } from '../../types/builder';
import type { ElementDefaults } from './elementDefaults';

const makeColumn = (): BuilderElement => ({
  id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`,
  type: 'div',
  name: 'Column',
  props: {},
  styles: {
    desktop: { display: 'flex', flex: '50%', width: '100%' },
    tablet: { display: 'block', width: '100%' },
    mobile: { display: 'block', width: '100%' },
    widescreen: { display: 'block', width: '100%' },
    laptop: { display: 'block', width: '100%' },
    mobileLandscape: { display: 'block', width: '100%' },
  },
  children: [],
  parentId: null,
  locked: false,
  hidden: false,
});

export const getColumnsElementDefaults = (): ElementDefaults => ({
  name: 'Columns',
  props: { columns: 2 },
  styles: {
    display: 'flex',
    gap: '24px',
    width: '100%',
  } satisfies StyleProperties,
  children: [makeColumn(), makeColumn()],
});
