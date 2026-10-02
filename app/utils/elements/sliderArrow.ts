import type { StyleProperties } from '../../types/builder';

export const getSliderArrowElementDefaults = () => ({
  name: 'Previous arrow',
  props: { direction: 'previous', label: 'Previous slide' },
  styles: {
    display: 'inline-flex',
    position: 'absolute',
    top: '50%',
    left: '16px',
    transform: 'translateY(-50%)',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    border: '0',
    borderRadius: '999px',
    backgroundColor: '#ffffff',
    color: '#111827',
    cursor: 'pointer',
    zIndex: '2',
  } satisfies StyleProperties,
});
