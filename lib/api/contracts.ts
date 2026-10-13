export interface Onboarding {
  state: 'verification_required' | 'agreement_pending' | 'deposit_pending' | 'project_active' | 'no_agreement';
  required: boolean;
  engagementId: string | null;
}
export interface ContractIssue {
  id: string;
  kind: 'start' | 'delivery';
  number: number;
  status: 'draft' | 'published' | 'test_completed' | 'revoked';
  documentHash: string;
  templateVersion: string;
  templateApproved: boolean;
  method: string;
  publishedAt: string | null;
  expiresAt: string | null;
  completedAt: string | null;
  sessionId: string | null;
}
export interface Engagement {
  id: string;
  name: string;
  status: string;
  sandbox: boolean;
  projectId: string | null;
  snapshot: {
    catalogVersion: string;
    currency: 'USD';
    totalCents: number;
    depositCents: number;
    balanceCents: number;
    monthlyCents: number;
    bonusMonths: number;
    scope: string[];
    externals: string;
  };
  balance?: { state: 'available' | 'pending'; remainingCents: number };
  deposit: { state: 'available' | 'pending'; amountCents: number | null; verifiedAt: string | null };
  monthly: {
    publishedOn: string | null;
    activatedOn: string | null;
    firstChargeOn: string | null;
    calendarRule: string;
    approved: boolean;
  };
  issues: ContractIssue[];
}
