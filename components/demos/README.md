# Demo kit v3

Every demo is a **fictional product with its own brand**, shown as two frameless views,
"Escritorio" and "Celular" (`<DemoShowcase>`: side by side when the showcase is ≥ 880 px wide,
tabs below that; no device shells, no overlap). The kit gives you the chrome, a story store and
the modules we sell (chatbots, voice agents, sites, agendas, pipelines, gamification, dashboards)
so each demo only writes its data, its story and its composition.

Reference implementation: **`clinic/`** (Clínica Aurora). Read it next to this file.

**v3 in one line: nothing happens on its own.** No story on a loop, no notifications, typing,
calls, counters or sounds that start by themselves. The visitor plays the story beat by beat from
the **SimBar** ("Simular: llega una reserva online", "Evento 2 de 4", "Reiniciar") and uses the
product: books, moves cards, navigates dates. Everything is local demo data; nothing is sent.

```
components/demos/
  kit.tsx            ← import everything from here:  import { AppShell, … } from '../kit'
  kit/theme.ts       DemoTheme → --demo-* CSS variables
  kit/store.ts       createDemoStore (beats) · useStory · usePairedStore · nextBeat · useStoreSnapshot · useBeatFocus
  kit/SimBar.tsx     the simulation controls (rendered by AppShell's `sim` prop)
  kit/format.ts      useDemoFormat (times, durations, %, dates per locale)
  kit/AppShell.tsx   shell + structural variants (layout.nav · density · icons · phoneNav)
  kit/primitives.tsx Card · Pill · IconChip · Avatar · LiveDot · Switch · Button · Meter · Label · Readout · TypingDots · DemoBadge · BrandName
  kit/ChatWidget.tsx runChat (engine) · ChatWidget · ChatPeek
  kit/VoiceCall.tsx  runVoice (engine) · VoiceCall · Waveform
  kit/BrowserFrame.tsx BrowserFrame · LandingPreview · SiteSection
  kit/charts.tsx     Sparkline · Bars · Donut · Legend · Kpi
  kit/Calendar.tsx   Calendar (day/week grid) · CalendarToolbar · useCalendarNav · weekdayOf
  kit/Kanban.tsx     Kanban (+ drag & drop / "Mover a …" with onMove) (+ kit/flip.ts useFlip)
  kit/feed.tsx       ActivityFeed · ToastStack · PushBanner
  kit/gamification.tsx XpBar · Streak · BadgeGrid · Leaderboard
  demo.css + kit/*.css  (all colors are variables; sizes are em)
```

## Migration checklist (v2 loop → v3 beats)

1. `story.ts`: replace `loopMs`/`onLoop` with `beats` (+ `reset`) in `createDemoStore`; re-time the
   story so every segment ends on a **calm frame** (§4). Drop `carry`/loop bookkeeping.
2. Remove every `auto` reply the visitor could otherwise answer after a beat ends, and every
   `useEffect` that plays a sound or changes state on its own (sound only in click handlers).
3. Pass `instantAfterPick: true` to `runChat` for chats that a beat starts, `instant: true` for
   chats the visitor opens (§5).
4. `<AppShell sim={…} layout={…} phoneNav={…}>`: the SimBar and your structural variant (§3).
5. No fake live UI: drop `ActivityFeed live`, "En vivo" pills, pulsing dots at rest
   (AppShell freezes `.demo-loop` at rest, but don't say "en vivo" either).
6. Make visible controls work (dates, filters, buttons) — Calendar nav, Kanban `onMove` (§5).
7. `tour.ts` with 4–6 steps + `data-tour` marks + copy in `demoTours.<demoId>` (§6).
8. Copy: `demo<Name>.sim.<beatId>` labels + `demo<Name>.sim.note` (§7).
9. Verify: 20 s without input = identical screenshots/DOM; every beat; reduced motion (§9).

## 1. Contract (types.ts)

`export default function MyDemo({ screen, active }: DemoProps)`, registered lazily in
`registry.ts`. `screen="phone"` is the **complete navigable experience** (it's the only screen on
mobile); `screen="laptop"` is the desktop composition ("Escritorio"). `active=false` → nothing runs.
Everything is sized in `em`: the root font-size is a fraction of the device screen
(container query units), so the same markup works from a 150 px preview to a fullscreen modal.

## 2. Theme

```ts
const THEME: DemoTheme = {
  mode: 'light', bg: '#F7F4EF', surface: '#FFFFFF', ink: '#1D2A2B', muted: '#55615F',
  accent: '#127C74', accentInk: '#FFFFFF', accent2: '#F2C4B3', accent2Ink: '#1D2A2B',
  accent2Text: '#8E4A35',            // accent2 as text when accent2 is a tint
  ok: '#1C6B4A', warn: '#8A5A12', bad: '#A33A3A', info: '#2B5F86',
  radius: '1.15em',                  // '0' for square/editorial
  display: { family: 'serif', weight: 400, tracking: '-0.01em' },  // or sans/mono, uppercase…
};
```

`<AppShell theme={THEME}>` turns it into variables on the demo root. Use them, never literals:
`--demo-bg --demo-surface --demo-sunken --demo-ink --demo-muted --demo-line --demo-line-strong
--demo-accent --demo-accent-ink --demo-accent-text --demo-accent-soft --demo-accent-2(-ink|-text|-soft)
--demo-ok|warn|bad|info (+ -soft) --demo-radius(-sm|-lg) --demo-shadow(-lg) --demo-font-display`.
Tones (`'accent' | 'accent2' | 'ok' | 'warn' | 'bad' | 'info' | 'neutral' | 'ink'`) map to
`.demo-tone-*` classes that set `--tone-fg / --tone-soft / --tone-solid / --tone-on`.
`.demo-display` applies the display font. Dark products: `mode: 'dark'` (status defaults flip).

Palettes and personalities are fixed per demo in **CLAUDE.md → Art direction v2 → Demos**.
Contrast is your job: `muted`, `accentText`, `accent2Text` and the status colors are text on
`bg`/`surface` (≥ 4.5:1). No indigo/violet SaaS defaults. The amber "Demo" badge is Eclipse's
layer and is never themed.

## 3. Shell and structural variants

```tsx
<AppShell
  screen={screen} theme={THEME} business={business} logo={<Mark />} active={active}
  nav={[{ id: 'today', label, icon: House }, { id: 'calls', label, icon: PhoneCall, badge: 'live', tour: 'reception' }]}
  current={tab} onNavigate={setTab}
  layout={{ nav: 'top', density: 'airy', icons: 'chip' }}   // laptop structure (below)
  phoneNav="dock"                                             // phone structure (below)
  sim={{ store, label: (id) => t(`sim.${id}`), note: t('sim.note'), tour: 'sim', announce }}
  title={<p>Today</p>}            // laptop top bar (left); with nav 'top': a sub-bar under it
  headerRight={…}                 // laptop top bar right / phone app bar right
  sidebarFooter={…}               // laptop sidebar only (hidden on the rail)
  statusTime="9:43"               // phone status bar (follow your story clock)
  rootRef={pair.ref}              // pairing (§4)
  overlay={<PatientView />} overlayOpen={open}   // full-screen layer, revealed by a passing disc
  chrome="app"                    // phone: 'bare' = status bar (+ SimBar) only; you draw the chrome
  maxTabs={5}                     // phone tabs/dock: more items → "More" drawer
>
```

**Pick a structure that fits the vertical — not just colors.** Desktop and phone of one demo stay
consistent (same items, same icon treatment, same rhythm).

| `layout.nav` (laptop) | What it is | Fits | Pairs with `phoneNav` |
|---|---|---|---|
| `sidebar` (default) | full panel with labels, collapsible to an icon rail (toggle in the top bar); `sidebarFooter` | dense back-office tools, CRMs | `tabs` or `drawer` |
| `rail` | slim icon rail only (tooltips), brand in the top bar | dashboards that need width (kitchen display, analytics) | `tabs` |
| `top` | no sidebar; nav pills in the top bar, content full width; `title` goes to a sub-bar | calm, airy products (clinic, editorial) | `dock` or `top` |
| `dock` | no sidebar; a floating pill dock at the bottom | app-like, playful (gym, shop, academy) | `dock` |

| `phoneNav` | What it is |
|---|---|
| `tabs` (default) | bottom tab bar (icon + label); overflow → "More" drawer |
| `dock` | floating pill dock; icons, the current item shows its label; overflow → "More" |
| `top` | scrollable pills under the app bar (no bottom bar) |
| `drawer` | menu button + side drawer only |

With `rail` (and a collapsed `sidebar`) only the icon column is interactive: the panel is
rail-wide, items are as narrow as the rail and their focus ring is fully visible.

`layout.density`: `airy` (taller top bar, roomier content) · `regular` · `compact` (dense tools).
`layout.icons`: `line` (thin icons) · `chip` (icons in tinted squares; the current one solid accent) ·
`none` (labels only — sidebar/top only; editorial demos).

Variants already taken: **clinic** = `top` + `airy` + `chip` / phone `dock`. Choose a different
combination per demo where it makes sense (e.g. real estate `sidebar` + `none` + `regular` /
`drawer`; restaurant `rail` + `compact` / `tabs`; gym or academy `dock`), and give the content
its own composition too.

Other shell rules: the business name always renders with the visible "Demo" badge and `— Demo`
for screen readers; the root never scrolls (`overflow: clip`), only `.demo-content`;
`DemoShell` / `DemoTab` / `useDemoClock` remain as deprecated v1 aliases.

## 4. The story: beats, no autoplay

Hold *only what the visitor did* in a store and **derive** everything else from `(t, state)` with
pure functions. The story time `t` only moves while the visitor plays a **beat**.

```ts
// data.ts — each beat's `at` is where its segment ENDS (story ms, increasing; the first starts at 0)
export const BEATS = [
  { id: 'online', at: 9_000 },     // label: demoClinic.sim.online → "Llega una reserva online"
  { id: 'reminder', at: 23_500 },
  { id: 'freed', at: 31_500 },
  { id: 'call', at: 48_500 },
] as const;

// story.ts
export const createStore = (paired: boolean) =>
  createDemoStore<State>(fresh(), { beats: BEATS, paired, reset: fresh });   // reset = "Reiniciar"

// MyDemo.tsx
const { store, paired, ref } = usePairedStore('my-demo', createStore);   // laptop + phone share it
const snap = useStory(store, active);       // { state, t, loop, beat, playing, segment, reduced }
const view = useMemo(() => derive(snap.state, snap.t, snap.reduced), [snap.state, snap.t, snap.reduced]);
// a visitor action, stamped with the story time (works at rest: t is where the story stopped)
store.update((s, t) => ({ ...s, mine: [...s.mine, { ...booking, at: t }] }));
```

Store API (beats): `play(beatId?)` plays from the current `t` up to that beat (default: the next
one) and stops; a later beat plays through the ones in between; earlier/current beats are ignored.
`next()` = `play()`. `finish()` jumps to the end of the segment playing. `reset()` = `reset(state)`
(or the initial state), `t = 0`, no beat, `loop + 1` (use `key={snap.loop}` to reset local UI).
Snapshot: `beat` (index of the last beat reached, −1 = none), `playing`, `segment {from, to, beat}`.
`nextBeat(store, snap)` returns the beat the next `play()` reaches. `engage()` is a no-op.

Rules that make "no autoplay" hold:
- **At rest the clock never runs** — not on load, not when active, not after an action. While a
  segment plays the clock ticks only while a view is `active` and the tab is visible.
- **Every segment ends on a calm frame**: by its `at`, every toast has left, every typing indicator
  resolved, every "just now" (`fresh`) window (2–3.4 s) has closed, the call has ended. Leave
  ~3.5 s after the last event. Test it (the clinic's test: stable DOM 4 s after each beat).
- **Visitor actions never need the clock.** Their result shows at once (stamp with `t`). For a
  transient reaction to the visitor (a toast for their booking, a push banner) use a local
  `setTimeout` that only starts from their click — never a time window on `t`, which is frozen.
- **Sound only in click handlers** (`if (active) play('success')` when they book), never in an
  effect that watches the story.
- **Reduced motion**: `play()` jumps straight to the segment's end (no ticking); pass
  `{ instant: reduced }` to `runChat` / `runVoice` (they show the outcome once started).
- **Pairing**: split layout → both views share one store (`paired: true`; the phone may show
  another side of the same story — the clinic shows the *patient's* phone). Tabs layout (one
  view mounted at a time) → the views share a store across tab switches (`paired: false`, so the
  phone is the complete app), found via the showcase root (`[data-demo-host]`, else `.sc`).
- Clock is coarse (500 ms). Fine motion is CSS.
- **A simulation takes you where it happens (v3c).** Each view calls
  `useBeatFocus(store, snap, (beatId) => …)` and goes to the screen (tab, chat, call, customer
  app…) where that beat's action is legible: the visitor never hunts for it. It fires once when
  the story enters a beat (a jump through several beats visits each), for the beat reached with
  reduced motion, never on reset or when a view mounts later. Keep the targets as data next to
  `BEATS` (per beat and per view: laptop, phone alone, phone paired) and test that each one exists.

**Legacy loop (deprecated)**: without `beats`, `createDemoStore` still runs a `loopMs` story on
its own (`onLoop`, `engage`) so demos not migrated yet keep working. Don't use it in new code.

## 5. Modules

**SimBar** (`kit/SimBar.tsx`) — rendered by AppShell from `sim`; you don't place it. Laptop: a
strip above the app (label "Simulación", the demo's one-line `note`, a ruler + "Evento 2 de 4",
"Simular: <next beat>", the events list, "Reiniciar"). Phone: a compact strip under the status bar
("Simular: …" + "2/4" → the list with the note and "Reiniciar"). While a beat plays: progress +
"Saltar al final"; after the last: "Reiniciar la demo". One instance announces (`announce`,
use `screen === 'laptop' || !paired`). Labels: `demoKit.sim`; beat names: `demo<Name>.sim.<id>`.

**ChatWidget** — `runChat(script, elapsedMs, picks, { instant, instantAfterPick })` → `ChatRun`
(items, typing, awaiting, `at[step]`, `chosen[step]`). Steps: `{ from: 'bot'|'user'|'note', text,
card, typingMs, pauseMs, replies: [{ id, label, goto }], auto, autoMs, next }`.
- A chat a **beat** plays runs on story time; `auto` replies are fine *inside* the segment (they
  must resolve before the beat's `at`); pass `instantAfterPick: true` so a visitor's tap is
  answered at once even when the clock is stopped.
- A chat the **visitor** opens (site chatbot, their own confirmation) runs with `instant: true`
  and has **no `auto` replies** (with `instant` they would fire immediately).
`<ChatWidget run variant="whatsapp|widget" title avatar stamp onPick label announce composer />`.
`<ChatPeek>`: collapsed site chat (latest bubble + quick replies + launcher).

**VoiceCall** — `runVoice({ ringMs, lines: [{ who: 'agent'|'caller'|'tool', text, ms, icon }], missed }, elapsedMs)`
→ phase, timer, current line. Start calls from a beat only. Give every line an explicit `ms` so
timing is the same in every locale. `<VoiceCall state caller agent outcome sent variant="full|compact" onOpen tour />`.

**BrowserFrame / LandingPreview / SiteSection** — the business's public site in browser chrome
(`variant="desktop|mobile"`). URLs are fictional: use the `.demo` TLD. Its CTA must work (the
clinic's "Reservar turno" goes to the booking widget, which books into the agenda).

**Charts** — `Sparkline` (clip-path draw-in), `Bars` (scaleY), `Donut`, `Legend`, `Kpi`
(label + rolling readout + delta + optional sparkline; `emphasis` = the one number that matters).
Every chart takes a `label` that states the conclusion.

**Calendar** — columns (people/rooms/days) × time rows; events span rows; `isFree/onFree` turn
empty cells into booking buttons; `now` draws the line (`nowColumn` limits it to one column in a
week). Columns can be `state: 'today' | 'past'`. Events: `tone`, `state: done|ghost|mine`,
`fresh`, `version` (replays the entrance).
Date navigation (local; days are integers, 0 = Monday of the demo's base week):
```tsx
const nav = useCalendarNav({ today: TODAY, initialDay, open: (weekday) => weekday < 6 });
<CalendarToolbar nav={nav} period={nav.view === 'week' ? '5 – 10 oct' : 'Jueves 8'} compact={phone} />
// nav: { view, setView, day, setDay, prev, next, goToday, isToday, week: number[] }
```
Derive any day's data with a pure function (the clinic: `dayAppts(day, state, view)` = today from
the story, other days from a seeded `scheduleFor(day)` + the visitor's bookings). Past days are
read-only (no free cells); booking = pick a free cell → a small form → `store.update(...)` → it
shows in every view of the pair.

**Kanban** — cards slide between columns when their `column` changes (FLIP); `layout="stack"` on
phones. With `onMove(cardId, toColumn)` the visitor moves cards: pointer drag (mouse anywhere on
the card; touch/pen by the grip, so the page still scrolls) and an accessible alternative on
every card ("Mover «card»" → "Mover a <column>"), a polite announcement and focus back on the
moved card. `lines: 2` on a card lets `sub` and `meta` take two lines (the title stays on one).
Store the override with its time and let the story win only if it changes the card
later (clinic: `state.moved` in `deriveClinic`).

**Feed** — `ActivityFeed` (newest first, `fresh` tag; don't pass `live` in v3), `ToastStack`
(decorative; announce once in an `aria-live` region), `PushBanner` (phone notification).

**Gamification** — `XpBar` (ruler ticks), `Streak` (week dots), `BadgeGrid` (earned / progress
ring / `fresh` glint), `Leaderboard` (rows re-rank with FLIP, `me` highlight).

## 6. Guide hooks ("Ver con guía")

Each demo lists 4–6 steps in `<demo>/tour.ts` (contract: `../tourTypes.ts`):

```ts
export const tour: DemoTourStep[] = [
  { id: 'sim', view: 'both' },        // the SimBar (AppShell sim.tour = 'sim')
  { id: 'booking', view: 'phone' },
  { id: 'agenda', view: 'both' },
  …
];
```

- Mark the element that performs the function with `data-tour="<stepId>"` **in every view where
  it exists** (same function in both views → mark both; the guide lights every visible match and
  anchors on the first). Kit hooks: `NavItem.tour` (sidebar, tabs, dock, drawer), `Card tour`,
  `VoiceCall tour`, `sim.tour`; any element can take a plain `data-tour` attribute.
- Prefer targets visible in the **default** view of each screen (the laptop's first tab, the
  phone's first tab or the patient phone). When the function lives on another tab, mark that
  tab's nav item instead.
- `view`: which view the step is about; in the tabs layout the host switches to it. Use `both`
  when the phone app has the function too, so phone visitors aren't sent to the desktop view.
- Copy: `demoTours.<demoId>.<stepId>.title` / `.body` (es/en/pt), written for that vertical —
  what the business owner gets, in one or two short sentences. Never a generic tour.

## 7. Copy, i18n, honesty

- All copy via next-intl in your namespace (`demoX`), listed in `namespaces.ts`. While agents work
  in parallel, write `messages/drafts/<area>.json` (deep-merged; `null` deletes keys). Generic
  kit strings live in `demoKit` (`sim`, `calendar`, `kanban`, `shell`, `chat`, `voice`…).
- v3 keys per demo: `sim.<beatId>` (short, concrete: "Llamada a la recepción IA") and
  `sim.note` (one line on what is simulated: "Reservas, mensajes y llamadas simulados con datos de
  demostración; no se envía nada."). Guide copy in `demoTours.<demoId>`.
- People's names are message keys, so each locale can localize them (pt uses Brazilian names).
- Everything fictional: business, people, phone numbers (masked), addresses, URLs (`.demo`).
  No real brands, no testimonials/reviews, no prices presented as real offers. Simulated actions
  only change local demo data: never a request, a message, a payment or a commitment.
- Rioplatense "vos" in es, natural pt-BR, plain en. Short sentences, concrete numbers. No "en vivo".

## 8. Motion, sound, a11y, performance

- Animate `transform`/`opacity` (and `clip-path` reveals) only. Mark loops with `demo-loop`: they
  pause when the demo is inactive and **don't run at rest** (AppShell sets `data-idle` while no beat
  plays). Respect reduced motion (every kit CSS has a fallback).
- Sound: off by default (the visitor turns it on). `useSound().play()` only in a click handler and
  only when `active`: `select`, `toggle`, `open`/`close`, `success` (their booking/order lands).
  Never from an effect, a timer or a beat landing.
- Real buttons with labels; `aria-pressed`/`aria-current`/`aria-expanded` where it applies;
  one polite announcer per showcase; no focus traps inside the device; touch targets ≥ 44 px in
  the phone view (≈ 3.7em at the usual scale). The kit's phone chrome already complies (SimBar,
  dock, bottom tabs via an invisible hit area into the bar's padding, app-bar/drawer buttons,
  drawer items, calendar bar); give your own phone controls the same size, or an invisible
  `::after` hit area when the layout can't grow.
- Demo code is lazy (registry). No new dependencies. No layout reads inside timers.

## 9. Verify

- Lab: `app/[locale]/lab/kit-v3b/page.dev.tsx` (dev only, gitignored) renders a demo in the split
  and tabs layouts: `/es/lab/kit-v3b/?demo=clinic&layout=split|tabs|both&w=1176`.
- Playwright: screenshot + `innerHTML` of `.sc`, wait 20 s, compare → identical. Play every beat
  (`.demo-sim-play`), wait for `[data-playing]` to go, check the result, check 4 s of stillness.
  Book from the site and from the agenda; navigate dates; move a card (menu and drag); reduced
  motion (`play` lands at once); axe-core on the lab; 360 px and 1440 px screenshots.
- Unit tests for store logic: `tests/demo-store.test.ts`.
