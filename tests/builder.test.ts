import { describe, expect, it } from 'vitest';
import { emptyPlanState, type PlanState } from '@/lib/plan-url';
import { itemCategories, items } from '@/lib/content';
import {
  applyPreset,
  builderQuote,
  effectiveMaintenance,
  groupByCategory,
  isEmptyState,
  normalizeState,
  planSwitchSuggestion,
  priceIfSelected,
  removePlan,
  selectionIds,
  softHints,
  sortItemIds,
  switchToPlan,
  timeLeft,
  toggleItem,
  voiceComboGap,
} from '@/components/plan-builder/rules';

const NOW = new Date('2026-10-02T12:00:00Z');
const ctx = { foundersLeft: 5, now: NOW };
const state = (patch: Partial<PlanState>): PlanState => ({ ...emptyPlanState, ...patch });
const SISTEMA = ['turnos', 'pedidos', 'automatizacion', 'dashboard', 'landing', 'voz'] as const;

describe('catalog grouping', () => {
  it('groups every item under its category, in category order', () => {
    const groups = groupByCategory();
    expect(groups.map((g) => g.category.id)).toEqual(itemCategories.map((c) => c.id));
    expect(groups.flatMap((g) => g.items).length).toBe(items.length);
    expect(groups[0].items.map((i) => i.id)).toEqual(['landing', 'web-multi', 'seo', 'trailer']);
  });
  it('drops empty categories', () => {
    expect(groupByCategory(items.filter((i) => i.category === 'ia')).map((g) => g.category.id)).toEqual(['ia']);
  });
});

describe('state transitions', () => {
  it('sorts ids in catalog order, drops unknown and duplicates', () => {
    expect(sortItemIds(['voz', 'landing', 'nope', 'landing'])).toEqual(['landing', 'voz']);
  });
  it('toggles items on and off', () => {
    const a = toggleItem(emptyPlanState, 'seo');
    expect(a.items).toEqual(['seo']);
    expect(toggleItem(a, 'seo').items).toEqual([]);
  });
  it('never toggles an item the plan includes', () => {
    const s = state({ planId: 'sistema', items: ['seo'] });
    expect(toggleItem(s, 'landing')).toBe(s);
  });
  it('switching to a plan keeps the rest as extras', () => {
    const s = switchToPlan(state({ items: [...SISTEMA, 'trailer'] }), 'sistema');
    expect(s.planId).toBe('sistema');
    expect(s.items).toEqual(['trailer']);
    expect(selectionIds(s)).toContain('voz');
  });
  it('removing the plan goes back to its items + extras', () => {
    const s = removePlan(state({ planId: 'automatiza', items: ['seo'] }));
    expect(s.planId).toBeNull();
    expect(s.items).toEqual(['seo', 'automatizacion', 'chatbot']);
  });
  it('a preset replaces the selection and resets maintenance to the suggestion', () => {
    const s = applyPreset(state({ items: ['seo'], maintenance: null, billing: 'annual' }), {
      planId: 'sistema',
      items: ['voz', 'trailer'],
    });
    expect(s).toMatchObject({ planId: 'sistema', items: ['trailer'], maintenance: undefined, billing: 'annual' });
  });
  it('normalizes extras already included in the plan', () => {
    expect(normalizeState(state({ planId: 'presencia', items: ['landing', 'seo'] })).items).toEqual(['seo']);
  });
  it('knows when nothing is selected', () => {
    expect(isEmptyState(emptyPlanState)).toBe(true);
    expect(isEmptyState(state({ planId: 'voz' }))).toBe(false);
  });
});

describe('maintenance', () => {
  it('follows the suggestion until the visitor picks one', () => {
    expect(effectiveMaintenance(state({ items: ['dashboard'] }))).toBe('crecimiento');
    expect(effectiveMaintenance(state({ items: ['dashboard'], maintenance: null }))).toBeNull();
    expect(effectiveMaintenance(state({ items: ['dashboard'], maintenance: 'escala' }))).toBe('escala');
    expect(effectiveMaintenance(state({ items: ['landing'] }))).toBeNull();
  });
});

describe('plan detection (measured against the real quote)', () => {
  it('Sistema items: saving includes the voice combo already applied', () => {
    const s = state({ items: [...SISTEMA] });
    // Separately: 2.050 (voice at 300 because the rest is 1.750) vs Sistema from 1.000.
    expect(builderQuote(s, ctx).subtotalUsd).toBe(2050);
    const match = planSwitchSuggestion(s, ctx);
    expect(match?.plan.id).toBe('sistema');
    expect(match?.savingsUsd).toBe(1050);
    expect(match?.savingsPct).toBe(51);
    expect(match?.extras).toEqual([]);
  });
  it('keeps extras and measures the saving on the whole selection', () => {
    const match = planSwitchSuggestion(state({ items: [...SISTEMA, 'trailer'] }), ctx);
    expect(match).toMatchObject({ extras: ['trailer'], savingsUsd: 1050, savingsPct: 46 });
  });
  it('no suggestion for a partial bundle or the plan already selected', () => {
    expect(planSwitchSuggestion(state({ items: ['turnos', 'pedidos', 'dashboard'] }), ctx)).toBeNull();
    expect(planSwitchSuggestion(state({ planId: 'sistema' }), ctx)).toBeNull();
    expect(planSwitchSuggestion(emptyPlanState, ctx)).toBeNull();
  });
  it('suggests upgrading from one plan to a bigger one when it is cheaper', () => {
    const s = state({ planId: 'sistema', items: ['ecommerce', 'gamificacion'] });
    const match = planSwitchSuggestion(s, ctx);
    expect(match?.plan.id).toBe('comercio');
    expect(match?.extras).toEqual(['voz']);
    expect(builderQuote(switchToPlan(s, 'comercio'), ctx).subtotalUsd).toBeLessThan(builderQuote(s, ctx).subtotalUsd);
  });
  it('single-item plans are never suggested', () => {
    expect(planSwitchSuggestion(state({ items: ['landing'] }), ctx)).toBeNull();
    expect(planSwitchSuggestion(state({ items: ['voz'] }), ctx)).toBeNull();
  });
});

describe('voice combo in the builder', () => {
  it('shows the combo price on the voice card once the rest reaches the minimum', () => {
    expect(priceIfSelected(state({ items: ['landing'] }), 'voz', ctx)).toBe(600);
    expect(priceIfSelected(state({ items: ['ecommerce'] }), 'voz', ctx)).toBe(300);
    expect(priceIfSelected(state({ planId: 'sistema' }), 'voz', ctx)).toBeNull();
    expect(priceIfSelected(state({ planId: 'comercio' }), 'voz', ctx)).toBe(300);
  });
  it('reports how much is missing for the combo', () => {
    expect(voiceComboGap(state({ items: ['voz', 'landing'] }), ctx)?.missingUsd).toBe(750);
    expect(voiceComboGap(state({ items: ['voz', 'ecommerce'] }), ctx)).toBeNull();
    expect(voiceComboGap(state({ items: ['landing'] }), ctx)).toBeNull();
  });
  it('founder opt-in lowers the one-time total only while slots remain', () => {
    const s = state({ items: ['landing', 'seo'], founder: true });
    expect(builderQuote(s, ctx).totalUsd).toBe(320);
    expect(builderQuote(s, { ...ctx, foundersLeft: 0 }).totalUsd).toBe(400);
  });
});

describe('soft hints', () => {
  it('dashboard without a system behind it', () => {
    expect(softHints(['dashboard']).map((h) => h.id)).toEqual(['dashboard']);
    expect(softHints(['dashboard', 'turnos'])).toEqual([]);
    expect(softHints(['dashboard', 'ecommerce'])).toEqual([]);
  });
  it('chatbot without automations', () => {
    expect(softHints(['chatbot']).map((h) => h.id)).toEqual(['chatbot']);
    expect(softHints(['chatbot', 'automatizacion'])).toEqual([]);
  });
});

describe('offer countdown', () => {
  it('splits the remaining time and hides once expired', () => {
    const now = Date.parse('2026-10-02T12:00:00Z');
    expect(timeLeft(null, now)).toBeNull();
    expect(timeLeft('2026-10-05T18:00:00Z', now)).toEqual({ days: 3, hours: 78 });
    expect(timeLeft('2026-10-02T12:20:00Z', now)).toEqual({ days: 0, hours: 1 });
    expect(timeLeft('2026-10-01T00:00:00Z', now)).toBeNull();
  });
});
