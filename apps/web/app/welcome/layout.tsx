import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome',
  description: 'Welcome to Playmorrow — your hub for discovering indie games and following their development.',
  openGraph: {
    title: 'Welcome · Playmorrow',
    description: 'Welcome to Playmorrow — your hub for discovering indie games and following their development.',
    images: '/og-image.svg',
  },
  twitter: {
    images: '/og-image.svg',
  },
  alternates: {
    canonical: '/welcome',
  },
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
