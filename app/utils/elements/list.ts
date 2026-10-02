import type { StyleProperties } from '../../types/builder';

export const getListElementDefaults = () => ({
  name: 'List',
  props: {},
  styles: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingTop: '20px',
    paddingBottom: '20px',
    paddingLeft: '20px',
    paddingRight: '20px',
    listStyle: 'none',
  } satisfies StyleProperties,
});
