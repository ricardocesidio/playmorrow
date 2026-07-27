'use client';

import { PlayerDashboard } from '@/components/dashboard/PlayerDashboard';
import { StudioDashboard } from '@/components/dashboard/StudioDashboard';
import { PersonalFeedSection } from '@/components/dashboard/PersonalFeedSection';
import { useAuth } from '@/lib/api/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  // Clear visual distinction between player and studio modes (UX audit item)
  const isStudio = user.accountType === 'STUDIO';

  return (
    <>
      {isStudio ? <StudioDashboard /> : <PlayerDashboard />}
      <div className="mx-auto max-w-5xl px-5 pb-8 sm:px-8 lg:px-10">
        <PersonalFeedSection />
      </div>
    </>
  );
}
