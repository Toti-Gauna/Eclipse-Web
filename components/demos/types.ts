import type { DemoId, VerticalId } from '@/lib/content';

/**
 * Contract every demo implements (components/demos/<demo>/<Name>Demo.tsx, default export).
 *
 * - `screen="phone"`: the complete, navigable mobile experience (it is the ONLY
 *   screen on mobile, so every feature must be reachable from it).
 * - `screen="laptop"`: the desktop composition ("Escritorio"), shown next to the phone
 *   when the showcase is wide enough (SPLIT_MIN) and as the second tab below that.
 * - `active`: false while hidden/off-screen → pause timers and live simulations.
 * - The demo must render the visible "Demo" badge and the business name with
 *   " — Demo"; never real brands, never real people.
 * - All UI strings come from next-intl (own namespace, e.g. `demoClinic`), all sizes are
 *   relative to the device screen (container query units: cqw/cqh) so it scales.
 * - Build it with the kit (`components/demos/kit.tsx`, guide in components/demos/README.md):
 *   AppShell + a theme, a story store (createDemoStore / useStory / usePairedStore) and modules.
 */
export interface DemoProps {
  screen: 'phone' | 'laptop';
  active: boolean;
}

/** Which device a demo instance renders in. */
export type DemoScreen = DemoProps['screen'];

export interface DemoMeta {
  id: DemoId;
  vertical: VerticalId;
}
