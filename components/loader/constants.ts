/**
 * Loader timeline (ms after the head script ran), mirrored in loader.css:
 *
 *   0     sun fades in · moon glides over it (0.02–0.80 s)
 *   0.38  ECLIPSE letters rise, 45 ms apart · 0.66 the end line
 *   0.62  corona + glow bloom · 0.74 diamond-ring glint
 *   1.18  the moon (a disc the size of the screen) passes up and away → the page
 *   1.79  gone
 *
 * Reduced motion: the final frame, then a 260 ms fade from 120 ms (≤ 400 ms total).
 */
export const LOADER_REVEAL_AT_MS = 1180;
export const LOADER_END_MS = 1790;
export const LOADER_REDUCED_REVEAL_AT_MS = 120;
export const LOADER_REDUCED_END_MS = 380;

/** Fired on window when the loader ends (or the visitor skips it). */
export const LOADER_DONE_EVENT = 'eclipse:loader-done';
