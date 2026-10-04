'use client';

import { useMemo } from 'react';
import { CalendarCheck, MapPin, Search } from 'lucide-react';
import type { ChatScript, VoiceScript } from '../kit';
import { MARTINA_OPTIONS, STORY, dayDate, type ProId, type TreatmentId } from './data';
import { martinaScript, type ClinicView } from './story';
import { useClinicText } from './ui';

/** A small appointment card used inside chats (date tile + details). */
export function ApptCard({ day, time, lines, tone = 'accent' }: { day: number; time: string; lines: string[]; tone?: 'accent' | 'blush' }) {
  const { fmt } = useClinicText();
  const date = dayDate(day);
  return (
    <span className="clinic-apptcard" data-tone={tone}>
      <span className="clinic-apptcard-date" aria-hidden>
        <span className="clinic-apptcard-wd">{fmt.date(date, { weekday: 'short' }).replace('.', '')}</span>
        <span className="clinic-apptcard-d">{fmt.date(date, { day: 'numeric' })}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{time}</span>
        {lines.map((l) => (
          <span key={l} className="block truncate text-[0.9em] opacity-80">
            {l}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Every script of the demo, in the current locale. */
export function useClinicScripts() {
  const c = useClinicText();
  const { t, fmt, pro, treatment, option, day } = c;

  return useMemo(() => {
    const m = STORY.martina;
    const martina: ChatScript = martinaScript(
      (step) => {
        const values = {
          name: t('firstNames.martina'),
          time: fmt.time(m.start),
          pro: pro(m.pro),
          treatment: treatment(m.treatment).toLowerCase(),
          // The slot of "moved" is filled in by the chat view once Martina picks it.
          slot: '',
        };
        if (step.startsWith('note')) return { text: t(`chat.martina.${step}`, values) };
        return { text: t(`chat.martina.${step}`, values) };
      },
      (id) => (id.startsWith('opt') ? option(Number(id.slice(3))) : t(`chat.martina.replies.${id}`)),
    );
    // The "moved" message carries the new appointment as a card.
    const moved = (index: number) => {
      const o = MARTINA_OPTIONS[index];
      return <ApptCard day={o.day} time={fmt.time(o.start)} lines={[treatment(m.treatment), pro(m.pro)]} />;
    };

    const voiceTexts = (target: ClinicView['callTarget']): { texts: string[]; icons: VoiceScript['lines'][number]['icon'][] } => {
      const freed = target && target.pro === m.pro && target.start === m.start;
      const values = { time: target ? fmt.time(target.start) : '', pro: target ? pro(target.pro) : '', name: t('firstNames.julian') };
      return {
        texts: [
          t('call.lines.hello'),
          t('call.lines.ask'),
          target ? t('call.lines.check', values) : t('call.lines.checkNone'),
          target ? t(freed ? 'call.lines.offerFreed' : 'call.lines.offer', values) : t('call.lines.offerNone'),
          t('call.lines.accept', { name: t('fullNames.julian') }),
          target ? t('call.lines.booked', values) : t('call.lines.bookedNone'),
          t('call.lines.bye', values),
        ],
        icons: [undefined, undefined, Search, undefined, undefined, CalendarCheck, undefined],
      };
    };

    /**
     * The WhatsApp thread a patient gets after booking: Camila's plays on the story clock inside
     * the "online" beat; the visitor's shows at once (it is the answer to their own booking).
     */
    const patient = (b: { name: string | null; day: number; start: number; treatment: TreatmentId; pro: ProId }): ChatScript => ({
      start: 'conf',
      steps: {
        conf: {
          from: 'bot',
          typingMs: 150,
          text: b.name ? t('chat.patient.conf', { name: b.name }) : t('chat.patient.confYou'),
          card: <ApptCard day={b.day} time={fmt.time(b.start)} lines={[treatment(b.treatment), pro(b.pro)]} tone="blush" />,
          next: 'remind',
        },
        remind: {
          from: 'bot',
          typingMs: 1300,
          text: t('chat.patient.remind'),
          replies: [
            { id: 'map', label: t('chat.patient.replies.map'), goto: 'map' },
            { id: 'change', label: t('chat.patient.replies.change'), goto: 'change' },
            { id: 'bye', label: t('chat.patient.replies.bye'), goto: 'bye' },
          ],
        },
        map: {
          from: 'bot',
          text: t('chat.patient.map'),
          card: (
            <span className="clinic-mapcard" aria-hidden>
              <MapPin strokeWidth={2} />
            </span>
          ),
        },
        change: { from: 'bot', text: t('chat.patient.change') },
        bye: { from: 'bot', text: b.name ? t('chat.patient.bye', { name: b.name }) : t('chat.patient.byeYou') },
      },
    });

    /** The site's chatbot: opened by the visitor, it answers at once (no automatic replies). */
    const faq: ChatScript = {
      start: 'hi',
      steps: {
        hi: {
          from: 'bot',
          typingMs: 700,
          text: t('chat.faq.hi'),
          replies: [
            { id: 'whitening', label: t('chat.faq.replies.whitening'), goto: 'whitening' },
            { id: 'insurance', label: t('chat.faq.replies.insurance'), goto: 'insurance' },
            { id: 'book', label: t('chat.faq.replies.book'), goto: 'offer' },
          ],
        },
        whitening: { from: 'bot', typingMs: 1300, text: t('chat.faq.whitening'), next: 'offer' },
        insurance: { from: 'bot', typingMs: 1300, text: t('chat.faq.insurance'), next: 'offer' },
        offer: {
          from: 'bot',
          typingMs: 900,
          text: t('chat.faq.offer'),
          replies: [
            { id: 'yes', label: t('chat.faq.replies.yes'), goto: 'slots' },
            { id: 'later', label: t('chat.faq.replies.later'), goto: 'later' },
          ],
        },
        slots: {
          from: 'bot',
          typingMs: 1100,
          text: t('chat.faq.slots', { pro: pro('lucia') }),
          card: (
            <span className="clinic-slotchips" aria-hidden>
              {MARTINA_OPTIONS.map((o) => (
                <span key={`${o.day}-${o.start}`}>
                  {day(o.day)} · {fmt.time(o.start)}
                </span>
              ))}
            </span>
          ),
          next: 'note',
        },
        note: { from: 'note', text: t('chat.faq.note') },
        later: { from: 'bot', typingMs: 900, text: t('chat.faq.later') },
      },
    };

    return { martina, moved, voiceTexts, patient, faq };
  }, [t, fmt, pro, treatment, option, day]);
}
