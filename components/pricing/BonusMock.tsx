/**
 * A tiny landing page drawn in CSS (no image, no real brand): browser bar, nav, headline,
 * a call to action and a disc with motion trails — the "landing premium con motion
 * graphics" that Voz and Automatiza include. Decorative (aria-hidden); the text next to
 * it says what it is. Styles: pricing.css → "Package bonus".
 */
export function BonusMock({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`pr-mock ${className}`}>
      <span className="pr-mock-bar">
        <i />
        <i />
        <i />
        <span className="pr-mock-url" />
      </span>
      <span className="pr-mock-page">
        <span className="pr-mock-nav">
          <b />
          <i />
          <i />
          <i />
        </span>
        <span className="pr-mock-copy">
          <span className="pr-mock-h" />
          <span className="pr-mock-h pr-mock-h--short" />
          <span className="pr-mock-p" />
          <span className="pr-mock-cta" />
        </span>
        <span className="pr-mock-motion">
          <span className="pr-mock-trail" />
          <span className="pr-mock-trail pr-mock-trail--2" />
          <span className="pr-mock-disc" />
        </span>
        <span className="pr-mock-cards">
          <i />
          <i />
          <i />
        </span>
      </span>
    </div>
  );
}
