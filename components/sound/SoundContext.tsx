'use client';

import { createContext, useContext } from 'react';
import type { SoundApi } from '@/lib/sound/types';

const noop = () => {};

/** Silent default: components can call `play()` even outside the provider. */
export const SoundContext = createContext<SoundApi>({
  enabled: false,
  music: false,
  setEnabled: noop,
  setMusic: noop,
  play: noop,
});

/** `const { play } = useSound(); play('select')` — see lib/sound/types.ts for when to use each. */
export function useSound(): SoundApi {
  return useContext(SoundContext);
}
