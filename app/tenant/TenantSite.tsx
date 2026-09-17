"use client";

import { useEffect } from 'react';
import { ElementRenderer } from '../components/canvas/ElementRenderer';
import { useBuilderStore } from '../stores/builderStore';
import type { Page } from '../types/builder';

interface TenantSiteProps {
  projectId: string;
  projectName: string;
  pages: Page[];
  currentPageId: string;
}

export default function TenantSite({ projectId, projectName, pages, currentPageId }: TenantSiteProps) {
  const loadProject = useBuilderStore(state => state.loadProject);
  const setPreviewMode = useBuilderStore(state => state.setPreviewMode);
  const storePages = useBuilderStore(state => state.pages);
  const storeCurrentPageId = useBuilderStore(state => state.currentPageId);
  const loadedProjectId = useBuilderStore(state => state.projectId);

  useEffect(() => {
    loadProject(projectId, pages, currentPageId, projectName);
    setPreviewMode(true);
  }, [currentPageId, loadProject, pages, projectId, projectName, setPreviewMode]);

  if (loadedProjectId !== projectId) return <div className="min-h-screen bg-white" />;

  const page = storePages.find(candidate => candidate.id === storeCurrentPageId) || storePages[0];
  if (!page) return null;

  return (
    <main className="min-h-screen bg-white">
      {page.elements.map(element => (
        <ElementRenderer key={element.id} element={element} isPreview />
      ))}
    </main>
  );
}