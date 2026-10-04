'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { BellRing, ChevronDown, Flame, MessageCircle, RotateCcw, Target, Trophy, UserCheck, Zap } from 'lucide-react';
import { BrowserFrame, ChatPeek, ChatWidget, DemoBadge, LandingPreview, Readout, SiteSection , keepChatFocus } from '../../kit';
import { LEAD, SITE_URL, sessionsOn } from '../model';
import { act, isFreshEvent, taken } from '../story';
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

/**
 * The site's CTAs open the chat as the visitor (a fresh conversation, answered at once) and
 * expand the widget if it was minimized. A conversation of theirs still going on is kept.
 */
function useStartChat() {
  const { run, view, siteChat } = useGym();
  return () => {
    siteChat.setOpen(true);
    if (!view.leadShowMine || !view.leadMine || view.leadMine.done) run(act.startLead(), 'open');
  };
}

function SiteBody({ compact }: { compact: boolean }) {
  const t = useTranslations('demoGym.site');
  const { view, business } = useGym();
  const { fmt, kind } = useGymText();
  const start = useStartChat();
  const today = sessionsOn(view.day).slice(0, compact ? 3 : 4);
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
      cta={
        <button type="button" className="gym-site-cta" onClick={start}>
          {t('cta')}
        </button>
      }
      hero={{
        kicker: t('kicker'),
        title: t('title'),
        body: t('body'),
        actions: (
          <button type="button" className="gym-site-btn" onClick={start} data-tour="lead">
            {t('action')}
          </button>
        ),
      }}
      className="gym-site"
    >
      <SiteSection kicker={t('todayKicker')} title={t('todayTitle')}>
        <ul className="gym-site-today">
          {today.map((s) => (
            <li key={s.id}>
              <span className="demo-num">{fmt.gutter(s.start)}</span>
              <b>{kind(s.kind)}</b>
              <span>{t('spots', { count: s.cap - taken(view, s) })}</span>
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
  const { view, run, announce, siteChat } = useGym();
  const { fmt } = useGymText();
  const chats = useChats();
  const start = useStartChat();
  const box = useRef<HTMLDivElement>(null);
  const mine = view.leadShowMine && !!chats.leadMine;
  const shown = (mine ? chats.leadMine : null) ?? chats.lead;
  const pick = (step: string, reply: string) => {
    keepChatFocus(box.current);
    run(mine ? act.pickLeadMine(step, reply) : act.pickLead(step, reply), 'select');
  };
  const begin = mine ? (view.leadMineSource?.start ?? 0) : view.leadSource.start;
  const idle = !shown.items.length && !shown.typing;
  if (!siteChat.open) {
    return (
      <ChatPeek
        run={shown}
        title={t('title')}
        avatar={<MessageCircle aria-hidden strokeWidth={1.9} />}
        onPick={pick}
        onOpen={() => siteChat.setOpen(true)}
        openLabel={t('open')}
        className="gym-peek"
      />
    );
  }
  return (
    <div ref={box} className="gym-leadchat" data-compact={compact ? '' : undefined} data-beat="chat">
      <button type="button" className="gym-leadchat-min" onClick={() => siteChat.setOpen(false)} aria-label={t('minimize')}>
        <ChevronDown aria-hidden strokeWidth={2} />
      </button>
      <ChatWidget
        run={shown}
        variant="widget"
        title={t('title')}
        subtitle={mine ? t('subtitleYou') : t('subtitle')}
        avatar={<OrbitaMark />}
        stamp={(at) => fmt.time(storyClockAt(view, begin + at).clock)}
        label={t('label')}
        announce={announce}
        onPick={pick}
        composer={false}
        footer={
          idle ? (
            <div className="gym-leadchat-idle">
              <p>{t('idle')}</p>
              <button type="button" className="gym-btn" data-variant="primary" onClick={start}>
                {t('start')}
              </button>
            </div>
          ) : !mine || shown.done ? (
            <button type="button" className="gym-leadchat-again" onClick={() => run(act.startLead(), 'open')}>
              <RotateCcw aria-hidden strokeWidth={2} />
              {mine ? t('again') : t('tryYou')}
            </button>
          ) : undefined
        }
        className="gym-leadchat-w"
      />
    </div>
  );
}

function Leads() {
  const t = useTranslations('demoGym.leads');
  const { view } = useGym();
  const { short, session } = useGymText();
  const booked = !!view.trial;
  const came = view.trialInAt !== null && view.trialInAt <= view.t;
  const trialEvent = view.events.find((e) => e.id === 'trial');
  return (
    <aside className="gym-leads" aria-labelledby="gym-leads-h">
      <p id="gym-leads-h" className="gym-auto-kicker">
        {t('title')}
      </p>
      <p className="gym-leads-n demo-display">
        <Readout value={view.kpi.leads} />
      </p>
      <p className="gym-leads-cap">{t('caption')}</p>
      <div className="gym-lead" data-on={booked ? '' : undefined} data-fresh={trialEvent && isFreshEvent(view, trialEvent, 2500) ? '' : undefined}>
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
      {view.trialYou ? (
        <div className="gym-lead" data-on="">
          <span className="flex items-center gap-[0.5em]">
            <span className="gym-lead-you" aria-hidden>
              {t('youInitials')}
            </span>
            <span className="min-w-0 leading-[1.2]">
              <span className="block truncate font-semibold">{t('you')}</span>
              <span className="block truncate text-[0.82em] text-[var(--demo-muted)]">{t('via')}</span>
            </span>
          </span>
          <span className="gym-lead-class">{session(view.trialYou.session)}</span>
        </div>
      ) : null}
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
