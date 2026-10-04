/**
 * WebGL corona (OGL). Loaded with a dynamic import() only on capable devices
 * (see canUseCorona.ts) — nothing here is part of the initial bundle.
 *
 * Mounts a transparent canvas inside `host` (a box centered on the eclipse,
 * `bleed` larger than the square on each side so long rays can fade out),
 * renders a fullscreen triangle and exposes a tiny imperative API.
 */
import { Mesh, Program, Renderer, Triangle } from 'ogl';
import { DISC } from '../geometry';
import { FRAGMENT, VERTEX } from './shader';

export interface CoronaFrameState {
  /** 0..1 scroll intensity. */
  intensity: number;
  /** Moon offset in disc radii, screen axes (+y down). */
  moonX: number;
  moonY: number;
}

export interface CoronaHandle {
  /** Allow or forbid drawing (off-screen, hidden tab, covered by the reveal). */
  setActive: (active: boolean) => void;
  /**
   * Keep the corona moving for at least `ms` from now (entrance, scroll, reveal, dial).
   * Otherwise it rests on its last frame: no requestAnimationFrame, no GPU work.
   */
  wake: (ms: number) => void;
  dispose: () => void;
}

/**
 * The corona is soft: rendered at 1.25 device px per CSS px it looks the same as at 1.5
 * (side-by-side check on a 2× screen, hero/gltest) with ~31 % fewer pixels to shade.
 */
const MAX_DPR = 1.25;
/** How fast the corona's clock speeds up when woken / slows to a stop at rest (per 60 Hz frame). */
const EASE_PER_FRAME = 0.06;

export function mountCorona(
  host: HTMLElement,
  {
    bleed,
    read,
    onFirstFrame,
    onLost,
  }: {
    /** Extra size on each side, as a fraction of the eclipse square (matches the host's CSS inset). */
    bleed: number;
    read: () => CoronaFrameState;
    onFirstFrame: () => void;
    onLost: () => void;
  },
): CoronaHandle | null {
  let renderer: Renderer;
  try {
    renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, MAX_DPR),
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });
  } catch {
    return null;
  }
  const gl = renderer.gl;
  if (!gl) return null;
  gl.clearColor(0, 0, 0, 0);

  const canvas = gl.canvas;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'eclipse-gl';

  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex: VERTEX,
    fragment: FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uMoon: { value: [0, 0] },
      uDisc: { value: DISC / (1 + 2 * bleed) },
    },
    depthTest: false,
    depthWrite: false,
  });
  if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) {
    program.remove();
    geometry.remove();
    return null;
  }
  const mesh = new Mesh(gl, { geometry, program });

  host.appendChild(canvas);

  let redraw = () => {};
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    redraw(); // setSize clears the canvas
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  // Demand-driven loop (v3: no permanent decorative animation). It draws while the
  // inputs change (scroll scrub, reveal moon) or while woken; its clock eases to a
  // stop afterwards and the last frame stays on the canvas. Time only advances while
  // drawing, so a new wake continues the same sky without a jump.
  let raf = 0;
  let running = false;
  let first = true;
  let last = 0;
  let awakeUntil = 0;
  let speed = 0;
  let elapsed = Math.random() * 40; // a different sky on every visit
  let prev = { intensity: NaN, moonX: NaN, moonY: NaN };

  const frame = (now: number) => {
    raf = 0;
    const dt = last ? Math.min(now - last, 50) : 0;
    last = now;
    const target = now < awakeUntil ? 1 : 0;
    speed += (target - speed) * Math.min(1, EASE_PER_FRAME * (dt / 16.7 || 1));
    if (speed < 0.004 && target === 0) speed = 0;
    elapsed += (dt / 1000) * speed;
    const s = read();
    const changed = s.intensity !== prev.intensity || s.moonX !== prev.moonX || s.moonY !== prev.moonY;
    prev = s;
    program.uniforms.uTime.value = elapsed;
    program.uniforms.uIntensity.value = s.intensity;
    program.uniforms.uMoon.value[0] = s.moonX;
    program.uniforms.uMoon.value[1] = -s.moonY;
    renderer.render({ scene: mesh });
    if (first) {
      first = false;
      onFirstFrame();
    }
    if (running && (speed > 0 || changed)) raf = requestAnimationFrame(frame);
    else last = 0;
  };
  /** One more frame (or the loop, if woken / still changing). */
  const schedule = () => {
    if (running && !raf) raf = requestAnimationFrame(frame);
  };

  const setActive = (active: boolean) => {
    if (active === running) return;
    running = active;
    if (active) {
      last = 0;
      schedule();
    } else {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const wake = (ms: number) => {
    awakeUntil = Math.max(awakeUntil, performance.now() + ms);
    schedule();
  };
  redraw = schedule;

  const onContextLost = (e: Event) => {
    e.preventDefault();
    setActive(false);
    onLost();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  return {
    setActive,
    wake,
    dispose: () => {
      setActive(false);
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      program.remove();
      geometry.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    },
  };
}
