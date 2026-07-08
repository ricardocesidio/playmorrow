import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';

import './globals.css';
import { Providers } from './providers';
import { CookieConsent } from '@/components/cookie-consent';
import { BackToTop } from '@/components/back-to-top';
import { CursorGlow } from '@/components/cursor-glow';

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Playmorrow — Discover tomorrow\'s indie games today',
    template: '%s · Playmorrow',
  },
  description:
    'Playmorrow is a curated social platform where indie studios showcase their games, share devlogs, publish roadmaps, grow communities, and connect with players, press, and publishers.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://playmorrow.vercel.app'),
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Playmorrow — Discover tomorrow\'s indie games today',
    description: 'The social discovery layer for indie games.',
  },
  openGraph: {
    title: 'Playmorrow — Discover tomorrow\'s indie games today',
    description: 'The social discovery layer for indie games.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-black font-body text-foreground antialiased">
        <CursorGlow />
        <Providers>
          <div className="relative flex min-h-screen flex-col z-10">
            {children}
            <CookieConsent />
            <BackToTop />
          </div>
        </Providers>
      </body>
    </html>
  );
}
