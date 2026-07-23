import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Games',
  description: 'Discover indie games in development. Browse by genre, status, and popularity. Follow your favorite studios and track game progress.',
  openGraph: {
    title: 'Browse Games · Playmorrow',
    description: 'Discover indie games in development.',
    images: '/og-image.svg',
  },
  twitter: {
    images: '/og-image.svg',
  },
  alternates: {
    canonical: '/games',
  },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
