import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password — Playmorrow',
  description: 'Reset your Playmorrow account password.',
  alternates: { canonical: 'https://playmorrow.co/forgot-password' },
  openGraph: {
    title: 'Forgot Password — Playmorrow',
    description: 'Reset your Playmorrow account password.',
    url: 'https://playmorrow.co/forgot-password',
    siteName: 'Playmorrow',
  },
  twitter: {
    card: 'summary',
    title: 'Forgot Password — Playmorrow',
    description: 'Reset your Playmorrow account password.',
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
