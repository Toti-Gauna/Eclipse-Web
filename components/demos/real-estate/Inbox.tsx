'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Zap } from 'lucide-react';
import type { LeadId } from './data';
import type { LeadView } from './sim';
import { useEstate, useFmt } from './context';
import { ChatPanel, useChatText } from './Chat';
import { KeyNumberCard, LeadCard, useLeadText } from './Leads';
import { Avatar, CHANNEL_ICON, Card, RollingNumber, StageChip } from './ui';

function Kpi({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1em] border border-[var(--demo-line)] bg-white p-[0.85em]">
      <p className="text-[0.7em] font-medium text-[var(--demo-muted)]">{label}</p>
      <p className="mt-[0.15em] text-[1.9em] font-semibold leading-none tracking-[-0.02em]">{value}</p>
      {hint ? <p className="mt-[0.45em] text-[0.64em] leading-[1.3] text-[var(--demo-muted)]">{hint}</p> : null}
    </div>
  );
}

export function KpiRow() {
  const t = useTranslations('demoRealEstate.kpis');
  const { kpis } = useEstate();
  return (
    <div className="grid grid-cols-4 gap-[0.75em]">
      <Kpi label={t('inquiries')} value={<RollingNumber value={kpis.inquiries} />} hint={t('inquiriesHint')} />
      <KeyNumberCard />
      <Kpi
        label={t('avg')}
        value={
          <>
            <RollingNumber value={kpis.avgSeconds} />
            <span className="text-[0.55em] font-medium text-[var(--demo-muted)]"> {t('secondsUnit')}</span>
          </>
        }
        hint={t('avgHint')}
      />
      <Kpi label={t('visits')} value={<RollingNumber value={kpis.visits} />} hint={t('visitsHint')} />
    </div>
  );
}

/** One conversation in the inbox. The live one previews its latest message. */
function InboxRow({ lead, selected, onSelect }: { lead: LeadView; selected: boolean; onSelect: () => void }) {
  const t = useTranslations('demoRealEstate');
  const text = useLeadText();
  const chatText = useChatText();
  const { chat } = useEstate();
  const Icon = CHANNEL_ICON[lead.channel];
  const qualifying = lead.live && !lead.complete;

  let preview: string;
  let typing = false;
  if (lead.live) {
    const last = [...chat.items].reverse().find((i) => i.from !== 'system');
    typing = chat.typing;
    preview = typing ? t('inbox.agentTyping') : last ? (last.from === 'agent' ? t('inbox.agentSays', { text: chatText(last) }) : chatText(last)) : '';
  } else {
    preview = t(`inbox.previews.${lead.id}`);
  }

  return (
    <li className={lead.live ? 're-pop' : ''}>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="re-row flex w-full items-start gap-[0.7em] rounded-[0.8em] px-[0.6em] py-[0.45em] text-left"
      >
        <span className="relative shrink-0">
          <Avatar initial={text.initial(lead)} color={text.color(lead)} />
          <span aria-hidden className="absolute -bottom-[0.3em] -right-[0.4em] grid size-[1.05em] place-items-center rounded-full bg-white text-[var(--demo-muted)] shadow-[0_0_0_0.1em_white]">
            <Icon className="size-[0.7em]" strokeWidth={2.2} />
          </span>
        </span>
        <span className="min-w-0 flex-1 leading-[1.25]">
          <span className="flex items-center gap-[0.4em]">
            <span className="truncate text-[0.78em] font-semibold">{text.name(lead)}</span>
            <span className="sr-only">· {t(`channels.${lead.channel}`)}</span>
            <span className={`ml-auto shrink-0 text-[0.6em] font-medium ${lead.live ? 'font-semibold text-[var(--re-accent-ink)]' : 'text-[var(--demo-muted)]'}`}>
              {lead.live ? t('inbox.now') : text.when(lead)}
            </span>
          </span>
          <span className={`mt-[0.1em] block truncate text-[0.66em] ${typing ? 'text-[#14804a]' : 'text-[var(--demo-muted)]'}`}>{preview}</span>
          <span className="mt-[0.25em] flex items-center gap-[0.35em]">
            {lead.responseSec !== null ? (
              <span className="inline-flex items-center gap-[0.2em] rounded-full bg-[var(--demo-accent-soft)] px-[0.45em] py-[0.1em] text-[0.58em] font-semibold text-[var(--re-accent-ink)]">
                <Zap aria-hidden className="size-[1.05em]" strokeWidth={2.2} />
                {t('inbox.responded', { seconds: lead.responseSec })}
              </span>
            ) : null}
            <StageChip stage={qualifying ? 'live' : lead.stage} className="text-[0.58em]" />
          </span>
        </span>
      </button>
    </li>
  );
}

export function LaptopInbox() {
  const t = useTranslations('demoRealEstate');
  const fmt = useFmt();
  const { leads, paired } = useEstate();
  // null: follow the newest conversation (the live one once it arrives).
  const [selected, setSelected] = useState<LeadId | null>(null);
  const current = leads.find((l) => l.id === selected) ?? leads[0];

  return (
    <div className="flex flex-col gap-[0.9em]">
      <div className="mr-[var(--re-safe-top,0em)] min-w-0">
        <h2 className="text-[1.45em] font-semibold leading-tight tracking-[-0.02em]">{t('inbox.title')}</h2>
        <p className="truncate text-[0.78em] text-[var(--demo-muted)]">
          {fmt.long(0)} · {t('inbox.subtitle')}
        </p>
      </div>
      {/* The phone of the showcase covers the right edge: keep the body clear of it. */}
      <div className="mr-[var(--re-safe,0em)] flex flex-col gap-[0.9em]">
        <KpiRow />
        <div className={`grid items-start gap-[0.8em] ${paired ? 'grid-cols-[minmax(0,1fr)_17em]' : 'grid-cols-[minmax(0,1fr)_16em_18em]'}`}>
          <Card className="p-[0.5em]">
            <h3 className="px-[0.6em] pb-[0.3em] pt-[0.35em] text-[0.86em] font-semibold">{t('inbox.list')}</h3>
            <ul className="flex flex-col">
              {leads.map((lead) => (
                <InboxRow key={lead.id} lead={lead} selected={current?.id === lead.id} onSelect={() => setSelected(lead.id)} />
              ))}
            </ul>
          </Card>
          {current ? <LeadCard key={current.id} lead={current} /> : null}
          {/* Next to the laptop, the phone already shows the customer's side. */}
          {paired ? null : <ChatPanel className="h-[30em]" />}
        </div>
      </div>
    </div>
  );
}
