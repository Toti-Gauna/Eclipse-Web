import {
  itemById,
  maintenanceById,
  offers as allOffers,
  planById,
  voiceUsage as defaultVoiceUsage,
  type Item,
  type ItemId,
  type MaintenancePlan,
  type Offer,
  type Plan,
  type PlanId,
  type Vertical,
  type VoiceComboOffer,
  type VoiceUsage,
} from '@/lib/content';
import { annualFreeMonths, isOfferActive, maintenanceSuggestion, sumItems, voiceComboApplies } from '@/lib/pricing';

/**
 * "The complete project under the demo": what the demo of a vertical is a sample of, built
 * only from /content (verticals.json `project`, plans, items, maintenance, offers). Pure.
 *
 * - `plan` set (its approved audience names the vertical): the package, the demo pieces it
 *   already covers (`covered`), the ones it doesn't (`extras`, each at its published price),
 *   its bonus (shown as "incluido" only, never as a price or a saving) and its suggested
 *   maintenance (lib/pricing → maintenanceSuggestion: the package's own, raised by an extra
 *   only when the same rule the builder uses says so).
 * - `plan` null: every piece at its published price and NO project price — nothing is summed
 *   or inferred here; the copy says the final price is confirmed in writing.
 * - Notes that come straight from content: the voice agent's monthly usage (when a piece is
 *   the voice agent), the voice combo (only when it applies to this very selection) and the
 *   annual maintenance months (only while that offer is active).
 */
export interface ProjectSummary {
  plan: Plan | null;
  /** Demo pieces the package already includes (plan only; catalog order of the vertical). */
  covered: Item[];
  /** Plan: demo pieces NOT in the package ("también en esta demo"). No plan: every piece. */
  pieces: Item[];
  /** The package's bonus piece (plan only). Shown as "incluido", never priced. */
  bonus: NonNullable<Plan['bonus']> | null;
  maintenance: MaintenancePlan | null;
  /** The voice agent's monthly usage fee applies (a piece is the voice agent). */
  voiceUsage: VoiceUsage | null;
  /** The voice combo applies to this selection and the voice agent is one of `pieces`. */
  voiceCombo: VoiceComboOffer | null;
  /** Months free when paying maintenance yearly (null when that offer is off or there is no maintenance). */
  annualFreeMonths: number | null;
  /** What "Armá este proyecto" hands the builder. */
  preset: { planId: PlanId | null; items: ItemId[] };
}

export function projectSummary(
  vertical: Pick<Vertical, 'project'>,
  {
    offers = allOffers,
    voice = defaultVoiceUsage,
    now = new Date(),
  }: { offers?: readonly Offer[]; voice?: VoiceUsage; now?: Date } = {},
): ProjectSummary | null {
  const project = vertical.project;
  if (!project) return null;
  const ids = [...new Set(project.items)].filter((id) => !!itemById(id));
  const plan = project.plan ? (planById(project.plan) ?? null) : null;
  const inPlan = (id: ItemId) => !!plan && (plan.items.includes(id) || plan.bonus?.itemId === id);
  const covered = ids.filter(inPlan).map((id) => itemById(id)!);
  const pieces = ids.filter((id) => !inPlan(id)).map((id) => itemById(id)!);
  const pieceIds = pieces.map((p) => p.id);

  const maintenanceId = maintenanceSuggestion({ planId: plan?.id ?? null, itemIds: plan ? pieceIds : ids });
  const maintenance = maintenanceById(maintenanceId) ?? null;

  const allIds = new Set<string>([...ids, ...(plan?.items ?? []), ...(plan?.bonus ? [plan.bonus.itemId] : [])]);
  const hasVoice = allIds.has(voice.whenItem);

  // The combo price only matters for a voice agent bought as a piece (a package that already
  // includes it has it in its own price). Same rule as the builder (voiceComboApplies).
  let voiceCombo: VoiceComboOffer | null = null;
  const comboCandidate = offers.find((o): o is VoiceComboOffer => o.kind === 'voiceCombo');
  if (comboCandidate && pieceIds.includes(comboCandidate.itemId)) {
    const restUsd = (plan?.priceUsd.from ?? 0) + sumItems(pieceIds.filter((id) => id !== comboCandidate.itemId));
    voiceCombo = voiceComboApplies({ planId: plan?.id ?? null, restUsd }, offers, now);
  }

  const annual = offers.find((o) => o.kind === 'annualMaintenance');
  const freeMonths = maintenance && isOfferActive(annual, now) ? annualFreeMonths() : null;

  return {
    plan,
    covered,
    pieces,
    bonus: plan?.bonus ?? null,
    maintenance,
    voiceUsage: hasVoice ? voice : null,
    voiceCombo,
    annualFreeMonths: freeMonths && freeMonths > 0 ? freeMonths : null,
    preset: plan ? { planId: plan.id, items: pieceIds } : { planId: null, items: ids },
  };
}
