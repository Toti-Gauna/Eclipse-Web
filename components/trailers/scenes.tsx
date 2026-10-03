import type { ReactNode } from 'react';
import type { TrailerNumber } from './timeline';
import './trailer.css';

/**
 * Presentational pieces shared by the trailers and by their static poster.
 * Strings arrive translated; markup follows the contract in timeline.ts.
 */

export function formatTrailerNumber(n: TrailerNumber, localeTag: string): string {
  return `${n.prefix}${new Intl.NumberFormat(localeTag, { maximumFractionDigits: 0 }).format(n.value)}${n.suffix}`;
}

/** "Demo" badge + business name, shown over the top of the stage. */
export function TrailerHudContent({ demoLabel, business }: { demoLabel: string; business: string }) {
  return (
    <>
      <span className="badge-demo">{demoLabel}</span>
      <span>{business}</span>
    </>
  );
}

/** 1 · the problem in big serif text (two lines, the second in italic amber). */
export function SceneProblem({
  kicker,
  line1,
  line2,
  isStatic = false,
}: {
  kicker: string;
  line1: string;
  line2: string;
  /** Visible without the player (poster before the trailer chunk loads). */
  isStatic?: boolean;
}) {
  return (
    <div className="trl-scene trl-problem" data-trailer-scene="problem" data-static={isStatic ? '' : undefined}>
      <p className="trl-kicker" data-trl="kicker">
        {kicker}
      </p>
      <p className="trl-problem-text">
        <span className="trl-line">
          <span data-trl="line">{line1}</span>
        </span>
        <span className="trl-line">
          <em data-trl="line">{line2}</em>
        </span>
      </p>
    </div>
  );
}

/** 2 · pain number / 4 · result number. */
export function SceneFigure({
  name,
  tag,
  demoLabel,
  value,
  label,
  poster = false,
}: {
  name: 'pain' | 'result';
  tag: string;
  demoLabel: string;
  value: string;
  label: string;
  poster?: boolean;
}) {
  return (
    <div
      className={`trl-scene ${name === 'result' ? 'trl-result' : 'trl-pain'}`}
      data-trailer-scene={name}
      data-trailer-poster={poster ? '' : undefined}
    >
      {name === 'result' ? <span className="trl-glow" data-trl="glow" /> : null}
      <p className="trl-tag" data-trl="tag">
        <span className="badge-demo">{demoLabel}</span>
        <span>{tag}</span>
      </p>
      <div className="trl-figure">
        <p className="trl-big" data-trl="num">
          {value}
        </p>
        <div className="trl-big-side">
          <span className="trl-rule" data-trl="rule" />
          <p className="trl-big-label" data-trl="label">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

/** 3 · the demo screen (a light mock drawn with divs) + an optional callout. */
export function SceneDemo({ eyebrow, title, screen, callout }: { eyebrow: string; title: string; screen: ReactNode; callout?: ReactNode }) {
  return (
    <div className="trl-scene trl-demo" data-trailer-scene="demo">
      <div className="trl-demo-copy">
        <p className="trl-kicker" data-trl="copy">
          {eyebrow}
        </p>
        <p className="trl-demo-title" data-trl="copy">
          {title}
        </p>
      </div>
      <div className="trl-panel" data-trl="panel">
        {screen}
      </div>
      {callout}
    </div>
  );
}

/** 5 · Eclipse logo: black disc over the sun, amber corona, tracked wordmark. */
export function SceneLogo({ brand, endLine }: { brand: string; endLine: string }) {
  return (
    <div className="trl-scene trl-logo" data-trailer-scene="logo">
      <div className="trl-eclipse">
        <span className="trl-eclipse-glow" data-trl="eclipse-glow" />
        <span className="trl-eclipse-corona" data-trl="corona" />
        <span className="trl-eclipse-sun" data-trl="sun" />
        <span className="trl-eclipse-moon" data-trl="moon" />
      </div>
      <p className="trl-wordmark">
        {Array.from(brand).map((ch, i) => (
          <span key={i} data-trl="letter">
            {ch}
          </span>
        ))}
      </p>
      <p className="trl-endline" data-trl="endline">
        {endLine}
      </p>
    </div>
  );
}
