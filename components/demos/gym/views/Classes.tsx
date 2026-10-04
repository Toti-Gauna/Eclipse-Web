'use client';

import { useTranslations } from 'next-intl';
import { CalendarToolbar, useCalendarNav } from '../../kit';
import { HERO, LEAD, SLOTS, dayDate, sessionAt, sessionsOn, type Session } from '../model';
import { checkedInAt, isPast, taken } from '../story';
import { useGym, useGymText } from '../hooks';
import { HudHead, MemberAvatar } from '../parts';

/** Gyms open Monday to Saturday. */
const open = (wd: number) => wd < 6;

function useCell() {
  const { view } = useGym();
  return (s: Session) => {
    const booked = taken(view, s);
    const hero = view.heroSessions.includes(s.id);
    const lead = view.trial?.session === s.id || view.trialYou?.session === s.id;
    const now = s.day === view.day && s.start <= view.clock + 5 && view.clock < s.start + 50;
    const past = isPast(view, s);
    return { booked, hero, lead, now, past, full: booked >= s.cap, low: s.cap - booked <= 2, checked: !!checkedInAt(view, s.id) };
  };
}

function Legend() {
  const t = useTranslations('demoGym.classesView');
  const { short } = useGymText();
  return (
    <p className="gym-legend">
      <span>
        <MemberAvatar id={HERO} /> {short(HERO)}
      </span>
      <span>
        <MemberAvatar id={LEAD} /> {t('trial')}
      </span>
      <span data-k="live">{t('now')}</span>
    </p>
  );
}

/** "5 – 10 oct" for a week of open days. */
function useWeekLabel() {
  const { fmt } = useGymText();
  return (week: number[]) => {
    const from = week[0];
    const to = week[week.length - 1];
    const sameMonth = dayDate(from).getUTCMonth() === dayDate(to).getUTCMonth();
    const opts = { day: 'numeric', month: 'short' } as const;
    const a = fmt.date(dayDate(from), sameMonth ? { day: 'numeric' } : opts).replace('.', '');
    return `${a} – ${fmt.date(dayDate(to), opts).replace('.', '')}`;
  };
}

export function LaptopClasses() {
  const t = useTranslations('demoGym.classesView');
  const { view } = useGym();
  const { fmt, kind, coach, dayShort, dayNum, short } = useGymText();
  const nav = useCalendarNav({ today: view.day, initialView: 'week', open });
  const weekLabel = useWeekLabel();
  const cell = useCell();
  const days = nav.week;
  const pastWeek = days[days.length - 1] < view.day;
  return (
    <div className="gym-view">
      <HudHead index="04" label={t('index')} title={t('title')} sub={pastWeek ? t('subPast') : t('sub')} aside={<Legend />} />
      <CalendarToolbar nav={nav} period={weekLabel(days)} views={['week']} className="gym-calbar" />
      <table className="gym-tt">
        <caption className="sr-only">{t('caption', { week: weekLabel(days) })}</caption>
        <thead>
          <tr>
            <td />
            {days.map((d) => (
              <th key={d} scope="col" data-today={d === view.day ? '' : undefined} data-past={d < view.day ? '' : undefined}>
                <span>{dayShort(d)}</span> <b className="demo-num">{dayNum(d)}</b>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SLOTS.map((slot) => (
            <tr key={slot}>
              <th scope="row" className="demo-num">
                {fmt.gutter(slot)}
              </th>
              {days.map((d) => {
                const s = sessionAt(d, slot);
                if (!s) return <td key={d} data-empty="" />;
                const c = cell(s);
                return (
                  <td key={d} data-live={c.now ? '' : undefined} data-full={c.full ? '' : undefined} data-past={c.past ? '' : undefined} data-hero={c.hero ? '' : undefined} data-lead={c.lead ? '' : undefined}>
                    <span className="gym-tt-kind">{kind(s.kind)}</span>
                    <span className="gym-tt-coach">{coach(s.coach)}</span>
                    <span className="gym-tt-occ" data-low={c.low && !c.past ? '' : undefined}>
                      <span className="gym-tt-bar" aria-hidden>
                        <span style={{ transform: `scaleX(${c.booked / s.cap})` }} />
                      </span>
                      <span className="demo-num">
                        {c.booked}/{s.cap}
                      </span>
                    </span>
                    {c.hero || c.lead ? (
                      <span className="gym-tt-who">
                        {c.hero ? <MemberAvatar id={HERO} /> : null}
                        {c.lead ? <MemberAvatar id={LEAD} /> : null}
                        <span className="sr-only">
                          {[c.hero ? short(HERO) : '', c.lead ? t('trialOf', { name: short(LEAD) }) : ''].filter(Boolean).join(', ')}
                        </span>
                      </span>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="gym-classes-note">{t('note')}</p>
    </div>
  );
}

export function PhoneClasses() {
  const t = useTranslations('demoGym.classesView');
  const ta = useTranslations('demoGym.app');
  const { view } = useGym();
  const { fmt, kind, coach, dayShort, dayNum, dayLong } = useGymText();
  const nav = useCalendarNav({ today: view.day, open });
  const cell = useCell();
  return (
    <div className="gym-view" data-screen="phone">
      <HudHead index="04" label={t('index')} title={t('title')} />
      <CalendarToolbar nav={nav} period={dayLong(nav.day)} views={['day']} compact className="gym-calbar" />
      <div className="gym-days" role="group" aria-label={t('pickDay')}>
        {nav.week.map((d) => (
          <button key={d} type="button" className="gym-day" aria-pressed={d === nav.day} data-today={d === view.day ? '' : undefined} data-past={d < view.day ? '' : undefined} onClick={() => nav.setDay(d)}>
            <span>{dayShort(d)}</span>
            <b className="demo-num">{dayNum(d)}</b>
          </button>
        ))}
      </div>
      <ul className="gym-ct-list" data-screen="phone">
        {sessionsOn(nav.day).map((s) => {
          const c = cell(s);
          return (
            <li key={s.id} className="gym-ct" data-live={c.now ? '' : undefined} data-full={c.full ? '' : undefined} data-past={c.past ? '' : undefined}>
              <span className="gym-ct-time demo-num">{fmt.gutter(s.start)}</span>
              <span className="gym-ct-kind">
                {kind(s.kind)}
                <span className="gym-ct-coach">{coach(s.coach)}</span>
              </span>
              <span className="gym-ct-bar" aria-hidden>
                <span style={{ transform: `scaleX(${c.booked / s.cap})` }} />
              </span>
              <span className="gym-ct-n demo-num">
                {c.booked}/{s.cap}
              </span>
              <span className="gym-ct-who">
                {c.hero ? <MemberAvatar id={HERO} /> : null}
                {c.lead ? <MemberAvatar id={LEAD} /> : null}
              </span>
            </li>
          );
        })}
        {sessionsOn(nav.day).length === 0 ? <li className="gym-classes-note">{ta('closed', { day: dayLong(nav.day) })}</li> : null}
      </ul>
    </div>
  );
}
