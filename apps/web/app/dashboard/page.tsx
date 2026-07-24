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

  return <>{isStudio ? <StudioDashboard /> : <PlayerDashboard />}</>;
}
