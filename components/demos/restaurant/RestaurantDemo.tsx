'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BookOpenText, ChartNoAxesColumn, ChefHat, ConciergeBell, LayoutGrid, PhoneCall, QrCode } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { verticalById } from '@/lib/content';
import { AppShell, useBeatFocus, usePairedStore, useStory, type NavItem, type ShellLayout } from '../kit';
import type { DemoProps } from '../types';
import { BEAT_FOCUS, RESTAURANT_THEME, SCREEN_TABS, TODAY, type BeatId, type FocusSpot } from './data';
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
import { LaptopQr } from './views/Qr';
import { CustomerApp, type CustomerFocusRequest } from './views/Customer';
import { revealSpot } from './focus';
import './restaurant.css';

const VIEWS: Record<RestaurantTab, Record<DemoProps['screen'], () => ReactNode>> = {
  service: { phone: PhoneService, laptop: LaptopService },
  phone: { phone: PhoneCalls, laptop: LaptopCalls },
  kitchen: { phone: PhoneKitchen, laptop: LaptopKitchen },
  floor: { phone: PhoneFloor, laptop: LaptopFloor },
  menu: { phone: PhoneMenu, laptop: LaptopMenu },
  qr: { phone: PhoneService, laptop: LaptopQr },
  numbers: { phone: PhoneNumbers, laptop: LaptopNumbers },
};

/**
 * Shell variant: a service tool used mid-rush — a plain sidebar with its labels always visible
 * (narrower than the kit's default and not collapsible: restaurant.css), compact density, thin
 * icons; on the phone a bottom tab bar. Different from the clinic's airy top pills + dock.
 */
const LAYOUT: ShellLayout = { nav: 'sidebar', density: 'compact', icons: 'line' };

/**
 * Bodegón Lucero (vertical "restaurantes"): a Buenos Aires bodegón with salón,
 * delivery, take-away and reservations.
 * - laptop: the staff / owner side: tonight's service, the AI voice agent on three lines,
 *   the kitchen display (move tickets), salón & reservations (any day), the carta (stock),
 *   the QR / web carta as customers see it, the night's numbers.
 * - phone alone: the same product as a mobile app (+ the customer's side, one tap away).
 * - phone next to the laptop: the CUSTOMER's phone (QR / web carta, order, book a table) —
 *   what they do lands on the laptop.
 * Nothing plays on its own: the visitor plays four beats from the SimBar (see story.ts).
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
  const rootEl = useRef<HTMLDivElement | null>(null);
  const rootRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) el.dataset.demo = 'restaurant';
      rootEl.current = el;
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
  /** The day "Salón y reservas" opens on; `n` remounts it when a beat asks for a day. */
  const [floor, setFloor] = useState({ day: TODAY, n: 0 });
  /** Where the last beat asked this view to scroll (`jump`: it also changed section). */
  const [reveal, setReveal] = useState<{ spot: FocusSpot; jump: boolean; n: number } | null>(null);
  const [customerFocus, setCustomerFocus] = useState<CustomerFocusRequest>({ tab: 'order', n: 0 });

  // A beat takes this view to where it happens (data.ts BEAT_FOCUS), once, when the story enters it.
  useBeatFocus(store, snap, (id) => {
    const target = BEAT_FOCUS[id as BeatId];
    if (!target) return;
    if (customerPhone) {
      const c = target.customer;
      if (c !== 'stay') setCustomerFocus((f) => ({ tab: c, n: f.n + 1 }));
      return;
    }
    const f = target[screen];
    setCustomer(false);
    if (f.line) setFocusLine(f.line);
    if (f.day !== undefined) setFloor((d) => ({ day: f.day!, n: d.n + 1 }));
    setReveal((r) => ({ spot: f.spot, jump: f.tab !== tab || f.day !== undefined, n: (r?.n ?? 0) + 1 }));
    setTab(f.tab);
  });
  useLayoutEffect(() => {
    if (reveal) revealSpot(rootEl.current, reveal.spot, !reveal.jump && !snap.reduced);
    // Only when a beat asks (not on every story tick).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal]);

  const aiOn = !isOffNow(snap.state.aiOff);
  const newTickets = view.board.filter((tk) => tk.stage === 'new').length;
  const laptop = screen === 'laptop';
  const items: Record<RestaurantTab, Omit<NavItem, 'id'>> = {
    service: { label: t('nav.service'), icon: ConciergeBell },
    phone: { label: t(laptop ? 'nav.phone' : 'nav.phoneShort'), icon: PhoneCall, badge: view.liveCount ? 'live' : undefined, tour: 'voice' },
    kitchen: { label: t('nav.kitchen'), icon: ChefHat, badge: newTickets || undefined, tour: 'kitchen' },
    floor: { label: t(laptop ? 'nav.floor' : 'nav.floorShort'), icon: LayoutGrid, tour: 'floor' },
    qr: { label: t('nav.qr'), icon: QrCode, tour: 'order' },
    menu: { label: t('nav.menu'), icon: BookOpenText },
    numbers: { label: t('nav.numbers'), icon: ChartNoAxesColumn },
  };
  const nav: NavItem[] = SCREEN_TABS[screen].map((id) => ({ id, ...items[id] }));

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
      if (id === 'floor' && tab !== 'floor') setFloor((d) => ({ ...d, day: TODAY }));
      setTab(id);
      setCustomer(false);
    },
    openCustomer: () => {
      setCustomer(true);
      if (active) play('open');
    },
    beat: snap.beat ?? -1,
    playing: !!snap.playing,
    playBeat: (id) => {
      store.play?.(id);
      if (active) play('select');
    },
    floorDay: floor.day,
  };

  const clock = fmt.time(view.clock);
  const sim = { store, label: (id: string) => t(`sim.${id}`), note: t('sim.note'), tour: 'sim', announce };

  if (customerPhone) {
    return (
      <RestaurantProvider value={ctx}>
        <AppShell screen="phone" chrome="bare" theme={RESTAURANT_THEME} business={business} logo={<LuceroMark />} active={active} rootRef={rootRef} statusTime={clock} sim={sim}>
          <div className="rl rl-customer-root" data-screen="phone">
            <CustomerApp key={snap.loop} focus={customerFocus} />
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
        <button type="button" className="rl-toppill" data-off={aiOn ? undefined : ''} onClick={() => ctx.go('phone')}>
          {aiOn ? t('top.aiOn') : t('top.aiOff')}
        </button>
      )}
      <span className="rl-topclock demo-mono">{clock}</span>
    </>
  ) : (
    <button type="button" className="rl-cxbtn" onClick={() => ctx.openCustomer()} aria-haspopup="dialog" data-tour="order">
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
        onNavigate={(id) => {
          // The visitor's own navigation opens the reservations book on tonight again.
          if (id === 'floor') setFloor((d) => ({ ...d, day: TODAY }));
          setTab(id as RestaurantTab);
        }}
        layout={LAYOUT}
        phoneNav="tabs"
        title={
          laptop ? (
            <p className="rl-toptitle">
              <span>{nav.find((n) => n.id === tab)?.label}</span>
              <span className="rl-topdate">{t('top.tonight', { day: x.day() })}</span>
            </p>
          ) : undefined
        }
        headerRight={headerRight}
        active={active}
        rootRef={rootRef}
        statusTime={clock}
        sim={sim}
        overlay={
          screen === 'phone' ? (
            <div className="rl rl-customer-root" data-screen="phone">
              <CustomerApp
                key={snap.loop}
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
          <div key={tab === 'floor' ? `floor:${floor.n}` : tab} className="demo-view">
            <View />
          </div>
          <Announcer />
        </div>
      </AppShell>
    </RestaurantProvider>
  );
}
