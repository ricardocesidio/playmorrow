export interface CollectionDef {
  slug: string;
  label: string;
  description: string;
  filter: Record<string, any>;
  sort?: string;
}

export const COLLECTIONS: CollectionDef[] = [
  {
    slug: 'top-wishlisted',
    label: 'Top Wishlisted',
    description: 'The most wishlisted indie games on Playmorrow.',
    filter: { isPublished: true },
    sort: 'wishlistsCount_desc',
  },
  {
    slug: 'games-under-development',
    label: 'Games Under Development',
    description: 'Indie games actively being developed. Follow their journey.',
    filter: { isPublished: true, status: { in: ['IN_DEVELOPMENT', 'CONCEPT', 'PROTOTYPE'] } },
    sort: 'followersCount_desc',
  },
  {
    slug: 'free-to-play',
    label: 'Free to Play',
    description: 'Indie games you can play right now at no cost.',
    filter: { isPublished: true, isFree: true },
    sort: 'followersCount_desc',
  },
  {
    slug: 'from-verified-studios',
    label: 'From Verified Studios',
    description: 'Games from studios that have completed verification.',
    filter: { isPublished: true, studio: { verificationTier: { not: 'UNVERIFIED' } } },
    sort: 'followersCount_desc',
  },
  {
    slug: 'recently-released',
    label: 'Recently Released',
    description: 'Games that have just launched.',
    filter: { isPublished: true, status: 'RELEASED' },
    sort: 'releaseDate_desc',
  },
];

export function getCollection(slug: string): CollectionDef | undefined {
  return COLLECTIONS.find(c => c.slug === slug);
}
