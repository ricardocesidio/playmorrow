import Link from 'next/link';
import { Crown, ArrowRight } from 'lucide-react';
import { GameCard } from '@/components/game-card';

export function HowItWorks() {
  return (
    <section className="relative border-t border-border/60 px-5 py-16 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <h2 className="mb-3 text-center font-display text-2xl font-black uppercase tracking-tight text-white">How it works</h2>
        <p className="mb-10 text-center font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">For players and studios</p>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="clip-corner border border-border/70 bg-[linear-gradient(135deg,rgb(62_231_255_/_0.05),rgb(166_92_255_/_0.03),rgb(255_87_77_/_0.02))] p-6 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3),0_0_16px_rgb(62_231_255_/_0.04)] hover:border-cyan/40 hover:shadow-[0_0_40px_rgb(0_0_0_/_0.4),0_0_24px_rgb(62_231_255_/_0.08)] transition-all duration-medium relative overflow-hidden">
            <div className="mx-auto grid size-14 place-items-center rounded-full border border-cyan/30 bg-cyan/5">
              <SearchIcon className="size-6 text-cyan" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-white">Discover</h3>
            <p className="mt-2 font-mono text-[0.55rem] leading-relaxed text-muted-foreground">
              Browse games in development, follow studios, and get real-time updates on progress.
            </p>
          </div>
          <div className="clip-corner border border-border/70 bg-[linear-gradient(135deg,rgb(62_231_255_/_0.05),rgb(166_92_255_/_0.03),rgb(255_87_77_/_0.02))] p-6 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3),0_0_16px_rgb(62_231_255_/_0.04)] hover:border-cyan/40 hover:shadow-[0_0_40px_rgb(0_0_0_/_0.4),0_0_24px_rgb(62_231_255_/_0.08)] transition-all duration-medium relative overflow-hidden">
            <div className="mx-auto grid size-14 place-items-center rounded-full border border-coral/30 bg-coral/5">
              <FollowingIcon className="size-6 text-coral" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-white">Follow</h3>
            <p className="mt-2 font-mono text-[0.55rem] leading-relaxed text-muted-foreground">
              Get notified of devlogs, roadmaps, milestones, and releases from studios you follow.
            </p>
          </div>
          <div className="clip-corner border border-border/70 bg-[linear-gradient(135deg,rgb(62_231_255_/_0.05),rgb(166_92_255_/_0.03),rgb(255_87_77_/_0.02))] p-6 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3),0_0_16px_rgb(62_231_255_/_0.04)] hover:border-cyan/40 hover:shadow-[0_0_40px_rgb(0_0_0_/_0.4),0_0_24px_rgb(62_231_255_/_0.08)] transition-all duration-medium relative overflow-hidden">
            <div className="mx-auto grid size-14 place-items-center rounded-full border border-amber/30 bg-amber/5">
              <EngageIcon className="size-6 text-amber" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-white">Engage</h3>
            <p className="mt-2 font-mono text-[0.55rem] leading-relaxed text-muted-foreground">
              Comment, react, wishlist, and play demos. Your feedback shapes the final game.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SearchIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function FollowingIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6" /><path d="M22 11h-6" />
    </svg>
  );
}

function EngageIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function CtaSection({ studioCount }: { studioCount: number }) {
  return (
    <section className="relative border-t border-border/60 px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px] text-center">
        <Crown className="mx-auto size-10 text-cyan" />
        <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-tight text-white">
          Ready to share your game?
        </h2>
        <p className="mt-3 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
          Join {studioCount}+ studios already building their audience on Playmorrow
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/register"
            className="clip-corner flex items-center gap-2 border border-cyan bg-cyan/10 px-8 py-3.5 font-mono text-[0.65rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
            Create your studio profile
          </Link>
          <Link href="/games"
            className="clip-corner flex items-center gap-2 border border-border/60 px-8 py-3.5 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
            Browse games <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
