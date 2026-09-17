import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for api, _next/static, _next/image, and favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Define your root domain
  const rootDomain = 'luniobuilder.com';

  // Extract the subdomain (e.g., "tenant1" from "tenant1.yourdomain.com")
  const currentHost = hostname.replace(`.${rootDomain}`, '');

  // Case 1: Core App / Marketing Website (e.g., yourdomain.com)
  if (hostname === rootDomain || hostname === 'localhost:3000') {
    return NextResponse.next();
  }

  // Case 2: Subdomain or Custom Domain Tenancy
  // Rewrites the request to an internal dynamic folder: /app/site/[domain]/...
  return NextResponse.rewrite(new URL(`/site/${currentHost}${url.pathname}`, req.url));
}
