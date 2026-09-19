'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { CmsCollection, CmsRecord } from '@/app/types/cms';
import { getCmsCollectionLimitForRole, getCmsRecordLimitForRole } from '@/app/lib/projectLimits';

type CollectionWithRecords = CmsCollection & { records: CmsRecord[] };

const emptyCollection = { name: '', fields: '' };

export default function CmsManager({ projectId }: { projectId: string }) {
  const [collections, setCollections] = useState<CollectionWithRecords[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [collectionForm, setCollectionForm] = useState(emptyCollection);
  const [recordDraft, setRecordDraft] = useState<Record<string, string>>({});
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingRecordDraft, setEditingRecordDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('free');

  const selected = useMemo(() => collections.find(collection => collection.id === selectedId) || collections[0], [collections, selectedId]);
  const collectionLimit = getCmsCollectionLimitForRole(role);
  const recordLimit = getCmsRecordLimitForRole(role);
  const collectionLimitReached = collectionLimit !== null && collections.length >= collectionLimit;

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
    setRecordDraft(Object.fromEntries(fields.map(field => [field, ''])));
    setEditingRecordId(null);
    setEditingRecordDraft({});
  }, [selected?.id]);

  const createCollection = async () => {
    const fields = collectionForm.fields.split(',').map(field => field.trim()).filter(Boolean);
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
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Unable to create collection');
    } finally { setSaving(false); }
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
    <section className='rounded-3xl border border-gray-800 bg-[#111214] p-6 space-y-5'>
      <div>
        <h2 className='text-xl font-semibold'>CMS collections</h2>
        <p className='mt-1 text-sm text-gray-400'>Create project data and bind it to CMS tables in the editor.</p>
        <p className='mt-2 text-xs text-gray-500'>Plan limits: {collectionLimit === null ? 'unlimited' : collectionLimit} collections, {recordLimit === null ? 'unlimited' : recordLimit} records per collection.</p>
      </div>
      {error && <p className='rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm text-red-200'>{error}</p>}
      <div className='grid gap-3 md:grid-cols-[1fr_1fr_auto]'>
        <input value={collectionForm.name} onChange={event => setCollectionForm({ ...collectionForm, name: event.target.value })} placeholder='Collection name, e.g. Products' className='rounded-xl border border-gray-700 bg-[#0f1218] px-3 py-2 text-sm' />
        <input value={collectionForm.fields} onChange={event => setCollectionForm({ ...collectionForm, fields: event.target.value })} placeholder='Fields: name, price, image' className='rounded-xl border border-gray-700 bg-[#0f1218] px-3 py-2 text-sm' />
        <button type='button' onClick={createCollection} disabled={saving || collectionLimitReached} className='inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D976C] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50'><Plus size={16} /> Create</button>
      </div>
      {loading ? <p className='text-sm text-gray-500'>Loading CMS...</p> : collections.length === 0 ? <p className='text-sm text-gray-500'>No collections yet.</p> : <>
        <div className='flex flex-wrap gap-2'>
          {collections.map(collection => <button key={collection.id} type='button' onClick={() => setSelectedId(collection.id)} className={`rounded-xl border px-3 py-2 text-sm ${selected?.id === collection.id ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-700 text-gray-300'}`}>{collection.name} <span className='text-gray-500'>({collection.records.length})</span></button>)}
        </div>
        {collectionLimitReached && <p className='text-xs text-amber-300'>You have reached your CMS collection limit. Upgrade your plan to create more.</p>}
        {selected && <div className='overflow-x-auto rounded-xl border border-gray-800'>
          <div className='min-w-155'>
            <div className='grid gap-2 border-b border-gray-800 bg-gray-900/60 p-3' style={{ gridTemplateColumns: `repeat(${selected.fields.length}, minmax(140px, 1fr)) 40px` }}>
              {selected.fields.map(field => <span key={field} className='text-xs font-semibold uppercase tracking-wide text-gray-500'>{field}</span>)}<span />
            </div>
            {selected.records.map(record => <div key={record.id} className='grid gap-2 border-b border-gray-800 p-3' style={{ gridTemplateColumns: `repeat(${selected.fields.length}, minmax(140px, 1fr)) 72px` }}>
              {selected.fields.map(field => editingRecordId === record.id
                ? <input key={field} value={editingRecordDraft[field] || ''} onChange={event => setEditingRecordDraft(current => ({ ...current, [field]: event.target.value }))} className='min-w-0 rounded-lg border border-gray-700 bg-[#0f1218] px-2 py-2 text-sm text-gray-200 outline-none focus:border-blue-400' aria-label={`${field} for ${record.id}`} />
                : <span key={field} className='truncate text-sm text-gray-200' title={String(record.data[field] ?? '')}>{String(record.data[field] ?? '')}</span>)}
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
            <div className='grid gap-2 bg-gray-950/40 p-3' style={{ gridTemplateColumns: `repeat(${selected.fields.length}, minmax(140px, 1fr)) 40px` }}>
              {selected.fields.map(field => <input key={field} value={recordDraft[field] || ''} onChange={event => setRecordDraft({ ...recordDraft, [field]: event.target.value })} placeholder={field} className='rounded-lg border border-gray-700 bg-[#0f1218] px-2 py-2 text-sm' />)}
              <button type='button' onClick={addRecord} disabled={saving || (recordLimit !== null && selected.records.length >= recordLimit)} title='Add record' className='text-blue-300 hover:text-white disabled:opacity-50'><Plus size={18} /></button>
            </div>
          </div>
        </div>}
      </>}
    </section>
  );
}
