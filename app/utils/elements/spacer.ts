import type { StyleProperties } from '../../types/builder';

export const getSpacerElementDefaults = () => ({
  name: 'Spacer',
  props: {},
  styles: {
    height: '48px',
    width: '100%',
  } satisfies StyleProperties,
});
