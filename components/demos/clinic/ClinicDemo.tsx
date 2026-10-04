'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, ChartNoAxesColumn, Globe, House, MessageCircle, PhoneCall } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { verticalById } from '@/lib/content';
import { AppShell, contentToTop, revealInDemo, LiveDot, useBeatFocus, usePairedStore, useStory, type NavItem, type ShellLayout } from '../kit';
import type { DemoProps } from '../types';
import { BEAT_FOCUS, CLINIC_THEME, SCREEN_TABS, TODAY, type BeatId, type FocusSpot } from './data';
import { createClinicStore, deriveClinic, isOffNow } from './story';
import { ClinicProvider, type ClinicCtx, type ClinicTab } from './context';
import { useClinicScripts } from './scripts';
import { Announcer, AuroraMark, useClinicText } from './ui';
import { ClinicToasts, LaptopToday, PhoneToday } from './views/Today';
import { LaptopAgenda, PhoneAgenda } from './views/Agenda';
import { LaptopCalls, PhoneCalls } from './views/Calls';
import { LaptopWhatsApp, PhoneWhatsApp } from './views/WhatsApp';
import { LaptopSite, PatientPhone } from './views/Site';
import { LaptopRecovered, PhoneRecovered } from './views/Recovered';
import './clinic.css';

const VIEWS: Record<ClinicTab, Record<DemoProps['screen'], () => ReactNode>> = {
  today: { phone: PhoneToday, laptop: LaptopToday },
  agenda: { phone: PhoneAgenda, laptop: LaptopAgenda },
  calls: { phone: PhoneCalls, laptop: LaptopCalls },
  whatsapp: { phone: PhoneWhatsApp, laptop: LaptopWhatsApp },
  site: { phone: PhoneToday, laptop: LaptopSite },
  recovered: { phone: PhoneRecovered, laptop: LaptopRecovered },
};

/**
 * Shell variant: a front desk that should feel calm and airy — no heavy sidebar; soft pills
 * in a roomy top bar (desktop) and a floating rounded dock (phone), icons in tinted chips.
 */
const LAYOUT: ShellLayout = { nav: 'top', density: 'airy', icons: 'chip' };

/**
 * Clínica Aurora (vertical "clinicas", dental & aesthetics) — the kit's reference demo.
 * - laptop: the clinic's workspace: today, agenda (day/week, past and future dates, book a
 *   free slot), AI voice receptionist, WhatsApp automations, public site ("Reservar"), no-shows.
 * - phone alone: the same product as a mobile app (dock + the public site as an overlay).
 * - phone next to the laptop: the PATIENT's phone (books online, gets WhatsApp).
 * Nothing plays on its own: the visitor plays four beats from the SimBar (see story.ts) and
 * everything they do is local demo data.
 */
export default function ClinicDemo({ screen, active }: DemoProps) {
  const vertical = verticalById('clinicas')!;
  const business = vertical.business ?? '';
  const keyNumber = vertical.keyNumber?.value ?? 0;
  const ticketUsd = vertical.calculator.ticketUsd;
  const t = useTranslations('demoClinic');
  const { fmt } = useClinicText();
  const { play } = useSound();

  const { store, paired, ref } = usePairedStore('clinic', createClinicStore);
  const rootEl = useRef<HTMLDivElement | null>(null);
  const rootRef = useCallback(
    (el: HTMLDivElement | null) => {
      rootEl.current = el;
      ref(el);
    },
    [ref],
  );
  const snap = useStory(store, active);
  const scripts = useClinicScripts();
  const view = useMemo(
    () => deriveClinic(snap.state, snap.t, snap.reduced, scripts.martina, scripts.voiceTexts),
    [snap.state, snap.t, snap.reduced, scripts],
  );

  const [tab, setTab] = useState<ClinicTab>('today');
  const [agendaDay, setAgendaDay] = useState(TODAY);
  const [siteOpen, setSiteOpen] = useState(false);
  const patientPhone = screen === 'phone' && paired;
  const announce = screen === 'laptop' || !paired;
  /** Remounts the agenda when a beat opens it on today while it shows another day. */
  const [agendaN, setAgendaN] = useState(0);
  /** Where the last beat asked this view to scroll (`jump`: it also changed section). */
  const [reveal, setReveal] = useState<{ spot: FocusSpot; jump: boolean; n: number } | null>(null);
  const [patientFocus, setPatientFocus] = useState(0);

  // A beat takes this view to where it happens (data.ts BEAT_FOCUS), once, when the story enters it.
  useBeatFocus(store, snap, (id) => {
    const target = BEAT_FOCUS[id as BeatId];
    if (!target) return;
    if (patientPhone) {
      if (target.patient === 'site') setPatientFocus((n) => n + 1);
      return;
    }
    const f = target[screen];
    setSiteOpen(false);
    const reopen = f.tab === 'agenda' && tab === 'agenda' && agendaDay !== TODAY;
    if (f.tab === 'agenda') setAgendaDay(TODAY);
    if (reopen) setAgendaN((n) => n + 1);
    setReveal((r) => ({ spot: f.spot, jump: f.tab !== tab || reopen, n: (r?.n ?? 0) + 1 }));
    setTab(f.tab);
  });
  useLayoutEffect(() => {
    if (!reveal) return;
    const smooth = !reveal.jump && !snap.reduced;
    if (reveal.spot === 'top') contentToTop(rootEl.current, smooth);
    else revealInDemo(rootEl.current, `[data-focus~="${reveal.spot}"]`, { smooth });
    // Only when a beat asks (not on every story tick).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal]);

  const live = view.call.phase === 'ringing' || view.call.phase === 'live';
  const items: Record<ClinicTab, Omit<NavItem, 'id'>> = {
    today: { label: t('nav.today'), icon: House },
    agenda: { label: t('nav.agenda'), icon: CalendarDays, tour: screen === 'phone' ? 'agenda' : undefined },
    calls: { label: t(screen === 'phone' ? 'nav.callsShort' : 'nav.calls'), icon: PhoneCall, badge: live ? 'live' : undefined },
    whatsapp: { label: t('nav.whatsapp'), icon: MessageCircle, tour: 'reminders' },
    site: { label: t('nav.site'), icon: Globe, tour: 'booking' },
    recovered: { label: t(screen === 'phone' ? 'nav.recoveredShort' : 'nav.recovered'), icon: ChartNoAxesColumn },
  };
  const nav: NavItem[] = SCREEN_TABS[screen].map((id) => ({ id, ...items[id] }));

  const ctx: ClinicCtx = {
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
    ticketUsd,
    go: (id) => setTab(id),
    openSite: () => {
      setSiteOpen(true);
      if (active) play('open');
    },
    openAgenda: (day) => {
      setAgendaDay(day);
      setSiteOpen(false);
      setTab('agenda');
    },
    agendaDay,
  };

  const clock = fmt.time(view.clock);
  const sim = { store, label: (id: string) => t(`sim.${id}`), note: t('sim.note'), tour: 'sim', announce };

  if (patientPhone) {
    return (
      <ClinicProvider value={ctx}>
        <AppShell screen="phone" chrome="bare" theme={CLINIC_THEME} business={business} logo={<AuroraMark />} active={active} rootRef={rootRef} statusTime={clock} sim={sim}>
          <PatientPhone key={snap.loop} focus={patientFocus} />
        </AppShell>
      </ClinicProvider>
    );
  }

  const View = VIEWS[tab][screen];
  const aiOn = !isOffNow(snap.state.off.voice);
  const headerRight =
    screen === 'laptop' ? (
      <>
        {live ? (
          <button type="button" className="clinic-livecall" onClick={() => setTab('calls')}>
            <LiveDot color="var(--demo-accent-2)" />
            {view.call.phase === 'ringing' ? t('top.ringing') : t('top.liveCall', { time: fmt.duration(view.call.talkMs) })}
          </button>
        ) : (
          <button type="button" className="clinic-toppill" data-off={aiOn ? undefined : ''} onClick={() => setTab('calls')}>
            <span aria-hidden className="clinic-toppill-dot" />
            {t(aiOn ? 'top.ai' : 'top.aiOff')}
          </button>
        )}
        <span className="clinic-user" aria-hidden>
          <span className="clinic-user-av">RA</span>
        </span>
      </>
    ) : (
      <button type="button" className="clinic-sitebtn" onClick={ctx.openSite} aria-haspopup="dialog" data-tour="booking">
        <Globe aria-hidden strokeWidth={1.8} />
        {t('top.site')}
      </button>
    );

  return (
    <ClinicProvider value={ctx}>
      <AppShell
        screen={screen}
        theme={CLINIC_THEME}
        business={business}
        logo={<AuroraMark />}
        nav={nav}
        current={tab}
        onNavigate={(id) => {
          if (id === 'agenda') setAgendaDay(TODAY);
          setTab(id as ClinicTab);
        }}
        layout={LAYOUT}
        phoneNav="dock"
        headerRight={headerRight}
        active={active}
        rootRef={rootRef}
        statusTime={clock}
        sim={sim}
        overlay={
          screen === 'phone' ? (
            <PatientPhone
              key={snap.loop}
              onClose={() => {
                setSiteOpen(false);
                if (active) play('close');
              }}
            />
          ) : undefined
        }
        overlayOpen={siteOpen}
        overlayOrigin={['78%', '4%']}
      >
        <div className="clinic" data-screen={screen}>
          <ClinicToasts placement={screen === 'phone' ? 'top' : 'bottom-right'} />
          <div key={tab === 'agenda' ? `agenda:${agendaN}` : tab} className="demo-view">
            <View />
          </div>
          <Announcer />
        </div>
      </AppShell>
    </ClinicProvider>
  );
}

