'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useCreateReport } from '@/lib/api/hooks';
import type { CreateReportDto } from '@/lib/api/client';

interface ReportFormProps {
  targetType: CreateReportDto['targetType'];
  targetId: string;
}

const REASONS = ['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'SEXUAL_CONTENT', 'VIOLENCE', 'COPYRIGHT', 'MISLEADING', 'OTHER'] as const;

export function ReportForm({ targetType, targetId }: ReportFormProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const createReport = useCreateReport();

  const handleSubmit = async () => {
    if (!reason) return;
    try {
      await createReport.mutateAsync({ targetType, targetId, reason, details: details || undefined });
      setSubmitted(true);
    } catch { /* ignore */ }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-coral">
        <Flag className="size-3" /> Report
      </button>
    );
  }

  if (submitted) {
    return <p className="text-xs text-muted-foreground/60">Report submitted. Thank you.</p>;
  }

  return (
    <div className="border border-border bg-elevated p-3">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Report this content</p>
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="mb-2 w-full border border-input bg-background px-2 py-1.5 font-mono text-xs focus:border-cyan focus:outline-none">
        <option value="">Select a reason...</option>
        {REASONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
      </select>
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Additional details (optional)" rows={2} className="mb-2 w-full border border-input bg-background px-2 py-1.5 font-mono text-xs focus:border-cyan focus:outline-none" />
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={!reason || createReport.isPending}
          className="border border-coral bg-coral/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-coral disabled:opacity-50">
          Submit
        </button>
        <button onClick={() => setOpen(false)} className="border border-border px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">Cancel</button>
      </div>
    </div>
  );
}
