// Regression fixtures for the pre-campaign catalog. Historical estimates/conditions must stay reproducible.
import oldPlans from '@/content/archive/2026-10-12/plans.json';
import oldItems from '@/content/archive/2026-10-12/items.json';
import oldCare from '@/content/archive/2026-10-12/maintenance.json';
import oldOffers from '@/content/archive/2026-10-12/offers.json';
import oldAddons from '@/content/archive/2026-10-12/addons.json';
import oldVerticals from '@/content/archive/2026-10-12/verticals.json';
import type { Plan, Item, MaintenancePlan, Offer, Addon, Vertical } from '@/lib/content';
const plans=oldPlans.plans as Plan[], items=oldItems.items as Item[], maintenancePlans=oldCare.plans as MaintenancePlan[], offers=oldOffers.offers as Offer[], addons=oldAddons.addons as Addon[], verticals=oldVerticals.verticals as Vertical[];
export const historicalContent={plans,items,maintenancePlans,offers,addons,verticals,featuredPlanId:oldPlans.featured,planById:(id:string)=>plans.find(x=>x.id===id),itemById:(id:string)=>items.find(x=>x.id===id),maintenanceById:(id:string)=>maintenancePlans.find(x=>x.id===id),offerById:(id:string)=>offers.find(x=>x.id===id),verticalById:(id:string)=>verticals.find(x=>x.id===id)};
