import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function generateNonce(): string {
  // CSP nonce — doesn't need cryptographic strength, just per-request uniqueness.
  // Math.random is available everywhere including Edge Runtime and is sufficient.
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  // Generate a CSP nonce per-request. Next.js automatically adds this nonce
  // to its inline scripts (__NEXT_F__, __NEXT_DATA__) when x-nonce header is set.
  // See https://nextjs.org/docs/app/api-reference/config/next-config-js#contentsecuritypolicy
  const nonce = generateNonce();
  response.headers.set('x-nonce', nonce);

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

  // Nonce-based CSP — removes 'unsafe-inline' for scripts.
  // 'unsafe-inline' retained for style-src: Tailwind injects inline styles
  // at build time and there's no nonce mechanism for <style> tags in Next.js.
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
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