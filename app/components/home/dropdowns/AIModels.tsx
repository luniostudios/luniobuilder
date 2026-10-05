"use client"

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

interface AIModelsProps {
    provider: AIProvider;
    onProviderChange: (provider: AIProvider) => void;
}

export const getProviderLabel = (provider: AIProvider) => {
    switch (provider) {
        case 'gemini-3.6-flash': return 'Gemini 3.6 Flash';
        case 'gemini-pro': return 'Gemini 3.1 Pro';
        case 'claude-fable': return 'Claude Fable 5';
        case 'claude-4.6-sonnet': return 'Claude 4.6 Sonnet';
        case 'claude-4.6-opus': return 'Claude 4.6 Opus';
        case 'openai-gpt-6-astra': return 'OpenAI GPT-6 Astra';
        case 'openai-gpt-6.1-sol': return 'OpenAI GPT-6.1 Sol';
        case 'openai-gpt-6-luna': return 'OpenAI GPT-6 Luna'
    }
};

export const AIModels = ({ provider, onProviderChange }: AIModelsProps) => {

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger className='inline-flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-white/45 border border-white/10 outline-none '>
                    <IconAi size={27} stroke={2} />
                    <h1 className='flex text-sm font-medium max-md:hidden'>{getProviderLabel(provider)}</h1>
                    <ChevronDown size={17} />
                    <HoverCard>
                        <HoverCardTrigger><IconHelpCircle size={16} stroke={2} /></HoverCardTrigger>
                        <HoverCardContent className='w-72 flex flex-col gap-3 text-black rounded-xs p-4 bg-white border-2 border-blackshadow-lg'>
                            <h2 className='text-md text-black font-bold'>Select the AI model you prefer.</h2>
                            <hr />
                            <p className='text-xs text-black font-medium'>FREE = We cover the cost of using this model.</p>
                            <p className='text-xs text-black font-medium'>API = Requires that you add your own API key.</p>
                            <hr />
                            <p className='text-xs text-black'>You can add your API keys in <Link href="/dashboard?tab=settings" className='font-bold'>Settings</Link>.</p>
                            <p className='text-xs text-black font-bold'>TIP: Better the model, better the results.</p>
                        </HoverCardContent>
                    </HoverCard>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='bg-[#111215] w-full border border-white/20 mt-2 rounded-md p-2'>
                    <DropdownMenuLabel className='text-xs text-white mb-1'>Select AI model</DropdownMenuLabel>
                    {['gemini-3.6-flash', 'gemini-pro', 'openai-gpt-6-astra', 'openai-gpt-6.1-sol', 'openai-gpt-6-luna', 'claude-fable', 'claude-4.6-sonnet', 'claude-4.6-opus'].map((provider) => (
                        <DropdownMenuItem key={provider} className='text-sm text-white/80 flex flex-row justify-between gap-5 align-items-middle' onClick={() => onProviderChange(provider as AIProvider)}>
                            {getProviderLabel(provider as AIProvider)}
                            <span className='text-[10px] text-white/50 border border-white rounded-2xl px-2'>{provider === 'gemini-3.6-flash' ? 'FREE' : 'API'}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
