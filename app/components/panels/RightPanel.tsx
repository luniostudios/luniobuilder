"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDown, ArrowUp, ChevronDown, ChevronRight, CircleDot, Copy, Grid2x2, LayoutGrid, Link2, Maximize2, Move, Paintbrush, Plus, Redo2, RotateCcw, Save, SlidersHorizontal, Sparkles, Square, Trash2, Type, Unlink2, Upload } from 'lucide-react';
import ColorPicker from 'react-best-gradient-color-picker';
import { useBuilderStore } from '../../stores/builderStore';
import { Breakpoint, ElementBackgroundLayer, ElementInteraction, InteractionKeyframe, PageInteraction, StyleProperties } from '../../types/builder';
import { getEffectiveStyles, styleObjectToCssString } from '../../utils/builderUtils';
import { GOOGLE_FONT_OPTIONS, loadGoogleFont } from '../../utils/googleFonts';
import { Slider } from '@/components/ui/slider';

type BuilderElement = any;

const BUTTON_ICON_OPTIONS = [
  ['ArrowRight', 'Arrow right'],
  ['ArrowLeft', 'Arrow left'],
  ['ArrowUpRight', 'Arrow up right'],
  ['Download', 'Download'],
  ['ExternalLink', 'External link'],
  ['Heart', 'Heart'],
  ['Mail', 'Mail'],
  ['Play', 'Play'],
  ['Plus', 'Plus'],
  ['Search', 'Search'],
  ['ShoppingCart', 'Shopping cart'],
  ['Star', 'Star'],
] as const;

export const RightPanel: React.FC = () => {
  const { selectedElementId, rightPanelTab, setRightPanelTab, getElementById, breakpoint, getCurrentPage } = useBuilderStore() as any;
  const element = selectedElementId ? getElementById(selectedElementId) : null;
  const page = getCurrentPage();

  return (
    <div className="w-70 bg-[#111114] max-md:hidden border-l border-gray-800 flex flex-col h-full">
      {element ? (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {(['style', 'content', 'interactions', 'css'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setRightPanelTab(tab)}
                className={`flex-1 py-3 text-xs font-medium capitalize transition-colors ${rightPanelTab === tab
                  ? 'text-white border-b-2 border-blue-300 bg-blue-300/5'
                  : 'text-gray-400 hover:text-gray-200'
                  }`}
              >
                {tab === 'css' ? 'CSS' : tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {rightPanelTab === 'style' && <StyleEditor element={element} breakpoint={breakpoint} />}
            {rightPanelTab === 'content' && <ContentEditor element={element} />}
            {rightPanelTab === 'interactions' && <InteractionsEditor element={element} page={page} />}
            {rightPanelTab === 'css' && <CSSEditor element={element} breakpoint={breakpoint} />}
          </div>
        </>
      ) : (
        <>
          <div className="flex border-b border-gray-800">
            {(['seo', 'interactions'] as const).map(tab => <button key={tab} onClick={() => setRightPanelTab(tab)} className={`flex-1 py-3 text-xs font-medium ${rightPanelTab === tab ? 'text-white border-b-2 border-blue-300 bg-blue-300/5' : 'text-gray-400 hover:text-gray-200'}`}>{tab === 'seo' ? 'Page Settings' : 'Interactions'}</button>)}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {rightPanelTab === 'interactions' ? <InteractionsEditor page={page} /> : <SeoEditor pageId={page.id} />}
          </div>
        </>
      )}
    </div>
  );
};

const INTERACTION_ANIMATIONS = ['fade-in', 'fade-out', 'slide-up', 'pop-in', 'bounce', 'spin', 'slide-in', 'custom'];

const flattenElements = (elements: BuilderElement[], result: BuilderElement[] = []) => {
  elements.forEach(item => {
    result.push(item);
    flattenElements(item.children || [], result);
  });
  return result;
};

const InteractionsEditor: React.FC<{ element?: BuilderElement; page: any }> = ({ element, page }) => {
  const { updateElementInteractions, updatePageInteractions, beginInteractionTargetSelection, cancelInteractionTargetSelection, interactionTargetSelection } = useBuilderStore() as any;
  const elementInteractions = (element?.interactions || []) as ElementInteraction[];
  const pageInteractions = (page.interactions || []) as PageInteraction[];
  const targetElements = flattenElements(page.elements || []).filter(item => item.id !== element?.id);
  const updateElement = (next: ElementInteraction[]) => { if (element) updateElementInteractions(element.id, next); };
  const updatePage = (next: PageInteraction[]) => updatePageInteractions(page.id, next);

  return <div className='text-gray-200'>
    <div className='flex items-center justify-between border-b border-gray-800 px-4 py-3'>
      <div>
        <p className='text-sm font-semibold'>Interactions</p>
        <p className='mt-1 text-[11px] text-gray-500'>Animate elements and pages with simple triggers.</p></div>
    </div>
    {element && <InteractionCard title='Element trigger' description='Animate this element when visitors interact with it.' onAdd={() => updateElement([...elementInteractions, { trigger: 'hover', action: 'animate', animationName: 'fade-in', duration: '0.8s', timing: 'ease-in-out' }])}>
      {elementInteractions.map((interaction, index) =>
        <div key={`${interaction.trigger}-${index}`} className='mb-2 rounded-lg border border-gray-700 p-3'>
          <button type='button' onClick={() => updateElement(elementInteractions.filter((_, itemIndex) => itemIndex !== index))} title='Remove trigger' className='w-full p-1 text-gray-500 hover:text-red-300 justify-items-end'><Trash2 size={14} /></button>
          <div className='flex items-center justify-between gap-2'>
            <label htmlFor={`trigger-${index}`} className='text-xs text-gray-300'>Trigger</label>
            <select value={interaction.trigger} onChange={event => updateElement(elementInteractions.map((item, itemIndex) => itemIndex === index ? { ...item, trigger: event.target.value as ElementInteraction['trigger'] } : item))} className='min-w-0 flex-1 rounded border border-gray-700 bg-gray-800/20 px-2 py-1.5 text-xs text-white outline-none'>
              <option value='hover' className='bg-gray-800 text-white'>While hovering</option><option value='click' className='bg-gray-800 text-white'>On click</option><option value='scroll-into-view' className='bg-gray-800 text-white'>When scrolled into view</option>
            </select>
          </div>
          <div className='flex items-center justify-between gap-2'>
            <label htmlFor={`trigger-${index}`} className='text-xs text-gray-300'>Animation</label>
            <select value={interaction.animationName} onChange={event => updateElement(elementInteractions.map((item, itemIndex) => itemIndex === index ? { ...item, animationName: event.target.value } : item))} className='mt-2 w-full rounded border border-gray-700 bg-gray-800/20 px-2 py-1.5 text-xs text-white'>
              {INTERACTION_ANIMATIONS.map(animation => <option key={animation} value={animation} className='bg-gray-800 text-white'>{animation}</option>)}
            </select>
          </div>
          {INTERACTION_ANIMATIONS && interaction.animationName !== 'custom' &&
            <div>
              <div className='flex items-center justify-between gap-2'>
                <label htmlFor={`trigger-${index}`} className='text-xs text-gray-300'>Duration</label>
                {INTERACTION_ANIMATIONS && interaction.animationName !== 'custom' &&
                  <input value={interaction.duration} onChange={event => updateElement(elementInteractions.map((item, itemIndex) => itemIndex === index ? { ...item, duration: event.target.value } : item))} placeholder='Duration, e.g. 0.8s' className='mt-2 w-full rounded border border-gray-700 bg-gray-800/20 px-2 py-1.5 text-xs text-white outline-none' />
                }
              </div>

              <div className='flex items-center justify-between gap-2'>
                <label htmlFor={`trigger-${index}`} className='text-xs text-gray-300'>Timing</label>
                {INTERACTION_ANIMATIONS && interaction.animationName !== 'custom' &&
                  <select value={interaction.timing || 'ease-in-out'} onChange={event => updateElement(elementInteractions.map((item, itemIndex) => itemIndex === index ? { ...item, timing: event.target.value } : item))} className='mt-2 w-full rounded border border-gray-700 bg-gray-800/20 px-2 py-1.5 text-xs text-white'>
                    <option value='linear' className='bg-gray-800 text-white'>Linear</option><option value='ease' className='bg-gray-800 text-white'>Ease</option><option value='ease-in' className='bg-gray-800 text-white'>Ease in</option><option value='ease-out' className='bg-gray-800 text-white'>Ease out</option><option value='ease-in-out' className='bg-gray-800 text-white'>Ease in-out</option>
                  </select>
                }
              </div>
              <div className='flex items-center justify-between gap-2'>
                <label htmlFor={`trigger-${index}`} className='text-xs text-gray-300'>Delay</label>
                {INTERACTION_ANIMATIONS && interaction.animationName !== 'custom' &&
                  <input value={interaction.delay || '0s'} onChange={event => updateElement(elementInteractions.map((item, itemIndex) => itemIndex === index ? { ...item, delay: event.target.value } : item))} placeholder='Delay, e.g. 0.2s' className='mt-2 w-full rounded border border-gray-700 bg-gray-800/20 px-2 py-1.5 text-xs text-white outline-none' />
                }
              </div>
              <div className='flex items-center justify-between gap-2'>
                <label htmlFor={`trigger-${index}`} className='text-xs text-gray-300'>Direction</label>
                {INTERACTION_ANIMATIONS && interaction.animationName !== 'custom' &&
                  <select value={interaction.direction || 'normal'} onChange={event => updateElement(elementInteractions.map((item, itemIndex) => itemIndex === index ? { ...item, direction: event.target.value as ElementInteraction['direction'] } : item))} className='mt-2 w-full rounded border border-gray-700 bg-gray-800/20 px-2 py-1.5 text-xs text-white'>
                    <option value='normal' className='bg-gray-800 text-white'>Normal</option><option value='reverse' className='bg-gray-800 text-white'>Reverse</option><option value='alternate' className='bg-gray-800 text-white'>Alternate</option><option value='alternate-reverse' className='bg-gray-800 text-white'>Alternate reverse</option>
                  </select>
                }
              </div>
              <div className='flex items-center justify-between gap-2'>
                <label htmlFor={`trigger-${index}`} className='text-xs text-gray-300'>Fill</label>
                {INTERACTION_ANIMATIONS && interaction.animationName !== 'custom' &&
                  <select value={interaction.fillMode || 'none'} onChange={event => updateElement(elementInteractions.map((item, itemIndex) => itemIndex === index ? { ...item, fillMode: event.target.value as ElementInteraction['fillMode'] } : item))} className='mt-2 w-full rounded border border-gray-700 bg-gray-800/20 px-2 py-1.5 text-xs text-white'>
                    <option value='none' className='bg-gray-800 text-white'>None</option><option value='forwards' className='bg-gray-800 text-white'>Forwards</option><option value='backwards' className='bg-gray-800 text-white'>Backwards</option><option value='both' className='bg-gray-800 text-white'>Both</option>
                  </select>
                }
              </div>
            </div>
          }
          {interaction.animationName === 'custom' && <CustomTimelineEditor
            frames={interaction.customKeyframes || []}
            allowInitialState={(interaction.action || 'animate') === 'animate'}
            onChange={customKeyframes => {
              const hasInitialState = customKeyframes.some(frame => frame.isInitialState);
              updateElement(elementInteractions.map((item, itemIndex) => itemIndex === index
                ? { ...item, customKeyframes }
                : hasInitialState
                  ? { ...item, customKeyframes: item.customKeyframes?.map(frame => ({ ...frame, isInitialState: undefined })) }
                  : item));
            }}
          />}
          <select value={interaction.action || 'animate'} onChange={event => updateElement(elementInteractions.map((item, itemIndex) => itemIndex === index ? { ...item, action: event.target.value as ElementInteraction['action'], targetElementId: ['show', 'visibility', 'opacity'].includes(event.target.value) ? item.targetElementId : undefined } : item))} className='mt-2 w-full rounded border border-gray-700 bg-gray-800/20 px-2 py-1.5 text-xs text-white'>
            <option value='animate' className='bg-gray-800 text-white'>Animate this element</option><option value='show' className='bg-gray-800 text-white'>Show another element</option><option value='visibility' className='bg-gray-800 text-white'>Toggle element visibility</option><option value='opacity' className='bg-gray-800 text-white'>Change element opacity</option>
          </select>
          {(interaction.action || 'animate') !== 'animate' && <div className='mt-2 flex items-center gap-2'>
            <button type='button' onClick={() => beginInteractionTargetSelection(element.id, index)} onDoubleClick={cancelInteractionTargetSelection} className={`flex-1 rounded border px-2 py-1.5 text-left text-xs ${interactionTargetSelection?.sourceId === element.id && interactionTargetSelection?.interactionIndex === index ? 'border-blue-400 bg-blue-500/20 text-blue-200' : 'border-gray-700 bg-gray-800/20 text-gray-300 hover:border-blue-400'}`}>
              {interactionTargetSelection?.sourceId === element.id && interactionTargetSelection?.interactionIndex === index ? 'Click an element on the canvas...' : interaction.targetElementId ? `Target: ${targetElements.find(target => target.id === interaction.targetElementId)?.name || 'Selected element'}` : 'Select target on canvas'}
            </button>
          </div>}
          {(interaction.action || 'animate') === 'visibility' && <select value={interaction.visibilityMode || 'toggle'} onChange={event => updateElement(elementInteractions.map((item, itemIndex) => itemIndex === index ? { ...item, visibilityMode: event.target.value as ElementInteraction['visibilityMode'] } : item))} className='mt-2 w-full rounded border border-gray-700 bg-gray-800/20 px-2 py-1.5 text-xs text-white'>
            <option value='toggle' className='bg-gray-800 text-white'>Toggle visibility</option><option value='show' className='bg-gray-800 text-white'>Show target</option><option value='hide' className='bg-gray-800 text-white'>Hide target</option>
          </select>}
          {(interaction.action || 'animate') === 'opacity' && <input value={interaction.opacityValue || '0'} onChange={event => updateElement(elementInteractions.map((item, itemIndex) => itemIndex === index ? { ...item, opacityValue: event.target.value } : item))} placeholder='Opacity, e.g. 0.5 or 50%' className='mt-2 w-full rounded border border-gray-700 bg-gray-800/20 px-2 py-1.5 text-xs text-white outline-none' />}

        </div>)}
      <div className='mt-4 px-4 py-4 border-2 border-gray-800/50 rounded-lg border-dashed'>
        <h2 className='text-sm font-semibold text-gray-300'>ElementTriggers</h2>
        <p className='mt-1 text-[11px] text-gray-500'>These triggers are applied to the element and will run when the specified event occurs.</p>
      </div>
    </InteractionCard>}
    <InteractionCard title='Page trigger' description='Run an animation when the page loads.' onAdd={() => updatePage([...pageInteractions, { trigger: 'load', animationName: 'fade-in', duration: '0.8s' }])}>
      {pageInteractions.map((interaction, index) => <div key={index} className='rounded-lg border border-gray-700 bg-gray-900/60 p-3'>
        <div className='flex items-center justify-between'><span className='text-xs text-gray-300'>When page loads</span><button type='button' onClick={() => updatePage(pageInteractions.filter((_, itemIndex) => itemIndex !== index))} title='Remove trigger' className='p-1 text-gray-500 hover:text-red-300'><Trash2 size={14} /></button></div>
        <select value={interaction.animationName} onChange={event => updatePage(pageInteractions.map((item, itemIndex) => itemIndex === index ? { ...item, animationName: event.target.value } : item))} className='mt-2 w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-white'>{INTERACTION_ANIMATIONS.filter(animation => animation !== 'custom').map(animation => <option key={animation} value={animation}>{animation}</option>)}</select>
        <input value={interaction.duration} onChange={event => updatePage(pageInteractions.map((item, itemIndex) => itemIndex === index ? { ...item, duration: event.target.value } : item))} placeholder='Duration, e.g. 0.8s' className='mt-2 w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-white outline-none' />
      </div>)}
      <div className='mt-4 px-4 py-4 border-2 border-gray-800/50 rounded-lg border-dashed'>
        <h2 className='text-sm font-semibold text-gray-300'>Page Triggers</h2>
        <p className='mt-1 text-[11px] text-gray-500'>These triggers are applied to the page and will run when the specified event occurs.</p>
      </div>
    </InteractionCard>
  </div>;
};

const InteractionCard: React.FC<{ title: string; description: string; onAdd: () => void; children: React.ReactNode }> = ({ title, description, onAdd, children }) => <div className='border-b border-gray-800/60 p-4'>
  <div className='mb-3 flex items-start justify-between'><div><p className='text-xs font-semibold uppercase tracking-wider text-gray-300'>{title}</p><p className='mt-1 text-[11px] text-gray-500'>{description}</p>
  </div><button type='button' onClick={onAdd} title={`Add ${title.toLowerCase()}`} aria-label={`Add ${title.toLowerCase()}`} className='rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-200'><Plus size={15} /></button></div>
  {children}
</div>;

const KEYFRAME_PROPERTIES: Array<{ key: keyof Omit<InteractionKeyframe, 'offset' | 'isInitialState'>; label: string; unit: string; min: number; max: number }> = [
  { key: 'opacity', label: 'Opacity', unit: '', min: 0, max: 1 },
  { key: 'translateX', label: 'X', unit: 'px', min: -500, max: 500 },
  { key: 'translateY', label: 'Y', unit: 'px', min: -500, max: 500 },
  { key: 'scale', label: 'Scale', unit: '', min: 0, max: 3 },
  { key: 'rotate', label: 'Rotate', unit: 'deg', min: -360, max: 360 },
];

const CustomTimelineEditor: React.FC<{ frames: InteractionKeyframe[]; allowInitialState: boolean; onChange: (frames: InteractionKeyframe[]) => void }> = ({ frames, allowInitialState, onChange }) => {
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const activeIndex = Math.min(selectedFrameIndex, Math.max(0, frames.length - 1));
  const selectedFrame = frames[activeIndex];
  const updateFrame = (index: number, patch: Partial<InteractionKeyframe>) => onChange(frames.map((frame, frameIndex) => frameIndex === index
    ? { ...frame, ...patch }
    : patch.isInitialState ? { ...frame, isInitialState: undefined } : frame));
  const addFrame = () => {
    const offset = frames.length ? Math.min(100, Math.max(...frames.map(frame => frame.offset)) + 25) : 0;
    onChange([...frames, { offset }]);
    setSelectedFrameIndex(frames.length);
  };
  const removeFrame = () => {
    onChange(frames.filter((_, index) => index !== activeIndex));
    setSelectedFrameIndex(Math.max(0, activeIndex - 1));
  };

  return <div className='mt-3 overflow-hidden rounded-md border border-gray-700/80 bg-[#15171b]'>
    <div className='flex items-center justify-between border-b border-gray-800 px-2.5 py-2'>
      <div>
        <p className='text-xs font-semibold uppercase tracking-wider text-gray-300'>Timeline</p>
        <p className='mt-0.5 text-[9px] text-gray-500'>{frames.length} {frames.length === 1 ? 'keyframe' : 'keyframes'}</p>
      </div>
      <button type='button' onClick={addFrame} className='flex h-7 items-center gap-1 rounded border border-sky-400/30 bg-sky-400/10 px-2 text-xs font-medium text-sky-200 transition hover:border-sky-300/60 hover:bg-sky-400/15'>
        <Plus size={12} /> Keyframe
      </button>
    </div>
    <div className='px-2.5 pb-2.5 pt-3'>
      <div className='relative mb-2 h-11 select-none rounded-sm border-y border-gray-800/90 bg-[#101114]' style={{ backgroundImage: 'linear-gradient(90deg, transparent 24.8%, #282b31 25%, transparent 25.2%, transparent 49.8%, #282b31 50%, transparent 50.2%, transparent 74.8%, #282b31 75%, transparent 75.2%)' }}>
        {[0, 25, 50, 75, 100].map(tick => <span key={tick} className={`absolute top-1 text-[8px] tabular-nums text-gray-600 ${tick === 0 ? '' : tick === 100 ? '-translate-x-full' : '-translate-x-1/2'}`} style={{ left: `${tick}%` }}>{tick}%</span>)}
        <div className='absolute inset-x-0 bottom-2 h-px bg-gray-700' />
        {frames.map((frame, index) => <button key={index} type='button' aria-label={`Select ${frame.isInitialState ? 'initial state, ' : ''}keyframe ${index + 1} at ${frame.offset}%`} aria-pressed={activeIndex === index} onClick={() => setSelectedFrameIndex(index)} className={`absolute bottom-1.75 z-10 h-3 w-3 -translate-x-1/2 rotate-45 border transition ${frame.isInitialState ? 'border-emerald-100 bg-emerald-400' : activeIndex === index ? 'border-white bg-sky-300 shadow-[0_0_0_3px_rgba(56,189,248,0.18)]' : 'border-sky-300/80 bg-sky-500 hover:scale-110 hover:bg-sky-300'}`} style={{ left: `${Math.max(0, Math.min(100, frame.offset))}%` }} />)}
      </div>
      {frames.length > 0 ? <>
        <div className='mb-3 flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar' aria-label='Keyframes'>
          {frames.map((frame, index) => <button key={index} type='button' aria-pressed={activeIndex === index} onClick={() => setSelectedFrameIndex(index)} className={`flex min-w-[4.2rem] items-center gap-1.5 rounded border px-2 py-1.5 text-left transition ${activeIndex === index ? 'border-sky-400/50 bg-sky-400/10 text-sky-100' : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-600 hover:text-gray-200'}`}>
            <span className={`h-1.5 w-1.5 shrink-0 rotate-45 ${activeIndex === index ? 'bg-sky-300' : 'bg-gray-500'}`} />
            <span className='text-[9px] font-medium tabular-nums'>KF {String(index + 1).padStart(2, '0')}</span>
            {frame.isInitialState ? <span className='ml-auto text-[8px] font-semibold text-emerald-300'>Initial</span> : <span className='ml-auto text-[9px] tabular-nums text-gray-500'>{frame.offset}%</span>}
          </button>)}
        </div>
        <div className='rounded border border-gray-800 bg-gray-900/50 p-2'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-[9px] font-semibold uppercase tracking-wider text-gray-500'>Keyframe {String(activeIndex + 1).padStart(2, '0')}</span>
            <div className='flex items-center gap-1'>
              {allowInitialState && <button type='button' onClick={() => updateFrame(activeIndex, { isInitialState: !selectedFrame.isInitialState })} aria-pressed={Boolean(selectedFrame.isInitialState)} title={selectedFrame.isInitialState ? 'Unset initial state' : 'Use as initial state'} className={`flex h-6 items-center gap-1 rounded border px-1.5 text-[9px] transition ${selectedFrame.isInitialState ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-gray-700 text-gray-500 hover:border-emerald-400/40 hover:text-emerald-300'}`}>
                <CircleDot size={11} /> {selectedFrame.isInitialState ? 'Initial state' : 'Set initial'}
              </button>}
              <button type='button' onClick={removeFrame} title='Remove selected keyframe' aria-label='Remove selected keyframe' className='rounded p-1 text-gray-500 transition hover:bg-red-400/10 hover:text-red-300'><Trash2 size={12} /></button>
            </div>
          </div>
          <label className='mb-3 block'>
            <span className='mb-1 flex items-center justify-between text-[9px] text-gray-400'><span>Position</span><span className='font-mono tabular-nums text-gray-300'>{selectedFrame.offset}%</span></span>
            <input type='range' min='0' max='100' value={selectedFrame.offset} aria-label='Keyframe timeline position' onChange={event => updateFrame(activeIndex, { offset: Number(event.target.value) })} className='h-1.5 w-full cursor-pointer accent-sky-400' />
          </label>
          <div className='grid grid-cols-2 gap-x-2 gap-y-1'>
            {KEYFRAME_PROPERTIES.map(property => <label key={property.key} className='min-w-0'>
              <span className='mb-1 flex items-center justify-between text-[9px] text-gray-500'><span>{property.label}</span>{property.unit && <span>{property.unit}</span>}</span>
              <input type='number' step={property.key === 'opacity' || property.key === 'scale' ? '0.1' : '1'} min={property.min} max={property.max} value={selectedFrame[property.key] ?? ''} onChange={event => updateFrame(activeIndex, { [property.key]: event.target.value === '' ? undefined : Number(event.target.value) })} className='h-7 w-full rounded border border-gray-700/80 bg-[#17191d] px-2 text-[10px] tabular-nums text-gray-100 outline-none transition focus:border-sky-400' />
            </label>)}
          </div>
        </div>
      </> : <div className='flex min-h-24 flex-col items-center justify-center rounded border border-dashed border-gray-700/80 bg-gray-900/30 px-3 text-center'>
        <span className='mb-1 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-gray-400'><Plus size={13} /></span>
        <p className='text-[10px] font-medium text-gray-300'>Start your timeline</p>
        <p className='mt-0.5 text-[9px] text-gray-500'>Add a keyframe, then set its position and motion.</p>
      </div>}
    </div>
  </div>;
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const icons: Record<string, React.ReactNode> = {
    Layout: <LayoutGrid size={15} />,
    Size: <Maximize2 size={15} />,
    Spacing: <Move size={15} />,
    Typography: <Type size={15} />,
    Background: <Paintbrush size={15} />,
    Border: <Square size={15} />,
    Effects: <Sparkles size={15} />,
    Animation: <SlidersHorizontal size={15} />,
  };
  return (
    <div className="border-b border-gray-800/70">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="group flex w-full items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-gray-300 transition-colors hover:bg-white/2.5 hover:text-white"
      >
        <span className="flex items-center gap-2.5">
          <span className="text-gray-500 transition-colors group-hover:text-sky-300">{icons[title]}</span>
          {title}
        </span>
        {open ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
      </button>
      {open && <div className="px-3.5 pb-4 pt-1">{children}</div>}
    </div>
  );
};

interface InputRowProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  unit?: string;
  options?: string[];
}

const InputRow: React.FC<InputRowProps> = ({ label, value, onChange, type = 'text', placeholder, unit, options }) => {
  return (
    <label className="mb-2 flex w-full items-center gap-2">
      <span className="w-18.5 shrink-0 text-[11px] text-gray-400">{label}</span>
      {options ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-8 min-w-0 flex-1 rounded-md border border-gray-700/80 bg-[#191b20] px-2 text-xs text-gray-200 outline-none transition-colors hover:border-gray-600 focus:border-sky-400"
        >
          <option value="">—</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <span className="flex h-8 min-w-0 flex-1 items-center rounded-md border border-gray-700/80 bg-[#191b20] px-2 transition-colors focus-within:border-sky-400">
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || '—'}
            className="h-full min-w-0 flex-1 bg-transparent text-xs text-gray-100 outline-none placeholder:text-gray-600"
          />
          {unit && <span className="ml-1 text-[10px] text-gray-500">{unit}</span>}
        </span>
      )}
    </label>
  );
};

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => {
  return (
    <label className="mb-2 flex items-center gap-2">
      <span className="w-18.5 shrink-0 text-[11px] text-gray-400">{label}</span>
      <span className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border border-gray-700/80 bg-[#191b20] px-2 transition-colors focus-within:border-sky-400">
        <input
          type="color"
          value={value || '#000000'}
          aria-label={`${label} color picker`}
          onChange={e => onChange(e.target.value)}
          className="h-5 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="#000000"
          className="h-full min-w-0 flex-1 bg-transparent font-mono text-[11px] text-gray-100 outline-none placeholder:text-gray-600"
        />
      </span>
    </label>
  );
};

interface GradientInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  defaultValue: string;
}

const GradientInput: React.FC<GradientInputProps> = ({ label, value, onChange, placeholder, defaultValue }) => {
  const [open, setOpen] = useState(false);
  const safeValue = value || defaultValue;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <button type="button" aria-label={`Reset ${label.toLowerCase()}`} title="Reset" className="text-gray-500 transition hover:text-gray-200" onClick={() => onChange('')}><Redo2 size={13} /></button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-gray-800 text-gray-200 text-xs rounded-md px-2 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
        />
        <button
          type="button"
          aria-label={`${label} gradient picker`}
          aria-expanded={open}
          className="h-9 min-w-18 rounded-md border border-gray-700 transition hover:border-gray-500"
          style={{
            backgroundImage: safeValue,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          onClick={() => setOpen(prev => !prev)}
        />
      </div>
      {open && (
        <div className="absolute z-10 bottom-2 right-65 mt-3 rounded-xl border border-gray-700 overflow-hidden">
          <ColorPicker
            value={safeValue}
            onChange={onChange}
            hideColorTypeBtns={true}
            hidePresets={true}
          />
        </div>
      )}
    </div>
  );
};

const isCssGradient = (val: string) => /(linear-gradient|radial-gradient|conic-gradient)\(/i.test(val.trim());

const splitCssBackgroundLayers = (value: string) => {
  const layers: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '(') depth += 1;
    if (character === ')') depth = Math.max(0, depth - 1);
    if (character === ',' && depth === 0) {
      const layer = value.slice(start, index).trim();
      if (layer) layers.push(layer);
      start = index + 1;
    }
  }

  const lastLayer = value.slice(start).trim();
  if (lastLayer) layers.push(lastLayer);
  return layers;
};

const normalizeGradientForPicker = (value: string) => {
  const fallback = 'linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)';
  const match = value.trim().match(/^((?:repeating-)?(?:linear|radial)-gradient)\(([\s\S]*)\)$/i);
  if (!match) return fallback;

  const gradientName = match[1].toLowerCase();
  const argumentsList = splitCssBackgroundLayers(match[2]);
  const isRadial = gradientName.includes('radial');
  const hasOrientation = isRadial
    ? /^(?:(?:circle|ellipse)\b|(?:closest|farthest)-(?:side|corner)\b|contain\b|cover\b|at\b)/i.test(argumentsList[0] || '')
    : /^(?:to\s+|[-+]?(?:\d+\.?\d*|\.\d+)deg\b)/i.test(argumentsList[0] || '');
  const prefix = hasOrientation ? argumentsList.slice(0, 1) : [];
  const stops = argumentsList.slice(prefix.length);
  if (stops.length < 2) return fallback;

  const positionedStops = stops.map((stop, index) => {
    if (/(?:^|\s)[-+]?(?:\d+\.?\d*|\.\d+)(?:%|px|em)\s*$/i.test(stop)) return stop;
    const position = stops.length === 1 ? 0 : (index / (stops.length - 1)) * 100;
    return `${stop} ${position}%`;
  });

  return `${gradientName}(${[...prefix, ...positionedStops].join(', ')})`;
};

const BackgroundFillInput: React.FC<{
  label: string;
  colorValue: string;
  gradientValue: string;
  onChangeColor: (val: string) => void;
  onChangeGradient: (val: string) => void;
}> = ({ label, colorValue, gradientValue, onChangeColor, onChangeGradient }) => {
  const [open, setOpen] = useState(false);

  const currentValue = gradientValue || colorValue || '#000000';
  const isGradient = isCssGradient(currentValue);
  const pickerValue = isGradient ? normalizeGradientForPicker(currentValue) : currentValue;

  const handleChange = (next: string) => {
    if (isCssGradient(next)) {
      onChangeGradient(next);
      onChangeColor('');
    } else {
      onChangeColor(next);
      onChangeGradient('');
    }
  };

  const handleReset = () => {
    onChangeColor('');
    onChangeGradient('');
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <button type="button" aria-label={`Reset ${label.toLowerCase()}`} title="Reset" className="text-gray-500 transition hover:text-gray-200" onClick={handleReset}><Redo2 size={13} /></button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={isCssGradient(currentValue) ? currentValue : (colorValue || '')}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Color (#fff) or gradient (linear-gradient...)"
          className="flex-1 bg-gray-800 text-gray-200 text-xs rounded-md px-2 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
        />
        <button
          type="button"
          aria-label={`${label} color picker`}
          aria-expanded={open}
          className="h-9 min-w-18 rounded-md border border-gray-700 transition hover:border-gray-500"
          style={{
            // Avoid mixing `background` shorthand with background* longhands.
            backgroundColor: isGradient ? undefined : currentValue,
            backgroundImage: isGradient ? currentValue : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          onClick={() => setOpen((prev) => !prev)}
        />
      </div>
      {open && (
        <div className="absolute z-10 bottom-2 right-65 mt-3 rounded-xl border border-gray-700 overflow-hidden">
          <ColorPicker value={pickerValue} onChange={handleChange} hidePresets={true} />
        </div>
      )}
    </div>
  );
};

interface SpacingInputProps {
  label: string;
  values: { top: string; right: string; bottom: string; left: string };
  onChange: (side: 'top' | 'right' | 'bottom' | 'left', val: string) => void;
}

const SpacingInput: React.FC<SpacingInputProps> = ({ label, values, onChange }) => {
  const [linked, setLinked] = useState(false);

  const handleChange = (side: 'top' | 'right' | 'bottom' | 'left', val: string) => {
    if (linked) {
      onChange('top', val);
      onChange('right', val);
      onChange('bottom', val);
      onChange('left', val);
    } else {
      onChange(side, val);
    }
  };

  return (
    <div className="mb-3 rounded-lg border border-gray-800 bg-[#14161a] p-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-300">{label}</span>
      </div>
      <div className="grid grid-cols-[1fr_1fr_1fr] grid-rows-[auto_auto_auto] items-center gap-1.5 rounded-md border border-gray-800/80 bg-[#101114] p-2">
        <span />
        <input aria-label={`${label} top`} type="text" value={values.top} onChange={e => handleChange('top', e.target.value)} placeholder="0" className="h-7 w-full rounded border border-gray-700/80 bg-[#1a1c21] text-center text-[11px] text-gray-100 outline-none focus:border-sky-400" />
        <span />
        <input aria-label={`${label} left`} type="text" value={values.left} onChange={e => handleChange('left', e.target.value)} placeholder="0" className="h-7 w-full rounded border border-gray-700/80 bg-[#1a1c21] text-center text-[11px] text-gray-100 outline-none focus:border-sky-400" />
        <div className="flex h-8 items-center justify-center rounded border border-sky-400/20 bg-sky-400/6 text-[10px] font-medium uppercase tracking-wide text-sky-200/80">
          <button
            type="button"
            onClick={() => setLinked(!linked)}
            aria-label={linked ? `Unlink ${label.toLowerCase()} sides` : `Link ${label.toLowerCase()} sides`}
            title={linked ? 'Unlink sides' : 'Link all sides'}
            className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${linked ? 'bg-sky-400/10 text-sky-300' : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'}`}
          >
            {linked ? <Link2 size={13} /> : <Unlink2 size={13} />}
          </button>
        </div>
        <input aria-label={`${label} right`} type="text" value={values.right} onChange={e => handleChange('right', e.target.value)} placeholder="0" className="h-7 w-full rounded border border-gray-700/80 bg-[#1a1c21] text-center text-[11px] text-gray-100 outline-none focus:border-sky-400" />
        <span />
        <input aria-label={`${label} bottom`} type="text" value={values.bottom} onChange={e => handleChange('bottom', e.target.value)} placeholder="0" className="h-7 w-full rounded border border-gray-700/80 bg-[#1a1c21] text-center text-[11px] text-gray-100 outline-none focus:border-sky-400" />
        <span />
      </div>
    </div>
  );
};

interface BorderInputProps {
  values: { top: string; right: string; bottom: string; left: string };
  styles: { topStyle: string; rightStyle: string; bottomStyle: string; leftStyle: string; topColor: string; rightColor: string; bottomColor: string; leftColor: string };
  onChangeWidth: (side: 'top' | 'right' | 'bottom' | 'left', val: string) => void;
  onChangeStyle: (side: 'top' | 'right' | 'bottom' | 'left', val: string) => void;
  onChangeColor: (side: 'top' | 'right' | 'bottom' | 'left', val: string) => void;
}

const BorderInput: React.FC<BorderInputProps> = ({ values, styles, onChangeWidth, onChangeStyle, onChangeColor }) => {
  const [linked, setLinked] = useState(true);

  const handleWidthChange = (side: 'top' | 'right' | 'bottom' | 'left', val: string) => {
    if (linked) {
      onChangeWidth('top', val);
      onChangeWidth('right', val);
      onChangeWidth('bottom', val);
      onChangeWidth('left', val);
    } else {
      onChangeWidth(side, val);
    }
  };

  const handleStyleChange = (side: 'top' | 'right' | 'bottom' | 'left', val: string) => {
    if (linked) {
      onChangeStyle('top', val);
      onChangeStyle('right', val);
      onChangeStyle('bottom', val);
      onChangeStyle('left', val);
    } else {
      onChangeStyle(side, val);
    }
  };

  const handleColorChange = (side: 'top' | 'right' | 'bottom' | 'left', val: string) => {
    if (linked) {
      onChangeColor('top', val);
      onChangeColor('right', val);
      onChangeColor('bottom', val);
      onChangeColor('left', val);
    } else {
      onChangeColor(side, val);
    }
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-gray-300">Border sides</span>
      </div>
      <div className="mb-2 rounded-lg border border-gray-800 bg-[#14161a] p-2.5">
        <p className="mb-2 text-[11px] font-medium text-gray-300">Width</p>
        <div className="grid grid-cols-[1fr_1fr_1fr] grid-rows-[auto_auto_auto] items-center gap-1.5 rounded-md border border-gray-800/80 bg-[#101114] p-2">
          <span />
          <input aria-label="Top border width" type="text" value={values.top} onChange={e => handleWidthChange('top', e.target.value)} placeholder="0" className="h-7 w-full rounded border border-gray-700/80 bg-[#1a1c21] text-center text-[11px] text-gray-100 outline-none focus:border-sky-400" />
          <span />
          <input aria-label="Left border width" type="text" value={values.left} onChange={e => handleWidthChange('left', e.target.value)} placeholder="0" className="h-7 w-full rounded border border-gray-700/80 bg-[#1a1c21] text-center text-[11px] text-gray-100 outline-none focus:border-sky-400" />
          <div className="flex h-8 items-center justify-center rounded border border-sky-400/20 bg-sky-400/6 text-[10px] font-medium uppercase tracking-wide text-sky-200/80">
            <button
              type="button"
              onClick={() => setLinked(!linked)}
              aria-label={linked ? 'Unlink border sides' : 'Link border sides'}
              title={linked ? 'Unlink sides' : 'Link all sides'}
              className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${linked ? 'bg-sky-400/10 text-sky-300' : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'}`}
            >
              {linked ? <Link2 size={13} /> : <Unlink2 size={13} />}
            </button>
          </div>
          <input aria-label="Right border width" type="text" value={values.right} onChange={e => handleWidthChange('right', e.target.value)} placeholder="0" className="h-7 w-full rounded border border-gray-700/80 bg-[#1a1c21] text-center text-[11px] text-gray-100 outline-none focus:border-sky-400" />
          <span />
          <input aria-label="Bottom border width" type="text" value={values.bottom} onChange={e => handleWidthChange('bottom', e.target.value)} placeholder="0" className="h-7 w-full rounded border border-gray-700/80 bg-[#1a1c21] text-center text-[11px] text-gray-100 outline-none focus:border-sky-400" />
          <span />
        </div>
      </div>
      <div className="mb-1 grid grid-cols-[48px_1fr_36px] items-center gap-2 px-1 text-[9px] font-medium uppercase tracking-wide text-gray-500">
        <span>Side</span><span>Style</span><span>Color</span>
      </div>
      <div className="space-y-1">
        {(['top', 'right', 'bottom', 'left'] as const).map(side => {
          const sideKey = side === 'top' ? 'topStyle' : side === 'right' ? 'rightStyle' : side === 'bottom' ? 'bottomStyle' : 'leftStyle';
          const colorKey = side === 'top' ? 'topColor' : side === 'right' ? 'rightColor' : side === 'bottom' ? 'bottomColor' : 'leftColor';
          return (
            <div key={side} className="grid grid-cols-[48px_1fr_36px] items-center gap-2 rounded-md px-1 py-1 hover:bg-white/2.5">
              <span className="text-[10px] capitalize text-gray-400">{side}</span>
              <select
                aria-label={`${side} border style`}
                value={styles[sideKey as keyof typeof styles] || ''}
                onChange={e => handleStyleChange(side, e.target.value)}
                className="h-7 w-full rounded border border-gray-700/80 bg-[#191b20] px-2 text-[10px] text-gray-100 outline-none focus:border-sky-400"
              >
                <option value="">Default</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
                <option value="none">None</option>
              </select>
              <input
                type="color"
                value={styles[colorKey as keyof typeof styles] || '#000000'}
                onChange={e => handleColorChange(side, e.target.value)}
                aria-label={`${side} border color`}
                className="h-7 w-full cursor-pointer rounded border border-gray-700 bg-[#191b20] p-0.5"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface StyleEditorProps {
  element: BuilderElement;
  breakpoint: string;
}

const parseBoxShadow = (shadow?: string) => {
  const normalized = String(shadow || '').trim();
  if (!normalized || normalized === 'none') {
    return { inset: '', x: '', y: '', blur: '', spread: '', color: '' };
  }

  const inset = normalized.includes('inset') ? 'inset' : '';
  const withoutInset = normalized.replace(/\binset\b/, '').trim();
  const colorMatch = withoutInset.match(/(rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-fA-F]{3,8}|\b[a-zA-Z]+\b)$/);
  const color = colorMatch ? colorMatch[1] : '';
  const numericPart = withoutInset.replace(colorMatch?.[0] || '', '').trim();
  const values = numericPart.split(/\s+/).filter(Boolean);

  return {
    inset,
    x: values[0] || '',
    y: values[1] || '',
    blur: values[2] || '',
    spread: values[3] || '',
    color,
  };
};

const buildBoxShadow = ({ inset, x, y, blur, spread, color }: Record<string, string>) => {
  if (!x && !y && !blur && !spread && !color) return '';
  const values = [] as string[];
  if (inset) values.push('inset');
  values.push(x || '0px', y || '0px');
  if (blur) values.push(blur);
  if (spread) values.push(spread);
  if (color) values.push(color);
  return values.join(' ').trim();
};

const parseFilterBlur = (filter?: string) => {
  const match = String(filter || '').match(/blur\(\s*([^)]*?)\s*\)/i);
  return match?.[1] || '';
};

const buildFilterWithBlur = (filter: string | undefined, blur: string) => {
  const withoutBlur = String(filter || '').replace(/blur\(\s*[^)]*?\s*\)/gi, '').replace(/\s+/g, ' ').trim();
  return blur.trim() ? `${withoutBlur}${withoutBlur ? ' ' : ''}blur(${blur.trim()})` : withoutBlur;
};

const StyleEditor: React.FC<StyleEditorProps> = ({ element, breakpoint }) => {
  const { updateElementStyles, updateElementProps, updateElementPseudoClassStyles, pseudoClassState, setPseudoClassState } = useBuilderStore() as any;

  // Get styles based on current pseudo-class state
  let styles: any;
  if (pseudoClassState === 'base') {
    styles = getEffectiveStyles(element, breakpoint as 'widescreen' | 'desktop' | 'laptop' | 'tablet' | 'mobileLandscape' | 'mobile');
  } else {
    const pseudoStyles = element.pseudoClassStyles?.[pseudoClassState as 'hover' | 'active' | 'focus'] as any;
    const pseudoElement = { ...element, styles: pseudoStyles || {} } as BuilderElement;
    styles = getEffectiveStyles(pseudoElement, breakpoint as 'widescreen' | 'desktop' | 'laptop' | 'tablet' | 'mobileLandscape' | 'mobile');
  }

  const isTextElement = ['heading', 'paragraph', 'button', 'link', 'listItem'].includes(element.type);
  const isImageElement = element.type === 'image';
  const [backgroundImageTab, setBackgroundImageTab] = useState<'value' | 'unsplash' | 'uploads'>('value');
  const [activeBackgroundLayer, setActiveBackgroundLayer] = useState(0);
  const [textClipImageTab, setTextClipImageTab] = useState<'value' | 'unsplash' | 'uploads'>('value');

  const update = (key: keyof StyleProperties, value: string) => {
    const animationFields: Array<keyof StyleProperties> = [
      'animationName',
      'animationDuration',
      'animationTimingFunction',
      'animationDelay',
      'animationIterationCount',
      'animationDirection',
      'animationFillMode',
      'animationPlayState',
    ];

    const updates: Partial<StyleProperties> = { [key]: value };

    const parsePixelOffset = (raw: unknown): number | null => {
      const normalized = String(raw ?? '').trim();
      if (!normalized) return 0;
      const match = normalized.match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))(px)?$/i);
      if (!match || (!match[2] && Number(match[1]) !== 0)) return null;
      return Number(match[1]);
    };

    const positionAxis = { left: 'x', right: 'x', top: 'y', bottom: 'y' } as const;
    if (
      pseudoClassState === 'base' &&
      key in positionAxis &&
      ['absolute', 'fixed'].includes(String(styles.position || '')) &&
      element.props.keepChildrenInPlace !== false &&
      element.children.length > 0
    ) {
      const previousOffset = parsePixelOffset(styles[key]);
      const nextOffset = parsePixelOffset(value);
      if (previousOffset !== null && nextOffset !== null) {
        const axis = positionAxis[key as keyof typeof positionAxis];
        const compensation = ['left', 'top'].includes(key) ? previousOffset - nextOffset : nextOffset - previousOffset;
        if (compensation !== 0) {
          element.children.forEach((child: BuilderElement) => {
            const childStyles = getEffectiveStyles(child, breakpoint as 'widescreen' | 'desktop' | 'laptop' | 'tablet' | 'mobileLandscape' | 'mobile');
            const currentTranslate = String(childStyles.translate || '').trim();
            const match = currentTranslate.match(/^(-?(?:\d+(?:\.\d*)?|\.\d+)px)(?:\s+(-?(?:\d+(?:\.\d*)?|\.\d+)px))?$/i);
            if (currentTranslate && currentTranslate !== 'none' && !match) return;
            const x = Number.parseFloat(match?.[1] || '0') + (axis === 'x' ? compensation : 0);
            const y = Number.parseFloat(match?.[2] || '0') + (axis === 'y' ? compensation : 0);
            updateElementStyles(child.id, { translate: `${x}px ${y}px` });
          });
        }
      }
    }

    // Helper: parse a simple CSS animation shorthand into explicit properties.
    const parseAnimationShorthand = (raw: string) => {
      const out: Record<string, string> = {
        animationName: '',
        animationDuration: '',
        animationTimingFunction: '',
        animationDelay: '',
        animationIterationCount: '',
        animationDirection: '',
        animationFillMode: '',
        animationPlayState: '',
      };

      if (!raw) return out;
      const tokens = String(raw).trim().split(/\s+/);

      const timingFunctions = new Set(['ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end']);
      const directions = new Set(['normal', 'reverse', 'alternate', 'alternate-reverse']);
      const fillModes = new Set(['none', 'forwards', 'backwards', 'both']);
      const playStates = new Set(['running', 'paused']);

      let nameSet = false;
      let durationFound = false;

      for (const t of tokens) {
        const token = t.trim();
        if (!token) continue;

        // duration or delay (s or ms)
        if (/^\d*\.?\d+(ms|s)$/.test(token)) {
          if (!durationFound) {
            out.animationDuration = token;
            durationFound = true;
          } else if (!out.animationDelay) {
            out.animationDelay = token;
          }
          continue;
        }

        // timing-function (named or function)
        if (token.includes('(') || timingFunctions.has(token)) {
          out.animationTimingFunction = token;
          continue;
        }

        // iteration count
        if (/^\d+$/.test(token) || token === 'infinite') {
          out.animationIterationCount = token;
          continue;
        }

        if (directions.has(token)) {
          out.animationDirection = token;
          continue;
        }

        if (fillModes.has(token)) {
          out.animationFillMode = token;
          continue;
        }

        if (playStates.has(token)) {
          out.animationPlayState = token;
          continue;
        }

        // Fallback: treat first unmatched token as name
        if (!nameSet) {
          out.animationName = token;
          nameSet = true;
        }
      }

      return out;
    };

    // If the user set the shorthand `animation`, expand it into explicit fields
    // instead of keeping the shorthand alongside non-shorthand properties.
    if (key === 'animation') {
      const parsed = parseAnimationShorthand(value || '');
      animationFields.forEach(field => {
        updates[field] = (parsed as any)[field] || '';
      });
      // remove shorthand to avoid mixing shorthand with longhand
      updates.animation = '';
    }

    // When editing one of the explicit animation fields, clear the shorthand
    // to ensure the final style uses only explicit properties (no mixing).
    if (animationFields.includes(key)) {
      updates.animation = '';
    }

    if (pseudoClassState === 'base') {
      updateElementStyles(element.id, updates);
    } else {
      updateElementPseudoClassStyles(
        element.id,
        pseudoClassState as 'hover' | 'active' | 'focus',
        breakpoint as 'widescreen' | 'desktop' | 'tablet' | 'mobile',
        updates
      );
    }
  };

  useEffect(() => {
    if (styles?.fontFamily) {
      loadGoogleFont(styles.fontFamily);
    }
  }, [styles?.fontFamily]);

  const extractUrlFromCssBackgroundImage = (val: string | undefined) => {
    if (!val) return '';
    const trimmed = String(val).trim();
    const match = trimmed.match(/^url\(\s*(['"]?)(.*?)\1\s*\)\s*$/i);
    if (match) return match[2] || '';
    return trimmed;
  };

  const toCssBackgroundImageValue = (raw: string) => {
    const trimmed = String(raw || '').trim();
    if (!trimmed) return '';
    // If user pasted an existing css value, keep it as-is.
    if (/^url\(/i.test(trimmed)) return trimmed;
    // Otherwise treat as plain link and wrap.
    return `url("${trimmed.replace(/"/g, '\\"')}")`;
  };

  const backgroundLayers: ElementBackgroundLayer[] = Array.isArray(element.props.backgroundLayers)
    ? element.props.backgroundLayers.filter((layer: unknown): layer is ElementBackgroundLayer => (
      Boolean(layer) && typeof layer === 'object' &&
      ['image', 'gradient', 'video'].includes(String((layer as ElementBackgroundLayer).type)) &&
      typeof (layer as ElementBackgroundLayer).value === 'string'
    ))
    : [
      ...(styles.backgroundGradient ? [{ type: 'gradient' as const, value: styles.backgroundGradient }] : []),
      ...splitCssBackgroundLayers(styles.backgroundImage || '').map(value => ({ type: isCssGradient(value) ? 'gradient' as const : 'image' as const, value })),
      ...(typeof element.props.backgroundVideoUrl === 'string' && element.props.backgroundVideoUrl.trim()
        ? [{ type: 'video' as const, value: element.props.backgroundVideoUrl.trim() }]
        : []),
    ];

  const writeBackgroundLayers = (layers: ElementBackgroundLayer[]) => {
    updateElementProps(element.id, { backgroundLayers: layers, backgroundVideoUrl: undefined });
    updateElementStyles(element.id, { backgroundGradient: '', backgroundImage: '' });
  };

  const updateBackgroundLayer = (index: number, value: string) => {
    const layers = [...backgroundLayers];
    layers[index] = { ...layers[index], value };
    writeBackgroundLayers(layers);
  };

  const moveBackgroundLayer = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= backgroundLayers.length) return;
    const layers = [...backgroundLayers];
    [layers[index], layers[targetIndex]] = [layers[targetIndex], layers[index]];
    writeBackgroundLayers(layers);
    setActiveBackgroundLayer(targetIndex);
  };

  const deleteBackgroundLayer = (index: number) => {
    const layers = backgroundLayers.filter((_, layerIndex) => layerIndex !== index);
    writeBackgroundLayers(layers);
    setActiveBackgroundLayer(Math.max(0, Math.min(index, layers.length - 1)));
  };

  const addBackgroundLayer = (type: ElementBackgroundLayer['type']) => {
    const value = type === 'gradient'
      ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0) 100%)'
      : '';
    const nextLayers = type === 'video'
      ? [...backgroundLayers, { type, value }]
      : [{ type, value }, ...backgroundLayers];
    writeBackgroundLayers(nextLayers);
    setActiveBackgroundLayer(type === 'video' ? nextLayers.length - 1 : 0);
    setBackgroundImageTab('value');
  };

  const parsePx = (val: string | undefined) => {
    if (!val) return '';
    return val.replace('px', '').replace('rem', '').trim();
  };

  const getSpacing = (prefix: 'margin' | 'padding') => ({
    top: parsePx((styles as unknown as Record<string, string>)[`${prefix}Top`] || (styles as unknown as Record<string, string>)[prefix]),
    right: parsePx((styles as unknown as Record<string, string>)[`${prefix}Right`] || (styles as unknown as Record<string, string>)[prefix]),
    bottom: parsePx((styles as unknown as Record<string, string>)[`${prefix}Bottom`] || (styles as unknown as Record<string, string>)[prefix]),
    left: parsePx((styles as unknown as Record<string, string>)[`${prefix}Left`] || (styles as unknown as Record<string, string>)[prefix]),
  });

  const handleSpacing = (prefix: 'margin' | 'padding', side: string, val: string) => {
    const formatted = val && !isNaN(Number(val)) ? `${val}px` : val;
    update(`${prefix}${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof StyleProperties, formatted);
  };
  const breakpointLabel = ({
    widescreen: 'Widescreen',
    desktop: 'Desktop',
    laptop: 'Laptop',
    tablet: 'Tablet',
    mobileLandscape: 'Mobile L',
    mobile: 'Mobile',
  } as Record<string, string>)[breakpoint] || breakpoint;
  const fontSizeValue = Number.parseFloat(String(styles.fontSize || '16'));
  const rangeFontSize = Number.isFinite(fontSizeValue) ? Math.min(96, Math.max(8, fontSizeValue)) : 16;

  return (
    <div className="flex flex-col pb-2">
      <div className="sticky top-0 z-20 border-b border-gray-800 bg-[#111114]/95 px-3.5 pb-3 pt-3 backdrop-blur">
        <div className="mb-3 flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-sky-400/20 bg-sky-400/8 text-sky-300"><SlidersHorizontal size={15} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-100">Style</p>
            <p className="truncate text-[10px] text-gray-500">{element.name} <span className="text-gray-700">/</span> {element.type}</p>
          </div>
          <span className="shrink-0 rounded border border-gray-700 bg-gray-900 px-1.5 py-1 text-[9px] font-medium uppercase text-gray-400">{breakpointLabel}</span>
        </div>
        <div role="group" aria-label="Style state" className="grid grid-cols-4 gap-1 rounded-md border border-gray-800 bg-[#0b0c0f] p-1">
          {(['base', 'hover', 'active', 'focus'] as const).map(state => (
            <button
              key={state}
              type="button"
              aria-pressed={pseudoClassState === state}
              onClick={() => setPseudoClassState(state)}
              className={`rounded px-1 py-1.5 text-[10px] font-medium transition-colors ${pseudoClassState === state
                ? 'bg-gray-700 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'
                }`}
            >
              {state === 'base' ? 'Base' : state === 'active' ? 'Pressed' : state.charAt(0).toUpperCase() + state.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {/* Layout */}
      <Section title="Layout">
        <div className="mb-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Display</span>
            <span className="text-[10px] font-mono text-gray-600">{styles.display || 'block'}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-md border border-gray-800 bg-[#101114] p-1">
            {[
              { value: 'block', label: 'Block', icon: <Square size={13} /> },
              { value: 'flex', label: 'Flex', icon: <AlignLeft size={13} /> },
              { value: 'grid', label: 'Grid', icon: <Grid2x2 size={13} /> },
            ].map(mode => (
              <button key={mode.value} type="button" aria-pressed={(styles.display || 'block') === mode.value} title={`${mode.label} display`} onClick={() => update('display', mode.value)} className={`flex h-8 items-center justify-center gap-1.5 rounded text-[10px] transition-colors ${(styles.display || 'block') === mode.value ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'}`}>
                {mode.icon}{mode.label}
              </button>
            ))}
          </div>
          <select aria-label="Other display mode" value={['inline', 'inline-flex', 'none'].includes(styles.display || '') ? styles.display : ''} onChange={event => event.target.value && update('display', event.target.value)} className="mt-1.5 h-7 w-full rounded border border-gray-800 bg-[#191b20] px-2 text-[10px] text-gray-500 outline-none focus:border-sky-400">
            <option value="">Other display modes...</option>
            <option value="inline">Inline</option>
            <option value="inline-flex">Inline flex</option>
            <option value="none">None</option>
          </select>
        </div>
        {styles.display === 'flex' && (
          <>
            <InputRow
              label="Direction"
              value={styles.flexDirection || ''}
              onChange={v => update('flexDirection', v)}
              options={['row', 'column', 'row-reverse', 'column-reverse']}
            />
            <InputRow
              label="Justify"
              value={styles.justifyContent || ''}
              onChange={v => update('justifyContent', v)}
              options={['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']}
            />
            <InputRow
              label="Align"
              value={styles.alignItems || ''}
              onChange={v => update('alignItems', v)}
              options={['flex-start', 'center', 'flex-end', 'stretch', 'baseline']}
            />
            <InputRow
              label="Wrap"
              value={styles.flexWrap || ''}
              onChange={v => update('flexWrap', v)}
              options={['nowrap', 'wrap', 'wrap-reverse']}
            />
            <InputRow label="Gap"
              value={styles.gap || ''}
              onChange={v => update('gap', v)}
              placeholder="16px" />
          </>
        )}

        {styles.display === 'grid' && (
          <>
            <InputRow
              label="Columns"
              value={styles.gridTemplateColumns || ''}
              onChange={v => update('gridTemplateColumns', v)}
              placeholder="repeat(3, 1fr)"
            />
            <InputRow
              label="Rows"
              value={styles.gridTemplateRows || ''}
              onChange={v => update('gridTemplateRows', v)}
              placeholder="auto"
            />
            <InputRow label="Gap" value={styles.gap || ''} onChange={v => update('gap', v)} placeholder="16px" />
          </>
        )}
        <InputRow
          label="Position"
          value={styles.position || ''}
          onChange={v => update('position', v)}
          options={['static', 'relative', 'absolute', 'fixed', 'sticky']}
        />
        {(styles.position === 'absolute' || styles.position === 'fixed') && (
          <div className="grid grid-cols-2 gap-2 mt-1">
            {(['top', 'right', 'bottom', 'left'] as const).map(side => (
              <div key={side} className="flex items-center">
                <span className="text-xs text-gray-600 w-3">{side[0].toUpperCase()}</span>
                <input
                  type="text"
                  value={(styles as unknown as Record<string, string>)[side] || ''}
                  onChange={e => update(side as keyof StyleProperties, e.target.value)}
                  placeholder="auto"
                  className="flex-1 w-full bg-gray-800 text-gray-200 text-xs rounded px-1.5 py-1 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        )}
      </Section>
      {/* Size */}
      <Section title="Size">
        <div className="grid grid-cols-2 gap-2 mb-2">
          {[
            { label: 'W', key: 'width' as const },
            { label: 'H', key: 'height' as const },
            { label: 'Min W', key: 'minWidth' as const },
            { label: 'Max W', key: 'maxWidth' as const },
            { label: 'Min H', key: 'minHeight' as const },
            { label: 'Max H', key: 'maxHeight' as const },
          ].map(({ label, key }) => (
            <div key={key} className="flex items-center gap-1">
              <span className="text-xs text-gray-600 w-8 shrink-0">{label}</span>
              <input
                type="text"
                value={(styles as unknown as Record<string, string>)[key] || ''}
                onChange={e => update(key, e.target.value)}
                placeholder="auto"
                className="flex-1 min-w-0 bg-gray-800 text-gray-200 text-xs rounded px-1.5 py-1 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
        <InputRow
          label="Overflow"
          value={styles.overflow || ''}
          onChange={v => update('overflow', v)}
          options={['visible', 'hidden', 'scroll', 'auto']}
        />
        {isImageElement && (
          <InputRow
            label="Object fit"
            value={styles.objectFit || ''}
            onChange={v => update('objectFit', v)}
            options={['fill', 'contain', 'cover', 'none', 'scale-down']}
          />
        )}
      </Section>

      {/* Spacing */}
      <Section title="Spacing">
        <SpacingInput
          label="Padding"
          values={getSpacing('padding')}
          onChange={(side, val) => handleSpacing('padding', side, val)}
        />
        <SpacingInput
          label="Margin"
          values={getSpacing('margin')}
          onChange={(side, val) => handleSpacing('margin', side, val)}
        />
      </Section>

      {/* Typography */}
      {element.type === 'heading' || element.type === 'paragraph' || element.type === 'button' || element.type === 'link' || element.type === 'listItem' || element.type === 'icon' ? (
        <Section title="Typography">
          <InputRow
            label="Font"
            value={styles.fontFamily || ''}
            onChange={v => update('fontFamily', v)}
            options={GOOGLE_FONT_OPTIONS}
          />
          <div className="mb-3 rounded-lg border border-gray-800 bg-[#14161a] p-2.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-300">Font size</span>
              <span className="font-mono text-[10px] text-gray-400">{styles.fontSize || '16px'}</span>
            </div>
            <Slider min={8} max={96} step={1} value={[rangeFontSize]}
              onValueChange={(value) => update('fontSize', `${value[0]}px`)} className="mx-auto w-full max-w-xs" />
            <div className="mt-1 mb-1 flex items-center justify-between text-[9px] text-gray-600"><span>8px</span><span>96px</span></div>
            <InputRow label="Custom size" value={styles.fontSize || ''} onChange={v => update('fontSize', v)} placeholder="16px" />
          </div>
          <InputRow
            label="Weight"
            value={styles.fontWeight || ''}
            onChange={v => update('fontWeight', v)}
            options={['300', '400', '500', '600', '700', '800', '900']}
          />
          <InputRow label="Line H" value={styles.lineHeight || ''} onChange={v => update('lineHeight', v)} placeholder="1.5" />
          <InputRow label="Spacing" value={styles.letterSpacing || ''} onChange={v => update('letterSpacing', v)} placeholder="0em" />
          <div className="mb-2 flex items-center gap-2">
            <span className="w-18.5 shrink-0 text-[11px] text-gray-400">Align</span>
            <div role="group" aria-label="Text alignment" className="grid h-8 flex-1 grid-cols-4 rounded-md border border-gray-700/80 bg-[#191b20] p-0.5">
              {[
                { value: 'left', label: 'Align left', icon: <AlignLeft size={13} /> },
                { value: 'center', label: 'Align center', icon: <AlignCenter size={13} /> },
                { value: 'right', label: 'Align right', icon: <AlignRight size={13} /> },
                { value: 'justify', label: 'Justify', icon: <AlignJustify size={13} /> },
              ].map(option => (
                <button key={option.value} type="button" aria-label={option.label} aria-pressed={(styles.textAlign || 'left') === option.value} title={option.label} onClick={() => update('textAlign', option.value)} className={`flex items-center justify-center rounded transition-colors ${(styles.textAlign || 'left') === option.value ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-200'}`}>
                  {option.icon}
                </button>
              ))}
            </div>
          </div>
          {isTextElement && (
            <BackgroundFillInput
              label="Text fill"
              colorValue={styles.color || ''}
              gradientValue={styles.textGradient || ''}
              onChangeColor={(v) => {
                update('color', v);
                if (v) update('textGradient', '');
              }}
              onChangeGradient={(v) => {
                update('textGradient', v);
                if (v) update('color', '');
              }}
            />
          )}

          {isTextElement && (
            <>
              <InputRow
                label="Text image"
                value={extractUrlFromCssBackgroundImage(styles.textClipImage)}
                onChange={v => update('textClipImage', toCssBackgroundImageValue(v))}
                placeholder="https://..."
              />

              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setTextClipImageTab('value')}
                  className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-colors ${textClipImageTab === 'value'
                    ? 'bg-blue-300/10 text-blue-200 border-blue-300/40'
                    : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
                    }`}
                >
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setTextClipImageTab('unsplash')}
                  className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-colors ${textClipImageTab === 'unsplash'
                    ? 'bg-blue-300/10 text-blue-200 border-blue-300/40'
                    : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
                    }`}
                >
                  Unsplash
                </button>
                <button
                  type="button"
                  onClick={() => setTextClipImageTab('uploads')}
                  className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-colors ${textClipImageTab === 'uploads'
                    ? 'bg-blue-300/10 text-blue-200 border-blue-300/40'
                    : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
                    }`}
                >
                  My uploads
                </button>
              </div>

              {textClipImageTab === 'unsplash' && (
                <UnsplashPicker
                  onPick={(photo) => {
                    update('textClipImage', toCssBackgroundImageValue(photo.urls.regular));
                  }}
                />
              )}
              {textClipImageTab === 'uploads' && (
                <UserImagePicker onPick={(url) => update('textClipImage', toCssBackgroundImageValue(url))} />
              )}
            </>
          )}
          <InputRow
            label="Transform"
            value={styles.textTransform || ''}
            onChange={v => update('textTransform', v)}
            options={['none', 'uppercase', 'lowercase', 'capitalize']}
          />
          <InputRow
            label="Decoration"
            value={styles.textDecoration || ''}
            onChange={v => update('textDecoration', v)}
            options={['none', 'underline', 'line-through', 'overline']}
          />
          {!isTextElement && <ColorInput label="Color" value={styles.color || ''} onChange={v => update('color', v)} />}
        </Section>
      ) : null}

      {/* Background */}
      <Section title="Background">
        <BackgroundFillInput
          label="Fill"
          colorValue={styles.backgroundColor || ''}
          gradientValue={styles.backgroundGradient || ''}
          onChangeColor={(v) => update('backgroundColor', v)}
          onChangeGradient={(v) => update('backgroundGradient', v)}
        />
        {(element.type === 'section' || element.type === 'div') && (
          <label className="mb-2 flex cursor-pointer items-center gap-2 text-[11px] text-gray-300">
            <input
              type="checkbox"
              checked={styles.backgroundAttachment === 'fixed'}
              onChange={event => update('backgroundAttachment', event.target.checked ? 'fixed' : 'scroll')}
              className="accent-sky-400"
            />
            Parallax background
          </label>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-300">Background layers</span>
            <span className="text-[10px] text-gray-500">Top layer renders first</span>
          </div>
          {backgroundLayers.map((layer, index) => {
            return (
              <div key={`${layer.type}-${index}-${layer.value.slice(0, 20)}`} className="rounded-md border border-gray-800 bg-[#101114] p-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[10px] font-medium text-gray-300">{layer.type === 'video' ? 'Video layer' : layer.type === 'gradient' ? 'Gradient layer' : `Image layer ${index + 1}`}</span>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button type="button" onClick={() => moveBackgroundLayer(index, -1)} disabled={index === 0} title="Move layer forward" aria-label={`Move background layer ${index + 1} forward`} className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"><ArrowUp size={13} /></button>
                    <button type="button" onClick={() => moveBackgroundLayer(index, 1)} disabled={index === backgroundLayers.length - 1} title="Move layer backward" aria-label={`Move background layer ${index + 1} backward`} className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"><ArrowDown size={13} /></button>
                    <button type="button" onClick={() => deleteBackgroundLayer(index)} title="Remove background layer" aria-label={`Remove background layer ${index + 1}`} className="rounded p-1 text-gray-500 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={13} /></button>
                  </div>
                </div>

                {layer.type === 'video' ? (
                  <>
                    <label htmlFor={`background-video-${element.id}-${index}`} className="mb-1 block text-[9px] text-gray-500">Direct video URL</label>
                    <input
                      id={`background-video-${element.id}-${index}`}
                      type="url"
                      value={layer.value}
                      onChange={event => updateBackgroundLayer(index, event.target.value)}
                      placeholder="https://example.com/video.mp4"
                      className="h-8 w-full rounded border border-gray-700 bg-gray-900 px-2 text-[10px] text-gray-200 outline-none focus:border-sky-400"
                    />
                    <p className="mt-1.5 text-[9px] leading-relaxed text-gray-500">Muted and looping. Move this layer to place overlays above it.</p>
                  </>
                ) : layer.type === 'gradient' ? (
                  <BackgroundFillInput
                    label="Gradient overlay"
                    colorValue=""
                    gradientValue={layer.value}
                    onChangeColor={() => { }}
                    onChangeGradient={(v) => updateBackgroundLayer(index, v)}
                  />
                ) : (
                  <>

                    <div className="mb-2 grid grid-cols-3 gap-1">
                      {([
                        ['value', 'URL'],
                        ['unsplash', 'Unsplash'],
                        ['uploads', 'Uploads'],
                      ] as const).map(([tab, label]) => (
                        <button key={tab} type="button" onClick={() => { setActiveBackgroundLayer(index); setBackgroundImageTab(tab); }} aria-pressed={activeBackgroundLayer === index && backgroundImageTab === tab} className={`rounded border px-1 py-1.5 text-[9px] ${activeBackgroundLayer === index && backgroundImageTab === tab ? 'border-sky-400/40 bg-sky-400/10 text-sky-200' : 'border-gray-800 bg-gray-900 text-gray-500 hover:text-gray-200'}`}>{label}</button>
                      ))}
                    </div>
                    {activeBackgroundLayer === index && backgroundImageTab === 'unsplash' ? (
                      <UnsplashPicker onPick={photo => updateBackgroundLayer(index, toCssBackgroundImageValue(photo.urls.regular))} />
                    ) : activeBackgroundLayer === index && backgroundImageTab === 'uploads' ? (
                      <UserImagePicker onPick={url => updateBackgroundLayer(index, toCssBackgroundImageValue(url))} />
                    ) : (
                      <InputRow label="Image URL" value={extractUrlFromCssBackgroundImage(layer.value)} onChange={value => updateBackgroundLayer(index, value ? toCssBackgroundImageValue(value) : 'none')} placeholder="https://..." />
                    )}
                  </>
                )}
              </div>
            );
          })}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button type="button" onClick={() => addBackgroundLayer('image')} className="flex items-center justify-center gap-1.5 rounded border border-gray-700 bg-gray-900 px-2 py-2 text-[10px] font-medium text-gray-300 hover:border-sky-400/40 hover:text-sky-200"><Plus size={12} />Image</button>
            <button type="button" onClick={() => addBackgroundLayer('gradient')} className="flex items-center justify-center gap-1.5 rounded border border-gray-700 bg-gray-900 px-2 py-2 text-[10px] font-medium text-gray-300 hover:border-sky-400/40 hover:text-sky-200"><Plus size={12} />Gradient</button>
            <button type="button" onClick={() => addBackgroundLayer('video')} className="flex items-center justify-center gap-1.5 rounded border border-gray-700 bg-gray-900 px-2 py-2 text-[10px] font-medium text-gray-300 hover:border-sky-400/40 hover:text-sky-200"><Plus size={12} />Video</button>
          </div>
        </div>
        <InputRow
          label="Size"
          value={styles.backgroundSize || ''}
          onChange={v => update('backgroundSize', v)}
          options={['auto', 'cover', 'contain', '100%', '100% 100%']}
        />
        <InputRow
          label="Position"
          value={styles.backgroundPosition || ''}
          onChange={v => update('backgroundPosition', v)}
          options={['top', 'center', 'bottom', 'left', 'right', 'top center', 'center center']}
        />
      </Section>

      {/* Border */}
      <Section title="Border">
        <BorderInput
          values={{
            top: parsePx((styles as unknown as Record<string, string>)[`borderTopWidth`] || (styles as unknown as Record<string, string>)[`borderWidth`]),
            right: parsePx((styles as unknown as Record<string, string>)[`borderRightWidth`] || (styles as unknown as Record<string, string>)[`borderWidth`]),
            bottom: parsePx((styles as unknown as Record<string, string>)[`borderBottomWidth`] || (styles as unknown as Record<string, string>)[`borderWidth`]),
            left: parsePx((styles as unknown as Record<string, string>)[`borderLeftWidth`] || (styles as unknown as Record<string, string>)[`borderWidth`]),
          }}
          styles={{
            topStyle: (styles as unknown as Record<string, string>)[`borderTopStyle`] || styles.borderStyle || '',
            rightStyle: (styles as unknown as Record<string, string>)[`borderRightStyle`] || styles.borderStyle || '',
            bottomStyle: (styles as unknown as Record<string, string>)[`borderBottomStyle`] || styles.borderStyle || '',
            leftStyle: (styles as unknown as Record<string, string>)[`borderLeftStyle`] || styles.borderStyle || '',
            topColor: (styles as unknown as Record<string, string>)[`borderTopColor`] || styles.borderColor || '#000000',
            rightColor: (styles as unknown as Record<string, string>)[`borderRightColor`] || styles.borderColor || '#000000',
            bottomColor: (styles as unknown as Record<string, string>)[`borderBottomColor`] || styles.borderColor || '#000000',
            leftColor: (styles as unknown as Record<string, string>)[`borderLeftColor`] || styles.borderColor || '#000000',
          }}
          onChangeWidth={(side, val) => {
            const formatted = val && !isNaN(Number(val)) ? `${val}px` : val;
            update(`border${side.charAt(0).toUpperCase() + side.slice(1)}Width` as keyof StyleProperties, formatted);
          }}
          onChangeStyle={(side, val) => {
            update(`border${side.charAt(0).toUpperCase() + side.slice(1)}Style` as keyof StyleProperties, val);
          }}
          onChangeColor={(side, val) => {
            update(`border${side.charAt(0).toUpperCase() + side.slice(1)}Color` as keyof StyleProperties, val);
          }}
        />
        <InputRow label="Radius" value={styles.borderRadius || ''} onChange={v => update('borderRadius', v)} placeholder="8px" />
      </Section>

      {/* Effects */}
      <Section title="Effects" defaultOpen={false}>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Shadow</span>
            <div className="ml-2 flex flex-wrap gap-1">
              {[
                { label: 'None', value: 'none' },
                { label: 'Soft', value: '0px 4px 12px rgba(0,0,0,0.12)' },
                { label: 'Medium', value: '0px 8px 20px rgba(0,0,0,0.16)' },
                { label: 'Strong', value: '0px 12px 28px rgba(0,0,0,0.2)' },
                { label: 'Inset', value: 'inset 0px 4px 12px rgba(0,0,0,0.12)' },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => update('boxShadow', preset.value)}
                  className="text-[12px] px-2 py-1 rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {['X offset', 'Y offset', 'Blur', 'Spread'].map((label, index) => {
              const shadowValues = parseBoxShadow(styles.boxShadow);
              const keys = ['x', 'y', 'blur', 'spread'] as const;
              const key = keys[index];
              return (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-500">{label}</label>
                  <input
                    type="text"
                    value={shadowValues[key] || ''}
                    onChange={e => update('boxShadow', buildBoxShadow({ ...shadowValues, [key]: e.target.value }))}
                    placeholder={index < 2 ? '0px' : '4px'}
                    className="w-full bg-gray-800 text-gray-200 text-xs rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              );
            })}
          </div>
          <ColorInput
            label="Color"
            value={parseBoxShadow(styles.boxShadow).color || 'rgba(0,0,0,0.2)'}
            onChange={(value) => {
              const shadowValues = parseBoxShadow(styles.boxShadow);
              update('boxShadow', buildBoxShadow({ ...shadowValues, color: value }));
            }}
          />
        </div>
        <InputRow label="Opacity" value={styles.opacity || ''} onChange={v => update('opacity', v)} placeholder="1" />
        <InputRow
          label="Blur"
          value={parseFilterBlur(styles.filter)}
          onChange={v => update('filter', buildFilterWithBlur(styles.filter, v))}
          placeholder="0px"
          unit="px"
        />
        <InputRow label="z-index" value={styles.zIndex || ''} onChange={v => update('zIndex', v)} placeholder="auto" />
        <InputRow label="Transition" value={styles.transition || ''} onChange={v => update('transition', v)} placeholder="all 0.2s ease" />
      </Section>
    </div>
  );
};

const createCssScaffold = (selector: string, styles: StyleProperties) => {
  const declarations = styleObjectToCssString(styles)
    .split(';')
    .map(declaration => declaration.trim())
    .filter(Boolean)
    .map(declaration => `  ${declaration};`)
    .join('\n');
  return `/* Styles for this element */\n${selector} {\n${declarations ? `${declarations}\n` : ''}}\n`;
};

const cssPropertyToStyleKey = (property: string) => property.startsWith('--')
  ? property
  : property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

const readElementCssStyles = (css: string, selector: string): Partial<StyleProperties> | null => {
  try {
    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(css);
    const matchingRule = Array.from(stylesheet.cssRules).find(rule => {
      if (rule.type !== 1) return false;
      const styleRule = rule as CSSStyleRule;
      return styleRule.selectorText.split(',').some(item => item.trim() === selector);
    }) as CSSStyleRule | undefined;

    if (!matchingRule) return null;

    const styles: Record<string, string> = {};
    for (let index = 0; index < matchingRule.style.length; index += 1) {
      const property = matchingRule.style.item(index);
      styles[cssPropertyToStyleKey(property)] = matchingRule.style.getPropertyValue(property).trim();
    }
    return styles as Partial<StyleProperties>;
  } catch {
    return null;
  }
};

const syncElementCssRule = (css: string, selector: string, styles: StyleProperties) => {
  try {
    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(css);
    const matchingRule = Array.from(stylesheet.cssRules).find(rule => {
      if (rule.type !== 1) return false;
      const styleRule = rule as CSSStyleRule;
      return styleRule.selectorText.split(',').some(item => item.trim() === selector);
    }) as CSSStyleRule | undefined;

    if (!matchingRule) return `${css.trimEnd()}\n\n${createCssScaffold(selector, styles)}`;
    matchingRule.style.cssText = styleObjectToCssString(styles);
    return Array.from(stylesheet.cssRules).map(rule => rule.cssText).join('\n');
  } catch {
    return css;
  }
};

const CSSEditor: React.FC<{ element: BuilderElement; breakpoint: Breakpoint }> = ({ element, breakpoint }) => {
  const { updateElementProps, updateElementStyles, pushHistory } = useBuilderStore();
  const selector = `.lunio-${element.id}`;
  const savedCss = typeof element.props.customCss === 'string' ? element.props.customCss : undefined;
  const currentStyles = getEffectiveStyles(element, breakpoint);
  const styleSignature = styleObjectToCssString(currentStyles);
  const [code, setCode] = useState(() => savedCss ?? createCssScaffold(selector, currentStyles));
  const [checkpointed, setCheckpointed] = useState(true);
  const [copied, setCopied] = useState(false);
  const localUpdate = useRef(false);
  const activeElementId = useRef(element.id);

  useEffect(() => {
    const elementChanged = activeElementId.current !== element.id;
    activeElementId.current = element.id;
    if (!elementChanged && localUpdate.current) {
      localUpdate.current = false;
      return;
    }
    localUpdate.current = false;
    const nextCode = savedCss
      ? syncElementCssRule(savedCss, selector, currentStyles)
      : createCssScaffold(selector, currentStyles);
    setCode(nextCode);
    if (savedCss && nextCode !== savedCss) {
      updateElementProps(element.id, { customCss: nextCode });
    }
    setCheckpointed(true);
  }, [element.id, savedCss, selector, breakpoint, styleSignature, updateElementProps]);

  const handleChange = (nextCode: string | undefined) => {
    const value = nextCode ?? '';
    localUpdate.current = true;
    setCode(value);
    setCheckpointed(false);
    updateElementProps(element.id, { customCss: value });

    const parsedStyles = readElementCssStyles(value, selector);
    if (parsedStyles) {
      const clearedStyles = Object.keys(currentStyles).reduce((result, key) => {
        result[key as keyof StyleProperties] = undefined;
        return result;
      }, {} as Partial<StyleProperties>);
      updateElementStyles(element.id, { ...clearedStyles, ...parsedStyles });
    }
  };

  const handleReset = () => {
    const value = createCssScaffold(selector, currentStyles);
    localUpdate.current = true;
    setCode(value);
    setCheckpointed(false);
    updateElementProps(element.id, { customCss: value });
    const parsedStyles = readElementCssStyles(value, selector);
    if (parsedStyles) updateElementStyles(element.id, parsedStyles);
  };

  const handleCopySelector = async () => {
    try {
      await navigator.clipboard.writeText(selector);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#101114]">
      <div className="border-b border-white/8 px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-100">Custom CSS</p>
            <p className="mt-1 truncate font-mono text-[10px] text-sky-300">{selector}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded border border-emerald-400/20 bg-emerald-400/8 px-2 py-1 text-[10px] text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400" />Live
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] text-gray-500">element-{element.id.slice(-6)}.css</span>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={handleCopySelector} title="Copy element selector" aria-label="Copy element selector" className="inline-flex size-7 items-center justify-center rounded border border-white/10 text-gray-400 transition-colors hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-sky-200">
              <Copy size={13} />
            </button>
            <button type="button" onClick={handleReset} title="Reset to selector scaffold" aria-label="Reset CSS" className="inline-flex size-7 items-center justify-center rounded border border-white/10 text-gray-400 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-gray-100">
              <RotateCcw size={13} />
            </button>
            <button type="button" onClick={() => { pushHistory(); setCheckpointed(true); }} title="Save undo checkpoint" aria-label="Save CSS changes" className="inline-flex size-7 items-center justify-center rounded border border-sky-400/30 bg-sky-400/10 text-sky-200 transition-colors hover:bg-sky-400/20">
              <Save size={13} />
            </button>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 p-2">
        <div className="h-full min-h-64 overflow-hidden rounded-md border border-white/10 bg-[#0b0c0e] shadow-inner shadow-black/20">
          <Editor
            height="100%"
            language="css"
            theme="vs-dark"
            value={code}
            onChange={handleChange}
            options={{
              ariaLabel: 'Custom CSS editor',
              automaticLayout: true,
              bracketPairColorization: { enabled: true },
              cursorBlinking: 'smooth',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12,
              formatOnPaste: true,
              formatOnType: true,
              lineNumbers: 'on',
              minimap: { enabled: false },
              padding: { top: 12, bottom: 12 },
              scrollBeyondLastLine: false,
              tabSize: 2,
              wordWrap: 'on',
            }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/8 px-3.5 py-2 text-[10px] text-gray-500">
        <span>CSS · {code.split('\n').length} lines</span>
        <span className={checkpointed ? 'text-gray-500' : 'text-amber-300'}>{checkpointed ? 'Checkpoint saved' : 'Live changes'}</span>
      </div>
    </div>
  );
};

interface ContentEditorProps {
  element: BuilderElement;
}

const findCmsMapAncestor = (elements: BuilderElement[], targetId: string, ancestor: BuilderElement | null = null): BuilderElement | null => {
  for (const element of elements) {
    if (element.id === targetId) return ancestor;
    const found = findCmsMapAncestor(element.children || [], targetId, element.type === 'cmsMap' ? element : ancestor);
    if (found) return found;
  }
  return null;
};

const findSliderAncestor = (elements: BuilderElement[], targetId: string, ancestor: BuilderElement | null = null): BuilderElement | null => {
  for (const element of elements) {
    if (element.id === targetId) return element.type === 'slider' ? element : ancestor;
    const found = findSliderAncestor(element.children || [], targetId, element.type === 'slider' ? element : ancestor);
    if (found) return found;
  }
  return null;
};

type UnsplashPhoto = {
  id: string;
  width: number;
  height: number;
  alt_description: string | null;
  description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: { name: string; username: string };
  links: { html: string };
};

type UserImage = {
  id: string;
  name: string;
  url: string;
};

const UserImagePicker: React.FC<{ onPick: (url: string) => void }> = ({ onPick }) => {
  const [images, setImages] = useState<UserImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/assets');
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to load uploads');
      setImages(Array.isArray(data.assets) ? data.assets : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load uploads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/assets', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Upload failed');
      onPick(data.asset.url);
      await loadImages();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-3">
      <label className="flex items-center justify-center gap-2 w-full cursor-pointer text-xs text-blue-200 border border-dashed border-blue-300/40 rounded-lg px-3 py-3 hover:bg-blue-300/10">
        <Upload size={14} />
        {uploading ? 'Uploading...' : 'Upload image'}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadImage(file);
            event.target.value = '';
          }}
        />
      </label>
      <div className="mt-2 text-[11px] text-gray-600">{loading ? 'Loading your uploads...' : error || `${images.length} saved image${images.length === 1 ? '' : 's'}`}</div>
      {images.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {images.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => onPick(image.url)}
              className="group overflow-hidden rounded-md border border-gray-800 bg-gray-900 hover:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-500"
              title={`Use ${image.name}`}
            >
              <img src={image.url} alt={image.name} className="w-full h-16 object-cover group-hover:opacity-90" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const UnsplashPicker: React.FC<{
  onPick: (photo: UnsplashPhoto) => void;
}> = ({ onPick }) => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<UnsplashPhoto[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query.trim(), 350);

  const canSearch = debouncedQuery.length >= 2;

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setTotalPages(0);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/unsplash/search?q=${encodeURIComponent(debouncedQuery)}&page=${page}&perPage=12`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Request failed (${res.status})`);
        }
        const data = (await res.json()) as { results: UnsplashPhoto[]; total_pages: number };
        if (cancelled) return;
        setResults(Array.isArray(data.results) ? data.results : []);
        setTotalPages(Number(data.total_pages || 0));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to search Unsplash');
        setResults([]);
        setTotalPages(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [canSearch, debouncedQuery, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  return (
    <div className="mt-3">
      <label className="text-xs text-gray-500 block mb-1">Unsplash</label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search photos (e.g. mountains, coffee, abstract)…"
        className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="text-[11px] text-gray-600">
          {loading ? 'Searching…' : error ? error : canSearch ? `${results.length} results` : 'Type 2+ characters to search.'}
        </div>
        {canSearch && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="text-[11px] px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-gray-800"
            >
              Prev
            </button>
            <div className="text-[11px] text-gray-500">
              {page}/{Math.max(1, totalPages || 1)}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => (totalPages ? Math.min(totalPages, p + 1) : p + 1))}
              disabled={loading || (totalPages ? page >= totalPages : false)}
              className="text-[11px] px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {canSearch && results.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {results.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => onPick(photo)}
              className="group relative overflow-hidden rounded-md border border-gray-800 bg-gray-900 hover:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-500"
              title={`Photo by ${photo.user?.name || 'Unsplash'}`}
            >
              <img
                src={photo.urls.small}
                alt={photo.alt_description || photo.description || 'Unsplash photo'}
                className="w-full h-16 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 text-[11px] mb-2 text-gray-600">
        Photos from{' '}
        <a
          href="https://unsplash.com"
          target="_blank"
          rel="noreferrer"
          className="text-blue-300 hover:text-blue-200 underline underline-offset-2"
        >
          Unsplash
        </a>
        .
      </div>
    </div>
  );
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

interface CalendarEvent {
  date: string;
  title: string;
}

const getCalendarEvents = (value: unknown): CalendarEvent[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((event): event is CalendarEvent => (
    Boolean(event) && typeof event === 'object' &&
    typeof (event as CalendarEvent).date === 'string' &&
    typeof (event as CalendarEvent).title === 'string'
  ));
};

const CalendarEventEditor: React.FC<{ events: CalendarEvent[]; onChange: (events: CalendarEvent[]) => void }> = ({ events, onChange }) => {
  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [newDate, setNewDate] = useState(defaultDate);
  const [newTitle, setNewTitle] = useState('');

  const addEvent = () => {
    const title = newTitle.trim();
    if (!newDate || !title) return;
    onChange([...events, { date: newDate, title }]);
    setNewTitle('');
  };

  const updateEvent = (index: number, changes: Partial<CalendarEvent>) => {
    onChange(events.map((event, eventIndex) => eventIndex === index ? { ...event, ...changes } : event));
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-500 block">Events</label>
      <div className="space-y-2">
        {events.map((event, index) => (
          <div key={`${event.date}-${index}`} className="flex items-center gap-1.5">
            <input
              type="date"
              value={event.date}
              onChange={e => updateEvent(index, { date: e.target.value })}
              className="w-26.5 shrink-0 bg-gray-800 text-gray-200 text-[11px] rounded-lg px-2 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={event.title}
              onChange={e => updateEvent(index, { title: e.target.value })}
              placeholder="Event title"
              className="min-w-0 flex-1 bg-gray-800 text-gray-200 text-xs rounded-lg px-2 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => onChange(events.filter((_, eventIndex) => eventIndex !== index))}
              title="Remove event"
              aria-label="Remove event"
              className="text-gray-500 hover:text-red-300 p-1.5 rounded hover:bg-gray-800"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={newDate}
          onChange={e => setNewDate(e.target.value)}
          className="w-26.5 shrink-0 bg-gray-800 text-gray-200 text-[11px] rounded-lg px-2 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addEvent(); }}
          placeholder="Add event"
          className="min-w-0 flex-1 bg-gray-800 text-gray-200 text-xs rounded-lg px-2 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={addEvent}
          title="Add event"
          aria-label="Add event"
          className="text-blue-300 hover:text-white p-1.5 rounded hover:bg-blue-500/20"
        >
          <Plus size={16} />
        </button>
      </div>
      <p className="text-[11px] text-gray-500">Choose a date and enter a title, then add it to the calendar.</p>
    </div>
  );
};

const ContentEditor: React.FC<ContentEditorProps> = ({ element }) => {
  const { updateElementProps, updateElementName, projectId, getCurrentPage, addElement, selectElement, deleteElement } = useBuilderStore();

  const update = (key: string, value: unknown) => {
    updateElementProps(element.id, { [key]: value });
  };

  const isImage = element.type === 'image';
  const [imageSourceTab, setImageSourceTab] = useState<'url' | 'unsplash' | 'uploads'>('url');
  const effectiveImageTab = useMemo(() => (isImage ? imageSourceTab : 'url'), [isImage, imageSourceTab]);
  const [cmsCollections, setCmsCollections] = useState<Array<{ id: string; name: string; slug?: string; fields: string[] }>>([]);
  const page = getCurrentPage();
  const cmsMapAncestor = useMemo(() => findCmsMapAncestor(page.elements, element.id), [page.elements, element.id]);
  const slider = useMemo(() => element.type === 'slider' ? element : findSliderAncestor(page.elements, element.id), [page.elements, element, element.id]);
  const cmsFieldSource = element.type === 'cmsMap' ? element : cmsMapAncestor;
  const cmsCollectionKey = String(cmsFieldSource?.props.collectionId || cmsFieldSource?.props.collectionSlug || (page.cmsDetail?.enabled ? page.cmsDetail.collectionId : '') || '');
  const isCmsDetailPage = page.cmsDetail?.enabled === true;

  useEffect(() => {
    if (!projectId || (!['table', 'cmsMap'].includes(element.type) && !cmsMapAncestor && !isCmsDetailPage)) {
      setCmsCollections([]);
      return;
    }
    fetch(`/api/cms/${encodeURIComponent(projectId)}`)
      .then(response => response.ok ? response.json() : [])
      .then(data => setCmsCollections(Array.isArray(data) ? data : []))
      .catch(() => setCmsCollections([]));
  }, [element.type, projectId, cmsMapAncestor?.id, isCmsDetailPage, page.cmsDetail?.collectionId]);

  return (
    <div className="p-4 space-y-3">
      <div className="border-b border-gray-800 pb-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Conditional rendering</div>
        <p className="text-[11px] text-gray-500 mb-2">Show this element only when a CMS field matches a rule.</p>
        <select
          value={String(element.props.conditionField || '')}
          onChange={event => update('conditionField', event.target.value)}
          className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
        >
          <option value="">Always show</option>
          {(cmsCollections.find(collection => collection.id === cmsCollectionKey || collection.slug === cmsCollectionKey)?.fields || []).map(field => <option key={field} value={field}>{field}</option>)}
        </select>
        {element.props.conditionField && <>
          <select
            value={String(element.props.conditionOperator || 'exists')}
            onChange={event => update('conditionOperator', event.target.value)}
            className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
          >
            <option value="exists">exists</option>
            <option value="notExists">does not exist</option>
            <option value="equals">equals</option>
            <option value="notEquals">does not equal</option>
            <option value="contains">contains</option>
            <option value="notContains">does not contain</option>
            <option value="greaterThan">is greater than</option>
            <option value="lessThan">is less than</option>
          </select>
          {!['exists', 'notExists'].includes(String(element.props.conditionOperator || 'exists')) && <input
            value={String(element.props.conditionValue || '')}
            onChange={event => update('conditionValue', event.target.value)}
            placeholder="Value"
            className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />}
        </>}
        {!cmsMapAncestor && !isCmsDetailPage && element.type !== 'cmsMap' && <p className="text-[11px] text-amber-300 mt-2">Connect this element to a CMS Map to choose fields.</p>}
      </div>
      {/* Name */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">Element Name</label>
        <input
          type="text"
          value={element.name}
          onChange={e => updateElementName(element.id, e.target.value)}
          className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor={`anchor-id-${element.id}`} className="text-xs text-gray-500 block mb-1">Anchor ID</label>
        <input
          id={`anchor-id-${element.id}`}
          type="text"
          value={String(element.props.anchorId || '')}
          onChange={event => update('anchorId', event.target.value.trim() || undefined)}
          placeholder="section-features"
          className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-[10px] text-gray-600">Link to this section with #section-features.</p>
      </div>

      {element.type === 'tabs' && (
        <div className="space-y-3 border-b border-gray-800 pb-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tabs</p>
            <button
              type="button"
              onClick={() => {
                const count = element.children.filter((child: BuilderElement) => child.type === 'tab').length + 1;
                const tabId = addElement('tab', element.id);
                updateElementProps(tabId, { text: `Tab ${count}` });
                selectElement(tabId);
              }}
              title="Add tab"
              aria-label="Add tab"
              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            ><Plus size={15} /></button>
          </div>
          {element.children.filter((child: BuilderElement) => child.type === 'tab').map((tab: BuilderElement, index: number) => (
            <div key={tab.id} className="flex items-center gap-2">
              <input
                value={String(tab.props.text || '')}
                onChange={event => updateElementProps(tab.id, { text: event.target.value })}
                aria-label={`Tab ${index + 1} label`}
                className="min-w-0 flex-1 rounded-md border border-gray-700 bg-gray-900 px-2.5 py-2 text-xs text-gray-100 outline-none focus:border-sky-400"
              />
              <button
                type="button"
                onClick={() => deleteElement(tab.id)}
                disabled={element.children.filter((child: BuilderElement) => child.type === 'tab').length < 2}
                title="Remove tab"
                aria-label={`Remove tab ${index + 1}`}
                className="rounded p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
              ><Trash2 size={14} /></button>
            </div>
          ))}
          <p className="pt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Tab states</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['activeTabBackgroundColor', 'Active fill'], ['activeTabColor', 'Active text'],
              ['inactiveTabBackgroundColor', 'Inactive fill'], ['inactiveTabColor', 'Inactive text'],
            ] as const).map(([key, label]) => <label key={key} className="min-w-0 text-[10px] text-gray-500">{label}
              <input value={String(element.props[key] || '')} onChange={event => update(key, event.target.value)} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-[11px] text-gray-200 outline-none focus:border-sky-400" />
            </label>)}
          </div>
          <p className="pt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Panel surface</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['panelPadding', 'Padding'], ['panelBorderRadius', 'Radius'], ['panelBackgroundColor', 'Background'], ['panelBorderColor', 'Border color'],
            ] as const).map(([key, label]) => <label key={key} className="min-w-0 text-[10px] text-gray-500">{label}
              <input value={String(element.props[key] || '')} onChange={event => update(key, event.target.value)} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-[11px] text-gray-200 outline-none focus:border-sky-400" />
            </label>)}
          </div>
        </div>
      )}

      {element.type === 'tab' && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Tab label</label>
          <input value={String(element.props.text || '')} onChange={event => update('text', event.target.value)} className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-200 outline-none focus:border-sky-400" />
          <p className="mt-2 text-[11px] text-gray-500">Select this tab to add and style its panel content.</p>
        </div>
      )}

      {slider && (
        <div className="space-y-3 border-b border-gray-800 pb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Slider</p>
          {element.type === 'slider' && <>
            <label className="flex items-center justify-between gap-2 text-xs text-gray-300">
              Autoplay
              <input type="checkbox" checked={element.props.autoplay === true} onChange={event => update('autoplay', event.target.checked)} />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs text-gray-300">
              Loop slides
              <input type="checkbox" checked={element.props.loop !== false} onChange={event => update('loop', event.target.checked)} />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs text-gray-300">
              Show arrows
              <input type="checkbox" checked={element.props.showArrows !== false} onChange={event => update('showArrows', event.target.checked)} />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs text-gray-300">
              Show pagination
              <input type="checkbox" checked={element.props.showPagination !== false} onChange={event => update('showPagination', event.target.checked)} />
            </label>
            <label className="block text-xs text-gray-500">
              Transition
              <select value={String(element.props.transition || 'slide')} onChange={event => update('transition', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200">
                <option value="slide">Slide</option>
                <option value="fade">Fade</option>
              </select>
            </label>
            <label className="block text-xs text-gray-500">
              Transition duration (ms)
              <input type="number" min="0" value={Number(element.props.duration ?? 500)} onChange={event => update('duration', Number(event.target.value))} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200" />
            </label>
            <label className="block text-xs text-gray-500">
              Autoplay interval (ms)
              <input type="number" min="500" value={Number(element.props.interval ?? 5000)} onChange={event => update('interval', Number(event.target.value))} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200" />
            </label>
          </>}
          {!['sliderArrow', 'sliderPagination'].includes(element.type) && <button
            type="button"
            onClick={() => {
              if (!slider) return;
              selectElement(addElement('slide', slider.id));
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:border-blue-400 hover:text-blue-200"
          >
            <Plus size={14} /> Add slide ({slider.children.filter((child: BuilderElement) => child.type === 'slide').length})
          </button>}
          {element.type === 'sliderArrow' && <>
            <label className="block text-xs text-gray-500">
              Direction
              <select value={String(element.props.direction || 'previous')} onChange={event => update('direction', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200">
                <option value="previous">Previous</option>
                <option value="next">Next</option>
              </select>
            </label>
            <label className="block text-xs text-gray-500">
              Accessible label
              <input value={String(element.props.label || '')} onChange={event => update('label', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200" />
            </label>
          </>}
          {element.type === 'sliderPagination' && <>
            <label className="block text-xs text-gray-500">
              Active dot color
              <input type="color" value={String(element.props.activeColor || '#111827')} onChange={event => update('activeColor', event.target.value)} className="mt-1 h-8 w-full rounded border border-gray-700 bg-gray-800 p-1" />
            </label>
            <label className="block text-xs text-gray-500">
              Inactive dot color
              <input type="color" value={String(element.props.inactiveColor || '#94a3b8')} onChange={event => update('inactiveColor', event.target.value)} className="mt-1 h-8 w-full rounded border border-gray-700 bg-gray-800 p-1" />
            </label>
            <label className="block text-xs text-gray-500">
              Dot size
              <input value={String(element.props.dotSize || '10px')} onChange={event => update('dotSize', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200" />
            </label>
            <label className="block text-xs text-gray-500">
              Dot corner radius
              <input value={String(element.props.dotRadius || '999px')} onChange={event => update('dotRadius', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200" />
            </label>
            <label className="block text-xs text-gray-500">
              Dot border color
              <input type="color" value={String(element.props.dotBorderColor || '#94a3b8')} onChange={event => update('dotBorderColor', event.target.value)} className="mt-1 h-8 w-full rounded border border-gray-700 bg-gray-800 p-1" />
            </label>
            <label className="block text-xs text-gray-500">
              Dot border width
              <input value={String(element.props.dotBorderWidth || '0px')} onChange={event => update('dotBorderWidth', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200" />
            </label>
          </>}
        </div>
      )}

      {element.type === 'form' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Success message</label>
            <input
              type="text"
              value={String(element.props.successMessage || '')}
              onChange={event => update('successMessage', event.target.value)}
              placeholder="Thanks! Your message was sent."
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Error message</label>
            <input
              type="text"
              value={String(element.props.errorMessage || '')}
              onChange={event => update('errorMessage', event.target.value)}
              placeholder="Unable to submit form."
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {element.type === 'heading' && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Heading Level</label>
          <select
            value={element.props.level || 1}
            onChange={e => update('level', parseInt(e.target.value))}
            className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>H{n}</option>)}
          </select>
        </div>
      )}

      {(element.type === 'button' || element.type === 'link') && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Link text</label>
          <input
            type="text"
            value={String(element.props.text || '')}
            onChange={e => update('text', e.target.value)}
            placeholder="Link text"
            className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
          />
          <label className="text-xs text-gray-500 block mb-1">Link URL</label>
          <input
            type="text"
            value={element.props.href || ''}
            onChange={e => update('href', e.target.value)}
            placeholder="https://..."
            className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {element.type === 'button' && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Button Icon</label>
          <select
            value={element.props.iconName || ''}
            onChange={e => update('iconName', e.target.value)}
            className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">No icon</option>
            {BUTTON_ICON_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {element.type === 'select' && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Placeholder</label>
          <input
            value={element.props.placeholder}
            onChange={e => update('placeholder', e.target.value.split('\n').map(opt => opt.trim()).filter(opt => opt))}
            placeholder={element.props.placeholder}
            className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg mb-1 px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <label className="text-xs text-gray-500 block mb-1">Options (one per line)</label>
          <textarea
            value={element.props.options?.join('\n') || ''}
            onChange={e => update('options', e.target.value.split('\n').map(opt => opt.trim()).filter(opt => opt))}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
            className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={4}
          />
        </div>
      )}

      {element.type === 'image' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Image URL</label>
            <input
              type="text"
              value={element.props.src || ''}
              onChange={e => update('src', e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setImageSourceTab('url')}
              className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-colors ${effectiveImageTab === 'url'
                ? 'bg-blue-300/10 text-blue-200 border-blue-300/40'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
                }`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setImageSourceTab('unsplash')}
              className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-colors ${effectiveImageTab === 'unsplash'
                ? 'bg-blue-300/10 text-blue-200 border-blue-300/40'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
                }`}
            >
              Unsplash
            </button>
            <button
              type="button"
              onClick={() => setImageSourceTab('uploads')}
              className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-colors ${effectiveImageTab === 'uploads'
                ? 'bg-blue-300/10 text-blue-200 border-blue-300/40'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
                }`}
            >
              My uploads
            </button>
          </div>

          {effectiveImageTab === 'unsplash' && (
            <UnsplashPicker
              onPick={(photo) => {
                update('src', photo.urls.regular);
                if (!element.props.alt) {
                  update('alt', photo.alt_description || photo.description || 'Unsplash photo');
                }
              }}
            />
          )}
          {effectiveImageTab === 'uploads' && (
            <UserImagePicker
              onPick={(url) => {
                update('src', url);
                if (!element.props.alt) update('alt', 'Uploaded image');
              }}
            />
          )}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Alt Text</label>
            <input
              type="text"
              value={element.props.alt || ''}
              onChange={e => update('alt', e.target.value)}
              placeholder="Describe the image..."
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {element.type === 'video' && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Video URL</label>
          <input
            type="text"
            value={element.props.src || ''}
            onChange={e => update('src', e.target.value)}
            placeholder="https://..."
            className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <label className="text-xs text-gray-500 block mt-1">Show Controls</label>
          <input
            type="checkbox"
            checked={element.props.controls || false}
            onChange={e => update('controls', e.target.checked)}
            className="mt-2"
          />
          <label className="text-xs text-gray-500 block mb-1">Autoplay</label>
          <input
            type="checkbox"
            checked={element.props.autoPlay || false}
            onChange={e => update('autoPlay', e.target.checked)}
            className="mt-2"
          />
          <label className="text-xs text-gray-500 block mb-1">Muted</label>
          <input
            type="checkbox"
            checked={element.props.muted || false}
            onChange={e => update('muted', e.target.checked)}
            className="mt-2"
          />
          <label className="text-xs text-gray-500 block mb-1">Loop</label>
          <input
            type="checkbox"
            checked={element.props.loop || false}
            onChange={e => update('loop', e.target.checked)}
            className="mt-2"
          />
        </div>
      )}

      {(element.type === 'input' || element.type === 'textarea') && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Label</label>
            <input
              type="text"
              value={element.props.label || ''}
              onChange={e => update('label', e.target.value)}
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Placeholder</label>
            <input
              type="text"
              value={element.props.placeholder || ''}
              onChange={e => update('placeholder', e.target.value)}
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {element.type === 'input' && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Input Type</label>
              <select
                value={element.props.type || 'text'}
                onChange={e => update('type', e.target.value)}
                className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {['text', 'email', 'password', 'number', 'tel', 'url', 'date', 'search'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {element.type === 'iframe' && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Iframe URL</label>
          <input
            type="text"
            value={element.props.src || ''}
            onChange={e => update('src', e.target.value)}
            placeholder="https://..."
            className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {element.type === 'calendar' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Calendar Title</label>
            <input
              type="text"
              value={String(element.props.title || '')}
              onChange={e => update('title', e.target.value)}
              placeholder="Calendar"
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <CalendarEventEditor
            events={getCalendarEvents(element.props.events)}
            onChange={events => update('events', events)}
          />
        </div>
      )}

      {element.type === 'table' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">CMS Collection</label>
            <select
              value={String(element.props.collectionId || element.props.collectionSlug || '')}
              onChange={event => {
                const collection = cmsCollections.find(item => item.id === event.target.value);
                update('collectionId', event.target.value);
                update('collectionSlug', '');
                update('columns', collection?.fields || []);
              }}
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a collection</option>
              {cmsCollections.map(collection => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Empty message</label>
            <input
              value={String(element.props.emptyMessage || '')}
              onChange={event => update('emptyMessage', event.target.value)}
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {!projectId && <p className="text-[11px] text-amber-300">Save this project before connecting CMS data.</p>}
          {projectId && cmsCollections.length === 0 && <p className="text-[11px] text-gray-500">Create a collection in Project Settings first.</p>}
        </div>
      )}

      {element.type === 'cmsMap' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">CMS Collection</label>
            <select
              value={String(element.props.collectionId || element.props.collectionSlug || '')}
              onChange={event => {
                update('collectionId', event.target.value);
                update('collectionSlug', '');
              }}
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a collection</option>
              {cmsCollections.map(collection => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Empty message</label>
            <input
              value={String(element.props.emptyMessage || '')}
              onChange={event => update('emptyMessage', event.target.value)}
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Filter field</label>
            <select
              value={String(element.props.filterField || '')}
              onChange={event => update('filterField', event.target.value)}
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No filtering</option>
              {(cmsCollections.find(collection => collection.id === String(element.props.collectionId || element.props.collectionSlug))?.fields || []).map(field => <option key={field} value={field}>{field}</option>)}
            </select>
          </div>
          {element.props.filterField && <div>
            <label className="text-xs text-gray-500 block mb-1">Filter placeholder</label>
            <input value={String(element.props.filterPlaceholder || '')} onChange={event => update('filterPlaceholder', event.target.value)} placeholder="Search products..." className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>}
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input type="checkbox" checked={element.props.paginationEnabled === true} onChange={event => update('paginationEnabled', event.target.checked)} /> Enable pagination
          </label>
          {element.props.paginationEnabled === true && <div>
            <label className="text-xs text-gray-500 block mb-1">Records per page</label>
            <input type="number" min={1} max={100} value={Number(element.props.pageSize) || 6} onChange={event => update('pageSize', Math.max(1, Math.min(100, Number(event.target.value) || 1)))} className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>}
          {(element.props.filterField || element.props.paginationEnabled === true) && <div className="border-t border-gray-800 pt-3 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Control styling</div>
            {([
              ['controlsBackground', 'Background', '#ffffff'],
              ['controlsTextColor', 'Text color', '#334155'],
              ['controlsBorderColor', 'Border color', '#d1d5db'],
              ['controlsBorderRadius', 'Radius', '8px'],
              ['controlsPadding', 'Padding', '10px 12px'],
              ['controlsGap', 'Control gap', '12px'],
              ['filterWidth', 'Filter width', '240px'],
            ] as const).map(([key, label, placeholder]) => <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input value={String(element.props[key] || '')} onChange={event => update(key, event.target.value)} placeholder={placeholder} className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>)}
          </div>}
          {!projectId && <p className="text-[11px] text-amber-300">Save this project before connecting CMS data.</p>}
          {projectId && cmsCollections.length === 0 && <p className="text-[11px] text-gray-500">Create a collection in Project Settings first.</p>}
        </div>
      )}

      {(cmsMapAncestor || isCmsDetailPage) && element.type !== 'cmsMap' && (
        <div className="space-y-3 border-t border-gray-800 pt-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">CMS content field</label>
            <select
              value={String(element.props.cmsField || '')}
              onChange={event => update('cmsField', event.target.value)}
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Use static content</option>
              {(cmsCollections.find(collection => collection.id === cmsCollectionKey || collection.slug === cmsCollectionKey)?.fields || []).map(field => <option key={field} value={field}>{field}</option>)}
            </select>
          </div>
          {(element.type === 'image') && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">CMS alt field</label>
              <select
                value={String(element.props.cmsAltField || '')}
                onChange={event => update('cmsAltField', event.target.value)}
                className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Use static alt text</option>
                {(cmsCollections.find(collection => collection.id === cmsCollectionKey || collection.slug === cmsCollectionKey)?.fields || []).map(field => <option key={field} value={field}>{field}</option>)}
              </select>
            </div>
          )}
          {(element.type === 'button' || element.type === 'link') && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">CMS link field</label>
              <select
                value={String(element.props.cmsHrefField || '')}
                onChange={event => update('cmsHrefField', event.target.value)}
                className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Use static link</option>
                {(cmsCollections.find(collection => collection.id === cmsCollectionKey || collection.slug === cmsCollectionKey)?.fields || []).map(field => <option key={field} value={field}>{field}</option>)}
              </select>
            </div>
          )}
          {element.type === 'button' && cmsMapAncestor && (
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input type="checkbox" checked={element.props.shopCheckout === true} onChange={event => update('shopCheckout', event.target.checked)} />
              Use as shop checkout button
            </label>
          )}
        </div>
      )}

      {element.type === 'custom' && (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-500">Runs in an isolated preview frame.</p>
          {([
            ['html', 'HTML', '<div>...</div>'],
            ['css', 'CSS', '.class { color: red; }'],
            ['javascript', 'JavaScript', 'document.querySelector(...)'],
          ] as const).map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <textarea
                value={String(element.props[key] || '')}
                onChange={e => update(key, e.target.value)}
                placeholder={placeholder}
                rows={key === 'html' ? 6 : 5}
                spellCheck={false}
                className="w-full bg-gray-900 text-gray-200 text-xs font-mono rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
              />
            </div>
          ))}
        </div>
      )}

      {element.type === 'icon' && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Icon Name (Lucide)</label>
          <input
            type="text"
            value={element.props.iconName || ''}
            onChange={e => update('iconName', e.target.value)}
            placeholder="Star, Heart, ArrowRight..."
            className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="pt-2 border-t border-gray-800">
        <p className="text-xs text-gray-600">Type: <span className="text-gray-400">{element.type}</span></p>
        <p className="text-xs text-gray-600 mt-0.5">ID: <span className="text-gray-500 font-mono">{element.id}</span></p>
      </div>
    </div>
  );
};

interface SeoEditorProps {
  pageId: string;
}

const SeoEditor: React.FC<SeoEditorProps> = ({ pageId }) => {
  const { pages, projectId, updatePageSeo, updatePageName, updatePagePassword, updatePageCmsDetail } = useBuilderStore();
  const [cmsCollections, setCmsCollections] = useState<Array<{ id: string; name: string; fields: string[] }>>([]);
  const page = pages.find(p => p.id === pageId)!;

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/cms/${encodeURIComponent(projectId)}`)
      .then(response => response.ok ? response.json() : [])
      .then(data => setCmsCollections(Array.isArray(data) ? data : []))
      .catch(() => setCmsCollections([]));
  }, [projectId]);

  const cmsDetail = { enabled: false, collectionId: '', slugField: 'slug', ...page?.cmsDetail };
  const selectedCollection = cmsCollections.find(collection => collection.id === cmsDetail.collectionId);
  if (!page) return null;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 block mb-1.5 font-medium">Page Name</label>
        <input
          type="text"
          value={page.name}
          onChange={e => updatePageName(page.id, e.target.value)}
          className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="text-xs text-gray-400 block mb-1.5 font-medium">Page URL Slug</label>
        <input
          type="text"
          value={page.slug}
          className="w-full bg-gray-800 text-gray-500 text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none cursor-not-allowed"
          readOnly
        />
      </div>

      <div className="border-t border-gray-800 pt-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Page password</p>
            <p className="text-[11px] text-gray-600 mt-1">Visitors must enter this password to view the published page.</p>
          </div>
          <button
            type="button"
            onClick={() => updatePagePassword(page.id, !page.passwordProtected, page.password || '')}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${page.passwordProtected ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-800 text-gray-400'}`}
          >{page.passwordProtected ? 'Enabled' : 'Disabled'}</button>
        </div>
        {page.passwordProtected && <label className="text-xs text-gray-500 block">
          Password
          <input
            type="password"
            value={page.password || ''}
            onChange={event => updatePagePassword(page.id, true, event.target.value)}
            placeholder="Enter page password"
            className="mt-1 w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>}
      </div>

      {page.slug !== '/' && <div className="border-t border-gray-800 pt-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">CMS single post</p>
            <p className="text-[11px] text-gray-600 mt-1">Use this page for URLs like {page.slug}/post-slug.</p>
          </div>
          <button
            type="button"
            onClick={() => updatePageCmsDetail(page.id, { enabled: !cmsDetail.enabled })}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${cmsDetail.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-800 text-gray-400'}`}
          >{cmsDetail.enabled ? 'Enabled' : 'Disabled'}</button>
        </div>
        {cmsDetail.enabled && <div className="space-y-3">
          <label className="text-xs text-gray-500 block">Collection
            <select value={cmsDetail.collectionId} onChange={event => updatePageCmsDetail(page.id, { collectionId: event.target.value, slugField: 'slug' })} className="mt-1 w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700">
              <option value="">Select a collection</option>
              {cmsCollections.map(collection => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-500 block">Record URL field
            <select value={cmsDetail.slugField} onChange={event => updatePageCmsDetail(page.id, { slugField: event.target.value })} disabled={!selectedCollection} className="mt-1 w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 disabled:opacity-50">
              <option value="">Select a field</option>
              {selectedCollection?.fields.map(field => <option key={field} value={field}>{field}</option>)}
            </select>
          </label>
        </div>}
      </div>}

      <div className="border-t border-gray-800 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">SEO</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Title</label>
            <input
              type="text"
              value={page.seo.title}
              onChange={e => updatePageSeo(page.id, { title: e.target.value })}
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Description</label>
            <textarea
              value={page.seo.description}
              onChange={e => updatePageSeo(page.id, { description: e.target.value })}
              rows={3}
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Keywords</label>
            <input
              type="text"
              value={page.seo.keywords}
              onChange={e => updatePageSeo(page.id, { keywords: e.target.value })}
              placeholder="keyword1, keyword2..."
              className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
