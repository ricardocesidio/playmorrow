'use server';

import { redirect } from 'next/navigation';

export async function testLogin(formData: FormData) {
  redirect('/games');
}
