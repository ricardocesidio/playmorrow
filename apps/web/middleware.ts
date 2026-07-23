import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  // HSTS — tell browsers to always use HTTPS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Reduce referrer leakage
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Basic CSP — restricts resources to trusted origins.
  // NOTE: 'unsafe-inline' is required by Next.js hydration scripts and Tailwind.
  //       A nonce-based approach would be more secure but needs framework support.
  //       See https://nextjs.org/docs/app/api-reference/config/next-config-js#contentsecuritypolicy
  //       for nonce-based CSP with Next.js.
  //       Update the connect-src when adding new external API dependencies.
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: http://localhost:*",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://playmorrow-api-production.up.railway.app http://localhost:*",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  );

  return response;
}

// Apply to all routes except static files and internal Next.js paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};