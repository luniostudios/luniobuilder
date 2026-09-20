import { create } from 'zustand';
import { BuilderState, BuilderElement, Page, ElementType, StyleProperties, Breakpoint, ElementProps, PseudoClassStyles } from '../types/builder';
import { generateId, createDefaultElement, deepClone } from '../utils/builderUtils';
import { createStarterPage } from '../utils/starterTemplate';
import { htmlToBuilderElements, htmlToBuilderPages } from '../utils/htmlToBuilder';

interface BuilderStore extends BuilderState {
  // Auth/project tracking
  projectId: string | null;
  projectName: string | null;
  setProjectId: (id: string | null) => void;
  setProjectName: (name: string | null) => void;
  loadProject: (projectId: string | null, pages: Page[], currentPageId: string, projectName?: string) => void;

  // Element selection
  selectElement: (id: string | null) => void;
  hoverElement: (id: string | null) => void;

  // Drag and drop
  setDraggedElementType: (type: ElementType | null) => void;
  setDraggedElementId: (id: string | null) => void;
  setDropTarget: (id: string | null, position: 'before' | 'after' | 'inside' | null) => void;

  // Element manipulation
  addElement: (type: ElementType, parentId: string | null, index?: number) => string;
  addElementFromPalette: (type: ElementType, targetId: string, position: 'before' | 'after' | 'inside') => void;
  addComponentFromPalette: (componentId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  moveElement: (elementId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  updateElementProps: (id: string, props: Partial<ElementProps>) => void;
  updateElementStyles: (id: string, styles: Partial<StyleProperties>) => void;
  updateElementPseudoClassStyles: (id: string, pseudoClass: keyof PseudoClassStyles, breakpoint: Breakpoint, styles: Partial<StyleProperties>) => void;
  updateElementName: (id: string, name: string) => void;
  convertElementToLink: (id: string) => void;
  toggleElementLock: (id: string) => void;
  toggleElementVisibility: (id: string) => void;
  toggleElementComponent: (id: string) => void;

  // Page management
  addPage: () => void;
  deletePage: (id: string) => void;
  setCurrentPage: (id: string) => void;
  updatePageSeo: (id: string, seo: Partial<Page['seo']>) => void;
  updatePageName: (id: string, name: string) => void;
  updatePageSlug: (id: string, slug: string) => void;
  updatePagePassword: (id: string, passwordProtected: boolean, password: string) => void;
  updatePageCmsDetail: (id: string, settings: Partial<NonNullable<Page['cmsDetail']>>) => void;

  // UI state
  setBreakpoint: (breakpoint: Breakpoint) => void;
  setCanvasScale: (scale: number) => void;
  setLeftPanelTab: (tab: BuilderState['leftPanelTab']) => void;
  setRightPanelTab: (tab: BuilderState['rightPanelTab']) => void;
  setPreviewMode: (isPreview: boolean) => void;
  setPseudoClassState: (state: 'base' | 'hover' | 'active' | 'focus') => void;

  // History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // AI Generation
  addGeneratedElements: (html: string, parentId: string | null) => void;
  addGeneratedPages: (html: string) => void;
  replaceElementWithGenerated: (id: string, html: string) => void;

  // Helpers
  getCurrentPage: () => Page;
  getElementById: (id: string) => BuilderElement | null;
}

const defaultPage: Page = {
  id: 'page-1',
  name: 'Home',
  slug: '/',
  elements: [],
  seo: {
    title: 'My Website',
    description: '',
    keywords: '',
  },
  cmsDetail: { enabled: false, collectionId: '', slugField: 'slug' },
};

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  pages: [defaultPage],
  projectId: null,
  projectName: null,
  currentPageId: 'page-1',
  selectedElementId: null,
  hoveredElementId: null,
  draggedElementType: null,
  draggedElementId: null,
  dropTargetId: null,
  dropPosition: null,
  breakpoint: 'desktop',
  canvasScale: 0.80,
  leftPanelTab: 'components',
  rightPanelTab: 'style',
  pseudoClassState: 'base',
  history: [[defaultPage]],
  historyIndex: 0,
  isPreviewMode: false,

  setProjectId: (id) => set({ projectId: id }),
  setProjectName: (name) => set({ projectName: name }),
  loadProject: (projectId, pages, currentPageId, projectName) => set({
    projectId,
    projectName,
    pages,
    currentPageId,
    selectedElementId: null,
    hoveredElementId: null,
    history: [deepClone(pages)],
    historyIndex: 0,
    isPreviewMode: false,
  }),

  selectElement: (id) => set({ selectedElementId: id, pseudoClassState: 'base' }),
  hoverElement: (id) => set({ hoveredElementId: id }),

  setDraggedElementType: (type) => set({ draggedElementType: type, draggedElementId: null }),
  setDraggedElementId: (id) => set({ draggedElementId: id, draggedElementType: null }),
  setDropTarget: (id, position) => set({ dropTargetId: id, dropPosition: position }),

  getCurrentPage: () => {
    const { pages, currentPageId } = get();
    return pages.find(p => p.id === currentPageId) || pages[0];
  },

  getElementById: (id) => {
    const page = get().getCurrentPage();
    const findEl = (elements: BuilderElement[]): BuilderElement | null => {
      for (const el of elements) {
        if (el.id === id) return el;
        const found = findEl(el.children);
        if (found) return found;
      }
      return null;
    };
    return findEl(page.elements);
  },

  addElement: (type, parentId, index) => {
    const id = generateId();
    const newElement = createDefaultElement(type, id, parentId);

    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === state.currentPageId)!;

      if (parentId === null) {
        if (index !== undefined) {
          page.elements.splice(index, 0, newElement);
        } else {
          page.elements.push(newElement);
        }
      } else {
        const insertInto = (elements: BuilderElement[]): boolean => {
          for (const el of elements) {
            if (el.id === parentId) {
              if (index !== undefined) {
                el.children.splice(index, 0, newElement);
              } else {
                el.children.push(newElement);
              }
              return true;
            }
            if (insertInto(el.children)) return true;
          }
          return false;
        };
        insertInto(page.elements);
      }

      return { pages };
    });

    get().pushHistory();
    return id;
  },

  addElementFromPalette: (type, targetId, position) => {
    const id = generateId();
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === state.currentPageId)!;
      const insertPosition = position;

      const findAndInsert = (elements: BuilderElement[], parentId: string | null): boolean => {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].id === targetId) {
            if (insertPosition === 'inside') {
              const newEl = createDefaultElement(type, id, targetId);
              elements[i].children.push(newEl);
            } else {
              const newEl = createDefaultElement(type, id, parentId);
              const insertIdx = insertPosition === 'after' ? i + 1 : i;
              elements.splice(insertIdx, 0, newEl);
            }
            return true;
          }
          if (findAndInsert(elements[i].children, elements[i].id)) return true;
        }
        return false;
      };

      if (targetId === 'canvas-root') {
        const newEl = createDefaultElement(type, id, null);
        page.elements.push(newEl);
      } else {
        findAndInsert(page.elements, null);
      }

      return { pages, selectedElementId: id };
    });

    get().pushHistory();
  },

  addComponentFromPalette: (componentId, targetId, position) => {
    set(state => {
      const pages = deepClone(state.pages);
      const findElement = (elements: BuilderElement[]): BuilderElement | null => {
        for (const element of elements) {
          if (element.id === componentId) return element;
          const nested = findElement(element.children);
          if (nested) return nested;
        }
        return null;
      };
      const source = pages.map(page => findElement(page.elements)).find(Boolean);
      if (!source) return state;

      const cloneElement = (element: BuilderElement, parentId: string | null): BuilderElement => {
        const clone = deepClone(element);
        clone.id = generateId();
        clone.parentId = parentId;
        clone.isComponent = false;
        clone.componentName = undefined;
        clone.children = clone.children.map(child => cloneElement(child, clone.id));
        return clone;
      };

      const page = pages.find(candidate => candidate.id === state.currentPageId)!;
      const cloned = cloneElement(source, null);
      const findAndInsert = (elements: BuilderElement[], parentId: string | null): boolean => {
        for (let index = 0; index < elements.length; index += 1) {
          if (elements[index].id === targetId) {
            if (position === 'inside') {
              cloned.parentId = targetId;
              elements[index].children.push(cloned);
            } else {
              cloned.parentId = parentId;
              elements.splice(position === 'after' ? index + 1 : index, 0, cloned);
            }
            return true;
          }
          if (findAndInsert(elements[index].children, elements[index].id)) return true;
        }
        return false;
      };

      if (targetId === 'canvas-root') page.elements.push(cloned);
      else if (!findAndInsert(page.elements, null)) return state;
      return { pages, selectedElementId: cloned.id };
    });
    get().pushHistory();
  },

  moveElement: (elementId, targetId, position) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === state.currentPageId)!;
      const findTarget = (elements: BuilderElement[]): BuilderElement | null => {
        for (const element of elements) {
          if (element.id === targetId) return element;
          const found = findTarget(element.children);
          if (found) return found;
        }
        return null;
      };
      const targetPosition = findTarget(page.elements)?.type === 'cmsMap' ? 'inside' : position;

      const removeElement = (elements: BuilderElement[]): BuilderElement | null => {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].id === elementId) {
            return elements.splice(i, 1)[0];
          }
          const removed = removeElement(elements[i].children);
          if (removed) return removed;
        }
        return null;
      };

      const movedElement = removeElement(page.elements);
      if (!movedElement) return state;

      const insertElement = (elements: BuilderElement[], parentId: string | null): boolean => {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].id === targetId) {
            if (targetPosition === 'inside') {
              movedElement.parentId = targetId;
              elements[i].children.push(movedElement);
            } else {
              movedElement.parentId = parentId;
              const insertIdx = targetPosition === 'after' ? i + 1 : i;
              elements.splice(insertIdx, 0, movedElement);
            }
            return true;
          }
          if (insertElement(elements[i].children, elements[i].id)) return true;
        }
        return false;
      };

      if (targetId === 'canvas-root') {
        movedElement.parentId = null;
        page.elements.push(movedElement);
      } else {
        insertElement(page.elements, null);
      }

      return { pages };
    });

    get().pushHistory();
  },

  deleteElement: (id) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === state.currentPageId)!;

      const removeEl = (elements: BuilderElement[]): boolean => {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].id === id) {
            elements.splice(i, 1);
            return true;
          }
          if (removeEl(elements[i].children)) return true;
        }
        return false;
      };

      removeEl(page.elements);
      return { pages, selectedElementId: state.selectedElementId === id ? null : state.selectedElementId };
    });

    get().pushHistory();
  },

  duplicateElement: (id) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === state.currentPageId)!;

      const duplicateEl = (elements: BuilderElement[]): boolean => {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].id === id) {
            const clone = deepClone(elements[i]);
            const reassignIds = (el: BuilderElement) => {
              el.id = generateId();
              el.children.forEach(reassignIds);
            };
            reassignIds(clone);
            elements.splice(i + 1, 0, clone);
            return true;
          }
          if (duplicateEl(elements[i].children)) return true;
        }
        return false;
      };

      duplicateEl(page.elements);
      return { pages };
    });

    get().pushHistory();
  },

  updateElementProps: (id, props) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === state.currentPageId)!;

      const updateEl = (elements: BuilderElement[]): boolean => {
        for (const el of elements) {
          if (el.id === id) {
            el.props = { ...el.props, ...props };
            return true;
          }
          if (updateEl(el.children)) return true;
        }
        return false;
      };

      updateEl(page.elements);
      return { pages };
    });
  },

  convertElementToLink: (id) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === state.currentPageId)!;

      const convertElement = (elements: BuilderElement[]): boolean => {
        for (const element of elements) {
          if (element.id === id) {
            const text = typeof element.props.text === 'string' && element.props.text.trim()
              ? element.props.text
              : element.name || 'Link';
            const href = typeof element.props.href === 'string' ? element.props.href : '#';
            element.type = 'link';
            element.name = 'Link';
            element.props = { ...element.props, text, href };
            return true;
          }
          if (convertElement(element.children)) return true;
        }
        return false;
      };

      convertElement(page.elements);
      return { pages };
    });

    get().pushHistory();
  },

  updateElementStyles: (id, styles) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === state.currentPageId)!;
      const bp = state.breakpoint;

      const updateEl = (elements: BuilderElement[]): boolean => {
        for (const el of elements) {
          if (el.id === id) {
            el.styles[bp] = { ...el.styles[bp], ...styles };
            return true;
          }
          if (updateEl(el.children)) return true;
        }
        return false;
      };

      updateEl(page.elements);
      return { pages };
    });
  },

  updateElementPseudoClassStyles: (id, pseudoClass, breakpoint, styles) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === state.currentPageId)!;

      const updateEl = (elements: BuilderElement[]): boolean => {
        for (const el of elements) {
          if (el.id === id) {
            if (!el.pseudoClassStyles) {
              el.pseudoClassStyles = {};
            }
            if (!el.pseudoClassStyles[pseudoClass]) {
              el.pseudoClassStyles[pseudoClass] = {
                widescreen: {},
                desktop: {},
                tablet: {},
                mobile: {},
                laptop: {},
                mobileLandscape: {},
              };
            }
            el.pseudoClassStyles[pseudoClass]![breakpoint] = {
              ...el.pseudoClassStyles[pseudoClass]![breakpoint],
              ...styles,
            };
            return true;
          }
          if (updateEl(el.children)) return true;
        }
        return false;
      };

      updateEl(page.elements);
      return { pages };
    });
  },

  updateElementName: (id, name) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === state.currentPageId)!;
      const updateEl = (elements: BuilderElement[]): boolean => {
        for (const el of elements) {
          if (el.id === id) { el.name = name; return true; }
          if (updateEl(el.children)) return true;
        }
        return false;
      };
      updateEl(page.elements);
      return { pages };
    });
  },

  toggleElementLock: (id) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === state.currentPageId)!;
      const updateEl = (elements: BuilderElement[]): boolean => {
        for (const el of elements) {
          if (el.id === id) { el.locked = !el.locked; return true; }
          if (updateEl(el.children)) return true;
        }
        return false;
      };
      updateEl(page.elements);
      return { pages };
    });
  },

  toggleElementVisibility: (id) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === state.currentPageId)!;
      const updateEl = (elements: BuilderElement[]): boolean => {
        for (const el of elements) {
          if (el.id === id) { el.hidden = !el.hidden; return true; }
          if (updateEl(el.children)) return true;
        }
        return false;
      };
      updateEl(page.elements);
      return { pages };
    });
  },

  toggleElementComponent: (id) => {
    const makeComponentName = (name: string) => {
      const words = String(name || 'Component')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const base = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).replace(/[^a-zA-Z0-9]/g, '')).join('') || 'Component';
      return base;
    };

    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === state.currentPageId)!;
      const updateEl = (elements: BuilderElement[]): boolean => {
        for (const el of elements) {
          if (el.id === id) {
            if (el.isComponent) {
              el.isComponent = false;
              el.componentName = undefined;
            } else {
              el.isComponent = true;
              el.componentName = el.componentName || makeComponentName(el.name || 'Component');
            }
            return true;
          }
          if (updateEl(el.children)) return true;
        }
        return false;
      };
      updateEl(page.elements);
      return { pages };
    });
  },

  addPage: () => {
    const id = generateId();
    const pageNum = get().pages.length + 1;
    const newPage: Page = {
      id,
      name: `Page ${pageNum}`,
      slug: `/page-${pageNum}`,
      elements: [],
      seo: { title: `Page ${pageNum}`, description: '', keywords: '' },
    };
    set(state => ({ pages: [...state.pages, newPage], currentPageId: id }));
    get().pushHistory();
  },

  deletePage: (id) => {
    const page = get().pages.find(page => page.id === id);
    if (!page || page.slug === '/') return;

    set(state => {
      if (state.pages.length <= 1) return state;
      const pages = state.pages.filter(p => p.id !== id);
      const currentPageId = state.currentPageId === id ? pages[0].id : state.currentPageId;
      return { pages, currentPageId };
    });
    get().pushHistory();
  },

  setCurrentPage: (id) => set({ currentPageId: id, selectedElementId: null, pseudoClassState: 'base' }),

  updatePageSeo: (id, seo) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === id)!;
      page.seo = { ...page.seo, ...seo };
      return { pages };
    });
  },

  updatePageName: (id, name) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(p => p.id === id)!;
      page.name = name;
      return { pages };
    });
  },

  updatePageSlug: (id, slug) => {
    const normalizedSlug = slug.trim().replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!normalizedSlug) return;

    set(state => {
      const page = state.pages.find(candidate => candidate.id === id);
      if (!page || page.slug === '/' || state.pages.some(candidate => candidate.id !== id && candidate.slug === `/${normalizedSlug}`)) {
        return state;
      }

      const pages = deepClone(state.pages);
      const pageToUpdate = pages.find(candidate => candidate.id === id)!;
      pageToUpdate.slug = `/${normalizedSlug}`;
      return { pages };
    });
  },

  updatePagePassword: (id, passwordProtected, password) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(candidate => candidate.id === id);
      if (!page) return state;
      page.passwordProtected = passwordProtected;
      page.password = passwordProtected ? password : '';
      return { pages };
    });
  },

  updatePageCmsDetail: (id, settings) => {
    set(state => {
      const pages = deepClone(state.pages);
      const page = pages.find(candidate => candidate.id === id);
      if (!page) return state;
      if (page.slug === '/') return state;
      page.cmsDetail = { enabled: false, collectionId: '', slugField: 'slug', ...page.cmsDetail, ...settings };
      return { pages };
    });
  },

  setBreakpoint: (breakpoint) => set({ breakpoint }),
  setCanvasScale: (canvasScale) => set({ canvasScale }),
  setLeftPanelTab: (leftPanelTab) => set({ leftPanelTab }),
  setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),
  setPreviewMode: (isPreviewMode) => set({ isPreviewMode, selectedElementId: null, pseudoClassState: 'base' }),
  setPseudoClassState: (pseudoClassState) => set({ pseudoClassState }),

  pushHistory: () => {
    set(state => {
      const currentPages = deepClone(state.pages);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(currentPages);
      return {
        history: newHistory.slice(-50),
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    });
  },

  undo: () => {
    set(state => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return { pages: deepClone(state.history[newIndex]), historyIndex: newIndex };
    });
  },

  redo: () => {
    set(state => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return { pages: deepClone(state.history[newIndex]), historyIndex: newIndex };
    });
  },

  addGeneratedElements: (html, parentId) => {
    try {
      // Convert HTML to builder elements
      const generatedElements = htmlToBuilderElements(html, parentId);

      set(state => {
        const pages = deepClone(state.pages);
        const page = pages.find(p => p.id === state.currentPageId)!;

        if (parentId === null) {
          // Add to root level
          page.elements.push(...generatedElements);
        } else {
          // Add inside parent
          const addInside = (elements: BuilderElement[]): boolean => {
            for (const el of elements) {
              if (el.id === parentId) {
                el.children.push(...generatedElements);
                return true;
              }
              if (addInside(el.children)) return true;
            }
            return false;
          };
          addInside(page.elements);
        }

        // Select the first generated element
        const firstId = generatedElements[0]?.id || null;
        return { pages, selectedElementId: firstId };
      });

      get().pushHistory();
    } catch (error) {
      console.error('Error adding generated elements:', error);
    }
  },

  addGeneratedPages: (html) => {
    try {
      const generatedPages = htmlToBuilderPages(html);
      if (generatedPages.length === 0) return;

      set(state => {
        const pages = deepClone(state.pages);
        const currentPage = pages.find(page => page.id === state.currentPageId) || pages[0];
        const [firstPage, ...additionalPages] = generatedPages;

        if (currentPage && currentPage.elements.length === 0 && generatedPages.length > 0) {
          currentPage.name = firstPage.name;
          currentPage.slug = firstPage.slug;
          currentPage.elements = firstPage.elements;
          additionalPages.forEach(page => pages.push({
            id: generateId(),
            name: page.name,
            slug: page.slug,
            elements: page.elements,
            seo: { title: page.name, description: '', keywords: '' },
          }));
          return { pages, selectedElementId: firstPage.elements[0]?.id || null };
        }

        generatedPages.forEach(page => pages.push({
          id: generateId(),
          name: page.name,
          slug: page.slug,
          elements: page.elements,
          seo: { title: page.name, description: '', keywords: '' },
        }));
        return { pages, selectedElementId: generatedPages[0].elements[0]?.id || null };
      });

      get().pushHistory();
    } catch (error) {
      console.error('Error adding generated pages:', error);
    }
  },

  replaceElementWithGenerated: (id, html) => {
    try {
      const generatedElements = htmlToBuilderElements(html, null);
      if (generatedElements.length === 0) return;

      const setParentIds = (elements: BuilderElement[], parentId: string | null) => {
        elements.forEach(element => {
          element.parentId = parentId;
          setParentIds(element.children, element.id);
        });
      };

      set(state => {
        const pages = deepClone(state.pages);
        const page = pages.find(currentPage => currentPage.id === state.currentPageId)!;
        const replaceIn = (elements: BuilderElement[], parentId: string | null): boolean => {
          const index = elements.findIndex(element => element.id === id);
          if (index !== -1) {
            const replacement = generatedElements.length === 1
              ? generatedElements[0]
              : {
                ...createDefaultElement('div', generateId(), parentId),
                children: generatedElements,
              };
            replacement.parentId = parentId;
            setParentIds(replacement.children, replacement.id);
            elements.splice(index, 1, replacement);
            return true;
          }
          return elements.some(element => replaceIn(element.children, element.id));
        };

        replaceIn(page.elements, null);
        return { pages, selectedElementId: generatedElements.length === 1 ? generatedElements[0].id : null };
      });
      get().pushHistory();
    } catch (error) {
      console.error('Error replacing element with generated content:', error);
    }
  },
}));
