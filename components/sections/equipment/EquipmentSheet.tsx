/**
 * The Equipment kit as an exploded-view drawing: six parts, each with its numbered callout
 * (the numbers match the parts list next to it). Hairlines in the section's ink, one amber
 * point (the display's notice: the physical side showing the digital one).
 *
 * Motion hooks (EquipmentSection): `[data-eq-part]` groups fly out from the middle of the kit
 * to their place (the "despiece"), `[data-eq-callout]` pop in after them, `[data-art-light]`
 * lights up last; `data-active` on a part (hovered in the list) lights it in the accent.
 * Once assembled, the exploded kit floats and its parts keep working (artIdle: the QR is
 * scanned, a key is pressed, the keychain swings). The markup is the final state.
 */
export const EQUIPMENT_PARTS = ['qr', 'displays', 'packaging', 'cards', 'keychains', 'hardware'] as const;
export type EquipmentPart = (typeof EQUIPMENT_PARTS)[number];

/** The middle of each part in the drawing (viewBox units): where it flies out to from the kit's middle. */
export const PART_CENTERS: Record<EquipmentPart, [number, number]> = {
  qr: [110, 122],
  displays: [300, 104],
  packaging: [500, 121],
  cards: [122, 314],
  keychains: [318, 316],
  hardware: [510, 302],
};

/** Where each callout sits and where its leader meets the part (viewBox units). */
const CALLOUTS: Record<EquipmentPart, { at: [number, number]; to: [number, number] }> = {
  qr: { at: [52, 58], to: [80, 78] },
  displays: { at: [392, 40], to: [356, 58] },
  packaging: { at: [600, 62], to: [552, 92] },
  cards: { at: [42, 254], to: [78, 282] },
  keychains: { at: [392, 252], to: [344, 284] },
  hardware: { at: [604, 258], to: [554, 284] },
};

export function EquipmentSheet({ active }: { active: EquipmentPart | null }) {
  return (
    <svg viewBox="0 0 640 400" aria-hidden focusable="false" className="pd-art-svg eq-svg" data-eq-art>
      <g className="pd-dim">
        <path d="M24 196H616" className="pd-dotted" />
        <path d="M320 24V376" className="pd-dotted" />
      </g>

      <g data-eq-part data-part="qr" data-active={active === 'qr' || undefined}>
        <rect x="80" y="70" width="60" height="92" rx="4" />
        <path d="M66 162H154L148 174H72Z" />
        <path d="M90 84H104V98H90ZM116 84H130V98H116ZM90 110H104V124H90Z" />
        <path d="M94 88H100V94H94ZM120 88H126V94H120ZM94 114H100V120H94Z" className="pd-fill" />
        <path d="M110 104H114V108H110ZM118 112H124V118H118ZM110 118H114V124H110ZM124 106H130V110H124Z" className="pd-fill pd-soft-fill" />
        <path d="M92 138H128M98 148H122" className="pd-soft" />
        <path data-i="qr-scan" d="M86 82H134" className="pd-mover" />
      </g>

      <g data-eq-part data-part="displays" data-active={active === 'displays' || undefined}>
        <rect x="246" y="50" width="108" height="80" rx="6" />
        <rect x="254" y="58" width="92" height="64" rx="2" className="pd-soft" />
        <path d="M264 72H300M264 84H318M264 96H292" className="pd-soft" />
        <path d="M300 130L290 156H310Z" />
        <path d="M274 156H326" />
      </g>

      <g data-eq-part data-part="packaging" data-active={active === 'packaging' || undefined}>
        <path d="M450 112L500 90L550 112L500 134Z" />
        <path d="M450 112V160L500 182V134M550 112V160L500 182" />
        <path d="M454 80L500 60L546 80L500 100Z" className="pd-soft" />
        <path d="M475 101L525 123" className="pd-soft" />
        <circle cx="526" cy="150" r="9" className="pd-soft" />
      </g>

      <g data-eq-part data-part="cards" data-active={active === 'cards' || undefined}>
        <rect x="78" y="288" width="86" height="54" rx="4" transform="rotate(-9 121 315)" className="pd-soft" />
        <rect x="80" y="286" width="86" height="54" rx="4" transform="rotate(4 123 313)" />
        <path d="M140 289V343" transform="rotate(4 123 313)" className="pd-dotted" />
        <path d="M92 300H124M92 312H118" transform="rotate(4 123 313)" className="pd-soft" />
        <circle cx="152" cy="316" r="5" transform="rotate(4 123 313)" />
      </g>

      <g data-eq-part data-part="keychains" data-active={active === 'keychains' || undefined}>
        <circle cx="300" cy="286" r="15" />
        <circle cx="300" cy="286" r="9" className="pd-soft" />
        <g data-i="tag">
          <path d="M309 297L344 312C350 314 352 320 350 326L342 344C340 350 334 352 328 350L294 336C288 334 286 328 288 322L296 304" />
          <circle cx="304" cy="312" r="3" className="pd-soft" />
          <path d="M312 324L334 333" className="pd-soft" />
        </g>
      </g>

      <g data-eq-part data-part="hardware" data-active={active === 'hardware' || undefined}>
        <path d="M488 284V258H532V284" className="pd-soft" />
        <path d="M496 266H524M496 274H516" className="pd-soft" />
        <rect x="470" y="284" width="80" height="62" rx="6" />
        <path d="M478 284H542" />
        <g className="pd-soft">
          <rect x="482" y="300" width="14" height="9" rx="1.5" />
          <rect x="503" y="300" width="14" height="9" rx="1.5" />
          <rect x="524" y="300" width="14" height="9" rx="1.5" />
          <rect x="482" y="316" width="14" height="9" rx="1.5" />
          <rect data-i="key" x="503" y="316" width="14" height="9" rx="1.5" />
          <rect x="524" y="316" width="14" height="9" rx="1.5" />
          <rect x="482" y="332" width="56" height="7" rx="1.5" />
        </g>
      </g>

      {EQUIPMENT_PARTS.map((part, i) => {
        const { at, to } = CALLOUTS[part];
        return (
          <g key={part} data-eq-callout data-active={active === part || undefined} className="eq-callout">
            <path d={`M${at[0]} ${at[1]}L${to[0]} ${to[1]}`} className="pd-soft" />
            <circle cx={at[0]} cy={at[1]} r="13" className="eq-callout-disc" />
            <text x={at[0]} y={at[1]} className="eq-num">
              {i + 1}
            </text>
          </g>
        );
      })}

      <g data-art-light>
        <circle cx="336" cy="70" r="4" className="pd-light-fill" />
        <circle cx="336" cy="70" r="14" className="pd-glow" />
      </g>
    </svg>
  );
}
