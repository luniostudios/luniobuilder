"use client";

import React, { JSX, createContext, useContext, useEffect, useRef, useState } from 'react';
import { BuilderElement, ElementType } from '../../types/builder';
import type { CmsDetailSettings } from '../../types/cms';
import { useBuilderStore } from '../../stores/builderStore';
import { canHaveChildren, getEffectiveStyles, stylesToCSS } from '../../utils/builderUtils';
import * as LucideIcons from 'lucide-react';

interface ElementRendererProps {
  element: BuilderElement;
  isPreview?: boolean;
  isPublishedSite?: boolean;
}

interface NavbarMenuContextValue {
  isOpen: boolean;
  toggle: (event: React.MouseEvent) => void;
  menuIds: Set<string>;
}

const NavbarMenuContext = createContext<NavbarMenuContextValue | null>(null);

interface CalendarEvent {
  date: string;
  title: string;
}

interface CmsTableRow {
  id: string;
  data: Record<string, unknown>;
}

interface CmsRecordContextValue {
  id: string;
  data: Record<string, unknown>;
  detailSettings?: CmsDetailSettings;
}

const CmsRecordContext = createContext<CmsRecordContextValue | null>(null);

export const CmsRecordProvider: React.FC<{ record: CmsRecordContextValue | null; detailSettings?: CmsDetailSettings; children: React.ReactNode }> = ({ record, detailSettings, children }) => {
  const parentRecord = useContext(CmsRecordContext);
  const contextValue = record
    ? { ...record, detailSettings: detailSettings || parentRecord?.detailSettings }
    : parentRecord;

  return <CmsRecordContext.Provider value={contextValue}>{children}</CmsRecordContext.Provider>;
};

const evaluateCondition = (element: BuilderElement, record: CmsRecordContextValue | null) => {
  const field = String(element.props.conditionField || '').trim();
  if (!field) return true;
  if (!record) return false;

  const actual = record.data[field];
  const operator = String(element.props.conditionOperator || 'exists');
  const expected = element.props.conditionValue;
  const actualText = actual === null || actual === undefined ? '' : String(actual).toLowerCase();
  const expectedText = expected === null || expected === undefined ? '' : String(expected).toLowerCase();
  const actualNumber = Number(actual);
  const expectedNumber = Number(expected);

  switch (operator) {
    case 'equals': return actualText === expectedText;
    case 'notEquals': return actualText !== expectedText;
    case 'contains': return actualText.includes(expectedText);
    case 'notContains': return !actualText.includes(expectedText);
    case 'greaterThan': return Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) && actualNumber > expectedNumber;
    case 'lessThan': return Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) && actualNumber < expectedNumber;
    case 'exists': return actual !== undefined && actual !== null && actualText !== '';
    case 'notExists': return actual === undefined || actual === null || actualText === '';
    default: return true;
  }
};

const startShopCheckout = async (projectId: string | null, record: CmsRecordContextValue | null) => {
  if (!projectId || !record) return;
  const response = await fetch(`/api/shop/${encodeURIComponent(projectId)}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId: record.id }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.url) throw new Error(data.error || 'Unable to start checkout.');
  window.location.assign(data.url);
};

const ShopCheckoutButton: React.FC<{ element: BuilderElement; projectId: string | null; isPreview: boolean; onClick: (event: React.MouseEvent) => void; style: React.CSSProperties }> = ({ element, projectId, isPreview, onClick, style }) => {
  const record = useContext(CmsRecordContext);
  const [error, setError] = useState('');

  const checkout = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isPreview) {
      onClick(event);
      return;
    }
    setError('');
    try { await startShopCheckout(projectId, record); } catch (value) { setError(value instanceof Error ? value.message : 'Unable to start checkout.'); }
  };

  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }} onClick={onClick}>
    <button type="button" style={style} onClick={checkout}>{element.props.text || 'Buy now'}</button>
    {error && <span style={{ fontSize: '12px', color: '#dc2626' }}>{error}</span>}
  </div>;
};

const CmsTableElement: React.FC<{ element: BuilderElement; projectId: string | null; onClick: (event: React.MouseEvent) => void; style: React.CSSProperties }> = ({ element, projectId, onClick, style }) => {
  const collectionId = String(element.props.collectionId || element.props.collectionSlug || '');
  const [fields, setFields] = useState<string[]>(Array.isArray(element.props.columns) ? element.props.columns.filter((value): value is string => typeof value === 'string') : []);
  const [rows, setRows] = useState<CmsTableRow[]>([]);
  const [loading, setLoading] = useState(Boolean(collectionId));

  useEffect(() => {
    if (!projectId || !collectionId) {
      setLoading(false);
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/cms/${encodeURIComponent(projectId)}`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Unable to load CMS data')))
      .then(collections => {
        if (cancelled) return;
        const collection = Array.isArray(collections) ? collections.find((value: { id?: string; slug?: string }) => value.id === collectionId || value.slug === collectionId) : null;
        setFields(Array.isArray(element.props.columns) && element.props.columns.length > 0 ? element.props.columns.filter((value): value is string => typeof value === 'string') : collection?.fields || []);
        setRows(Array.isArray(collection?.records) ? collection.records : []);
      })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId, collectionId, element.props.columns]);

  if (!collectionId) return <div style={{ ...style, paddingTop: '24px', paddingRight: '24px', paddingBottom: '24px', paddingLeft: '24px', border: '1px dashed #94a3b8', color: '#64748b' }} onClick={onClick}>Select a CMS collection in the content panel.</div>;
  return (
    <div style={{ ...style, overflowX: 'auto' }} onClick={onClick}>
      {loading ? <div style={{ padding: '20px', color: '#64748b' }}>Loading CMS data...</div> : fields.length === 0 ? <div style={{ padding: '20px', color: '#64748b' }}>{String(element.props.emptyMessage || 'No fields configured.')}</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead><tr>{fields.map(field => <th key={field} style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', fontSize: '12px', textTransform: 'uppercase', color: '#64748b' }}>{field}</th>)}</tr></thead>
          <tbody>{rows.map(row => <tr key={row.id}>{fields.map(field => <td key={field} style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>{String(row.data[field] ?? '')}</td>)}</tr>)}</tbody>
        </table>
      )}
    </div>
  );
};

const CmsMapElement: React.FC<{ element: BuilderElement; projectId: string | null; isPreview: boolean; isPublishedSite: boolean; onClick: (event: React.MouseEvent) => void; style: React.CSSProperties }> = ({ element, projectId, isPreview, isPublishedSite, onClick, style }) => {
  const collectionId = String(element.props.collectionId || element.props.collectionSlug || '');
  const [records, setRecords] = useState<CmsTableRow[]>([]);
  const [loading, setLoading] = useState(Boolean(collectionId));
  const [filterValue, setFilterValue] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!projectId || !collectionId) {
      setLoading(false);
      setRecords([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/cms/${encodeURIComponent(projectId)}`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Unable to load CMS data')))
      .then(collections => {
        if (cancelled) return;
        const collection = Array.isArray(collections) ? collections.find((value: { id?: string; slug?: string }) => value.id === collectionId || value.slug === collectionId) : null;
        setRecords(Array.isArray(collection?.records) ? collection.records : []);
      })
      .catch(() => { if (!cancelled) setRecords([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId, collectionId]);

  const renderChildren = (record?: CmsTableRow) => {
    const children = element.children.map(child => <ElementRenderer key={`${record?.id || 'editor'}-${child.id}`} element={child} isPreview={isPreview} isPublishedSite={isPublishedSite} />);
    if (record) {
      return <CmsRecordContext.Provider value={record}>{children}</CmsRecordContext.Provider>;
    }
    return children;
  };

  const filterField = String(element.props.filterField || '').trim();
  const filterQuery = filterValue.trim().toLowerCase();
  const filteredRecords = filterField && filterQuery
    ? records.filter(record => String(record.data[filterField] ?? '').toLowerCase().includes(filterQuery))
    : records;
  const paginationEnabled = element.props.paginationEnabled === true;
  const pageSize = Math.max(1, Math.min(100, Number(element.props.pageSize) || 6));
  const totalPages = paginationEnabled ? Math.max(1, Math.ceil(filteredRecords.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const visibleRecords = paginationEnabled
    ? filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredRecords;
  const controlBackground = String(element.props.controlsBackground || '#ffffff');
  const controlTextColor = String(element.props.controlsTextColor || '#334155');
  const controlBorderColor = String(element.props.controlsBorderColor || '#d1d5db');
  const controlBorderRadius = String(element.props.controlsBorderRadius || '8px');
  const controlPadding = String(element.props.controlsPadding || '10px 12px');
  const controlGap = String(element.props.controlsGap || '12px');
  const filterWidth = String(element.props.filterWidth || '240px');
  const showControls = isPreview || Boolean(projectId && collectionId);
  const controls = showControls && (filterField || paginationEnabled) ? (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: controlGap, marginBottom: '16px' }} onClick={event => { if (!isPreview) onClick(event); }}>
      {filterField && <input value={filterValue} onChange={event => { setFilterValue(event.target.value); setPage(1); }} onClick={event => { if (!isPreview) onClick(event); }} placeholder={String(element.props.filterPlaceholder || `Search ${filterField}...`)} aria-label={`Filter by ${filterField}`} style={{ minWidth: '180px', flex: `1 1 ${filterWidth}`, maxWidth: '100%', padding: controlPadding, border: `1px solid ${controlBorderColor}`, borderRadius: controlBorderRadius, background: controlBackground, color: controlTextColor, outline: 'none' }} />}
      {paginationEnabled && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: controlTextColor, fontSize: '13px' }}>
        <button type="button" onClick={event => { event.stopPropagation(); if (!isPreview) onClick(event); setPage(value => Math.max(1, value - 1)); }} disabled={currentPage === 1} aria-label="Previous page" style={{ border: `1px solid ${controlBorderColor}`, borderRadius: controlBorderRadius, background: controlBackground, color: controlTextColor, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', padding: controlPadding, opacity: currentPage === 1 ? 0.45 : 1 }}>&lt;</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button type="button" onClick={event => { event.stopPropagation(); if (!isPreview) onClick(event); setPage(value => Math.min(totalPages, value + 1)); }} disabled={currentPage === totalPages} aria-label="Next page" style={{ border: `1px solid ${controlBorderColor}`, borderRadius: controlBorderRadius, background: controlBackground, color: controlTextColor, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', padding: controlPadding, opacity: currentPage === totalPages ? 0.45 : 1 }}>&gt;</button>
      </div>}
    </div>
  ) : null;

  if (!collectionId) {
    return <div style={{ ...style, paddingTop: '24px', paddingRight: '24px', paddingBottom: '24px', paddingLeft: '24px', border: '1px dashed #94a3b8', color: '#64748b' }} onClick={onClick}>Select a CMS collection, then add components inside this map.</div>;
  }

  if (loading) return <div style={{ ...style, paddingTop: '24px', paddingRight: '24px', paddingBottom: '24px', paddingLeft: '24px', color: '#64748b' }} onClick={onClick}>Loading CMS records...</div>;

  if (records.length === 0) {
    return (
      <div style={style} onClick={onClick}>
        {controls}
        {!isPreview && element.children.length > 0 ? renderChildren() : <div style={{ paddingTop: '24px', paddingRight: '24px', paddingBottom: '24px', paddingLeft: '24px', color: '#64748b' }}>{String(element.props.emptyMessage || 'No records yet.')}</div>}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minWidth: 0 }} onClick={onClick}>
      {controls}
      <div style={style}>
        {visibleRecords.length > 0 ? visibleRecords.map(record => <div key={record.id} style={{ minWidth: 0 }}>{renderChildren(record)}</div>) : <div style={{ padding: '24px', color: '#64748b' }}>{String(element.props.emptyMessage || 'No matching records.')}</div>}
      </div>
    </div>
  );
};

const CalendarElement: React.FC<{ element: BuilderElement; isPreview: boolean; onClick: (event: React.MouseEvent) => void; style: React.CSSProperties }> = ({ element, isPreview, onClick, style }) => {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));
  const events = Array.isArray(element.props.events) ? element.props.events as CalendarEvent[] : [];
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const dateKey = (day: number) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const selectedEvents = events.filter(event => event.date === selectedDate);
  const changeMonth = (offset: number) => setMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  return (
    <div style={{ ...style, width: '100%', minHeight: '420px', height: 'auto', paddingTop: '24px', paddingRight: '24px', paddingBottom: '24px', paddingLeft: '24px', backgroundColor: '#ffffff', color: '#172033', fontFamily: 'inherit' }} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>{String(element.props.title || 'Calendar')}</div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{monthLabel}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[-1, 1].map(offset => (
            <button key={offset} type="button" aria-label={offset < 0 ? 'Previous month' : 'Next month'} onClick={event => { event.stopPropagation(); changeMonth(offset); }} style={{ width: '36px', height: '36px', border: '1px solid #dbe3ef', borderRadius: '8px', background: '#ffffff', color: '#334155', cursor: 'pointer', fontSize: '18px' }}>
              {offset < 0 ? '<' : '>'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} style={{ padding: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>{day}</div>)}
        {cells.map((day, index) => {
          const key = day ? dateKey(day) : `empty-${index}`;
          const hasEvent = day ? events.some(event => event.date === key) : false;
          const isSelected = key === selectedDate;
          return <button key={key} type="button" disabled={!day} onClick={event => { event.stopPropagation(); if (day) setSelectedDate(key); }} style={{ minHeight: '54px', border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '8px', background: isSelected ? '#eff6ff' : '#ffffff', color: day ? '#172033' : 'transparent', cursor: day ? 'pointer' : 'default', textAlign: 'left', padding: '8px', fontWeight: isSelected ? 700 : 500 }}>
            {day && <><span>{day}</span>{hasEvent && <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '999px', background: '#2563eb', marginTop: '8px' }} />}</>}
          </button>;
        })}
      </div>
      {selectedEvents.length > 0 && <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>{selectedEvents.map(event => <div key={`${event.date}-${event.title}`} style={{ fontSize: '14px', color: '#334155' }}>{event.title}</div>)}</div>}
      {!isPreview && <div style={{ marginTop: '14px', fontSize: '11px', color: '#94a3b8' }}>Select a date to view events</div>}
    </div>
  );
};

export const ElementRenderer: React.FC<ElementRendererProps> = ({ element, isPreview = false, isPublishedSite = false }) => {
  const {
    selectedElementId,
    hoveredElementId,
    draggedElementId,
    dropTargetId,
    dropPosition,
    breakpoint,
    selectElement,
    hoverElement,
    setDraggedElementId,
    setDropTarget,
    moveElement,
    addElementFromPalette,
    updateElementProps,
    pushHistory,
    setCurrentPage,
    pages,
    projectId,
  } = useBuilderStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState(element.props.text || '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const styles = getEffectiveStyles(element, breakpoint);
  const cssStyles = stylesToCSS(styles);
  const safeCssStyles: React.CSSProperties = {
    ...cssStyles,
    boxSizing: 'border-box',
    maxWidth: '100%',
    minWidth: 0,
  };
  const safeTextStyles: React.CSSProperties = {
    ...safeCssStyles,
    overflowWrap: 'break-word',
    boxSizing: 'border-box',
    wordBreak: 'break-word',
  };

  const editingRef = useRef<HTMLElement | null>(null);
  const editingTextStyles: React.CSSProperties = {
    ...safeTextStyles,
    outline: 'none',
    whiteSpace: 'pre-wrap',
    minWidth: 0,
  };
  const navbarMenu = useContext(NavbarMenuContext);
  const cmsRecord = useContext(CmsRecordContext);
  const isMenuTarget = navbarMenu?.menuIds.has(element.id) ?? false;

  if (isPreview && !evaluateCondition(element, cmsRecord)) return null;

  const resolveCmsProp = (propName: 'text' | 'src', fallback: unknown) => {
    const field = element.props.cmsField;
    if (!cmsRecord || typeof field !== 'string' || !field) return fallback;
    const value = cmsRecord.data[field];
    return value === undefined || value === null ? fallback : String(value);
  };

  const resolveCmsHref = () => {
    const field = element.props.cmsHrefField;
    if (!cmsRecord || typeof field !== 'string' || !field) return element.props.href;
    const value = cmsRecord.data[field];
    if (value === undefined || value === null) return element.props.href;
    if (isPublishedSite && field === cmsRecord.detailSettings?.slugField) {
      const detailPage = pages.find(candidate => candidate.cmsDetail?.enabled && candidate.slug !== '/');
      const prefix = String(detailPage?.slug || cmsRecord.detailSettings?.routePrefix || '').replace(/^\/+|\/+$/g, '');
      const recordValue = String(value).replace(/^\/+/, '').replace(new RegExp(`^${prefix}/`, 'i'), '');
      return prefix ? `/${prefix}/${encodeURIComponent(recordValue)}` : `/${encodeURIComponent(recordValue)}`;
    }
    return String(value);
  };

  const resolveCmsAlt = () => {
    const field = element.props.cmsAltField;
    if (!cmsRecord || typeof field !== 'string' || !field) return element.props.alt;
    const value = cmsRecord.data[field];
    return value === undefined || value === null ? element.props.alt : String(value);
  };

  const textValue = resolveCmsProp('text', element.props.text) as string | undefined;
  const srcValue = resolveCmsProp('src', element.props.src) as string | undefined;
  const hrefValue = resolveCmsHref() as string | undefined;
  const altValue = resolveCmsAlt() as string | undefined;

  useEffect(() => {
    if (isEditing && editingRef.current) {
      editingRef.current.focus();

      const range = document.createRange();
      range.selectNodeContents(editingRef.current);
      const sel = window.getSelection();

      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, [isEditing]);

  const setEditingRef = (node: HTMLElement | null) => {
    editingRef.current = node;
  };

  const handleButtonClick = (e: React.MouseEvent, href?: string) => {
    if (isPreview && href) {
      e.preventDefault();
      // Check if href matches an internal page slug
      const targetPage = (pages as any[])?.find((p: any) => p.slug === href || p.slug === href.replace(/^\//, '') || `/${p.slug}` === href);
      if (targetPage) {
        if (isPublishedSite) {
          const targetSlug = targetPage.slug === '/' ? '/' : `/${String(targetPage.slug).replace(/^\/+/, '')}`;
          window.location.assign(targetSlug);
          return;
        }
        setCurrentPage(targetPage.id);
        return;
      }
      if (isPublishedSite && href.startsWith('/')) {
        window.location.assign(href);
        return;
      }
      // Otherwise, if it's an external link, open it
      if (href.startsWith('http')) {
        window.open(href, '_blank');
      }
    }
  };

  const isSelected = selectedElementId === element.id;
  const isHovered = hoveredElementId === element.id;
  const isDropTarget = dropTargetId === element.id;

  const handleClick = (e: React.MouseEvent) => {
    if (isPreview) return;
    e.stopPropagation();
    selectElement(element.id);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (isPreview) return;
    e.stopPropagation();
    hoverElement(element.id);
  };

  const handleMouseLeave = () => {
    if (isPreview) return;
    hoverElement(null);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isPreview || element.locked) return;
    e.stopPropagation();
    e.dataTransfer.setData('elementId', element.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedElementId(element.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isPreview) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    const height = rect.height;

    if (element.type === 'cmsMap' || (canHaveChildren(element.type) && y > height * 0.25 && y < height * 0.75)) {
      setDropTarget(element.id, 'inside');
    } else if (y < height / 2) {
      setDropTarget(element.id, 'before');
    } else {
      setDropTarget(element.id, 'after');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isPreview) return;
    e.preventDefault();
    e.stopPropagation();

    const elementId = e.dataTransfer.getData('elementId');
    const elementType = e.dataTransfer.getData('elementType') as ElementType;
    const targetPosition = element.type === 'cmsMap' ? 'inside' : (dropPosition || 'after');

    if (elementId && elementId !== element.id) {
      moveElement(elementId, element.id, targetPosition);
    } else if (elementType) {
      addElementFromPalette(elementType, element.id, targetPosition);
    }

    setDropTarget(null, null);
    setDraggedElementId(null);
  };

  const handleDragEnd = () => {
    setDraggedElementId(null);
    setDropTarget(null, null);
  };

  useEffect(() => {
    if (!isEditing) {
      setEditingValue(element.props.text || '');
    }
  }, [element.props.text, isEditing]);

  if (element.hidden && !isPreview) {
    return (
      <div
        style={{ ...safeCssStyles, opacity: 0.3, outline: '1px dashed #d1d5db' }}
        className="relative"
      >
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
          Hidden: {element.name}
        </div>
      </div>
    );
  }

  if (element.hidden && isPreview) {
    return null;
  }

  const isTextEditableType = (type: ElementType) => [
    'heading',
    'paragraph',
    'button',
    'link',
    'listItem',
  ].includes(type);

  const commitTextEdit = () => {
    const finalText = editingRef.current?.innerText ?? editingValue;
    setIsEditing(false);
    setEditingValue(finalText);
    updateElementProps(element.id, { text: finalText });
    pushHistory();
  };

  const handleContentBlur = () => {
    commitTextEdit();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isPreview || element.locked || !isTextEditableType(element.type)) return;
    e.stopPropagation();
    selectElement(element.id);
    setIsEditing(true);
  };

  const handleEditKeyDown: React.KeyboardEventHandler<any> = (e) => {
    if (e.key === 'Enter' && element.type !== 'paragraph') {
      e.preventDefault();
      commitTextEdit();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      setEditingValue(element.props.text || '');
    }
  };

  const wrapperClasses = isPreview ? '' : [
    'relative',
    'outline-none',
    isSelected ? 'ring-2 ring-blue-500 ring-inset' : '',
    isHovered && !isSelected ? 'ring-1 ring-blue-300 ring-inset' : '',
    isDropTarget && dropPosition === 'inside' ? 'ring-2 ring-green-400 ring-inset bg-green-50/20' : '',
    draggedElementId === element.id ? 'opacity-40' : '',
  ].filter(Boolean).join(' ');

  const editableKeyDownHandler = isEditing ? (handleEditKeyDown as any) : undefined;

  const dropIndicatorBefore = !isPreview && isDropTarget && dropPosition === 'before';
  const dropIndicatorAfter = !isPreview && isDropTarget && dropPosition === 'after';

  const renderContent = () => {
    switch (element.type) {
      case 'heading': {
        const Tag = `h${element.props.level || 1}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        return (
          <Tag
            ref={(node) => setEditingRef(node as HTMLElement | null)}
            style={isEditing ? editingTextStyles : safeTextStyles}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onBlur={isEditing ? handleContentBlur : undefined}
            onKeyDown={editableKeyDownHandler}
            contentEditable={!isPreview && isEditing}
            suppressContentEditableWarning
            className={isPreview ? '' : isEditing ? 'cursor-text' : 'cursor-pointer select-none'}
          >
            {isEditing ? editingValue : textValue || 'Heading'}
          </Tag>
        );
      }

      case 'paragraph':
        return (
          <p
            ref={(node) => setEditingRef(node as HTMLElement | null)}
            style={isEditing ? editingTextStyles : safeTextStyles}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onBlur={isEditing ? handleContentBlur : undefined}
            onKeyDown={editableKeyDownHandler}
            contentEditable={!isPreview && isEditing}
            suppressContentEditableWarning
            className={isPreview ? '' : isEditing ? 'cursor-text' : 'cursor-pointer select-none'}
          >
            {isEditing ? editingValue : textValue || 'Paragraph text'}
          </p>
        );

      case 'button': {
        const iconName = element.props.iconName as string | undefined;
        const ButtonIcon = iconName
          ? (LucideIcons as unknown as Record<string, React.ComponentType<{ 'aria-hidden'?: boolean; style?: React.CSSProperties }>>)[iconName]
          : null;

        if (element.props.shopCheckout === true && !isEditing) {
          return <ShopCheckoutButton element={element} projectId={projectId} isPreview={isPreview || isPublishedSite} onClick={handleClick} style={safeTextStyles} />;
        }

        return isEditing ? (
          <span
            ref={(node) => setEditingRef(node as HTMLElement | null)}
            style={editingTextStyles}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onBlur={handleContentBlur}
            onKeyDown={editableKeyDownHandler}
            contentEditable={!isPreview && isEditing}
            suppressContentEditableWarning
            className={isPreview ? '' : 'cursor-text'}
          >
            {editingValue}
          </span>
        ) : (
          <button
            ref={(node) => setEditingRef(node as HTMLElement | null)}
            style={safeCssStyles}
            onClick={(e) => {
              if (isPreview && hrefValue) {
                handleButtonClick(e, hrefValue);
              } else {
                handleClick(e);
              }
            }}
            onDoubleClick={handleDoubleClick}
            className={isPreview ? 'hover:opacity-90' : 'cursor-pointer'}
          >
            <span className="inline-flex items-center gap-2">
              {ButtonIcon && <ButtonIcon aria-hidden style={{ width: '1em', height: '1em' }} />}
              {textValue || 'Button'}
            </span>
          </button>
        );
      }

      case 'link':
        return (
          <a
            ref={(node) => setEditingRef(node as HTMLElement | null)}
            href={isPreview ? hrefValue : undefined}
            style={isEditing ? editingTextStyles : safeTextStyles}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={editableKeyDownHandler}
            contentEditable={!isPreview && isEditing}
            suppressContentEditableWarning
            className={isPreview ? '' : isEditing ? 'cursor-text' : 'cursor-pointer select-none'}
          >
            {isEditing ? editingValue : textValue || 'Link'}
          </a>
        );

      case 'image':
        return (
          <img
            src={srcValue}
            alt={altValue || ''}
            style={{ ...safeCssStyles, maxWidth: '100%', height: 'auto' }}
            onClick={handleClick}
            className={isPreview ? '' : 'cursor-pointer'}
            draggable={false}
          />
        );

      case 'video':
        return (
          <video
            src={srcValue}
            style={{ ...safeCssStyles, maxWidth: '100%', height: 'auto' }}
            controls={element.props.controls}
            onClick={handleClick}
            autoPlay={element.props.autoPlay}
            muted={element.props.muted}
            loop={element.props.loop}
          />
        );

      case 'iframe':
        return (
          <iframe
            src={element.props.src}
            title={String(element.props.title || 'Embedded content')}
            loading="lazy"
            style={{ ...safeCssStyles, width: '100%', height: '100%', border: 'none' }}
            onClick={handleClick}
          />
        );

      case 'calendar':
        return <CalendarElement element={element} isPreview={isPreview} onClick={handleClick} style={safeCssStyles} />;

      case 'table':
        return <CmsTableElement element={element} projectId={projectId} onClick={handleClick} style={safeCssStyles} />;

      case 'custom':
        return (
          <iframe
            srcDoc={`<!doctype html><html><head><style>${String(element.props.css || '')}</style></head><body>${String(element.props.html || '')}<script>${String(element.props.javascript || '').replace(/<\/script/gi, '<\\/script')}</script></body></html>`}
            title="Custom code"
            sandbox="allow-scripts"
            style={{ ...safeCssStyles, width: '100%', minHeight: '120px', border: 'none', background: 'transparent' }}
            onClick={handleClick}
          />
        );

      case 'divider':
        return <hr style={safeCssStyles} onClick={handleClick} />;

      case 'spacer':
        return (
          <div
            style={safeCssStyles}
            onClick={handleClick}
            className={isPreview ? '' : 'border-dashed border border-gray-200 flex items-center justify-center text-xs text-gray-400'}
          >
            {!isPreview && 'spacer'}
          </div>
        );

      case 'input':
        return (
          <div style={{ width: '100%' }} onClick={handleClick} className={isPreview ? '' : 'cursor-pointer'}>
            {element.props.label && (
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                {element.props.label}
              </label>
            )}
            <input
              type={element.props.type || 'text'}
              placeholder={element.props.placeholder}
              style={safeCssStyles}
              readOnly={!isPreview}
            />
          </div>
        );

      case 'textarea':
        return (
          <div style={{ width: '100%' }} onClick={handleClick} className={isPreview ? '' : 'cursor-pointer'}>
            {element.props.label && (
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                {element.props.label}
              </label>
            )}
            <textarea
              placeholder={element.props.placeholder}
              style={safeCssStyles}
              readOnly={!isPreview}
            />
          </div>
        );

      case 'icon': {
        const iconName = (element.props.iconName as string) || 'Star';
        const IconComp = (LucideIcons as unknown as Record<string, React.ComponentType<{ style?: React.CSSProperties; onClick?: (e: React.MouseEvent) => void }>>)[iconName];
        if (!IconComp) return <div style={safeCssStyles} onClick={handleClick}>?</div>;
        const isMenuToggle = iconName === 'Menu' && navbarMenu;
        return isMenuToggle ? (
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={navbarMenu.isOpen}
            style={{ ...safeCssStyles, border: 'none', background: 'transparent', paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 }}
            onClick={navbarMenu.toggle}
            onDoubleClick={handleDoubleClick}
          >
            <IconComp style={{ width: '100%', height: '100%' }} />
          </button>
        ) : <IconComp style={safeCssStyles} onClick={handleClick} />;
      }

      case 'listItem':
        return (
          <li
            ref={(node) => setEditingRef(node as HTMLElement | null)}
            style={isEditing ? editingTextStyles : safeTextStyles}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onBlur={isEditing ? handleContentBlur : undefined}
            onKeyDown={editableKeyDownHandler}
            contentEditable={!isPreview && isEditing}
            suppressContentEditableWarning
            className={isPreview ? '' : isEditing ? 'cursor-text' : 'cursor-pointer select-none'}
          >
            {isEditing ? editingValue : textValue || 'List item'}
          </li>
        );

      default:
        return null;
    }
  };

  if (!canHaveChildren(element.type)) {
    const content = renderContent();
    return (
      <div
        ref={ref}
        className={wrapperClasses}
        draggable={!isPreview && !element.locked && !isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {dropIndicatorBefore && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-50" />}
        {content}
        {isSelected && !element.locked && (
          <div className="absolute -top-5 left-0 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-t-sm whitespace-nowrap z-50 pointer-events-none">
            {element.name}
          </div>
        )}
        {dropIndicatorAfter && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-50" />}
      </div>
    );
  }

  // Container elements
  const containerStyle: React.CSSProperties = safeCssStyles;
  const menuStyle: React.CSSProperties = isMenuTarget && navbarMenu?.isOpen ? {
    ...containerStyle,
    display: 'flex',
    position: containerStyle.position || 'absolute',
    top: containerStyle.top || '100%',
    right: containerStyle.right ?? 0,
    left: containerStyle.left ?? 0,
    flexDirection: containerStyle.flexDirection || 'column',
    alignItems: containerStyle.alignItems || 'stretch',
    gap: containerStyle.gap || '12px',
    ...(containerStyle.padding ? {} : {
      paddingTop: containerStyle.paddingTop || '16px',
      paddingRight: containerStyle.paddingRight || '16px',
      paddingBottom: containerStyle.paddingBottom || '16px',
      paddingLeft: containerStyle.paddingLeft || '16px',
    }),
    backgroundColor: containerStyle.backgroundColor || '#ffffff',
    boxShadow: containerStyle.boxShadow || '0 8px 20px rgba(15, 23, 42, 0.12)',
    zIndex: containerStyle.zIndex || 101,
  } : containerStyle;

  const renderChildren = (children = element.children) => (
    <>
      {children.map(child => (
        <ElementRenderer key={child.id} element={child} isPreview={isPreview} />
      ))}
      {!isPreview && children.length === 0 && (
        <div className="w-full py-8 flex items-center justify-center text-gray-300 text-sm border-2 border-dashed border-gray-200 rounded-lg pointer-events-none">
          Drop elements here
        </div>
      )}
    </>
  );

  const containerElement = (() => {
    switch (element.type) {
      case 'list':
        return (
          <ul style={menuStyle} onClick={handleClick} className={isPreview ? '' : 'cursor-pointer'}>
            {renderChildren()}
          </ul>
        );
      case 'cmsMap':
        return <CmsMapElement element={element} projectId={projectId} isPreview={isPreview} isPublishedSite={isPublishedSite} onClick={handleClick} style={containerStyle} />;
      case 'navbar':
        {
          const menuIds = new Set(
            element.children
              .filter(child => child.props.isNavMenu === true || (
                ['list', 'div'].includes(child.type) &&
                getEffectiveStyles(child, breakpoint).display === 'none'
              ))
              .map(child => child.id)
          );
          const hiddenMenuIds = new Set(
            element.children
              .filter(child => getEffectiveStyles(child, breakpoint).display === 'none')
              .map(child => child.id)
          );
          const toggleMenu = (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            setIsMenuOpen(open => !open);
          };
          return (
            <NavbarMenuContext.Provider value={{ isOpen: isMenuOpen, toggle: toggleMenu, menuIds }}>
              <nav style={containerStyle} onClick={handleClick} className={isPreview ? '' : 'cursor-pointer'}>
                {renderChildren(!isMenuOpen ? element.children.filter(child => !hiddenMenuIds.has(child.id)) : element.children)}
              </nav>
            </NavbarMenuContext.Provider>
          );
        }
      case 'form':
        return (
          <form style={isMenuTarget ? menuStyle : containerStyle} onClick={handleClick} onSubmit={e => e.preventDefault()} className={isPreview ? '' : 'cursor-pointer'}>
            {renderChildren()}
          </form>
        );
      default:
        return (
          <div style={isMenuTarget ? menuStyle : containerStyle} onClick={handleClick} className={isPreview ? '' : 'cursor-pointer'}>
            {renderChildren()}
          </div>
        );
    }
  })();

  return (
    <div
      ref={ref}
      style={isMenuTarget && navbarMenu?.isOpen ? { display: 'contents' } : undefined}
      className={wrapperClasses}
      draggable={!isPreview && !element.locked}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {dropIndicatorBefore && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-50" />}
      {containerElement}
      {isSelected && !element.locked && (
        <div className="absolute -top-5 left-0 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-t-sm whitespace-nowrap z-50 pointer-events-none">
          {element.name}
        </div>
      )}
      {dropIndicatorAfter && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-50" />}
    </div>
  );
};
