'use client';

import { useEffect, useState } from 'react';
import { Check, ShoppingCart } from 'lucide-react';
import { ShopProvider, ShopSettings } from '@/app/types/shop';
import { canUseShopForRole } from '@/app/lib/projectLimits';

const defaultSettings: ShopSettings = { project_id: '', provider: 'stripe', currency: 'usd', enabled: false };

export default function ShopManager({ projectId }: { projectId: string }) {
  const [settings, setSettings] = useState<ShopSettings>({ ...defaultSettings, project_id: projectId });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('free');
  const shopAllowed = canUseShopForRole(role);

  useEffect(() => {
    fetch(`/api/shop/${encodeURIComponent(projectId)}`, { credentials: 'include' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Unable to load shop settings.')))
      .then(data => setSettings({ ...defaultSettings, ...data, project_id: projectId }))
      .catch(value => setError(value instanceof Error ? value.message : 'Unable to load shop settings.'));
  }, [projectId]);

  useEffect(() => {
    fetch('/api/users').then(response => response.ok ? response.json() : null).then(data => {
      if (data?.role) setRole(String(data.role).toLowerCase());
    }).catch(() => undefined);
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/shop/${encodeURIComponent(projectId)}`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to save shop settings.');
      setSettings(data);
      setMessage('Shop settings saved.');
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Unable to save shop settings.');
    } finally { setSaving(false); }
  };

  const createProductsCollection = async () => {
    setError('');
    const response = await fetch(`/api/cms/${encodeURIComponent(projectId)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'seed', name: 'Products', slug: 'products', fields: ['name', 'price', 'image', 'description', 'checkout_url'] }),
    });
    const data = await response.json();
    if (!response.ok) setError(data?.error || 'Unable to create the Products collection.');
    else setMessage('Products collection is ready in CMS.');
  };

  return (
    <section className='mt-6 rounded-3xl border border-gray-800 bg-[#111214] p-6 space-y-5'>
      <div className='flex items-start gap-3'>
        <ShoppingCart className='mt-1 text-emerald-300' size={20} />
        <div><h2 className='text-xl font-semibold'>Shop</h2><p className='mt-1 text-sm text-gray-400'>Sell products managed in CMS. Add a button inside a Products CMS map and enable shop checkout in its content settings.</p></div>
      </div>
      {error && <p className='rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm text-red-200'>{error}</p>}
      {message && <p className='rounded-lg border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-200'>{message}</p>}
      <div className='grid gap-4 md:grid-cols-3'>
        <label className='text-sm text-gray-300'>Payment provider<select value={settings.provider} onChange={event => setSettings({ ...settings, provider: event.target.value as ShopProvider })} className='mt-2 w-full rounded-xl border border-gray-700 bg-[#0f1218] px-3 py-2 text-sm'><option value='stripe'>Stripe</option><option value='paypal'>PayPal</option><option value='external'>External checkout URL</option></select></label>
        <label className='text-sm text-gray-300'>Currency<input value={settings.currency} maxLength={3} onChange={event => setSettings({ ...settings, currency: event.target.value.toLowerCase() })} className='mt-2 w-full rounded-xl border border-gray-700 bg-[#0f1218] px-3 py-2 text-sm' /></label>
        <label className='flex items-end gap-2 pb-2 text-sm text-gray-300'><input type='checkbox' checked={settings.enabled} disabled={!shopAllowed} onChange={event => setSettings({ ...settings, enabled: event.target.checked })} /> Enable shop payments</label>
      </div>
      {!shopAllowed && <p className='text-xs text-amber-300'>Shop payments require a Pro plan or higher.</p>}
      <div className='flex flex-wrap gap-3'>
        <button type='button' onClick={save} disabled={saving} className='inline-flex items-center gap-2 rounded-xl bg-[#1D976C] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50'><Check size={16} /> {saving ? 'Saving...' : 'Save shop settings'}</button>
        <button type='button' onClick={createProductsCollection} className='rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800'>Create Products CMS collection</button>
      </div>
      <p className='text-xs text-gray-500'>Product records need at least a name and price. Stripe uses image when present; external checkout uses checkout_url.</p>
    </section>
  );
}