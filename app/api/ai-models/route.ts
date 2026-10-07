import { NextResponse } from 'next/server';

interface OpenRouterModel {
  id: string;
  name: string;
  context_length?: number;
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
    modality?: string;
  };
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

export async function GET() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      return NextResponse.json({ error: 'Unable to load the model catalog.' }, { status: 502 });
    }

    const result = await response.json() as { data?: OpenRouterModel[] };
    const models = (result.data || [])
      .filter(model => model.id && model.name)
      .filter(model => {
        const inputs = model.architecture?.input_modalities;
        const outputs = model.architecture?.output_modalities;
        const hasTextInput = inputs ? inputs.includes('text') : model.architecture?.modality?.includes('text');
        const hasTextOutput = outputs ? outputs.includes('text') : model.architecture?.modality?.endsWith('->text');
        return hasTextInput && hasTextOutput;
      })
      .map(model => ({
        id: model.id,
        name: model.name,
        contextLength: model.context_length,
        free: model.pricing?.prompt !== undefined
          && model.pricing.completion !== undefined
          && Number(model.pricing.prompt) === 0
          && Number(model.pricing.completion) === 0,
      }))
      .sort((first, second) => first.name.localeCompare(second.name));

    return NextResponse.json(models);
  } catch {
    return NextResponse.json({ error: 'Unable to load the model catalog.' }, { status: 502 });
  }
}