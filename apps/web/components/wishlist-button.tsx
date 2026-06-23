'use client';

import { Heart } from 'lucide-react';
import { useAuth } from '@/lib/api/auth-context';
import { useGameWishlistStatus, useAddGameToWishlist, useRemoveGameFromWishlist } from '@/lib/api/hooks';

export function WishlistButton({ slug }: { slug: string }) {
  const { isAuthenticated } = useAuth();
  const { data: status } = useGameWishlistStatus(slug);
  const addWishlist = useAddGameToWishlist();
  const removeWishlist = useRemoveGameFromWishlist();

  const isWishlisted = status?.isWishlisted ?? false;

  const handleClick = () => {
    if (isWishlisted) {
      removeWishlist.mutate({ slug });
    } else {
      addWishlist.mutate({ slug });
    }
  };

  if (!isAuthenticated) {
    return (
      <a
        href="/login"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground/60 transition-colors hover:text-coral"
      >
        <Heart className="size-3" />
        Sign in to wishlist
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={addWishlist.isPending || removeWishlist.isPending}
      className={`inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer ${
        isWishlisted ? 'text-coral' : 'text-muted-foreground/60 hover:text-coral'
      }`}
    >
      <Heart className={`size-3 ${isWishlisted ? 'fill-coral' : ''}`} />
      {isWishlisted ? 'Wishlisted' : 'Add to wishlist'}
    </button>
  );
}
