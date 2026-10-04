import { describe, expect, it } from 'vitest';
import { emptyPlanState, GOAL_IDS, type PlanState } from '@/lib/plan-url';
import { itemCategories, items, plans, type ItemId } from '@/lib/content';
import { quote } from '@/lib/pricing';
import {
  addedByPreset,
  applyPreset,
  builderQuote,
  dropPlan,
  effectiveMaintenance,
  groupByCategory,
  isEmptyState,
  landingStep,
  normalizeState,
  planSwitchSuggestion,
  priceIfSelected,
  recurringSplit,
  removePlan,
  selectionIds,
  siblingStep,
  softHints,
  sortItemIds,
  stepPhase,
  STEPS,
  switchToPlan,
  timeLeft,
  togglePlan,
  toggleItem,
  voiceComboGap,
} from '@/components/plan-builder/rules';
import { goalPieces, piecesForGoals, setVertical, suggestedIds, toggleGoal } from '@/components/plan-builder/goals';
import { withGoals } from '@/components/plan-builder/message';
import { mergePreload, noPreload, openCategories, preloadNotes, presetPreload, undoAdded } from '@/components/plan-builder/preload';

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

describe('steps', () => {
  it('four steps, the moon covering the sun as the plan comes together', () => {
    expect(STEPS).toEqual(['objetivo', 'piezas', 'mantenimiento', 'resumen']);
    expect(STEPS.map(stepPhase)).toEqual([0.25, 0.5, 0.75, 1]);
    expect(siblingStep('objetivo', -1)).toBe('objetivo');
    expect(siblingStep('objetivo', 1)).toBe('piezas');
    expect(siblingStep('resumen', 1)).toBe('resumen');
  });
  it('lands on the step that makes sense', () => {
    expect(landingStep({ preset: { planId: 'sistema' }, empty: false })).toBe('piezas');
    expect(landingStep({ preset: { items: ['chatbot'] }, empty: true })).toBe('piezas');
    expect(landingStep({ fromLink: true, empty: false })).toBe('resumen');
    expect(landingStep({ fromLink: true, empty: true })).toBe('objetivo');
    expect(landingStep({ remembered: 'mantenimiento', empty: false })).toBe('mantenimiento');
    expect(landingStep({ remembered: 'resumen', empty: true })).toBe('objetivo');
    expect(landingStep({ empty: true })).toBe('objetivo');
  });
});

describe('goals (step 1)', () => {
  it('every goal maps to real catalog pieces', () => {
    const known = new Set(items.map((i) => i.id));
    for (const goal of GOAL_IDS) {
      for (const vertical of [null, 'clinicas', 'restaurantes', 'otro'] as const) {
        const pieces = goalPieces(goal, vertical);
        expect(pieces.length, goal).toBeGreaterThan(0);
        for (const id of pieces) expect(known.has(id), `${goal} → ${id}`).toBe(true);
      }
    }
  });
  it('"ordenar turnos y pedidos" follows the business', () => {
    expect(goalPieces('ordenar', 'clinicas')).toEqual(['turnos', 'automatizacion']);
    expect(goalPieces('ordenar', 'restaurantes')).toEqual(['pedidos', 'automatizacion']);
    expect(goalPieces('ordenar', null)).toEqual(['turnos', 'pedidos', 'automatizacion']);
    expect(goalPieces('ordenar', 'otro')).toEqual(['turnos', 'pedidos', 'automatizacion']);
  });
  it('the brief: found / 24-7 / sell / loyalty / own app / diagnosis', () => {
    expect(goalPieces('encontrar')).toEqual(['landing', 'seo']);
    expect(goalPieces('atender')).toEqual(['voz', 'chatbot']);
    expect(goalPieces('vender')).toEqual(['ecommerce']);
    expect(goalPieces('fidelizar')).toEqual(['automatizacion', 'gamificacion']);
    expect(goalPieces('app')).toEqual(['app-ondemand']);
    expect(goalPieces('diagnostico')).toEqual(['auditoria']);
  });
  it('pieces for several goals are unique and in catalog order', () => {
    expect(piecesForGoals(['atender', 'encontrar'])).toEqual(['landing', 'seo', 'voz', 'chatbot']);
    expect(piecesForGoals(['ordenar', 'fidelizar'], 'gimnasios')).toEqual(['turnos', 'automatizacion', 'gamificacion']);
  });
  it('turning a goal on preselects its pieces; off removes only the ones no other goal wants', () => {
    const a = toggleGoal(emptyPlanState, 'encontrar');
    expect(a).toMatchObject({ goals: ['encontrar'], items: ['landing', 'seo'] });
    const b = toggleGoal(toggleGoal(a, 'ordenar'), 'fidelizar');
    expect(b.goals).toEqual(['encontrar', 'ordenar', 'fidelizar']);
    expect(b.items).toEqual(['landing', 'seo', 'turnos', 'pedidos', 'automatizacion', 'gamificacion']);
    const c = toggleGoal(b, 'ordenar');
    // automatizacion stays: "fidelizar" still asks for it.
    expect(c.items).toEqual(['landing', 'seo', 'automatizacion', 'gamificacion']);
    const d = toggleGoal(toggleItem(c, 'trailer'), 'encontrar');
    // A piece picked by hand survives.
    expect(d.items).toEqual(['trailer', 'automatizacion', 'gamificacion']);
  });
  it("goals never duplicate a package's own pieces", () => {
    const s = toggleGoal(state({ planId: 'presencia' }), 'encontrar');
    expect(s.items).toEqual(['seo']);
    expect(selectionIds(s)).toEqual(['landing', 'seo']);
  });
  it('changing the business swaps the "ordenar" system and keeps the rest', () => {
    const s = toggleGoal(toggleGoal(emptyPlanState, 'ordenar'), 'fidelizar');
    expect(s.items).toEqual(['turnos', 'pedidos', 'automatizacion', 'gamificacion']);
    const clinic = setVertical(s, 'clinicas');
    expect(clinic).toMatchObject({ vertical: 'clinicas', items: ['turnos', 'automatizacion', 'gamificacion'] });
    const restaurant = setVertical(clinic, 'restaurantes');
    expect(restaurant.items).toEqual(['pedidos', 'automatizacion', 'gamificacion']);
    expect(setVertical(state({ items: ['seo'] }), 'gimnasios')).toMatchObject({ vertical: 'gimnasios', items: ['seo'] });
  });
  it('knows which pieces a goal suggested', () => {
    expect([...suggestedIds({ goals: ['atender'], vertical: null })]).toEqual(['voz', 'chatbot']);
  });
  it('the goals go into the WhatsApp message, right after the greeting', () => {
    const msg = ['Hola Eclipse. Armé mi plan en la web:', '• Landing — $ 1', 'Idioma: Español · Moneda: ARS'].join('\n');
    expect(withGoals(msg, 'Objetivo: que me encuentren')).toBe(
      ['Hola Eclipse. Armé mi plan en la web:', 'Objetivo: que me encuentren', '• Landing — $ 1', 'Idioma: Español · Moneda: ARS'].join('\n'),
    );
    expect(withGoals(msg, '')).toBe(msg);
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
  it('never toggles an item the package includes', () => {
    const s = state({ planId: 'sistema', items: ['seo'] });
    expect(toggleItem(s, 'landing')).toBe(s);
  });
  it('switching to a package keeps the rest as extras', () => {
    const s = switchToPlan(state({ items: [...SISTEMA, 'trailer'] }), 'sistema');
    expect(s.planId).toBe('sistema');
    expect(s.items).toEqual(['trailer']);
    expect(selectionIds(s)).toContain('voz');
  });
  it('"pieza por pieza" goes back to its items + extras; "quitar" drops the package and keeps the extras', () => {
    const s = state({ planId: 'automatiza', items: ['seo'] });
    expect(removePlan(s)).toMatchObject({ planId: null, items: ['seo', 'automatizacion', 'chatbot'] });
    expect(dropPlan(s)).toMatchObject({ planId: null, items: ['seo'] });
  });
  it('step 1 packages toggle', () => {
    const a = togglePlan(state({ items: ['seo', 'landing'] }), 'presencia');
    expect(a).toMatchObject({ planId: 'presencia', items: ['seo'] });
    expect(togglePlan(a, 'presencia')).toMatchObject({ planId: null, items: ['seo'] });
  });
  it('a package preset starts over from it (goals cleared, maintenance back to the suggestion)', () => {
    const s = applyPreset(state({ goals: ['vender'], items: ['seo'], maintenance: null, billing: 'annual' }), {
      planId: 'sistema',
      items: ['voz', 'trailer'],
    });
    expect(s).toMatchObject({ goals: [], planId: 'sistema', items: ['trailer'], maintenance: undefined, billing: 'annual' });
  });
  it('a pieces preset ("Sumala a tu plan") adds to what is there', () => {
    const before = state({ planId: 'presencia', items: ['seo'], maintenance: 'esencial' });
    const s = applyPreset(before, { items: ['chatbot', 'automatizacion', 'landing'] });
    expect(s).toMatchObject({ planId: 'presencia', items: ['seo', 'automatizacion', 'chatbot'], maintenance: 'esencial' });
    expect(addedByPreset(before, { items: ['chatbot', 'automatizacion', 'landing'] })).toEqual(['automatizacion', 'chatbot']);
  });
  it('normalizes extras already included in the package', () => {
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
  it('splits what is paid every month from what is paid every year', () => {
    const monthly = builderQuote(state({ planId: 'sistema' }), ctx);
    expect(recurringSplit(monthly)).toEqual({ monthlyUsd: 79 + 49, yearlyUsd: 0 });
    const annual = builderQuote(state({ planId: 'sistema', billing: 'annual' }), ctx);
    expect(recurringSplit(annual)).toEqual({ monthlyUsd: 49, yearlyUsd: 790 });
    expect(recurringSplit(builderQuote(state({ items: ['landing'] }), ctx))).toEqual({ monthlyUsd: 0, yearlyUsd: 0 });
  });
});

describe('package detection (measured against the real quote)', () => {
  it('Sistema items: saving includes the voice combo already applied', () => {
    const s = state({ items: [...SISTEMA] });
    // Separately: 2.050 (voice at 300 because the rest is 1.750) vs Sistema from 1.000.
    expect(builderQuote(s, ctx).subtotalUsd).toBe(2050);
    const match = planSwitchSuggestion(s, ctx);
    expect(match?.plan.id).toBe('sistema');
    expect(match?.savingsUsd).toBe(1050);
    expect(match?.savingsPct).toBe(51);
    expect(match?.extras).toEqual([]);
    expect(match?.adds).toEqual([]);
  });
  it('keeps extras and measures the saving on the whole selection', () => {
    const match = planSwitchSuggestion(state({ items: [...SISTEMA, 'trailer'] }), ctx);
    expect(match).toMatchObject({ extras: ['trailer'], adds: [], savingsUsd: 1050, savingsPct: 46 });
  });
  it('a bigger package that already covers half the selection and costs less: it says what it adds', () => {
    const s = state({ items: ['turnos', 'pedidos', 'dashboard'] });
    expect(builderQuote(s, ctx).subtotalUsd).toBe(1200);
    const match = planSwitchSuggestion(s, ctx);
    expect(match).toMatchObject({ adds: ['landing', 'automatizacion', 'voz'], extras: [], savingsUsd: 200, savingsPct: 17 });
    expect(match?.plan.id).toBe('sistema');
  });
  it('no suggestion when the package covers less than half, costs more, or is already chosen', () => {
    expect(planSwitchSuggestion(state({ items: ['turnos', 'dashboard'] }), ctx)).toBeNull();
    expect(planSwitchSuggestion(state({ items: ['landing', 'voz'] }), ctx)).toBeNull(); // 850 < Sistema 1.000
    expect(planSwitchSuggestion(state({ planId: 'sistema' }), ctx)).toBeNull();
    expect(planSwitchSuggestion(emptyPlanState, ctx)).toBeNull();
  });
  it('suggests upgrading from one package to a bigger one when it is cheaper', () => {
    const s = state({ planId: 'sistema', items: ['ecommerce', 'gamificacion'] });
    const match = planSwitchSuggestion(s, ctx);
    expect(match?.plan.id).toBe('comercio');
    expect(match?.extras).toEqual(['voz']);
    expect(builderQuote(switchToPlan(s, 'comercio'), ctx).subtotalUsd).toBeLessThan(builderQuote(s, ctx).subtotalUsd);
  });
  it('single-item packages are never suggested', () => {
    expect(planSwitchSuggestion(state({ items: ['landing'] }), ctx)).toBeNull();
    expect(planSwitchSuggestion(state({ items: ['voz'] }), ctx)).toBeNull();
    expect(planSwitchSuggestion(state({ items: ['auditoria'] }), ctx)).toBeNull();
  });
  it('every suggestion is cheaper than the current selection (all goal combinations)', () => {
    for (let mask = 1; mask < 1 << GOAL_IDS.length; mask++) {
      let s = emptyPlanState;
      GOAL_IDS.forEach((g, i) => {
        if (mask & (1 << i)) s = toggleGoal(s, g);
      });
      const match = planSwitchSuggestion(s, ctx);
      if (!match) continue;
      const before = builderQuote(s, ctx).subtotalUsd;
      const after = builderQuote(switchToPlan(s, match.plan.id), ctx).subtotalUsd;
      expect(after).toBe(before - match.savingsUsd);
      expect(after).toBeLessThan(before);
      expect(match.plan.items.length).toBeGreaterThan(1);
    }
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
  it('the quote is the one lib/pricing computes', () => {
    const s = state({ planId: 'comercio', items: ['voz'], maintenance: 'escala' });
    expect(builderQuote(s, ctx)).toEqual(
      quote({ planId: 'comercio', itemIds: ['voz'], maintenanceId: 'escala', billing: 'monthly', founderOptIn: false, foundersLeft: 5, now: NOW }),
    );
    expect(plans.length).toBeGreaterThan(0);
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

describe('preload: what came preselected, and why (step 2)', () => {
  it('goals explain the extras they suggested; a preset explains what it added', () => {
    const goals = toggleGoal(emptyPlanState, 'encontrar');
    expect(preloadNotes(goals, noPreload)).toEqual({ fromGoals: ['landing', 'seo'], added: [], packageFromPreset: false });
    const preset = { items: ['chatbot', 'seo'] as ItemId[] };
    const preload = presetPreload(goals, preset);
    expect(preload).toEqual({ items: ['chatbot'], planId: null });
    // seo was already there (the goal explains it); chatbot is the preset's.
    expect(preloadNotes(applyPreset(goals, preset), preload)).toEqual({ fromGoals: ['landing', 'seo'], added: ['chatbot'], packageFromPreset: false });
  });
  it('a piece is explained once, and only while it is still selected', () => {
    const s = state({ goals: ['atender'], items: ['voz', 'chatbot'] });
    expect(preloadNotes(s, { items: ['chatbot'], planId: null })).toMatchObject({ fromGoals: ['voz'], added: ['chatbot'] });
    expect(preloadNotes(toggleItem(s, 'chatbot'), { items: ['chatbot'], planId: null })).toMatchObject({ fromGoals: ['voz'], added: [] });
  });
  it("pieces inside the package are the package's to explain", () => {
    const s = toggleGoal(state({ planId: 'presencia' }), 'encontrar');
    expect(preloadNotes(s, noPreload).fromGoals).toEqual(['seo']);
  });
  it('a package preset is remembered while that package is selected', () => {
    const preload = presetPreload(emptyPlanState, { planId: 'sistema' });
    expect(preload).toEqual({ items: [], planId: 'sistema' });
    const s = applyPreset(emptyPlanState, { planId: 'sistema' });
    expect(preloadNotes(s, preload).packageFromPreset).toBe(true);
    expect(preloadNotes(dropPlan(s), preload).packageFromPreset).toBe(false);
    expect(preloadNotes(togglePlan(s, 'comercio'), preload).packageFromPreset).toBe(false);
  });
  it('presets add up; a new package starts over', () => {
    const a = mergePreload(noPreload, { items: [], planId: 'sistema' });
    const b = mergePreload(a, { items: ['dashboard'], planId: null });
    expect(mergePreload(b, { items: ['chatbot'], planId: null })).toEqual({ items: ['dashboard', 'chatbot'], planId: 'sistema' });
    expect(mergePreload(b, { items: [], planId: 'voz' })).toEqual({ items: [], planId: 'voz' });
  });
  it('"Deshacer" takes out only what the preset added', () => {
    const s = state({ planId: 'presencia', items: ['seo', 'chatbot', 'automatizacion'] });
    expect(undoAdded(s, ['chatbot', 'automatizacion'])).toMatchObject({ planId: 'presencia', items: ['seo'] });
  });
});

describe('folding categories (step 2)', () => {
  const groups = groupByCategory();
  it('opens the categories that hold extras or pieces a preset just added', () => {
    expect(openCategories(groups, { items: ['seo', 'chatbot'] })).toEqual(['presencia', 'ia']);
    expect(openCategories(groups, { items: [] }, ['ecommerce'])).toEqual(['comercio']);
  });
  it('with nothing chosen, the first one (so the list shows how it works)', () => {
    expect(openCategories(groups, { items: [] })).toEqual([groups[0].category.id]);
  });
});
