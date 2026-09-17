import { auth } from "./app/auth/auth";
import { NextResponse } from "next/server";
import { getSiteSlugFromHost } from "./app/lib/tenant";
 
export const proxy = auth((req) => {
  const siteSlug = getSiteSlugFromHost(
    req.headers.get('x-forwarded-host') || req.headers.get('host')
  );
  const isInternalPath = req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.startsWith('/api');

  if (siteSlug && !isInternalPath) {
    const rewrittenUrl = req.nextUrl.clone();
    rewrittenUrl.pathname = `/tenant/${siteSlug}${req.nextUrl.pathname}`;
    return NextResponse.rewrite(rewrittenUrl);
  }

})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};