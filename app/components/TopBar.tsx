"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Monitor, Tablet, Smartphone, Undo2, Redo2, Eye, EyeOff,
  ZoomIn, ZoomOut, Download, Share2, Settings,
  Play,
  Check,
  Loader,
  MonitorCheck,
  Code,
  Folder,
  FileCode2,
  FileJson2,
  FileText,
  Search,
  GitBranch,
  Braces,
  X,
  ExternalLink,
  Laptop,
  Globe,
  Rocket,
} from 'lucide-react';
import { useBuilderStore } from '../stores/builderStore';
import {
  renderElementToHtml,
  generateCssForPage,
  generateReactProjectFiles,
} from '../utils/builderUtils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { useSession } from 'next-auth/react';
import { useOthers } from '@liveblocks/react';
import { useAIGeneration } from './functions/useAIGeneration';
import { normalizeSiteSlug } from '../lib/tenant';
import { persistGeneratedCms } from '../utils/generatedCms';
import { Page } from '../types/builder';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
}

interface ProjectRecord {
    id: string;
    user_id?: string;
    title: string;
    slug: string;
    created_at: Date;
    updated_at: Date;
    vercelUrl: string;
    status: string;
    content?: {
        pages?: Page[];
        currentPageId?: string;
    };
}

interface InputPromptRequest {
  title: string;
  message?: string;
  initialValue?: string;
  placeholder?: string;
  type?: 'text' | 'password';
  resolve: (value: string | null) => void;
}

const collaboratorColors = ['#27c3f3', '#8bdc2f', '#ffb526', '#ff6868', '#a78bfa'];

const textEncoder = new TextEncoder();
const crc32Table = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crc32Table[n] = c;
}

const makeCrc32 = (data: Uint8Array) => {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const makeDosDateTime = () => {
  const now = new Date();
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() / 2);
  return { date, time };
};

const sanitizeCss = (css: string) => {
  if (!css) return css;
  // Remove any @font-face blocks (fonts are handled separately) to avoid bundler resolving local font files
  css = css.replace(/@font-face\s*{[\s\S]*?}/gi, '');
  // Remove url(...) references to local/next-generated font files (woff/woff2/ttf/otf)
  css = css.replace(/url\((['"]?)([^)'"]+\.(?:woff2?|ttf|otf))(?:#[^'"\)]*)?\1\)/gi, '');
  return css;
};

const createZipBlob = (files: Array<{ path: string; content: string }>) => {
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  const dosDateTime = makeDosDateTime();

  files.forEach(file => {
    const fileNameBytes = textEncoder.encode(file.path);
    const fileData = textEncoder.encode(file.content);
    const crc = makeCrc32(fileData);

    const localHeader = new ArrayBuffer(30 + fileNameBytes.length);
    const localView = new DataView(localHeader);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosDateTime.time, true);
    localView.setUint16(12, dosDateTime.date, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, fileData.length, true);
    localView.setUint32(22, fileData.length, true);
    localView.setUint16(26, fileNameBytes.length, true);
    localView.setUint16(28, 0, true);
    new Uint8Array(localHeader, 30).set(fileNameBytes);

    chunks.push(new Uint8Array(localHeader));
    chunks.push(fileData);

    const centralHeader = new ArrayBuffer(46 + fileNameBytes.length);
    const centralView = new DataView(centralHeader);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosDateTime.time, true);
    centralView.setUint16(14, dosDateTime.date, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, fileData.length, true);
    centralView.setUint32(24, fileData.length, true);
    centralView.setUint16(28, fileNameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    new Uint8Array(centralHeader, 46).set(fileNameBytes);
    centralDirectory.push(new Uint8Array(centralHeader));

    offset += localHeader.byteLength + fileData.length;
  });

  const centralOffset = offset;
  const centralSize = centralDirectory.reduce((total, chunk) => total + chunk.length, 0);
  chunks.push(...centralDirectory);

  const endHeader = new ArrayBuffer(22);
  const endView = new DataView(endHeader);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, centralDirectory.length, true);
  endView.setUint16(10, centralDirectory.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, centralOffset, true);
  endView.setUint16(20, 0, true);
  chunks.push(new Uint8Array(endHeader));

  return new Blob(chunks as any, { type: 'application/zip' });
};

type FileTreeNode = {
  name: string;
  path?: string;
  isFile: boolean;
  children?: Record<string, FileTreeNode>;
};

const sortTreeNodes = (a: FileTreeNode, b: FileTreeNode) => {
  if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
  return a.isFile ? 1 : -1;
};

const buildFileTree = (files: Array<{ path: string; content: string }>): FileTreeNode[] => {
  const root: FileTreeNode = { name: '', isFile: false, children: {} };

  files.forEach(file => {
    const parts = file.path.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      if (!current.children) current.children = {};

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          isFile,
          path: isFile ? file.path : undefined,
          children: isFile ? undefined : {},
        };
      }

      current = current.children[part];
    });
  });

  return root.children ? Object.values(root.children).sort(sortTreeNodes) : [];
};

export const TopBar: React.FC = () => {
  const {
    projectId,
    projectName,
    pages,
    currentPageId,
    breakpoint,
    setBreakpoint,
    canvasScale,
    setCanvasScale,
    undo,
    redo,
    historyIndex,
    history,
    isPreviewMode,
    setPreviewMode,
    getCurrentPage,
    selectedElementId,
    getElementById,
    deleteElement,
    duplicateElement,
    replaceElementWithGenerated,
  } = useBuilderStore();

  const router = useRouter();
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [published, setPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');
  const [siteVercelUrl, setSiteVercelUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [codeFiles, setCodeFiles] = useState<Array<{ path: string; content: string }>>([]);
  const [selectedCodePath, setSelectedCodePath] = useState<string>('');
  const [codeSearch, setCodeSearch] = useState('');
  const saveTimeoutRef = useRef<number | null>(null);
  const saveAbortControllerRef = useRef<AbortController | null>(null);
  const isSavingRef = useRef(false);
  const isPublishingRef = useRef(false);
  const isInitialRender = useRef(true);
  const page = getCurrentPage();
  const { data: session, status } = useSession();
  const others = useOthers();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputPrompt, setInputPrompt] = useState<InputPromptRequest | null>(null);
  const [inputPromptValue, setInputPromptValue] = useState('');
  const { generate: generateWithAI } = useAIGeneration();

  useEffect(() => {
    const handleQuickAi = async (event: Event) => {
      const { elementId, prompt, onComplete } = (event as CustomEvent<{ elementId: string; prompt: string; onComplete?: () => void }>).detail;
      const element = getElementById(elementId);
      if (!element || !prompt?.trim()) {
        onComplete?.();
        return;
      }

      try {
        const result = await generateWithAI({
          prompt: prompt.trim(),
          projectId,
          context: JSON.stringify({ type: element.type, name: element.name, props: element.props, styles: element.styles, children: element.children }, null, 2),
        });

        if (!result.success || !result.html) return;
        replaceElementWithGenerated(elementId, result.html);
        if (projectId && result.html.includes('data-lunio-cms-map')) void persistGeneratedCms(projectId, result.html);
      } finally {
        onComplete?.();
      }
    };

    window.addEventListener('lunio:edit-with-ai', handleQuickAi);
    return () => window.removeEventListener('lunio:edit-with-ai', handleQuickAi);
  }, [generateWithAI, getElementById, projectId, replaceElementWithGenerated]);

  const collaborators = useMemo(() => {
    const currentUser = {
      id: 'me',
      name: userData?.name || session?.user?.name || session?.user?.email || 'You',
      avatar: userData?.image || session?.user?.image || null,
    };
    const otherUsers = others.map(other => {
      const info = other.info as { name?: string; avatar?: string } | null;
      return {
        id: other.connectionId.toString(),
        name: info?.name || 'Collaborator',
        avatar: info?.avatar || null,
      };
    });
    return [currentUser, ...otherUsers];
  }, [others, session, userData]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const getVercelTokenKey = () => projectId ? `vercelToken_${projectId}` : 'vercelToken';

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();
      fetchProjects();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);

    const response = await fetch(new URL('/api/users', window.location.origin));
    if (!response.ok) {
      setError('Unable to load user data.');
      setLoading(false);
      return;
    }

    const data = await response.json();
    setUserData(data);
    setLoading(false);
  }

  const fetchProjects = async () => {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/projects');
        if (!response.ok) {
            setError('Unable to load projects.');
            setLoading(false);
            return;
        }

        const data = await response.json();
        setProjects(data || []);
        setLoading(false);
    };

  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);

    const response = await fetch(new URL('/api/projects', window.location.origin));
    if (!response.ok) {
      setError('Unable to load project data.');
      setLoading(false);
      return;
    }

    const data = await response.json();
    setLoading(false);
    console.log('Fetched project data:', data);
  }

  const openInputPrompt = ({ title, message, initialValue = '', placeholder = '', type = 'text' }: Omit<InputPromptRequest, 'resolve'>) => new Promise<string | null>(resolve => {
    setInputPrompt({ title, message, initialValue, placeholder, type, resolve });
    setInputPromptValue(initialValue);
  });

  const closeInputPrompt = (value: string | null) => {
    const request = inputPrompt;
    setInputPrompt(null);
    setInputPromptValue('');
    request?.resolve(value);
  };

  const requestVercelToken = async (allowPrompt = true) => {
    if (typeof window === 'undefined') return null;
    const projectKey = getVercelTokenKey();
    const existingToken = window.localStorage.getItem(projectKey) || window.localStorage.getItem('vercelToken');
    if (existingToken) return existingToken;

    if (!allowPrompt) {
      return null;
    }

    const token = await openInputPrompt({
      title: 'Vercel personal token',
      message: 'Required scopes: deployments.read, deployments.write, projects.read.',
      placeholder: 'Paste your Vercel token',
      type: 'password',
    });
    if (!token) return null;
    const trimmed = token.trim();
    if (trimmed) {
      window.localStorage.setItem(projectKey, trimmed);
      return trimmed;
    }
    return null;
  };

  const getProjectTitle = () => {
    return projects.find((p) => p.id === projectId)?.title || 'LUNIO Project';
  };

  const saveProject = useCallback(async () => {
    if (!projectId || isPublishingRef.current) return;

    saveAbortControllerRef.current?.abort();
    const controller = new AbortController();
    saveAbortControllerRef.current = controller;
    const latestState = useBuilderStore.getState();

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        cache: 'no-store',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          projectId,
          content: {
            pages: latestState.pages,
            currentPageId: latestState.currentPageId,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to save project');

      setSaveMessage('Saved');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Unable to save project:', error);
      setSaveMessage('Save failed');
    } finally {
      if (saveAbortControllerRef.current === controller) {
        saveAbortControllerRef.current = null;
        isSavingRef.current = false;
        setIsSaving(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (!projectId || isPublishingRef.current) return;

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      saveTimeoutRef.current = null;
      void saveProject();
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [pages, currentPageId, projectName, projectId, saveProject]);

  useEffect(() => () => {
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveAbortControllerRef.current?.abort();
  }, []);

  const publishToVercel = async () => {
    setPublishMessage('');
    setShowPublishMenu(false);

    const token = await requestVercelToken(Boolean(!projectId));
    if (!token && !projectId) {
      setPublishMessage('Vercel token required to publish.');
      return;
    }

    // Make the defaultName the title of the project if it exists, otherwise fall back to the previous projectName or a generic default

    const defaultName = getProjectTitle() || 'LUNIO Project';
    const projectNameInput = await openInputPrompt({ title: 'Vercel project name', initialValue: defaultName, placeholder: defaultName });
    const projectName = projectNameInput?.trim() || defaultName;
    const teamIdInput = await openInputPrompt({ title: 'Vercel team ID', message: 'Optional. Leave blank for your personal account.', placeholder: 'Team ID' });
    const teamId = teamIdInput?.trim() || undefined;

    setIsPublishing(true);

    try {
      // Gather page/global CSS to include in the exported React project so the deployed site matches preview
      const collectedCssParts: string[] = [];
      const collectedCssImports: string[] = [];
      Array.from(document.querySelectorAll('style')).forEach(s => {
        if (s.innerHTML && s.innerHTML.trim()) collectedCssParts.push(s.innerHTML);
      });
      const linkNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="style"]')) as HTMLLinkElement[];
      for (const link of linkNodes) {
        const href = link.href;
        if (!href) continue;
        if (/fonts\.googleapis\.com/i.test(href)) {
          collectedCssImports.push(`@import url("${href}");`);
          continue;
        }
        try {
          const resp = await fetch(href, { credentials: 'include' });
          if (resp.ok) {
            const text = await resp.text();
            collectedCssParts.push(`/* ${href} */\n${text}`);
            continue;
          }
        } catch (e) {
          // ignore fetch errors (CORS, network) and fall back to leaving links as-is in public/index.html
        }
      }

      const extraCss = sanitizeCss([...collectedCssImports, ...collectedCssParts].join('\n\n'));

      const response = await fetch('/api/vercel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          token,
          teamId,
          projectName,
          pages,
          extraCss,
        }),
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        const errorMessage = typeof data?.error === 'string'
          ? data.error
          : data?.message || JSON.stringify(data) || 'Vercel deployment failed';
        throw new Error(errorMessage);
      }

      setPublished(true);
      setPublishMessage(data?.url ? `Published to ${data.url}` : 'Published successfully');
      setSiteVercelUrl(data.url || null);
      setTimeout(() => setPublished(false), 5000);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      setPublishMessage(message || 'Publish failed. Check console for details.');
    } finally {
      setIsPublishing(false);
      setTimeout(() => setPublishMessage(''), 5000);
    }
  };

  const publishToLunio = async () => {
    setPublishMessage('');
    setShowPublishMenu(false);

    if (!projectId) {
      setPublishMessage('Save the project first, then publish it to LUNIO.');
      return;
    }

    const siteSlug = normalizeSiteSlug(getProjectTitle());
    if (!siteSlug) {
      setPublishMessage('Enter a valid subdomain using letters, numbers, or hyphens.');
      return;
    }

    setIsPublishing(true);
    isPublishingRef.current = true;
    saveAbortControllerRef.current?.abort();
    saveAbortControllerRef.current = null;
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const latestState = useBuilderStore.getState();
    try {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        cache: 'no-store',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          siteSlug,
          status: 'published',
          content: {
            pages: latestState.pages,
            currentPageId: latestState.currentPageId,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to publish project');

      const hostname = window.location.hostname;
      const rootDomain = hostname === 'localhost' || hostname.endsWith('.localhost')
        ? `localhost${window.location.port ? `:${window.location.port}` : ''}`
        : (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'luniobuilder.com');
      const publishedUrl = `${window.location.protocol}//${siteSlug}.${rootDomain}`;
      setPublished(true);
      setPublishMessage(`Published to ${publishedUrl}`);
      window.open(publishedUrl, '_blank');
      setTimeout(() => setPublished(false), 5000);
    } catch (error) {
      setPublishMessage(error instanceof Error ? error.message : 'Publish failed.');
    } finally {
      setIsPublishing(false);
      isPublishingRef.current = false;
      setTimeout(() => setPublishMessage(''), 5000);
    }
  };

  const handlePublish = () => {
    publishToVercel();
  };

  const handleViewOnVercel = async () => {
    if (!projectId) {
      setPublishMessage('Save the project first to view on Vercel.');
      return;
    }
    try {
      const resp = await fetch(`/api/projects?projectId=${encodeURIComponent(projectId)}`);
      if (!resp.ok) {
        const err = await resp.json().catch(() => null);
        setPublishMessage(err?.error || 'Unable to fetch project info.');
        return;
      }
      const data = await resp.json();
      const vercelUrl = data?.vercelUrl || data?.url || null;
      if (!vercelUrl) {
        setPublishMessage('No Vercel URL found for this project. Publish first.');
        return;
      }
      setSiteVercelUrl(vercelUrl);
      window.open(vercelUrl, '_blank');
      setPublishMessage('');
    } catch (e) {
      console.error(e);
      setPublishMessage('Failed to fetch Vercel URL');
    } finally {
      setTimeout(() => setPublishMessage(''), 3000);
    }
  };

  const zoomIn = () => setCanvasScale(Math.min(canvasScale + 0.1, 2));
  const zoomOut = () => setCanvasScale(Math.max(canvasScale - 0.1, 0.25));

  //Export to HTML
  const exportHTML = async () => {
    const page = getCurrentPage();
    const bodyContent = page.elements.length
      ? page.elements.map(element => renderElementToHtml(element)).join('')
      : '<div style="padding:32px;font-family:system-ui,sans-serif;color:#4b5563;">No content to export.</div>';
    const pageStyles = generateCssForPage(page);

    // Collect in-document <style> contents and attempt to fetch linked stylesheets.
    const collectedCssParts: string[] = [];
    const collectedCssImports: string[] = [];
    const headLinkTags: string[] = [];

    Array.from(document.querySelectorAll('style')).forEach(s => {
      if (s.innerHTML && s.innerHTML.trim()) collectedCssParts.push(s.innerHTML);
    });

    const linkNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="style"]')) as HTMLLinkElement[];
    for (const link of linkNodes) {
      const href = link.href;
      if (!href) continue;
      if (/fonts\.googleapis\.com/i.test(href)) {
        collectedCssImports.push(`@import url("${href}");`);
        continue;
      }
      try {
        const resp = await fetch(href, { credentials: 'include' });
        if (resp.ok) {
          const text = await resp.text();
          collectedCssParts.push(`/* ${href} */\n${text}`);
          continue;
        }
      } catch (e) {
        // fallthrough: couldn't fetch (CORS or network). We'll fall back to preserving the link tag.
      }
      // Keep the original link tag in the exported head when we couldn't inline it
      headLinkTags.push(link.outerHTML);
    }

    const combinedStyles = sanitizeCss(`${collectedCssImports.join('\n\n')}\n\n${collectedCssParts.join('\n\n')}\n\n/* Page-specific styles */\n${pageStyles}`);
    const navigationScript = `<script>(function(){document.addEventListener('click',function(event){var toggle=event.target.closest('[data-lunio-nav-toggle]');if(!toggle)return;var nav=toggle.closest('nav');var menu=nav&&nav.querySelector('[data-lunio-nav-menu]');if(!menu)return;var open=menu.classList.toggle('lunio-nav-open');toggle.setAttribute('aria-expanded',String(open));menu.style.display=open?'flex':'';});})();</script>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.seo.title}</title>
  <meta name="description" content="${page.seo.description}">
  ${headLinkTags.join('\n  ')}
  <style>${combinedStyles}</style>
</head>
<body style="width:100%;height:100%;margin:0;padding:0;font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  ${bodyContent}
  ${navigationScript}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.slug.replace('/', '') || 'index'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportReact = async () => {
    const projectName = page.name || 'LUNIOProject';
    const files = generateReactProjectFiles(pages, projectName, breakpoint);

    // Gather styles from the current preview to include in the generated project
    const collectedCssParts: string[] = [];
    Array.from(document.querySelectorAll('style')).forEach(s => {
      if (s.innerHTML && s.innerHTML.trim()) collectedCssParts.push(s.innerHTML);
    });
    const linkNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="style"]')) as HTMLLinkElement[];
    for (const link of linkNodes) {
      const href = link.href;
      if (!href) continue;
      try {
        const resp = await fetch(href, { credentials: 'include' });
        if (resp.ok) {
          const text = await resp.text();
          collectedCssParts.push(`/* ${href} */\n${text}`);
          continue;
        }
      } catch (e) {
        // ignore fetch errors and continue
      }
    }

    const combinedCss = sanitizeCss(collectedCssParts.join('\n\n'));

    // Inject combinedCss into the generated files (append to src/builder.css if present, otherwise to src/index.css)
    const builderIndex = files.findIndex(f => f.path === 'src/builder.css');
    if (builderIndex !== -1) {
      files[builderIndex].content = `${combinedCss}\n\n${files[builderIndex].content}`;
    } else {
      const indexCss = files.findIndex(f => f.path === 'src/index.css');
      if (indexCss !== -1) {
        files[indexCss].content = `${combinedCss}\n\n${files[indexCss].content}`;
      } else {
        files.push({ path: 'src/builder.css', content: combinedCss });
      }
    }

    const content = createZipBlob(files);
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '_') || 'lunio'}-react.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredCodeFiles = useMemo(() => {
    const query = codeSearch.trim().toLowerCase();
    return query ? codeFiles.filter(file => file.path.toLowerCase().includes(query)) : codeFiles;
  }, [codeFiles, codeSearch]);
  const codeTree = useMemo(() => buildFileTree(filteredCodeFiles), [filteredCodeFiles]);

  const openCodeModal = () => {
    const projectName = page.name || 'LUNIOProject';
    const files = generateReactProjectFiles(pages, projectName, breakpoint);
    setCodeFiles(files);
    setSelectedCodePath(files[0]?.path || '');
    setCodeSearch('');
    setIsCodeModalOpen(true);
  };

  const selectedCodeFile = codeFiles.find(file => file.path === selectedCodePath) || codeFiles[0] || null;

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.json')) return <FileJson2 size={14} className="text-amber-300" />;
    if (fileName.endsWith('.css')) return <Braces size={14} className="text-sky-300" />;
    if (fileName.endsWith('.md') || fileName.endsWith('.txt')) return <FileText size={14} className="text-gray-400" />;
    return <FileCode2 size={14} className="text-blue-300" />;
  };

  const renderTreeNodes = (nodes: FileTreeNode[], depth = 0): React.ReactNode => {
    return nodes.map(node => {
      if (node.isFile) {
        return (
          <button
            key={node.path}
            onClick={() => node.path && setSelectedCodePath(node.path)}
            className={`group flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-xs transition-all ${selectedCodePath === node.path ? 'bg-blue-500/15 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'}`}
            style={{ paddingLeft: `${depth * 1.1}rem` }}
          >
            {getFileIcon(node.name)}
            {node.name}
          </button>
        );
      }

      const children = node.children ? Object.values(node.children).sort(sortTreeNodes) : [];

      return (
        <div key={node.name}>
          <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500" style={{ paddingLeft: `${depth * 1.1}rem` }}>
            <span className="text-amber-300/80"><Folder size={14} /></span>
            {node.name}
          </div>
          <div className="space-y-1">
            {renderTreeNodes(children, depth + 1)}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <header className="h-12 bg-[#0d1117] border-b border-gray-800 flex justify-between items-center px-4 gap-3 z-50 shrink-0">
        <div className='flex flex-row'>
          {/* Logo */}
          <div className="flex items-center gap-2 mr-2">
            <Link href="/dashboard" className="text-white font-semibold text-sm tracking-tight">
              LUNI<Rocket size={12} className='inline-block ml-1 -mt-0.5' /> Builder
            </Link>
          </div>

          {/* Project name */}
          <div className="text-gray-400 text-xs border-l border-gray-800 pl-3">
            <span className="text-gray-500">/</span> {page.name || 'Untitled Project'}
          </div>
        </div>
        <div className='flex flex-row'>
          <div className="hidden items-center gap-2 rounded-full px-2 py-1 sm:flex" title={`${collaborators.length} user${collaborators.length === 1 ? '' : 's'} online`}>
            <div className="flex items-center pl-1">
              {collaborators.slice(0, 5).map((collaborator, index) => (
                <div className="relative" key={collaborator.id}>
                  <div
                    key={collaborator.id}
                    title={collaborator.name}
                    className="relative -ml-1 h-7 w-7 overflow-hidden rounded-full border-2 border-[#0d1117] text-center text-[10px] font-semibold leading-5 text-white first:ml-0"
                    style={{ backgroundColor: collaboratorColors[index % collaboratorColors.length] }}
                  >
                    {collaborator.avatar ? (
                      <img src={collaborator.avatar} alt={collaborator.name} className="h-full w-full object-cover" />
                    ) : (
                      collaborator.name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <span className="absolute top-0 left-0 h-2 w-2 z-40 rounded-full border border-[#0d1117] bg-emerald-400" />
                </div>
              ))}
              {collaborators.length > 5 && (
                <span className="ml-1 px-1 text-[10px] font-medium text-gray-400">+{collaborators.length - 5}</span>
              )}
            </div>
          </div>
          {/* History */}
          <div className="flex items-center gap-1 border-r border-gray-800 pr-3">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-1.5 rounded-md transition-colors ${canUndo ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-700 cursor-not-allowed'}`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-1.5 rounded-md transition-colors ${canRedo ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-700 cursor-not-allowed'}`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={14} />
            </button>
          </div>

          {/* Breakpoints */}
          <div className="flex items-center gap-0.5 bg-gray-800/60 rounded-lg p-0.5 border border-gray-700/50">
            {[
              { id: 'widescreen' as const, icon: <Monitor size={13} />, label: 'Widescreen' },
              { id: 'desktop' as const, icon: <MonitorCheck size={13} />, label: 'Desktop (default)' },
              { id: 'laptop' as const, icon: <Laptop size={13} />, label: 'Laptop' },
              { id: 'tablet' as const, icon: <Tablet size={13} />, label: 'Tablet' },
              { id: 'mobileLandscape' as const, icon: <Smartphone size={13} className='transform rotate-90' />, label: 'Mobile Landscape' },
              { id: 'mobile' as const, icon: <Smartphone size={13} />, label: 'Mobile' },
            ].map(bp => (
              <button
                key={bp.id}
                onClick={() => setBreakpoint(bp.id)}
                title={bp.label}
                className={`p-1.5 rounded-md transition-all ${breakpoint === bp.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
                  }`}
              >
                {bp.icon}
              </button>
            ))}
          </div>
          {/* Zoom */}
          <div className="flex items-center gap-1 border-x border-gray-800 px-3">
            <button
              onClick={zoomOut}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
            >
              <ZoomOut size={13} />
            </button>
            <button
              onClick={() => setCanvasScale(1)}
              className="text-xs text-gray-400 hover:text-white w-10 text-center transition-colors"
            >
              {Math.round(canvasScale * 100)}%
            </button>
            <button
              onClick={zoomIn}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
            >
              <ZoomIn size={13} />
            </button>
          </div>
          {/* Preview */}
          <button
            onClick={() => setPreviewMode(!isPreviewMode)}
            className={`flex items-center ml-2 gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isPreviewMode
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 border border-gray-700'
              }`}
          >
            {isPreviewMode ? <EyeOff size={13} /> : <Eye size={13} />}
            {isPreviewMode ? 'Editor' : 'Preview'}
          </button>
        </div>

        <div className='flex flex-row gap-3 align-middle items-center'>
          {/* Element actions */}
          {selectedElementId && !isPreviewMode && (
            <div className="flex items-center gap-1 border-r border-gray-800 pr-3">
              <button
                onClick={() => duplicateElement(selectedElementId)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => deleteElement(selectedElementId)}
                className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          )}

          {/* Save */}
          {isSaving ? <Loader size={13} className="text-gray-400 align" /> : <Check size={13} className="text-green-500" />}

          {/* Export*/}
          <button
            onClick={openCodeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 border border-gray-700"
          >
            <Code size={13} />
            Code
          </button>

          {/* Publish */}
          <div className="relative">
            <div className="flex items-center">
              <button
                onClick={() => setShowPublishMenu(!showPublishMenu)}
                disabled={isPublishing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${published
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
                  } ${isPublishing ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isPublishing ? (
                  <>
                    <Loader size={12} />
                    Publishing...
                  </>
                ) : published ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                    Published!
                  </>
                ) : (
                  <>
                    <Play size={12} fill="currentColor" />
                    Publish
                  </>
                )}
              </button>
            </div>

            {showPublishMenu && (
              <div className="absolute top-full right-0 mt-1 px-4 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-2 z-50">
                <button
                  onClick={publishToLunio}
                  disabled={!projectId}
                  className={`w-full flex items-center gap-2 px-2 py-2 text-xs ${projectId ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 cursor-not-allowed'} transition-colors`}
                >
                  <Globe size={12} />
                  Publish to LUNIO
                  <Link href={`https://${projects.find((p) => p.id === projectId)?.title || 'untitled'}.luniobuilder.com`} target="_blank" rel="noreferrer" className="ml-auto text-blue-400 hover:text-blue-300">
                    <ExternalLink size={12} />
                  </Link>
                </button>
                <button
                  onClick={handlePublish}
                  className="w-full flex items-center gap-2 px-2 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <Share2 size={12} />
                  Publish to Vercel
                </button>
                <button
                  onClick={handleViewOnVercel}
                  disabled={!projectId}
                  className={`w-full flex items-center gap-2 px-2 py-2 text-xs ${projectId ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 cursor-not-allowed'} transition-colors`}
                >
                  <ExternalLink size={12} />
                  View on Vercel
                </button>
                <button
                  onClick={userData?.role !== 'pro' && userData?.role !== 'admin' ? () => router.push('/pricing') : exportHTML}
                  className="w-full flex items-center gap-2 px-2 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <Download size={12} />
                  Export HTML
                  {userData?.role !== 'pro' && userData?.role !== 'admin' && (
                    <span className="ml-auto inline-flex align-center rounded-full bg-blue-500/20 text-blue-300 border border-blue-300 text-[10px] px-2 py-0.5">
                      Pro
                    </span>
                  )}
                </button>
                <button
                  onClick={userData?.role !== 'pro' && userData?.role !== 'admin' ? () => router.push('/pricing') : exportReact}
                  className="w-full flex items-center gap-2 px-2 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <Download size={12} />
                  Export React
                  {userData?.role !== 'pro' && userData?.role !== 'admin' && (
                    <span className="ml-auto inline-flex align-center rounded-full bg-blue-500/20 text-blue-300 border border-blue-300 text-[10px] px-2 py-0.5">
                      Pro
                    </span>
                  )}
                </button>
                <div className="border-t border-gray-800 mt-1 pt-1">
                  <Link
                    href={`/dashboard/settings/${projectId}`}
                    className="w-full flex items-center gap-2 px-2 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <Settings size={12} />
                    Site settings
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <Dialog open={isCodeModalOpen} onOpenChange={setIsCodeModalOpen}>
        <DialogContent showCloseButton={false} className="inset-2! left-2! top-2! h-auto! w-auto! max-w-none! translate-x-0! translate-y-0! flex flex-col gap-0 overflow-hidden border border-[#30363d] bg-[#0d1117] p-0 text-[#c9d1d9] shadow-2xl shadow-black/60 sm:inset-4! sm:left-4! sm:top-4!">
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#30363d] bg-[#161b22] px-4">
              <DialogHeader className="flex-row items-center gap-3 space-y-0">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <DialogTitle className="text-xs font-medium text-[#c9d1d9]">Project Code</DialogTitle>
                <DialogDescription className="sr-only">Read-only generated project source code.</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 text-[10px] text-[#8b949e]">
                <span>{codeFiles.length} files</span>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsCodeModalOpen(false)} className="text-[#8b949e] hover:bg-[#30363d] hover:text-white">
                  <X size={14} />
                  <span className="sr-only">Close code viewer</span>
                </Button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <aside className="hidden w-64 shrink-0 flex-col border-r border-[#30363d] bg-[#0d1117] md:flex">
                <div className="flex items-center justify-between border-b border-[#21262d] px-3 py-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b949e]">Explorer</span>
                  <span className="text-[10px] text-[#484f58]">SRC</span>
                </div>
                <label className="relative mx-3 mt-3 block">
                  <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681]" />
                  <input value={codeSearch} onChange={event => setCodeSearch(event.target.value)} placeholder="Filter files" aria-label="Filter files" className="w-full rounded-md border border-[#30363d] bg-[#161b22] py-1.5 pl-8 pr-2 text-xs text-[#c9d1d9] outline-none placeholder:text-[#6e7681] focus:border-[#58a6ff]" />
                </label>
                <div className="mt-3 flex-1 overflow-y-auto px-2 pb-3">
                  {renderTreeNodes(codeTree)}
                </div>
              </aside>
              <main className="flex min-w-0 flex-1 flex-col bg-[#0d1117]">
                <div className="flex h-10 shrink-0 items-end border-b border-[#30363d] bg-[#161b22]">
                  {selectedCodeFile && <div className="flex h-full items-center gap-2 border-r border-[#30363d] border-t-2 border-t-[#58a6ff] bg-[#0d1117] px-4 text-xs text-[#c9d1d9]">
                    {getFileIcon(selectedCodeFile.path)}
                    <span>{selectedCodeFile.path.split('/').pop()}</span>
                    <span className="ml-2 text-[10px] text-[#484f58]">read-only</span>
                  </div>}
                </div>
                <div className="min-h-0 flex-1 overflow-hidden bg-[#0d1117]">
                {selectedCodeFile ? (
                  <Editor
                    height="100%"
                    language={selectedCodeFile.path.endsWith('.js') || selectedCodeFile.path.includes('jsx') ? 'javascript' :
                      selectedCodeFile.path.endsWith('.html') ? 'html' :
                        selectedCodeFile.path.endsWith('.css') ? 'css' :
                          selectedCodeFile.path.endsWith('.md') ? 'markdown' :
                            selectedCodeFile.path.endsWith('.json') ? 'json' :
                              selectedCodeFile.path.endsWith('.txt') ? 'text' :
                                selectedCodeFile.path.endsWith('.gitignore') ? 'gitignore' :
                                  'plaintext'}
                    value={selectedCodeFile.content}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: true, scale: 0.75 },
                      fontSize: 13,
                      lineHeight: 21,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      readOnly: true,
                      padding: { top: 14, bottom: 14 },
                      renderLineHighlight: 'all',
                      roundedSelection: false,
                      cursorBlinking: 'solid',
                      smoothScrolling: true,
                    }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-[#8b949e]">
                    <FileCode2 size={28} className="text-[#484f58]" />
                    No generated code available.
                  </div>
                )}
                </div>
                <div className="flex h-6 shrink-0 items-center justify-between border-t border-[#30363d] bg-[#161b22] px-3 text-[10px] text-[#8b949e]">
                  <div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><GitBranch size={12} /> generated</span><span>UTF-8</span><span>LF</span></div>
                  <span>{selectedCodeFile ? `${selectedCodeFile.content.split('\n').length} lines` : 'No file selected'}</span>
                </div>
              </main>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(inputPrompt)} onOpenChange={open => { if (!open) closeInputPrompt(null); }}>
        <DialogContent className='max-w-md border-gray-700 bg-[#17171c] text-white'>
          <DialogHeader>
            <DialogTitle className='text-white'>{inputPrompt?.title}</DialogTitle>
            {inputPrompt?.message && <DialogDescription className='text-gray-400'>{inputPrompt.message}</DialogDescription>}
          </DialogHeader>
            <input autoFocus type={inputPrompt?.type || 'text'} value={inputPromptValue} onChange={event => setInputPromptValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') closeInputPrompt(inputPromptValue); }} placeholder={inputPrompt?.placeholder} className='mt-4 w-full rounded-lg border border-gray-700 bg-[#111114] px-3 py-2 text-sm text-white outline-none focus:border-blue-400' />
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => closeInputPrompt(null)} className='border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white'>Cancel</Button>
            <Button type='button' onClick={() => closeInputPrompt(inputPromptValue)} className='bg-blue-600 text-white hover:bg-blue-500'>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
