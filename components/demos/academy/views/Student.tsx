'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  AudioLines,
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  Check,
  Flame,
  GraduationCap,
  Lock,
  Mic,
  PenLine,
  Play,
  RotateCcw,
  Sparkles,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import {
  BadgeGrid,
  Calendar,
  ChatWidget,
  Leaderboard,
  Readout,
  Streak,
  Waveform,
  type BadgeItem,
  type CalendarEvent,
  type LeaderRow,
  type WaveLevel,
} from '../../kit';
import { CLASSMATES, CURRENT_UNIT, HERO, HERO_COLOR, LIVE_CLASSES, NEXT_UNITS, PROMPTS, SPEAK_FLOW, SPEAK_SCALE, SPEAK_SCORE, STORY, UNITS, WEEKDAY, storyClock, type BadgeId } from '../data';
import { ASKS, act, isFreshEvent } from '../story';
import { useAcademy } from '../context';
import { keepChatFocus } from '../focus';
import { useMarkWords } from '../scripts';
import { CefrRuler, ChalkCircle, ChalkTick, GoalRing, PersonAvatar, useAcademyText } from '../ui';

/* ------------------------------------------------------------------ */
/* Speaking session (runVoice engine + kit Waveform, own transcript)    */
/* ------------------------------------------------------------------ */
/** Words of the line being spoken, revealed across `ms` from the moment it mounts. */
function SpokenWords({ text, ms, offset, render }: { text: string; ms: number; offset: number; render: (t: string) => ReactNode[] }) {
  // Captured once: later renders must not re-time the running reveal.
  const [start] = useState(offset);
  const words = render(text);
  const count = words.filter((w) => typeof w !== 'string' || w.trim()).length || 1;
  const step = ms / count;
  let n = 0;
  return (
    <>
      {words.map((w, i) => {
        if (typeof w === 'string' && !w.trim()) return w;
        const delay = Math.round(n++ * step - start);
        return (
          <span key={i} className="atrio-word" style={{ animationDelay: `${delay}ms` }}>
            {w}
          </span>
        );
      })}
    </>
  );
}

const TOOL_ICON: LucideIcon[] = [AudioLines, BadgeCheck];

function ScoreCard({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoAcademy.speak');
  const { view } = useAcademy();
  const score = SPEAK_SCORE[view.speak.prompt];
  const rows = [
    { id: 'pron', value: score.pron },
    { id: 'fluency', value: score.fluency },
    { id: 'grammar', value: score.grammar },
  ];
  return (
    <div className="atrio-score" data-compact={compact ? '' : undefined}>
      <div className="atrio-score-main">
        <p className="atrio-label">{t('score')}</p>
        <p className="atrio-score-n">
          <span className="relative inline-block">
            <Readout value={score.total} fromZero className="demo-mono" />
            <ChalkCircle tone="sky" className="atrio-score-circle" />
          </span>
          <span className="atrio-score-of demo-mono">/100</span>
        </p>
      </div>
      <ul className="atrio-score-rows">
        {rows.map((r) => (
          <li key={r.id}>
            <span className="min-w-0 truncate">{t(`scores.${r.id}`)}</span>
            <span className="atrio-score-bar" aria-hidden>
              <span style={{ transform: `scaleX(${r.value / 100})` }} />
            </span>
            <span className="demo-mono">{r.value}</span>
          </li>
        ))}
      </ul>
      {!compact ? <p className="atrio-score-note">{t('improved')}</p> : null}
    </div>
  );
}

/** A 2-minute speaking practice with the AI tutor: live waveform, transcript, pronunciation flags, score. */
export function SpeakingSession({ variant = 'full', className = '' }: { variant?: 'full' | 'compact'; className?: string }) {
  const t = useTranslations('demoAcademy.speak');
  const { view, announce } = useAcademy();
  const { fmt, first } = useAcademyText();
  const mark = useMarkWords();
  const s = view.speak.state;
  const phase = s.phase;
  const log = useRef<HTMLOListElement>(null);
  const level: WaveLevel = phase === 'ringing' ? 'ring' : phase === 'live' ? (s.speaking === 'agent' ? 'agent' : s.speaking === 'caller' ? 'caller' : 'idle') : 'off';
  const status =
    phase === 'idle'
      ? t('status.idle')
      : phase === 'ringing'
        ? t('status.connecting')
        : phase === 'live'
          ? s.speaking === 'tool'
            ? t('status.analyzing')
            : s.speaking === 'caller'
              ? t('status.listening', { name: first('valentina') })
              : t('status.talking')
          : t('status.ended');
  const compact = variant === 'compact';
  const lines = compact ? s.lines.slice(-2) : s.lines;

  useLayoutEffect(() => {
    const el = log.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [s.lines.length]);

  return (
    <section className={`atrio-speak ${className}`} data-beat="speak" data-variant={variant} data-phase={phase} aria-label={t('label', { name: first('valentina') })}>
      <header className="atrio-speak-head">
        <span className="atrio-speak-orb" aria-hidden>
          {phase === 'ringing' || phase === 'live' ? <span className="atrio-speak-rings demo-loop" /> : null}
          <Mic strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1 leading-[1.2]">
          <span className="block truncate text-[0.86em] font-semibold">{t('tutor')}</span>
          <span className="atrio-speak-status block truncate">{status}</span>
        </span>
        {phase !== 'idle' ? (
          <span className="atrio-speak-timer demo-mono" aria-label={t('duration', { time: fmt.duration(s.talkMs * SPEAK_SCALE) })}>
            {fmt.duration(s.talkMs * SPEAK_SCALE)}
          </span>
        ) : null}
      </header>
      {phase === 'ended' && !compact ? <ScoreCard /> : <Waveform level={level} bars={compact ? 26 : 32} className="atrio-wave" />}
      {lines.length ? (
        <ol ref={log} className="atrio-transcript" aria-live={announce ? 'polite' : 'off'} aria-label={t('transcript')}>
          {lines.map((l) => {
            const speaking = l.index === s.current;
            if (l.who === 'tool') {
              const Icon = TOOL_ICON[l.index === SPEAK_FLOW.lines.length - 1 ? 1 : 0];
              return (
                <li key={l.index} className="atrio-line" data-who="tool" data-last={l.index === SPEAK_FLOW.lines.length - 1 ? '' : undefined}>
                  <p className="atrio-flag">
                    <Icon aria-hidden strokeWidth={1.9} />
                    <span>{l.text}</span>
                  </p>
                </li>
              );
            }
            return (
              <li key={l.index} className="atrio-line" data-who={l.who} data-current={speaking ? '' : undefined}>
                <span className="atrio-line-tag">{l.who === 'agent' ? t('tutorTag') : first('valentina')}</span>
                <p className="atrio-line-text">{speaking ? <SpokenWords text={l.text} ms={l.ms} offset={s.elapsed - l.start} render={mark} /> : mark(l.text)}</p>
              </li>
            );
          })}
        </ol>
      ) : phase === 'ringing' ? (
        <p className="atrio-speak-empty">{t('connecting')}</p>
      ) : null}
      {compact && phase === 'ended' ? <ScoreCard compact /> : null}
    </section>
  );
}

/**
 * The topic of the session (the tutor's question) + the picker. Before the lesson's session the
 * visitor picks a topic and starts it (it plays the "speaking" beat); after it, practicing again
 * shows the new result at once.
 */
function TopicCard() {
  const t = useTranslations('demoAcademy.speak');
  const { view, run, playBeat, nextBeat, playing } = useAcademy();
  const phase = view.speak.state.phase;
  const again = view.speakDone;
  const running = phase === 'ringing' || phase === 'live';
  const topic = view.speak.prompt;
  const canStart = !again && !running && !playing && nextBeat === 'speak';
  return (
    <section className="atrio-topic" aria-label={t('topicLabel')}>
      <p className="atrio-label">{t('topic')}</p>
      <p key={topic} className="atrio-topic-q">
        «{t(`question.${topic}`)}»
      </p>
      {!running && view.canPick ? (
        <div className="atrio-prompts" role="group" aria-label={again ? t('again') : t('pick')}>
          <p className="atrio-prompts-k">{again ? t('again') : t('pick')}</p>
          <div className="atrio-prompts-row">
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                className="atrio-prompt"
                aria-pressed={again ? undefined : view.prompt === p}
                onClick={() => run(again ? act.replay(p) : act.pickPrompt(p), 'select')}
              >
                {again ? <RotateCcw aria-hidden strokeWidth={2} /> : null}
                {t(`prompts.${p}`)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {canStart ? (
        <button type="button" className="atrio-btn atrio-start" onClick={() => playBeat('speak')} data-tour="speaking">
          <Mic aria-hidden strokeWidth={2} />
          {t('start')}
        </button>
      ) : null}
      {again ? <p className="atrio-topic-note">{t('againNote')}</p> : null}
    </section>
  );
}

/** Today's lesson as three segments (speaking · writing · exercise). */
function LessonSteps() {
  const t = useTranslations('demoAcademy.student');
  const { view } = useAcademy();
  const speakDone = view.speakDone;
  const quizDone = view.answerAt !== null && view.t >= view.answerAt;
  const complete = view.completeAt !== null && view.t >= view.completeAt;
  const steps = [
    { id: 'step1', done: speakDone },
    { id: 'step2', done: view.tutor.at.fix !== undefined && view.t >= STORY.writing + view.tutor.at.fix },
    { id: 'step3', done: quizDone || complete },
  ];
  const now = steps.findIndex((s) => !s.done);
  return (
    <ol className="atrio-steps" aria-label={t('lessonSteps')}>
      {steps.map((s, i) => (
        <li key={s.id} data-done={s.done ? '' : undefined} data-now={i === now ? '' : undefined}>
          <span className="atrio-steps-bar" aria-hidden />
          <span className="atrio-steps-label">
            <span className="demo-mono">{i + 1}</span> {t(s.id)}
          </span>
          <span className="sr-only">{s.done ? t('done') : i === now ? t('now') : t('pending')}</span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                         */
/* ------------------------------------------------------------------ */
function Activity({ n, icon: Icon, label, done, now }: { n: number; icon: LucideIcon; label: string; done: boolean; now: boolean }) {
  const t = useTranslations('demoAcademy.student');
  return (
    <li className="atrio-activity" data-done={done ? '' : undefined} data-now={now ? '' : undefined}>
      <span className="atrio-activity-n demo-mono" aria-hidden>
        {done ? <ChalkTick /> : n}
      </span>
      <Icon aria-hidden strokeWidth={1.7} className="atrio-activity-icon" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="sr-only">{done ? t('done') : now ? t('now') : t('pending')}</span>
    </li>
  );
}

/** Today's lesson on a ruled notebook page. */
function LessonCard() {
  const t = useTranslations('demoAcademy.student');
  const { view, student } = useAcademy();
  const speakDone = view.speakDone;
  const quizDone = view.answerAt !== null && view.t >= view.answerAt;
  const complete = view.completeAt !== null && view.t >= view.completeAt;
  const started = view.t >= STORY.call;
  const step = complete ? 3 : quizDone ? 3 : speakDone ? 2 : started ? 1 : 0;
  return (
    <section className="atrio-notebook" aria-labelledby="atrio-lesson-h" data-complete={complete ? '' : undefined}>
      <p className="atrio-notebook-k">
        <span>{t('lessonKicker')}</span>
        <span className="demo-mono">6.3</span>
      </p>
      <h3 id="atrio-lesson-h" className="atrio-notebook-title demo-display">
        {t('lessonTitle')}
      </h3>
      <ol className="atrio-activities">
        <Activity n={1} icon={Mic} label={t('act1')} done={speakDone} now={step === 1} />
        <Activity n={2} icon={PenLine} label={t('act2')} done={quizDone} now={step === 2} />
        <Activity n={3} icon={Sparkles} label={t('act3')} done={complete} now={step === 3 && !complete} />
      </ol>
      {complete ? (
        <p className="atrio-notebook-done">
          <Check aria-hidden strokeWidth={2.4} />
          {view.levelUpAt !== null ? t('completeB1') : t('complete')}
        </p>
      ) : null}
      {complete ? (
        <button type="button" className="atrio-btn atrio-btn-ghost atrio-btn-sm atrio-notebook-see" onClick={student.openOverlay}>
          {t('seeResult')}
        </button>
      ) : (
        <button type="button" className="atrio-btn" onClick={() => student.open(speakDone ? 'tutor' : 'speak')}>
          <Play aria-hidden strokeWidth={2.2} />
          {started ? t('continue') : t('start')}
        </button>
      )}
    </section>
  );
}

function StreakCard() {
  const t = useTranslations('demoAcademy.student');
  const { view } = useAcademy();
  const { weekday } = useAcademyText();
  const complete = view.completeAt !== null && view.t >= view.completeAt;
  const week = [0, 1, 2, 3, 4, 5, 6].map((i) => i < WEEKDAY || (i === WEEKDAY && complete));
  return (
    <section className="atrio-card atrio-streakcard" aria-label={t('streakLabel', { count: view.streak })}>
      <Streak days={view.streak} week={week} weekLabels={[0, 1, 2, 3, 4, 5, 6].map(weekday)} today={WEEKDAY} className="atrio-streak" />
    </section>
  );
}

function GoalCard() {
  const t = useTranslations('demoAcademy.student');
  const { view } = useAcademy();
  const done = view.minutes >= HERO.goal;
  return (
    <section className="atrio-card atrio-goal">
      <GoalRing value={view.minutes} goal={HERO.goal} label={t('goalLabel', { value: view.minutes, goal: HERO.goal })}>
        <span className="atrio-ring-n demo-mono" aria-hidden>
          <Readout value={view.minutes} />
        </span>
        <span className="atrio-ring-of demo-mono" aria-hidden>
          /{HERO.goal}
        </span>
      </GoalRing>
      <p className="atrio-goal-text">
        <span className="atrio-label">{t('goal')}</span>
        <span className="block text-[0.72em] leading-[1.3]">{done ? t('goalDone') : t('goalLeft', { count: HERO.goal - view.minutes })}</span>
      </p>
    </section>
  );
}

function NextClass() {
  const t = useTranslations('demoAcademy.student');
  const { view, run } = useAcademy();
  const { fmt, teacher, day } = useAcademyText();
  const club = LIVE_CLASSES.find((c) => c.id === 'club-b1')!;
  const leveled = view.level === 'B1';
  const booked = view.booked !== null && view.t >= view.booked;
  return (
    <section className="atrio-card atrio-next">
      <span className="atrio-next-icon" aria-hidden>
        <Video strokeWidth={1.7} />
      </span>
      <span className="min-w-0 flex-1 leading-[1.25]">
        <span className="atrio-label">{t('nextClass')}</span>
        <span className="block truncate text-[0.8em] font-semibold">{leveled ? t('classes.club-b1') : t('classes.en-a2')}</span>
        <span className="block truncate text-[0.66em] text-[var(--demo-muted)]">
          {leveled ? `${t('today')} · ${fmt.time(club.start)}` : `${day(5)} · ${fmt.time(18 * 60)}`} · {teacher('carla')}
        </span>
      </span>
      {leveled ? (
        booked ? (
          <span className="atrio-pill" data-tone="ok">
            <CalendarCheck aria-hidden strokeWidth={2} />
            {t('booked')}
          </span>
        ) : (
          <button type="button" className="atrio-btn atrio-btn-sm" onClick={() => run(act.book(), 'success')}>
            {t('book')}
          </button>
        )
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                 */
/* ------------------------------------------------------------------ */
export function StudentHome() {
  const t = useTranslations('demoAcademy.student');
  const { view } = useAcademy();
  const { fmt, first, day } = useAcademyText();
  const complete = view.completeAt !== null && view.t >= view.completeAt;
  return (
    <div className="atrio-student">
      <header className="atrio-hello">
        <p className="atrio-index">
          {day(0, 'long')} · <span className="demo-mono">{fmt.time(view.clock)}</span>
        </p>
        <h2 className="atrio-hello-title demo-display">{t('hello', { name: first('valentina') })}</h2>
      </header>
      <section className="atrio-levelcard" aria-labelledby="atrio-level-h">
        <div className="atrio-levelcard-head">
          <p id="atrio-level-h" className="atrio-label">
            {t('yourLevel')}
          </p>
          <p className="atrio-levelcard-pct demo-mono">
            {view.level === 'B1' ? t('levelNew') : complete ? t('levelPending') : t('levelLeft', { pct: Math.round((1 - view.progress) * 100) })}
          </p>
        </div>
        <CefrRuler level={view.level} progress={view.progress} label={t('rulerLabel', { level: view.level, pct: Math.round(view.progress * 100) })} />
      </section>
      <LessonCard />
      <div className="atrio-row2">
        <GoalCard />
        <StreakCard />
      </div>
      <NextClass />
    </div>
  );
}

export function StudentCourse() {
  const t = useTranslations('demoAcademy.student');
  const tc = useTranslations('demoAcademy.course');
  const { view, run, state } = useAcademy();
  const { fmt, day, teacher } = useAcademyText();
  const leveled = view.level === 'B1';
  const complete = view.completeAt !== null && view.t >= view.completeAt;
  const booked = view.booked !== null && view.t >= view.booked;
  const club = LIVE_CLASSES.find((c) => c.id === 'club-b1')!;
  // Her schedule: today + her next two class days (Tue, Thu). After the level up: the B1 group.
  const columns = [
    { id: 'd0', label: t('today'), sub: day(0) },
    { id: 'd5', label: day(5), sub: '' },
    { id: 'd7', label: day(7), sub: '' },
  ];
  const groupStart = leveled ? 19 * 60 : 18 * 60;
  const events: CalendarEvent[] = [
    { id: 'today-a2', column: 'd0', start: 18 * 60, end: 19 * 60, title: t('classes.en-a2'), sub: teacher('carla'), tone: 'neutral', state: 'done' },
    ...(leveled
      ? [
          {
            id: 'club',
            column: 'd0',
            start: club.start,
            end: club.end,
            title: t('classes.club-b1'),
            sub: booked ? t('booked') : t('seats', { count: (club.seats ?? 0) - (club.taken ?? 0) }),
            tone: 'accent2' as const,
            state: booked ? ('mine' as const) : ('ghost' as const),
            fresh: booked && view.booked !== null && isFreshEvent(view.t, { at: view.booked, mine: state.booked !== null }, 2400),
            version: booked ? 'booked' : 'base',
          },
        ]
      : []),
    ...['d5', 'd7'].map((col) => ({
      id: `${col}-${leveled ? 'b1' : 'a2'}`,
      column: col,
      start: groupStart,
      end: groupStart + 60,
      title: leveled ? t('classes.en-b1') : t('classes.en-a2'),
      sub: leveled ? teacher('diego') : teacher('carla'),
      tone: (leveled ? 'accent' : 'ink') as 'accent' | 'ink',
      fresh: leveled && view.levelUpAt !== null && isFreshEvent(view.t, { at: view.levelUpAt, mine: view.answerMine }, 2400),
      version: leveled ? 'b1' : 'base',
    })),
  ];
  return (
    <div className="atrio-student">
      <header className="atrio-hello">
        <p className="atrio-index">{tc('kicker', { level: view.level })}</p>
        <h2 className="atrio-hello-title demo-display">{tc('title')}</h2>
      </header>
      <CefrRuler level={view.level} progress={view.progress} label={t('rulerLabel', { level: view.level, pct: Math.round(view.progress * 100) })} />
      <ol className="atrio-syllabus" aria-label={tc('syllabus')}>
        {UNITS.map((u) => {
          const current = u.id === CURRENT_UNIT;
          const done = u.done + (current && complete ? 1 : 0);
          const full = done >= u.lessons;
          return (
            <li key={u.id} className="atrio-unit" data-state={full ? 'done' : current ? 'now' : 'next'}>
              <span className="atrio-unit-node" aria-hidden>
                {full ? <Check strokeWidth={2.6} /> : <span className="demo-mono">{u.id}</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="atrio-unit-title">
                  <span className="demo-mono atrio-unit-k">{tc('unit', { n: u.id })}</span> {tc(`units.u${u.id}`)}
                </span>
                {current ? (
                  <span className="atrio-lessons">
                    {Array.from({ length: u.lessons }, (_, i) => (
                      <span key={i} className="atrio-lesson" data-done={i < done ? '' : undefined} data-today={i === 2 && !complete ? '' : undefined}>
                        <span className="demo-mono">6.{i + 1}</span>
                        {i === 2 && !complete ? <span className="atrio-lesson-today">{t('today')}</span> : null}
                      </span>
                    ))}
                  </span>
                ) : null}
              </span>
              <span className="atrio-unit-count demo-mono">
                {done}/{u.lessons}
              </span>
            </li>
          );
        })}
        <li className="atrio-unit atrio-unit-level" data-state={leveled ? 'open' : 'locked'}>
          <span className="atrio-unit-node" aria-hidden>
            {leveled ? <GraduationCap strokeWidth={1.8} /> : <Lock strokeWidth={1.8} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="atrio-unit-title">{leveled ? tc('nextOpen') : tc('nextLocked')}</span>
            <span className="block text-[0.64em] text-[var(--demo-muted)]">{NEXT_UNITS.map((n) => tc(`b1.u${n}`)).join(' · ')}</span>
          </span>
          <span className="atrio-unit-count demo-mono">B1</span>
        </li>
      </ol>
      <section className="atrio-card atrio-livecal" aria-labelledby="atrio-live-h">
        <div className="flex items-baseline justify-between gap-[0.6em]">
          <h3 id="atrio-live-h" className="atrio-h3">
            {tc('live')}
          </h3>
          {leveled && !booked ? (
            <button type="button" className="atrio-link" onClick={() => run(act.book(), 'success')}>
              {tc('bookClub', { time: fmt.time(club.start) })}
            </button>
          ) : null}
        </div>
        <Calendar
          label={tc('calendarLabel')}
          columns={columns}
          start={18 * 60}
          end={22 * 60}
          step={30}
          events={events}
          now={view.clock}
          formatTime={fmt.time}
          formatGutter={fmt.gutter}
          rowHeight="1.55em"
          gutter="2.6em"
          times="hours"
          className="atrio-cal"
        />
      </section>
    </div>
  );
}

export function StudentSpeak() {
  const t = useTranslations('demoAcademy.speak');
  return (
    <div className="atrio-student atrio-speakview atrio-fill">
      <header className="atrio-hello">
        <p className="atrio-index">{t('kicker')}</p>
        <h2 className="atrio-hello-title demo-display">{t('title')}</h2>
      </header>
      <LessonSteps />
      <TopicCard />
      <SpeakingSession />
    </div>
  );
}

/** Quick questions to the tutor: the visitor asks, the tutor answers at once (local demo data). */
function AskTutor() {
  const t = useTranslations('demoAcademy.tutor');
  const { state, run } = useAcademy();
  const left = ASKS.filter((id) => !state.asks.includes(id));
  return (
    <div className="atrio-asks">
      {state.asks.map((id) => (
        <div key={id} className="atrio-ask">
          <div className="demo-msg-wrap" data-from="user">
            <div className="demo-msg" data-from="user">
              <div className="demo-msg-text">{t(`asks.${id}.q`)}</div>
            </div>
          </div>
          <div className="demo-msg-wrap" data-from="bot">
            <div className="demo-msg" data-from="bot">
              <div className="demo-msg-text">{t(`asks.${id}.a`)}</div>
            </div>
          </div>
        </div>
      ))}
      {left.length ? (
        <div className="atrio-ask-chips" role="group" aria-label={t('askLabel')} data-tour="tutor">
          <p className="atrio-ask-k">{t('askKicker')}</p>
          {left.map((id) => (
            <button key={id} type="button" className="atrio-prompt" onClick={() => {
                keepChatFocus();
                run(act.ask(id), 'select');
              }}>
              {t(`asks.${id}.q`)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The written practice: Valentina's chat with the AI tutor (+ quick questions). */
export function TutorChat({ className = '', header = true }: { className?: string; header?: boolean }) {
  const t = useTranslations('demoAcademy.tutor');
  const { view, run, announce, playBeat, nextBeat, playing } = useAcademy();
  const { fmt } = useAcademyText();
  const waiting = !view.tutor.items.length && !view.tutor.typing;
  return (
    <ChatWidget
      run={view.tutor}
      variant="widget"
      header={header}
      title={t('title')}
      subtitle={t('subtitle')}
      avatar={<Sparkles aria-hidden strokeWidth={1.8} />}
      stamp={(at) => fmt.time(storyClock(STORY.writing + at))}
      dateLabel={t('date')}
      label={t('label')}
      announce={announce}
      onPick={(step, reply) => {
        keepChatFocus();
        run(act.pickTutor(step, reply), 'select');
      }}
      composer={false}
      footer={
        <>
          {waiting ? (
            <div className="atrio-chat-wait">
              <p>{t('waiting')}</p>
              {nextBeat === 'writing' && !playing ? (
                <button type="button" className="atrio-btn atrio-btn-sm" onClick={() => playBeat('writing')}>
                  <PenLine aria-hidden strokeWidth={2} />
                  {t('playWriting')}
                </button>
              ) : null}
            </div>
          ) : null}
          <AskTutor />
        </>
      }
      className={`atrio-chat ${className}`}
    />
  );
}

export function StudentTutor() {
  const t = useTranslations('demoAcademy.tutor');
  return (
    <div className="atrio-student atrio-tutorview atrio-fill">
      <p className="atrio-index">{t('kicker')}</p>
      <LessonSteps />
      <TutorChat />
    </div>
  );
}

const BADGE_ICON: Record<BadgeId, LucideIcon> = {
  levelB1: GraduationCap,
  speak10: Mic,
  streak7: Flame,
  firstLive: Video,
  words: BookOpen,
  streak30: Flame,
};

export function useBadges(): BadgeItem[] {
  const t = useTranslations('demoAcademy.badges');
  const { view } = useAcademy();
  return view.badges.map((b) => ({
    id: b.id,
    label: t(b.id),
    icon: BADGE_ICON[b.id],
    earned: b.earned,
    progress: b.progress,
    fresh: b.fresh,
    tone: b.id === 'levelB1' ? 'accent2' : b.id === 'speak10' ? 'accent' : b.id.startsWith('streak') ? 'warn' : 'info',
  }));
}

export function useBoardRows(): LeaderRow[] {
  const { view } = useAcademy();
  const { name } = useAcademyText();
  const tc = useTranslations('demoAcademy.class');
  return view.board.map((e) => {
    const mate = CLASSMATES.find((c) => c.id === e.id);
    const me = e.id === 'valentina';
    return {
      id: e.id,
      name: me ? `${name('valentina')} · ${tc('you')}` : name(e.id),
      initials: me ? 'VR' : (mate?.initials ?? '··'),
      color: me ? HERO_COLOR : mate?.color,
      points: e.points,
      delta: e.delta,
      sub: e.id === 'martin' && view.martin.status === 'back' ? tc('martinBack') : undefined,
      me,
    };
  });
}

export function StudentClass() {
  const t = useTranslations('demoAcademy.class');
  const { view } = useAcademy();
  const { fmt } = useAcademyText();
  const rows = useBoardRows();
  const badges = useBadges();
  const climbed = Math.max(0, 4 - view.rank);
  return (
    <div className="atrio-student">
      <header className="atrio-hello">
        <p className="atrio-index">{t('kicker')}</p>
        <h2 className="atrio-hello-title demo-display">{t('title')}</h2>
      </header>
      <section className="atrio-rankcard" aria-label={t('rankLabel', { rank: view.rank, count: rows.length })}>
        <p className="atrio-rank">
          <span className="relative inline-block">
            <span className="demo-mono">#{view.rank}</span>
            <ChalkCircle key={view.rank} tone="salmon" className="atrio-rank-circle" />
          </span>
          <span className="atrio-rank-of demo-mono">/{rows.length}</span>
        </p>
        <p className="atrio-rank-text">
          <span className="block text-[0.8em] font-semibold">
            <Readout value={view.points} className="demo-mono" /> {t('pts')}
          </span>
          <span className="block text-[0.66em] text-[var(--demo-muted)]">{climbed > 0 ? t('climbed', { count: climbed }) : t('keepGoing')}</span>
        </p>
      </section>
      <Leaderboard rows={rows} label={t('boardLabel')} unit={t('pts')} limit={6} className="atrio-board" />
      <section aria-labelledby="atrio-stickers-h">
        <div className="flex items-baseline justify-between">
          <h3 id="atrio-stickers-h" className="atrio-h3">
            {t('stickers')}
          </h3>
          <span className="atrio-label demo-mono">
            {fmt.num(badges.filter((b) => b.earned).length)}/{fmt.num(badges.length)}
          </span>
        </div>
        <BadgeGrid badges={badges} label={t('stickers')} columns={3} className="atrio-stickers" />
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson complete / level up (full-screen layer)                       */
/* ------------------------------------------------------------------ */
export function LevelUp() {
  const t = useTranslations('demoAcademy.levelUp');
  const { view, run, student } = useAcademy();
  const { fmt } = useAcademyText();
  const passed = view.levelUpAt !== null;
  const club = LIVE_CLASSES.find((c) => c.id === 'club-b1')!;
  const booked = view.booked !== null && view.t >= view.booked;
  const gained = view.points - HERO.points;
  return (
    <section className="atrio-levelup" data-passed={passed ? '' : undefined} aria-labelledby="atrio-levelup-h">
      <button type="button" className="atrio-levelup-close" onClick={student.closeOverlay} aria-label={t('close')}>
        <X aria-hidden strokeWidth={2} />
      </button>
      <p className="atrio-index">{t('kicker')}</p>
      {passed ? (
        <div className="atrio-levelup-hero" aria-hidden>
          <span className="atrio-levelup-from demo-mono">A2</span>
          <span className="atrio-levelup-arrow">→</span>
          <span className="atrio-sticker">
            <span className="atrio-sticker-face demo-mono">B1</span>
            <span className="atrio-sticker-glint" />
          </span>
        </div>
      ) : (
        <div className="atrio-levelup-hero" aria-hidden>
          <span className="atrio-sticker" data-tone="sky">
            <span className="atrio-sticker-face demo-mono">{view.streak}</span>
          </span>
        </div>
      )}
      <h2 id="atrio-levelup-h" className="atrio-levelup-title demo-display">
        {passed ? t('titleB1') : t('title')}
      </h2>
      <p className="atrio-levelup-body">{passed ? t('bodyB1') : t('body')}</p>
      <dl className="atrio-levelup-stats">
        <div>
          <dt>{t('streak')}</dt>
          <dd className="demo-mono">{t('days', { count: view.streak })}</dd>
        </div>
        <div>
          <dt>{t('points')}</dt>
          <dd className="demo-mono">+{fmt.num(gained)}</dd>
        </div>
        <div>
          <dt>{t('speaking')}</dt>
          <dd className="demo-mono">{SPEAK_SCORE[view.speak.prompt].total}</dd>
        </div>
      </dl>
      {passed ? (
        booked ? (
          <p className="atrio-pill atrio-levelup-booked" data-tone="ok">
            <CalendarCheck aria-hidden strokeWidth={2} />
            {t('booked', { time: fmt.time(club.start) })}
          </p>
        ) : (
          <button type="button" className="atrio-btn" onClick={() => run(act.book(), 'success')}>
            <CalendarCheck aria-hidden strokeWidth={2} />
            {t('book', { time: fmt.time(club.start) })}
          </button>
        )
      ) : (
        <button type="button" className="atrio-btn" onClick={student.closeOverlay}>
          {t('continue')}
        </button>
      )}
    </section>
  );
}

/** Valentina's streak + avatar (app bar of her phone). */
export function StudentAvatarChip() {
  const { view } = useAcademy();
  const t = useTranslations('demoAcademy.student');
  return (
    <span className="atrio-me">
      <Flame aria-hidden strokeWidth={2} />
      <span className="demo-mono" aria-hidden>
        {view.streak}
      </span>
      <span className="sr-only">{t('streakLabel', { count: view.streak })}</span>
      <PersonAvatar id="valentina" className="atrio-me-av" />
    </span>
  );
}
