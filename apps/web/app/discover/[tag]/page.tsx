import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const API = process.env.API_URL || 'https://playmorrow-api-aged-mountain-9542.fly.dev/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://playmorrow.vercel.app';

interface GameItem {
  id: string; title: string; slug: string; coverUrl: string | null;
  studio: { name: string } | null;
}

async function getGamesByTag(tag: string) {
  try {
    const res = await fetch(`${API}/games?tag=${encodeURIComponent(tag)}&pageSize=20`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch { return []; }
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const games = await getGamesByTag(tag);
  const label = tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 lg:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${label} Games`,
            description: `Browse indie ${label.toLowerCase()} games on Playmorrow.`,
            url: `${SITE_URL}/discover/${tag}`,
          }),
        }}
      />
      <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">{label} Games</h1>
      <p className="mt-2 font-mono text-sm text-muted-foreground">Discover indie games tagged with {label.toLowerCase()}</p>

      {games.length === 0 ? (
        <p className="mt-8 font-mono text-sm text-muted-foreground">No games found with this tag.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game: GameItem) => (
            <Link key={game.id} href={`/games/${game.slug}`}
              className="group clip-corner border border-border/40 bg-[#050b0f]/50 overflow-hidden transition hover:border-cyan/30">
              <div className="aspect-[3/4] bg-border/10 flex items-center justify-center">
                {game.coverUrl
                  ? <img src={game.coverUrl} alt={game.title} className="size-full object-cover" />
                  : <div className="size-8 text-muted-foreground/30" />}
              </div>
              <div className="p-3">
                <p className="truncate font-mono text-xs font-semibold uppercase tracking-wider text-foreground group-hover:text-cyan">{game.title}</p>
                <p className="mt-1 truncate font-mono text-[0.55rem] text-muted-foreground/60">{game.studio?.name}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link href="/discover" className="inline-flex items-center gap-2 font-mono text-sm text-cyan hover:text-white">
          Back to Discover <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
