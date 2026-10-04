'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, Globe, HeartPulse, LayoutDashboard, Smartphone, Trophy, Users } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { verticalById } from '@/lib/content';
import { AppShell, usePairedStore, useStory, type NavItem, type ShellLayout } from '../kit';
import type { DemoProps } from '../types';
import { HERO, ORBITA_THEME } from './model';
import { createGymStore, deriveGym, isOffNow, type GymEvent, type MemberTab, type PhoneOverlay } from './story';
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

/**
 * Shell variant: a game HUD, not a back office — no sidebar; a floating dock of chip icons at the
 * bottom and a compact top bar with the time-lapse dial (desktop). The member app on the phone
 * has a bottom tab bar like a game's (Inicio · Clases · Liga).
 */
const LAYOUT: ShellLayout = { nav: 'dock', density: 'compact', icons: 'chip' };

/** Where the visitor took Lucía's phone (reset with the story). */
interface PhoneNav {
  loop: number;
  tab: MemberTab;
  overlay: PhoneOverlay | null;
}

/**
 * The visitor's latest own action (store events marked `mine`), shown as a short local toast:
 * it appears when their click changes the store and a timer that the change started clears it.
 */
function useFlash(events: GymEvent[], loop: number): GymEvent | null {
  const ids = events.map((e) => e.id).join('|');
  const [seen, setSeen] = useState({ loop, ids });
  const [flash, setFlash] = useState<GymEvent | null>(null);
  if (seen.loop !== loop || seen.ids !== ids) {
    const before = new Set(seen.ids.split('|'));
    const added = seen.loop === loop ? events.filter((e) => e.mine && !before.has(e.id)) : [];
    setSeen({ loop, ids });
    setFlash(added.length ? added[added.length - 1] : seen.loop !== loop ? null : flash);
  }
  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 3000);
    return () => window.clearTimeout(id);
  }, [flash]);
  return flash;
}

/**
 * Órbita Fitness (vertical "gimnasios"): a training studio whose members play.
 * - laptop: the owner's panel (dock): today, retention + win-back automation, members,
 *   classes (week navigation), leagues and missions, site + trial-class chatbot.
 * - phone alone: Lucía's member app (XP, streak, missions, classes, league) with a switch to
 *   the owner's panel, so every module is one tap away.
 * - phone next to the laptop: Lucía's phone, paired with the owner's panel.
 * Nothing plays on its own: four beats from the SimBar (story.ts); everything the visitor does
 * (book, check in, answer, send) is local demo data and shows at once.
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
  const flash = useFlash(view.events, snap.loop);

  const [tab, setTab] = useState<OwnerTab>('today');
  const [mode, setMode] = useState<'member' | 'owner'>('member');
  const [navState, setNav] = useState<PhoneNav | null>(null);
  const nav = navState && navState.loop === snap.loop ? navState : { loop: snap.loop, tab: 'home' as MemberTab, overlay: null };
  // Keep the last overlay's content while it closes.
  const [lastOverlay, setLastOverlay] = useState<PhoneOverlay | null>(null);
  if (nav.overlay && nav.overlay !== lastOverlay) setLastOverlay(nav.overlay);
  const patchNav = (patch: Partial<PhoneNav>) => setNav({ ...nav, ...patch });
  const memberApp = screen === 'phone' && (memberOnly || mode === 'member');

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
    flash,
    go: (id) => {
      setTab(id);
      if (active) play('select');
    },
    member: {
      tab: nav.tab,
      overlay: nav.overlay,
      open: (id) => patchNav({ tab: id, overlay: null }),
      openOverlay: (o) => {
        patchNav({ overlay: o });
        if (active) play('open');
      },
      closeOverlay: () => {
        patchNav({ overlay: null });
        if (active) play('close');
      },
    },
    setMode: memberOnly ? undefined : setMode,
    run: (fn, sound) => {
      const before = view.level;
      store.update(fn);
      const next = store.getSnapshot();
      const after = deriveGym(next.state, next.t, snap.reduced).level;
      // The visitor's own action made Lucía level up: celebrate it (a reaction to their click).
      if (after > before && memberApp) {
        patchNav({ overlay: 'levelup' });
        if (active) play('success');
        return;
      }
      if (active && sound) play(sound);
    },
  };

  const clock = fmt.time(view.clock);
  const winOn = !isOffNow(snap.state.off);
  const sim = { store, label: (id: string) => t(`sim.${id}`), note: t('sim.note'), tour: 'sim', announce };

  /* ---- phone: Lucía's member app (alone, or paired with the laptop) ---- */
  if (memberApp) {
    const View = MEMBER_VIEWS[nav.tab];
    const memberNav: NavItem[] = MEMBER_TABS.map((m) => ({ id: m.id, label: t(`app.tabs.${m.id}`), icon: m.icon, tour: m.tour }));
    const overlayKind = nav.overlay ?? lastOverlay;
    return (
      <GymProvider value={ctx}>
        <AppShell
          screen="phone"
          theme={ORBITA_THEME}
          business={business}
          logo={<OrbitaMark />}
          nav={memberNav}
          current={nav.tab}
          onNavigate={(id) => ctx.member.open(id as MemberTab)}
          phoneNav="tabs"
          headerRight={memberOnly ? <MemberAvatar id={HERO} /> : <ModeSwitch mode="member" onChange={setModeWithSound(setMode, active, play)} />}
          active={active}
          rootRef={ref}
          statusTime={clock}
          sim={sim}
          overlay={overlayKind === 'wa' ? <WaThread key={snap.loop} /> : overlayKind === 'levelup' ? <LevelUp key={snap.loop} /> : undefined}
          overlayOpen={nav.overlay !== null}
          overlayOrigin={overlayKind === 'levelup' ? ['50%', '58%'] : ['50%', '7%']}
        >
          <div className="gym" data-screen="phone">
            <DayCut />
            <MemberPush kind={nav.overlay === 'wa' ? null : view.push} />
            <GymToasts placement="top" />
            <div key={`${nav.tab}-${snap.loop}`} className="demo-view">
              <View />
            </div>
            <Announcer />
          </div>
        </AppShell>
      </GymProvider>
    );
  }

  /* ---- owner's panel (laptop, or the phone alone in owner mode) ---- */
  const ownerNav: NavItem[] = [
    { id: 'today', label: t(screen === 'phone' ? 'nav.todayShort' : 'nav.today'), icon: LayoutDashboard },
    { id: 'retention', label: t(screen === 'phone' ? 'nav.retentionShort' : 'nav.retention'), icon: HeartPulse, badge: view.kpi.atRisk, tour: 'winback' },
    { id: 'members', label: t('nav.members'), icon: Users },
    { id: 'classes', label: t('nav.classes'), icon: CalendarDays, tour: 'classes' },
    ...(screen === 'laptop' ? [{ id: 'league', label: t('nav.league'), icon: Trophy, tour: 'league' }] : []),
    { id: 'site', label: t(screen === 'phone' ? 'nav.siteShort' : 'nav.site'), icon: Globe, tour: 'lead' },
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
        layout={LAYOUT}
        phoneNav="tabs"
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
              <button type="button" className="gym-toppill" data-off={winOn ? undefined : ''} onClick={() => ctx.go('retention')}>
                <span aria-hidden className="gym-toppill-dot" />
                {winOn ? t('top.winOn') : t('top.winOff')}
              </button>
              <span className="gym-owner" aria-hidden>
                {t('top.ownerInitials')}
              </span>
            </>
          ) : (
            <ModeSwitch mode="owner" onChange={setModeWithSound(setMode, active, play)} />
          )
        }
        active={active}
        rootRef={ref}
        statusTime={clock}
        sim={sim}
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
