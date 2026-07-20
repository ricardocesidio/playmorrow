'use client';

import Link from 'next/link';
import { PlayerDashboard } from '@/components/dashboard/PlayerDashboard';
import { StudioDashboard } from '@/components/dashboard/StudioDashboard';
import { useAuth } from '@/lib/api/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  // Clear visual distinction between player and studio modes (UX audit item)
  const isStudio = user.accountType === 'STUDIO';

  return (
    <div>
      <div className="border-b border-border/60 bg-[#050b0f]/80 px-5 py-2 text-xs font-mono tracking-widest text-muted-foreground flex flex-wrap gap-2 items-center" role="navigation" aria-label="Dashboard quick navigation">
        {isStudio ? (
          <>STUDIO DASHBOARD — Managing your studio(s) and games</>
        ) : (
          <>PLAYER DASHBOARD — Your activity, XP, wishlist and following</>
        )}
        <span className="ml-3 text-cyan/70">·</span>
        <Link href="/settings/profile" className="ml-2 underline hover:text-cyan">Settings</Link>
        {!isStudio && (
          <>
            <span className="ml-2">·</span>
            <Link href="/me/wishlist" className="ml-2 underline hover:text-cyan" aria-label="View your wishlist">Wishlist</Link>
            <Link href="/me/following" className="ml-2 underline hover:text-cyan" aria-label="View who you follow">Following</Link>
            <Link href="/dashboard/level" className="ml-2 underline hover:text-cyan" aria-label="View level and XP">Level &amp; XP</Link>
          </>
        )}
        {isStudio && (
          <>
            <span className="ml-2">·</span>
            <Link href="/studios" className="ml-2 underline hover:text-cyan" aria-label="Browse studios">Browse Studios</Link>
            <Link href="/dashboard/games" className="ml-2 underline hover:text-cyan" aria-label="Manage games">Games</Link>
            <Link href="/dashboard/devlogs" className="ml-2 underline hover:text-cyan" aria-label="Manage devlogs">Devlogs</Link>
            <Link href="/dashboard/studios/level" className="ml-2 underline hover:text-cyan" aria-label="View studio level and XP">Studio Level</Link>
          </>
        )}
      </div>

      {isStudio ? <StudioDashboard /> : <PlayerDashboard />}
    </div>
  );
}
