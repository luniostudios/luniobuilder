"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid as Layout, Type, Image, MousePointer, Square, Columns2 as Columns, Grid2x2 as Grid, AlignLeft, Link, Star, Minus, Move, FileText, ChevronRight, ChevronDown, ChevronLeft, Eye, EyeOff, Lock, Unlock, Trash2, Copy, Plus, Layers, Package, Globe, Monitor, Play, Form, List, ListEnd, Laptop, CalendarDays, LayoutIcon, LayoutPanelTop, IdCard, TextInitialIcon, Code2, ChevronsDownUp, Table2, ListTree, Database, ExternalLink, Search, Blocks } from 'lucide-react';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilderStore } from '../../stores/builderStore';
import { ElementType, BuilderElement, Page } from '../../types/builder';
import { COMPONENT_CATEGORIES, COMPONENT_LABELS, getComponentElements } from '../../utils/builderUtils';
import type { CmsCollection, CmsRecord } from '../../types/cms';

const COMPONENT_ICONS: Record<string, React.ReactNode> = {
  section: <Layout size={25} />,
  div: <Square size={25} />,
  heading: <Type size={25} />,
  paragraph: <TextInitialIcon size={25} />,
  button: <MousePointer size={25} />,
  image: <Image size={25} />,
  link: <Link size={25} />,
  navbar: <LayoutPanelTop size={25} />,
  hero: <LayoutIcon size={25} />,
  card: <IdCard size={25} />,
  grid: <Grid size={25} />,
  columns: <Columns size={25} />,
  form: <Form size={25} />,
  input: <FileText size={25} />,
  textarea: <AlignLeft size={25} />,
  video: <Play size={25} />,
  divider: <Minus size={25} />,
  spacer: <Move size={25} />,
  icon: <Star size={25} />,
  list: <List size={25} />,
  listItem: <ListEnd size={25} />,
  iframe: <Laptop size={25} />,
  calendar: <CalendarDays size={25} />,
  table: <Table2 size={25} />,
  cmsMap: <ListTree size={25} />,
  custom: <Code2 size={25} />,
};

export const LeftPanel: React.FC = () => {
  const { leftPanelTab, setLeftPanelTab } = useBuilderStore();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const tabs = [
    { id: 'components' as const, label: 'Elements', icon: <Package size={17} /> },
    { id: 'library' as const, label: 'Components', icon: <Blocks size={17} /> },
    { id: 'layers' as const, label: 'Layers', icon: <Layers size={17} /> },
    { id: 'pages' as const, label: 'Pages', icon: <Globe size={17} /> },
    { id: 'cms' as const, label: 'CMS', icon: <Database size={17} /> },
  ];

  return (
    <div className={`max-md:hidden flex h-full shrink-0 border-r border-gray-800 bg-[#111114] transition-[width] duration-200 ${isCollapsed ? 'w-13' : 'w-72'}`}>
      <div className="flex w-13 shrink-0 flex-col items-center border-r border-gray-800 bg-[#0d0f12] py-2">
        <div className="flex flex-col items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (!isCollapsed && leftPanelTab === tab.id) {
                  setIsCollapsed(true);
                  return;
                }
                setLeftPanelTab(tab.id);
                setIsCollapsed(false);
              }}
              aria-label={tab.label}
              aria-pressed={leftPanelTab === tab.id && !isCollapsed}
              title={tab.label}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${leftPanelTab === tab.id && !isCollapsed
                ? 'bg-blue-500/15 text-blue-300'
                : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'
                }`}
            >
              {tab.icon}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(current => !current)}
          aria-label={isCollapsed ? 'Open left panel' : 'Collapse left panel'}
          title={isCollapsed ? 'Open panel' : 'Collapse panel'}
          className="mt-auto flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-200"
        >
          {isCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>

      <div className={`min-w-0 flex-1 overflow-hidden ${isCollapsed ? 'hidden' : 'flex flex-col'}`}>
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
          {leftPanelTab === 'components' && <ComponentsTab />}
          {leftPanelTab === 'library' && <ComponentLibraryTab />}
          {leftPanelTab === 'layers' && <LayersTab />}
          {leftPanelTab === 'pages' && <PagesTab />}
          {leftPanelTab === 'cms' && <CmsTab />}
        </div>
      </div>
    </div>
  );
};

type CmsCollectionWithRecords = CmsCollection & { records: CmsRecord[] };

const CmsTab: React.FC = () => {
  const { projectId } = useBuilderStore();
  const [collections, setCollections] = useState<CmsCollectionWithRecords[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) {
      setCollections([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/cms/${encodeURIComponent(projectId)}`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Unable to load CMS collections')))
      .then(data => {
        if (cancelled) return;
        const nextCollections = Array.isArray(data) ? data as CmsCollectionWithRecords[] : [];
        setCollections(nextCollections);
        setSelectedId(current => nextCollections.some(collection => collection.id === current) ? current : nextCollections[0]?.id || '');
      })
      .catch(value => { if (!cancelled) setError(value instanceof Error ? value.message : 'Unable to load CMS collections'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [projectId]);

  const selected = collections.find(collection => collection.id === selectedId) || collections[0];
  const records = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!selected || !query) return selected?.records || [];
    return selected.records.filter(record => selected.fields.some(field => String(record.data[field] ?? '').toLowerCase().includes(query)));
  }, [search, selected]);

  if (!projectId) return <div className="p-4 text-xs text-gray-500">Save the project to use CMS collections.</div>;
  if (loading) return <div className="p-4 text-xs text-gray-500">Loading CMS...</div>;
  if (error) return <div className="p-4 text-xs text-red-300">{error}</div>;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#111114] text-gray-200">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">CMS Collections</span>
        <a href={`/dashboard/settings/${projectId}/cms`} rel="noreferrer" title="Open CMS settings" className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-200"><ExternalLink size={14} /></a>
      </div>
      {collections.length === 0 ? <div className="p-4 text-xs text-gray-500">No collections yet. Create one in CMS settings.</div> : <>
        <div className="border-b border-gray-800 p-2">
          {collections.map(collection => <button key={collection.id} type="button" onClick={() => { setSelectedId(collection.id); setSearch(''); }} className={`mb-1 flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs ${selected?.id === collection.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/70 hover:text-gray-200'}`}>
            <span className="truncate">{collection.name}</span><span className="ml-2 shrink-0 text-[10px] text-gray-500">{collection.records.length}</span>
          </button>)}
        </div>
        {selected && <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-gray-800 bg-[#111114] p-2">
            <label className="relative block">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${selected.name.toLowerCase()}...`} className="w-full rounded-md border border-gray-700 bg-gray-900 py-1.5 pl-8 pr-2 text-xs text-gray-200 outline-none focus:border-blue-400" />
            </label>
          </div>
          <div className="p-2">
            {records.length === 0 ? <p className="p-3 text-xs text-gray-500">No records found.</p> : records.map(record => <div key={record.id} className="border-b border-gray-800/70 px-2 py-2 last:border-0">
              <p className="truncate text-xs font-medium text-gray-200">{String(record.data[selected.fields[0]] ?? record.id)}</p>
              <p className="mt-1 truncate text-[10px] text-gray-500">{selected.fields.slice(1, 3).map(field => `${field}: ${String(record.data[field] ?? '')}`).join(' · ')}</p>
            </div>)}
          </div>
        </div>}
      </>}
    </div>
  );
};

const ComponentsTab: React.FC = () => {
  const { setDraggedElementType, addElementFromPalette, selectedElementId, getElementById } = useBuilderStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(COMPONENT_CATEGORIES))
  );
  const [search, setSearch] = useState('');

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('elementType', type);
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedElementType(type);
  };

  const handleDragEnd = () => {
    setDraggedElementType(null);
  };

  const handleDoubleClick = (type: ElementType) => {
    const selectedElement = selectedElementId ? getElementById(selectedElementId) : null;
    addElementFromPalette(type, selectedElement?.type === 'cmsMap' ? selectedElement.id : 'canvas-root', 'inside');
  };

  const filteredCategories = Object.entries(COMPONENT_CATEGORIES).map(([cat, types]) => ({
    cat,
    types: (types as readonly ElementType[]).filter(t =>
      !search || COMPONENT_LABELS[t].toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(({ types }) => types.length > 0);

  return (
    <div className="p-3">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Components</span>
      <div className="relative mb-3 mt-3">
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
        />
      </div>

      {filteredCategories.map(({ cat, types }) => (
        <div key={cat} className="mb-2">
          <button
            onClick={() => toggleCategory(cat)}
            className="w-full flex items-center justify-between px-1 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
          >
            {cat}
            {expandedCategories.has(cat) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {expandedCategories.has(cat) && (
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {(types as ElementType[]).map(type => (
                <div
                  key={type}
                  draggable
                  onDragStart={e => handleDragStart(e, type)}
                  onDragEnd={handleDragEnd}
                  onDoubleClick={() => handleDoubleClick(type)}
                  className="flex flex-col items-center gap-2 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700/50 hover:border-gray-600 rounded-lg px-2.5 py-2 cursor-grab active:cursor-grabbing transition-all group"
                  title={`Double-click to add, drag to place`}
                >
                  <span className="text-gray-400 group-hover:text-blue-300 transition-colors shrink-0">
                    {COMPONENT_ICONS[type] || <Square size={14} />}
                  </span>
                  <span className="text-[10px] text-gray-300 group-hover:text-white transition-colors truncate">
                    {COMPONENT_LABELS[type]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <p className="text-xs text-gray-600 text-center mt-4">Drag or double-click to add</p>
    </div>
  );
};

const ComponentLibraryTab: React.FC = () => {
  const { pages, selectedElementId, getElementById, addComponentFromPalette, setDraggedElementType } = useBuilderStore();
  const [search, setSearch] = useState('');
  const components = getComponentElements(pages);
  const filteredComponents = components.filter(component => {
    const query = search.trim().toLowerCase();
    return !query || `${component.componentName || ''} ${component.name}`.toLowerCase().includes(query);
  });
  const getTarget = () => {
    const selected = selectedElementId ? getElementById(selectedElementId) : null;
    return selected?.type === 'cmsMap' ? selected.id : 'canvas-root';
  };

  const handleDragStart = (event: React.DragEvent, component: BuilderElement) => {
    event.dataTransfer.setData('componentId', component.id);
    event.dataTransfer.setData('text/plain', component.id);
    event.dataTransfer.effectAllowed = 'copy';
    setDraggedElementType(null);
  };

  const handleDoubleClick = (component: BuilderElement) => {
    addComponentFromPalette(component.id, getTarget(), 'inside');
  };

  return (
    <div className="p-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Saved Components</span>
      <div className="relative mb-3 mt-3">
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      {filteredComponents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 p-4 text-center text-xs text-gray-500">
          {components.length === 0 ? 'Mark an element as a component to reuse it here.' : 'No components found.'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredComponents.map(component => {
            const sourcePage = pages.find(page => page.elements.some(element => element.id === component.id))?.name;
            return (
              <div
                key={component.id}
                draggable
                onDragStart={event => handleDragStart(event, component)}
                onDoubleClick={() => handleDoubleClick(component)}
                className="flex cursor-grab items-center gap-2 rounded-lg border border-gray-700/60 bg-gray-800/60 px-2.5 py-2 hover:border-gray-600 hover:bg-gray-700/80 active:cursor-grabbing"
                title="Double-click to add, or drag onto the canvas"
              >
                <span className="text-blue-300"><Blocks size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-gray-200">{component.componentName || component.name}</span>
                  {sourcePage && <span className="block truncate text-[10px] text-gray-500">{sourcePage}</span>}
                </span>
                <Copy size={13} className="shrink-0 text-gray-600" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const getSiblingIds = (page: Page, parentId: string | null): string[] => {
  const find = (elements: BuilderElement[], currentParentId: string | null): string[] | null => {
    if (currentParentId === null) {
      return elements.map(el => el.id);
    }

    for (const el of elements) {
      if (el.id === currentParentId) {
        return el.children.map(child => child.id);
      }
      const nested = find(el.children, currentParentId);
      if (nested) return nested;
    }

    return null;
  };

  return find(page.elements, parentId) || [];
};

const isDescendant = (ancestorId: string, descendantId: string, page: Page): boolean => {
  const findElement = (elements: BuilderElement[]): BuilderElement | null => {
    for (const el of elements) {
      if (el.id === ancestorId) return el;
      const found = findElement(el.children);
      if (found) return found;
    }
    return null;
  };

  const ancestor = findElement(page.elements);
  if (!ancestor) return false;

  const search = (elements: BuilderElement[]): boolean => {
    for (const el of elements) {
      if (el.id === descendantId) return true;
      if (search(el.children)) return true;
    }
    return false;
  };

  return search(ancestor.children);
};

const containsElement = (element: BuilderElement, id: string): boolean => (
  element.children.some(child => child.id === id || containsElement(child, id))
);

const LayerItem: React.FC<{ element: BuilderElement; depth: number; collapseSignal: number }> = ({ element, depth, collapseSignal }) => {
  const {
    selectedElementId,
    selectElement,
    deleteElement,
    duplicateElement,
    toggleElementLock,
    toggleElementVisibility,
    toggleElementComponent,
  } = useBuilderStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const layerRef = useRef<HTMLDivElement>(null);
  const hasChildren = element.children.length > 0;
  const isSelected = selectedElementId === element.id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: element.id });

  useEffect(() => {
    if (collapseSignal > 0) setIsExpanded(false);
  }, [collapseSignal]);

  useEffect(() => {
    if (hasChildren && selectedElementId && containsElement(element, selectedElementId)) {
      setIsExpanded(true);
    }
    if (isSelected) {
      requestAnimationFrame(() => layerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
  }, [element, hasChildren, isSelected, selectedElementId]);

  return (
    <div
      ref={node => { setNodeRef(node); layerRef.current = node; }}
      data-layer-id={element.id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-50' : ''}
    >
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md mx-1 group transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-300' : 'hover:bg-gray-800/80 text-gray-400 hover:text-gray-200'
          }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={() => selectElement(isSelected ? null : element.id)}
      >
        {hasChildren ? (
          <button
            onClick={e => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="text-gray-500 hover:text-gray-300 shrink-0"
          >
            {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}

        <button
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          className="text-gray-500 hover:text-gray-300 shrink-0 p-0.5 rounded cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <Move size={10} />
        </button>

        <span className="text-gray-500 shrink-0">
          {COMPONENT_ICONS[element.type] || <Square size={12} />}
        </span>

        <span className="flex-1 text-xs truncate">{element.name}</span>

        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={e => { e.stopPropagation(); toggleElementVisibility(element.id); }}
            className="p-0.5 text-gray-500 hover:text-gray-200 rounded"
            title={element.hidden ? 'Show' : 'Hide'}
          >
            {element.hidden ? <EyeOff size={10} /> : <Eye size={10} />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); toggleElementLock(element.id); }}
            className="p-0.5 text-gray-500 hover:text-gray-200 rounded"
            title={element.locked ? 'Unlock' : 'Lock'}
          >
            {element.locked ? <Lock size={10} /> : <Unlock size={10} />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); duplicateElement(element.id); }}
            className="p-0.5 text-gray-500 hover:text-gray-200 rounded"
          >
            <Copy size={10} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); toggleElementComponent(element.id); }}
            className={`p-0.5 rounded ${element.isComponent ? 'text-blue-300 hover:text-blue-100' : 'text-gray-500 hover:text-gray-200'}`}
            title={element.isComponent ? 'Remove component tag' : 'Export as component'}
          >
            <Package size={10} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); deleteElement(element.id); }}
            className="p-0.5 text-gray-500 hover:text-red-400 rounded"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <SortableContext items={element.children.map(child => child.id)} strategy={verticalListSortingStrategy}>
          {element.children.map(child => (
            <LayerItem key={child.id} element={child} depth={depth + 1} collapseSignal={collapseSignal} />
          ))}
        </SortableContext>
      )}
    </div>
  );
};

const LayersTab: React.FC = () => {
  const { getCurrentPage, getElementById, moveElement } = useBuilderStore();
  const page = getCurrentPage();
  const sensors = useSensors(useSensor(PointerSensor));
  const [collapseSignal, setCollapseSignal] = useState(0);

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = event.active.id as string;
    const overId = event.over?.id as string;
    if (!overId || activeId === overId) return;

    const activeElement = getElementById(activeId);
    const overElement = getElementById(overId);
    if (!activeElement || !overElement) return;
    if (isDescendant(activeId, overId, page)) return;

    const siblingIds = getSiblingIds(page, overElement.parentId);
    const activeIndex = siblingIds.indexOf(activeId);
    const overIndex = siblingIds.indexOf(overId);
    const position: 'before' | 'after' = activeIndex !== -1 && activeIndex < overIndex ? 'after' : 'before';

    moveElement(activeId, overId, position);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="py-2">
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Layers</span>
          <button
            type="button"
            onClick={() => setCollapseSignal(signal => signal + 1)}
            className="p-1 text-gray-500 hover:text-gray-200 rounded transition-colors"
            title="Collapse all layers"
            aria-label="Collapse all layers"
          >
            <ChevronsDownUp size={14} />
          </button>
        </div>
        {page.elements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <Layers size={24} className="mb-2" />
            <p className="text-xs">No elements yet</p>
          </div>
        ) : (
          <SortableContext items={page.elements.map(el => el.id)} strategy={verticalListSortingStrategy}>
            {page.elements.map(el => (
              <LayerItem key={el.id} element={el} depth={0} collapseSignal={collapseSignal} />
            ))}
          </SortableContext>
        )}
      </div>
    </DndContext>
  );
};

const PagesTab: React.FC = () => {
  const { pages, currentPageId, setCurrentPage, addPage, deletePage, updatePageName, updatePageSlug, updatePageCmsDetail } = useBuilderStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');

  const startEdit = (page: Page) => {
    setEditingId(page.id);
    setEditName(page.name);
    setEditSlug(page.slug.replace(/^\/+/, ''));
  };

  const commitEdit = () => {
    if (editingId && editName.trim()) {
      updatePageName(editingId, editName.trim());
    }
    if (editingId && editSlug.trim()) updatePageSlug(editingId, editSlug);
    setEditingId(null);
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pages</span>
        <button
          onClick={addPage}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      <div className="space-y-1">
        {pages.map(page => (
          <div
            key={page.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${page.id === currentPageId
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
              : 'hover:bg-gray-800 text-gray-400 border border-transparent'
              }`}
            onClick={() => setCurrentPage(page.id)}
          >
            <Globe size={12} className="shrink-0" />

            {editingId === page.id ? (
              <div className="flex-1 min-w-0 flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                <input
                  className="w-full bg-gray-800 text-white text-xs px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                  autoFocus
                  aria-label="Page name"
                />
                {page.slug === '/' ? (
                  <span className="text-xs text-gray-600" title="The homepage URL cannot be changed">/</span>
                ) : (
                  <div className="flex items-center text-xs text-gray-500">
                    <span>/</span>
                    <input
                      className="min-w-0 flex-1 bg-gray-800 text-gray-300 px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={editSlug}
                      onChange={e => setEditSlug(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                      aria-label="Page URL slug"
                    />
                  </div>
                )}
              </div>
            ) : (
              <span
                className="flex-1 text-xs truncate"
                onDoubleClick={e => { e.stopPropagation(); startEdit(page); }}
              >
                {page.name}
              </span>
            )}

            {editingId !== page.id && <span
              className={`text-xs ${page.slug === '/' ? 'text-gray-600' : 'text-gray-500 hover:text-gray-300 cursor-text'}`}
              onDoubleClick={e => { e.stopPropagation(); startEdit(page); }}
              title={page.slug === '/' ? 'The homepage URL cannot be changed' : 'Double-click to edit the page URL slug'}
            >{page.slug}</span>}

            {page.slug !== '/' && <button
              type="button"
              onClick={e => { e.stopPropagation(); updatePageCmsDetail(page.id, { enabled: !page.cmsDetail?.enabled }); }}
              aria-label={`${page.cmsDetail?.enabled ? 'Disable' : 'Enable'} single post page for ${page.name}`}
              title={page.cmsDetail?.enabled ? 'Single post page enabled' : 'Enable single post page'}
              className={`shrink-0 text-[10px] ${page.cmsDetail?.enabled ? 'text-emerald-300' : 'text-gray-600 hover:text-gray-300'}`}
            >SP</button>}

            {pages.length > 1 && page.slug !== '/' && (
              <button
                onClick={e => { e.stopPropagation(); if (confirm(`Delete page "${page.name}"? This cannot be undone.`)) { deletePage(page.id); } }}
                aria-label={`Delete page ${page.name}`}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
