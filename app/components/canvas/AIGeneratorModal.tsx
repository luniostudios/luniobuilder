"use client";

import React, { useState } from 'react';
import { useAIGeneration } from '../functions/useAIGeneration';
import { ElementType } from '../../types/builder';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (html: string, elementType: string) => void;
  elementType?: ElementType;
  selectedElementContext?: string;
}

const elementTypeDescriptions: Record<ElementType, string> = {
  section: 'Full section with padding and background',
  div: 'Generic container',
  heading: 'Page heading',
  paragraph: 'Text content',
  button: 'Call-to-action button',
  image: 'Image with styling',
  link: 'Hyperlink',
  navbar: 'Navigation bar',
  hero: 'Hero banner section',
  card: 'Card component',
  grid: 'Grid layout',
  columns: 'Multi-column layout',
  form: 'Form with inputs',
  input: 'Input field',
  textarea: 'Textarea field',
  video: 'Video embed',
  divider: 'Visual separator',
  spacer: 'Spacing element',
  icon: 'Icon or SVG',
  list: 'Unordered/ordered list',
  listItem: 'List item',
  iframe: 'Embedded iframe',
};

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  elementType = 'section',
  selectedElementContext = '',
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState<ElementType>(elementType);
  const { generate, loading, error, clearError } = useAIGeneration();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      clearError();
      return;
    }

    const result = await generate({
      prompt: prompt.trim(),
      context: selectedElementContext,
      elementType: selectedType,
    });

    if (result.success && result.html) {
      onGenerate(result.html, selectedType);
      setPrompt('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !loading) {
      handleGenerate();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full border-8 border-slate-500/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className=" border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Generate with AI</h2>
          <p className="text-gray-600 text-sm mt-1 text-center">
            Describe what you want to create and we'll generate it for you
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              What would you like to create?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                clearError();
              }}
              onKeyDown={handleKeyDown}
              placeholder="E.g., A modern hero section with a gradient background and call-to-action button"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              Tip: Be specific about layout, colors, content, and styling
            </p>
          </div>

          {/* Element Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Element Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ElementType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              {Object.entries(elementTypeDescriptions).map(([type, description]) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} - {description}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <span className="font-semibold">Error: </span>
                {error}
              </p>
              <button
                onClick={clearError}
                className="text-xs text-red-600 hover:text-red-700 font-medium mt-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" />
                <p className="text-sm text-blue-800">
                  Generating your content with AI...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex gap-3 justify-end bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};
