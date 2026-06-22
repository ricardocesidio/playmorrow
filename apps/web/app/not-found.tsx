import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <span className="font-mono text-6xl font-black text-coral">404</span>
      <h1 className="mt-4 font-display text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or was removed.</p>
      <Link href="/" className="mt-6 border border-coral bg-coral/10 px-6 py-2 font-mono text-xs uppercase tracking-widest text-coral transition-colors hover:bg-coral hover:text-coral-foreground">
        Back to home
      </Link>
    </div>
  );
}
