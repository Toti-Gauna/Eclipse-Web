'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, ChartNoAxesColumn, Globe, House, MessageCircle, PhoneCall } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { verticalById } from '@/lib/content';
import { AppShell, LiveDot, usePairedStore, useStory, type NavItem } from '../kit';
import type { DemoProps } from '../types';
import { CLINIC_THEME, TODAY } from './data';
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
 * Clínica Aurora (vertical "clinicas", dental & aesthetics).
 * - laptop: the clinic's workspace (collapsible sidebar): today, agenda, AI voice
 *   receptionist, WhatsApp automations, public site, no-shows recovered.
 * - phone alone: the same product as a mobile app (5 tabs + the public site).
 * - phone next to the laptop: the PATIENT's phone (books online, gets WhatsApp).
 * One story (~31 s loop, see story.ts) drives both screens.
 */
export default function ClinicDemo({ screen, active }: DemoProps) {
  const vertical = verticalById('clinicas')!;
  const business = vertical.business ?? '';
  const keyNumber = vertical.keyNumber?.value ?? 0;
  const ticketUsd = vertical.calculator.ticketUsd;
  const t = useTranslations('demoClinic');
  const { fmt, day } = useClinicText();
  const { play } = useSound();

  const { store, paired, ref } = usePairedStore('clinic', createClinicStore);
  const snap = useStory(store, active);
  const scripts = useClinicScripts();
  const view = useMemo(
    () => deriveClinic(snap.state, snap.t, snap.reduced, scripts.martina, scripts.voiceTexts),
    [snap.state, snap.t, snap.reduced, scripts],
  );

  const [tab, setTab] = useState<ClinicTab>('today');
  const [siteOpen, setSiteOpen] = useState(false);
  const patientPhone = screen === 'phone' && paired;
  const announce = screen === 'laptop' || !paired;

  // Sound: a booking landing (one instance per pair, only while visible).
  const lastEvent = view.events[view.events.length - 1];
  const heard = useRef<string | null>(null);
  useEffect(() => {
    const id = lastEvent?.id ?? null;
    const first = heard.current === null;
    heard.current = id ?? '';
    if (first || !active || !announce || !lastEvent || lastEvent.at < 0) return;
    if (['online', 'waitlist', 'voice', 'you'].includes(lastEvent.kind)) play('success');
  }, [lastEvent, active, announce, play]);

  const live = view.call.phase === 'ringing' || view.call.phase === 'live';
  const nav: NavItem[] = [
    { id: 'today', label: t('nav.today'), icon: House },
    { id: 'agenda', label: t('nav.agenda'), icon: CalendarDays },
    { id: 'calls', label: t(screen === 'phone' ? 'nav.callsShort' : 'nav.calls'), icon: PhoneCall, badge: live ? 'live' : undefined, group: screen === 'laptop' ? t('nav.group') : undefined },
    { id: 'whatsapp', label: t('nav.whatsapp'), icon: MessageCircle },
    ...(screen === 'laptop' ? [{ id: 'site', label: t('nav.site'), icon: Globe }] : []),
    { id: 'recovered', label: t(screen === 'phone' ? 'nav.recoveredShort' : 'nav.recovered'), icon: ChartNoAxesColumn },
  ];

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
  };

  const clock = fmt.time(view.clock);

  if (patientPhone) {
    return (
      <ClinicProvider value={ctx}>
        <AppShell screen="phone" chrome="bare" theme={CLINIC_THEME} business={business} logo={<AuroraMark />} active={active} rootRef={ref} statusTime={clock}>
          <PatientPhone key={snap.loop} />
        </AppShell>
      </ClinicProvider>
    );
  }

  const View = VIEWS[tab][screen];
  const headerRight =
    screen === 'laptop' ? (
      <>
        {live ? (
          <button type="button" className="clinic-livecall" onClick={() => setTab('calls')}>
            <LiveDot color="var(--demo-accent-2)" />
            {view.call.phase === 'ringing' ? t('top.ringing') : t('top.liveCall', { time: fmt.duration(view.call.talkMs) })}
          </button>
        ) : (
          <span className="clinic-toppill">
            <LiveDot />
            {t('top.live')}
          </span>
        )}
        <span className="clinic-user" aria-hidden>
          <span className="clinic-user-av">RA</span>
        </span>
      </>
    ) : (
      <button type="button" className="clinic-sitebtn" onClick={ctx.openSite} aria-haspopup="dialog">
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
        onNavigate={(id) => setTab(id as ClinicTab)}
        title={
          screen === 'laptop' ? (
            <>
              <p className="clinic-toptitle">{nav.find((n) => n.id === tab)?.label}</p>
              <p className="clinic-topdate">{day(TODAY, 'long')}</p>
            </>
          ) : undefined
        }
        headerRight={headerRight}
        sidebarFooter={<SidebarFooter on={!isOffNow(snap.state.off.voice)} />}
        active={active}
        rootRef={ref}
        statusTime={clock}
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
          <div key={tab} className="demo-view">
            <View />
          </div>
          <Announcer />
        </div>
      </AppShell>
    </ClinicProvider>
  );
}

function SidebarFooter({ on }: { on: boolean }) {
  const t = useTranslations('demoClinic');
  return (
    <div className="clinic-sidefoot" data-off={on ? undefined : ''}>
      <span className="clinic-sidefoot-ai" aria-hidden>
        <AuroraMark />
      </span>
      <span className="min-w-0 leading-[1.25]">
        <span className="block truncate text-[0.74em] font-semibold">{t('side.aiTitle')}</span>
        <span className="block truncate text-[0.64em] text-[var(--demo-muted)]">{on ? t('side.aiBody') : t('side.aiOff')}</span>
      </span>
    </div>
  );
}
