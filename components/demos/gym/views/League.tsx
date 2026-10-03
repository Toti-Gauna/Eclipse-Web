'use client';

import { useTranslations } from 'next-intl';
import { Flame, Gift, Shirt, Target, Trophy, Users, type LucideIcon } from 'lucide-react';
import { Leaderboard, Meter } from '../../kit';
import { ACTIVE, LEAGUE } from '../model';
import { useGym, useGymText } from '../hooks';
import { HudHead } from '../parts';
import { LeagueHeader, useLeagueRows } from './Member';

/** Missions running this week, gym-wide: completions before the story (+ Lucía's). */
const MISSION_STATS: { id: 'comeback' | 'threeClasses' | 'streak3' | 'friend'; icon: LucideIcon; done: number; active: number }[] = [
  { id: 'comeback', icon: Target, done: 23, active: 41 },
  { id: 'threeClasses', icon: Trophy, done: 52, active: 128 },
  { id: 'streak3', icon: Flame, done: 81, active: 164 },
  { id: 'friend', icon: Users, done: 19, active: 96 },
];
const REWARDS: { id: 'level5' | 'level7' | 'level10' | 'gold'; icon: LucideIcon }[] = [
  { id: 'level5', icon: Gift },
  { id: 'level7', icon: Gift },
  { id: 'level10', icon: Shirt },
  { id: 'gold', icon: Trophy },
];

export function LaptopLeague() {
  const t = useTranslations('demoGym.leagueView');
  const tl = useTranslations('demoGym.league');
  const { view } = useGym();
  const { fmt, short } = useGymText();
  const rows = useLeagueRows();
  const heroDone = { comeback: view.missionAt !== null && view.missionAt <= view.t ? 1 : 0, streak3: view.missions.find((m) => m.id === 'streak3')?.doneAt !== null ? 1 : 0, friend: view.missions.find((m) => m.id === 'friend')?.doneAt !== null ? 1 : 0, threeClasses: 0 };
  return (
    <div className="gym-view">
      <HudHead index="05" label={t('index')} title={t('title')} sub={t('sub', { count: ACTIVE })} />
      <div className="gym-league-grid">
        <section className="gym-league-card gym-cut">
          <LeagueHeader compact />
          <Leaderboard rows={rows} label={tl('label')} unit="XP" limit={LEAGUE.length} className="gym-board" />
        </section>
        <div className="gym-league-side">
          <section className="gym-ms gym-cut" aria-labelledby="gym-ms-h">
            <h3 id="gym-ms-h" className="gym-h3">
              {t('missions')}
            </h3>
            <ul>
              {MISSION_STATS.map((m) => {
                const Icon = m.icon;
                const done = m.done + heroDone[m.id];
                return (
                  <li key={m.id}>
                    <Icon aria-hidden strokeWidth={2} />
                    <span className="min-w-0 flex-1">
                      <span className="gym-ms-t">{t(`mission.${m.id}`)}</span>
                      <Meter value={done / m.active} className="gym-ms-meter" />
                    </span>
                    <span className="gym-ms-n demo-num">
                      {fmt.num(done)}
                      <span>/{fmt.num(m.active)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="gym-rewards gym-cut" aria-labelledby="gym-rw-h">
            <h3 id="gym-rw-h" className="gym-h3">
              {t('rewards')}
            </h3>
            <ol>
              {REWARDS.map((r) => {
                const Icon = r.icon;
                const fresh = r.id === 'level7' && view.levelUpAt !== null && view.t - view.levelUpAt < 4000;
                return (
                  <li key={r.id} data-fresh={fresh ? '' : undefined}>
                    <span className="gym-rewards-k demo-num">{t(`reward.${r.id}.k`)}</span>
                    <Icon aria-hidden strokeWidth={2} />
                    <span className="min-w-0 flex-1 truncate">{t(`reward.${r.id}.v`)}</span>
                    {fresh ? <span className="gym-rewards-new">{t('unlocked', { name: short('lucia') })}</span> : null}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
