'use client';

import { FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, ImagePlus, LoaderCircle, Sparkles, Trash, WandSparkles } from 'lucide-react';
import { useAIGeneration } from '../functions/useAIGeneration';
import { htmlToBuilderPages } from '../../utils/htmlToBuilder';
import { generateId } from '../../utils/builderUtils';
import { Page } from '../../types/builder';
import type { AIProvider } from '../../types/ai';
import { persistGeneratedCms } from '../../utils/generatedCms';

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

export default function AIChatHome({ isAuthenticated }: AIChatHomeProps) {
  const router = useRouter();
  const { generate, loading, error, clearError } = useAIGeneration();
  const [prompt, setPrompt] = useState('');
  const [imageReferences, setImageReferences] = useState<ImageReference[]>([]);
  const [status, setStatus] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [provider, setProvider] = useState<AIProvider>('gemini-3.6-flash');

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

    setStatus('Designing your first draft...');
    const imageReferencesData = await Promise.all(imageReferences.map(async ({ file }) => ({
      data: await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = event => resolve(String(event.target?.result || '').split(',')[1] || '');
        reader.readAsDataURL(file);
      }),
      mimeType: file.type,
    })));

    const result = await generate({ provider, prompt: prompt.trim(), imageReferences: imageReferencesData });
    if (!result.success || !result.html) {
      setStatus('');
      return;
    }

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
      setStatus('');
      return;
    }
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
    <main className='relative flex min-h-[calc(100vh-76px)] flex-1 items-center justify-center overflow-hidden px-5 py-16 text-white sm:px-8'>
      <div className='pointer-events-none absolute left-1/2 top-16 h-80 w-[min(80vw,720px)] -translate-x-1/2 rounded-full bg-[#49d7c0]/10 blur-[110px]' />
      <div className='pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#4268ff]/10 blur-[100px]' />

      <div className='relative z-10 w-full max-w-5xl'>
        <div className='mb-10 flex flex-col items-center text-center'>
          <h1 className='max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-8xl'>
            Tell us what to build.
            <span className='block text-white/35'>We&apos;ll make it real.</span>
          </h1>
          <p className='mt-6 max-w-xl text-base leading-7 text-white/55 sm:text-lg'>Describe your website, a feeling, or a business. LUNIO Builder turns your words into an editable website you can shape in the visual editor.</p>
        </div>

        <form onSubmit={createWebsite} className='mx-auto max-w-3xl'>
          <div className='rounded-[26px] border border-white/15 bg-[#171a20]/90 p-3 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl'>
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
            <div className='flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-2 pt-3 sm:px-3'>
              <div className='flex items-center gap-2'>
                <label className='inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/45 transition hover:bg-white/6 hover:text-white'>
                  <ImagePlus size={17} />
                  <h1 className='flex text-sm font-medium max-md:hidden'>Add reference</h1>
                  <input type='file' accept='image/*' multiple className='sr-only' onChange={event => { selectImages(event.target.files); event.currentTarget.value = ''; }} />
                </label>
                <select value={provider} onChange={event => setProvider(event.target.value as AIProvider)} disabled={loading} aria-label='AI provider' className='rounded-xl border border-white/10 bg-[#20252d] px-3 py-2 text-sm text-white/70 outline-none max-md:w-20 focus:border-[#b8f36b]'>
                  <option value='gemini-3.6-flash'>Gemini 3.6 Flash</option>
                  <option value='gemini-pro'>Gemini Pro</option>
                  <option value='openai'>OpenAI</option>
                  <option value='claude'>Claude</option>
                  <option value='groq'>Groq</option>
                  <option value='vercel'>Vercel</option>
                </select>
              </div>
              <button type='submit' disabled={loading || (!prompt.trim() && imageReferences.length === 0)} className='inline-flex items-center gap-2 rounded-xl bg-[#b8f36b] px-4 py-2.5 text-sm font-semibold text-[#10150c] transition hover:bg-[#d0ff91] disabled:cursor-not-allowed disabled:opacity-35'>
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
  );
}
