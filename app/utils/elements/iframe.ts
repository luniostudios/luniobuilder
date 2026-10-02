import type { StyleProperties } from '../../types/builder';

export const getIframeElementDefaults = () => ({
  name: 'Iframe',
  props: { src: 'https://www.w3schools.com' },
  styles: {
    width: '100%',
    height: '100%',
    border: 'none',
  } satisfies StyleProperties,
});
