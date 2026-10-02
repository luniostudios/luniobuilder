import type { StyleProperties } from '../../types/builder';

export const getSliderPaginationElementDefaults = () => ({
  name: 'Pagination',
  props: { activeColor: '#111827', inactiveColor: '#94a3b8', dotSize: '10px', dotRadius: '999px', dotBorderColor: 'transparent', dotBorderWidth: '0px' },
  styles: {
    display: 'flex',
    position: 'absolute',
    left: '50%',
    bottom: '16px',
    transform: 'translateX(-50%)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    zIndex: '2',
  } satisfies StyleProperties,
});
