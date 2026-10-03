'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Check, RotateCcw, Trophy } from 'lucide-react';
import { TypingDots } from '../kit';
import { ACTIVE_MEMBERS, CARDIO_STEP, MISSIONS, PARTICIPATION, TODAY, WEEK_BONUS, type MissionId } from './data';
import { isFresh } from './sim';
import { useFmt, useGym } from './context';
import { Burst, Card, MissionIcon, MissionRing, Meter, ViewTitle, useMissionName } from './ui';
import { MemberToasts } from './activity';

/** Ring + bonus: how the member's week is going. */
export function WeekSummary() {
  const t = useTranslations('demoGym.missionsView');
  const fmt = useFmt();
  const { world, state } = useGym();
  const { me } = world;
  const bonusFresh = me.bonusAt !== null && isFresh({ at: me.bonusAt }, state.tick);
  const done = me.bonusAt !== null;
  return (
    <Card
      className={`relative flex items-center gap-[0.85em] overflow-hidden p-[0.85em] ${done ? 'border-transparent text-white' : ''}`}
      as="section"
    >
      {done ? <span aria-hidden className="absolute inset-0 -z-0" style={{ background: 'var(--gym-space)' }} /> : null}
      <span className="relative grid size-[3.6em] shrink-0 place-items-center">
        <MissionRing done={me.completed} total={MISSIONS.length} className="absolute inset-0 size-full" />
        {done ? (
          <Trophy aria-hidden className={`size-[1.3em] text-[var(--gym-amber)] ${bonusFresh ? 'gym-stamp' : ''}`} strokeWidth={2} />
        ) : (
          <span aria-hidden key={me.completed} className="gym-count-in text-[0.95em] font-semibold">
            {fmt.num(me.completed)}/{MISSIONS.length}
          </span>
        )}
        {bonusFresh ? <Burst count={14} radius={3} colors={['#f5b942', '#ffffff', '#a78bfa']} /> : null}
      </span>
      <div className="relative min-w-0 flex-1">
        <p className="text-[0.86em] font-semibold leading-tight">{t('progress', { done: me.completed, total: MISSIONS.length })}</p>
        <p className={`mt-[0.2em] text-[0.7em] leading-[1.35] ${done ? 'text-white/85' : 'text-[var(--demo-muted)]'}`}>
          {done ? t('bonusDone', { points: WEEK_BONUS }) : t('bonus', { points: WEEK_BONUS })}
        </p>
      </div>
    </Card>
  );
}

function useMissionText(id: MissionId) {
  const t = useTranslations('demoGym.missions');
  const fmt = useFmt();
  const name = useMissionName();
  const { world } = useGym();
  const mission = MISSIONS.find((m) => m.id === id)!;
  const value = world.me.progress[id];
  return {
    mission,
    value,
    title: name(id, 'title'),
    detail: t(`${id}.detail`),
    progress: t(`${id}.progress`, { value: fmt.num(value), goal: fmt.num(mission.goal) }),
  };
}

function MissionAction({ id }: { id: MissionId }) {
  const t = useTranslations('demoGym.missions');
  const { world, store } = useGym();
  const { me } = world;
  const done = me.doneAt[id] !== undefined;
  // "A new class" is tracked from the class booking: no button, only its done state.
  if (id === 'class' && !done) return null;

  let label: React.ReactNode;
  let act: (() => void) | null = null;
  if (done) {
    label = (
      <>
        <Check aria-hidden className="size-[1.1em]" strokeWidth={2.6} />
        {t('completed')}
      </>
    );
  } else if (id === 'days') {
    label = t('days.action');
    act = store.checkIn;
  } else if (id === 'cardio') {
    label = t('cardio.action', { minutes: CARDIO_STEP });
    act = store.logCardio;
  } else if (me.invitedAt === null) {
    label = t('friend.action');
    act = store.invite;
  } else {
    label = (
      <>
        <TypingDots label={t('friend.waiting')} />
        {t('friend.waiting')}
      </>
    );
  }
  const waiting = id === 'friend' && !done && me.invitedAt !== null;
  return (
    <button
      type="button"
      aria-disabled={act ? undefined : true}
      onClick={() => act?.()}
      className={`gym-action mt-[0.7em] inline-flex w-full items-center justify-center gap-[0.45em] rounded-full px-[0.9em] py-[0.55em] text-[0.76em] font-semibold ${
        done
          ? 'bg-[var(--gym-ok-bg)] text-[var(--gym-ok)]'
          : waiting
            ? 'bg-[var(--demo-accent-soft)] text-[var(--gym-accent-ink)]'
            : 'bg-[var(--demo-accent)] text-white shadow-[0_0.4em_1em_-0.5em_rgb(91_52_214/0.8)] hover:bg-[#4d27c4]'
      }`}
    >
      {label}
    </button>
  );
}

export function MissionCard({ id }: { id: MissionId }) {
  const t = useTranslations('demoGym');
  const fmt = useFmt();
  const { world, state } = useGym();
  const { mission, value, title, detail, progress } = useMissionText(id);
  const doneAt = world.me.doneAt[id];
  const done = doneAt !== undefined;
  const fresh = done && isFresh({ at: doneAt }, state.tick);
  return (
    <li className={`demo-card relative overflow-hidden rounded-[1em] p-[0.8em] ${fresh ? 'gym-fresh' : ''}`}>
      <div className="flex items-start gap-[0.65em]">
        <span className="relative">
          <MissionIcon id={id} done={done} />
          {fresh ? <Burst count={10} radius={2.2} colors={['#5b34d6', '#f5b942', '#16a34a']} /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.84em] font-semibold leading-tight">{title}</h3>
          <p className="mt-[0.15em] text-[0.68em] text-[var(--demo-muted)]">{detail}</p>
        </div>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full px-[0.55em] py-[0.2em] text-[0.66em] font-semibold ${
            done ? 'bg-[var(--gym-ok-bg)] text-[var(--gym-ok)]' : 'bg-[var(--gym-flame-bg)] text-[var(--gym-flame-ink)]'
          }`}
        >
          +{fmt.num(mission.reward)} {t('pts')}
        </span>
      </div>
      <div className="mt-[0.65em] flex items-center gap-[0.6em]">
        <Meter value={value / mission.goal} tone={done ? 'ok' : 'accent'} className="h-[0.42em] flex-1" />
        <span className={`tabular shrink-0 text-[0.66em] font-semibold ${done ? 'text-[var(--gym-ok)]' : 'text-[var(--demo-muted)]'}`}>{progress}</span>
      </div>
      <MissionAction id={id} />
    </li>
  );
}

export function PhoneMissions() {
  const t = useTranslations('demoGym');
  const { world, store } = useGym();
  const top = useRef<HTMLDivElement>(null);
  return (
    <div ref={top} className="flex flex-col gap-[0.75em]">
      <MemberToasts />
      <ViewTitle eyebrow={t('memberView')} title={t('missionsView.title')} subtitle={t('missionsView.subtitle', { count: 7 - TODAY })} />
      <WeekSummary />
      <ul className="flex flex-col gap-[0.6em]">
        {MISSIONS.map((m) => (
          <MissionCard key={m.id} id={m.id} />
        ))}
      </ul>
      {world.me.bonusAt !== null ? (
        <button
          type="button"
          onClick={() => {
            store.replay();
            top.current?.closest('.demo-scroll')?.scrollTo({ top: 0 });
            requestAnimationFrame(() => top.current?.querySelector<HTMLButtonElement>('button:not([aria-disabled])')?.focus({ preventScroll: true }));
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

/** Owner side: how many members completed each mission this week. */
export function MissionStats({ className = '' }: { className?: string }) {
  const t = useTranslations('demoGym');
  const fmt = useFmt();
  const { world } = useGym();
  const name = useMissionName();
  const { missionCounts, missionsWeek } = world.kpis;
  return (
    <Card className={`p-[0.85em] ${className}`} as="section">
      <h3 className="text-[0.86em] font-semibold leading-tight">{t('stats.title')}</h3>
      <p className="mt-[0.15em] text-[0.68em] text-[var(--demo-muted)]">
        {t.rich('stats.total', {
          count: fmt.num(missionsWeek),
          n: (chunks) => (
            <span key={missionsWeek} className="tabular gym-count-in font-semibold text-[var(--demo-ink)]">
              {chunks}
            </span>
          ),
        })}
      </p>
      <ul className="mt-[0.6em] flex flex-col gap-[0.6em]">
        {MISSIONS.map((m) => {
          const count = missionCounts[m.id];
          return (
            <li key={m.id} className="flex items-center gap-[0.55em]">
              <MissionIcon id={m.id} className="text-[0.8em]" />
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline justify-between gap-[0.5em] text-[0.72em]">
                  <span className="truncate font-medium">{name(m.id)}</span>
                  <span key={count} className="tabular gym-count-in shrink-0 font-semibold">
                    {fmt.num(count)}
                  </span>
                </p>
                <Meter value={count / ACTIVE_MEMBERS / 0.3} className="mt-[0.3em] h-[0.3em]" />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-[0.75em] border-t border-[var(--demo-line)] pt-[0.6em] text-[0.66em] leading-[1.35] text-[var(--demo-muted)]">
        {t('stats.participation', { value: fmt.pct(PARTICIPATION) })}
      </p>
    </Card>
  );
}
