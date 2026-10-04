import { useState, useCallback } from 'react';
import type { AIProvider } from '../../types/ai';

interface GenerateOptions {
  prompt: string;
  provider?: AIProvider;
  projectId?: string | null;
  context?: string;
  imageData?: string; // Base64 encoded image
  imageMimeType?: string; // e.g., "image/png", "image/jpeg"
  imageReferences?: Array<{ data: string; mimeType: string }>;
}

interface GenerationResult {
  html: string;
  success: boolean;
  error?: string;
}

export const useAIGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (options: GenerateOptions): Promise<GenerationResult> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        });

        const responseText = await response.text();
        let data: GenerationResult;
        try {
          data = JSON.parse(responseText) as GenerationResult;
        } catch {
          const isHtml = response.headers.get('content-type')?.includes('text/html') || /^\s*<!doctype html|^\s*<html/i.test(responseText);
          const errorMessage = isHtml
            ? `The generation endpoint returned an HTML page (HTTP ${response.status}). The API route may be unavailable or a server/proxy error occurred.`
            : `The generation endpoint returned an invalid response (HTTP ${response.status}).`;
          throw new Error(errorMessage);
        }

        if (!response.ok || !data.success) {
          const errorMessage = data.error || 'Failed to generate content';
          setError(errorMessage);
          return {
            html: '',
            success: false,
            error: errorMessage,
          };
        }

        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        return {
          html: '',
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generate,
    loading,
    error,
    clearError,
  };
};
