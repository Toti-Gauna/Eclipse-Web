/**
 * Corona shader (GLSL ES 1.00, works on WebGL 1 and 2).
 *
 * Polar fbm: broad streamers + fine filaments around the disc, bent slowly
 * sideways with height and time so the rays undulate. Colors go
 * flare #FFE8B0 → corona #F5B942 → transparent; the output is premultiplied
 * alpha and the canvas is composited with `mix-blend-mode: screen` (additive feel).
 *
 * Uniforms:
 *   uTime       seconds (only advances while the loop runs)
 *   uIntensity  0..1, scroll progress through the pinned hero (brighter, longer rays)
 *   uMoon       moon offset in disc radii, GL axes (+y up) — lights the exposed limb
 *   uDisc       disc radius in canvas units (canvas half-size = 1)
 */
export const VERTEX = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const FRAGMENT = /* glsl */ `
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform float uIntensity;
uniform vec2 uMoon;
uniform float uDisc;

const vec3 CORONA = vec3(0.961, 0.725, 0.259);
const vec3 FLARE = vec3(1.0, 0.910, 0.690);
const vec3 WHITE = vec3(1.0, 0.985, 0.95);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p = rot * p * 2.03 + 17.0;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float rn = r / uDisc;              // 1.0 at the limb
  float h = max(rn - 1.0, 0.0);      // height above the limb, in disc radii
  float a = atan(p.y, p.x);
  float t = uTime;
  vec2 dir0 = p / max(r, 1e-4);

  // Slow undulation: rays bend sideways with height and time.
  float bend = smoothstep(0.0, 0.7, h);
  float sway = 0.032 * sin(h * 2.3 - t * 0.3 + sin(a * 3.0) * 1.6)
             + 0.012 * sin(h * 5.0 - t * 0.45 + a * 4.0);
  float ang = a + sway * bend;
  vec2 dir = vec2(cos(ang), sin(ang));

  // Streamers (petals) and filaments: sampled on the unit circle, so seamless.
  float streamers = fbm(dir * 2.1 + vec2(t * 0.021, -t * 0.017));
  float filaments = pow(noise(dir * 23.0 + vec2(-t * 0.035, t * 0.027)), 1.4);
  float fine = noise(dir * 61.0 + vec2(t * 0.02, 3.0));

  float len = mix(0.16, 1.3, smoothstep(0.28, 0.78, streamers)) * (1.0 + 0.45 * uIntensity);
  float rays = exp(-h / len) * (0.3 + 0.9 * filaments) * (0.84 + 0.16 * fine);

  // Inner corona: a tight, bright ring hugging the limb.
  float ring = exp(-h * 18.0) * 1.25 + exp(-h * 5.5) * 0.32;

  // Exposed limb when the moon slides (crescent glow / diamond ring).
  float moonLen = length(uMoon);
  float exposed = clamp(moonLen * 1.6, 0.0, 1.0);
  vec2 limbDir = moonLen > 1e-4 ? -uMoon / moonLen : vec2(0.0);
  float limb = pow(max(dot(dir0, limbDir), 0.0), 5.0) * exp(-h * 3.5) * exposed * 1.6;

  float gain = 0.9 + 0.42 * uIntensity + 0.35 * exposed;
  float v = (rays * 1.15 + ring + limb) * gain;

  // Only outside the limb (the DOM moon covers the inside), fade before the canvas edge.
  v *= smoothstep(0.975, 1.0, rn);
  v *= 1.0 - smoothstep(0.7, 0.99, r);

  vec3 col = mix(CORONA, FLARE, smoothstep(0.22, 1.05, v));
  col = mix(col, WHITE, smoothstep(1.05, 2.0, v));
  float alpha = clamp(v, 0.0, 1.0);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;
