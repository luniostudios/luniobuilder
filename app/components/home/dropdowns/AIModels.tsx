"use client"

import { useEffect, useState } from 'react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { IconAi, IconHelpCircle } from '@tabler/icons-react'
import { ChevronDown } from 'lucide-react'
import type { AIProvider } from '../../../types/ai';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import Link from 'next/link';

interface CatalogModel {
    id: string;
    name: string;
    free: boolean;
    contextLength?: number;
}

interface AIModelsProps {
    provider: AIProvider;
    onProviderChange: (provider: AIProvider) => void;
}

export const getProviderLabel = (provider: AIProvider) => {
    switch (provider) {
        case 'gemini-3.6-flash': return 'Gemini 3.6 Flash';
        case 'gemini-pro': return 'Gemini 3.1 Pro';
        case 'claude-fable': return 'Claude Fable 5.1';
        case 'claude-4.6-opus': return 'Claude Opus 5.5';
        case 'claude-4.6-sonnet': return 'Claude Sonnet 5.5';
        case 'claude-4.5-haiku': return 'Claude Haiku 4.5';
        case 'openai-gpt-6-astra': return 'OpenAI GPT-6 Astra';
        case 'openai-gpt-6.1-sol': return 'OpenAI GPT-6.1 Sol';
        case 'openai-gpt-6-luna': return 'OpenAI GPT-6 Luna'
    }
};

export const AIModels = ({ provider, onProviderChange }: AIModelsProps) => {
    const [models, setModels] = useState<CatalogModel[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [catalogError, setCatalogError] = useState('');

    useEffect(() => {
        let active = true;
        fetch('/api/ai-models')
            .then(async response => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load models.');
                return data as CatalogModel[];
            })
            .then(data => { if (active) setModels(data); })
            .catch(error => { if (active) setCatalogError(error instanceof Error ? error.message : 'Unable to load models.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const selectedModel = provider.startsWith('openrouter:')
        ? models.find(model => `openrouter:${model.id}` === provider)
        : undefined;
    const selectedLabel = selectedModel?.name || getProviderLabel(provider) || provider;
    const matchingModels = models.filter(model => `${model.name} ${model.id}`.toLowerCase().includes(search.trim().toLowerCase()));
    const visibleModels = search.trim() ? matchingModels.slice(0, 100) : matchingModels.slice(0, 80);

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger className='inline-flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-white/45 border border-white/10 outline-none '>
                    <IconAi size={27} stroke={2} />
                    <h1 className='flex text-sm font-medium max-md:hidden'>{selectedLabel}</h1>
                    <ChevronDown size={17} />
                    <HoverCard>
                        <HoverCardTrigger><IconHelpCircle size={16} stroke={2} /></HoverCardTrigger>
                        <HoverCardContent className='w-72 flex flex-col gap-3 text-black rounded-xs p-4 bg-white border-2 border-blackshadow-lg'>
                            <h2 className='text-md text-black font-bold'>Select the AI model you prefer.</h2>
                            <hr />
                            <p className='text-xs text-black font-medium'>Gemini 3.6 Flash is included. Every other model requires your own provider API key.</p>
                            <p className='text-xs text-black font-medium'>PRO and BUSINESS models require you to have those plans.</p>
                            <hr />
                            <p className='text-xs text-black'>Add provider API keys in <Link href="/dashboard?tab=settings" className='font-bold'>Settings</Link>.</p>
                            <p className='text-xs text-black font-bold'>TIP: Better the model, better the results.</p>
                        </HoverCardContent>
                    </HoverCard>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='bg-background w-full max-h-[min(70vh,32rem)] border border-white/20 mt-2 rounded-xs p-2 overflow-y-auto [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">'>
                    <DropdownMenuLabel className='text-xs text-white mb-1'>Select AI model</DropdownMenuLabel>
                    <input
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        onKeyDown={event => event.stopPropagation()}
                        placeholder='Search models or providers'
                        aria-label='Search AI models'
                        className='my-1 w-full rounded-sm border border-white/15 bg-background px-2.5 py-2 text-sm text-white outline-none placeholder:text-white/40'
                    />
                    {['gemini-3.6-flash', 'gemini-pro', 'openai-gpt-6-astra', 'openai-gpt-6.1-sol', 'openai-gpt-6-luna', 'claude-fable', 'claude-4.6-sonnet', 'claude-4.6-opus', 'claude-4.5-haiku'].map((modelProvider) => (
                        <DropdownMenuItem key={modelProvider} className='text-sm text-white/80 flex flex-row justify-between gap-5' onClick={() => onProviderChange(modelProvider as AIProvider)}>
                            {getProviderLabel(modelProvider as AIProvider)}
                            <span className='text-[10px] text-white/50 border border-white/30 rounded-2xl px-2'>{modelProvider.includes('gemini-3.6-flash') ? 'FREE' : 'API'}</span>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuLabel className='mt-2 border-t border-white/10 pt-2 text-xs text-white/60'>Other models {models.length > 0 ? `(${models.length})` : ''}</DropdownMenuLabel>
                    {loading && <p className='px-2 py-3 text-xs text-white/60'>Loading current models...</p>}
                    {!loading && catalogError && <p className='px-2 py-3 text-xs text-red-300'>{catalogError}</p>}
                    {!loading && !catalogError && visibleModels.map(model => (
                        <DropdownMenuItem key={model.id} className='flex justify-between gap-4 text-sm text-white/80' onClick={() => onProviderChange(`openrouter:${model.id}`)}>
                            <span className='min-w-0 truncate'>{model.name}</span>
                            <div className='flex gap-1'>
                            <span className='text-[10px] text-white/50 border border-white/30 rounded-2xl px-2'>PRO</span>
                            <span className='text-[10px] text-white/50 border border-white/30 rounded-2xl px-2'>BUSINESS</span>
                            </div>
                        </DropdownMenuItem>
                    ))}
                    {!loading && !catalogError && matchingModels.length === 0 && <p className='px-2 py-3 text-xs text-white/60'>No matching models.</p>}
                    {!loading && !catalogError && matchingModels.length > visibleModels.length && <p className='px-2 py-2 text-[11px] text-white/50'>Showing {visibleModels.length} matches. Refine your search to see more.</p>}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
