'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, CalendarDays, Columns3, Globe, House, MessagesSquare, Send, Smartphone } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { verticalById } from '@/lib/content';
import { AppShell, contentToTop, revealInDemo, Avatar, Switch, useBeatFocus, usePairedStore, useStory, type NavItem, type ShellLayout } from '../kit';
import type { DemoProps } from '../types';
import { ADVISORS, BEAT_FOCUS, CHAT_SLOTS, LUMEN_THEME, TODAY, type EstateBeatId, type EstateSpot } from './data';
import { SPOTS } from './focus';
import { act, createEstateStore, deriveEstate } from './story';
import { EstateProvider, useEstate, type EstateCtx, type EstateTab } from './context';
import { Announcer, EstateToasts, LumenMark, useEstateText } from './ui';
import { LaptopToday, PhoneToday } from './views/Today';
import { LaptopInbox, PhoneInbox } from './views/Inbox';
import { LaptopPipeline, PhonePipeline } from './views/Pipeline';
import { LaptopVisits, PhoneVisits } from './views/Visits';
import { LaptopFollowups, PhoneFollowups } from './views/Followups';
import { LaptopListings, PhoneListings } from './views/Listings';
import { BuyerPhone, LaptopSite } from './views/Site';
import './real-estate.css';

const VIEWS: Record<EstateTab, Record<DemoProps['screen'], () => ReactNode>> = {
  today: { phone: PhoneToday, laptop: LaptopToday },
  inbox: { phone: PhoneInbox, laptop: LaptopInbox },
  pipeline: { phone: PhonePipeline, laptop: LaptopPipeline },
  visits: { phone: PhoneVisits, laptop: LaptopVisits },
  followups: { phone: PhoneFollowups, laptop: LaptopFollowups },
  listings: { phone: PhoneListings, laptop: LaptopListings },
  // On the phone "Sitio web" opens the buyer's view (overlay) instead of a tab.
  site: { phone: PhoneInbox, laptop: LaptopSite },
};
const ORDER: Record<DemoProps['screen'], EstateTab[]> = {
  laptop: ['today', 'inbox', 'pipeline', 'visits', 'followups', 'listings', 'site'],
  phone: ['inbox', 'pipeline', 'visits', 'today', 'followups', 'listings'],
};
const ICONS = { today: House, inbox: MessagesSquare, pipeline: Columns3, visits: CalendarDays, followups: Send, listings: Building2, site: Globe };
/** Guide hooks on the nav items (both screens). */
const TOUR: Partial<Record<EstateTab, string>> = { pipeline: 'pipeline', visits: 'visits', followups: 'followups', site: 'site' };

/**
 * Shell variant: an editorial back office — a full sidebar with labels only (no icons), thin
 * rules and square corners (desktop); on the phone the same sections as a row of text tabs
 * under the app bar, like a magazine's index.
 */
const LAYOUT: ShellLayout = { nav: 'sidebar', density: 'regular', icons: 'none' };

/** Office hours (weekdays 9–19): the top bar says who is answering. */
const officeOpen = (day: number, min: number) => day % 7 < 5 && min >= 540 && min < 1140;

/**
 * Lumen Propiedades (vertical "inmobiliarias"): an agency that sells homes.
 * - laptop: the agency's workspace: today's numbers, the inquiry inbox (transcript + lead file),
 *   CRM pipeline (drag cards or "Mover a…"), visits calendar (any day, book a free slot),
 *   WhatsApp follow-ups, listings and the public site (search → listing → book a visit; Lumi's chat).
 * - phone alone: the same product as an app (text tabs), opening on the conversation;
 *   "Comprador" opens the public site as a buyer sees it (the visitor's own search and chat).
 * - phone next to the laptop: Carolina's phone (the site + chat at 23:40, WhatsApp after the visit).
 * Nothing plays on its own: the visitor plays five beats from the SimBar (see story.ts).
 */
export default function RealEstateDemo({ screen, active }: DemoProps) {
  const vertical = verticalById('inmobiliarias')!;
  const business = vertical.business ?? '';
  const keyNumber = vertical.keyNumber?.value ?? 100;
  const keySuffix = vertical.keyNumber?.suffix ?? '%';
  const t = useTranslations('demoRealEstate');
  const x = useEstateText();
  const { play } = useSound();

  const { store, paired, ref } = usePairedStore('realEstate', createEstateStore);
  const snap = useStory(store, active);
  const view = useMemo(() => deriveEstate(snap.state, snap.t), [snap.state, snap.t]);

  const [tab, setTab] = useState<EstateTab>(screen === 'phone' ? 'inbox' : 'today');
  const [visitsDay, setVisitsDay] = useState(4);
  const [buyerOpen, setBuyerOpen] = useState(false);
  const buyerPhone = screen === 'phone' && paired;
  const announce = screen === 'laptop' || !paired;
  const root = useRef<HTMLDivElement | null>(null);
  const rootRef = useCallback(
    (el: HTMLDivElement | null) => {
      root.current = el;
      ref(el);
      el?.classList.add('lumen');
    },
    [ref],
  );

  // v3c: a beat takes this view where it happens (BEAT_FOCUS): the section and the element that
  // changes; Carolina's phone drops the visitor's detours. Only on beat entry (never at rest).
  const [focus, setFocus] = useState<{ n: number; spot: EstateSpot | null; top: boolean }>({ n: 0, spot: null, top: false });
  useBeatFocus(store, snap, (id) => {
    const target = BEAT_FOCUS[id as EstateBeatId]?.[view.botOff ? 'off' : 'on'];
    if (!target) return;
    if (!buyerPhone) {
      const to = target[screen];
      setBuyerOpen(false);
      if (to.spot === 'calendar') setVisitsDay(CHAT_SLOTS.fri.day);
      setTab(to.tab);
      setFocus((f) => ({ n: f.n + 1, spot: to.spot, top: to.tab !== tab }));
    } else setFocus((f) => ({ n: f.n + 1, spot: null, top: false }));
  });
  useEffect(() => {
    if (!focus.n || buyerPhone) return;
    const id = requestAnimationFrame(() => {
      if (focus.top) contentToTop(root.current);
      if (focus.spot) revealInDemo(root.current, SPOTS[focus.spot], { smooth: !snap.reduced && !focus.top });
    });
    return () => cancelAnimationFrame(id);
    // Only when a beat moved the view (not when the motion preference changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  const playing = !!snap.playing;
  const segFrom = snap.segment?.from ?? null;
  const ctx: EstateCtx = {
    screen,
    paired,
    store,
    state: snap.state,
    view,
    t: snap.t,
    loop: snap.loop,
    reduced: snap.reduced,
    active,
    playing,
    recent: (at, ms = 2400) => playing && segFrom !== null && at != null && at > segFrom && snap.t - at < ms,
    announce,
    business,
    keyNumber,
    keySuffix,
    go: (id) => setTab(id),
    focus,
    seeVisits: (day) => {
      setVisitsDay(day);
      setBuyerOpen(false);
      setTab('visits');
    },
    visitsDay,
    openBuyer: () => {
      setBuyerOpen(true);
      if (active) play('open');
    },
    toggleBot: () => {
      store.update(act.toggleBot());
      store.reset?.();
      if (active) play('toggle');
    },
  };

  const clock = x.clock(view.clock);
  const sim = {
    store,
    label: (id: string) => t(view.botOff ? `sim.off.${id}` : `sim.${id}`),
    note: t('sim.note'),
    tour: 'sim',
    announce,
  };

  if (buyerPhone) {
    return (
      <EstateProvider value={ctx}>
        <AppShell screen="phone" chrome="bare" theme={LUMEN_THEME} business={business} logo={<LumenMark />} active={active} rootRef={rootRef} statusTime={clock} sim={sim}>
          <BuyerPhone key={snap.loop} />
        </AppShell>
      </EstateProvider>
    );
  }

  const nav: NavItem[] = ORDER[screen].map((id) => ({
    id,
    label: t(`nav.${id}`),
    icon: ICONS[id],
    tour: TOUR[id],
    group: screen === 'laptop' ? (id === 'followups' ? t('nav.groupAuto') : id === 'listings' ? t('nav.groupShop') : undefined) : undefined,
  }));
  const open = officeOpen(view.clock.day, view.clock.min);
  const julia = ADVISORS[0];
  const View = VIEWS[tab][screen];

  const headerRight =
    screen === 'laptop' ? (
      <>
        <span className="re-toppill" data-tone={view.botOff && !open ? 'bad' : open ? 'neutral' : 'accent'}>
          <span aria-hidden className="re-toppill-dot" />
          {view.botOff && !open ? t('top.off') : open ? t('top.open') : t('top.closed')}
        </span>
        <Avatar initials={julia.initials} color={julia.color} ink={julia.ink} className="text-[0.72em]" />
      </>
    ) : (
      <button type="button" className="re-buyerbtn" onClick={ctx.openBuyer} aria-haspopup="dialog" aria-label={t('top.buyerLabel')} data-tour="site">
        <Smartphone aria-hidden strokeWidth={1.8} />
        {t('top.buyer')}
      </button>
    );

  return (
    <EstateProvider value={ctx}>
      <AppShell
        screen={screen}
        theme={LUMEN_THEME}
        business={business}
        logo={<LumenMark />}
        nav={nav}
        current={tab}
        onNavigate={(id) => {
          if (id === 'visits') setVisitsDay(TODAY + 1);
          setTab(id as EstateTab);
        }}
        title={
          screen === 'laptop' ? (
            <>
              <p className="re-toptitle">{t(`nav.${tab}`)}</p>
              <p className="re-topdate demo-num">{t('top.date', { date: x.day(view.clock.day, 'long'), time: clock })}</p>
            </>
          ) : undefined
        }
        headerRight={headerRight}
        sidebarFooter={<SidebarFooter />}
        layout={LAYOUT}
        phoneNav="top"
        active={active}
        rootRef={rootRef}
        statusTime={clock}
        sim={sim}
        overlay={
          screen === 'phone' ? (
            <BuyerPhone
              key={snap.loop}
              onClose={() => {
                setBuyerOpen(false);
                if (active) play('close');
              }}
            />
          ) : undefined
        }
        overlayOpen={buyerOpen}
        overlayOrigin={['80%', '4%']}
      >
        <div className="re" data-screen={screen} data-tab={tab}>
          <EstateToasts placement={screen === 'phone' ? 'top' : 'bottom-right'} />
          <div key={tab} className="demo-view re-view">
            <View />
          </div>
          <Announcer />
        </div>
      </AppShell>
    </EstateProvider>
  );
}

/** The assistant's switch, at the bottom of the sidebar. */
function SidebarFooter() {
  const t = useTranslations('demoRealEstate.bot');
  const { view, toggleBot } = useEstate();
  const id = useId();
  return (
    <div className="re-sidefoot" data-off={view.botOff ? '' : undefined}>
      <span className="re-sidefoot-mark" aria-hidden>
        <LumenMark />
      </span>
      <span className="min-w-0 flex-1 leading-[1.25]">
        <span id={id} className="block truncate text-[0.72em] font-semibold">
          {t('title')}
        </span>
        <span className="block text-[0.6em] text-[var(--demo-muted)]">{view.botOff ? t('offShort') : t('on')}</span>
      </span>
      <Switch checked={!view.botOff} onChange={toggleBot} labelledBy={id} />
    </div>
  );
}
