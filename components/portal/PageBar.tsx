import type { TourStep } from '@/components/ui/tour/types';
import { PORTAL_TOURS, PORTAL_TOUR_KEYS, type PortalTourId } from '@/lib/portal/tour';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';
import { PortalGuide } from './guide/PortalGuide';
import { usePortal } from './usePortal';

/**
 * The top line of a portal screen: breadcrumbs and, where the screen has a guide, the
 * "Ayuda" button that restarts it (the guide also opens by itself on the first visit).
 * Step texts are resolved here, on the server, and handed over as plain strings.
 */
export function PageBar({ items, tour }: { items: Crumb[]; tour?: PortalTourId }) {
  const { t } = usePortal();
  const steps: TourStep[] | null = tour
    ? PORTAL_TOURS[tour].map((step) => ({
        ...step,
        title: t(`guide.${tour}.${step.id}.title`),
        body: t(`guide.${tour}.${step.id}.body`),
      }))
    : null;
  return (
    <div className="pt-pagebar">
      <Breadcrumbs items={items} />
      {tour && steps ? (
        <PortalGuide tourKey={PORTAL_TOUR_KEYS[tour]} label={t(`guide.${tour}.label`)} steps={steps} />
      ) : null}
    </div>
  );
}
