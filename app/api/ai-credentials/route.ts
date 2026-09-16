import { NextResponse } from 'next/server';
import { auth } from '../../auth/auth';
import { supabaseServer } from '../../lib/supabaseServer';
import { AIProvider, decryptApiKey, encryptApiKey, maskApiKey } from '../../lib/aiCredentials';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const providers: AIProvider[] = ['gemini-3.6-flash', 'gemini-pro', 'openai', 'claude'];

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
  return NextResponse.json((data || []).map(item => ({ provider: item.provider, apiKey: maskApiKey(decryptApiKey(item.encrypted_api_key)), updatedAt: item.updated_at })));
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json() as { provider?: AIProvider; apiKey?: string };
  if (!body.provider || !providers.includes(body.provider)) return NextResponse.json({ error: 'Choose Gemini, OpenAI, or Claude.' }, { status: 400 });
  const apiKey = String(body.apiKey || '').trim();
  if (!apiKey) {
    const { error } = await supabaseServer.from('account_ai_credentials').delete().eq('user_id', userId).eq('provider', body.provider);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ provider: body.provider, removed: true });
  }
  const { data, error } = await supabaseServer.from('account_ai_credentials').upsert({ user_id: userId, provider: body.provider, encrypted_api_key: encryptApiKey(apiKey), updated_at: new Date().toISOString() }).select('provider, updated_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ provider: data.provider, updatedAt: data.updated_at, apiKey: maskApiKey(apiKey) });
}