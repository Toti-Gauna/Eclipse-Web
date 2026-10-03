/**
 * Pure pieces of the scripted agent preview (no React): answer cleanup, loose
 * rubro matching, typing delays and the WhatsApp summary. Unit-tested in
 * tests/founders.test.ts.
 */
import { verticals, type VerticalId } from '@/lib/content';

export type AgentStep = 'idle' | 'vertical' | 'verticalOther' | 'need' | 'name' | 'done';

export const NEED_IDS = ['leads', 'always', 'sell', 'ops'] as const;
export type NeedId = (typeof NEED_IDS)[number];

/** Max characters kept from a free-text answer. */
export const MAX_ANSWER = 80;
export const MAX_NAME = 60;

export interface AgentAnswers {
  /** Matched vertical id ('otro' when the visitor typed something we don't have a demo for). */
  verticalId: VerticalId | null;
  /** What goes in the summary: the localized vertical name or the visitor's own words. */
  vertical: string;
  need: string;
  name: string;
}

export const EMPTY_ANSWERS: AgentAnswers = { verticalId: null, vertical: '', need: '', name: '' };

/** Trims, collapses whitespace, strips control characters and caps the length. */
export function cleanAnswer(text: string, max: number = MAX_ANSWER): string {
  return [...text.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()].slice(0, max).join('').trim();
}

/** Lowercase, no accents, single spaces, without a trailing plural "s". */
function key(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/s$/, '');
}

/**
 * Matches what the visitor typed against our verticals' names in any locale
 * ("clinica", "Gyms", "imobiliária"…). Never returns 'otro'.
 */
export function matchVertical(text: string): VerticalId | null {
  const k = key(text);
  if (!k) return null;
  for (const v of verticals) {
    if (v.id === 'otro') continue;
    const names = [...Object.values(v.name), ...Object.values(v.longName)].map(key);
    if (names.includes(k)) return v.id;
  }
  return null;
}

/** How long the bot "types" before a message appears (ms). */
export function typingDelay(text: string): number {
  return Math.round(Math.min(1500, Math.max(650, 380 + text.length * 14)));
}

export type AgentTranslate = (key: string, values?: Record<string, string | number>) => string;

/** WhatsApp text with the conversation summary (uses the `agent.chat` namespace). */
export function buildAgentMessage(answers: AgentAnswers, languageName: string, t: AgentTranslate): string {
  return t('message', {
    name: answers.name,
    vertical: answers.vertical,
    need: answers.need,
    language: languageName,
  });
}
