import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Learn about how Playmorrow uses cookies and your privacy choices.',
  openGraph: {
    title: 'Cookie Policy · Playmorrow',
    description: 'Learn about how Playmorrow uses cookies and your privacy choices.',
  },
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
