import type { StyleProperties } from '../../types/builder';

export const getDividerElementDefaults = () => ({
  name: 'Divider',
  props: {},
  styles: {
    width: '100%',
    borderBottom: '1px solid #e5e7eb',
    marginTop: '16px',
    marginBottom: '16px',
  } satisfies StyleProperties,
});
