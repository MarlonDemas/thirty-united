---
name: plain-invitation-design-review
surface: plain-invitation
date: 2026-11-12
auditor: Pixel
against: .specno-design/direction-plain-invitation.md
build: branch feat/world-front-end, working tree as of 2026-11-12 (uncommitted)
---

# Design review: the plain invitation

Verdict: the page matches the direction on layout, card, type, colour, contrast, capsule states other than focus, both handovers and the Never list. It departs from the direction in six places, listed under "Fixes, ranked". Nothing under `src/`, `e2e/`, `scripts/`, `convex/` or the existing contract files was changed. No form was sent; no write request to a backend was seen.

Screenshots are in `.specno-design/captures/plain-invitation-2026-11-12/` (43 files; named in the table). Measured with Playwright 1.64 on Chromium, dev server on port 5174, stopped afterwards.

Contract references used: `references/contract-schema.md` (this direction is a supplement; DESIGN.md is a projection and was not edited), `references/design-token-patterns.md` (tier rules, "no new sizes mid-design", drift detection).

## Clause table

| # | Clause (direction section) | Result | Evidence |
|---|---|---|---|
| 1 | Game no longer loads on arrival; loads on "Play the match" (What changes) | pass | Before the press: 0 requests matching game/three, 0 canvases, `__ready` false. `main.js:20-36` |
| 2 | "Just reply" opens the existing form; `#fastlink` not used (What changes) | pass | Form: `reply-form-390-key.png`. `#fastlink` absent on the invitation |
| 3 | Signature 1: small spaced-caps date line above one large title, nothing else (Signatures) | pass | `vp-390-top.png`. Content only; the first-screen outcome is row 14 |
| 4 | Signature 2: card carries who, what, when, where before any button (Signatures) | pass | Card y=521-728, capsule y=776 at 390 |
| 5 | Signature 3: two equal halves, same size and fill, hairline split (Signatures) | pass at rest, fail in focus | Halves 169x56 and 169x56 at 390, both `rgb(159,11,25)`. Focus differs, see row 19 |
| 6 | Not adopted: pinned bar, bordered reply box, cover image, calendar, share, emoji (Signatures) | pass | None present (`invite.js`, `vp-390-bottom.png`) |
| 7 | One centred column, `min(480px,100%)`, no second column (Layout) | pass | Column 480 at 768 and 1440 (`vp-1440-top.png`) |
| 8 | `#inv` fixed, inset 0, overflow auto, ink-950 (Layout) | pass | `world.css:193`; computed on page |
| 9 | Padding 24 (20 at 360 or less) plus safe-area, 48 bottom (Layout) | pass | Content x=24 at 390, x=20 at 360 and 320; scrollHeight minus column bottom = 48. Safe-area insets are 0 in desktop Chromium, so not checked with a notch |
| 10 | Scroll order: hero, card, "Your reply" kicker, capsule (Layout) | pass | y order 24 / 521 / 752 / 776 at 390 |
| 11 | Hero min-height 56svh phones, 40svh from 1024; content centred both ways (Layout) | pass | 473 of 844 at 390; 573 of 1024 at 768; 360 of 900 at 1440; centred in `vp-390-top.png` |
| 12 | Date line: `DATE_LINE`, caption style, uppercase, .14em, fog-300, may wrap (Layout) | pass | 11/16/600, 269px wide at 390 and 320, no wrap needed |
| 13 | h1: weight 800, -.02em, balance, 32/34 phones, 44/46 from 768 (Layout) | pass | 32/34 at 320-390; 44/46 at 768 and 1440 |
| 14 | At 390x844 first screen = date line + title with only the card's top edge peeking (Layout) | **fail** | Card top at y=521 of 844: the whole card (207px) and the whole capsule (y=776-836) are on the first screen. At 360x780 the card is at y=485 and the capsule at 740-800. `vp-390-top.png`, `vp-360-top.png`. The CSS follows the 56svh figure; the figure cannot produce the stated peek (see fix 3) |
| 15 | At 1440x900 card and capsule also on first screen (Layout) | pass | Card 408-595, capsule 643-703 (`vp-1440-top.png`) |
| 16 | Nothing fixed or sticky inside the page (Layout) | pass | Only `#inv` is fixed; scrolls as one page (`vp-390-bottom.png`) |
| 17 | No horizontal scroll at 320, 360, 390, 768, 1440 (Accessibility) | pass | `scrollWidth` equals viewport at every width |
| 18 | Tokens: every colour, size, radius, spacing traces to an existing token (Tokens) | partial | Colours, radii, motion, type all `var()`. Raw values and the `hero` entry: see "Token trace" |
| 19 | Capsule states: default, hover, focus-visible, pressed (The capsule) | **fail (focus)** | Default, hover (`#B3101F`) and pressed (`#850914`) identical on both halves: `state-hover-left.png`, `state-hover-right.png`, `state-pressed-left.png`. Focus: Play half gets outline 2px white offset 2px, halo 2px `#0E0B13`, z-index 1; Just reply gets the outline but no halo, because `.inv-half:last-child{box-shadow:...}` (`world.css:209`) outranks `:focus-visible` (`world.css:67`). `state-focus-left-3x.png` vs `state-focus-right-3x.png`. White on the fog-300 capsule edge is 1.53:1, so without the halo the right half's focus edge barely changes |
| 20 | Focus ring drawn outside the half, over the divider (The capsule) | partial | Left focused: ring and halo cover the divider (`state-focus-left-3x.png`). Right focused: divider shows as a double line, ring is white over the fog edge (`state-focus-right-3x.png`) |
| 21 | Markup: `div role=group aria-labelledby` + two `button type=button`, Play then Reply (The capsule) | pass | DOM dump in `invite.js:29-31`, confirmed on page |
| 22 | Halves flex:1, min-height 56, radii `pill 0 0 pill` / `0 pill pill 0` (The capsule) | pass | 56px high; radii `999px 0 0 999px` / `0 999px 999px 0` |
| 23 | Divider is the right half's 1px left border (The capsule) | fail, no visual effect | Built as `box-shadow: inset 1px 0 0 fog-300` (`world.css:209`). Looks the same, and is the cause of row 19 |
| 24 | Loading: label "Opening the gates…", `aria-disabled`, `aria-busy`, presses ignored, focus stays, `role=status` carries same text, Reply stays enabled (The capsule) | pass | `state-loading.png`. Label, `aria-disabled=true`, `aria-busy=true`, `disabled` false, focus on Play, status text identical, second press ignored (`#inv` stayed), Reply enabled and still opened the form. Both halves 169px wide |
| 25 | Failed: handover to the form, not shown on the capsule (The capsule) | pass | See rows 38-40 |
| 26 | Narrow (<360): halves stack, full width, radius-3, horizontal hairline (The capsule) | pass | 359, 340, 320: column, radius 12px, divider `inset 0 1px 0 fog-300`, each 56px high (`zoom-w359-bottom.png`). 360 stays in a row, as specified |
| 27 | Stack also when 200% text wraps a label to three lines (The capsule) | **fail** | Stacking is width-only (`world.css:218`). At 390 with type tokens doubled the halves stay side by side; the loading label "Opening the gates…" wraps to three lines and the half grows to 136px (`text-t200-390-loading.png`). Labels wrap and heights grow (`min-height`), so nothing clips |
| 28 | Card: straight edges, radius-2, no shadow, paper-100 fill, no deckle (Tokens, Never) | pass | `.inv-card` `world.css:198`; `vp-390-top.png` |
| 29 | Card labels 13/18/500 paper-muted; values 15/20/600 paper-ink; 88px dt column; 12px row padding; 1px paper-rule (Tokens, Card copy) | pass | `world.css:199-203`; dt/dd boxes measured; rules visible in `vp-390-top.png` |
| 30 | Card copy: Who/What/When/Where with host, tagline, date, venue from `EVENT` (Card copy) | pass | DOM text identical to `config.js:6-7`. No kick-off time row |
| 31 | Venue TBA reads as a settled line: same type, weight, paper-ink; dashed pin 20px stroke 1.5 aria-hidden; no question mark, note or brackets (Venue TBA) | pass | `vp-390-top.png` (Where row). Pin has `stroke-dasharray 3 3`, `aria-hidden`. Not rendered with a real venue; the solid-pin branch is read from `invite.js:18` only |
| 32 | Date line repeats "Venue TBA" (Venue TBA) | pass | "MONDAY 21 DECEMBER 2026 · VENUE TBA" |
| 33 | Targets: halves 56px, at least 8px from other tappables (Accessibility) | pass | 56px; nothing else tappable on the page. The halves abut by design |
| 34 | 200% zoom: reflows, no horizontal scroll, no clipped text; capsule stacks; holds at 320 (Accessibility) | pass | 195px viewport (200% of 390): no scroll, capsule stacked 116px (`zoom-z200-390-bottom.png`). 720px (200% of 1440): row, fine. 200% text at 320 and 390: no clipping, card rows wrap (`text-t200-390-bottom.png`). Below the spec: a 160px viewport (200% zoom of 320) scrolls sideways, `scrollWidth` 195, the 88px label column plus text overflows. Not required by the direction |
| 35 | Contrast pairs (Accessibility) | pass | See "Contrast" |
| 36 | `prefers-reduced-motion: reduce`: `--dur-fast` is 0, colour change instant (Reduced motion) | **fail** | With reduce emulated, `--dur-fast` computes to `120ms` and the half's transition to `0.12s`. `config.js:79` runs `applyMotion(false)` and writes inline custom properties, which beat the `@media` rule at `world.css:13`. No entrance animation exists (0 running animations), so the effect is a 120ms colour fade |
| 37 | `forced-colors: active`: capsule keeps ButtonText borders, fill dropped, card system colours (Reduced motion) | pass | `forced-colors-390.png`, `forced-colors-focus.png`. Cap border ButtonText 2px, halves ButtonFace with 1px ButtonText border, card Canvas/CanvasText with border, rules CanvasText. Divider survives as the two borders |
| 38 | Headings and landmarks on the invitation: h1, hidden h2 "The details", h2 "Your reply"; `main` wraps all; `lang=en` (Accessibility) | pass | h1, h2[sr], h2 in that order; 1 `main`; `lang="en"` |
| 39 | Headings after "Just reply": form, closed card (fallback card heading is an h1) | pass | Form: `H1 Makes turns 30` only. Closed: `H1 You've been called up` only. `reply-form-390-key.png`, `reply-closed-390-nokey.png` |
| 40 | Headings after a reply is saved: code card, decline card, confirmation: one h1 | **fail** | Read from source (a send was not allowed): `codecard.js:30` and `codecard.js:119` render `h2`; `confirmCard` renders `h2` (`ui.js:130`); `fallback.js:22,31` only set the id. Those three views have no h1. Direction: "the page must still have one" |
| 41 | Operable by Tab, Enter, Space alone; no dialog, banner or notice on the page; privacy notice stays in the form (Accessibility) | pass | Tab order Play, Reply; Space on Reply opened the form. Privacy notice is the first block above the form fields (`failure-no-webgl2-390.png`) |
| 42 | Handover to game: loading state, 20s limit, WebGL2 check moved to the press; `#inv` removed when import resolves; no fade (Handover to the game) | pass | Press: no game request before it; `#inv` removed, 1 canvas, `__ready` true, no fallback. Headless software GL took 19.3s to remove `#inv` and 1.8s more to `__ready` (dev server, unbundled). `handover-play-390.png` was not captured: the GPU screenshot failed |
| 43 | Handover to reply: `showFallback('plain')`, instant swap, focus on the card heading (Handover to the reply) | **fail (focus)** | Swap is instant and the `h1` is right, but `document.activeElement` is `BODY` after the press in all three runs (mouse, Space, with and without key). `fallback.js:19-21,41`: `showForm` never calls `focusHead`, and `showClosed`/`showConfirm` call it before `ui.append(main)`, so the card is not in the DOM |
| 44 | Failure path: no WebGL2, load error, 20s limit give the form plus "The game didn't load. You can reply here instead." (Handover to the reply) | pass | No WebGL2 (`failure-no-webgl2-390.png`): form + status line, one h1. Blocked `game.js`: same. Stalled import: fallback at 20.4s (`failure-20s-limit-390.png`). Focus has the same loss as row 43 |
| 45 | A guest who has already replied: same invitation, Reply shows the confirmation or the closed card (Already replied) | not checked live | Needs a saved reply, which means sending a form. Read from `fallback.js:38-40`: `getSent()` then `closedText()`. Closed card (no key) checked: row 39 |
| 46 | Never: pinned/floating bar over the facts | pass | None |
| 47 | Never: hero reveal that holds the date back | pass | Date line and title present on first paint; no animation |
| 48 | Never: cover image with text baked in | pass | None |
| 49 | Never: dialog on arrival | pass | None |
| 50 | Never: emoji in the capsule | pass | Text only |
| 51 | Never: any visual difference between the two halves | fail in focus only | Row 19 |
| 52 | Never: deckled or torn card edge | pass | Straight 8px radius |
| 53 | Never: any fact not in `EVENT` | pass | All text from `EVENT` and `DATE_LINE`. No time, address or club |
| 54 | `feedback.md` REJECTED B and C: no deckle, perforation, ink bleed, strips, ticker, wipes | pass | None present |
| 55 | `feedback.md` Direction D: red only on the primary button, always with the 2px moonlight ring | pass | Fill is `--primary` only; ring is the 2px `--fog-300` capsule edge. Note for the owner, not a failure: `tokens.md:119` says one primary button per beat; this direction makes two equal red halves on purpose |
| 56 | `feedback.md` focus-ring doctrine: never remove focus, ring set once on base `:focus-visible` | partial | Ring is the global rule; the right half's halo is lost (row 19) |

## Contrast (measured, WCAG relative luminance)

| Pair | Ratio | Direction said | Needs |
|---|---|---|---|
| White `#FFF` on `primary` `#9F0B19` | 8.28:1 | about 8.3 | 4.5 |
| White on `primary-hover` `#B3101F` | 6.98:1 | n/a | 4.5 |
| White on `primary-pressed` `#850914` | 10.26:1 | n/a | 4.5 |
| `paper-ink` `#14171F` on `paper-100` `#EFE9DB` | 14.80:1 | about 15 | 4.5 |
| `paper-muted` `#4A4F5C` on `paper-100` | 6.77:1 | about 6.9 | 4.5 |
| `fog-300` `#B7D3FA` on `ink-950` `#0E0B13` | 12.74:1 | well above 4.5 | 4.5 |
| Capsule edge `fog-300` on `primary` | 5.41:1 | above 3 | 3 |
| Capsule edge `fog-300` on `ink-950` | 12.74:1 | above 3 | 3 |
| Capsule edge `fog-300` on hover / pressed fill | 4.55 / 6.70:1 | n/a | 3 |
| `paper-rule` `#8A8576` on `paper-100` | 3.05:1 | n/a (row rule, decorative) | 3 |
| Focus outline white on `ink-950` | 19.52:1 | n/a | 3 |
| Focus outline white on the `fog-300` capsule edge | 1.53:1 | n/a | 3 for a state change |
| Focus halo `ink-950` on `fog-300` | 12.74:1 | n/a | 3 |

`paper-muted` is 6.77:1, slightly under the "about 6.9" in the direction. It passes; correct the figure in the direction at the next edit.

## Token trace (`.inv-*` rules, `world.css:192-219`)

- Colour: every value is `var(--ink-950 | text | text-muted | paper-100 | paper-ink | paper-muted | paper-rule | primary | primary-hover | primary-pressed | fog-300)` or a CSS system colour under `forced-colors`. One literal: `color:#fff` on `.inv-half` (`world.css:207`). The direction lists `#fff`, and `.btn` already does the same (`world.css:53`); it equals `--fog-100` / `--text`.
- Radius, type sizes and weights, motion duration and easing: all `var()`.
- Raw layout values, all named in the direction and none a token category: 88px, 56px, 480px, 56svh, 40svh, 20px side padding at 360, breakpoints 359/360/768/1024, 44px/46px hero from 768. Spacing values 4, 8, 12, 16, 24, 48 are on the scale; 20px is not (the direction names it).
- Added token: `hero: [32, 34, 800]` in `THEME.type` (`config.js:48`) and `--fs-hero/--lh-hero/--fw-hero` in the `:root` fallback (`world.css:11`). The direction allows it. `.specno-design/tokens.md` has no `hero` row and no `paper-*` rows (`config.js:37`, `world.css:6`), and its type and colour names (`panel`, `shirt-red`, Barlow Condensed) do not match the code names (`ink-900`, `primary`, Inter Tight) at all, so the drift is wider than this surface. There are no `tokens.ts` or `tokens.json` files. The 44/46 desktop hero has no token. Per `references/design-token-patterns.md` ("drift detection", "don't invent new sizes mid-design") this needs a tokens update before commit.
- Drift in the CSS fallback: `world.css:4` has `--primary-hover:#850914;--primary-pressed:#6E0710`, while `config.js:38` and `tokens.md:39-40` have `#B3101F` and `#850914`. `config.js` overrides at startup and the page is script-rendered, so no guest sees it today.

## Fixes, ranked

1. **Focus is lost after "Just reply"** (`src/matchday/fallback.js:41`, with `:21-22`). Direction: focus on the card heading. Result today: `BODY`, for keyboard and screen reader guests on every path (plain, closed, load-failed). Call `focusHead()` after `ui.append(h('main', ...))`, and drop the calls that run on a detached card or keep them for later view swaps.
2. **No `h1` on the code card, decline card and confirmation** (`src/matchday/fallback.js:22,31`, `src/matchday/ui.js:130`, `src/matchday/codecard.js:30,119`). The page ends on a view with no `h1`. Smallest change: in `fallback.js` only, after `replaceChildren`, replace the card's `h2` with an `h1` carrying the same id, class and `tabindex`, so the game keeps its `h2`.
3. **First screen at 390x844 shows the whole card and capsule instead of a peek** (`src/matchday/world.css:195`, `.inv-hero` `min-height:56svh`; direction "Layout and scroll order"). The 56svh figure puts the card top at 62% of the screen. This is a conflict inside the direction: its number and its stated outcome disagree. Owner to choose. To match the outcome, make the hero fill the screen less a peek, for example `min-height:calc(100svh - 112px)` on phones (card top about 64px above the bottom edge at 844). To keep 56svh, rewrite the "peeking" sentence.
4. **Just reply loses its focus halo** (`src/matchday/world.css:209`). Move the divider to a real `border-left:1px solid var(--fog-300)` as the direction says, or add `.inv-half:last-child:focus-visible{box-shadow:inset 1px 0 0 var(--fog-300),0 0 0 var(--focus-ring-width) var(--focus-inner)}` and the same for the stacked rule at `world.css:218`. Both halves then show the same focus state.
5. **Reduced motion is not honoured on this page** (`src/matchday/config.js:79`). `applyMotion(false)` writes `--dur-fast:120ms` inline and overrides the media query. Pass `matchMedia('(prefers-reduced-motion: reduce)').matches` instead of `false`; `flow.js` already calls `applyMotion` for the game. Effect is a 120ms colour fade, so the harm is small, but the direction states it as a rule.
6. **Capsule does not stack on a three-line label** (`src/matchday/world.css:218`). CSS cannot detect line count; the width-only rule is the part that works. Either accept this and amend the direction to "below 360 CSS px", or add a `@media (max-width:480px)` rule for the `Opening the gates…` state, or use a container query on `.inv-cap` at about 300px.
7. **Tokens not recorded** (`.specno-design/tokens.md`, `src/matchday/world.css:4`). Add `hero` (32/34/800, 44/46 from 768) and the `paper-*` set to the token files through `/specno-design:design-system`; align the hover and pressed fallbacks at `world.css:4`. Owner of those files is Pixel; not done in this audit.
8. Low: the corrected "about 6.9" for `paper-muted` (6.77:1) in the direction; a 160px viewport scrolls sideways (`.inv-card dl` 88px column plus `dd` text, `world.css:199`), below the 320px the direction commits to.

## Status after fixes (f53a869)

Added 2026-11-13. The findings above are unchanged. Each line below is read from the code at f53a869; nothing was re-measured in a browser.

1. Focus after "Just reply": fixed at f53a869. `fallback.js:42` calls `focusHead()` after `ui.append(...)`; spec test `world-invite.spec.ts:66` checks focus on `fb-h` after Just reply and after a failed load.
2. `h1` on the code card, decline card and confirmation: fixed at f53a869. `fallback.js:22,29-31` pass `level: 'h1'` to `confirmCard`, `declineCard` and `codeCard` (`ui.js:120`, `codecard.js:13,114`) and set `fb-h` on the heading. The spec covers the form view only (`:44`, `:66`); the three post-send views are read from source.
3. First-screen hero height: owner decision. `world.css:195` still has `min-height:56svh`; the direction and the CSS are unchanged.
4. Just reply focus halo: fixed at f53a869. The divider is a real `border-left:1px solid var(--fog-300)` (`world.css:210`); spec test `:98` compares both halves' focus ring and checks the 1px border with no box-shadow.
5. Reduced motion: fixed at f53a869. `config.js:79` passes the `prefers-reduced-motion` match to `applyMotion`; spec test `:121` expects `--dur-fast` 0ms and a 0s transition.
6. Stacking on a three-line label: fixed at f53a869. `.inv-capw` is a size container (`invite.js:31`) and `world.css:221` stacks the halves with a container query; spec test `:128` covers 200% text and the no-stack case at 360.
7. Tokens not recorded: open. The `hero` type token is in `config.js:48` and `world.css:11` but still waits on the owner; `tokens.md` has no `hero` or `paper-*` rows; `world.css:4` still has `--primary-hover:#850914;--primary-pressed:#6E0710` against `#B3101F` and `#850914` in `config.js:38`.
8. Low items: open. `direction-plain-invitation.md:96` still says "about 6.9" for `paper-muted`, and `world.css:199` still uses the 88px `dt` column, so the 160px overflow is untouched.

## Not checked, and why

- Code card, decline card and confirmation rendered live: reaching them means pressing Send, which was ruled out. Heading levels come from source (row 40).
- "A guest who has already replied" live (row 45): needs a saved reply.
- Safe-area insets on a notched phone: desktop Chromium reports 0.
- A real venue in the Where row: `EVENT.venue` was not changed; branch read from source only.
- The game's first frame after handover: the GPU screenshot failed in headless software GL (`handover-play-390.png` is missing). Timings are dev-server only; the 1.8s gap between `#inv` removal and `__ready` is blank ink-950 in dev and should be re-measured on a production build.
- Observation outside the direction: once the game is up the page has no `main` and no `h1` (the game card is an `h2`), because `#inv` was the `main`.
- Real-device checks (iOS Safari, WhatsApp in-app browser): not available.
- `state-hover-*` and `state-pressed-*` were taken with Playwright's mouse; touch press feedback was not tested.
