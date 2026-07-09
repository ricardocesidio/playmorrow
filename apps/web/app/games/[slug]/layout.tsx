import type { Metadata } from 'next';

const API = process.env.API_URL || 'https://playmorrow-api-production.up.railway.app/api';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API}/games/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Game Not Found · Playmorrow' };
    const game = await res.json();
    return {
      title: `${game.title} · Playmorrow`,
      description: game.tagline || game.description?.slice(0, 160) || `Discover ${game.title} on Playmorrow`,
      openGraph: {
        title: game.title,
        description: game.tagline || game.description?.slice(0, 160),
        images: game.coverUrl ? [game.coverUrl] : [],
      },
    };
  } catch {
    return { title: 'Game · Playmorrow' };
  }
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
