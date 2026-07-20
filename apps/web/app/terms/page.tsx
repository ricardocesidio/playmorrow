'use client';

import Link from 'next/link';

import { SiteHeader } from '@/components/site-header';

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-[#020609] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <SiteHeader />

      <div className="relative px-5 sm:px-8 lg:px-10">

        <main className="relative z-10 mx-auto mt-8 max-w-3xl pb-16">
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-6 sm:p-8 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h1 className="font-display font-black uppercase tracking-tight text-white text-2xl sm:text-3xl">Terms of Service</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
              <p>
                Welcome to PlayMorrow. By accessing or using our platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.
              </p>

              <h2 className="font-display text-base text-foreground">1. Acceptance of Terms</h2>
              <p>
                By creating an account, accessing, or using PlayMorrow, you acknowledge that you have read, understood, and agree to be bound by these Terms, our Privacy Policy, and our Community Guidelines.
              </p>

              <h2 className="font-display text-base text-foreground">2. Eligibility</h2>
              <p>
                You must be at least 13 years of age to use PlayMorrow. If you are between 13 and 18, you represent that a parent or guardian has reviewed and agreed to these Terms on your behalf. You must not be located in a country subject to a U.S. government embargo.
              </p>

              <h2 className="font-display text-base text-foreground">3. Account Registration</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to provide accurate and complete information during registration and to keep your information current.
              </p>

              <h2 className="font-display text-base text-foreground">4. User Content</h2>
              <p>
                You retain ownership of any content you submit to PlayMorrow. By submitting content, you grant PlayMorrow a non-exclusive, royalty-free, worldwide license to display, distribute, and promote your content on the platform.
              </p>

              <h2 className="font-display text-base text-foreground">5. Prohibited Conduct</h2>
              <p>
                You agree not to use PlayMorrow for any unlawful purpose, to harass or abuse others, to impersonate any person or entity, to distribute malware, to scrape data, or to engage in any activity that disrupts the platform.
              </p>

              <h2 className="font-display text-base text-foreground">6. Termination</h2>
              <p>
                We reserve the right to suspend or terminate accounts that violate these Terms or engage in harmful behavior. You may delete your account at any time through your account settings.
              </p>

              <h2 className="font-display text-base text-foreground">7. Limitation of Liability</h2>
              <p>
                PlayMorrow is provided &quot;as is&quot; without warranties of any kind. To the fullest extent permitted by law, PlayMorrow shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
              </p>

              <h2 className="font-display text-base text-foreground">8. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. Continued use of PlayMorrow after changes constitutes acceptance of the new Terms.
              </p>

              <h2 className="font-display text-base text-foreground">9. Contact</h2>
              <p>
                For questions about these Terms, please contact us at support@playmorrow.com.
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
