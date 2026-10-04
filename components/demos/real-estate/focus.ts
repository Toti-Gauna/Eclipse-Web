import type { EstateSpot } from './data';

/** The element each beat target points at (BEAT_FOCUS → `spot`). */
export const SPOTS: Record<EstateSpot, string> = {
  transcript: '.re-transcript',
  chat: '.re-live-chat, .re-live-empty',
  key: '.re-key',
  calendar: 'section[data-tour="visits"]',
  preview: '.re-preview',
  card: '[data-flip="carolina"]',
};
