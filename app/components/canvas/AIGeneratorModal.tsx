"use client";

import React, { useState, useRef } from 'react';
import { useAIGeneration } from '../functions/useAIGeneration';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (html: string) => void;
  selectedElementContext?: string;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  selectedElementContext = '',
}) => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
      alert('Please select a valid image file');
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
      context: selectedElementContext,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full border-6 border-slate-500/20 max-h-[90vh] overflow-y-auto">
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
              Tip: Be specific about layout, colors, content, and styling. You can also upload an image to reference.
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Reference Image (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
              {imagePreview ? (
                <div className="space-y-3">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-48 mx-auto rounded object-contain"
                  />
                  <p className="text-sm text-gray-600 truncate">{imageFile?.name}</p>
                  <button
                    onClick={removeImage}
                    disabled={loading}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={loading}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upload Image
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Upload an image for the AI to reference when generating
                  </p>
                </div>
              )}
            </div>
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
            disabled={loading || (!prompt.trim() && !imageFile)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};
