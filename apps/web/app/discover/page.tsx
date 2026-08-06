import { SiteHeader } from '@/components/site-header';
import { TrendingUp, Star, Flame, Gamepad2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface GameItem {
  id: string; title: string; slug: string; coverUrl: string | null;
  tagline: string | null; followersCount: number; status: string;
  studio: { name: string; slug: string } | null;
}

interface RecommendationItem {
  gameId: string; score: number; reasons: string[];
}

const API = process.env.API_URL || 'https://playmorrow-api-aged-mountain-9542.fly.dev/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://playmorrow.vercel.app';

async function fetchSection(endpoint: string) {
  try {
    const res = await fetch(`${API}${endpoint}`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch { return []; }
}

async function fetchGames(endpoint: string) {
  try {
    const res = await fetch(`${API}${endpoint}`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch { return []; }
}

export default async function DiscoverPage() {
  const [trendingRaw, popular, newest, featured] = await Promise.all([
    fetchSection('/api/recommendations?type=trending&limit=6'),
    fetchGames('/api/games?sortBy=followersCount&pageSize=6'),
    fetchGames('/api/games?sortBy=createdAt&pageSize=6'),
    fetchGames('/api/games?featured=true&pageSize=6'),
  ]);

  const trendingGameIds = trendingRaw.map((i: RecommendationItem) => i.gameId);
  const trendingGames = trendingGameIds.length > 0
    ? (await fetchGames(`/games?pageSize=6`)).filter((g: GameItem) => trendingGameIds.includes(g.id)).slice(0, 6)
    : [];

  return (
    <>
      <SiteHeader />
      <main className="relative overflow-hidden bg-[#020609]">
        <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 lg:px-10">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: 'Discover Indie Games',
                description: 'Browse trending, popular, and new indie games on Playmorrow.',
                url: `${SITE_URL}/discover`,
              }),
            }}
          />

          <div className="mb-12">
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Discover</h1>
            <p className="mt-2 font-mono text-sm text-muted-foreground">Your next favorite game starts here.</p>
          </div>

          {featured.length > 0 && <SectionGrid title="Featured Games" icon={<Star className="size-4 text-coral" />} games={featured} />}
          <SectionGrid title="Trending Today" icon={<Flame className="size-4 text-coral" />} games={trendingGames} />
          <SectionGrid title="Most Popular" icon={<Star className="size-4 text-amber" />} games={popular} />
          <SectionGrid title="Newest Games" icon={<TrendingUp className="size-4 text-cyan" />} games={newest} />

          {trendingRaw.length > 0 && (
            <div className="mt-8 text-center">
              <Link href="/collections" className="inline-flex items-center gap-2 font-mono text-sm text-cyan hover:text-white">
                Browse Collections <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function SectionGrid({ title, icon, games }: { title: string; icon: React.ReactNode; games: GameItem[] }) {
  if (games.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="font-display text-lg font-black uppercase tracking-tight text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {games.map((game: GameItem) => (
          <Link key={game.id} href={`/games/${game.slug}`}
            className="group clip-corner border border-border/40 panel overflow-hidden transition hover:border-cyan/30">
            <div className="aspect-[3/4] bg-border/10 flex items-center justify-center">
              {game.coverUrl
                ? <img src={game.coverUrl} alt={game.title} className="size-full object-cover" />
                : <Gamepad2 className="size-8 text-muted-foreground/30" />}
            </div>
            <div className="p-3">
              <p className="truncate font-mono text-xs font-semibold uppercase tracking-wider text-foreground group-hover:text-cyan">{game.title}</p>
              <p className="mt-1 truncate font-mono text-[0.55rem] text-muted-foreground/60">{game.studio?.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
