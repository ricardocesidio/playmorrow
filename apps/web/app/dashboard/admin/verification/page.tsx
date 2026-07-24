'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Search, CheckCircle2, XCircle, Clock, AlertTriangle, Eye, ExternalLink, Loader2, FileText, ArrowLeft } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useAdminVerificationRequests, useReviewVerificationRequest } from '@/lib/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { VERIFICATION_LEVEL_LABELS, VERIFICATION_STATUS_LABELS, VERIFICATION_STATUS_COLORS } from '@/lib/api/verification-types';
import type { AdminVerificationItem, VerificationStatus } from '@/lib/api/verification-types';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'In Review' },
  { value: 'MORE_INFO', label: 'More Info' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function AdminVerificationPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAdminVerificationRequests(activeTab === 'all' ? undefined : activeTab);
  const reviewMutation = useReviewVerificationRequest();

  const [reviewItem, setReviewItem] = useState<AdminVerificationItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const requests = data?.items ?? [];

  const filtered = search
    ? requests.filter(r => r.studioName.toLowerCase().includes(search.toLowerCase()))
    : requests;

  const handleReview = async (status: VerificationStatus | 'MORE_INFO') => {
    if (!reviewItem) return;
    setActionLoading(true);
    try {
      await reviewMutation.mutateAsync({ id: reviewItem.id, status, reviewerNotes: reviewNotes || undefined });
      setReviewItem(null);
      setReviewNotes('');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <div className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan"><ArrowLeft className="size-3" /> Back to dashboard</Link>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Verification Queue</h1>
              <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">Admin — review studio verification requests</p>
            </div>
            <Shield className="size-8 text-cyan/30" />
          </div>

          <div className="clip-corner border border-border/90 bg-[#050b0f]/86 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)]">
            <div className="flex items-center gap-1 border-b border-border/70 px-4 pt-3">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-4 py-2 font-mono text-[0.62rem] uppercase tracking-widest transition ${
                    activeTab === tab.value
                      ? 'border-b-2 border-cyan text-cyan'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {tab.value !== 'all' && (
                    <span className="ml-2 text-[0.55rem] text-muted-foreground">
                      ({requests.filter(r => tab.value === 'all' || r.status === tab.value).length})
                    </span>
                  )}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <Search className="size-4 text-muted-foreground" />
                <Input
                  placeholder="Search studios..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 w-48 border-0 bg-transparent text-xs focus:ring-0"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Shield className="size-12 text-muted-foreground/30" />
                <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {search ? 'No studios match your search' : 'No verification requests'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filtered.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-4 py-4 transition hover:bg-cyan/[0.02]">
                    <div className="flex size-10 shrink-0 items-center justify-center border border-border/60 bg-background/40">
                      {item.studioLogoUrl ? (
                        <img src={item.studioLogoUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <Shield className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/studios/${item.studioSlug}`} className="font-display text-sm font-bold text-white hover:text-cyan transition">
                        {item.studioName}
                      </Link>
                      <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                        Requested: {VERIFICATION_LEVEL_LABELS[item.requestedLevel]} · Created {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${VERIFICATION_STATUS_COLORS[item.status]}`}>
                      {VERIFICATION_STATUS_LABELS[item.status]}
                    </span>
                    {item.documents?.length > 0 && (
                      <span className="flex items-center gap-1 font-mono text-[0.55rem] text-muted-foreground">
                        <FileText className="size-3" /> {item.documents.length}
                      </span>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setReviewItem(item)}>
                      <Eye className="size-3" /> Review
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 text-center font-mono text-[0.58rem] text-muted-foreground">
            {data?.total ?? 0} total request{data?.total !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <Modal isOpen={!!reviewItem} onClose={() => { setReviewItem(null); setReviewNotes(''); }} title="Review Verification Request">
        {reviewItem && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center border border-cyan/40 bg-cyan/5">
                {reviewItem.studioLogoUrl ? (
                  <img src={reviewItem.studioLogoUrl} alt="" className="size-full object-cover" />
                ) : (
                  <Shield className="size-6 text-cyan" />
                )}
              </div>
              <div>
                <Link href={`/studios/${reviewItem.studioSlug}`} className="font-display text-base font-bold text-white hover:text-cyan transition" target="_blank">
                  {reviewItem.studioName} <ExternalLink className="inline size-3" />
                </Link>
                <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                  Requesting {VERIFICATION_LEVEL_LABELS[reviewItem.requestedLevel]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${VERIFICATION_STATUS_COLORS[reviewItem.status]}`}>
                {VERIFICATION_STATUS_LABELS[reviewItem.status]}
              </span>
              <span className="font-mono text-[0.55rem] text-muted-foreground">
                Submitted {new Date(reviewItem.createdAt).toLocaleDateString()}
              </span>
            </div>

            {reviewItem.documents?.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">Documents</p>
                <div className="space-y-2">
                  {reviewItem.documents.map((doc, i) => (
                    <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 border border-border/60 p-3 text-xs text-muted-foreground hover:border-cyan hover:text-cyan transition">
                      <FileText className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{doc.name}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {reviewItem.reviewerNotes && (
              <div className="clip-corner border border-violet/30 bg-violet/5 p-3">
                <p className="mb-1 font-mono text-[0.58rem] uppercase tracking-widest text-violet">Previous Notes</p>
                <p className="text-xs text-muted-foreground">{reviewItem.reviewerNotes}</p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">Reviewer Notes</label>
              <textarea
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                rows={3}
                className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan"
                placeholder="Add notes about this review..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="default" onClick={() => handleReview('APPROVED')} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                Approve
              </Button>
              <Button variant="destructive" onClick={() => handleReview('REJECTED')} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="size-3 animate-spin" /> : <XCircle className="size-3" />}
                Reject
              </Button>
              <Button variant="secondary" onClick={() => handleReview('MORE_INFO')} disabled={actionLoading}>
                <AlertTriangle className="size-3" /> Request More Info
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
