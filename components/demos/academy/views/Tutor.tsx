'use client';

import { useTranslations } from 'next-intl';
import { Card, Readout } from '../../kit';
import { COMMON_ERRORS, TUTOR_TODAY } from '../data';
import { useAcademy } from '../context';
import { Marked, ViewHead, useAcademyText } from '../ui';
import { SpeakingSession, TutorChat } from './Student';

/** What the tutor corrects most today (one story per bar: "th" leads). */
function CommonErrors() {
  const t = useTranslations('demoAcademy.tutorView');
  const { fmt } = useAcademyText();
  const max = Math.max(...COMMON_ERRORS.map((e) => e.share));
  return (
    <Card className="atrio-panel atrio-errors" as="section">
      <h3 className="atrio-h3">{t('errors')}</h3>
      <ol className="atrio-errors-list" aria-label={t('errorsLabel')}>
        {COMMON_ERRORS.map((e, i) => (
          <li key={e.id} data-top={i === 0 ? '' : undefined}>
            <span className="atrio-errors-name">
              <span className="block truncate font-semibold">{t(`errorNames.${e.id}`)}</span>
              <span className="block truncate text-[0.86em] text-[var(--demo-muted)]">{t(`errorEx.${e.id}`)}</span>
            </span>
            <span className="atrio-errors-bar" aria-hidden>
              <span style={{ transform: `scaleX(${e.share / max})` }} />
            </span>
            <span className="demo-mono">{fmt.pct(e.share)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/** The tutor's day as one readout strip (the share solved without a teacher is the one that matters). */
function TutorKpis({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoAcademy.tutorView');
  const { view } = useAcademy();
  const { fmt } = useAcademyText();
  const corrections = TUTOR_TODAY.corrections + (view.tutor.at.fix !== undefined ? 1 : 0) + (view.t >= view.speakEnd ? 1 : 0);
  const sessions = TUTOR_TODAY.sessions + (view.t >= view.speakEnd ? 1 : 0);
  const cells = [
    { id: 'corrections', value: <Readout value={corrections} />, hint: t('correctionsHint') },
    { id: 'sessions', value: <Readout value={sessions} />, hint: t('sessionsHint') },
    ...(compact ? [] : [{ id: 'solved', value: fmt.pct(TUTOR_TODAY.solved), hint: t('solvedHint'), key: true }]),
  ];
  return (
    <dl className="atrio-strip" data-cols={cells.length}>
      {cells.map((c) => (
        <div key={c.id} data-key={'key' in c && c.key ? '' : undefined}>
          <dt>{t(c.id)}</dt>
          <dd className="atrio-strip-n">
            {'key' in c && c.key ? <Marked>{c.value}</Marked> : c.value}
          </dd>
          <dd className="atrio-strip-hint">{c.hint}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LaptopTutor() {
  const t = useTranslations('demoAcademy.tutorView');
  const { first } = useAcademyText();
  return (
    <div className="flex flex-col gap-[0.85em]">
      <ViewHead index={t('index')} title={t('title')} sub={t('sub')} />
      <TutorKpis />
      <div className="atrio-cols-tutor">
        <div className="flex min-w-0 flex-col gap-[0.6em]">
          <p className="atrio-label">{t('liveSpeaking', { name: first('valentina') })}</p>
          <SpeakingSession variant="compact" className="atrio-speak-laptop" />
          <CommonErrors />
        </div>
        <div className="flex min-w-0 flex-col gap-[0.6em]">
          <p className="atrio-label">{t('liveWriting', { name: first('valentina') })}</p>
          <TutorChat className="atrio-chat-laptop" />
        </div>
      </div>
    </div>
  );
}

export function PhoneTutor() {
  const t = useTranslations('demoAcademy.tutorView');
  return (
    <div className="atrio-school-phone">
      <ViewHead index={t('index')} title={t('title')} />
      <TutorKpis compact />
      <CommonErrors />
    </div>
  );
}
