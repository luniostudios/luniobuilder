export type ElementType =
  | 'section'
  | 'div'
  | 'heading'
  | 'paragraph'
  | 'button'
  | 'image'
  | 'link'
  | 'navbar'
  | 'hero'
  | 'card'
  | 'grid'
  | 'columns'
  | 'form'
  | 'input'
  | 'textarea'
  | 'video'
  | 'divider'
  | 'spacer'
  | 'icon'
  | 'list'
  | 'listItem'
  | 'iframe';

export interface StyleProperties {
  // Layout
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  flexWrap?: string;
  flexGrow?: string;
  flexShrink?: string;
  flexBasis?: string;
  alignSelf?: string;
  order?: string;
  gap?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  backdropFilter?: string;

  // Spacing
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;

  // Sizing
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;

  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  textDecoration?: string;
  textTransform?: string;
  color?: string;

  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundGradient?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  objectFit?: string;

  // Text gradient
  textGradient?: string;
  // Clip image to text (uses background-clip: text)
  textClipImage?: string;
  backgroundClip?: string;
  borderGradient?: string;
  borderImage?: string;
  WebkitBackgroundClip?: string;
  WebkitTextFillColor?: string;

  // Border
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: string;

  // Effects
  boxShadow?: string;
  opacity?: string;
  overflow?: string;
  zIndex?: string;
  position?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  resize?: string;
  outline?: string;
  listStyle?: string;
  boxSizing?: string;
  overflowWrap?: string;
  wordBreak?: string;

  // Cursor
  cursor?: string;

  // Transition
  transition?: string;
}

export interface ElementProps {
  text?: string;
  src?: string;
  alt?: string;
  href?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  placeholder?: string;
  type?: string;
  label?: string;
  iconName?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  columns?: number;
  rows?: number;
  [key: string]: unknown;
}

export interface ResponsiveStyles {
  widescreen: StyleProperties;
  desktop: StyleProperties;
  tablet: StyleProperties;
  mobile: StyleProperties;
}

export interface PseudoClassStyles {
  hover?: ResponsiveStyles;
  active?: ResponsiveStyles;
  focus?: ResponsiveStyles;
}

export interface BuilderElement {
  id: string;
  type: ElementType;
  name: string;
  props: ElementProps;
  styles: ResponsiveStyles;
  pseudoClassStyles?: PseudoClassStyles;
  children: BuilderElement[];
  parentId: string | null;
  locked: boolean;
  hidden: boolean;
  isComponent?: boolean;
  componentName?: string;
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  elements: BuilderElement[];
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

export type Breakpoint = 'widescreen' | 'desktop' | 'tablet' | 'mobile';

export interface BuilderState {
  pages: Page[];
  currentPageId: string;
  selectedElementId: string | null;
  hoveredElementId: string | null;
  draggedElementType: ElementType | null;
  draggedElementId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
  breakpoint: Breakpoint;
  canvasScale: number;
  leftPanelTab: 'components' | 'layers' | 'pages';
  rightPanelTab: 'style' | 'content' | 'css' | 'seo';
  pseudoClassState: 'base' | 'hover' | 'active' | 'focus';
  history: Page[][];
  historyIndex: number;
  isPreviewMode: boolean;
}

export interface ComponentDefinition {
  type: ElementType;
  label: string;
  icon: string;
  category: string;
  defaultProps: ElementProps;
  defaultStyles: StyleProperties;
  canHaveChildren: boolean;
  defaultChildren?: ComponentDefinition[];
}
