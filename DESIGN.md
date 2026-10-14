# DESIGN.md: Thirty United

Generated from the `.specno-design/` contract (Direction A, Matchday Programme, with the 3D ticket and the sealed-screen stadium stage) and the shipped build in `src/`. This file is an export. Change the contract, not this file.

## 1. Stack

- **Profile:** `web-vite`
- **Framework:** React 19.2 on Vite 8, single page (no routes)
- **Language:** TypeScript 6
- **Package manager:** pnpm
- **Styling:** Tailwind CSS 4 with CSS variables in `src/index.css`; shadcn/ui `base-nova` style on Base UI (`@base-ui/react`, `render` prop, no `asChild`)
- **Routing:** none. `InvitePage` is a state machine with five views (`sealed`, `attendance`, `form`, `code`, `stub`)
- **Forms:** react-hook-form + zod 4 (`z.config({ jitless: true })` so the CSP needs no `unsafe-eval`) + `input-otp`
- **State (server):** Convex (RSVP records, email code challenges); `nodemailer` for the code email
- **Animation:** `motion` 14 via `LazyMotion` (`domAnimation`) for the tear and stamp; CSS for fades; `three` 0.186 with `@react-three/fiber` 9 for the sealed-screen lanyard ticket (lazy chunk); Web Audio (synthesized) and `navigator.vibrate` for the opt-in craft moves
- **Icons:** `lucide-react`
- **Testing:** Vitest + Testing Library + convex-test; Playwright for e2e
- **Delivery:** Netlify. CSP and security headers in `netlify.toml`; `style-src` carries a sha256 hash for input-otp's empty `<style>`
- **Bundle:** the details and code views are lazy-loaded; entry was about 156 kB gzip (232 before); the 3D scene is a separate lazy chunk loaded only on the sealed screen

## 2. Project Context

A one-page save-the-date and RSVP for Marlon "Makes" Demas's 30th birthday, Monday 21 December 2026, venue to be announced. A guest opens a link on their phone, tears a ticket open, answers Yes, Maybe or No, verifies their email with a six-digit code, and keeps a personalised stub. Re-verifying the same email updates the answer.

**Primary persona:** friends and family, mostly South African, aged about 20 to 70. Many are not football fans and some are not comfortable with forms. **Primary use case:** RSVP in under a minute from a WhatsApp or email link, one-handed, in portrait. Desktop is a wider view of the same flow. Each guest visits once or twice. The page is `noindex` and lives for a few weeks.

## 3. Brand & Voice

**Tagline:** *Thirty feels like half time. Come for the oranges.* (the serif standfirst on the sealed ticket)

**Tone:** editorial, confident, dry, warm, short. Written by Makes in first person, like a club programme's editor's letter. Football is a nod, never a requirement.

**Do:**
- Keep control labels short and literal: "Tear open", "Continue", "Send my code".
- Say what to do in errors: "That code didn't match. 3 tries left".
- Write dates as "21 DEC 2026" on the ticket and stamp, "Monday 21 December 2026" in sentences.
- Use one serif standfirst line per view, none on the code view.

**Don't:**
- Use an official club crest, wordmark or kit, confetti, balloons, gold foil, stock photography or illustration. The one exception is the drawn night-stadium backdrop on the sealed screen (no photo, crest, wordmark, kit or red).
- Use exclamation marks, emoji or "Oops", or blame the guest.
- Use inflated vocabulary or filler openers (Specno writing rules apply to all copy).

There is no logo; the ticket is the mark. The Open Graph image (`public/og.png`, 1200×630) is the sealed ticket artwork.

**Sealed-screen stage (owner decisions, 2026-10-14):** the sealed screen shows the ticket hanging on a lanyard that the guest can grab, swing and fling (3D option C; the DOM ticket is the fallback), in front of stadium treatment A, "Floodlit Night Stand". The stage is the sealed screen only. After "Tear open" it fades to the paper page, and the returned stub stays on paper. Both points are decided (confirmed by the owner on 2026-10-14; they started as defaults). The strap reads "THIRTY UNITED", repeated (confirmed 2026-10-14). The Netlify badge stays and its CSP console errors are accepted.

**Direction (hard constraints from `feedback.md`):** A "Matchday Programme" is chosen. B "Terrace Ticket" (letterpress rendering, ink bleed, shadowed perforation, one question per screen) and C "Scoreboard Broadcast" (ink strips, ticker, wipes) are rejected; do not propose UI that drifts into either.

**Signature:** a ruled, programme-cover landscape ticket with a punched perforation that the guest tears along the stub line, and a returned stub in a ruled table with name, team and seat number in tabular mono numerals, stamped ADMIT ONE · 21 DEC 2026 in a single red rubber stamp.

## 4. Color Tokens

Light theme only (`color-scheme: light`, no `.dark` block). Contrast ratios are computed.

### Light

| Token | Value | Role |
|-------|-------|------|
| `paper` | `#F3EDE1` | Ticket stock, ruled-box surface |
| `page` (`--background`) | `#E8E0CF` | Page background |
| `paper-raised` | `#FBF8F1` | Input fill, select, text on red |
| `ink` (`--foreground`) | `#1B1A17` | Text, 1px rules, control borders, icons (14.93:1 on paper) |
| `ink-2` | `#4A463D` | Secondary text, labels (8.06:1) |
| `muted` | `#5E5A50` | Helper text, "optional" tags, select placeholder (5.90:1 on paper, 6.48:1 on paper-raised) |
| `rule-soft` | `#D9D0BE` | Decorative hairlines only (1.31:1; never a control border or text) |
| `red` (`--primary`, `--ring`) | `#B3261E` | The stamp, the primary action, the focus ring. Nothing else (5.61:1 on paper) |
| `red-pressed` | `#8F1D17` | Primary hover and active fill |
| `status-error` | `#7F1D17` | Error text, alert icon, 2px field rule. Not stock Material red, so red keeps one meaning |
| `status-success` | `#2F5D3A` | Saved, updated, new code sent |
| `status-warning` | `#8A5A00` | Cooldown and attempts-left lines |

### Dark

_No entries yet._ Dark mode is out by owner decision (2026-10-14). The one exception is the sealed screen's night stage, which is a painted layer and not a theme (`:root` stays `color-scheme: light`). Its scene tokens apply to the sealed state only; no form, code or stub view uses them.

| Token | Value | Role |
|-------|-------|------|
| `scene-night-deep` | `#0B1411` | Page edge, sky (paper on it 16.05:1) |
| `scene-night-mid` | `#16231E` | Terrace body, footer scrim (paper 13.93:1) |
| `scene-night-lift` | `#22342D` | Bowl centre behind the ticket, keeps the contact shadow visible (paper 11.28:1) |
| `scene-floodlight` | `#FFF6DC` | Floodlight glow and key light colour |
| `scene-pitch` | `#2F5D3A` | Pitch glow and mowing stripes at low opacity |
| `scene-pitch-lit` | `#2A4A31` | Pitch band under the footer (paper 8.49:1) |
| `scene-ambient` | `#9FB4AA` | Cool green ambient light colour in three (not a CSS paint) |

On the stage, red alone fails 3:1 (2.86:1 on `scene-night-deep`, 1.51:1 on `scene-pitch-lit`) and the ink strap is 1.08:1. Required fixes, not clutter: "Tear open" carries a 2px `paper` outer ring; the focus ring is 3px red offset 2px plus a 2px `paper` ring outside it (scoped to the `.stage` ancestor); the strap has paper stitching and paper caps. Under `forced-colors` the backdrop is hidden and the scene tokens are ignored.

Rules: text on a red fill is `paper-raised` (ink on red is 2.66:1, banned). No red fills other than the primary button and the stamp. Nothing lighter than `muted` for text. State is never colour alone: each status pairs an icon and a line, and errors add the 2px rule.

Under `forced-colors: active`: the focus ring maps to `Highlight`, the grain is removed, the perforation mask is dropped, and Yes, Maybe and No stay distinct by wording and icon.

## 5. Typography

- **Display:** Barlow Condensed 700, caps, tracking +2%
- **Standfirst:** Source Serif 4 italic 400
- **Body:** Inter 400 and 500
- **Data:** JetBrains Mono 500, tabular numerals
- **Loaded from:** `@fontsource/*` packages, self-hosted woff2 and woff, latin subset, five files
- **Fallback stack:** Arial Narrow (display), Georgia (serif), system-ui (body), ui-monospace (data)

Sizes are `rem`, so 200% text grows the ticket instead of clipping it. Minimum text is 14px, inputs never below 16px.

| Step (utility) | Desktop (size / line) | Mobile | Face |
|------|------|------|------|
| `display-ticket` | 120 / 104 | 64 / 60 | Barlow Condensed 700 caps; wraps THIRTY / UNITED on mobile |
| `heading-view` | 56 / 56 | 36 / 38 | Barlow Condensed 700 caps |
| `standfirst` | 24 / 32 | 20 / 28 | Source Serif 4 italic |
| body | 17 / 26 | 16 / 24 | Inter 400 (labels and buttons 500) |
| `helper` | 14 / 20 | 14 / 20 | Inter, `muted` |
| `label-tab` | 14 / 16 | 14 / 16 | Barlow Condensed 700 caps, tracking +6% |
| `data-stub` | 20 / 28 | 20 / 28 | JetBrains Mono 500 |
| `data-label` | 14 / 20 | 14 / 20 | JetBrains Mono 500 |
| code cells | 32 / 40 | 28 / 36 | JetBrains Mono 500, one digit per cell |

Role split is strict: display for the ticket title, view headings and tabs; serif for one line per view; mono for numerals and the email address only.

## 6. Spacing & Layout

**Scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96 (px, base 4).

**Grid:** 4 columns on mobile (16px margin, 16px gap), 12 columns from 768px (32px margin, 24px gap). Content caps at 1200px, the ticket at 960px, the form column at about 560 to 640px. Box padding is 24px (20px at 360px); 16px between fields.

**Breakpoints:** 640, 768, 1024, 1280. Verified at 320, 360, 390, 768, 1440 and at 200% text.

**Targets:** 48px minimum for inputs and buttons, 56px for the attendance tiles and code cells, 8px between targets.

**Safe areas:** `viewport-fit=cover` in `index.html`; the body pads with `env(safe-area-inset-left|right|bottom)`. `scroll-padding-block: 6rem` keeps the focused field clear of the keyboard. No sticky bars.

## 7. Radius, Shadow, Border

| Token | Value |
|---|---|
| `rule` | 1px solid ink: ticket frame, boxes, inputs, tiles |
| `rule-active` | 2px by inset shadow, no layout shift: focused box, selected tile |
| Radius | `--radius: 0` everywhere; `radius-mark` 2px for the stamp and the "optional" and "MAYBE" tags; 50% only for the radio dot |
| Shadow | None. Rules do the grouping. One exception: the ticket and stamp may carry one soft contact shadow (down and to the right) and one light-driven sheen from the upper left; curl and fold gradients stay out, and no other surface gets a shadow or gradient (owner amendment, 2026-10-14) |
| Grain | static SVG noise at 4% opacity on ticket and stub only |
| Perforation | CSS mask on the DOM ticket: a row of punched holes along the seam (3px radius, 9px pitch, 12px from 768px) and a quarter circle lost from each half at both seam ends (`--notch` 10px, 14px from 768px), so a joined ticket shows full punches and a torn one keeps matching edges; an SVG quarter-arc redraws the ink edge. The 3D ticket face redraws the seam as a dotted line with corner notches. No shadow inside or under the perforation |
| Stamp | rotated -4deg, 2px red border with a 1px inner rule; the only rotated element |
| Focus ring | 3px `#B3261E`, offset 2px, set once on base `:focus-visible`. Do not add `outline-none` to controls (it hid focus everywhere during the build) |

Hierarchy: ticket (framed) > ruled boxes (1px) > fields (1px) > tags (2px radius). No box inside a box.

## 8. Iconography

- **Family:** `lucide-react` only (not Material Symbols; the project is a custom Direction A build and `components.json` sets `iconLibrary: lucide`)
- **Defaults:** stroke 1.5px, 20px inline and 24px on tiles and buttons, `ink` colour; `status-*` only in status lines
- **Accessibility:** decorative icons carry `aria-hidden="true"`; an icon-only control gets an accessible name
- **Aliases:** tear = `scissors`, Yes = `check`, Maybe = `circle-help`, No = `x`, continue = `arrow-right`, plus-one = `user-plus`, email = `mail`, WhatsApp = `message-circle`, code sent = `mail-check`, cooldown = `timer`, error = `circle-alert`, No stub = `heart-handshake`, service down = `cloud-off`, change answer = `pencil`
- Football has no glyph; it is a text label. No emoji as icons.

## 9. Motion & Animation

Budget: signature (the tear), instant for anyone who asks for reduced motion. Transform and opacity only. Nothing loops. The ticket answers the guest's hand (grab, swing, fling), lands (stamp) and then settles under damping; after its entrance nothing moves on its own.

| Token | Duration | Easing | Use |
|---|---|---|---|
| `fade-view` | 160ms | `cubic-bezier(0.2, 0, 0, 1)` | Crossfade between views (`.view-enter`) |
| `tear-drag` | follows pointer | none | Drag along the stub line |
| `tear-finish` | 700ms | `cubic-bezier(0.33, 1, 0.68, 1)` | Completing the tear, by drag or by the "Tear open" button |
| `tear-cancel` | 200ms | same ease-out | Release before 35% |
| `stamp-land` | 180ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Stamp scales 1.15 to 1 and fades in, no bounce |
| `hint-nudge` | 600ms | ease-in-out | Stub edge lifts 4px after 3s idle, twice at most |
| `lights-on` | 600ms | `cubic-bezier(0.2, 0, 0, 1)` | One-shot floodlight glow fade-in during the ticket's drop entrance, opacity only; settles, never loops. Off under reduced motion (the glow is simply present) |
| `stage-fade` | 160ms | `cubic-bezier(0.2, 0, 0, 1)` | After "Tear open" settles (about 400ms ease to face-front), the night stage cross-fades to `page` while the DOM ticket takes over; instant under reduced motion |

- **Library:** `motion` (`LazyMotion`, `domAnimation`) for the tear and stamp; `three` with `@react-three/fiber` for the sealed-screen ticket.
- **3D ticket and stage:** the ticket hangs on a rope-physics strap, drawn to a canvas texture from the DOM ticket's fonts and tokens. The DOM ticket stays mounted for screen readers and as the fallback. The canvas renders on demand (`frameloop="demand"`), so it stops at rest. Scene lights, owner-approved amendment of 2026-10-14: key light 4.2 and ambient 1.6 as built, replacing the brief's 1.0 and 1.4 (reason: tuned on the built scene). The key sits upper left at `[-4, 6, 5]`, matching the left floodlight. One baked contact-shadow plane, no shadow maps.
- **Fallback ladder:** WebGL unavailable, context lost, slow frames or a failed 3D load keep the drawn backdrop and show the flat DOM ticket with a CSS contact shadow and sheen. `prefers-reduced-motion` and `forced-colors` never load the 3D chunk (reduced motion keeps the static backdrop, forced colors hides it).
- **Haptics:** `navigator.vibrate` where it exists, never required. Tear tick 4ms every 40px of tip travel, separation 10-30-18ms, stamp 22ms (Maybe 12ms). Fires only after a gesture and not under reduced motion.
- **Sound (opt-in):** a "Sound" tab on the ticket's top rule (`aria-pressed`, "Sound off" by default). The first tap unlocks the `AudioContext`. Synthesized only (tear ticks, paper rip, stamp thump), master gain 0.25, no media files. The choice is kept in `sessionStorage` for the visit. Skipped under reduced motion and forced colors; an iOS silent switch mutes it.
- **Reduced motion** (`prefers-reduced-motion: reduce`): no handle, no hint, no drag. The visible "Tear open" button reveals the stub instantly (measured 68ms against 823ms), the stamp appears in place, view changes are instant, and CSS animation and transition durations are forced to 0.
- Wrong code does not shake the field. Success lands the stamp and fades the stub in.
- The handle alone sets `touch-action: none`, so the page still scrolls elsewhere.

## 10. Components

Code is the source of truth; `.specno-design/components.md` lists the divergences from shadcn defaults.

### Foundations
- **Ticket** (`src/components/Ticket.tsx`): main half and stub half joined at the perforation. Sized by content, capped at 960px.
- **LanyardTicket** (`src/components/three/LanyardTicket.tsx`, with `sceneTextures.ts`, `ticketTexture.ts`, `rope.ts`): the 3D ticket, strap and lights on the sealed screen. Lazy-loaded; the DOM `Ticket` is the fallback.
- **Stage backdrop** (`InvitePage.tsx`, `.stage-backdrop` in `index.css`, `assets/terrace-dots.svg`): the drawn night stadium, `aria-hidden`, sealed state only, removed after the fade to paper.
- **Sound tab** (`SealedView.tsx`): the opt-in sound toggle on the ticket's top rule.
- **HeaderTicket** (`HeaderTicket.tsx`): the ticket as a page header on later views, with the picked reply (`yes`, `maybe`, `no`).
- **RuledBox** (`RuledBox.tsx`): `fieldset` with the label tab as `legend`.
- **StatusLine** and **Announcer** (`StatusLine.tsx`): inline status in an `aria-live="polite"` region, tones `success`, `warning`, `error`, `neutral`. No toasts.

### Actions
- **Button** (`ui/button.tsx`): shadcn, square, primary is the only red fill.
- **Tear open:** a real button beside a pointer-only drag handle (`SealedView.tsx`). With no invite key (`missingKey`) the button and handle are removed and a neutral `StatusLine` reads "This link is missing its invite key. Ask Makes to send you the full link."

### Inputs
- **TextField**, **TextAreaField**, **OptionalTag** (`fields.tsx`): label above, muted "optional" tag, error tied by `aria-describedby`.
- **RadioGroup** (`ui/radio-group.tsx`): attendance as three equal 56px tiles; sport and channel.
- **Checkbox** (`ui/checkbox.tsx`): plus-one, square.
- **Native select:** "How do you know Makes?" with a muted "Choose one" placeholder (`DetailsView.tsx`).
- **InputOTP** (`ui/input-otp.tsx`): one real input (`autocomplete="one-time-code"`, numeric) with six cells.

### Feedback
- **Stamp** (`Stamp.tsx`): `yes` is solid red; `maybe` is outlined with `circle-help` and a MAYBE tag.
- **ErrorBoundary** (`ErrorBoundary.tsx`): friendly failure, answers kept.

### Data display
- **Stub** (`Stub.tsx`): ruled mono table (SEAT, DATE, REPLY). The No stub shows no seat.
- **StubView** (`StubView.tsx`): Yes and Maybe show name, team (or NEUTRAL in `muted`), stamp and seat (three digits, e.g. 007). No shows "Sorry you'll miss it, <name>" with a void diagonal in its own strip below the name.

### Navigation
- **InvitePage** (`InvitePage.tsx`): the five-view state machine. Answers persist in `sessionStorage` (never the code).
- Views: `SealedView`, `AttendanceView`, `DetailsView` (lazy), `CodeView` (lazy), `StubView`.

### Overlays
_No entries yet._ No dialogs, popovers or toasts by design.

## 11. Patterns & UX Rules

- **Accessibility floor:** WCAG 2.2 AA. Text 4.5:1, control borders and focus 3:1. Verified with 0 axe violations (wcag2a/aa/21aa/22aa) in 26 states on the paper views. Keyboard completion of every step; light theme only except the sealed screen's night stage; `forced-colors` and 200% text supported.
- **Focus:** on every view change focus moves to the new view's h1 (`tabIndex=-1`), including the code view, so a keyboard user needs one Tab to reach the code field. This is deliberate. A live region announces the result ("Ticket opened", "Code sent to <email>", "Saved").
- **Touch targets:** 48px (56px for tiles and code cells), 8px apart.
- **Responsive:** mobile-first; one object and one column at every breakpoint. Orientation is not locked.
- **Forms:** visible label above every field, no placeholder-only labels; optional fields carry a muted "optional" tag, no red asterisks. Error text sits under the field with the 2px `status-error` rule and `circle-alert`. After a failed submit, fields revalidate on change (not on blur) and radio errors clear on selection; mounting errors on blur moved the layout and dropped clicks. Focus goes to the first invalid field. Answers survive every failure.
- **Code step:** six digits, paste strips spaces and dashes. Code valid 10 minutes, 5 attempts, resend cooldown 60 seconds (live countdown, announced at start and end). After lockout resend stays disabled until the cooldown ends. Every outcome has its own icon, line and next action: sending, sent, cooldown, wrong code ("3 tries left"), expired, too many tries, rate-limited, service unavailable, saved, updated. The backend replays a correct, already-used code, so a verify queued while offline still shows as saved. **Invite key:** the shared link carries a secret `?k=...` that stays in the address bar (a `sessionStorage` copy is the fallback). With a wrong key (`invalid_link`) the send step and resend show "This link is missing its invite key. Ask Makes to send you the full link." under "Send my code" with answers kept, and verify shows it in the code view without counting a wrong try and keeping the entered code. Neutral tone, no icon.
- **Sealed screen and stage:** the night stage appears on the sealed screen only. The "Tear open" button stays a real DOM button below the canvas and is always the equal path to the drag. The RSVP form, code and stub views stay on light paper. Decisions confirmed by the owner on 2026-10-14: the stage fades to paper after "Tear open" (yes); the stub stays on paper (yes); the strap text is "THIRTY UNITED", repeated; scene lights stay at the built key 4.2 and ambient 1.6; the Netlify badge stays and its CSP console errors are accepted.
- **Navigation:** no router and no Back button; browser Back leaves the page. A reload during the code step returns to the prefilled form. Accepted gaps.
- **Loading:** a slow send shows a still-working line at 5s and a retry at 15s; no silent retry, since a retry would send a second email. No data loads on first paint.
- **Empty states:** none; there are no lists.
- **Long content:** long names wrap and the ticket grows taller. A single word wider than the name column at 390px still breaks mid-word (accepted: Chrome does not hyphenate all-caps).
- **Privacy and delivery:** `noindex, nofollow`; CSP and security headers in `netlify.toml`; the mobile "YOUR STUB" table is folded into the ticket.
- **Communication plan** (mirrored from `direction.md`): reading mode is glance for the sealed ticket and the stub, scan for the attendance, details, No and code views. Channel map: action = icon plus short label; hierarchy = type size and position (the ticket is always the largest object); state = colour plus icon plus accessible name (Maybe outlined stamp, No void rule, Yes full stamp); grouping = position and shared surface (ruled boxes); cause and effect = motion from the tear origin, with a static equivalent for reduced motion.

## 12. Assets & Change Log

**Assets:**
- `public/favicon.svg`: favicon
- `public/og.png`: 1200×630 Open Graph image, the sealed ticket
- Fonts: self-hosted from `@fontsource/barlow-condensed`, `source-serif-4`, `inter`, `jetbrains-mono` (bundled into `dist/assets`)
- Wireframes and references: `.specno-design/wireframes/save-the-date-2026-10-14/`, `.specno-design/references/`
- `src/assets/terrace-dots.svg`: seat dots for the stage backdrop (self-hosted, referenced from CSS)
- Verify reports: `.specno-design/captures/save-the-date-verify-2026-10-14.md` (paper views), `.specno-design/captures/save-the-date-verify-stadium-2026-10-14.md` (stage)

**Change log:**
- **2026-10-14**: Initial DESIGN.md generated from the contract and the verified build (Direction A chosen; lux note; verify with 0 axe violations, 0 console errors, 192 of 192 unit tests and 2 of 2 end-to-end tests after the fix loop). Fix loop closed: base focus ring restored, revalidate-on-change, `viewport-fit=cover`, noindex and Open Graph image, No-stub void strip, offline verify replay.
- **2026-10-14 (invite-key gate)**: Bot protection built as a secret invite key in the link (`src/lib/inviteKey.ts`; backend check in `convex/lib/inviteGate.ts`). New states: sealed ticket with no key, and `invalid_link` at send, resend and verify, all one neutral `StatusLine` sentence. Tests: 214 of 214 unit, 3 of 3 end-to-end. The accessibility scan predates these states; they reuse the already-scanned `StatusLine`.
- **2026-10-14 (3D ticket and stadium A)**: Contract amended for the 3D lanyard ticket (option C), opt-in sound, haptics and the soft contact shadow and sheen on the ticket and stamp, then for the sealed-screen stage (treatment A, "Floodlit Night Stand"). Owner decisions recorded: scene lights stay at the built key 4.2 and ambient 1.6 (replacing 1.0 and 1.4, tuned on the built scene); the stage fades to paper after "Tear open"; the stub stays on paper; the strap reads "THIRTY UNITED", repeated; the Netlify badge stays. DESIGN.md and `.agents/specno-design.json` regenerated from the contract. Sections 1, 3, 4, 7, 9, 10, 11 and 12 changed.
