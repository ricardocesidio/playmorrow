import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events — Playmorrow',
  description: 'Game jams, showcases, and community events for indie game developers.',
  alternates: { canonical: 'https://playmorrow.co/events' },
  openGraph: {
    title: 'Events — Playmorrow',
    description: 'Game jams, showcases, and community events.',
    url: 'https://playmorrow.co/events',
    siteName: 'Playmorrow',
  },
  twitter: {
    card: 'summary',
    title: 'Events — Playmorrow',
    description: 'Game jams, showcases, and community events.',
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
