'use client';

import { useRef } from 'react';
import type { UnitId } from '@/components/layout/navLinks';
import { useMountEntrance } from './useMountEntrance';

/**
 * The plate at the top of each unit's page, drawn like the products' (hairlines, one amber point,
 * no text): Media is a strip of frames over a timeline, Academy a staircase of six levels with
 * the current step lit, Intelligence a dial and a reading traced back to its source, Agency the
 * core every tool connects to. Decorative (the page's H1 says what it is).
 */
export function UnitEmblem({ id }: { id: UnitId }) {
  const ref = useRef<HTMLDivElement>(null);
  useMountEntrance(ref);
  const Art = EMBLEMS[id];
  return (
    <div ref={ref} className="u-emblem ticks">
      <svg viewBox="0 0 480 400" aria-hidden focusable="false" className="pd-art-svg">
        <Art />
      </svg>
      <span aria-hidden className="pd-scan" data-art-scan />
    </div>
  );
}

const EMBLEMS: Record<UnitId, () => React.ReactElement> = {
  media: MediaEmblem,
  academy: AcademyEmblem,
  intelligence: IntelligenceEmblem,
  agency: AgencyEmblem,
};

function MediaEmblem() {
  const holes = Array.from({ length: 12 }, (_, k) => 76 + k * 29);
  const ticks = Array.from({ length: 19 }, (_, k) => 60 + k * 20);
  return (
    <>
      <g data-art className="pd-dim">
        <rect x="108" y="58" width="340" height="190" rx="4" />
        <rect x="84" y="84" width="340" height="190" rx="4" />
      </g>
      <g data-art>
        <rect x="60" y="110" width="340" height="190" rx="4" />
        {holes.map((x) => (
          <g key={x} className="pd-soft">
            <rect x={x} y="118" width="12" height="9" rx="1.5" />
            <rect x={x} y="283" width="12" height="9" rx="1.5" />
          </g>
        ))}
      </g>
      <g data-art>
        <rect x="78" y="138" width="304" height="134" rx="2" />
        <path d="M214 180V230L256 205Z" />
      </g>
      <g data-art>
        <path d="M60 350H400" />
        {ticks.map((x, k) => (
          <path key={x} d={`M${x} ${k % 5 === 0 ? 338 : 344}V350`} className={k % 5 === 0 ? undefined : 'pd-soft'} />
        ))}
      </g>
      <g data-art-light>
        <path d="M60 350H232" className="pd-light-stroke" />
        <path d="M232 330V368" className="pd-light-stroke" />
        <circle cx="232" cy="328" r="4" className="pd-light-fill" />
        <circle cx="232" cy="328" r="18" className="pd-glow" />
      </g>
    </>
  );
}

function AcademyEmblem() {
  const nodes = Array.from({ length: 6 }, (_, k) => ({ x: 90 + k * 60, y: 274 - k * 40 }));
  return (
    <>
      <g data-art className="pd-dim">
        <path d="M40 330H450" />
      </g>
      <g data-art>
        <path d="M60 330V290H120V250H180V210H240V170H300V130H360V90H420V330Z" />
        <path d="M120 290V330M180 250V330M240 210V330M300 170V330M360 130V330" className="pd-soft" />
      </g>
      <g data-art>
        <path d={`M${nodes.map((n) => `${n.x} ${n.y}`).join('L')}`} className="pd-dotted" />
        {nodes.map((n, k) => (
          <circle key={k} cx={n.x} cy={n.y} r="7" className={k > 2 ? 'pd-soft' : undefined} />
        ))}
        <path d="M86 274L89 277L95 270M146 234L149 237L155 230" />
      </g>
      <g data-art>
        <rect x="52" y="62" width="150" height="104" rx="6" />
        <path d="M70 84H160" className="pd-soft" />
        <circle cx="76" cy="108" r="6" />
        <circle cx="76" cy="128" r="6" />
        <circle cx="76" cy="148" r="6" />
        <circle cx="76" cy="128" r="2.6" className="pd-fill" />
        <path d="M92 108H170M92 128H156M92 148H164" className="pd-soft" />
      </g>
      <g data-art-light>
        <circle cx={nodes[2].x} cy={nodes[2].y} r="4" className="pd-light-fill" />
        <circle cx={nodes[2].x} cy={nodes[2].y} r="20" className="pd-glow" />
      </g>
    </>
  );
}

function IntelligenceEmblem() {
  const cx = 170;
  const cy = 196;
  const ticks = Array.from({ length: 13 }, (_, k) => (Math.PI * k) / 12);
  const at = (a: number, r: number) => [cx + r * Math.cos(Math.PI - a), cy - r * Math.sin(Math.PI - a)].map((v) => v.toFixed(1));
  const needle = at((Math.PI * 130) / 180, 88);
  const points: [number, number][] = [
    [300, 286],
    [326, 266],
    [352, 274],
    [378, 240],
    [404, 250],
    [428, 216],
    [452, 226],
  ];
  return (
    <>
      <g data-art>
        <path d={`M${cx - 112} ${cy}A112 112 0 0 1 ${cx + 112} ${cy}`} />
        <path d={`M${cx - 88} ${cy}A88 88 0 0 1 ${cx + 88} ${cy}`} className="pd-soft" />
        {ticks.map((a, k) => {
          const [x1, y1] = at(a, k % 3 === 0 ? 94 : 100);
          const [x2, y2] = at(a, 112);
          return <path key={k} d={`M${x1} ${y1}L${x2} ${y2}`} className={k % 3 === 0 ? undefined : 'pd-soft'} />;
        })}
        <path d={`M${cx - 120} ${cy}H${cx + 120}`} className="pd-dim" />
      </g>
      <g data-art>
        <path d={`M${cx} ${cy}L${needle[0]} ${needle[1]}`} />
        <circle cx={cx} cy={cy} r="7" />
      </g>
      <g data-art>
        <path d="M296 304H460M296 304V196" className="pd-soft" />
        <path d={`M${points.map(([x, y]) => `${x} ${y}`).join('L')}`} />
        {points.map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="2.4" className="pd-fill" />
        ))}
      </g>
      <g data-art>
        <rect x="318" y="70" width="128" height="74" rx="5" />
        <path d="M334 92H404M334 106H418M334 120H392" className="pd-soft" />
        <path d="M428 204C428 180 404 168 404 144" className="pd-dotted" />
        <circle cx="428" cy="216" r="13" />
        <path d="M428 196V203M428 229V236M408 216H415M441 216H448" />
      </g>
      <g data-art-light>
        <circle cx="428" cy="216" r="4" className="pd-light-fill" />
        <circle cx="428" cy="216" r="20" className="pd-glow" />
      </g>
    </>
  );
}

function AgencyEmblem() {
  const core = { x: 240, y: 204 };
  const spokes: [number, number][] = [
    [106, 112],
    [384, 100],
    [418, 262],
    [112, 300],
    [252, 352],
  ];
  return (
    <>
      <g data-art className="pd-soft">
        {spokes.map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${core.x} ${core.y}L${x} ${y}`} className="pd-dotted" />
        ))}
      </g>
      <g data-art>
        <circle cx={core.x} cy={core.y} r="36" />
        <circle cx={core.x} cy={core.y} r="22" className="pd-soft" />
      </g>
      <g data-art>
        <path d="M70 90H142V128H96L82 140V128H70Z" />
        <path d="M84 104H128M84 116H114" className="pd-soft" />
      </g>
      <g data-art>
        <circle cx="384" cy="100" r="22" />
        {Array.from({ length: 8 }, (_, k) => {
          const a = (Math.PI * 2 * k) / 8;
          return <path key={k} d={`M${(384 + 22 * Math.cos(a)).toFixed(1)} ${(100 + 22 * Math.sin(a)).toFixed(1)}L${(384 + 30 * Math.cos(a)).toFixed(1)} ${(100 + 30 * Math.sin(a)).toFixed(1)}`} />;
        })}
        <circle cx="384" cy="100" r="8" className="pd-soft" />
      </g>
      <g data-art>
        {[0, 1, 2, 3, 4, 5, 6].map((k) => {
          const h = [10, 22, 34, 18, 28, 12, 20][k];
          return <path key={k} d={`M${398 + k * 7} ${262 - h / 2}V${262 + h / 2}`} />;
        })}
      </g>
      <g data-art>
        <rect x="88" y="282" width="48" height="36" rx="5" />
        <path d="M96 294H128M96 306H118" className="pd-soft" />
        <rect x="228" y="338" width="48" height="30" rx="5" />
        <path d="M240 353H264" className="pd-soft" />
      </g>
      <g data-art-light>
        <circle cx={core.x} cy={core.y} r="6" className="pd-light-fill" />
        <circle cx={core.x} cy={core.y} r="30" className="pd-glow" />
      </g>
    </>
  );
}
