import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono, Inter } from 'next/font/google';

import './globals.css';
import { Providers } from './providers';
import { CookieConsent } from '@/components/cookie-consent';

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const body = Inter({
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://playmorrow.example'),
  icons: {
    icon: '/favicon.svg',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${mono.variable} ${body.variable}`}>
      <body className="min-h-screen bg-background font-body text-foreground antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            {children}
            <CookieConsent />
          </div>
        </Providers>
      </body>
    </html>
  );
}
