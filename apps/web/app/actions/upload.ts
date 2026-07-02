'use server';

import { cookies } from 'next/headers';

export async function uploadScreenshot(formData: FormData) {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

    const res = await fetch(`${url}/upload`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
      body: formData,
      signal: AbortSignal.timeout(15000),
    });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<{ url: string; filename: string; size: number }>;
}
