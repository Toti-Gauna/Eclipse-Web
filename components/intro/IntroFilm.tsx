'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronsRight, Volume2, VolumeX } from 'lucide-react';
import { gsap } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { LOADER_DONE_EVENT, loaderRemainingMs } from '@/components/loader/loaderState';
import { Eclipse } from '@/components/hero/Eclipse';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useSound } from '@/components/sound/SoundContext';
import { track } from '@/lib/analytics';
import { l, levels, productById } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { STAGE, layoutFor, type Layout } from './geometry';
import { IntroScenes, COMING, ZOOMED } from './IntroScenes';
import { buildIntro, type LoopWindow } from './introTimeline';
import { IntroMusic, prepareMusic } from './introAudio';
import { introDone } from './introScript';
import { FILM_END, SCENE } from './score/jingle';
import '@/components/sections/products/products.css';
import '@/components/sections/equipment/equipment.css';
import '@/components/units/units.css';

type How = 'activate' | 'skip' | 'escape';
type SoundState = 'off' | 'loading' | 'on';

const heroEclipse = () => document.querySelector<HTMLElement>('#inicio [data-hero-stage] [data-eclipse]');

/**
 * «Eclipse en 40 segundos» (decision of Ignacio, 28/10/2026): what Eclipse offers and how it all connects, played
 * after the loading screen on every load of the home, ending with «Activar Eclipse», which hands the eclipse over to
 * the hero. A modal <dialog> (the page behind is inert), keyboard first: Tab reaches «Activar sonido» and «Saltar»,
 * Escape skips, «Activar Eclipse» takes the focus at the end card.
 *
 * - The stage is drawn at 1600 × 900 (or 540 × 1080 on portrait screens) and scaled to fit; turning the phone
 *   rebuilds it at the same second.
 * - The clock: the page's (performance.now) until the visitor turns the sound on; then the music's, so cuts land on
 *   the beat. The playhead only moves forward. A hidden tab pauses both.
 * - Plates keep their loops only while their scene is on screen (LoopWindow).
 * - Sound is off until the visitor asks (the site's rule); if they had the site's sound on, the first click or key in
 *   the film turns the music on too.
 * - Reduced motion: no film. The same content as a still card (products, units, the six plans with prices) and
 *   «Activar Eclipse».
 */
export default function IntroFilm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('intro');
  const { format } = useCurrency();
  const sound = useSound();
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [layout, setLayout] = useState<Layout>(() => (typeof window === 'undefined' ? 'land' : layoutFor(window.innerWidth, window.innerHeight)));
  const [reduced] = useState(prefersReducedMotion);
  const [shown, setShown] = useState(false);
  const [soundState, setSoundState] = useState<SoundState>('off');
  const [atEnd, setAtEnd] = useState(false);
  // The film waits on «Activar Eclipse» (a tap is also what lets the browser play the music).
  const [started, setStarted] = useState(false);
  // The stage (the whole film's DOM and its timeline) is built once the phone is idle after the start screen shows,
  // never in the same frame: the button answers at once (a tap before then builds it right away).
  const [stageOn, setStageOn] = useState(false);
  // Where «Activar Eclipse» sits: under the loading screen's wordmark (the loader holds its last frame as the start
  // screen), or centred under its own eclipse when there is no loader to stand on.
  const [onLoader, setOnLoader] = useState<number | null>(null);
  const fromLoader = useRef(false);

  // The film's clock (seconds), shared by every rebuild.
  const clock = useRef({ started: false, wall0: 0, t: 0, hiddenAt: 0 });
  const music = useRef<IntroMusic | null>(null);
  const closing = useRef(false);
  const film = useRef<{ tl: gsap.core.Timeline; loops: LoopWindow[]; running: Map<LoopWindow, () => void> } | null>(null);

  // Open as soon as the loading screen is over (the dialog's top layer would cover it).
  useEffect(() => {
    const show = () => setShown(true);
    const wait = loaderRemainingMs();
    const timer = window.setTimeout(show, wait > 0 ? wait + 600 : 0);
    window.addEventListener(LOADER_DONE_EVENT, show, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(LOADER_DONE_EVENT, show);
    };
  }, []);

  useLayoutEffect(() => {
    const d = dialog.current;
    if (!shown || !d || d.open) return;
    d.showModal();
    // «Activar Eclipse» (the start button) takes the focus; Tab reaches the sound and «Saltar» controls.
    (d.querySelector<HTMLElement>('[data-start]') ?? d).focus({ preventScroll: true });
    // The score (a file rendered at build time) is fetched while the visitor reads the start screen.
    let prep = 0;
    if (!reduced && IntroMusic.supported()) prep = window.setTimeout(() => void prepareMusic().catch(() => {}), 300);
    // The stage waits for an idle moment (at most 1.2 s).
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 400));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const job = reduced ? 0 : idle(() => setStageOn(true), { timeout: 1200 });
    return () => {
      window.clearTimeout(prep);
      cancelIdle(job);
    };
  }, [shown, reduced]);

  // The start screen stands on the loader's last frame: the button goes right under its wordmark and end line.
  useLayoutEffect(() => {
    if (!shown || reduced || started) return;
    const place = () => {
      const loader = document.querySelector<HTMLElement>('.loader');
      const scene = loader?.querySelector<HTMLElement>('.loader-scene');
      const r = scene?.getBoundingClientRect();
      const held = !!loader && getComputedStyle(loader).display !== 'none' && !!r && r.height > 0;
      fromLoader.current = held;
      setOnLoader(held && r ? Math.round(r.bottom) : null);
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [shown, reduced, started]);

  // Fit the stage to the screen; switch composition when the screen turns.
  useLayoutEffect(() => {
    if (!shown) return;
    const fit = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const next = layoutFor(vw, vh);
      setLayout((prev) => (prev === next ? prev : next));
      const { w, h } = STAGE[next];
      const s = Math.min(vw / w, vh / h);
      if (stage.current) stage.current.style.transform = `translate(-50%, -50%) scale(${s})`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [shown, layout]);

  const now = useCallback((): number => {
    const c = clock.current;
    if (music.current?.playing) return music.current.time();
    if (document.visibilityState === 'hidden') return c.t;
    return (performance.now() - c.wall0) / 1000;
  }, []);

  // Build the film for this layout and drive it from the clock.
  useLayoutEffect(() => {
    const root = stage.current;
    if (!shown || reduced || !stageOn || !root) return;
    const built = buildIntro(root, layout, format, { total: fromLoader.current });
    const state = { ...built, running: new Map<LoopWindow, () => void>() };
    film.current = state;
    state.tl.time(Math.min(clock.current.t, FILM_END), true);

    const tick = () => {
      if (closing.current || !clock.current.started) return;
      const c = clock.current;
      const t = Math.max(c.t, now());
      c.t = t;
      const ft = Math.min(t, FILM_END);
      if (ft > state.tl.time()) state.tl.time(ft, false);
      if (fill.current) fill.current.style.transform = `scaleX(${(ft / FILM_END).toFixed(4)})`;
      for (const w of state.loops) {
        const inside = t >= w.from && t < w.to;
        const stop = state.running.get(w);
        if (inside && !stop) state.running.set(w, w.start());
        else if (!inside && stop) {
          stop();
          state.running.delete(w);
        }
      }
      if (t >= SCENE.end + 0.6) setAtEnd(true);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      state.running.forEach((stop) => stop());
      state.running.clear();
      state.tl.kill();
      // Only a rebuild (the screen turned) needs the stage clean. On close the whole stage is about to be removed:
      // clearing thousands of SVG nodes there (GSAP measures each one) froze the page for ~2 s on a tablet right when
      // the home appeared.
      if (!closing.current) gsap.set(root.querySelectorAll('*'), { clearProps: 'transform,opacity,visibility,clipPath' });
      film.current = null;
    };
  }, [shown, reduced, stageOn, layout, format, now]);

  // A hidden tab pauses the film and the music.
  useEffect(() => {
    const onVis = () => {
      const c = clock.current;
      if (document.visibilityState === 'hidden') {
        c.t = now();
        music.current?.suspend();
      } else {
        c.wall0 = performance.now() - c.t * 1000;
        music.current?.resume();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [now]);

  // At the end card, «Activar Eclipse» takes the focus (unless the visitor is elsewhere in the film's controls).
  useEffect(() => {
    if (!atEnd) return;
    const d = dialog.current;
    const active = document.activeElement;
    if (d && (!active || active === document.body || active === d || active.matches('[data-skip]'))) d.querySelector<HTMLElement>('[data-activate]')?.focus({ preventScroll: true });
  }, [atEnd]);

  const startMusic = useCallback(() => {
    if (music.current?.playing || !IntroMusic.supported()) return;
    setSoundState('loading');
    const m = music.current ?? new IntroMusic();
    music.current = m;
    m.start(() => Math.max(clock.current.t, now())).then(
      () => setSoundState(closing.current ? 'off' : 'on'),
      () => setSoundState('off'),
    );
  }, [now]);

  const toggleSound = () => {
    if (soundState === 'off') {
      startMusic();
      if (!sound.enabled) sound.setEnabled(true);
    } else if (soundState === 'on') {
      const c = clock.current;
      c.t = now();
      c.wall0 = performance.now() - c.t * 1000;
      music.current?.mute();
      setSoundState('off');
    }
  };

  const close = useCallback(
    (how: How) => {
      if (closing.current) return;
      closing.current = true;
      const d = dialog.current;
      const t = Math.round(Math.max(clock.current.t, now()));
      track('intro_closed', { how, at: Math.min(t, FILM_END) });
      music.current?.close(0.9);
      film.current?.running.forEach((stop) => stop());
      window.scrollTo(0, 0);
      // From the start screen the loader is still what shows: it dissolves in place onto the page («leave»).
      if (clock.current.started) introDone();
      else document.documentElement.setAttribute('data-intro', 'leave');
      const finish = () => {
        introDone();
        if (d?.open) d.close();
        const h1 = document.getElementById('hero-title');
        if (h1) {
          h1.setAttribute('tabindex', '-1');
          h1.focus({ preventScroll: true });
          h1.addEventListener('blur', () => h1.removeAttribute('tabindex'), { once: true });
        }
        onClose();
      };
      if (!d || reduced || prefersReducedMotion()) {
        if (d) gsap.to(d, { opacity: 0, duration: 0.25, ease: 'power1.out', onComplete: finish });
        else finish();
        return;
      }
      // The hand-over: the film's eclipse lands on the hero's while everything else fades and the page shows through.
      const tl = gsap.timeline({ onComplete: finish, defaults: { ease: 'expo.inOut' } });
      const wrap = d.querySelector<HTMLElement>('[data-eclipse-wrap]');
      const target = heroEclipse()?.getBoundingClientRect();
      const st = stage.current;
      const others = st ? Array.from(st.children).filter((el) => el !== wrap) : [];
      tl.to(others, { autoAlpha: 0, duration: 0.45, ease: 'power2.out' }, 0);
      tl.to(d.querySelectorAll('[data-chrome]'), { autoAlpha: 0, duration: 0.3, ease: 'power2.out' }, 0);
      if (wrap && target && st && target.width > 0) {
        const from = wrap.getBoundingClientRect();
        const s = st.getBoundingClientRect().width / STAGE[layout].w;
        const visible = Number(gsap.getProperty(wrap, 'autoAlpha')) > 0.05;
        const dx = (target.left + target.width / 2 - (from.left + from.width / 2)) / s;
        const dy = (target.top + target.height / 2 - (from.top + from.height / 2)) / s;
        const k = target.width / from.width;
        const sc = Number(gsap.getProperty(wrap, 'scale')) || 1;
        if (visible) {
          // On its way the moon slides back over the sun: it lands as the hero's total eclipse.
          const moon = wrap.querySelector('[data-eclipse-moon]');
          if (moon) tl.to(moon, { xPercent: 0, opacity: 1, duration: 1 }, 0);
          tl.to(wrap, { x: `+=${dx}`, y: `+=${dy}`, scale: sc * k, duration: 1.1 }, 0).to(wrap, { autoAlpha: 0, duration: 0.35, ease: 'power1.out' }, 0.95);
        } else tl.to(wrap, { autoAlpha: 0, duration: 0.2 }, 0);
      }
      tl.to(d.querySelector('[data-bg]'), { opacity: 0, duration: 0.8, ease: 'power2.inOut' }, 0.35);
    },
    [now, onClose, reduced, layout],
  );

  // Escape skips (the dialog's own cancel).
  const onCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    close('escape');
  };

  useEffect(() => () => music.current?.close(0.1), []);

  const begin = () => {
    if (clock.current.started) return;
    clock.current.started = true;
    clock.current.wall0 = performance.now();
    // The loading screen dissolves in place while the film's ignition rises from the same night.
    document.documentElement.setAttribute('data-intro', 'film');
    setStageOn(true);
    setStarted(true);
    startMusic();
    track('intro_started', {});
  };

  const activate: ReactNode = (
    <button type="button" className="btn btn-primary it-activate" data-activate onClick={() => close('activate')}>
      {reduced ? t('activate') : t('enter')}
    </button>
  );

  return (
    <dialog
      ref={dialog}
      className="it"
      aria-label={t('label')}
      onCancel={onCancel}
      tabIndex={-1}
      data-reduced={reduced || undefined}
      data-waiting={!reduced && !started ? '' : undefined}
    >
      <div className="it-bg" data-bg aria-hidden />
      {reduced ? (
        <StillCard activate={activate} />
      ) : (
        <>
          <div className="it-stage theme-dark" data-layout={layout} data-hold={started ? undefined : ''} ref={stage} style={{ width: STAGE[layout].w, height: STAGE[layout].h }}>
            {stageOn ? <IntroScenes layout={layout} activate={activate} /> : null}
          </div>
          {started ? null : (
            <div
              className="it-start theme-dark"
              data-on-loader={onLoader === null ? undefined : ''}
              style={onLoader === null ? undefined : { ['--it-start-top' as string]: `${onLoader}px` }}
            >
              {onLoader === null ? <Eclipse size="var(--it-start-eclipse)" /> : null}
              <div className="it-start-cta">
                <button type="button" className="it-start-btn" data-start onClick={begin}>
                  <span aria-hidden className="it-start-ring" />
                  <span aria-hidden className="it-start-mark" />
                  <span className="it-start-label">{t('start')}</span>
                </button>
                <p className="it-start-hint">{t('startHint')}</p>
              </div>
            </div>
          )}
        </>
      )}

      <div className="it-bar" data-chrome>
        <p className="it-label label">{t('label')}</p>
        <div className="it-actions">
          {reduced || !started ? null : (
            <button
              type="button"
              className="it-ctl"
              data-sound
              aria-pressed={soundState === 'on'}
              aria-busy={soundState === 'loading' || undefined}
              onClick={toggleSound}
              disabled={soundState === 'loading'}
            >
              {soundState === 'on' ? <Volume2 aria-hidden strokeWidth={1.5} /> : <VolumeX aria-hidden strokeWidth={1.5} />}
              <span>{soundState === 'loading' ? t('soundLoading') : soundState === 'on' ? t('soundOff') : t('soundOn')}</span>
            </button>
          )}
          <button type="button" className="it-ctl" data-skip onClick={() => close('skip')}>
            <span>{t('skip')}</span>
            <ChevronsRight aria-hidden strokeWidth={1.5} />
          </button>
        </div>
      </div>
      {reduced || !started ? null : (
        <div className="it-ruler" data-chrome role="progressbar" aria-label={t('progress')} aria-valuemin={0} aria-valuemax={FILM_END} aria-valuenow={atEnd ? FILM_END : undefined}>
          <span className="it-ruler-fill" ref={fill} />
          {Object.values(SCENE).map((s) => (
            <i key={s} className="it-ruler-tick" style={{ left: `${(s / FILM_END) * 100}%` }} />
          ))}
        </div>
      )}
    </dialog>
  );
}

/** Reduced motion: the film's content, still — what Eclipse offers, the units, the six plans priced — and the way in. */
function StillCard({ activate }: { activate: ReactNode }) {
  const t = useTranslations('intro');
  const tp = useTranslations('products');
  const tu = useTranslations('units');
  const tf = useTranslations('footer');
  const locale = useLocale() as Locale;
  const { format } = useCurrency();
  return (
    <div className="it-still theme-dark">
      <h2 className="it-still-title display">{t('static.title')}</h2>
      <div className="it-still-cols">
        <section>
          <h3 className="label">{t('static.products')}</h3>
          <ul>
            {[...ZOOMED, ...COMING].map((id) => (
              <li key={id}>
                <span className="it-still-name">{tp.has(`items.${id}.title`) ? tp(`items.${id}.title`) : tp(`items.${id}.name`)}</span>
                <span className="it-still-sub">{productById(id)?.status === 'soon' ? tp('status.soon') : tp(`items.${id}.rubro`)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="label">{t('static.units')}</h3>
          <ul>
            {(['media', 'academy', 'intelligence', 'agency'] as const).map((id) => (
              <li key={id}>
                <span className="it-still-name">{tu(`${id}.name`)}</span>
                <span className="it-still-sub">{tu(`${id}.short`)}</span>
              </li>
            ))}
            <li>
              <span className="it-still-name">{tf('equipment')}</span>
              <span className="it-still-sub">{t('equipment')}</span>
            </li>
          </ul>
        </section>
        <section>
          <h3 className="label">{t('plans.title')}</h3>
          <ul>
            {levels.map((lv) => (
              <li key={lv.id}>
                <span className="it-still-name">{l(lv.name, locale)}</span>
                <span className="it-still-sub readout">
                  {format(lv.priceUsd)}
                  {t('perMonth')}
                  {lv.priceStatus === 'proposal' ? ` · ${t('plans.proposal')}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <p className="it-still-note">{t('plans.note')}</p>
        </section>
      </div>
      <div className="it-still-cta">{activate}</div>
    </div>
  );
}
