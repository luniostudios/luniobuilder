import { useState, useCallback } from 'react';

interface GenerateOptions {
  prompt: string;
  context?: string;
  elementType?: string;
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

        const data: GenerationResult = await response.json();

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
