'use client';

import type { ReactNode } from 'react';
import type { FacadeKind, Listing, Scene } from './data';

/*
 * Listing "photos" drawn as architectural compositions: flat planes, ink frames and a hard
 * cast shadow, like an architect's elevation in the agency's palette (stone · ink · cobalt ·
 * sand). No external images. Every drawing is 160 × 120 and is cropped by its frame
 * (preserveAspectRatio slice), so it works as a thumbnail and as the listing's hero.
 */

interface Palette {
  sky: string;
  orb: string;
  wall: string;
  wall2: string;
  shade: string;
  glass: string;
  glass2: string;
  lit: string;
  frame: string;
  ground: string;
  green: string;
  slab: string;
}

const SCENES: Record<Scene, Palette> = {
  day: {
    sky: '#D8DDE6',
    orb: '#F6F4EF',
    wall: '#EAE3D6',
    wall2: '#D9CBB3',
    shade: 'rgb(20 20 20 / 0.17)',
    glass: '#9AA9D2',
    glass2: '#BCC6E3',
    lit: '#F2DFB3',
    frame: '#141414',
    ground: '#CEC6B6',
    green: '#59664F',
    slab: '#F6F4EF',
  },
  dusk: {
    sky: '#D9CBB3',
    orb: '#F1E6D1',
    wall: '#CFC1A7',
    wall2: '#B9A685',
    shade: 'rgb(20 20 20 / 0.24)',
    glass: '#2448C8',
    glass2: '#4560CF',
    lit: '#F4D99E',
    frame: '#141414',
    ground: '#AE9F84',
    green: '#4A5443',
    slab: '#ECE8E1',
  },
  night: {
    sky: '#141A2E',
    orb: '#ECE8E1',
    wall: '#36363C',
    wall2: '#2B2B31',
    shade: 'rgb(0 0 0 / 0.32)',
    glass: '#1E2A57',
    glass2: '#26346B',
    lit: '#EBCB88',
    frame: '#0A0A0B',
    ground: '#1F1F25',
    green: '#1B231F',
    slab: '#4A4A50',
  },
};

/** Deterministic 0–1 per index (which windows are lit). */
const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

function Tower({ p, lit }: { p: Palette; lit: (i: number) => string }) {
  const floors = Array.from({ length: 8 }, (_, i) => 18 + i * 11.6);
  return (
    <g>
      <rect x="0" y="46" width="34" height="74" fill={p.wall2} opacity={0.7} />
      {[54, 66, 78, 90].map((y) => (
        <rect key={y} x="8" y={y} width="18" height="3" fill={p.frame} opacity={0.18} />
      ))}
      <path d="M116 12 L130 18 V112 H116 Z" fill={p.wall2} />
      <path d="M116 12 L130 18 V112 H116 Z" fill={p.shade} />
      <rect x="44" y="12" width="72" height="100" fill={p.wall} />
      {floors.map((y, i) => (
        <g key={y}>
          <rect x="50" y={y} width="27" height="8" fill={lit(i * 2)} />
          <rect x="83" y={y} width="27" height="8" fill={lit(i * 2 + 1)} />
          <path d={`M63.5 ${y}v8M96.5 ${y}v8`} stroke={p.frame} strokeWidth="0.7" />
          <rect x="41" y={y + 8} width="78" height="1.8" fill={p.slab} />
          <path d={`M42 ${y + 4.6}h76`} stroke={p.frame} strokeWidth="0.45" opacity={0.6} />
        </g>
      ))}
      <path d="M44 64 L44 112 L102 112 Z" fill={p.shade} />
      <rect x="72" y="100" width="16" height="12" fill={p.frame} />
      <rect x="74" y="102" width="12" height="10" fill={lit(30)} opacity={0.5} />
      <rect x="0" y="112" width="160" height="8" fill={p.ground} />
      <rect x="136.6" y="88" width="1.6" height="24" fill={p.green} />
      <circle cx="137.4" cy="88" r="10" fill={p.green} />
    </g>
  );
}

function Midrise({ p, lit }: { p: Palette; lit: (i: number) => string }) {
  const cols = [40, 58, 76, 94, 112];
  return (
    <g>
      <rect x="28" y="28" width="104" height="5" fill={p.frame} opacity={0.85} />
      <rect x="30" y="33" width="100" height="79" fill={p.wall2} />
      <rect x="30" y="33" width="100" height="3" fill={p.shade} />
      {[40, 57, 74].map((y, r) =>
        cols.map((x, c) => (
          <g key={`${r}-${c}`}>
            <rect x={x} y={y} width="8" height="13" fill={lit(r * 5 + c)} />
            <path d={`M${x - 1} ${y + 9}h10`} stroke={p.frame} strokeWidth="0.9" />
            <path d={`M${x + 4} ${y}v13`} stroke={p.frame} strokeWidth="0.5" opacity={0.7} />
          </g>
        )),
      )}
      <rect x="30" y="92" width="100" height="20" fill={p.wall} />
      <rect x="30" y="92" width="100" height="5" fill="#2448C8" />
      {[34, 46, 58, 70, 82, 94, 106, 118].map((x) => (
        <rect key={x} x={x} y="92" width="4" height="5" fill={p.slab} opacity={0.55} />
      ))}
      <rect x="40" y="99" width="34" height="13" fill={lit(40)} />
      <rect x="86" y="99" width="12" height="13" fill={p.frame} />
      <rect x="104" y="99" width="20" height="13" fill={lit(41)} />
      <path d="M130 33 L130 112 L96 112 L130 52 Z" fill={p.shade} />
      <rect x="0" y="112" width="160" height="8" fill={p.ground} />
      <rect x="12.4" y="84" width="1.8" height="28" fill={p.green} />
      <circle cx="13.3" cy="80" r="12" fill={p.green} />
    </g>
  );
}

function Duplex({ p, lit }: { p: Palette; lit: (i: number) => string }) {
  return (
    <g>
      <rect x="22" y="64" width="92" height="40" fill={p.wall} />
      <rect x="30" y="72" width="52" height="32" fill={lit(1)} />
      <path d="M43 72v32M56 72v32M69 72v32" stroke={p.frame} strokeWidth="0.8" />
      <rect x="90" y="78" width="16" height="26" fill={p.frame} />
      <path d="M22 60.5h30M24 60.5v3.5M30 60.5v3.5M36 60.5v3.5M42 60.5v3.5M48 60.5v3.5" stroke={p.frame} strokeWidth="0.9" />
      <rect x="50" y="34" width="90" height="30" fill={p.wall2} />
      <rect x="58" y="42" width="74" height="13" fill={lit(2)} />
      <path d="M76.5 42v13M95 42v13M113.5 42v13" stroke={p.frame} strokeWidth="0.7" />
      <rect x="50" y="64" width="90" height="4" fill={p.shade} />
      <rect x="114" y="68" width="26" height="36" fill={p.shade} />
      <rect x="114" y="68" width="26" height="36" fill={p.frame} opacity={0.12} />
      <rect x="0" y="104" width="160" height="5" fill={p.ground} />
      <rect x="0" y="109" width="160" height="11" fill={p.glass} />
      <path d="M10 113h18M44 115.5h22M92 113.4h14M124 116h22" stroke={p.slab} strokeOpacity={0.6} strokeWidth="0.8" strokeLinecap="round" />
    </g>
  );
}

function House({ p, lit }: { p: Palette; lit: (i: number) => string }) {
  return (
    <g>
      <path d="M0 74 C30 60 52 66 80 58 C108 50 132 60 160 52 V120 H0 Z" fill={p.wall2} opacity={0.55} />
      <rect x="0" y="96" width="160" height="24" fill={p.ground} />
      <rect x="26" y="62" width="108" height="36" fill={p.wall} />
      <rect x="34" y="68" width="60" height="30" fill={lit(3)} />
      <path d="M49 68v30M64 68v30M79 68v30" stroke={p.frame} strokeWidth="0.8" />
      <rect x="96" y="62" width="38" height="36" fill={p.wall2} />
      <rect x="112" y="68" width="5" height="24" fill={p.frame} />
      <rect x="18" y="56" width="124" height="6" fill={p.slab} />
      <rect x="18" y="61" width="124" height="1" fill={p.frame} opacity={0.5} />
      <rect x="26" y="62" width="108" height="5" fill={p.shade} />
      <path d="M134 62 L134 98 L118 98 Z" fill={p.shade} />
      <rect x="40" y="102" width="74" height="7" fill={p.glass2} />
      <rect x="40" y="102" width="74" height="7" fill="none" stroke={p.slab} strokeWidth="1.1" />
      <rect x="146" y="70" width="2.2" height="28" fill={p.green} />
      <circle cx="147" cy="66" r="15" fill={p.green} />
    </g>
  );
}

function Loft({ p, lit }: { p: Palette; lit: (i: number) => string }) {
  return (
    <g>
      <circle cx="132" cy="22" r="7" fill={p.orb} opacity={0.9} />
      <path d="M24 46 L24 34 L52 46 L52 34 L80 46 L80 34 L108 46 L108 34 L136 46 Z" fill={p.slab} />
      <path d="M24 46 L24 34 L52 46 L52 34 L80 46 L80 34 L108 46 L108 34 L136 46" fill="none" stroke={p.frame} strokeWidth="0.8" />
      <rect x="24" y="46" width="112" height="66" fill={p.wall2} />
      {Array.from({ length: 21 }, (_, i) => (
        <path key={i} d={`M24 ${49 + i * 3}h112`} stroke={p.frame} strokeWidth="0.25" opacity={0.35} />
      ))}
      {[32, 67, 102].map((x, w) => (
        <g key={x}>
          <rect x={x} y="54" width="26" height="42" fill={p.frame} />
          {[0, 1, 2].map((c) =>
            [0, 1, 2, 3].map((r) => <rect key={`${c}-${r}`} x={x + 1.2 + c * 8.2} y={55.2 + r * 10.2} width="7.2" height="9.2" fill={lit(w * 12 + c * 4 + r)} />),
          )}
        </g>
      ))}
      <rect x="62" y="100" width="36" height="12" fill={p.frame} />
      <rect x="0" y="112" width="160" height="8" fill={p.ground} />
    </g>
  );
}

function Ph({ p, lit }: { p: Palette; lit: (i: number) => string }) {
  return (
    <g>
      <rect x="0" y="40" width="34" height="80" fill={p.wall2} opacity={0.6} />
      <rect x="126" y="34" width="34" height="86" fill={p.wall2} opacity={0.5} />
      <rect x="34" y="30" width="92" height="82" fill={p.wall} />
      <rect x="31" y="24" width="98" height="6" fill={p.slab} />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={34 + i * 5.8} y="30" width="2.6" height="2.4" fill={p.frame} opacity={0.35} />
      ))}
      {[46, 72, 98].map((x, i) => (
        <g key={x}>
          <rect x={x} y="38" width="16" height="26" fill={lit(i)} />
          <path d={`M${x + 8} 38v26`} stroke={p.frame} strokeWidth="0.7" />
        </g>
      ))}
      <rect x="42" y="64" width="76" height="2" fill={p.frame} />
      {Array.from({ length: 19 }, (_, i) => (
        <path key={i} d={`M${43.5 + i * 4} 66v5`} stroke={p.frame} strokeWidth="0.7" />
      ))}
      <rect x="42" y="71" width="76" height="1.2" fill={p.frame} />
      <path d="M70 112 V90 A10 10 0 0 1 90 90 V112 Z" fill={p.frame} />
      {[44, 100].map((x, i) => (
        <g key={x}>
          <rect x={x} y="84" width="16" height="24" fill={lit(5 + i)} />
          <rect x={x - 4} y="84" width="4" height="24" fill={p.wall2} />
          <rect x={x + 16} y="84" width="4" height="24" fill={p.wall2} />
        </g>
      ))}
      <path d="M34 30 L34 112 L64 112 L34 70 Z" fill={p.shade} />
      <rect x="0" y="112" width="160" height="8" fill={p.ground} />
      <rect x="143.2" y="86" width="1.8" height="26" fill={p.green} />
      <circle cx="144" cy="82" r="11" fill={p.green} />
    </g>
  );
}

const DRAW: Record<FacadeKind, (props: { p: Palette; lit: (i: number) => string }) => ReactNode> = {
  tower: Tower,
  midrise: Midrise,
  duplex: Duplex,
  house: House,
  loft: Loft,
  ph: Ph,
};

/** A listing's façade. Decorative unless `label` is given. */
export function Facade({ listing, label, className = '' }: { listing: Listing; label?: string; className?: string }) {
  const p = SCENES[listing.scene];
  const seed = listing.id.charCodeAt(0) * 31 + listing.id.charCodeAt(1) * 7;
  const share = listing.scene === 'night' ? 0.55 : listing.scene === 'dusk' ? 0.35 : 0.12;
  const lit = (i: number) => (rand(seed + i) < share ? p.lit : rand(seed + i + 99) < 0.5 ? p.glass : p.glass2);
  const Draw = DRAW[listing.facade];
  return (
    <svg
      viewBox="0 0 160 120"
      preserveAspectRatio="xMidYMid slice"
      className={`re-facade ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect width="160" height="120" fill={p.sky} />
      {listing.scene === 'day' ? <circle cx="26" cy="22" r="9" fill={p.orb} /> : null}
      {listing.scene === 'dusk' ? <circle cx="132" cy="70" r="13" fill={p.orb} opacity={0.75} /> : null}
      <Draw p={p} lit={lit} />
    </svg>
  );
}

/** The apartment's floor plan (3 rooms), drawn like an architect's sheet. */
export function FloorPlan({ labels, className = '' }: { labels: { living: string; bed: string; kitchen: string; bath: string; balcony: string }; className?: string }) {
  return (
    <svg viewBox="0 0 160 104" className={`re-plan ${className}`} aria-hidden>
      <rect x="0" y="0" width="160" height="104" fill="none" />
      <rect x="14" y="10" width="132" height="78" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <path d="M86 10v34M86 54v34M86 44h60M116 44v-34M14 62h44M58 62v26" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 88h44" stroke="var(--demo-accent)" strokeWidth="2.6" />
      <rect x="4" y="92" width="64" height="8" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 1.6" />
      <path d="M86 54 A10 10 0 0 1 96 44" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <path d="M86 44 A10 10 0 0 0 96 54" fill="none" stroke="currentColor" strokeWidth="0.6" opacity={0} />
      <path d="M58 70 A8 8 0 0 1 66 62" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <path d="M116 20 A8 8 0 0 0 108 12" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <g className="re-plan-labels">
        <text x="48" y="38" textAnchor="middle">{labels.living}</text>
        <text x="101" y="30" textAnchor="middle">{labels.bed}</text>
        <text x="116" y="70" textAnchor="middle">{labels.bed}</text>
        <text x="131" y="30" textAnchor="middle">{labels.bath}</text>
        <text x="36" y="78" textAnchor="middle">{labels.kitchen}</text>
        <text x="36" y="98.4" textAnchor="middle">{labels.balcony}</text>
      </g>
    </svg>
  );
}

/** "Approximate location": a street grid with the park, the river and a pin. */
export function MapBlock({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice" className={`re-map ${className}`} aria-hidden>
      <rect width="160" height="96" fill="var(--demo-sunken)" />
      <rect x="96" y="8" width="40" height="26" fill="var(--demo-accent-2)" />
      <path d="M0 80 C40 72 80 90 160 76 V96 H0 Z" fill="var(--demo-accent)" opacity={0.85} />
      <g stroke="var(--demo-surface)" strokeWidth="4">
        <path d="M0 22h160M0 50h160M-4 66 L164 58M30 0v96M70 0v96M118 0 L106 96" />
      </g>
      <g stroke="var(--demo-surface)" strokeWidth="1.4" opacity={0.9}>
        <path d="M0 36h160M50 0v96M90 0v80M140 0v96" />
      </g>
      <circle cx="70" cy="36" r="16" fill="var(--demo-accent)" opacity={0.14} />
      <rect x="65" y="31" width="10" height="10" fill="var(--demo-accent)" />
      <rect x="68.5" y="34.5" width="3" height="3" fill="var(--demo-accent-ink)" />
    </svg>
  );
}
