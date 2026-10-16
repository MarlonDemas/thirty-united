---
name: components
schemaVersion: "1.0"
profileVersion: "1.0.0"
clientName: thirty-united
stack: web-vite
direction: D
lastUpdated: "2026-10-15"
---

# Components: Thirty United

Divergences only. The code is the source of truth for components that exist; this file records what differs from the `web-vite` profile and from shadcn defaults, and declares the Direction D components before they are built.

**Build status (2026-10-15).** `src/` still ships Direction A (paper views, the sealed-screen stage). Everything marked **planned** below does not exist yet; the paths are where atlas's architecture puts them, not files to look for. The migration is nova's lane.

## Layout primitive (from Direction D)

The poster and the step panel. A world stage fills the screen behind everything (`aria-hidden`, a sibling of `<main>`). On a phone the step panel docks at the bottom, 40 to 45 percent of the height, solid `panel`, square, one 1 px `moonlight` rule on its top edge; on desktop the poster is a 9:16 frame centre-left in the `void` and the panel is a 420 px column on the right. Each beat is one panel. Readable text lives only on the panel; the two chips are icon-only and carry no visible words.

## Divergences

| Area | Profile or shadcn default | This project | Why |
|---|---|---|---|
| Primitive library | shadcn/ui with Radix | shadcn `base-nova` style on Base UI (`@base-ui/react`, per `components.json`) | Already scaffolded. Use the Base UI idioms (`render` prop, no `asChild`) |
| Theme | Light and dark | Dark only, `color-scheme: dark`; no `.dark` toggle and no light block | Direction D: the world persists behind every beat (owner, 2026-10-14 and 2026-10-15) |
| Radius | `--radius: 0.625rem` | `--radius: 0` | Poster grammar is square; the panel is a hard-edged band |
| Shadows and cards | `Card` with border and shadow | No `Card`, no shadows, no gradients on the UI layer. The panel is the one surface; field groups are a `fieldset` with a 1 px `line` top rule and a caps legend, never a four-sided box inside the panel | Depth lives in the poster. A box inside the panel is a box inside a box |
| Fonts | Geist Variable | Barlow Condensed, Source Serif 4, Inter, JetBrains Mono (all self-hosted); the SVG title lockups are outlined Barlow Condensed 700 | `tokens.md` typography (owner accepted) |
| Colour use | `primary` anywhere | `shirt-red` on the primary button fill only, always with its 2 px `moonlight` ring; `poster-red` never on the UI layer | Direction D colour thesis; shirt red on the panel is 2.20:1 |
| Icons | lucide | lucide (`icons.md`) | Already set in `components.json` |
| Plus-one toggle | `Switch` | `Checkbox` (square) with `user-plus` | No pills |
| Attendance | `RadioGroup` default dots | `RadioGroup` as three equal 56 px tiles in a row (icon, word) on `panel-raised` with a 1 px `line` edge; selected: 2 px `moonlight` edge and a filled icon | Three equal choices, not colour alone. The world answers on Continue, not on selection |
| Code entry | One input per digit | One real input (`autocomplete="one-time-code"`, `inputmode="numeric"`, 6 chars) with six visual cells (`input-otp`) | Paste, autofill and screen readers work on one input. The scene's six lamps mirror the digits typed; they never show numerals |
| Feedback | Toast (`sonner`) | No toasts. Inline status line in a live region | Toasts vanish before a screen reader or slow reader finds them |
| Overlays | Dialog anywhere | One overlay: the poster viewer (Save your poster). No other dialogs | Long-press save needs a full-screen image |
| Focus | Thin ring, `ring-ring/50` | 3 px `moonlight` ring, offset 2 px; over the scene (chips) a 2 px `panel` halo outside it; the owning group's top rule thickens to 2 px `moonlight` | Holds 3:1 against floodlight glare (`tokens.md`) |
| Hover | Subtle background | Primary: fill to `shirt-red-hover`. Secondary and tiles: fill stays, edge goes to `moonlight` | No hover-only meaning |
| Forms | Any | `react-hook-form` with `Controller` and shadcn `Field`, `FieldLabel`, `FieldError`; `zod` resolver (already installed) | shadcn guidance for the installed stack |

## The world stage (planned)

Atlas's architecture (`audits/consults/atlas-render-budget.md`): the stage sits at `InvitePage` level as a sibling of `<main>`, with one lazy world chunk inside one ErrorBoundary.

- **`TierProvider`** (planned): picks T3 Cinematic, T2 Lit, T1 Poster, T0 Still or forced colours from a short home-grown heuristic (WebGL2, `MAX_TEXTURE_SIZE`, renderer string, `deviceMemory`, `hardwareConcurrency`, `saveData`, the media queries). Demotes on slow frames, never promotes within a session, drops to T1 on context loss. The Still chip forces T1. No `detect-gpu` (it would need a CSP change).
- **`WorldStage`** (planned): owns the beat, the lit bank count, the pose and the shot. Always renders `StillLayer`; mounts `WorldCanvas` on T2 and T3.
- **`StillLayer`** (planned): the poster as DOM layers (WebP), always rendered. It is the T1 and T0 world and the cover for every rebuild (first paint, hidden tab, context loss). Four opacity-switched bank layers keep the light meter without WebGL; the title sits as a DOM layer between the stadium and Makes; the shirt lettering is a canvas-drawn image on the shirt quad.
- **`WorldCanvas`** (planned, lazy): the same layers as WebGL planes with depth-UV parallax, the bank-mask reveal, glow sprites and beam cards (these carry the bank strikes; the lit plate has lamp heads but no beam cones; a CSS glow per bank does the same on T1; owner, 2026-10-15), ember points, noise smoke, the code-drawn moon with its `scene-moon-halo` glow and a subtle surface texture, so it sits in the photo sky (phase and position unchanged), the code lamps and the lanyard pass (B2). Ambient at 30 Hz, paused when hidden and on the code beat. No post-processing.
- **`shots.ts`** (planned): one camera shot per beat (cover, Chapter 1, Chapter 2, Chapter 2 with the keyboard open, code, signed, No end), so Makes's face and the shirt stay above the panel. The Chapter 1 to Chapter 2 push-in runs 1.03 to 1.12 (owner, 2026-10-15), so the title leaves the frame whole. The signed beats are a two-stage shot: 0 to 1200 ms the camera pulls back to a wide shot that fits all four lamp cores, 1400 to 2000 ms the banks fire, 2000 to 3200 ms it pushes in to the signing framing (about 1.23×); under reduced motion (T0) it cuts straight to the final framing.
- **Title stacking** (built; `src/world/layers/layers.json`): the title is two SVG layers, THIRTY [114, 50, 630, 130] and UNITED [114, 196, 630, 79] in poster px, left-set, about 58% of the poster width (277 of 390 px on screen at the 390 cover, about 71% of the screen), at z 5, behind Makes (z 6). That is the widest that clears the chip column in every shot at 360 to 430 px (owner, 2026-10-15, "defaults"). On the WebGL (T2/T3) cover the title draws in front of the lanyard cord: the cord passes behind the letters and reappears below them (owner, 2026-10-15, "defaults").
- **Lanyard pass** (exists as `LanyardTicket`, to be moved): one object inside the world canvas on the cover (B2). Cut line B3: retire it and keep the DOM tear, which already exists.

## Bespoke components

Existing (restyle to Direction D): `TearHandle` and the tear in `SealedView`, `Stamp` (Yes: "SIGNED · 21 DEC 2026" solid `poster-red` with `panel` text, 4.52:1; Maybe: "PENCILLED IN" outlined with `pencil`), `StatusLine` and `Announcer`, `AttendanceChoice`, `OtpField` with `ResendTimer`, `RuledBox` (kept as the field-group primitive: `fieldset` plus legend, restyled to a 1 px `line` top rule with a `label-group` legend, no four-sided box). The breakdown and props are in `.specno-design/edge-cases/save-the-date.md`.

Retired with Direction A: the paper `Ticket` and `HeaderTicket` as page objects, the `Stub` ruled table, the stage backdrop (`.stage-backdrop`, `terrace-dots.svg`) and the paper grain. The DOM ticket may survive as the tear's fallback inside the world, restyled to Direction D.

Planned:

- **`StepPanel`**: the bottom-docked solid panel (phone) or 420 px column (desktop). Holds the beat's heading (focus target, `tabIndex=-1`), standfirst, controls and status. Scrolls inside itself when content exceeds 45 percent; never covers Makes's face (the shot moves instead).
- **`WorldChip`** (Sound, Still): icon-only real `button`s, no visible words (owner, 2026-10-15, option B). Solid `panel`, at least 44 × 44 CSS px, 44 × 44 px, 8 px apart in a column at the top right (12 px from the top, plus safe area, and from the right), the same 2 px `panel` halo and 3 px `moonlight` focus ring as before. Built names: the Sound chip is named "Sound off" / "Sound on" (its name carries the state, so no `aria-pressed`); the Still chip is named "Still" and is the only one with `aria-pressed`. Sound: `volume-x` / `volume-2`, off by default. Still: `pause`, off by default; pressed stops ambient loops for the session and drops to T1. All chip sizes live in one shared module (`src/world/chips.ts`) that the CSS and the title-clearance tests both read. The column stays clear of the title lockup at every phone width (see Title stacking below). Hidden under forced colours and while the on-screen keyboard is open (they would cover the shirt strip). Still is not rendered under reduced motion (already still).
- **`ShirtLettering`**: draws the preferred name (or first name; until Surname has a value, only the first word of the typed name) and later the number in Barlow Condensed 700 to a canvas, warped to the shirt's four-corner quad with a slight displacement from its depth map. Used by `StillLayer`, `WorldCanvas` and the poster compositor.
- **`PosterCompositor`**: a pure function from the layers and the guest's fields to a 1080 × 1920 JPEG `File` (about q0.88), rendered during the stamp so Share is ready. Never uploaded. It draws the credit block at the foot of the poster: the "+ name" credit line (plus-one only), then the AI credit line "Poster art made with AI" (always, owner decision 2026-10-15), both in `moonlight` over a `panel` scrim at 85 percent opacity or more (sizes and contrast in `tokens.md`, Scene type). The AI credit line is on the saved poster only: never in the live page UI, never on the `OgCompositor` image.
- **`SavePoster`**: "Save your poster" opens the poster viewer; "Share" calls `navigator.share({ files })` synchronously in the tap and renders only where `navigator.canShare({ files })` is true. Both sit under "Save it now. We don't keep a copy." Save is co-primary, not a fallback (Android System WebView has no `navigator.share`).
- **`PosterViewer`**: the one overlay. Full-screen `<img>` from a `data:` URL, alt text naming what is on it ("Poster: Makes holds up a red shirt reading THANDI 17. THIRTY UNITED, Monday 21 December 2026"), "Press and hold the poster to save it", a close button. `role="dialog"`, `aria-modal`, focus moved in and returned, Esc closes.
- **`OgCompositor`** and the offline asset scripts (depth maps, masks, splits, compression, contrast checks): run on the Mac at build time; never ship.

## Never

Official club crest, badge, wordmark, kit, sponsor, starball, devil or trident, anywhere; confetti, balloons or gold foil; shadows or gradients on the UI layer; red fills beyond the primary button; `poster-red` on the UI layer; toasts; any dialog other than the poster viewer; a light theme; readable text on the moving scene; wipes or page fades between beats; numerals on the code lamps or a scoreboard of digits; the shirt number as a form row; a torn or deckled panel edge; one question per screen; a poster for a No.
