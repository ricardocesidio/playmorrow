import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Status',
  description: 'Check the current operational status of Playmorrow services.',
  openGraph: {
    title: 'System Status · Playmorrow',
    description: 'Check the current operational status of Playmorrow services.',
  },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
