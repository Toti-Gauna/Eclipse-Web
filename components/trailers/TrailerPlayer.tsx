'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Pause, Play, VolumeX } from 'lucide-react';
import { gsap, useGSAP } from '@/components/motion/gsap';
import { useMediaQuery } from '@/components/motion/useMediaQuery';
import { useReducedMotion } from '@/components/motion/useReducedMotion';
import { track, type AnalyticsProps } from '@/lib/analytics';
import { asset } from '@/lib/env';
import './trailer.css';

/**
 * <TrailerPlayer> — a short, muted, looping "trailer" that is either a video
 * file or a GSAP timeline drawn with DOM scenes.
 *
 * API
 * ---
 * - `title`     Accessible name (e.g. "Clínica Aurora — Demo"). Used by the play button.
 * - `id`        Optional stable id (default: `title`). `trailer_played` is tracked once
 *               per id per browser session.
 * - `src`       Video mode: `{ mp4?, webm?, poster? }` — root-relative paths in /public
 *               (prefixed with the basePath via `asset()`; absolute URLs are kept).
 *               Rendered as `<video muted playsInline loop preload="none">`.
 * - `timeline`  Timeline mode: `(root) => gsap.core.Timeline` builds the trailer over
 *               the scenes passed as `children` (root = the stage element). Return
 *               a NON-repeating timeline of ≈ `durationS`; the player pauses it, loops
 *               it and owns its onUpdate callback (progress bar). Keep the function
 *               identity stable (useCallback): a new function rebuilds the timeline.
 *               Scenes are elements with `[data-trailer-scene]`; mark the "result"
 *               scene with `[data-trailer-poster]` (reduced-motion static frame).
 * - `durationS` Nominal length in seconds (label + reduced-motion stepping). Default 15.
 * - `trigger`   'hover' | 'viewport' | 'auto' (default) | 'manual'.
 *               'auto' = hover on fine pointers (desktop), viewport (≥ 60 % of the
 *               trailer visible, or ≥ 60 % of the viewport filled by it) on touch. Hover listens on the closest `[data-trailer-hover]`
 *               ancestor (e.g. the whole card), or on the player itself.
 * - `posterAt`  Timeline mode: second shown before the first play (full motion).
 * - `trackProps` Extra analytics props for `trailer_played` (e.g. `{ vertical }`).
 * - `description` Screen-reader summary of what the trailer shows.
 * - `hud`       Overlay shown over the top of the stage (e.g. "Demo" badge + name).
 * - `paused`    Force-pause from outside (e.g. while a modal covers the page).
 *
 * Behaviour
 * - Always muted; never plays while off-screen or in a hidden tab.
 * - The play/pause control is a real <button aria-pressed> (≥ 44 px). A manual
 *   choice wins over the automatic trigger.
 * - Reduced motion: never autoplays. The stage shows the result scene as a
 *   static frame; pressing play steps through the scenes with plain fades (the
 *   scene builder is not used at all). Videos simply show their poster.
 */
export interface TrailerSource {
  mp4?: string;
  webm?: string;
  poster?: string;
}

export type TrailerTrigger = 'hover' | 'viewport' | 'auto' | 'manual';

export interface TrailerPlayerProps {
  title: string;
  id?: string;
  src?: TrailerSource;
  timeline?: (root: HTMLElement) => gsap.core.Timeline;
  durationS?: number;
  trigger?: TrailerTrigger;
  posterAt?: number;
  trackProps?: AnalyticsProps;
  description?: string;
  hud?: ReactNode;
  paused?: boolean;
  children?: ReactNode;
  className?: string;
  stageClassName?: string;
}

const SESSION_PREFIX = 'eclipse:trailer:';
const IO_THRESHOLDS = [0, 0.2, 0.4, 0.6, 0.8, 1];

/** /public paths get the basePath; absolute / data / blob URLs are used as is. */
const mediaUrl = (path: string) => (/^(?:[a-z]+:|\/\/)/i.test(path) ? path : asset(path));
const playedThisPage = new Set<string>();

/** `trailer_played`, once per trailer per browser session. */
function trackPlayedOnce(id: string, props: AnalyticsProps) {
  if (playedThisPage.has(id)) return;
  playedThisPage.add(id);
  try {
    const key = `${SESSION_PREFIX}${id}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, '1');
  } catch {
    // Storage blocked: the in-memory set still dedupes for this page.
  }
  track('trailer_played', props);
}

/** Reduced motion: the scenes, one after the other, with plain fades. */
function buildStepTimeline(root: HTMLElement, durationS: number): gsap.core.Timeline {
  const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-trailer-scene]'));
  const tl = gsap.timeline({ paused: true });
  if (!scenes.length) return tl;
  const step = durationS / scenes.length;
  const fade = 0.3;
  scenes.forEach((scene, i) => {
    tl.fromTo(scene, { autoAlpha: 0 }, { autoAlpha: 1, duration: fade, ease: 'none', immediateRender: false }, i * step);
    tl.to(scene, { autoAlpha: 0, duration: fade, ease: 'none' }, (i + 1) * step - fade);
  });
  return tl;
}

/** Reduced-motion static frame: only the poster (result) scene is visible. */
function showPosterScene(root: HTMLElement) {
  const scenes = root.querySelectorAll<HTMLElement>('[data-trailer-scene]');
  const poster = root.querySelector<HTMLElement>('[data-trailer-poster]') ?? scenes[scenes.length - 1];
  gsap.set(scenes, { autoAlpha: 0 });
  if (poster) gsap.set(poster, { autoAlpha: 1 });
}

export function TrailerPlayer({
  title,
  id = title,
  src,
  timeline,
  durationS = 15,
  trigger = 'auto',
  posterAt = 0,
  trackProps,
  description,
  hud,
  paused = false,
  children,
  className = '',
  stageClassName = '',
}: TrailerPlayerProps) {
  const t = useTranslations('trailers.player');
  const reduced = useReducedMotion();
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const mode = trigger === 'auto' ? (finePointer ? 'hover' : 'viewport') : trigger;

  const figure = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const started = useRef(false);

  const [manual, setManual] = useState<'play' | 'pause' | null>(null);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false); // ≥ 60 % visible
  const [onScreen, setOnScreen] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  // Bumped when the timeline is rebuilt so the play effect re-applies.
  const [build, setBuild] = useState(0);

  const autoWants = !reduced && ((mode === 'hover' && hovered) || (mode === 'viewport' && inView));
  const wants = manual === 'play' ? true : manual === 'pause' ? false : autoWants;
  const playing = wants && onScreen && pageVisible && !paused;

  const setProgress = useCallback((p: number) => {
    if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, Math.max(0, p)).toFixed(4)})`;
  }, []);

  // Timeline mode: build (full motion) or step (reduced motion) timeline.
  useGSAP(
    () => {
      const root = stage.current;
      if (!root || src) return;
      let next: gsap.core.Timeline;
      if (reduced || !timeline) {
        showPosterScene(root);
        next = buildStepTimeline(root, durationS);
      } else {
        next = timeline(root);
        next.pause();
        next.seek(posterAt, true);
      }
      next.repeat(-1);
      next.eventCallback('onUpdate', () => setProgress(next.progress()));
      tl.current = next;
      started.current = false;
      setProgress(0);
      setBuild((b) => b + 1);
      return () => {
        next.kill();
        tl.current = null;
      };
    },
    { scope: stage, dependencies: [reduced, timeline, src, durationS, posterAt], revertOnUpdate: true },
  );

  // Visibility: "mostly visible" (viewport trigger) and "any pixel on screen" (pause
  // otherwise). A stage taller than the viewport (landscape phones) counts as mostly
  // visible once it fills 60 % of the viewport.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        const fills = e.rootBounds ? e.intersectionRect.height >= e.rootBounds.height * 0.6 : false;
        setOnScreen(e.isIntersecting);
        setInView(e.isIntersecting && (e.intersectionRatio >= 0.6 || fills));
      },
      { threshold: IO_THRESHOLDS },
    );
    io.observe(el);
    const onVis = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Hover trigger (mouse only), on the card if there is one.
  useEffect(() => {
    if (mode !== 'hover') return;
    const target = figure.current?.closest<HTMLElement>('[data-trailer-hover]') ?? figure.current;
    if (!target) return;
    const enter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') setHovered(true);
    };
    const leave = () => setHovered(false);
    target.addEventListener('pointerenter', enter);
    target.addEventListener('pointerleave', leave);
    // Mounted under a resting mouse (lazy chunk landed while hovering): no pointerenter.
    const raf = requestAnimationFrame(() => {
      if (target.matches(':hover')) setHovered(true);
    });
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener('pointerenter', enter);
      target.removeEventListener('pointerleave', leave);
      setHovered(false);
    };
  }, [mode]);

  // Apply play / pause.
  useEffect(() => {
    const v = video.current;
    const timelineNow = tl.current;
    if (!playing) {
      timelineNow?.pause();
      v?.pause();
      return;
    }
    const first = !started.current;
    started.current = true;
    if (first) trackPlayedOnce(id, { ...trackProps });
    if (v) {
      if (first) v.currentTime = 0;
      v.play().catch(() => {
        // Autoplay can be refused (data saver, policies): the poster stays.
      });
    } else if (timelineNow) {
      if (first) {
        if (reduced) {
          const root = stage.current;
          if (root) gsap.set(root.querySelectorAll('[data-trailer-scene]'), { autoAlpha: 0 });
        }
        timelineNow.restart();
      } else {
        timelineNow.play();
      }
    }
    // trackProps is an options bag: only `playing` / rebuilds should re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, build, id, reduced]);

  // Video progress.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const onTime = () => setProgress(v.duration ? v.currentTime / v.duration : 0);
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, [setProgress, src]);

  const toggle = () => setManual(playing ? 'pause' : 'play');

  return (
    <figure ref={figure} className={`trl ${className}`} data-playing={playing ? '' : undefined}>
      <div ref={stage} aria-hidden className={`trl-stage grain ${stageClassName}`}>
        {src ? (
          <video
            key={`${src.webm ?? ''}|${src.mp4 ?? ''}`}
            ref={video}
            className="trl-video"
            muted
            playsInline
            loop
            preload="none"
            poster={src.poster ? mediaUrl(src.poster) : undefined}
            tabIndex={-1}
          >
            {src.webm ? <source src={mediaUrl(src.webm)} type="video/webm" /> : null}
            {src.mp4 ? <source src={mediaUrl(src.mp4)} type="video/mp4" /> : null}
          </video>
        ) : (
          children
        )}
        <div className="trl-vignette" />
      </div>

      {hud ? (
        <div aria-hidden className="trl-hud">
          <div className="trl-hud-start">{hud}</div>
          <span className="trl-hud-meta">
            <VolumeX className="size-3.5" strokeWidth={1.5} />
            <span>{t('muted')}</span>
            <span className="trl-hud-dot" />
            <span className="tabular">{t('length', { seconds: durationS })}</span>
          </span>
        </div>
      ) : null}

      <div className="trl-controls">
        <button type="button" className="trl-btn" aria-pressed={playing} aria-label={t('play', { title })} onClick={toggle}>
          {playing ? (
            <Pause aria-hidden className="size-4" fill="currentColor" strokeWidth={1.2} />
          ) : (
            <Play aria-hidden className="size-4 translate-x-px" fill="currentColor" strokeWidth={1.2} />
          )}
        </button>
        <span aria-hidden className="trl-progress">
          <span ref={bar} className="trl-progress-bar" />
        </span>
      </div>

      <figcaption className="sr-only">
        {title}. {t('summary', { seconds: durationS })} {description}
      </figcaption>
    </figure>
  );
}
