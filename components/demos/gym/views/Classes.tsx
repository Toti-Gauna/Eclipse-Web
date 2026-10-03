'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DAYS, HERO, LEAD, SESSIONS, SLOTS, sessionAt, type Session } from '../model';
import { useGym, useGymText } from '../hooks';
import { HudHead, MemberAvatar } from '../parts';

function useCell() {
  const { view } = useGym();
  return (s: Session) => {
    const booked = view.booked[s.id];
    const hero = view.heroSessions.includes(s.id);
    const lead = view.trial?.session === s.id && view.trial.at <= view.t;
    const live = s.day === view.day && s.start <= view.clock + 5 && view.clock < s.start + 50;
    const past = s.day < view.day || (s.day === view.day && s.start + 50 <= view.clock);
    return { booked, hero, lead, live, past, full: booked >= s.cap, low: s.cap - booked <= 2 };
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
      <span data-k="live">{t('live')}</span>
    </p>
  );
}

export function LaptopClasses() {
  const t = useTranslations('demoGym.classesView');
  const { view } = useGym();
  const { fmt, kind, coach, dayShort, dayNum, short } = useGymText();
  const cell = useCell();
  return (
    <div className="gym-view">
      <HudHead index="04" label={t('index')} title={t('title')} sub={t('sub')} aside={<Legend />} />
      <table className="gym-tt">
        <caption className="sr-only">{t('caption')}</caption>
        <thead>
          <tr>
            <td />
            {DAYS.map((d) => (
              <th key={d} scope="col" data-today={d === view.day ? '' : undefined}>
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
              {DAYS.map((d) => {
                const s = sessionAt(d, slot);
                if (!s) return <td key={d} data-empty="" />;
                const c = cell(s);
                return (
                  <td key={d} data-live={c.live ? '' : undefined} data-full={c.full ? '' : undefined} data-past={c.past ? '' : undefined} data-hero={c.hero ? '' : undefined} data-lead={c.lead ? '' : undefined}>
                    <span className="gym-tt-kind">{kind(s.kind)}</span>
                    <span className="gym-tt-coach">{coach(s.coach)}</span>
                    <span className="gym-tt-occ" data-low={c.low ? '' : undefined}>
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
                        <span className="sr-only">{[c.hero ? short(HERO) : '', c.lead ? t('trialOf', { name: short(LEAD) }) : ''].filter(Boolean).join(', ')}</span>
                      </span>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PhoneClasses() {
  const t = useTranslations('demoGym.classesView');
  const { view } = useGym();
  const { fmt, kind, coach, dayShort, dayNum } = useGymText();
  const cell = useCell();
  const [picked, setPicked] = useState<number | null>(null);
  const day = picked ?? view.day;
  return (
    <div className="gym-view" data-screen="phone">
      <HudHead index="04" label={t('index')} title={t('title')} sub={t('sub')} />
      <div className="gym-days" role="group" aria-label={t('pickDay')}>
        {DAYS.map((d) => (
          <button key={d} type="button" className="gym-day" aria-pressed={d === day} data-today={d === view.day ? '' : undefined} onClick={() => setPicked(d)}>
            <span>{dayShort(d)}</span>
            <b className="demo-num">{dayNum(d)}</b>
          </button>
        ))}
      </div>
      <ul className="gym-ct-list" data-screen="phone">
        {SESSIONS.filter((s) => s.day === day).map((s) => {
          const c = cell(s);
          return (
            <li key={s.id} className="gym-ct" data-live={c.live ? '' : undefined} data-full={c.full ? '' : undefined}>
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
      </ul>
    </div>
  );
}
