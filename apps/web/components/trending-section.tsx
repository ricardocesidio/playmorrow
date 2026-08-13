import Link from 'next/link';
import { ArrowRight, Gamepad2 } from 'lucide-react';

const API = process.env.API_URL || 'https://playmorrow-api-aged-mountain-9542.fly.dev/api';

async function fetchTrendingGames() {
  try {
    const res = await fetch(`${API}/recommendations?type=trending&limit=6`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data: { items: { gameId: string }[] } = await res.json();
    if (!data.items?.length) return [];

    const ids = data.items.map((i) => i.gameId);
    const gamesRes = await fetch(`${API}/games?pageSize=6`, {
      next: { revalidate: 120 },
    });
    if (!gamesRes.ok) return [];
    const gamesData: { items: { id: string; title: string; slug: string; coverUrl: string | null; studio: { name: string } }[] } = await gamesRes.json();
    return (gamesData.items || []).filter((g) => ids.includes(g.id)).slice(0, 6);
  } catch {
    return [];
  }
}

export default async function TrendingSection() {
  const games = await fetchTrendingGames();
  if (games.length === 0) return null;

  return (
    <section className="relative px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-black uppercase tracking-tight text-white">
            <span className="size-2 rounded-full bg-coral animate-pulse" /> Trending Now
          </h2>
          <Link href="/discover" className="font-mono text-[0.6rem] uppercase tracking-widest text-cyan hover:text-white">
            Discover all <ArrowRight className="ml-1 inline size-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {games.map((game) => (
            <Link key={game.id} href={`/games/${game.slug}`}
              className="group clip-corner border border-border/40 panel overflow-hidden transition hover:border-cyan/30 hover:shadow-[0_0_20px_rgb(62_231_255_/_0.06)]">
              <div className="aspect-[4/3] bg-border/10 flex items-center justify-center">
                {game.coverUrl ? (
                  <img src={game.coverUrl} alt={game.title} className="size-full object-cover" />
                ) : (
                  <Gamepad2 className="size-8 text-muted-foreground/30" />
                )}
              </div>
              <div className="p-3">
                <p className="truncate font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-foreground group-hover:text-cyan transition">
                  {game.title}
                </p>
                <p className="mt-1 truncate font-mono text-[0.5rem] text-muted-foreground/60">{game.studio?.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
