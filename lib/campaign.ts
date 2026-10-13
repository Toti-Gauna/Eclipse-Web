import { itemById, planById } from './content';

export function campaignSelection(planId?: string | null, ids: readonly string[] = []): boolean {
  const plan = planById(planId ?? '');
  return (
    !!plan?.campaign || (!plan && ids.length > 0 && ids.every((id) => itemById(id)?.campaign || itemById(id)?.compatiblePlans?.length))
  );
}

/** Invalid selections remain editable and explain their incompatibility; never become a cheap order. */
export function campaignProblem(planId?: string | null, ids: readonly string[] = []): 'incompatible' | 'limit' | null {
  const plan = planById(planId ?? '');
  const extras = ids.filter((id) => !plan?.items.includes(id as never));
  if (
    extras.some((id) => {
      const item = itemById(id);
      return item?.compatiblePlans?.length && !item.compatiblePlans.includes(planId as never);
    })
  )
    return 'incompatible';
  if (plan?.campaign && extras.some((id) => !itemById(id)?.compatiblePlans?.includes(plan.id))) return 'incompatible';
  if (campaignSelection(planId, ids)) {
    const total = (plan?.priceUsd.from ?? 0) + extras.reduce((sum, id) => sum + (itemById(id)?.priceUsd ?? 0), 0);
    if (total < 500 || total > 1000) return 'limit';
  }
  return null;
}

export function bonusMonths(planId: string | null | undefined, maintenanceId: string | null | undefined): number {
  return ['volta', 'velmar'].includes(planId ?? '') && maintenanceId === 'esencial' ? 3 : 0;
}
