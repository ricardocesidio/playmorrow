import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'Top players ranked by XP and achievements on Playmorrow.',
  openGraph: {
    title: 'Leaderboard · Playmorrow',
    description: 'Top players ranked by XP and achievements on Playmorrow.',
    images: '/og-image.svg',
  },
  twitter: {
    images: '/og-image.svg',
  },
  alternates: {
    canonical: '/leaderboard',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
