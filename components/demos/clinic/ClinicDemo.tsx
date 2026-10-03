'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, ChartColumn, MessageCircle } from 'lucide-react';
import { useReducedMotion } from '@/components/motion/useReducedMotion';
import { verticalById } from '@/lib/content';
import { DemoShell, useDemoClock, type DemoTab } from '../kit';
import type { DemoProps } from '../types';
import { ACCENT, MAX_TICK, TICK_MS, TODAY } from './data';
import { createClinicStore, deriveAgenda, deriveChat, deriveKpis, pairedPhoneOf, pairedStoreFor, type ClinicStore } from './sim';
import { ClinicProvider, useFmt, type ClinicCtx } from './context';
import { AuroraLogo, LiveBadge, WantThis } from './ui';
import { Announcer } from './activity';
import { LaptopAgenda, PhoneAgenda } from './Agenda';
import { LaptopReminders, PhoneReminders } from './Reminders';
import { LaptopAbsences, PhoneAbsences } from './Absences';
import './clinic.css';

type TabId = 'agenda' | 'reminders' | 'absences';

const VIEWS: Record<TabId, Record<DemoProps['screen'], () => React.ReactNode>> = {
  agenda: { phone: PhoneAgenda, laptop: LaptopAgenda },
  reminders: { phone: PhoneReminders, laptop: LaptopReminders },
  absences: { phone: PhoneAbsences, laptop: LaptopAbsences },
};

function LaptopTopBar() {
  const t = useTranslations('demoClinic');
  const fmt = useFmt();
  return (
    <>
      <div className="mr-auto flex min-w-0 items-center gap-[0.7em]">
        <span className="text-[0.85em] font-semibold">{t('reception')}</span>
        <span aria-hidden className="h-[1em] w-px bg-[var(--demo-line)]" />
        <span className="truncate text-[0.8em] text-[var(--demo-muted)]">{fmt.long(TODAY)}</span>
        <LiveBadge />
      </div>
      <WantThis variant="header" />
    </>
  );
}

/**
 * Clínica Aurora (vertical "clinicas"): live appointment book, WhatsApp
 * reminders that free and refill slots, and a no-show dashboard.
 */
export default function ClinicDemo({ screen, active }: DemoProps) {
  const t = useTranslations('demoClinic');
  const vertical = verticalById('clinicas')!;
  const business = vertical.business ?? '';
  const keyNumber = vertical.keyNumber?.value ?? 0;
  const ticketUsd = vertical.calculator.ticketUsd;
  const reduced = useReducedMotion();

  // Own store until we find the laptop/phone sibling of the same showcase.
  const [ownStore] = useState(() => createClinicStore(false));
  const [sharedStore, setSharedStore] = useState<ClinicStore | null>(null);
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
  const agenda = useMemo(() => deriveAgenda(state, chat), [state, chat]);
  const kpis = useMemo(() => deriveKpis(agenda, keyNumber), [agenda, keyNumber]);
  const paired = store.paired;

  const ctx: ClinicCtx = {
    screen,
    store,
    state,
    chat,
    agenda,
    kpis,
    business,
    keyNumber,
    ticketUsd,
    reduced,
    announce: screen === 'laptop' || !paired,
    paired,
  };

  // The showcase's phone covers the laptop's right edge: measure how much (as a
  // fraction of the screen, so the hero's scale animations don't matter) and keep
  // the dashboards clear of it through --clinic-safe.
  useLayoutEffect(() => {
    const el = root.current;
    const screenEl = el?.closest('.device-screen');
    const phone = el ? pairedPhoneOf(el) : null;
    if (screen !== 'laptop' || !paired || !el || !screenEl || !phone) return;
    const measure = () => {
      const s = screenEl.getBoundingClientRect();
      const p = phone.getBoundingClientRect();
      if (!s.width) return;
      const fontSize = parseFloat(getComputedStyle(el).fontSize) || 1;
      const covered = Math.max(0, (s.right - p.left) / s.width) * screenEl.clientWidth;
      const safe = `${(covered / fontSize + 0.8).toFixed(2)}em`;
      const phoneTop = (((p.top - s.top) / s.height) * screenEl.clientHeight) / fontSize;
      el.style.setProperty('--clinic-safe', safe);
      // Small showcases: the phone also rises over the title row.
      el.style.setProperty('--clinic-safe-top', phoneTop < 9 ? safe : '0em');
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(screenEl);
    ro.observe(phone);
    return () => ro.disconnect();
  }, [screen, paired]);

  // Next to the laptop, the phone opens on the patient's WhatsApp.
  const [tab, setTab] = useState<TabId | null>(null);
  const current: TabId = tab ?? (paired && screen === 'phone' ? 'reminders' : 'agenda');
  const tabs: DemoTab[] = [
    { id: 'agenda', label: t('tabs.agenda'), icon: CalendarDays },
    { id: 'reminders', label: t('tabs.reminders'), icon: MessageCircle },
    { id: 'absences', label: t('tabs.absences'), icon: ChartColumn },
  ];
  const View = VIEWS[current][screen];

  return (
    <DemoShell
      screen={screen}
      business={business}
      accent={ACCENT}
      logo={<AuroraLogo />}
      tabs={tabs}
      activeTab={current}
      onTab={(id) => {
        setTab(id as TabId);
        root.current?.closest('.demo-scroll')?.scrollTo({ top: 0 });
      }}
      headerRight={screen === 'laptop' ? <LaptopTopBar /> : <LiveBadge />}
    >
      <ClinicProvider value={ctx}>
        <div ref={attach} className="clinic flex min-h-full flex-col">
          <div key={current} className="clinic-view pt-[0.25em]">
            <View />
          </div>
          {screen === 'phone' && !paired ? (
            <div className="sticky bottom-[-1em] z-20 -mx-[1em] mt-auto bg-gradient-to-t from-[var(--demo-bg)] from-55% to-transparent px-[1em] pb-[0.8em] pt-[1.6em]">
              <WantThis variant="floating" />
            </div>
          ) : null}
          <Announcer />
        </div>
      </ClinicProvider>
    </DemoShell>
  );
}
