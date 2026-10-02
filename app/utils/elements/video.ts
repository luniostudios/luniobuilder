import type { StyleProperties } from '../../types/builder';

export const getVideoElementDefaults = () => ({
  name: 'Video',
  props: { src: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  styles: {
    width: '100%',
    borderRadius: '8px',
  } satisfies StyleProperties,
});
