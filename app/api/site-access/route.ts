import { NextResponse } from 'next/server';
import { supabaseServer } from '../../lib/supabaseServer';
import { siteAccessCookieName } from '../../lib/siteAccess';

type AccessRequest = {
  projectId?: string;
  pageId?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as AccessRequest;
  const projectId = String(body.projectId || '').trim();
  const pageId = String(body.pageId || '').trim();
  const password = String(body.password || '');

  if (!projectId || !pageId || !password) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
  }

  const { data: project, error } = await supabaseServer
    .from('projects')
    .select('content, status')
    .eq('id', projectId)
    .eq('status', 'published')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const pages = (project?.content as { pages?: Array<{ id?: string; passwordProtected?: boolean; password?: string }> } | null)?.pages || [];
  const page = pages.find(candidate => candidate.id === pageId);
  if (!page?.passwordProtected || page.password !== password) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(siteAccessCookieName(projectId, pageId), 'granted', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return response;
}
