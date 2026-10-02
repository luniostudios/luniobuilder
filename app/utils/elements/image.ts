import type { StyleProperties } from '../../types/builder';

export const getImageElementDefaults = () => ({
  name: 'Image',
  props: {
    src: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Image',
  },
  styles: {
    display: 'flex',
    objectFit: 'cover',
  } satisfies StyleProperties,
});
