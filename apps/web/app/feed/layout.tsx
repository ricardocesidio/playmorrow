import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Feed',
  description: 'Real-time feed of devlogs, roadmaps, and updates from indie game studios.',
  openGraph: {
    title: 'Live Feed · Playmorrow',
    description: 'Real-time feed of devlogs, roadmaps, and updates from indie game studios.',
    images: '/og-image.svg',
  },
  twitter: {
    images: '/og-image.svg',
  },
  alternates: {
    canonical: '/feed',
  },
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
