'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpenText, CalendarDays, Globe, House, LayoutDashboard, MessageSquareText, Mic, Route, Smartphone, Sparkles, Users, UsersRound } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import type { SoundName } from '@/lib/sound/types';
import { verticalById } from '@/lib/content';
import { AppShell, nextBeat, usePairedStore, useStory, type NavItem, type ShellLayout } from '../kit';
import type { DemoProps } from '../types';
import { ATRIO_THEME } from './data';
import { createAcademyStore, deriveAcademy, isOffNow, type AcademyEvent, type StudentTab } from './story';
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
const STUDENT_TABS: { id: StudentTab; icon: NavItem['icon']; tour?: string }[] = [
  { id: 'home', icon: House },
  { id: 'course', icon: Route },
  { id: 'speak', icon: Mic, tour: 'speaking' },
  { id: 'tutor', icon: MessageSquareText, tour: 'tutor' },
  { id: 'class', icon: UsersRound, tour: 'ranking' },
];

/**
 * Shell variant: a school's notebook — an index of sections down the side (the sidebar with thin
 * line icons, roomy rows) on desktop; on the phone, notebook tabs: scrollable pills under the app
 * bar instead of a bottom bar (student app and school panel alike).
 */
const LAYOUT: ShellLayout = { nav: 'sidebar', density: 'airy', icons: 'line' };

/** Where the visitor took Valentina's phone (reset with the story). */
interface PhoneNav {
  loop: number;
  tab: StudentTab;
  overlay: boolean;
}

/**
 * The visitor's latest own action (store events marked `mine`), shown as a short local toast:
 * it appears when their click changes the store and a timer that the change started clears it.
 */
function useFlash(events: AcademyEvent[], loop: number): AcademyEvent | null {
  const ids = events.map((e) => e.id).join('|');
  const [seen, setSeen] = useState({ loop, ids });
  const [flash, setFlash] = useState<AcademyEvent | null>(null);
  if (seen.loop !== loop || seen.ids !== ids) {
    const before = new Set(seen.ids.split('|'));
    const added = seen.loop === loop ? events.filter((e) => e.mine && !before.has(e.id)) : [];
    setSeen({ loop, ids });
    setFlash(added.length ? added[added.length - 1] : seen.loop !== loop ? null : flash);
  }
  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 3000);
    return () => window.clearTimeout(id);
  }, [flash]);
  return flash;
}

/**
 * Atrio Idiomas (vertical "academias"): an online language school.
 * - laptop: the school's panel (sidebar): today, students + follow-up board + nudges, courses,
 *   live classes, the AI tutor, enrollments + the public site with its level-test bot.
 * - phone alone: Valentina's student app (lesson, speaking with the AI, tutor chat, course
 *   map, class ranking) with a switch to the school's panel.
 * - phone next to the laptop: Valentina's phone, paired with the panel.
 * Nothing plays on its own: five beats from the SimBar (story.ts). The student's "Empezar"
 * starts the speaking beat; everything else the visitor does is local demo data, shown at once.
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
  const flash = useFlash(view.events, snap.loop);

  const [tab, setTab] = useState<SchoolTab>('today');
  const [mode, setMode] = useState<'student' | 'school'>('student');
  const [navState, setNav] = useState<PhoneNav | null>(null);
  const nav = navState && navState.loop === snap.loop ? navState : { loop: snap.loop, tab: 'home' as StudentTab, overlay: false };
  const patchNav = (patch: Partial<PhoneNav>) => setNav({ ...nav, ...patch });
  const studentApp = screen === 'phone' && (studentOnly || mode === 'student');
  const upcoming = nextBeat(store, snap);

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
    flash,
    nextBeat: upcoming?.id ?? null,
    playing: !!snap.playing,
    go: (id) => {
      setTab(id);
      if (active) play('select');
    },
    student: {
      tab: nav.tab,
      overlay: nav.overlay,
      open: (id) => patchNav({ tab: id, overlay: false }),
      openOverlay: () => {
        patchNav({ overlay: true });
        if (active) play('open');
      },
      closeOverlay: () => {
        patchNav({ overlay: false });
        if (active) play('close');
      },
    },
    playBeat: (id) => {
      store.play?.(id);
      if (active) play('select');
    },
    run: (fn, sound) => {
      const before = view.completeAt;
      store.update(fn);
      const next = store.getSnapshot();
      const after = deriveAcademy(next.state, next.t, snap.reduced, scripts);
      // The visitor's own answer completed the lesson (B1 or not): celebrate it (a reaction to their click).
      if (before === null && after.completeAt !== null && studentApp) {
        patchNav({ overlay: true });
        if (active) play('success');
        return;
      }
      if (active && sound) play(sound);
    },
  };

  const clock = fmt.time(view.clock);
  const nudgesOn = !isOffNow(snap.state.off);
  const sim = { store, label: (id: string) => t(`sim.${id}`), note: t('sim.note'), tour: 'sim', announce };

  /* ---- phone: Valentina's student app (alone, or paired with the laptop) ---- */
  if (studentApp) {
    const View = STUDENT_VIEWS[nav.tab];
    const studentNav: NavItem[] = STUDENT_TABS.map((s) => ({ id: s.id, label: t(`student.tabs.${s.id}`), icon: s.icon, tour: s.tour }));
    return (
      <AcademyProvider value={ctx}>
        <AppShell
          screen="phone"
          theme={ATRIO_THEME}
          business={business}
          logo={<AtrioMark />}
          logoStyle="plain"
          nav={studentNav}
          current={nav.tab}
          onNavigate={(id) => ctx.student.open(id as StudentTab)}
          phoneNav="top"
          headerRight={studentOnly ? <StudentAvatarChip /> : <ModeSwitch mode="student" onChange={setModeWithSound(setMode, active, play)} />}
          active={active}
          rootRef={ref}
          statusTime={clock}
          sim={sim}
          contentClassName="atrio-board"
          overlay={<LevelUp key={snap.loop} />}
          overlayOpen={nav.overlay}
          overlayOrigin={['50%', '45%']}
        >
          <div className="atrio" data-screen="phone" data-app="student">
            <AcademyToasts placement="top" only={(e) => e.who === 'valentina'} />
            <div key={`${nav.tab}-${snap.loop}`} className="demo-view">
              <View />
            </div>
            <Announcer />
          </div>
        </AppShell>
      </AcademyProvider>
    );
  }

  /* ---- the school's panel (laptop, or the phone alone in school mode) ---- */
  const schoolNav: NavItem[] =
    screen === 'laptop'
      ? [
          { id: 'today', label: t('nav.today'), icon: LayoutDashboard },
          { id: 'students', label: t('nav.students'), icon: Users, badge: view.kpi.atRisk, group: t('nav.groupSchool'), tour: 'followup' },
          { id: 'courses', label: t('nav.courses'), icon: BookOpenText },
          { id: 'live', label: t('nav.live'), icon: CalendarDays },
          { id: 'tutor', label: t('nav.tutor'), icon: Sparkles, group: t('nav.groupGrowth'), tour: 'tutor' },
          { id: 'site', label: t('nav.site'), icon: Globe, tour: 'enroll' },
        ]
      : [
          { id: 'today', label: t('nav.todayShort'), icon: LayoutDashboard },
          { id: 'students', label: t('nav.studentsShort'), icon: Users, badge: view.kpi.atRisk, tour: 'followup' },
          { id: 'site', label: t('nav.siteShort'), icon: Globe, tour: 'enroll' },
          { id: 'courses', label: t('nav.courses'), icon: BookOpenText },
          { id: 'live', label: t('nav.live'), icon: CalendarDays },
          { id: 'tutor', label: t('nav.tutor'), icon: Sparkles, tour: 'tutor' },
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
        layout={LAYOUT}
        phoneNav="top"
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
                <span aria-hidden className="atrio-toppill-dot" />
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
        sim={sim}
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
