/**
 * A person in the plates' hand (hairlines, no face, no text): the visitor walking up to Roofy's door, the specialist
 * with a toolbox on his way in Handy, the people of the intro film. Feet at (0, 0), about 50 units tall.
 *
 * Motion hooks (artIdle / the intro): `[data-walker-move]` slides along the ground, `[data-walker-leg]`,
 * `[data-walker-arm]` swing from the hip and the shoulder, `[data-walker-body]` bobs. Standing still without JS.
 */
export function Walker({
  x,
  y,
  s = 1,
  carry,
  hook,
  className = '',
}: {
  x: number;
  y: number;
  s?: number;
  /** What it carries in its right hand. */
  carry?: 'toolbox' | 'bag' | 'tray';
  /** `data-i` of the moving part (what artIdle looks for). */
  hook?: string;
  className?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className={className}>
      <g data-walker-move data-i={hook}>
        <g data-walker-body>
          <circle cx="0" cy="-46" r="6" />
          <path d="M0 -40V-16" />
          <path data-walker-arm="a" d="M0 -34L-8 -21" />
          <path data-walker-arm="b" d="M0 -34L8 -21" />
          {carry === 'toolbox' ? <path d="M5 -22H17V-14H5ZM9 -22V-25H13V-22" /> : null}
          {carry === 'bag' ? <path d="M6 -22H15L16 -12H5ZM8 -22C8 -26 13 -26 13 -22" /> : null}
          {carry === 'tray' ? <path d="M4 -30H20M12 -30V-33" /> : null}
        </g>
        <path data-walker-leg="a" d="M0 -16L-6 0" />
        <path data-walker-leg="b" d="M0 -16L6 0" />
      </g>
    </g>
  );
}
