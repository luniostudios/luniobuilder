'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Save } from 'lucide-react';
import type { AIProvider } from '../../../types/ai';

type Credential = { provider: AIProvider; apiKey: string; updatedAt?: string };

const providerLabels: Record<AIProvider, string> = {
  'gemini-3.6-flash': 'Gemini 3.6 Flash',
  'gemini-pro': 'Gemini Pro',
  openai: 'OpenAI',
  claude: 'Anthropic Claude',
};

export default function AIProviderManager() {
  const [provider, setProvider] = useState<AIProvider>('gemini-3.6-flash');
  const [apiKey, setApiKey] = useState('');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadCredentials = async () => {
    setLoading(true);
    const response = await fetch('/api/ai-credentials');
    const data = await response.json().catch(() => []);
    if (!response.ok) setError(data?.error || 'Unable to load AI credentials.');
    else setCredentials(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { void loadCredentials(); }, []);

  const saveCredential = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    const response = await fetch('/api/ai-credentials', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) setError(data?.error || 'Unable to save API key.');
    else {
      setApiKey('');
      setMessage(data.removed ? `${providerLabels[provider]} key removed.` : `${providerLabels[provider]} key saved securely.`);
      await loadCredentials();
    }
    setSaving(false);
  };

  const activeCredential = credentials.find(item => item.provider === provider);

  return (
    <section className='mt-6 rounded-3xl border border-gray-200 bg-white p-6 text-black shadow-lg sm:p-8'>
      <div className='flex items-start gap-3'>
        <div className='rounded-xl bg-gray-500/10 p-2 text-black'><KeyRound size={18} /></div>
        <div>
          <h2 className='text-xl font-semibold'>AI provider keys</h2>
          <p className='mt-1 text-sm text-gray-400'>Use your own Gemini, OpenAI, or Claude key across your account. Keys are encrypted before storage and never returned in full.</p>
        </div>
      </div>
      {error && <p className='mt-4 rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm text-red-200'>{error}</p>}
      {message && <p className='mt-4 rounded-lg border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-200'>{message}</p>}
      <div className='mt-5 grid gap-3 sm:grid-cols-[180px_1fr_auto]'>
        <select value={provider} onChange={event => setProvider(event.target.value as AIProvider)} className='rounded-xl border border-gray-700 bg-white px-3 py-3 text-sm text-black outline-none'>
          {Object.entries(providerLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input type='password' value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder={activeCredential?.apiKey || `Paste ${providerLabels[provider]} API key`} autoComplete='off' className='rounded-xl border border-gray-700 bg-white px-3 py-3 text-sm text-black outline-none' />
        <button type='button' onClick={saveCredential} disabled={saving || loading} className='inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50'><Save size={16} />{saving ? 'Saving...' : 'Save key'}</button>
      </div>
      <p className='mt-3 text-xs text-gray-500'>Leave the key blank and save to remove the selected provider key. When multiple keys exist, the most recently updated key is used.</p>
      <div className='mt-6 border-t border-gray-200 pt-5'>
        <h3 className='text-sm font-semibold text-gray-700'>Credentials on this account</h3>
        {loading ? (
          <p className='mt-3 text-sm text-gray-500'>Loading credentials...</p>
        ) : credentials.length === 0 ? (
          <p className='mt-3 text-sm text-gray-500'>No AI provider credentials saved.</p>
        ) : (
          <div className='mt-3 divide-y divide-gray-200 rounded-xl border border-gray-200'>
            {credentials.map(credential => (
              <div key={credential.provider} className='flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-900'>{providerLabels[credential.provider]}</p>
                  <p className='font-mono text-xs text-gray-500'>{credential.apiKey}</p>
                </div>
                {credential.updatedAt && (
                  <time dateTime={credential.updatedAt} className='text-xs text-gray-500'>
                    Updated {new Date(credential.updatedAt).toLocaleDateString()}
                  </time>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
