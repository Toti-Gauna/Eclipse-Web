/**
 * Fictional data for the "Órbita Fitness" demo. Names are message keys
 * (namespace `demoGym`), so every locale can use its own names.
 * Time is measured in demo "ticks" (useDemoClock); "now" is 9:41 on a fixed
 * Thursday, the same day as the other demos.
 */

export const ACCENT = '#5b34d6';
export const TICK_MS = 1600;
/** Effectively endless (the member's week can be replayed); reduced motion jumps here. */
export const MAX_TICK = 100_000;

/** Monday of the demo week (UTC). Days: 0 = Monday … 6 = Sunday. */
export const WEEK_START = Date.UTC(2026, 9, 5);
export const TODAY = 3;
/** 9:41 — the demo's "now" (matches the phone status bar). */
export const NOW_MIN = 581;
export const dayDate = (day: number) => new Date(WEEK_START + day * 86_400_000);

export type MemberId =
  | 'sol'
  | 'ana'
  | 'bruno'
  | 'carla'
  | 'lucas'
  | 'elena'
  | 'tomas'
  | 'julia'
  | 'mateo'
  | 'diego'
  | 'paula'
  | 'martin'
  | 'renata'
  | 'sebastian'
  | 'julian';

/** The member whose app is on the phone (the visitor plays this member). */
export const ME: MemberId = 'sol';

export interface MemberBase {
  id: MemberId;
  /** Ranking points at 9:41: this week / this month. */
  week: number;
  month: number;
  /** Days in a row with a check-in (0 = no streak). */
  streak: number;
  /** Days since the last check-in (0 = today). */
  lastVisit: number;
  /** Missions completed this week (of MISSIONS.length). */
  missions: number;
  /** Avatar color (marks only, never text). */
  color: string;
}

/** The weekly leaderboard (sorted by `week`) followed by members at risk. */
export const MEMBERS: MemberBase[] = [
  { id: 'ana', week: 560, month: 1840, streak: 18, lastVisit: 1, missions: 2, color: '#c0477f' },
  { id: 'bruno', week: 505, month: 2010, streak: 21, lastVisit: 1, missions: 2, color: '#0d6b74' },
  { id: 'carla', week: 455, month: 1690, streak: 9, lastVisit: 1, missions: 2, color: '#b45309' },
  { id: 'lucas', week: 410, month: 1560, streak: 7, lastVisit: 1, missions: 1, color: '#2f4590' },
  { id: 'elena', week: 365, month: 1420, streak: 4, lastVisit: 1, missions: 1, color: '#7c3aed' },
  { id: 'sol', week: 340, month: 1385, streak: 12, lastVisit: 1, missions: 1, color: ACCENT },
  { id: 'tomas', week: 300, month: 1450, streak: 0, lastVisit: 3, missions: 1, color: '#166534' },
  { id: 'julia', week: 265, month: 1105, streak: 3, lastVisit: 0, missions: 1, color: '#be123c' },
  { id: 'mateo', week: 240, month: 960, streak: 0, lastVisit: 2, missions: 0, color: '#475569' },
  { id: 'diego', week: 0, month: 120, streak: 0, lastVisit: 9, missions: 0, color: '#0e7490' },
  { id: 'paula', week: 0, month: 80, streak: 0, lastVisit: 12, missions: 0, color: '#a16207' },
  { id: 'martin', week: 0, month: 40, streak: 0, lastVisit: 15, missions: 0, color: '#4d7c0f' },
  { id: 'sebastian', week: 0, month: 0, streak: 0, lastVisit: 22, missions: 0, color: '#6d28d9' },
  { id: 'julian', week: 0, month: 160, streak: 0, lastVisit: 8, missions: 0, color: '#9f1239' },
  { id: 'renata', week: 0, month: 200, streak: 0, lastVisit: 7, missions: 0, color: '#1d4ed8' },
];
export const memberBase = (id: MemberId) => MEMBERS.find((m) => m.id === id)!;
/** Who appears on the leaderboard. */
export const BOARD: MemberId[] = ['ana', 'bruno', 'carla', 'lucas', 'elena', 'sol', 'tomas', 'julia', 'mateo'];

/* ------------------------------------------------------------------ */
/* Missions and points                                                  */
/* ------------------------------------------------------------------ */
export type MissionId = 'days' | 'cardio' | 'class' | 'friend';

export interface Mission {
  id: MissionId;
  goal: number;
  /** The member's progress at 9:41. */
  start: number;
  reward: number;
}

export const MISSIONS: Mission[] = [
  { id: 'days', goal: 4, start: 3, reward: 100 },
  { id: 'cardio', goal: 60, start: 40, reward: 70 },
  { id: 'class', goal: 1, start: 1, reward: 80 },
  { id: 'friend', goal: 1, start: 0, reward: 150 },
];
export const missionById = (id: MissionId) => MISSIONS.find((m) => m.id === id)!;
/** Minutes logged by the "cardio" action. */
export const CARDIO_STEP = 20;
export const CHECKIN_POINTS = 40;
/** Bonus for completing every mission of the week. */
export const WEEK_BONUS = 200;
/** Streak badges (days). */
export const MILESTONES = [7, 14, 30];
/** Days the member trained this week before today (Mon–Wed). */
export const TRAINED_DAYS = [0, 1, 2];

/* ------------------------------------------------------------------ */
/* Live story (other members)                                           */
/* ------------------------------------------------------------------ */
export interface StoryStep {
  at: number;
  kind: 'checkin' | 'return';
  member: MemberId;
  /** A check-in that completes a mission. */
  mission?: MissionId;
}

export const STORY: StoryStep[] = [
  { at: 1, kind: 'checkin', member: 'bruno' },
  { at: 3, kind: 'return', member: 'diego' },
  { at: 5, kind: 'checkin', member: 'ana', mission: 'cardio' },
  { at: 9, kind: 'return', member: 'paula' },
  { at: 11, kind: 'checkin', member: 'lucas' },
  { at: 16, kind: 'checkin', member: 'carla', mission: 'days' },
  { at: 18, kind: 'return', member: 'martin' },
  { at: 21, kind: 'checkin', member: 'elena' },
];

/**
 * If the visitor doesn't act, the member checks in and logs cardio on their own,
 * so a passive viewer still sees the streak grow and the member climb.
 */
export const AUTO_CHECKIN = 7;
export const AUTO_CARDIO = 13;
/** Ticks between sending the guest pass and the friend checking in. */
export const FRIEND_DELAY = 3;

/* ------------------------------------------------------------------ */
/* Owner's side                                                          */
/* ------------------------------------------------------------------ */
export const ACTIVE_MEMBERS = 312;
/** Check-ins today before 9:41. */
export const CHECKINS_BASE = 41;
/** Missions completed this week before 9:41, by mission (sum = weekly total). */
export const MISSION_COUNTS: Record<MissionId, number> = { days: 52, cardio: 81, class: 44, friend: 19 };
/** Members with at least one mission this week (share of active members). */
export const PARTICIPATION = 0.41;

export type RiskState = 'sent' | 'queued';
/** Flagged members shown in the list (no check-in for 7+ days). */
export const AT_RISK: { id: MemberId; state: RiskState }[] = [
  { id: 'sebastian', state: 'sent' },
  { id: 'martin', state: 'sent' },
  { id: 'paula', state: 'sent' },
  { id: 'diego', state: 'sent' },
  { id: 'julian', state: 'queued' },
  { id: 'renata', state: 'queued' },
];
/** Days without a check-in that flag a member as at risk. */
export const RISK_DAYS = 7;
/** All flagged members (the list shows the six most urgent). */
export const AT_RISK_TOTAL = 18;
/** Comeback missions the automation sent yesterday (the `sent` ones above). */
export const AUTO_SENT = AT_RISK.filter((r) => r.state === 'sent').length;
/** Days without coming that flag a member as high risk. */
export const HIGH_RISK_DAYS = 14;
/** Queued comeback missions go out at 18:00. */
export const QUEUED_AT_MIN = 18 * 60;

/** Cancellations per month: before missions and streaks, then with them (last = before − key number). */
export const CHURN_BEFORE = [12, 13, 11];
export const CHURN_AFTER_TREND = [11, 10];
/** Months of the chart (0 = January): April … September 2026. */
export const CHURN_MONTHS = [3, 4, 5, 6, 7, 8];
