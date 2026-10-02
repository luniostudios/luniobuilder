import type { StyleProperties } from '../../types/builder';

export const getParagraphElementDefaults = () => ({
  name: 'Paragraph',
  props: { text: 'Add your text content here. Click to edit.' },
  styles: {
    display: 'flex',
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#6b7280',
    marginBottom: '16px',
  } satisfies StyleProperties,
});
