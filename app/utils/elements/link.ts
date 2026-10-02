import type { StyleProperties } from '../../types/builder';

export const getLinkElementDefaults = () => ({
  name: 'Link',
  props: { text: 'Click here', href: '#' },
  styles: {
    fontSize: '16px',
    textDecoration: 'underline',
    cursor: 'pointer',
  } satisfies StyleProperties,
});
