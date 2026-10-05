import { NextResponse } from 'next/server';
import { auth } from '@/app/auth/auth';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { getRootDomain } from '@/app/lib/tenant';
import { canUseCustomDomainsForRole } from '@/app/lib/projectLimits';

export const runtime = 'nodejs';

type DomainChallenge = {
  domain: string;
  type: string;
  value: string;
  reason?: string;
};

type VercelDomain = {
  name?: string;
  verified?: boolean;
  verification?: DomainChallenge[];
  error?: { message?: string } | string;
  message?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getProjectId = async (context: { params: Promise<{ projectId: string }> }) => {
  const { projectId } = await context.params;
  return projectId;
};

async function authorizeProject(projectId: string, canManage: boolean) {
  const session = await auth();
  const userId = session?.user?.id?.trim();
  if (!userId || !UUID_PATTERN.test(userId)) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const [{ data: user }, { data: project }] = await Promise.all([
    supabaseServer.schema('next_auth').from('users').select('role').eq('id', userId).maybeSingle(),
    supabaseServer.from('projects').select('id, user_id').eq('id', projectId).maybeSingle(),
  ]);
  if (!project) return { error: NextResponse.json({ error: 'Project not found.' }, { status: 404 }) };

  const role = String(user?.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'owner' && project.user_id !== userId) {
    const { data: membership } = await supabaseServer
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!membership) return { error: NextResponse.json({ error: 'Project not found.' }, { status: 404 }) };
    if (canManage && membership.role === 'viewer') {
      return { error: NextResponse.json({ error: 'This project is read-only for you.' }, { status: 403 }) };
    }
  }

  if (!canUseCustomDomainsForRole(role)) {
    return { error: NextResponse.json({ error: 'Custom domains are available on the Pro plan and above.' }, { status: 403 }) };
  }

  return { userId };
}

function getVercelConfig() {
  const token = process.env.LUNIO_VERCEL_TOKEN;
  const projectId = process.env.LUNIO_VERCEL_PROJECT_ID;
  const teamId = process.env.LUNIO_VERCEL_TEAM_ID;
  if (!token || !projectId) return null;

  const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
  return {
    token,
    url: `https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/domains`,
    query,
  };
}

async function requestVercel(url: string, token: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await response.json().catch(() => null) as VercelDomain | null;
  if (!response.ok) {
    const message = typeof data?.error === 'string'
      ? data.error
      : data?.error?.message || data?.message || 'Vercel could not update this domain.';
    return { error: message, status: response.status };
  }
  return { data: data || {} };
}

function normalizeDomain(value: unknown) {
  if (typeof value !== 'string') return null;
  const domain = value.trim().toLowerCase().replace(/\.$/, '');
  if (domain.length > 253 || domain.includes('://') || !domain.includes('.')) return null;
  if (!domain.split('.').every(label =>
    label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
  )) return null;

  const rootDomain = getRootDomain().toLowerCase().replace(/^https?:\/\//, '').split(':')[0].replace(/\.$/, '');
  if (domain === rootDomain || domain.endsWith(`.${rootDomain}`)) return null;
  return domain;
}

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const projectId = await getProjectId(context);
  const access = await authorizeProject(projectId, false);
  if ('error' in access) return access.error;

  const { data, error } = await supabaseServer
    .from('project_domains')
    .select('id, domain, verified, verification, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ domains: data || [], configured: Boolean(getVercelConfig()) });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const projectId = await getProjectId(context);
  const access = await authorizeProject(projectId, true);
  if ('error' in access) return access.error;

  const config = getVercelConfig();
  if (!config) {
    return NextResponse.json({ error: 'Custom domains are not configured for this LUNIO deployment.' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const domain = normalizeDomain(body?.domain);
  if (!domain) return NextResponse.json({ error: 'Enter a valid domain name that is not a LUNIO subdomain.' }, { status: 400 });

  const { data: existing } = await supabaseServer
    .from('project_domains')
    .select('id')
    .eq('domain', domain)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: 'This domain is already connected to a LUNIO site.' }, { status: 409 });

  const added = await requestVercel(`${config.url}${config.query}`, config.token, 'POST', { name: domain });
  if ('error' in added) return NextResponse.json({ error: added.error }, { status: added.status });

  const vercelDomain = added.data as VercelDomain;
  const { data, error } = await supabaseServer
    .from('project_domains')
    .insert({
      project_id: projectId,
      domain,
      verified: Boolean(vercelDomain.verified),
      verification: vercelDomain.verification || [],
    })
    .select('id, domain, verified, verification, created_at')
    .single();

  if (error) {
    await requestVercel(`${config.url}/${encodeURIComponent(domain)}${config.query}`, config.token, 'DELETE');
    if (error.code === '23505') return NextResponse.json({ error: 'This domain is already connected to a LUNIO site.' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ domain: data }, { status: 201 });
}

export async function PATCH(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const projectId = await getProjectId(context);
  const access = await authorizeProject(projectId, true);
  if ('error' in access) return access.error;

  const config = getVercelConfig();
  if (!config) return NextResponse.json({ error: 'Custom domains are not configured for this LUNIO deployment.' }, { status: 503 });
  const body = await request.json().catch(() => null);
  const domainId = typeof body?.domainId === 'string' ? body.domainId : '';
  const { data: existing, error: lookupError } = await supabaseServer
    .from('project_domains')
    .select('id, domain, verification')
    .eq('id', domainId)
    .eq('project_id', projectId)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Domain not found.' }, { status: 404 });

  const verified = await requestVercel(
    `${config.url}/${encodeURIComponent(existing.domain)}/verify${config.query}`.replace('/v10/', '/v9/'),
    config.token,
    'POST',
  );
  if ('error' in verified) return NextResponse.json({ error: verified.error }, { status: verified.status });

  const vercelDomain = verified.data as VercelDomain;
  const { data, error } = await supabaseServer
    .from('project_domains')
    .update({ verified: Boolean(vercelDomain.verified), verification: vercelDomain.verification || existing.verification, updated_at: new Date().toISOString() })
    .eq('id', domainId)
    .select('id, domain, verified, verification, created_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ domain: data });
}

export async function DELETE(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const projectId = await getProjectId(context);
  const access = await authorizeProject(projectId, true);
  if ('error' in access) return access.error;

  const config = getVercelConfig();
  if (!config) return NextResponse.json({ error: 'Custom domains are not configured for this LUNIO deployment.' }, { status: 503 });
  const body = await request.json().catch(() => null);
  const domainId = typeof body?.domainId === 'string' ? body.domainId : '';
  const { data: existing, error: lookupError } = await supabaseServer
    .from('project_domains')
    .select('id, domain')
    .eq('id', domainId)
    .eq('project_id', projectId)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Domain not found.' }, { status: 404 });

  const removed = await requestVercel(`${config.url}/${encodeURIComponent(existing.domain)}${config.query}`, config.token, 'DELETE');
  if ('error' in removed && removed.status !== 404) {
    return NextResponse.json({ error: removed.error }, { status: removed.status });
  }

  const { error } = await supabaseServer.from('project_domains').delete().eq('id', domainId).eq('project_id', projectId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}