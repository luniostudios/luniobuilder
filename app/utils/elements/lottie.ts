import type { StyleProperties } from '../../types/builder';

export const getLottieElementDefaults = () => ({
  name: 'Lottie animation',
  props: { src: '', autoplay: true, loop: true, speed: 1, useAsPageLoader: false },
  styles: {
    width: '180px',
    height: '180px',
  } satisfies StyleProperties,
});