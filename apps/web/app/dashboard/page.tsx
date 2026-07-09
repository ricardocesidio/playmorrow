'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { PlayerDashboard } from '@/components/dashboard/PlayerDashboard';
import { StudioDashboard } from '@/components/dashboard/StudioDashboard';
import { useAuth } from '@/lib/api/auth-context';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && !user.isOnboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  // Clear visual distinction between player and studio modes (UX audit item)
  const isStudio = user.accountType === 'STUDIO';

  return (
    <div>
      <div className="border-b border-border/60 bg-[#050b0f]/80 px-5 py-2 text-xs font-mono tracking-widest text-muted-foreground flex flex-wrap gap-2 items-center">
        {isStudio ? (
          <>STUDIO DASHBOARD — Managing your studio(s) and games</>
        ) : (
          <>PLAYER DASHBOARD — Your activity, XP, wishlist and following</>
        )}
        <span className="ml-3 text-cyan/70">·</span>
        <a href="/settings/profile" className="ml-2 underline hover:text-cyan">Settings</a>
        {!isStudio && (
          <>
            <span className="ml-2">·</span>
            <a href="/me/wishlist" className="ml-2 underline hover:text-cyan">Wishlist</a>
            <a href="/me/following" className="ml-2 underline hover:text-cyan">Following</a>
            <a href="/dashboard/level" className="ml-2 underline hover:text-cyan">Level &amp; XP</a>
          </>
        )}
        {isStudio && (
          <>
            <span className="ml-2">·</span>
            <a href="/dashboard/studios" className="ml-2 underline hover:text-cyan">My Studios</a>
            <a href="/dashboard/games" className="ml-2 underline hover:text-cyan">Games</a>
            <a href="/dashboard/devlogs" className="ml-2 underline hover:text-cyan">Devlogs</a>
          </>
        )}
      </div>

      {isStudio ? <StudioDashboard /> : <PlayerDashboard />}
    </div>
  );
}
