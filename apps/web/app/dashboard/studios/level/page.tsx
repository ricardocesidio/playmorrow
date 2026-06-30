'use client';

import Link from 'next/link';
import { ArrowLeft, Award, TrendingUp, Heart, Star, Code, Crown, Shield, Zap, Timer } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';

const XP_TABLE = [
  { category: 'Profile', icon: <Award className="size-4" />, actions: [
    { action: 'Complete studio profile (all 7 fields)', xp: 40, freq: 'One-time' },
  ]},
  { category: 'Content', icon: <Code className="size-4" />, actions: [
    { action: 'Create a game', xp: 50, freq: 'Per game' },
    { action: 'Publish a devlog', xp: 25, freq: 'Per devlog' },
    { action: 'Update roadmap (add item)', xp: 15, freq: 'Per item' },
    { action: 'Set up press kit', xp: 40, freq: 'One-time' },
    { action: 'Add platform link', xp: 10, freq: 'Per link' },
    { action: 'Upload screenshot/media', xp: 10, freq: 'Per media item' },
  ]},
  { category: 'Community', icon: <Heart className="size-4" />, actions: [
    { action: 'Receive a follower', xp: 5, freq: 'Per follower' },
    { action: 'Receive a game wishlist', xp: 3, freq: 'Per wishlist' },
    { action: 'Receive a comment', xp: 5, freq: 'Per comment' },
    { action: 'Receive a reaction', xp: 3, freq: 'Per reaction' },
  ]},
  { category: 'Milestones', icon: <Star className="size-4" />, actions: [
    { action: 'Game reaches BETA', xp: 50, freq: 'Per game' },
    { action: 'Game reaches RELEASED', xp: 100, freq: 'Per game' },
    { action: 'Studio reaches 100 followers', xp: 25, freq: 'One-time' },
    { action: 'Studio reaches 500 followers', xp: 50, freq: 'One-time' },
    { action: 'Game reaches 100 wishlists', xp: 30, freq: 'One-time' },
    { action: 'Game reaches 1,000 wishlists', xp: 75, freq: 'One-time' },
  ]},
];

const LEVEL_TABLE = [
  { level: 1, totalXp: 0, nextXp: 100, title: 'Rising' },
  { level: 5, totalXp: 1000, nextXp: 500, title: 'Active' },
  { level: 10, totalXp: 4500, nextXp: 1000, title: 'Active' },
  { level: 15, totalXp: 10500, nextXp: 1500, title: 'Professional' },
  { level: 20, totalXp: 19000, nextXp: 2000, title: 'Professional' },
  { level: 25, totalXp: 30000, nextXp: 2500, title: 'Renowned' },
  { level: 30, totalXp: 43500, nextXp: 3000, title: 'Renowned' },
  { level: 40, totalXp: 78000, nextXp: 4000, title: 'Legendary' },
  { level: 50, totalXp: 122500, nextXp: 5000, title: 'Legendary' },
];

const TITLE_RANGES = [
  { min: 1, max: 5, title: 'Rising', icon: <Zap className="size-5" />, color: 'text-cyan', desc: 'Fresh on the scene — just getting started.' },
  { min: 6, max: 15, title: 'Active', icon: <TrendingUp className="size-5" />, color: 'text-emerald', desc: 'Building presence — actively developing and engaging.' },
  { min: 16, max: 30, title: 'Professional', icon: <Shield className="size-5" />, color: 'text-violet', desc: 'Established operation — multiple games, strong community.' },
  { min: 31, max: 45, title: 'Renowned', icon: <Crown className="size-5" />, color: 'text-amber', desc: 'Industry respected — significant releases and following.' },
  { min: 46, max: 50, title: 'Legendary', icon: <Star className="size-5" />, color: 'text-rose', desc: 'Top tier — the best of the best on Playmorrow.' },
];

export default function StudioLevelPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
            <ArrowLeft className="size-3" /> Back to dashboard
          </Link>

          <div className="mb-10">
            <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white">Studio Level System</h1>
            <p className="mt-3 max-w-2xl font-mono text-[0.72rem] leading-relaxed text-muted-foreground">
              Level up your studio by creating content, engaging the community, and reaching milestones.
              Higher levels unlock credibility signals that help attract players, press, and publishing partners.
            </p>
          </div>

          {/* Title Tiers */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">Title Tiers</h2>
            <div className="grid gap-3 sm:grid-cols-5">
              {TITLE_RANGES.map(tier => (
                <div key={tier.title} className="clip-corner border border-border/70 bg-[#050b0f]/80 p-4 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
                  <div className={`mx-auto mb-2 ${tier.color}`}>{tier.icon}</div>
                  <p className={`font-display text-sm font-bold ${tier.color}`}>{tier.title}</p>
                  <p className="mt-0.5 font-mono text-[0.55rem] text-muted-foreground">Lv.{tier.min}–{tier.max}</p>
                  <p className="mt-1.5 font-mono text-[0.55rem] text-muted-foreground leading-relaxed">{tier.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How XP Is Earned */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">How XP Is Earned</h2>
            <div className="space-y-4">
              {XP_TABLE.map(group => (
                <div key={group.category} className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
                  <div className="mb-3 flex items-center gap-2 border-b border-border/60 pb-2">
                    <span className="text-cyan">{group.icon}</span>
                    <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">{group.category}</h3>
                  </div>
                  <div className="space-y-1.5">
                    {group.actions.map(a => (
                      <div key={a.action} className="flex items-center justify-between font-mono text-[0.6rem]">
                        <span className="text-foreground">{a.action}</span>
                        <span className="text-cyan">+{a.xp} XP <span className="text-muted-foreground">({a.freq})</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Anti-Abuse */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">Fair Play Rules</h2>
            <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Timer className="mt-0.5 size-4 shrink-0 text-coral" />
                  <div>
                    <p className="font-mono text-[0.62rem] font-semibold text-foreground">Daily Cap</p>
                    <p className="font-mono text-[0.58rem] text-muted-foreground">Community XP (follows, wishlists, comments, reactions) is capped at 200 XP per 24-hour rolling window to prevent farming.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="mt-0.5 size-4 shrink-0 text-coral" />
                  <div>
                    <p className="font-mono text-[0.62rem] font-semibold text-foreground">No Self-XP</p>
                    <p className="font-mono text-[0.58rem] text-muted-foreground">Following your own studio, commenting on your own content, or wishlisting your own games gives 0 XP.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="mt-0.5 size-4 shrink-0 text-coral" />
                  <div>
                    <p className="font-mono text-[0.62rem] font-semibold text-foreground">One-Time Only</p>
                    <p className="font-mono text-[0.58rem] text-muted-foreground">Profile completion, press kit setup, and platform links give XP only once — no repeats for edits.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Level Table */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">Level Thresholds</h2>
            <div className="clip-corner overflow-hidden border border-border/70 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
              <table className="w-full font-mono text-[0.6rem]">
                <thead>
                  <tr className="border-b border-border/60 bg-[#050b0f]">
                    <th className="px-4 py-3 text-left text-cyan uppercase tracking-wider">Level</th>
                    <th className="px-4 py-3 text-left text-cyan uppercase tracking-wider">Total XP</th>
                    <th className="px-4 py-3 text-left text-cyan uppercase tracking-wider">XP to Next</th>
                    <th className="px-4 py-3 text-left text-cyan uppercase tracking-wider">Title</th>
                  </tr>
                </thead>
                <tbody>
                  {LEVEL_TABLE.map(row => (
                    <tr key={row.level} className="border-b border-border/40 bg-[#050b0f]/50">
                      <td className="px-4 py-2.5 font-semibold text-cyan">{row.level}</td>
                      <td className="px-4 py-2.5 text-foreground">{row.totalXp.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.nextXp.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-foreground">{row.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Level Up Benefits */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">What Levels Unlock</h2>
            <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border border-border/50 bg-background/30 p-4">
                  <p className="font-mono text-[0.65rem] font-semibold text-cyan">Level 5+</p>
                  <p className="mt-1 font-mono text-[0.58rem] text-muted-foreground">Title changes from "Rising" to "Active" — visible on your studio profile.</p>
                </div>
                <div className="border border-border/50 bg-background/30 p-4">
                  <p className="font-mono text-[0.65rem] font-semibold text-cyan">Level 16+</p>
                  <p className="mt-1 font-mono text-[0.58rem] text-muted-foreground">"Professional" title — signals established operation to visitors.</p>
                </div>
                <div className="border border-border/50 bg-background/30 p-4">
                  <p className="font-mono text-[0.65rem] font-semibold text-cyan">Level 31+</p>
                  <p className="mt-1 font-mono text-[0.58rem] text-muted-foreground">"Renowned" title — sets you apart as an industry-recognized studio.</p>
                </div>
                <div className="border border-border/50 bg-background/30 p-4">
                  <p className="font-mono text-[0.65rem] font-semibold text-cyan">Level 46+</p>
                  <p className="mt-1 font-mono text-[0.58rem] text-muted-foreground">"Legendary" title — the highest tier, reserved for the most accomplished studios.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Clean State Note */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">Starting Fresh</h2>
            <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
              <p className="font-mono text-[0.6rem] leading-relaxed text-muted-foreground">
                Every new studio starts at <span className="text-cyan">Level 1</span> with <span className="text-cyan">0 XP</span>.
                No followers, no games, no devlogs — a completely clean slate.
                Start by completing your studio profile, then create your first game to begin earning XP.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
