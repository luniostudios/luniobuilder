"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Redo2 } from 'lucide-react';
import ColorPicker from 'react-best-gradient-color-picker';
import { useBuilderStore } from '../../stores/builderStore';
import { StyleProperties } from '../../types/builder';
import { getEffectiveStyles } from '../../utils/builderUtils';

type BuilderElement = any;

export const RightPanel: React.FC = () => {
  const { selectedElementId, rightPanelTab, setRightPanelTab, getElementById, breakpoint, getCurrentPage } = useBuilderStore() as any;
  const element = selectedElementId ? getElementById(selectedElementId) : null;
  const page = getCurrentPage();

  return (
    <div className="w-64 bg-[#111114] max-md:hidden border-l border-gray-800 flex flex-col h-full">
      {element ? (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {(['style', 'content', 'css'] as const).map(tab => (
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
            {rightPanelTab === 'css' && <CSSEditor element={element} breakpoint={breakpoint} />}
          </div>
        </>
      ) : (
        <>
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setRightPanelTab('seo')}
              className="flex-1 py-3 text-xs font-medium text-white border-b-2 border-blue-300 bg-blue-300/5"
            >
              Page Settings
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <SeoEditor pageId={page.id} />
          </div>
        </>
      )}
    </div>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-800/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
      >
        {title}
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
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
    <div className="flex w-full items-center gap-2 mb-2">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      {options ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-gray-800 text-gray-200 text-xs rounded-md px-2 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">—</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <>
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || '—'}
            className="flex-1 bg-gray-800 text-gray-200 text-xs rounded-md px-2 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
          />
          {unit && <span className="text-xs text-gray-600">{unit}</span>}
        </>
      )}
    </div>
  );
};

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 w-10 flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5">
        <input
          type="color"
          value={value || '#000000'}
          onChange={e => onChange(e.target.value)}
          className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="—"
          className="flex-1 bg-transparent text-gray-200 text-xs focus:outline-none min-w-0"
        />
      </div>
    </div>
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
        <Redo2 size={14} className="text-gray-600 hover:text-gray-400 cursor-pointer" onClick={() => onChange('')} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-gray-800 text-gray-200 text-xs rounded-md px-2 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
        />
        <div
          className="h-9 min-w-18 rounded-md border border-gray-700"
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
        <Redo2 size={14} className="text-gray-600 hover:text-gray-400 cursor-pointer" onClick={handleReset} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={isCssGradient(currentValue) ? currentValue : (colorValue || '')}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Color (#fff) or gradient (linear-gradient...)"
          className="flex-1 bg-gray-800 text-gray-200 text-xs rounded-md px-2 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
        />
        <div
          className="h-9 min-w-18 rounded-md border border-gray-700"
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
          <ColorPicker value={currentValue} onChange={handleChange} hidePresets={true} />
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
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500">{label}</span>
        <button
          onClick={() => setLinked(!linked)}
          className={`text-xs px-1.5 py-0.5 rounded ${linked ? 'bg-blue-600/30 text-blue-400' : 'text-gray-600 hover:text-gray-400'}`}
        >
          {linked ? '⛓️' : '⛓️'}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {(['top', 'right', 'bottom', 'left'] as const).map(side => (
          <div key={side} className="flex flex-col items-center gap-0.5">
            <input
              type="text"
              value={values[side]}
              onChange={e => handleChange(side, e.target.value)}
              placeholder="0"
              className="w-full bg-gray-800 text-gray-200 text-xs text-center rounded px-1 py-1 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600">{side[0].toUpperCase()}</span>
          </div>
        ))}
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

const StyleEditor: React.FC<StyleEditorProps> = ({ element, breakpoint }) => {
  const { updateElementStyles, updateElementPseudoClassStyles, pseudoClassState, setPseudoClassState } = useBuilderStore() as any;
  
  // Get styles based on current pseudo-class state
  let styles: any;
  if (pseudoClassState === 'base') {
    styles = getEffectiveStyles(element, breakpoint as 'widescreen' | 'desktop' | 'tablet' | 'mobile');
  } else {
    // Get pseudo-class specific styles
    const pseudoStyles = element.pseudoClassStyles?.[pseudoClassState as 'hover' | 'active' | 'focus'] as any;
    styles = pseudoStyles?.[breakpoint as 'widescreen' | 'desktop' | 'tablet' | 'mobile'] || {};
  }

  const isTextElement = ['heading', 'paragraph', 'button', 'link', 'listItem'].includes(element.type);
  const isImageElement = element.type === 'image';
  const [backgroundImageTab, setBackgroundImageTab] = useState<'value' | 'unsplash'>('value');
  const [textClipImageTab, setTextClipImageTab] = useState<'value' | 'unsplash'>('value');

  const update = (key: keyof StyleProperties, value: string) => {
    if (pseudoClassState === 'base') {
      updateElementStyles(element.id, { [key]: value });
    } else {
      updateElementPseudoClassStyles(element.id, pseudoClassState as 'hover' | 'active' | 'focus', breakpoint as 'widescreen' | 'desktop' | 'tablet' | 'mobile', { [key]: value });
    }
  };

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

  return (
    <div className='flex flex-col'>
      {/* Pseudo-class State Selector */}
      <div className="px-4 py-3 border-b border-gray-800 flex gap-1">
        {(['base', 'hover', 'active', 'focus'] as const).map(state => (
          <button
            key={state}
            onClick={() => setPseudoClassState(state)}
            className={`flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-colors ${
              pseudoClassState === state
                ? 'bg-blue-600/40 text-blue-200 border border-blue-400/50'
                : 'bg-gray-900 text-gray-400 border border-gray-700 hover:text-gray-200'
            }`}
          >
            {state === 'base' ? 'Default' : state.charAt(0).toUpperCase() + state.slice(1)}
          </button>
        ))}
      </div>
      {/* Layout */}
      <Section title="Layout">
        <InputRow
          label="Display"
          value={styles.display || ''}
          onChange={v => update('display', v)}
          options={['block', 'flex', 'grid', 'inline', 'inline-flex', 'none']}
        />
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
      <Section title="Typography">
        <InputRow
          label="Font"
          value={styles.fontFamily || ''}
          onChange={v => update('fontFamily', v)}
          options={['inherit', 'Inter, sans-serif', 'Georgia, serif', 'monospace', 'cursive', 'Roboto, sans-serif']}
        />
        <InputRow label="Size" value={styles.fontSize || ''} onChange={v => update('fontSize', v)} placeholder="16px" />
        <InputRow
          label="Weight"
          value={styles.fontWeight || ''}
          onChange={v => update('fontWeight', v)}
          options={['300', '400', '500', '600', '700', '800', '900']}
        />
        <InputRow label="Line H" value={styles.lineHeight || ''} onChange={v => update('lineHeight', v)} placeholder="1.5" />
        <InputRow label="Spacing" value={styles.letterSpacing || ''} onChange={v => update('letterSpacing', v)} placeholder="0em" />
        <InputRow
          label="Align"
          value={styles.textAlign || ''}
          onChange={v => update('textAlign', v)}
          options={['left', 'center', 'right', 'justify']}
        />
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
            </div>

            {textClipImageTab === 'unsplash' && (
              <UnsplashPicker
                onPick={(photo) => {
                  update('textClipImage', toCssBackgroundImageValue(photo.urls.regular));
                }}
              />
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

      {/* Background */}
      <Section title="Background">
        <BackgroundFillInput
          label="Fill"
          colorValue={styles.backgroundColor || ''}
          gradientValue={styles.backgroundGradient || ''}
          onChangeColor={(v) => update('backgroundColor', v)}
          onChangeGradient={(v) => update('backgroundGradient', v)}
        />
        <InputRow
          label="Image"
          value={extractUrlFromCssBackgroundImage(styles.backgroundImage)}
          onChange={v => update('backgroundImage', toCssBackgroundImageValue(v))}
          placeholder="https://..."
        />

        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setBackgroundImageTab('value')}
            className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-colors ${backgroundImageTab === 'value'
              ? 'bg-blue-300/10 text-blue-200 border-blue-300/40'
              : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
              }`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setBackgroundImageTab('unsplash')}
            className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-colors ${backgroundImageTab === 'unsplash'
              ? 'bg-blue-300/10 text-blue-200 border-blue-300/40'
              : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
              }`}
          >
            Unsplash
          </button>
        </div>

        {backgroundImageTab === 'unsplash' && (
          <UnsplashPicker
            onPick={(photo) => {
              update('backgroundImage', toCssBackgroundImageValue(photo.urls.regular));
            }}
          />
        )}
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
        <InputRow label="Width" value={styles.borderWidth || ''} onChange={v => update('borderWidth', v)} placeholder="1px" />
        <InputRow
          label="Style"
          value={styles.borderStyle || ''}
          onChange={v => update('borderStyle', v)}
          options={['none', 'solid', 'dashed', 'dotted', 'double']}
        />
        <ColorInput label="Color" value={styles.borderColor || ''} onChange={v => update('borderColor', v)} />
        <InputRow label="Radius" value={styles.borderRadius || ''} onChange={v => update('borderRadius', v)} placeholder="8px" />
      </Section>

      {/* Effects */}
      <Section title="Effects" defaultOpen={false}>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Shadow</span>
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'None', value: 'none' },
                { label: 'Soft', value: '0px 4px 12px rgba(0,0,0,0.12)' },
                { label: 'Medium', value: '0px 8px 20px rgba(0,0,0,0.16)' },
                { label: 'Strong', value: '0px 12px 28px rgba(0,0,0,0.2)' },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => update('boxShadow', preset.value)}
                  className="text-[11px] px-2 py-1 rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
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
        <InputRow label="z-index" value={styles.zIndex || ''} onChange={v => update('zIndex', v)} placeholder="auto" />
        <InputRow label="Transition" value={styles.transition || ''} onChange={v => update('transition', v)} placeholder="all 0.2s ease" />
      </Section>
    </div>
  );
};

const toKebabCase = (key: string) => key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
const toCamelCase = (key: string) => key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

interface CSSRow {
  id: string;
  property: string;
  value: string;
  enabled: boolean;
}

const createEmptyRow = (): CSSRow => ({
  id: `${Date.now()}-${Math.random()}`,
  property: '',
  value: '',
  enabled: true,
});

const buildStyleRows = (styles: StyleProperties): CSSRow[] =>
  Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => ({
      id: `${key}-${Math.random()}`,
      property: toKebabCase(key),
      value: String(value),
      enabled: true,
    }));

const CSSEditor: React.FC<StyleEditorProps> = ({ element, breakpoint }) => {
  const { updateElementStyles } = useBuilderStore();
  const [rows, setRows] = useState<CSSRow[]>([]);

  const currentStyles = element.styles?.[breakpoint] || {};

  React.useEffect(() => {
    setRows([...buildStyleRows(currentStyles), createEmptyRow()]);
  }, [element.id, breakpoint, currentStyles]);

  const handleToggle = (id: string) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, enabled: !row.enabled } : row));
  };

  const handleChange = (id: string, field: 'property' | 'value', value: string) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleDeleteRow = (id: string) => {
    setRows(prev => prev.filter(row => row.id !== id));
  };

  const handleAddRow = () => {
    setRows(prev => [...prev, createEmptyRow()]);
  };

  const handleSave = () => {
    const enabledStyles = rows.reduce((acc, row) => {
      const property = row.property.trim();
      const value = row.value.trim();
      if (row.enabled && property && value) {
        acc[toCamelCase(property) as keyof StyleProperties] = value;
      }
      return acc;
    }, {} as Partial<StyleProperties>);

    const clearedStyles = Object.keys(currentStyles).reduce((acc, key) => {
      const kebab = toKebabCase(key);
      const matchingRow = rows.find(row => row.property.trim() === kebab);
      if (!matchingRow || !matchingRow.enabled || !matchingRow.value.trim()) {
        acc[key as keyof StyleProperties] = undefined;
      }
      return acc;
    }, {} as Partial<StyleProperties>);

    updateElementStyles(element.id, { ...clearedStyles, ...enabledStyles });
  };

  const handleReset = () => {
    setRows([...buildStyleRows(currentStyles), createEmptyRow()]);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">CSS Editor</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs px-3 py-1.5 rounded bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="text-xs px-3 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-400"
          >
            Save
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex flex-row items-center gap-2 px-2 text-[11px] text-gray-400 uppercase tracking-wider">
          <span />
          <span>Property</span>
          <span>Value</span>
          <span />
        </div>
        {rows.map(row => (
          <div
            key={row.id}
            className={`grid grid-cols-[40%_40%_20%] items-center gap-2 px-2 rounded-md border border-gray-800 ${row.enabled ? 'bg-gray-900' : 'bg-gray-950/50 opacity-70'}`}
          >
            <input
              type="text"
              value={row.property}
              onChange={e => handleChange(row.id, 'property', e.target.value)}
              placeholder="property"
              className="w-full bg-transparent text-gray-100 text-xs rounded px-2 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={row.value}
              onChange={e => handleChange(row.id, 'value', e.target.value)}
              placeholder="value"
              className="w-full bg-transparent text-gray-100 text-xs rounded px-2 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => handleDeleteRow(row.id)}
              className="text-gray-400 hover:text-red-400"
              title="Delete declaration"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddRow}
        className="w-full text-left text-xs font-medium uppercase tracking-wide text-blue-300 hover:text-white px-3 py-2 rounded bg-gray-800 border border-gray-700"
      >
        + Add property
      </button>

      <div className="text-[11px] text-gray-500">
        Use kebab-case property names. If a change is not seen then the property is written wrong.
      </div>
    </div>
  );
};

interface ContentEditorProps {
  element: BuilderElement;
}

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

const ContentEditor: React.FC<ContentEditorProps> = ({ element }) => {
  const { updateElementProps, updateElementName } = useBuilderStore();

  const update = (key: string, value: unknown) => {
    updateElementProps(element.id, { [key]: value });
  };

  const isImage = element.type === 'image';
  const [imageSourceTab, setImageSourceTab] = useState<'url' | 'unsplash'>('url');
  const effectiveImageTab = useMemo(() => (isImage ? imageSourceTab : 'url'), [isImage, imageSourceTab]);

  return (
    <div className="p-4 space-y-3">
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

      {/* Text content */}
      {(element.type === 'heading' || element.type === 'paragraph' || element.type === 'button' || element.type === 'link' || element.type === 'listItem') && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Text</label>
          <textarea
            value={element.props.text || ''}
            onChange={e => update('text', e.target.value)}
            rows={3}
            className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>
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
            checked={element.props.autoplay || false}
            onChange={e => update('autoplay', e.target.checked)}
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
  const { pages, updatePageSeo, updatePageName } = useBuilderStore();
  const page = pages.find(p => p.id === pageId)!;
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
