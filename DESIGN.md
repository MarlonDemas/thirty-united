# DESIGN.md: Thirty United

Generated from the `.specno-design/` contract (Direction D, "Matchday: The Signing", chosen by the owner on 2026-10-15). This file is an export. Change the contract, not this file.

**Build status.** This file describes the contract, not the shipped build. `src/` still ships Direction A (the paper ticket, the paper views and the sealed-screen stadium stage) until nova migrates it. Components marked **planned** in section 10 do not exist yet.

## 1. Stack

- **Profile:** `web-vite`
- **Framework:** React 19.2 on Vite 8, single page (no routes)
- **Language:** TypeScript 6
- **Package manager:** pnpm
- **Styling:** Tailwind CSS 4 with CSS variables in `src/index.css`; shadcn/ui `base-nova` style on Base UI (`@base-ui/react`, `render` prop, no `asChild`). `src/index.css` migrates to the Direction D tokens (section 4) in nova's lane
- **Routing:** none. `InvitePage` is a state machine with five views (`sealed`, `attendance`, `form`, `code`, `stub`); in Direction D these become beats (cover, Chapter 1, Chapter 2, code, signed or No end) on one world stage
- **Forms:** react-hook-form + zod 4 (`z.config({ jitless: true })` so the CSP needs no `unsafe-eval`) + `input-otp`
- **State (server):** Convex (RSVP records, email code challenges); `nodemailer` for the code email
- **Animation:** `motion` 14 via `LazyMotion` for the DOM (panel content, tear, stamp); `three` 0.186 with `@react-three/fiber` 9 for the world canvas on T3 and T2 (lazy chunk); CSS transforms for the T1 layer stack; Web Audio (synthesised, opt-in) and `navigator.vibrate`. No new dependency and no CSP change (atlas, `audits/consults/atlas-render-budget.md`)
- **Icons:** `lucide-react`
- **Testing:** Vitest + Testing Library + convex-test; Playwright for e2e
- **Delivery:** Netlify. CSP and security headers in `netlify.toml`
- **Budgets (Direction D, estimates):** entry at most 160 kB gzip; about 2 MB (T2) or 3.5 MB (T3) over the journey; decoded memory up to 60 / 120 / 200 MB for T1 / T2 / T3

## 2. Project Context

A one-page save-the-date and RSVP for Marlon "Makes" Demas's 30th birthday, Monday 21 December 2026, venue to be announced. A guest opens Makes's own matchday poster, alive in depth layers, and moves through it: they tear the lanyard pass open, answer Yes, Maybe or No, give their details while their name is lettered onto a shirt, verify their email with a six-digit code, and end on Makes holding up their shirt as his new signing, with a poster they can save. Re-verifying the same email updates the answer.

**Primary persona:** friends and family, mostly South African, aged about 20 to 70, many on low-end Android in WhatsApp's in-app browser, many not football fans and some not comfortable with forms. **Primary use case:** RSVP in under a minute from a WhatsApp or email link, one-handed, in portrait. Desktop shows the poster as a 9:16 frame with the panel beside it. Each guest visits once or twice. The page is `noindex` and lives for a few weeks.

## 3. Brand & Voice

**Tagline:** *Thirty feels like half time. Come for the oranges.* (the serif standfirst, as built)

**Tone:** a matchday with a film's sense of occasion. Warm, short, a little playful, confident. Written by Makes in first person and signed "Makes". Football is a nod, never a requirement.

**Do:**
- Keep control labels short and literal: "Tear open", "Continue", "Send my code", "Save your poster", "Share".
- Say what to do in errors: "That code didn't match. 3 tries left".
- Write dates as "Monday 21 December 2026 · Venue TBA" on the panel, "MON 21 DEC 2026 · VENUE TBA" on the poster, "21 DEC 2026" on the stamp. No kick-off time until there is one.
- Use words only where no icon, type, colour, position or motion can carry the meaning.

**Don't:**
- Use an official club crest, badge, wordmark, kit, sponsor mark, starball, club or stadium name, devil or trident, anywhere, ever (trademark). Makes's AI poster is a head-and-neck likeness reference only, never a base image.
- Use confetti, balloons, gold foil, "30" clip-art, stock photography, neon, glow borders, betting-app chips, or anything pointed at the camera.
- Use exclamation marks, emoji or "Oops", blame the guest, or use inflated vocabulary or filler openers (Specno writing rules apply to all copy).

There is no logo: Makes's poster is the mark. The draft lines ("You've been called up", "Your shirt", "Seal it", "SIGNED", "PENCILLED IN", "Save it now. We don't keep a copy.") stay as drafts until Makes rewrites them. Owner decisions 2026-10-15: no footer line ("Makes, 21 DEC 2026" is removed; the date is on the cover); no team, sport or "NEUTRAL" line after saving or on the poster (still collected for the host); the panel shows straight away; the No ending has no warm closing line; Chapter 2's standfirst is "Your name goes on the back. A few lines so I can seat you properly."

**Signature:** the invite is Makes's own living matchday poster, where every answer switches on a bank of floodlights until he holds up your shirt, with your name and number, as his new signing. (Pixel's wording, accepted by the owner through "defaults"; he did not write it.)

**Imagery:** a cinematic, photo-real night poster (a generated image that reads as a film still; owner decision 2026-10-15) behind every beat, never a found photograph, HDRI or video. Paste-ready style locks are in `.specno-design/direction.md`, Plate style. One cold moonlight from the upper right and one hot colour, red. Makes is the hero of every frame, smiling, in three poses. **He consented to his likeness on every shared poster ("likeness yes", 2026-10-15); his photo has arrived and the first G1 attempt (2026-10-15) is in review, not approved (it needs a file of at least 1080 x 1920 and a lights-off edit).** Guests appear only as a shirt with their preferred (or first) name and their number (`ticketNo`). The poster never carries a surname, email, WhatsApp number or fun fact, and a No gets no poster.

**Direction (hard constraints):** Direction D is chosen. B "Terrace Ticket" (letterpress ink bleed, deckled edge, off-register stamp, one question per screen) and C "Scoreboard Broadcast" (solid ink strips, scrolling ticker, wipes, shirt-number form rows, scoreboard digits), rejected on 2026-10-14, still bind. The 2026-10-15 candidates A "Tabletop Ground", B "The Walk-Out" and C "Lights On" are recorded as considered, not chosen.

**Open Graph image:** a teaser composite, never a guest's poster: Makes from the chest up, moonlit, looking up at four dark floodlight towers, red smoke low in the frame, "THIRTY" in the sky and "21 DEC 2026" beneath. 1200 × 630 JPEG, `public/og.jpg`, rendered by `npm run og` (`scripts/render-og.mjs`, `src/poster/og.ts`).

## 4. Color Tokens

One dark scheme (`color-scheme: dark`). Contrast ratios are computed with the WCAG formula (2026-10-15), not estimated.

### Light

_No entries yet._ There is no light theme in Direction D.

### Dark

| Token | Value | Role |
|-------|-------|------|
| `void` (`--background`) | `#0E0B13` | Desktop page around the poster frame; `html` background before first paint |
| `panel` (`--card`) | `#18131F` | The step panel and the two chips; every readable word sits on it or on `panel-raised` |
| `panel-raised` (`--popover`, `--muted`, `--secondary`) | `#241D2E` | Input fill, attendance tile fill, disabled button fill |
| `text` (`--foreground`) | `#FFFFFF` | Headings, body, labels, button labels (18.23:1 on `panel`) |
| `moonlight` (`--ring`, `--muted-foreground`) | `#B7D3FA` | Muted text, "optional" tags, focus ring, the primary button's ring, the panel's top rule, the selected tile's edge (11.90:1 on `panel`) |
| `line` (`--border`, `--input`) | `#8A8FB0` | Control edges, group rules, disabled label (5.76:1 on `panel`) |
| `shirt-red` (`--primary`) | `#9F0B19` | Primary button fill only, always with its 2 px `moonlight` ring (white on it 8.28:1) |
| `shirt-red-hover` | `#B3101F` | Primary hover (white 6.98:1) |
| `shirt-red-pressed` | `#850914` | Primary active (white 10.26:1) |
| `poster-red` | `#F81E24` | Scene only: "UNITED", the Yes stamp, decoration. Never on the UI layer |
| `status-error` (`--destructive`) | `#FF9E8F` | Error text, alert icon, 2 px error rule; always with `circle-alert` (9.15:1) |
| `status-success` | `#8EDDA9` | Saved, updated, new code sent (11.34:1) |
| `status-warning` | `#FFC978` | Cooldown and tries-left lines only (12.05:1) |

**Scene tokens** (drawn in code by shaders, sprites and the poster compositor; no readable text uses them): `scene-moon-core` `#E8F5FD`, `scene-moon-halo` `#B7D3FA` (a soft halo plus subtle surface texture so the moon sits in the photo sky), `scene-floodlight` `#F1C7A0`, `scene-smoke-red` `#B22C28`, `scene-ember` `#E03D2B`. The last three were re-sampled from the approved plates on 2026-10-15 (smoke from its lit top quartile; region and method in `tokens.md`).

**Pairs that fail, and what carries them:**

| Pair | Ratio | Carried by |
|---|---|---|
| `shirt-red` on `panel` (button edge) | 2.20:1 | The 2 px `moonlight` ring on every primary button (5.41:1 on the fill, 11.90:1 on the panel) |
| `text` on `poster-red` | 4.04:1 | Not used. The Yes stamp sets `panel` text on `poster-red` instead (4.52:1, passes); `poster-red` is never a text background on the UI layer, and the stamp is in the scene, `aria-hidden` |
| `moonlight` on `scene-floodlight` | 1.02:1 | Chips are solid `panel`; their focus ring gets a 2 px `panel` halo (11.65:1 on floodlight) |
| `moonlight` on `scene-moon-core` | 1.38:1 | Same halo; no control sits over the moon |
| `moonlight` on `scene-smoke-red` | 4.18:1 | Passes 3:1; covered by the same halo |
| `panel-raised` on `panel`; `panel` on `void` | 1.12:1; 1.07:1 | Not boundaries: inputs carry a `line` edge, the desktop panel a `moonlight` rule |

**Rules:** every readable word is DOM text on `panel` or `panel-raised`, never on the moving scene. One primary button per beat, the only red on the UI layer. Nothing dimmer than `moonlight` for text, except the disabled label (`line`). State is never colour alone: each status pairs an icon and a line, errors add the 2 px rule, the selected tile adds a 2 px edge and a filled icon. Dark plus red must not drift toward a betting or gaming app: no neon, no glow, no gold.

Under `forced-colors: active`: the world stage is hidden, the panel uses `Canvas` and `CanvasText`, the focus ring maps to `Highlight`, Yes, Maybe and No stay distinct by wording and icon, and Save your poster and Share still work.

## 5. Typography

- **Display:** Barlow Condensed 700, caps, tracking +2% (panel headings, chips, group labels; in the scene the guest's name and number on the shirt and the poster's fixture and credit lines)
- **Title lockups:** "THIRTY" and "UNITED" as Barlow Condensed 700 outlined to SVG paths, so no extra font file ships (as built; no brush font)
- **Standfirst:** Source Serif 4 italic 400, one line per beat at most
- **Body:** Inter 400 and 500
- **Data:** JetBrains Mono 500, tabular numerals (seat, code cells, email address, cooldown)
- **Loaded from:** `@fontsource/*` packages, self-hosted, latin subset; nothing new to load. Keeping the four shipped faces is accepted by the owner; the SVG title lockups are outlined Barlow Condensed 700
- **Fallback stack:** Arial Narrow (display), Georgia (serif), system-ui (body), ui-monospace (data), size-adjusted, `font-display: swap`

Sizes are `rem`, so 200% text grows the panel, which scrolls inside itself instead of clipping. Minimum text 14px, inputs never below 16px.

| Step | Desktop (size / line) | Mobile | Face |
|------|------|------|------|
| `heading-panel` | 44 / 46 | 32 / 34 | Barlow Condensed 700 caps |
| `standfirst` | 20 / 28 | 18 / 26 | Source Serif 4 italic 400 |
| `body` | 17 / 26 | 16 / 24 | Inter 400 |
| `body-strong` | 17 / 26 | 16 / 24 | Inter 500 (labels, buttons) |
| `input` | 16 / 24 | 16 / 24 | Inter 400 |
| `helper` | 14 / 20 | 14 / 20 | Inter 400, `moonlight` |
| `label-group` | 14 / 16 | 14 / 16 | Barlow Condensed 700 caps, +6%, `moonlight` |
| `data-stub` | 20 / 28 | 20 / 28 | JetBrains Mono 500 ("Seat 017 · Shirt 17") |
| `data-code` | 32 / 40 | 28 / 36 | JetBrains Mono 500, one digit per cell |

Scene type (art, `aria-hidden`, on the 1080 × 1920 poster): "THIRTY" left-set at about 58% of the poster width (poster px [114, 50, 630, 130]; 277 of 390 px at the 390 cover; the widest that clears the chip column in every shot at 360 to 430 px; owner, 2026-10-15) and "UNITED" under it, same left edge, in `poster-red` (poster px [114, 196, 630, 79]), both fully above Makes's hairline (y about 315) on every beat; the shirt name fits 80% of the shirt quad's width; the shirt number about 40% of its height; the fixture line 44px; the credit line 32px in `moonlight`; the AI credit line "Poster art made with AI" 24px in `moonlight` under it, on a `panel` scrim at 85% or more (7.66:1 worst case over white art; 11.90:1 on solid `panel`), saved poster only (not in the page, not on the OG image); the stamp 28px or more.

## 6. Spacing & Layout

**Scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96 (px, base 4).

**Layout primitive:** the poster and the step panel.
- **Phone (portrait):** the world stage is fixed and fills the screen behind everything. The step panel docks at the bottom, 40 to 45% of the layout viewport, sized by content inside that range; longer content (Chapter 2) scrolls inside the panel. Padding 24px (20px at 360px) plus `env(safe-area-inset-bottom)`; 16px between fields, 24px between a group and the action row. Each beat has one camera shot that keeps Makes's face and the shirt above the panel.
- **Keyboard open:** `visualViewport.height` drives the shot. A shirt strip takes the top of the visual viewport (at least 120px (est.)); the panel fills the rest and scrolls the focused field into view. `scroll-padding-block: 6rem` stays.
- **Desktop (from 1024px):** the poster stands as a 9:16 frame, height `100dvh` minus 64px, centre-left in the `void`; the panel is a 420px column on the right with a 1px `moonlight` rule on its left edge.
- **Chips:** Sound and Still are icon-only, at least 44 × 44px, stacked vertically at the top right (safe-area top + 12px), 8px apart.

**Breakpoints:** 640, 768, 1024, 1280. Holds at 360, 390, 768 and 1440, and at 200% text.

**Targets:** 48px minimum for inputs and buttons, at least 44 × 44px for the icon-only chips; 56px for the attendance tiles and code cells; 8px between targets.

**Safe areas:** `viewport-fit=cover` (as built); the panel and chips respect the safe-area insets.

**Z-layers:** world stage 0 (`aria-hidden`, a sibling of `<main>`), panel 10, chips 20, poster viewer 30 (the one overlay).

## 7. Radius, Shadow, Border

| Token | Value |
|---|---|
| `rule-panel` | 1px solid `moonlight` on the panel's top edge (left edge on desktop); the panel's only edge, straight, never torn or deckled |
| `rule` | 1px solid `line`: inputs, tiles, checkboxes, code cells, and the top rule of each field group (no four-sided box inside the panel) |
| `rule-active` | 2px by inset shadow, no layout shift: selected tile and focused group (`moonlight`), field in error (`status-error`) |
| `ring-primary` | 2px solid `moonlight` around the primary button, at rest and in every state |
| Radius | `--radius: 0` everywhere; 50% only for the radio dot and the code-step lamps |
| Shadow | None on the UI layer. Depth and light live in the poster |
| Grain | Static CSS grain and vignette over the poster only; removed under `forced-colors` |
| Stamp | Rotated -4deg. Yes: solid `poster-red` with `text`, "SIGNED · 21 DEC 2026". Maybe: `panel` fill, 2px `text` border, `pencil`, "PENCILLED IN" |
| Focus ring | 3px `moonlight`, offset 2px, on every interactive element (`:focus-visible`); over the scene (the chips) a 2px `panel` halo outside it; the owning group's top rule thickens to 2px `moonlight` |

Hierarchy: the poster > the panel (one surface) > field groups (top rule only) > fields (1px `line`).

## 8. Iconography

- **Family:** `lucide-react` only (not Material Symbols; `components.json` sets `iconLibrary: lucide`)
- **Defaults:** stroke 1.5px, 20px inline and 24px on tiles and buttons, `text` colour, `moonlight` for helper lines; `status-*` only in status lines
- **Where:** the UI layer only (panel and chips). The scene draws its own marks (lamps, stamp); the one lucide glyph in the scene is `pencil` on the Maybe stamp
- **Accessibility:** decorative icons carry `aria-hidden="true"`; an icon-only control gets an accessible name
- **Aliases:** tear = `scissors`, Yes = `check`, Maybe = `circle-help`, No = `x`, continue = `arrow-right`, venue TBA = `map-pin` (dashed), plus-one = `user-plus`, email = `mail`, WhatsApp = `message-circle`, code sent = `mail-check`, cooldown = `timer`, error = `circle-alert`, No end = `heart-handshake`, service down = `cloud-off`, change answer = `pencil`, Sound = `volume-x` / `volume-2`, Still = `pause`, Save your poster = `image-down`, Share = `share-2`, close the viewer = `x`
- Football has no glyph; it is a text label. No emoji as icons.

## 9. Motion & Animation

Budget: signature. "The lights answer you": every answer is a one-way floodlight strike, camera moves are shots (Chapter 1 to Chapter 2 push-in 1.03 to 1.12; the signed beats start wide, all four banks on screen, then push in; no other push-in beyond 3 to 4%), and the finale runs about 3.2 s. All durations are estimates for T3 and T2, to tune on a device.

| Token | Duration | Easing | Use |
|---|---|---|---|
| `world-reveal` | 400ms | `cubic-bezier(0.2, 0, 0, 1)` | The canvas cross-fades over the identical cover still |
| `tear-drag` / `tear-finish` / `tear-cancel` | pointer / ~800ms / 200ms | `cubic-bezier(0.33, 1, 0.68, 1)` | The tear, as built |
| `hint-nudge` | 600ms | ease-in-out | One 4px nudge at 2.5 s if untouched |
| `tear-embers` | 600ms | one-shot | Embers spill from the tear line |
| `bank-strike` | 600ms | `cubic-bezier(0.2, 0, 0, 1)`, one way | A bank of floodlights comes on |
| `push-in` | 1,200ms | `cubic-bezier(0.33, 1, 0.68, 1)` | 1.03 to 1.12 from Chapter 1 to Chapter 2; the signed beats start wide and push in to the face-and-shirt framing (reduced motion cuts to it) |
| `panel-change` | 250ms | `cubic-bezier(0.2, 0, 0, 1)` | Panel content out and in; focus to the new heading |
| `flags-lift` | 400ms | same | Yes: the crowd's flags lift about 6px |
| `pose-swap` | 250ms / 350ms | linear | Makes's pose (wave / signing) |
| `shirt-swing` | 600ms | ease-out, no overshoot | The shirt swings in |
| `letter-paint` | 150ms per letter after a 120ms pause | ease-out | The guest's name on the shirt |
| `lamp-on` / `lamps-out` | 80ms / 200ms | ease-out / ease-in | Code lamps per digit / wrong code |
| `finale-dim` | 300ms | ease-in-out, one way | The held breath before the number |
| `number-land` | 220ms | `cubic-bezier(0.22, 1, 0.36, 1)` | The shirt number, 1.15 to 1.0 |
| `brush-reveal` | 500ms | linear | "UNITED" paints in |
| `ignition` | 600ms | `cubic-bezier(0.2, 0, 0, 1)`, one way | All banks to full |
| `ember-burst` | 1,200ms | one-shot | Finale burst |
| `stamp-land` | spring, contact at 90ms, 1.5px recoil | as built | The stamp |

- **Libraries:** `motion` for the DOM (transform and opacity only); R3F for the world canvas on T3 and T2 (on demand, no post-processing, no bloom); CSS transforms for T1.
- **Render tiers:** T3 Cinematic, T2 Lit, T1 Poster (DOM layers, touch-drag parallax up to 8px, four opacity-switched bank layers), T0 Still (reduced motion), forced colours (no poster). Slow frames demote one tier, never promote within a session; context loss drops to T1 on the same files.
- **Ambient:** 30 Hz on T3 and T2 (clouds over the moon, smoke along the ground, embers rising), paused when the tab is hidden and for the whole code beat. The **Still** chip stops every loop for the session and drops to T1. The UI layer never loops.
- **Flash safety:** every large-area brightness change is one-way and 300ms or more; at most three flashes in any second, red counted separately (WCAG 2.3.1).
- **Never:** forward camera travel, gyro, idle camera drift, wipes or page fades between beats, shaking on a wrong code.
- **Haptics** (Android only, after the first tap, never under reduced motion): tear tick 4ms every 40px, separation [10, 30, 18], bank strike 12ms, Maybe and No 8ms, code digit 4ms, wrong code [10, 30, 10], number 22ms, stamp 22ms (Yes) / 12ms (Maybe).
- **Sound** (opt-in, off by default, synthesised, no files): the built tear ticks, rip and stamp, plus a floodlight clunk with a 120 Hz hum swell (nothing below 100 Hz), crowd swell, a softer swell for Maybe, a crackle for No, a tick per code digit, crowd hush and a drum hit. Sound follows only its own opt-in, so it stays available under reduced motion if the guest turned it on.
- **Reduced motion** (`prefers-reduced-motion: reduce`) = T0: no parallax, particles, push-ins or loops. The cover is the still with "Tear open" only; on press the poster swaps to bank one lit. Every beat swaps to its final state at once; the finale appears with the stamp in place. Focus and live-region announcements still happen.

## 10. Components

Code is the source of truth for components that exist; `.specno-design/components.md` lists divergences from shadcn defaults and declares the planned ones. Existing components are restyled to Direction D in nova's lane.

### Foundations
- **WorldStage** (planned, `InvitePage` level, sibling of `<main>`): owns the beat, the lit bank count, the pose and the shot; one lazy world chunk inside one ErrorBoundary.
- **TierProvider** (planned): picks T3, T2, T1, T0 or forced colours from WebGL2, texture size, renderer, `deviceMemory`, `hardwareConcurrency`, `saveData` and the media queries. No `detect-gpu`.
- **StillLayer** (planned): the poster as DOM layers (WebP), always rendered; the T1 and T0 world and the cover for every rebuild.
- **WorldCanvas** (planned, lazy): the same layers as WebGL planes with the bank-mask reveal, glow sprites, ember points, noise smoke, the code-drawn moon, the code lamps and the lanyard pass.
- **shots.ts** (planned): one camera shot per beat (cover, Chapter 1, Chapter 2, Chapter 2 with the keyboard, code, signed, No end). Signing shot: 0 to 1200 ms pulls back to a wide shot that fits all four lamp cores, 1400 to 2000 ms the banks fire, 2000 to 3200 ms pushes in to the signing framing (about 1.23×); T0 cuts to the final framing.
- **LanyardTicket** (`src/components/three/LanyardTicket.tsx`, exists): moves into the world canvas as the cover's lanyard pass (B2); cut line B3 retires it to the DOM tear. Stacking on the WebGL (T2/T3) cover: the title draws in front of the lanyard cord; the cord passes behind the letters and reappears below them (owner, 2026-10-15).
- **StepPanel** (planned): the bottom-docked panel (phone) or 420px column (desktop); heading as focus target (`tabIndex=-1`), standfirst, controls, status.
- **RuledBox** (`RuledBox.tsx`, exists): kept as the field-group `fieldset` with a `label-group` legend, restyled to a 1px `line` top rule.
- **StatusLine** and **Announcer** (`StatusLine.tsx`, exist): inline status in an `aria-live="polite"` region; also announce world reactions that carry meaning. No toasts.

### Actions
- **Button** (`ui/button.tsx`): square; the primary is the only red fill, with its 2px `moonlight` ring; one per beat.
- **Tear open** (`SealedView.tsx`, exists): a real button beside the drag; works from first paint; strikes bank one. With no invite key the button and handle are removed and a neutral `StatusLine` explains.
- **WorldChip** (built): Sound (`volume-x` / `volume-2`) and Still (`pause`) as real buttons, icon-only (no visible words), solid `panel`, 44 × 44px, 8px apart in a column 12px from the top (plus safe area) and right; sizes live in one shared module (`src/world/chips.ts`) that the CSS and the title-clearance tests both read. Sound's `aria-label` carries its state ("Sound off" / "Sound on") and it has no `aria-pressed`; Still is named "Still" and is the only chip with `aria-pressed`. Hidden under forced colours and while the on-screen keyboard is open; Still is not rendered under reduced motion.
- **SavePoster** (planned): "Save your poster" opens the viewer; "Share" calls `navigator.share({ files })` in the tap and renders only where `canShare({ files })` is true.

### Inputs
- **TextField**, **TextAreaField**, **OptionalTag** (`fields.tsx`): label above, muted "optional" tag, error tied by `aria-describedby`.
- **RadioGroup** (`ui/radio-group.tsx`): attendance as three equal 56px tiles in a row on `panel-raised`; sport and channel.
- **Checkbox** (`ui/checkbox.tsx`): plus-one, square, `user-plus`.
- **Native select:** "How do you know Makes?" (`DetailsView.tsx`).
- **InputOTP** (`ui/input-otp.tsx`): one real input (`autocomplete="one-time-code"`, numeric) with six cells; the scene's six lamps mirror the digits, never as numerals.

### Feedback
- **Stamp** (`Stamp.tsx`, exists): in the scene; Yes "SIGNED · 21 DEC 2026" solid `poster-red`; Maybe "PENCILLED IN" outlined with `pencil`. Live: lower right of the visible shot, above the panel; poster export: the lower corner of the 9:16 frame.
- **ErrorBoundary** (`ErrorBoundary.tsx`): friendly failure, answers kept; around the world chunk it falls back to T1.

### Data display
- **ShirtLettering** (planned): the preferred (or first) name (until Surname has a value, only the first word of the typed name), then the number, in Barlow Condensed 700, warped to the shirt quad.
- **PosterCompositor** (planned): the layers and the guest's fields to a 1080 × 1920 JPEG `File`, rendered during the stamp, never uploaded. Draws the "Poster art made with AI" credit line on the saved poster only.
- **OgCompositor** and the offline asset scripts (planned): build-time only, never ship.

### Navigation
- **InvitePage** (`InvitePage.tsx`, exists): the state machine; answers persist in `sessionStorage` (never the code). The code step persists `{ view: "code", sentAt }` for the code's 10-minute lifetime, so a reload lands on the code step with the cooldown intact.
- Views (exist, Direction A): `SealedView`, `AttendanceView`, `DetailsView` (lazy), `CodeView` (lazy), `StubView`; they become the panel content of each beat.

### Overlays
- **PosterViewer** (planned): the one overlay. Full-screen `<img>` from a `data:` URL with alt text naming what is on it, "Press and hold the poster to save it", a close button; `role="dialog"`, `aria-modal`, focus moved in and returned, Esc closes. No other dialogs, popovers or toasts.

### Retired with Direction A
The paper `Ticket` and `HeaderTicket` as page objects, the `Stub` ruled table, the stage backdrop (`.stage-backdrop`, `terrace-dots.svg`) and the paper grain.

## 11. Patterns & UX Rules

- **Accessibility floor:** WCAG 2.2 AA on every beat and tier. Text 4.5:1, control edges and focus 3:1 against both the surface and the brightest scene pixels behind them. Every readable word is DOM text on the panel or a solid chip; the scene, title and stamp are `aria-hidden` art. Keyboard completion of every beat; `forced-colors` and 200% text supported. The 2026-10-14 axe results cover the Direction A build only; Direction D is unverified.
- **Focus:** on every beat change focus moves to the new heading (`tabIndex=-1`); a live region announces the result and any world reaction that carries meaning.
- **Touch targets:** 48px (56px for tiles and code cells; at least 44 × 44px for the icon-only chips), 8px apart.
- **Responsive:** mobile-first. Phone: poster behind, panel docked at 40 to 45%. Desktop: poster frame plus a 420px panel column. Orientation is not locked.
- **Forms:** visible label above every field, no placeholder-only labels; optional fields carry a muted "optional" tag, no red asterisks. Error text sits under the field with the 2px `status-error` rule and `circle-alert`. After a failed submit, fields revalidate on change and radio errors clear on selection; focus goes to the first invalid field; answers survive every failure. The world answers on Continue, never on selection.
- **Code step (as built):** six digits, paste strips spaces and dashes; code valid 10 minutes, 5 attempts, resend cooldown 60 seconds with a live countdown. Every outcome has its own icon, line and next action (sending, sent, cooldown, wrong code, expired, too many tries, rate-limited, service unavailable, saved, updated). The backend replays a correct, already-used code. **Invite key:** the link carries a secret `?k=...`; a wrong key shows one neutral line and keeps the answers. Direction D adds: ambient stops for the whole beat, one lamp per digit, and the canvas stops when the guest leaves for their email.
- **Keepsake:** Yes and Maybe get Save your poster (the viewer, long-press) and Share where file sharing works; "Save it now. We don't keep a copy." A No gets no poster.
- **Navigation:** no router and no Back button; browser Back leaves the page.
- **Loading:** the cover still paints first and "Tear open" works before the world loads; the canvas cross-fades over the identical still. A slow send shows a still-working line at 5 s and a retry at 15 s; no silent retry.
- **Empty states:** none; there are no lists.
- **Long content:** long or accented names fit 80% of the shirt width, then step down; the panel shows the full name.
- **Privacy and delivery:** `noindex, nofollow`; CSP and security headers in `netlify.toml`; the poster never leaves the phone.
- **Communication plan** (mirrored from `direction.md`):
  - Reading mode: glance for the cover, Chapter 1, Signed, the No end, Save your poster and the chips; scan for Chapter 2 (details) and Chapter 3 (code).
  - Channel map (project override): action = icon plus short label on the panel, and the world never carries a required action; progress = light, the number of floodlight banks lit, mirrored by the panel heading for screen readers; state = colour plus an icon change plus an accessible name on the panel, with the world reaction as a second channel announced in a live region; grouping = position on the panel, one beat per panel; cause and effect = the world answers from the object the answer belongs to (a bank, the shirt, the lamps), with a static lit equivalent for reduced motion.
  - Stranger sentence for glance views: "A first-time user understands this view in two seconds without reading."

## 12. Assets & Change Log

**Assets:**
- `public/favicon.svg`: favicon
- `public/og.jpg`: 1200×630 Open Graph image, the Direction D teaser composite (`npm run og` renders it from the poster layers)
- Fonts: self-hosted from `@fontsource/barlow-condensed`, `source-serif-4`, `inter`, `jetbrains-mono`
- Poster plates (planned): six generations (G1 master, G2 to G5 edits, G6 the shirt), made by Makes and processed by Claude; all approved by the owner on 2026-10-15 (photo-real; G3 dropped, the lights-on G1 is the lit stadium) and processed to 1080 x 1920 in a git-excluded `.specno-design/plates/` folder (likeness consent given)
- Wireframes: `.specno-design/wireframes/save-the-date-signing-2026-10-15/` (Direction D, one phone frame per beat); `.specno-design/wireframes/save-the-date-2026-10-14/` (Direction A, history)
- References: `.specno-design/references/immersive-night-world-rsvp-2026-10-15.md` and `.specno-design/references/immersive-night-world-rsvp/`
- Consults: `.specno-design/audits/consults/atlas-render-budget.md`, `.specno-design/audits/consults/r3f-technique-catalogue.md`
- Lux note: `.specno-design/lux-notes/save-the-date-2026-10-15.md`
- Verify reports (Direction A, history): `.specno-design/captures/save-the-date-verify-2026-10-14.md`, `.specno-design/captures/save-the-date-verify-stadium-2026-10-14.md`

**Change log:**
- **2026-10-14**: Initial DESIGN.md generated from the contract and the verified build (Direction A chosen; lux note; verify with 0 axe violations, 0 console errors, 192 of 192 unit tests and 2 of 2 end-to-end tests after the fix loop). Fix loop closed: base focus ring restored, revalidate-on-change, `viewport-fit=cover`, noindex and Open Graph image, No-stub void strip, offline verify replay.
- **2026-10-14 (invite-key gate)**: Bot protection built as a secret invite key in the link (`src/lib/inviteKey.ts`; backend check in `convex/lib/inviteGate.ts`). New states: sealed ticket with no key, and `invalid_link` at send, resend and verify, all one neutral `StatusLine` sentence. Tests: 214 of 214 unit, 3 of 3 end-to-end. The accessibility scan predates these states; they reuse the already-scanned `StatusLine`.
- **2026-10-14 (3D ticket and stadium A)**: Contract amended for the 3D lanyard ticket (option C), opt-in sound, haptics and the soft contact shadow and sheen on the ticket and stamp, then for the sealed-screen stage (treatment A, "Floodlit Night Stand"). Owner decisions recorded: scene lights stay at the built key 4.2 and ambient 1.6 (replacing 1.0 and 1.4, tuned on the built scene); the stage fades to paper after "Tear open"; the stub stays on paper; the strap reads "THIRTY UNITED", repeated; the Netlify badge stays. DESIGN.md and `.agents/specno-design.json` regenerated from the contract. Sections 1, 3, 4, 7, 9, 10, 11 and 12 changed.
- **2026-10-15 (Direction D, Matchday: The Signing)**: The owner replied "defaults" to the cinematic recommendation, choosing Direction D and its eight decisions (no crests ever; the shirt number is `ticketNo`; no poster for a No; preferred or first name only; ambient at 30 Hz with a Still chip; lanyard B2 with B3 as the cut line; Makes generates the plates; "Monday 21 December 2026 · Venue TBA"). Contract rewritten: dark scheme with every pair re-measured, illustration and red in the scene, the poster and step panel layout, render tiers, the planned world components, a new lux note, phone wireframes per beat and the copied consults. Follow-up the same day: "likeness yes" and "wireframes ok". The first G1 attempt (2026-10-15) is in review, not approved. `src/` still ships Direction A until nova migrates it. All 12 sections changed.
- **2026-10-15 (owner decisions after the first G1 attempt)**: plates stay photo-real (style locks in `direction.md`); G1 in review, not approved, pending a 1080 x 1920 file and a lights-off edit; footer line removed; team and sport not shown after saving or on the poster; draft copy and timing as built; shirt shows only the first word of the name until Surname has a value.
- **2026-10-15 (plate colours and title position)**: owner "defaults": the title lockup moves up above Makes's hairline (THIRTY about y 50 to 180, UNITED about y 196 to 276); bank strikes use code effects (glow sprites, beam cards, a CSS glow per bank on T1), not a new generation; `scene-floodlight` `#FEFCFB` to `#F1C7A0`, `scene-smoke-red` `#DB312B` to `#B22C28`, `scene-ember` `#F03F36` to `#E03D2B`, re-sampled from the plates (method in `tokens.md`). Contrast rows re-measured; `panel` on smoke is now 2.85:1 (decorative only).
- **2026-10-15 (AI credit on the saved poster)**: owner decision: the saved 1080 × 1920 poster carries "Poster art made with AI" in small `moonlight` type under the credit line, on a `panel` scrim; not in the live page, not on the OG image. The owner keeps the original ChatGPT exports (C2PA metadata) outside the repo as provenance.
- **2026-10-15 (real plates in the app: chips, title, signing shot, moon)**: owner decisions: Sound and Still become icon-only, stacked chips (option B), the title returns to about 80% of the poster width (superseded the same day: see the next entry), the signed beats use a two-stage shot (wide with all four banks on screen, then push in), the moon gets a halo and surface texture, the Chapter 1 to Chapter 2 push-in is 1.03 to 1.12, and the Android device test is deferred (real-device check required in phase 8, before merging to main). See `.specno-design/feedback.md`.
- **2026-10-15 (as built: title width and layering)**: owner "defaults": the title is accepted at about 58% of the poster width, left-set, because it has to clear the chip column in every shot (this supersedes the 80% above); on the WebGL cover the title draws in front of the lanyard cord. The chips are named "Sound off" / "Sound on" (no `aria-pressed`) and "Still" (`aria-pressed`). The `chip` text style is retired. See `.specno-design/feedback.md`.
