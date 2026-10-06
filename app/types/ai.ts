export type AIProvider = 
'gemini-3.6-flash' | 
'gemini-pro' | 
'openai-gpt-6-astra' | 
'openai-gpt-6.1-sol' | 
'openai-gpt-6-luna' | 
'claude-fable' | 
'claude-4.6-sonnet' | 
'claude-4.6-opus' |
'claude-4.5-haiku';

export interface ImageReference {
  file: File;
  preview: string;
}