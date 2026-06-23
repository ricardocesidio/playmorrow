import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { HudLinkLogo } from '@/components/playmorrow/hud';

export default function PrivacyPage() {
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

          <h1 className="pm-display text-2xl sm:text-3xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <p>
              PlayMorrow respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>

            <h2 className="pm-display text-base text-foreground">1. Information We Collect</h2>
            <p>
              We collect information you provide directly, such as your name, email address, username, and profile information. We also collect usage data, including pages visited, features used, and interactions with content.
            </p>

            <h2 className="pm-display text-base text-foreground">2. How We Use Your Information</h2>
            <p>
              We use your information to operate and improve PlayMorrow, personalize your experience, send communications (with your consent), enforce our Terms, and comply with legal obligations.
            </p>

            <h2 className="pm-display text-base text-foreground">3. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to maintain session state, analyze usage, and deliver personalized content. You can control cookie preferences through your browser settings.
            </p>

            <h2 className="pm-display text-base text-foreground">4. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share data with trusted service providers who help us operate the platform, and as required by law. Where allowed, we may share limited information with partners for marketing and advertising based on your preferences.
            </p>

            <h2 className="pm-display text-base text-foreground">5. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide the service. You may request deletion of your account and associated data at any time.
            </p>

            <h2 className="pm-display text-base text-foreground">6. Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure.
            </p>

            <h2 className="pm-display text-base text-foreground">7. Children&apos;s Privacy</h2>
            <p>
              PlayMorrow is not directed at children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such data, we will delete it.
            </p>

            <h2 className="pm-display text-base text-foreground">8. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. You may also opt out of marketing communications at any time. Contact us at support@playmorrow.com to exercise your rights.
            </p>

            <h2 className="pm-display text-base text-foreground">9. Policy Updates</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated via email or platform notice.
            </p>

            <h2 className="pm-display text-base text-foreground">10. Contact</h2>
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
  );
}