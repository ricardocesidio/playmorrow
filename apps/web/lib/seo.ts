export function buildMetadata(title: string, description: string, path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://playmorrow.vercel.app';
  return {
    title: `${title} · Playmorrow`,
    description,
    openGraph: {
      title: `${title} · Playmorrow`,
      description,
      url: `${baseUrl}${path}`,
      siteName: 'Playmorrow',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · Playmorrow`,
      description,
    },
    alternates: { canonical: `${baseUrl}${path}` },
  };
}
