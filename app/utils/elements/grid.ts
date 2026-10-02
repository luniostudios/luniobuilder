import type { StyleProperties } from '../../types/builder';

export const getGridElementDefaults = () => ({
  name: 'Grid',
  props: { columns: 3 },
  styles: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
    width: '100%',
    paddingTop: '20px',
    paddingBottom: '20px',
    paddingLeft: '20px',
    paddingRight: '20px',
  } satisfies StyleProperties,
});
