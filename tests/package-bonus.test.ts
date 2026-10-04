import { describe, expect, it } from 'vitest';
import { items, plans, type Plan, type PlanId } from '@/lib/content';
import { detectPlans, planSavings, quote } from '@/lib/pricing';
import { emptyPlanState, type PlanState } from '@/lib/plan-url';
import {
  applyPreset,
  bonusOf,
  builderQuote,
  coveredIds,
  includedIds,
  normalizeState,
  planSwitchSuggestion,
  priceIfSelected,
  removePlan,
  selectionIds,
  switchToPlan,
  toggleItem,
} from '@/components/plan-builder/rules';
import { withBonus, withGoals } from '@/components/plan-builder/message';
import { surfaceThemeOf } from '@/components/plan-builder/surface';

/**
 * v3 · Package bonus: Voz and Automatiza include the premium landing at no extra cost.
 * The bonus lives beside `items`, never inside it, so detection and "ahorrás" don't move.
 */
const plan = (id: PlanId) => plans.find((p) => p.id === id)!;
const withoutBonus = (list: readonly Plan[]): Plan[] =>
  list.map((p) => {
    const copy = { ...p };
    delete copy.bonus;
    return copy;
  });
const ctx = { foundersLeft: 0 };
const state = (patch: Partial<PlanState> = {}): PlanState => ({ ...emptyPlanState, ...patch });

describe('content: the bonus', () => {
  it('only Voz and Automatiza carry it, and it is the premium landing', () => {
    expect(plans.filter((p) => p.bonus).map((p) => p.id)).toEqual(['voz', 'automatiza']);
    for (const id of ['voz', 'automatiza'] as const) {
      const bonus = plan(id).bonus!;
      expect(bonus.itemId).toBe('landing');
      expect(items.some((i) => i.id === bonus.itemId)).toBe(true);
    }
  });

  it('is not one of the package items (prices and detection read `items`)', () => {
    for (const p of plans) if (p.bonus) expect(p.items).not.toContain(p.bonus.itemId);
  });

  it('has localized title and text, and promises no price, value or saving', () => {
    for (const p of plans) {
      if (!p.bonus) continue;
      expect(Object.keys(p.bonus).sort()).toEqual(['itemId', 'text', 'title']);
      const landing = items.find((i) => i.id === p.bonus!.itemId)!;
      for (const locale of ['es', 'en', 'pt'] as const) {
        const title = p.bonus.title[locale];
        const text = p.bonus.text[locale];
        expect(title, `${p.id}.${locale}`).toBeTruthy();
        expect(text, `${p.id}.${locale}`).toBeTruthy();
        // Only what the landing item promises today: same name, same description.
        expect(title).toBe(landing.name[locale]);
        expect(text.startsWith(landing.description[locale])).toBe(true);
        // No amounts, no currency, no "valor US$ X".
        expect(`${title} ${text}`).not.toMatch(/\d|\$|USD|US\$|R\$/);
      }
    }
  });
});

describe('lib/pricing ignores the bonus', () => {
  it('planSavings is the same with or without bonuses', () => {
    const bare = withoutBonus(plans);
    for (const p of plans) {
      const twin = bare.find((b) => b.id === p.id)!;
      expect(planSavings(p), p.id).toEqual(planSavings(twin));
    }
    // The approved numbers stay as they were.
    expect(planSavings(plan('automatiza'))).toMatchObject({ separateUsd: 650, savingsPct: 38, show: true });
    expect(planSavings(plan('voz')).show).toBe(false);
  });

  it('detectPlans returns the same matches with or without bonuses', () => {
    const bare = withoutBonus(plans);
    const selections = [
      ['voz'],
      ['voz', 'landing'],
      ['chatbot', 'automatizacion'],
      ['chatbot', 'automatizacion', 'landing'],
      ['landing'],
      ['turnos', 'pedidos', 'automatizacion', 'dashboard', 'landing', 'voz'],
      ['ecommerce', 'turnos', 'pedidos', 'automatizacion', 'dashboard', 'landing', 'gamificacion', 'chatbot'],
    ];
    for (const selection of selections) {
      const ids = (list: ReturnType<typeof detectPlans>) => list.map((m) => m.plan.id);
      expect(ids(detectPlans(selection, plans)), selection.join('+')).toEqual(ids(detectPlans(selection, bare)));
    }
  });

  it('a package quote is the same with or without bonuses (no price for the gift)', () => {
    for (const id of ['voz', 'automatiza'] as const) {
      const q = quote({ planId: id, itemIds: [], maintenanceId: null });
      expect(q.lines).toHaveLength(1);
      expect(q.totalUsd).toBe(plan(id).priceUsd.from);
    }
  });
});

describe('builder: the bonus piece', () => {
  it('bonusOf / coveredIds: only with a bonus package chosen', () => {
    expect(bonusOf(state())).toBeNull();
    expect(bonusOf(state({ planId: 'sistema' }))).toBeNull();
    expect(bonusOf(state({ planId: 'voz' }))?.itemId).toBe('landing');
    expect(includedIds(state({ planId: 'voz' }))).toEqual(['voz']);
    expect(coveredIds(state({ planId: 'voz' }))).toEqual(['voz', 'landing']);
    expect(coveredIds(state({ planId: 'automatiza' }))).toEqual(['chatbot', 'automatizacion', 'landing']);
  });

  it('is never charged as an extra while the package is chosen', () => {
    const s = applyPreset(state(), { planId: 'automatiza', items: ['landing', 'seo'] });
    expect(s.items).toEqual(['seo']);
    expect(normalizeState(state({ planId: 'voz', items: ['landing'] })).items).toEqual([]);
    expect(toggleItem(state({ planId: 'voz' }), 'landing')).toEqual(state({ planId: 'voz' }));
    expect(priceIfSelected(state({ planId: 'voz' }), 'landing', ctx)).toBeNull();
    const q = builderQuote(s, ctx);
    expect(q.lines.map((l) => l.id)).toEqual(['automatiza', 'seo']);
  });

  it('switching to the package from loose pieces includes the landing without charging it', () => {
    const loose = state({ items: ['chatbot', 'automatizacion', 'landing'] });
    const switched = switchToPlan(loose, 'automatiza');
    expect(switched.items).toEqual([]);
    expect(builderQuote(switched, ctx).subtotalUsd).toBe(plan('automatiza').priceUsd.from);
    // The suggestion measures that real difference against the current quote.
    const suggestion = planSwitchSuggestion(loose, ctx);
    expect(suggestion?.plan.id).toBe('automatiza');
    expect(suggestion?.savingsUsd).toBe(builderQuote(loose, ctx).subtotalUsd - plan('automatiza').priceUsd.from);
  });

  it('"Editar pieza por pieza" keeps the package items; the gift goes with the package', () => {
    const s = removePlan(state({ planId: 'voz' }));
    expect(s.planId).toBeNull();
    expect(s.items).toEqual(['voz']);
    expect(selectionIds(state({ planId: 'voz' }))).toEqual(['voz']);
  });

  it('packages without a bonus behave exactly as before', () => {
    const s = state({ planId: 'presencia', items: ['landing', 'seo'] });
    expect(normalizeState(s).items).toEqual(['seo']);
    expect(coveredIds(s)).toEqual(includedIds(s));
  });
});

describe('message helpers', () => {
  const base = ['Hola Eclipse. Armé mi plan en la web:', '• Paquete Voz — desde US$ 500', 'Total estimado: US$ 500', 'Idioma: Español · Moneda: USD'].join('\n');

  it('withBonus adds the gift right after the last priced line', () => {
    expect(withBonus(base, 'Incluido sin cargo: Landing').split('\n')).toEqual([
      'Hola Eclipse. Armé mi plan en la web:',
      '• Paquete Voz — desde US$ 500',
      '• Incluido sin cargo: Landing',
      'Total estimado: US$ 500',
      'Idioma: Español · Moneda: USD',
    ]);
  });

  it('withBonus leaves the message alone without a line, and works after withGoals', () => {
    expect(withBonus(base, '')).toBe(base);
    const both = withBonus(withGoals(base, 'Quiero: atender 24/7'), 'Incluido sin cargo: Landing').split('\n');
    expect(both[1]).toBe('Quiero: atender 24/7');
    expect(both[3]).toBe('• Incluido sin cargo: Landing');
  });
});

describe('surfaceThemeOf (the drawer follows the section it was opened from)', () => {
  // Minimal DOM stand-ins: an element knows its ancestors' classes.
  const el = (classes: string[][]) => ({
    closest(selector: string) {
      const wanted = selector.split(',').map((s) => s.trim().replace(/^\./, ''));
      for (let i = 0; i < classes.length; i++) {
        const own = classes[i];
        if (own.some((c) => wanted.includes(c))) return el(classes.slice(i));
      }
      return null;
    },
    classList: { contains: (c: string) => classes[0]?.includes(c) ?? false },
  });
  const doc = (header: string, center: string[][] = []) =>
    ({
      body: {},
      documentElement: {},
      defaultView: { innerWidth: 1000, innerHeight: 800 },
      querySelector: (s: string) => (s === '.site-header' ? el([['site-header', header]]) : null),
      elementsFromPoint: () => (center.length ? [el(center)] : []),
    }) as unknown as Document;

  it('reads the closest themed section of the trigger', () => {
    const light = el([['btn'], ['pricing', 'theme-light'], ['main']]) as unknown as Element;
    const dark = el([['svc-add'], ['services', 'theme-dark']]) as unknown as Element;
    expect(surfaceThemeOf(light, doc('theme-dark'))).toBe('light');
    expect(surfaceThemeOf(dark, doc('theme-light'))).toBe('dark');
  });

  it('from the header or its menu: the section in view, then the header', () => {
    const fromHeader = el([['btn'], ['site-header', 'theme-dark']]) as unknown as Element;
    expect(surfaceThemeOf(fromHeader, doc('theme-dark', [['p'], ['pricing', 'theme-light']]))).toBe('light');
    const fromMenu = el([['btn'], ['mobile-menu', 'theme-dark']]) as unknown as Element;
    expect(surfaceThemeOf(fromMenu, doc('theme-light'))).toBe('light');
    expect(surfaceThemeOf(null, doc('theme-dark'))).toBe('dark');
  });

  it('defaults to dark without a document or a themed ancestor', () => {
    expect(surfaceThemeOf(null, null)).toBe('dark');
    expect(surfaceThemeOf(el([['x']]) as unknown as Element, doc('none'))).toBe('dark');
  });
});
