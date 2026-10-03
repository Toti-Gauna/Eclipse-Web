import type { ComponentType } from 'react';
import type { DemoId } from '@/lib/content';
import type { TrailerComponentProps } from './VerticalTrailer';

type Loader = () => Promise<{ default: ComponentType<TrailerComponentProps> }>;

/** Lazy loaders: a trailer's code is only downloaded when its card nears the viewport. */
export const trailerLoaders: Record<DemoId, Loader> = {
  clinic: () => import('./ClinicTrailer'),
  realEstate: () => import('./RealEstateTrailer'),
  gym: () => import('./GymTrailer'),
  shop: () => import('./ShopTrailer'),
  restaurant: () => import('./RestaurantTrailer'),
  ondemand: () => import('./OndemandTrailer'),
};
