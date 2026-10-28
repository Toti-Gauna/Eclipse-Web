import type { ProductId } from '@/lib/content';

/**
 * The four products drawn as instrument plates (v2 "Efemérides"): 1px hairlines in the section's
 * ink, one amber point of light per plate (the thing the product makes happen) and no text, so
 * nothing in them needs translating. Decorative: the screen's copy says what they show.
 *
 * Motion hooks (useProductsMotion / ProductPage): every `[data-art]` group is revealed in order
 * (opacity + a short rise), `[data-art-light]` lights up last, and Foody's cloche
 * (`[data-art-lift]`) rises off the plate like the moon leaving the disc. The markup is the
 * final state: without JS or with reduced motion the plate is simply there.
 */
export function ProductArt({ id, className = '' }: { id: ProductId; className?: string }) {
  const Art = ART[id];
  return (
    <svg viewBox="0 0 480 400" aria-hidden focusable="false" className={`pd-art-svg ${className}`} data-product-art={id}>
      <Art />
    </svg>
  );
}

const ART: Record<ProductId, () => React.ReactElement> = {
  roofy: Roofy,
  foody: Foody,
  markyt: Markyt,
  handy: Handy,
  gym: Gym,
  dental: Dental,
  clinic: Clinic,
  vet: Vet,
};

/** Roofy: the agency's elevation (the roof) with one window lit, wired to a contact card and the visits calendar. */
function Roofy() {
  return (
    <>
      <g data-art className="pd-dim">
        <path d="M24 330H456" />
        <path d="M96 62V78M300 62V78M96 70H300" />
        <path d="M60 176V330M54 176H66M54 330H66" />
      </g>
      <g data-art>
        <path d="M84 178L198 96L312 178" />
        <path d="M102 178L198 110L294 178" className="pd-soft" />
        <path d="M258 136V114H276V149" />
        <path d="M96 178H300V330H96Z" />
        <path d="M96 248H300" className="pd-soft" />
      </g>
      <g data-art>
        <path d="M118 194H158V236H118ZM238 194H278V236H238Z" />
        <path d="M138 194V236M258 194V236M118 215H158M238 215H278" className="pd-soft" />
        <path d="M118 266H158V306H118ZM238 266H278V306H238Z" />
        <path d="M138 266V306M258 266V306" className="pd-soft" />
        <path d="M180 264H216V330H180Z" />
        <circle cx="209" cy="298" r="1.6" className="pd-fill" />
      </g>
      <g data-art className="pd-soft">
        <path d="M106 340H290M126 350H270" />
      </g>
      <g data-art>
        <path d="M218 215C262 215 290 162 328 162" className="pd-dotted" />
        <rect x="330" y="118" width="126" height="86" rx="6" />
        <circle cx="353" cy="145" r="11" />
        <path d="M372 139H436M372 152H418" className="pd-soft" />
        <path d="M344 184H442" className="pd-soft" />
        <path d="M344 184H404" className="pd-bar" />
      </g>
      <g data-art>
        <rect x="330" y="222" width="126" height="96" rx="6" />
        <path d="M330 244H456" />
        <path d="M352 232H372M414 232H434" className="pd-soft" />
        <g className="pd-soft">
          <circle cx="352" cy="262" r="2" />
          <circle cx="374" cy="262" r="2" />
          <circle cx="396" cy="262" r="2" />
          <circle cx="418" cy="262" r="2" />
          <circle cx="440" cy="262" r="2" />
          <circle cx="352" cy="282" r="2" />
          <circle cx="374" cy="282" r="2" />
          <circle cx="418" cy="282" r="2" />
          <circle cx="440" cy="282" r="2" />
          <circle cx="352" cy="302" r="2" />
          <circle cx="374" cy="302" r="2" />
          <circle cx="396" cy="302" r="2" />
        </g>
        <circle cx="396" cy="282" r="8" />
      </g>
      <g data-art-light>
        <rect x="178" y="194" width="40" height="42" className="pd-light-fill" />
        <circle cx="198" cy="215" r="46" className="pd-glow" />
        <circle cx="396" cy="282" r="3" className="pd-light-fill" />
      </g>
    </>
  );
}

/** Foody: the plate as the eclipse's disc, its cloche lifting off like the moon; cutlery and a QR menu. */
function Foody() {
  return (
    <>
      <g data-art className="pd-dim">
        <path d="M24 326H456" />
      </g>
      <g data-art>
        <circle cx="196" cy="226" r="96" />
        <circle cx="196" cy="226" r="74" className="pd-soft" />
      </g>
      <g data-art>
        <path d="M62 132V196M54 132V170M70 132V170M54 170C54 184 70 184 70 170" />
        <path d="M62 196V316" />
        <path d="M330 132C344 162 344 196 330 214V316" />
        <path d="M330 214H336" className="pd-soft" />
      </g>
      <g data-art data-art-lift>
        <path d="M126 198A70 70 0 0 1 266 198" />
        <path d="M114 198H278" />
        <path d="M150 182A52 52 0 0 1 186 150" className="pd-soft" />
        <circle cx="196" cy="121" r="6" />
        <path d="M196 127V128" />
      </g>
      <g data-art>
        <rect x="360" y="92" width="96" height="164" rx="4" />
        <path d="M374 116H410M374 136H404M374 156H416" className="pd-soft" />
        <path d="M414 116H442M408 136H442M420 156H442" className="pd-dotted" />
        <g>
          <path d="M374 192H392V210H374ZM424 192H442V210H424ZM374 224H392V242H374Z" />
          <path d="M379 197H387V205H379ZM429 197H437V205H429ZM379 229H387V237H379Z" className="pd-fill" />
          <path d="M400 194H408V202H400ZM412 210H420V218H412ZM400 222H406V228H400ZM414 230H424V240H414ZM430 222H442V228H430ZM404 234H410V242H404Z" className="pd-fill pd-soft-fill" />
        </g>
      </g>
      <g data-art-light>
        <path d="M118 282A96 96 0 0 0 274 282" className="pd-light-stroke" />
        <circle cx="274" cy="282" r="3.5" className="pd-light-fill" />
        <circle cx="274" cy="282" r="18" className="pd-glow" />
      </g>
    </>
  );
}

/** Markyt: the bag and its tag (the one lit point), the catalog with its variants, the order on its way to the box. */
function Markyt() {
  return (
    <>
      <g data-art className="pd-dim">
        <path d="M24 330H456" />
      </g>
      <g data-art>
        <rect x="28" y="96" width="84" height="66" rx="5" />
        <circle cx="56" cy="126" r="14" className="pd-soft" />
        <path d="M80 118H100M80 130H96" className="pd-soft" />
        <circle cx="46" cy="150" r="3" />
        <circle cx="58" cy="150" r="3" />
        <circle cx="70" cy="150" r="3" className="pd-fill" />
        <rect x="28" y="176" width="84" height="66" rx="5" />
        <path d="M44 220L58 196L72 220ZM62 220L76 202L90 220Z" className="pd-soft" />
        <rect x="28" y="256" width="84" height="66" rx="5" />
        <rect x="46" y="272" width="22" height="30" rx="3" className="pd-soft" />
        <path d="M80 280H100M80 292H94" className="pd-soft" />
      </g>
      <g data-art>
        <path d="M152 172H318L332 330H138Z" />
        <path d="M152 198H318" className="pd-soft" />
        <path d="M198 172C198 118 272 118 272 172" />
        <path d="M210 172C210 132 260 132 260 172" className="pd-soft" />
      </g>
      <g data-art>
        <path d="M292 140L334 154L322 190L280 176Z" />
        <path d="M290 160L316 169M286 170L306 177" className="pd-soft" />
        <path d="M272 146C280 142 288 142 296 148" className="pd-soft" />
      </g>
      <g data-art>
        <path d="M332 300C350 300 352 286 362 282" className="pd-dotted" />
        <path d="M364 262L412 242L460 262L412 282Z" />
        <path d="M364 262V314L412 334V282M460 262V314L412 334" />
        <path d="M388 252L436 272" className="pd-soft" />
        <circle cx="436" cy="214" r="13" />
        <path d="M430 214L435 219L443 209" />
      </g>
      <g data-art-light>
        <circle cx="300" cy="151" r="4" className="pd-light-fill" />
        <circle cx="300" cy="151" r="20" className="pd-glow" />
      </g>
    </>
  );
}

/** Handy: a coastal city grid (no real map), the house that needs a hand and the specialist's pin with its zone. */
function Handy() {
  return (
    <>
      <g data-art className="pd-dim">
        <path d="M24 118H372M24 210H366M24 300H374" />
        <path d="M118 40V360M256 40V360" />
        <path d="M24 336L292 52" />
      </g>
      <g data-art>
        <path d="M388 40C356 140 428 220 380 360" />
        <path d="M408 92C400 104 404 116 412 126M418 176C410 190 414 204 424 214M420 268C412 282 416 296 426 306" className="pd-soft" />
      </g>
      <g data-art>
        <path d="M160 262L190 236L220 262V302H160Z" />
        <path d="M184 302V282H196V302" className="pd-soft" />
        <path d="M172 268H182V278H172Z" className="pd-soft" />
      </g>
      <g data-art className="pd-soft">
        <circle cx="300" cy="214" r="70" className="pd-dotted" />
        <circle cx="300" cy="214" r="112" className="pd-dotted pd-faint" />
      </g>
      <g data-art>
        <path d="M224 266C250 254 274 236 300 214" className="pd-dotted" />
        <path d="M300 214C282 190 274 178 274 162A26 26 0 0 1 326 162C326 178 318 190 300 214Z" />
      </g>
      <g data-art>
        <path d="M352 236L338 262H350L340 286" />
        <path d="M86 150C76 166 74 172 74 178A12 12 0 0 0 98 178C98 172 96 166 86 150Z" />
        <circle cx="220" cy="140" r="8" />
        <path d="M226 146L244 164M236 156L242 150M240 160L246 154" />
      </g>
      <g data-art-light>
        <circle cx="300" cy="162" r="8" className="pd-light-fill" />
        <circle cx="300" cy="162" r="26" className="pd-glow" />
      </g>
    </>
  );
}

/** Gimnasios: the barbell, the class grid and the member's streak ring (lit where today's session closes it). */
function Gym() {
  return (
    <>
      <g data-art className="pd-dim">
        <path d="M24 330H456" />
      </g>
      <g data-art>
        <circle cx="170" cy="150" r="64" className="pd-soft" />
        <circle cx="170" cy="150" r="44" className="pd-dotted pd-soft" />
        <path d="M160 150L168 158L182 140" />
      </g>
      <g data-art>
        <rect x="290" y="70" width="150" height="110" rx="6" />
        <path d="M290 92H440" />
        <g className="pd-soft">
          {[0, 1, 2, 3].flatMap((c) => [0, 1, 2].map((r) => <rect key={`${c}-${r}`} x={302 + c * 34} y={102 + r * 24} width="24" height="16" rx="2" />))}
        </g>
        <rect x="336" y="126" width="24" height="16" rx="2" className="pd-fill pd-soft-fill" />
      </g>
      <g data-art className="pd-soft">
        <path d="M300 200H420M300 212H392M300 224H360" />
      </g>
      <g data-art>
        <path d="M96 282H376" />
        <rect x="112" y="242" width="16" height="80" rx="3" />
        <rect x="132" y="252" width="12" height="60" rx="3" />
        <rect x="344" y="242" width="16" height="80" rx="3" />
        <rect x="328" y="252" width="12" height="60" rx="3" />
        <path d="M150 276V288M322 276V288" />
      </g>
      <g data-art-light>
        <path d="M170 86A64 64 0 1 1 121 191.1" className="pd-light-stroke" />
        <circle cx="121" cy="191.1" r="4" className="pd-light-fill" />
        <circle cx="121" cy="191.1" r="18" className="pd-glow" />
      </g>
    </>
  );
}

/** DentalOS: the tooth, a WhatsApp message and the check-up moved to its new slot (the one lit point). */
function Dental() {
  const slots = [304, 350, 396].flatMap((x) => [136, 164, 192, 220].map((y) => ({ x, y })));
  return (
    <>
      <g data-art className="pd-dim">
        <path d="M24 330H456" />
      </g>
      <g data-art>
        <path d="M150 110C120 110 108 142 116 176C122 202 126 240 136 284C140 300 154 300 158 284L166 236C168 226 176 226 178 236L186 284C190 300 204 300 208 284C218 240 222 202 228 176C236 142 224 110 194 110C182 110 176 118 172 118C168 118 162 110 150 110Z" />
        <path d="M134 140C132 158 136 170 140 182" className="pd-soft" />
      </g>
      <g data-art>
        <rect x="290" y="96" width="150" height="150" rx="6" />
        <path d="M290 120H440" />
        <g className="pd-soft">
          {slots.map(({ x, y }) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="30" height="16" rx="2" />
          ))}
        </g>
        <path d="M304 180L334 164" />
      </g>
      <g data-art>
        <path d="M334 172C370 172 380 228 394 228" className="pd-dotted" />
        <path d="M388 222L394 228L388 234" />
      </g>
      <g data-art>
        <path d="M232 280H300V312H258L246 324V312H232Z" />
        <path d="M244 292H286M244 302H272" className="pd-soft" />
      </g>
      <g data-art-light>
        <rect x="396" y="220" width="30" height="16" rx="2" className="pd-light-fill" />
        <circle cx="411" cy="228" r="24" className="pd-glow" />
      </g>
    </>
  );
}

/** Clínicas: the pulse, the reminder bell and the front desk's day — one no-show crossed out, one visit confirmed (lit). */
function Clinic() {
  const rows = [128, 156, 184, 212, 240];
  return (
    <>
      <g data-art className="pd-dim">
        <path d="M24 330H456" />
      </g>
      <g data-art>
        <path d="M24 250H118L134 220L150 280L168 186L184 262L196 250H268" />
      </g>
      <g data-art>
        <path d="M76 140C76 116 80 104 90 104C100 104 104 116 104 140L110 146H70Z" />
        <path d="M86 150C86 156 94 156 94 150" />
        <path d="M60 112C56 118 56 126 60 132M120 112C124 118 124 126 120 132" className="pd-soft" />
      </g>
      <g data-art>
        <rect x="290" y="80" width="150" height="190" rx="6" />
        <path d="M290 104H440" />
        {rows.map((y) => (
          <path key={y} d={`M320 ${y}H${y === 184 ? 380 : 420}`} className="pd-soft" />
        ))}
        {rows.slice(0, 4).map((y) => (
          <circle key={y} cx="306" cy={y} r="5" className={y === 184 ? 'pd-soft' : undefined} />
        ))}
        <path d="M303 128L305.5 130.5L309.5 125.5M303 156L305.5 158.5L309.5 153.5" />
        <path d="M386 180L394 188M394 180L386 188" />
      </g>
      <g data-art>
        <path d="M112 146C180 156 232 240 296 240" className="pd-dotted" />
      </g>
      <g data-art-light>
        <circle cx="306" cy="240" r="5" className="pd-light-fill" />
        <circle cx="306" cy="240" r="20" className="pd-glow" />
      </g>
    </>
  );
}

/** VetOS: the paw, the owner's tag and the home visit inside its zone (the visit lit). */
function Vet() {
  return (
    <>
      <g data-art className="pd-dim">
        <path d="M24 340H456" />
      </g>
      <g data-art>
        <path d="M160 246C136 246 120 268 126 286C132 302 148 296 160 298C172 296 188 302 194 286C200 268 184 246 160 246Z" />
        <ellipse cx="118" cy="214" rx="12" ry="16" transform="rotate(-22 118 214)" />
        <ellipse cx="146" cy="190" rx="12" ry="17" />
        <ellipse cx="176" cy="190" rx="12" ry="17" />
        <ellipse cx="203" cy="214" rx="12" ry="16" transform="rotate(22 203 214)" />
      </g>
      <g data-art>
        <rect x="296" y="76" width="144" height="86" rx="6" />
        <circle cx="328" cy="120" r="17" />
        <circle cx="328" cy="98" r="4" className="pd-soft" />
        <path d="M356 108H422M356 122H408M356 136H414" className="pd-soft" />
        <path d="M296 120C252 122 232 168 214 196" className="pd-dotted" />
      </g>
      <g data-art className="pd-soft">
        <circle cx="392" cy="304" r="52" className="pd-dotted" />
      </g>
      <g data-art>
        <path d="M360 304L392 276L424 304V340H360Z" />
        <path d="M386 340V318H398V340" className="pd-soft" />
        <path d="M212 300C262 330 316 332 356 320" className="pd-dotted" />
      </g>
      <g data-art-light>
        <circle cx="392" cy="252" r="5" className="pd-light-fill" />
        <circle cx="392" cy="252" r="20" className="pd-glow" />
      </g>
    </>
  );
}
