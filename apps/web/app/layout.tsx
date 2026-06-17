import type { Metadata } from 'next';

import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: "Playmorrow — Discover tomorrow's indie games today",
    template: '%s · Playmorrow',
  },
  description:
    'Playmorrow is a curated social platform where indie studios showcase their games, share devlogs, publish roadmaps, grow communities, and connect with players, press, and publishers.',
  metadataBase: new URL('https://playmorrow.example'),
  openGraph: {
    title: "Playmorrow — Discover tomorrow's indie games today",
    description: 'The social discovery layer for indie games.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
