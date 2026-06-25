import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const emailOrUsername = formData.get('emailOrUsername') as string;
    const password = formData.get('password') as string;

    if (!emailOrUsername || !password) {
      return NextResponse.redirect(new URL('/login?error=All+fields+required', request.url));
    }

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
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
