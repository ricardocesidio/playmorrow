import type { Metadata } from 'next';

const API = process.env.API_URL || 'https://playmorrow-api-aged-mountain-9542.fly.dev/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://playmorrow.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const label = tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    title: `${label} Games — Discover Indie Games | Playmorrow`,
    description: `Browse the best indie ${label.toLowerCase()} games on Playmorrow. Discover new releases, trending titles, and hidden gems.`,
    openGraph: {
      title: `${label} Games — Playmorrow`,
      description: `Discover indie ${label.toLowerCase()} games on Playmorrow.`,
      images: [`${SITE_URL}/og-image.svg`],
    },
  };
}

export default function TagLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
