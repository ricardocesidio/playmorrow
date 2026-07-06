'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const emailOrUsername = formData.get('emailOrUsername') as string;
  const password = formData.get('password') as string;

  if (!emailOrUsername || !password) {
    redirect('/login?error=All+fields+required');
  }

  const API = process.env.API_URL || 'https://playmorrow-api-production.up.railway.app/api';
  const res = await fetch(`${API}/auth/session/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Invalid email/username or password' }));
    if (body.code === 'EMAIL_NOT_VERIFIED' && body.email) {
      redirect(`/verify-email?email=${encodeURIComponent(body.email)}&from=login`);
    }
    redirect(`/login?error=${encodeURIComponent(body.message || 'Invalid email/username or password')}`);
  }

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const match = setCookie.match(/^([^=]+)=([^;]+)/);
    const name = match?.[1];
    const value = match?.[2];
    if (name && value) {
      const cookieStore = await cookies();
      cookieStore.set(name, value, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
    }
  }

  redirect('/games');
}
