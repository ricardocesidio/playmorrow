import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const emailOrUsername = formData.get('emailOrUsername') as string;
    const password = formData.get('password') as string;

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const res = await fetch(`${API}/auth/session/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password }),
    });

    // Forward the session cookie from the API response
    const setCookie = res.headers.get('set-cookie');
    const response = NextResponse.redirect(new URL('/games', request.url));

    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL('/login?error=1', request.url));
  }
}
