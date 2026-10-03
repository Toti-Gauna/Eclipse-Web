'use client';

import { useId } from 'react';
import type { Listing, Scene } from './data';

/*
 * Listing "photos": small architectural illustrations drawn in SVG (no external
 * images). The scene (sky / light) and the facade tone vary per listing; the
 * building follows the property type and a couple of its features.
 */

interface Palette {
  sky: string[];
  orb: string;
  orbR: number;
  orbAt: [number, number];
  ground: string;
  lawn: string;
  silhouette: string;
  glass: string;
  lit: string;
  litRatio: number;
  shade: number;
}

const SCENES: Record<Scene, Palette> = {
  morning: {
    sky: ['#f1c39b', '#f9dfc4', '#fcefe1'],
    orb: '#f6a764',
    orbR: 9,
    orbAt: [132, 30],
    ground: '#d8c6ab',
    lawn: '#a7bb88',
    silhouette: '#e9c3a6',
    glass: '#9fb6c9',
    lit: '#ffd58a',
    litRatio: 0.12,
    shade: 0,
  },
  day: {
    sky: ['#8fbbe2', '#c3dbef', '#e9f2f8'],
    orb: '#fff3c6',
    orbR: 7,
    orbAt: [136, 20],
    ground: '#cfc6b4',
    lawn: '#9db884',
    silhouette: '#b7cde0',
    glass: '#86a8c6',
    lit: '#bcd4e8',
    litRatio: 0.2,
    shade: 0,
  },
  dusk: {
    sky: ['#5f5694', '#d9867a', '#f6c99c'],
    orb: '#ffd7a1',
    orbR: 11,
    orbAt: [138, 66],
    ground: '#b48f86',
    lawn: '#7f8f73',
    silhouette: '#9a7aa0',
    glass: '#5d6891',
    lit: '#ffcf7a',
    litRatio: 0.45,
    shade: 0.18,
  },
  night: {
    sky: ['#10162c', '#1f2a4d', '#34416b'],
    orb: '#efe6cf',
    orbR: 6,
    orbAt: [130, 20],
    ground: '#262d48',
    lawn: '#253049',
    silhouette: '#1d2542',
    glass: '#28304d',
    lit: '#ffcf70',
    litRatio: 0.55,
    shade: 0.55,
  },
};

const FACADES = ['#efe6d8', '#e0d3c1', '#d6dde3', '#ead9c6', '#d3d9cf'];
const ROOFS = ['#8f5a46', '#5d6577', '#7a5c4b', '#6b5148', '#566270'];

/** Darkens a hex color toward night blue by `k` (0–1). */
function shadeHex(hex: string, k: number): string {
  if (!k) return hex;
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number, to: number) => Math.round(c + (to - c) * k);
  const r = mix(n >> 16, 0x2a);
  const g = mix((n >> 8) & 0xff, 0x31);
  const b = mix(n & 0xff, 0x52);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Deterministic pseudo-random 0–1 for window lights. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export function Thumb({ listing, className = '' }: { listing: Listing; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const p = SCENES[listing.scene];
  const facade = shadeHex(FACADES[listing.tone % FACADES.length], p.shade);
  const facade2 = shadeHex(FACADES[(listing.tone + 2) % FACADES.length], p.shade);
  const trim = shadeHex('#b9ab98', p.shade);
  const roof = shadeHex(ROOFS[listing.tone % ROOFS.length], p.shade * 0.6);
  const seed = listing.id.charCodeAt(0) * 31 + listing.id.charCodeAt(1);
  const win = (i: number) => (rand(seed + i) < p.litRatio ? p.lit : p.glass);
  const has = (f: string) => listing.features.includes(f as never);
  const tree = shadeHex('#6f9466', p.shade);
  const treeDark = shadeHex('#567a52', p.shade);

  const sky = `${uid}-sky`;
  const fade = `${uid}-fade`;

  return (
    <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden className={`block ${className}`}>
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="0.6" stopColor={p.sky[1]} />
          <stop offset="1" stopColor={p.sky[2]} />
        </linearGradient>
        <linearGradient id={fade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill={`url(#${sky})`} />
      {/* sun / moon */}
      <circle cx={p.orbAt[0]} cy={p.orbAt[1]} r={p.orbR * 1.9} fill={p.orb} opacity={0.18} />
      <circle cx={p.orbAt[0]} cy={p.orbAt[1]} r={p.orbR} fill={p.orb} />
      {listing.scene === 'night' ? (
        <g fill="#fff" opacity={0.75}>
          <circle cx="18" cy="14" r="0.7" />
          <circle cx="44" cy="8" r="0.6" />
          <circle cx="96" cy="12" r="0.8" />
          <circle cx="112" cy="30" r="0.5" />
          <circle cx="150" cy="40" r="0.6" />
          <circle cx="70" cy="6" r="0.5" />
        </g>
      ) : null}

      {listing.type === 'apartment' ? (
        <g>
          {/* neighbours */}
          <rect x="6" y="44" width="30" height="56" fill={p.silhouette} opacity={0.9} />
          <rect x="122" y="36" width="34" height="64" fill={p.silhouette} opacity={0.75} />
          {/* tower */}
          <rect x="46" y="14" width="68" height="4" rx="0.8" fill={trim} />
          <rect x="49" y="17" width="62" height="83" fill={facade} />
          <rect x="49" y="17" width="5" height="83" fill="#000" opacity={0.05} />
          {Array.from({ length: 6 }, (_, r) =>
            Array.from({ length: 4 }, (_, c) => (
              <rect key={`${r}-${c}`} x={55.5 + c * 13.6} y={23 + r * 11.4} width="9.4" height="7.4" rx="0.6" fill={win(r * 4 + c)} />
            )),
          )}
          {has('balcony')
            ? Array.from({ length: 6 }, (_, r) => <rect key={r} x="51" y={30.6 + r * 11.4} width="58" height="1.5" rx="0.5" fill={trim} />)
            : null}
          <rect x="73" y="88" width="14" height="12" rx="1" fill={shadeHex('#5c4a3f', p.shade)} />
          {/* street trees */}
          <rect x="38.6" y="80" width="1.8" height="14" fill={treeDark} />
          <circle cx="39.5" cy="77" r="7" fill={tree} />
          <rect x="119.6" y="82" width="1.8" height="12" fill={treeDark} />
          <circle cx="120.5" cy="79" r="6" fill={treeDark} />
          <rect x="0" y="93" width="160" height="7" fill={p.ground} />
        </g>
      ) : null}

      {listing.type === 'house' ? (
        <g>
          <rect x="0" y="76" width="160" height="24" fill={p.lawn} />
          <rect x="0" y="74" width="34" height="6" rx="3" fill={treeDark} />
          {/* chimney + roof */}
          <rect x="96" y="28" width="8" height="16" fill={trim} />
          <path d="M34 54 L78 26 L122 54 Z" fill={roof} />
          <rect x="40" y="52" width="76" height="32" fill={facade} />
          <path d="M34 54 L78 26 L122 54" fill="none" stroke={shadeHex('#000000', 0)} strokeOpacity={0.12} strokeWidth="1.2" />
          <rect x="48" y="60" width="15" height="12" rx="0.8" fill={win(1)} />
          <rect x="93" y="60" width="15" height="12" rx="0.8" fill={win(2)} />
          <path d="M55.5 60v12M48 66h15M100.5 60v12M93 66h15" stroke={facade} strokeWidth="1" />
          <rect x="71" y="64" width="13" height="20" rx="1" fill={shadeHex('#6d4c3d', p.shade)} />
          <circle cx="81" cy="74.5" r="0.8" fill={p.lit} />
          <circle cx="78" cy="38" r="3.4" fill={win(3)} />
          {/* tree */}
          <rect x="135" y="58" width="3" height="26" fill={treeDark} />
          <circle cx="136.5" cy="52" r="12" fill={tree} />
          <circle cx="128" cy="60" r="7.5" fill={treeDark} />
          {has('pool') ? <rect x="8" y="86" width="40" height="8" rx="2" fill="#7fc3d6" stroke="#f4f1ea" strokeWidth="1.2" /> : null}
          <rect x="60" y="84" width="34" height="16" fill={p.ground} opacity={0.55} />
        </g>
      ) : null}

      {listing.type === 'duplex' ? (
        <g>
          <circle cx="20" cy="64" r="12" fill={tree} />
          <rect x="18.6" y="70" width="2.8" height="20" fill={treeDark} />
          {/* upper volume */}
          <rect x="52" y="30" width="72" height="2.6" rx="0.6" fill={trim} />
          <rect x="54" y="32" width="68" height="26" fill={facade2} />
          <rect x="60" y="38" width="24" height="13" rx="0.6" fill={win(1)} />
          <rect x="89" y="38" width="27" height="13" rx="0.6" fill={win(2)} />
          {/* lower volume */}
          <rect x="32" y="54" width="82" height="2.6" rx="0.6" fill={trim} />
          <rect x="34" y="56.6" width="78" height="31.4" fill={facade} />
          <rect x="40" y="63" width="38" height="19" rx="0.6" fill={win(3)} />
          <path d="M52.6 63v19M65.3 63v19" stroke={facade} strokeWidth="0.9" />
          <rect x="85" y="66" width="13" height="22" rx="0.8" fill={shadeHex('#4f5560', p.shade)} />
          {has('terrace') ? <path d="M33 54V49h19M38 49v5M43 49v5M48 49v5" fill="none" stroke={trim} strokeWidth="1.1" /> : null}
          <rect x="0" y="88" width="160" height="12" fill={p.ground} />
        </g>
      ) : null}

      {has('river') ? (
        <g>
          <rect x="0" y="93" width="160" height="7" fill={shadeHex('#7fb0cc', p.shade * 0.8)} />
          <path d="M8 96h14M40 97.5h18M92 96.2h12M124 97.6h20" stroke="#fff" strokeOpacity={0.55} strokeWidth="0.8" strokeLinecap="round" />
        </g>
      ) : null}
      <rect width="160" height="100" fill={`url(#${fade})`} />
    </svg>
  );
}
