import { auth } from "./auth/auth";
import { NextResponse } from "next/server";
import { getSiteSlugFromHost } from "./lib/tenant";
 
export const proxy = auth((req) => {
  const siteSlug = getSiteSlugFromHost(req.headers.get('host'));
  const isInternalPath = req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.startsWith('/api');

  if (siteSlug && !isInternalPath) {
    const rewrittenUrl = req.nextUrl.clone();
    rewrittenUrl.pathname = `/tenant/${siteSlug}${req.nextUrl.pathname}`;
    return NextResponse.rewrite(rewrittenUrl);
  }

  if (!req.auth && req.nextUrl.pathname !== "/editor") {
    const newUrl = new URL("/editor", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};