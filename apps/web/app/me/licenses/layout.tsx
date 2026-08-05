import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Licenses — Playmorrow',
  description: 'View your purchased marketplace licenses.',
};

export default function LicensesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
