'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, Globe, HeartPulse, LayoutDashboard, Smartphone, Trophy, Users } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { verticalById } from '@/lib/content';
import { AppShell, LiveDot, usePairedStore, useStory, type NavItem } from '../kit';
import type { DemoProps } from '../types';
import { HERO, ORBITA_THEME } from './model';
import { createGymStore, deriveGym, isOffNow, type MemberTab, type PhoneOverlay } from './story';
import { GymProvider, useGymText, type GymCtx, type OwnerTab } from './hooks';
import { Announcer, DayDial, GymToasts, MemberAvatar, OrbitaMark } from './parts';
import { DayCut, LevelUp, MEMBER_TABS, MemberClasses, MemberHome, MemberLeague, MemberPush, WaThread } from './views/Member';
import { LaptopToday, PhoneToday } from './views/Today';
import { LaptopRetention, PhoneRetention } from './views/Retention';
import { LaptopMembers, PhoneMembers } from './views/Members';
import { LaptopClasses, PhoneClasses } from './views/Classes';
import { LaptopLeague } from './views/League';
import { LaptopSite, PhoneSite } from './views/Site';
import './orbita.css';

const OWNER_VIEWS: Record<OwnerTab, Record<DemoProps['screen'], () => ReactNode>> = {
  today: { laptop: LaptopToday, phone: PhoneToday },
  retention: { laptop: LaptopRetention, phone: PhoneRetention },
  members: { laptop: LaptopMembers, phone: PhoneMembers },
  classes: { laptop: LaptopClasses, phone: PhoneClasses },
  league: { laptop: LaptopLeague, phone: MemberLeague },
  site: { laptop: LaptopSite, phone: PhoneSite },
};
const MEMBER_VIEWS: Record<MemberTab, () => ReactNode> = { home: MemberHome, classes: MemberClasses, league: MemberLeague };

/** Where the visitor took Lucía's phone (null: the story drives it). Reset every loop. */
interface PhoneNav {
  loop: number;
  tab: MemberTab;
  day: number | null;
  overlay: PhoneOverlay | null;
  dismissed: PhoneOverlay[];
}

const TOASTY = new Set(['booked', 'trial', 'back', 'levelup', 'league']);

/**
 * Órbita Fitness (vertical "gimnasios"): a training studio whose members play.
 * - laptop: the owner's panel (collapsible sidebar): today, retention + win-back
 *   automation, members, classes, leagues and missions, site + lead chatbot.
 * - phone alone: Lucía's member app (XP, streak, missions, classes, league) with a
 *   switch to the owner's panel, so every module is one tap away.
 * - phone next to the laptop: Lucía's phone, paired with the owner's panel.
 * One ~28 s story (story.ts) drives every screen.
 */
export default function GymDemo({ screen, active }: DemoProps) {
  const vertical = verticalById('gimnasios')!;
  const business = vertical.business ?? '';
  const keyNumber = { value: vertical.keyNumber?.value ?? 0, prefix: vertical.keyNumber?.prefix ?? '', suffix: vertical.keyNumber?.suffix ?? '' };
  const t = useTranslations('demoGym');
  const { fmt } = useGymText();
  const { play } = useSound();

  const { store, paired, ref } = usePairedStore('gym', createGymStore);
  const snap = useStory(store, active);
  const view = useMemo(() => deriveGym(snap.state, snap.t, snap.reduced), [snap.state, snap.t, snap.reduced]);
  const announce = screen === 'laptop' || !paired;
  const memberOnly = screen === 'phone' && paired;

  const [tab, setTab] = useState<OwnerTab>('today');
  const [mode, setMode] = useState<'member' | 'owner'>('member');
  const [nav, setNav] = useState<PhoneNav | null>(null);

  /* ---- Lucía's phone: the story drives it until the visitor takes over ---- */
  const scene = view.scene;
  const mine = nav && nav.loop === snap.loop ? nav : null;
  const mTab = mine ? mine.tab : scene.tab;
  const mDay = mine?.day ?? scene.day;
  const dismissed = mine?.dismissed ?? [];
  let mOverlay: PhoneOverlay | null = mine ? mine.overlay : null;
  if (!mOverlay && scene.overlay && !dismissed.includes(scene.overlay) && (!mine || scene.overlay === 'levelup')) mOverlay = scene.overlay;
  // Keep the last overlay's content while it closes.
  const [lastOverlay, setLastOverlay] = useState<PhoneOverlay | null>(null);
  if (mOverlay && mOverlay !== lastOverlay) setLastOverlay(mOverlay);

  /** The visitor touched Lucía's phone: from now on (this loop) it stays where they are. */
  const takeOver = (patch: Partial<PhoneNav>) => {
    store.engage();
    setNav((cur) => {
      const base: PhoneNav = cur && cur.loop === snap.loop ? cur : { loop: snap.loop, tab: mTab, day: null, overlay: mOverlay, dismissed };
      return { ...base, ...patch };
    });
  };
  const memberApp = screen === 'phone' && (memberOnly || mode === 'member');

  /* ---- sound: one instance per pair, only while visible ---- */
  const last = view.events[view.events.length - 1];
  const lastId = last?.id ?? '';
  const lastKind = last?.kind;
  const heard = useRef<string | null>(null);
  useEffect(() => {
    const first = heard.current === null;
    heard.current = lastId;
    if (first || !active || !announce || !lastKind) return;
    if (TOASTY.has(lastKind)) play('success');
  }, [lastId, lastKind, active, announce, play]);
  // Chat bubbles: Lucía's WhatsApp always; the site's chat only while its section is open here.
  useBubbleSound(view.wa.items.filter((i) => i.from === 'bot').length, active && announce, play);
  useBubbleSound(view.lead.items.filter((i) => i.from === 'bot').length, active && announce && screen === 'laptop' && tab === 'site', play);

  const ctx: GymCtx = {
    screen,
    paired,
    store,
    state: snap.state,
    view,
    t: snap.t,
    loop: snap.loop,
    reduced: snap.reduced,
    active,
    announce,
    business,
    keyNumber,
    go: (id) => {
      setTab(id);
      if (active) play('select');
    },
    member: {
      tab: mTab,
      day: mDay,
      overlay: mOverlay,
      open: (id) => takeOver({ tab: id, overlay: null }),
      pickDay: (d) => {
        takeOver({ day: d });
        if (active) play('select');
      },
      openOverlay: (o) => {
        takeOver({ overlay: o });
        if (active) play('open');
      },
      closeOverlay: () => {
        takeOver({ overlay: null, dismissed: mOverlay ? [...dismissed, mOverlay] : dismissed });
        if (active) play('close');
      },
    },
    setMode: memberOnly ? undefined : setMode,
    run: (fn, sound) => {
      store.update(fn);
      store.engage();
      if (memberApp) takeOver({});
      if (active && sound) play(sound);
    },
  };

  const clock = fmt.time(view.clock);
  const winOn = !isOffNow(snap.state.off);
  const siteLive = view.lead.typing || (view.lead.items.length > 0 && !view.lead.done);

  /* ---- phone: Lucía's member app (alone, or paired with the laptop) ---- */
  if (memberApp) {
    const View = MEMBER_VIEWS[mTab];
    const memberNav: NavItem[] = MEMBER_TABS.map((m) => ({ id: m.id, label: t(`app.tabs.${m.id}`), icon: m.icon }));
    const overlayKind = mOverlay ?? lastOverlay;
    return (
      <GymProvider value={ctx}>
        <AppShell
          screen="phone"
          theme={ORBITA_THEME}
          business={business}
          logo={<OrbitaMark />}
          nav={memberNav}
          current={mTab}
          onNavigate={(id) => ctx.member.open(id as MemberTab)}
          headerRight={memberOnly ? <MemberAvatar id={HERO} /> : <ModeSwitch mode="member" onChange={setModeWithSound(setMode, active, play)} />}
          active={active}
          rootRef={ref}
          statusTime={clock}
          overlay={overlayKind === 'wa' ? <WaThread key={snap.loop} /> : overlayKind === 'levelup' ? <LevelUp key={snap.loop} /> : undefined}
          overlayOpen={mOverlay !== null}
          overlayOrigin={overlayKind === 'levelup' ? ['50%', '58%'] : ['50%', '7%']}
        >
          <div className="gym" data-screen="phone">
            <DayCut />
            <MemberPush kind={mOverlay === 'wa' ? null : scene.push} />
            <div key={`${mTab}-${snap.loop}`} className="demo-view">
              <View />
            </div>
            <Announcer />
          </div>
        </AppShell>
      </GymProvider>
    );
  }

  /* ---- owner's panel (laptop, or the phone alone in owner mode) ---- */
  const ownerNav: NavItem[] =
    screen === 'laptop'
      ? [
          { id: 'today', label: t('nav.today'), icon: LayoutDashboard },
          { id: 'retention', label: t('nav.retention'), icon: HeartPulse, badge: view.kpi.atRisk, group: t('nav.groupMembers') },
          { id: 'members', label: t('nav.members'), icon: Users },
          { id: 'classes', label: t('nav.classes'), icon: CalendarDays },
          { id: 'league', label: t('nav.league'), icon: Trophy, group: t('nav.groupGrowth') },
          { id: 'site', label: t('nav.site'), icon: Globe, badge: siteLive ? 'live' : undefined },
        ]
      : [
          { id: 'today', label: t('nav.todayShort'), icon: LayoutDashboard },
          { id: 'retention', label: t('nav.retentionShort'), icon: HeartPulse, badge: view.kpi.atRisk },
          { id: 'members', label: t('nav.members'), icon: Users },
          { id: 'classes', label: t('nav.classes'), icon: CalendarDays },
          { id: 'site', label: t('nav.siteShort'), icon: Globe, badge: siteLive ? 'live' : undefined },
        ];
  const current = screen === 'phone' && tab === 'league' ? 'today' : tab;
  const View = OWNER_VIEWS[current][screen];
  return (
    <GymProvider value={ctx}>
      <AppShell
        screen={screen}
        theme={ORBITA_THEME}
        business={business}
        logo={<OrbitaMark />}
        nav={ownerNav}
        current={current}
        onNavigate={(id) => setTab(id as OwnerTab)}
        title={
          screen === 'laptop' ? (
            <span className="gym-toptitle">
              <span className="gym-toptitle-k">{ownerNav.find((n) => n.id === current)?.label}</span>
              <DayDial />
            </span>
          ) : undefined
        }
        headerRight={
          screen === 'laptop' ? (
            <>
              <span className="gym-toppill" data-off={winOn ? undefined : ''}>
                <LiveDot color={winOn ? 'var(--demo-accent)' : 'var(--demo-accent-2)'} />
                {winOn ? t('top.winOn') : t('top.winOff')}
              </span>
              <span className="gym-owner" aria-hidden>
                {t('top.ownerInitials')}
              </span>
            </>
          ) : (
            <ModeSwitch mode="owner" onChange={setModeWithSound(setMode, active, play)} />
          )
        }
        sidebarFooter={<SidebarFooter on={winOn} />}
        active={active}
        rootRef={ref}
        statusTime={clock}
      >
        <div className="gym" data-screen={screen}>
          {screen === 'phone' ? <DayCut /> : null}
          <GymToasts placement={screen === 'phone' ? 'top' : 'bottom-right'} />
          <div key={current} className="demo-view">
            <View />
          </div>
          <Announcer />
        </div>
      </AppShell>
    </GymProvider>
  );
}

/** A soft "type" when a new bot bubble appears (not when the count jumps because a view opened). */
function useBubbleSound(count: number, enabled: boolean, play: (s: 'type') => void) {
  const heard = useRef<number | null>(null);
  useEffect(() => {
    const before = heard.current;
    heard.current = count;
    if (before === null || count !== before + 1 || !enabled) return;
    play('type');
  }, [count, enabled, play]);
}

const setModeWithSound =
  (set: (m: 'member' | 'owner') => void, active: boolean, play: (s: 'toggle') => void) =>
  (m: 'member' | 'owner') => {
    set(m);
    if (active) play('toggle');
  };

/** Phone alone: the member's app ⇄ the owner's panel. */
function ModeSwitch({ mode, onChange }: { mode: 'member' | 'owner'; onChange: (m: 'member' | 'owner') => void }) {
  const t = useTranslations('demoGym.mode');
  return (
    <span className="gym-mode" role="group" aria-label={t('label')}>
      <button type="button" aria-pressed={mode === 'member'} onClick={() => onChange('member')}>
        <Smartphone aria-hidden strokeWidth={2} />
        <span>{t('member')}</span>
      </button>
      <button type="button" aria-pressed={mode === 'owner'} onClick={() => onChange('owner')}>
        <LayoutDashboard aria-hidden strokeWidth={2} />
        <span>{t('owner')}</span>
      </button>
    </span>
  );
}

function SidebarFooter({ on }: { on: boolean }) {
  const t = useTranslations('demoGym.side');
  return (
    <div className="gym-sidefoot" data-off={on ? undefined : ''}>
      <span className="gym-sidefoot-mark" aria-hidden>
        <OrbitaMark />
      </span>
      <span className="min-w-0 leading-[1.25]">
        <span className="block truncate text-[0.74em] font-semibold">{t('title')}</span>
        <span className="block truncate text-[0.64em] text-[var(--demo-muted)]">{on ? t('on') : t('off')}</span>
      </span>
    </div>
  );
}
