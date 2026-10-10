/**
 * Live portal (v8): pure mapping from the backend's client DTOs to what the existing portal
 * screens show (stage names, five-step rail, next milestone, required actions…).
 *
 * The API is the source of truth and carries no money, no internal notes and no people from
 * Eclipse: nothing here invents any. What the API doesn't provide (per-stage dates, the
 * Eclipse lead, a maintenance plan, a document "author"…) is simply absent from the model,
 * and the screens leave those blocks out instead of filling them.
 */
import type { ApiChangeRequest, ApiMilestone, ApiProjectSummary, ApiStage, ApiUpdate } from '@/lib/api/types';
import { MAIN_STAGES, type MainStageId, type StageId } from './types';

/** API stage → the message key used by `portal.stages.<id>`. */
const STAGE_KEY: Record<ApiStage, StageId> = {
  preparation: 'preparation',
  build: 'build',
  eclipse_review: 'eclipseReview',
  client_review: 'clientReview',
  delivery: 'delivery',
  support: 'support',
};

export const stageKey = (stage: ApiStage): StageId => STAGE_KEY[stage];

export const TOTAL_STAGES = MAIN_STAGES.length;

type StageHolder = Pick<ApiProjectSummary, 'stage' | 'status'>;

/** What to call the project's stage: paused and closed projects say so, in words. */
export function displayStage(p: StageHolder): StageId {
  if (p.status === 'paused') return 'paused';
  if (p.status === 'closed') return 'closed';
  return STAGE_KEY[p.stage];
}

/** 1–5 position on the main scale (Soporte counts as 5: it only exists after delivery). */
export function position(p: Pick<ApiProjectSummary, 'stage'>): number {
  if (p.stage === 'support') return TOTAL_STAGES;
  return MAIN_STAGES.indexOf(STAGE_KEY[p.stage] as MainStageId) + 1;
}

/** Phase for <PhaseGlyph>: the moon covers the sun as the project advances. */
export const phase = (p: Pick<ApiProjectSummary, 'stage'>): number => position(p) / TOTAL_STAGES;

export type StepStatus = 'done' | 'current' | 'paused' | 'next' | 'pending';

export interface RailStep {
  stage: MainStageId;
  n: number;
  status: StepStatus;
}

/**
 * The five public stages for one project. With the API's single "current stage" the rail can
 * say done / current (or paused) / next / pending — and nothing about dates it doesn't have.
 */
export function rail(p: StageHolder): RailStep[] {
  const at = position(p); // 1..5
  const delivered = p.stage === 'support';
  return MAIN_STAGES.map((stage, i) => {
    const n = i + 1;
    let status: StepStatus;
    if (delivered || n < at) status = 'done';
    else if (n === at) status = p.status === 'paused' ? 'paused' : p.status === 'closed' ? 'pending' : 'current';
    else if (n === at + 1 && p.status === 'active') status = 'next';
    else status = 'pending';
    return { stage, n, status };
  });
}

/** The milestone to show as "next": the current one, else the earliest planned upcoming one. */
export function nextMilestone(milestones: readonly ApiMilestone[]): ApiMilestone | null {
  const open = milestones.filter((m) => m.status !== 'done');
  const current = open.find((m) => m.status === 'current');
  if (current) return current;
  const upcoming = open
    .filter((m) => m.status === 'upcoming')
    .sort((a, b) => (a.plannedOn ?? '9999-12-31').localeCompare(b.plannedOn ?? '9999-12-31'));
  return upcoming[0] ?? null;
}

/** Published updates of kind action_required that are still open, most urgent first. */
export function openActions(updates: readonly ApiUpdate[]): ApiUpdate[] {
  return updates
    .filter((u) => u.kind === 'action_required' && !u.resolved)
    .sort((a, b) => (a.dueOn ?? '9999-12-31').localeCompare(b.dueOn ?? '9999-12-31') || b.publishedAt.localeCompare(a.publishedAt));
}

/** Newest first (the API already sends them so; this makes it independent of that). */
export const newestFirst = <T extends { publishedAt: string }>(list: readonly T[]): T[] =>
  [...list].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export const OPEN_CHANGES: readonly ApiChangeRequest['status'][] = ['received', 'evaluating', 'estimated'];

export function changeGroups(changes: readonly ApiChangeRequest[]) {
  return {
    accepted: changes.filter((c) => c.status === 'accepted'),
    open: changes.filter((c) => OPEN_CHANGES.includes(c.status)),
    closed: changes.filter((c) => c.status === 'rejected' || c.status === 'closed'),
  };
}

export type Bucket = 'active' | 'support' | 'paused' | 'closed';

export function bucketOf(p: StageHolder): Bucket {
  if (p.status === 'paused') return 'paused';
  if (p.status === 'closed') return 'closed';
  return p.stage === 'support' ? 'support' : 'active';
}

export function countBuckets(projects: readonly StageHolder[]): Record<Bucket, number> {
  const out: Record<Bucket, number> = { active: 0, support: 0, paused: 0, closed: 0 };
  for (const p of projects) out[bucketOf(p)] += 1;
  return out;
}

/** Most recently updated first. */
export const byUpdated = <T extends { updatedAt: string }>(list: readonly T[]): T[] =>
  [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

const KNOWN_STAGES = new Set<string>(Object.keys(STAGE_KEY));
const KNOWN_STATUS = new Set(['active', 'paused', 'closed']);

/** Guards a project DTO against values this build doesn't know (a newer backend): falls back to safe wording. */
export function knownProject<T extends StageHolder>(p: T): boolean {
  return KNOWN_STAGES.has(p.stage) && KNOWN_STATUS.has(p.status);
}
