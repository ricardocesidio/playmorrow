export type SupportDepartment =
  | 'GENERAL'
  | 'TECHNICAL'
  | 'ACCOUNTS'
  | 'STUDIO'
  | 'PUBLISHING'
  | 'MODERATION'
  | 'COMMUNITY'
  | 'BUG_REPORT'
  | 'FEATURE_REQUEST'
  | 'DMCA'
  | 'COPYRIGHT'
  | 'LEGAL'
  | 'SECURITY';

export type SupportTicketStatus =
  | 'OPEN'
  | 'WAITING_SUPPORT'
  | 'WAITING_CUSTOMER'
  | 'INVESTIGATING'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ARCHIVED'
  | 'SPAM';

export type SupportTicketPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'SECURITY'
  | 'EMERGENCY';

export interface SupportCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  department: SupportDepartment;
}

export interface SupportTicketAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  body: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  department: SupportDepartment;
  categoryId: string | null;
  category: SupportCategory | null;
  authorId: string;
  author: SupportTicketAuthor;
  assignedToId: string | null;
  assignedTo: SupportTicketAuthor | null;
  assignedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  repliesCount?: number;
  replies?: SupportReply[];
}

export interface SupportReply {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  isStaff: boolean;
  editedAt: string | null;
  createdAt: string;
  author: SupportTicketAuthor;
}

export interface CreateTicketDto {
  title: string;
  department: SupportDepartment;
  priority: SupportTicketPriority;
  categoryId?: string;
  body: string;
}

export interface CreateReplyDto {
  body: string;
}

export const STATUS_BADGE_COLORS: Record<SupportTicketStatus, string> = {
  OPEN: 'border-cyan/40 bg-cyan/5 text-cyan',
  WAITING_SUPPORT: 'border-amber/40 bg-amber/5 text-amber',
  WAITING_CUSTOMER: 'border-violet/40 bg-violet/5 text-violet',
  INVESTIGATING: 'border-blue/40 bg-blue/5 text-blue',
  ESCALATED: 'border-coral/40 bg-coral/5 text-coral',
  RESOLVED: 'border-green/40 bg-green/5 text-green',
  CLOSED: 'border-muted-foreground/30 bg-muted-foreground/5 text-muted-foreground',
  ARCHIVED: 'border-muted-foreground/20 bg-muted-foreground/5 text-muted-foreground/60',
  SPAM: 'border-coral/30 bg-coral/5 text-coral/70',
};

export const PRIORITY_BADGE_COLORS: Record<SupportTicketPriority, string> = {
  LOW: 'border-muted-foreground/30 bg-muted-foreground/5 text-muted-foreground',
  MEDIUM: 'border-cyan/40 bg-cyan/5 text-cyan',
  HIGH: 'border-coral/40 bg-coral/5 text-coral',
  CRITICAL: 'border-red/40 bg-red/5 text-red',
  SECURITY: 'border-red/50 bg-red/10 text-red',
  EMERGENCY: 'border-red/60 bg-red/15 text-red font-bold',
};

export const DEPARTMENT_LABELS: Record<SupportDepartment, string> = {
  GENERAL: 'General',
  TECHNICAL: 'Technical',
  ACCOUNTS: 'Accounts',
  STUDIO: 'Studio',
  PUBLISHING: 'Publishing',
  MODERATION: 'Moderation',
  COMMUNITY: 'Community',
  BUG_REPORT: 'Bug Report',
  FEATURE_REQUEST: 'Feature Request',
  DMCA: 'DMCA',
  COPYRIGHT: 'Copyright',
  LEGAL: 'Legal',
  SECURITY: 'Security',
};
