import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Devlogs · Playmorrow',
  description: 'Read development updates from indie game studios.',
};

export default function DevlogsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
