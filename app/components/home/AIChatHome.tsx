'use client';

import { FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, ChevronDown, ImagePlus, LoaderCircle, Trash, WandSparkles } from 'lucide-react';
import { useAIGeneration } from '../functions/useAIGeneration';
import { htmlToBuilderPages } from '../../utils/htmlToBuilder';
import { generateId } from '../../utils/builderUtils';
import { Page } from '../../types/builder';
import type { AIProvider } from '../../types/ai';
import { persistGeneratedCms } from '../../utils/generatedCms';
import { AIModels } from './dropdowns/AIModels';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '../../../components/ui/drawer';

const promptSuggestions = [
  'A calm portfolio for an architectural studio',
  'A bold landing page for a sustainable sneaker brand',
  'A dashboard for tracking freelance projects',
];

interface AIChatHomeProps {
  isAuthenticated: boolean;
}

interface ImageReference {
  file: File;
  preview: string;
}

type GenerationStatus = 'pending' | 'active' | 'done' | 'error';

interface GenerationStep {
  id: number;
  label: string;
  detail: string;
  status: GenerationStatus;
}

const buildGenerationSteps = (promptText: string): GenerationStep[] => {
  const summary = promptText.trim() || 'Reference images included';

  return [
    {
      id: 1,
      label: 'Prompt received',
      detail: summary.length > 90 ? `${summary.slice(0, 87)}…` : summary,
      status: 'done',
    },
    {
      id: 2,
      label: 'Planning layout',
      detail: 'Mapping sections, tone, and structure',
      status: 'active',
    },
    {
      id: 3,
      label: 'Generating website',
      detail: 'Creating the first website draft',
      status: 'pending',
    },
    {
      id: 4,
      label: 'Reviewing output',
      detail: 'Checking the generated pages and metadata',
      status: 'pending',
    },
    {
      id: 5,
      label: 'Opening editor',
      detail: 'Preparing the editable canvas',
      status: 'pending',
    },
  ];
};

export default function AIChatHome({ isAuthenticated }: AIChatHomeProps) {
  const router = useRouter();
  const { generate, loading, error, clearError } = useAIGeneration();
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<AIProvider>('gemini-3.6-flash');
  const [imageReferences, setImageReferences] = useState<ImageReference[]>([]);
  const [status, setStatus] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>(() => buildGenerationSteps(''));
  const [generationDrawerOpen, setGenerationDrawerOpen] = useState(false);

  const updateGenerationStep = (stepId: number, status: GenerationStatus, detail?: string) => {
    setGenerationSteps(current => current.map(step => (step.id === stepId ? { ...step, status, ...(detail ? { detail } : {}) } : step)));
  };

  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loading]);

  const selectImages = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).filter(file => file.type.startsWith('image/')).forEach(file => {
      const reader = new FileReader();
      reader.onload = event => {
        setImageReferences(current => [...current, { file, preview: String(event.target?.result || '') }]);
      };
      reader.readAsDataURL(file);
    });
    clearError();
  };

  const removeImage = (index: number) => {
    setImageReferences(current => current.filter((_, referenceIndex) => referenceIndex !== index));
  };

  const createWebsite = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!prompt.trim() && imageReferences.length === 0) return;
    if (!isAuthenticated) {
      sessionStorage.setItem('lunio-ai-prompt', prompt.trim());
      router.push('/auth/signin');
      return;
    }

    const promptSummary = prompt.trim() || 'Reference images included';
    setGenerationSteps(buildGenerationSteps(promptSummary));
    setGenerationDrawerOpen(true);
    setStatus('Designing your first draft...');
    updateGenerationStep(2, 'active', 'Mapping sections, tone, and structure');

    const imageReferencesData = await Promise.all(imageReferences.map(async ({ file }) => ({
      data: await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = event => resolve(String(event.target?.result || '').split(',')[1] || '');
        reader.readAsDataURL(file);
      }),
      mimeType: file.type,
    })));

    updateGenerationStep(3, 'active', 'Creating the first website draft');
    const result = await generate({ provider, prompt: prompt.trim(), imageReferences: imageReferencesData });
    if (!result.success || !result.html) {
      updateGenerationStep(3, 'error', 'The generation request failed.');
      setStatus('');
      return;
    }

    updateGenerationStep(3, 'done', 'Website draft generated successfully');
    updateGenerationStep(4, 'active', 'Checking the generated pages and metadata');
    setStatus('Opening your website in the editor...');
    const generatedPages = htmlToBuilderPages(result.html);
    const pages: Page[] = generatedPages.map(generatedPage => ({
      id: generateId(),
      name: generatedPage.name,
      slug: generatedPage.slug,
      elements: generatedPage.elements,
      seo: {
        title: generatedPage.name === 'Home' ? prompt.trim().slice(0, 60) || 'AI generated website' : generatedPage.name,
        description: 'A website generated with LUNIO Builder AI.',
        keywords: '',
      },
    }));
    const currentPageId = pages.find(page => page.slug === '/')?.id || pages[0].id;

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: prompt.trim().slice(0, 48) || 'AI Website',
        content: { pages, currentPageId },
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.id) {
      updateGenerationStep(4, 'error', 'The project could not be created.');
      setStatus('');
      return;
    }
    updateGenerationStep(4, 'done', 'Generated pages saved successfully');
    updateGenerationStep(5, 'active', 'Preparing the editable canvas');
    if (result.html.includes('data-lunio-cms-map')) await persistGeneratedCms(data.id, result.html);
    router.push(`/editor?projectId=${encodeURIComponent(data.id)}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void createWebsite();
    }
  };

  return (
    <>
      <Drawer open={generationDrawerOpen} onOpenChange={setGenerationDrawerOpen} direction='left'>
        <DrawerContent className='inset-y-0 left-0 z-50 mt-0 flex h-full w-90 max-w-[92vw] flex-col border-r border-white/10 bg-background text-white shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-xl'>
          <DrawerHeader className='border-b border-white/10 bg-white/2 p-4'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <DrawerTitle className='text-base font-semibold text-white'>Generation flow</DrawerTitle>
                <DrawerDescription className='mt-1 text-xs text-white/55'>Live steps for your website build.</DrawerDescription>
              </div>
              <button
                type='button'
                onClick={() => setGenerationDrawerOpen(false)}
                className='rounded-full border border-white/10 bg-white/4 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/60 transition hover:border-white/20 hover:text-white'
              >
                Close
              </button>
            </div>
          </DrawerHeader>

          <div className='flex-1 overflow-y-auto p-4'>
            <div className='mb-4 rounded-xl border border-white/10 bg-white/2 p-3'>
              <p className='text-[10px] font-medium uppercase tracking-[0.2em] text-white/40'>Current brief</p>
              <p className='mt-2 text-sm leading-6 text-white/80'>
                {prompt.trim() || 'Reference images are being used as inspiration.'}
              </p>
            </div>

            <div className='space-y-3'>
              {generationSteps.map(step => {
                const isDone = step.status === 'done';
                const isActive = step.status === 'active';
                const isError = step.status === 'error';

                return (
                  <div key={step.id} className='flex gap-3 rounded-xl border border-white/10 bg-white/2 p-3'>
                    <div className='flex flex-col items-center'>
                      <div className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                        isError ? 'border-rose-400/60 bg-rose-500/15 text-rose-200' :
                        isDone ? 'border-[#b8f36b]/60 bg-[#b8f36b]/15 text-[#d8ff9d]' :
                        isActive ? 'border-sky-400/60 bg-sky-500/15 text-sky-200' : 'border-white/15 bg-white/5 text-white/40'
                      }`}>
                        {isError ? '!' : isDone ? '✓' : isActive ? '•' : step.id}
                      </div>
                      {step.id !== generationSteps[generationSteps.length - 1].id && <div className='mt-2 h-full w-px bg-white/10' />}
                    </div>

                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='text-sm font-medium text-white/90'>{step.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${
                          isError ? 'bg-rose-500/10 text-rose-200' :
                          isDone ? 'bg-[#b8f36b]/10 text-[#d8ff9d]' :
                          isActive ? 'bg-sky-500/10 text-sky-200' : 'bg-white/5 text-white/45'
                        }`}>
                          {isError ? 'error' : isDone ? 'done' : isActive ? 'live' : 'queued'}
                        </span>
                      </div>
                      <p className='mt-1 text-xs leading-5 text-white/55'>{step.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <main className='relative flex flex-1 items-center justify-center overflow-hidden px-5 py-40 text-white sm:px-8'>
      <div className='relative z-10 w-full max-w-5xl'>
        <div className='mb-10 flex flex-col items-center text-center'>
          <h1 className='max-w-4xl text-4xl font-semibold leading-[0.98] bg-linear-to-r from-[#8e9eab] to-[#eef2f3] bg-clip-text text-transparent tracking-[-0.04em] sm:text-8xl'>
            Tell us what to build.
          </h1>
          <span className='block max-w-4xl text-4xl font-semibold leading-[0.98] text-white/35 sm:text-8xl'>We&apos;ll make it real.</span>
          <p className='mt-6 max-w-xl text-base leading-7 text-white/55 sm:text-lg'>Describe your website, a feeling, or a business. LUNIO Builder turns your words into an editable website you can shape in the visual editor.</p>
        </div>

        <form onSubmit={createWebsite} className='mx-auto max-w-3xl'>
          <div className='rounded-sm border border-dashed border-white/15 p-3 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl'>
            <textarea
              value={prompt}
              onChange={event => { setPrompt(event.target.value); clearError(); }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={4}
              placeholder='Create a refined website for...'
              className='w-full resize-none bg-transparent px-4 py-3 text-lg leading-7 text-white outline-none placeholder:text-white/25 sm:px-5 sm:text-xl'
            />
            {imageReferences.length > 0 && (
              <div className='mx-2 mb-2 flex flex-wrap gap-2 rounded-xlp-2'>
                {imageReferences.map((reference, index) => (
                  <div key={`${reference.file.name}-${index}`} className='group border-2 border-red-400/30 rounded-lg relative'>
                    <img src={reference.preview} alt={`Reference ${index + 1}: ${reference.file.name}`} className='h-16 w-20 rounded-lg object-cover' />
                    <button type='button' aria-label={`Remove ${reference.file.name}`} onClick={() => removeImage(index)} className='absolute right-1 top-1 rounded-md bg-black/70 p-1 text-red-300 opacity-0 transition group-hover:opacity-100'>
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className='flex flex-wrap items-center justify-between border-t border-white/10 px-2 pt-3 sm:px-3'>
              <div className='flex items-center gap-2'>
                <label className='inline-flex cursor-pointer items-center gap-2 rounded-sm px-3 py-3 text-sm text-white/45 transition hover:bg-white/6 hover:text-white'>
                  <ImagePlus size={17} />
                  <h1 className='flex text-sm font-medium max-md:hidden'>Add reference</h1>
                  <input type='file' accept='image/*' multiple className='sr-only' onChange={event => { selectImages(event.target.files); event.currentTarget.value = ''; }} />
                </label>
                <AIModels provider={provider} onProviderChange={setProvider} />
              </div>
              <div className='flex items-center gap-2'>
              </div>
              <button type='submit' disabled={loading || (!prompt.trim() && imageReferences.length === 0)} className='inline-flex items-center gap-2 rounded-sm bg-[#b8f36b] px-4 py-2.5 text-sm font-semibold text-[#10150c] transition hover:bg-[#d0ff91] disabled:cursor-not-allowed disabled:opacity-35'>
                {loading ? <LoaderCircle size={17} className='animate-spin' /> : <ArrowUp size={17} />}
                {loading ? `Generating ${elapsedSeconds}s` : 'Generate site'}
              </button>
            </div>
          </div>
        </form>

        <div className='mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2'>
          <span className='mr-1 text-xs text-white/30'>Try:</span>
          {promptSuggestions.map(suggestion => (
            <button key={suggestion} type='button' onClick={() => setPrompt(suggestion)} className='rounded-full border border-white/10 bg-white/2.5 px-3 py-2 text-left text-xs text-white/45 transition hover:border-white/25 hover:bg-white/7 hover:text-white/80'>
              {suggestion}
            </button>
          ))}
        </div>

        {(status || error) && <div className={`mx-auto mt-7 flex max-w-3xl items-center justify-center gap-2 text-sm ${error ? 'text-rose-300' : 'text-[#9de9da]'}`}>
          {loading && <WandSparkles size={15} className='animate-pulse' />}
          {status || error}
        </div>}

        <div className='mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-white/30'>
          <span>Prompt to production</span><span className='h-1 w-1 rounded-full bg-white/20' /><span>Fully editable canvas</span><span className='h-1 w-1 rounded-full bg-white/20' /><span>Publish when ready</span>
        </div>
      </div>
    </main>
    </>
  );
}

