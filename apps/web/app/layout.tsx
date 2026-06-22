import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono, Inter } from 'next/font/google';

import './globals.css';
import { Providers } from './providers';

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
  metadataBase: new URL('https://playmorrow.example'),
  icons: {
    icon: '/favicon.svg',
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
          </div>
        </Providers>
      </body>
    </html>
  );
}
