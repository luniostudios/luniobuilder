"use client";

import { useEffect, useState } from 'react';
import { CmsRecordProvider, ElementRenderer } from '../components/canvas/ElementRenderer';
import { useBuilderStore } from '../stores/builderStore';
import type { Breakpoint, Page } from '../types/builder';
import type { CmsRecord } from '../types/cms';

interface TenantSiteProps {
  projectId: string;
  projectName: string;
  pages: Page[];
  currentPageId: string;
  isPageUnlocked: boolean;
  cmsRecord?: Pick<CmsRecord, 'id' | 'data'> | null;
}

export default function TenantSite({ projectId, projectName, pages, currentPageId, isPageUnlocked, cmsRecord = null }: TenantSiteProps) {
  const loadProject = useBuilderStore(state => state.loadProject);
  const setPreviewMode = useBuilderStore(state => state.setPreviewMode);
  const setBreakpoint = useBuilderStore(state => state.setBreakpoint);
  const storePages = useBuilderStore(state => state.pages);
  const storeCurrentPageId = useBuilderStore(state => state.currentPageId);
  const loadedProjectId = useBuilderStore(state => state.projectId);

  useEffect(() => {
    loadProject(projectId, pages, currentPageId, projectName);
    setPreviewMode(true);
  }, [currentPageId, loadProject, pages, projectId, projectName, setPreviewMode]);

  useEffect(() => {
    const getBreakpoint = (width: number): Breakpoint => {
      if (width <= 479) return 'mobile';
      if (width <= 767) return 'mobileLandscape';
      if (width <= 991) return 'tablet';
      if (width <= 1200) return 'laptop';
      if (width >= 1920) return 'widescreen';
      return 'desktop';
    };

    const updateBreakpoint = () => setBreakpoint(getBreakpoint(window.innerWidth));
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, [setBreakpoint]);

  if (loadedProjectId !== projectId) return <div className="min-h-screen bg-white" />;

  if (!isPageUnlocked) return <PagePasswordGate projectId={projectId} pageId={currentPageId} />;

  const page = storePages.find(candidate => candidate.id === storeCurrentPageId) || storePages[0];
  if (!page) return null;
  const detailPage = storePages.find(candidate => candidate.cmsDetail?.enabled && candidate.slug !== '/');
  const detailRoutePrefix = detailPage?.slug;
  const detailSettings = detailPage?.cmsDetail
    ? { ...detailPage.cmsDetail, routePrefix: detailRoutePrefix }
    : undefined;

  return (
    <main className="relative min-h-screen bg-white pb-10">
      <CmsRecordProvider record={cmsRecord} detailSettings={detailSettings}>
        {page.elements.map(element => (
          <ElementRenderer key={element.id} element={element} isPreview isPublishedSite />
        ))}
      </CmsRecordProvider>
    </main>
  );
}

function PagePasswordGate({ projectId, pageId }: { projectId: string; pageId: string }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const response = await fetch('/api/site-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, pageId, password }),
    });
    if (response.ok) window.location.reload();
    else {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Unable to unlock this page.');
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-xl">
        <h1 className="text-lg font-semibold">Password protected page</h1>
        <p className="mt-2 text-sm text-slate-400">Enter the password to continue.</p>
        <input
          autoFocus
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          className="mt-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-400"
          placeholder="Password"
          aria-label="Page password"
        />
        {error && <p className="mt-2 text-sm text-red-300" role="alert">{error}</p>}
        <button type="submit" disabled={submitting || !password} className="mt-4 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? 'Checking...' : 'Continue'}
        </button>
      </form>
    </main>
  );
}