import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Listing — Playmorrow',
  description: 'View marketplace listing details on Playmorrow.',
  alternates: { canonical: 'https://playmorrow.co/marketplace' },
};

export default function MarketplaceDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
