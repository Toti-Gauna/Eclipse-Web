'use client';

/**
 * Single entry point for GSAP. Import gsap/ScrollTrigger/useGSAP from here so the
 * plugins are registered exactly once. MotionPath moves the plates' small travellers (a lead,
 * a parcel, a pulse) along their own dotted routes (transforms only).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, useGSAP);
  gsap.defaults({ ease: 'expo.out', duration: 0.9 });
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, useGSAP };

/** Shared easing names for consistency across sections. */
export const EASE = {
  out: 'expo.out',
  inOut: 'expo.inOut',
  soft: 'power3.out',
} as const;
