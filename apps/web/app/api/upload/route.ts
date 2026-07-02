import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const formData = await request.formData();

  const res = await fetch(`${apiUrl}/upload`, {
    method: 'POST',
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
    body: formData,
  });

  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
