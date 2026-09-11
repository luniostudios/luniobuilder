import { NextResponse } from 'next/server';
import { auth } from '../../auth/auth';
import { supabaseServer } from '../../lib/supabaseServer';

type UserRecord = { id: string; email: string | null; name: string | null };

async function getCurrentUser() {
  const session = await auth();
  const userId = session?.user?.id || session?.user?.email;
  if (!userId) return null;

  const { data, error } = await supabaseServer
    .schema('next_auth')
    .from('users')
    .select('id, email, name, role')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return { session, user: data as UserRecord & { role?: string } };
}

async function canManageProject(projectId: string, userId: string, role?: string) {
  if (role === 'admin' || role === 'owner') return true;
  const { data } = await supabaseServer
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data);
}

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('project_invitations')
    .select('id, project_id, invited_email, invited_by, status, created_at, projects(id, title)')
    .eq('invited_user_id', current.user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!projectId || !email) {
    return NextResponse.json({ error: 'Project and user email are required.' }, { status: 400 });
  }

  if (!(await canManageProject(projectId, current.user.id, current.user.role?.toLowerCase()))) {
    return NextResponse.json({ error: 'Only the project owner can invite collaborators.' }, { status: 403 });
  }

  const { data: invitedUser, error: invitedUserError } = await supabaseServer
    .schema('next_auth')
    .from('users')
    .select('id, email, name')
    .eq('email', email)
    .maybeSingle();

  if (invitedUserError || !invitedUser) {
    return NextResponse.json({ error: 'No registered user was found with that email.' }, { status: 404 });
  }

  if (invitedUser.id === current.user.id) {
    return NextResponse.json({ error: 'You already own this project.' }, { status: 400 });
  }

  const { data: member } = await supabaseServer
    .from('project_members')
    .select('project_id')
    .eq('project_id', projectId)
    .eq('user_id', invitedUser.id)
    .maybeSingle();

  if (member) return NextResponse.json({ error: 'This user already has access.' }, { status: 409 });

  const { data: invitation, error } = await supabaseServer
    .from('project_invitations')
    .insert({
      project_id: projectId,
      invited_user_id: invitedUser.id,
      invited_email: email,
      invited_by: current.user.id,
      status: 'pending',
    })
    .select('id, project_id, invited_email, status, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This user already has a pending invitation.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(invitation, { status: 201 });
}

export async function PATCH(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const invitationId = typeof body.invitationId === 'string' ? body.invitationId : '';
  const action = body.action === 'accept' || body.action === 'decline' ? body.action : '';

  if (!invitationId || !action) {
    return NextResponse.json({ error: 'Invitation and action are required.' }, { status: 400 });
  }

  const { data: invitation, error: invitationError } = await supabaseServer
    .from('project_invitations')
    .select('id, project_id, invited_user_id, status')
    .eq('id', invitationId)
    .eq('invited_user_id', current.user.id)
    .eq('status', 'pending')
    .single();

  if (invitationError || !invitation) {
    return NextResponse.json({ error: 'Invitation not found or already handled.' }, { status: 404 });
  }

  if (action === 'accept') {
    const { error: memberError } = await supabaseServer
      .from('project_members')
      .upsert({ project_id: invitation.project_id, user_id: current.user.id, role: 'editor' }, { onConflict: 'project_id,user_id' });

    if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const { data: updated, error: updateError } = await supabaseServer
    .from('project_invitations')
    .update({ status: action === 'accept' ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
    .eq('id', invitationId)
    .select('id, project_id, status')
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json(updated);
}
