'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpenText, CalendarDays, Globe, House, LayoutDashboard, MessageSquareText, Mic, Route, Smartphone, Sparkles, Users, UsersRound } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import type { SoundName } from '@/lib/sound/types';
import { verticalById } from '@/lib/content';
import { AppShell, LiveDot, usePairedStore, useStory, type NavItem } from '../kit';
import type { DemoProps } from '../types';
import { ATRIO_THEME } from './data';
import { createAcademyStore, deriveAcademy, isOffNow, type StudentTab } from './story';
import { AcademyProvider, type AcademyCtx, type SchoolTab } from './context';
import { useAcademyScripts } from './scripts';
import { AcademyToasts, Announcer, AtrioMark, useAcademyText } from './ui';
import { LevelUp, StudentAvatarChip, StudentClass, StudentCourse, StudentHome, StudentSpeak, StudentTutor } from './views/Student';
import { LaptopToday, PhoneToday } from './views/Today';
import { LaptopStudents, PhoneStudents } from './views/Students';
import { LaptopCourses, PhoneCourses } from './views/Courses';
import { LaptopLive, PhoneLive } from './views/Live';
import { LaptopTutor, PhoneTutor } from './views/Tutor';
import { LaptopSite, PhoneSite } from './views/Site';
import './atrio.css';

const SCHOOL_VIEWS: Record<SchoolTab, Record<DemoProps['screen'], () => ReactNode>> = {
  today: { laptop: LaptopToday, phone: PhoneToday },
  students: { laptop: LaptopStudents, phone: PhoneStudents },
  courses: { laptop: LaptopCourses, phone: PhoneCourses },
  live: { laptop: LaptopLive, phone: PhoneLive },
  tutor: { laptop: LaptopTutor, phone: PhoneTutor },
  site: { laptop: LaptopSite, phone: PhoneSite },
};
const STUDENT_VIEWS: Record<StudentTab, () => ReactNode> = {
  home: StudentHome,
  course: StudentCourse,
  speak: StudentSpeak,
  tutor: StudentTutor,
  class: StudentClass,
};
const STUDENT_TABS: { id: StudentTab; icon: NavItem['icon'] }[] = [
  { id: 'home', icon: House },
  { id: 'course', icon: Route },
  { id: 'speak', icon: Mic },
  { id: 'tutor', icon: MessageSquareText },
  { id: 'class', icon: UsersRound },
];

/** Where the visitor took Valentina's phone (null: the story drives it). Reset every loop. */
interface PhoneNav {
  loop: number;
  tab: StudentTab;
  /** The visitor closed the lesson-complete layer. */
  dismissed: boolean;
}

const SUCCESS = new Set(['enrolled', 'levelUp', 'back', 'review']);

/**
 * Atrio Idiomas (vertical "academias"): an online language school.
 * - laptop: the school's panel (collapsible sidebar): today, students + nudges, courses,
 *   live classes, the AI tutor, enrollments + the public site with its level-test bot.
 * - phone alone: Valentina's student app (lesson, speaking with the AI, tutor chat,
 *   course map, class ranking) with a switch to the school's panel.
 * - phone next to the laptop: Valentina's phone, paired with the panel.
 * One 30 s story (story.ts) drives every screen.
 */
export default function AcademyDemo({ screen, active }: DemoProps) {
  const vertical = verticalById('academias')!;
  const business = vertical.business ?? '';
  const ticketUsd = vertical.calculator.ticketUsd;
  const keyNumber = vertical.keyNumber?.value ?? 0;
  const t = useTranslations('demoAcademy');
  const { fmt, day } = useAcademyText();
  const { play } = useSound();

  const { store, paired, ref } = usePairedStore('academy', createAcademyStore);
  const snap = useStory(store, active);
  const scripts = useAcademyScripts(ticketUsd);
  const view = useMemo(() => deriveAcademy(snap.state, snap.t, snap.reduced, scripts), [snap.state, snap.t, snap.reduced, scripts]);
  const announce = screen === 'laptop' || !paired;
  const studentOnly = screen === 'phone' && paired;

  const [tab, setTab] = useState<SchoolTab>('today');
  const [mode, setMode] = useState<'student' | 'school'>('student');
  const [nav, setNav] = useState<PhoneNav | null>(null);

  /* ---- Valentina's phone: the story drives it until the visitor takes over ---- */
  const mine = nav && nav.loop === snap.loop ? nav : null;
  const sTab = mine ? mine.tab : view.scene.tab;
  const sOverlay = view.scene.overlay && !mine?.dismissed;
  const takeOver = (patch: Partial<PhoneNav>) => {
    store.engage();
    setNav((cur) => {
      const base: PhoneNav = cur && cur.loop === snap.loop ? cur : { loop: snap.loop, tab: sTab, dismissed: false };
      return { ...base, ...patch };
    });
  };
  const studentApp = screen === 'phone' && (studentOnly || mode === 'student');

  /* ---- sound: one instance per pair, only while visible ---- */
  const last = view.events[view.events.length - 1];
  const lastId = last?.id ?? '';
  const lastKind = last?.kind;
  const heard = useRef<string | null>(null);
  useEffect(() => {
    const first = heard.current === null;
    heard.current = lastId;
    if (first || !active || !announce || !lastKind) return;
    if (SUCCESS.has(lastKind)) play('success', { volume: lastKind === 'review' ? 0.5 : 1 });
  }, [lastId, lastKind, active, announce, play]);
  const siteOpen = (screen === 'laptop' || mode === 'school') && tab === 'site';
  const waOpen = (screen === 'laptop' || mode === 'school') && tab === 'students';
  useBubbleSound(view.tutor.items.filter((i) => i.from === 'bot').length, active && announce, play);
  useBubbleSound(view.site.items.filter((i) => i.from === 'bot').length, active && announce && siteOpen, play);
  useBubbleSound(view.martin.wa?.items.filter((i) => i.from === 'bot').length ?? 0, active && announce && waOpen, play);

  const ctx: AcademyCtx = {
    screen,
    paired,
    store,
    state: snap.state,
    view,
    t: snap.t,
    loop: snap.loop,
    reduced: snap.reduced,
    active,
    announce,
    business,
    ticketUsd,
    keyNumber,
    go: (id) => {
      setTab(id);
      if (active) play('select');
    },
    student: {
      tab: sTab,
      overlay: sOverlay,
      open: (id) => takeOver({ tab: id }),
      closeOverlay: () => {
        takeOver({ dismissed: true, tab: view.scene.overlay ? 'class' : sTab });
        if (active) play('close');
      },
    },
    run: (fn, sound) => {
      store.update(fn);
      store.engage();
      if (studentApp) takeOver({});
      if (active && sound) play(sound);
    },
  };

  const clock = fmt.time(view.clock);
  const nudgesOn = !isOffNow(snap.state.off);

  /* ---- phone: Valentina's student app (alone, or paired with the laptop) ---- */
  if (studentApp) {
    const View = STUDENT_VIEWS[sTab];
    const studentNav: NavItem[] = STUDENT_TABS.map((s) => ({
      id: s.id,
      label: t(`student.tabs.${s.id}`),
      icon: s.icon,
      badge: s.id === 'speak' && (view.speak.state.phase === 'live' || view.speak.state.phase === 'ringing') ? 'live' : undefined,
    }));
    return (
      <AcademyProvider value={ctx}>
        <AppShell
          screen="phone"
          theme={ATRIO_THEME}
          business={business}
          logo={<AtrioMark />}
          logoStyle="plain"
          nav={studentNav}
          current={sTab}
          onNavigate={(id) => ctx.student.open(id as StudentTab)}
          headerRight={studentOnly ? <StudentAvatarChip /> : <ModeSwitch mode="student" onChange={setModeWithSound(setMode, active, play)} />}
          active={active}
          rootRef={ref}
          statusTime={clock}
          contentClassName="atrio-board"
          overlay={<LevelUp key={snap.loop} />}
          overlayOpen={sOverlay}
          overlayOrigin={['50%', '45%']}
        >
          <div className="atrio" data-screen="phone" data-app="student">
            <div key={`${sTab}-${snap.loop}`} className="demo-view">
              <View />
            </div>
            <Announcer />
          </div>
        </AppShell>
      </AcademyProvider>
    );
  }

  /* ---- the school's panel (laptop, or the phone alone in school mode) ---- */
  const live = view.speak.state.phase === 'live' || view.speak.state.phase === 'ringing' || view.tutor.typing;
  const testing = view.site.items.length > 0 && !view.site.done;
  const schoolNav: NavItem[] =
    screen === 'laptop'
      ? [
          { id: 'today', label: t('nav.today'), icon: LayoutDashboard },
          { id: 'students', label: t('nav.students'), icon: Users, badge: view.kpi.atRisk, group: t('nav.groupSchool') },
          { id: 'courses', label: t('nav.courses'), icon: BookOpenText },
          { id: 'live', label: t('nav.live'), icon: CalendarDays },
          { id: 'tutor', label: t('nav.tutor'), icon: Sparkles, badge: live ? 'live' : undefined, group: t('nav.groupGrowth') },
          { id: 'site', label: t('nav.site'), icon: Globe, badge: testing ? 'live' : undefined },
        ]
      : [
          { id: 'today', label: t('nav.todayShort'), icon: LayoutDashboard },
          { id: 'students', label: t('nav.studentsShort'), icon: Users, badge: view.kpi.atRisk },
          { id: 'site', label: t('nav.siteShort'), icon: Globe, badge: testing ? 'live' : undefined },
          { id: 'courses', label: t('nav.courses'), icon: BookOpenText },
          { id: 'live', label: t('nav.live'), icon: CalendarDays },
          { id: 'tutor', label: t('nav.tutor'), icon: Sparkles, badge: live ? 'live' : undefined },
        ];
  const View = SCHOOL_VIEWS[tab][screen];
  return (
    <AcademyProvider value={ctx}>
      <AppShell
        screen={screen}
        theme={ATRIO_THEME}
        business={business}
        logo={<AtrioMark />}
        logoStyle="plain"
        nav={schoolNav}
        current={tab}
        onNavigate={(id) => setTab(id as SchoolTab)}
        title={
          screen === 'laptop' ? (
            <>
              <p className="atrio-toptitle">{schoolNav.find((n) => n.id === tab)?.label}</p>
              <p className="atrio-topdate">
                {day(0, 'long')} · <span className="demo-mono">{clock}</span>
              </p>
            </>
          ) : undefined
        }
        headerRight={
          screen === 'laptop' ? (
            <>
              <span className="atrio-toppill">
                <LiveDot color="var(--demo-accent)" />
                {t('top.online', { count: view.kpi.online })}
              </span>
              <span className="atrio-coord" aria-hidden>
                {t('top.coordInitials')}
              </span>
            </>
          ) : (
            <ModeSwitch mode="school" onChange={setModeWithSound(setMode, active, play)} />
          )
        }
        sidebarFooter={<SidebarFooter on={nudgesOn} atRisk={view.kpi.atRisk} />}
        active={active}
        rootRef={ref}
        statusTime={clock}
        phoneNav="tabs"
        maxTabs={5}
        contentClassName="atrio-board"
      >
        <div className="atrio" data-screen={screen} data-app="school">
          <AcademyToasts placement={screen === 'phone' ? 'top' : 'bottom-right'} />
          <div key={tab} className="demo-view">
            <View />
          </div>
          <Announcer />
        </div>
      </AppShell>
    </AcademyProvider>
  );
}

/** A soft "type" when a new bot bubble appears (not when the count jumps because a view opened). */
function useBubbleSound(count: number, enabled: boolean, play: (s: SoundName, o?: { volume?: number }) => void) {
  const heard = useRef<number | null>(null);
  useEffect(() => {
    const before = heard.current;
    heard.current = count;
    if (before === null || count !== before + 1 || !enabled) return;
    play('type', { volume: 0.6 });
  }, [count, enabled, play]);
}

const setModeWithSound =
  (set: (m: 'student' | 'school') => void, active: boolean, play: (s: SoundName) => void) =>
  (m: 'student' | 'school') => {
    set(m);
    if (active) play('toggle');
  };

/** Phone alone: the student's app ⇄ the school's panel. */
function ModeSwitch({ mode, onChange }: { mode: 'student' | 'school'; onChange: (m: 'student' | 'school') => void }) {
  const t = useTranslations('demoAcademy.mode');
  return (
    <span className="atrio-mode" role="group" aria-label={t('label')}>
      <button type="button" aria-pressed={mode === 'student'} onClick={() => onChange('student')}>
        <Smartphone aria-hidden strokeWidth={2} />
        <span>{t('student')}</span>
      </button>
      <button type="button" aria-pressed={mode === 'school'} onClick={() => onChange('school')}>
        <LayoutDashboard aria-hidden strokeWidth={2} />
        <span>{t('school')}</span>
      </button>
    </span>
  );
}

function SidebarFooter({ on, atRisk }: { on: boolean; atRisk: number }) {
  const t = useTranslations('demoAcademy.side');
  return (
    <div className="atrio-sidefoot" data-off={on ? undefined : ''}>
      <span className="atrio-sidefoot-mark" aria-hidden>
        <AtrioMark />
      </span>
      <span className="min-w-0 leading-[1.25]">
        <span className="block truncate text-[0.74em] font-semibold">{t('title')}</span>
        <span className="block truncate text-[0.64em] text-[var(--demo-muted)]">{on ? t('on', { count: atRisk }) : t('off')}</span>
      </span>
    </div>
  );
}
