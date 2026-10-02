import { BuilderElement, ElementType, StyleProperties, ResponsiveStyles, Page } from '../types/builder';
import { Breakpoint } from '../types/builder';
import { getGoogleFontStylesheetUrls } from './googleFonts';
import type { ElementDefaults } from './elements/elementDefaults';
import { getArticleElementDefaults } from './elements/article';
import { getBodyElementDefaults } from './elements/body';
import { getButtonElementDefaults } from './elements/button';
import { getCalendarElementDefaults } from './elements/calendar';
import { getCardElementDefaults } from './elements/card';
import { getCmsMapElementDefaults } from './elements/cmsMap';
import { getColumnsElementDefaults } from './elements/columns';
import { getCustomElementDefaults } from './elements/custom';
import { getDividerElementDefaults } from './elements/divider';
import { getDivElementDefaults } from './elements/div';
import { getFormElementDefaults } from './elements/form';
import { getGridElementDefaults } from './elements/grid';
import { getHeadingElementDefaults } from './elements/heading';
import { getHeroElementDefaults } from './elements/hero';
import { getIconElementDefaults } from './elements/iconElement';
import { getIframeElementDefaults } from './elements/iframe';
import { getImageElementDefaults } from './elements/image';
import { getInputElementDefaults } from './elements/input';
import { getLinkElementDefaults } from './elements/link';
import { getListElementDefaults } from './elements/list';
import { getListItemElementDefaults } from './elements/listItem';
import { getNavbarElementDefaults } from './elements/navbar';
import { getParagraphElementDefaults } from './elements/paragraph';
import { getSectionElementDefaults, renderSectionElement } from './elements/section';
import { getSelectElementDefaults } from './elements/select';
import { getSliderArrowElementDefaults } from './elements/sliderArrow';
import { getSliderElementDefaults } from './elements/slider';
import { getSliderPaginationElementDefaults } from './elements/sliderPagination';
import { getSlideElementDefaults } from './elements/slide';
import { getSpacerElementDefaults } from './elements/spacer';
import { getTabElementDefaults } from './elements/tab';
import { getTableElementDefaults } from './elements/table';
import { getTabsElementDefaults } from './elements/tabs';
import { getTextareaElementDefaults } from './elements/textarea';
import { getVideoElementDefaults } from './elements/video';

export const generateId = (): string => {
  return `luniobuilder-${Math.random().toString(36).substr(2, 9)}`;
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

const emptyStyles = (): ResponsiveStyles => ({
  widescreen: {},
  desktop: {},
  laptop: {},
  tablet: {},
  mobileLandscape: {},
  mobile: {},
});

export const createDefaultElement = (
  type: ElementType,
  id: string,
  parentId: string | null
): BuilderElement => {
  const defaults = getElementDefaults(type);
  const children = defaults.children || [];
  const setParentIds = (elements: BuilderElement[], currentParentId: string) => {
    elements.forEach(child => {
      child.parentId = currentParentId;
      setParentIds(child.children, child.id);
    });
  };
  setParentIds(children, id);
  return {
    id,
    type,
    name: defaults.name,
    props: defaults.props,
    styles: {
      widescreen: {},
      desktop: defaults.styles,
      tablet: {},
      mobile: {},
      laptop: {},
      mobileLandscape: {},
    },
    children,
    parentId,
    locked: false,
    hidden: false,
  };
};

export const getElementDefaults = (type: ElementType): ElementDefaults => {
  if (type === 'section') return getSectionElementDefaults();
  if (type === 'body') return getBodyElementDefaults();
  if (type === 'div') return getDivElementDefaults();
  if (type === 'article') return getArticleElementDefaults();
  if (type === 'heading') return getHeadingElementDefaults();
  if (type === 'paragraph') return getParagraphElementDefaults();
  if (type === 'button') return getButtonElementDefaults();
  if (type === 'select') return getSelectElementDefaults();
  if (type === 'image') return getImageElementDefaults();
  if (type === 'navbar') return getNavbarElementDefaults();
  if (type === 'tabs') return getTabsElementDefaults();
  if (type === 'tab') return getTabElementDefaults();
  if (type === 'hero') return getHeroElementDefaults();
  if (type === 'slider') return getSliderElementDefaults();
  if (type === 'slide') return getSlideElementDefaults();
  if (type === 'sliderArrow') return getSliderArrowElementDefaults();
  if (type === 'sliderPagination') return getSliderPaginationElementDefaults();
  if (type === 'card') return getCardElementDefaults();
  if (type === 'grid') return getGridElementDefaults();
  if (type === 'columns') return getColumnsElementDefaults();
  if (type === 'form') return getFormElementDefaults();
  if (type === 'input') return getInputElementDefaults();
  if (type === 'textarea') return getTextareaElementDefaults();
  if (type === 'video') return getVideoElementDefaults();
  if (type === 'divider') return getDividerElementDefaults();
  if (type === 'spacer') return getSpacerElementDefaults();
  if (type === 'icon') return getIconElementDefaults();
  if (type === 'list') return getListElementDefaults();
  if (type === 'listItem') return getListItemElementDefaults();
  if (type === 'link') return getLinkElementDefaults();
  if (type === 'iframe') return getIframeElementDefaults();
  if (type === 'calendar') return getCalendarElementDefaults();
  if (type === 'table') return getTableElementDefaults();
  if (type === 'cmsMap') return getCmsMapElementDefaults();
  if (type === 'custom') return getCustomElementDefaults();

  return {
    name: type,
    props: {},
    styles: { display: 'block' },
  };
};

export const getEffectiveStyles = (
  element: BuilderElement,
  breakpoint: 'widescreen' | 'desktop' | 'tablet' | 'mobile' | 'laptop' | 'mobileLandscape'
): StyleProperties => {
  const styles = element.styles || {};
  const desktop = styles.desktop || {};
  const cascade: Record<typeof breakpoint, StyleProperties> = {
    desktop,
    widescreen: { ...desktop, ...(styles.widescreen || {}) },
    laptop: { ...desktop, ...(styles.laptop || {}) },
    tablet: { ...desktop, ...(styles.laptop || {}), ...(styles.tablet || {}) },
    mobileLandscape: { ...desktop, ...(styles.laptop || {}), ...(styles.tablet || {}), ...(styles.mobileLandscape || {}) },
    mobile: { ...desktop, ...(styles.laptop || {}), ...(styles.tablet || {}), ...(styles.mobileLandscape || {}), ...(styles.mobile || {}) },
  };

  return cascade[breakpoint];
};

const expandBoxShorthand = (
  computed: StyleProperties,
  shorthand: 'padding' | 'margin',
  sides: ['paddingTop' | 'marginTop', 'paddingRight' | 'marginRight', 'paddingBottom' | 'marginBottom', 'paddingLeft' | 'marginLeft']
) => {
  const value = computed[shorthand];
  if (typeof value !== 'string' || !value.trim()) return;

  const values = value.trim().split(/\s+/);
  const expanded = values.length === 1
    ? [values[0], values[0], values[0], values[0]]
    : values.length === 2
      ? [values[0], values[1], values[0], values[1]]
      : values.length === 3
        ? [values[0], values[1], values[2], values[1]]
        : [values[0], values[1], values[2], values[3]];

  delete computed[shorthand];
  sides.forEach((side, index) => {
    if (!computed[side]) computed[side] = expanded[index];
  });
};

const buildComputedStyleObject = (styles: StyleProperties): StyleProperties => {
  const computed: StyleProperties = { ...styles };

  expandBoxShorthand(computed, 'padding', ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']);
  expandBoxShorthand(computed, 'margin', ['marginTop', 'marginRight', 'marginBottom', 'marginLeft']);

  if (styles.backgroundGradient) {
    computed.backgroundImage = styles.backgroundGradient;
  }

  if (styles.textClipImage) {
    computed.backgroundImage = styles.textClipImage;
    computed.backgroundClip = 'text';
    computed.WebkitBackgroundClip = 'text';
    computed.WebkitTextFillColor = 'transparent';
    computed.backgroundSize = computed.backgroundSize || 'cover';
    computed.backgroundPosition = computed.backgroundPosition || 'center';
    computed.backgroundRepeat = computed.backgroundRepeat || 'no-repeat';
    if (!computed.color) {
      computed.color = 'transparent';
    }
  }

  if (styles.textGradient) {
    computed.backgroundImage = styles.textGradient;
    computed.backgroundClip = 'text';
    computed.WebkitBackgroundClip = 'text';
    computed.WebkitTextFillColor = 'transparent';
    if (!computed.color) {
      computed.color = 'transparent';
    }
  }

  return computed;
};

export const stylesToCSS = (styles: StyleProperties): React.CSSProperties => {
  return buildComputedStyleObject(styles) as React.CSSProperties;
};

const camelToKebabCase = (key: string): string => {
  return key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
};

export const styleObjectToCssString = (styles: StyleProperties): string => {
  const computed = buildComputedStyleObject(styles);
  return Object.entries(computed)
    .filter(([key, value]) => value !== undefined && value !== null && value !== '' && key !== 'backgroundGradient' && key !== 'textGradient')
    .map(([key, value]) => `${camelToKebabCase(key)}:${String(value)}`)
    .join('; ');
};

const getElementClassName = (element: BuilderElement): string => `lunio-${element.id}`;

const breakpointQueries: Record<Breakpoint, string | null> = {
  widescreen: '(min-width: 1920px)',
  desktop: null,
  laptop: '(max-width: 1200px)',
  tablet: '(max-width: 991px)',
  mobileLandscape: '(max-width: 767px)',
  mobile: '(max-width: 479px)',
};

const buildPseudoClassCssForElement = (element: BuilderElement): string => {
  const selector = `.${getElementClassName(element)}`;
  const pseudoClassStyles = element.pseudoClassStyles;
  const rules: string[] = [];

  if (!pseudoClassStyles) return '';

  // Build CSS for hover, active, and focus pseudo-classes
  (['hover', 'active', 'focus'] as const).forEach(pseudoClass => {
    const pseudoStyles = pseudoClassStyles[pseudoClass];
    if (!pseudoStyles) return;

    // Desktop (no media query)
    const desktopStyle = styleObjectToCssString(pseudoStyles.desktop);
    if (desktopStyle) {
      rules.push(`${selector}:${pseudoClass}{${desktopStyle}}`);
    }

    // Responsive breakpoints
    (['widescreen', 'laptop', 'tablet', 'mobileLandscape', 'mobile'] as Breakpoint[]).forEach(breakpoint => {
      const style = styleObjectToCssString(pseudoStyles[breakpoint]);
      if (!style || style === desktopStyle) return;
      const mediaQuery = breakpointQueries[breakpoint];
      if (!mediaQuery) return;
      rules.push(`@media ${mediaQuery}{${selector}:${pseudoClass}{${style}}}`);
    });
  });

  return rules.join('\n');
};

const buildResponsiveCssForElement = (element: BuilderElement): string => {
  const selector = `.${getElementClassName(element)}`;
  const baseStyle = styleObjectToCssString(getElementExportStyle(element, 'desktop'));
  const rules: string[] = [];

  if (baseStyle) {
    rules.push(`${selector}{${baseStyle}}`);
  }

  (['widescreen', 'laptop', 'tablet', 'mobileLandscape', 'mobile'] as Breakpoint[]).forEach(breakpoint => {
    const style = styleObjectToCssString(getElementExportStyle(element, breakpoint));
    if (!style || style === baseStyle) return;
    const mediaQuery = breakpointQueries[breakpoint];
    if (!mediaQuery) return;
    rules.push(`@media ${mediaQuery}{${selector}{${style}}}`);
  });

  // Add pseudo-class styles
  const pseudoClassRules = buildPseudoClassCssForElement(element);
  if (pseudoClassRules) {
    rules.push(pseudoClassRules);
  }

  element.children.forEach(child => {
    const childRules = buildResponsiveCssForElement(child);
    if (childRules) rules.push(childRules);
  });

  return rules.join('\n');
};

export const generateCssForPage = (page: Page): string => {
  return page.elements.map(buildResponsiveCssForElement).filter(Boolean).join('\n');
};

const getElementExportStyle = (element: BuilderElement, breakpoint: Breakpoint): StyleProperties => {
  const computed = getEffectiveStyles(element, breakpoint);
  const exportStyle = { ...computed } as StyleProperties & Record<string, string>;
  exportStyle.boxSizing = exportStyle.boxSizing || 'border-box';

  if (element.type === 'image' || element.type === 'video') {
    exportStyle.maxWidth = exportStyle.maxWidth || '100%';
    exportStyle.height = exportStyle.height || 'auto';
  }

  if (element.type === 'iframe') {
    exportStyle.width = exportStyle.width || '100%';
    exportStyle.height = exportStyle.height || '100%';
  }

  if (element.type === 'calendar') {
    exportStyle.width = exportStyle.width || '100%';
    exportStyle.height = exportStyle.height || '650px';
  }

  if (['heading', 'paragraph', 'button', 'link', 'listItem'].includes(element.type)) {
    exportStyle.overflowWrap = exportStyle.overflowWrap || 'break-word';
    exportStyle.wordBreak = exportStyle.wordBreak || 'break-word';
  }

  return exportStyle;
};

const escapeHtml = (text?: string): string => {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const getTableFields = (element: BuilderElement): string[] => {
  if (Array.isArray(element.props.columns)) return element.props.columns.filter((value): value is string => typeof value === 'string');
  return [];
};

const getTableRows = (element: BuilderElement): Array<Record<string, unknown>> => {
  if (!Array.isArray(element.props.rows)) return [];
  return element.props.rows.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object');
};

const escapeJsxString = (text?: string): string => {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
};

const styleObjectToJsxString = (styles: StyleProperties): string => {
  const computed = buildComputedStyleObject(styles);
  const entries = Object.entries(computed)
    .filter(([key, value]) => value !== undefined && value !== null && value !== '' && key !== 'backgroundGradient' && key !== 'textGradient')
    .map(([key, value]) => `${key}: '${escapeJsxString(String(value))}'`);
  return entries.join(', ');
};

const renderTabsExport = (
  element: BuilderElement,
  indent: number,
  mode: 'jsx' | 'html',
  renderPanelContents: (tab: BuilderElement, indent: number) => string,
  breakpoint: Breakpoint = 'desktop'
): string => {
  const tabs = element.children.filter(child => child.type === 'tab');
  const selectorElement = element.children.find(child => child.props.isTabSelector === true);
  const indentation = ' '.repeat(indent);
  const selectorStyles: StyleProperties = selectorElement
    ? getEffectiveStyles(selectorElement, breakpoint)
    : {
      display: 'flex',
      flexDirection: element.props.selectorOrientation === 'vertical' ? 'column' : 'row',
      flexWrap: 'wrap',
      gap: String(element.props.selectorGap || '4px'),
      padding: String(element.props.selectorPadding || '4px'),
      backgroundColor: String(element.props.selectorBackgroundColor || '#eef2f7'),
      border: String(element.props.selectorBorder || '1px solid #e2e8f0'),
      borderRadius: String(element.props.selectorBorderRadius || '12px'),
    };
  const panelStyles: StyleProperties = {
    minWidth: '0',
    padding: String(element.props.panelPadding || '24px'),
    backgroundColor: String(element.props.panelBackgroundColor || 'transparent'),
    border: `1px solid ${String(element.props.panelBorderColor || 'transparent')}`,
    borderRadius: String(element.props.panelBorderRadius || '12px'),
  };
  const styleAttribute = (styles: StyleProperties) => mode === 'jsx'
    ? `style={{ ${styleObjectToJsxString(styles)} }}`
    : `style="${escapeHtml(styleObjectToCssString(styles))}"`;
  const classAttribute = (name: string) => mode === 'jsx' ? `className="${name}"` : `class="${name}"`;
  const activeColor = String(element.props.activeTabColor || '#172033');
  const inactiveColor = String(element.props.inactiveTabColor || '#64748b');
  const activeBackground = String(element.props.activeTabBackgroundColor || '#ffffff');
  const inactiveBackground = String(element.props.inactiveTabBackgroundColor || 'transparent');
  const root = `<div data-lunio-tabs="${escapeHtml(element.id)}" ${classAttribute(getElementClassName(element))}>`;
  const selector = `<div role="tablist" aria-label="${escapeHtml(String(element.props.label || 'Page sections'))}" ${selectorElement ? classAttribute(getElementClassName(selectorElement)) : ''} ${styleAttribute(selectorStyles)}>${tabs.map((tab, index) => {
    const selected = index === 0;
    const tabId = escapeHtml(`${tab.id}-selector`);
    const panelId = escapeHtml(`${tab.id}-panel`);
    const clickHandler = mode === 'jsx'
      ? `onClick={(event) => { const root = event.currentTarget.closest('[data-lunio-tabs]'); const list = root?.querySelector(':scope > [role=tablist]'); list?.querySelectorAll('[role=tab]').forEach(item => item.setAttribute('aria-selected', 'false')); root?.querySelectorAll(':scope > [role=tabpanel]').forEach(panel => panel.hidden = true); event.currentTarget.setAttribute('aria-selected', 'true'); const panel = root?.querySelector('#${panelId}'); if (panel) panel.hidden = false; }}`
      : `onclick="const root=this.closest('[data-lunio-tabs]');const list=root.querySelector(':scope > [role=tablist]');list.querySelectorAll('[role=tab]').forEach(item=>item.setAttribute('aria-selected','false'));root.querySelectorAll(':scope > [role=tabpanel]').forEach(panel=>panel.hidden=true);this.setAttribute('aria-selected','true');const panel=root.querySelector('#${panelId}');if(panel)panel.hidden=false;"`;
    const hasCustomBackground = Object.values(tab.styles).some(styles => Boolean(styles.backgroundColor));
    const hasCustomColor = Object.values(tab.styles).some(styles => Boolean(styles.color));
    const buttonStyles: StyleProperties = {
      ...(hasCustomBackground ? {} : { backgroundColor: selected ? activeBackground : inactiveBackground }),
      ...(hasCustomColor ? {} : { color: selected ? activeColor : inactiveColor }),
    };
    return `<button type="button" role="tab" id="${tabId}" aria-controls="${panelId}" aria-selected=${mode === 'jsx' ? `{${selected}}` : `"${selected}"`} ${classAttribute(getElementClassName(tab))} ${styleAttribute(buttonStyles)} ${clickHandler}>${escapeHtml(String(tab.props.text || `Tab ${index + 1}`))}</button>`;
  }).join('')}</div>`;
  const panels = tabs.map((tab, index) => {
    const tabId = escapeHtml(`${tab.id}-selector`);
    const panelId = escapeHtml(`${tab.id}-panel`);
    const hidden = index > 0 ? (mode === 'jsx' ? ' hidden={true}' : ' hidden') : '';
    return `<div role="tabpanel" id="${panelId}" aria-labelledby="${tabId}" ${styleAttribute(panelStyles)}${hidden}>${renderPanelContents(tab, indent + 2)}</div>`;
  }).join('');
  return `${indentation}${root}${selector}${panels}</div>`;
};

const renderElementToReact = (element: BuilderElement, indent = 2, breakpoint: Breakpoint = 'desktop'): string => {
  const indentation = ' '.repeat(indent);
  const className = getElementClassName(element);
  const attrs = ` className="${className}"${element.props.isNavMenu ? ' data-lunio-nav-menu="true"' : ''}${element.props.iconName === 'Menu' ? ' data-lunio-nav-toggle="true"' : ''}`;
  const text = escapeHtml(element.props.text as string || '');
  const placeholder = escapeJsxString(element.props.placeholder as string || '');
  const href = escapeJsxString(element.props.href as string || '#');
  const src = escapeJsxString(element.props.src as string || '');
  const alt = escapeJsxString(element.props.alt as string || '');
  const iconName = escapeHtml(element.props.iconName as string || '★');
  const inputType = escapeJsxString(element.props.type as string || 'text');

  const renderChildren = (): string => {
    const childStrings = element.children.map(child => renderElementToReact(child, indent + 2, breakpoint));
    return childStrings.length ? `\n${childStrings.join('\n')}\n${indentation}` : '';
  };

  const children = renderChildren();

  switch (element.type) {
    case 'article':
      return `${indentation}<article${attrs}>${children}</article>`;
    case 'section':
      return renderSectionElement({ indent, attrs, children });
    case 'navbar':
      return `${indentation}<nav${attrs}>${children}</nav>`;
    case 'tabs':
      return renderTabsExport(element, indent, 'jsx', (tab, childIndent) => tab.children.map(child => renderElementToReact(child, childIndent, breakpoint)).join('\n'), breakpoint);
    case 'form':
      return `${indentation}<form${attrs}>${children}</form>`;
    case 'list':
      return `${indentation}<ul${attrs}>${children}</ul>`;
    case 'columns':
    case 'grid':
    case 'hero':
    case 'card':
    case 'body':
    case 'div':
      return `${indentation}<div${attrs}>${children}</div>`;
    case 'heading': {
      const level = element.props.level || 1;
      const tag = `h${Math.min(Math.max(level, 1), 6)}`;
      return `${indentation}<${tag}${attrs}>${text}</${tag}>`;
    }
    case 'paragraph':
      return `${indentation}<p${attrs}>${text}</p>`;
    case 'button':
      return element.props.href
        ? `${indentation}<a href="${href}"${attrs}>${text}</a>`
        : `${indentation}<button type="button"${attrs}>${text}</button>`;
    case 'link':
      return `${indentation}<a href="${href}"${attrs}>${text}</a>`;
    case 'image':
      return `${indentation}<img src="${src}" alt="${alt}"${attrs} />`;
    case 'video':
      return `${indentation}<video controls src="${src}"${attrs}></video>`;
    case 'divider':
      return `${indentation}<hr${attrs} />`;
    case 'spacer':
      return `${indentation}<div${attrs}></div>`;
    case 'input':
      return `${indentation}<input type="${inputType}" placeholder="${placeholder}"${attrs} />`;
    case 'textarea':
      return `${indentation}<textarea placeholder="${placeholder}"${attrs}></textarea>`;
    case 'icon':
      return element.props.iconName === 'Menu'
        ? `${indentation}<button type="button" aria-label="Toggle navigation menu"${attrs} onClick={(event) => { const menu = event.currentTarget.closest('nav')?.querySelector('[data-lunio-nav-menu]'); menu?.classList.toggle('lunio-nav-open'); }}>${iconName}</button>`
        : `${indentation}<span${attrs}>${iconName}</span>`;
    case 'listItem':
      return `${indentation}<li${attrs}>${text}</li>`;
    case 'iframe':
      return `${indentation}<iframe src="${src}"${attrs}></iframe>`;
    case 'calendar':
      return `${indentation}<div${attrs}><div style={{ padding: '24px', backgroundColor: '#ffffff', color: '#172033', borderRadius: '8px', fontFamily: 'inherit' }}>${escapeHtml(String(element.props.title || 'Calendar'))}</div></div>`;
    case 'table': {
      const fields = getTableFields(element);
      const rows = getTableRows(element);
      return `${indentation}<table${attrs}><thead><tr>${fields.map(field => `<th>${escapeHtml(field)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${fields.map(field => `<td>${escapeHtml(String(row[field] ?? ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
    case 'custom':
      return `${indentation}<iframe srcDoc={'${escapeJsxString(getCustomCodeDocument(element))}'}${attrs} title="Custom code"></iframe>`;
    default:
      return `${indentation}<div${attrs}>${children}</div>`;
  }
};

export const renderElementToReactString = (element: BuilderElement, breakpoint: Breakpoint = 'desktop'): string => {
  return renderElementToReact(element, 2, breakpoint);
};

const getCustomCodeDocument = (element: BuilderElement): string => {
  const html = String(element.props.html || '').replace(/<\/script/gi, '<\\/script');
  const css = String(element.props.css || '');
  const javascript = String(element.props.javascript || '').replace(/<\/script/gi, '<\\/script');
  return `<!doctype html><html><head><style>${css}</style></head><body>${html}<script>${javascript}</script></body></html>`;
};

const getCustomCodeMarkup = (element: BuilderElement): string => {
  const html = String(element.props.html || '');
  const css = String(element.props.css || '');
  const javascript = String(element.props.javascript || '').replace(/<\/script/gi, '<\\/script');
  return `${html}<style>${css}</style><script>${javascript}</script>`;
};

export const renderElementToHtml = (element: BuilderElement, breakpoint: Breakpoint = 'desktop'): string => {
  const className = getElementClassName(element);
  const attrs = ` class="${className}"${element.props.isNavMenu ? ' data-lunio-nav-menu="true"' : ''}${element.props.iconName === 'Menu' ? ' data-lunio-nav-toggle="true"' : ''}`;
  const text = escapeHtml(element.props.text as string || '');
  const placeholder = escapeHtml(element.props.placeholder as string || '');
  const href = escapeHtml(element.props.href as string || '#');
  const src = escapeHtml(element.props.src as string || '');
  const alt = escapeHtml(element.props.alt as string || '');
  const iconName = escapeHtml(element.props.iconName as string || '★');
  const inputType = escapeHtml(element.props.type as string || 'text');

  const renderChildren = (): string => {
    return element.children.map(child => renderElementToHtml(child, breakpoint)).join('');
  };

  if (element.type === 'section') {
    return renderSectionElement({ attrs, children: renderChildren() });
  }

  switch (element.type) {
    case 'navbar':
      return `<nav${attrs}>${renderChildren()}</nav>`;
    case 'tabs':
      return renderTabsExport(element, 0, 'html', tab => tab.children.map(child => renderElementToHtml(child, breakpoint)).join(''), breakpoint);
    case 'form':
      return `<form${attrs}>${renderChildren()}</form>`;
    case 'list':
      return `<ul${attrs}>${renderChildren()}</ul>`;
    case 'columns':
    case 'grid':
    case 'hero':
    case 'card':
    case 'body':
      return `<div${attrs}>${renderChildren()}</div>`;
    case 'div':
      return `<div${attrs}>${renderChildren()}</div>`;
    case 'heading': {
      const level = element.props.level || 1;
      const tag = `h${Math.min(Math.max(level, 1), 6)}`;
      return `<${tag}${attrs}>${text}</${tag}>`;
    }
    case 'paragraph':
      return `<p${attrs}>${text}</p>`;
    case 'button':
      return element.props.href
        ? `<a href="${href}"${attrs}>${text}</a>`
        : `<button type="button"${attrs}>${text}</button>`;
    case 'link':
      return `<a href="${href}"${attrs}>${text}</a>`;
    case 'image':
      return `<img src="${src}" alt="${alt}"${attrs} />`;
    case 'video':
      return `<video controls src="${src}"${attrs}></video>`;
    case 'divider':
      return `<hr${attrs} />`;
    case 'spacer':
      return `<div${attrs}></div>`;
    case 'input':
      return `<input type="${inputType}" placeholder="${placeholder}"${attrs} />`;
    case 'textarea':
      return `<textarea placeholder="${placeholder}"${attrs}></textarea>`;
    case 'icon':
      return element.props.iconName === 'Menu'
        ? `<button type="button" aria-label="Toggle navigation menu"${attrs}>${iconName}</button>`
        : `<span${attrs}>${iconName}</span>`;
    case 'listItem':
      return `<li${attrs}>${text}</li>`;
    case 'iframe':
      return `<iframe src="${src}"${attrs}></iframe>`;
    case 'calendar':
      return `<div${attrs}><div style="padding:24px;background-color:#ffffff;color:#172033;border-radius:8px;font-family:inherit">${escapeHtml(String(element.props.title || 'Calendar'))}</div></div>`;
    case 'table': {
      const fields = getTableFields(element);
      const rows = getTableRows(element);
      const emptyMessage = escapeHtml(String(element.props.emptyMessage || 'No records yet.'));
      return `<div${attrs} style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;text-align:left"><thead><tr>${fields.map(field => `<th style="padding:12px;border-bottom:2px solid #e2e8f0;font-size:12px;text-transform:uppercase;color:#64748b">${escapeHtml(field)}</th>`).join('')}</tr></thead><tbody>${rows.length > 0 ? rows.map(row => `<tr>${fields.map(field => `<td style="padding:12px;border-bottom:1px solid #e2e8f0">${escapeHtml(String(row[field] ?? ''))}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${Math.max(fields.length, 1)}" style="padding:20px;color:#64748b">${emptyMessage}</td></tr>`}</tbody></table></div>`;
    }
    case 'custom':
      return `<div${attrs}>${getCustomCodeMarkup(element)}</div>`;
    default:
      return `<div${attrs}>${renderChildren()}</div>`;
  }
};

const toPascalCase = (text: string): string => {
  const words = String(text || '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const pascal = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).replace(/[^a-zA-Z0-9]/g, ''))
    .join('');

  return pascal || 'Component';
};

const toSafeFileName = (text: string): string => {
  const fileName = String(text || '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();
  return fileName || 'page';
};

const getUniqueName = (baseName: string, usedNames: Set<string>): string => {
  let nextName = baseName;
  let counter = 1;
  while (usedNames.has(nextName)) {
    nextName = `${baseName}${counter}`;
    counter += 1;
  }
  usedNames.add(nextName);
  return nextName;
};

export const sanitizeComponentName = (name: string): string => {
  return getUniqueName(toPascalCase(name), new Set());
};

export const getComponentElements = (pages: Page[]): BuilderElement[] => {
  const components: BuilderElement[] = [];

  const walk = (elements: BuilderElement[]) => {
    for (const element of elements) {
      if (element.isComponent) {
        components.push(element);
      }
      if (element.children.length > 0) {
        walk(element.children);
      }
    }
  };

  pages.forEach(page => walk(page.elements));
  return components;
};

export const renderElementToReactWithComponents = (
  element: BuilderElement,
  componentMap: Map<string, string>,
  indent = 2,
  skipComponentTag = false,
  breakpoint: Breakpoint = 'desktop'
): string => {
  const indentation = ' '.repeat(indent);

  if (!skipComponentTag && element.isComponent && componentMap.has(element.id)) {
    return `${indentation}<${componentMap.get(element.id)} />`;
  }

  const className = getElementClassName(element);
  const attrs = ` className="${className}"${element.props.isNavMenu ? ' data-lunio-nav-menu="true"' : ''}${element.props.iconName === 'Menu' ? ' data-lunio-nav-toggle="true"' : ''}`;
  const text = escapeHtml(element.props.text as string || '');
  const placeholder = escapeJsxString(element.props.placeholder as string || '');
  const href = escapeJsxString(element.props.href as string || '#');
  const src = escapeJsxString(element.props.src as string || '');
  const alt = escapeJsxString(element.props.alt as string || '');
  const iconName = escapeHtml(element.props.iconName as string || '★');
  const inputType = escapeJsxString(element.props.type as string || 'text');

  const renderChildren = (): string => {
    const childStrings = element.children.map(child => renderElementToReactWithComponents(child, componentMap, indent + 2, false, breakpoint));
    return childStrings.length ? `\n${childStrings.join('\n')}\n${indentation}` : '';
  };

  const children = renderChildren();

  if (element.type === 'section') {
    return renderSectionElement({ indent, attrs, children });
  }

  switch (element.type) {
    case 'navbar':
      return `${indentation}<nav${attrs}>${children}</nav>`;
    case 'tabs':
      return renderTabsExport(element, indent, 'jsx', (tab, childIndent) => tab.children.map(child => renderElementToReactWithComponents(child, componentMap, childIndent, false, breakpoint)).join('\n'), breakpoint);
    case 'form':
      return `${indentation}<form${attrs}>${children}</form>`;
    case 'list':
      return `${indentation}<ul${attrs}>${children}</ul>`;
    case 'columns':
    case 'grid':
    case 'hero':
    case 'card':
    case 'body':
    case 'div':
      return `${indentation}<div${attrs}>${children}</div>`;
    case 'heading': {
      const level = element.props.level || 1;
      const tag = `h${Math.min(Math.max(level, 1), 6)}`;
      return `${indentation}<${tag}${attrs}>${text}</${tag}>`;
    }
    case 'paragraph':
      return `${indentation}<p${attrs}>${text}</p>`;
    case 'button':
      return element.props.href
        ? `${indentation}<a href="${href}"${attrs}>${text}</a>`
        : `${indentation}<button type="button"${attrs}>${text}</button>`;
    case 'link':
      return `${indentation}<a href="${href}"${attrs}>${text}</a>`;
    case 'image':
      return `${indentation}<img src="${src}" alt="${alt}"${attrs} />`;
    case 'video':
      return `${indentation}<video controls src="${src}"${attrs}></video>`;
    case 'divider':
      return `${indentation}<hr${attrs} />`;
    case 'spacer':
      return `${indentation}<div${attrs}></div>`;
    case 'input':
      return `${indentation}<input type="${inputType}" placeholder="${placeholder}"${attrs} />`;
    case 'textarea':
      return `${indentation}<textarea placeholder="${placeholder}"${attrs}></textarea>`;
    case 'icon':
      return element.props.iconName === 'Menu'
        ? `${indentation}<button type="button" aria-label="Toggle navigation menu"${attrs} onClick={(event) => { const menu = event.currentTarget.closest('nav')?.querySelector('[data-lunio-nav-menu]'); menu?.classList.toggle('lunio-nav-open'); }}>${iconName}</button>`
        : `${indentation}<span${attrs}>${iconName}</span>`;
    case 'listItem':
      return `${indentation}<li${attrs}>${text}</li>`;
    case 'iframe':
      return `${indentation}<iframe src="${src}"${attrs}></iframe>`;
    case 'calendar':
      return `${indentation}<div${attrs}><div style={{ padding: '24px', backgroundColor: '#ffffff', color: '#172033', borderRadius: '8px', fontFamily: 'inherit' }}>${escapeHtml(String(element.props.title || 'Calendar'))}</div></div>`;
    case 'custom':
      return `${indentation}<iframe srcDoc={'${escapeJsxString(getCustomCodeDocument(element))}'}${attrs} title="Custom code"></iframe>`;
    default:
      return `${indentation}<div${attrs}>${children}</div>`;
  }
};

export const collectReactComponentDependencies = (
  element: BuilderElement,
  componentMap: Map<string, string>,
  dependencies = new Set<string>()
): Set<string> => {
  if (element.isComponent && componentMap.has(element.id)) {
    dependencies.add(componentMap.get(element.id)!);
    return dependencies;
  }

  for (const child of element.children) {
    collectReactComponentDependencies(child, componentMap, dependencies);
  }
  return dependencies;
};

export const collectReactDependenciesForPage = (
  page: Page,
  componentMap: Map<string, string>
): Set<string> => {
  const dependencies = new Set<string>();
  page.elements.forEach(element => collectReactComponentDependencies(element, componentMap, dependencies));
  return dependencies;
};

export const collectReactDependenciesForComponent = (
  component: BuilderElement,
  componentMap: Map<string, string>
): Set<string> => {
  const dependencies = new Set<string>();
  component.children.forEach(child => collectReactComponentDependencies(child, componentMap, dependencies));
  dependencies.delete(componentMap.get(component.id)!);
  return dependencies;
};

export const getPageComponentName = (page: Page, usedNames: Set<string>) => {
  return getUniqueName(toPascalCase(page.name || page.slug || 'Page'), usedNames);
};

export const getPageFileName = (page: Page, usedFiles: Set<string>) => {
  const baseName = toSafeFileName(page.name || page.slug || 'page');
  let nextName = baseName;
  let counter = 1;
  while (usedFiles.has(nextName)) {
    nextName = `${baseName}-${counter}`;
    counter += 1;
  }
  usedFiles.add(nextName);
  return nextName;
};

export const generateReactProjectFiles = (pages: Page[], projectName: string, breakpoint: Breakpoint = 'desktop') => {
  const toPascalCaseName = (value: string) => {
    const words = value
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const pascal = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).replace(/[^a-zA-Z0-9]/g, '')).join('');
    return pascal || 'Component';
  };

  const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'luniobuilder-export';
  const packageJson = {
    name: projectSlug,
    version: '0.1.0',
    private: true,
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'react-scripts': '^5.0.1',
    },
    scripts: {
      start: 'react-scripts start',
      build: 'react-scripts build',
      test: 'react-scripts test',
      eject: 'react-scripts eject',
    },
  };

  const componentElements = getComponentElements(pages);
  const componentNameMap = new Map<string, string>();
  const componentNameSet = new Set<string>();

  componentElements.forEach(component => {
    const baseName = toPascalCaseName(component.componentName || component.name || 'Component');
    let nextName = baseName;
    let counter = 1;
    while (componentNameSet.has(nextName)) {
      nextName = `${baseName}${counter}`;
      counter += 1;
    }
    componentNameSet.add(nextName);
    componentNameMap.set(component.id, nextName);
  });

  const pageNameSet = new Set<string>();
  const pageFileSet = new Set<string>();
  const pageMetadata = pages.map(pageItem => ({
    page: pageItem,
    componentName: getPageComponentName(pageItem, pageNameSet),
    fileName: getPageFileName(pageItem, pageFileSet),
  }));
  const googleFontLinks = getGoogleFontStylesheetUrls(pages).map(url => `  <link rel="stylesheet" href="${url}" />`).join('\n');

  const files: Array<{ path: string; content: string }> = [
    { path: 'package.json', content: JSON.stringify(packageJson, null, 2) },
    { path: '.gitignore', content: 'node_modules\n/build\n.DS_Store\n' },
    { path: 'README.md', content: `# ${projectName}\n\nGenerated by LUNIO Builder. Run \`npm install\` and \`npm start\` to begin.` },
    { path: 'public/index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${projectName}</title>\n${googleFontLinks}\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>` },
    {
      path: 'public/manifest.json', content: JSON.stringify({
        short_name: projectName,
        name: projectName,
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [],
      }, null, 2)
    },
    { path: 'public/robots.txt', content: 'User-agent: *\nDisallow:' },
    { path: 'src/index.js', content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);` },
  ];

  const appImports = pageMetadata.map(meta => `import ${meta.componentName} from './pages/${meta.fileName}';`).join('\n');
  const pageEntries = pageMetadata.map(meta => `  { title: '${meta.page.name.replace(/'/g, "\\'")}', Component: ${meta.componentName} }`).join(',\n');

  const appSource = `import React, { useState } from 'react';\n${appImports}\nimport './App.css';
import './builder.css';\n\nconst pages = [\n${pageEntries}\n];\n\nconst App = () => {\n  const [currentIndex, setCurrentIndex] = useState(0);\n  const ActivePage = pages[currentIndex].Component;\n\n  return (\n    <div className="app-shell">\n      ${pageMetadata.length > 1 ? `\n      <div className="page-selector">\n${pageMetadata.map((meta, index) => `        <button type="button" className={currentIndex === ${index} ? 'active' : ''} onClick={() => setCurrentIndex(${index})}>${meta.page.name.replace(/'/g, "\\'")}</button>`).join('\n')}\n      </div>\n      ` : ''}\n      <main className="page-view">\n        <ActivePage />\n      </main>\n    </div>\n  );\n};\n\nexport default App;`;

  files.push({ path: 'src/App.jsx', content: appSource });
  files.push({ path: 'src/App.css', content: `body { margin: 0; font-family: system-ui, sans-serif; background: #ffffff; color: #111827; }\n.app-shell { min-height: 100vh; background: #ffffff; }\n.page-selector { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px; background: transparent; }\n.page-selector button { border: none; padding: 10px 14px; background: #e5e7eb; color: #111827; border-radius: 9999px; cursor: pointer; }\n.page-selector button.active { background: #2563eb; color: #ffffff; }\n.page-view { padding: 0; }\n.lunio-nav-open { display: flex !important; }` });
  files.push({ path: 'src/builder.css', content: `${pages.map(page => generateCssForPage(page)).filter(Boolean).join('\n\n')}` });
  files.push({ path: 'src/index.css', content: `* { box-sizing: border-box; }\nbody { margin: 0; background: #f8fafc; color: #111827; }\nimg { max-width: 100%; display: block; }` });
  files.push({ path: 'src/reportWebVitals.js', content: `const reportWebVitals = onPerfEntry => {\n  if (onPerfEntry && onPerfEntry instanceof Function) {\n    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {\n      getCLS(onPerfEntry);\n      getFID(onPerfEntry);\n      getFCP(onPerfEntry);\n      getLCP(onPerfEntry);\n      getTTFB(onPerfEntry);\n    });\n  }\n};\nexport default reportWebVitals;` });
  files.push({ path: 'src/setupTests.js', content: `// jest-dom adds custom jest matchers for asserting on DOM nodes.\n// allows you to do things like:\n// expect(element).toHaveTextContent(/react/i)\n// learn more: https://github.com/testing-library/jest-dom\nimport '@testing-library/jest-dom';` });

  const componentFolderFiles = new Set<string>();
  componentElements.forEach(component => {
    const componentName = componentNameMap.get(component.id)!;
    const componentDependencies = Array.from(collectReactDependenciesForComponent(component, componentNameMap));
    const componentImports = componentDependencies.map(dep => `import ${dep} from './${dep}';`).join('\n');
    const componentBody = renderElementToReactWithComponents(component, componentNameMap, 2, true, breakpoint);
    const componentSource = `${componentImports ? `${componentImports}\n\n` : ''}import React from 'react';\n\nconst ${componentName} = () => (\n${componentBody}\n);\n\nexport default ${componentName};`;
    const componentPath = `src/components/${componentName}.jsx`;
    if (!componentFolderFiles.has(componentPath)) {
      componentFolderFiles.add(componentPath);
      files.push({ path: componentPath, content: componentSource });
    }
  });

  pageMetadata.forEach(meta => {
    const pageDependencies = Array.from(collectReactDependenciesForPage(meta.page, componentNameMap));
    const pageImports = pageDependencies.map(dep => `import ${dep} from '../components/${dep}';`).join('\n');
    const pageBody = meta.page.elements.length
      ? meta.page.elements.map(element => renderElementToReactWithComponents(element, componentNameMap, 2, false, breakpoint)).join('\n')
      : `  <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif', color: '#4b5563' }}>No content to export.</div>`;
    const pageSource = `${pageImports ? `${pageImports}\n\n` : ''}import React from 'react';\n\nconst ${meta.componentName} = () => (\n  <>\n${pageBody}\n  </>\n);\n\nexport default ${meta.componentName};`;
    files.push({ path: `src/pages/${meta.fileName}.jsx`, content: pageSource });
  });

  return files;
};

export const generateNextProjectFiles = (
  pages: Page[],
  projectName: string,
  breakpoint: Breakpoint = 'desktop',
  showWatermark = true,
) => {
  const toPascalCaseName = (value: string) => {
    const words = value
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const pascal = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).replace(/[^a-zA-Z0-9]/g, '')).join('');
    return pascal || 'Component';
  };

  const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'luniobuilder-export';
  const packageJson = {
    name: projectSlug,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
    },
    dependencies: {
      next: '^14.2.5',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
  };

  const componentElements = getComponentElements(pages);
  const componentNameMap = new Map<string, string>();
  const componentNameSet = new Set<string>();

  componentElements.forEach(component => {
    const baseName = toPascalCaseName(component.componentName || component.name || 'Component');
    let nextName = baseName;
    let counter = 1;
    while (componentNameSet.has(nextName)) {
      nextName = `${baseName}${counter}`;
      counter += 1;
    }
    componentNameSet.add(nextName);
    componentNameMap.set(component.id, nextName);
  });

  const pageNameSet = new Set<string>();
  const pageFileSet = new Set<string>();
  const pageMetadata = pages.map(pageItem => ({
    page: pageItem,
    componentName: getPageComponentName(pageItem, pageNameSet),
    fileName: getPageFileName(pageItem, pageFileSet),
  }));
  const googleFontImports = getGoogleFontStylesheetUrls(pages).map(url => `@import url("${url}");`).join('\n');

  const files: Array<{ path: string; content: string }> = [
    { path: 'package.json', content: JSON.stringify(packageJson, null, 2) },
    { path: '.gitignore', content: 'node_modules\n.out\n.next\n.DS_Store\n' },
    { path: 'README.md', content: `# ${projectName}\n\nGenerated by LUNIO Builder. Run \`npm install\` and \`npm run dev\` to begin.` },
    { path: 'next.config.js', content: `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  reactStrictMode: true,\n};\n\nexport default nextConfig;\n` },
    { path: 'public/robots.txt', content: 'User-agent: *\nDisallow:' },
    { path: 'app/layout.js', content: `import './globals.css';\n\nexport const metadata = { title: '${projectName}', description: '${projectName}' };\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <body>{children}${showWatermark ? `\n        <a className="lunio-watermark" href="https://www.luniobuilder.com" target="_blank" rel="noopener noreferrer">Built with LUNIO Builder</a>` : ''}\n      </body>\n    </html>\n  );\n}\n` },
  ];

  const pageImports = pageMetadata.map(meta => `import ${meta.componentName} from '../components/${meta.fileName}';`).join('\n');
  const pageEntries = pageMetadata
    .filter(meta => meta.page.slug && meta.page.slug !== '/')
    .map(meta => `  { slug: '${(meta.page.slug || '').replace(/'/g, "\\'")}', title: '${meta.page.name.replace(/'/g, "\\'")}', Component: ${meta.componentName} }`)
    .join(',\n');

  // Create root page (home)
  const homePage = pageMetadata[0];
  const rootPageSource = `${pageMetadata.map(m => `import ${m.componentName} from '../components/${m.fileName}';`).join('\n')}\n\nexport default function Page() {\n  const Component = ${homePage.componentName};\n  return <Component />;\n}\n`;
  files.push({ path: 'app/page.js', content: rootPageSource });

  // Create dynamic route for other pages
  const dynamicRouteSource = `\nimport { notFound } from 'next/navigation';\n${pageMetadata
    .filter(meta => meta.page.slug && meta.page.slug !== '/')
    .map(m => `import ${m.componentName} from '../../components/${m.fileName}';`).join('\n')}\n\nconst pages = [\n${pageEntries}\n];\n\nexport async function generateStaticParams() {\n  return pages.map(page => ({\n    slug: page.slug.replace(/^\\//, ''),\n  }));\n}\n\nexport default function Page({ params }) {\n  const slug = '/' + (params.slug || '');\n  const page = pages.find(p => p.slug === slug || p.slug === slug.replace(/^\\//, ''));\n  \n  if (!page) {\n    notFound();\n  }\n  \n  return <page.Component />;\n}\n`;
  files.push({ path: 'app/[slug]/page.js', content: dynamicRouteSource });

  const watermarkCss = showWatermark ? `.lunio-watermark { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; padding: 8px 12px; border: 1px solid rgba(148,163,184,.35); border-radius: 6px; background: rgba(15,23,42,.92); color: #f8fafc; font: 600 12px/1.2 system-ui, sans-serif; text-decoration: none; box-shadow: 0 4px 14px rgba(15,23,42,.2); }\n.lunio-watermark:hover { background: #2563eb; }\n` : '';
  const globalsCss = `* { box-sizing: border-box; }\nbody { margin: 0; min-height: 100vh; background: #f8fafc; color: #111827; font-family: system-ui, sans-serif; }\nimg { max-width: 100%; display: block; }\n.app-shell { min-height: 100vh; }\n.page-selector { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px; background: transparent; }\n.page-selector button { border: none; padding: 10px 14px; background: #e5e7eb; color: #111827; border-radius: 9999px; cursor: pointer; }\n.page-selector button.active { background: #2563eb; color: #ffffff; }\n.page-view { padding: 0; }\n.lunio-nav-open { display: flex !important; }\n${watermarkCss}`;
  const builderCss = `${pages.map(page => generateCssForPage(page)).filter(Boolean).join('\n\n')}`;
  files.push({ path: 'app/globals.css', content: `${googleFontImports}\n${globalsCss}\n${builderCss}` });

  const componentFolderFiles = new Set<string>();
  componentElements.forEach(component => {
    const componentName = componentNameMap.get(component.id)!;
    const componentDependencies = Array.from(collectReactDependenciesForComponent(component, componentNameMap));
    const componentImports = componentDependencies.map(dep => `import ${dep} from './${dep}';`).join('\n');
    const componentBody = renderElementToReactWithComponents(component, componentNameMap, 2, true, breakpoint);
    const componentSource = `'use client';\n\n${componentImports ? `${componentImports}\n\n` : ''}export default function ${componentName}() {\n  return (\n${componentBody}\n  );\n}\n`;
    const componentPath = `components/${componentName}.jsx`;
    if (!componentFolderFiles.has(componentPath)) {
      componentFolderFiles.add(componentPath);
      files.push({ path: componentPath, content: componentSource });
    }
  });

  pageMetadata.forEach(meta => {
    const pageDependencies = Array.from(collectReactDependenciesForPage(meta.page, componentNameMap));
    const pageImports = pageDependencies.map(dep => `import ${dep} from '../components/${dep}';`).join('\n');
    const pageBody = meta.page.elements.length
      ? meta.page.elements.map(element => renderElementToReactWithComponents(element, componentNameMap, 2, false, breakpoint)).join('\n')
      : `  <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif', color: '#4b5563' }}>No content to export.</div>`;
    const pageSource = `'use client';\n\n${pageImports ? `${pageImports}\n\n` : ''}export default function ${meta.componentName}() {\n  return (\n    <>\n${pageBody}\n    </>\n  );\n}\n`;
    files.push({ path: `components/${meta.fileName}.jsx`, content: pageSource });
  });

  return files;
};
export const canHaveChildren = (type: ElementType): boolean => {
  return ['body', 'section', 'div', 'navbar', 'tabs', 'tab', 'hero', 'slider', 'slide', 'card', 'grid', 'columns', 'form', 'list', 'cmsMap'].includes(type);
};

export const COMPONENT_CATEGORIES = {
  Layout: ['section', 'div', 'hero', 'slider', 'tabs', 'navbar', 'columns', 'grid', 'card', 'custom'],
  Typography: ['heading', 'paragraph', 'link', 'list', 'listItem'],
  CMS: ['cmsMap', 'table'],
  Media: ['image', 'video', 'icon', 'iframe', 'calendar'],
  Forms: ['form', 'input', 'textarea', 'button', 'select'],
  Misc: ['divider', 'spacer'],
} as const;

export const COMPONENT_LABELS: Record<ElementType, string> = {
  article: 'Article',
  body: 'Body',
  section: 'Section',
  div: 'Container',
  heading: 'Heading',
  paragraph: 'Paragraph',
  button: 'Button',
  select: 'Select',
  option: 'Option',
  image: 'Image',
  link: 'Link',
  navbar: 'Navbar',
  tabs: 'Tabs',
  tab: 'Tab',
  hero: 'Hero',
  slider: 'Slider',
  slide: 'Slide',
  sliderArrow: 'Slider Arrow',
  sliderPagination: 'Slider Pagination',
  card: 'Card',
  grid: 'Grid',
  columns: 'Columns',
  form: 'Form',
  input: 'Input',
  textarea: 'Textarea',
  video: 'Video',
  divider: 'Divider',
  spacer: 'Spacer',
  icon: 'Icon',
  list: 'List',
  listItem: 'List Item',
  iframe: 'Iframe',
  calendar: 'Calendar',
  table: 'CMS Table',
  cmsMap: 'CMS Map',
  custom: 'Custom Code',
};

export { emptyStyles };
