'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check, ChevronsUp, Dumbbell, Flame, FlameKindling, Gift, Medal, MessageCircle, ScanLine, Sparkles, Sunrise, Target, Trophy, Users, Zap } from 'lucide-react';
import {
  BadgeGrid,
  CalendarToolbar,
  ChatWidget,
  Leaderboard,
  PushBanner,
  Readout,
  Streak,
  XpBar,
  useCalendarNav,
  type BadgeItem,
  type LeaderRow,
} from '../../kit';
import { DEMOTE, HERO, HERO_BEST_STREAK, LEAGUE, PROMOTE, SECOND_CLASS, memberById, sessionById, sessionsOn, tint, weekdayOf, type MissionId } from '../model';
import { act, canBook, canCheckIn, checkedInAt, isPast, taken, type MemberTab } from '../story';
import { useGym, useGymText } from '../hooks';
import { useChats } from '../scripts';
import { keepChatFocus } from '../focus';
import { MemberAvatar, OrbitaMark, Segments, storyClockAt } from '../parts';

const MISSION_ICON: Record<MissionId, typeof Target> = { comeback: Target, streak3: Flame, friend: Users, newClass: Sparkles };

/* ------------------------------------------------------------------ */
/* Player card                                                          */
/* ------------------------------------------------------------------ */
function PlayerCard() {
  const t = useTranslations('demoGym');
  const { view, member } = useGym();
  const { name } = useGymText();
  return (
    <section className="gym-player gym-cut" aria-label={t('app.player', { name: name(HERO) })}>
      <div className="gym-player-top">
        <MemberAvatar id={HERO} className="gym-player-av" />
        <span className="min-w-0 flex-1">
          <span className="gym-player-name">{name(HERO)}</span>
          <span className="gym-player-league">
            <Trophy aria-hidden strokeWidth={2} />
            {t('league.name')} · #{view.heroRank}
          </span>
        </span>
        <span className="gym-player-lvl" aria-hidden>
          <span className="gym-player-lvl-k">{t('app.lvl')}</span>
          <span className="gym-player-lvl-n demo-display">{String(view.level).padStart(2, '0')}</span>
        </span>
      </div>
      <XpBar level={view.level} xp={view.inLevel} next={view.need} className="gym-xp" />
      {view.levelUpAt !== null ? (
        <button type="button" className="gym-player-reward" onClick={() => member.openOverlay('levelup')}>
          <ChevronsUp aria-hidden strokeWidth={2.2} />
          {t('app.reward', { level: view.level })}
        </button>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The one card that matters right now (away · mission · next class)    */
/* ------------------------------------------------------------------ */
function CheckinButton({ session, big = false }: { session: string; big?: boolean }) {
  const t = useTranslations('demoGym.app');
  const { run } = useGym();
  const { kind } = useGymText();
  const s = sessionById(session);
  return (
    <button
      type="button"
      className="gym-checkin"
      data-big={big ? '' : undefined}
      onClick={() => run(act.checkin(session), 'success')}
      aria-label={s ? t('checkinLabel', { kind: kind(s.kind) }) : undefined}
    >
      <ScanLine aria-hidden strokeWidth={2.2} />
      {t('checkin')}
    </button>
  );
}

function FocusCard() {
  const t = useTranslations('demoGym');
  const { view, run, member } = useGym();
  const { session, fmt } = useGymText();
  const comeback = view.missions.find((m) => m.id === 'comeback')!;
  const today = view.heroSessions.find((id) => canCheckIn(view, id));

  if (view.status === 'churned') {
    return (
      <section className="gym-focus gym-cut" data-tone="off">
        <p className="gym-focus-kicker">{t('app.churnedKicker')}</p>
        <p className="gym-focus-title demo-display">{t('app.churnedTitle')}</p>
        <p className="gym-focus-body">{t('app.churnedBody')}</p>
      </section>
    );
  }
  if (comeback.shown) {
    const done = comeback.doneAt !== null;
    const upcoming = view.heroSessions.filter((id) => !checkedInAt(view, id) && !isPast(view, sessionById(id)!));
    const second = sessionById(SECOND_CLASS)!;
    const needAnother = !done && comeback.progress + upcoming.length < comeback.goal;
    return (
      <section className="gym-focus gym-cut" data-tone={done ? 'done' : 'mission'} data-tour="winback">
        <p className="gym-focus-kicker">
          <Target aria-hidden strokeWidth={2} />
          {t('missions.comeback.kicker')}
          <span className="gym-focus-xp">+{fmt.num(comeback.xp)} XP</span>
        </p>
        <p className="gym-focus-title demo-display">{done ? t('app.missionDone') : t('missions.comeback.title', { count: comeback.goal })}</p>
        <div className="gym-focus-progress">
          <Segments value={comeback.progress} goal={comeback.goal} />
          <span className="demo-num">
            {comeback.progress}/{comeback.goal}
          </span>
        </div>
        {done ? null : today ? (
          <div className="gym-focus-next">
            <span>{t('app.atTheDoor', { class: session(today) })}</span>
            <CheckinButton session={today} big />
          </div>
        ) : needAnother && canBook(view, second) ? (
          <div className="gym-focus-next">
            <span>{t('app.oneMore', { class: session(SECOND_CLASS) })}</span>
            <button type="button" className="gym-btn" data-variant="primary" onClick={() => run(act.book(SECOND_CLASS), 'success')}>
              {t('app.book')}
            </button>
          </div>
        ) : upcoming.length ? (
          <p className="gym-focus-body">
            <span className="gym-focus-label">{t('app.next')}</span> {session(upcoming[0])}
          </p>
        ) : (
          <button type="button" className="gym-btn gym-focus-cta" data-variant="secondary" onClick={() => member.open('classes')}>
            {t('app.seeClasses')}
          </button>
        )}
      </section>
    );
  }
  if (view.status === 'paused') {
    return (
      <section className="gym-focus gym-cut" data-tone="paused" data-tour="winback">
        <p className="gym-focus-kicker">{t('app.pausedKicker')}</p>
        <p className="gym-focus-title demo-display">{t('app.pausedTitle')}</p>
        <p className="gym-focus-body">{t('app.pausedBody')}</p>
      </section>
    );
  }
  return (
    <section className="gym-focus gym-cut" data-tone="away" data-tour="winback">
      <p className="gym-focus-kicker">
        <FlameKindling aria-hidden strokeWidth={2} />
        {t('app.awayKicker')}
      </p>
      <p className="gym-focus-title demo-display">{t('app.awayTitle', { count: view.away })}</p>
      {view.sentAt !== null ? (
        <div className="gym-focus-next">
          <span>{t('app.waArrived')}</span>
          <button type="button" className="gym-btn" data-variant="primary" onClick={() => member.openOverlay('wa')}>
            <MessageCircle aria-hidden strokeWidth={2} />
            {t('app.openWa')}
          </button>
        </div>
      ) : today ? (
        <div className="gym-focus-next">
          <span>{t('app.atTheDoor', { class: session(today) })}</span>
          <CheckinButton session={today} big />
        </div>
      ) : (
        <p className="gym-focus-body">{t('app.awayBody', { best: HERO_BEST_STREAK })}</p>
      )}
    </section>
  );
}

function MissionList() {
  const t = useTranslations('demoGym');
  const { view, run, member } = useGym();
  const { fmt } = useGymText();
  const list = view.missions.filter((m) => m.id !== 'comeback');
  const done = view.missions.filter((m) => m.shown && m.doneAt !== null).length;
  const total = view.missions.filter((m) => m.shown).length;
  const churned = view.status === 'churned';
  return (
    <section className="gym-missions" aria-labelledby="gym-missions-h" data-tour="missions">
      <div className="gym-row-head">
        <h3 id="gym-missions-h" className="gym-h3">
          {t('app.missions')}
        </h3>
        <span className="gym-count demo-num">
          {done}/{total}
        </span>
      </div>
      <ul className="gym-mission-list">
        {list.map((m) => {
          const Icon = MISSION_ICON[m.id];
          const isDone = m.doneAt !== null;
          return (
            <li key={m.id} className="gym-mission" data-done={isDone ? '' : undefined} data-fresh={isDone && !view.gains.find((g) => g.kind === m.id)?.mine && view.t - (m.doneAt ?? 0) < 2200 ? '' : undefined}>
              <span className="gym-mission-icon" aria-hidden>
                {isDone ? <Check strokeWidth={2.6} /> : <Icon strokeWidth={2} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="gym-mission-title">{t(`missions.${m.id}.title`, { count: m.goal })}</span>
                <span className="gym-mission-meta">
                  <Segments value={m.progress} goal={m.goal} />
                  <span className="demo-num">+{fmt.num(m.xp)} XP</span>
                </span>
              </span>
              {isDone || churned ? null : m.id === 'friend' ? (
                <button type="button" className="gym-btn" data-variant="secondary" onClick={() => run(act.friend(), 'success')}>
                  {t('app.sendPass')}
                </button>
              ) : m.id === 'newClass' ? (
                <button type="button" className="gym-btn" data-variant="ghost" onClick={() => member.open('classes')}>
                  {t('app.seeClasses')}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function StreakCard() {
  const t = useTranslations('demoGym');
  const { view } = useGym();
  const { dayShort } = useGymText();
  return (
    <section className="gym-streak gym-cut" data-cold={view.streak === 0 ? '' : undefined}>
      <Streak days={view.streak} week={view.week} weekLabels={[0, 1, 2, 3, 4, 5, 6].map((d) => dayShort(d).slice(0, 1))} today={view.day} />
      <p className="gym-streak-rule">{t('app.streakRule')}</p>
    </section>
  );
}

export function MemberHome() {
  return (
    <div className="gym-member">
      <PlayerCard />
      <FocusCard />
      <StreakCard />
      <MissionList />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Classes: any week, book and check in                                 */
/* ------------------------------------------------------------------ */
export function MemberClasses() {
  const t = useTranslations('demoGym');
  const { view, run } = useGym();
  const { fmt, kind, coach, dayShort, dayNum, dayLong } = useGymText();
  const nav = useCalendarNav({ today: view.day, open: (wd) => wd < 6 });
  const day = nav.day;
  const list = sessionsOn(day);
  const pastDay = day < view.day;
  return (
    <div className="gym-member">
      <CalendarToolbar nav={nav} period={dayLong(day)} views={['day']} compact className="gym-calbar" />
      <div className="gym-days" role="group" aria-label={t('app.pickDay')}>
        {nav.week.map((d) => (
          <button key={d} type="button" className="gym-day" aria-pressed={d === day} data-today={d === view.day ? '' : undefined} data-past={d < view.day ? '' : undefined} onClick={() => nav.setDay(d)}>
            <span>{dayShort(d)}</span>
            <b className="demo-num">{dayNum(d)}</b>
          </button>
        ))}
      </div>
      {pastDay ? <p className="gym-classes-note">{t('app.pastDay')}</p> : null}
      <ul className="gym-sessions">
        {list.map((s) => {
          const n = taken(view, s);
          const left = s.cap - n;
          const mine = view.heroSessions.includes(s.id);
          const checked = checkedInAt(view, s.id);
          const past = isPast(view, s);
          const label = { kind: kind(s.kind), day: dayShort(s.day), time: fmt.time(s.start) };
          return (
            <li key={s.id} className="gym-session gym-cut" data-mine={mine ? '' : undefined} data-past={past && !mine ? '' : undefined}>
              <span className="gym-session-time demo-num">{fmt.gutter(s.start)}</span>
              <span className="min-w-0 flex-1">
                <span className="gym-session-kind demo-display">{kind(s.kind)}</span>
                <span className="gym-session-coach">{coach(s.coach)}</span>
                <span className="gym-session-spots" data-low={left <= 2 && !past ? '' : undefined}>
                  <span className="gym-spots-bar" aria-hidden>
                    <span style={{ transform: `scaleX(${n / s.cap})` }} />
                  </span>
                  {past ? t('class.went', { count: n }) : left > 0 ? t('class.spots', { count: left }) : t('class.full')}
                </span>
              </span>
              {checked ? (
                <span className="gym-session-done">
                  <Check aria-hidden strokeWidth={2.6} />
                  {t('app.checkedIn')}
                </span>
              ) : canCheckIn(view, s.id) ? (
                <CheckinButton session={s.id} />
              ) : mine ? (
                <span className="gym-session-booked">
                  <Check aria-hidden strokeWidth={2.4} />
                  {t('app.booked')}
                </span>
              ) : past ? (
                <span className="gym-session-over">{t('app.over')}</span>
              ) : (
                <button
                  type="button"
                  className="gym-btn"
                  data-variant="secondary"
                  disabled={!canBook(view, s)}
                  onClick={() => run(act.book(s.id), 'success')}
                  aria-label={t('app.bookLabel', label)}
                >
                  {left <= 0 ? t('class.full') : t('app.book')}
                </button>
              )}
            </li>
          );
        })}
        {list.length === 0 ? <li className="gym-classes-note">{t('app.closed', { day: dayLong(day) })}</li> : null}
      </ul>
      {weekdayOf(day) < 6 ? <p className="gym-classes-note">{t('app.bookNote')}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* League + badges                                                      */
/* ------------------------------------------------------------------ */
export function useLeagueRows(): LeaderRow[] {
  const t = useTranslations('demoGym');
  const { view } = useGym();
  const { short } = useGymText();
  return view.league.map((r, i) => {
    const m = memberById(r.id);
    const isHero = r.id === HERO;
    return {
      id: r.id,
      name: short(r.id),
      initials: m.initials,
      color: `color-mix(in oklab, ${tint(m.tint)} 26%, #14161B)`,
      points: r.points,
      delta: isHero && view.heroRankFrom !== view.heroRank ? view.heroRankFrom - view.heroRank : undefined,
      sub: i < PROMOTE ? t('league.up') : i >= LEAGUE.length - DEMOTE ? t('league.down') : undefined,
      me: isHero,
    };
  });
}

export function useBadges(): BadgeItem[] {
  const t = useTranslations('demoGym.badges');
  const { view } = useGym();
  const comeback = view.missions.find((m) => m.id === 'comeback')!;
  const early = view.heroSessions.includes('1-420') ? 0.8 : 0.6;
  const fresh = comeback.doneAt !== null && !view.gains.find((g) => g.kind === 'comeback')?.mine && view.t - comeback.doneAt < 3000;
  return [
    { id: 'comeback', label: t('comeback'), icon: ChevronsUp, earned: comeback.doneAt !== null, progress: comeback.progress / comeback.goal, tone: 'accent', fresh },
    { id: 'streak14', label: t('streak14'), icon: Flame, earned: true, tone: 'accent2' },
    { id: 'level5', label: t('level5'), icon: Zap, earned: true, tone: 'accent' },
    { id: 'early', label: t('early'), icon: Sunrise, earned: false, progress: early, tone: 'accent' },
    { id: 'classes50', label: t('classes50'), icon: Dumbbell, earned: false, progress: Math.min(0.98, 0.84 + 0.02 * view.checkins.length), tone: 'accent' },
    { id: 'gold', label: t('gold'), icon: Medal, earned: false, progress: view.heroRank <= PROMOTE ? 0.9 : 0.2, tone: 'accent2' },
  ];
}

export function LeagueHeader({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoGym.league');
  return (
    <div className="gym-league-head" data-compact={compact ? '' : undefined}>
      <span className="gym-league-medal" aria-hidden>
        <Trophy strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="gym-league-name demo-display">{t('name')}</span>
        <span className="gym-league-sub">{t('ends')}</span>
      </span>
    </div>
  );
}

export function MemberLeague() {
  const t = useTranslations('demoGym');
  const rows = useLeagueRows();
  const badges = useBadges();
  return (
    <div className="gym-member">
      <LeagueHeader />
      <Leaderboard rows={rows} label={t('league.label')} unit="XP" limit={LEAGUE.length} className="gym-board" />
      <p className="gym-classes-note">{t('app.leagueHint')}</p>
      <section aria-labelledby="gym-badges-h" className="gym-badges-wrap">
        <div className="gym-row-head">
          <h3 id="gym-badges-h" className="gym-h3">
            {t('app.badges')}
          </h3>
          <span className="gym-count demo-num">
            {badges.filter((b) => b.earned).length}/{badges.length}
          </span>
        </div>
        <BadgeGrid badges={badges} label={t('app.badges')} columns={3} className="gym-badgegrid" />
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overlays: Lucía's WhatsApp · LEVEL UP                                */
/* ------------------------------------------------------------------ */
export function WaThread() {
  const t = useTranslations('demoGym');
  const { view, run, business, member, announce } = useGym();
  const { fmt, short } = useGymText();
  const { wa } = useChats();
  const sentAt = view.sentAt ?? 0;
  const box = useRef<HTMLDivElement>(null);
  return (
    <div ref={box} className="gym-wa">
      <button type="button" className="gym-wa-back" onClick={member.closeOverlay} aria-label={t('wa.back')}>
        <ArrowLeft aria-hidden strokeWidth={2} />
      </button>
      {wa ? (
        <ChatWidget
          run={wa}
          variant="whatsapp"
          title={business}
          avatar={<OrbitaMark />}
          stamp={(at) => fmt.time(storyClockAt(view, sentAt + at).clock)}
          dateLabel={t('wa.today')}
          label={t('wa.label', { name: short(HERO) })}
          announce={announce}
          onPick={(step, reply) => {
            keepChatFocus(box.current);
            run(act.pickWa(step, reply, sentAt), 'select');
          }}
          composer={false}
          className="gym-wa-chat"
        />
      ) : (
        <p className="gym-wa-empty">{t('wa.empty')}</p>
      )}
    </div>
  );
}

export function LevelUp() {
  const t = useTranslations('demoGym');
  const { view, member } = useGym();
  const { fmt } = useGymText();
  const at = view.levelUpAt ?? 0;
  const gains = view.gains.filter((g) => Math.abs(g.at - at) <= 700 && g.kind !== 'checkin');
  return (
    <div className="gym-lvl" role="dialog" aria-modal="false" aria-labelledby="gym-lvl-h">
      <span className="gym-lvl-rays" aria-hidden />
      <p className="gym-lvl-kicker">{t('levelUp.kicker')}</p>
      <h2 id="gym-lvl-h" className="gym-lvl-title demo-display">
        <span className="sr-only">{t('levelUp.sr', { level: view.level })}</span>
        <span aria-hidden className="gym-lvl-from">
          {String(view.levelFrom).padStart(2, '0')}
        </span>
        <ChevronsUp aria-hidden strokeWidth={2.4} className="gym-lvl-arrow" />
        <span aria-hidden className="gym-lvl-to">
          <Readout value={view.level} format={(n) => String(n).padStart(2, '0')} />
        </span>
      </h2>
      <ul className="gym-lvl-gains">
        {gains.map((g) => (
          <li key={g.id}>
            <span className="demo-num">+{fmt.num(g.xp)} XP</span>
            {t(`levelUp.gain.${g.kind}`)}
          </li>
        ))}
      </ul>
      <div className="gym-lvl-reward">
        <span className="gym-lvl-badge" aria-hidden>
          <ChevronsUp strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{t('levelUp.badgeLevel', { level: view.level })}</span>
          <span className="flex items-center gap-[0.35em] opacity-80">
            <Gift aria-hidden strokeWidth={2} className="h-[1em] w-[1em]" />
            {t('levelUp.reward')}
          </span>
        </span>
      </div>
      <button
        type="button"
        className="gym-lvl-cta"
        onClick={() => {
          member.closeOverlay();
          member.open('league');
        }}
      >
        <Trophy aria-hidden strokeWidth={2} />
        {t('levelUp.cta')}
      </button>
      <button type="button" className="gym-lvl-close" onClick={member.closeOverlay}>
        {t('levelUp.close')}
      </button>
    </div>
  );
}

/** The time-lapse cut: "TUE 06 · 6:58" across the screen for a moment (inside a beat). */
export function DayCut() {
  const t = useTranslations('demoGym.top');
  const { view } = useGym();
  const { fmt, dayShort, dayNum } = useGymText();
  if (view.dayCut === null) return null;
  return (
    <div key={view.dayCut} className="gym-cutin" aria-hidden>
      <span className="gym-cutin-k">{t('timelapse')}</span>
      <span className="gym-cutin-day demo-display">
        {dayShort(view.dayCut)} {dayNum(view.dayCut).padStart(2, '0')}
      </span>
      <span className="gym-cutin-time demo-num">{fmt.time(view.clock)}</span>
    </div>
  );
}

/** Push banners on Lucía's phone (inside a beat): the WhatsApp arriving, the membership cancelled. */
export function MemberPush({ kind }: { kind: 'wa' | 'churn' | null }) {
  const t = useTranslations('demoGym');
  const { view, business, member } = useGym();
  const { fmt, short } = useGymText();
  if (!kind) return null;
  const at = kind === 'wa' ? (view.sentAt ?? 0) : (view.churnAt ?? 0);
  const time = fmt.time(storyClockAt(view, at).clock);
  return (
    <div className="gym-push-wrap">
      <PushBanner
        key={kind}
        app={kind === 'wa' ? t('push.whatsapp') : business}
        icon={<OrbitaMark />}
        time={time}
        title={kind === 'wa' ? business : t('push.churnTitle')}
        body={kind === 'wa' ? t('wa.hello', { name: short(HERO), days: 9 }) : t('push.churnBody')}
        onOpen={kind === 'wa' ? () => member.openOverlay('wa') : undefined}
        openLabel={kind === 'wa' ? t('push.open') : undefined}
        leaving={view.t - at >= 2600}
      />
    </div>
  );
}

export const MEMBER_TABS: { id: MemberTab; icon: typeof Target; tour?: string }[] = [
  { id: 'home', icon: Flame },
  { id: 'classes', icon: Dumbbell, tour: 'classes' },
  { id: 'league', icon: Trophy, tour: 'league' },
];
