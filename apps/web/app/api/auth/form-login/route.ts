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

  const setCookie = res.headers.get('set-cookie');
  const response = NextResponse.redirect(new URL('/games', request.url));
  if (setCookie) response.headers.set('set-cookie', setCookie);

  // Set CSRF token as a non-httpOnly cookie so the frontend can read it
  if (body.csrfToken) {
    response.cookies.set('playmorrow_csrf', body.csrfToken, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return response;
}
