import { NextResponse } from 'next/server';
import { auth } from '../../../auth/auth';
import { supabaseServer } from '../../../lib/supabaseServer';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getUserId = (session: { user?: { id?: string | null } | null }) => {
  const userId = session.user?.id?.trim();
  return userId && UUID_PATTERN.test(userId) ? userId : null;
};

const getProjectAccess = async (projectId: string, userId: string, write = false) => {
  const { data: user } = await supabaseServer.schema('next_auth').from('users').select('role').eq('id', userId).single();
  const role = String(user?.role || '').toLowerCase();
  if (role === 'admin' || role === 'owner') return true;

  const { data: project } = await supabaseServer.from('projects').select('user_id').eq('id', projectId).maybeSingle();
  if (project?.user_id === userId) return true;

  const { data: membership } = await supabaseServer
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(membership && (!write || membership.role !== 'viewer'));
};

const authenticate = async (projectId: string, write = false) => {
  const session = await auth();
  if (!session?.user) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const userId = getUserId(session);
  if (!userId || !(await getProjectAccess(projectId, userId, write))) {
    return { response: NextResponse.json({ error: 'Project access denied' }, { status: 403 }) };
  }
  return { userId };
};

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { data: project } = await supabaseServer
    .from('projects')
    .select('id, status')
    .eq('id', projectId)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  if (project.status !== 'published') {
    const authResult = await authenticate(projectId);
    if ('response' in authResult) return authResult.response;
  }

  const { data: collections, error } = await supabaseServer
    .from('cms_collections')
    .select('id, project_id, name, slug, fields, created_at, updated_at, cms_records(id, collection_id, data, created_at, updated_at)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((collections || []).map(collection => ({
    ...collection,
    records: collection.cms_records || [],
    cms_records: undefined,
  })));
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const authResult = await authenticate(projectId, true);
  if ('response' in authResult) return authResult.response;
  const body = await request.json();

  if (body.type === 'record') {
    const { data: collection } = await supabaseServer.from('cms_collections').select('id').eq('id', body.collectionId).eq('project_id', projectId).single();
    if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    const { data, error } = await supabaseServer.from('cms_records').insert({ collection_id: body.collectionId, data: body.data || {} }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const name = String(body.name || '').trim();
  const slug = slugify(String(body.slug || name));
  const fields = Array.isArray(body.fields) ? body.fields.filter((field: unknown): field is string => typeof field === 'string' && Boolean(field.trim())).map((field: string) => field.trim()) : [];
  if (!name || !slug) return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
  const { data, error } = await supabaseServer.from('cms_collections').insert({ project_id: projectId, name, slug, fields }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, records: [] });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const authResult = await authenticate(projectId, true);
  if ('response' in authResult) return authResult.response;
  const body = await request.json();

  if (body.type === 'record') {
    const { data: collection } = await supabaseServer.from('cms_collections').select('id').eq('id', body.collectionId).eq('project_id', projectId).single();
    if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    const { data, error } = await supabaseServer.from('cms_records').update({ data: body.data || {}, updated_at: new Date().toISOString() }).eq('id', body.id).eq('collection_id', body.collectionId).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const fields = Array.isArray(body.fields) ? body.fields.filter((field: unknown): field is string => typeof field === 'string' && Boolean(field.trim())).map((field: string) => field.trim()) : undefined;
  const updates = { ...(body.name !== undefined ? { name: String(body.name).trim() } : {}), ...(fields ? { fields } : {}), updated_at: new Date().toISOString() };
  const { data, error } = await supabaseServer.from('cms_collections').update(updates).eq('id', body.id).eq('project_id', projectId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const authResult = await authenticate(projectId, true);
  if ('response' in authResult) return authResult.response;
  const body = await request.json();
  const table = body.type === 'record' ? 'cms_records' : 'cms_collections';
  if (body.type === 'record') {
    const { data: record } = await supabaseServer
      .from('cms_records')
      .select('id, cms_collections!inner(project_id)')
      .eq('id', body.id)
      .eq('cms_collections.project_id', projectId)
      .maybeSingle();
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }
  let query = supabaseServer.from(table).delete().eq('id', body.id);
  if (body.type !== 'record') query = query.eq('project_id', projectId) as typeof query;
  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}