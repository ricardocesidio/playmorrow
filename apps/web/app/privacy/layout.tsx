import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Playmorrow collects, uses, and protects your personal data.',
  openGraph: {
    title: 'Privacy Policy · Playmorrow',
    description: 'Learn how Playmorrow collects, uses, and protects your personal data.',
    images: '/og-image.svg',
  },
  twitter: {
    images: '/og-image.svg',
  },
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
