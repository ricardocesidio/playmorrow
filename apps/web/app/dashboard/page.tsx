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

  if (user.accountType === 'PLAYER') {
    return <PlayerDashboard />;
  }

  return <StudioDashboard />;
}
