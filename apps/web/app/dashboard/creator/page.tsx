'use client';

import { useState } from 'react';
import { Copy, Gift, Users, DollarSign, Check } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { useReferralCode, useReferralCommissions } from '@/lib/api/hooks';
import { formatPrice } from '@/lib/format';

export default function CreatorDashboardPage() {
  const { user } = useAuth();
  const { data: codeData, isLoading: codeLoading, error: codeError } = useReferralCode();
  const { data: commissions, isLoading: commsLoading, error } = useReferralCommissions();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const referralLink = codeData?.code
    ? `${window.location.origin}?ref=${codeData.code}`
    : '';

  const copyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <h1 className="font-display text-2xl font-black uppercase text-foreground">Creator Program</h1>
            <p className="mt-1 text-sm text-muted-foreground">Refer friends and earn commission on their purchases.</p>
          </HudPanel>

          {(error || codeError) && !commsLoading && !codeLoading && (
            <ErrorState message="Failed to load creator data." />
          )}

          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <div className="flex items-center gap-3">
              <Gift className="size-5 text-cyan" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Your Referral Link</p>
                {codeLoading ? (
                  <div className="mt-1 h-5 w-48 animate-pulse bg-white/10" role="status" aria-label="Loading referral link" />
                ) : (
                  <p className="mt-1 font-mono text-sm text-cyan">{referralLink || 'Generating...'}</p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={copyLink} disabled={!referralLink} aria-label={copied ? 'Link copied' : 'Copy referral link'}>
                {copied ? <Check className="size-3" aria-hidden="true" /> : <Copy className="size-3" aria-hidden="true" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </HudPanel>

          <div className="grid grid-cols-2 gap-3">
            <div className="clip-corner border border-border/60 bg-background/40 p-4">
              <Users className="size-5 text-muted-foreground" aria-hidden="true" />
              <p className="mt-2 font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">Referrals</p>
              <p className="mt-1 font-mono text-lg text-foreground">{commissions?.commissions.length || 0}</p>
            </div>
            <div className="clip-corner border border-border/60 bg-background/40 p-4">
              <DollarSign className="size-5 text-cyan" aria-hidden="true" />
              <p className="mt-2 font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">Earned</p>
              <p className="mt-1 font-mono text-lg text-cyan">{formatPrice(commissions?.totalEarned || 0)}</p>
            </div>
          </div>

          {commissions && commissions.commissions.length > 0 && (
            <div className="mt-4 space-y-2">
              <h2 className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Commission History</h2>
              {commissions.commissions.map((c: { id: string; createdAt: string; amountCents: number }) => (
                <div key={c.id} className="clip-corner border border-border/40 bg-[#050b0f]/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[0.55rem] text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-mono text-xs text-cyan">+{formatPrice(c.amountCents)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
