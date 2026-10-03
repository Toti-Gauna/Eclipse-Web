'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Inbox, MessageCircle, UserCheck } from 'lucide-react';
import { useReducedMotion } from '@/components/motion/useReducedMotion';
import { verticalById } from '@/lib/content';
import { DemoShell, useDemoClock, type DemoTab } from '../kit';
import type { DemoProps } from '../types';
import { ACCENT, MAX_TICK, NOW_MIN, TICK_MS, VISIT_SLOTS, type ListingId } from './data';
import { createEstateStore, deriveChat, deriveKpis, deriveLiveLead, pairedPhoneOf, pairedStoreFor, pastLeadViews, type EstateStore } from './sim';
import { EstateProvider, useEstate, useFmt, type EstateCtx } from './context';
import { LiveBadge, LumenLogo, WantThis } from './ui';
import { LaptopListings, PhoneListings } from './Listings';
import { PhoneChat } from './Chat';
import { LaptopInbox } from './Inbox';
import { LaptopLeads, PhoneLeads } from './Leads';
import './real-estate.css';

type TabId = 'inbox' | 'listings' | 'leads';

const VIEWS: Record<TabId, Record<DemoProps['screen'], () => React.ReactNode>> = {
  inbox: { phone: PhoneChat, laptop: LaptopInbox },
  listings: { phone: PhoneListings, laptop: LaptopListings },
  leads: { phone: PhoneLeads, laptop: LaptopLeads },
};

function LaptopTopBar() {
  const t = useTranslations('demoRealEstate');
  const fmt = useFmt();
  return (
    <>
      <div className="mr-auto flex min-w-0 items-center gap-[0.7em]">
        <span className="text-[0.85em] font-semibold">{t('office')}</span>
        <span aria-hidden className="h-[1em] w-px bg-[var(--demo-line)]" />
        <span className="truncate text-[0.8em] text-[var(--demo-muted)]">
          {fmt.long(0)} · {fmt.time(NOW_MIN)} · {t('closed')}
        </span>
        <LiveBadge />
      </div>
      <WantThis variant="header" />
    </>
  );
}

/**
 * One polite announcement per laptop+phone pair: the qualified lead reaching the
 * CRM. Each chat message is already read by the chat's own log, so nothing else.
 */
function Announcer() {
  const t = useTranslations('demoRealEstate');
  const fmt = useFmt();
  const { chat, state, announce, live } = useEstate();
  if (!announce) return null;
  const fresh = chat.doneAt !== null && state.tick - chat.doneAt <= 1 && live && chat.slot !== null;
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {fresh ? t('announce.lead', { name: t('people.live'), score: live.score, slot: fmt.slotLong(VISIT_SLOTS[chat.slot!]) }) : ''}
    </p>
  );
}

/**
 * Lumen Propiedades (vertical "inmobiliarias"): listings with working filters,
 * an AI agent answering a scripted after-hours inquiry in seconds, and the
 * qualified lead it leaves in the agency's CRM.
 */
export default function RealEstateDemo({ screen, active }: DemoProps) {
  const t = useTranslations('demoRealEstate');
  const vertical = verticalById('inmobiliarias')!;
  const business = vertical.business ?? '';
  const keyNumber = vertical.keyNumber?.value ?? 100;
  const keySuffix = vertical.keyNumber?.suffix ?? '%';
  const reduced = useReducedMotion();

  // Own store until we find the laptop/phone sibling of the same showcase.
  const [ownStore] = useState(() => createEstateStore(false));
  const [sharedStore, setSharedStore] = useState<EstateStore | null>(null);
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

  const chat = useMemo(() => deriveChat(state, reduced), [state, reduced]);
  const live = useMemo(() => deriveLiveLead(chat), [chat]);
  const leads = useMemo(() => (live ? [live, ...pastLeadViews()] : pastLeadViews()), [live]);
  const kpis = useMemo(() => deriveKpis(chat), [chat]);
  const paired = store.paired;

  // Next to the laptop, the phone opens on the customer's chat. Alone, too:
  // the conversation is what shows the key number ("answers in < 1 min").
  const [tab, setTab] = useState<TabId>('inbox');
  const [focus, setFocus] = useState<ListingId | null>(null);
  const scrollTop = () => root.current?.closest('.demo-scroll')?.scrollTo({ top: 0 });
  const openTab = (id: TabId) => {
    setFocus(null);
    setTab(id);
    scrollTop();
  };

  const ctx: EstateCtx = {
    screen,
    store,
    state,
    chat,
    live,
    leads,
    kpis,
    business,
    keyNumber,
    keySuffix,
    reduced,
    announce: screen === 'laptop' || !paired,
    paired,
    focus,
    openListing: (id) => {
      setFocus(id);
      setTab('listings');
    },
    openTab,
  };

  // The showcase's phone covers the laptop's right edge: measure how much, as a
  // fraction of the screen (so neither the hero's scale animations nor the font
  // size matter), and keep the dashboards clear of it through --re-safe, which
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
      el.style.setProperty('--re-safe', safe);
      // Small showcases: the phone also rises over the title row (top ~20% of the screen).
      el.style.setProperty('--re-safe-top', (p.top - s.top) / s.height < 0.2 ? safe : '0em');
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(screenEl);
    ro.observe(phone);
    return () => ro.disconnect();
  }, [screen, paired]);

  const tabs: DemoTab[] = [
    { id: 'inbox', label: t(screen === 'phone' ? 'tabs.chat' : 'tabs.inbox'), icon: screen === 'phone' ? MessageCircle : Inbox },
    { id: 'listings', label: t('tabs.listings'), icon: Building2 },
    { id: 'leads', label: t('tabs.leads'), icon: UserCheck },
  ];
  const View = VIEWS[tab][screen];

  return (
    <DemoShell
      screen={screen}
      business={business}
      accent={ACCENT}
      logo={<LumenLogo />}
      tabs={tabs}
      activeTab={tab}
      onTab={(id) => openTab(id as TabId)}
      headerRight={screen === 'laptop' ? <LaptopTopBar /> : <LiveBadge />}
    >
      <EstateProvider value={ctx}>
        <div ref={attach} className="re flex min-h-full flex-col" data-paused={active ? undefined : ''}>
          <div key={tab} className="re-view pt-[0.25em]">
            <View />
          </div>
          {screen === 'phone' && !paired ? (
            <div className="sticky bottom-[-1em] z-20 -mx-[1em] mt-auto bg-gradient-to-t from-[var(--demo-bg)] from-55% to-transparent px-[1em] pb-[0.8em] pt-[1.6em]">
              <WantThis variant="floating" />
            </div>
          ) : null}
          <Announcer />
        </div>
      </EstateProvider>
    </DemoShell>
  );
}
