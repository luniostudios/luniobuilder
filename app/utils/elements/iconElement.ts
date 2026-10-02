import type { StyleProperties } from '../../types/builder';

export const getIconElementDefaults = () => ({
  name: 'Icon',
  props: { iconName: 'Star' },
  styles: {
    color: '#2563eb',
    width: '32px',
    height: '32px',
  } satisfies StyleProperties,
});