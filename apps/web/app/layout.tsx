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
        <Providers>
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_-10%,oklch(0.62_0.214_286_/_0.25),transparent_70%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
