import { NextResponse } from 'next/server';
import { auth } from '../../auth/auth';
import { supabaseServer } from '../../lib/supabaseServer';
import { AIProvider, decryptApiKey, encryptApiKey, maskApiKey } from '../../lib/aiCredentials';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const providers: AIProvider[] = ['gemini-3.6-flash', 'gemini-pro', 'openai-gpt-6-astra', 'openai-gpt-6.1-sol', 'openai-gpt-6-luna', 'claude-fable', 'claude-4.6-sonnet', 'claude-4.6-opus', 'claude-4.5-haiku', 'openrouter'];
const getCredentialProvider = (provider: AIProvider) => provider === 'openrouter'
  ? 'openrouter'
  : provider.startsWith('gemini-')
    ? 'gemini'
    : provider.startsWith('openai-')
      ? 'openai'
      : 'claude';
const displayProviders: Record<string, AIProvider> = {
  gemini: 'gemini-3.6-flash',
  openai: 'openai-gpt-6-astra',
  claude: 'claude-4.6-sonnet',
  openrouter: 'openrouter',
};

const getUserId = async () => {
  const session = await auth();
  const userId = session?.user?.id?.trim();
  return userId && UUID_PATTERN.test(userId) ? userId : null;
};

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseServer.from('account_ai_credentials').select('provider, encrypted_api_key, updated_at').eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data || []).map(item => ({ provider: displayProviders[item.provider] || item.provider, apiKey: maskApiKey(decryptApiKey(item.encrypted_api_key)), updatedAt: item.updated_at })));
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json() as { provider?: AIProvider; apiKey?: string };
  if (!body.provider || !providers.includes(body.provider)) return NextResponse.json({ error: 'Choose a supported AI provider.' }, { status: 400 });
  const credentialProvider = getCredentialProvider(body.provider);
  const apiKey = String(body.apiKey || '').trim();
  if (!apiKey) {
    const { error } = await supabaseServer.from('account_ai_credentials').delete().eq('user_id', userId).eq('provider', credentialProvider);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ provider: body.provider, removed: true });
  }
  const { data, error } = await supabaseServer.from('account_ai_credentials').upsert({ user_id: userId, provider: credentialProvider, encrypted_api_key: encryptApiKey(apiKey), updated_at: new Date().toISOString() }).select('provider, updated_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ provider: data.provider, updatedAt: data.updated_at, apiKey: maskApiKey(apiKey) });
}