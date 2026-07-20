import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const emailOrUsername = formData.get('emailOrUsername') as string;
  const password = formData.get('password') as string;

  if (!emailOrUsername || !password) {
    return NextResponse.redirect(new URL('/login?error=All+fields+required', request.url));
  }

  const isDev = process.env.NODE_ENV === 'development';
  const defaultApi = isDev ? 'http://localhost:4000/api' : 'https://playmorrow-api-production.up.railway.app/api';
  const API = process.env.API_URL || defaultApi;

  try {
    const res = await fetch(`${API}/auth/session/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password }),
    });

    const body = await res.json().catch(() => ({ message: 'Invalid email/username or password' }));

    if (!res.ok) {
      if (body.code === 'EMAIL_NOT_VERIFIED' && body.email) {
        return NextResponse.redirect(new URL(`/verify-email?email=${encodeURIComponent(body.email)}&from=login`, request.url));
      }
      const msg = encodeURIComponent(body.message || 'Invalid email/username or password');
      return NextResponse.redirect(new URL(`/login?error=${msg}`, request.url));
    }

    const response = NextResponse.redirect(new URL('/dashboard', request.url));

    // Forward session cookie from backend using Next's cookie setter (more reliable for attributes/domain/sameSite in prod)
    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie') as string] : []);
    for (const cookieStr of setCookies) {
      if (!cookieStr) continue;
      // Parse "name=value; Path=...; ..."
      const parts = cookieStr.split(';').map(s => s.trim());
      const nameValue = parts[0];
      if (!nameValue) continue;
      const eqIdx = nameValue.indexOf('=');
      if (eqIdx === -1) continue;
      const name = nameValue.slice(0, eqIdx);
      const value = nameValue.slice(eqIdx + 1);
      const options: Record<string, string | number | boolean | Date> = { path: '/' };
      for (let i = 1; i < parts.length; i++) {
        const attr = parts[i];
        if (!attr) continue;
        const [kRaw, ...vParts] = attr.split('=');
        const k = kRaw?.trim();
        if (!k) continue;
        const v = vParts.join('=').trim();
        const key = k.toLowerCase();
        if (key === 'path') options.path = v || '/';
        else if (key === 'expires') options.expires = new Date(v);
        else if (key === 'max-age') options.maxAge = parseInt(v, 10);
        else if (key === 'domain') options.domain = v;
        else if (key === 'samesite') options.sameSite = v.toLowerCase() as 'lax' | 'strict' | 'none';
        else if (key === 'secure') options.secure = true;
        else if (key === 'httponly') options.httpOnly = true;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response.cookies.set(name, value, options as any);
    }

    // Set CSRF token as a non-httpOnly cookie so the frontend can read it
    if (body.csrfToken) {
      response.cookies.set('playmorrow_csrf', body.csrfToken, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24,
      });
    }

    return response;
  } catch (err) {
    // Backend unreachable (ECONNREFUSED), misconfigured API_URL, or network error → friendly error instead of 500 crash
    console.error('Form login proxy error (backend down or unreachable):', err);
    return NextResponse.redirect(new URL('/login?error=Unable+to+reach+login+service.+Is+the+backend+running%3F', request.url));
  }
}
