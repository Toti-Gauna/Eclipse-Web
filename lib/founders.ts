/**
 * Pure helpers over the founders program data (content/founders.json).
 *
 * Rules (brief §8):
 * - The program has `total` slots (5). Filled slots show the client; empty ones invite.
 * - While at least one slot is free the section is "Clientes fundadores", shows the
 *   "Quedan X de 5" counter and the founder price offer can apply.
 * - When every slot is filled the section becomes "Clientes", the counter disappears
 *   and the founder price offer turns off (lib/pricing also requires foundersLeft > 0).
 */
import { founders as defaultFounders, foundersRemaining, type FounderOffer, type FounderSlot } from '@/lib/content';
import { isOfferActive } from '@/lib/pricing';
import { asset } from '@/lib/env';

export interface FoundersData {
  total: number;
  slots: FounderSlot[];
}

export interface FoundersState {
  total: number;
  filled: number;
  remaining: number;
  allFilled: boolean;
  /** Exactly `total` slots, in order: extra entries are dropped, missing ones become empty slots. */
  slots: FounderSlot[];
}

export function foundersState(data: FoundersData = defaultFounders): FoundersState {
  const total = Math.max(0, Math.floor(data.total));
  const slots: FounderSlot[] = Array.from(
    { length: total },
    (_, i) => data.slots[i] ?? { id: `fundador-${i + 1}`, filled: false },
  );
  const filled = slots.filter((s) => s.filled).length;
  // Same rule as lib/content foundersRemaining(), measured over the normalized slots.
  const remaining = foundersRemaining({ total, slots });
  return { total, filled, remaining, allFilled: total > 0 && remaining === 0, slots };
}

/**
 * The founder price applies only while the offer is live AND slots remain.
 * `now: null` means "clock not known yet" (SSR / hydration): an offer with an
 * `endsAt` stays hidden until the client knows the time, one without it doesn't care.
 */
export function founderOfferOpen(
  offer: FounderOffer | undefined,
  state: Pick<FoundersState, 'remaining'>,
  now: Date | null = new Date(),
): boolean {
  if (!offer || state.remaining <= 0) return false;
  if (offer.endsAt && now === null) return false;
  return isOfferActive(offer, now ?? new Date());
}

/** Up to two initials for the fallback logo ("Clínica Aurora" → "CA"). */
export function monogram(name: string | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '·';
  const letters = words.length === 1 ? [...words[0]].slice(0, 2) : [[...words[0]][0], [...words[words.length - 1]][0]];
  return letters.join('').toLocaleUpperCase();
}

/** Logo src: files in /public get the basePath; absolute URLs pass through. */
export function logoSrc(logo: string | undefined): string | null {
  const value = logo?.trim();
  if (!value) return null;
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) return value;
  return asset(value);
}

/** Case links: internal paths get the basePath, external URLs pass through. */
export function caseHref(caseUrl: string | undefined): string | null {
  const value = caseUrl?.trim();
  if (!value) return null;
  if (/^(https?:|mailto:)/i.test(value) || value.startsWith('#')) return value;
  return asset(value);
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
