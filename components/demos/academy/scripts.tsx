'use client';

import { useMemo, type ReactNode } from 'react';
import { BookOpen, Clock4, CreditCard, Landmark, Play } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import type { ChatScript } from '../kit';
import { NEXT_LEVEL, type PromptId } from './data';
import { SITE_FLOW, TUTOR_FLOW, WA_FLOW, scriptFrom, speakScript, type AcademyScripts } from './story';
import { useAcademy } from './context';
import { Marked, useAcademyText } from './ui';

/** The recommended course in the site chat (reads the level the test produced). */
function CourseCard() {
  const { view, ticketUsd } = useAcademy();
  const { t, course } = useAcademyText();
  const { format } = useCurrency();
  const level = view.siteLevel ?? 'A2';
  return (
    <span className="atrio-coursecard">
      <span className="atrio-coursecard-level" aria-hidden>
        {NEXT_LEVEL[level]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{course('en', NEXT_LEVEL[level])}</span>
        <span className="block opacity-80">{t('site.courseMeta')}</span>
        <span className="atrio-coursecard-price demo-mono">{t('site.perMonth', { price: format(ticketUsd) })}</span>
      </span>
    </span>
  );
}

function ResultText() {
  const { view } = useAcademy();
  const { t, course } = useAcademyText();
  const level = view.siteLevel ?? 'A2';
  return <>{t.rich('site.result', { level, course: course('en', NEXT_LEVEL[level]), b: (c) => <b className="atrio-strong">{c}</b> })}</>;
}

function PaidText() {
  const { view } = useAcademy();
  const { t } = useAcademyText();
  return <>{view.siteMine ? t('site.paidYou') : t('site.paid', { name: t('first.julieta') })}</>;
}

function Receipt({ pay }: { pay: 'card' | 'transfer' }) {
  const { view, ticketUsd } = useAcademy();
  const { t, course } = useAcademyText();
  const { format } = useCurrency();
  const level = view.siteLevel ?? 'A2';
  const Icon = pay === 'card' ? CreditCard : Landmark;
  return (
    <span className="atrio-receipt">
      <span className="atrio-receipt-row">
        <span>{course('en', NEXT_LEVEL[level])}</span>
        <span className="demo-mono">{format(ticketUsd)}</span>
      </span>
      <span className="atrio-receipt-row atrio-receipt-meta">
        <span className="inline-flex items-center gap-[0.35em]">
          <Icon aria-hidden strokeWidth={1.8} />
          {t(`pay.${pay}`)}
        </span>
        <span>{t('site.approved')}</span>
      </span>
    </span>
  );
}

/** The express lesson card in Martín's WhatsApp. */
function ExpressCard() {
  const { t } = useAcademyText();
  return (
    <span className="atrio-express">
      <span className="atrio-express-icon" aria-hidden>
        <BookOpen strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{t('wa.cardTitle')}</span>
        <span className="flex items-center gap-[0.3em] opacity-75">
          <Clock4 aria-hidden className="size-[1em]" strokeWidth={1.8} />
          {t('wa.cardMeta')}
        </span>
      </span>
      <span className="atrio-express-play" aria-hidden>
        <Play strokeWidth={2} />
      </span>
    </span>
  );
}

/** Every script of the demo, in the current locale. */
export function useAcademyScripts(ticketUsd: number): AcademyScripts {
  const { t } = useAcademyText();
  const { format } = useCurrency();

  return useMemo(() => {
    const tutorContent = (step: string): Partial<ChatScript['steps'][string]> => {
      switch (step) {
        case 'msg':
          return { text: t('tutor.msg') };
        case 'fix':
          return {
            text: (
              <>
                <span className="atrio-fix">
                  {t.rich('tutor.fix', {
                    bad: (c) => <del className="atrio-del">{c}</del>,
                    good: (c) => <Marked className="atrio-good">{c}</Marked>,
                  })}
                </span>
                <span className="atrio-why">{t('tutor.why')}</span>
              </>
            ),
          };
        case 'quiz':
          return {
            text: (
              <>
                <span className="atrio-quiz-k">{t('tutor.quizKicker')}</span>
                <span className="atrio-quiz">{t.rich('tutor.quiz', { gap: (c) => <span className="atrio-gap">{c}</span> })}</span>
              </>
            ),
          };
        case 'right':
          return { text: t('tutor.right', { points: 20 }) };
        case 'wrong':
          return { text: t('tutor.wrong', { points: 5 }) };
        default:
          return {};
      }
    };
    const tutor = scriptFrom(TUTOR_FLOW, tutorContent, (_s, id) => t(`tutor.replies.${id}`));

    const siteContent = (step: string): Partial<ChatScript['steps'][string]> => {
      switch (step) {
        case 'courses':
          return { text: t('site.courses', { price: format(ticketUsd) }) };
        case 'result':
          return { text: <ResultText />, card: <CourseCard /> };
        case 'paidCard':
          return { text: <PaidText />, card: <Receipt pay="card" /> };
        case 'paidTransfer':
          return { text: t('site.paidTransfer') };
        default:
          return { text: t(`site.${step}`) };
      }
    };
    const siteLabel = (_s: string, id: string) => t(`site.replies.${id}`);
    const site = scriptFrom(SITE_FLOW, siteContent, siteLabel);
    const siteMine = scriptFrom(SITE_FLOW, siteContent, siteLabel, { auto: false });

    const wa = scriptFrom(
      WA_FLOW,
      (step) => (step === 'nudge' ? { text: t('wa.nudge', { name: t('first.martin') }), card: <ExpressCard /> } : { text: t(`wa.${step}`, { name: t('first.martin') }) }),
      (_s, id) => t(`wa.replies.${id}`),
    );

    const speakTexts = (p: PromptId) => [0, 1, 2, 3, 4, 5].map((i) => t(`speak.${p}.l${i}`));
    const speak = (p: PromptId) => speakScript(speakTexts(p));

    return { tutor, site, siteMine, wa, speak };
  }, [t, format, ticketUsd]);
}

/** A transcript line with the caught word circled and the right one underlined. */
export function useMarkWords() {
  const { t } = useAcademyText();
  return useMemo(() => {
    const bad = t('speak.badWord').toLowerCase();
    const good = t('speak.goodWord').toLowerCase();
    return (text: string): ReactNode[] =>
      text.split(/(\s+)/).map((w, i) => {
        const clean = w.toLowerCase().replace(/[^a-z]/g, '');
        if (clean === bad) return <Marked key={i} mark="circle" className="atrio-word-bad">{w}</Marked>;
        if (clean === good) return <Marked key={i} className="atrio-word-good">{w}</Marked>;
        return w;
      });
  }, [t]);
}
