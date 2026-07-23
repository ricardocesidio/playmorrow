import type { Metadata } from 'next';

const API = process.env.API_URL || 'https://playmorrow-api-production.up.railway.app/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://playmorrow.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API}/games/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Game Not Found · Playmorrow' };
    const game = await res.json();
    const ogImage = game.coverUrl || '/og-image.svg';
    return {
      title: `${game.title} · Playmorrow`,
      description: game.tagline || game.description?.slice(0, 160) || `Discover ${game.title} on Playmorrow`,
      openGraph: {
        title: game.title,
        description: game.tagline || game.description?.slice(0, 160),
        images: [ogImage],
      },
    };
  } catch {
    return { title: 'Game · Playmorrow' };
  }
}

export default async function GameLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let game: { title: string; slug: string; tagline: string | null; description: string | null; coverUrl: string | null } | null = null;
  try {
    const res = await fetch(`${API}/games/${slug}`, { next: { revalidate: 3600 } });
    if (res.ok) game = await res.json();
  } catch {
    // swallow — JSON-LD just won't render
  }

  return (
    <>
      {game && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'VideoGame',
              name: game.title,
              description: game.tagline || game.description?.slice(0, 200) || '',
              image: game.coverUrl || `${SITE_URL}/og-image.svg`,
              url: `${SITE_URL}/games/${game.slug}`,
            }),
          }}
        />
      )}
      {children}
    </>
  );
}
