import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { Activity, CircleDot, Radio, Users } from 'lucide-react';

import { cn } from '@/lib/utils';

export function PlaymorrowMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-3 sm:gap-4', className)} aria-label="PLAYMORROW">
      <span className="relative block size-7 shrink-0 text-coral drop-shadow-[0_0_13px_rgb(255_87_77_/_0.4)] sm:size-8">
        <svg viewBox="0 0 40 40" aria-hidden className="size-full">
          <path
            fill="currentColor"
            d="M5 4h21.2L35 12.8v7.1L25.4 29.5H13.2V36H5V22.5h17l5.3-5.3v-1.7L22 10.2H5V4Z"
          />
          <path fill="#02070b" d="M5 14.2h14.5l3.5 3.5-3.5 3.5H5v-7Z" />
        </svg>
      </span>
      <span className="font-mono text-[0.95rem] font-semibold uppercase tracking-[0.3em] text-[#eef2f2] [text-shadow:0_0_12px_rgb(255_255_255_/_0.14)] sm:text-[1.05rem] sm:tracking-[0.42em]">
        PLAYMORROW
      </span>
    </span>
  );
}

export function HudLinkLogo() {
  return (
    <Link href="/" className="inline-flex items-center">
      <PlaymorrowMark />
    </Link>
  );
}

export function HudPanel({
  children,
  className,
  accent = 'cyan',
  ...props
}: ComponentProps<'div'> & { accent?: 'cyan' | 'coral' | 'muted' }) {
  const accentClass = {
    cyan: 'before:border-cyan/55 after:border-cyan/35',
    coral: 'before:border-coral/60 after:border-coral/45',
    muted: 'before:border-border-bright/60 after:border-border/80',
  }[accent];

  return (
    <div
      className={cn(
        'panel relative border-border/90 overflow-hidden',
        'before:pointer-events-none before:absolute before:left-3 before:top-3 before:size-8 before:border-l before:border-t before:z-10',
        'after:pointer-events-none after:absolute after:bottom-3 after:right-3 after:size-8 after:border-b after:border-r after:z-10',
        accentClass,
        className,
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function HexGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0',
        'bg-[conic-gradient(from_30deg_at_24px_0,transparent_60deg,rgb(62_231_255_/_0.03)_60deg_120deg,transparent_120deg_180deg,rgb(62_231_255_/_0.03)_180deg_240deg,transparent_240deg_300deg,rgb(62_231_255_/_0.03)_300deg_360deg),conic-gradient(from_90deg_at_0_24px,transparent_60deg,rgb(62_231_255_/_0.03)_60deg_120deg,transparent_120deg_180deg,rgb(62_231_255_/_0.03)_180deg_240deg,transparent_240deg_300deg,rgb(62_231_255_/_0.03)_300deg_360deg)]',
        'bg-[length:48px_48px]',
        className,
      )}
    />
  );
}

export function HudHoloPanel({
  children,
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'panel relative border border-border/80 overflow-hidden',
        'bg-[linear-gradient(135deg,rgb(62_231_255_/_0.06),rgb(166_92_255_/_0.04),rgb(255_87_77_/_0.03))]',
        'shadow-[0_20px_80px_rgb(0_0_0_/_0.6),0_0_30px_rgb(62_231_255_/_0.05),inset_0_1px_0_rgb(255_255_255_/_0.02)]',
        className,
      )}
      {...props}
    >
      <span className="signal-dot absolute right-3 top-3 z-20" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
export function CircuitFrame({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden opacity-70', className)}>
      <svg viewBox="0 0 1200 760" preserveAspectRatio="none" className="size-full">
        <defs>
          <filter id="pmGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d="M42 96h214l28 28h128l30-30h210l22 22h190l26-26h260" stroke="#24414b" strokeWidth="1" fill="none" />
        <path d="M82 606h248l28-28h136l22 22h194l24-24h234l34 34h126" stroke="#24414b" strokeWidth="1" fill="none" />
        <path d="M30 140v186l20 20v150l-18 18v118" stroke="#51666d" strokeWidth="1" fill="none" />
        <path d="M1162 118v176l-24 24v204l18 18v104" stroke="#51666d" strokeWidth="1" fill="none" />
        <path d="M368 134h70l26 26h62" stroke="#3ee7ff" strokeWidth="1.4" fill="none" filter="url(#pmGlow)" />
        <path d="M896 104h82l20 20h72" stroke="#ff574d" strokeWidth="1.2" fill="none" filter="url(#pmGlow)" />
        <path d="M360 608h96l26-26h72" stroke="#3ee7ff" strokeWidth="1.2" fill="none" filter="url(#pmGlow)" />
      </svg>
    </div>
  );
}

export function HudStatusRail({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-4 bottom-3 z-30 hidden items-center justify-between border-x border-border/70 px-5 py-2 text-muted-foreground lg:flex',
        className,
      )}
      aria-hidden
    >
      <div className="pm-micro flex items-center gap-3">
        <span>Signal strength</span>
        <span className="flex gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="h-2 w-1 bg-cyan shadow-[0_0_8px_rgb(62_231_255_/_0.6)]" />
          ))}
        </span>
      </div>
      <div className="pm-micro flex items-center gap-2">
        <span className="size-1.5 bg-success shadow-[0_0_10px_rgb(112_255_155_/_0.6)]" />
        Connected
      </div>
    </div>
  );
}



const collageTiles = [
  { src: '/playmorrow/neon-warden.png', alt: 'Neon Warden cyberpunk key art', className: 'left-0 top-0 h-[35%] w-[47%]' },
  { src: '/playmorrow/starfall-tactics.png', alt: 'Starfall Tactics space key art', className: 'right-0 top-[5%] h-[36%] w-[56%]' },
  { src: '/playmorrow/mossbound.png', alt: 'Mossbound forest key art', className: 'bottom-[4%] left-[22%] h-[34%] w-[44%]' },
  { src: '/playmorrow/paper-relics.png', alt: 'Paper Relics card game key art', className: 'bottom-[8%] right-[2%] h-[37%] w-[42%]' },
  { src: '/playmorrow/voidrunner.png', alt: 'Voidrunner speed key art', className: 'left-[5%] bottom-[30%] h-[28%] w-[25%]' },
] as const;

export function AuthArtCollage() {
  return (
    <section className="relative hidden min-h-[760px] overflow-hidden lg:block">
      <CircuitFrame />
      <div className="absolute inset-2">
        {collageTiles.map((tile) => (
          <div
            key={tile.src}
            className={cn('clip-corner absolute overflow-hidden border border-border/70 bg-muted shadow-2xl', tile.className)}
          >
            <img src={tile.src} alt={tile.alt} className="size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
          </div>
        ))}
      </div>
      <div className="absolute bottom-[34%] left-3 max-w-[520px]">
        <h1 className="font-display text-[3.4rem] font-black uppercase leading-[1.08] text-foreground drop-shadow-[0_8px_28px_rgb(0_0_0_/_0.8)] xl:text-[4.4rem]">
          Your next<br />signal is<br />waiting.
        </h1>
        <p className="mt-3 inline-block max-w-md text-lg leading-8 text-muted-foreground bg-background/20 backdrop-blur-sm rounded-lg px-4 py-2">
          Sign in to follow studios, track roadmaps, and join the conversation.
        </p>
      </div>
      <div className="absolute bottom-11 left-3 grid gap-6 rounded-xl bg-background/15 p-4 backdrop-blur-[2px]">
        <SignalBenefit icon={<Radio className="size-8" />} title="Follow studios" body="See what they're building." />
        <SignalBenefit icon={<Activity className="size-8" />} title="Track roadmaps" body="Never miss what's next." />
        <SignalBenefit icon={<Users className="size-8" />} title="Join the conversation" body="Connect with the community." />
      </div>
    </section>
  );
}

function SignalBenefit({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="grid grid-cols-[48px_1fr] items-center gap-5">
      <span className="grid size-12 place-items-center text-cyan drop-shadow-[0_0_14px_rgb(62_231_255_/_0.5)]">
        {icon}
      </span>
      <span>
        <span className="block text-base text-foreground">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{body}</span>
      </span>
    </div>
  );
}

export function LiveSignal({ label = 'Live Feed' }: { label?: string }) {
  return (
    <span className="pm-micro inline-flex items-center gap-2 text-cyan">
      <CircleDot className="size-3 fill-coral text-coral drop-shadow-[0_0_10px_rgb(255_87_77_/_0.7)]" />
      {label}
    </span>
  );
}
