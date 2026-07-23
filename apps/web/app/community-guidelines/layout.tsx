import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Guidelines',
  description: 'Our community guidelines for maintaining a welcoming and respectful space on Playmorrow.',
  openGraph: {
    title: 'Community Guidelines · Playmorrow',
    description: 'Our community guidelines for maintaining a welcoming and respectful space on Playmorrow.',
    images: '/og-image.svg',
  },
  twitter: {
    images: '/og-image.svg',
  },
  alternates: {
    canonical: '/community-guidelines',
  },
};

export default function CommunityGuidelinesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
