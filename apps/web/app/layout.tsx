import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';

import './globals.css';
import { Providers } from './providers';
import { CookieConsent } from '@/components/cookie-consent';
import { Analytics } from '@/components/analytics';
import { BackToTop } from '@/components/back-to-top';
import { SiteFooter } from '@/components/site-footer';


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
    images: '/og-image.svg',
  },
  openGraph: {
    title: 'Playmorrow — Discover tomorrow\'s indie games today',
    description: 'The social discovery layer for indie games.',
    type: 'website',
    images: '/og-image.svg',
    siteName: 'Playmorrow',
  },
  alternates: {
    canonical: '/',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Playmorrow',
              url: 'https://playmorrow.vercel.app',
              description: 'Discover tomorrow\'s indie games today. Playmorrow is a curated social platform where indie studios showcase their games.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://playmorrow.vercel.app/search?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <Providers>
          <div className="relative flex min-h-screen flex-col z-10">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-cyan focus:rounded">
              Skip to main content
            </a>
            <div id="main-content" />
            {children}
            <SiteFooter />
            <CookieConsent />
            <Analytics />
            <BackToTop />
          </div>
        </Providers>
      </body>
    </html>
  );
}
