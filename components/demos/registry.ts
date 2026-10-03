import type { ComponentType } from 'react';
import type { DemoId } from '@/lib/content';
import type { DemoProps } from './types';

type Loader = () => Promise<{ default: ComponentType<DemoProps> }>;

/** Lazy loaders: a demo's code is only downloaded when it is about to be shown. */
export const demoLoaders: Record<DemoId, Loader> = {
  clinic: () => import('./clinic/ClinicDemo'),
  realEstate: () => import('./real-estate/RealEstateDemo'),
  gym: () => import('./gym/GymDemo'),
  shop: () => import('./shop/ShopDemo'),
  restaurant: () => import('./restaurant/RestaurantDemo'),
  ondemand: () => import('./ondemand/OndemandDemo'),
};
