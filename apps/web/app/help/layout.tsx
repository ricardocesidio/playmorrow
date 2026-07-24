import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Browse guides, tutorials, and documentation for Playmorrow.',
  openGraph: {
    title: 'Help Center · Playmorrow',
    description: 'Browse guides, tutorials, and documentation for Playmorrow.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    title: 'Help Center · Playmorrow',
    description: 'Browse guides, tutorials, and documentation for Playmorrow.',
    images: ['/og-image.svg'],
  },
  alternates: { canonical: '/help' },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
