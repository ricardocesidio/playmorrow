'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OAuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken) {
      // Store tokens for legacy JWT auth (will be migrated to session-based OAuth)
      localStorage.setItem('playmorrow_token', accessToken);
      if (refreshToken) localStorage.setItem('playmorrow_refresh', refreshToken);
      router.replace('/dashboard');
    } else {
      setError('OAuth authentication failed');
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="border border-coral/30 bg-coral/5 p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-coral">Error</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <a href="/login" className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-cyan underline">Back to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="size-6 animate-spin border border-cyan border-t-transparent" />
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="size-6 animate-spin border border-cyan border-t-transparent" /></div>}>
      <OAuthCallbackInner />
    </Suspense>
  );
}
