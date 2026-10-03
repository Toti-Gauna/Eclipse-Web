'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, BadgeCheck, CreditCard, Landmark, PenLine, RotateCcw } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { BrowserFrame, Card, ChatWidget, LandingPreview, SiteSection } from '../../kit';
import { ENROLLED_TODAY, SITE_URL, STORY, storyClock, type CefrLevel } from '../data';
import { act, type Enrollment } from '../story';
import { useAcademy } from '../context';
import { AtrioMark, ChalkUnderline, PersonAvatar, ViewHead, useAcademyText } from '../ui';

/** The site's chatbot: the level test, the recommended course, enroll and pay. */
function TestChat({ className = '' }: { className?: string }) {
  const t = useTranslations('demoAcademy.site');
  const { view, state, run, announce } = useAcademy();
  const { fmt, name } = useAcademyText();
  return (
    <div className={`atrio-testchat ${className}`}>
      <p className="atrio-testchat-who" aria-live="off">
        <PenLine aria-hidden strokeWidth={2} />
        {view.siteMine ? t('takingYou') : t('taking', { name: name('julieta') })}
      </p>
      <ChatWidget
        run={view.site}
        variant="widget"
        title={t('botName')}
        subtitle={t('botSub')}
        avatar={<AtrioMark />}
        stamp={(at) => fmt.time(storyClock((view.siteMine ? state.site.start : STORY.lead) + at))}
        label={t('chatLabel')}
        announce={announce}
        onPick={(step, reply) => run(act.pickSite(view.site, step, reply), 'select')}
        composer={t('composer')}
        className="atrio-chat atrio-sitechat"
      />
    </div>
  );
}

function TryButton({ className = '' }: { className?: string }) {
  const t = useTranslations('demoAcademy.site');
  const { run, view } = useAcademy();
  return (
    <button type="button" className={`atrio-btn atrio-btn-ghost ${className}`} onClick={() => run(act.restartSite(), 'select')}>
      <RotateCcw aria-hidden strokeWidth={2} />
      {view.siteMine ? t('again') : t('tryIt')}
    </button>
  );
}

/** The public landing of the school (fictional URL, .demo TLD). */
function Landing({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoAcademy.site');
  const { business, ticketUsd } = useAcademy();
  const { course } = useAcademyText();
  const { format } = useCurrency();
  const levels: CefrLevel[] = ['A2', 'B1', 'B2'];
  return (
    <LandingPreview
      compact={compact}
      className="atrio-site"
      brand={
        <>
          <AtrioMark className="atrio-site-mark" />
          {business}
        </>
      }
      links={[t('links.courses'), t('links.live'), t('links.prices')]}
      cta={<span className="atrio-site-cta">{t('cta')}</span>}
      hero={{
        kicker: t('kicker'),
        title: (
          <>
            {t('heroA')}{' '}
            <span className="atrio-mark" data-mark="under">
              {t('heroB')}
              <ChalkUnderline tone="salmon" />
            </span>
          </>
        ),
        body: t('heroBody'),
        actions: (
          <>
            <span className="atrio-site-btn" data-primary="">
              {t('testCta')}
              <ArrowRight aria-hidden strokeWidth={2} />
            </span>
            {!compact ? <span className="atrio-site-btn">{t('seeCourses')}</span> : null}
          </>
        ),
        media: compact ? undefined : <TestChat />,
      }}
    >
      {compact ? (
        <div className="atrio-site-chatblock">
          <TestChat />
        </div>
      ) : null}
      <SiteSection kicker={t('coursesKicker')} title={t('coursesTitle')}>
        <ul className="atrio-site-courses">
          {levels.map((l) => (
            <li key={l}>
              <span className="atrio-site-level demo-mono">{l}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{course('en', l)}</span>
                <span className="block text-[0.86em] text-[var(--demo-muted)]">{t('courseMeta')}</span>
              </span>
              <span className="demo-mono atrio-site-price">{t('perMonth', { price: format(ticketUsd) })}</span>
            </li>
          ))}
        </ul>
      </SiteSection>
    </LandingPreview>
  );
}

/** Today's enrollments (newest first): the live one lands on top. */
function Enrollments({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoAcademy.site');
  const { view } = useAcademy();
  const { fmt, name, course } = useAcademyText();
  const live = [...view.enrollments].filter((e) => e.at < 0 || view.t >= e.at).reverse();
  const row = (key: string, who: Parameters<typeof name>[0], e: Pick<Enrollment, 'level' | 'course' | 'pay'> & { lang?: 'en' | 'pt' }, time: string, fresh: boolean) => (
    <li key={key} className={`atrio-enrol ${fresh ? 'demo-pop atrio-enrol-fresh' : ''}`}>
      <PersonAvatar id={who ?? 'you'} />
      <span className="min-w-0 flex-1 leading-[1.2]">
        <span className="block truncate text-[0.76em] font-semibold">{name(who)}</span>
        <span className="block truncate text-[0.62em] text-[var(--demo-muted)]">
          {t('enrolLine', { level: e.level, course: course(e.lang ?? 'en', e.course) })}
        </span>
      </span>
      <span className="atrio-enrol-pay" title={t(`payShort.${e.pay}`)}>
        {e.pay === 'card' ? <CreditCard aria-hidden strokeWidth={1.8} /> : <Landmark aria-hidden strokeWidth={1.8} />}
        <span className="sr-only">{t(`payShort.${e.pay}`)}</span>
      </span>
      <span className="atrio-enrol-time demo-mono">{time}</span>
    </li>
  );
  return (
    <Card className="atrio-panel atrio-enrols" as="section">
      <div className="atrio-panel-head">
        <h3 className="atrio-h3">{t('enrolledToday')}</h3>
        <span className="atrio-label demo-mono">{t('enrolledCount', { count: view.kpi.enrollments })}</span>
      </div>
      <ul className="atrio-enrol-list">
        {live.map((e) =>
          row(`${e.who}-${e.at}`, e.who, e, e.at < 0 ? '—' : fmt.time(storyClock(e.at)), e.at >= 0 && view.t - e.at < 2600),
        )}
        {ENROLLED_TODAY.slice(0, compact ? 1 : 2).map((e) => (
          <li key={e.id} className="atrio-enrol">
            <span className="atrio-enrol-anon" aria-hidden>
              <BadgeCheck strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1 leading-[1.2]">
              <span className="block truncate text-[0.76em] font-semibold">{t(`leads.${e.who}`)}</span>
              <span className="block truncate text-[0.62em] text-[var(--demo-muted)]">{t('enrolLine', { level: e.level, course: course(e.lang, e.course) })}</span>
            </span>
            <span className="atrio-enrol-pay">
              {e.pay === 'card' ? <CreditCard aria-hidden strokeWidth={1.8} /> : <Landmark aria-hidden strokeWidth={1.8} />}
              <span className="sr-only">{t(`payShort.${e.pay}`)}</span>
            </span>
            <span className="atrio-enrol-time demo-mono">{fmt.time(e.time)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** The level test as a funnel (visits → tests → enrollments this month). */
function Funnel() {
  const t = useTranslations('demoAcademy.site');
  const { view } = useAcademy();
  const { fmt } = useAcademyText();
  const steps = [
    { id: 'visits', value: 1840 },
    { id: 'tests', value: 312 + (view.site.items.length ? 1 : 0) },
    { id: 'enrolled', value: view.kpi.enrollments },
  ];
  return (
    <Card className="atrio-panel atrio-funnel" as="section">
      <h3 className="atrio-h3">{t('funnel')}</h3>
      <ol>
        {steps.map((s, i) => (
          <li key={s.id} style={{ ['--w' as string]: `${[1, 0.62, 0.3][i]}` }}>
            <span className="atrio-funnel-bar" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{t(`funnelSteps.${s.id}`)}</span>
            <span className="demo-mono">{fmt.num(s.value)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function LaptopSite() {
  const t = useTranslations('demoAcademy.site');
  return (
    <div className="atrio-cols-site">
      <BrowserFrame url={`${SITE_URL}/${t('path')}`} className="atrio-browser">
        <Landing />
      </BrowserFrame>
      <div className="flex min-w-0 flex-col gap-[0.7em]">
        <ViewHead index={t('index')} title={t('title')} />
        <TryButton />
        <Enrollments />
        <Funnel />
      </div>
    </div>
  );
}

export function PhoneSite() {
  const t = useTranslations('demoAcademy.site');
  return (
    <div className="atrio-school-phone">
      <ViewHead index={t('index')} title={t('title')} />
      <BrowserFrame url={SITE_URL} variant="mobile" className="atrio-browser atrio-browser-phone">
        <Landing compact />
      </BrowserFrame>
      <TryButton className="self-start" />
      <Enrollments compact />
    </div>
  );
}
