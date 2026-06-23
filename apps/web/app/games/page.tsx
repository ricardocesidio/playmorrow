'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BarChart3, Bookmark, ChevronDown, Search, Users, X } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { useInfiniteGames } from '@/lib/api/hooks';
import type { Game } from '@/lib/api/client';

const referenceGames: Game[] = [
  {
    id: 'game-1',
    title: 'Neon Warden',
    slug: 'test-game',
    tagline: 'Tactical stealth in a rain-slick cyberpunk city.',
    description: null,
    status: 'BETA',
    releaseDate: null,
    expectedReleaseText: 'Q4 2026',
    priceCents: 1999,
    currency: 'USD',
    isFree: false,
    coverUrl: '/playmorrow/neon-warden.png',
    bannerUrl: '/playmorrow/neon-warden.png',
    isPublished: true,
    followersCount: 12400,
    studio: { id: 'studio-1', name: 'Obsidian Signal', slug: 'test-studio', logoUrl: null },
    media: [],
    platformLinks: [
      { id: 'pc', platform: 'PC', url: '#', label: 'PC' },
      { id: 'ps5', platform: 'PS5', url: '#', label: 'PS5' },
      { id: 'xbox', platform: 'XBOX', url: '#', label: 'XBOX' },
    ],
    tags: ['Tactical Stealth', 'Cyberpunk'],
    createdAt: '',
    updatedAt: '',
  },
  makeReferenceGame('game-2', 'Starfall Tactics', 'starfall-tactics', 'IN_DEVELOPMENT', '/playmorrow/starfall-tactics.png', 8700, 'Ironlight Studios', 'ironlight-studios', ['Tactical RPG', 'Space Opera']),
  makeReferenceGame('game-3', 'Mossbound', 'mossbound', 'ALPHA', '/playmorrow/mossbound.png', 5100, 'Wildbriar', 'wildbriar', ['Adventure', 'Atmospheric'], ['PC', 'SWITCH']),
  makeReferenceGame('game-4', 'Paper Relics', 'paper-relics', 'PRE_ALPHA', '/playmorrow/paper-relics.png', 3200, 'Second Story Games', 'second-story-games', ['Card Battler', 'Roguelike'], ['PC']),
  makeReferenceGame('game-5', 'Voidrunner', 'voidrunner', 'ALPHA', '/playmorrow/voidrunner.png', 6300, 'Voidrunner', 'voidrunner-studio', ['Roguelite', 'Twin Stick Shooter'], ['PC']),
  makeReferenceGame('game-6', 'Little Giants', 'little-giants', 'IN_DEVELOPMENT', '/playmorrow/little-giants.png', 4200, 'Tiny Forge', 'tiny-forge', ['City Builder', 'Sandbox'], ['PC', 'PS5', 'XBOX', 'SWITCH']),
  makeReferenceGame('game-7', 'Echobloom', 'echobloom', 'ALPHA', '/playmorrow/echobloom.png', 2900, 'Lumen Garden', 'lumen-garden', ['Narrative', 'Puzzle'], ['PC']),
  makeReferenceGame('game-8', 'Northlight', 'northlight', 'PRE_ALPHA', '/playmorrow/northlight.png', 3800, 'Frostfire Games', 'frostfire-games', ['Survival', 'Open World']),
];

const trendingGames = [
  ['Neon Warden', 'Tactical Stealth'],
  ['Starfall Tactics', 'Tactical RPG'],
  ['Mossbound', 'Adventure'],
  ['Voidrunner', 'Roguelite'],
  ['Paper Relics', 'Card Battler'],
] as const;

export default function GamesPage() {
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [playtestOnly, setPlaytestOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [genreFilter, setGenreFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [releaseFilter, setReleaseFilter] = useState('All time');
  const [sortFilter, setSortFilter] = useState('Most active');

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteGames(20, searchQuery || undefined);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
  };

  const clearAll = () => {
    setSearchQuery('');
    setSearch('');
    setFreeOnly(false);
    setPlaytestOnly(false);
    setStatusFilter('All');
    setGenreFilter('All');
    setPlatformFilter('All');
    setReleaseFilter('All time');
    setSortFilter('Most active');
  };

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const displayedItems = items.length > 0 ? items.slice(0, 8) : isLoading ? [] : [];
  const totalGames = data?.pages[0]?.total ?? 0;
  const activeFilters = [
    statusFilter !== 'All' ? `Status: ${statusFilter}` : null,
    freeOnly ? 'Free' : null,
    playtestOnly ? 'Playtest available' : null,
  ].filter(Boolean) as string[];

  return (
    <>
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-[1448px]">
          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border/55 pb-2">
              <div>
                <h1 className="font-display text-[2.55rem] font-black uppercase leading-[0.9] text-foreground sm:text-5xl lg:text-[3.28rem]">
                  Browse the next generation
                </h1>
                <p className="mt-2 text-sm leading-none text-muted-foreground sm:text-base">
                  Discover games before the rest of the world.
                </p>
              </div>
              <div className="pm-micro text-muted-foreground">
                <span className="text-cyan">{totalGames.toLocaleString()}</span> games indexed
              </div>
            </div>

            <form onSubmit={handleSearch} className="mt-3 grid gap-3">
              <div className="grid gap-3 xl:grid-cols-[minmax(340px,680px)_1fr] xl:items-center">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search games, studios, genres..."
                    aria-label="Search games"
                    className="clip-corner h-10 w-full border border-border-bright/50 bg-background/70 pl-12 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/45 focus:border-cyan focus:ring-1 focus:ring-cyan"
                  />
                  <button type="submit" className="cursor-pointer sr-only">Search</button>
                </div>

                <div className="flex flex-wrap items-center justify-start gap-5 xl:justify-end">
                  <ToggleControl label="Free" active={freeOnly} onChange={setFreeOnly} />
                  <ToggleControl label="Playtest available" active={playtestOnly} onChange={setPlaytestOnly} />
                  <button type="button" onClick={clearAll} className="cursor-pointer pm-micro inline-flex items-center gap-3 text-coral transition-colors hover:text-coral/80">
                    Clear all <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-[520px_1fr_1fr_1.1fr_1.2fr]">
                <FilterGroup label="Status" options={['All', 'IN_DEVELOPMENT', 'ALPHA', 'PRE_ALPHA']} selected={statusFilter} onChange={setStatusFilter} />
                <FilterSelect label="Genre" value={genreFilter} onChange={setGenreFilter} options={GENRES} />
                <FilterSelect label="Platform" value={platformFilter} onChange={setPlatformFilter} options={PLATFORMS} />
                <FilterSelect label="Release window" value={releaseFilter} onChange={setReleaseFilter} options={RELEASE_WINDOWS} />
                <FilterSelect label="Sort by" value={sortFilter} onChange={setSortFilter} options={SORT_OPTIONS} icon={<BarChart3 className="size-4" />} />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {activeFilters.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="clip-corner inline-flex items-center gap-2 border border-cyan/45 bg-cyan/5 px-3 py-1.5 pm-micro text-cyan"
                  >
                    {chip} <X className="size-3" />
                  </button>
                ))}
                {activeFilters.length > 0 && <button type="button" onClick={clearAll} className="cursor-pointer px-3 py-1.5 pm-micro text-coral transition-colors hover:text-coral/80">Clear all</button>}
                <span className="ml-auto hidden text-xs text-muted-foreground/70 lg:inline">
                  Showing {displayedItems.length} of {totalGames.toLocaleString()} games
                </span>
              </div>
            </form>
          </HudPanel>

          <div className="grid gap-3 xl:grid-cols-[1fr_190px]">
            <div>
          {error && !isLoading && <ErrorState message="Failed to load games." />}

          {!isLoading && !error && displayedItems.length === 0 && (
            <EmptyState
              title={searchQuery ? `No games matching "${searchQuery}"` : 'No games yet'}
              action={searchQuery ? undefined : { label: 'Explore studios', href: '/studios' }}
            />
          )}

          {displayedItems.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedItems.map((game) => (
                <CatalogGameCard key={game.id} game={game} />
              ))}
            </div>
          )}

          {displayedItems.length > 0 && (
            <PaginationControl
              onNext={loadMore}
              disabled={!hasNextPage || isFetchingNextPage}
              isLoading={isFetchingNextPage}
            />
          )}
            </div>

            <HudPanel className="hidden min-h-[462px] self-start p-4 xl:block" accent="muted">
              <h2 className="pm-micro mb-5 flex items-center justify-between text-foreground">
                Trending now <span className="text-cyan">~</span>
              </h2>
              <div className="space-y-0">
                {trendingGames.map(([title, genre], index) => (
                  <div key={title} className="grid grid-cols-[22px_1fr] gap-3 border-b border-border/45 py-4 first:pt-0 last:border-b-0">
                    <span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="block pm-micro text-foreground">{title}</span>
                      <span className="mt-2 block text-xs text-muted-foreground">{genre}</span>
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/feed"
                className="mt-6 inline-flex items-center gap-2 border border-coral/60 px-4 py-3 pm-micro text-coral transition hover:bg-coral hover:text-coral-foreground"
              >
                View all trending <ArrowRight className="size-3" />
              </Link>
            </HudPanel>
          </div>
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}

function FilterGroup({ label, options, selected, onChange }: { label: string; options: string[]; selected: string; onChange: (value: string) => void }) {
  return (
    <div>
      <div className="pm-micro mb-1.5 text-muted-foreground">{label} <ChevronDown className="inline size-3" /></div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`clip-corner border px-4 py-1.5 pm-micro cursor-pointer ${
              selected === option
                ? 'border-cyan bg-cyan/10 text-cyan'
                : 'border-border bg-background/50 text-muted-foreground'
            }`}
          >
            {option === 'All' ? 'All' : option.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, icon }: { label: string; value: string; onChange: (v: string) => void; options: string[]; icon?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="pm-micro mb-1.5 text-muted-foreground">{label}</div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="clip-corner flex h-9 w-full items-center justify-between gap-3 border border-border-bright/60 bg-background/60 px-3 pm-micro text-cyan cursor-pointer"
      >
        {value}
        <span className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <ChevronDown className="size-3" />
        </span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto border border-border bg-elevated shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`block w-full px-3 py-2 text-left font-mono text-xs transition-colors cursor-pointer ${
                value === opt
                  ? 'bg-cyan/10 text-cyan'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleControl({ label, active, onChange }: { label: string; active: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!active)} className="cursor-pointer group inline-flex items-center gap-3 pm-micro text-muted-foreground">
      <span className={`relative h-4 w-8 rounded-full border transition-colors ${
        active
          ? 'border-cyan bg-cyan/20 shadow-[0_0_14px_rgb(62_231_255_/_0.25)]'
          : 'border-cyan/65 bg-cyan/10 shadow-[0_0_14px_rgb(62_231_255_/_0.14)]'
      }`}>
        <span className={`absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-cyan shadow-[0_0_12px_rgb(62_231_255_/_0.75)] transition-all ${
          active ? 'left-4' : 'left-0.5'
        }`} />
      </span>
      {label}
    </button>
  );
}

function CatalogGameCard({ game }: { game: Game }) {
  const title = game.title;
  const progress = progressForGame(title);
  const accent = accentForGame(game.status, title);
  const cover = game.coverUrl ?? coverForGame(title);
  const platforms = game.platformLinks?.length
    ? game.platformLinks.map((platform) => platform.platform)
    : fallbackPlatforms(title);

  return (
    <Link
      href={`/games/${game.slug}`}
      className="panel group grid h-[232px] grid-rows-[193px_39px] overflow-hidden border-border/95 bg-card transition hover:border-cyan/70 hover:shadow-[0_0_24px_rgb(62_231_255_/_0.12)]"
    >
      <div className="relative min-h-0 overflow-hidden p-3">
        <img
          src={cover}
          alt={title}
          className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.035]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/82 via-transparent to-background/12" />

        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-start justify-between gap-2">
            <span className={`clip-corner-sm border bg-background/65 px-2 py-1 pm-micro ${accent.badge}`}>
              {badgeForGame(game.status, title)}
            </span>
            {title === 'Voidrunner' && (
              <span className="clip-corner-sm border border-coral/70 bg-coral/85 px-3 py-1.5 pm-micro text-coral-foreground shadow-[0_0_18px_rgb(255_87_77_/_0.35)]">
                (-) Live Playtest
              </span>
            )}
          </div>

          <div className="mt-auto">
            <h2 className="font-display text-[1.9rem] font-black uppercase leading-[0.92] text-foreground drop-shadow-[0_4px_14px_rgb(0_0_0_/_0.9)]">
              {title}
            </h2>
            <p className="pm-micro mt-3 text-muted-foreground">
              {game.studio?.name ?? 'Independent Studio'} <span className={accent.text}>●</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {(game.tags?.length ? game.tags : ['Indie']).slice(0, 2).map((tag, index) => (
                <span key={tag}>{index > 0 ? ' • ' : ''}{tag}</span>
              ))}
            </p>
            <p className="mt-2 flex items-center gap-2 text-xs text-cyan">
              <Users className="size-3.5" /> {formatFollowers(game.followersCount)} <span className="text-muted-foreground">followers</span>
            </p>
            <div className="mt-3">
              <div className="mb-1.5 flex justify-between pm-micro text-muted-foreground">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-border">
                <div className={`h-full ${accent.bar} shadow-[0_0_12px_currentColor]`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/80 bg-background/60 px-3 py-2">
          <div className="flex flex-wrap gap-1.5">
            {platforms.slice(0, 4).map((platform) => (
              <span key={platform} className="border border-border-bright/45 bg-background/50 px-2 py-1 font-mono text-[10px] uppercase leading-none text-muted-foreground">
                {platform}
              </span>
            ))}
          </div>
          <Bookmark className="size-4 shrink-0 text-muted-foreground transition group-hover:text-cyan" />
      </div>
    </Link>
  );
}

function PaginationControl({
  onNext,
  disabled,
  isLoading,
}: {
  onNext: () => void;
  disabled: boolean;
  isLoading: boolean;
}) {
  return (
    <div className="mt-7 flex items-center justify-center gap-4">
      <div className="hidden h-px flex-1 bg-gradient-to-r from-transparent via-border-bright/45 to-border md:block" />
      <div className="clip-corner flex items-center gap-6 border border-border bg-background/70 px-7 py-3">
        <button type="button" className="cursor-pointer text-cyan/60" aria-label="Previous page">
          <ArrowLeft className="size-4" />
        </button>
        {['1', '2', '3', '4', '5', '...', '122'].map((page) => (
          <button
            key={page}
            type="button"
            className={
              page === '1'
                ? 'grid size-8 place-items-center border border-cyan bg-cyan/10 font-mono text-sm text-cyan shadow-[0_0_14px_rgb(62_231_255_/_0.18)] cursor-pointer'
                : 'font-mono text-sm text-foreground/90 cursor-pointer'
            }
          >
            {page}
          </button>
        ))}
        <button type="button" className="cursor-pointer text-cyan/60" aria-label="Next page icon">
          <ArrowRight className="size-4" />
        </button>
        <span className="h-8 w-px bg-border" />
        <button
          type="button"
          onClick={onNext}
          disabled={disabled}
          className="clip-corner inline-flex h-8 items-center gap-3 border border-cyan/70 px-5 pm-display text-xs text-cyan transition hover:bg-cyan hover:text-cyan-foreground disabled:opacity-70 cursor-pointer"
        >
          {isLoading ? 'Loading' : 'Next'} <ArrowRight className="size-4" />
        </button>
      </div>
      <div className="hidden h-px flex-1 bg-gradient-to-r from-border via-border-bright/45 to-transparent md:block" />
    </div>
  );
}

function makeReferenceGame(
  id: string,
  title: string,
  slug: string,
  status: string,
  coverUrl: string,
  followersCount: number,
  studioName: string,
  studioSlug: string,
  tags: string[],
  platforms = ['PC', 'PS5', 'XBOX'],
): Game {
  return {
    id,
    title,
    slug,
    tagline: null,
    description: null,
    status,
    releaseDate: null,
    expectedReleaseText: null,
    priceCents: null,
    currency: 'USD',
    isFree: false,
    coverUrl,
    bannerUrl: coverUrl,
    isPublished: true,
    followersCount,
    studio: { id: `${id}-studio`, name: studioName, slug: studioSlug, logoUrl: null },
    media: [],
    platformLinks: platforms.map((platform) => ({ id: `${slug}-${platform}`, platform, url: '#', label: platform })),
    tags,
    createdAt: '',
    updatedAt: '',
  };
}

function badgeForGame(status: string, title: string) {
  if (title === 'Neon Warden') return 'Featured';
  return status.replace(/_/g, ' ');
}

function progressForGame(title: string) {
  const progress: Record<string, number> = {
    'Neon Warden': 68,
    'Starfall Tactics': 54,
    Mossbound: 32,
    'Paper Relics': 18,
    Voidrunner: 45,
    'Little Giants': 41,
    Echobloom: 37,
    Northlight: 22,
  };
  return progress[title] ?? 37;
}

function accentForGame(status: string, title: string) {
  if (title === 'Neon Warden' || status === 'BETA' || status === 'IN_DEVELOPMENT') {
    return { badge: 'border-cyan/70 text-cyan', bar: 'bg-cyan text-cyan', text: 'text-cyan' };
  }
  if (status === 'ALPHA') return { badge: 'border-violet/70 text-violet', bar: 'bg-violet text-violet', text: 'text-violet' };
  if (status === 'PRE_ALPHA') return { badge: 'border-amber/70 text-amber', bar: 'bg-amber text-amber', text: 'text-amber' };
  return { badge: 'border-cyan/70 text-cyan', bar: 'bg-cyan text-cyan', text: 'text-cyan' };
}

function coverForGame(title: string) {
  const game = referenceGames.find((item) => item.title === title);
  return game?.coverUrl ?? '/playmorrow/neon-warden.png';
}

function fallbackPlatforms(title: string) {
  const game = referenceGames.find((item) => item.title === title);
  return game?.platformLinks.map((platform) => platform.platform) ?? ['PC'];
}

function formatFollowers(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

const GENRES = [
  'All', 'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Puzzle',
  'Platformer', 'Shooter', 'Fighting', 'Racing', 'Sports', 'Horror',
  'Visual Novel', 'Roguelike', 'Roguelite', 'Metroidvania', 'Souls-like',
  'Tactical', 'Card Battler', 'City Builder', 'Sandbox', 'Open World',
  'Survival', 'Stealth', 'Rhythm', 'Party', 'Educational',
];

const PLATFORMS = [
  'All', 'PC', 'Mac', 'Linux', 'PS5', 'PS4', 'XBOX', 'Nintendo Switch',
  'iOS', 'Android', 'Web', 'VR', 'Meta Quest',
];

const RELEASE_WINDOWS = [
  'All time', 'This year', 'Next year', 'Coming soon', 'Already released',
];

const SORT_OPTIONS = [
  'Most active', 'Newest', 'Most followed', 'Alphabetical', 'Recently updated',
];
