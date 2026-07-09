'use client';

// TODO (Performance audit): Evaluate Server Components for public read-heavy parts of this page (filters, static content) to reduce client JS.

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, BarChart3, Bookmark, ChevronDown, Search, Users, X } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { formatFollowers } from '@/lib/format';
import { useGames } from '@/lib/api/hooks';
import type { Game } from '@/lib/api/client';

export default function GamesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = 16;

  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('All');
  const [playtestOnly, setPlaytestOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [genreFilter, setGenreFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [releaseFilter, setReleaseFilter] = useState('All time');
  const [sortFilter, setSortFilter] = useState('Newest');

  const { data, isLoading, error } =
    useGames(page, pageSize, searchQuery || undefined);

  if (!data && !isLoading) {
    return (
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4">
        <div className="mx-auto max-w-7xl">
          <p className="font-display text-2xl font-bold text-white">No games found</p>
          <p className="mt-2 text-muted-foreground">Check back later for new games.</p>
        </div>
      </main>
    );
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
    router.push('/games?page=1');
  };

  const clearAll = () => {
    setSearchQuery('');
    setSearch('');
    setPriceFilter('All');
    setPlaytestOnly(false);
    setStatusFilter('All');
    setGenreFilter('All');
    setPlatformFilter('All');
    setReleaseFilter('All time');
    setSortFilter('Newest');
    router.push('/games?page=1');
  };

  const items = data?.items ?? [];
  const totalGames = data?.total ?? 0;
  const totalPages = Math.ceil(totalGames / pageSize);

  const handlePageChange = (newPage: number) => {
    router.push(`/games?page=${newPage}`);
  };

  const activeFilters = [
    statusFilter !== 'All' ? `Status: ${statusFilter}` : null,
    priceFilter !== 'All' ? `Price: ${priceFilter}` : null,
    playtestOnly ? 'Playtest available' : null,
  ].filter(Boolean) as string[];

  return (
    <>
      <SiteHeader />
      <main className="relative flex-1 px-5 pb-28 pt-4 sm:px-8 lg:px-10">
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
                  <ToggleControl label="Playtest available" active={playtestOnly} onChange={setPlaytestOnly} />
                  <button type="button" onClick={clearAll} className="cursor-pointer pm-micro inline-flex items-center gap-3 text-coral transition-colors hover:text-coral/80">
                    Clear all <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <FilterSelect label="Genre" value={genreFilter} onChange={setGenreFilter} options={GENRES} />
                <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
                <FilterSelect label="Price" value={priceFilter} onChange={setPriceFilter} options={PRICE_OPTIONS} />
                <FilterSelect label="Sort by" value={sortFilter} onChange={setSortFilter} options={SORT_OPTIONS} icon={<BarChart3 className="size-4" />} />
                <FilterSelect label="Platform" value={platformFilter} onChange={setPlatformFilter} options={PLATFORMS} />
                <FilterSelect label="Release window" value={releaseFilter} onChange={setReleaseFilter} options={RELEASE_WINDOWS} />
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
                  Showing {items.length} of {totalGames.toLocaleString()} games
                </span>
              </div>
            </form>
          </HudPanel>

          <div>
          {error && !isLoading && <ErrorState message="Failed to load games." />}

          {isLoading && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="clip-corner border border-border/60 bg-background/60 p-3">
                  <div className="mb-3 h-28 animate-pulse bg-white/10" />
                  <div className="h-3 w-2/3 animate-pulse bg-white/10" />
                  <div className="mt-2 h-3 w-1/2 animate-pulse bg-white/10" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && items.length === 0 && (
            <EmptyState
              title={searchQuery ? `No games matching "${searchQuery}"` : 'No games yet'}
              action={searchQuery ? undefined : { label: 'Explore studios', href: '/studios' }}
            />
          )}

          {!isLoading && items.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((game) => (
                <CatalogGameCard key={game.id} game={game} />
              ))}
            </div>
          )}

          {items.length > 0 && (
            <PaginationControl
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          )}
          </div>
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}

function FilterSelect({ label, value, onChange, options, icon }: { label: string; value: string; onChange: (v: string) => void; options: string[]; icon?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 9999,
    });
  }, [open]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if ((e.key === 'Enter' || e.key === ' ') && !open) {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div>
      <div className="mb-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">{label}</div>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${label} filter, current: ${value}`}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className="clip-corner flex h-9 w-full items-center justify-between gap-3 border border-border-bright/60 bg-background/80 px-3 font-mono text-[0.55rem] uppercase tracking-widest text-cyan cursor-pointer outline-none focus:border-cyan focus:ring-1 focus:ring-cyan"
      >
        {value}
        <span className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <ChevronDown className="size-3" />
        </span>
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div style={dropdownStyle} className="max-h-60 overflow-y-auto border border-border bg-elevated shadow-lg" role="listbox" aria-label={`${label} options`}>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={value === opt}
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
        </div>,
        document.body
      )}
    </div>
  );
}

function ToggleControl({ label, active, onChange }: { label: string; active: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      onClick={() => onChange(!active)}
      className="cursor-pointer group inline-flex items-center gap-3 pm-micro text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan/50"
    >
      <span className={`relative h-4 w-8 rounded-full border transition-colors ${
        active
          ? 'border-cyan bg-cyan/20 shadow-[0_0_14px_rgb(62_231_255_/_0.25)]'
          : 'border-cyan/65 bg-cyan/10 shadow-[0_0_14px_rgb(62_231_255_/_0.14)]`
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
  const progress = game.progressPercent ?? null;
  const accent = accentForGame(game.status, title);
  const cover = game.coverUrl || '/demo/games/neon-warden/hero.svg';
  const platforms = game.platformLinks?.length
    ? game.platformLinks.map((platform) => platform.platform)
    : [];

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
          </div>

          <div className="mt-auto">
            <h2 className="font-display text-[1.9rem] font-black uppercase leading-[0.92] text-foreground drop-shadow-[0_4px_14px_rgb(0_0_0_/_0.9)]">
              {title}
            </h2>
            <p className="pm-micro mt-3 text-muted-foreground">
              {game.studio?.name ?? 'Independent Studio'} <span className={accent.text}>●</span>
            </p>
            {game.priceCents != null && (
              <p className="mt-1 text-[0.6rem] font-mono text-amber/80">
                {game.isFree ? 'Free' : `${formatPrice(game.priceCents, game.currency)} (Coming Soon)`}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {(game.tags?.length ? game.tags : ['Indie']).slice(0, 2).map((tag, index) => (
                <span key={tag}>{index > 0 ? ' • ' : ''}{tag}</span>
              ))}
            </p>
            <p className="mt-2 flex items-center gap-2 text-xs text-cyan">
              <Users className="size-3.5" /> {formatFollowers(game.followersCount)} <span className="text-muted-foreground">followers</span>
            </p>
            {progress !== null && (
              <div className="mt-3">
                <div className="mb-1.5 flex justify-between pm-micro text-muted-foreground">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1 bg-border">
                  <div className={`h-full ${accent.bar} shadow-[0_0_12px_currentColor]`} style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/80 bg-background/60 px-3 py-2">
          <div className="flex flex-wrap gap-1.5">
            {[...new Set(platforms)].slice(0, 4).map((platform) => (
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
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) {
        start = 2;
        end = Math.min(maxVisible, totalPages - 1);
      } else if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - maxVisible + 1);
        end = totalPages - 1;
      }
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="mt-7 flex items-center justify-center gap-4">
      <div className="hidden h-px flex-1 bg-gradient-to-r from-transparent via-border-bright/45 to-border md:block" />
      <div className="clip-corner flex items-center gap-6 border border-border bg-background/70 px-7 py-3">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="cursor-pointer text-cyan/60 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ArrowLeft className="size-4" />
        </button>
        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="font-mono text-sm text-muted-foreground">...</span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page as number)}
              className={
                page === currentPage
                  ? 'grid size-8 place-items-center border border-cyan bg-cyan/10 font-mono text-sm text-cyan shadow-[0_0_14px_rgb(62_231_255_/_0.18)] cursor-pointer'
                  : 'font-mono text-sm text-foreground/90 cursor-pointer'
              }
            >
              {page}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="cursor-pointer text-cyan/60 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next page icon"
        >
          <ArrowRight className="size-4" />
        </button>
        <span className="h-8 w-px bg-border" />
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="clip-corner inline-flex h-8 items-center gap-3 border border-cyan/70 px-5 pm-display text-xs text-cyan transition hover:bg-cyan hover:text-cyan-foreground disabled:opacity-70 cursor-pointer"
        >
          {isLoading ? 'Loading' : 'Next'} <ArrowRight className="size-4" />
        </button>
      </div>
      <div className="hidden h-px flex-1 bg-gradient-to-r from-border via-border-bright/45 to-transparent md:block" />
    </div>
  );
}
function badgeForGame(status: string, _title: string) {
  return status.replace(/_/g, ' ');
}

function accentForGame(status: string, _title: string) {
  if (status === 'BETA' || status === 'IN_DEVELOPMENT') {
    return { badge: 'border-cyan/70 text-cyan', bar: 'bg-cyan text-cyan', text: 'text-cyan' };
  }
  if (status === 'ALPHA') return { badge: 'border-violet/70 text-violet', bar: 'bg-violet text-violet', text: 'text-violet' };
  if (status === 'PRE_ALPHA') return { badge: 'border-amber/70 text-amber', bar: 'bg-amber text-amber', text: 'text-amber' };
  return { badge: 'border-cyan/70 text-cyan', bar: 'bg-cyan text-cyan', text: 'text-cyan' };
}
const GENRES = [
  'All', 'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Puzzle',
  'Horror', 'Racing', 'Fighting', 'Sports',
];

const STATUS_OPTIONS = [
  'All', 'CONCEPT', 'PRE_ALPHA', 'ALPHA', 'BETA', 'EARLY_ACCESS', 'RELEASED',
];

const PRICE_OPTIONS = ['All', 'Free', 'Paid'];

const PLATFORMS = [
  'All', 'PC', 'Mac', 'Linux', 'PS5', 'PS4', 'XBOX', 'Nintendo Switch',
  'iOS', 'Android', 'Web', 'VR', 'Meta Quest',
];

const RELEASE_WINDOWS = [
  'All time', 'This year', 'Next year', 'Coming soon', 'Already released',
];

const SORT_OPTIONS = ['Newest', 'Most Followed', 'Most Wishlisted', 'A-Z'];
