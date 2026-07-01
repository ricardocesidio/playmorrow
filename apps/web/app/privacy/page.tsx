'use client';

import Link from 'next/link';

import { SiteHeader } from '@/components/site-header';

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-[#020609] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <SiteHeader />

      <div className="relative px-5 sm:px-8 lg:px-10">

        <main className="relative z-10 mx-auto mt-8 max-w-3xl pb-16">
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-6 sm:p-8 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <div className="mb-8 rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
              <strong>Draft:</strong> This is a draft. Legal review is required before production.
            </div>

            <h1 className="font-display font-black uppercase tracking-tight text-white text-2xl sm:text-3xl">Privacy Policy</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
              <p>
                PlayMorrow respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>

              <h2 className="font-display text-base text-foreground">1. Information We Collect</h2>
              <p>
                We collect information you provide directly, such as your name, email address, username, and profile information. We also collect usage data, including pages visited, features used, and interactions with content.
              </p>

              <h2 className="font-display text-base text-foreground">2. How We Use Your Information</h2>
              <p>
                We use your information to operate and improve PlayMorrow, personalize your experience, send communications (with your consent), enforce our Terms, and comply with legal obligations.
              </p>

              <h2 className="font-display text-base text-foreground">3. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to maintain session state, analyze usage, and deliver personalized content. You can control cookie preferences through your browser settings.
              </p>

              <h2 className="font-display text-base text-foreground">4. Data Sharing</h2>
              <p>
                We do not sell your personal information. We may share data with trusted service providers who help us operate the platform, and as required by law. Where allowed, we may share limited information with partners for marketing and advertising based on your preferences.
              </p>

              <h2 className="font-display text-base text-foreground">5. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide the service. You may request deletion of your account and associated data at any time.
              </p>

              <h2 className="font-display text-base text-foreground">6. Security</h2>
              <p>
                We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure.
              </p>

              <h2 className="font-display text-base text-foreground">7. Children&apos;s Privacy</h2>
              <p>
                PlayMorrow is not directed at children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such data, we will delete it.
              </p>

              <h2 className="font-display text-base text-foreground">8. Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal data. You may also opt out of marketing communications at any time. Contact us at support@playmorrow.com to exercise your rights.
              </p>

              <h2 className="font-display text-base text-foreground">9. Policy Updates</h2>
              <p>
                We may update this Privacy Policy from time to time. Material changes will be communicated via email or platform notice.
              </p>

              <h2 className="font-display text-base text-foreground">10. Contact</h2>
              <p>
                For questions about this Privacy Policy, please contact us at support@playmorrow.com.
              </p>
            </div>

            <div className="mt-10 border-t border-border pt-6">
              <Link href="/register" className="text-sm text-cyan hover:text-cyan/80 underline underline-offset-2">
                &larr; Back to registration
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
