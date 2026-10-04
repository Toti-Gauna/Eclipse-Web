/**
 * Pure helpers over the portal fixtures: stage position, timeline, groupings and the
 * dashboard summary. No React, no messages — components turn the ids into words.
 */
import { PEOPLE, PORTAL_PROJECTS, PORTAL_VIEWER, type PersonId } from './fixtures';
import {
  MAIN_STAGES,
  EXTRA_STAGES,
  type ChangeRequest,
  type ChangeStatus,
  type IsoDate,
  type MainStageId,
  type Person,
  type PortalProject,
  type ProjectUpdate,
  type StageId,
} from './types';

export const TOTAL_STAGES = MAIN_STAGES.length;

export const isMainStage = (stage: string): stage is MainStageId => (MAIN_STAGES as readonly string[]).includes(stage);
export const isStage = (stage: string): stage is StageId =>
  isMainStage(stage) || (EXTRA_STAGES as readonly string[]).includes(stage);

/** 1-based number of a main stage ("2" in "2 de 5"). */
export const stageNumber = (stage: MainStageId): number => MAIN_STAGES.indexOf(stage) + 1;

export const projectById = (id: string): PortalProject | undefined => PORTAL_PROJECTS.find((p) => p.id === id);

export const personById = (id: string): Person | undefined => PEOPLE[id as PersonId];

/** True when the person is the signed-in demo client (shown as "vos"). */
export const isViewer = (id: string): boolean => id === PORTAL_VIEWER;

/**
 * Where the project sits on the 1–5 scale: its current main stage, the stage a paused
 * project stopped in, or 5 once delivered (Soporte, or Cerrado after a delivery).
 */
export function stagePosition(project: PortalProject): number | null {
  if (isMainStage(project.stage)) return stageNumber(project.stage);
  if (project.stage === 'paused') return project.pausedIn ? stageNumber(project.pausedIn) : null;
  if (project.stage === 'support') return TOTAL_STAGES;
  const reached = project.history.map((h) => h.stage).filter(isMainStage);
  return reached.length ? stageNumber(reached[reached.length - 1]) : null;
}

/** Phase for <PhaseGlyph>: the moon covers the sun as the project advances; totality = delivered. */
export function stagePhase(project: PortalProject): number {
  return (stagePosition(project) ?? 0) / TOTAL_STAGES;
}

export type StepStatus = 'done' | 'current' | 'paused' | 'next' | 'pending';

export interface TimelineStep {
  stage: MainStageId;
  n: number;
  status: StepStatus;
  start?: IsoDate;
  end?: IsoDate;
}

/** The five public stages for one project: done / current (or paused) / next / pending, with dates. */
export function timeline(project: PortalProject): TimelineStep[] {
  const spans = new Map(project.history.filter((h) => h.stage !== 'support').map((h) => [h.stage, h]));
  const active = isMainStage(project.stage);
  let nextGiven = false;
  return MAIN_STAGES.map((stage, i) => {
    const span = spans.get(stage);
    let status: StepStatus;
    if (span?.end) status = 'done';
    else if (span) status = project.stage === 'paused' ? 'paused' : active ? 'current' : 'done';
    else if (active && !nextGiven) {
      status = 'next';
      nextGiven = true;
    } else status = 'pending';
    return { stage, n: i + 1, status, start: span?.start, end: span?.end };
  });
}

/** The newest update (fixtures keep them newest first). */
export const latestUpdate = (project: PortalProject): ProjectUpdate | undefined => project.updates[0];

/** Change requests that are still moving: never part of the scope until accepted. */
export const OPEN_CHANGE_STATUSES: readonly ChangeStatus[] = ['received', 'evaluating', 'estimated'];

export function changeGroups(project: PortalProject): {
  accepted: ChangeRequest[];
  open: ChangeRequest[];
  closed: ChangeRequest[];
} {
  return {
    accepted: project.changes.filter((c) => c.status === 'accepted'),
    open: project.changes.filter((c) => OPEN_CHANGE_STATUSES.includes(c.status)),
    closed: project.changes.filter((c) => c.status === 'rejected' || c.status === 'closed'),
  };
}

const byDateDesc = <T extends { date: IsoDate }>(a: T, b: T) => b.date.localeCompare(a.date);

export const documentsByDate = (project: PortalProject) => [...project.documents].sort(byDateDesc);

export type ProjectBucket = 'active' | 'support' | 'paused' | 'closed';

export function bucketOf(project: PortalProject): ProjectBucket {
  if (isMainStage(project.stage)) return 'active';
  return project.stage;
}

export interface PortalSummary {
  total: number;
  buckets: Record<ProjectBucket, number>;
  /** Projects waiting on the client (an action is required from them). */
  waiting: PortalProject[];
  /** The most recent update across every project. */
  last: { project: PortalProject; update: ProjectUpdate } | null;
  /** The project whose next milestone is the client's next step (or, if none is theirs, the soonest one). */
  next: PortalProject | null;
}

export function summarize(projects: readonly PortalProject[] = PORTAL_PROJECTS): PortalSummary {
  const buckets: Record<ProjectBucket, number> = { active: 0, support: 0, paused: 0, closed: 0 };
  let last: PortalSummary['last'] = null;
  for (const project of projects) {
    buckets[bucketOf(project)] += 1;
    const update = latestUpdate(project);
    if (update && (!last || update.date > last.update.date)) last = { project, update };
  }
  const soonest = (list: readonly PortalProject[]) =>
    [...list].sort((a, b) => a.nextMilestone.due.localeCompare(b.nextMilestone.due))[0] ?? null;
  const theirs = projects.filter((p) => isViewer(p.nextMilestone.owner) || personById(p.nextMilestone.owner)?.side === 'client');
  return {
    total: projects.length,
    buckets,
    waiting: projects.filter((p) => p.action),
    last,
    next: soonest(theirs) ?? soonest(projects),
  };
}

/** Valid ISO calendar date (YYYY-MM-DD) that round-trips through Date. */
export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
