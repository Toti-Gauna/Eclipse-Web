'use client';

import { useTranslations } from 'next-intl';
import { Check, Clock3, Minus, Send } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { ChatWidget, type ChatRun } from '../../kit';
import { CHAT_SLOTS, VISIT_MIN, WEEK } from '../data';
import { act } from '../story';
import { useEstate } from '../context';
import { useEstateChats, useStamp } from '../scripts';
import { LumenMark, useEstateText, ViewHead } from '../ui';

type StepId = 'confirm' | 'remind' | 'after' | 'similar' | 'news';
type Status = 'sent' | 'scheduled' | 'skipped' | 'waiting';
const STEPS: StepId[] = ['confirm', 'remind', 'after', 'similar', 'news'];

/** Hook: the localized WhatsApp follow-up + a pick handler (as the buyer). */
export function useFollow(): { run: ChatRun | null; pick: (step: string, reply: string) => void } {
  const { view, store, active } = useEstate();
  const chats = useEstateChats();
  const { play } = useSound();
  return {
    run: chats.follow(view),
    pick: (step, reply) => {
      if (view.followStart === null) return;
      store.update(act.pickFollow(view.followStart, step, reply));
      if (active) play('select');
    },
  };
}

/** The WhatsApp thread after the visit (what the buyer receives). */
export function FollowThread({ className = '', announce: announceProp }: { className?: string; announce?: boolean }) {
  const t = useTranslations('demoRealEstate');
  const { view, business, announce } = useEstate();
  const { run, pick } = useFollow();
  const stamp = useStamp();
  if (!run || view.followStart === null) return null;
  const start = view.followStart;
  return (
    <ChatWidget
      variant="whatsapp"
      run={run}
      title={business}
      avatar={<LumenMark />}
      label={t('follow.label', { business, name: t('people.carolina') })}
      announce={announceProp ?? announce}
      stamp={(at) => stamp(start + at)}
      onPick={pick}
      composer={t('follow.composer')}
      className={`re-wa ${className}`}
    />
  );
}

/** The sequence after each visit, with where Carolina is in it. */
function Sequence() {
  const t = useTranslations('demoRealEstate.followups');
  const { view, recent } = useEstate();
  const x = useEstateText();
  const slot = view.slot ? CHAT_SLOTS[view.slot] : null;
  const booked = view.bookedAt !== null && view.t >= view.bookedAt && slot;
  const jumped = view.timelapseAt !== null && view.t >= view.timelapseAt;
  const sent = view.follow !== null && view.follow.at.how !== undefined;
  const outcome = view.outcomeAt !== null && view.t >= view.outcomeAt ? view.outcome : null;

  const status = (id: StepId): Status => {
    if (!booked) return 'waiting';
    if (id === 'confirm') return 'sent';
    if (id === 'remind') return jumped ? 'sent' : 'scheduled';
    if (id === 'after') return sent ? 'sent' : 'scheduled';
    if (outcome === 'reserve') return 'skipped';
    if (id === 'similar' && outcome === 'similar') return 'sent';
    return 'scheduled';
  };
  const when = (id: StepId): string | null => {
    if (!slot || !booked) return null;
    const end = slot.start + VISIT_MIN;
    switch (id) {
      case 'confirm':
        return x.clock({ day: 3, min: 1422 });
      case 'remind':
        return x.slot({ day: slot.day, start: slot.start - 120 });
      case 'after':
        return x.slot({ day: slot.day, start: end + 5 });
      case 'similar':
        return x.slot({ day: slot.day + 3, start: 600 });
      default:
        return x.slot({ day: slot.day + 7, start: 600 });
    }
  };
  const ICON = { sent: Check, scheduled: Clock3, skipped: Minus, waiting: Clock3 };
  return (
    <ol className="re-seq">
      {STEPS.map((id, i) => {
        const s = status(id);
        const Icon = id === 'after' && s === 'sent' && recent(view.followStart, 2600) ? Send : ICON[s];
        return (
          <li key={id} className="re-seq-step" data-status={s}>
            <span className="re-seq-index demo-num" aria-hidden>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1">
              <span className="re-label block">{t(`steps.${id}.when`)}</span>
              <span className="block text-[0.8em] font-semibold">{t(`steps.${id}.what`)}</span>
            </span>
            <span className="re-seq-status">
              <Icon aria-hidden strokeWidth={2} />
              <span>
                {t(`status.${s}`)}
                {when(id) && s !== 'skipped' ? <span className="demo-num block opacity-80">{when(id)}</span> : null}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Preview({ className = '' }: { className?: string }) {
  const t = useTranslations('demoRealEstate.followups');
  const { view } = useEstate();
  const x = useEstateText();
  const slot = view.slot ? CHAT_SLOTS[view.slot] : null;
  return (
    <section className={`re-preview ${className}`} aria-label={t('preview')}>
      <p className="re-label mb-[0.5em]">{t('preview')}</p>
      {view.follow ? (
        <FollowThread announce={false} className="re-preview-chat" />
      ) : (
        <div className="re-preview-empty">
          <Clock3 aria-hidden strokeWidth={1.5} />
          <p>{t('previewEmpty')}</p>
          {slot && view.bookedAt !== null && view.t >= view.bookedAt ? <p className="demo-num">{x.slot({ day: slot.day, start: slot.start + VISIT_MIN + 5 })}</p> : null}
        </div>
      )}
    </section>
  );
}

function Head() {
  const t = useTranslations('demoRealEstate');
  const { view } = useEstate();
  const x = useEstateText();
  return (
    <ViewHead
      kicker={t('followups.sequence')}
      title={t('followups.title')}
      sub={view.bookedAt !== null && view.t >= view.bookedAt ? t('followups.for', { name: t('people.carolina') }) : t('followups.sequenceSub')}
      aside={<p className="re-stat demo-num">{t('followups.stats', { sent: WEEK.followups, pct: x.fmt.pct(WEEK.followReplyPct) })}</p>}
    />
  );
}

export function PhoneFollowups() {
  return (
    <div className="flex flex-col gap-[0.9em] pt-[0.3em]">
      <Head />
      <Sequence />
      <Preview className="re-preview-phone" />
    </div>
  );
}

export function LaptopFollowups() {
  return (
    <div className="flex flex-col gap-[1em]">
      <Head />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] items-start gap-[1.2em]">
        <Sequence />
        <Preview className="re-preview-laptop" />
      </div>
    </div>
  );
}
