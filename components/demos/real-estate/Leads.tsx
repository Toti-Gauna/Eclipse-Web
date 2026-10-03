'use client';

import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarCheck, ChevronDown, MessageCircle, PhoneCall, Sparkles, Zap, type LucideIcon } from 'lucide-react';
import { LIVE_COLOR, PAST_LEADS, listingById, type LeadId, type NextStep } from './data';
import type { LeadView } from './sim';
import { useEstate, useFmt } from './context';
import { MiniListing } from './Listings';
import { Avatar, Card, ChannelLabel, Eyebrow, RollingNumber, ScoreMeter, StageChip } from './ui';

/* ------------------------------------------------------------------ */
/* Text helpers                                                         */
/* ------------------------------------------------------------------ */
export function useLeadText() {
  const t = useTranslations('demoRealEstate');
  const fmt = useFmt();
  return {
    name: (lead: LeadView) => t(lead.live ? 'people.live' : `people.${lead.id}`),
    initial: (lead: LeadView) => t(lead.live ? 'people.live' : `people.${lead.id}`).charAt(0),
    color: (lead: LeadView) => (lead.live ? LIVE_COLOR : PAST_LEADS.find((p) => p.id === lead.id)!.color),
    seeks: (lead: LeadView) =>
      lead.op ? t('lead.seeks', { op: t(`ops.${lead.op}`), type: t(`types.${lead.type}`), beds: t('listing.beds', { count: lead.beds }) }) : null,
    zone: (lead: LeadView) => t(`zones.${lead.zone}`),
    budget: (lead: LeadView) => (lead.budget !== null && lead.op ? t('lead.budgetUpTo', { price: fmt.price(lead.op, lead.budget) }) : null),
    intent: (score: number) => t(score >= 80 ? 'lead.intent.high' : score >= 60 ? 'lead.intent.medium' : 'lead.intent.low'),
    next: (next: NextStep | null) => {
      if (!next) return null;
      const advisor = t('people.advisor');
      if (next.kind === 'visit') return t('lead.nextVisit', { slot: fmt.slot(next.slot), advisor });
      if (next.kind === 'call') return t('lead.nextCall', { advisor });
      return t('lead.nextFollowup');
    },
    summary: (lead: LeadView) => {
      if (!lead.live) return t(`lead.summary.${lead.id}`);
      if (!lead.complete || !lead.op || lead.budget === null || lead.next?.kind !== 'visit') return null;
      return t('lead.summary.live', {
        intent: t(`lead.intentVerb.${lead.op}`),
        beds: lead.beds,
        zone: t(`zones.${lead.zone}`),
        budget: fmt.price(lead.op, lead.budget),
        count: lead.listings.length,
        slot: fmt.slotLong(lead.next.slot),
      });
    },
    when: (lead: LeadView) => fmt.when(lead.day, lead.minutes),
  };
}

const NEXT_ICON: Record<NextStep['kind'], LucideIcon> = { visit: CalendarCheck, call: PhoneCall, followup: MessageCircle };

/** Placeholder for a field the agent hasn't asked about yet. */
function Pending({ className = 'w-[6em]' }: { className?: string }) {
  const t = useTranslations('demoRealEstate.lead');
  return (
    <span className={`re-skeleton inline-block h-[0.95em] rounded-full align-middle ${className}`}>
      <span className="sr-only">{t('pending')}</span>
    </span>
  );
}

function Field({ label, value, pendingWidth, wide = false }: { label: string; value: string | null; pendingWidth?: string; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-[0.62em] font-medium text-[var(--demo-muted)]">{label}</dt>
      <dd className="mt-[0.1em] text-[0.76em] font-semibold leading-[1.3]">{value ?? <Pending className={pendingWidth} />}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lead card                                                            */
/* ------------------------------------------------------------------ */
export function LeadCard({ lead, className = '' }: { lead: LeadView; className?: string }) {
  const t = useTranslations('demoRealEstate');
  const text = useLeadText();
  const fresh = lead.live && lead.complete;
  const qualifying = lead.live && !lead.complete;
  const summary = text.summary(lead);
  const next = text.next(lead.next);
  const NextIcon = lead.next ? NEXT_ICON[lead.next.kind] : CalendarCheck;
  // Unknown fields: still being asked (live) or never answered (past).
  const unknown = (v: string | null) => (v === null && !lead.live ? t('lead.unknown') : v);

  return (
    <Card className={`flex flex-col gap-[0.75em] p-[0.9em] ${fresh ? 're-pop' : ''} ${className}`}>
      <div className="flex items-center justify-between gap-[0.6em]">
        <Eyebrow className={qualifying ? '' : '!text-[var(--re-ok)]'}>{qualifying ? t('lead.qualifying') : t('lead.title')}</Eyebrow>
        <StageChip stage={qualifying ? 'live' : lead.stage} />
      </div>

      <div className="flex items-center gap-[0.6em]">
        <Avatar initial={text.initial(lead)} color={text.color(lead)} />
        <span className="min-w-0 flex-1 leading-[1.25]">
          <span className="block truncate text-[0.9em] font-semibold">{text.name(lead)}</span>
          <span className="flex items-center gap-[0.35em] truncate text-[0.66em] text-[var(--demo-muted)]">
            <ChannelLabel channel={lead.channel} />
            <span aria-hidden>·</span>
            <span className="tabular">{text.when(lead)}</span>
          </span>
        </span>
        {lead.responseSec !== null ? (
          <span className="inline-flex shrink-0 items-center gap-[0.25em] rounded-full bg-[var(--demo-accent-soft)] px-[0.5em] py-[0.15em] text-[0.64em] font-semibold text-[var(--re-accent-ink)]">
            <Zap aria-hidden className="size-[1.05em]" strokeWidth={2.2} />
            {t('lead.responded', { seconds: lead.responseSec })}
          </span>
        ) : null}
      </div>

      <div className="rounded-[0.8em] bg-black/[0.03] px-[0.75em] py-[0.6em]">
        <div className="flex items-baseline justify-between gap-[0.5em]">
          <p className="text-[0.66em] font-medium text-[var(--demo-muted)]">{t('lead.score')}</p>
          <p className="text-[0.66em] font-semibold">{text.intent(lead.score)}</p>
        </div>
        <p className="mt-[0.1em] text-[1.6em] font-semibold leading-none tracking-[-0.02em]">
          <RollingNumber value={lead.score} />
          <span className="text-[0.5em] font-medium text-[var(--demo-muted)]"> / 100</span>
        </p>
        <ScoreMeter score={lead.score} className="mt-[0.5em]" />
      </div>

      <dl className="grid grid-cols-2 gap-x-[0.8em] gap-y-[0.55em]">
        <Field wide label={t('lead.seeksLabel')} value={unknown(text.seeks(lead))} pendingWidth="w-[10em]" />
        <Field label={t('lead.zone')} value={text.zone(lead)} />
        <Field label={t('lead.budget')} value={unknown(text.budget(lead))} />
        <Field label={t('lead.channel')} value={t(`channels.${lead.channel}`)} />
      </dl>

      <div className={`flex items-start gap-[0.55em] rounded-[0.8em] border px-[0.7em] py-[0.55em] ${lead.next?.kind === 'visit' ? 'border-[var(--re-ok)]/25 bg-[var(--re-ok-bg)]' : 'border-[var(--demo-line)]'}`}>
        <NextIcon aria-hidden className={`mt-[0.1em] size-[1em] shrink-0 ${lead.next?.kind === 'visit' ? 'text-[var(--re-ok)]' : 'text-[var(--demo-muted)]'}`} strokeWidth={2} />
        <span className="min-w-0 flex-1 leading-[1.3]">
          <span className="block text-[0.62em] font-medium text-[var(--demo-muted)]">{t('lead.next')}</span>
          <span className="block text-[0.76em] font-semibold">{next ?? <Pending className="w-[9em]" />}</span>
        </span>
      </div>

      {lead.listings.length ? (
        <div>
          <p className="text-[0.62em] font-medium text-[var(--demo-muted)]">{t('lead.listings')}</p>
          <ul className="mt-[0.35em] flex flex-col gap-[0.35em]">
            {lead.listings.map((id) => (
              <li key={id}>
                <MiniListing listing={listingById(id)} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary ? (
        <div className="border-t border-[var(--demo-line)] pt-[0.6em]">
          <p className="flex items-center gap-[0.35em] text-[0.62em] font-semibold text-[var(--re-accent-ink)]">
            <Sparkles aria-hidden className="size-[1.1em]" strokeWidth={2} />
            {t('lead.summaryLabel')}
          </p>
          <p className="mt-[0.25em] text-[0.72em] leading-[1.4] text-[var(--demo-ink)]">{summary}</p>
        </div>
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Funnel counters                                                      */
/* ------------------------------------------------------------------ */
function useFunnel() {
  const { kpis } = useEstate();
  return {
    new: kpis.inquiries - kpis.qualified,
    qualified: kpis.qualified - kpis.visits,
    visit: kpis.visits,
  };
}

function FunnelStat({ label, value, tone, hint }: { label: string; value: number; tone: string; hint?: string }) {
  return (
    <div className="flex min-w-0 flex-col rounded-[0.9em] border border-[var(--demo-line)] bg-white px-[0.7em] py-[0.55em]">
      <p className="flex items-center gap-[0.35em] truncate text-[0.62em] font-medium text-[var(--demo-muted)]">
        <span aria-hidden className={`size-[0.6em] shrink-0 rounded-full ${tone}`} />
        {label}
      </p>
      <p className="mt-[0.15em] text-[1.35em] font-semibold leading-none tracking-[-0.02em]">
        <RollingNumber value={value} />
      </p>
      {hint ? <p className="mt-auto pt-[0.45em] text-[0.62em] leading-[1.3] text-[var(--demo-muted)]">{hint}</p> : null}
    </div>
  );
}

function Funnel({ hints = false, className = '' }: { hints?: boolean; className?: string }) {
  const t = useTranslations('demoRealEstate');
  const f = useFunnel();
  return (
    <div className={`grid grid-cols-3 gap-[0.5em] ${className}`}>
      <FunnelStat label={t('stages.new')} value={f.new} tone="bg-[var(--demo-muted)]" hint={hints ? t('leads.hints.new') : undefined} />
      <FunnelStat label={t('stages.qualified')} value={f.qualified} tone="bg-[var(--re-warn)]" hint={hints ? t('leads.hints.qualified') : undefined} />
      <FunnelStat label={t('stages.visit')} value={f.visit} tone="bg-[var(--re-ok)]" hint={hints ? t('leads.hints.visit') : undefined} />
    </div>
  );
}

/** "100% de las consultas respondidas en < 1 min" (the vertical's key number). */
export function KeyNumberCard({ className = '' }: { className?: string }) {
  const t = useTranslations('demoRealEstate');
  const { keyNumber, keySuffix, kpis } = useEstate();
  return (
    <div
      className={`relative overflow-hidden rounded-[1em] p-[0.85em] text-white ${className}`}
      style={{ background: 'radial-gradient(70% 90% at 105% -10%, rgb(245 185 66 / 0.3), transparent 60%), linear-gradient(150deg, #2f4590, #1d2c63)' }}
    >
      <p className="text-[0.7em] font-medium text-white/90">{t('kpis.fast')}</p>
      <p className="mt-[0.15em] text-[1.9em] font-semibold leading-none tracking-[-0.02em]">
        {keyNumber}
        {keySuffix}
      </p>
      <p className="mt-[0.45em] text-[0.64em] leading-[1.3] text-white/90">{t('kpis.fastHint', { count: kpis.inquiries })}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phone                                                                */
/* ------------------------------------------------------------------ */
function OtherLeadRow({ lead, open, onToggle }: { lead: LeadView; open: boolean; onToggle: () => void }) {
  const text = useLeadText();
  const t = useTranslations('demoRealEstate');
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="re-row flex w-full items-center gap-[0.6em] rounded-[0.8em] px-[0.45em] py-[0.5em] text-left"
      >
        <Avatar initial={text.initial(lead)} color={text.color(lead)} />
        <span className="min-w-0 flex-1 leading-[1.25]">
          <span className="block truncate text-[0.8em] font-semibold">{text.name(lead)}</span>
          <span className="block truncate text-[0.64em] text-[var(--demo-muted)]">
            {t(`ops.${lead.op ?? 'sale'}`)} · {text.zone(lead)} · {text.when(lead)}
          </span>
        </span>
        <StageChip stage={lead.stage} />
        <ChevronDown aria-hidden className={`size-[0.9em] shrink-0 text-[var(--demo-muted)] transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2} />
      </button>
      {open ? <LeadCard lead={lead} className="re-pop mt-[0.3em]" /> : null}
    </li>
  );
}

export function PhoneLeads() {
  const t = useTranslations('demoRealEstate');
  const { live, leads, openTab, chat } = useEstate();
  const [open, setOpen] = useState<LeadId | null>(null);
  const others = leads.filter((l) => !l.live);
  return (
    <div className="flex flex-col gap-[0.75em]">
      <KeyNumberCard />
      <Funnel />
      <div>
        <Eyebrow>{t('leads.liveTitle')}</Eyebrow>
        {live ? (
          <div className="mt-[0.45em] flex flex-col gap-[0.45em]">
            <LeadCard key={live.complete ? 'done' : 'live'} lead={live} />
            {!chat.done ? (
              <button
                type="button"
                onClick={() => openTab('inbox')}
                className="inline-flex items-center justify-center gap-[0.4em] rounded-full border border-[var(--demo-line)] bg-white px-[0.9em] py-[0.55em] text-[0.74em] font-semibold text-[var(--re-accent-ink)]"
              >
                <MessageCircle aria-hidden className="size-[1.1em]" strokeWidth={2} />
                {t('leads.openChat')}
              </button>
            ) : null}
          </div>
        ) : (
          <p className="mt-[0.45em] text-[0.74em] text-[var(--demo-muted)]">{t('leads.waiting')}</p>
        )}
      </div>
      <div>
        <Eyebrow>{t('leads.othersTitle')}</Eyebrow>
        <ul className="mt-[0.3em] flex flex-col">
          {others.map((l) => (
            <OtherLeadRow key={l.id} lead={l} open={open === l.id} onToggle={() => setOpen((o) => (o === l.id ? null : l.id))} />
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Laptop                                                               */
/* ------------------------------------------------------------------ */
function ScoreCell({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-[0.45em]">
      <span className="tabular w-[1.6em] text-right text-[0.72em] font-semibold">{score}</span>
      <ScoreMeter score={score} className="flex-1" />
    </span>
  );
}

export function LaptopLeads() {
  const t = useTranslations('demoRealEstate');
  const text = useLeadText();
  const { leads } = useEstate();
  // null: follow the newest lead (the live one once it exists) · 'none': all collapsed.
  const [selected, setSelected] = useState<LeadId | 'none' | null>(null);
  const current = selected === 'none' ? null : (selected ?? leads[0]?.id ?? null);
  const fmt = useFmt();
  const cols = [
    ['lead', '26%'],
    ['seeks', '25%'],
    ['budget', '17%'],
    ['score', '13%'],
    ['stage', '19%'],
  ] as const;

  return (
    <div className="flex flex-col gap-[0.9em]">
      <div className="mr-[var(--re-safe-top,0em)]">
        <h2 className="text-[1.45em] font-semibold leading-tight tracking-[-0.02em]">{t('leads.title')}</h2>
        <p className="truncate text-[0.78em] text-[var(--demo-muted)]">{t('leads.subtitle')}</p>
      </div>
      <div className="mr-[var(--re-safe,0em)] flex flex-col gap-[0.8em]">
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,3fr)] gap-[0.6em]">
          <KeyNumberCard />
          <Funnel hints />
        </div>
        <Card className="overflow-hidden">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">{t('leads.tableCaption')}</caption>
            <colgroup>
              {cols.map(([c, width]) => (
                <col key={c} style={{ width }} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-[var(--demo-line)]">
                {cols.map(([c]) => (
                  <th key={c} scope="col" className="px-[0.6em] py-[0.4em]">
                    <span className="text-[0.6em] font-semibold uppercase tracking-[0.08em] text-[var(--demo-muted)]">{t(`leads.cols.${c}`)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const open = current === lead.id;
                const qualifying = lead.live && !lead.complete;
                return (
                  <Fragment key={lead.id}>
                    <tr className={`border-b border-[var(--demo-line)] ${lead.live ? 're-pop' : ''} ${open ? 'bg-[var(--demo-accent-soft)]/50' : ''}`}>
                      <th scope="row" className="p-0 font-normal">
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setSelected(open ? 'none' : lead.id)}
                          className="flex w-full items-center gap-[0.5em] px-[0.6em] py-[0.45em] text-left"
                        >
                          <Avatar initial={text.initial(lead)} color={text.color(lead)} className="text-[0.75em]" />
                          <span className="min-w-0 flex-1 leading-[1.2]">
                            <span className="block truncate text-[0.74em] font-semibold">{text.name(lead)}</span>
                            <span className="block truncate text-[0.6em] text-[var(--demo-muted)]">
                              {t(`channels.${lead.channel}`)} · {text.when(lead)}
                            </span>
                          </span>
                          <ChevronDown aria-hidden className={`size-[0.85em] shrink-0 text-[var(--demo-muted)] transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2} />
                        </button>
                      </th>
                      <td className="px-[0.6em] leading-[1.2]">
                        <span className="block truncate text-[0.68em] font-medium">
                          {lead.op ? `${t(`ops.${lead.op}`)} · ${t(`types.${lead.type}`)}` : <Pending />}
                        </span>
                        <span className="block truncate text-[0.6em] text-[var(--demo-muted)]">
                          {t('listing.beds', { count: lead.beds })} · {text.zone(lead)}
                        </span>
                      </td>
                      <td className="px-[0.6em]">
                        <span className="tabular block truncate text-[0.68em]">
                          {lead.op && lead.budget !== null ? fmt.price(lead.op, lead.budget) : qualifying ? <Pending className="w-[4em]" /> : '—'}
                        </span>
                      </td>
                      <td className="px-[0.6em]">
                        <ScoreCell score={lead.score} />
                      </td>
                      <td className="px-[0.6em]">
                        <StageChip stage={qualifying ? 'live' : lead.stage} />
                      </td>
                    </tr>
                    {open ? (
                      <tr className="border-b border-[var(--demo-line)] bg-[var(--demo-accent-soft)]/50">
                        <td colSpan={cols.length} className="px-[0.8em] pb-[0.7em] pt-[0.1em]">
                          <LeadDetail lead={lead} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

/** Expanded row: next step, suggested listings and the AI summary side by side. */
function LeadDetail({ lead }: { lead: LeadView }) {
  const t = useTranslations('demoRealEstate');
  const text = useLeadText();
  const next = text.next(lead.next);
  const summary = text.summary(lead);
  const NextIcon = lead.next ? NEXT_ICON[lead.next.kind] : CalendarCheck;
  return (
    <div className="re-pop grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] gap-[0.8em]">
      <div className="rounded-[0.7em] bg-white px-[0.65em] py-[0.5em]">
        <p className="text-[0.6em] font-medium text-[var(--demo-muted)]">{t('lead.next')}</p>
        <p className="mt-[0.15em] flex items-start gap-[0.35em] text-[0.7em] font-semibold leading-[1.3]">
          <NextIcon aria-hidden className={`mt-[0.1em] size-[1.05em] shrink-0 ${lead.next?.kind === 'visit' ? 'text-[var(--re-ok)]' : 'text-[var(--demo-muted)]'}`} strokeWidth={2} />
          {next ?? <Pending className="w-[8em]" />}
        </p>
      </div>
      <div className="rounded-[0.7em] bg-white px-[0.65em] py-[0.5em]">
        <p className="text-[0.6em] font-medium text-[var(--demo-muted)]">{t('lead.listings')}</p>
        {lead.listings.length ? (
          <ul className="mt-[0.3em] flex flex-col gap-[0.3em] text-[0.85em]">
            {lead.listings.map((id) => (
              <li key={id}>
                <MiniListing listing={listingById(id)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-[0.15em] text-[0.7em] text-[var(--demo-muted)]">{lead.live ? <Pending /> : t('lead.noListings')}</p>
        )}
      </div>
      <div className="rounded-[0.7em] bg-white px-[0.65em] py-[0.5em]">
        <p className="flex items-center gap-[0.3em] text-[0.6em] font-semibold text-[var(--re-accent-ink)]">
          <Sparkles aria-hidden className="size-[1.1em]" strokeWidth={2} />
          {t('lead.summaryLabel')}
        </p>
        <p className="mt-[0.2em] text-[0.68em] leading-[1.4]">{summary ?? <Pending className="w-[12em]" />}</p>
      </div>
    </div>
  );
}
