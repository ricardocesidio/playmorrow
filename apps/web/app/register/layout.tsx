import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create an Account',
  description: 'Create a Playmorrow account to follow games, track wishlists, and connect with indie studios.',
  openGraph: {
    title: 'Create an Account · Playmorrow',
    description: 'Create a Playmorrow account to follow games, track wishlists, and connect with indie studios.',
    images: '/og-image.svg',
  },
  twitter: {
    images: '/og-image.svg',
  },
  alternates: {
    canonical: '/register',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
