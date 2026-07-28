'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { api } from '@/lib/api/client';
import { Loader2, TrendingUp, Star, Flame, Gamepad2, ArrowRight } from 'lucide-react';

interface GameItem {
  id: string; title: string; slug: string; coverUrl: string | null;
  tagline: string | null; followersCount: number; status: string;
  studio: { name: string; slug: string };
}

interface Section {
  id: string; title: string; icon: React.ReactNode; endpoint: string; games: GameItem[];
}

const SECTIONS_CONFIG = [
  { id: 'trending', title: 'Trending Today', icon: <Flame className="size-4 text-coral" />, endpoint: '/api/recommendations?type=trending&limit=6' },
  { id: 'popular', title: 'Most Popular', icon: <Star className="size-4 text-amber" />, endpoint: '/api/games?sortBy=followersCount&pageSize=6' },
  { id: 'newest', title: 'Newest Games', icon: <TrendingUp className="size-4 text-cyan" />, endpoint: '/api/games?sortBy=createdAt&pageSize=6' },
];

export default function DiscoverPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      SECTIONS_CONFIG.map(async (cfg) => {
        try {
          const res = await api.get<any>(cfg.endpoint);
          const items = res.items || res.games?.items || [];
          return { ...cfg, games: items.slice(0, 6) };
        } catch {
          return { ...cfg, games: [] };
        }
      }),
    ).then(setSections).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Discover Games</h1>
            <p className="mt-2 font-mono text-[0.65rem] text-muted-foreground">Find your next favorite game</p>
          </div>

          {loading ? (
            <div className="space-y-8">
              {[1, 2, 3].map(s => (
                <div key={s}>
                  <div className="mb-4 h-5 w-48 bg-border/20 rounded animate-pulse" />
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {[1, 2, 3, 4, 5, 6].map(c => (
                      <div key={c} className="aspect-[3/4] rounded bg-border/10 animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              {sections.filter(s => s.games.length > 0).map(section => (
                <section key={section.id}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-foreground">
                      {section.icon} {section.title}
                    </h2>
                    <Link href={`/discover?section=${section.id}`} className="flex items-center gap-1 font-mono text-[0.55rem] text-cyan hover:text-cyan/80">
                      View all <ArrowRight className="size-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {section.games.map(game => (
                      <Link key={game.id} href={`/games/${game.slug}`}
                        className="group clip-corner border border-border/40 bg-[#050b0f]/50 overflow-hidden transition hover:border-cyan/30 hover:shadow-[0_0_20px_rgb(62_231_255_/_0.06)]">
                        <div className="aspect-[3/4] bg-border/10 flex items-center justify-center">
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
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
