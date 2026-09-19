"use client";

import { useEffect } from 'react';
import { ElementRenderer } from '../components/canvas/ElementRenderer';
import { useBuilderStore } from '../stores/builderStore';
import type { Breakpoint, Page } from '../types/builder';

interface TenantSiteProps {
  projectId: string;
  projectName: string;
  pages: Page[];
  currentPageId: string;
}

export default function TenantSite({ projectId, projectName, pages, currentPageId }: TenantSiteProps) {
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

  const page = storePages.find(candidate => candidate.id === storeCurrentPageId) || storePages[0];
  if (!page) return null;

  return (
    <main className="min-h-screen bg-white">
      {page.elements.map(element => (
        <ElementRenderer key={element.id} element={element} isPreview isPublishedSite />
      ))}
    </main>
  );
}