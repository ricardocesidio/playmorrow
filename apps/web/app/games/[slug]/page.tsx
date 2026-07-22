'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  Clipboard,
  Disc3,
  Facebook,
  Flame,
  Gamepad2,
  MessageCircle,
  Globe,
  Heart,
  Link as LinkIcon,
  Lock,
  Monitor,
  Pencil,
  Play,
  Plus,
  Send,
  Share2,
  Shield,
  X,
} from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { ErrorState } from '@/components/error-state';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { useAuth } from '@/lib/api/auth-context';
import { formatFollowers, formatPrice } from '@/lib/format';
import type { Devlog, Game, RoadmapItem } from '@/lib/api/client';
import {
  useAddGameToWishlist,
  useCreateGameComment,
  useFollowGame,
  useGame,
  useGameComments,
  useGameFollowStatus,
  useGameWishlistStatus,
  useReactToGameComment,
  useRemoveGameCommentReaction,
  useRemoveGameFromWishlist,
  useUnfollowGame,
} from '@/lib/api/hooks';

const fallbackScreenshots: string[] = [];
const fallbackRoadmap: never[][] = [];

interface GameCommentItem {
  id: string;
  body: string | null;
  parentId: string | null;
  author: { id: string; username: string; displayName: string; avatarUrl: string | null };
  createdAt: string;
  updatedAt: string;
  reactions?: { LIKE: number };
  viewerReactions?: string[];
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

type GameWithDemoSettings = Game & {
  demoAvailable?: boolean | null;
  demoUrl?: string | null;
  playDemoUrl?: string | null;
  playtestUrl?: string | null;
};

export default function GameDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: game, isLoading, error } = useGame(slug);

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1500px]">
            <LoadingSkeleton count={8} height="h-16" />
          </div>
        </main>
      </>
    );
  }

  if (error || !game) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-5xl">
            <ErrorState message="Game not found." />
            <div className="mt-4 text-center">
              <Link href="/games" className="pm-micro text-cyan underline">Back to games</Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return <PremiumGameDetail game={game} devlogs={game.devlogs ?? []} roadmap={game.roadmapItems ?? []} slug={slug} />;
}

function PremiumGameDetail({
  game,
  devlogs,
  roadmap,
  slug,
}: {
  game: Game;
  devlogs: Devlog[];
  roadmap: RoadmapItem[];
  slug: string;
}) {
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const title = game.title || '';
  const heroImage = game.bannerUrl || game.coverUrl || '';
  const tags = game.tags?.length ? game.tags : [];
  const allScreenshots = useMemo(() => {
    return game.media?.filter((item) => item.type !== 'VIDEO').map((item) => item.thumbnailUrl ?? item.url) ?? [];
  }, [game.media]);
  const screenshots = useMemo(() => {
    return allScreenshots.length ? allScreenshots : fallbackScreenshots;
  }, [allScreenshots]);

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen overflow-hidden px-5 pb-24 pt-3 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-65" />
        <div className="relative z-10 mx-auto max-w-[1500px]">
          <Breadcrumbs title={title} />

          <section className="grid items-start gap-5 xl:grid-cols-[1fr_430px]">
            <div className="grid gap-5">
              <GameHero game={game} title={title} heroImage={heroImage} slug={slug} />
              <TagRow tags={tags} />
              <div className="grid items-start gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <TrailerPanel title={title} image={heroImage} trailerUrl={game.trailerUrl} />
                <ScreenshotsPanel screenshots={screenshots} allScreenshots={allScreenshots} active={activeScreenshot} onSelect={setActiveScreenshot} title={title} />
              </div>
              <DevlogsPanel devlogs={devlogs} slug={slug} />
            </div>
            <aside className="grid gap-5">
              <PurchasePanel game={game} slug={slug} title={title} />
              <AboutPanel game={game} slug={slug} />
              <InfoLinksPanel game={game} slug={slug} />
              <RoadmapPanel roadmap={roadmap} />
              <CommunityPanel slug={slug} />
            </aside>
          </section>
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}

function Breadcrumbs({ title }: { title: string }) {
  return (
    <nav className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground" aria-label="Breadcrumb">
      <Link href="/games" className="inline-flex items-center gap-1 transition hover:text-cyan">
        <ArrowLeft className="size-3" /> Back to browse
      </Link>
      <span>/</span>
      <Link href="/games" className="transition hover:text-cyan">Games</Link>
      <span>/</span>
      <span className="text-foreground/70">{title}</span>
    </nav>
  );
}

function GameHero({ game, title, heroImage, slug }: { game: Game; title: string; heroImage: string; slug: string }) {
  return (
    <HudPanel className="relative min-h-[420px] overflow-hidden p-0 xl:h-[420px] xl:min-h-0" accent="muted">
      <img src={heroImage} alt={`${title} hero art`} className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/82 via-background/28 to-background/0" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/72 via-transparent to-background/5" />

      <div className="relative z-10 grid min-h-[420px] content-between p-6 pb-0 sm:p-8 sm:pb-0 xl:h-full xl:min-h-0 xl:px-12 xl:pb-0 xl:pt-8">
        <div>
          {game.featured && <span className="clip-corner-sm border border-cyan/70 bg-background/70 px-3.5 py-1.5 pm-micro text-cyan shadow-[0_0_14px_rgb(62_231_255_/_0.18)]">Featured</span>}
          <ManageDropdown slug={slug} />
          <h1 className="mt-5 font-display text-[4rem] font-black uppercase leading-[0.86] text-foreground drop-shadow-[0_6px_18px_rgb(0_0_0_/_0.85)] sm:text-[5.05rem] xl:text-[5.25rem]">
            {title.split(' ').map((word) => (
              <span key={word} className="block">{word}</span>
            ))}
          </h1>
          {game.tagline && <p className="pm-micro mb-[10px] mt-5 text-[0.78rem] text-muted-foreground">{game.tagline}</p>}
        </div>

        <div>
          <div className="mb-4 mt-[5px] flex flex-wrap items-center gap-4">
            <div className="grid size-14 place-items-center rounded-[3px] border border-border-bright bg-background/78 shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.04)]">
              <Shield className="size-7 text-foreground" />
            </div>
            <div>
              <p className="pm-display text-[0.95rem] leading-none text-foreground">
                {game.studio?.name ?? ''} <span className="text-cyan">●</span>
                {game.studio?.isVerified && <span className="ml-1 text-[0.7rem] text-cyan">✓ Verified</span>}
              </p>
            </div>
            <DetailFollowButton slug={slug} />
          </div>
          <div className="-mx-6 grid border-y border-border/55 bg-background/38 shadow-[inset_0_18px_34px_rgb(0_0_0_/_0.28)] sm:-mx-8 sm:grid-cols-[205px_205px_205px_205px_1fr] xl:-mx-12">
            <HeroStat icon={<Heart className="size-[28px] stroke-[2]" />} value={formatFollowers(game.followersCount || 0)} label="Followers" />
            <HeroStat icon={<Flame className="size-[26px] fill-coral text-coral" />} value={String(game.wishlistsCount ?? 0)} label="Wishlists" />
            <HeroStat icon={<MessageCircle className="size-[29px] stroke-[1.9]" />} value={String(game.commentsCount ?? 0)} label="Comments" />
            <HeroStat icon={<ActivityIcon />} value={String(game.viewsCount ?? 0)} label="Views" />
          </div>
        </div>
      </div>
    </HudPanel>
  );
}

function PurchasePanel({ game, slug, title }: { game: Game; slug: string; title: string }) {
  const price = game.priceCents == null
    ? ''
    : game.isFree
      ? 'Free'
      : `${formatPrice(game.priceCents, game.currency)} (Coming Soon)`;
  const demoHref = getDemoHref(game) ?? undefined;
  const hasDemo = Boolean(demoHref);

  return (
    <HudPanel className="p-4" accent="muted">
      <p className="text-sm mb-3 text-foreground">Standard Edition</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <p className="font-display text-2xl font-black text-foreground">{price}</p>
        <span className="clip-corner inline-flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
          {(game.currency ?? 'USD').toUpperCase()}
        </span>
      </div>
      <p className={`mt-2 text-xs ${hasDemo ? 'text-cyan' : 'text-muted-foreground'}`}>
        {hasDemo ? 'Demo available' : 'Demo locked'} <span className={`inline-block size-2 rounded-full border ${hasDemo ? 'border-cyan' : 'border-muted-foreground/60'}`} />
      </p>

      {hasDemo ? (
        <a
          href={demoHref}
          className="clip-corner mt-3 flex h-10 cursor-pointer items-center justify-center gap-4 border border-coral bg-coral px-5 pm-display text-xs text-coral-foreground shadow-[0_0_24px_rgb(255_87_77_/_0.24)] transition hover:bg-[#ff6a61]"
        >
          Play demo <Play className="ml-auto size-4 fill-current" />
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="clip-corner mt-3 flex h-10 w-full cursor-not-allowed items-center justify-center gap-4 border border-border-bright/50 bg-background/55 px-5 pm-display text-xs text-muted-foreground"
        >
          Play demo <Lock className="ml-auto size-4" />
        </button>
      )}

      <DetailWishlistButton slug={slug} />
      <p className="mt-3 border-b border-border/60 pb-3 text-xs text-muted-foreground">
        Expected release: <span className="text-foreground">{formatReleaseDate(game.releaseDate) || game.expectedReleaseText || 'TBA'}</span>
      </p>

      <p className="pm-micro mt-3 text-muted-foreground">Platforms</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(game.platformLinks ?? []).slice(0, 6).map((p) => (
          <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="flex min-h-8 cursor-pointer items-center justify-center gap-2 border border-border bg-background/65 px-2 font-mono text-[11px] uppercase text-foreground transition hover:border-cyan">
            {p.platform.includes('PC') || p.platform.includes('STEAM') ? <Monitor className="size-4 text-cyan" /> : <Gamepad2 className="size-4" />}
            {p.platform}
          </a>
        ))}
      </div>

      <ShareButtons title={title} />
    </HudPanel>
  );
}

function DetailFollowButton({ slug }: { slug: string }) {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const { data: status, isLoading } = useGameFollowStatus(slug, token ?? undefined);
  const follow = useFollowGame();
  const unfollow = useUnfollowGame();
  const isFollowing = status?.isFollowing ?? false;

  const onClick = async () => {
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }
    if (isFollowing) await unfollow.mutateAsync({ slug, token });
    else await follow.mutateAsync({ slug, token });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || follow.isPending || unfollow.isPending}
      className="clip-corner ml-0 inline-flex h-9 min-w-24 cursor-pointer items-center justify-center border border-cyan/60 bg-background/50 px-5 text-sm text-cyan transition hover:bg-cyan hover:text-cyan-foreground disabled:opacity-60 sm:ml-4"
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}

function DetailWishlistButton({ slug }: { slug: string }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: status } = useGameWishlistStatus(slug);
  const add = useAddGameToWishlist();
  const remove = useRemoveGameFromWishlist();
  const isWishlisted = status?.isWishlisted ?? false;

  const onClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isWishlisted) remove.mutate({ slug });
    else add.mutate({ slug });
  };

  return (
    <div className="mt-3 grid grid-cols-[1fr_58px] gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={add.isPending || remove.isPending}
        className="clip-corner inline-flex h-9 cursor-pointer items-center justify-center gap-2 border border-border-bright/55 bg-background/55 pm-micro text-muted-foreground transition hover:border-coral hover:text-coral disabled:opacity-60"
      >
        <Plus className="size-3" /> {isWishlisted ? 'Wishlisted' : 'Add to wishlist'}
      </button>
      <span className="clip-corner grid place-items-center border border-border-bright/55 bg-background/55 font-mono text-xs text-muted-foreground">{isWishlisted ? '✓' : '+'}</span>
    </div>
  );
}

function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState<'link' | 'discord' | null>(null);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async (type: 'link' | 'discord') => {
    if (navigator?.clipboard && shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 1600);
    }
  };

  return (
    <div className="mt-3">
      <p className="pm-micro text-muted-foreground">Share</p>
      <div className="mt-2 grid grid-cols-5 justify-items-center gap-2">
        <button type="button" onClick={() => copyLink('link')} aria-label="Copy link" className="cursor-pointer grid size-8 place-items-center border border-border bg-background/55 text-muted-foreground hover:text-cyan">
          {copied === 'link' ? <Check className="size-4 text-success" /> : <LinkIcon className="size-4" />}
        </button>
        <a aria-label="Share on X" href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer grid size-8 place-items-center border border-border bg-background/55 text-muted-foreground hover:text-cyan"><X className="size-4" /></a>
        <a aria-label="Share on Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer grid size-8 place-items-center border border-border bg-background/55 text-muted-foreground hover:text-cyan"><Facebook className="size-4" /></a>
        <a aria-label="Share on Reddit" href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer grid size-8 place-items-center border border-border bg-background/55 text-muted-foreground hover:text-cyan"><Disc3 className="size-4" /></a>
        <button type="button" aria-label="Copy Discord share link" onClick={() => copyLink('discord')} className="cursor-pointer grid size-8 place-items-center border border-border bg-background/55 text-muted-foreground hover:text-cyan">
          {copied === 'discord' ? <Check className="size-4 text-success" /> : <Share2 className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function TagRow({ tags }: { tags: string[] }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto whitespace-nowrap scrollbar-none">
      <span className="pm-micro mr-1 shrink-0 text-muted-foreground">Tags</span>
      {tags.map((tag, index) => (
        <span key={tag} className={`clip-corner-sm border bg-background/52 px-4 py-1.5 font-mono text-xs font-semibold shrink-0 shadow-[inset_0_0_12px_rgb(62_231_255_/_0.04)] ${index === 3 || index === 4 ? 'border-violet/55 text-violet' : 'border-cyan/35 text-cyan'}`}>
          {tag}
        </span>
      ))}
    </div>
  );
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1]!;
  }
  return null;
}

function TrailerPanel({ title, image, trailerUrl }: { title: string; image: string; trailerUrl?: string | null }) {
  const [playing, setPlaying] = useState(false);
  const youtubeId = trailerUrl ? extractYoutubeId(trailerUrl) : null;
  const embedUrl = youtubeId ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0` : null;
  const thumbUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : image;

  if (!trailerUrl || !embedUrl) {
    return (
      <TechPanel id="trailer" title="Trailer" className="min-h-[268px]">
        <div className="relative grid min-h-[210px] place-items-center border border-border bg-muted">
          <p className="text-xs text-muted-foreground">No trailer available</p>
        </div>
      </TechPanel>
    );
  }

  if (playing) {
    return (
      <TechPanel id="trailer" title="Trailer" className="min-h-[268px]">
        <div className="relative min-h-[210px] overflow-hidden border border-border bg-muted">
          <iframe
            src={embedUrl}
            title={`${title} trailer`}
            className="absolute inset-0 size-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </TechPanel>
    );
  }

  return (
    <TechPanel id="trailer" title="Trailer" className="min-h-[268px]">
      <div className="relative min-h-[210px] overflow-hidden border border-border bg-muted">
        <img src={thumbUrl} alt={`${title} trailer thumbnail`} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/65 via-background/22 to-background/20" />
        <div className="absolute inset-0 grid place-items-center text-center">
          <button type="button" onClick={() => setPlaying(true)} aria-label="Play trailer" className="grid size-14 cursor-pointer place-items-center rounded-full border border-foreground/45 bg-background/45 text-foreground backdrop-blur-sm hover:bg-cyan/20 hover:border-cyan">
            <Play className="ml-1 size-7 fill-current" />
          </button>
          <div className="pointer-events-none absolute right-8 top-10 font-display text-4xl font-black uppercase leading-none text-foreground">
            {title}
          </div>
        </div>
      </div>
    </TechPanel>
  );
}

function ScreenshotsPanel({
  screenshots,
  allScreenshots,
  active,
  onSelect: _onSelect,
  title,
}: {
  screenshots: string[];
  allScreenshots: string[];
  active: number;
  onSelect: (index: number) => void;
  title: string;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(active);
  const totalScreenshots = allScreenshots.length;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (e.key === 'ArrowRight') { setLightboxIndex((i) => (i + 1) % totalScreenshots); }
      if (e.key === 'ArrowLeft') { setLightboxIndex((i) => (i - 1 + totalScreenshots) % totalScreenshots); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, totalScreenshots]);

  if (!screenshots.length) {
    return (
      <TechPanel title="Screenshots" className="min-h-[268px]">
        <div className="grid min-h-[210px] place-items-center border border-border bg-muted">
          <p className="text-xs text-muted-foreground">No screenshots yet</p>
        </div>
      </TechPanel>
    );
  }

  return (
    <TechPanel title={`Screenshots (${totalScreenshots})`} className="min-h-[268px]">
      <div className="grid gap-2">
        {screenshots[0] && (
          <button type="button" onClick={() => openLightbox(0)} className="cursor-pointer">
            <img src={screenshots[0]} alt={`${title} screenshot`} className="h-[142px] w-full border border-border object-cover" />
          </button>
        )}
        {screenshots.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {screenshots.slice(1).map((image, index) => (
              <button key={image} type="button" onClick={() => openLightbox(index + 1)} className="cursor-pointer border border-border transition hover:border-cyan">
                <img src={image} alt={`${title} thumbnail ${index + 1}`} className="h-14 w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + totalScreenshots) % totalScreenshots); }}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 grid size-12 cursor-pointer place-items-center rounded-full border border-cyan/60 bg-background/60 text-cyan hover:bg-cyan hover:text-cyan-foreground"
          >
            <ArrowLeft className="size-6" />
          </button>

          <img
            src={allScreenshots[lightboxIndex]}
            alt={`${title} screenshot ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % totalScreenshots); }}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 grid size-12 cursor-pointer place-items-center rounded-full border border-cyan/60 bg-background/60 text-cyan hover:bg-cyan hover:text-cyan-foreground"
          >
            <ArrowRight className="size-6" />
          </button>

          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-sm text-foreground/80">
            {lightboxIndex + 1} / {totalScreenshots}
          </span>

          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 grid size-10 cursor-pointer place-items-center rounded-full border border-border bg-background/60 text-foreground hover:text-coral"
          >
            <X className="size-5" />
          </button>
        </div>,
        document.body
      )}
    </TechPanel>
  );
}

function AboutPanel({ game, slug }: { game: Game; slug: string }) {
  return (
    <TechPanel title="About" className="h-full">
      <p className="text-xs leading-6 text-muted-foreground">
        {game.description || 'No description available yet.'}
      </p>
      {game.genres && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {game.genres.split(',').map((g) => (
            <span key={g} className="border border-border/50 px-2 py-0.5 font-mono text-[0.55rem] uppercase text-cyan">{g.trim()}</span>
          ))}
        </div>
      )}
      {game.readme && (
        <Link href={`/games/${slug}/readme`} className="mt-4 inline-flex items-center gap-3 pm-micro text-cyan">Read full readme <ArrowRight className="size-4" /></Link>
      )}
    </TechPanel>
  );
}

function RoadmapPanel({ roadmap }: { roadmap: RoadmapItem[] }) {
  const unique = [...new Map(roadmap.map((item) => [item.title, item])).values()];
  const rows = unique.length
    ? unique.slice(0, 4).map((item, _index) => [
        item.targetDate ? new Date(item.targetDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'TBA',
        item.status,
        item.title,
        item.description ?? '',
        getRoadmapVisualState(item.status),
      ] as const)
    : fallbackRoadmap;

  return (
    <TechPanel title="Roadmap" className="h-full px-4 pb-5 pt-4">
      <div className="mt-1 border-t border-border/42 pt-3">
        <div className="relative pl-[30px] before:absolute before:bottom-[42px] before:left-[11px] before:top-[17px] before:w-px before:bg-cyan before:shadow-[0_0_12px_rgb(62_231_255_/_0.75)]">
        {rows.map(([date, phase, title, body, state]) => (
          <div
            key={`${date}-${phase}`}
            className="relative grid min-h-[54px] grid-cols-[84px_1fr] gap-3 border-b border-border/32 py-2.5 last:min-h-[58px]"
          >
            <RoadmapNode state={state} />
            <span className={`pm-micro pt-0.5 leading-[1.45] ${state === 'active' ? 'text-cyan' : 'text-[#9aa0a5]'}`}>
              <span className="block text-[0.72rem]">{date}</span>
              <span className="block text-[0.68rem]">{phase}</span>
            </span>
            <span className="border-l border-border-bright/50 pl-4 text-[0.79rem] leading-[1.55] text-[#a8adb0]">
              <span className="block text-[#d3d7d8]">{title}</span>
              <span className="block">{body}</span>
            </span>
            </div>
          ))}
        </div>
      </div>
    </TechPanel>
  );
}

function RoadmapNode({ state }: { state: string }) {
  if (state === 'locked') {
    return (
      <span className="absolute -left-[31px] top-[13px] grid size-[24px] place-items-center text-[#9aa0a5]">
        <Lock className="size-[18px] stroke-[2.4]" />
      </span>
    );
  }

  if (state === 'active') {
    return (
      <span className="absolute -left-[31px] top-[13px] grid size-[24px] place-items-center rounded-full border-2 border-cyan bg-background shadow-[0_0_14px_rgb(62_231_255_/_0.75)]">
        <span className="size-[10px] rounded-full bg-cyan shadow-[0_0_10px_rgb(62_231_255_/_0.9)]" />
      </span>
    );
  }

  return (
    <span className="absolute -left-[31px] top-[13px] grid size-[24px] place-items-center rounded-full border border-success bg-success/20 text-success shadow-[0_0_16px_rgb(112_255_155_/_0.75)]">
      <span className="grid size-[18px] place-items-center rounded-full bg-[#02070b]">
        <Check className="size-[15px] stroke-[3]" />
      </span>
    </span>
  );
}

function DevlogsPanel({ devlogs, slug }: { devlogs: Devlog[]; slug: string }) {
  const items = devlogs.slice(0, 3);

  return (
    <TechPanel title="Latest Devlogs" action="View all" actionHref={`/games/${slug}/devlogs`} className="h-full">
      <div className="space-y-3">
        {items.map((dl) => (
          <Link
            key={dl.id}
            href={`/devlogs/${dl.id}`}
            className="group block clip-corner border border-border/60 bg-[#050b0f]/60 p-3 transition hover:border-cyan/60"
          >
            <div className="flex gap-3">
              {dl.screenshots && dl.screenshots.length > 0 ? (
                <div className="size-12 shrink-0 overflow-hidden rounded border border-border/40">
                  <img src={dl.screenshots[0]?.url ?? ''} alt={`${dl.title} screenshot`} className="size-full object-cover" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="font-mono text-xs font-bold text-foreground group-hover:text-cyan">{dl.title}</div>
                {dl.subtitle && <div className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{dl.subtitle}</div>}
                {dl.body && <div className="mt-0.5 text-[9px] text-muted-foreground line-clamp-2">{dl.body.replace(/[#*`_]/g, ' ').substring(0, 120)}...</div>}
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {dl.author && `by ${dl.author.displayName || dl.author.username} · `}
                  {dl.publishedAt ? new Date(dl.publishedAt).toLocaleDateString() : ''} · {dl.readingTimeMin || 1} min
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </TechPanel>
  );
}

function InfoLinksPanel({ game, slug }: { game: Game; slug: string }) {
  return (
    <HudPanel className="h-full p-4" accent="muted">
      <h2 className="text-sm mb-4 text-foreground">Quick Info</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
        <InfoField label="Developer" value={game.studio?.name ?? ''} />
        <InfoField label="Status" value={labelStatus(game.status)} />
        <InfoField label="Release" value={formatReleaseDate(game.releaseDate) || game.expectedReleaseText || 'TBA'} />
        <InfoField label="Price" value={game.isFree ? 'Free' : game.priceCents != null ? `${formatPrice(game.priceCents, game.currency)} (Coming Soon)` : ''} />
      </div>
      <Link href={`/games/${slug}`} className="mt-3 inline-flex items-center gap-3 text-sm text-cyan">View all details <ArrowRight className="size-4" /></Link>

      <div className="mt-4 border-t border-border pt-3">
        <h2 className="text-sm mb-3 text-foreground">External Links</h2>
        <div className="grid grid-cols-2 gap-2">
          {(game.platformLinks ?? []).slice(0, 6).map((p) => (
            <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="clip-corner flex h-7 cursor-pointer items-center gap-2 border border-border bg-background/55 px-3 text-xs text-muted-foreground transition hover:border-cyan hover:text-cyan">
              <Globe className="size-3.5" /> {p.label || p.platform}
            </a>
          ))}
          <Link href={`/dashboard/games/${slug}/press-kit`} className="clip-corner flex h-7 cursor-pointer items-center gap-2 border border-border bg-background/55 px-3 text-xs text-muted-foreground transition hover:border-cyan hover:text-cyan">
            <Clipboard className="size-3.5" /> Press Kit
          </Link>
          {game.studio?.slug && (
            <Link href={`/studios/${game.studio.slug}`} className="clip-corner flex h-7 cursor-pointer items-center gap-2 border border-border bg-background/55 px-3 text-xs text-muted-foreground transition hover:border-cyan hover:text-cyan">
              <CircleDollarSign className="size-3.5" /> Visit Studio
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <h2 className="mb-2 text-sm font-medium text-cyan">Embed this game</h2>
        <p className="mb-3 text-[11px] text-muted-foreground">Copy this snippet to embed a live card on your blog, site, or press page.</p>
        <button 
          type="button" 
          onClick={() => {
            const origin = typeof window !== 'undefined' ? window.location.origin : 'https://playmorrow.vercel.app';
            const code = `<iframe src="${origin}/embed/${slug}" width="100%" height="160" style="border:none;border-radius:8px;max-width:520px" title="${game.title} — Playmorrow"></iframe>`;
            navigator.clipboard.writeText(code).then(() => {
              const btn = document.activeElement as HTMLElement;
              if (btn) { 
                const orig = btn.innerText; 
                btn.innerText = '✓ Copied to clipboard'; 
                setTimeout(() => btn.innerText = orig, 1800); 
              }
            }).catch(() => alert('Copy failed — please copy manually'));
          }} 
          className="clip-corner flex h-10 w-full cursor-pointer items-center justify-center gap-2 border border-cyan bg-cyan/10 px-4 text-sm text-cyan transition hover:bg-cyan hover:text-background font-mono tracking-widest"
        >
          <Clipboard className="size-4" /> COPY EMBED CODE
        </button>
        <p className="mt-1.5 text-[10px] text-muted-foreground">Works on any site that allows iframes. Updates automatically.</p>
      </div>
    </HudPanel>
  );
}

function CommunityPanel({ slug }: { slug: string }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: commentsData, isLoading } = useGameComments(slug);
  const createComment = useCreateGameComment(slug);
  const reactToComment = useReactToGameComment();
  const removeReaction = useRemoveGameCommentReaction();
  const [newComment, setNewComment] = useState('');

  const comments = (commentsData?.items ?? []) as GameCommentItem[];
  const total = commentsData?.total ?? 0;

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    await createComment.mutateAsync(newComment.trim());
    setNewComment('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleLike = (comment: GameCommentItem) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const hasLiked = comment.viewerReactions?.includes('LIKE') ?? false;
    if (hasLiked) {
      removeReaction.mutate({ commentId: comment.id, type: 'LIKE' });
    } else {
      reactToComment.mutate({ commentId: comment.id, type: 'LIKE' });
    }

  };

  return (
    <HudPanel className="p-4" accent="muted">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm mb-3 text-foreground">Community Discussion</h2>
        {total > 0 && (
          <Link href={`/games/${slug}/comments`} className="pm-micro text-coral">View all <ArrowRight className="inline size-3" /></Link>
        )}
      </div>
      {isLoading ? (
        <div className="grid gap-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse gap-3">
              <div className="size-7 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-8 w-full rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No comments yet. Be the first to join the conversation.
        </p>
      ) : (
        <div className="grid gap-2.5">
          {(comments ?? []).map((comment) => {
            const author = comment.author ?? { displayName: '?', avatarUrl: null };
            return (
            <div key={comment.id} className="grid grid-cols-[32px_1fr_auto] gap-3">
              {author.avatarUrl ? (
                <img src={author.avatarUrl} alt={`${author.displayName}'s avatar`} className="size-7 rounded-full object-cover" />
              ) : (
                <span className="grid size-7 place-items-center rounded-full bg-muted text-xs text-foreground">
                  {author.displayName.slice(0, 1)}
                </span>
              )}
              <span className="min-w-0 text-[11px] text-muted-foreground">
                <span className="font-mono font-bold text-foreground">{author.displayName}</span>{' '}
                <span className="ml-2">{timeAgo(comment.createdAt)}</span>
                <span className="block leading-5">{comment.body}</span>
              </span>
              <button type="button" onClick={(e) => { e.stopPropagation(); handleLike(comment); }} style={{ pointerEvents: 'auto', zIndex: 10, position: 'relative' }} className="flex cursor-pointer items-start gap-1 text-xs text-muted-foreground hover:text-coral shrink-0 pt-0.5">
                <Heart className={`size-3.5 ${comment.viewerReactions?.includes('LIKE') ? 'fill-coral text-coral' : ''}`} />
                {comment.reactions?.LIKE ?? 0}
              </button>
            </div>
          );
          })}
        </div>
      )}
      {isAuthenticated ? (
        <div className="mt-3 flex h-8 w-full items-center border border-border bg-background/55">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Join the conversation..."
            className="h-full flex-1 bg-transparent px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label="Join the conversation"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newComment.trim() || createComment.isPending}
            className="grid size-8 cursor-pointer place-items-center text-cyan hover:text-cyan/80 disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="mt-3 flex h-8 w-full cursor-pointer items-center justify-between border border-border bg-background/55 px-4 text-sm text-muted-foreground"
        >
          Sign in to join the conversation <Send className="size-4 text-cyan" />
        </button>
      )}
    </HudPanel>
  );
}

function TechPanel({
  title,
  action,
  actionHref,
  children,
  className,
  id,
}: {
  title: string;
  action?: string;
  actionHref?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <HudPanel id={id} className={`p-4 ${className ?? ''}`} accent="muted">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-sm text-foreground">{title}</h2>
        {action && (
          actionHref ? (
            <Link href={actionHref} className="pm-micro cursor-pointer text-coral">{action} <ArrowRight className="inline size-3" /></Link>
          ) : (
            <button type="button" className="pm-micro cursor-pointer text-coral">{action} <ArrowRight className="inline size-3" /></button>
          )
        )}
      </div>
      {children}
    </HudPanel>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="pm-micro text-muted-foreground">{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </>
  );
}

function HeroStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex min-h-[66px] items-center gap-[14px] border-r border-border/60 px-7 last:border-r-0 sm:px-8">
      <span className="grid size-8 shrink-0 place-items-center text-foreground">{icon}</span>
      <span className="pt-[2px]">
        <span className="block font-mono text-[1.25rem] font-bold leading-none tracking-[0.03em] text-foreground">{value}</span>
        <span className="block pt-[5px] font-mono text-[0.52rem] font-bold uppercase leading-none tracking-[0.22em] text-[#8d969b]">{label}</span>
      </span>
    </div>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 42 32" className="size-[30px] text-cyan" aria-hidden="true">
      <path
        d="M3 18h7l3-8 5 17 6-24 5 19 3-8h7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function labelStatus(status: string) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRoadmapVisualState(status: string) {
  const normalized = status.toUpperCase();
  if (['DONE', 'COMPLETED', 'COMPLETE', 'SHIPPED', 'RELEASED'].includes(normalized)) return 'done';
  if (['IN_PROGRESS', 'IN PROGRESS', 'ACTIVE', 'BETA', 'ALPHA'].includes(normalized)) return 'active';
  return 'locked';
}

function getDemoHref(game: Game) {
  const demoGame = game as GameWithDemoSettings;
  if (demoGame.demoAvailable === false) return null;

  const directDemoUrl = demoGame.demoUrl ?? demoGame.playDemoUrl ?? demoGame.playtestUrl;
  if (directDemoUrl) return directDemoUrl;

  const platformDemo = game.platformLinks?.find((link) => {
    const searchable = `${link.platform} ${link.label ?? ''} ${link.url}`.toLowerCase();
    return searchable.includes('demo') || searchable.includes('playtest');
  });

  return platformDemo?.url ?? null;
}

function formatReleaseDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'TBA';
  const d = new Date(dateStr);
  if (isNaN(d.getTime()) || d.getFullYear() < 2020) return 'TBA';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function ManageDropdown({ slug }: { slug: string }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [changingCover, setChangingCover] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setChangingCover(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'include' });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      await fetch(`/api/games/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ coverUrl: data.url }),
      });
      window.location.reload();
    } catch {
      alert('Cover change failed.');
    }
    setChangingCover(false);
    setOpen(false);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="clip-corner-sm inline-flex items-center gap-2 border border-coral/50 bg-coral/10 px-3 py-1.5 pm-micro text-coral hover:bg-coral hover:text-coral-foreground transition cursor-pointer"
      >
        <Pencil className="size-3" /> Manage
      </button>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={handleCoverUpload} className="hidden" />
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] border border-border/80 bg-background shadow-xl">
          <Link
            href={`/dashboard/games/${slug}`}
            className="block px-4 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground hover:bg-cyan/10 hover:text-cyan transition"
          >
            Edit game
          </Link>
          <button
            type="button"
            disabled={changingCover}
            onClick={() => { fileRef.current?.click(); setOpen(false); }}
            className="block w-full cursor-pointer px-4 py-2.5 text-left font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground hover:bg-cyan/10 hover:text-cyan transition disabled:opacity-50"
          >
            {changingCover ? 'Uploading...' : 'Change game cover'}
          </button>
        </div>
      )}
    </div>
  );
}
