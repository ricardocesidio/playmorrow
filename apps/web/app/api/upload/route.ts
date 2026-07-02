import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const sessionCookie = allCookies.find(c => c.name === 'playmorrow_session');
  const cookieStr = sessionCookie ? `playmorrow_session=${sessionCookie.value}` : '';

  if (!cookieStr) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ message: 'No file provided' }, { status: 400 });
  }

  const apiForm = new FormData();
  apiForm.append('file', file, file.name);

  const res = await fetch('http://localhost:4000/api/upload', {
    method: 'POST',
    headers: { Cookie: cookieStr },
    body: apiForm,
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}