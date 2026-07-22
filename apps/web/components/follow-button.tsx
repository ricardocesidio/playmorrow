'use client';

import { useRouter } from 'next/navigation';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import {
  useStudioFollowStatus,
  useGameFollowStatus,
  useFollowStudio,
  useUnfollowStudio,
  useFollowGame,
  useUnfollowGame,
} from '@/lib/api/hooks';

interface FollowButtonProps {
  targetType: 'studio' | 'game';
  slug: string;
}

export function FollowButton({ targetType, slug }: FollowButtonProps) {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const isStudio = targetType === 'studio';

  const { data: status, isLoading: statusLoading } = isStudio
    ? useStudioFollowStatus(slug, token ?? undefined)
    : useGameFollowStatus(slug, token ?? undefined);

  const followMut = isStudio ? useFollowStudio() : useFollowGame();
  const unfollowMut = isStudio ? useUnfollowStudio() : useUnfollowGame();

  const isLoading = statusLoading || followMut.isPending || unfollowMut.isPending;
  const isFollowing = status?.isFollowing ?? false;
  const followerCount = status?.followerCount ?? 0;

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      if (isFollowing) {
        await unfollowMut.mutateAsync({ slug });
      } else {
        await followMut.mutateAsync({ slug });
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant={isFollowing ? 'outline' : 'default'}
        size="sm"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="size-4" />
        ) : (
          <UserPlus className="size-4" />
        )}
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
      <span className="text-sm text-muted-foreground">
        {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
      </span>
    </div>
  );
}
