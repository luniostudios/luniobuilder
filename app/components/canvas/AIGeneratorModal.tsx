"use client";

import React, { useState, useRef } from 'react';
import { useAIGeneration } from '../functions/useAIGeneration';
import type { AIProvider } from '../../types/ai';
import type { BuilderElement } from '../../types/builder';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AIGeneratorModalProps {
  isOpen: boolean;
  projectId?: string | null;
  editElement?: BuilderElement | null;
  onClose: () => void;
  onGenerate: (html: string) => void;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  projectId,
  editElement,
  onClose,
  onGenerate,
}) => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [invalidImage, setInvalidImage] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('gemini-3.6-flash');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generate, loading, error, clearError } = useAIGeneration();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      clearError();
    } else {
      setInvalidImage(true);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageFile) {
      clearError();
      return;
    }

    let imageData: string | undefined;
    let imageMimeType: string | undefined;

    // Convert image to base64 if selected
    if (imageFile) {
      imageData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve((e.target?.result as string).split(',')[1]); // Get base64 part
        };
        reader.readAsDataURL(imageFile);
      });
      imageMimeType = imageFile.type;
    }

    const result = await generate({
      prompt: prompt.trim(),
      provider,
      projectId,
      context: editElement ? JSON.stringify({ type: editElement.type, name: editElement.name, props: editElement.props, styles: editElement.styles, children: editElement.children }, null, 2) : undefined,
      imageData,
      imageMimeType,
    });

    if (result.success && result.html) {
      onGenerate(result.html);
      setPrompt('');
      removeImage();
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto border-6 border-slate-500/20 p-0" onKeyDown={handleKeyDown}>
        {/* Header */}
          <DialogHeader className="border-gray-200 p-6">
            <DialogTitle className="text-center text-2xl font-bold">{editElement ? 'Edit with AI' : 'Generate with AI'}</DialogTitle>
            <DialogDescription className="mt-1 text-center">
              {editElement ? `Describe how you want to change this ${editElement.type}.` : "Describe what you want to create and we'll generate it for you"}
            </DialogDescription>
          </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {editElement ? 'How should AI edit this element?' : 'What would you like to create?'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                clearError();
              }}
              onKeyDown={handleKeyDown}
              placeholder={editElement ? 'E.g., Make the heading more concise and change the accent color to green' : 'E.g., A modern hero section with a gradient background and call-to-action button'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              Tip: Be specific about layout, colors, content, and styling. You can also upload an image to reference.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="ai-provider">AI provider</label>
            <select id="ai-provider" value={provider} onChange={event => setProvider(event.target.value as AIProvider)} disabled={loading} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
              <option value="gemini-3.6-flash">Google Gemini 3.6 Flash</option>
              <option value="gemini-pro">Google Gemini Pro</option>
              <option value="openai">OpenAI</option>
              <option value="claude">Anthropic Claude</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <span className="font-semibold">Error: </span>
                {error}
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={clearError}
                className="mt-2 h-auto p-0 text-xs font-medium text-red-600 hover:text-red-700"
              >
                Dismiss
              </Button>
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
          <DialogFooter className="border-t border-gray-200 bg-gray-50 p-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={loading || (!prompt.trim() && !imageFile)}
            className="bg-blue-600 px-6 text-white hover:bg-blue-700"
          >
            {loading ? 'Generating...' : editElement ? 'Apply edit' : 'Generate'}
          </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={invalidImage} onOpenChange={setInvalidImage}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invalid image</DialogTitle>
            <DialogDescription>Please select a valid image file.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setInvalidImage(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
