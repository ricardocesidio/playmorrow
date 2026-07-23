'use client';

import { Button } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <span className="font-mono text-sm uppercase tracking-widest text-coral">Error</span>
      <h1 className="mt-4 font-display text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message || 'An unexpected error occurred.'}</p>
      <Button onClick={reset} variant="destructive" className="mt-6">
        Try again
      </Button>
    </div>
  );
}
