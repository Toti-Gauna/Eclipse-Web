'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { InlineSelect } from '@/components/sections/problem/InlineSelect';
import { Money } from '@/components/ui/Money';
import { l, plans, verticals, type PlanId, type VerticalId } from '@/lib/content';
import type { PlanState } from '@/lib/plan-url';
import type { Locale } from '@/i18n/routing';
import { GOAL_IDS, goalPieces, type GoalId } from './goals';
import { Mark } from './parts';

const NONE = '' as const;

/**
 * Step 1 — "¿Qué querés resolver?": goals (multi-select) that preselect pieces, the
 * business (refines the suggestion), or a package to start from.
 */
export function StepGoals({
  state,
  onToggleGoal,
  onVertical,
  onTogglePlan,
  headingId,
  Sub,
}: {
  state: PlanState;
  onToggleGoal: (goal: GoalId) => void;
  onVertical: (vertical: VerticalId | null) => void;
  onTogglePlan: (planId: PlanId) => void;
  headingId: string;
  Sub: 'h3' | 'h4';
}) {
  const t = useTranslations('builder');
  const locale = useLocale() as Locale;
  const uid = useId();
  const verticalOptions = [
    { value: NONE as VerticalId | typeof NONE, label: t('verticalNone') },
    ...verticals.filter((v) => v.id !== 'otro').map((v) => ({ value: v.id as VerticalId | typeof NONE, label: l(v.name, locale) })),
  ];

  return (
    <>
      <div className="pb-goals" role="group" aria-labelledby={headingId}>
        {GOAL_IDS.map((goal) => {
          const checked = state.goals.includes(goal);
          const count = goalPieces(goal, state.vertical).length;
          return (
            <label key={goal} className="pb-row pb-goal" data-checked={checked || undefined} data-goal={goal}>
              <input type="checkbox" className="sr-only" checked={checked} onChange={() => onToggleGoal(goal)} aria-describedby={`${uid}-${goal}`} />
              <Mark checked={checked} />
              <span className="pb-row-body">
                <span className="pb-row-name">{t(`goals.${goal}.name`)}</span>
                <span id={`${uid}-${goal}`} className="pb-row-desc">
                  {t(`goals.${goal}.desc`)}
                </span>
              </span>
              <span aria-hidden className="pb-row-meta readout">
                {t('pieceCount', { count })}
              </span>
            </label>
          );
        })}
      </div>

      <p className="pb-vertical">
        <span className="label" id={`${uid}-vertical`}>
          {t('vertical')} <span className="normal-case tracking-normal">({t('optional')})</span>
        </span>
        <InlineSelect
          value={(state.vertical && state.vertical !== 'otro' ? state.vertical : NONE) as VerticalId | typeof NONE}
          options={verticalOptions}
          onChange={(v) => onVertical(v === NONE ? null : (v as VerticalId))}
          label={t('vertical')}
          className="pb-isel"
        />
      </p>

      <section className="pb-packages" aria-labelledby={`${uid}-packages`}>
        <Sub id={`${uid}-packages`} className="pb-subhead label">
          <span>{t('fromPackage')}</span>
          <span aria-hidden className="pb-subhead-rule" />
        </Sub>
        <ul className="pb-list">
          {plans.map((plan) => {
            const pressed = state.planId === plan.id;
            return (
              <li key={plan.id}>
                <button type="button" aria-pressed={pressed} onClick={() => onTogglePlan(plan.id)} className="pb-row pb-package" data-checked={pressed || undefined}>
                  <Mark checked={pressed} round />
                  <span className="pb-row-body">
                    <span className="pb-row-name pb-package-name">
                      {l(plan.name, locale)}
                      {pressed ? <span className="pb-tag">{t('chosen')}</span> : null}
                    </span>
                    <span className="pb-row-desc">{l(plan.audience, locale)}</span>
                    {plan.bonus && !plan.items.includes(plan.bonus.itemId) ? (
                      <span className="pb-row-bonus">{t('bonusShort', { name: l(plan.bonus.title, locale) })}</span>
                    ) : null}
                  </span>
                  <span className="pb-row-price readout">
                    <span className="pb-row-from">
                      {t('ledgerFrom')} · {t('pieceCount', { count: plan.items.length })}
                    </span>
                    <Money usd={plan.priceUsd.from} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
