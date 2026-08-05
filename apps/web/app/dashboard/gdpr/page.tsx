'use client';

import { useState } from 'react';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { HudPanel } from '@/components/playmorrow/hud';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { api } from '@/lib/api/client';

export default function GdprPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Record<string, unknown>>('/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playmorrow-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="mt-4 font-display text-2xl font-black uppercase text-foreground">GDPR Data Export</h1>
          </div>

          <HudPanel className="mx-auto max-w-lg p-8 text-center">
            <Download className="mx-auto mb-4 size-12 text-cyan" aria-hidden />
            <h2 className="font-display text-lg font-bold text-foreground">Export My Data</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Under GDPR Article 15, you have the right to access your personal data.
              Click below to download all data Playmorrow holds about you.
            </p>

            {error && (
              <p className="mt-4 text-sm text-coral" role="alert">{error}</p>
            )}

            <Button
              className="mt-6"
              onClick={handleExport}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  Export My Data
                </>
              )}
            </Button>
          </HudPanel>
        </div>
      </main>
    </>
  );
}
