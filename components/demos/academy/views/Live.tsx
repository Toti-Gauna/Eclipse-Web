'use client';

import { useTranslations } from 'next-intl';
import { CalendarCheck, Radio, Users } from 'lucide-react';
import { Calendar, Card, LiveDot, Meter, type CalendarEvent } from '../../kit';
import { LIVE_CLASSES, LIVE_END, LIVE_START, ON_AIR, TEACHERS } from '../data';
import { useAcademy } from '../context';
import { PersonAvatar, TeacherAvatar, ViewHead, useAcademyText } from '../ui';

/** Today's live classes per teacher; the B1 club fills up as Valentina books. */
function useClassEvents(): CalendarEvent[] {
  const t = useTranslations('demoAcademy.live');
  const tc = useTranslations('demoAcademy.student.classes');
  const { view } = useAcademy();
  const { fmt, teacher } = useAcademyText();
  const booked = view.booked !== null && view.t >= view.booked;
  return LIVE_CLASSES.map((c) => {
    const done = c.end <= view.clock;
    const onAir = c.start <= view.clock && view.clock < c.end;
    const taken = (c.taken ?? 0) + (c.id === 'club-b1' && booked ? 1 : 0);
    const tone = TEACHERS.find((x) => x.id === c.teacher)!.tone;
    return {
      id: c.id,
      column: c.teacher,
      start: c.start,
      end: c.end,
      title: tc(c.id),
      sub: c.seats ? t('seats', { taken, seats: c.seats }) : onAir ? t('onAir', { count: ON_AIR }) : done ? t('done') : t('upcoming'),
      tone,
      state: done ? 'done' : c.id === 'club-b1' && booked ? 'mine' : 'default',
      status: onAir ? <LiveDot color="var(--demo-accent-2)" /> : undefined,
      fresh: c.id === 'club-b1' && booked && view.t - (view.booked ?? 0) < 2400,
      version: c.id === 'club-b1' && booked ? 'booked' : 'base',
      label: `${fmt.time(c.start)}, ${teacher(c.teacher)}: ${tc(c.id)}`,
    };
  });
}

function OnAir() {
  const t = useTranslations('demoAcademy.live');
  const tc = useTranslations('demoAcademy.student.classes');
  const { view } = useAcademy();
  const { fmt, teacher, name } = useAcademyText();
  const club = LIVE_CLASSES.find((c) => c.id === 'club-b1')!;
  const air = LIVE_CLASSES.find((c) => c.id === 'en-a1')!;
  const booked = view.booked !== null && view.t >= view.booked;
  const taken = (club.taken ?? 0) + (booked ? 1 : 0);
  return (
    <div className="flex flex-col gap-[0.7em]">
      <Card className="atrio-panel atrio-onair" as="section">
        <p className="atrio-label atrio-onair-k">
          <Radio aria-hidden strokeWidth={2} />
          {t('onAirTitle')}
        </p>
        <p className="text-[0.86em] font-semibold">{tc(air.id)}</p>
        <p className="text-[0.66em] text-[var(--demo-muted)]">
          {teacher(air.teacher)} · {fmt.time(air.start)}–{fmt.time(air.end)}
        </p>
        <p className="atrio-onair-count">
          <Users aria-hidden strokeWidth={1.8} />
          <span className="demo-mono">{ON_AIR}</span> {t('connected')}
        </p>
      </Card>
      <Card className="atrio-panel atrio-club" as="section">
        <p className="atrio-label">{t('nextTitle')}</p>
        <p className="text-[0.86em] font-semibold">{tc(club.id)}</p>
        <p className="text-[0.66em] text-[var(--demo-muted)]">
          {teacher(club.teacher)} · {fmt.time(club.start)}
        </p>
        <div className="mt-[0.5em] flex items-center gap-[0.5em]">
          <Meter value={taken / (club.seats ?? 1)} className="flex-1" />
          <span className="demo-mono text-[0.7em]">
            {taken}/{club.seats}
          </span>
        </div>
        {booked ? (
          <p key="booked" className="atrio-club-new demo-pop">
            <PersonAvatar id="valentina" />
            <span className="min-w-0 flex-1 truncate">{t('bookedBy', { name: name('valentina') })}</span>
            <CalendarCheck aria-hidden strokeWidth={1.8} />
          </p>
        ) : (
          <p className="mt-[0.45em] text-[0.64em] text-[var(--demo-muted)]">{t('clubHint')}</p>
        )}
      </Card>
      <Card className="atrio-panel" as="section">
        <p className="atrio-label">{t('attendance')}</p>
        <p className="atrio-bigmono demo-mono">87 %</p>
        <p className="text-[0.64em] text-[var(--demo-muted)]">{t('attendanceHint')}</p>
      </Card>
    </div>
  );
}

function ClassCalendar({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoAcademy.live');
  const { view } = useAcademy();
  const { fmt, teacher } = useAcademyText();
  const events = useClassEvents();
  return (
    <Card className="atrio-panel atrio-calcard" as="section">
      <Calendar
        label={t('calendarLabel')}
        columns={TEACHERS.map((x) => ({ id: x.id, label: teacher(x.id), sub: t(`subjects.${x.id}`), mark: <TeacherAvatar id={x.id} className="text-[0.62em]" /> }))}
        start={LIVE_START}
        end={LIVE_END}
        step={30}
        events={events}
        now={view.clock}
        formatTime={fmt.time}
        formatGutter={fmt.gutter}
        rowHeight={compact ? '1.9em' : '2.05em'}
        gutter={compact ? '2.7em' : '3em'}
        times="all"
        className="atrio-cal"
      />
    </Card>
  );
}

export function LaptopLive() {
  const t = useTranslations('demoAcademy.live');
  return (
    <div className="flex flex-col gap-[0.85em]">
      <ViewHead index={t('index')} title={t('title')} sub={t('sub')} />
      <div className="atrio-cols-live">
        <ClassCalendar />
        <OnAir />
      </div>
    </div>
  );
}

export function PhoneLive() {
  const t = useTranslations('demoAcademy.live');
  return (
    <div className="atrio-school-phone">
      <ViewHead index={t('index')} title={t('title')} />
      <ClassCalendar compact />
      <OnAir />
    </div>
  );
}
