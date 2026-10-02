import type { StyleProperties } from '../../types/builder';

export const getInputElementDefaults = () => ({
  name: 'Input',
  props: { placeholder: 'Enter text...', type: 'text', label: 'Label' },
  styles: {
    display: 'flex',
    width: '100%',
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: '14px',
    paddingRight: '14px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    color: '#111827',
    backgroundColor: '#ffffff',
    outline: 'none',
  } satisfies StyleProperties,
});
