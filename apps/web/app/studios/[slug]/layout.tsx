import type { Metadata } from 'next';

const API = process.env.API_URL || 'https://playmorrow-api-production.up.railway.app/api';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API}/studios/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Studio Not Found · Playmorrow' };
    const studio = await res.json();
    return {
      title: `${studio.name} · Playmorrow`,
      description: studio.tagline || studio.description?.slice(0, 160) || `${studio.name} on Playmorrow`,
      openGraph: {
        title: studio.name,
        description: studio.tagline || studio.description?.slice(0, 160),
        images: studio.logoUrl ? [studio.logoUrl] : [],
      },
    };
  } catch {
    return { title: 'Studio · Playmorrow' };
  }
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
