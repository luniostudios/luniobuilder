'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { redirect, useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ShopManager from './ShopManager';

interface ProjectRecord {
  id: string;
  title: string;
  slug: string;
  favicon_url?: string | null;
  created_at: string;
  updated_at: string;
  vercel_token?: string | null;
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string | undefined;
  const { data: session, status } = useSession();


  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [vercel_token, setVercelKey] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/signin');
  }, [router, status]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const fetchProject = async () => {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/projects?projectId=${encodeURIComponent(projectId)}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || 'Unable to load project settings.');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setProject(data);
      setTitle(data.title || '');
      setSlug(data.slug || '');
      setFaviconUrl(data.favicon_url || '');
      setVercelKey(data.vercel_token || storedToken);
      setLoading(false);
    };

    const projectKey = `vercelToken_${projectId}`;
    const storedToken = typeof window !== 'undefined'
      ? window.localStorage.getItem(projectKey) || window.localStorage.getItem('vercelToken') || ''
      : '';

    fetchProject();
  }, [projectId]);

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const supportedTypes = ['image/png', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!supportedTypes.includes(file.type)) {
      setError('Choose a PNG, SVG, or ICO favicon.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Favicon files must be 2 MB or smaller.');
      return;
    }

    setFaviconUploading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/assets', { method: 'POST', body: formData, credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to upload favicon.');
      setFaviconUrl(data.asset.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload favicon.');
    } finally {
      setFaviconUploading(false);
    }
  };

  const handleSave = async () => {
    if (!projectId) {
      setError('Project ID is missing.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const response = await fetch('/api/projects', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        title,
        slug,
        vercel_token,
        favicon_url: faviconUrl,
      }),
    });

    let data: ProjectRecord | { error?: string } | null = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      setError(data && 'error' in data ? data.error || 'Unable to save project settings.' : 'Unable to save project settings.');
      setSaving(false);
      return;
    }

    if (typeof window !== 'undefined') {
      const projectKey = `vercelToken_${projectId}`;
      if (vercel_token.trim()) {
        window.localStorage.setItem(projectKey, vercel_token.trim());
      } else {
        window.localStorage.removeItem(projectKey);
      }
      window.localStorage.setItem(`projectTitle_${projectId}`, title || 'Untitled Project');
    }

    setSuccessMessage('Project settings saved successfully.');
    setSaving(false);
    if (data && !('error' in data)) setProject(data as ProjectRecord);
    router.refresh();
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-[#0d1117] text-white flex items-center justify-center'>
        Loading project settings...
      </div>
    );
  }

  if (!session) {
    redirect('auth/signin');
  }

  return (
    <div className='min-h-screen bg-[#0d1117] text-white px-6 py-8'>
      <div className='max-w-3xl mx-auto'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8'>
          <div>
            <Link href='/dashboard' className='mb-3 inline-block text-sm text-gray-400 hover:text-white'>
              ← Back to Dashboard
            </Link>
            <h1 className='text-4xl font-bold'>Project Settings</h1>
            <p className='text-gray-400 mt-2'>Update your project title, slug, and other basic settings.</p>
          </div>
          <div className='rounded-full bg-[#1D976C] px-4 py-2 text-sm font-semibold text-black'>
            {project?.id}
          </div>
        </div>

        {error && <div className='mb-4 rounded-xl border border-red-700 bg-red-950/20 p-4 text-sm text-red-200'>{error}</div>}
        {successMessage && <div className='mb-4 rounded-xl border border-green-700 bg-emerald-950/20 p-4 text-sm text-emerald-200'>{successMessage}</div>}

        <div className='rounded-3xl border border-gray-800 bg-[#111214] p-6 space-y-6'>
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-300'>Project title</label>
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder='Project title'
              className='w-full rounded-2xl border border-gray-700 bg-[#0f1218] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500'
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-300'>Website favicon</label>
            <div className='flex items-center gap-4 rounded-xl border border-gray-700 bg-[#0f1218] p-4'>
              <div className='flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-700 bg-gray-900'>
                {faviconUrl ? <img src={faviconUrl} alt='Favicon preview' className='size-8 object-contain' /> : <span className='text-xs text-gray-600'>ICO</span>}
              </div>
              <div className='min-w-0 flex-1'>
                <input
                  type='file'
                  accept='.png,.svg,.ico,image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon'
                  onChange={handleFaviconUpload}
                  disabled={faviconUploading}
                  aria-label='Upload website favicon'
                  className='block w-full text-xs text-gray-400 file:mr-3 file:rounded-md file:border file:border-gray-600 file:bg-gray-800 file:px-3 file:py-2 file:text-xs file:font-medium file:text-gray-200 hover:file:bg-gray-700 disabled:opacity-60'
                />
                <p className='mt-2 text-[11px] text-gray-500'>{faviconUploading ? 'Uploading favicon…' : 'PNG, SVG, or ICO · up to 2 MB. Save settings to publish the change.'}</p>
              </div>
              {faviconUrl && <button type='button' onClick={() => setFaviconUrl('')} className='shrink-0 rounded-md border border-gray-700 px-3 py-2 text-xs text-gray-300 transition hover:border-red-400/40 hover:text-red-300'>Remove</button>}
            </div>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-300'>Vercel API Key</label>
            <input
              type='password'
              value={vercel_token}
              onChange={event => setVercelKey(event.target.value)}
              placeholder='Enter Vercel Personal Token'
              className='w-full rounded-2xl border border-gray-700 bg-[#0f1218] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500'
            />
            <p className='mt-2 text-sm text-gray-500'>This value is stored locally in your browser and used for Vercel publishing.</p>
          </div>

          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
            <button
              onClick={handleSave}
              disabled={saving || faviconUploading}
              className='rounded-full bg-[#1D976C] px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-60'
            >
              {saving ? 'Saving…' : 'Save settings'}
            </button>
            <Link
              href={`/editor?projectId=${projectId}`}
              className='rounded-full border border-gray-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800'
            >
              Open project
            </Link>
          </div>
        </div>

        {projectId && <ShopManager projectId={projectId} />}
      </div>
    </div>
  );
}
