import { NextResponse } from 'next/server';
import { auth } from '../../../auth/auth';
import { supabaseServer } from '../../../lib/supabaseServer';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getUserId = (session: { user?: { id?: string | null } | null }) => {
  const userId = session.user?.id?.trim();
  return userId && UUID_PATTERN.test(userId) ? userId : null;
};

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  const { data: userRecord } = await supabaseServer
    .schema('next_auth')
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  const role = String(userRecord?.role || '').toLowerCase();
  const isAdminOrOwner = role === 'admin' || role === 'owner';

  const { data: project, error: projectError } = isAdminOrOwner
    ? await supabaseServer.from('projects').select('user_id').eq('id', projectId).maybeSingle()
    : await supabaseServer.from('projects').select('user_id').eq('id', projectId).eq('user_id', userId).maybeSingle();
  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  if (!project && !isAdminOrOwner) {
    return NextResponse.json({ error: 'Project access denied' }, { status: 403 });
  }

  if (!project && isAdminOrOwner) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const { data, error } = await supabaseServer
    .from('form_submissions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
