import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { HudLinkLogo } from '@/components/playmorrow/hud';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-5 pb-16 text-foreground sm:px-8 lg:px-10">
      <header className="relative z-10 mx-auto flex h-20 max-w-[1500px] items-center justify-between">
        <HudLinkLogo />
        <nav className="hidden items-center gap-14 text-sm text-muted-foreground md:flex" aria-label="Main navigation">
          <Link href="/games" className="hover:text-cyan">Games</Link>
          <Link href="/studios" className="hover:text-cyan">Studios</Link>
          <Link href="/feed" className="hover:text-cyan">Live Feed</Link>
        </nav>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-cyan">Sign in</Link>
          <Link
            href="/register"
            className="clip-corner hidden border border-coral bg-coral px-6 py-3 pm-display text-xs text-coral-foreground shadow-[0_0_24px_rgb(255_87_77_/_0.25)] sm:inline-flex"
          >
            Share your game <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto mt-8 max-w-3xl">
        <div className="rounded-lg border border-border bg-elevated/50 p-8 sm:p-12">
          <div className="mb-8 rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
            <strong>Draft:</strong> This is a draft. Legal review is required before production.
          </div>

          <h1 className="pm-display text-2xl sm:text-3xl">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <p>
              Welcome to PlayMorrow. By accessing or using our platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.
            </p>

            <h2 className="pm-display text-base text-foreground">1. Acceptance of Terms</h2>
            <p>
              By creating an account, accessing, or using PlayMorrow, you acknowledge that you have read, understood, and agree to be bound by these Terms, our Privacy Policy, and our Community Guidelines.
            </p>

            <h2 className="pm-display text-base text-foreground">2. Eligibility</h2>
            <p>
              You must be at least 13 years of age to use PlayMorrow. If you are between 13 and 18, you represent that a parent or guardian has reviewed and agreed to these Terms on your behalf. You must not be located in a country subject to a U.S. government embargo.
            </p>

            <h2 className="pm-display text-base text-foreground">3. Account Registration</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to provide accurate and complete information during registration and to keep your information current.
            </p>

            <h2 className="pm-display text-base text-foreground">4. User Content</h2>
            <p>
              You retain ownership of any content you submit to PlayMorrow. By submitting content, you grant PlayMorrow a non-exclusive, royalty-free, worldwide license to display, distribute, and promote your content on the platform.
            </p>

            <h2 className="pm-display text-base text-foreground">5. Prohibited Conduct</h2>
            <p>
              You agree not to use PlayMorrow for any unlawful purpose, to harass or abuse others, to impersonate any person or entity, to distribute malware, to scrape data, or to engage in any activity that disrupts the platform.
            </p>

            <h2 className="pm-display text-base text-foreground">6. Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms or engage in harmful behavior. You may delete your account at any time through your account settings.
            </p>

            <h2 className="pm-display text-base text-foreground">7. Limitation of Liability</h2>
            <p>
              PlayMorrow is provided &quot;as is&quot; without warranties of any kind. To the fullest extent permitted by law, PlayMorrow shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
            </p>

            <h2 className="pm-display text-base text-foreground">8. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of PlayMorrow after changes constitutes acceptance of the new Terms.
            </p>

            <h2 className="pm-display text-base text-foreground">9. Contact</h2>
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
  );
}