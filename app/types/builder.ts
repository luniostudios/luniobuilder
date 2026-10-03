export type ElementType =
  | 'article'
  | 'section'
  | 'div'
  | 'body'
  | 'heading'
  | 'paragraph'
  | 'button'
  | 'image'
  | 'link'
  | 'navbar'
  | 'tabs'
  | 'tab'
  | 'hero'
  | 'slider'
  | 'slide'
  | 'sliderArrow'
  | 'sliderPagination'
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
  | 'iframe'
  | 'calendar'
  | 'table'
  | 'cmsMap'
  | 'custom'
  | 'select'  
  | 'option';  

export interface StyleProperties {
  // Layout
  display?: string;
  flex?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  flexWrap?: string;
  flexGrow?: number | string;
  flexShrink?: string;
  flexBasis?: string;
  alignSelf?: string;
  order?: string;
  gap?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  columnLayout?: string;
  rowLayout?: string;
  backdropFilter?: string;
  visibility?: string;
  transform?: string;
  translate?: string;

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
  backgroundVideo?: string;
  backgroundVideoUrl?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundAttachment?: string;
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
  filter?: string;
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

  // Animation
  animation?: string;
  animationName?: string;
  animationDuration?: string;
  animationTimingFunction?: string;
  animationDelay?: string;
  animationIterationCount?: string;
  animationDirection?: string;
  animationFillMode?: string;
  animationPlayState?: string;
}

export interface ElementBackgroundLayer {
  type: 'image' | 'gradient' | 'video';
  value: string;
}

export interface ElementProps {
  text?: string;
  src?: string;
  alt?: string;
  href?: string;
  anchorId?: string;
  backgroundVideoUrl?: string;
  backgroundLayers?: ElementBackgroundLayer[];
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  placeholder?: string;
  type?: string;
  label?: string;
  iconName?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  columns?: number | string[];
  rows?: number | Record<string, unknown>[];
  [key: string]: unknown;
}

export interface ResponsiveStyles {
  widescreen: StyleProperties;
  desktop: StyleProperties;
  laptop: StyleProperties;
  tablet: StyleProperties;
  mobileLandscape: StyleProperties;
  mobile: StyleProperties;
}

export interface PseudoClassStyles {
  hover?: ResponsiveStyles;
  active?: ResponsiveStyles;
  focus?: ResponsiveStyles;
}

export type InteractionTrigger = 'hover' | 'click' | 'scroll-into-view';

export interface InteractionKeyframe {
  offset: number;
  isInitialState?: boolean;
  opacity?: number;
  translateX?: number;
  translateY?: number;
  scale?: number;
  rotate?: number;
}

export interface ElementInteraction {
  trigger: InteractionTrigger;
  action: 'animate' | 'show' | 'visibility' | 'opacity';
  animationName: string;
  duration: string;
  customKeyframes?: InteractionKeyframe[];
  targetElementId?: string;
  visibilityMode?: 'show' | 'hide' | 'toggle';
  opacityValue?: string;
}

export interface PageInteraction {
  trigger: 'load';
  animationName: string;
  duration: string;
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
  interactions?: ElementInteraction[];
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  passwordProtected?: boolean;
  password?: string;
  elements: BuilderElement[];
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  cmsDetail?: import('./cms').CmsDetailSettings;
  interactions?: PageInteraction[];
}

export type Breakpoint = 'widescreen' | 'desktop' | 'tablet' | 'mobile' | 'laptop' | 'mobileLandscape';

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
  leftPanelTab: 'components' | 'library' | 'layers' | 'pages' | 'cms' | 'assets';
  rightPanelTab: 'style' | 'content' | 'css' | 'interactions' | 'seo';
  pseudoClassState: 'base' | 'hover' | 'active' | 'focus';
  history: Page[][];
  historyIndex: number;
  isPreviewMode: boolean;
  triggeredInteractions: Record<string, { animationName: string; duration: string; customKeyframes?: InteractionKeyframe[]; visibility?: 'show' | 'hide'; opacity?: string }>;
  revealedElementIds: Record<string, boolean>;
  visibilityOverrides: Record<string, 'show' | 'hide'>;
  opacityOverrides: Record<string, string>;
  interactionTargetSelection: { sourceId: string; interactionIndex: number } | null;
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
