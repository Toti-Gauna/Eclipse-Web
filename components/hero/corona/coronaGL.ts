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
  /** Run or pause the render loop (off-screen, hidden tab, covered by the reveal). */
  setActive: (active: boolean) => void;
  dispose: () => void;
}

const MAX_DPR = 1.5;

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

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w && h) renderer.setSize(w, h);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  let raf = 0;
  let running = false;
  let first = true;
  let last = 0;
  let elapsed = Math.random() * 40; // a different sky on every visit

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    // Only advance time while running (no jump after a pause), clamp long frames.
    elapsed += last ? Math.min(now - last, 50) / 1000 : 0;
    last = now;
    const s = read();
    program.uniforms.uTime.value = elapsed;
    program.uniforms.uIntensity.value = s.intensity;
    program.uniforms.uMoon.value[0] = s.moonX;
    program.uniforms.uMoon.value[1] = -s.moonY;
    renderer.render({ scene: mesh });
    if (first) {
      first = false;
      onFirstFrame();
    }
  };

  const setActive = (active: boolean) => {
    if (active === running) return;
    running = active;
    if (active) {
      last = 0;
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
    }
  };

  const onContextLost = (e: Event) => {
    e.preventDefault();
    setActive(false);
    onLost();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  return {
    setActive,
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
