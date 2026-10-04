'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSound } from '@/components/sound/SoundContext';
import { Card, ChatWidget, Pill, Switch, type ChatRun, type Tone } from '../../kit';
import { REMINDERS_TODAY, STORY, TODAY } from '../data';
import { act, isOffNow, type Automation } from '../story';
import { useClinic } from '../context';
import { useClinicScripts } from '../scripts';
import { AuroraMark, useClinicText, ViewHead } from '../ui';

/** Martina's reminder conversation, as the patient sees it on WhatsApp. She can be "you". */
export function MartinaChat({ className = '' }: { className?: string }) {
  const t = useTranslations('demoClinic');
  const { view, store, business, announce, active } = useClinic();
  const { fmt, option, day } = useClinicText();
  const { moved } = useClinicScripts();
  const { play } = useSound();
  // The rescheduled slot is only known after she picks it.
  const run: ChatRun = {
    ...view.chat,
    items: view.chat.items.map((it) =>
      it.step === 'moved' && view.martinaOption !== null
        ? { ...it, text: t('chat.martina.moved', { slot: option(view.martinaOption) }), card: moved(view.martinaOption) }
        : it,
    ),
  };

  return (
    <ChatWidget
      variant="whatsapp"
      run={run}
      title={business}
      avatar={<AuroraMark />}
      label={t('chat.martina.log', { business, name: t('firstNames.martina') })}
      announce={announce}
      dateLabel={day(TODAY)}
      stamp={(at) => fmt.time(581 + Math.floor((STORY.chatStart + at) / 2500))}
      onPick={(step, reply) => {
        store.update(act.pickMartina(step, reply));
        if (active) play('select');
      }}
      composer={t('chat.composer')}
      className={className}
    />
  );
}

function useReplyStats() {
  const { view } = useClinic();
  const confirmed = 13 + (view.events.some((e) => e.id === 'valentina') ? 1 : 0) + (view.martina === 'confirm' && view.events.some((e) => e.id === 'martina') ? 1 : 0);
  const changed = (view.events.some((e) => e.id === 'nicolas') ? 1 : 0) + (view.martina !== 'confirm' && view.events.some((e) => e.id === 'martina') ? 1 : 0);
  return { sent: REMINDERS_TODAY.sent, confirmed, changed, noReply: REMINDERS_TODAY.sent - confirmed - changed };
}

function ReplyStats({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoClinic.whatsapp.stats');
  const s = useReplyStats();
  const items: { key: keyof typeof s; tone: Tone }[] = [
    ...(compact ? [] : [{ key: 'sent' as const, tone: 'neutral' as Tone }]),
    { key: 'confirmed', tone: 'ok' },
    { key: 'changed', tone: 'warn' },
    { key: 'noReply', tone: 'neutral' },
  ];
  return (
    <div className={`grid gap-[0.5em] ${compact ? 'grid-cols-3' : 'grid-cols-4'}`}>
      {items.map((it) => (
        <div key={it.key} className={`clinic-stat demo-tone-${it.tone}`}>
          <span className="clinic-stat-label">
            <span aria-hidden className="clinic-stat-dot" />
            {t(it.key)}
          </span>
          <span key={s[it.key]} className="clinic-stat-value demo-display demo-pop">
            {s[it.key]}
          </span>
        </div>
      ))}
    </div>
  );
}

const RULES: { id: string; story?: Automation }[] = [{ id: 'booked' }, { id: 'day' }, { id: 'hours' }, { id: 'waitlist', story: 'waitlist' }];

function Automations() {
  const t = useTranslations('demoClinic.whatsapp.rules');
  const { state, store, active } = useClinic();
  const { play } = useSound();
  const uid = useId();
  const [local, setLocal] = useState<Record<string, boolean>>({ booked: true, day: true, hours: true });
  return (
    <Card className="p-[0.85em]">
      <h3 className="demo-card-title">{t('title')}</h3>
      <ol className="clinic-flow mt-[0.5em]">
        {RULES.map((r, i) => {
          const on = r.story ? !isOffNow(state.off[r.story]) : local[r.id];
          return (
            <li key={r.id} className="clinic-flow-step" data-on={on ? '' : undefined}>
              <span aria-hidden className="clinic-flow-index demo-num">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 leading-[1.3]">
                <span id={`${uid}-${r.id}`} className="block text-[0.76em] font-semibold">
                  {t(`${r.id}.title`)}
                </span>
                <span id={`${uid}-${r.id}-d`} className="block text-[0.64em] text-[var(--demo-muted)]">
                  {t(`${r.id}.body`)}
                </span>
              </span>
              <Switch
                checked={on}
                labelledBy={`${uid}-${r.id}`}
                describedBy={`${uid}-${r.id}-d`}
                onChange={() => {
                  if (r.story) {
                    store.update(act.toggle(r.story));
                              } else setLocal((l) => ({ ...l, [r.id]: !l[r.id] }));
                  if (active) play('toggle');
                }}
              />
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

const ROWS = ['valentina', 'martina', 'nicolas', 'rocio', 'pedro'] as const;

function Replies() {
  const t = useTranslations('demoClinic.whatsapp');
  const { view } = useClinic();
  const { patient } = useClinicText();
  const stateOf = (p: (typeof ROWS)[number]): { key: string; tone: Tone } => {
    if (p === 'valentina') return view.events.some((e) => e.id === 'valentina') ? { key: 'confirmed', tone: 'ok' } : { key: 'waiting', tone: 'neutral' };
    if (p === 'nicolas') return view.events.some((e) => e.id === 'nicolas') ? { key: 'cancelled', tone: 'bad' } : { key: 'confirmed', tone: 'ok' };
    if (p === 'martina') {
      const done = view.events.some((e) => e.id === 'martina');
      if (!done) return view.chat.items.length ? { key: 'talking', tone: 'accent' } : { key: 'waiting', tone: 'neutral' };
      return view.martina === 'confirm' ? { key: 'confirmed', tone: 'ok' } : view.martina === 'reschedule' ? { key: 'rescheduled', tone: 'warn' } : { key: 'cancelled', tone: 'bad' };
    }
    if (p === 'rocio') return { key: 'waiting', tone: 'neutral' };
    return { key: 'confirmed', tone: 'ok' };
  };
  return (
    <Card className="p-[0.85em]">
      <h3 className="demo-card-title">{t('repliesTitle')}</h3>
      <ul className="mt-[0.4em] divide-y divide-[var(--demo-line)]">
        {ROWS.map((p) => {
          const s = stateOf(p);
          return (
            <li key={p} className="flex items-center gap-[0.6em] py-[0.45em]">
              <span className="min-w-0 flex-1 truncate text-[0.76em] font-semibold">{patient(p)}</span>
              <span key={s.key} className="demo-pop">
                <Pill tone={s.tone}>{t(`state.${s.key}`)}</Pill>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ChatHint() {
  const t = useTranslations('demoClinic');
  const { view } = useClinic();
  return (
    <p className={`clinic-hint ${view.chat.awaiting ? '' : 'clinic-hint-quiet'}`}>
      {view.chat.awaiting ? t('whatsapp.hint', { name: t('firstNames.martina') }) : t('whatsapp.patientView')}
    </p>
  );
}

export function PhoneWhatsApp() {
  const t = useTranslations('demoClinic.whatsapp');
  return (
    <div className="flex flex-col gap-[0.7em] pt-[0.2em]">
      <ViewHead title={t('title')} sub={t('subtitle')} />
      <ChatHint />
      <MartinaChat className="h-[30em]" />
      <ReplyStats compact />
      <Automations />
    </div>
  );
}

export function LaptopWhatsApp() {
  const t = useTranslations('demoClinic.whatsapp');
  return (
    <div className="flex flex-col gap-[0.9em]">
      <ViewHead title={t('title')} sub={t('subtitle')} />
      <ReplyStats />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-start gap-[0.8em]">
        <div className="flex flex-col gap-[0.8em]">
          <Automations />
          <Replies />
        </div>
        <div className="flex flex-col gap-[0.4em]">
          <ChatHint />
          <MartinaChat className="h-[31em]" />
        </div>
      </div>
    </div>
  );
}
