import type { StyleProperties } from '../../types/builder';

export const getTextareaElementDefaults = () => ({
  name: 'Textarea',
  props: { placeholder: 'Enter text...', label: 'Message' },
  styles: {
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
    minHeight: '120px',
    resize: 'vertical',
    outline: 'none',
  } satisfies StyleProperties,
});
