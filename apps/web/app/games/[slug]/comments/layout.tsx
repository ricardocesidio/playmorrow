import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Game Comments — Playmorrow',
  description: 'Community discussion about this game.',
  alternates: { canonical: 'https://playmorrow.co/games' },
  openGraph: {
    title: 'Game Comments — Playmorrow',
    description: 'Community discussion about this game.',
    url: 'https://playmorrow.co/games',
    siteName: 'Playmorrow',
  },
  twitter: {
    card: 'summary',
    title: 'Game Comments — Playmorrow',
    description: 'Community discussion about this game.',
  },
};

export default function GameCommentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
