import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Game — Playmorrow',
  description: 'View game details, devlogs, and community on Playmorrow.',
  alternates: { canonical: 'https://playmorrow.co/games' },
  openGraph: {
    title: 'Game — Playmorrow',
    description: 'View game details, devlogs, and community on Playmorrow.',
    url: 'https://playmorrow.co/games',
    siteName: 'Playmorrow',
  },
  twitter: {
    card: 'summary',
    title: 'Game — Playmorrow',
    description: 'View game details, devlogs, and community on Playmorrow.',
  },
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
