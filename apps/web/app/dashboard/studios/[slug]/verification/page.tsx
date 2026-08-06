'use client';

import { useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Shield, ShieldCheck, ShieldAlert, Loader2, Upload, FileText, CheckCircle2, XCircle, Clock, AlertTriangle, Info } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useStudio, useStudioVerification, useRequestVerification, useTrustScore } from '@/lib/api/hooks';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { VERIFICATION_LEVEL_LABELS, VERIFICATION_LEVEL_COLORS, VERIFICATION_STATUS_LABELS, VERIFICATION_STATUS_COLORS } from '@/lib/api/verification-types';
import type { VerificationLevel, VerificationStatus } from '@/lib/api/verification-types';

const TIERS: { level: VerificationLevel; label: string; desc: string; benefits: string[] }[] = [
  { level: 'BASIC', label: 'Basic', desc: 'Essential verification', benefits: ['Verification badge', 'Basic trust score'] },
  { level: 'VERIFIED', label: 'Verified', desc: 'Full studio verification', benefits: ['Verification badge', 'Full trust score', 'Company profile', 'Priority support'] },
  { level: 'VERIFIED_PLUS', label: 'Verified+', desc: 'Enhanced verification', benefits: ['All Verified features', 'Press kit priority', 'Brand kit access', 'Featured placement'] },
  { level: 'PARTNER', label: 'Partner', desc: 'Top-tier partnership', benefits: ['All Verified+ features', 'Dedicated manager', 'Early access features', 'Marketing collaboration'] },
];

export default function VerificationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: studio, isLoading: studioLoading } = useStudio(slug);
  const { data: verification, isLoading: verLoading } = useStudioVerification(slug);
  const { data: trustScore } = useTrustScore(slug);
  const requestVerification = useRequestVerification();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<VerificationLevel>('VERIFIED');
  const [documents, setDocuments] = useState<{ name: string; url: string; type: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const currentStatus: VerificationStatus = verification?.status ?? 'NONE';
  const currentLevel: VerificationLevel = verification?.requestedLevel ?? trustScore?.level ?? 'NONE';
  const isPending = currentStatus === 'PENDING' || currentStatus === 'UNDER_REVIEW';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await requestVerification.mutateAsync({ slug, requestedLevel: selectedLevel, documents: documents.length ? documents : undefined });
      setShowRequestModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const addDocument = (name: string, url: string, type: string) => {
    setDocuments(prev => [...prev, { name, url, type }]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const trustLevel = trustScore?.level ?? 'NONE';
  const trustPercent = trustScore?.score ?? 0;

  if (studioLoading || verLoading) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-screen items-center justify-center bg-[#020609]">
          <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        </div>
      </>
    );
  }

  if (!studio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#020609] px-4">
        <p className="font-display text-2xl font-semibold text-foreground">Studio not found</p>
        <Link href="/dashboard" className="mt-4 font-mono text-xs uppercase tracking-widest text-cyan underline">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <>
      <SiteHeader />
      <div className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan"><ArrowLeft className="size-3" /> Back to dashboard</Link>
            <Link href={`/studios/${slug}`} className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-cyan transition hover:text-white"><ExternalLink className="size-3" /> View public page</Link>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Verification</h1>
            <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">Trust & verification for {studio.name}</p>
          </div>

          {isPending && (
            <div className="clip-corner mb-6 flex items-center gap-3 border border-amber/30 bg-amber/5 px-5 py-4">
              <Clock className="size-5 shrink-0 text-amber" />
              <div>
                <p className="font-mono text-xs font-semibold text-amber">Verification {VERIFICATION_STATUS_LABELS[currentStatus].toLowerCase()}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Your request is being reviewed. We'll notify you when there's an update.</p>
              </div>
            </div>
          )}

          {currentStatus === 'REJECTED' && (
            <div className="clip-corner mb-6 flex items-center gap-3 border border-coral/30 bg-coral/5 px-5 py-4">
              <XCircle className="size-5 shrink-0 text-coral" />
              <div>
                <p className="font-mono text-xs font-semibold text-coral">Verification request rejected</p>
                {verification?.reviewerNotes && <p className="mt-0.5 text-xs text-muted-foreground">{verification.reviewerNotes}</p>}
              </div>
            </div>
          )}

          {currentStatus === 'APPROVED' && (
            <div className="clip-corner mb-6 flex items-center gap-3 border border-green/30 bg-green/5 px-5 py-4">
              <CheckCircle2 className="size-5 shrink-0 text-green" />
              <div>
                <p className="font-mono text-xs font-semibold text-green">Verification approved</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Your studio is now verified at the {VERIFICATION_LEVEL_LABELS[currentLevel]} level.</p>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="clip-corner border border-border/90 panel p-6 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)]">
                <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Current Status</h2>
                <div className="flex items-center gap-4">
                  <div className={`flex size-16 items-center justify-center border-2 ${VERIFICATION_LEVEL_COLORS[currentLevel]}`}>
                    <Shield className={`size-8 ${currentStatus === 'APPROVED' || currentLevel !== 'NONE' ? '' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-display text-xl font-bold text-white">{currentStatus === 'APPROVED' ? VERIFICATION_LEVEL_LABELS[currentLevel] : 'Not Verified'}</p>
                      <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${VERIFICATION_STATUS_COLORS[currentStatus]}`}>
                        {VERIFICATION_STATUS_LABELS[currentStatus]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {currentStatus === 'NONE' && 'Your studio has not requested verification yet.'}
                      {isPending && 'Your request is being processed.'}
                      {currentStatus === 'APPROVED' && `Verified since ${new Date(verification!.reviewedAt!).toLocaleDateString()}.`}
                      {currentStatus === 'REJECTED' && 'Your request was not approved. You can re-apply.'}
                      {currentStatus === 'MORE_INFO' && 'Additional information has been requested.'}
                    </p>
                  </div>
                </div>

                {!isPending && currentStatus !== 'APPROVED' && (
                  <div className="mt-6">
                    <Button onClick={() => setShowRequestModal(true)}>
                      <ShieldCheck className="size-4" /> Request Verification
                    </Button>
                  </div>
                )}
              </div>

              <div className="clip-corner border border-border/90 panel p-6 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)]">
                <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Verification Tiers</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {TIERS.map((tier) => {
                    const isCurrent = currentLevel === tier.level && currentStatus === 'APPROVED';
                    const isSelected = selectedLevel === tier.level;
                    return (
                      <button
                        key={tier.level}
                        onClick={() => setSelectedLevel(tier.level)}
                        disabled={currentStatus === 'APPROVED'}
                        className={`clip-corner border p-4 text-left transition ${
                          isCurrent
                            ? 'border-cyan/60 bg-cyan/10 shadow-[0_0_20px_rgb(62_231_255_/_0.12)]'
                            : isSelected && !isCurrent
                            ? 'border-cyan/40 bg-cyan/5'
                            : 'border-border/70 panel hover:border-cyan/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex size-10 items-center justify-center border ${
                            isCurrent ? 'border-cyan text-cyan' : 'border-border/60 text-muted-foreground'
                          }`}>
                            <Shield className="size-5" />
                          </div>
                          <div>
                            <p className={`font-display text-sm font-bold ${isCurrent ? 'text-cyan' : 'text-white'}`}>
                              {tier.label}
                              {isCurrent && <span className="ml-2 font-mono text-[9px] uppercase text-green">Active</span>}
                            </p>
                            <p className="text-[0.62rem] text-muted-foreground">{tier.desc}</p>
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1">
                          {tier.benefits.map((b, i) => (
                            <li key={i} className="flex items-center gap-2 font-mono text-[0.58rem] text-muted-foreground">
                              <CheckCircle2 className="size-3 text-cyan" /> {b}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="clip-corner border border-border/90 panel p-6 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)]">
                <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Trust Score</h2>
                <div className="flex flex-col items-center">
                  <div className="relative flex size-24 items-center justify-center">
                    <svg className="size-24 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.5" fill="none"
                        stroke={trustPercent >= 80 ? '#06ffa5' : trustPercent >= 60 ? '#62e7ff' : trustPercent >= 40 ? '#f59e0b' : '#ff5757'}
                        strokeWidth="3" strokeDasharray={`${trustPercent * 0.8639} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-display text-2xl font-black text-white">{trustPercent}</span>
                  </div>
                  <p className="mt-2 font-mono text-[0.58rem] uppercase tracking-widest text-muted-foreground">{VERIFICATION_LEVEL_LABELS[trustLevel]}</p>
                </div>
                {trustScore?.breakdown && (
                  <div className="mt-4 space-y-3">
                    {trustScore.breakdown.map((b) => (
                      <div key={b.category}>
                        <div className="mb-1 flex items-center justify-between text-[0.62rem]">
                          <span className="text-muted-foreground">{b.label}</span>
                          <span className="font-mono text-cyan">{b.score}/{b.maxScore}</span>
                        </div>
                        <div className="h-1.5 bg-border">
                          <div className="h-full bg-cyan shadow-[0_0_12px_rgb(62_231_255_/_0.55)]" style={{ width: `${(b.score / b.maxScore) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {trustScore?.recommendations && trustScore.recommendations.length > 0 && (
                  <div className="mt-4 border-t border-border/60 pt-4">
                    <p className="mb-2 flex items-center gap-1.5 font-mono text-[0.58rem] uppercase tracking-widest text-amber">
                      <AlertTriangle className="size-3" /> Recommendations
                    </p>
                    <ul className="space-y-1">
                      {trustScore.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 font-mono text-[0.58rem] text-muted-foreground">
                          <Info className="mt-0.5 size-3 shrink-0 text-amber" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {verification?.documents && verification.documents.length > 0 && (
                <div className="clip-corner border border-border/90 panel p-6 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)]">
                  <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Documents</h2>
                  <div className="space-y-2">
                    {verification.documents.map((doc, i) => (
                      <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 border border-border/60 p-3 text-xs text-muted-foreground hover:border-cyan hover:text-cyan transition">
                        <FileText className="size-4 shrink-0" />
                        <span className="flex-1 truncate">{doc.name}</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="Request Verification">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">Verification Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as VerificationLevel)}
              className="clip-corner h-12 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan"
            >
              {TIERS.map((tier) => (
                <option key={tier.level} value={tier.level}>{tier.label} — {tier.desc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">Supporting Documents</label>
            <p className="mb-2 text-[0.62rem] text-muted-foreground">Upload business registration, ID, or other verification documents.</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Document name"
                className="clip-corner h-10 flex-1 border border-input bg-background/80 px-3 text-xs text-foreground outline-none focus:border-cyan"
                id="doc-name"
              />
              <input
                type="text"
                placeholder="Document URL"
                className="clip-corner h-10 flex-1 border border-input bg-background/80 px-3 text-xs text-foreground outline-none focus:border-cyan"
                id="doc-url"
              />
              <Button type="button" size="sm" onClick={() => {
                const name = (document.getElementById('doc-name') as HTMLInputElement)?.value;
                const url = (document.getElementById('doc-url') as HTMLInputElement)?.value;
                if (name && url) {
                  addDocument(name, url, 'document');
                  (document.getElementById('doc-name') as HTMLInputElement)!.value = '';
                  (document.getElementById('doc-url') as HTMLInputElement)!.value = '';
                }
              }}>
                <Upload className="size-3" /> Add
              </Button>
            </div>
            {documents.map((doc, i) => (
              <div key={i} className="mt-2 flex items-center gap-2 border border-border/60 p-2 text-xs">
                <FileText className="size-3 text-cyan" />
                <span className="flex-1 text-muted-foreground">{doc.name}</span>
                <button type="button" onClick={() => removeDocument(i)} className="text-coral hover:text-coral/80">
                  <XCircle className="size-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-3 animate-spin" /> : <ShieldCheck className="size-3" />}
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowRequestModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
