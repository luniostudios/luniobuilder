import type { StyleProperties } from '../../types/builder';
import type { ElementDefaults } from './elementDefaults';

export const getSectionElementDefaults = (): ElementDefaults => ({
  name: 'Section',
  props: {},
  styles: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minHeight: '200px',
    paddingTop: '40px',
    paddingBottom: '40px',
    paddingLeft: '20px',
    paddingRight: '20px',
    backgroundColor: '#ffffff',
  } satisfies StyleProperties,
});

export const renderSectionElement = ({
  indent = 0,
  attrs = '',
  children = '',
}: {
  indent?: number;
  attrs?: string;
  children?: string;
}): string => `${' '.repeat(indent)}<section${attrs}>${children}</section>`;

