import type { StyleProperties } from '../../types/builder';

export const getCalendarElementDefaults = () => ({
  name: 'Calendar',
  props: { title: 'Calendar' },
  styles: {
    width: '100%',
    height: '650px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
  } satisfies StyleProperties,
});
