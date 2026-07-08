'use server';

import { revalidatePath } from 'next/cache';

export async function revalidateFeed() {
  revalidatePath('/feed');
}

export async function revalidateGame(slug: string) {
  revalidatePath(`/games/${slug}`);
}

export async function revalidateDevlog(id: string) {
  revalidatePath(`/devlogs/${id}`);
}

export async function revalidateHomepage() {
  revalidatePath('/');
}
