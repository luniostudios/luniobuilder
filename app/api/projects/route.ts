import { NextResponse } from 'next/server';
import { auth } from '../../auth/auth';
import { supabaseServer } from '../../lib/supabaseServer';
import { normalizeSiteSlug } from '../../lib/tenant';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id || session.user.email;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // fetch user role to determine admin rights
  const { data: userRecord, error: userRecordError } = await supabaseServer
    .schema('next_auth')
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userRecordError) {
    return NextResponse.json({ error: userRecordError.message }, { status: 500 });
  }

  const role = (userRecord?.role || '').toString().toLowerCase();

  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  if (projectId) {
    let query = supabaseServer
      .from('projects')
      .select('id, user_id, title, slug, site_slug, content, created_at, updated_at, vercel_token, vercelUrl, status, socialOg')
      .eq('id', projectId);

    // allow admins/owners to fetch any project
    if (role !== 'admin' && role !== 'owner') {
      query = (query as any).eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  // list projects: admins see all projects
  let listQuery = supabaseServer
    .from('projects')
    .select('id, user_id, title, slug, site_slug, content, created_at, updated_at, vercel_token, vercelUrl, status, socialOg')
    .order('updated_at', { ascending: false });

  if (role !== 'admin' && role !== 'owner') {
    listQuery = (listQuery as any).eq('user_id', userId);
  }

  const { data, error } = await listQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

const getProjectLimitForRole = (role?: string) => {
  if (!role) return 3;

  switch (role.toLowerCase()) {
    case 'admin':
    case 'owner':
      return null;
    case 'pro':
    case 'premium':
    case 'team':
      return 20;
    case 'business':
      return 50;
    case 'free':
    case 'basic':
    default:
      return 3;
  }
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id || session.user.email;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: user, error: userError } = await supabaseServer
    .schema('next_auth')
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  const projectLimit = getProjectLimitForRole(user?.role);
  if (projectLimit !== null) {
    const { count, error: countError } = await supabaseServer
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (typeof count === 'number' && count >= projectLimit) {
      return NextResponse.json(
        { error: `Project limit reached for ${user?.role || 'your'} role.`, limit: projectLimit },
        { status: 403 }
      );
    }
  }

  const body = await request.json();
  const title = body.title || 'Untitled Project';
  const slug = body.slug || `/project-${Date.now()}`;
  const siteSlug = normalizeSiteSlug(body.siteSlug || title);
  const content = body.content || { pages: [], currentPageId: '' };

  if (!siteSlug) {
    return NextResponse.json({ error: 'A valid site subdomain is required.' }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from('projects')
    .insert({ user_id: userId, title, slug, site_slug: siteSlug, content })
    .select('id, user_id, title, slug, site_slug, content, created_at, updated_at, vercel_token, vercelUrl, status, socialOg')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id || session.user.email;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // fetch role to allow admins to update any project
  const { data: userRec, error: userRecError } = await supabaseServer
    .schema('next_auth')
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userRecError) {
    return NextResponse.json({ error: userRecError.message }, { status: 500 });
  }

  const userRole = (userRec?.role || '').toString().toLowerCase();

  const body = await request.json();
  const projectId = body.projectId;
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.title !== undefined) {
    updates.title = body.title || 'Untitled Project';
  }

  if (body.slug !== undefined) {
    updates.slug = body.slug || `/project-${Date.now()}`;
  }

  if (body.siteSlug !== undefined) {
    const siteSlug = normalizeSiteSlug(body.siteSlug);
    if (!siteSlug) {
      return NextResponse.json({ error: 'A valid site subdomain is required.' }, { status: 400 });
    }
    updates.site_slug = siteSlug;
  }

  if (body.content !== undefined) {
    updates.content = body.content;
  }

  if (body.vercel_token !== undefined) {
    updates.vercel_token = body.vercel_token;
  }

  if (body.status !== undefined) {
    if (body.status !== 'draft' && body.status !== 'published') {
      return NextResponse.json({ error: 'Invalid project status.' }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No project fields provided to update' }, { status: 400 });
  }

  let updateQuery = supabaseServer
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select('id, user_id, title, slug, site_slug, content, created_at, updated_at, vercel_token, vercelUrl, status, socialOg');

  if (userRole !== 'admin' && userRole !== 'owner') {
    updateQuery = (updateQuery as any).eq('user_id', userId);
  }

  const { data, error } = await (updateQuery as any).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id || session.user.email;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // fetch role to allow admins to delete any project
  const { data: userRec2, error: userRec2Error } = await supabaseServer
    .schema('next_auth')
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userRec2Error) {
    return NextResponse.json({ error: userRec2Error.message }, { status: 500 });
  }

  const userRole2 = (userRec2?.role || '').toString().toLowerCase();

  const body = await request.json();
  const projectId = body.projectId;
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  let deleteQuery = supabaseServer
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (userRole2 !== 'admin' && userRole2 !== 'owner') {
    deleteQuery = (deleteQuery as any).eq('user_id', userId);
  }

  const { error } = await deleteQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
