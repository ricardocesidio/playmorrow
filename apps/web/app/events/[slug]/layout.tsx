import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Event — Playmorrow',
  description: 'View event details on Playmorrow.',
  alternates: { canonical: 'https://playmorrow.co/events' },
};

export default function EventDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
