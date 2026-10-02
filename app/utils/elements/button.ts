import type { StyleProperties } from '../../types/builder';

export const getButtonElementDefaults = () => ({
  name: 'Button',
  props: { text: 'Click Me', href: '#' },
  styles: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '12px',
    paddingRight: '28px',
    paddingBottom: '12px',
    paddingLeft: '28px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } satisfies StyleProperties,
});
