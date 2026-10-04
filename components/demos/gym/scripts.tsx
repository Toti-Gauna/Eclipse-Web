'use client';

import { useMemo } from 'react';
import { Gift, Target, Zap } from 'lucide-react';
import { runChat, type ChatRun, type ChatScript } from '../kit';
import { HERO, LEAD, MISSIONS, TRIAL_OPTIONS, WA_OPTIONS, XP, sessionById } from './model';
import { LEAD_FLOW, WA_FLOW, buildScript } from './story';
import { useGym, useGymText } from './hooks';

/** A class as a ticket (inside chats and the app): kind, day, time, coach, spots. */
export function ClassTicket({ session, spots, tag, tone = 'accent' }: { session: string; spots?: number; tag?: string; tone?: 'accent' | 'info' }) {
  const { t, fmt, kind, coach, dayShort, dayNum } = useGymText();
  const s = sessionById(session);
  if (!s) return null;
  return (
    <span className="gym-ticket" data-tone={tone}>
      <span className="gym-ticket-date" aria-hidden>
        <span>{dayShort(s.day)}</span>
        <b>{dayNum(s.day)}</b>
      </span>
      <span className="min-w-0 flex-1">
        {tag ? <span className="gym-ticket-tag">{tag}</span> : null}
        <span className="gym-ticket-kind">
          {kind(s.kind)} · {fmt.time(s.start)}
        </span>
        <span className="gym-ticket-sub">
          {coach(s.coach)}
          {spots !== undefined ? ` · ${t('class.spots', { count: spots })}` : ''}
        </span>
      </span>
    </span>
  );
}

/** The personal mission the win-back sends (a card inside the WhatsApp). */
export function MissionCard() {
  const { t, fmt } = useGymText();
  const goal = MISSIONS.find((m) => m.id === 'comeback')!.goal;
  return (
    <span className="gym-wa-mission">
      <span className="gym-wa-mission-kicker">
        <Target aria-hidden strokeWidth={2} />
        {t('wa.card.kicker')}
      </span>
      <span className="gym-wa-mission-title">{t('wa.card.title', { count: goal })}</span>
      <span className="gym-wa-mission-reward">
        <span>
          <Zap aria-hidden strokeWidth={2} />+{fmt.num(XP.comeback)} XP
        </span>
        <span>
          <Gift aria-hidden strokeWidth={2} />
          {t('wa.card.badge')}
        </span>
      </span>
    </span>
  );
}

/** Spots as they were when the chat ran (Monday morning): messages don't change once sent. */
const spots = (id: string) => {
  const s = sessionById(id);
  return s ? s.cap - s.booked : 0;
};

/** Every chat of the demo, in the current locale. Texts that depend on a choice take it. */
export function useGymScripts(waSlot: string | undefined, leadGoal: string | undefined, leadPick: string | undefined, leadName?: string) {
  const { t, short, session, kind, coach } = useGymText();
  return useMemo(() => {
    const comeback = MISSIONS.find((m) => m.id === 'comeback')!;
    const waSession = WA_OPTIONS[waSlot === 'opt1' ? 1 : 0];
    const ws = sessionById(waSession)!;
    const wa: ChatScript = buildScript(
      WA_FLOW,
      (step) => {
        switch (step) {
          case 'hello':
            return { text: t('wa.hello', { name: short(HERO), days: 9 }) };
          case 'mission':
            return { text: t('wa.mission', { count: comeback.goal }), card: <MissionCard /> };
          case 'slots':
            return { text: t('wa.slots') };
          case 'booked':
            return {
              text: t('wa.booked', { kind: kind(ws.kind), coach: coach(ws.coach) }),
              card: <ClassTicket session={waSession} />,
            };
          default:
            return { text: t(`wa.${step}`) };
        }
      },
      (step, id) => (step === 'slots' ? session(WA_OPTIONS[id === 'opt1' ? 1 : 0]) : t(`wa.replies.${id}`)),
    );

    const trialSession = TRIAL_OPTIONS[leadPick === 'opt1' ? 1 : 0];
    const lead: ChatScript = buildScript(
      LEAD_FLOW,
      (step) => {
        switch (step) {
          case 'pick':
            return {
              text: t(`lead.pick.${leadGoal ?? 'unsure'}`),
              card: (
                <span className="gym-slotchips" aria-hidden>
                  {TRIAL_OPTIONS.map((id) => (
                    <span key={id}>
                      {session(id, false)} · {t('class.spots', { count: spots(id) })}
                    </span>
                  ))}
                </span>
              ),
            };
          case 'nameReply':
            return { text: leadName ?? short(LEAD) };
          case 'done':
            return {
              text: t('lead.done', { name: leadName ?? short(LEAD) }),
              card: <ClassTicket session={trialSession} tag={t('lead.trialTag')} tone="info" />,
            };
          default:
            return { text: t(`lead.${step}`) };
        }
      },
      (step, id) => (step === 'pick' ? session(TRIAL_OPTIONS[id === 'opt1' ? 1 : 0], false) : t(`lead.replies.${id}`)),
    );
    return { wa, lead };
  }, [t, short, session, kind, coach, waSlot, leadGoal, leadPick, leadName]);
}

/**
 * The chats as they are right now, with the localized texts (same structure and picks as the
 * timing scripts the story runs, so both agree on when everything happens):
 * Lucía's WhatsApp, Tomás' site chat (beat 1) and the visitor's own site chat.
 */
export function useChats(): { wa: ChatRun | null; lead: ChatRun; leadMine: ChatRun | null } {
  const { view } = useGym();
  const { t } = useGymText();
  const scripts = useGymScripts(view.wa.chosen.slots, view.lead.chosen.goal, view.lead.chosen.pick);
  const mineScripts = useGymScripts(undefined, view.leadMine?.chosen.goal, view.leadMine?.chosen.pick, t('lead.youName'));
  const time = view.t;
  const { waSource, leadSource, leadMineSource } = view;
  const wa = useMemo(() => (waSource ? runChat(scripts.wa, time - waSource.start, waSource.picks, waSource.options) : null), [scripts.wa, waSource, time]);
  const lead = useMemo(() => runChat(scripts.lead, time - leadSource.start, leadSource.picks, leadSource.options), [scripts.lead, leadSource, time]);
  const leadMine = useMemo(
    () => (leadMineSource ? runChat(mineScripts.lead, time - leadMineSource.start, leadMineSource.picks, leadMineSource.options) : null),
    [mineScripts.lead, leadMineSource, time],
  );
  return { wa, lead, leadMine };
}
