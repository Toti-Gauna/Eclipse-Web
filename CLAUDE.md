@AGENTS.md

# Eclipse — landing + client portal mockup (v3)

Landing for **Eclipse**, a development / AI / automation studio. Demo-first sales: we show
the visitor *their business working* before talking. Single conversion goal: ask for a demo
or build a plan, then message us on WhatsApp. Audience: business owners in Argentina, Brazil,
LatAm and beyond, mostly on phones → **mobile-first**.

Static export (`output: 'export'`) deployed to GitHub Pages under `/Eclipse-Web`
(`NEXT_PUBLIC_BASE_PATH`). Next 16 App Router + TypeScript + Tailwind v4 + next-intl
(es / en / pt) + GSAP/ScrollTrigger (+ OGL for the hero corona only).

## Commands

- `npm test` (Vitest) · `npm run typecheck` · `npm run lint` · `npm run build` (→ `out/`)
- `scripts/dev.sh <port>` — isolated `next dev` (own distDir), e.g. `scripts/dev.sh 3200` → http://localhost:3200/es/
- `node scripts/shot.mjs <url> <outDir> --widths=360,1440 [--full] [--scroll=0,900] [--click=<css>] [--reduced] [--name=x]`
  screenshots with Playwright (prints console errors and horizontal-overflow warnings).
- Dev-only component labs: `app/[locale]/lab/<area>/page.dev.tsx` (gitignored, never exported).

## Non-negotiable rules

- **Honesty:** no testimonials, client logos or clients that don't exist. Every fictional
  business is labeled **"Demo"** visibly (`.badge-demo`) and must not resemble a real brand.
  No strikethrough prices / "antes $X". Only real offers from `content/offers.json`.
- **Tone:** premium, confident, concrete. Short sentences, concrete numbers. Never
  "soluciones innovadoras de vanguardia" style filler. Spanish uses rioplatense "vos";
  Portuguese is natural pt-BR (not a literal translation); English is plain and direct.
- **No hardcoded copy:** every UI string comes from next-intl. Commercial data (prices,
  plans, items, add-ons, maintenance, offers, verticals, founders, units) comes from
  `/content/*.json` through `lib/content.ts`. Never duplicate numbers in components.
- **Mobile-first:** no horizontal page scroll at 360px, 16px gutter (`.container-x`),
  touch targets ≥ 44px.
- **Accessibility:** semantic HTML, full keyboard support, visible focus (amber ring is global),
  WCAG AA contrast, `aria-live` on changing totals, alt text, labels on every control.
- **Reduced motion:** every animation checks `prefersReducedMotion()` / `useReducedMotion()`
  and becomes instant or a simple fade.
- **Performance:** animate only `transform`, `opacity` (and `clip-path` for reveals). Heavy
  code (demos, builder, WebGL, trailers) is lazy (`next/dynamic` / `React.lazy`). No new
  runtime dependencies without a strong reason.

## i18n

- Messages: `messages/{es,en,pt}.json`. Rich text keyword emphasis: `<em>…</em>` rendered
  with `t.rich('key', { em: (c) => <em>{c}</em> })` inside `.display` headings.
- **While several agents work in parallel, do not edit `messages/*.json`.** Put your
  namespaces in `messages/drafts/<area>.json` shaped `{ "<namespace>": { "es": {...}, "en": {...}, "pt": {...} } }`.
  In dev they are **deep-merged** over the base files (`i18n/messages.ts`): objects merge key
  by key, other values replace, and `null` deletes a key — so a draft only carries the keys
  you add, change or remove (`"oldKey": null`), never a copy of a whole namespace.
  `npm test` checks key parity across locales including drafts; `npm run i18n:merge` folds
  them in later with the same rules. Drafts are dev-only: `npm run build` ignores them.
- Localized content fields in `/content` are `{ es, en, pt }` objects → `l(value, locale)`.
- Locale tags: `localeTags` (es-AR, en, pt-BR) for `Intl` and `lang`.

## v3 — landing UX/UI + client portal mockup (read first)

Sources: Notion "Landing Eclipse — Revisión UX/UI y requisitos v3", "Portal de clientes — Especificación
v3" and "Contexto Eclipse". `docs/v3/inventario.md` lists every v2 content block: all of it must stay
reachable (folded is fine, deleted is not).

- **Goal:** a new visitor understands what Eclipse offers in ~30 s and finds a demo, an entry price,
  maintenance and the next step in < 2 min. Summarize on the surface and fold details (tabs, accordions,
  "Ver la cuenta"); never hide price, scope, maintenance or conditions behind a CTA.
- **Page order (ids unchanged):** 01 hero `#inicio` (+ shortcuts to Demos, Soluciones, Precios, Armar plan) ·
  02 demos `#ejemplos` · 03 soluciones `#servicios` · 04 precios `#precios` · 05 calculadora `#problema` ·
  06 cómo trabajamos `#proceso` · 07 fundadores `#fundadores` · 08 preguntas y contacto `#contacto` · footer.
  Sky: hero void → demos/soluciones night → `<SkyTransition>` → dawn from precios on.
- **Header:** Servicios · Demos · Precios · Cómo trabajamos; "Pedí tu demo" is THE primary CTA and stays
  reachable on desktop and mobile; "Armá tu plan" is secondary; "Ingresar" is discreet and opens
  `/[locale]/portal/`. Language, currency and sound sit together behind one preferences trigger.
  Naming follows the brief: the header says «Servicios», the shortcut and the section label say «Soluciones»
  (an exception to the v2 copy rule below; same anchor `#servicios`).
- **One amber per viewport:** the hero's CTA wrapper carries `data-hero-cta`; a section's solid amber CTA carries
  `data-page-cta` (`<DemoCta pageCta>`). While one is on screen the header CTA turns to outline (`usePageCtaInView`).
  Mark any new solid amber CTA the same way.
- **Motion (overrides the v2 art direction where they conflict):** no permanent decorative animation; big
  motion only in the hero or one transition; everything pauses off-screen; no heavy work per scroll event;
  reduced motion = static. The hero pins only with a mouse/trackpad. Any performance claim needs a before/after
  measurement (method and baseline in `docs/v3/rendimiento.md`).
- **Hydration must not change heights:** a deferred section's server HTML must measure the same as the hydrated
  section (otherwise anchor jumps land off and there is layout shift). Media-query defaults go in CSS too — e.g.
  `ServicesIndex` marks its desktop-default family `data-default` (Tailwind's preflight makes `[hidden]` !important,
  so it can't be overridden by CSS).
- **Demos:** desktop preview on the left and mobile preview on the right as two independent, labeled,
  frameless views (no laptop/phone shells, no overlap). On phones: tabs with readable sizes. Load near the
  viewport with a static poster first; never more than one live experience at a time.
- **"Ver demo" = one light layer** (`components/demo-experience/`): hero chips and the demos section open the
  same warm/illuminated `<dialog>`. Opening (motion.ts, ~2.4 s, skippable with a click/key): the page goes dark,
  THE eclipse takes the center at the hero's size (from the hero, the hero's own glides there), the moon slides,
  the diamond ring fires and the light floods the screen from it; closing reverses it. Reduced motion = fade.
  It has its own scroll; the page never moves (`lockScroll`, keeps the scrollbar gutter); Volver / Escape /
  browser Back restore the exact scroll and focus (`data-demo-opener`). EVERY open of EVERY demo (and every page load) offers "Ver con guía" /
  "Ver por mi cuenta" — nothing is remembered; the guide never starts by itself. Under the views: the complete
  project from `vertical.project` (package only when its approved audience names the vertical; otherwise the
  pieces with their published prices and no invented total), maintenance, process, CTAs.
- **Demos are manual:** nothing animates, plays sound or advances by itself. Stories run on beats played from
  the SimBar ("Simular: …") and end still; playing one takes each view to where it happens (`useBeatFocus`);
  every visible control works on local demo data. Each demo has its
  own AppShell structure (`layout.nav/density/icons`, `phoneNav`) and 4–6 guide steps (`<demo>/tour.ts`,
  `data-tour` marks in both views, copy in `demoTours`). See components/demos/README.md.
- **Builder:** always enters from the right; its surface follows the section it was opened from
  (`builder.theme`, `openBuilder(source, preset?, { theme?, from? })`).
- **Package bonus:** `plan.bonus` (Voz, Automatiza: the premium landing) is shown only as "incluido": never in
  `plan.items`, never with a price, strikethrough or saving.
- **Honesty:** prices, terms, discounts, founder offer, timelines and conditions stay exactly as in
  `/content` and `messages`. FAQ and conditions only reuse existing approved copy. A project starts after
  the seña. The builder summary is a proposal request, not a binding quote; the calculator is indicative.
- **Client portal = frontend mockup only:** routes `/[locale]/portal/` (demo login),
  `/[locale]/portal/proyectos/` (Mis proyectos) and `/[locale]/portal/proyectos/[id]/` (detail), static
  export, same layout and tokens as the site. Fictional fixtures labeled "Demo" and the visible notice
  "Vista de demostración — datos ficticios; acceso real disponible cuando se implemente el backend." No
  backend, API, auth, persistence, uploads or emails; forms never submit or store anything; no fake
  security. Stages: 1 Preparación · 2 Construcción · 3 Revisión de Eclipse · 4 Revisión del cliente ·
  5 Entrega (+ Soporte, En pausa/Cerrado). Projects table on desktop, cards on phones. Copy in es
  (rioplatense), en and pt-BR through next-intl. The internal Eclipse portal/CRM is out of scope.
  Eclipse's side appears by role only (no invented team members). Plumbing: routes in `lib/portal/routes.ts`
  (re-exported as `PORTAL_ROUTES`), `chromeRoute()` picks the header mode, `<LandingOnly>` drops sales blocks
  from the footer, and the `portal` namespace is server-only (`PORTAL_NAMESPACES`, left out of the client
  messages like `DEMO_NAMESPACES`): portal client components receive plain strings as props.
  First-visit guides on the list and the detail (`lib/portal/tour.ts`), remembered only in localStorage
  (`useTourSeen`); "Ayuda" restarts them; "Más información" popovers (`InfoTip`) explain stage concepts.

## Art direction v2 — "Efemérides" (read before touching any UI)

The site is an observatory: the visitor watches their business come out of the shadow. The
eclipse is the narrative (totality in the hero → dawn at the final CTA) and the **instrument**
is the visual language: precise, technical, editorial, warm. It must not look like a template.

**Signature elements**
- Type: Instrument Serif at extreme sizes for *one* moment per section (up to ~10rem on desktop);
  Geist for UI and body; **Geist Mono** (`font-mono`, `.label`, `.readout`) for indices, units,
  timestamps, prices and any number that behaves like a reading. Big/small contrast, little in between.
- Marks: 1px hairlines (`border-line`), `.ticks` registration marks on featured frames, rulers with
  tick marks on sliders/progress, `.leader` dotted leaders in price lists, and
  `<PhaseGlyph phase>` (`components/ui/PhaseGlyph.tsx`) as the brand icon for steps, progress,
  states and loaders.
- Light: amber (`--corona`) is *the light source*, not decoration — the CTA, the active state, the
  one number that matters. At most one solid amber button per viewport. Dark sections are lit from
  one side (a corona glow), never with random gradient blobs.
- Index: sections are numbered `01`–`08` in mono, each with its phase name as a label.
- Copy: short, concrete, numbers with units. Never "soluciones", "innovador", "potenciá",
  "llevá tu negocio al siguiente nivel".

**Composition** — every section has its own layout; never again "eyebrow + h2 + p + grid of identical
cards". Use index lists with a live preview, sticky giant numbers, ledgers, horizontal phases,
split screens, type that bleeds to the edge, elements that cross section boundaries. Asymmetry and
negative space over symmetric grids. Mobile gets its own composition, not a squeezed desktop.

**Motion signature** (GSAP or CSS; transform/opacity/clip-path only; `--ease-expo`; 0.5–0.9 s)
1. Occultation: content is uncovered by a disc or an edge passing (`clip-path: circle()/inset()`).
2. Readouts: numbers roll/count like instruments (`CountUp`, `RollingNumber`, `AnimatedMoney`).
3. Glint: a diamond-ring sparkle on the primary action and on "success" moments.
4. Drawing: hairlines and rulers draw in (`scaleX`/`scaleY` from 0) as sections enter.
5. Scrub: scroll advances the moon (phase) in glyphs/rails. Never scroll-jack; never pin on touch screens.
Reduced motion → final state immediately (a ≤150 ms fade at most).

**Sound** — `useSound()` from `components/sound/SoundContext.tsx` (names and when to use each in
`lib/sound/types.ts`). Off by default; the visitor turns it on. Call `play()` only on meaningful
moments (select, toggle, open/close, success, demo reveal) — never on hover, scroll or load.

**AI-slop tells to avoid** — grids of identical icon cards; gradient blobs/orbs; glassmorphism on
everything; emoji or "✨" in UI; an italic amber word in every heading (max one per section, not in
all of them); centered-everything; "1-2-3 circles" steps; indigo/violet SaaS defaults (#6366F1,
#6C63FF, #5A48D0 — in demos too); charts without a story; filler copy.

**Demos** — each demo is a different fictional product with its own brand, palette and
personality (always labeled "Demo"). They show what we sell: landing pages, chatbots, voice
agents, gamification, e-commerce, dashboards, automations, apps.

| Demo | Business | Mode | Palette | Personality | Must show |
|---|---|---|---|---|---|
| clinic | Clínica Aurora | light | porcelain #F7F4EF · ink #1D2A2B · teal #127C74 · blush #F2C4B3 | calm, rounded, airy | public landing with booking, agenda, **voice receptionist** call, WhatsApp reminders, no-show panel |
| realEstate | Lumen Propiedades | light | stone #ECE8E1 · ink #141414 · cobalt #2448C8 · sand #D9CBB3 | editorial: serif, thin rules, square corners | property site, **chatbot** that qualifies leads 24/7, CRM pipeline, follow-ups, visits |
| gym | Órbita Fitness | dark | #0B0C0F · lime #CCFF33 · pink #FF3E8A | bold condensed caps, game UI | member app with **gamification** (streaks, missions, XP, ranking, badges), classes, churn panel + win-back |
| shop | Bruma Tostadores | light | cream #FBF6EE · espresso #2B1B14 · tomato #E4472B · oat #EADFCB | playful retail, pills, product-first | **storefront** (catalog → product → cart → checkout), product chatbot, abandoned-cart recovery, sales panel, subscription club |
| restaurant | Bodegón Lucero | dark warm | #1A1113 · cream #F3E6D0 · wine #B23A52 · olive #8C9A4B | menu type, serif italics, dotted leaders, tickets | QR menu + online orders, **voice agent** taking phone orders (3 calls at once), kitchen display, reservations |
| academy | Atrio Idiomas | dark "chalkboard" | ink-blue board #172338 · chalk #F3F0E6 · sky #7CC8F5 · salmon #FF9F87 | classroom & notebook: chalk underlines, sticker badges, mono scores; no mascots, no green (must not evoke real language apps) | student platform (lessons, AI tutor chat, **voice speaking practice**, streaks, levels, class ranking), enrollment + payment from the landing, automations for students falling behind, owner panel |

## Design system (app/globals.css)

- Tokens: `--void #05050A`, `--night #0C0C14`, `--ash #1A1A24`, `--corona #F5B942`,
  `--flare #FFE8B0`, `--dawn #F4EFE6`, `--ink #111114`, `--mist #9A97A6`
  (+ AA-safe `--corona-deep`, `--mist-ink` for text on light backgrounds).
- Semantic utilities that follow the section theme (`.theme-dark` / `.theme-light`):
  `text-fg`, `text-fg-muted`, `text-accent`, `border-line`, `border-line-strong`,
  `bg-surface`, `bg-surface-strong`, `text-fg-inverse`. Variants `theme-light:` / `theme-dark:`.
  Never put `--corona`/`--mist` text on `--dawn` (fails AA) — use `text-accent`/`text-fg-muted`.
- Page background progression: hero `bg-void` → `bg-night` → `bg-dawn` (pricing, founders,
  final CTA, footer). Blend between them with `<SkyTransition>`; light zones carry
  `data-header-theme="light"` so the header flips.
- Classes: `.container-x`, `.display` (serif headings), `.eyebrow`, `.btn .btn-primary|.btn-ghost [.btn-sm]`,
  `.card`, `.glass`, `.badge-demo`, `.grain`, `.tabular`, `.no-scrollbar`. Radius tokens:
  `rounded-card-sm|card|card-lg` (20/24/28px). Fonts: `font-serif` (Instrument Serif), `font-sans` (Geist).
- Icons: Lucide only, thin stroke (`strokeWidth={1.5}`). Content icons by name via `<ContentIcon name=… />`.
- v2 utilities: `.label` (mono uppercase caption), `.readout` (mono tabular numbers), `.ticks`
  (corner registration marks; `--tick`, `--tick-c`), `.leader` (dotted leader), `font-mono` (Geist Mono).
- Component-specific CSS goes in a file next to the component (e.g. `components/pricing/pricing.css`)
  imported by it — don't grow `app/globals.css`.

## Building blocks (reuse, don't reinvent)

- Motion: `@/components/motion/gsap` (gsap, ScrollTrigger, useGSAP — registered once),
  `<Reveal>` + `data-reveal` children (fade + 24px rise, 60 ms stagger, once),
  `<SectionHeading>` (display h2 + light sweep), `<LightSweep>`, `<CountUp>`,
  `useReducedMotion` / `prefersReducedMotion`, `useMediaQuery`, `useIsClient`.
  Once-only entrances (Reveal, DrawLine, Occult, LightSweep, CountUp) are CSS transitions started by one pooled
  IntersectionObserver (`components/motion/observeEnter.ts`) — don't add a ScrollTrigger per entrance. The WebGL
  corona draws on demand: call `bus.current.wake?.(ms)` (HeroState) when something should move it.
- Money: `useCurrency()` → `{ currency, rates, format(usd), convert(usd) }`; `<Money usd>`,
  `<AnimatedMoney usd>` (rolls on change). Pricing logic: `lib/pricing.ts` (`quote`,
  `addonsForPlan`, `detectPlans`, `planSavings`, `maintenanceSuggestion`, `annualize`,
  `applyOffers`, `isOfferActive`, `formatMoney`). Never re-implement pricing in components.
- Experience: `useExperience()` → `{ vertical, selectVertical, builder, openBuilder(source, preset?, opts?), closeBuilder }`.
- Guides: `<Tour>` + `useTourSeen(key)` + `useTourCopy(label)` from `components/ui/tour` (spotlight, arrow, card;
  works inside a `<dialog>` via `host`; Escape closes only the tour).
- WhatsApp: `<WhatsAppLink message origin>` (real `<a>` + tracking), `<DemoCta origin>`,
  `lib/whatsapp.ts`. Analytics: `track(event, props)` from `lib/analytics.ts`.
- Modal: `<Sheet open onClose variant="drawer|fullscreen|center" labelledBy>` (native dialog).
- Demos: `<DemoShowcase demo business active />`, `<DeviceFrame>`, registry in
  `components/demos/registry.ts`, contract in `components/demos/types.ts`, kit v2 in
  `components/demos/kit*` (guide: `components/demos/README.md`; reference demo: `clinic/`).
- Sound: `useSound().play(name)` (see Art direction → Sound). Section index: `<SectionMark section>`,
  `<EphemerisRail>`; motion: `<Occult>`, `<DrawLine>`; brand icon: `<PhaseGlyph phase>`.
- Section anchors: `SECTION_IDS` / `NAV_LINKS` in `components/layout/navLinks.ts`.
- basePath: `asset('/file.png')` from `lib/env.ts` for anything in `/public`.

## Performance pitfalls (measured — don't reintroduce)

- No `:has()` rules whose subject is `html`/`body` (e.g. `html:has(dialog[open])`): Chrome re-styles
  the whole document on DOM insertions. Lock scroll with `lockScroll()` from `lib/scroll-lock.ts`.
- No `scroll-behavior: smooth` on `html`: ScrollTrigger toggles it inline on every refresh, which
  invalidates the whole document. In-page anchors are smoothed by `<SmoothAnchors>`.
- Below-the-fold sections are wrapped in `<LazyHydrate>` (app/[locale]/page.tsx): their DOM is
  re-created when they hydrate, so never keep references to DOM nodes of another section; listen
  to `HYDRATED_EVENT` if you must re-query.
- Demo copy (`demoKit` + one namespace per demo, listed in `components/demos/namespaces.ts`) is not in
  the page payload; it is loaded by `<DemoMessages>` inside `DemoShowcase` (in dev it stays in the payload
  so drafts reach the demos).
- `npm run test:e2e` (after `NEXT_PUBLIC_BASE_PATH=/Eclipse-Web npm run build` and serving `out/`
  under `/Eclipse-Web`) must stay green.

## Working in this repo

- Don't commit (the orchestrator commits per phase). Don't edit files outside your area.
- `next dev` rewrites `tsconfig.json` (adds `.next-dev-*` includes) — ignore those changes.
- Before finishing: `npx tsc --noEmit` (filter to your files), `npx eslint <your paths>`,
  `npx vitest run`, and look at your screenshots at 360px and 1440px.
