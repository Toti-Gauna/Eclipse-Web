'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, CalendarDays, Check, Clock4, Flower2, MapPin, MessageCircle, MessageCircleMore, Smile, Sun, X, ScanFace, type LucideIcon } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { BrowserFrame, Button, ChatPeek, ChatWidget, DemoBadge, Kpi, LandingPreview, PushBanner, SiteSection, runChat } from '../../kit';
import { PROS, SITE_DAYS, SITE_TREATMENTS, SITE_URL, STORY, TODAY, TREATMENTS, proFor, type ProId, type TreatmentId } from '../data';
import { act, freeTimes } from '../story';
import { useClinic } from '../context';
import { useClinicScripts } from '../scripts';
import { AuroraMark, ProAvatar, useClinicText, ViewHead } from '../ui';

const ICONS: Record<string, LucideIcon> = { cleaning: Smile, facial: Flower2, orthoConsult: ScanFace, whitening: Sun };

interface Pick {
  treatment: TreatmentId | null;
  day: number | null;
  start: number | null;
  booked: boolean;
}
const EMPTY: Pick = { treatment: null, day: null, start: null, booked: false };

/** Camila's booking, replayed on the patient phone while the "online" beat plays. */
function autoPick(t: number): Pick & { pressing: boolean; tap: string | null } {
  const s = STORY.site;
  const c = STORY.camila;
  const tapAt = (at: number) => t >= at && t < at + 650;
  return {
    treatment: t >= s.pick ? c.treatment : null,
    day: t >= s.day ? TODAY : null,
    start: t >= s.time ? c.start : null,
    booked: t >= s.booked,
    pressing: t >= s.confirm && t < s.booked,
    tap: tapAt(s.pick) ? 'treatment' : tapAt(s.day) ? 'day' : tapAt(s.time) ? 'time' : tapAt(s.confirm) ? 'confirm' : null,
  };
}

/**
 * Online booking ("Agendar"): treatment → day → time → book. Local demo data only: the booking
 * lands in the clinic's agenda (any day) and the WhatsApp confirmation shows on the patient side.
 * `auto` replays Camila's taps while the "online" beat plays, until the visitor touches it.
 */
function BookingWidget({ auto, compact = false, onSeeAgenda }: { auto: boolean; compact?: boolean; onSeeAgenda?: (day: number) => void }) {
  const t = useTranslations('demoClinic.site.booking');
  const { view, state, store, active } = useClinic();
  const { fmt, treatment, day, pro } = useClinicText();
  const { play } = useSound();
  const [local, setLocal] = useState<Pick>(EMPTY);
  const a = auto ? autoPick(view.t) : null;
  const s: Pick = a ?? local;

  const change = (next: Partial<Pick>) => {
    if (a) {
      store.update(act.touchSite());
      setLocal({ treatment: a.treatment, day: a.day, start: a.start, booked: false, ...next });
    } else setLocal((l) => ({ ...l, ...next }));
    if (active) play('select');
  };

  const proId: ProId | null = s.treatment ? proFor(s.treatment) : null;
  const minutes = s.treatment ? TREATMENTS[s.treatment].minutes : 30;
  const times = (() => {
    if (s.day === null || !proId) return [];
    const out = freeTimes(s.day, proId, minutes, state, view);
    // While Camila is booking, her time is still free.
    if (a && a.start !== null && !out.includes(a.start)) out.unshift(a.start);
    return out.slice(0, 4);
  })();

  if (s.booked && s.treatment && s.day !== null && s.start !== null && proId) {
    const bookedDay = s.day;
    return (
      <div className="clinic-booking" data-compact={compact ? '' : undefined} data-state="booked" role="status">
        <span className="clinic-booking-check" aria-hidden>
          <Check strokeWidth={2.4} />
        </span>
        <p className="clinic-booking-title demo-display">{a ? t('bookedCamila', { name: 'Camila' }) : t('booked')}</p>
        <p className="text-[0.76em] leading-[1.4]">
          {day(s.day)} · {fmt.time(s.start)} · {treatment(s.treatment)}
          <br />
          {pro(proId)}
        </p>
        <p className="clinic-booking-wa">
          <MessageCircle aria-hidden strokeWidth={1.9} />
          {t('sentWhatsApp')}
        </p>
        <div className="flex flex-wrap justify-center gap-[0.4em]">
          {onSeeAgenda && !a ? (
            <Button variant="secondary" icon={CalendarDays} onClick={() => onSeeAgenda(bookedDay)}>
              {t('seeAgenda')}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            onClick={() => {
              if (a) store.update(act.touchSite());
              setLocal(EMPTY);
            }}
          >
            {t('again')}
          </Button>
        </div>
      </div>
    );
  }

  const tap = (id: string) => (a?.tap === id ? 'clinic-tap' : '');
  return (
    <div className="clinic-booking" data-compact={compact ? '' : undefined} data-tour="booking">
      <p className="clinic-booking-title demo-display">{t('title')}</p>
      <fieldset className="clinic-booking-step">
        <legend>{t('treatment')}</legend>
        <div className="clinic-booking-options">
          {SITE_TREATMENTS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={s.treatment === id}
              onClick={() => change({ treatment: id, start: null })}
              className={`clinic-chip ${s.treatment === id ? tap('treatment') : ''}`}
            >
              {treatment(id)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="clinic-booking-step" disabled={!s.treatment}>
        <legend>{t('day')}</legend>
        <div className="clinic-booking-options">
          {SITE_DAYS.map((d) => (
            <button key={d} type="button" aria-pressed={s.day === d} onClick={() => change({ day: d, start: null })} className={`clinic-chip ${s.day === d ? tap('day') : ''}`}>
              {d === TODAY ? t('today') : day(d)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="clinic-booking-step" disabled={s.day === null}>
        <legend>{t('time')}</legend>
        <div className="clinic-booking-options">
          {s.day !== null && !times.length ? <span className="text-[0.7em] text-[var(--demo-muted)]">{t('none')}</span> : null}
          {s.day === null ? <span className="text-[0.7em] text-[var(--demo-muted)]">{t('pickDay')}</span> : null}
          {times.map((m) => (
            <button key={m} type="button" aria-pressed={s.start === m} onClick={() => change({ start: m })} className={`clinic-chip demo-num ${s.start === m ? tap('time') : ''}`}>
              {fmt.time(m)}
            </button>
          ))}
        </div>
      </fieldset>
      <Button
        disabled={!s.treatment || s.day === null || s.start === null}
        className={`clinic-booking-go ${a?.pressing ? 'clinic-pressing' : ''} ${a?.tap === 'confirm' ? 'clinic-tap' : ''}`}
        onClick={() => {
          if (!s.treatment || s.day === null || s.start === null || !proId) return;
          store.update(act.siteBooked({ pro: proId, start: s.start, treatment: s.treatment, day: s.day }));
          setLocal({ ...s, booked: true });
          if (active) play('success');
        }}
      >
        {t('confirm')}
      </Button>
      <p className="clinic-booking-note">{t('note')}</p>
    </div>
  );
}

/** The site's chatbot (FAQ → offers a slot). Opened by the visitor, it answers at once. `peek`: collapsed until opened. */
function SiteChat({ onClose, peek = false, className = '' }: { onClose?: () => void; peek?: boolean; className?: string }) {
  const t = useTranslations('demoClinic.site.chat');
  const { view, state, store, business, active, announce } = useClinic();
  const { faq } = useClinicScripts();
  const { play } = useSound();
  const [open, setOpen] = useState(!peek);
  const run = runChat(faq, state.faqStart === null ? 0 : view.t - state.faqStart, state.faqPicks, { instant: true });
  const pick = (step: string, reply: string) => {
    store.update(act.pickFaq(step, reply));
    if (active) play('select');
  };
  if (!open) {
    return (
      <ChatPeek
        run={run}
        title={t('title')}
        avatar={<MessageCircleMore strokeWidth={1.8} />}
        onPick={pick}
        onOpen={() => {
          setOpen(true);
          if (active) play('open');
        }}
        openLabel={t('expand')}
        side="left"
        className={className}
      />
    );
  }
  const close = onClose ?? (peek ? () => setOpen(false) : undefined);
  return (
    <div className={`clinic-sitechat ${className}`}>
      <ChatWidget
        variant="widget"
        run={run}
        title={t('title')}
        subtitle={t('subtitle')}
        avatar={<AuroraMark />}
        label={t('label', { business })}
        announce={announce}
        onPick={pick}
        composer={t('composer')}
        className="h-full"
      />
      {close ? (
        <button type="button" className="clinic-sitechat-close" aria-label={t('close')} onClick={close}>
          <X aria-hidden strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}

/** The public site of the clinic (desktop or mobile). */
function ClinicSite({ compact, auto, onSeeAgenda }: { compact: boolean; auto: boolean; onSeeAgenda?: (day: number) => void }) {
  const t = useTranslations('demoClinic.site');
  const tc = useTranslations('demoClinic');
  const { business } = useClinic();
  const { treatment, pro } = useClinicText();
  return (
    <LandingPreview
      compact={compact}
      className="clinic-site"
      brand={
        <>
          <span className="clinic-site-mark" aria-hidden>
            <AuroraMark />
          </span>
          <span className="truncate">{business}</span>
          <DemoBadge />
        </>
      }
      links={[t('nav.treatments'), t('nav.team'), t('nav.visit')]}
      cta={
        compact ? undefined : (
          <button
            type="button"
            className="demo-btn"
            data-variant="primary"
            onClick={(e) => e.currentTarget.closest('.demo-site')?.querySelector<HTMLElement>('.clinic-booking button')?.focus({ preventScroll: true })}
          >
            {t('nav.book')}
          </button>
        )
      }
      hero={{
        kicker: t('kicker'),
        title: t.rich('title', { em: (c) => <em>{c}</em> }),
        body: t('body'),
        media: compact ? undefined : <BookingWidget auto={false} onSeeAgenda={onSeeAgenda} />,
      }}
    >
      {compact ? (
        <div className="px-[1.1em] pb-[1.2em]">
          <BookingWidget auto={auto} compact onSeeAgenda={onSeeAgenda} />
        </div>
      ) : null}
      <SiteSection kicker={t('treatmentsKicker')} title={t('treatmentsTitle')}>
        <ul className="clinic-site-grid">
          {SITE_TREATMENTS.map((id) => {
            const Icon = ICONS[id];
            return (
              <li key={id} className="clinic-site-card">
                <Icon aria-hidden strokeWidth={1.5} />
                <span className="block text-[0.82em] font-semibold">{treatment(id)}</span>
                <span className="block text-[0.68em] text-[var(--demo-muted)]">{t('minutes', { n: TREATMENTS[id].minutes })}</span>
              </li>
            );
          })}
        </ul>
      </SiteSection>
      <SiteSection kicker={t('teamKicker')} title={t('teamTitle')}>
        <ul className="clinic-site-team">
          {PROS.map((p) => (
            <li key={p.id}>
              <ProAvatar pro={p.id} className="text-[0.95em]" />
              <span className="min-w-0 leading-[1.25]">
                <span className="block truncate text-[0.8em] font-semibold">{pro(p.id)}</span>
                <span className="block truncate text-[0.66em] text-[var(--demo-muted)]">{tc(`specialties.${p.specialty}`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </SiteSection>
      <SiteSection kicker={t('visitKicker')} title={t('visitTitle')}>
        <p className="clinic-site-line">
          <MapPin aria-hidden strokeWidth={1.6} />
          {t('address')}
        </p>
        <p className="clinic-site-line">
          <Clock4 aria-hidden strokeWidth={1.6} />
          {t('hours')}
        </p>
      </SiteSection>
    </LandingPreview>
  );
}

/**
 * What a patient sees on their phone: the clinic's site (book online) → the WhatsApp
 * confirmation. Next to the laptop it replays Camila's booking while the "online" beat
 * plays; opened from the phone app (`onClose`), the visitor books for themselves.
 */
export function PatientPhone({ onClose }: { onClose?: () => void }) {
  const t = useTranslations('demoClinic');
  const { view, state, store, paired, business, active, reduced, openAgenda } = useClinic();
  const { fmt, treatment, pro, day } = useClinicText();
  const scripts = useClinicScripts();
  const { play } = useSound();
  const auto = paired && !onClose && !state.siteManual;
  const [screenOverride, setScreen] = useState<'site' | 'whatsapp' | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const S = STORY.site;
  const c = STORY.camila;
  const camila = auto && view.t >= S.push;
  const thread = camila
    ? { at: S.push, name: t('firstNames.camila'), day: TODAY, start: c.start, treatment: c.treatment as TreatmentId, pro: c.pro as ProId }
    : !auto && state.patientThread
      ? { ...state.patientThread, name: null }
      : null;
  // Camila's phone opens her confirmation inside the beat; the visitor's thread waits for a tap.
  const screen = screenOverride ?? (camila && view.t >= S.open ? 'whatsapp' : 'site');
  const run = thread
    ? runChat(scripts.patient(thread), view.t - thread.at, state.patientPicks, camila ? { instant: reduced, instantAfterPick: true } : { instant: true })
    : null;

  // The notification: Camila's shows inside the beat; the visitor's for a few seconds after booking.
  const [pushFor, setPushFor] = useState<number | null>(null);
  const ownAt = !auto ? (state.patientThread?.at ?? null) : null;
  const seenAt = useRef(ownAt);
  useEffect(() => {
    if (ownAt === null || ownAt === seenAt.current) return;
    seenAt.current = ownAt;
    setPushFor(ownAt);
    const id = window.setTimeout(() => setPushFor(null), 4200);
    return () => window.clearTimeout(id);
  }, [ownAt]);
  const pushVisible = !!thread && screen === 'site' && (camila ? view.t < S.open : pushFor !== null);

  const openThread = () => {
    setScreen('whatsapp');
    setPushFor(null);
    if (active) play('open');
  };
  const seeAgenda = onClose
    ? (d: number) => {
        onClose();
        openAgenda(d);
      }
    : undefined;

  return (
    <div className="clinic-patient" data-view={screen}>
      {screen === 'whatsapp' && run && thread ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="clinic-patient-bar">
            <button type="button" className="clinic-back" onClick={() => setScreen('site')}>
              <ArrowLeft aria-hidden strokeWidth={2} />
              {t('patient.backToSite')}
            </button>
          </div>
          <ChatWidget
            variant="whatsapp"
            run={run}
            title={business}
            avatar={<AuroraMark />}
            label={t('patient.threadLabel', { business })}
            announce={!paired}
            stamp={(at) => fmt.time(581 + Math.floor((thread.at + at) / 2500))}
            onPick={(step, reply) => {
              store.update(act.pickPatient(step, reply));
              if (active) play('select');
            }}
            composer={t('chat.composer')}
            className="clinic-patient-chat"
          />
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <BrowserFrame url={`${SITE_URL}/reservar`} variant="mobile" className="min-h-0 flex-1">
            <ClinicSite compact auto={auto} onSeeAgenda={seeAgenda} />
          </BrowserFrame>
          {chatOpen ? (
            <SiteChat onClose={() => setChatOpen(false)} className="clinic-sitechat-mobile" />
          ) : (
            <button type="button" className="clinic-site-chatbtn" onClick={() => setChatOpen(true)}>
              <MessageCircleMore aria-hidden strokeWidth={1.8} />
              {t('site.chat.open')}
            </button>
          )}
          {thread && !pushVisible ? (
            <button type="button" className="clinic-site-wabtn" onClick={openThread}>
              <MessageCircle aria-hidden strokeWidth={1.9} />
              {t('patient.openThread')}
            </button>
          ) : null}
        </div>
      )}
      {pushVisible && thread ? (
        <div className="clinic-push">
          <PushBanner
            app={t('patient.app')}
            icon={
              <span className="clinic-push-icon">
                <MessageCircle strokeWidth={2} />
              </span>
            }
            time={t('patient.now')}
            title={business}
            body={
              thread.name
                ? t('patient.push', { name: thread.name, time: fmt.time(thread.start), treatment: treatment(thread.treatment) })
                : t('patient.pushYou', { time: thread.day === TODAY ? fmt.time(thread.start) : `${day(thread.day)}, ${fmt.time(thread.start)}`, pro: pro(thread.pro) })
            }
            onOpen={openThread}
            openLabel={t('patient.openPush')}
          />
        </div>
      ) : null}
      {onClose ? (
        <button type="button" className="clinic-backtoapp" onClick={onClose}>
          <ArrowLeft aria-hidden strokeWidth={2} />
          {t('patient.backToApp')}
        </button>
      ) : null}
    </div>
  );
}

export function LaptopSite() {
  const t = useTranslations('demoClinic.site');
  const { view, state, openAgenda } = useClinic();
  const online = 6 + (view.events.some((e) => e.kind === 'online') ? 1 : 0) + state.mine.filter((m) => m.via === 'site').length;
  return (
    <div className="flex flex-col gap-[0.9em]">
      <ViewHead
        title={t('viewTitle')}
        sub={t('viewSub', { url: SITE_URL })}
        aside={
          <div className="grid grid-cols-3 gap-[0.5em]">
            <Kpi label={t('kpis.online')} value={online} />
            <Kpi label={t('kpis.visits')} value={236} />
            <Kpi label={t('kpis.chat')} value={41} />
          </div>
        }
      />
      <div className="relative h-[31em]">
        <BrowserFrame url={SITE_URL} className="h-full">
          <ClinicSite compact={false} auto={false} onSeeAgenda={openAgenda} />
        </BrowserFrame>
        <SiteChat peek className="clinic-sitechat-docked" />
      </div>
    </div>
  );
}
