'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Cookie, BarChart3, Megaphone, Lock } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export default function CookiePolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        <div className="relative mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:px-10">
          <Link href="/" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
            <ArrowLeft className="size-3" /> Back to home
          </Link>

          <h1 className="mb-8 font-display text-4xl font-black uppercase tracking-tight text-white">Cookie Policy</h1>
          <p className="mb-8 font-mono text-[0.6rem] text-muted-foreground">Last updated: July 1, 2026</p>

          <div className="space-y-6">
            <Section icon={<Cookie className="size-5 text-cyan" />} title="What are cookies?">
              <p className="font-mono text-[0.6rem] leading-relaxed text-muted-foreground">
                Cookies are small text files stored on your device when you visit a website. They help the website function properly,
                remember your preferences, and provide anonymized analytics.
              </p>
            </Section>

            <Section icon={<Shield className="size-5 text-cyan" />} title="Essential cookies">
              <p className="font-mono text-[0.6rem] leading-relaxed text-muted-foreground">
                These cookies are necessary for the website to function and cannot be disabled. They include session cookies that keep you
                logged in, security cookies that protect against abuse, and preference cookies that remember your cookie consent choices.
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full font-mono text-[0.55rem]">
                  <thead><tr className="border-b border-border/60 text-left"><th className="pb-2 pr-4 text-cyan">Cookie</th><th className="pb-2 pr-4 text-cyan">Purpose</th><th className="pb-2 text-cyan">Duration</th></tr></thead>
                  <tbody>
                    <tr className="border-b border-border/30"><td className="py-2 pr-4 text-foreground">playmorrow_session</td><td className="py-2 pr-4 text-muted-foreground">Authentication session</td><td className="py-2 text-muted-foreground">7 days</td></tr>
                    <tr className="border-b border-border/30"><td className="py-2 pr-4 text-foreground">playmorrow-cookies</td><td className="py-2 pr-4 text-muted-foreground">Cookie consent preference</td><td className="py-2 text-muted-foreground">1 year</td></tr>
                  </tbody>
                </table>
              </div>
            </Section>

            <Section icon={<BarChart3 className="size-5 text-cyan" />} title="Analytics cookies">
              <p className="font-mono text-[0.6rem] leading-relaxed text-muted-foreground">
                These cookies help us understand how visitors interact with Playmorrow. We use this data to improve the platform,
                identify popular features, and fix bugs. All analytics data is anonymized and aggregated.
              </p>
              <p className="mt-2 font-mono text-[0.55rem] text-muted-foreground/60">
                Currently, Playmorrow does not use third-party analytics services. Anonymous usage data is collected internally.
              </p>
            </Section>

            <Section icon={<Megaphone className="size-5 text-cyan" />} title="Marketing cookies">
              <p className="font-mono text-[0.6rem] leading-relaxed text-muted-foreground">
                These cookies track your activity across Playmorrow to help us recommend relevant games and studios.
                Marketing cookies are only enabled with your explicit consent.
              </p>
            </Section>

            <Section icon={<Lock className="size-5 text-cyan" />} title="Your choices">
              <p className="font-mono text-[0.6rem] leading-relaxed text-muted-foreground">
                You can change your cookie preferences at any time by clicking the "Cookie Preferences" link in the footer.
                Essential cookies cannot be disabled as they are necessary for the platform to function.
              </p>
              <p className="mt-3 font-mono text-[0.55rem] text-muted-foreground/60">
                For more information about how we handle your data, please read our{' '}
                <Link href="/privacy" className="text-cyan underline">Privacy Policy</Link> and{' '}
                <Link href="/terms" className="text-cyan underline">Terms of Service</Link>.
              </p>
            </Section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_20px_rgb(0_0_0_/_0.25)]">
      <div className="mb-3 flex items-center gap-3 border-b border-border/50 pb-3">
        {icon}
        <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">{title}</h2>
      </div>
      {children}
    </div>
  );
}
