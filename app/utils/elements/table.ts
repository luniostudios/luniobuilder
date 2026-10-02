import type { StyleProperties } from '../../types/builder';

export const getTableElementDefaults = () => ({
  name: 'CMS Table',
  props: { collectionId: '', columns: [], emptyMessage: 'No records yet.' },
  styles: {
    display: 'block',
    width: '100%',
    color: '#172033',
    backgroundColor: '#ffffff',
  } satisfies StyleProperties,
});
