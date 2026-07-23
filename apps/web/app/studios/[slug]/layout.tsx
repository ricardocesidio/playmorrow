import type { Metadata } from 'next';

const API = process.env.API_URL || 'https://playmorrow-api-production.up.railway.app/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://playmorrow.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API}/studios/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Studio Not Found · Playmorrow' };
    const studio = await res.json();
    const ogImage = studio.logoUrl || '/og-image.svg';
    return {
      title: `${studio.name} · Playmorrow`,
      description: studio.tagline || studio.description?.slice(0, 160) || `${studio.name} on Playmorrow`,
      openGraph: {
        title: studio.name,
        description: studio.tagline || studio.description?.slice(0, 160),
        images: [ogImage],
      },
    };
  } catch {
    return { title: 'Studio · Playmorrow' };
  }
}

export default async function StudioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let studio: { name: string; slug: string; tagline: string | null; description: string | null; logoUrl: string | null } | null = null;
  try {
    const res = await fetch(`${API}/studios/${slug}`, { next: { revalidate: 3600 } });
    if (res.ok) studio = await res.json();
  } catch {
    // swallow
  }

  return (
    <>
      {studio && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: studio.name,
              description: studio.tagline || studio.description?.slice(0, 200) || '',
              image: studio.logoUrl || `${SITE_URL}/og-image.svg`,
              url: `${SITE_URL}/studios/${studio.slug}`,
            }),
          }}
        />
      )}
      {children}
    </>
  );
}
