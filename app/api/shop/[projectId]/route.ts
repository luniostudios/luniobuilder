import { NextResponse } from 'next/server';
import { auth } from '../../../auth/auth';
import { supabaseServer } from '../../../lib/supabaseServer';
import { ShopProvider } from '../../../types/shop';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getUserId = (session: { user?: { id?: string | null } | null }) => {
  const userId = session.user?.id?.trim();
  return userId && UUID_PATTERN.test(userId) ? userId : null;
};

const canWriteProject = async (projectId: string, userId: string) => {
  const { data: user } = await supabaseServer.schema('next_auth').from('users').select('role').eq('id', userId).single();
  if (['admin', 'owner'].includes(String(user?.role || '').toLowerCase())) return true;
  const { data: project } = await supabaseServer.from('projects').select('user_id').eq('id', projectId).maybeSingle();
  if (project?.user_id === userId) return true;
  const { data: membership } = await supabaseServer.from('project_members').select('role').eq('project_id', projectId).eq('user_id', userId).maybeSingle();
  return Boolean(membership && membership.role !== 'viewer');
};

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { data } = await supabaseServer.from('shop_settings').select('*').eq('project_id', projectId).maybeSingle();
  return NextResponse.json(data || { project_id: projectId, provider: 'stripe', currency: 'usd', enabled: false });
}

export async function PUT(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await auth();
  const userId = session?.user ? getUserId(session) : null;
  if (!userId || !(await canWriteProject(projectId, userId))) return NextResponse.json({ error: 'Project access denied' }, { status: 403 });
  const body = await request.json();
  const provider: ShopProvider = ['stripe', 'paypal', 'external'].includes(body.provider) ? body.provider : 'stripe';
  const currency = String(body.currency || 'usd').toLowerCase().slice(0, 3);
  if (!/^[a-z]{3}$/.test(currency)) return NextResponse.json({ error: 'Currency must be a three-letter code.' }, { status: 400 });
  const { data, error } = await supabaseServer.from('shop_settings').upsert({ project_id: projectId, provider, currency, enabled: Boolean(body.enabled), updated_at: new Date().toISOString() }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}