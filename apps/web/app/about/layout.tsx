import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Playmorrow — the game discovery platform connecting players with indie studios.',
  openGraph: {
    title: 'About · Playmorrow',
    description: 'Learn about Playmorrow — the game discovery platform connecting players with indie studios.',
    images: '/og-image.svg',
  },
  twitter: {
    images: '/og-image.svg',
  },
  alternates: {
    canonical: '/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
