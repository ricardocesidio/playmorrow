import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Articles',
  robots: { index: false, follow: false },
};

export default function DashboardHelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
