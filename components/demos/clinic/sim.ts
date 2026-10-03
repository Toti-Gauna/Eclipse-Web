/**
 * Simulation state for the clinic demo.
 *
 * A tiny external store holds what both screens must agree on (story tick,
 * WhatsApp conversation, bookings made by the visitor, automation switches).
 * When the laptop and the phone of the same showcase are on screen, they share
 * one store, so tapping "Reprogramar" on the phone frees the slot on the laptop.
 * Everything visible is *derived* from that state with pure functions, which is
 * what lets reduced motion jump straight to the final state.
 */
import {
  CHAT,
  DAYS,
  LIVE_RECOVERIES,
  NOW_MIN,
  PROS,
  STORY,
  TIMES,
  TODAY,
  TODAY_BASE,
  WAITLIST_START,
  BASE_WAITLIST_RECOVERIES,
  generatedBooking,
  slotKey,
  type Booking,
  type PatientId,
  type ProId,
  type SlotKey,
  type TreatmentId,
} from './data';

export type ChatChoice = 'confirm' | 'reschedule' | 'cancel';
export type RuleId = 'day' | 'hours' | 'waitlist';

export interface ChatState {
  /**
   * Story tick at which the conversation started: when a chat view is first
   * shown (or replayed). Until then it is `null` and the chat starts on its own
   * at CHAT_FALLBACK_START, so the agenda and the weekly counter still complete.
   */
  base: number | null;
  /** The visitor answered (or replayed): no more automatic answers. */
  manual: boolean;
  choice: ChatChoice | null;
  choiceTick: number;
  pick: number | null;
  pickTick: number;
}

export interface SimState {
  tick: number;
  chat: ChatState;
  mine: Record<SlotKey, { treatment: TreatmentId; at: number }>;
  rules: Record<RuleId, boolean>;
  /** Story ticks while the waitlist switch was off (it only affects what happens then). */
  waitlistOff: { from: number; to: number | null }[];
}

export interface ClinicStore {
  readonly paired: boolean;
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => SimState;
  report: (tick: number) => void;
  choose: (choice: ChatChoice) => void;
  pick: (index: number) => void;
  replay: () => void;
  /** A chat view is on screen: start the conversation now (once). */
  startChat: () => void;
  book: (key: SlotKey, treatment: TreatmentId) => void;
  toggleRule: (id: RuleId) => void;
}

/** Story tick at which the conversation starts if nobody opened the chat before. */
export const CHAT_FALLBACK_START = 15;

const freshChat = (base: number | null, manual: boolean): ChatState => ({
  base,
  manual,
  choice: null,
  choiceTick: 0,
  pick: null,
  pickTick: 0,
});

export function createClinicStore(paired = false): ClinicStore {
  let state: SimState = {
    tick: 0,
    chat: freshChat(null, false),
    mine: {},
    rules: { day: true, hours: true, waitlist: true },
    waitlistOff: [],
  };
  const listeners = new Set<() => void>();
  const set = (next: SimState) => {
    state = next;
    listeners.forEach((l) => l());
  };
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
    choose(choice) {
      if (state.chat.choice) return;
      set({ ...state, chat: { ...state.chat, manual: true, choice, choiceTick: state.tick } });
    },
    pick(index) {
      if (state.chat.pick !== null) return;
      set({ ...state, chat: { ...state.chat, manual: true, pick: index, pickTick: state.tick } });
    },
    replay() {
      set({ ...state, chat: freshChat(state.tick, true) });
    },
    startChat() {
      if (state.chat.base !== null || state.tick >= CHAT_FALLBACK_START) return;
      set({ ...state, chat: { ...state.chat, base: state.tick } });
    },
    book(key, treatment) {
      if (state.mine[key]) return;
      set({ ...state, mine: { ...state.mine, [key]: { treatment, at: state.tick } } });
    },
    toggleRule(id) {
      const on = !state.rules[id];
      let { waitlistOff } = state;
      if (id === 'waitlist') {
        waitlistOff = on
          ? waitlistOff.map((w) => (w.to === null ? { ...w, to: state.tick } : w))
          : [...waitlistOff, { from: state.tick, to: null }];
      }
      set({ ...state, rules: { ...state.rules, [id]: on }, waitlistOff });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Pairing: laptop + phone of the same showcase share a store           */
/* ------------------------------------------------------------------ */
const sharedStores = new WeakMap<Element, ClinicStore>();

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

export function pairedStoreFor(el: Element): ClinicStore | null {
  const host = findPairHost(el);
  if (!host) return null;
  let store = sharedStores.get(host);
  if (!store) {
    store = createClinicStore(true);
    sharedStores.set(host, store);
  }
  return store;
}

/** Was the automatic waitlist on at story tick `at`? */
export function waitlistOnAt(state: SimState, at: number): boolean {
  return !state.waitlistOff.some((w) => at >= w.from && (w.to === null || at < w.to));
}

/* ------------------------------------------------------------------ */
/* WhatsApp conversation                                                */
/* ------------------------------------------------------------------ */
/** Chat clock at which the reminder's buttons get answered automatically. */
const AUTO_CHOICE = 7;
/** Ticks the reschedule options wait before being picked automatically. */
const AUTO_PICK = 3;

export type ChatItem =
  | { id: string; from: 'clinic'; kind: 'reminder' | 'ask' | 'confirmed' | 'offer' | 'rescheduled' | 'cancelled'; options?: 'choice' | 'pick' }
  | { id: string; from: 'patient'; kind: 'choice'; choice: ChatChoice }
  | { id: string; from: 'patient'; kind: 'pick'; option: number }
  | { id: string; from: 'agenda'; kind: 'confirmed' | 'freed' | 'refilled' | 'kept' };

export interface ChatView {
  items: ChatItem[];
  typing: boolean;
  awaiting: 'choice' | 'pick' | null;
  done: boolean;
  choice: ChatChoice | null;
  pick: number | null;
  /** Story ticks of what the conversation did to the agenda. */
  confirmedAt: number | null;
  freedAt: number | null;
  refilledAt: number | null;
}

export function deriveChat(state: SimState, reduced: boolean): ChatView {
  const { chat, tick } = state;
  const base = chat.base ?? CHAT_FALLBACK_START;
  const clock = reduced ? Infinity : tick - base;
  const at = (n: number) => clock >= n;
  const view: ChatView = {
    items: [],
    typing: false,
    awaiting: null,
    done: false,
    choice: null,
    pick: null,
    confirmedAt: null,
    freedAt: null,
    refilledAt: null,
  };
  const { items } = view;
  // chat clock → story tick (with reduced motion the clock is infinite: never past "now")
  const g = (n: number) => Math.min(base + n, tick);

  if (!at(0)) return view; // not started yet
  if (!at(1)) {
    view.typing = true;
    return view;
  }
  items.push({ id: 'reminder', from: 'clinic', kind: 'reminder' });
  if (!at(2)) {
    view.typing = true;
    return view;
  }
  items.push({ id: 'ask', from: 'clinic', kind: 'ask', options: 'choice' });

  const choice = chat.choice ?? (!chat.manual && at(AUTO_CHOICE) ? 'reschedule' : null);
  if (!choice) {
    view.awaiting = 'choice';
    return view;
  }
  const c0 = chat.choice ? chat.choiceTick - base : AUTO_CHOICE;
  view.choice = choice;
  items.push({ id: 'answer', from: 'patient', kind: 'choice', choice });
  if (!at(c0 + 1)) return view;
  if (!at(c0 + 2)) {
    view.typing = true;
    return view;
  }

  if (choice === 'confirm') {
    items.push({ id: 'confirmed', from: 'clinic', kind: 'confirmed' });
    if (!at(c0 + 3)) return view;
    items.push({ id: 'sys-confirmed', from: 'agenda', kind: 'confirmed' });
    view.confirmedAt = g(c0 + 3);
    view.done = true;
    return view;
  }

  let freedFrom: number;
  if (choice === 'cancel') {
    items.push({ id: 'cancelled', from: 'clinic', kind: 'cancelled' });
    freedFrom = c0 + 3;
  } else {
    items.push({ id: 'offer', from: 'clinic', kind: 'offer', options: 'pick' });
    const pick = chat.pick ?? (!chat.manual && at(c0 + 2 + AUTO_PICK) ? 0 : null);
    if (pick === null) {
      view.awaiting = 'pick';
      return view;
    }
    const p0 = chat.pick !== null ? chat.pickTick - base : c0 + 2 + AUTO_PICK;
    view.pick = pick;
    items.push({ id: 'pick', from: 'patient', kind: 'pick', option: pick });
    if (!at(p0 + 1)) return view;
    if (!at(p0 + 2)) {
      view.typing = true;
      return view;
    }
    items.push({ id: 'rescheduled', from: 'clinic', kind: 'rescheduled' });
    freedFrom = p0 + 3;
  }

  if (!at(freedFrom)) return view;
  items.push({ id: 'sys-freed', from: 'agenda', kind: 'freed' });
  view.freedAt = g(freedFrom);
  if (!waitlistOnAt(state, g(freedFrom))) {
    view.done = true;
    return view;
  }
  if (!at(freedFrom + 2)) return view;
  items.push({ id: 'sys-refilled', from: 'agenda', kind: 'refilled' });
  view.refilledAt = g(freedFrom + 2);
  view.done = true;
  return view;
}

/* ------------------------------------------------------------------ */
/* Agenda + activity                                                    */
/* ------------------------------------------------------------------ */
export type EventKind = 'sent' | 'new' | 'confirm' | 'cancel' | 'reschedule' | 'refill' | 'you';

export interface SimEvent {
  id: string;
  at: number;
  kind: EventKind;
  key: SlotKey;
  patient?: PatientId;
  /** Counts toward "turnos recuperados" (waitlist refill or confirmation). */
  recovery?: 'waitlist' | 'confirmed';
}

export interface SlotView {
  key: SlotKey;
  day: number;
  pro: ProId;
  idx: number;
  minutes: number;
  booking: Booking | null;
  past: boolean;
  /** Changes whenever the slot visibly changes (use as React key to replay the entrance). */
  version: string;
  /** Story tick of the last change (for "just now" highlights). */
  changedAt: number;
}

export interface Agenda {
  slots: Map<SlotKey, SlotView>;
  events: SimEvent[];
  recoveredToday: number;
  waitlistRecoveredToday: number;
}

export function deriveAgenda(state: SimState, chat: ChatView): Agenda {
  const { tick } = state;
  const slots = new Map<SlotKey, SlotView>();
  const events: SimEvent[] = [
    { id: 'sent', at: -2, kind: 'sent', key: slotKey(TODAY, 'lucia', 0) },
    { id: 'pre-confirm', at: -1, kind: 'confirm', key: slotKey(TODAY, 'sofia', 2), patient: 'florencia' },
  ];

  for (const day of DAYS) {
    for (const pro of PROS) {
      TIMES.forEach((minutes, idx) => {
        const key = slotKey(day, pro.id, idx);
        const past = day < TODAY || (day === TODAY && minutes + 30 <= NOW_MIN);
        const booking = day === TODAY ? (TODAY_BASE[`${pro.id}:${idx}`] ?? null) : generatedBooking(day, pro.id, idx);
        slots.set(key, { key, day, pro: pro.id, idx, minutes, booking, past, version: 'base', changedAt: -Infinity });
      });
    }
  }

  const update = (key: SlotKey, at: number, booking: Booking | null, version: string) => {
    const slot = slots.get(key);
    if (slot) slots.set(key, { ...slot, booking, version, changedAt: at });
  };

  // Scripted story + the WhatsApp conversation, in time order.
  const steps: { at: number; run: () => void }[] = STORY.map((s) => ({
    at: s.at,
    run: () => {
      const [pro, idx] = s.slot.split(':');
      const key = slotKey(TODAY, pro as ProId, Number(idx));
      const current = slots.get(key)?.booking;
      const id = `${s.kind}-${key}`;
      if (s.kind === 'new' && s.patient && s.treatment) {
        update(key, s.at, { patient: s.patient, treatment: s.treatment, status: 'new' }, id);
        events.push({ id, at: s.at, kind: 'new', key, patient: s.patient });
      } else if (s.kind === 'confirm' && current) {
        update(key, s.at, { ...current, status: 'confirmed' }, id);
        events.push({ id, at: s.at, kind: 'confirm', key, patient: current.patient as PatientId });
      } else if ((s.kind === 'cancel' || s.kind === 'reschedule') && current) {
        update(key, s.at, { ...current, status: 'freed' }, id);
        events.push({ id, at: s.at, kind: s.kind, key, patient: current.patient as PatientId });
      } else if (s.kind === 'refill' && s.patient && s.treatment && waitlistOnAt(state, s.at)) {
        update(key, s.at, { patient: s.patient, treatment: s.treatment, status: 'waitlist' }, id);
        events.push({ id, at: s.at, kind: 'refill', key, patient: s.patient, recovery: 'waitlist' });
      }
    },
  }));

  const chatKey = slotKey(TODAY, 'lucia', Number(CHAT.slot.split(':')[1]));
  if (chat.confirmedAt !== null) {
    const at = chat.confirmedAt;
    steps.push({
      at,
      run: () => {
        update(chatKey, at, { patient: CHAT.patient, treatment: CHAT.treatment, status: 'confirmed' }, `chat-confirm-${chat.choice}`);
        events.push({ id: `chat-confirm-${at}`, at, kind: 'confirm', key: chatKey, patient: CHAT.patient, recovery: 'confirmed' });
      },
    });
  }
  if (chat.freedAt !== null) {
    const at = chat.freedAt;
    steps.push({
      at,
      run: () => {
        update(chatKey, at, { patient: CHAT.patient, treatment: CHAT.treatment, status: 'freed' }, `chat-freed-${at}`);
        events.push({ id: `chat-${chat.choice}-${at}`, at, kind: chat.choice === 'cancel' ? 'cancel' : 'reschedule', key: chatKey, patient: CHAT.patient });
        if (chat.pick !== null) {
          const target = CHAT.options[chat.pick];
          update(target, at, { patient: CHAT.patient, treatment: CHAT.treatment, status: 'confirmed' }, `chat-moved-${at}`);
        }
      },
    });
  }
  if (chat.refilledAt !== null) {
    const at = chat.refilledAt;
    steps.push({
      at,
      run: () => {
        update(chatKey, at, { patient: CHAT.waitlistPatient, treatment: 'checkup', status: 'waitlist' }, `chat-refill-${at}`);
        events.push({ id: `chat-refill-${at}`, at, kind: 'refill', key: chatKey, patient: CHAT.waitlistPatient, recovery: 'waitlist' });
      },
    });
  }
  for (const [key, mine] of Object.entries(state.mine)) {
    steps.push({
      at: mine.at,
      run: () => {
        update(key, mine.at, { patient: 'you', treatment: mine.treatment, status: 'you' }, `you-${key}`);
        events.push({ id: `you-${key}`, at: mine.at, kind: 'you', key });
      },
    });
  }

  steps
    .filter((s) => s.at <= tick)
    .sort((a, b) => a.at - b.at)
    .forEach((s) => s.run());
  events.sort((a, b) => a.at - b.at);

  const recoveries = events.filter((e) => e.recovery);
  return {
    slots,
    events,
    recoveredToday: recoveries.length,
    waitlistRecoveredToday: recoveries.filter((e) => e.recovery === 'waitlist').length,
  };
}

export function daySlots(agenda: Agenda, day: number): SlotView[] {
  const out: SlotView[] = [];
  TIMES.forEach((_, idx) => {
    for (const pro of PROS) out.push(agenda.slots.get(slotKey(day, pro.id, idx))!);
  });
  return out;
}

export function dayOccupancy(agenda: Agenda, day: number): { booked: number; total: number } {
  const slots = daySlots(agenda, day);
  return { booked: slots.filter((s) => s.booking && s.booking.status !== 'freed').length, total: slots.length };
}

export interface Kpis {
  booked: number;
  total: number;
  confirmed: number;
  pending: number;
  changed: number;
  sent: number;
  recoveredWeek: number;
  recoveredWaitlistWeek: number;
  recoveredConfirmedWeek: number;
  waitlist: number;
}

/** `keyNumber` is the vertical's key number (content/verticals.json): the week ends there. */
export function deriveKpis(agenda: Agenda, keyNumber: number): Kpis {
  const today = daySlots(agenda, TODAY);
  const active = today.filter((s) => s.booking && s.booking.status !== 'freed');
  const base = keyNumber - LIVE_RECOVERIES;
  const baseConfirmed = base - BASE_WAITLIST_RECOVERIES;
  const confirmedToday = agenda.recoveredToday - agenda.waitlistRecoveredToday;
  return {
    booked: active.length,
    total: today.length,
    confirmed: active.filter((s) => ['confirmed', 'new', 'waitlist', 'you'].includes(s.booking!.status)).length,
    pending: active.filter((s) => s.booking!.status === 'reminded').length,
    changed: agenda.events.filter((e) => e.kind === 'cancel' || e.kind === 'reschedule').length,
    sent: REMINDER_RECIPIENTS.length,
    recoveredWeek: base + agenda.recoveredToday,
    recoveredWaitlistWeek: BASE_WAITLIST_RECOVERIES + agenda.waitlistRecoveredToday,
    recoveredConfirmedWeek: baseConfirmed + confirmedToday,
    waitlist: Math.max(0, WAITLIST_START - agenda.waitlistRecoveredToday),
  };
}

/* ------------------------------------------------------------------ */
/* Reminders                                                            */
/* ------------------------------------------------------------------ */
export type ReminderState = 'waiting' | 'confirmed' | 'rescheduled' | 'cancelled';

/** Today's patients who got a WhatsApp reminder (upcoming, already booked at 9:41). */
export const REMINDER_RECIPIENTS = Object.entries(TODAY_BASE)
  .filter(([, b]) => b.status === 'confirmed' || b.status === 'reminded')
  .map(([key, b]) => {
    const [pro, idx] = key.split(':');
    return { key: slotKey(TODAY, pro as ProId, Number(idx)), patient: b.patient as PatientId, initial: b.status };
  });

export interface ReminderRow {
  key: SlotKey;
  patient: PatientId;
  state: ReminderState;
}

export function deriveReminders(agenda: Agenda) {
  const rows: ReminderRow[] = REMINDER_RECIPIENTS.map((r) => {
    const last = [...agenda.events]
      .reverse()
      .find((e) => e.patient === r.patient && (e.kind === 'confirm' || e.kind === 'cancel' || e.kind === 'reschedule'));
    const state: ReminderState = last
      ? last.kind === 'confirm'
        ? 'confirmed'
        : last.kind === 'cancel'
          ? 'cancelled'
          : 'rescheduled'
      : r.initial === 'reminded'
        ? 'waiting'
        : 'confirmed';
    return { key: r.key, patient: r.patient, state };
  });
  return {
    rows,
    sent: rows.length,
    confirmed: rows.filter((r) => r.state === 'confirmed').length,
    changed: rows.filter((r) => r.state === 'rescheduled' || r.state === 'cancelled').length,
    pending: rows.filter((r) => r.state === 'waiting').length,
  };
}
