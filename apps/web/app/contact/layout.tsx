import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Playmorrow team — support, press, partnerships, and general inquiries.',
  openGraph: {
    title: 'Contact · Playmorrow',
    description: 'Get in touch with the Playmorrow team — support, press, partnerships, and general inquiries.',
    images: '/og-image.svg',
  },
  twitter: {
    images: '/og-image.svg',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
