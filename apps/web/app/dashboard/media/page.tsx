'use client';

import Link from 'next/link';
import { Image, Upload, ArrowLeft } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';

export default function MediaPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-3 pb-8 pt-3 sm:px-5">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6">
            <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-wider text-cyan hover:text-white">
              <ArrowLeft className="size-3" /> Back to Dashboard
            </Link>
            <h1 className="mt-4 font-display text-2xl font-black uppercase text-foreground">Media Library</h1>
            <p className="mt-1 text-sm text-muted-foreground">Upload and manage screenshots, videos, and press assets for your games.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/dashboard/games"
              className="clip-corner flex flex-col items-center gap-4 border border-border/90 bg-[#050b0f]/86 p-12 text-center transition hover:-translate-y-0.5 hover:border-cyan/70"
            >
              <Image className="size-10 text-muted-foreground" />
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Game Screenshots</h2>
                <p className="mt-1 text-sm text-muted-foreground">Manage screenshots for each game via the game editor.</p>
              </div>
              <span className="inline-flex items-center gap-2 border border-cyan/60 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-wider text-cyan">
                Go to Games <Upload className="size-3" />
              </span>
            </Link>

            <div className="clip-corner flex flex-col items-center gap-4 border border-border/60 bg-[#050b0f]/50 p-12 text-center opacity-60">
              <Upload className="size-10 text-muted-foreground" />
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Press Kit Assets</h2>
                <p className="mt-1 text-sm text-muted-foreground">Upload logos, banners, and press assets for your studio.</p>
              </div>
              <span className="text-[0.55rem] font-mono uppercase tracking-wider text-muted-foreground">Coming Soon</span>
            </div>

            <div className="clip-corner flex flex-col items-center gap-4 border border-border/60 bg-[#050b0f]/50 p-12 text-center opacity-60">
              <Upload className="size-10 text-muted-foreground" />
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Video Trailers</h2>
                <p className="mt-1 text-sm text-muted-foreground">Upload and manage game trailers and gameplay videos.</p>
              </div>
              <span className="text-[0.55rem] font-mono uppercase tracking-wider text-muted-foreground">Coming Soon</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
