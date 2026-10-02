import type { StyleProperties } from '../../types/builder';

export const getCardElementDefaults = () => ({
  name: 'Card',
  props: {},
  styles: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    paddingTop: '24px',
    paddingBottom: '24px',
    paddingLeft: '20px',
    paddingRight: '20px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  } satisfies StyleProperties,
});
