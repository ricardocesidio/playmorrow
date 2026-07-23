import type { Metadata } from 'next';

const API = process.env.API_URL || 'https://playmorrow-api-production.up.railway.app/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://playmorrow.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API}/devlogs/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Devlog Not Found · Playmorrow' };
    const devlog = await res.json();
    const screenshotUrl = devlog.screenshots?.[0]?.url;
    const ogImage = screenshotUrl || '/og-image.svg';
    return {
      title: `${devlog.title} · Playmorrow`,
      description: devlog.excerpt || devlog.body?.slice(0, 160) || 'Read this devlog on Playmorrow',
      openGraph: {
        title: devlog.title,
        description: devlog.excerpt || '',
        images: [ogImage],
      },
    };
  } catch {
    return { title: 'Devlog · Playmorrow' };
  }
}

export default async function DevlogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let devlog: { title: string; excerpt: string | null; body: string | null; screenshots: { url: string }[]; game: { title: string; slug: string } } | null = null;
  try {
    const res = await fetch(`${API}/devlogs/${id}`, { next: { revalidate: 3600 } });
    if (res.ok) devlog = await res.json();
  } catch {
    // swallow
  }

  return (
    <>
      {devlog && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: devlog.title,
              description: devlog.excerpt || devlog.body?.slice(0, 200) || '',
              image: devlog.screenshots?.[0]?.url || `${SITE_URL}/og-image.svg`,
              url: `${SITE_URL}/devlogs/${id}`,
            }),
          }}
        />
      )}
      {children}
    </>
  );
}
