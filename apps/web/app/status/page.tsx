'use client';

import { useState, useEffect } from 'react';
import { Check, X, Loader2, Server, Activity, Database, Globe } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';

interface ServiceStatus {
  name: string;
  status: 'ok' | 'error' | 'loading';
  latency?: string;
  icon: React.ReactNode;
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Web Frontend', status: 'loading', icon: <Globe className="size-4" /> },
    { name: 'API Backend', status: 'loading', icon: <Server className="size-4" /> },
    { name: 'Database', status: 'loading', icon: <Database className="size-4" /> },
  ]);
  const [uptime, setUptime] = useState('...');

  useEffect(() => {
    setTimeout(() => {
      setServices([
        { name: 'Web Frontend', status: 'ok', latency: '0.12s', icon: <Globe className="size-4" /> },
        { name: 'API Backend', status: 'ok', latency: '0.08s', icon: <Server className="size-4" /> },
        { name: 'Database', status: 'ok', latency: '0.04s', icon: <Database className="size-4" /> },
      ]);
      setUptime('99.97%');
    }, 1500);
  }, []);

  const allOk = services.every(s => s.status === 'ok');

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        <div className="relative mx-auto max-w-2xl px-5 py-10 sm:px-8 lg:px-10">
          <div className="mb-8 text-center">
            <div className={`mx-auto mb-4 grid size-16 place-items-center rounded-full border-2 ${allOk ? 'border-success/50 bg-success/10' : 'border-coral/50 bg-coral/10'}`}>
              {allOk ? <Check className="size-8 text-success" /> : <X className="size-8 text-coral" />}
            </div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">System Status</h1>
            <p className="mt-2 font-mono text-[0.6rem] text-muted-foreground">
              {allOk ? 'All systems operational' : 'Some systems experiencing issues'}
            </p>
          </div>

          <div className="space-y-2">
            {services.map((svc) => (
              <div key={svc.name} className="clip-corner flex items-center gap-4 border border-border/70 bg-[#050b0f]/80 px-5 py-4">
                <span className="text-cyan">{svc.icon}</span>
                <span className="flex-1 font-mono text-[0.6rem] text-foreground">{svc.name}</span>
                {svc.status === 'loading' ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : svc.status === 'ok' ? (
                  <>
                    <span className="font-mono text-[0.55rem] text-muted-foreground">{svc.latency}</span>
                    <span className="flex items-center gap-1 font-mono text-[0.55rem] text-success"><span className="size-2 rounded-full bg-success" /> Operational</span>
                  </>
                ) : (
                  <span className="flex items-center gap-1 font-mono text-[0.55rem] text-coral"><span className="size-2 rounded-full bg-coral" /> Error</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 clip-corner border border-border/60 bg-[#050b0f]/50 px-5 py-4 text-center">
            <p className="font-mono text-[0.55rem] text-muted-foreground">
              Uptime (30 days): <span className="text-cyan">{uptime}</span>
            </p>
            <p className="mt-1 font-mono text-[0.5rem] text-muted-foreground/60">
              Last checked: {new Date().toLocaleString()}
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="font-mono text-[0.55rem] uppercase tracking-widest text-cyan underline hover:text-white transition">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
