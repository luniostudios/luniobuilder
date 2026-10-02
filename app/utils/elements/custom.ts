import type { StyleProperties } from '../../types/builder';

export const getCustomElementDefaults = () => ({
  name: 'Custom Code',
  props: {
    html: '<div class="custom-content">Your custom code</div>',
    css: '.custom-content { padding: 24px; color: #374151; }',
    javascript: '',
  },
  styles: {
    width: '100%',
    minHeight: '120px',
    border: '1px dashed #9ca3af',
  } satisfies StyleProperties,
});
