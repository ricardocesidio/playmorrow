import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your Playmorrow account to follow games, track progress, and connect with studios.',
  openGraph: {
    title: 'Log In · Playmorrow',
    description: 'Log in to your Playmorrow account to follow games, track progress, and connect with studios.',
    images: '/og-image.svg',
  },
  twitter: {
    images: '/og-image.svg',
  },
  alternates: {
    canonical: '/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
