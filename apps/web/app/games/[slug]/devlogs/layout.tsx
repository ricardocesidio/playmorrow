import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Game Devlogs — Playmorrow',
  description: 'Development updates and progress logs.',
  alternates: { canonical: 'https://playmorrow.co/games' },
  openGraph: {
    title: 'Game Devlogs — Playmorrow',
    description: 'Development updates and progress logs.',
    url: 'https://playmorrow.co/games',
    siteName: 'Playmorrow',
  },
  twitter: {
    card: 'summary',
    title: 'Game Devlogs — Playmorrow',
    description: 'Development updates and progress logs.',
  },
};

export default function GameDevlogsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
