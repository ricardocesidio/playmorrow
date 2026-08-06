import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studio — Playmorrow',
  description: 'View studio profile, games, and team on Playmorrow.',
  alternates: { canonical: 'https://playmorrow.co/studios' },
  openGraph: {
    title: 'Studio — Playmorrow',
    description: 'View studio profile, games, and team on Playmorrow.',
    url: 'https://playmorrow.co/studios',
    siteName: 'Playmorrow',
  },
  twitter: {
    card: 'summary',
    title: 'Studio — Playmorrow',
    description: 'View studio profile, games, and team on Playmorrow.',
  },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
