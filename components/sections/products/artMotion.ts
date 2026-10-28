'use client';

import { gsap } from '@/components/motion/gsap';

/**
 * The plate's entrance (ProductArt, unit emblems, the Media and Equipment plates), as a paused
 * timeline: the instrument scans the plate left to right (`[data-art-scan]`, a hairline that
 * crosses it while the frame opens with clip-path), its groups (`[data-art]`) come in one after
 * the other, Foody's cloche (`[data-art-lift]`) rises off the plate and the amber point
 * (`[data-art-light]`) lights up last. transform / opacity / clip-path only.
 *
 * Initial states are set here, from JS, so the markup without JS (or with reduced motion,
 * where callers never build this) is the finished plate.
 */
export function artEntrance(frame: Element, { duration = 1.4 }: { duration?: number } = {}): gsap.core.Timeline {
  const q = gsap.utils.selector(frame);
  const groups = q('[data-art]');
  const lift = q('[data-art-lift]');
  const light = q('[data-art-light]');
  const scan = q('[data-art-scan]');
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
  tl.fromTo(frame, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration, ease: 'expo.inOut' }, 0);
  if (scan.length) {
    tl.fromTo(scan, { xPercent: 0, opacity: 1 }, { xPercent: 100, duration, ease: 'expo.inOut' }, 0).to(scan, { opacity: 0, duration: 0.3, ease: 'power1.out' }, duration - 0.15);
  }
  if (groups.length) {
    tl.fromTo(groups, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, stagger: Math.min(0.12, (duration * 0.6) / groups.length) }, 0.15);
  }
  if (lift.length) tl.fromTo(lift, { y: 26 }, { y: 0, duration: 1.1, ease: 'expo.inOut' }, duration * 0.55);
  if (light.length) {
    tl.fromTo(
      light,
      { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' },
      { opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(2)' },
      duration * 0.8,
    );
  }
  // The finished plate keeps no inline clip or transforms behind (a reflow later never sees a stale state).
  tl.eventCallback('onComplete', () => {
    gsap.set(frame, { clearProps: 'clipPath' });
  });
  return tl;
}
