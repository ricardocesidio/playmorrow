'use client';

import Link from 'next/link';
import { ArrowLeft, Trophy, Award, Lock, Loader2, Shield, Crosshair, Bookmark, Compass, UserCheck, Zap, MessageSquare } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useAchievements } from '@/lib/api/hooks';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  crosshair: Crosshair,
  bookmark: Bookmark,
  'message-square': MessageSquare,
  compass: Compass,
  'user-check': UserCheck,
  zap: Zap,
  shield: Shield,
  award: Award,
};

export default function AchievementsPage() {
  const { user } = useAuth();
  const { data: achievements, isLoading } = useAchievements();

  if (!user) return null;

  const unlocked = achievements?.filter((a) => a.unlocked) ?? [];
  const locked = achievements?.filter((a) => !a.unlocked) ?? [];

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-3 pb-8 pt-3 sm:px-5">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6">
            <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-wider text-cyan hover:text-white">
              <ArrowLeft className="size-3" /> Back to Dashboard
            </Link>
            <h1 className="mt-4 font-display text-2xl font-black uppercase text-foreground">Achievements</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {unlocked.length} / {achievements?.length ?? 0} unlocked · Level {user.level ?? 1} · {user.xp ?? 0} XP
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-cyan" />
            </div>
          ) : !achievements || achievements.length === 0 ? (
            <div className="clip-corner flex flex-col items-center gap-4 border border-border/90 bg-[#050b0f]/86 p-12 text-center">
              <Trophy className="size-12 text-muted-foreground" />
              <h2 className="font-display text-xl font-bold text-foreground">No achievements yet</h2>
              <p className="text-sm text-muted-foreground">Start engaging with the community to earn achievements and XP.</p>
              <Link href="/dashboard/level" className="clip-corner inline-flex items-center gap-2 border border-cyan/60 px-5 py-3 font-mono text-xs uppercase tracking-widest text-cyan">
                View Level &amp; XP <ArrowLeft className="size-4 rotate-180" />
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {unlocked.length > 0 && (
                <div>
                  <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-success">Unlocked</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {unlocked.map((a) => {
                      const Icon = ICON_MAP[a.icon] ?? Trophy;
                      return (
                        <div key={a.id} className="clip-corner border border-cyan/40 bg-cyan/5 p-4 shadow-[0_0_12px_rgb(62_231_255_/_0.15)]">
                          <div className="flex items-center gap-3">
                            <Icon className="size-6 text-cyan" />
                            <div>
                              <p className="font-display text-base font-bold text-foreground">{a.name}</p>
                              <p className="text-sm text-muted-foreground">{a.desc}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2 font-mono text-[0.58rem] text-cyan">
                            <Zap className="size-3" /> +{a.xpReward} XP
                            {a.unlockedAt && <span className="text-muted-foreground">· {new Date(a.unlockedAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {locked.length > 0 && (
                <div>
                  <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">Locked</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {locked.map((a) => {
                      const Icon = ICON_MAP[a.icon] ?? Trophy;
                      return (
                        <div key={a.id} className="clip-corner border border-border/60 bg-[#050b0f]/40 p-4 opacity-60">
                          <div className="flex items-center gap-3">
                            <Lock className="size-5 text-muted-foreground shrink-0" />
                            <Icon className="size-5 text-muted-foreground shrink-0" />
                            <div>
                              <p className="font-display text-base font-bold text-muted-foreground">{a.name}</p>
                              <p className="text-sm text-muted-foreground">{a.desc}</p>
                            </div>
                          </div>
                          <div className="mt-3 font-mono text-[0.58rem] text-muted-foreground">
                            <Zap className="inline size-3" /> +{a.xpReward} XP on unlock
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
