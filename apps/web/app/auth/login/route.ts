import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let emailOrUsername: string;
    let password: string;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      emailOrUsername = params.get('emailOrUsername') ?? '';
      password = params.get('password') ?? '';
    } else {
      const formData = await request.formData();
      emailOrUsername = formData.get('emailOrUsername') as string;
      password = formData.get('password') as string;
    }

    if (!emailOrUsername || !password) {
      return NextResponse.redirect(new URL('/login?error=All+fields+required', request.url));
    }

    // Server-side API URL — separate from NEXT_PUBLIC_ (which may be /api for client-side proxy)
    const API = process.env.API_URL || 'https://playmorrow-api-production.up.railway.app/api';
    const res = await fetch(`${API}/auth/session/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: 'Invalid email/username or password' }));
      // If email not verified, redirect to verify page
      if (body.code === 'EMAIL_NOT_VERIFIED' && body.email) {
        return NextResponse.redirect(new URL(`/verify-email?email=${encodeURIComponent(body.email)}&from=login`, request.url));
      }
      const msg = encodeURIComponent(body.message || 'Invalid email/username or password');
      return NextResponse.redirect(new URL(`/login?error=${msg}`, request.url));
    }

    const setCookie = res.headers.get('set-cookie');
    const response = NextResponse.redirect(new URL('/games', request.url));

    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL('/login?error=Connection+error', request.url));
  }
}
