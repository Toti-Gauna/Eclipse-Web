'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BookOpenText, ChartNoAxesColumn, ChefHat, ConciergeBell, LayoutGrid, PhoneCall, QrCode } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { verticalById } from '@/lib/content';
import { AppShell, usePairedStore, useStory, type NavItem } from '../kit';
import type { DemoProps } from '../types';
import { RESTAURANT_THEME } from './data';
import { createRestaurantStore, deriveRestaurant, isOffNow, type LineId } from './story';
import { RestaurantProvider, type RestaurantCtx, type RestaurantTab } from './context';
import { useRestaurantText } from './text';
import { Announcer, LineLamps, LuceroMark, RestaurantToasts } from './ui';
import { LaptopService, PhoneService } from './views/Service';
import { LaptopCalls, PhoneCalls } from './views/Calls';
import { LaptopKitchen, PhoneKitchen } from './views/Kitchen';
import { LaptopFloor, PhoneFloor } from './views/Floor';
import { LaptopMenu, PhoneMenu } from './views/Menu';
import { LaptopNumbers, PhoneNumbers } from './views/Numbers';
import { CustomerApp } from './views/Customer';
import './restaurant.css';

const VIEWS: Record<RestaurantTab, Record<DemoProps['screen'], () => ReactNode>> = {
  service: { phone: PhoneService, laptop: LaptopService },
  phone: { phone: PhoneCalls, laptop: LaptopCalls },
  kitchen: { phone: PhoneKitchen, laptop: LaptopKitchen },
  floor: { phone: PhoneFloor, laptop: LaptopFloor },
  menu: { phone: PhoneMenu, laptop: LaptopMenu },
  numbers: { phone: PhoneNumbers, laptop: LaptopNumbers },
};

/** Events that land something (an order, a booking): the success sound. */
const LANDED = ['aiOrder', 'aiBooking', 'aiGf', 'web', 'alt', 'youOrder', 'youBooking', 'webBooking'];

/**
 * Bodegón Lucero (vertical "restaurantes"): a Buenos Aires bodegón with salón,
 * delivery, take-away and reservations.
 * - laptop: the staff / owner side (collapsible sidebar): the live rush (service), the AI
 *   voice agent on three lines, the kitchen display, salón & reservations, the carta
 *   (stock), the night's numbers.
 * - phone alone: the same product as a mobile app (+ the customer's side, one tap away).
 * - phone next to the laptop: the CUSTOMER's phone (orders from the QR / web carta,
 *   follows the order live, books a table) — what they do lands on the laptop.
 * One story (28 s loop, see story.ts) drives both screens.
 */
export default function RestaurantDemo({ screen, active }: DemoProps) {
  const vertical = verticalById('restaurantes')!;
  const business = vertical.business ?? '';
  const ticketUsd = vertical.calculator.ticketUsd;
  const lostPerWeek = vertical.calculator.lostPerWeek;
  const x = useRestaurantText();
  const { t, fmt } = x;
  const { play } = useSound();

  const { store, paired, ref } = usePairedStore('restaurant', createRestaurantStore);
  // Scopes the chrome tweaks in restaurant.css (sidebar, tab bar, paper tokens) to this demo.
  const rootRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) el.dataset.demo = 'restaurant';
      ref(el);
    },
    [ref],
  );
  const snap = useStory(store, active);
  const view = useMemo(() => deriveRestaurant(snap.state, snap.t, snap.reduced), [snap.state, snap.t, snap.reduced]);

  const [tab, setTab] = useState<RestaurantTab>('service');
  const [focusLine, setFocusLine] = useState<LineId>(1);
  const [customer, setCustomer] = useState(false);
  const customerPhone = screen === 'phone' && paired;
  const announce = screen === 'laptop' || !paired;

  // Sound: an order / a booking landing (one instance per pair, only while visible).
  const lastLanded = [...view.events].reverse().find((e) => LANDED.includes(e.kind));
  const heard = useRef<string | null>(null);
  useEffect(() => {
    const id = lastLanded?.id ?? '';
    const first = heard.current === null;
    const changed = heard.current !== id;
    heard.current = id;
    if (first || !changed || !active || !announce || !lastLanded || lastLanded.at < 0) return;
    play('success');
  }, [lastLanded, active, announce, play]);
  // Sound: a new transcript line on the AI phone (soft), while the calls are on screen.
  const spoken = view.calls.reduce((n, c) => n + c.voice.lines.filter((l) => l.who !== 'tool').length, 0);
  const heardLines = useRef(spoken);
  const callsOnScreen = !customerPhone && (tab === 'phone' || tab === 'service');
  useEffect(() => {
    const more = spoken > heardLines.current;
    heardLines.current = spoken;
    if (more && active && announce && callsOnScreen && !snap.reduced) play('type', { volume: 0.5 });
  }, [spoken, active, announce, callsOnScreen, play, snap.reduced]);

  const aiOn = !isOffNow(snap.state.aiOff);
  const newTickets = view.board.filter((tk) => tk.stage === 'new').length;
  const laptop = screen === 'laptop';
  const nav: NavItem[] = [
    { id: 'service', label: t('nav.service'), icon: ConciergeBell, group: laptop ? t('nav.groupTonight') : undefined },
    { id: 'phone', label: t(laptop ? 'nav.phone' : 'nav.phoneShort'), icon: PhoneCall, badge: view.liveCount ? 'live' : undefined },
    { id: 'kitchen', label: t('nav.kitchen'), icon: ChefHat, badge: newTickets || undefined },
    { id: 'floor', label: t(laptop ? 'nav.floor' : 'nav.floorShort'), icon: LayoutGrid, group: laptop ? t('nav.groupRoom') : undefined },
    { id: 'menu', label: t('nav.menu'), icon: BookOpenText },
    { id: 'numbers', label: t('nav.numbers'), icon: ChartNoAxesColumn, group: laptop ? t('nav.groupBiz') : undefined },
  ];

  const ctx: RestaurantCtx = {
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
    ticketUsd,
    lostPerWeek,
    focusLine,
    go: (id, line) => {
      if (line) setFocusLine(line);
      if (id !== tab && active) play('select');
      setTab(id);
      setCustomer(false);
    },
    openCustomer: () => {
      setCustomer(true);
      if (active) play('open');
    },
  };

  const clock = fmt.time(view.clock);

  if (customerPhone) {
    return (
      <RestaurantProvider value={ctx}>
        <AppShell screen="phone" chrome="bare" theme={RESTAURANT_THEME} business={business} logo={<LuceroMark />} active={active} rootRef={rootRef} statusTime={clock}>
          <div className="rl rl-customer-root" data-screen="phone">
            <CustomerApp key={snap.loop} auto />
          </div>
        </AppShell>
      </RestaurantProvider>
    );
  }

  const View = VIEWS[tab][screen];
  const headerRight = laptop ? (
    <>
      {view.liveCount ? (
        <button type="button" className="rl-toplive" onClick={() => ctx.go('phone')}>
          <LineLamps />
          {t('top.live', { count: view.liveCount })}
        </button>
      ) : (
        <span className="rl-toppill" data-off={aiOn ? undefined : ''}>
          {aiOn ? t('top.aiOn') : t('top.aiOff')}
        </span>
      )}
      <span className="rl-topclock demo-mono">{clock}</span>
    </>
  ) : (
    <button type="button" className="rl-cxbtn" onClick={() => ctx.openCustomer()} aria-haspopup="dialog">
      <QrCode aria-hidden strokeWidth={1.8} />
      {t('top.customer')}
    </button>
  );

  return (
    <RestaurantProvider value={ctx}>
      <AppShell
        screen={screen}
        theme={RESTAURANT_THEME}
        business={business}
        logo={<LuceroMark />}
        nav={nav}
        current={tab}
        onNavigate={(id) => setTab(id as RestaurantTab)}
        title={
          laptop ? (
            <>
              <p className="rl-toptitle">{nav.find((n) => n.id === tab)?.label}</p>
              <p className="rl-topdate">{t('top.tonight', { day: x.day() })}</p>
            </>
          ) : undefined
        }
        headerRight={headerRight}
        sidebarFooter={<SidebarFooter on={aiOn} live={view.liveCount} />}
        active={active}
        rootRef={rootRef}
        statusTime={clock}
        overlay={
          screen === 'phone' ? (
            <div className="rl rl-customer-root" data-screen="phone">
              <CustomerApp
                onClose={() => {
                  setCustomer(false);
                  if (active) play('close');
                }}
              />
            </div>
          ) : undefined
        }
        overlayOpen={customer}
        overlayOrigin={['80%', '4%']}
      >
        <div className="rl" data-screen={screen}>
          {/* The service view already shows every change in place. */}
          {tab === 'service' ? null : <RestaurantToasts placement={laptop ? 'bottom-right' : 'top'} />}
          <div key={tab} className="demo-view">
            <View />
          </div>
          <Announcer />
        </div>
      </AppShell>
    </RestaurantProvider>
  );
}

function SidebarFooter({ on, live }: { on: boolean; live: number }) {
  const { t } = useRestaurantText();
  return (
    <div className="rl-sidefoot" data-off={on ? undefined : ''}>
      <span className="rl-sidefoot-icon" aria-hidden>
        <PhoneCall strokeWidth={1.7} />
      </span>
      <span className="min-w-0 leading-[1.25]">
        <span className="block truncate text-[0.74em] font-semibold">{t('side.aiTitle')}</span>
        <span className="block truncate text-[0.64em] text-[var(--demo-muted)]">{on ? t('side.aiOn', { count: live }) : t('side.aiOff')}</span>
      </span>
    </div>
  );
}
