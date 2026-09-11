import { Liveblocks } from '@liveblocks/node';
import { NextResponse } from 'next/server';
import { auth } from '../../auth/auth';
import { supabaseServer } from '../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

const liveblocksSecret = process.env.LIVEBLOCKS_SECRET_KEY;
if (!liveblocksSecret) {
  throw new Error('Missing LIVEBLOCKS_SECRET_KEY environment variable');
}

const liveblocks = new Liveblocks({
  secret: liveblocksSecret,
});

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id || session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const room = typeof body.room === 'string' ? body.room : '';
  const projectId = room.startsWith('project:') ? room.slice('project:'.length) : '';

  if (!projectId) {
    return NextResponse.json({ error: 'Invalid collaboration room' }, { status: 400 });
  }

  const { data: userRecord, error: userError } = await supabaseServer
    .schema('next_auth')
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userError) {
    return NextResponse.json({ error: 'Unable to verify account' }, { status: 500 });
  }

  const role = (userRecord?.role || '').toString().toLowerCase();
  let projectQuery = supabaseServer
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId);

  if (role !== 'admin' && role !== 'owner') {
    projectQuery = projectQuery.eq('user_id', userId);
  }

  const { data: project, error: projectError } = await projectQuery.single();
  let memberRole: 'editor' | 'viewer' = 'editor';
  if ((projectError || !project) && role !== 'admin' && role !== 'owner') {
    const { data: membership } = await supabaseServer
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Project access denied' }, { status: 403 });
    }
    memberRole = membership.role === 'viewer' ? 'viewer' : 'editor';
  } else if (projectError || !project) {
    return NextResponse.json({ error: 'Project access denied' }, { status: 403 });
  }

  const liveblocksSession = liveblocks.prepareSession(String(userId), {
    userInfo: {
      name: session.user?.name || session.user?.email || 'Collaborator',
      avatar: session.user?.image || undefined,
    },
  });
  liveblocksSession.allow(room, [memberRole === 'viewer' ? '*:read' : '*:write']);

  const { body: token, status } = await liveblocksSession.authorize();
  return new Response(token, { status });
}
