import type { DemoId } from '@/lib/content';
import type { DemoTourStep } from './tourTypes';
import { tour as clinic } from './clinic/tour';
import { tour as realEstate } from './real-estate/tour';
import { tour as gym } from './gym/tour';
import { tour as shop } from './shop/tour';
import { tour as restaurant } from './restaurant/tour';
import { tour as academy } from './academy/tour';

/** Guide steps per demo (tiny static data; the copy lives in the `demoTours` namespace). */
export const DEMO_TOURS: Record<DemoId, DemoTourStep[]> = { clinic, realEstate, gym, shop, restaurant, academy };
