'use client';

import Link from 'next/link';
import { ArrowLeft, Award, TrendingUp, Heart, Star, MessageSquare, Zap } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';

const XP_TABLE = [
  { category: 'Engagement', icon: <Heart className="size-4" />, actions: [
    { action: 'Follow a studio', xp: 5, freq: 'Per follow' },
    { action: 'Follow a game', xp: 3, freq: 'Per follow' },
    { action: 'Wishlist a game', xp: 5, freq: 'Per wishlist' },
  ]},
  { category: 'Interaction', icon: <MessageSquare className="size-4" />, actions: [
    { action: 'Post a comment', xp: 10, freq: 'Per comment' },
    { action: 'React to content', xp: 3, freq: 'Per reaction' },
  ]},
  { category: 'Activity', icon: <Zap className="size-4" />, actions: [
    { action: 'Daily login', xp: 2, freq: 'Per day' },
    { action: 'Complete your profile', xp: 25, freq: 'One-time' },
  ]},
];

const LEVEL_TABLE = [
  { level: 1, totalXp: 0, nextXp: 100, title: 'Newcomer' },
  { level: 5, totalXp: 1000, nextXp: 500, title: 'Regular' },
  { level: 10, totalXp: 4500, nextXp: 1000, title: 'Enthusiast' },
  { level: 15, totalXp: 10500, nextXp: 1500, title: 'Supporter' },
  { level: 20, totalXp: 19000, nextXp: 2000, title: 'Loyalist' },
  { level: 25, totalXp: 30000, nextXp: 2500, title: 'Veteran' },
  { level: 30, totalXp: 43500, nextXp: 3000, title: 'Elite' },
  { level: 40, totalXp: 78000, nextXp: 4000, title: 'Master' },
  { level: 50, totalXp: 122500, nextXp: 5000, title: 'Legend' },
];

const TITLE_RANGES = [
  { min: 1, max: 5, title: 'Newcomer', icon: <Zap className="size-5" />, color: 'text-cyan', desc: 'Just getting started — exploring the platform.' },
  { min: 6, max: 15, title: 'Regular', icon: <TrendingUp className="size-5" />, color: 'text-emerald', desc: 'Building your presence — following and engaging.' },
  { min: 16, max: 30, title: 'Supporter', icon: <Star className="size-5" />, color: 'text-violet', desc: 'Active community member — wishlisting and commenting.' },
  { min: 31, max: 45, title: 'Veteran', icon: <Award className="size-5" />, color: 'text-amber', desc: 'Seasoned player — deeply engaged with the community.' },
  { min: 46, max: 50, title: 'Legend', icon: <Star className="size-5" />, color: 'text-rose', desc: 'Top tier — the most dedicated players on Playmorrow.' },
];

export default function PlayerLevelPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
            <ArrowLeft className="size-3" /> Back to dashboard
          </Link>

          <div className="mb-10">
            <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white">Player Level System</h1>
            <p className="mt-3 max-w-2xl font-mono text-[0.72rem] leading-relaxed text-muted-foreground">
              Level up your player profile by following studios and games, wishlisting titles,
              commenting, and staying active. Higher levels unlock prestige and recognition across the platform.
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
                  <p className="mt-0.5 font-mono text-[0.55rem] text-muted-foreground">Lv.{tier.min}&ndash;{tier.max}</p>
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

          {/* Daily Login Streak Bonus */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">Daily Login Streak Bonus</h2>
            <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
              <p className="font-mono text-[0.6rem] leading-relaxed text-muted-foreground">
                Each consecutive day you log in, your daily login XP reward increases:
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-5">
                <div className="border border-border/50 bg-background/30 p-3 text-center">
                  <p className="font-mono text-[0.58rem] text-muted-foreground">Day 1&ndash;3</p>
                  <p className="mt-1 font-mono text-xs text-cyan">2 XP</p>
                </div>
                <div className="border border-border/50 bg-background/30 p-3 text-center">
                  <p className="font-mono text-[0.58rem] text-muted-foreground">Day 4&ndash;7</p>
                  <p className="mt-1 font-mono text-xs text-cyan">5 XP</p>
                </div>
                <div className="border border-border/50 bg-background/30 p-3 text-center">
                  <p className="font-mono text-[0.58rem] text-muted-foreground">Day 8&ndash;14</p>
                  <p className="mt-1 font-mono text-xs text-cyan">10 XP</p>
                </div>
                <div className="border border-border/50 bg-background/30 p-3 text-center">
                  <p className="font-mono text-[0.58rem] text-muted-foreground">Day 15&ndash;30</p>
                  <p className="mt-1 font-mono text-xs text-cyan">15 XP</p>
                </div>
                <div className="border border-border/50 bg-background/30 p-3 text-center">
                  <p className="font-mono text-[0.58rem] text-muted-foreground">Day 31+</p>
                  <p className="mt-1 font-mono text-xs text-cyan">25 XP</p>
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
                  <p className="mt-1 font-mono text-[0.58rem] text-muted-foreground">Title changes from "Newcomer" to "Regular" — visible on your profile.</p>
                </div>
                <div className="border border-border/50 bg-background/30 p-4">
                  <p className="font-mono text-[0.65rem] font-semibold text-cyan">Level 16+</p>
                  <p className="mt-1 font-mono text-[0.58rem] text-muted-foreground">"Supporter" title — recognized as an active community member.</p>
                </div>
                <div className="border border-border/50 bg-background/30 p-4">
                  <p className="font-mono text-[0.65rem] font-semibold text-cyan">Level 31+</p>
                  <p className="mt-1 font-mono text-[0.58rem] text-muted-foreground">"Veteran" title — respected player status across the platform.</p>
                </div>
                <div className="border border-border/50 bg-background/30 p-4">
                  <p className="font-mono text-[0.65rem] font-semibold text-cyan">Level 46+</p>
                  <p className="mt-1 font-mono text-[0.58rem] text-muted-foreground">"Legend" title — the highest tier, for the most dedicated players.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Clean State Note */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">Starting Fresh</h2>
            <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
              <p className="font-mono text-[0.6rem] leading-relaxed text-muted-foreground">
                Every new player starts at <span className="text-cyan">Level 1</span> with <span className="text-cyan">0 XP</span>.
                No follows, no wishlists, no comments — a completely clean slate.
                Start by completing your profile, then follow studios and games to begin earning XP.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
