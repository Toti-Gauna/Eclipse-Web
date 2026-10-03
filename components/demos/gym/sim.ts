/**
 * Simulation state for the gym demo.
 *
 * A tiny external store holds what both screens must agree on (story tick,
 * the member's own actions, comeback missions sent by the owner). When the
 * laptop and the phone of the same showcase are on screen they share one store,
 * so a check-in on the phone moves the leaderboard on the laptop.
 * Everything visible is *derived* from that state with pure functions, which is
 * what lets reduced motion jump straight to the final state.
 */
import {
  ACTIVE_MEMBERS,
  AT_RISK,
  AT_RISK_TOTAL,
  AUTO_CARDIO,
  AUTO_CHECKIN,
  BOARD,
  CARDIO_STEP,
  CHECKINS_BASE,
  CHECKIN_POINTS,
  FRIEND_DELAY,
  HIGH_RISK_DAYS,
  ME,
  MEMBERS,
  MISSIONS,
  MISSION_COUNTS,
  STORY,
  WEEK_BONUS,
  missionById,
  type MemberId,
  type MissionId,
  type RiskState,
} from './data';

export interface SimState {
  tick: number;
  /** Ticks of the member's own actions (null = not yet). */
  checkIn: number | null;
  cardio: number | null;
  invite: number | null;
  /** Automatic member actions only happen before this tick (the visitor took over). */
  autoUntil: number;
  /** Comeback missions the owner sent by hand: member → tick. */
  sent: Partial<Record<MemberId, number>>;
  /** Bumped on every replay (React keys replay the entrances). */
  round: number;
}

export interface GymStore {
  readonly paired: boolean;
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => SimState;
  report: (tick: number) => void;
  checkIn: () => void;
  logCardio: () => void;
  invite: () => void;
  sendNow: (id: MemberId) => void;
  /** Start the member's day again (the story of the others keeps its course). */
  replay: () => void;
}

export function createGymStore(paired = false): GymStore {
  let state: SimState = { tick: 0, checkIn: null, cardio: null, invite: null, autoUntil: Infinity, sent: {}, round: 0 };
  const listeners = new Set<() => void>();
  const set = (next: SimState) => {
    state = next;
    listeners.forEach((l) => l());
  };
  // The visitor acted: what already happened on its own stays, nothing else is automatic.
  const manual = (patch: Partial<SimState>) => set({ ...state, ...patch, autoUntil: Math.min(state.autoUntil, state.tick) });
  return {
    paired,
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot: () => state,
    report(tick) {
      // Both screens tick in lockstep: keep the furthest one, never add them up.
      if (tick > state.tick) set({ ...state, tick });
    },
    checkIn() {
      if (state.checkIn === null) manual({ checkIn: state.tick });
    },
    logCardio() {
      if (state.cardio === null) manual({ cardio: state.tick });
    },
    invite() {
      if (state.invite === null) manual({ invite: state.tick });
    },
    sendNow(id) {
      if (state.sent[id] === undefined) set({ ...state, sent: { ...state.sent, [id]: state.tick } });
    },
    replay() {
      set({ ...state, checkIn: null, cardio: null, invite: null, autoUntil: -Infinity, round: state.round + 1 });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Pairing: laptop + phone of the same showcase share a store           */
/* ------------------------------------------------------------------ */
const sharedStores = new WeakMap<Element, GymStore>();

/**
 * Finds the element that wraps exactly one laptop and one phone (the
 * <DemoShowcase> "both" layout) around `el`. Null when the phone is alone.
 */
function findPairHost(el: Element): Element | null {
  let node = el.closest('.device-phone, .device-laptop')?.parentElement ?? null;
  for (let depth = 0; node && depth < 4; depth++, node = node.parentElement) {
    const laptops = node.querySelectorAll('.device-laptop').length;
    const phones = node.querySelectorAll('.device-phone').length;
    if (laptops === 1 && phones === 1) return node;
    if (laptops > 1 || phones > 1) return null;
  }
  return null;
}

/** The phone that sits on top of this laptop in the same showcase, if any. */
export function pairedPhoneOf(el: Element): Element | null {
  return findPairHost(el)?.querySelector('.device-phone') ?? null;
}

export function pairedStoreFor(el: Element): GymStore | null {
  const host = findPairHost(el);
  if (!host) return null;
  let store = sharedStores.get(host);
  if (!store) {
    store = createGymStore(true);
    sharedStores.set(host, store);
  }
  return store;
}

/* ------------------------------------------------------------------ */
/* Derived world                                                         */
/* ------------------------------------------------------------------ */
export type EventKind = 'auto' | 'checkin' | 'return' | 'mission' | 'bonus' | 'invite' | 'friend' | 'sent' | 'rankUp' | 'rankDown';

export interface GymEvent {
  id: string;
  at: number;
  kind: EventKind;
  member: MemberId;
  mission?: MissionId;
  /** Streak after a check-in, or days away for a comeback. */
  count?: number;
  points?: number;
  rank?: number;
  /** rankDown: who passed the member. */
  by?: MemberId;
}

export type RiskView = RiskState | 'sentNow' | 'back';

export interface MemberView {
  id: MemberId;
  week: number;
  month: number;
  streak: number;
  lastVisit: number;
  missions: number;
  /** Set for flagged members. */
  risk: { days: number; high: boolean; state: RiskView } | null;
  /** Story tick of the last visible change (for "just now" highlights). */
  changedAt: number;
}

export interface MeView {
  checkedIn: boolean;
  checkInAt: number | null;
  cardioAt: number | null;
  invitedAt: number | null;
  friendAt: number | null;
  progress: Record<MissionId, number>;
  doneAt: Partial<Record<MissionId, number>>;
  completed: number;
  bonusAt: number | null;
  points: number;
  streak: number;
  rank: number;
  startRank: number;
}

export interface Kpis {
  active: number;
  atRisk: number;
  checkins: number;
  missionsWeek: number;
  missionCounts: Record<MissionId, number>;
  returnsToday: number;
}

export interface World {
  members: Record<MemberId, MemberView>;
  me: MeView;
  events: GymEvent[];
  kpis: Kpis;
}

/** Ranking order of the leaderboard (ties: whoever was there first stays ahead). */
export function standings(members: Record<MemberId, MemberView>, board: 'week' | 'month'): MemberView[] {
  return BOARD.map((id, i) => ({ m: members[id], i }))
    .sort((a, b) => b.m[board] - a.m[board] || a.i - b.i)
    .map((x) => x.m);
}

const rankOf = (members: Record<MemberId, MemberView>, id: MemberId) => standings(members, 'week').findIndex((m) => m.id === id) + 1;

export function deriveWorld(state: SimState, reduced: boolean): World {
  const { tick } = state;
  const auto = (at: number) => !reduced && at <= tick && at < state.autoUntil;
  const checkInAt = state.checkIn ?? (auto(AUTO_CHECKIN) ? AUTO_CHECKIN : null);
  const cardioAt = state.cardio ?? (auto(AUTO_CARDIO) ? AUTO_CARDIO : null);
  const invitedAt = state.invite;
  // With reduced motion the clock stands still: the friend shows up at once.
  const friendAt = invitedAt === null ? null : reduced ? invitedAt : invitedAt + FRIEND_DELAY <= tick ? invitedAt + FRIEND_DELAY : null;

  const members = Object.fromEntries(
    MEMBERS.map((m) => {
      const risk = AT_RISK.find((r) => r.id === m.id);
      const sentAt = state.sent[m.id];
      const view: MemberView = {
        ...m,
        risk: risk
          ? { days: m.lastVisit, high: m.lastVisit >= HIGH_RISK_DAYS, state: risk.state === 'queued' && sentAt !== undefined ? 'sentNow' : risk.state }
          : null,
        changedAt: risk?.state === 'queued' && sentAt !== undefined ? sentAt : -Infinity,
      };
      return [m.id, view];
    }),
  ) as Record<MemberId, MemberView>;

  const events: GymEvent[] = [
    { id: 'pre-auto', at: -2, kind: 'auto', member: ME, count: AT_RISK.filter((r) => r.state === 'sent').length },
    { id: 'pre-julia', at: -1, kind: 'checkin', member: 'julia', count: members.julia.streak },
  ];
  const progress = Object.fromEntries(MISSIONS.map((m) => [m.id, m.start])) as Record<MissionId, number>;
  const doneAt: Partial<Record<MissionId, number>> = {};
  for (const m of MISSIONS) if (m.start >= m.goal) doneAt[m.id] = -Infinity;

  const touch = (id: MemberId, at: number, patch: Partial<MemberView>) => {
    members[id] = { ...members[id], ...patch, changedAt: at };
  };
  const award = (id: MemberId, at: number, points: number) => {
    touch(id, at, { week: members[id].week + points, month: members[id].month + points });
  };
  const checkIn = (id: MemberId, at: number) => {
    const m = members[id];
    const streak = m.lastVisit <= 1 ? m.streak + 1 : 1;
    touch(id, at, { streak, lastVisit: 0 });
    award(id, at, CHECKIN_POINTS);
    return streak;
  };
  const round = state.round;
  let bonusAt: number | null = null;
  const complete = (id: MemberId, at: number, mission: MissionId) => {
    const { reward, goal } = missionById(mission);
    touch(id, at, { missions: members[id].missions + 1 });
    award(id, at, reward);
    events.push({ id: `mission-${id}-${mission}-${at}-${round}`, at, kind: 'mission', member: id, mission, points: reward });
    if (id !== ME) return;
    doneAt[mission] = at;
    progress[mission] = goal;
    // Every mission of the week done: bonus.
    if (MISSIONS.every((m) => doneAt[m.id] !== undefined)) {
      bonusAt = at;
      award(ME, at, WEEK_BONUS);
      events.push({ id: `me-bonus-${round}`, at, kind: 'bonus', member: ME, points: WEEK_BONUS });
    }
  };

  // Scripted story + the member's own actions, in time order (story first on ties).
  const steps: { at: number; order: number; run: () => void }[] = STORY.filter((s) => s.at <= tick).map((s, i) => ({
    at: s.at,
    order: i,
    run: () => {
      if (s.kind === 'return') {
        const days = members[s.member].lastVisit;
        checkIn(s.member, s.at);
        const risk = members[s.member].risk;
        touch(s.member, s.at, { risk: risk ? { ...risk, state: 'back' } : null });
        events.push({ id: `return-${s.member}`, at: s.at, kind: 'return', member: s.member, count: days });
        return;
      }
      const streak = checkIn(s.member, s.at);
      events.push({ id: `checkin-${s.member}-${s.at}`, at: s.at, kind: 'checkin', member: s.member, count: streak });
      if (s.mission) complete(s.member, s.at, s.mission);
    },
  }));

  if (checkInAt !== null) {
    steps.push({
      at: checkInAt,
      order: 100,
      run: () => {
        const streak = checkIn(ME, checkInAt);
        events.push({ id: `me-checkin-${round}`, at: checkInAt, kind: 'checkin', member: ME, count: streak, points: CHECKIN_POINTS });
        progress.days = Math.min(missionById('days').goal, progress.days + 1);
        if (progress.days >= missionById('days').goal) complete(ME, checkInAt, 'days');
      },
    });
  }
  if (cardioAt !== null) {
    steps.push({
      at: cardioAt,
      order: 101,
      run: () => {
        progress.cardio = Math.min(missionById('cardio').goal, progress.cardio + CARDIO_STEP);
        if (progress.cardio >= missionById('cardio').goal) complete(ME, cardioAt, 'cardio');
      },
    });
  }
  if (invitedAt !== null) {
    steps.push({
      at: invitedAt,
      order: 102,
      run: () => events.push({ id: `me-invite-${round}`, at: invitedAt, kind: 'invite', member: ME }),
    });
  }
  if (friendAt !== null) {
    steps.push({
      at: friendAt,
      order: 103,
      run: () => {
        events.push({ id: `me-friend-${round}`, at: friendAt, kind: 'friend', member: ME });
        complete(ME, friendAt, 'friend');
      },
    });
  }
  for (const [id, at] of Object.entries(state.sent) as [MemberId, number][]) {
    steps.push({ at, order: 200, run: () => events.push({ id: `sent-${id}`, at, kind: 'sent', member: id }) });
  }

  const startRank = rankOf(members, ME);
  let rank = startRank;
  steps
    .sort((a, b) => a.at - b.at || a.order - b.order)
    .forEach((step, i, all) => {
      step.run();
      // Rank changes are read once per tick (after everything that happened in it).
      if (all[i + 1]?.at === step.at) return;
      const next = rankOf(members, ME);
      if (next === rank) return;
      const kind = next < rank ? 'rankUp' : 'rankDown';
      const by = kind === 'rankDown' ? standings(members, 'week')[next - 2]?.id : undefined;
      events.push({ id: `rank-${step.at}-${next}-${round}`, at: step.at, kind, member: ME, rank: next, by });
      rank = next;
    });

  events.sort((a, b) => a.at - b.at);

  const today = events.filter((e) => e.at >= 0);
  const missionCounts = { ...MISSION_COUNTS };
  for (const e of today) if (e.kind === 'mission' && e.mission) missionCounts[e.mission] += 1;
  const returnsToday = today.filter((e) => e.kind === 'return').length;
  const me = members[ME];

  return {
    members,
    events,
    me: {
      checkedIn: checkInAt !== null,
      checkInAt,
      cardioAt,
      invitedAt,
      friendAt,
      progress,
      doneAt,
      completed: MISSIONS.filter((m) => doneAt[m.id] !== undefined).length,
      bonusAt,
      points: me.week,
      streak: me.streak,
      rank,
      startRank,
    },
    kpis: {
      active: ACTIVE_MEMBERS,
      atRisk: AT_RISK_TOTAL - returnsToday,
      checkins: CHECKINS_BASE + today.filter((e) => e.kind === 'checkin' || e.kind === 'return' || e.kind === 'friend').length,
      missionsWeek: Object.values(missionCounts).reduce((a, b) => a + b, 0),
      missionCounts,
      returnsToday,
    },
  };
}

/** Events that just happened (this tick or the previous one). */
export function isFresh(e: { at: number }, tick: number): boolean {
  return e.at >= 0 && tick - e.at <= 1;
}
