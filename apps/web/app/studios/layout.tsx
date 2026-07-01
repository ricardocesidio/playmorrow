import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studios',
  description: 'Discover indie game studios. Browse studio profiles, their games, devlogs, and roadmaps.',
  openGraph: {
    title: 'Studios · Playmorrow',
    description: 'Discover indie game studios.',
  },
};

export default function StudiosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
