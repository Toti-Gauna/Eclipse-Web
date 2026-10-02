import type { DemoId, VerticalId } from '@/lib/content';

/**
 * Contract every demo implements (components/demos/<demo>/<Name>Demo.tsx, default export).
 *
 * - `screen="phone"`: the complete, navigable mobile experience (it is the ONLY
 *   screen on mobile, so every feature must be reachable from it).
 * - `screen="laptop"`: the desktop composition shown next to the phone from md up.
 * - `active`: false while hidden/off-screen → pause timers and live simulations.
 * - The demo must render the visible "Demo" badge and the business name with
 *   " — Demo"; never real brands, never real people.
 * - All UI strings come from next-intl (namespace `demos.<demoId>`), all sizes are
 *   relative to the device screen (container query units: cqw/cqh) so it scales.
 */
export interface DemoProps {
  screen: 'phone' | 'laptop';
  active: boolean;
}

export interface DemoMeta {
  id: DemoId;
  vertical: VerticalId;
}
