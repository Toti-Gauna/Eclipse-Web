'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BellRing, ChevronDown, Flame, MessageCircle, Target, Trophy, UserCheck, Zap } from 'lucide-react';
import { BrowserFrame, ChatPeek, ChatWidget, DemoBadge, LandingPreview, Readout, SiteSection } from '../../kit';
import { LEAD, SESSIONS, SITE_URL } from '../model';
import { act } from '../story';
import { useGym, useGymText } from '../hooks';
import { useChats } from '../scripts';
import { HudHead, MemberAvatar, OrbitaMark, storyClockAt } from '../parts';

/** The hero art: an orbit with the app's game pieces riding it. */
function OrbitArt() {
  const t = useTranslations('demoGym.site');
  return (
    <span className="gym-orbit" aria-hidden>
      <span className="gym-orbit-ring" />
      <span className="gym-orbit-ring" data-r="2" />
      <span className="gym-orbit-core">
        <OrbitaMark />
      </span>
      <span className="gym-orbit-chip" data-at="a">
        <Zap strokeWidth={2.2} />
        +300 XP
      </span>
      <span className="gym-orbit-chip" data-at="b">
        <Flame strokeWidth={2.2} />
        {t('artStreak')}
      </span>
      <span className="gym-orbit-chip" data-at="c">
        <Trophy strokeWidth={2.2} />
        {t('artLevel')}
      </span>
    </span>
  );
}

function SiteBody({ compact }: { compact: boolean }) {
  const t = useTranslations('demoGym.site');
  const { view, business } = useGym();
  const { fmt, kind } = useGymText();
  const today = SESSIONS.filter((s) => s.day === view.day).slice(0, compact ? 3 : 4);
  return (
    <LandingPreview
      compact={compact}
      brand={
        <span className="gym-site-brand">
          <OrbitaMark />
          {business}
          <DemoBadge />
        </span>
      }
      links={[t('links.classes'), t('links.schedule')]}
      cta={<span className="gym-site-cta">{t('cta')}</span>}
      hero={{
        kicker: t('kicker'),
        title: t('title'),
        body: t('body'),
        actions: <span className="gym-site-btn">{t('action')}</span>,
      }}
      className="gym-site"
    >
      <SiteSection kicker={t('todayKicker')} title={t('todayTitle')}>
        <ul className="gym-site-today">
          {today.map((s) => (
            <li key={s.id}>
              <span className="demo-num">{fmt.gutter(s.start)}</span>
              <b>{kind(s.kind)}</b>
              <span>{t('spots', { count: s.cap - view.booked[s.id] })}</span>
            </li>
          ))}
        </ul>
      </SiteSection>
      {compact ? null : (
        <SiteSection kicker={t('appKicker')} title={t('appTitle')} className="gym-site-appsec">
          <OrbitArt />
          <ul className="gym-site-app">
            <li>
              <Target aria-hidden strokeWidth={2} />
              {t('app1')}
            </li>
            <li>
              <Flame aria-hidden strokeWidth={2} />
              {t('app2')}
            </li>
            <li>
              <Trophy aria-hidden strokeWidth={2} />
              {t('app3')}
            </li>
          </ul>
        </SiteSection>
      )}
    </LandingPreview>
  );
}

function LeadChat({ compact }: { compact: boolean }) {
  const t = useTranslations('demoGym.lead');
  const { view, run, announce } = useGym();
  const { fmt } = useGymText();
  const { lead } = useChats();
  const [open, setOpen] = useState(true);
  const pick = (step: string, reply: string) => run(act.pickLead(step, reply), 'select');
  if (!open) {
    return (
      <ChatPeek
        run={lead}
        title={t('title')}
        avatar={<MessageCircle aria-hidden strokeWidth={1.9} />}
        onPick={pick}
        onOpen={() => setOpen(true)}
        openLabel={t('open')}
        className="gym-peek"
      />
    );
  }
  return (
    <div className="gym-leadchat" data-compact={compact ? '' : undefined}>
      <button type="button" className="gym-leadchat-min" onClick={() => setOpen(false)} aria-label={t('minimize')}>
        <ChevronDown aria-hidden strokeWidth={2} />
      </button>
      <ChatWidget
        run={lead}
        variant="widget"
        title={t('title')}
        subtitle={t('subtitle')}
        avatar={<OrbitaMark />}
        stamp={(at) => fmt.time(storyClockAt(view, at + 500).clock)}
        label={t('label')}
        announce={announce}
        onPick={pick}
        composer={t('composer')}
        className="gym-leadchat-w"
      />
    </div>
  );
}

function Leads() {
  const t = useTranslations('demoGym.leads');
  const { view } = useGym();
  const { short, session } = useGymText();
  const booked = view.trial && view.trial.at <= view.t;
  const came = view.trialInAt !== null && view.trialInAt <= view.t;
  return (
    <aside className="gym-leads" aria-labelledby="gym-leads-h">
      <p id="gym-leads-h" className="gym-auto-kicker">
        {t('title')}
      </p>
      <p className="gym-leads-n demo-display">
        <Readout value={view.kpi.leads} />
      </p>
      <p className="gym-leads-cap">{t('caption')}</p>
      <div className="gym-lead" data-on={booked ? '' : undefined} data-fresh={booked && view.t - view.trial!.at < 2500 ? '' : undefined}>
        {booked ? (
          <>
            <span className="flex items-center gap-[0.5em]">
              <MemberAvatar id={LEAD} />
              <span className="min-w-0 leading-[1.2]">
                <span className="block truncate font-semibold">{short(LEAD)}</span>
                <span className="block truncate text-[0.82em] text-[var(--demo-muted)]">{t('via')}</span>
              </span>
            </span>
            <span className="gym-lead-class">{session(view.trial!.session)}</span>
            <ol className="gym-lead-steps">
              <li data-on="">{t('step1')}</li>
              <li data-on="">{t('step2')}</li>
              <li data-on={came ? '' : undefined}>
                {came ? <UserCheck aria-hidden strokeWidth={2} /> : <BellRing aria-hidden strokeWidth={2} />}
                {came ? t('step3done') : t('step3')}
              </li>
            </ol>
          </>
        ) : (
          <span className="gym-lead-wait">{t('waiting')}</span>
        )}
      </div>
      <p className="gym-leads-rate">{t('rate')}</p>
    </aside>
  );
}

export function LaptopSite() {
  const t = useTranslations('demoGym.siteView');
  return (
    <div className="gym-view">
      <HudHead index="06" label={t('index')} title={t('title')} sub={t('sub')} />
      <div className="gym-site-grid">
        <div className="gym-site-frame">
          <BrowserFrame url={`${SITE_URL}/clase-gratis`}>
            <SiteBody compact={false} />
          </BrowserFrame>
          <LeadChat compact={false} />
        </div>
        <Leads />
      </div>
    </div>
  );
}

export function PhoneSite() {
  const t = useTranslations('demoGym.siteView');
  return (
    <div className="gym-view" data-screen="phone">
      <HudHead index="06" label={t('index')} title={t('title')} sub={t('sub')} />
      <div className="gym-site-frame" data-screen="phone">
        <BrowserFrame url={SITE_URL} variant="mobile">
          <SiteBody compact />
        </BrowserFrame>
        <LeadChat compact />
      </div>
      <Leads />
    </div>
  );
}
