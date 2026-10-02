@AGENTS.md

# Eclipse — landing (mockup v1)

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
  In dev they are overlaid automatically (`i18n/messages.ts`); `npm test` checks key parity
  across locales including drafts; `npm run i18n:merge` folds them in later.
- Localized content fields in `/content` are `{ es, en, pt }` objects → `l(value, locale)`.
- Locale tags: `localeTags` (es-AR, en, pt-BR) for `Intl` and `lang`.

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
- Component-specific CSS goes in a file next to the component (e.g. `components/pricing/pricing.css`)
  imported by it — don't grow `app/globals.css`.

## Building blocks (reuse, don't reinvent)

- Motion: `@/components/motion/gsap` (gsap, ScrollTrigger, useGSAP — registered once),
  `<Reveal>` + `data-reveal` children (fade + 24px rise, 60 ms stagger, once),
  `<SectionHeading>` (display h2 + light sweep), `<LightSweep>`, `<CountUp>`,
  `useReducedMotion` / `prefersReducedMotion`, `useMediaQuery`, `useIsClient`.
- Money: `useCurrency()` → `{ currency, rates, format(usd), convert(usd) }`; `<Money usd>`,
  `<AnimatedMoney usd>` (rolls on change). Pricing logic: `lib/pricing.ts` (`quote`,
  `addonsForPlan`, `detectPlans`, `planSavings`, `maintenanceSuggestion`, `annualize`,
  `applyOffers`, `isOfferActive`, `formatMoney`). Never re-implement pricing in components.
- Experience: `useExperience()` → `{ vertical, selectVertical, builder, openBuilder(source, preset?), closeBuilder }`.
- WhatsApp: `<WhatsAppLink message origin>` (real `<a>` + tracking), `<DemoCta origin>`,
  `lib/whatsapp.ts`. Analytics: `track(event, props)` from `lib/analytics.ts`.
- Modal: `<Sheet open onClose variant="drawer|fullscreen|center" labelledBy>` (native dialog).
- Demos: `<DemoShowcase demo business active />`, `<DeviceFrame>`, registry in
  `components/demos/registry.ts`, contract in `components/demos/types.ts`.
- Section anchors: `SECTION_IDS` / `NAV_LINKS` in `components/layout/navLinks.ts`.
- basePath: `asset('/file.png')` from `lib/env.ts` for anything in `/public`.

## Working in this repo

- Don't commit (the orchestrator commits per phase). Don't edit files outside your area.
- `next dev` rewrites `tsconfig.json` (adds `.next-dev-*` includes) — ignore those changes.
- Before finishing: `npx tsc --noEmit` (filter to your files), `npx eslint <your paths>`,
  `npx vitest run`, and look at your screenshots at 360px and 1440px.
