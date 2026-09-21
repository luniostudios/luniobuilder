'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { CmsCollection, CmsRecord } from '@/app/types/cms';
import { getCmsCollectionLimitForRole, getCmsRecordLimitForRole } from '@/app/lib/projectLimits';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

type CollectionWithRecords = CmsCollection & { records: CmsRecord[] };

const emptyCollection = { name: '', fields: [''] };

export default function CmsManager({ projectId }: { projectId: string }) {
  const [collections, setCollections] = useState<CollectionWithRecords[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [collectionForm, setCollectionForm] = useState(emptyCollection);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [recordDraft, setRecordDraft] = useState<Record<string, string>>({});
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingRecordDraft, setEditingRecordDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('free');
  const [recordSearch, setRecordSearch] = useState('');
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [recordPage, setRecordPage] = useState(1);
  const [fieldDraft, setFieldDraft] = useState<string[]>([]);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [isDeleteCollectionOpen, setIsDeleteCollectionOpen] = useState(false);

  const selected = useMemo(() => collections.find(collection => collection.id === selectedId) || collections[0], [collections, selectedId]);
  const collectionLimit = getCmsCollectionLimitForRole(role);
  const recordLimit = getCmsRecordLimitForRole(role);
  const collectionLimitReached = collectionLimit !== null && collections.length >= collectionLimit;
  const filteredRecords = useMemo(() => {
    const query = recordSearch.trim().toLowerCase();
    if (!selected || !query) return selected?.records || [];
    return selected.records.filter(record => selected.fields.some(field => String(record.data[field] ?? '').toLowerCase().includes(query)));
  }, [recordSearch, selected]);
  const totalRecordPages = Math.max(1, Math.ceil(filteredRecords.length / recordsPerPage));
  const currentRecordPage = Math.min(recordPage, totalRecordPages);
  const visibleRecords = filteredRecords.slice((currentRecordPage - 1) * recordsPerPage, currentRecordPage * recordsPerPage);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cms/${encodeURIComponent(projectId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to load CMS data');
      setCollections(Array.isArray(data) ? data : []);
      if (!selectedId && data?.[0]?.id) setSelectedId(data[0].id);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Unable to load CMS data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCollections(); }, [projectId]);

  useEffect(() => {
    fetch('/api/users').then(response => response.ok ? response.json() : null).then(data => {
      if (data?.role) setRole(String(data.role).toLowerCase());
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const fields = selected?.fields || [];
    setFieldDraft(fields);
    setRecordDraft(Object.fromEntries(fields.map(field => [field, ''])));
    setEditingRecordId(null);
    setEditingRecordDraft({});
    setRecordPage(1);
    setRecordSearch('');
  }, [selected?.id]);

  const addField = async (fieldNameToAdd: string) => {
    const field = fieldNameToAdd.trim();
    if (!field) return false;
    if (fieldDraft.some(existing => existing.toLowerCase() === field.toLowerCase())) {
      setError('That field already exists.');
      return false;
    }
    const nextFields = [...fieldDraft, field];
    const saved = await saveFields(nextFields);
    if (saved) {
      setFieldDraft(nextFields);
    }
    return saved;
  };

  const submitNewField = async () => {
    if (await addField(fieldName)) {
      setFieldName('');
      setIsAddFieldModalOpen(false);
    }
  };

  const removeField = async (field: string) => {
    if (fieldDraft.length <= 1) return;
    const nextFields = fieldDraft.filter(existing => existing !== field);
    await saveFields(nextFields);
  };

  const saveFields = async (fieldsToSave = fieldDraft) => {
    if (!selected || fieldsToSave.length === 0) {
      setError('A collection must have at least one field.');
      return false;
    }
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/cms/${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, fields: fieldsToSave }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to update fields');
      setCollections(current => current.map(collection => collection.id === selected.id
        ? { ...collection, fields: data.fields || fieldsToSave }
        : collection));
      setFieldDraft(data.fields || fieldsToSave);
      setRecordDraft(current => Object.fromEntries((data.fields || fieldsToSave).map((field: string) => [field, current[field] || ''])));
      return true;
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Unable to update fields');
      return false;
    } finally { setSaving(false); }
  };

  const createCollection = async () => {
    const fields = collectionForm.fields.map(field => field.trim()).filter(Boolean);
    if (!collectionForm.name.trim() || fields.length === 0) {
      setError('Add a collection name and at least one field.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/cms/${encodeURIComponent(projectId)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: collectionForm.name, fields }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to create collection');
      setCollectionForm(emptyCollection);
      await loadCollections();
      setSelectedId(data.id);
      setIsCreateCollectionOpen(false);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Unable to create collection');
    } finally { setSaving(false); }
  };

  const updateCollectionField = (index: number, value: string) => {
    setCollectionForm(current => ({
      ...current,
      fields: current.fields.map((field, fieldIndex) => fieldIndex === index ? value : field),
    }));
  };

  const addCollectionField = () => {
    setCollectionForm(current => ({ ...current, fields: [...current.fields, ''] }));
  };

  const removeCollectionField = (index: number) => {
    setCollectionForm(current => ({
      ...current,
      fields: current.fields.length <= 1 ? [''] : current.fields.filter((_, fieldIndex) => fieldIndex !== index),
    }));
  };

  const addRecord = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/cms/${encodeURIComponent(projectId)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'record', collectionId: selected.id, data: recordDraft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to add record');
      setCollections(current => current.map(collection => collection.id === selected.id ? { ...collection, records: [...collection.records, data] } : collection));
      setRecordDraft(Object.fromEntries(selected.fields.map(field => [field, ''])));
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Unable to add record');
    } finally { setSaving(false); }
  };

  const deleteRecord = async (recordId: string) => {
    if (!selected) return;
    const response = await fetch(`/api/cms/${encodeURIComponent(projectId)}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'record', id: recordId }),
    });
    if (!response.ok) { setError('Unable to delete record'); return; }
    setCollections(current => current.map(collection => collection.id === selected.id ? { ...collection, records: collection.records.filter(record => record.id !== recordId) } : collection));
  };

  const deleteCollection = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/cms/${encodeURIComponent(projectId)}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'collection', id: selected.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Unable to delete collection');
      setCollections(current => current.filter(collection => collection.id !== selected.id));
      setSelectedId('');
      setIsDeleteCollectionOpen(false);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Unable to delete collection');
    } finally { setSaving(false); }
  };

  const startEditingRecord = (record: CmsRecord) => {
    setEditingRecordId(record.id);
    setEditingRecordDraft(Object.fromEntries(selected?.fields.map(field => [field, String(record.data[field] ?? '')]) || []));
    setError('');
  };

  const cancelEditingRecord = () => {
    setEditingRecordId(null);
    setEditingRecordDraft({});
  };

  const saveRecord = async (recordId: string) => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/cms/${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'record', id: recordId, collectionId: selected.id, data: editingRecordDraft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to update record');
      setCollections(current => current.map(collection => collection.id === selected.id
        ? { ...collection, records: collection.records.map(record => record.id === recordId ? data : record) }
        : collection));
      cancelEditingRecord();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Unable to update record');
    } finally { setSaving(false); }
  };

  return (
    <section className='w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-[#172033] shadow-sm'>
      <div className='border-b border-gray-200 px-5 py-4'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <h2 className='text-xl font-semibold'>CMS collections</h2>
            <p className='mt-1 text-sm text-gray-500'>Create project data and bind it to CMS tables in the editor.</p>
            <p className='mt-2 text-xs text-gray-400'>Plan limits: {collectionLimit === null ? 'unlimited' : collectionLimit} collections, {recordLimit === null ? 'unlimited' : recordLimit} records per collection.</p>
          </div>
          <button type='button' onClick={() => { setError(''); setCollectionForm(emptyCollection); setIsCreateCollectionOpen(true); }} disabled={saving || collectionLimitReached} className='inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50'><Plus size={16} /> New collection</button>
        </div>
      </div>
      {error && <p className='mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>{error}</p>}
      {loading ? <p className='p-5 text-sm text-gray-500'>Loading CMS...</p> : collections.length === 0 ? <p className='p-5 text-sm text-gray-500'>No collections yet.</p> : <>
        <div className='grid min-h-130 lg:grid-cols-[220px_minmax(0,1fr)]'>
          <div className='border-b border-gray-200 bg-gray-50 p-3 lg:border-b-0 lg:border-r'>
            <div className='mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400'>Collections</div>
            <div className='space-y-1'>
              {collections.map(collection => <button key={collection.id} type='button' onClick={() => setSelectedId(collection.id)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selected?.id === collection.id ? 'bg-white font-medium text-[#172033] shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:bg-white hover:text-gray-900'}`}><span className='truncate'>{collection.name}</span><span className='ml-2 text-xs text-gray-400'>{collection.records.length}</span></button>)}
            </div>
            {collectionLimitReached && <p className='mt-4 px-2 text-xs text-amber-700'>You have reached your CMS collection limit.</p>}
          </div>
          {selected && <div className='overflow-hidden rounded-xl'>
            <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-3'>
              <div className='min-w-0'>
                <h3 className='truncate text-sm font-semibold text-[#172033]'>{selected.name}</h3>
                <p className='text-xs text-gray-500'>{selected.records.length} records</p>
              </div>
              <Button type='button' onClick={() => setIsDeleteCollectionOpen(true)} disabled={saving} title='Delete collection' variant='destructive' size='sm'><Trash2 size={14} /> Delete collection</Button>
            </div>
            <div className='border-b border-gray-800/20 bg-white px-4 py-3'>
              <div className='mb-2 flex flex-wrap items-center gap-2'>
                <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>Fields</span>
                {fieldDraft.map(field => <span key={field} className='inline-flex items-center gap-1 rounded-lg border border-gray-700 bg-white px-2 py-1 text-xs text-[#172033]'><span className='max-w-32 truncate'>{field}</span>
                  <button type='button' onClick={() => removeField(field)} disabled={saving || fieldDraft.length <= 1} title={`Remove ${field} field`} className='text-gray-500 hover:text-red-500 disabled:opacity-40'><X size={13} /></button>
                </span>)}
                <button type='button' onClick={() => setIsAddFieldModalOpen(true)} disabled={saving} title='Add field' aria-label='Add field' className='inline-flex items-center justify-center rounded-lg border border-gray-700 bg-white p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#172033] disabled:opacity-50'><Plus size={14} /></button>
              </div>
            </div>
            <div className='flex flex-wrap items-center justify-between gap-3 border-b border-gray-800/20 bg-white px-4 py-3'>
              <label className='relative min-w-48 flex-1'>
                <Search size={15} className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' />
                <input value={recordSearch} onChange={event => { setRecordSearch(event.target.value); setRecordPage(1); }} placeholder='Filter records...' className='w-full rounded-lg border border-gray-800/20 bg-white py-2 pl-9 pr-3 text-sm text-[#172033] outline-none' />
              </label>
              <label className='flex items-center gap-2 text-xs text-gray-500'>
                Per page
                <select value={recordsPerPage} onChange={event => { setRecordsPerPage(Number(event.target.value)); setRecordPage(1); }} className='rounded-lg border border-gray-800/20 bg-white px-2 py-2 text-sm text-[#172033] outline-none'>
                  {[10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            </div>
            <div className='overflow-x-auto'>
              <div className='min-w-160'>
                <div className='grid gap-1 border-b border-gray-800/20 bg-white px-4 py-3' style={{ gridTemplateColumns: `repeat(${selected.fields.length}, minmax(120px, 1fr)) 64px` }}>
                  {selected.fields.map(field => <span key={field} className='truncate text-xs font-semibold uppercase tracking-wide text-gray-500' title={field}>{field}</span>)}<span />
                </div>
                {visibleRecords.map(record => <div key={record.id} className='grid gap-1 border-b border-gray-800/20 px-4 py-3 last:border-b-0' style={{ gridTemplateColumns: `repeat(${selected.fields.length}, minmax(120px, 1fr)) 64px` }}>
                  {selected.fields.map(field => editingRecordId === record.id
                    ? <input key={field} value={editingRecordDraft[field] || ''} onChange={event => setEditingRecordDraft(current => ({ ...current, [field]: event.target.value }))} className='min-w-0 w-full rounded-lg border border-gray-800/20 bg-white px-2 py-2 text-sm text-[#172033] outline-none focus:border-blue-400' aria-label={`${field} for ${record.id}`} />
                    : <span key={field} className='block min-w-0 truncate text-sm text-[#172033]' title={String(record.data[field] ?? '')}>{String(record.data[field] ?? '')}</span>)}
                  <div className='flex items-center justify-end gap-2'>
                    {editingRecordId === record.id ? <>
                      <button type='button' onClick={() => saveRecord(record.id)} disabled={saving} title='Save record' className='text-emerald-300 hover:text-emerald-200 disabled:opacity-50'><Check size={15} /></button>
                      <button type='button' onClick={cancelEditingRecord} disabled={saving} title='Cancel editing' className='text-gray-500 hover:text-gray-200 disabled:opacity-50'><X size={15} /></button>
                    </> : <>
                      <button type='button' onClick={() => startEditingRecord(record)} title='Edit record' className='text-gray-500 hover:text-blue-300'><Pencil size={15} /></button>
                      <button type='button' onClick={() => deleteRecord(record.id)} title='Delete record' className='text-gray-500 hover:text-red-300'><Trash2 size={15} /></button>
                    </>}
                  </div>
                </div>)}
                <div className='grid gap-1 bg-white px-4 py-3' style={{ gridTemplateColumns: `repeat(${selected.fields.length}, minmax(120px, 1fr)) 64px` }}>
                  {selected.fields.map(field => <input key={field} value={recordDraft[field] || ''} onChange={event => setRecordDraft({ ...recordDraft, [field]: event.target.value })} placeholder={field} className='min-w-0 w-full rounded-lg border border-gray-800/20 bg-white px-2 py-2 text-sm text-[#172033]' />)}
                  <button type='button' onClick={addRecord} disabled={saving || (recordLimit !== null && selected.records.length >= recordLimit)} title='Add record' className='flex items-center justify-center text-green-500 hover:text-green-400 disabled:opacity-50'><Plus size={18} /></button>
                </div>
              </div>
            </div>
            <div className='flex flex-wrap items-center justify-between gap-3 border-t border-gray-800/20 px-4 py-3'>
              <span className='text-xs text-gray-500'>Showing {filteredRecords.length === 0 ? 0 : (currentRecordPage - 1) * recordsPerPage + 1}-{Math.min(currentRecordPage * recordsPerPage, filteredRecords.length)} of {filteredRecords.length} records</span>
              <div className='flex items-center gap-2'>
                <button type='button' onClick={() => setRecordPage(page => Math.max(1, page - 1))} disabled={currentRecordPage === 1} title='Previous page' className='rounded-lg border border-gray-700 p-1.5 text-black disabled:opacity-40'><ChevronLeft size={16} /></button>
                <span className='min-w-16 text-center text-xs text-gray-400'>Page {currentRecordPage} of {totalRecordPages}</span>
                <button type='button' onClick={() => setRecordPage(page => Math.min(totalRecordPages, page + 1))} disabled={currentRecordPage === totalRecordPages} title='Next page' className='rounded-lg border border-gray-700 p-1.5 text-black disabled:opacity-40'><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>}
        </div>
      </>}
      <Dialog open={isAddFieldModalOpen} onOpenChange={open => { if (!open) setIsAddFieldModalOpen(false); }}>
        <DialogContent className='max-w-sm'>
          <DialogHeader><DialogTitle>Add field</DialogTitle></DialogHeader>
          <input autoFocus value={fieldName} onChange={event => setFieldName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void submitNewField(); } }} placeholder='Field name' className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#172033] outline-none focus:border-emerald-500' />
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setIsAddFieldModalOpen(false)}>Cancel</Button>
            <Button type='button' onClick={() => void submitNewField()} disabled={saving || !fieldName.trim()} className='bg-emerald-900 text-white hover:bg-emerald-800'>Add field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Drawer direction='right' open={isCreateCollectionOpen} onOpenChange={open => { if (!open) setIsCreateCollectionOpen(false); }}>
        <DrawerContent className='h-full max-h-screen w-full max-w-xl rounded-none border-l border-gray-200 text-[#172033]'>
          <DrawerHeader className='border-b border-gray-200'>
            <DrawerTitle>Create a new collection</DrawerTitle>
            <DrawerDescription>Create a table under <span className='rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700'>public</span></DrawerDescription>
          </DrawerHeader>
          <div className='flex-1 overflow-y-auto px-2 py-2'>
            <label className='block text-sm font-medium text-gray-700'>Name
              <input autoFocus value={collectionForm.name} onChange={event => setCollectionForm({ ...collectionForm, name: event.target.value })} placeholder='Collection name' className='mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100' />
            </label>
            <div className='mt-8 border-t border-gray-200 pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-sm font-semibold'>Columns</h3>
                  <p className='mt-1 text-xs text-gray-500'>Add the fields your collection records will use.</p>
                </div>
                <Button type='button' onClick={addCollectionField} variant='outline' size='sm'><Plus size={14} /> Add column</Button>
              </div>
              <div className='mt-4 space-y-2'>
                {collectionForm.fields.map((field, index) => <div key={index} className='flex items-center gap-2'>
                  <span className='w-5 text-center text-xs text-gray-400'>{index + 1}</span>
                  <input value={field} onChange={event => updateCollectionField(index, event.target.value)} placeholder='Column name' className='min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100' />
                  <Button type='button' onClick={() => removeCollectionField(index)} title='Remove column' aria-label={`Remove column ${index + 1}`} variant='ghost' size='icon-sm' className='text-gray-400 hover:bg-red-50 hover:text-red-500'><X size={16} /></Button>
                </div>)}
              </div>
            </div>
          </div>
          <DrawerFooter className='border-t border-gray-200'>
            <Button type='button' variant='outline' onClick={() => setIsCreateCollectionOpen(false)}>Cancel</Button>
            <Button type='button' onClick={() => void createCollection()} disabled={saving || collectionLimitReached || !collectionForm.name.trim() || collectionForm.fields.every(field => !field.trim())} className='bg-emerald-900 text-white hover:bg-emerald-800'>{saving ? 'Creating...' : 'Create collection'}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <Dialog open={isDeleteCollectionOpen} onOpenChange={setIsDeleteCollectionOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete collection?</DialogTitle>
            <DialogDescription>Delete the {selected?.name} collection and all of its records? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setIsDeleteCollectionOpen(false)}>Cancel</Button>
            <Button type='button' variant='destructive' onClick={() => void deleteCollection()} disabled={saving}>Delete collection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
