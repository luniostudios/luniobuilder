import type { StyleProperties } from '../../types/builder';

export const getListItemElementDefaults = () => ({
  name: 'List Item',
  props: { text: 'List item text' },
  styles: {
    fontSize: '16px',
    color: '#374151',
    paddingTop: '4px',
    paddingBottom: '4px',
    paddingLeft: '8px',
    paddingRight: '8px',
  } satisfies StyleProperties,
});
