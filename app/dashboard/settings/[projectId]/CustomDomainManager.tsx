'use client';

import { useEffect, useState } from 'react';

interface DomainChallenge {
  domain: string;
  type: string;
  value: string;
  reason?: string;
}

interface ProjectDomain {
  id: string;
  domain: string;
  verified: boolean;
  verification: DomainChallenge[];
}

export default function CustomDomainManager({ projectId }: { projectId: string }) {
  const [domains, setDomains] = useState<ProjectDomain[]>([]);
  const [domainInput, setDomainInput] = useState('');
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadDomains = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/domains`, { cache: 'no-store' });
      const data = await response.json();
      if (response.status === 403) {
        setHasAccess(false);
        setDomains([]);
        return;
      }
      if (!response.ok) throw new Error(data?.error || 'Unable to load custom domains.');
      setHasAccess(true);
      setDomains(data.domains || []);
      setConfigured(Boolean(data.configured));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load custom domains.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDomains();
  }, [projectId]);

  const updateDomain = async (method: 'POST' | 'PATCH' | 'DELETE', domainId?: string) => {
    setError(null);
    setMessage(null);
    setSaving(method === 'POST');
    setBusyId(domainId || null);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/domains`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(method === 'POST' ? { domain: domainInput } : { domainId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to update custom domain.');
      if (method === 'POST') setDomainInput('');
      setMessage(method === 'DELETE' ? 'Domain disconnected.' : method === 'POST' ? 'Domain added. Update its DNS records below.' : data.domain?.verified ? 'Domain ownership verified. DNS routing may still be propagating.' : 'Domain is not verified yet. Check DNS records and try again.');
      await loadDomains();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update custom domain.');
    } finally {
      setSaving(false);
      setBusyId(null);
    }
  };

  return (
    <section className='rounded-3xl border border-gray-800 bg-[#111214] p-6' aria-labelledby='custom-domains-heading'>
      <div className='border-b border-gray-800 pb-5'>
        <h2 id='custom-domains-heading' className='text-base font-semibold text-white'>Custom domains</h2>
        <p className='mt-1 text-sm text-gray-400'>Connect domains you own and manage DNS with your registrar.</p>
      </div>

      {error && <p role='alert' className='mt-4 rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm text-red-200'>{error}</p>}
      {message && <p role='status' className='mt-4 rounded-lg border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-200'>{message}</p>}

      {hasAccess === false ? (
        <p className='mt-5 text-sm text-gray-300'>Custom domains are available on the Pro plan and above. <a href='/pricing' className='font-semibold text-emerald-300 underline underline-offset-4 hover:text-emerald-200'>View plans</a></p>
      ) : !configured ? (
        <p className='mt-5 text-sm text-amber-200'>Custom domain connections are not configured for this LUNIO deployment.</p>
      ) : (
        <>
          <form onSubmit={event => { event.preventDefault(); void updateDomain('POST'); }} className='mt-5 flex flex-col gap-3 sm:flex-row'>
            <label className='sr-only' htmlFor='custom-domain-input'>Domain name</label>
            <input
              id='custom-domain-input'
              value={domainInput}
              onChange={event => setDomainInput(event.target.value)}
              placeholder='example.com or www.example.com'
              autoComplete='url'
              className='min-w-0 flex-1 rounded-lg border border-gray-700 bg-[#0f1218] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400'
            />
            <button type='submit' disabled={saving || !domainInput.trim()} className='rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50'>
              {saving ? 'Adding…' : 'Add domain'}
            </button>
          </form>

          {loading ? <p className='mt-5 text-sm text-gray-500'>Loading domains…</p> : domains.length === 0 ? (
            <p className='mt-5 text-sm text-gray-500'>No custom domains connected.</p>
          ) : (
            <ul className='mt-5 divide-y divide-gray-800'>
              {domains.map(domain => (
                <li key={domain.id} className='py-5 first:pt-0 last:pb-0'>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='break-all text-sm font-semibold text-white'>{domain.domain}</p>
                      <p className={`mt-1 text-xs ${domain.verified ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {domain.verified ? 'Ownership verified' : 'Waiting for DNS verification'}
                      </p>
                    </div>
                    <div className='flex shrink-0 gap-2'>
                      {!domain.verified && <button type='button' disabled={busyId === domain.id} onClick={() => void updateDomain('PATCH', domain.id)} className='rounded-md border border-gray-700 px-3 py-2 text-xs font-medium text-white hover:border-sky-400 disabled:opacity-50'>{busyId === domain.id ? 'Checking…' : 'Verify'}</button>}
                      <button type='button' disabled={busyId === domain.id} onClick={() => void updateDomain('DELETE', domain.id)} className='rounded-md border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 hover:border-red-500 hover:text-red-200 disabled:opacity-50'>Disconnect</button>
                    </div>
                  </div>

                  <div className='mt-4 space-y-3 rounded-lg border border-gray-800 bg-[#0c0e12] p-4 text-xs text-gray-300'>
                    <p className='font-medium text-white'>DNS records for Vercel</p>
                    <p>For an apex domain, point an A record at <code className='font-mono text-sky-200'>76.76.21.21</code>. For a subdomain such as www, use a CNAME to <code className='font-mono text-sky-200'>cname.vercel-dns.com</code>.</p>
                    {!domain.verified && domain.verification.map((record, index) => (
                        <div key={`${record.domain}-${record.value}-${index}`} className='grid gap-1 border-t border-gray-800 pt-3 sm:grid-cols-[5rem_1fr]'>
                          <span className='text-gray-500'>{record.type} record</span>
                          <span className='break-all'><span className='text-gray-500'>Name:</span> <code className='font-mono text-sky-200'>{record.domain}</code></span>
                          <span className='sm:col-start-2 break-all'><span className='text-gray-500'>Value:</span> <code className='font-mono text-sky-200'>{record.value}</code></span>
                          {record.reason && <span className='sm:col-start-2 text-gray-500'>{record.reason}</span>}
                        </div>
                    ))}
                    <p className='border-t border-gray-800 pt-3 text-gray-500'>DNS changes can take time to propagate. Keep existing mail records unchanged.</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}