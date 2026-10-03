'use client';

import { useTranslations } from 'next-intl';
import { BellRing, Check } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { Avatar, Calendar, type CalendarEvent, type Tone } from '../../kit';
import { ADVISORS, ASKED, CAL_DAYS, CAL_END, CAL_START, CAL_STEP, CHAT_SLOTS, listingById } from '../data';
import { act, isVisitFree, type VisitView } from '../story';
import { useEstate } from '../context';
import { useEstateText, ViewHead } from '../ui';

const TONE: Record<VisitView['what'], Tone> = { visit: 'accent2', appraisal: 'neutral', openHouse: 'neutral', signing: 'ink' };

function useVisitEvents(): (v: VisitView) => CalendarEvent {
  const t = useTranslations('demoRealEstate');
  const { view } = useEstate();
  const x = useEstateText();
  return (v) => {
    const title = v.who === 'you' ? t('visits.you') : v.who ? x.person(v.who) : t(`visits.what.${v.what}`);
    const sub = `${v.who && v.what !== 'visit' ? `${t(`visits.what.${v.what}`)} · ` : ''}${listingById(v.listing).street}`;
    return {
      id: v.id,
      column: String(v.day),
      start: v.start,
      end: v.end,
      title,
      sub,
      tone: v.who === 'carolina' ? 'accent' : v.who === 'you' ? 'accent' : TONE[v.what],
      status: v.state === 'done' ? <Check strokeWidth={2.4} /> : undefined,
      state: v.state === 'done' ? 'done' : v.state === 'mine' ? 'mine' : 'default',
      fresh: v.changedAt >= 0 && view.t - v.changedAt < 2400,
      version: v.state === 'done' ? 'done' : v.changedAt >= 0 ? 'new' : 'base',
      label: `${x.day(v.day)} ${x.fmt.time(v.start)}: ${title}, ${sub}${v.state === 'done' ? `. ${t('visits.done')}` : ''}`,
    };
  };
}

/** The visits calendar (Fri 9 · Sat 10 · Mon 12); free cells book a visit for the visitor. */
function VisitsCalendar({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoRealEstate.visits');
  const { view, store, active } = useEstate();
  const x = useEstateText();
  const { play } = useSound();
  const toEvent = useVisitEvents();
  return (
    <Calendar
      label={t('label')}
      columns={CAL_DAYS.map((d) => ({ id: String(d), label: x.day(d) }))}
      start={CAL_START}
      end={CAL_END}
      step={CAL_STEP}
      events={view.visits.map(toEvent)}
      isFree={(col, minute) => minute % 60 === 0 && isVisitFree(view.visits, Number(col), minute)}
      onFree={(col, minute) => {
        store.update(act.book({ day: Number(col), start: minute, listing: ASKED, via: 'calendar' }));
        store.engage();
        if (active) play('success');
      }}
      freeText={compact ? undefined : t('free')}
      freeLabel={(c, minute) => t('freeLabel', { day: x.day(Number(c.id)), time: x.fmt.time(minute) })}
      freeVisible={false}
      formatTime={x.fmt.time}
      formatGutter={x.fmt.gutter}
      rowHeight={compact ? '1.55em' : '1.32em'}
      gutter={compact ? '2.7em' : '3em'}
      times="hours"
      className="re-cal"
    />
  );
}

/** Carolina's visit (or the next one), with the automatic reminder. */
function NextVisit() {
  const t = useTranslations('demoRealEstate');
  const { view } = useEstate();
  const x = useEstateText();
  const live = view.visits.find((v) => v.who === 'carolina');
  const julia = ADVISORS[0];
  if (!live || !view.slot) {
    return (
      <section className="re-panel">
        <h3 className="re-panel-title">{t('visits.next')}</h3>
        <p className="re-empty mt-[0.5em]">{t('visits.nextEmpty')}</p>
        <p className="re-hint mt-[0.6em]">{t('visits.hint')}</p>
      </section>
    );
  }
  const done = live.state === 'done';
  return (
    <section className={`re-panel re-nextvisit ${view.t - live.changedAt < 2400 ? 'demo-fresh' : ''}`} data-done={done ? '' : undefined}>
      <h3 className="re-panel-title">{t('visits.next')}</h3>
      <p className="re-nextvisit-time demo-display">{x.fmt.time(live.start)}</p>
      <p className="re-nextvisit-day">{x.day(live.day, 'long')}</p>
      <p className="mt-[0.6em] text-[0.78em] font-semibold">{t('people.carolina')}</p>
      <p className="text-[0.7em] text-[var(--demo-muted)]">{listingById(live.listing).street}</p>
      <p className="mt-[0.6em] flex items-center gap-[0.5em] text-[0.7em]">
        <Avatar initials={julia.initials} color={julia.color} ink={julia.ink} className="text-[0.8em]" />
        {t('visits.withAdvisor', { advisor: t('people.julia') })}
      </p>
      <p className="re-reminder">
        {done ? <Check aria-hidden strokeWidth={2} /> : <BellRing aria-hidden strokeWidth={1.8} />}
        {done ? t('visits.done') : t('visits.reminder')}
      </p>
    </section>
  );
}

function Legend() {
  const t = useTranslations('demoRealEstate.visits');
  return (
    <ul className="re-legend" aria-hidden>
      <li data-tone="accent">{t('legendLive')}</li>
      <li data-tone="accent2">{t('what.visit')}</li>
      <li data-tone="ink">{t('what.signing')}</li>
      <li data-tone="neutral">
        {t('what.appraisal')} · {t('what.openHouse')}
      </li>
    </ul>
  );
}

export function PhoneVisits() {
  const t = useTranslations('demoRealEstate.visits');
  return (
    <div className="flex flex-col gap-[0.9em] pt-[0.3em]">
      <ViewHead title={t('title')} sub={t('hint')} />
      <NextVisit />
      <VisitsCalendar compact />
    </div>
  );
}

export function LaptopVisits() {
  const t = useTranslations('demoRealEstate.visits');
  const { view } = useEstate();
  const x = useEstateText();
  const slot = view.slot ? CHAT_SLOTS[view.slot] : null;
  return (
    <div className="flex flex-col gap-[0.9em]">
      <ViewHead title={t('title')} sub={slot && view.bookedAt !== null ? t('booked', { slot: x.slotLong(slot) }) : t('hint')} aside={<Legend />} />
      <div className="grid grid-cols-[minmax(0,1fr)_14em] items-start gap-[1em]">
        <section className="re-panel p-[0.7em]">
          <VisitsCalendar />
        </section>
        <NextVisit />
      </div>
    </div>
  );
}
