'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronRight, RotateCcw, ScanLine, TrendingUp } from 'lucide-react';
import { CHECKIN_POINTS, ME, MILESTONES, MISSIONS, NOW_MIN, TODAY, TRAINED_DAYS, WEEK_BONUS } from './data';
import { isFresh } from './sim';
import { useFmt, useGym } from './context';
import { Burst, Eyebrow, FlameMark, Meter, MissionRing } from './ui';
import { MemberToasts } from './activity';
import { MissionCard, WeekSummary } from './Missions';

const WEEK = [0, 1, 2, 3, 4, 5, 6];

/** True right after the member's check-in (drives the one-off celebrations). */
function useCheckInFresh() {
  const { world, state } = useGym();
  const at = world.me.checkInAt;
  return at !== null && isFresh({ at }, state.tick);
}

function WeekStrip() {
  const t = useTranslations('demoGym.streak');
  const fmt = useFmt();
  const { world } = useGym();
  const fresh = useCheckInFresh();
  return (
    <ol aria-label={t('week')} className="mt-[0.95em] grid grid-cols-7 gap-[0.2em] border-t border-white/15 pt-[0.85em]">
      {WEEK.map((d) => {
        const today = d === TODAY;
        const done = TRAINED_DAYS.includes(d) || (today && world.me.checkedIn);
        const label = today ? (done ? t('todayDone', { day: fmt.weekday(d) }) : t('todayPending', { day: fmt.weekday(d) })) : done ? t('dayDone', { day: fmt.weekday(d) }) : fmt.weekday(d);
        return (
          <li key={d} className="flex flex-col items-center gap-[0.4em]">
            <span aria-hidden className={`text-[0.62em] font-semibold ${today ? 'text-white' : 'text-white/70'}`}>
              {fmt.narrow(d)}
            </span>
            <span
              aria-hidden
              className={`relative grid size-[1.75em] place-items-center rounded-full ${
                done ? 'bg-[linear-gradient(160deg,#ffb547,#ff5a1f)] shadow-[0_0.3em_0.8em_-0.3em_rgb(255_90_31/0.9)]' : today ? 'gym-today bg-white/10' : 'border border-white/15'
              }`}
            >
              {done ? <Check key={today ? 'today' : 'past'} className={`size-[0.95em] text-white ${today && fresh ? 'gym-stamp' : ''}`} strokeWidth={3} /> : null}
            </span>
            <span className="sr-only">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function StreakCard() {
  const t = useTranslations('demoGym.streak');
  const fmt = useFmt();
  const { world } = useGym();
  const { streak } = world.me;
  const fresh = useCheckInFresh();
  const next = MILESTONES.find((m) => m > streak) ?? MILESTONES[MILESTONES.length - 1];
  return (
    <section className="relative overflow-hidden rounded-[1.25em] p-[1em] text-white shadow-[0_1em_2.4em_-1.2em_rgb(36_21_82/0.9)]" style={{ background: 'var(--gym-space)' }}>
      <div className="flex items-center gap-[0.75em]">
        <span className="relative grid size-[4.1em] shrink-0 place-items-center">
          <span key={fresh ? `boost-${streak}` : 'still'} className={`block ${fresh ? 'gym-boost' : ''}`}>
            <FlameMark className="h-[3.5em] w-auto drop-shadow-[0_0.3em_0.8em_rgb(255_106_43/0.55)]" />
          </span>
          {fresh ? <Burst count={12} radius={2.6} /> : null}
        </span>
        <div className="min-w-0">
          <p className="text-[0.72em] font-semibold uppercase tracking-[0.1em] text-white/80">{t('title')}</p>
          <p className="mt-[0.1em] flex items-baseline gap-[0.3em]">
            <span key={streak} className={`text-[3em] font-semibold leading-none tracking-[-0.04em] ${fresh ? 'gym-count-in' : ''}`}>
              {fmt.num(streak)}
            </span>
            <span className="text-[0.84em] font-medium text-white/90">{t('days', { count: streak })}</span>
          </p>
        </div>
      </div>
      <div className="mt-[0.85em]">
        <Meter tone="light" value={streak / next} className="h-[0.35em]" />
        <p className="mt-[0.4em] text-[0.7em] text-white/85">{t('next', { count: next - streak, goal: next })}</p>
      </div>
      <WeekStrip />
    </section>
  );
}

export function CheckInButton({ onReplay }: { onReplay?: () => void }) {
  const t = useTranslations('demoGym');
  const fmt = useFmt();
  const { world, store, reduced } = useGym();
  const { me } = world;
  const fresh = useCheckInFresh();
  const done = me.checkedIn;
  const ref = useRef<HTMLButtonElement>(null);
  // Everything the check-in earned at once (check-in + the mission it completes + bonus).
  const earned = world.events
    .filter((e) => e.member === ME && e.at === me.checkInAt && (e.kind === 'checkin' || e.kind === 'mission' || e.kind === 'bonus'))
    .reduce((sum, e) => sum + (e.points ?? 0), 0);

  return (
    <div className="flex flex-col gap-[0.45em]">
      <div className="relative">
        <button
          ref={ref}
          type="button"
          data-state={done ? 'done' : 'idle'}
          aria-disabled={done || undefined}
          onClick={() => {
            if (!done) store.checkIn();
          }}
          className="gym-checkin flex w-full items-center gap-[0.75em] rounded-[1.1em] px-[0.85em] py-[0.8em] text-left"
        >
          <span
            aria-hidden
            className={`relative grid size-[2.5em] shrink-0 place-items-center rounded-full ${done ? 'bg-[var(--gym-ok-bg)] text-[var(--gym-ok)]' : 'bg-white/15'}`}
          >
            {done ? <Check className={`size-[1.3em] ${fresh ? 'gym-stamp' : ''}`} strokeWidth={2.8} /> : <ScanLine className="size-[1.25em]" strokeWidth={2} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.95em] font-semibold leading-tight">{done ? t('checkin.done') : t('checkin.cta')}</span>
            <span className={`block text-[0.7em] ${done ? 'text-[var(--demo-muted)]' : 'text-white/85'}`}>
              {done ? t('checkin.doneHint', { time: fmt.time(NOW_MIN), count: me.streak }) : t('checkin.hint')}
            </span>
          </span>
          <span
            aria-hidden={done || undefined}
            className={`shrink-0 rounded-full px-[0.6em] py-[0.3em] text-[0.68em] font-semibold ${done ? 'bg-[var(--demo-accent-soft)] text-[var(--gym-accent-ink)]' : 'bg-white/15'}`}
          >
            +{fmt.num(done ? earned || CHECKIN_POINTS : CHECKIN_POINTS)} {t('pts')}
          </span>
        </button>
        {fresh && !reduced ? (
          <span aria-hidden className="gym-float pointer-events-none absolute -top-[0.4em] right-[0.9em] text-[0.9em] font-bold text-[var(--gym-accent-ink)]">
            +{fmt.num(earned)} {t('pts')}
          </span>
        ) : null}
      </div>
      {done ? (
        <button
          type="button"
          onClick={() => {
            store.replay();
            onReplay?.();
            requestAnimationFrame(() => ref.current?.focus({ preventScroll: true }));
          }}
          className="mx-auto inline-flex items-center gap-[0.35em] rounded-full px-[0.7em] py-[0.35em] text-[0.7em] font-medium text-[var(--demo-muted)] hover:text-[var(--demo-ink)]"
        >
          <RotateCcw aria-hidden className="size-[1.05em]" strokeWidth={2} />
          {t('replay')}
        </button>
      ) : null}
    </div>
  );
}

function QuickCards() {
  const t = useTranslations('demoGym');
  const fmt = useFmt();
  const { world, openTab } = useGym();
  const { me } = world;
  const climbed = me.startRank - me.rank;
  const missionsLabel = t('home.missionsValue', { done: me.completed, total: MISSIONS.length });
  return (
    <div className="grid grid-cols-2 gap-[0.6em]">
      <button
        type="button"
        onClick={() => openTab('missions')}
        className="demo-card gym-action flex flex-col items-start gap-[0.45em] p-[0.75em] text-left hover:border-[var(--demo-accent)]"
      >
        <span className="flex w-full items-center justify-between text-[0.7em] font-semibold text-[var(--demo-muted)]">
          {t('tabs.missions')}
          <ChevronRight aria-hidden className="size-[1.2em]" strokeWidth={2} />
        </span>
        <span className="flex items-center gap-[0.5em]">
          <MissionRing done={me.completed} total={MISSIONS.length} className="size-[2.3em]" />
          <span key={me.completed} className="gym-count-in text-[1.35em] font-semibold leading-none tracking-[-0.02em]">
            {fmt.num(me.completed)}
            <span className="text-[0.6em] font-medium text-[var(--demo-muted)]">/{MISSIONS.length}</span>
          </span>
          <span className="sr-only">{missionsLabel}</span>
        </span>
        <span className="text-[0.64em] leading-[1.3] text-[var(--demo-muted)]">
          {me.bonusAt !== null ? t('home.bonusDone') : t('home.bonus', { points: WEEK_BONUS })}
        </span>
      </button>
      <button
        type="button"
        onClick={() => openTab('ranking')}
        className="demo-card gym-action flex flex-col items-start gap-[0.45em] p-[0.75em] text-left hover:border-[var(--demo-accent)]"
      >
        <span className="flex w-full items-center justify-between text-[0.7em] font-semibold text-[var(--demo-muted)]">
          {t('tabs.ranking')}
          <ChevronRight aria-hidden className="size-[1.2em]" strokeWidth={2} />
        </span>
        <span className="flex items-baseline gap-[0.35em]">
          <span key={me.rank} className="gym-count-in text-[1.6em] font-semibold leading-none tracking-[-0.03em]">
            <span aria-hidden>#</span>
            {fmt.num(me.rank)}
            <span className="sr-only"> {t('ranking.position', { rank: me.rank })}</span>
          </span>
          {climbed > 0 ? (
            <span className="inline-flex items-center gap-[0.2em] rounded-full bg-[var(--gym-ok-bg)] px-[0.45em] py-[0.1em] text-[0.64em] font-semibold text-[var(--gym-ok)]">
              <TrendingUp aria-hidden className="size-[1.1em]" strokeWidth={2.2} />
              {t('ranking.climbedShort', { count: climbed })}
            </span>
          ) : null}
        </span>
        <span className="text-[0.64em] leading-[1.3] text-[var(--demo-muted)]">{t('home.weekPoints', { points: me.points })}</span>
      </button>
    </div>
  );
}

/** The mission closest to the member's next action (or the finished week). */
function NextMission() {
  const t = useTranslations('demoGym.home');
  const { world, state, reduced, openTab } = useGym();
  const { me } = world;
  // The check-in button above already covers "train N days": it only shows up when it's the last one left.
  const order = [...MISSIONS.filter((m) => m.id !== 'days'), ...MISSIONS.filter((m) => m.id === 'days')];
  // A mission that was just completed stays a moment (its bar fills, "Done"), then the next one.
  const just = reduced
    ? undefined
    : order.find((m) => m.id !== 'days' && me.doneAt[m.id] !== undefined && isFresh({ at: me.doneAt[m.id]! }, state.tick));
  const next = just ?? order.find((m) => me.doneAt[m.id] === undefined);
  return (
    <div className="flex flex-col gap-[0.5em]">
      <div className="flex items-center justify-between gap-[0.6em]">
        <h3 className="text-[0.82em] font-semibold">
          {next ? t('nextMission') : t('weekDone')}
        </h3>
        <button
          type="button"
          onClick={() => openTab('missions')}
          className="-mr-[0.4em] inline-flex items-center gap-[0.15em] rounded-full px-[0.4em] py-[0.3em] text-[0.7em] font-semibold text-[var(--gym-accent-ink)]"
        >
          {t('allMissions')}
          <ChevronRight aria-hidden className="size-[1.15em]" strokeWidth={2.2} />
        </button>
      </div>
      {next ? (
        <ul key={next.id} className="gym-pop">
          <MissionCard id={next.id} />
        </ul>
      ) : (
        <WeekSummary />
      )}
    </div>
  );
}

export function PhoneHome() {
  const t = useTranslations('demoGym');
  const fmt = useFmt();
  return (
    <div className="flex flex-col gap-[0.75em]">
      <MemberToasts />
      <div>
        <Eyebrow>{t('memberView')}</Eyebrow>
        <h2 className="mt-[0.25em] text-[1.3em] font-semibold leading-tight tracking-[-0.02em]">{t('home.hello', { name: t('me') })}</h2>
        <p className="text-[0.74em] text-[var(--demo-muted)]">{fmt.long(TODAY)}</p>
      </div>
      <StreakCard />
      <CheckInButton />
      <QuickCards />
      <NextMission />
    </div>
  );
}
