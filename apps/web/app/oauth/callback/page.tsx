'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { SiteHeader } from '@/components/site-header';

function OAuthCallbackInner() {
  const router = useRouter();

  useEffect(() => {
    // Capture CSRF token from query param and set it as a frontend-domain cookie
    const params = new URLSearchParams(window.location.search);
    const csrfToken = params.get('csrf');
    if (csrfToken) {
      document.cookie = `playmorrow_csrf=${csrfToken}; path=/; max-age=86400; SameSite=Lax`;
    }
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="size-6 animate-spin border border-cyan border-t-transparent" />
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="size-6 animate-spin border border-cyan border-t-transparent" /></div>}>
        <OAuthCallbackInner />
      </Suspense>
    </>
  );
}
