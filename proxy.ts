import { auth } from "./app/auth/auth";
import { NextResponse } from "next/server";
import { getRootDomain, getSiteSlugFromHost } from "./app/lib/tenant";
import { supabaseServer } from "./app/lib/supabaseServer";
 
export const proxy = auth(async (req) => {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  let siteSlug = getSiteSlugFromHost(host);
  const isInternalPath = req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.startsWith('/api');

  if (!siteSlug && !isInternalPath && host) {
    const hostname = host.split(':')[0].toLowerCase().replace(/\.$/, '');
    const rootDomain = getRootDomain().toLowerCase().replace(/^https?:\/\//, '').split(':')[0].replace(/\.$/, '');
    const isFirstPartyHost = hostname === rootDomain || hostname.endsWith(`.${rootDomain}`) || hostname === 'localhost' || hostname.endsWith('.localhost');

    if (!isFirstPartyHost) {
      const { data: domain } = await supabaseServer
        .from('project_domains')
        .select('project_id')
        .eq('domain', hostname)
        .eq('verified', true)
        .maybeSingle();
      if (domain) {
        const { data: project } = await supabaseServer
          .from('projects')
          .select('site_slug')
          .eq('id', domain.project_id)
          .eq('status', 'published')
          .maybeSingle();
        siteSlug = project?.site_slug || null;
      }
    }
  }

  if (siteSlug && !isInternalPath) {
    const rewrittenUrl = req.nextUrl.clone();
    rewrittenUrl.pathname = `/tenant/${siteSlug}${req.nextUrl.pathname}`;
    return NextResponse.rewrite(rewrittenUrl);
  }

})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};