'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, CalendarDays, Columns3, Globe, House, MessagesSquare, Send, Smartphone } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { verticalById } from '@/lib/content';
import { AppShell, Avatar, LiveDot, Switch, usePairedStore, useStory, type NavItem } from '../kit';
import type { DemoProps } from '../types';
import { ADVISORS, LUMEN_THEME } from './data';
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
  phone: ['inbox', 'pipeline', 'visits', 'today', 'followups', 'listings', 'site'],
};
const ICONS = { today: House, inbox: MessagesSquare, pipeline: Columns3, visits: CalendarDays, followups: Send, listings: Building2, site: Globe };

/** Office hours (weekdays 9–19): the top bar says who is answering. */
const officeOpen = (day: number, min: number) => day % 7 < 5 && min >= 540 && min < 1140;

/**
 * Lumen Propiedades (vertical "inmobiliarias"): an agency that sells and rents homes.
 * - laptop: the agency's workspace (collapsible sidebar): today's numbers, the inquiry inbox
 *   (live transcript + lead file), CRM pipeline, visits calendar, WhatsApp follow-ups,
 *   listings and the public site.
 * - phone alone: the same product as an app, opening on the live conversation (the visitor
 *   plays the buyer); "Comprador" / "Sitio web" opens what the buyer sees.
 * - phone next to the laptop: the BUYER's phone (site + chat at 23:40, WhatsApp after the visit).
 * One story (28 s loop, see story.ts) drives both screens.
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
  const view = useMemo(() => deriveEstate(snap.state, snap.t, snap.reduced), [snap.state, snap.t, snap.reduced]);

  const [tab, setTab] = useState<EstateTab>(screen === 'phone' ? 'inbox' : 'today');
  const [buyerOpen, setBuyerOpen] = useState(false);
  const buyerPhone = screen === 'phone' && paired;
  const announce = screen === 'laptop' || !paired;
  const rootRef = useCallback(
    (el: HTMLDivElement | null) => {
      ref(el);
      el?.classList.add('lumen');
    },
    [ref],
  );

  // Sound (one instance per pair, only while visible): a soft tick per message, a chime when a visit or a reservation lands.
  const messages = view.chat.items.length + (view.follow?.items.length ?? 0);
  const lastEvent = view.events[view.events.length - 1];
  const heard = useRef<{ messages: number; event: string } | null>(null);
  useEffect(() => {
    const prev = heard.current;
    heard.current = { messages, event: lastEvent?.id ?? '' };
    if (!prev || !active || !announce || snap.reduced) return;
    if (lastEvent && lastEvent.id !== prev.event && lastEvent.at >= 0 && (lastEvent.kind === 'booked' || lastEvent.kind === 'reserved')) play('success');
    else if (messages > prev.messages) play('type');
  }, [messages, lastEvent, active, announce, snap.reduced, play]);

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
    announce,
    business,
    keyNumber,
    keySuffix,
    go: (id) => setTab(id),
    openBuyer: () => {
      setBuyerOpen(true);
      if (active) play('open');
    },
    toggleBot: () => {
      store.update(act.toggleBot());
      store.restart();
      if (active) play('toggle');
    },
  };

  const clock = x.clock(view.clock);

  if (buyerPhone) {
    return (
      <EstateProvider value={ctx}>
        <AppShell screen="phone" chrome="bare" theme={LUMEN_THEME} business={business} logo={<LumenMark />} active={active} rootRef={rootRef} statusTime={clock}>
          <BuyerPhone key={snap.loop} />
        </AppShell>
      </EstateProvider>
    );
  }

  const live = view.t >= view.inquiryAt && !view.chat.done;
  const nav: NavItem[] = ORDER[screen].map((id) => ({
    id,
    label: t(`nav.${id}`),
    icon: ICONS[id],
    badge: id === 'inbox' && live ? 'live' : undefined,
    group: screen === 'laptop' ? (id === 'followups' ? t('nav.groupAuto') : id === 'listings' ? t('nav.groupShop') : undefined) : undefined,
  }));
  const open = officeOpen(view.clock.day, view.clock.min);
  const julia = ADVISORS[0];
  const View = VIEWS[tab][screen];

  const headerRight =
    screen === 'laptop' ? (
      <>
        <span className="re-toppill" data-tone={view.botOff && !open ? 'bad' : open ? 'neutral' : 'accent'}>
          <LiveDot color={view.botOff && !open ? 'var(--demo-bad)' : 'var(--demo-accent)'} />
          {view.botOff && !open ? t('top.off') : open ? t('top.open') : t('top.closed')}
        </span>
        <Avatar initials={julia.initials} color={julia.color} ink={julia.ink} className="text-[0.72em]" />
      </>
    ) : (
      <button type="button" className="re-buyerbtn" onClick={ctx.openBuyer} aria-haspopup="dialog" aria-label={t('top.buyerLabel')}>
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
          if (screen === 'phone' && id === 'site') ctx.openBuyer();
          else setTab(id as EstateTab);
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
        active={active}
        rootRef={rootRef}
        statusTime={clock}
        phoneNav="tabs"
        maxTabs={5}
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
