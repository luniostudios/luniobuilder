import type { StyleProperties } from '../../types/builder';

export const getArticleElementDefaults = () => ({
  name: 'Article',
  props: {},
  styles: {
    display: 'block',
    flexDirection: 'column',
    width: '100%',
    paddingTop: '20px',
    paddingBottom: '20px',
    paddingLeft: '20px',
    paddingRight: '20px',
  } satisfies StyleProperties,
});
