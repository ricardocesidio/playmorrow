import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { HudLinkLogo } from '@/components/playmorrow/hud';

export default function CommunityGuidelinesPage() {
  return (
    <div className="relative min-h-screen bg-[#020609] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <div className="relative px-5 sm:px-8 lg:px-10">
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

        <main className="relative z-10 mx-auto mt-8 max-w-3xl pb-16">
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-6 sm:p-8 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <div className="mb-8 rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
              <strong>Draft:</strong> This is a draft. Legal review is required before production.
            </div>

            <h1 className="font-display font-black uppercase tracking-tight text-white text-2xl sm:text-3xl">Community Guidelines</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
              <p>
                PlayMorrow is a community built around indie games, creativity, and collaboration. These guidelines help keep our community safe, respectful, and enjoyable for everyone.
              </p>

              <h2 className="font-display text-base text-foreground">1. Be Respectful</h2>
              <p>
                Treat others with kindness and respect. Harassment, hate speech, bullying, and personal attacks are not tolerated. Disagree constructively and assume good faith.
              </p>

              <h2 className="font-display text-base text-foreground">2. No Spam or Self-Promotion</h2>
              <p>
                Do not spam, repeatedly promote external products or services, or engage in misleading advertising. Genuine participation in the community is encouraged; self-promotion should be relevant and contextual.
              </p>

              <h2 className="font-display text-base text-foreground">3. Keep Content Appropriate</h2>
              <p>
                Do not post or share content that is illegal, obscene, violent, sexually explicit, or otherwise inappropriate. Use appropriate content warnings where applicable. PlayMorrow is a platform for all ages.
              </p>

              <h2 className="font-display text-base text-foreground">4. Respect Privacy</h2>
              <p>
                Do not share personal information about yourself or others. This includes addresses, phone numbers, financial details, and private communications. Do not dox or stalk other users.
              </p>

              <h2 className="font-display text-base text-foreground">5. No Impersonation</h2>
              <p>
                Do not impersonate other individuals, organizations, or brands. Your profile should accurately represent you or your studio.
              </p>

              <h2 className="font-display text-base text-foreground">6. Intellectual Property</h2>
              <p>
                Only share content that you own or have permission to share. Respect copyright and intellectual property rights. If you believe your work has been used without permission, contact us.
              </p>

              <h2 className="font-display text-base text-foreground">7. Reporting Violations</h2>
              <p>
                If you see content or behavior that violates these guidelines, please report it using the reporting tools on the platform. Our moderation team will review and take appropriate action.
              </p>

              <h2 className="font-display text-base text-foreground">8. Consequences</h2>
              <p>
                Violations of these guidelines may result in content removal, warnings, temporary suspensions, or permanent account termination depending on the severity and frequency of the violation.
              </p>

              <h2 className="font-display text-base text-foreground">9. Updates</h2>
              <p>
                These guidelines may be updated as our community grows. We will notify users of material changes. Continued use of PlayMorrow means you accept the updated guidelines.
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
