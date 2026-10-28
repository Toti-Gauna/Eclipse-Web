/**
 * Eclipse Media's contact sheet: one frame per kind of piece, drawn like the products' plates
 * (hairlines, one amber point, no text). Decorative: each frame's caption names it.
 * Motion hooks: `[data-art]` groups and `[data-art-light]` (artEntrance); `data-i` parts and the
 * hidden `.pd-mover` travellers keep each frame playing once it is exposed (artIdle).
 */
export const MEDIA_FRAMES = ['trailer', 'motion', 'photos', 'social', 'launch', 'models'] as const;
export type MediaFrameId = (typeof MEDIA_FRAMES)[number];

export function MediaFrame({ id }: { id: MediaFrameId }) {
  const Art = FRAMES[id];
  return (
    <svg viewBox="0 0 160 100" aria-hidden focusable="false" className="pd-art-svg" data-media-art={id}>
      <Art />
    </svg>
  );
}

const FRAMES: Record<MediaFrameId, () => React.ReactElement> = {
  trailer: () => (
    <>
      <g data-art>
        <rect x="10" y="8" width="140" height="70" rx="3" />
        <path data-i="play" d="M72 30V58L96 44Z" />
      </g>
      <g data-art className="pd-soft">
        <path d="M10 90H150" />
        <path d="M10 86V94M150 86V94" />
      </g>
      <g data-art-light>
        <path data-i="play-line" d="M10 90H62" className="pd-light-stroke" />
        <circle data-i="play-dot" cx="62" cy="90" r="3" className="pd-light-fill" />
      </g>
    </>
  ),
  motion: () => (
    <>
      <g data-art className="pd-soft">
        <path d="M14 80H146M14 20H146" className="pd-dotted" />
      </g>
      <g data-art>
        <path data-i="curve" d="M18 76C60 76 70 26 140 24" />
        <path d="M18 70L24 76L18 82L12 76Z" />
        <circle cx="52" cy="66" r="1.6" className="pd-fill" />
        <circle cx="74" cy="48" r="1.6" className="pd-fill" />
        <circle cx="98" cy="32" r="1.6" className="pd-fill" />
      </g>
      <path data-i="mover" d="M0 -4L4 0L0 4L-4 0Z" className="pd-fill pd-mover" />
      <g data-art-light>
        <path data-i="key" d="M140 18L146 24L140 30L134 24Z" className="pd-light-fill" />
      </g>
    </>
  ),
  photos: () => (
    <>
      <g data-art className="pd-soft">
        <path d="M22 10L62 46M22 10L96 40" className="pd-dotted" />
      </g>
      <g data-art>
        <path d="M64 30H84V36C90 40 92 46 92 52V74H56V52C56 46 58 40 64 36Z" />
        <path d="M56 58H92" className="pd-soft" />
      </g>
      <g data-art>
        <ellipse cx="74" cy="80" rx="40" ry="7" />
        <path d="M34 80V88C34 92 114 92 114 88V80" className="pd-soft" />
      </g>
      <circle data-i="mover" r="2.2" className="pd-fill pd-mover" />
      <g data-art-light>
        <circle cx="22" cy="10" r="4" className="pd-light-fill" />
        <circle data-i="flash" cx="22" cy="10" r="12" className="pd-glow" />
      </g>
    </>
  ),
  social: () => (
    <>
      <g data-art>
        <rect x="58" y="6" width="44" height="88" rx="7" />
        <path d="M74 12H86" className="pd-soft" />
      </g>
      <g data-art className="pd-soft">
        <g data-i="feed">
          <rect x="64" y="22" width="32" height="34" rx="2" />
          <path d="M64 64H90M64 72H82" />
        </g>
      </g>
      <g data-art>
        <path data-i="heart" d="M80 86C76 82 72 80 72 77A3.5 3.5 0 0 1 80 75A3.5 3.5 0 0 1 88 77C88 80 84 82 80 86Z" />
        <path d="M30 40H48M30 52H44M112 34H130M116 46H130" className="pd-soft" />
      </g>
      <g data-art-light>
        <circle cx="100" cy="8" r="4" className="pd-light-fill" />
      </g>
    </>
  ),
  launch: () => (
    <>
      <g data-art>
        <rect x="30" y="14" width="100" height="74" rx="3" />
        <path d="M30 30H130" />
        <path d="M50 8V20M110 8V20" />
      </g>
      <g data-art className="pd-soft">
        {[0, 1, 2, 3, 4].flatMap((c) =>
          [0, 1, 2].map((r) => (c === 3 && r === 1 ? null : <rect key={`${c}-${r}`} x={40 + c * 18} y={38 + r * 16} width="10" height="9" rx="1" />)),
        )}
      </g>
      <g data-art>
        <path d="M94 50V63" />
        <path data-i="flag" d="M94 50H104L101 53.5L104 57H94" />
      </g>
      <g data-art-light>
        <circle cx="94" cy="63" r="2.6" className="pd-light-fill" />
      </g>
    </>
  ),
  models: () => (
    <>
      <g data-art className="pd-soft">
        <path d="M80 50V92M80 50L36 30M80 50L124 30" className="pd-dotted" />
      </g>
      <g data-art>
        <g data-i="cube">
          <path d="M80 18L114 34V70L80 86L46 70V34Z" />
          <path d="M46 34L80 50L114 34M80 50V86" />
        </g>
      </g>
      <g data-art className="pd-soft">
        <path d="M63 26L97 42M97 26L63 42" className="pd-dotted" />
      </g>
      <g data-art-light>
        <circle cx="80" cy="18" r="3" className="pd-light-fill" />
      </g>
    </>
  ),
};
