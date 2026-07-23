import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the terms of service for using Playmorrow — the indie game discovery platform.',
  openGraph: {
    title: 'Terms of Service · Playmorrow',
    description: 'Read the terms of service for using Playmorrow — the indie game discovery platform.',
    images: '/og-image.svg',
  },
  twitter: {
    images: '/og-image.svg',
  },
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
