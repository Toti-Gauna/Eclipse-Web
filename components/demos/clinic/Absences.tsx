'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { TrendingDown } from 'lucide-react';
import { gsap, useGSAP } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { Money } from '@/components/ui/Money';
import { ACCENT, NO_SHOWS_AFTER_TREND, NO_SHOWS_BEFORE } from './data';
import { useClinic, useFmt } from './context';
import { Card, RollingNumber } from './ui';
import { EventIcon, useEventText } from './activity';

const BEFORE_COLOR = '#c9c3b8';

/** No-shows before reminders (average of the "before" weeks) and this week (before − key number). */
function useNoShows() {
  const { keyNumber } = useClinic();
  const before = Math.round(NO_SHOWS_BEFORE.reduce((a, b) => a + b, 0) / NO_SHOWS_BEFORE.length);
  const now = Math.max(0, before - keyNumber);
  const weeks = [...NO_SHOWS_BEFORE, ...NO_SHOWS_AFTER_TREND, now];
  return { before, now, weeks };
}

function RecoveredHero({ className = '' }: { className?: string }) {
  const t = useTranslations('demoClinic');
  const { kpis, ticketUsd } = useClinic();
  const parts = [
    { label: t('absences.fromWaitlist'), value: kpis.recoveredWaitlistWeek, color: '#ffffff' },
    { label: t('absences.fromReminders'), value: kpis.recoveredConfirmedWeek, color: '#f5b942' },
  ];
  return (
    <section
      className={`relative flex flex-col overflow-hidden rounded-[1.15em] p-[1em] text-white shadow-[0_1em_2.4em_-1.2em_rgb(8_74_81/0.8)] ${className}`}
      style={{ background: 'radial-gradient(60% 70% at 108% -8%, rgb(245 185 66 / 0.3), transparent 62%), linear-gradient(155deg, #0d6b74 0%, #07464c 100%)' }}
    >
      <p className="max-w-[80%] text-[0.74em] font-semibold text-white/90">{t('absences.recovered')}</p>
      <p className="mt-[0.15em] text-[3.3em] font-semibold leading-none tracking-[-0.04em]">
        <RollingNumber value={kpis.recoveredWeek} fromZero tabular={false} />
      </p>

      <div aria-hidden className="mt-[0.8em] flex h-[0.45em] gap-[0.15em] overflow-hidden rounded-full">
        {parts.map((p) => (
          <span
            key={p.label}
            className="h-full rounded-full transition-[flex-grow] duration-700"
            style={{ background: p.color, flexGrow: p.value, flexBasis: 0, opacity: p.color === '#ffffff' ? 0.92 : 1 }}
          />
        ))}
      </div>
      <ul className="mt-[0.55em] flex flex-col gap-[0.25em]">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-[0.45em] text-[0.7em] text-white/90">
            <span aria-hidden className="size-[0.65em] rounded-full" style={{ background: p.color }} />
            <span className="min-w-0 flex-1 truncate">{p.label}</span>
            <span className="tabular font-semibold text-white">{p.value}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-end justify-between gap-[0.6em] border-t border-white/20 pt-[0.6em]">
        <span className="text-[0.7em] text-white/90">{t('absences.revenue')}</span>
        <Money usd={kpis.recoveredWeek * ticketUsd} approx className="whitespace-nowrap text-[0.95em] font-semibold" />
      </div>
    </section>
  );
}

function NoShowCard({ className = '' }: { className?: string }) {
  const t = useTranslations('demoClinic.absences');
  const fmt = useFmt();
  const { before, now } = useNoShows();
  return (
    <Card className={`p-[0.85em] ${className}`}>
      <p className="text-[0.72em] font-medium text-[var(--demo-muted)]">{t('noShows')}</p>
      <p className="mt-[0.3em] flex items-baseline gap-[0.45em]">
        <span className="text-[2.2em] font-semibold leading-none tracking-[-0.03em]">{now}</span>
        <span className="text-[0.74em] text-[var(--demo-muted)]">{t('before', { count: before })}</span>
      </p>
      <p className="mt-[0.55em] inline-flex items-center gap-[0.35em] rounded-full bg-[var(--clinic-ok-bg)] px-[0.6em] py-[0.25em] text-[0.68em] font-semibold text-[var(--clinic-ok)]">
        <TrendingDown aria-hidden className="size-[1.1em]" strokeWidth={2.2} />
        {t('change', { value: fmt.pct((now - before) / before) })}
      </p>
    </Card>
  );
}

function WaitlistCard({ className = '' }: { className?: string }) {
  const t = useTranslations('demoClinic');
  const { kpis } = useClinic();
  return (
    <Card className={`p-[0.85em] ${className}`}>
      <p className="text-[0.72em] font-medium text-[var(--demo-muted)]">{t('absences.waitlist')}</p>
      <p className="mt-[0.3em] text-[2.2em] font-semibold leading-none tracking-[-0.03em]">
        <RollingNumber value={kpis.waitlist} />
      </p>
      <p className="mt-[0.55em] text-[0.68em] text-[var(--demo-muted)]">{t('kpis.waitlistHint')}</p>
    </Card>
  );
}

function NoShowChart({ height = 8 }: { height?: number }) {
  const t = useTranslations('demoClinic.absences');
  const { weeks } = useNoShows();
  const ref = useRef<HTMLDivElement>(null);
  const max = Math.max(...weeks) * 1.18;
  const split = NO_SHOWS_BEFORE.length;
  const label = (i: number) => (i === weeks.length - 1 ? t('thisWeek') : t('week', { n: i + 1 }));

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap.from(ref.current.querySelectorAll('.clinic-bar'), { scaleY: 0, duration: 1, ease: 'expo.out', stagger: 0.07, delay: 0.15 });
    },
    { scope: ref },
  );

  return (
    <figure>
      <figcaption className="flex flex-wrap items-center justify-between gap-x-[0.8em] gap-y-[0.3em]">
        <span className="text-[0.86em] font-semibold">{t('chartTitle')}</span>
        <span aria-hidden className="flex items-center gap-[0.8em] text-[0.64em] text-[var(--demo-muted)]">
          <span className="flex items-center gap-[0.35em]">
            <span className="size-[0.7em] rounded-[0.2em]" style={{ background: BEFORE_COLOR }} />
            {t('chartBefore')}
          </span>
          <span className="flex items-center gap-[0.35em]">
            <span className="size-[0.7em] rounded-[0.2em]" style={{ background: ACCENT }} />
            {t('chartAfter')}
          </span>
        </span>
      </figcaption>
      <div ref={ref} aria-hidden className="relative mt-[0.8em] border-b border-[var(--demo-line)]" style={{ height: `${height}em` }}>
        <ol className="absolute inset-0 flex items-end gap-[0.5em] px-[0.2em]">
          {weeks.map((v, i) => {
            const first = i === 0;
            const last = i === weeks.length - 1;
            return (
              <li key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                <span
                  className={`tabular mb-[0.3em] text-[0.68em] font-semibold transition-opacity ${first || last ? '' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  {v}
                </span>
                <span
                  className="clinic-bar block w-full max-w-[1.7em] rounded-t-[0.35em]"
                  style={{ height: `${(v / max) * 100}%`, background: i < split ? BEFORE_COLOR : ACCENT }}
                />
              </li>
            );
          })}
        </ol>
      </div>
      <ol aria-hidden className="mt-[0.35em] flex gap-[0.5em] px-[0.2em]">
        {weeks.map((_, i) => (
          <li key={i} className={`flex-1 text-center text-[0.6em] ${i === weeks.length - 1 ? 'font-semibold text-[var(--demo-ink)]' : 'text-[var(--demo-muted)]'}`}>
            {label(i)}
          </li>
        ))}
      </ol>
      <ul className="sr-only">
        {weeks.map((v, i) => (
          <li key={i}>
            {t('barLabel', { week: label(i), count: v })} ({i < split ? t('chartBefore') : t('chartAfter')})
          </li>
        ))}
      </ul>
    </figure>
  );
}

function RecoveredToday({ limit = 4 }: { limit?: number }) {
  const t = useTranslations('demoClinic.absences');
  const { agenda } = useClinic();
  const text = useEventText();
  const list = agenda.events.filter((e) => e.recovery).reverse().slice(0, limit);
  return (
    <div>
      <h3 className="text-[0.86em] font-semibold">{t('todayTitle')}</h3>
      {list.length ? (
        <ol className="mt-[0.55em] flex flex-col gap-[0.5em]">
          {list.map((e) => (
            <li key={e.id} className="clinic-pop flex items-start gap-[0.55em]">
              <EventIcon kind={e.kind} className="text-[0.8em]" />
              <p className="min-w-0 flex-1 pt-[0.15em] text-[0.72em] leading-[1.35]">{text(e)}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-[0.4em] text-[0.72em] text-[var(--demo-muted)]">{t('todayEmpty')}</p>
      )}
    </div>
  );
}

export function PhoneAbsences() {
  const t = useTranslations('demoClinic.absences');
  return (
    <div className="flex flex-col gap-[0.75em]">
      <div>
        <h2 className="text-[1.3em] font-semibold leading-tight tracking-[-0.02em]">{t('title')}</h2>
        <p className="text-[0.74em] text-[var(--demo-muted)]">{t('subtitle')}</p>
      </div>
      <RecoveredHero />
      <NoShowCard />
      <Card className="p-[0.85em]">
        <NoShowChart height={7} />
      </Card>
      <Card className="p-[0.85em]">
        <RecoveredToday />
      </Card>
    </div>
  );
}

export function LaptopAbsences() {
  const t = useTranslations('demoClinic.absences');
  return (
    <div className="flex flex-col gap-[0.9em]">
      <div>
        <h2 className="text-[1.45em] font-semibold leading-tight tracking-[-0.02em]">{t('title')}</h2>
        <p className="text-[0.78em] text-[var(--demo-muted)]">{t('subtitle')}</p>
      </div>
      <div className="mr-[var(--clinic-safe,0em)] flex flex-col gap-[0.8em]">
        <div className="grid grid-cols-[15.5em_minmax(0,1fr)] gap-[0.8em]">
          <div className="flex flex-col gap-[0.8em]">
            <RecoveredHero />
            <WaitlistCard />
          </div>
          <div className="flex flex-col gap-[0.8em]">
            <NoShowCard />
            <Card className="flex-1 p-[0.9em]">
              <NoShowChart height={8.5} />
            </Card>
          </div>
        </div>
        <Card className="p-[0.9em]">
          <RecoveredToday limit={3} />
        </Card>
      </div>
    </div>
  );
}
