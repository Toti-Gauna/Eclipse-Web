# Demo kit v2

Every demo is a **fictional product with its own brand**, shown inside a phone and a laptop
(`<DemoShowcase>`). The kit gives you the chrome, a story clock and the modules we sell
(chatbots, voice agents, sites, agendas, pipelines, gamification, dashboards) so each demo
only writes its data, its story and its composition.

Reference implementation: **`clinic/`** (Clínica Aurora). Read it next to this file.

```
components/demos/
  kit.tsx            ← import everything from here:  import { AppShell, … } from '../kit'
  kit/theme.ts       DemoTheme → --demo-* CSS variables
  kit/store.ts       createDemoStore · useStory · usePairedStore · useDemoClock (v1)
  kit/format.ts      useDemoFormat (times, durations, %, dates per locale)
  kit/AppShell.tsx   shell: collapsible sidebar (laptop) · tab bar / drawer / bare (phone) · overlay
  kit/primitives.tsx Card · Pill · IconChip · Avatar · LiveDot · Switch · Button · Meter · Label · Readout · TypingDots · DemoBadge · BrandName
  kit/ChatWidget.tsx runChat (engine) · ChatWidget · ChatPeek
  kit/VoiceCall.tsx  runVoice (engine) · VoiceCall · Waveform
  kit/BrowserFrame.tsx BrowserFrame · LandingPreview · SiteSection
  kit/charts.tsx     Sparkline · Bars · Donut · Legend · Kpi
  kit/Calendar.tsx   Calendar (day/week grid)
  kit/Kanban.tsx     Kanban (+ kit/flip.ts useFlip)
  kit/feed.tsx       ActivityFeed · ToastStack · PushBanner
  kit/gamification.tsx XpBar · Streak · BadgeGrid · Leaderboard
  demo.css + kit/*.css  (all colors are variables; sizes are em)
```

## 1. Contract (types.ts)

`export default function MyDemo({ screen, active }: DemoProps)`, registered lazily in
`registry.ts`. `screen="phone"` is the **complete navigable experience** (it's the only screen on
mobile); `screen="laptop"` is the desktop composition. `active=false` → nothing runs.
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

## 3. Shell

```tsx
<AppShell
  screen={screen} theme={THEME} business={business} logo={<Mark />} active={active}
  nav={[{ id: 'today', label, icon: House }, { id: 'calls', label, icon: PhoneCall, badge: 'live', group: 'Automations' }]}
  current={tab} onNavigate={setTab}
  title={<p>Today</p>}            // laptop top bar (left)
  headerRight={…}                 // laptop top bar right / phone app bar right
  sidebarFooter={…}               // laptop, hidden on the rail
  statusTime="9:43"               // phone status bar (follow your story clock)
  rootRef={pair.ref}              // pairing (below)
  overlay={<PatientView />} overlayOpen={open}   // full-screen layer, revealed by a passing disc
  chrome="app"                    // phone: 'bare' = status bar only (you draw the chrome)
  phoneNav="tabs" maxTabs={5}     // more items → "More" drawer; or phoneNav="drawer"
>
```

- Laptop: sidebar expanded ↔ icon rail (toggle has `aria-expanded/aria-controls`, FLIP slide,
  state kept per instance); the business name + "Demo" badge move to the top bar on the rail.
- Paired phone: the laptop measures the phone that covers its right edge and pads the content
  with `--demo-safe-right` (and `--demo-safe-top` on small showcases). Nothing to do.
- Business name always renders with the visible "Demo" badge and `— Demo` for screen readers.
- `DemoShell` / `DemoTab` / `useDemoClock` remain as v1 aliases.

## 4. The story (clock + state)

Each demo tells a **20–30 s story on a loop**. Hold *only what the visitor did* in a store and
**derive** everything else from `(t, state)` with pure functions:

```ts
// story.ts
export const createStore = (paired: boolean) =>
  createDemoStore<State>(initial(), { loopMs: 30_000, paired, onLoop: (s) => ({ ...initial(), mine: s.mine }) });
// MyDemo.tsx
const { store, paired, ref } = usePairedStore('my-demo', createStore);   // laptop + phone share it
const { state, t, loop, reduced } = useStory(store, active);              // clock runs only while active
const view = useMemo(() => derive(state, t, reduced), [state, t, reduced]);
// a visitor action, stamped with story time:
store.update((s, now) => ({ ...s, picks: { ...s.picks, ask: { reply: 'yes', at: now - CHAT_START } } }));
store.engage();   // hold the final frame instead of restarting under their fingers
```

- Reduced motion: `useStory` returns `t = loopMs` and never ticks → your derivation shows the
  end state; pass `{ instant: reduced }` to `runChat` / `runVoice`.
- Clock is coarse (500 ms). Fine motion is CSS. Use `key={loop}` to reset local UI per loop.
- Paired phone ≠ laptop: next to the laptop the phone can show another side of the same story
  (the clinic shows the *patient's* phone); alone it must reach every feature.

## 5. Modules

**ChatWidget** — `runChat(script, elapsedMs, picks, { instant })` → `ChatRun` (items, typing,
awaiting, `at[step]`, `chosen[step]`). Steps: `{ from: 'bot'|'user'|'note', text, card, typingMs,
pauseMs, replies: [{ id, label, goto }], auto, autoMs, next }`. Auto replies stop once the visitor
taps. `<ChatWidget run variant="whatsapp|widget" title avatar stamp onPick label announce composer />`.
`<ChatPeek>`: collapsed site chat (latest bubble + quick replies + launcher).

**VoiceCall** — `runVoice({ ringMs, lines: [{ who: 'agent'|'caller'|'tool', text, ms, icon }], missed }, elapsedMs)`
→ phase, timer, current line. Give every line an explicit `ms` so timing is the same in every
locale. `<VoiceCall state caller agent outcome sent variant="full|compact" onOpen />` draws the
ring, timer, transform-only `<Waveform level>`, word-by-word transcript and the outcome card.

**BrowserFrame / LandingPreview / SiteSection** — the business's public site in browser chrome
(`variant="desktop|mobile"`). URLs are fictional: use the `.demo` TLD.

**Charts** — `Sparkline` (clip-path draw-in), `Bars` (scaleY), `Donut`, `Legend`, `Kpi`
(label + rolling readout + delta + optional sparkline; `emphasis` = the one number that matters).
Every chart takes a `label` that states the conclusion.

**Calendar** — columns (people/rooms/days) × time rows; events span rows; `isFree/onFree` turn
empty cells into booking buttons; `now` draws the line. Events: `tone`, `state: done|ghost|mine`,
`fresh`, `version` (replays the entrance).

**Kanban** — cards move between columns as the story advances (FLIP). `layout="stack"` on phones.

**Feed** — `ActivityFeed` (newest first, `fresh` tag), `ToastStack` (decorative; announce once in
an `aria-live` region), `PushBanner` (phone notification).

**Gamification** — `XpBar` (ruler ticks), `Streak` (week dots), `BadgeGrid` (earned / progress
ring / `fresh` glint), `Leaderboard` (rows re-rank with FLIP, `me` highlight).

## 6. Copy, i18n, honesty

- All copy via next-intl in your namespace (`demoX`), added to `namespaces.ts`. While agents work
  in parallel, write `messages/drafts/demo-x.json` (deep-merged; `null` deletes keys). Generic
  kit strings live in `demoKit`.
- People's names are message keys, so each locale can localize them (pt uses Brazilian names).
- Everything fictional: business, people, phone numbers (masked), addresses, URLs (`.demo`).
  No real brands, no testimonials/reviews, no prices presented as real offers.
- Rioplatense "vos" in es, natural pt-BR, plain en. Short sentences, concrete numbers.

## 7. Motion, sound, a11y, performance

- Animate `transform`/`opacity` (and `clip-path` reveals) only. Mark loops with `demo-loop` so
  they pause when the demo is inactive. Respect reduced motion (every kit CSS has a fallback).
- Sound: `useSound().play()` only when `active` and on meaningful moments: `type` (bubble, soft),
  `success` (a booking/order lands), `toggle` (switches, sidebar), `select`, `open`/`close`.
  With laptop + phone on screen, only one instance should play/announce (`screen === 'laptop' || !paired`).
- Real buttons with labels; `aria-pressed`/`aria-current`/`aria-expanded` where it applies;
  one polite announcer per showcase; no focus traps inside the device.
- Demo code is lazy (registry). No new dependencies. No layout reads inside timers.

## 8. Lab

`app/[locale]/lab/demos/page.dev.tsx` (dev only, gitignored) renders every kit module with a light
and a dark theme. Per-demo labs: `app/[locale]/lab/demo-<id>/page.dev.tsx`.
