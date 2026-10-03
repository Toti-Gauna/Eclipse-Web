/**
 * Clínica Aurora — the live story and everything derived from it.
 *
 * One store per showcase (laptop + phone share it) holds only what the visitor did;
 * every screen DERIVES the day from (story time t, that state) with `deriveClinic`,
 * which is pure: pausing, looping, reduced motion (t = end) and two screens in sync
 * come for free.
 *
 * The ~31 s loop: Camila books online · Valentina confirms by WhatsApp · Nicolás
 * cancels and the waitlist refills his slot (Paula) · Martina's reminder: she
 * reschedules, her 11:30 frees up · Julián calls, the AI receptionist books him
 * into that 11:30 and confirms by WhatsApp. Recovered this week: 9 → 12.
 */
import { createDemoStore, runChat, runVoice, type ChatPick, type ChatRun, type ChatScript, type DemoStore, type VoiceScript, type VoiceState } from '../kit';
import {
  BASE_DAY,
  DAY_END,
  LOOP_MS,
  MARTINA_OPTIONS,
  RECOVERED_BASE,
  STEP,
  STORY,
  TREATMENTS,
  WAITLIST_OFFERED,
  WAITLIST_START,
  storyClock,
  type PatientId,
  type ProId,
  type Status,
  type TreatmentId,
} from './data';

/* ------------------------------------------------------------------ */
/* State (what the visitor did) + store                                 */
/* ------------------------------------------------------------------ */
export type Automation = 'waitlist' | 'voice';
export interface Range {
  from: number;
  to: number | null;
}
export interface MineBooking {
  pro: ProId;
  start: number;
  treatment: TreatmentId;
  /** Story time it was made (−1: an earlier loop). */
  at: number;
  via: 'agenda' | 'site';
}

export interface ClinicState {
  /** Martina's reminder chat (chat time). */
  picks: Record<string, ChatPick>;
  /** Camila's WhatsApp thread on the patient phone (thread time). */
  patientPicks: Record<string, ChatPick>;
  /** Site chatbot (time since it opened). */
  faqPicks: Record<string, ChatPick>;
  faqStart: number | null;
  mine: MineBooking[];
  /** When each switchable automation was off (story time). */
  off: Record<Automation, Range[]>;
  /** The visitor touched the patient phone's booking widget (no more autoplay this loop). */
  siteManual: boolean;
  /** Story time the patient's WhatsApp thread started (the visitor booked on the site). */
  patientThread: { at: number; pro: ProId; start: number; treatment: TreatmentId; day: number } | null;
}

const fresh = (): ClinicState => ({
  picks: {},
  patientPicks: {},
  faqPicks: {},
  faqStart: null,
  mine: [],
  off: { waitlist: [], voice: [] },
  siteManual: false,
  patientThread: null,
});
/** A switch left off stays off in the next loop. */
const carry = (ranges: Range[]): Range[] => (ranges.some((r) => r.to === null) ? [{ from: -1, to: null }] : []);

export type ClinicStore = DemoStore<ClinicState>;

/** Module-level (stable) factory for usePairedStore. */
export function createClinicStore(paired: boolean): ClinicStore {
  return createDemoStore<ClinicState>(fresh(), {
    loopMs: LOOP_MS,
    paired,
    onLoop: (s) => ({
      ...fresh(),
      mine: s.mine.map((m) => ({ ...m, at: -1 })),
      off: { waitlist: carry(s.off.waitlist), voice: carry(s.off.voice) },
    }),
  });
}

export const isOn = (ranges: Range[], at: number) => !ranges.some((r) => at >= r.from && (r.to === null || at < r.to));
export const isOffNow = (ranges: Range[]) => ranges.some((r) => r.to === null);

/** State updates (use with `store.update(...)`; `t` is the store's story time). */
export const act = {
  pickMartina: (step: string, reply: string) => (s: ClinicState, t: number): ClinicState => ({
    ...s,
    picks: { ...s.picks, [step]: { reply, at: t - STORY.chatStart } },
  }),
  pickPatient: (step: string, reply: string) => (s: ClinicState, t: number): ClinicState => ({
    ...s,
    patientPicks: { ...s.patientPicks, [step]: { reply, at: t - (s.patientThread?.at ?? STORY.site.push) } },
  }),
  /** The visitor booked on the public site: their own WhatsApp confirmation starts shortly after. */
  siteBooked: (b: { pro: ProId; start: number; treatment: TreatmentId; day: number }) => (s: ClinicState, t: number): ClinicState => ({
    ...s,
    siteManual: true,
    // Only today's bookings land in the agenda on screen.
    mine:
      b.day === 3 && !s.mine.some((m) => m.pro === b.pro && m.start === b.start)
        ? [...s.mine, { pro: b.pro, start: b.start, treatment: b.treatment, via: 'site', at: t }]
        : s.mine,
    patientThread: { ...b, at: t + 900 },
    patientPicks: {},
  }),
  openFaq: () => (s: ClinicState, t: number): ClinicState => (s.faqStart === null ? { ...s, faqStart: t } : s),
  pickFaq: (step: string, reply: string) => (s: ClinicState, t: number): ClinicState => ({
    ...s,
    faqPicks: { ...s.faqPicks, [step]: { reply, at: t - (s.faqStart ?? t) } },
  }),
  book: (b: Omit<MineBooking, 'at'>) => (s: ClinicState, t: number): ClinicState =>
    s.mine.some((m) => m.pro === b.pro && m.start === b.start) ? s : { ...s, mine: [...s.mine, { ...b, at: t }] },
  toggle: (id: Automation) => (s: ClinicState, t: number): ClinicState => {
    const ranges = s.off[id];
    const next = isOffNow(ranges) ? ranges.map((r) => (r.to === null ? { ...r, to: t } : r)) : [...ranges, { from: t, to: null }];
    return { ...s, off: { ...s.off, [id]: next } };
  },
  touchSite: () => (s: ClinicState): ClinicState => (s.siteManual ? s : { ...s, siteManual: true }),
};

/* ------------------------------------------------------------------ */
/* Script shapes (timing is fixed here; texts are added per locale)     */
/* ------------------------------------------------------------------ */
/** Martina's reminder conversation: step ids and timing. */
export const MARTINA_FLOW = {
  start: 'reminder',
  steps: {
    reminder: { from: 'bot', typingMs: 900, next: 'ask' },
    ask: { from: 'bot', typingMs: 700, replies: ['confirm', 'reschedule', 'cancel'], auto: 'reschedule', autoMs: 2000 },
    thanks: { from: 'bot', typingMs: 900, next: 'noteConfirmed' },
    noteConfirmed: { from: 'note' },
    offer: { from: 'bot', typingMs: 900, replies: ['opt0', 'opt1', 'opt2'], auto: 'opt0', autoMs: 1800 },
    moved: { from: 'bot', typingMs: 900, next: 'noteFreed' },
    cancelled: { from: 'bot', typingMs: 900, next: 'noteFreed' },
    noteFreed: { from: 'note' },
  },
} as const;
export const MARTINA_GOTO: Record<string, string> = { confirm: 'thanks', reschedule: 'offer', cancel: 'cancelled', opt0: 'moved', opt1: 'moved', opt2: 'moved' };

/** The AI receptionist's call: speaker + ms per line (texts per locale). Index 2 checks the agenda, 5 books. */
export const CALL_FLOW = {
  ringMs: 1600,
  lines: [
    { who: 'agent', ms: 2000, gapMs: 250 },
    { who: 'caller', ms: 1800, gapMs: 250 },
    { who: 'tool', ms: 1000, gapMs: 200 },
    { who: 'agent', ms: 2500, gapMs: 250 },
    { who: 'caller', ms: 1300, gapMs: 200 },
    { who: 'tool', ms: 800, gapMs: 250 },
    { who: 'agent', ms: 1800, gapMs: 250 },
  ],
} as const;
const CALL_TIMING: VoiceScript = { ringMs: CALL_FLOW.ringMs, lines: CALL_FLOW.lines.map((l) => ({ ...l, text: '' })) };
const CALL_STARTS = runVoice(CALL_TIMING, 0).starts;
/** Story times: the agent checks the agenda / the booking lands. */
export const CALL_CHECK_AT = STORY.callStart + CALL_STARTS[2];
export const CALL_BOOK_AT = STORY.callStart + CALL_STARTS[5];

/* ------------------------------------------------------------------ */
/* Derivation                                                           */
/* ------------------------------------------------------------------ */
export type Via = 'online' | 'whatsapp' | 'waitlist' | 'voice' | 'you';

export interface Appt {
  key: string;
  pro: ProId;
  start: number;
  end: number;
  patient: PatientId | 'you';
  treatment: TreatmentId;
  status: Status;
  via?: Via;
  /** Story time of the last change (−Infinity: as it was at 9:41). */
  changedAt: number;
  version: string;
}

export type EventKind = 'afterHours' | 'sent' | 'online' | 'confirm' | 'cancel' | 'offer' | 'waitlist' | 'reschedule' | 'call' | 'voice' | 'missed' | 'you';

export interface ClinicEvent {
  id: string;
  at: number;
  kind: EventKind;
  pro?: ProId;
  start?: number;
  patient?: PatientId;
  treatment?: TreatmentId;
  recovered?: 'reminder' | 'waitlist' | 'voice';
  /** reschedule: chosen option index. */
  option?: number;
  /** Clock time (minutes) for events from before the story. */
  clock?: number;
}

export type KanbanColumnId = 'freed' | 'offered' | 'won';
export interface RecoveryCard {
  id: string;
  column: KanbanColumnId;
  pro: ProId;
  start: number;
  /** Day index of the slot (today unless it's an earlier one). */
  day: number;
  note: 'cancelled' | 'rescheduled' | 'offerWaitlist' | 'offerBoth' | 'byWaitlist' | 'byVoice' | 'byYou';
  patient?: PatientId;
  changedAt: number;
}

export interface ClinicView {
  t: number;
  /** Story clock in minutes from midnight (9:41 → ~9:53). */
  clock: number;
  chat: ChatRun;
  martina: 'confirm' | 'reschedule' | 'cancel' | null;
  martinaOption: number | null;
  call: VoiceState;
  /** Where the AI receptionist books Julián (null if nothing fits). */
  callTarget: { pro: ProId; start: number } | null;
  /** The receptionist was off when the call came in. */
  callMissed: boolean;
  appts: Appt[];
  events: ClinicEvent[];
  recovered: { reminder: number; waitlist: number; voice: number; total: number };
  waitlist: number;
  cards: RecoveryCard[];
}

export const slotKey = (pro: ProId, start: number) => `${pro}@${start}`;

/** Chat script from the timing above + per-locale content. */
export function martinaScript(content: (step: string) => Partial<ChatScript['steps'][string]>, replyLabel: (id: string) => string): ChatScript {
  const steps: ChatScript['steps'] = {};
  for (const [id, s] of Object.entries(MARTINA_FLOW.steps)) {
    const shape = s as { from: 'bot' | 'note'; typingMs?: number; next?: string; replies?: readonly string[]; auto?: string; autoMs?: number };
    steps[id] = {
      from: shape.from,
      typingMs: shape.typingMs,
      next: shape.next,
      auto: shape.auto,
      autoMs: shape.autoMs,
      replies: shape.replies?.map((r) => ({ id: r, label: replyLabel(r), goto: MARTINA_GOTO[r] })),
      ...content(id),
    };
  }
  return { start: MARTINA_FLOW.start, steps };
}

/** Voice script from the timing above + per-locale texts (one per line). */
export function callScript(texts: string[], missed: boolean, icons: VoiceScript['lines'][number]['icon'][] = []): VoiceScript {
  return {
    ringMs: missed ? 5200 : CALL_FLOW.ringMs,
    missed,
    lines: CALL_FLOW.lines.map((l, i) => ({ ...l, text: texts[i] ?? '', icon: icons[i] })),
  };
}

/**
 * The whole day at story time `t`. `martina` is the chat script (any locale: only
 * its structure matters here); `voiceTexts(target)` gives the call's lines.
 */
export function deriveClinic(
  state: ClinicState,
  t: number,
  instant: boolean,
  martina: ChatScript,
  voiceTexts: (target: { pro: ProId; start: number } | null) => { texts: string[]; icons?: VoiceScript['lines'][number]['icon'][] },
): ClinicView {
  const chat = runChat(martina, t - STORY.chatStart, state.picks, { instant });
  const choice = chat.chosen.ask as 'confirm' | 'reschedule' | 'cancel' | undefined;
  const option = chat.chosen.offer ? Number(chat.chosen.offer.slice(3)) : null;

  const map = new Map<string, Appt>();
  for (const b of BASE_DAY) {
    const key = slotKey(b.pro, b.start);
    map.set(key, {
      key,
      pro: b.pro,
      start: b.start,
      end: b.start + TREATMENTS[b.treatment].minutes,
      patient: b.patient,
      treatment: b.treatment,
      status: b.status,
      changedAt: -Infinity,
      version: 'base',
    });
  }
  // Earlier this morning: an after-hours call booked by the AI, then the day's reminders.
  const events: ClinicEvent[] = [
    { id: 'after-hours', at: -2, kind: 'afterHours', clock: 485 },
    { id: 'sent', at: -1, kind: 'sent', clock: 540 },
  ];
  const cards: RecoveryCard[] = [
    { id: 'w1', column: 'won', pro: 'sofia', start: 750, day: 2, note: 'byWaitlist', patient: 'rocio', changedAt: -Infinity },
    { id: 'w2', column: 'won', pro: 'tomas', start: 600, day: 1, note: 'byVoice', patient: 'bruno', changedAt: -Infinity },
  ];
  const recovered = { ...RECOVERED_BASE };
  let waitlist = WAITLIST_START;
  let callTarget: { pro: ProId; start: number } | null = null;

  /** Is [start, start+minutes) free for `pro` (no live appointment)? */
  const isFree = (pro: ProId, start: number, minutes: number) => {
    for (const ap of map.values()) {
      if (ap.pro !== pro || ap.status === 'freed') continue;
      if (start < ap.end && ap.start < start + minutes) return false;
    }
    return start + minutes <= DAY_END;
  };
  const put = (ap: Omit<Appt, 'key' | 'end' | 'version'>, version: string) => {
    const key = slotKey(ap.pro, ap.start);
    // A booking replaces a freed ghost in the same place.
    for (const [k, other] of map) if (other.pro === ap.pro && other.status === 'freed' && other.start < ap.start + TREATMENTS[ap.treatment].minutes && ap.start < other.end) map.delete(k);
    map.set(key, { ...ap, key, end: ap.start + TREATMENTS[ap.treatment].minutes, version });
  };
  const patch = (pro: ProId, start: number, at: number, change: Partial<Appt>, version: string) => {
    const key = slotKey(pro, start);
    const cur = map.get(key);
    if (cur) map.set(key, { ...cur, ...change, changedAt: at, version });
  };
  const card = (id: string, change: Partial<RecoveryCard> & { at: number }) => {
    const i = cards.findIndex((c) => c.id === id);
    const { at, ...rest } = change;
    if (i >= 0) cards[i] = { ...cards[i], ...rest, changedAt: at };
    else cards.push({ id, column: 'freed', pro: 'lucia', start: 0, day: 3, note: 'cancelled', ...rest, changedAt: at } as RecoveryCard);
  };

  const steps: { at: number; run: () => void }[] = [];
  const S = STORY;

  // Camila books on the public site.
  steps.push({
    at: S.site.booked,
    run: () => {
      const c = S.camila;
      if (!isFree(c.pro, c.start, TREATMENTS[c.treatment].minutes)) return;
      put({ pro: c.pro, start: c.start, patient: 'camila', treatment: c.treatment, status: 'new', via: 'online', changedAt: S.site.booked }, 'online');
      events.push({ id: 'online', at: S.site.booked, kind: 'online', pro: c.pro, start: c.start, patient: 'camila', treatment: c.treatment });
    },
  });
  // Valentina confirms her reminder.
  steps.push({
    at: S.valentina.at,
    run: () => {
      patch(S.valentina.pro, S.valentina.start, S.valentina.at, { status: 'confirmed', via: 'whatsapp' }, 'confirmed');
      events.push({ id: 'valentina', at: S.valentina.at, kind: 'confirm', pro: S.valentina.pro, start: S.valentina.start, patient: 'valentina' });
    },
  });
  // Nicolás cancels; the waitlist takes over (if it's on).
  const n = S.nicolas;
  steps.push({
    at: n.cancel,
    run: () => {
      patch(n.pro, n.start, n.cancel, { status: 'freed', via: 'whatsapp' }, 'freed');
      events.push({ id: 'nicolas', at: n.cancel, kind: 'cancel', pro: n.pro, start: n.start, patient: 'nicolas' });
      card('nicolas', { at: n.cancel, column: 'freed', pro: n.pro, start: n.start, day: 3, note: 'cancelled', patient: 'nicolas' });
    },
  });
  const offered = isOn(state.off.waitlist, n.offer);
  steps.push({
    at: n.offer,
    run: () => {
      if (!offered || map.get(slotKey(n.pro, n.start))?.status !== 'freed') return;
      events.push({ id: 'offer', at: n.offer, kind: 'offer', pro: n.pro, start: n.start });
      card('nicolas', { at: n.offer, column: 'offered', note: 'offerWaitlist' });
    },
  });
  steps.push({
    at: n.refill,
    run: () => {
      if (!offered || map.get(slotKey(n.pro, n.start))?.status !== 'freed') return;
      put({ pro: n.pro, start: n.start, patient: 'paula', treatment: n.refillTreatment, status: 'waitlist', via: 'waitlist', changedAt: n.refill }, 'waitlist');
      events.push({ id: 'paula', at: n.refill, kind: 'waitlist', pro: n.pro, start: n.start, patient: 'paula', recovered: 'waitlist' });
      card('nicolas', { at: n.refill, column: 'won', note: 'byWaitlist', patient: 'paula' });
      recovered.waitlist += 1;
      waitlist -= 1;
    },
  });
  // Martina answers her reminder.
  const m = S.martina;
  if (choice) {
    const stepId = choice === 'confirm' ? 'thanks' : choice === 'reschedule' ? 'moved' : 'cancelled';
    const rel = chat.at[stepId];
    if (rel !== undefined) {
      const at = S.chatStart + rel;
      steps.push({
        at,
        run: () => {
          if (choice === 'confirm') {
            patch(m.pro, m.start, at, { status: 'confirmed', via: 'whatsapp' }, 'confirmed');
            events.push({ id: 'martina', at, kind: 'confirm', pro: m.pro, start: m.start, patient: 'martina', recovered: 'reminder' });
            recovered.reminder += 1;
            return;
          }
          patch(m.pro, m.start, at, { status: 'freed', via: 'whatsapp' }, 'freed');
          const kind = choice === 'reschedule' ? 'reschedule' : 'cancel';
          events.push({
            id: 'martina',
            at,
            kind,
            pro: m.pro,
            start: m.start,
            patient: 'martina',
            option: option ?? undefined,
            recovered: kind === 'reschedule' ? 'reminder' : undefined,
          });
          if (kind === 'reschedule') recovered.reminder += 1;
          card('martina', { at, column: 'freed', pro: m.pro, start: m.start, day: 3, note: kind === 'reschedule' ? 'rescheduled' : 'cancelled', patient: 'martina' });
          steps.push({
            at: at + 700,
            run: () => {
              if (map.get(slotKey(m.pro, m.start))?.status === 'freed') card('martina', { at: at + 700, column: 'offered', note: 'offerBoth' });
            },
          });
        },
      });
    }
  }
  // The visitor's own bookings.
  for (const b of state.mine) {
    steps.push({
      at: b.at,
      run: () => {
        if (!isFree(b.pro, b.start, TREATMENTS[b.treatment].minutes)) return;
        const wasFreed = [...map.values()].find((x) => x.pro === b.pro && x.status === 'freed' && x.start === b.start);
        put({ pro: b.pro, start: b.start, patient: 'you', treatment: b.treatment, status: 'you', via: 'you', changedAt: b.at }, `you-${b.at}`);
        events.push({ id: `you-${b.pro}-${b.start}`, at: b.at, kind: 'you', pro: b.pro, start: b.start, treatment: b.treatment });
        if (wasFreed) {
          const id = wasFreed.patient === 'nicolas' ? 'nicolas' : wasFreed.patient === 'martina' ? 'martina' : null;
          if (id) card(id, { at: b.at, column: 'won', note: 'byYou' });
        }
      },
    });
  }
  // Julián calls: the receptionist checks the agenda, then books.
  const callMissed = !isOn(state.off.voice, S.callStart);
  steps.push({ at: S.callStart, run: () => events.push({ id: 'call', at: S.callStart, kind: 'call' }) });
  if (!callMissed) {
    steps.push({
      at: CALL_CHECK_AT,
      run: () => {
        const now = storyClock(CALL_CHECK_AT);
        const freed = map.get(slotKey(m.pro, m.start));
        if (freed?.status === 'freed' && isFree(m.pro, m.start, STEP)) callTarget = { pro: m.pro, start: m.start };
        else {
          for (let s = Math.ceil((now + 5) / STEP) * STEP; s + STEP <= DAY_END; s += STEP) {
            if (isFree('lucia', s, STEP)) {
              callTarget = { pro: 'lucia', start: s };
              break;
            }
          }
        }
      },
    });
    steps.push({
      at: CALL_BOOK_AT,
      run: () => {
        const target = callTarget;
        if (!target || !isFree(target.pro, target.start, STEP)) return;
        const recoveredSlot = map.get(slotKey(target.pro, target.start))?.status === 'freed';
        put({ pro: target.pro, start: target.start, patient: 'julian', treatment: 'cleaning', status: 'voice', via: 'voice', changedAt: CALL_BOOK_AT }, 'voice');
        events.push({ id: 'julian', at: CALL_BOOK_AT, kind: 'voice', pro: target.pro, start: target.start, patient: 'julian', recovered: recoveredSlot ? 'voice' : undefined });
        if (recoveredSlot) {
          recovered.voice += 1;
          card('martina', { at: CALL_BOOK_AT, column: 'won', note: 'byVoice', patient: 'julian' });
        }
      },
    });
  } else {
    steps.push({ at: S.callStart + 5200, run: () => events.push({ id: 'missed', at: S.callStart + 5200, kind: 'missed' }) });
  }

  // Run everything that happened by now, in time order (steps may add later steps).
  const done = new Set<number>();
  for (;;) {
    let next = -1;
    steps.forEach((s, i) => {
      if (!done.has(i) && s.at <= t && (next < 0 || s.at < steps[next].at)) next = i;
    });
    if (next < 0) break;
    done.add(next);
    steps[next].run();
  }
  events.sort((x, y) => x.at - y.at);

  const voice = voiceTexts(callTarget);
  const call = runVoice(callScript(voice.texts, callMissed, voice.icons), t - S.callStart, { instant });
  const appts = [...map.values()].sort((x, y) => x.start - y.start || x.pro.localeCompare(y.pro));
  const total = recovered.reminder + recovered.waitlist + recovered.voice;

  return {
    t,
    clock: storyClock(t),
    chat,
    martina: choice ?? null,
    martinaOption: option,
    call,
    callTarget,
    callMissed,
    appts,
    events,
    recovered: { ...recovered, total },
    waitlist,
    cards: cards.filter((c) => c.changedAt <= t),
  };
}

/** Today's agenda numbers. */
export function dayStats(appts: Appt[]) {
  const live = appts.filter((a) => a.status !== 'freed');
  const minutes = live.reduce((s, a) => s + (a.end - a.start), 0);
  return {
    count: live.length,
    occupancy: minutes / ((DAY_END - 540) * 3),
    confirmed: live.filter((a) => ['confirmed', 'new', 'waitlist', 'voice', 'you'].includes(a.status)).length,
    pending: live.filter((a) => a.status === 'reminded').length,
  };
}

/** Where Martina was moved to. */
export const martinaMove = (option: number | null) => (option === null ? null : MARTINA_OPTIONS[option] ?? null);
export { WAITLIST_OFFERED };
