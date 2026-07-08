import type { Metadata } from 'next';

const API = process.env.API_URL || 'http://localhost:4000/api';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API}/devlogs/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Devlog Not Found · Playmorrow' };
    const devlog = await res.json();
    return {
      title: `${devlog.title} · Playmorrow`,
      description: devlog.excerpt || devlog.body?.slice(0, 160) || 'Read this devlog on Playmorrow',
      openGraph: {
        title: devlog.title,
        description: devlog.excerpt || '',
      },
    };
  } catch {
    return { title: 'Devlog · Playmorrow' };
  }
}

export default function DevlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
