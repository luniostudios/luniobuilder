import type { StyleProperties } from '../../types/builder';
import type { ElementDefaults } from './elementDefaults';

export const getHeadingElementDefaults = (): ElementDefaults => ({
  name: 'Heading',
  props: { text: 'Beautiful Heading', level: 1 },
  styles: {
    display: 'flex',
    fontSize: '48px',
    fontWeight: '700',
    lineHeight: '1.2',
    color: '#111827',
  } satisfies StyleProperties,
});
