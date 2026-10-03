'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { ChartColumn, House, Target, Trophy, Users } from 'lucide-react';
import { useReducedMotion } from '@/components/motion/useReducedMotion';
import { verticalById } from '@/lib/content';
import { DemoShell, useDemoClock, type DemoTab } from '../kit';
import type { DemoProps } from '../types';
import { ACCENT, MAX_TICK, TICK_MS, TODAY } from './data';
import { createGymStore, deriveWorld, pairedPhoneOf, pairedStoreFor, type GymStore } from './sim';
import { GymProvider, useFmt, type GymCtx, type GymTab } from './context';
import { LiveBadge, OrbitaLogo, PointsPill, WantThis } from './ui';
import { Announcer, LiveTicker } from './activity';
import { PhoneHome } from './Home';
import { PhoneMissions } from './Missions';
import { LaptopRanking, PhoneRanking } from './Ranking';
import { LaptopRetention, PhonePanel } from './Retention';
import { LaptopMembers } from './Members';
import './gym.css';

const PHONE_VIEWS: Partial<Record<GymTab, () => React.ReactNode>> = {
  home: PhoneHome,
  missions: PhoneMissions,
  ranking: PhoneRanking,
  panel: PhonePanel,
};
const LAPTOP_VIEWS: Partial<Record<GymTab, () => React.ReactNode>> = {
  retention: LaptopRetention,
  members: LaptopMembers,
  ranking: LaptopRanking,
};

function LaptopTopBar() {
  const t = useTranslations('demoGym');
  const fmt = useFmt();
  return (
    <>
      <div className="flex shrink-0 items-center gap-[0.7em]">
        <span className="whitespace-nowrap text-[0.85em] font-semibold">{t('ownerPanel')}</span>
        <span aria-hidden className="h-[1em] w-px bg-[var(--demo-line)]" />
        <span className="whitespace-nowrap text-[0.8em] text-[var(--demo-muted)]">{fmt.long(TODAY)}</span>
        <LiveBadge />
      </div>
      <LiveTicker className="flex-1" />
      <WantThis variant="header" />
    </>
  );
}

/**
 * Órbita Fitness (vertical "gimnasios"): the member's app (streak, weekly
 * missions, leaderboard) and the owner's retention dashboard (members at risk,
 * comeback missions, cancellations going down).
 */
export default function GymDemo({ screen, active }: DemoProps) {
  const t = useTranslations('demoGym');
  const vertical = verticalById('gimnasios')!;
  const business = vertical.business ?? '';
  const keyNumber = vertical.keyNumber?.value ?? 0;
  const ticketUsd = vertical.calculator.ticketUsd;
  const reduced = useReducedMotion();

  // Own store until we find the laptop/phone sibling of the same showcase.
  const [ownStore] = useState(() => createGymStore(false));
  const [sharedStore, setSharedStore] = useState<GymStore | null>(null);
  const store = sharedStore ?? ownStore;
  const root = useRef<HTMLDivElement | null>(null);
  const attach = useCallback((el: HTMLDivElement | null) => {
    root.current = el;
    if (!el) return;
    const shared = pairedStoreFor(el);
    if (shared) setSharedStore(shared);
  }, []);

  const tick = useDemoClock(active, TICK_MS, MAX_TICK);
  useEffect(() => {
    store.report(tick);
  }, [store, tick]);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const world = useMemo(() => deriveWorld(state, reduced), [state, reduced]);
  const paired = store.paired;

  const [tab, setTab] = useState<GymTab>(screen === 'laptop' ? 'retention' : 'home');
  const openTab = (id: GymTab) => {
    setTab(id);
    root.current?.closest('.demo-scroll')?.scrollTo({ top: 0 });
  };

  const ctx: GymCtx = {
    screen,
    store,
    state,
    world,
    business,
    keyNumber,
    ticketUsd,
    reduced,
    announce: screen === 'laptop' || !paired,
    paired,
    openTab,
  };

  // The showcase's phone covers the laptop's right edge: measure how much, as a
  // fraction of the screen (so neither the hero's scale animations nor the font
  // size matter), and keep the dashboards clear of it through --gym-safe, which
  // resolves in cqw against the device screen.
  useLayoutEffect(() => {
    const el = root.current;
    const screenEl = el?.closest('.device-screen');
    const phone = el ? pairedPhoneOf(el) : null;
    if (screen !== 'laptop' || !paired || !el || !screenEl || !phone) return;
    const measure = () => {
      const s = screenEl.getBoundingClientRect();
      const p = phone.getBoundingClientRect();
      if (!s.width) return;
      const covered = Math.max(0, (s.right - p.left) / s.width);
      const safe = `calc(${covered.toFixed(4)} * 100cqw + 0.8em)`;
      el.style.setProperty('--gym-safe', safe);
      // Small showcases: the phone also rises over the title row (top ~20% of the screen).
      el.style.setProperty('--gym-safe-top', (p.top - s.top) / s.height < 0.2 ? safe : '0em');
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(screenEl);
    ro.observe(phone);
    return () => ro.disconnect();
  }, [screen, paired]);

  const tabs: DemoTab[] =
    screen === 'laptop'
      ? [
          { id: 'retention', label: t('tabs.retention'), icon: ChartColumn },
          { id: 'members', label: t('tabs.members'), icon: Users },
          { id: 'ranking', label: t('tabs.ranking'), icon: Trophy },
        ]
      : [
          { id: 'home', label: t('tabs.home'), icon: House },
          { id: 'missions', label: t('tabs.missions'), icon: Target },
          { id: 'ranking', label: t('tabs.ranking'), icon: Trophy },
          { id: 'panel', label: t('tabs.panel'), icon: ChartColumn },
        ];
  const View = (screen === 'laptop' ? LAPTOP_VIEWS : PHONE_VIEWS)[tab] ?? (screen === 'laptop' ? LaptopRetention : PhoneHome);
  const headerRight = screen === 'laptop' ? <LaptopTopBar /> : tab === 'panel' ? <LiveBadge /> : <PointsPill points={world.me.points} />;

  // The provider (and the palette) wrap the shell too: the header reads the world.
  return (
    <GymProvider value={ctx}>
      <div className="gym-theme contents" data-paused={active ? undefined : ''}>
        <DemoShell
          screen={screen}
          business={business}
          accent={ACCENT}
          logo={<OrbitaLogo />}
          tabs={tabs}
          activeTab={tab}
          onTab={(id) => openTab(id as GymTab)}
          headerRight={headerRight}
        >
          <div ref={attach} className="gym flex min-h-full flex-col">
            <div key={tab} className="gym-view pt-[0.25em]">
              <View />
            </div>
            {screen === 'phone' && !paired ? (
              <div className="sticky bottom-[-1em] z-20 -mx-[1em] mt-auto bg-gradient-to-t from-[var(--demo-bg)] from-55% to-transparent px-[1em] pb-[0.8em] pt-[1.6em]">
                <WantThis variant="floating" />
              </div>
            ) : null}
            <Announcer />
          </div>
        </DemoShell>
      </div>
    </GymProvider>
  );
}
