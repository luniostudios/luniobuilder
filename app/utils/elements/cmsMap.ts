import type { StyleProperties } from '../../types/builder';

export const getCmsMapElementDefaults = () => ({
  name: 'CMS Map',
  props: { collectionId: '', emptyMessage: 'No records yet.' },
  styles: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '20px',
    width: '100%',
    paddingTop: '20px',
    paddingBottom: '20px',
    paddingLeft: '20px',
    paddingRight: '20px',
  } satisfies StyleProperties,
});
