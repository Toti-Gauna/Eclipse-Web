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
  comboHolding,
  lineIfSelected,
} from '@/components/plan-builder/rules';
import { goalPieces, piecesForGoals, setVertical, suggestedIds, toggleGoal } from '@/components/plan-builder/goals';
import { withGoals } from '@/components/plan-builder/message';
import { mergePreload, noPreload, openCategories, preloadNotes, presetPreload, undoAdded } from '@/components/plan-builder/preload';

const NOW = new Date('2026-10-16T12:00:00Z');
const ctx = { foundersLeft: 5, now: NOW };
const state = (patch: Partial<PlanState>): PlanState => ({ ...emptyPlanState, ...patch });

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
    expect(landingStep({ preset: { planId: 'adaptacion' }, empty: false })).toBe('piezas');
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
    expect(goalPieces('ordenar', 'clinicas')).toEqual(['turnos', 'whatsapp']);
    expect(goalPieces('ordenar', 'restaurantes')).toEqual(['pedidos', 'whatsapp']);
    expect(goalPieces('ordenar', null)).toEqual(['turnos', 'pedidos', 'whatsapp']);
    expect(goalPieces('ordenar', 'otro')).toEqual(['turnos', 'pedidos', 'whatsapp']);
  });
  it('the brief: found / 24-7 / sell / loyalty / own app / diagnosis', () => {
    expect(goalPieces('encontrar')).toEqual(['landing', 'seo']);
    expect(goalPieces('atender')).toEqual(['voz', 'chatbot']);
    expect(goalPieces('vender')).toEqual(['catalogo']);
    expect(goalPieces('fidelizar')).toEqual(['whatsapp', 'gamificacion']);
    expect(goalPieces('app')).toEqual(['app-fase']);
    expect(goalPieces('diagnostico')).toEqual(['auditoria']);
  });
  it('pieces for several goals are unique and in catalog order', () => {
    expect(piecesForGoals(['atender', 'encontrar'])).toEqual(['landing', 'seo', 'chatbot', 'voz']);
    expect(piecesForGoals(['ordenar', 'fidelizar'], 'gimnasios')).toEqual(['turnos', 'whatsapp', 'gamificacion']);
  });
  it('turning a goal on preselects its pieces; off removes only the ones no other goal wants', () => {
    const a = toggleGoal(emptyPlanState, 'encontrar');
    expect(a).toMatchObject({ goals: ['encontrar'], items: ['landing', 'seo'] });
    const b = toggleGoal(toggleGoal(a, 'ordenar'), 'fidelizar');
    expect(b.goals).toEqual(['encontrar', 'ordenar', 'fidelizar']);
    expect(b.items).toEqual(['landing', 'seo', 'turnos', 'pedidos', 'whatsapp', 'gamificacion']);
    const c = toggleGoal(b, 'ordenar');
    // whatsapp stays: "fidelizar" still asks for it.
    expect(c.items).toEqual(['landing', 'seo', 'whatsapp', 'gamificacion']);
    const d = toggleGoal(toggleItem(c, 'trailer'), 'encontrar');
    // A piece picked by hand survives.
    expect(d.items).toEqual(['trailer', 'whatsapp', 'gamificacion']);
  });
  it("goals never duplicate an offer's own pieces", () => {
    const s = toggleGoal(state({ planId: 'pack' }), 'encontrar');
    expect(s.items).toEqual([]);
    expect(selectionIds(s)).toEqual(expect.arrayContaining(['landing', 'seo']));
  });
  it('changing the business swaps the "ordenar" system and keeps the rest', () => {
    const s = toggleGoal(toggleGoal(emptyPlanState, 'ordenar'), 'fidelizar');
    expect(s.items).toEqual(['turnos', 'pedidos', 'whatsapp', 'gamificacion']);
    const clinic = setVertical(s, 'clinicas');
    expect(clinic).toMatchObject({ vertical: 'clinicas', items: ['turnos', 'whatsapp', 'gamificacion'] });
    const restaurant = setVertical(clinic, 'restaurantes');
    expect(restaurant.items).toEqual(['pedidos', 'whatsapp', 'gamificacion']);
    expect(setVertical(state({ items: ['seo'] }), 'gimnasios')).toMatchObject({ vertical: 'gimnasios', items: ['seo'] });
  });
  it('knows which pieces a goal suggested', () => {
    expect([...suggestedIds({ goals: ['atender'], vertical: null })]).toEqual(['chatbot', 'voz']);
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
  it('never toggles an item the offer covers', () => {
    const s = state({ planId: 'pack', items: ['trailer'] });
    expect(toggleItem(s, 'landing')).toBe(s);
    expect(toggleItem(s, 'asesoria-growth')).toBe(s);
  });
  it('the two advisory sessions become the combo, and leaving one keeps the other', () => {
    const both = toggleItem(toggleItem(emptyPlanState, 'asesoria-growth'), 'asesoria-economica');
    expect(both.items).toEqual(['asesorias']);
    expect(comboHolding(both, 'asesoria-growth')?.id).toBe('asesorias');
    expect(toggleItem(both, 'asesoria-growth').items).toEqual(['asesoria-economica']);
    expect(toggleItem(both, 'asesorias').items).toEqual([]);
    expect(builderQuote(both, ctx).totalUsd).toBe(250);
  });
  it('choosing an offer keeps the rest as extras; "quitar" drops it and keeps the extras', () => {
    const s = switchToPlan(state({ items: ['landing', 'whatsapp'] }), 'adaptacion');
    expect(s).toMatchObject({ planId: 'adaptacion', items: ['landing', 'whatsapp'] });
    expect(builderQuote(s, ctx).totalUsd).toBe(800); // 500 + landing 200 + WhatsApp 100
    expect(dropPlan(s)).toMatchObject({ planId: null, items: ['landing', 'whatsapp'] });
    expect(removePlan(state({ planId: 'adaptacion' })).planId).toBeNull();
  });
  it('step 1 offers toggle; the pack absorbs what it covers', () => {
    const a = togglePlan(state({ items: ['seo', 'landing', 'trailer'] }), 'pack');
    expect(a).toMatchObject({ planId: 'pack', items: ['trailer'] });
    expect(togglePlan(a, 'pack')).toMatchObject({ planId: null, items: ['trailer'] });
  });
  it('an offer preset starts over from it (goals cleared, maintenance back to the suggestion)', () => {
    const s = applyPreset(state({ goals: ['vender'], items: ['seo'], maintenance: null }), {
      planId: 'adaptacion',
      items: ['voz', 'trailer'],
    });
    expect(s).toMatchObject({ goals: [], planId: 'adaptacion', items: ['trailer', 'voz'], maintenance: undefined });
  });
  it('a pieces preset ("Sumala a tu plan") adds to what is there', () => {
    const before = state({ planId: 'pack', items: ['trailer'], maintenance: 'esencial' });
    const s = applyPreset(before, { items: ['chatbot', 'whatsapp', 'landing'] });
    expect(s).toMatchObject({ planId: 'pack', items: ['trailer', 'whatsapp', 'chatbot'], maintenance: 'esencial' });
    expect(addedByPreset(before, { items: ['chatbot', 'whatsapp', 'landing'] })).toEqual(['whatsapp', 'chatbot']);
  });
  it('normalizes extras already covered by the offer', () => {
    expect(normalizeState(state({ planId: 'pack', items: ['landing', 'trailer'] })).items).toEqual(['trailer']);
  });
  it('knows when nothing is selected', () => {
    expect(isEmptyState(emptyPlanState)).toBe(true);
    expect(isEmptyState(state({ planId: 'pack' }))).toBe(false);
  });
});

describe('maintenance', () => {
  it('follows the suggestion until the visitor picks one', () => {
    expect(effectiveMaintenance(state({ items: ['dashboard'] }))).toBe('esencial');
    expect(effectiveMaintenance(state({ items: ['chatbot'] }))).toBe('ia');
    expect(effectiveMaintenance(state({ items: ['dashboard'], maintenance: null }))).toBeNull();
    expect(effectiveMaintenance(state({ items: ['dashboard'], maintenance: 'conectado' }))).toBe('conectado');
    expect(effectiveMaintenance(state({ items: ['asesorias'] }))).toBeNull();
  });
  it('one monthly plan: no per-channel or voice fee, never two plans at once', () => {
    const r = builderQuote(state({ planId: 'adaptacion', items: ['voz', 'whatsapp'], maintenance: 'ia' }), ctx);
    expect(recurringSplit(r)).toEqual({ monthlyUsd: 150, yearlyUsd: 0 });
    expect(recurringSplit(builderQuote(state({ items: ['asesorias'] }), ctx))).toEqual({ monthlyUsd: 0, yearlyUsd: 0 });
  });
});

describe('offer and add-on prices in the builder', () => {
  it('a piece shows its independent price alone, its add-on price on an offer', () => {
    expect(lineIfSelected(emptyPlanState, 'voz', ctx)).toMatchObject({ priceUsd: 750 });
    expect(lineIfSelected(state({ planId: 'adaptacion' }), 'voz', ctx)).toMatchObject({ priceUsd: 250, addon: true });
    expect(priceIfSelected(state({ planId: 'pack' }), 'landing', ctx)).toBeNull();
    expect(priceIfSelected(state({ planId: 'adaptacion' }), 'migracion', ctx)).toBeNull();
  });
  it('no offer is suggested by itself (no detection, no "ahorrás")', () => {
    for (let mask = 1; mask < 1 << GOAL_IDS.length; mask++) {
      let s = emptyPlanState;
      GOAL_IDS.forEach((g, i) => {
        if (mask & (1 << i)) s = toggleGoal(s, g);
      });
      expect(planSwitchSuggestion(s, ctx)).toBeNull();
    }
  });
  it('founder opt-in changes nothing while the founder offer is off', () => {
    expect(builderQuote(state({ items: ['landing', 'seo'], founder: true }), ctx).totalUsd).toBe(600);
  });
  it('the quote is the one lib/pricing computes', () => {
    const s = state({ planId: 'pack', items: ['voz'], maintenance: 'ia' });
    expect(builderQuote(s, ctx)).toEqual(
      quote({ planId: 'pack', itemIds: ['voz'], maintenanceId: 'ia', billing: 'monthly', founderOptIn: false, foundersLeft: 5, now: NOW }),
    );
    expect(plans.length).toBeGreaterThan(0);
  });
});

describe('soft hints', () => {
  it('dashboard without a system behind it', () => {
    expect(softHints(['dashboard']).map((h) => h.id)).toEqual(['dashboard']);
    expect(softHints(['dashboard', 'turnos'])).toEqual([]);
    expect(softHints(['dashboard', 'catalogo'])).toEqual([]);
  });
  it('chatbot without a WhatsApp follow-up', () => {
    expect(softHints(['chatbot']).map((h) => h.id)).toEqual(['chatbot']);
    expect(softHints(['chatbot', 'whatsapp'])).toEqual([]);
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
    const s = state({ goals: ['atender'], items: ['chatbot', 'voz'] });
    expect(preloadNotes(s, { items: ['chatbot'], planId: null })).toMatchObject({ fromGoals: ['voz'], added: ['chatbot'] });
    expect(preloadNotes(toggleItem(s, 'chatbot'), { items: ['chatbot'], planId: null })).toMatchObject({ fromGoals: ['voz'], added: [] });
  });
  it("pieces inside the offer are the offer's to explain", () => {
    const s = toggleGoal(state({ planId: 'adaptacion' }), 'encontrar');
    expect(preloadNotes(s, noPreload).fromGoals).toEqual(['landing']);
  });
  it('a package preset is remembered while that package is selected', () => {
    const preload = presetPreload(emptyPlanState, { planId: 'adaptacion' });
    expect(preload).toEqual({ items: [], planId: 'adaptacion' });
    const s = applyPreset(emptyPlanState, { planId: 'adaptacion' });
    expect(preloadNotes(s, preload).packageFromPreset).toBe(true);
    expect(preloadNotes(dropPlan(s), preload).packageFromPreset).toBe(false);
    expect(preloadNotes(togglePlan(s, 'pack'), preload).packageFromPreset).toBe(false);
  });
  it('presets add up; a new package starts over', () => {
    const a = mergePreload(noPreload, { items: [], planId: 'adaptacion' });
    const b = mergePreload(a, { items: ['dashboard'], planId: null });
    expect(mergePreload(b, { items: ['chatbot'], planId: null })).toEqual({ items: ['dashboard', 'chatbot'], planId: 'adaptacion' });
    expect(mergePreload(b, { items: [], planId: 'pack' })).toEqual({ items: [], planId: 'pack' });
  });
  it('"Deshacer" takes out only what the preset added', () => {
    const s = state({ planId: 'adaptacion', items: ['trailer', 'chatbot', 'whatsapp'] });
    expect(undoAdded(s, ['chatbot', 'whatsapp'])).toMatchObject({ planId: 'adaptacion', items: ['trailer'] });
  });
});

describe('folding categories (step 2)', () => {
  const groups = groupByCategory();
  it('opens the categories that hold extras or pieces a preset just added', () => {
    expect(openCategories(groups, { items: ['seo', 'chatbot'] })).toEqual(['presencia', 'ia']);
    expect(openCategories(groups, { items: [] }, ['catalogo'])).toEqual(['comercio']);
  });
  it('with nothing chosen, the first one (so the list shows how it works)', () => {
    expect(openCategories(groups, { items: [] })).toEqual([groups[0].category.id]);
  });
});
