import type { MetadataRoute } from 'next';

const API_BASE = 'http://localhost:4000/api';

async function fetchGames(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/games`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data ?? [];
  } catch {
    return [];
  }
}

async function fetchStudios(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/studios`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://playmorrow.vercel.app';

  const [games, studios] = await Promise.all([fetchGames(), fetchStudios()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/games`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/studios`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/feed`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/forgot-password`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
    { url: `${base}/welcome`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
    { url: `${base}/cookies`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
    { url: `${base}/community-guidelines`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
  ];

  const gamePages: MetadataRoute.Sitemap = games.map((game) => ({
    url: `${base}/games/${game.slug}`,
    lastModified: new Date(game.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const studioPages: MetadataRoute.Sitemap = studios.map((studio) => ({
    url: `${base}/studios/${studio.slug}`,
    lastModified: new Date(studio.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...gamePages, ...studioPages];
}
