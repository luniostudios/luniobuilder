import type { StyleProperties } from '../../types/builder';
import type { ElementDefaults } from './elementDefaults';

export const getBodyElementDefaults = (): ElementDefaults => ({
  name: 'Body',
  props: {},
  styles: {
    display: 'block',
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#ffffff',
  } satisfies StyleProperties,
});