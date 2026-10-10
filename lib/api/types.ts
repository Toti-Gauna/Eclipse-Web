/** Shapes of the backend answers the web uses (OpenAPI 0.7.0). Only what the UI reads. */

export interface ApiClientProfile {
  id: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
}

export type ApiStage = 'preparation' | 'build' | 'eclipse_review' | 'client_review' | 'delivery' | 'support';
export type ApiProjectStatus = 'active' | 'paused' | 'closed';
export type ApiMilestoneStatus = 'upcoming' | 'current' | 'done';
export type ApiUpdateKind = 'client_update' | 'action_required' | 'status_change';
export type ApiChangeStatus = 'received' | 'evaluating' | 'estimated' | 'accepted' | 'rejected' | 'closed';
export type ApiDocumentKind = 'contract' | 'quote' | 'invoice' | 'deliverable' | 'guide' | 'other';

export interface ApiProjectSummary {
  id: string;
  name: string;
  service: string;
  status: ApiProjectStatus;
  stage: ApiStage;
  myRole: 'client_admin' | 'client_collaborator';
  plannedEndOn: string | null;
  updatedAt: string;
}

export interface ApiMilestone {
  id: string;
  stage: ApiStage;
  title: string;
  description: string | null;
  status: ApiMilestoneStatus;
  ownerParty: 'eclipse' | 'client';
  plannedOn: string | null;
  actualOn: string | null;
}

export interface ApiUpdate {
  id: string;
  kind: ApiUpdateKind;
  title: string | null;
  body: string;
  dueOn: string | null;
  resolved: boolean;
  publishedAt: string;
  author: 'Eclipse';
}

export interface ApiChangeRequest {
  number: number;
  title: string;
  description: string | null;
  status: ApiChangeStatus;
  scheduleImpactDays: number | null;
  requestedAt: string;
  decidedAt: string | null;
}

export interface ApiScope {
  version: number;
  items: string[];
  acceptedOn: string;
  history: { version: number; items: string[]; acceptedOn: string }[];
}

export interface ApiProjectDetail extends ApiProjectSummary {
  startedOn: string | null;
  completedOn: string | null;
  scope: ApiScope;
  milestones: ApiMilestone[];
  updates: ApiUpdate[];
  changeRequests: ApiChangeRequest[];
}

export interface ApiDocument {
  id: string;
  projectId: string;
  title: string;
  kind: ApiDocumentKind;
  fileName: string;
  mediaType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export type PlanRequestStatus = 'submitted' | 'under_review' | 'reviewed' | 'accepted' | 'rejected' | 'cancelled';

export interface ApiPlanSelection {
  goals: string[];
  planId: string | null;
  items: string[];
  maintenance?: string | null;
  billing: 'monthly' | 'annual';
  vertical: string | null;
  founder: boolean;
}

export interface ApiEstimate {
  currency: 'USD';
  provisional: true;
  lines: { id: string; kind: 'plan' | 'item'; priceCents: number; listCents: number }[];
  subtotalCents: number;
  totalCents: number;
  rangeCents: { from: number; to: number } | null;
  voiceCombo: boolean;
  founderDiscountCents: number;
  maintenance: {
    id: string | null;
    billing: 'monthly' | 'annual';
    monthlyCents: number;
    periodCents: number;
    voiceUsageMonthlyCents: number;
  };
}

export interface ApiPlanRequest {
  id: string;
  catalogVersion: string;
  selection: ApiPlanSelection;
  estimate: ApiEstimate;
  contact: { name: string; phone: string };
  message: string | null;
  status: PlanRequestStatus;
  version: number;
  publicResponse: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
}

export interface Localized3 {
  es: string;
  en: string;
  pt: string;
}

export interface ApiCatalog {
  version: string;
  currency: 'USD';
  provisional: true;
  items: { id: string; category: string; name: Localized3; priceCents: number }[];
  plans: {
    id: string;
    name: Localized3;
    tier: string;
    rangeCents: { from: number; to: number };
    items: string[];
    maintenance: string | null;
    bonusItemId: string | null;
  }[];
  maintenance: { id: string; name: Localized3; monthlyCents: number }[];
  annualMonthsCharged: number;
  voiceUsage: { id: string; itemId: string; monthlyCents: number };
  goals: string[];
  verticals: { id: string; name: Localized3 }[];
  founders: { total: number; remainingSnapshot: number; reservesSlots: false };
  offers: {
    id: string;
    kind: 'founder' | 'voiceCombo' | 'annualMaintenance' | 'referral';
    active: boolean;
    endsAt: string | null;
    percentOff?: number;
    itemId?: string;
    plans?: string[];
    priceCents?: number;
    minSubtotalCents?: number;
  }[];
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
