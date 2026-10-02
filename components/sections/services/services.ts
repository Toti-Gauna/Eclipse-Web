import { itemById, type ItemId } from '@/lib/content';

export type ServiceId = 'webs' | 'systems' | 'voice' | 'chat' | 'commerce' | 'apps';

export interface Service {
  id: ServiceId;
  /** Items from content/items.json preloaded in "Armá tu plan". The first one gives the icon. */
  items: readonly ItemId[];
}

/** The six "Qué hacemos" cards, in display order. Copy lives in messages (`services.items.<id>`). */
export const SERVICES: readonly Service[] = [
  { id: 'webs', items: ['landing'] },
  { id: 'systems', items: ['turnos', 'pedidos'] },
  { id: 'voice', items: ['voz'] },
  { id: 'chat', items: ['chatbot', 'automatizacion'] },
  { id: 'commerce', items: ['ecommerce'] },
  { id: 'apps', items: ['app-ondemand'] },
];

/** Lucide icon name of the service's main item (same icon the builder shows). */
export function serviceIcon(service: Service): string {
  return itemById(service.items[0])?.icon ?? 'Plus';
}

/** Lowest catalog price among the service's items, in USD ("desde"). */
export function serviceFromUsd(service: Service): number | null {
  const prices = service.items.map((id) => itemById(id)?.priceUsd).filter((p): p is number => typeof p === 'number');
  return prices.length ? Math.min(...prices) : null;
}
