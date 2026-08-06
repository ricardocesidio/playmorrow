'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';
import {
  type SupportTicket,
  STATUS_BADGE_COLORS,
  PRIORITY_BADGE_COLORS,
  DEPARTMENT_LABELS,
} from '@/lib/api/support-types';

interface TicketCardProps {
  ticket: SupportTicket;
  href: string;
}

export function TicketCard({ ticket, href }: TicketCardProps) {
  const statusColor = STATUS_BADGE_COLORS[ticket.status];
  const priorityColor = PRIORITY_BADGE_COLORS[ticket.priority];

  return (
    <Link
      href={href}
      className="clip-corner block border border-border/60 panel p-4 transition hover:border-cyan/30 hover:shadow-[0_0_20px_rgb(62_231_255_/_0.06)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="font-mono text-[0.5rem] text-muted-foreground/50">
              #{ticket.ticketNumber}
            </span>
            <span className={`clip-corner border px-1.5 py-0.5 font-mono text-[0.45rem] uppercase tracking-wider ${statusColor}`}>
              {ticket.status.replace(/_/g, ' ')}
            </span>
            <span className={`clip-corner border px-1.5 py-0.5 font-mono text-[0.45rem] uppercase tracking-wider ${priorityColor}`}>
              {ticket.priority}
            </span>
          </div>

          <h3 className="truncate font-mono text-[0.62rem] font-semibold uppercase tracking-wider text-foreground">
            {ticket.title}
          </h3>

          <div className="mt-1.5 flex items-center gap-3">
            <span className="font-mono text-[0.5rem] text-muted-foreground/60">
              {DEPARTMENT_LABELS[ticket.department]}
            </span>
            <span className="font-mono text-[0.5rem] text-muted-foreground/40">
              {formatRelativeTime(ticket.createdAt)}
            </span>
          </div>
        </div>

        {(ticket.repliesCount !== undefined && ticket.repliesCount > 0) && (
          <div className="flex shrink-0 items-center gap-1 text-muted-foreground/50">
            <MessageSquare className="size-3" />
            <span className="font-mono text-[0.5rem]">{ticket.repliesCount}</span>
          </div>
        )}
      </div>

      {ticket.assignedTo && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-border/30 pt-2">
          <div className="flex size-4 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground">
            {ticket.assignedTo.avatarUrl ? (
              <img src={ticket.assignedTo.avatarUrl} alt="" className="size-full rounded-full object-cover" />
            ) : (
              ticket.assignedTo.displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <span className="font-mono text-[0.45rem] text-muted-foreground/50">
            Assigned to {ticket.assignedTo.displayName}
          </span>
        </div>
      )}
    </Link>
  );
}
