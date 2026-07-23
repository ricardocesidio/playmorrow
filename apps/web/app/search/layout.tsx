import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search for indie games, studios, devlogs, and more on Playmorrow.',
  openGraph: {
    title: 'Search · Playmorrow',
    description: 'Search for indie games, studios, devlogs, and more on Playmorrow.',
    images: '/og-image.svg',
  },
  twitter: {
    images: '/og-image.svg',
  },
  alternates: {
    canonical: '/search',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
