import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const body = await request.arrayBuffer();

  try {
    const res = await fetch(`${apiUrl}/upload`, {
      method: 'POST',
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        'Content-Type': request.headers.get('content-type') || 'application/octet-stream',
      },
      body: Buffer.from(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 });
  }
}
