/**
 * Client portal mockup (v3) — data contract of the demo fixtures.
 *
 * Frontend only: there is no backend, auth or storage behind any of this. Fixtures hold
 * structure (ids, stages, dates, people, versions); every word lives in the `portal`
 * message namespace (`portal.demo.projects.<id>.…`), like the demos keep theirs.
 * Dates are calendar dates as ISO strings (YYYY-MM-DD), read as UTC.
 */
import type { ItemId, MaintenanceId } from '@/lib/content';

/** The five public stages every project goes through, in order: "1 de 5" … "5 de 5". */
export const MAIN_STAGES = ['preparation', 'build', 'eclipseReview', 'clientReview', 'delivery'] as const;
export type MainStageId = (typeof MAIN_STAGES)[number];

/** Outside the five: Soporte (only while maintenance is contracted), En pausa and Cerrado. */
export const EXTRA_STAGES = ['support', 'paused', 'closed'] as const;
export type ExtraStageId = (typeof EXTRA_STAGES)[number];

export type StageId = MainStageId | ExtraStageId;

/** ISO calendar date, e.g. "2026-10-01". */
export type IsoDate = string;

export type PersonSide = 'eclipse' | 'client';
export type RoleId = 'projectLead' | 'developer' | 'designer' | 'clientAdmin' | 'clientCollaborator';

/** A fictional person. Names are proper nouns (same in every locale); roles are messages. */
export interface Person {
  name: string;
  side: PersonSide;
  role: RoleId;
}

/** A span of the timeline: a main stage (or Soporte) with its start and, once left, its end. */
export interface StageSpan {
  stage: MainStageId | 'support';
  start: IsoDate;
  end?: IsoDate;
}

/** Next milestone. Copy: `…<id>.milestone`. The date is always an estimate, never a commitment. */
export interface Milestone {
  owner: string;
  due: IsoDate;
}

/** What the client has to do now. Copy: `…<id>.action.title|detail`. Shown disabled ("requiere backend"). */
export interface ClientAction {
  kind: 'approve' | 'confirm' | 'upload';
  requestedOn: IsoDate;
}

/** Why the project is on hold and who unblocks it. Copy: `…<id>.pause.reason|next`. */
export interface Pause {
  since: IsoDate;
  owner: string;
}

/** A dated update written by Eclipse. Copy: `…<id>.updates.<updateId>.title|body`. */
export interface ProjectUpdate {
  id: string;
  date: IsoDate;
  author: string;
  /** Present when the update records a stage transition (`from: null` = the project started). */
  stageChange?: { from: StageId | null; to: StageId };
}

/** Lifecycle of a change request (portal spec): recibida → en evaluación → estimada → aprobada/rechazada → cerrada. */
export const CHANGE_FLOW = ['received', 'evaluating', 'estimated', 'accepted', 'rejected', 'closed'] as const;
export type ChangeStatus = (typeof CHANGE_FLOW)[number];

/** Copy: `…<id>.changes.<changeId>.title|detail|impact`. Only `accepted` ones are part of the scope. */
export interface ChangeRequest {
  id: string;
  status: ChangeStatus;
  requestedOn: IsoDate;
  requestedBy: string;
  /** When the acceptance (or rejection) was recorded. */
  decidedOn?: IsoDate;
}

export type DocCategory = 'proposal' | 'input' | 'decision' | 'deliverable' | 'manual' | 'record';

/** A document placeholder: metadata only, never a link or a file. Copy: `…<id>.docs.<docId>`. */
export interface ProjectDocument {
  id: string;
  category: DocCategory;
  version: string;
  date: IsoDate;
  author: string;
}

export interface PortalProject {
  /** URL segment: /[locale]/portal/proyectos/<id>/ */
  id: string;
  /** Display code, clearly fictional (mono). */
  code: string;
  /** Services, by content item id (names come from /content through lib/content). */
  items: ItemId[];
  /** Maintenance plan (content id) — required for Soporte. */
  maintenance?: MaintenanceId;
  stage: StageId;
  /** For `paused`: the main stage where work stopped. */
  pausedIn?: MainStageId;
  pause?: Pause;
  /** Project start: the day the deposit (seña) was recorded. */
  startedOn: IsoDate;
  /** Eclipse project lead. */
  lead: string;
  /** Completed and current spans, oldest first. */
  history: StageSpan[];
  nextMilestone: Milestone;
  action?: ClientAction;
  /** Estimated delivery date, if the project hasn't been delivered yet. */
  deliveryEstimate?: IsoDate;
  /** Newest first. */
  updates: ProjectUpdate[];
  scope: { version: string; approvedOn: IsoDate; items: string[] };
  changes: ChangeRequest[];
  documents: ProjectDocument[];
}
