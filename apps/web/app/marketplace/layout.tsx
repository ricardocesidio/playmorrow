import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace — Playmorrow',
  description: 'Buy and sell game assets, plugins, and services. Support indie developers.',
  alternates: { canonical: 'https://playmorrow.co/marketplace' },
  openGraph: {
    title: 'Marketplace — Playmorrow',
    description: 'Buy and sell game assets, plugins, and services.',
    url: 'https://playmorrow.co/marketplace',
    siteName: 'Playmorrow',
  },
  twitter: {
    card: 'summary',
    title: 'Marketplace — Playmorrow',
    description: 'Buy and sell game assets, plugins, and services.',
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
