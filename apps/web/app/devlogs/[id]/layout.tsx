import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Devlog — Playmorrow',
  description: 'Read game development updates on Playmorrow.',
  alternates: { canonical: 'https://playmorrow.co/devlogs' },
  openGraph: {
    title: 'Devlog — Playmorrow',
    description: 'Read game development updates on Playmorrow.',
    url: 'https://playmorrow.co/devlogs',
    siteName: 'Playmorrow',
  },
  twitter: {
    card: 'summary',
    title: 'Devlog — Playmorrow',
    description: 'Read game development updates on Playmorrow.',
  },
};

export default function DevlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
