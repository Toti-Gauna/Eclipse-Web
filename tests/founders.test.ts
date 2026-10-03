import { describe, expect, it } from 'vitest';
import { createTranslator } from 'next-intl';
import { founders, foundersRemaining, offers, type FounderOffer, type FounderSlot } from '@/lib/content';
import { caseHref, founderOfferOpen, foundersState, logoSrc, monogram, type FoundersData } from '@/lib/founders';
import {
  MAX_ANSWER,
  buildAgentMessage,
  cleanAnswer,
  matchVertical,
  typingDelay,
  type AgentTranslate,
} from '@/components/sections/agent/script';
import es from '@/messages/es.json';
import en from '@/messages/en.json';
import pt from '@/messages/pt.json';

const messages = { es, en, pt };

const filled = (i: number): FounderSlot => ({
  id: `fundador-${i}`,
  filled: true,
  name: `Negocio ${i}`,
  vertical: 'clinicas',
  result: { es: 'Resultado', en: 'Result', pt: 'Resultado' },
});
const empty = (i: number): FounderSlot => ({ id: `fundador-${i}`, filled: false });
const program = (taken: number): FoundersData => ({
  total: 5,
  slots: Array.from({ length: 5 }, (_, i) => (i < taken ? filled(i + 1) : empty(i + 1))),
});

const founderOffer = offers.find((o) => o.kind === 'founder') as FounderOffer;

describe('foundersState', () => {
  it.each([
    [0, 5, false],
    [3, 2, false],
    [5, 0, true],
  ])('%i filled → %i remaining (allFilled: %s)', (taken, remaining, allFilled) => {
    const data = program(taken);
    const state = foundersState(data);
    expect(state).toMatchObject({ total: 5, filled: taken, remaining, allFilled });
    // Same rule as lib/content (used by pricing to switch the founder price off).
    expect(state.remaining).toBe(foundersRemaining(data));
    expect(state.slots).toHaveLength(5);
  });

  it('reads content/founders.json by default (the program starts with 5 empty slots)', () => {
    const state = foundersState();
    expect(state.total).toBe(founders.total);
    expect(state.remaining).toBe(foundersRemaining());
    expect(state.slots.map((s) => s.id)).toEqual(founders.slots.slice(0, founders.total).map((s) => s.id));
  });

  it('normalizes the slot list to exactly `total` entries', () => {
    const short = foundersState({ total: 5, slots: [filled(1), filled(2)] });
    expect(short.slots).toHaveLength(5);
    expect(short.slots.slice(2).every((s) => !s.filled)).toBe(true);
    expect(short).toMatchObject({ filled: 2, remaining: 3, allFilled: false });
    expect(new Set(short.slots.map((s) => s.id)).size).toBe(5);

    const long = foundersState({ total: 5, slots: Array.from({ length: 7 }, (_, i) => filled(i + 1)) });
    expect(long.slots).toHaveLength(5);
    expect(long).toMatchObject({ filled: 5, remaining: 0, allFilled: true });
  });

  it('a program without slots is never "all filled"', () => {
    expect(foundersState({ total: 0, slots: [] })).toMatchObject({ total: 0, remaining: 0, allFilled: false });
  });
});

describe('founderOfferOpen', () => {
  const NOW = new Date('2026-10-02T12:00:00Z');

  it('is open while the offer is live and slots remain', () => {
    expect(founderOfferOpen(founderOffer, { remaining: 5 }, NOW)).toBe(founderOffer.active);
    expect(founderOfferOpen({ ...founderOffer, active: true }, { remaining: 1 }, NOW)).toBe(true);
  });

  it('turns off when every slot is taken, the offer is inactive or missing', () => {
    expect(founderOfferOpen({ ...founderOffer, active: true }, { remaining: 0 }, NOW)).toBe(false);
    expect(founderOfferOpen({ ...founderOffer, active: false }, { remaining: 5 }, NOW)).toBe(false);
    expect(founderOfferOpen(undefined, { remaining: 5 }, NOW)).toBe(false);
  });

  it('respects endsAt, and hides a dated offer until the clock is known', () => {
    const dated = { ...founderOffer, active: true, endsAt: '2026-10-10T00:00:00Z' };
    expect(founderOfferOpen(dated, { remaining: 3 }, NOW)).toBe(true);
    expect(founderOfferOpen(dated, { remaining: 3 }, new Date('2026-10-11T00:00:00Z'))).toBe(false);
    expect(founderOfferOpen(dated, { remaining: 3 }, null)).toBe(false);
    expect(founderOfferOpen({ ...dated, endsAt: null }, { remaining: 3 }, null)).toBe(true);
  });
});

describe('slot helpers', () => {
  it('monogram', () => {
    expect(monogram('Clínica Aurora')).toBe('CA');
    expect(monogram('  estudio   de   diseño norte ')).toBe('EN');
    expect(monogram('Órbita')).toBe('ÓR');
    expect(monogram('')).toBe('·');
    expect(monogram(undefined)).toBe('·');
  });

  it('logo and case links: /public paths get the basePath, absolute URLs pass through', () => {
    expect(logoSrc('/founders/logo.png')).toMatch(/\/founders\/logo\.png$/);
    expect(logoSrc('https://cdn.example.com/logo.svg')).toBe('https://cdn.example.com/logo.svg');
    expect(logoSrc('   ')).toBeNull();
    expect(logoSrc(undefined)).toBeNull();
    expect(caseHref('/casos/uno')).toMatch(/\/casos\/uno$/);
    expect(caseHref('#ejemplos')).toBe('#ejemplos');
    expect(caseHref('https://example.com/caso')).toBe('https://example.com/caso');
    expect(caseHref('')).toBeNull();
  });
});

describe('agent preview script', () => {
  it('cleans free-text answers', () => {
    expect(cleanAnswer('  hola \n\t mundo  ')).toBe('hola mundo');
    expect(cleanAnswer('x'.repeat(200))).toHaveLength(MAX_ANSWER);
    expect(cleanAnswer('Ana', 2)).toBe('An');
    expect(cleanAnswer('   ')).toBe('');
  });

  it('matches typed rubros in any locale, loosely', () => {
    expect(matchVertical('clinica')).toBe('clinicas');
    expect(matchVertical('Clínicas')).toBe('clinicas');
    expect(matchVertical('GYMS')).toBe('gimnasios');
    expect(matchVertical('imobiliária')).toBe('inmobiliarias');
    expect(matchVertical('panadería')).toBeNull();
    expect(matchVertical('otro')).toBeNull();
    expect(matchVertical('  ')).toBeNull();
  });

  it('typing delays stay between 650 ms and 1.5 s', () => {
    expect(typingDelay('')).toBe(650);
    expect(typingDelay('x'.repeat(500))).toBe(1500);
    const mid = typingDelay('¿Qué te gustaría resolver primero?');
    expect(mid).toBeGreaterThan(650);
    expect(mid).toBeLessThan(1500);
  });

  it('builds the WhatsApp summary from the real messages', () => {
    const answers = { verticalId: 'clinicas' as const, vertical: 'Clínicas', need: 'Responder 24/7', name: 'Ana' };
    const t = createTranslator({ locale: 'es', messages: { agent: es.agent }, namespace: 'agent.chat' });
    const translate: AgentTranslate = (key, values) => t(key as never, values as never);
    expect(buildAgentMessage(answers, 'Español', translate)).toBe(
      'Hola Eclipse. Hablé con el agente de la web.\nNombre: Ana\nRubro: Clínicas\nNecesito: Responder 24/7\nIdioma: Español',
    );
  });
});

describe('founders readout message', () => {
  it.each(['es', 'en', 'pt'] as const)('%s: singular and plural', (locale) => {
    const t = createTranslator({ locale, messages: { founders: messages[locale].founders }, namespace: 'founders' });
    expect(t('readout.left', { left: 1 })).not.toBe(t('readout.left', { left: 3 }));
    expect(t('readout.of', { total: 5 })).toMatch(/5/);
  });

  it('es reads "Todavía quedan · 5 · de 5 lugares" / "Queda solo · 1"', () => {
    const t = createTranslator({ locale: 'es', messages: { founders: es.founders }, namespace: 'founders' });
    expect(t('readout.left', { left: 5 })).toBe('Todavía quedan');
    expect(t('readout.left', { left: 1 })).toBe('Queda solo');
    expect(t('readout.of', { total: 5 })).toBe('de 5 lugares');
  });
});
