export type VerificationLevel = 'NONE' | 'BASIC' | 'VERIFIED' | 'VERIFIED_PLUS' | 'PARTNER';
export type VerificationStatus = 'NONE' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'MORE_INFO';

export interface StudioVerificationRequest {
  id: string;
  studioId: string;
  studioSlug: string;
  requestedLevel: VerificationLevel;
  status: VerificationStatus;
  documents: { name: string; url: string; type: string }[];
  reviewerNotes: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrustScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  label: string;
}

export interface TrustScore {
  score: number;
  level: VerificationLevel;
  breakdown: TrustScoreBreakdown[];
  recommendations: string[];
}

export interface CompanyProfile {
  legalName?: string;
  businessEmail?: string;
  supportEmail?: string;
  pressContact?: string;
  country?: string;
  city?: string;
  foundedDate?: string;
  companySize?: string;
  discord?: string;
  xUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  steamUrl?: string;
  epicUrl?: string;
  itchUrl?: string;
  engine?: string;
  platforms?: string;
  mission?: string;
  vision?: string;
  businessDescription?: string;
}

export interface PressContact {
  name: string;
  email: string;
  title: string;
}

export interface PressKitDownload {
  label: string;
  url: string;
}

export interface StudioPressKit {
  id?: string;
  headline?: string;
  history?: string;
  awards?: string;
  pressContacts?: PressContact[];
  logoPrimary?: string;
  logoDark?: string;
  logoLight?: string;
  keyArt?: string;
  trailerUrl?: string;
  downloads?: PressKitDownload[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandKit {
  id?: string;
  logoPrimary?: string;
  logoDark?: string;
  logoLight?: string;
  colors?: string[];
  typography?: string;
  brandRules?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminVerificationItem {
  id: string;
  studioId: string;
  studioSlug: string;
  studioName: string;
  studioLogoUrl: string | null;
  requestedLevel: VerificationLevel;
  status: VerificationStatus;
  documents: { name: string; url: string; type: string }[];
  reviewerNotes: string | null;
  reviewedBy: { id: string; displayName: string } | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: { id: string; displayName: string } | null;
  details: string | null;
  createdAt: string;
}

export const VERIFICATION_LEVEL_LABELS: Record<VerificationLevel, string> = {
  NONE: 'Unverified',
  BASIC: 'Basic',
  VERIFIED: 'Verified',
  VERIFIED_PLUS: 'Verified+',
  PARTNER: 'Partner',
};

export const VERIFICATION_LEVEL_COLORS: Record<VerificationLevel, string> = {
  NONE: 'text-muted-foreground border-muted-foreground/30',
  BASIC: 'text-amber border-amber/40',
  VERIFIED: 'text-cyan border-cyan/40',
  VERIFIED_PLUS: 'text-violet border-violet/40',
  PARTNER: 'text-coral border-coral/40',
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  NONE: 'Not Requested',
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  MORE_INFO: 'More Info Needed',
};

export const VERIFICATION_STATUS_COLORS: Record<VerificationStatus, string> = {
  NONE: 'border-muted-foreground/30 bg-muted-foreground/5 text-muted-foreground',
  PENDING: 'border-amber/40 bg-amber/5 text-amber',
  UNDER_REVIEW: 'border-cyan/40 bg-cyan/5 text-cyan',
  APPROVED: 'border-green/40 bg-green/5 text-green',
  REJECTED: 'border-coral/40 bg-coral/5 text-coral',
  MORE_INFO: 'border-violet/40 bg-violet/5 text-violet',
};

export const COMPANY_SIZE_OPTIONS = ['1', '2-10', '11-50', '51-200', '200+'] as const;
