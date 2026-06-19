import type { ReactNode } from 'react';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

interface PageFrameProps {
  children: ReactNode;
  wide?: boolean;
}

export function PageFrame({ children, wide }: PageFrameProps) {
  return (
    <>
      <SiteHeader />
      <main className={`mx-auto flex-1 px-4 py-8 lg:px-6 lg:py-10 ${wide ? 'max-w-7xl' : 'max-w-5xl'}`}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
