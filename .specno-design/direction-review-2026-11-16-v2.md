---
name: direction-review
surface: invitation, "Just reply" page and its cards, /privacy/
date: 2026-11-16
round: 2 (supersedes the colour proposal in direction-review-2026-11-16.md, v1)
author: Pixel
status: PROPOSAL ONLY. Nothing in src/, public/, tokens.md, direction.md or contract.yml was changed. The owner picks one option from the pictures below.
trigger: owner, on his phone: the colours are "too aggressive"; he wants the pages to feel more inviting, like a real invitation, built on red, black and white
deadline: link goes to guests on Wed 18 Nov 2026
evidence: the owner's three phone screenshots, references/invitation-feel-2026-11-16.md, lux-notes/invitation-v2-2026-11-16.md, src/matchday/{invite,fallback,ui,fields,config}.js and world.css, public/privacy/
---

# Direction review, round 2: an invitation, not a dark app

## What went wrong in round 1

Round 1 swapped the reds on the same near-black ground, and the feel did not change. The owner's screenshots show why: the page is a dark room with a bright cream rectangle in it, a claret rule down the left, rose stripes on the answers, a purple selected fill and a block of claret as the main button. The ground, not only the red, is what reads as loud. Round 1 also pushed the reply form to a later tier, and the owner approved it from words. This round changes the ground, shows every state as a picture, and the form is part of every option.

## How to read the plates

- Each option has four pictures: the invitation, the reply form with "Yes" selected, the reply form with "Can't make it" selected, and the confirmation.
- They are static mock-ups at 390 x 844, device scale 2, built from the real copy and the real notice wording. They are not the built pages. No hover, motion or screen reader behaviour is shown.
- The two form plates and the confirmation are captured full page, so Continue and the whole notice show; on the phone they scroll. The invitation fits one screen.
- Not shown: the code card, the closed message, error lines, the loading state "Opening the gates…" and the poster dialog. Their treatment is described under each option and in Tier A.
- Mock source is in `plates/v2/src/` (HTML, CSS, fonts).
- Round 1 limit still holds: no club name, crest or stadium. Red, black and white are the only hues. No blue anywhere.

## One thing to know before choosing

October's `feedback.md` records the owner overriding a paper palette (`#F3EDE1`, `#1B1A17`, `#B3261E`) as "still being safe". Options A and C are close relatives of it. That verdict covered the whole experience including the 3D game, which stays loud here. A and C apply paper only to the three pages where a guest reads and answers. If "safe" is still the worry, B is the one that keeps the dark mood. Every ornament in the plates is clean-edged (hairline rules, corner marks, one flat disc); none is textured, so none touches the rejected ink-bleed and deckled-edge ideas.

---

## Option A: Cream and Crimson

Paper ground `#F4EFE4`, a `#FEFBF6` card inside a double hairline frame in crimson `#98002E`, one flat crimson disc with "30", the name in Cormorant Garamond semibold, crimson as the colour of the tagline and the buttons.

| Invitation | Reply, Yes | Reply, Can't make it | Confirmation |
|---|---|---|---|
| ![A, invitation](plates/v2/A-invitation.png) | ![A, reply form with Yes selected](plates/v2/A-form-yes.png) | ![A, reply form with Can't make it selected](plates/v2/A-form-decline.png) | ![A, confirmation](plates/v2/A-confirm.png) |

- **Answer to "too aggressive":** the page is mostly paper and the red is the ink the words are written in, so it reads as a printed card; the only filled red is the 58 px disc and the two capsule halves.
- **Type:** Cormorant Garamond for the name only (display sizes, 38 px and up) and for the italic tagline (23 px); Inter Tight, already loaded, for everything a guest has to read, at 17 px body and 13 px tracked labels.
- **Privacy notice:** uses the existing collapsed variant (`capped: true`): the first sentence shows with a crimson marker, the rest opens on tap. The Yes plate shows it closed; the Can't-make-it plate shows it open. Between two hairlines. Because the Yes sentence is long (six lines at 14 px), collapsing saves only the last three lines; the real saving needs shorter wording, which is Tier B.
- **Answers:** rows with a ring marker; the chosen one gets a crimson 2 px border, a pale rose fill and a check mark, so it never relies on colour alone.
- **Confirmation:** same frame, disc and serif name; "Seat 007 · Shirt 7" sits under a hairline as a receipt line.
- **/privacy/:** paper ground, ink text, crimson underlined links, Cormorant for the h1 only, `theme-color` `#F4EFE4`, `color-scheme: light`.
- **Stepping into the game:** the biggest jump of the three (bright paper to a dark night stadium); it reads as opening a door, and works best with a short cross-fade from paper to ink on "Play the match".
- **Font:** `cormorant-garamond-latin-600-normal.woff2` 23,396 B plus `cormorant-garamond-latin-500-italic.woff2` 23,924 B = 47,320 B (SIL OFL 1.1, from the Fontsource latin subset, not further subset). `check-entry-budget.mjs` does not count fonts, so the 160,000 B entry figure (21,172 B today) moves only by the CSS gzip, an estimated 1 to 2 KB. If you count the fonts anyway: 21,172 + 47,320 = 68,492 B, still under 160,000.

## Option B: Warm Black Evening

Neutral `#151515` ground, a `#211D1A` panel, cream text, a short brick `#B3372A` rule above the date, the name in Libre Baskerville, outlined cream pills, and a brick Continue button.

| Invitation | Reply, Yes | Reply, Can't make it | Confirmation |
|---|---|---|---|
| ![B, invitation](plates/v2/B-invitation.png) | ![B, reply form with Yes selected](plates/v2/B-form-yes.png) | ![B, reply form with Can't make it selected](plates/v2/B-form-decline.png) | ![B, confirmation](plates/v2/B-confirm.png) |

- **Answer to "too aggressive":** the purple and claret cast, the blue and the red fills go; what is left is a neutral black with cream type and one small brick mark, so it reads as candlelight, not a nightclub. It is the quietest change, and the one most likely to still read as "the dark page" next to the old one.
- **Type:** Libre Baskerville regular for the name (30 to 36 px), Inter Tight for the rest.
- **Privacy notice:** the full notice shown inline in a recessed box, with its link. No wording change.
- **Answers:** ring rows with a cream 2 px border, a lighter panel fill and a check mark.
- **Confirmation:** brick disc with "30", serif name, the same receipt line.
- **/privacy/:** keeps its dark page; swaps `#0E0B13` for `#151515`, cream text, Baskerville h1.
- **Stepping into the game:** the smoothest (dark to dark), but the game's red then arrives against a calm page that is already dark, so the jump in loudness is smaller and reads as the game being turned up, not as a new place.
- **Font:** `libre-baskerville-latin-400-normal.woff2` 20,108 B (SIL OFL 1.1). Fonts are outside the entry budget; the figure moves by the CSS only. Counting the font: 41,280 B.
- **Only B** keeps the same ground on the "Just reply" page and on the confirmation a guest sees after playing the game.

## Option C: Chalk and Ink

Chalk `#FBF8F2` ground, a white card with brick corner marks, a heavy black "Makes turns 30" with a very large "30", the tagline in italic brick, black buttons. Red is an accent only.

| Invitation | Reply, Yes | Reply, Can't make it | Confirmation |
|---|---|---|---|
| ![C, invitation](plates/v2/C-invitation.png) | ![C, reply form with Yes selected](plates/v2/C-form-yes.png) | ![C, reply form with Can't make it selected](plates/v2/C-form-decline.png) | ![C, confirmation](plates/v2/C-confirm.png) |

- **Answer to "too aggressive":** it is black on white with four small red corner marks and one italic line; there is no red fill anywhere. It is the calmest, and also the least "football", the loudest thing on it being the black numerals.
- **Type:** Inter Tight 800 for the name (no new face), Cormorant Garamond italic for the tagline only.
- **Privacy notice:** inline, set small under a black rule, no box.
- **Answers:** rows with a black ring, a chalk fill and a check mark. Continue is black.
- **Confirmation:** the same corner marks and heavy name.
- **/privacy/:** chalk ground, black text, black underlined links, no serif needed (h1 in Inter Tight 700), `theme-color` `#FBF8F2`.
- **Stepping into the game:** a hard cut from a near-white page to a dark scene; a fade through ink is needed or the screen flashes.
- **Font:** `cormorant-garamond-latin-500-italic.woff2` 23,924 B (SIL OFL 1.1). Outside the entry budget; counting it: 45,096 B.

---

## Token deltas against the current THEME

Deltas are scoped to `#inv`, `#fb` and `/privacy/` (CSS custom properties set on those roots), so `THEME` in `config.js` and the game's `#card` are untouched. `config.js` writes `:root` variables at startup; a variable set on `#inv` or `#fb` overrides it for those subtrees only. Token names follow `tokens.md`; the right-hand columns are the scoped values.

| Token | Current | A | B | C |
|---|---|---|---|---|
| ground (`ink950`) | `#0E0B13` | `#F4EFE4` | `#151515` | `#FBF8F2` |
| card / panel (`ink900`, `surface`) | `#18131F` | `#FEFBF6` | `#211D1A` | `#FFFFFF` |
| text | `#F4F1EA` | `#1F1A17` | `#F4EFE4` | `#151515` |
| text-muted | `#B8B3A9` | `#5C534B` | `#CFC6B8` | `#5F5A54` |
| hairline rule | `rgba(244,241,234,.14)` | `#E4DCCB` | `#3A332E` | `#E6E0D5` |
| control border | `#8E8A83` | `#7A6F64` | `#8A8178` | `#77716A` |
| field fill | `rgba(0,0,0,.28)` | `#FFFFFF` | `#151515` | `#FFFFFF` |
| selected fill (`ink700`) | `#2F2740` | `#F6E7E5` | `#332C27` | `#F1ECE2` |
| selected border | `#F4F1EA` | `#98002E` | `#F4EFE4` | `#151515` |
| accent (ink, stamp, rule) | `#D9505C` rose, `#F81E24` scene red | `#98002E` | `#B3372A` | `#B3372A` |
| primary button fill | `#8A1F2D` | `#98002E` | `#B3372A` | `#151515` |
| primary button text | `#F4F1EA` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` |
| capsule halves | claret fill, pill | crimson fill, 8 px | cream outline, pill | ink fill, 4 px |
| error text | `#FF9E8F` | `#1F1A17` bold with "!" icon | `#FF9E8F` (unchanged) | `#B3372A` with "!" icon |
| blue "moonlight" / `accentAway` stripes | `#B7D3FA` | removed | removed | removed |
| display face | Inter Tight 700 | Cormorant Garamond 600 | Libre Baskerville 400 | Inter Tight 800 + Cormorant italic 500 |
| hero size (phone) | 34 / 38 | 50 / 50 | 36 / 46 | 44 / 46, "30" 128 / 104 |
| body | 15 / 22 | 17 / 26 | 17 / 26 | 17 / 26 |
| caption / label caps | 12 / 16 | 13 / 18 | 13 / 18 | 13 / 18 |
| privacy notice size | 12 / 16 | 14 / 21 | 14 / 21 | 14 / 21 |
| radius | 8 | 6 | 10, pills 999 | 4 |
| focus ring | 2 px `#F4F1EA`, 2 px halo `#0E0B13` | 2 px `#1F1A17`, halo `#FEFBF6` | 2 px `#F4EFE4`, halo `#151515` | 2 px `#151515`, halo `#FFFFFF` |

Two deltas apply to all three and are accessibility gains for the 40 to 60 age range: body 15 to 17 px, and the privacy notice 12 to 14 px. The notice and the form get longer as a result (the Yes form is about 1,780 to 1,900 px tall at 390 px wide).

New in the contract, any option: a `display` font family entry (Cormorant Garamond or Libre Baskerville), a light-ground token set scoped to `#inv` / `#fb`, and a scoped `accent-ink` token. Nothing is added to `THEME` that the game reads.

### Computed WCAG ratios

All ratios computed by script on 2026-11-16 with the WCAG relative-luminance formula. "Current" is the live page for comparison. Button text size is 16.5 px at weight 600, so 4.5:1 is the line. Non-text elements need 3:1.

| Check | Current | A | B | C |
|---|---|---|---|---|
| Body text on ground | 17.30 | 15.03 | 15.93 | 17.23 |
| Body text on card or panel | 16.16 | 16.70 | 14.59 | 18.26 |
| Muted text on ground | 9.35 | 6.55 | 10.80 | 6.44 |
| Muted text on card or panel | 8.73 | 7.28 | 9.90 | 6.82 |
| Muted text on selected fill | n/a | 6.26 | 8.12 | 5.80 |
| Placeholder text on field | n/a | 5.69 | 6.58 | 4.82 |
| Primary button text on its fill | 8.04 | 8.84 | 6.01 | 18.26 |
| Primary button fill against ground (non-text) | 2.15 | 7.71 | 3.04 | 17.23 |
| Capsule label on its fill | 8.04 | 8.84 (white on crimson) | 15.93 (cream on ground, outline) | 18.26 |
| Focus ring against ground | 17.30 | 15.03 | 15.93 | 17.23 |
| Focus ring against card or panel | 16.16 | 16.70 | 14.59 | 18.26 |
| Focus halo against ring | 17.30 | 16.70 | 15.93 | 18.26 |
| Error text on card or panel | 9.15 | 16.70 (ink) | 8.40 | 6.01 |
| Control border against its field | 5.31 | 4.90 | 4.78 | 4.82 |
| Accent text on card (A tagline, C italic) | n/a | 8.57 | n/a | 6.01 |
| Accent mark on ground (stamp, rule, corners; decorative) | n/a | 7.71 | 3.04 | 5.67 |
| Accent mark on panel (B only) | n/a | n/a | 2.79 | n/a |

Notes on the table:
- **Focus ring.** It sits 2 px outside the control with ground showing in the gap, so the colour it is adjacent to is the ground, which is the row reported. Ring against the filled button directly (not adjacent): A 1.95, B 5.24, C 1.00. That is why the 2 px gap is part of the spec; a ring drawn flush on the button would fail in A and C.
- **B's brick on its panel is 2.79:1**, under 3:1. The brick therefore sits on the ground only (the short rule on the invitation) or as a flat disc with cream text inside it (cream on brick 5.24). Do not place brick rules on the panel.
- **A's error colour.** Everything in A is already crimson ink, so crimson cannot also mean "error". Errors in A are bold ink text with the existing "!" icon and a 2 px ink border on the field. This differs from the usual red error and should be checked with the owner; the words and the icon carry the meaning, as the contract already requires.
- **C's error** reuses the brick (6.01 on white) with the icon, since red is its single accent.
- **B's error** keeps the existing `#FF9E8F`, which is already inside the tokens.
- Everything above clears 4.5:1 for text and 3:1 for non-text, except the two items flagged (B's brick on panel, ring against fill not adjacent).

---

## How /privacy/ follows

The page is a single stylesheet (`public/privacy/privacy.css`) with four colour variables (`--ink`, `--chalk`, `--stone`, `--rule`) and `color-scheme: dark`. Following the option is a variables change plus one font-face: swap the four variables for the option's ground, text, muted and rule; switch `color-scheme` to `light` for A and C; set the h1 in the option's display face; set `<meta name="theme-color">` to the ground; links in A are crimson (8.57 on `#FEFBF6`, 7.71 on paper), in B and C cream or ink, underlined. No change to the page's words. About 20 minutes, plus the font-face line. The page loads the same woff2 files the other pages use, so there is no extra download for a guest who already opened the invitation.

---

## Recommendation: Option A, Cream and Crimson

- It is the most direct answer to what the owner said. "A real invitation" is a printed card, and a card is paper with ink on it. A and C are paper; A is the only one that keeps his red clearly present (crimson disc, tagline, buttons) while making it ink instead of a fill.
- B is the least change. The screenshots suggest the ground, not only the red, is what reads as aggressive, and B keeps a dark ground. If he picks B it should still be a clear improvement (neutral black, cream, no blue), but it carries the highest risk of "it still looks like before".
- C is the calmest but the least red and the least warm: black numerals and black buttons are strong, and the red almost disappears. It is the better pick if he wants "black and white first".
- A's costs, stated plainly: the two capsule halves are filled crimson, so A has more red area than B or C; it is the closest to the paper palette he once called safe; and the invitation and "Just reply" pages go light while the game's own cards stay dark. A guest who plays the game and then saves their reply sees a dark confirmation, not the light one in the plate. Only B avoids that. That mismatch is acceptable for Wednesday (the two grounds are separated by a tap on "Play the match"), and is listed under Tier B.
- If the owner wants less red than A, the smallest edit is to make the capsule halves outlined crimson on card instead of filled. It does not need a new option.

## Tier A (buildable and verifiable before Wed 18 Nov), Option A

Effort is rough hours of build plus check for one person. Nothing in Tier A changes a word of the privacy notice, so there is no `NOTICE_VERSION` bump and no backend update.

| # | Item | Effort |
|---|---|---|
| 1 | Scoped light tokens on `#inv` and `#fb` (ground, card, text, muted, rule, control, field, selected, accent, button, focus), set as CSS variables so `config.js` THEME and the game's `#card` are unchanged | 1.5 h |
| 2 | Self-host the two Cormorant woff2 files with their OFL text, `@font-face` with `font-display: swap`, and a Georgia fallback sized to avoid layout jump; the CSP (`style-src 'self'`) needs no change | 1 h |
| 3 | Restyle the invitation: double crimson frame, disc, serif name, label rows, equal crimson capsule with the existing stacking and forced-colours rules kept | 2.5 h |
| 4 | Restyle the "Just reply" page: kicker, serif name, italic tagline, facts rows, ring-row answers with check marks, fields, Continue; the notice as a styled block between hairlines | 3 h |
| 5 | Use the collapsed notice on this page (`capped: true` at `fallback.js:34`). Styling only, no wording. **Sequence this after the other agent's uncommitted `fallback.js` / `fallback.test.ts` fix lands**, and read what the tests assert about the notice (not read in this round) | 0.5 h |
| 6 | The same paper, frame and type on the cards that share `#fb`: confirmation (with the receipt line and keepsake buttons), code card, decline card, closed message, status and error lines (A's ink-and-icon errors) | 2.5 h |
| 7 | Page edges that a guest sees first: `html` and `#boot` background, `theme-color` meta, `favicon.svg`, and `og.jpg` link preview redrawn in paper and crimson (WhatsApp shows the preview before the page) | 2 h |
| 8 | `/privacy/` to match (variables, font-face, `theme-color`) | 0.5 h |
| 9 | Verify: Playwright screenshots at 390 and 360 wide, 200% text, forced colours, keyboard focus ring on every control, the ratios above recomputed from the built CSS, existing unit and e2e tests; then `specno-design:design-review` | 2.5 h |

Total about 16 hours, which is two working days. That is tight for a Wed 18 Nov send if the pick comes tonight. Cut line if time runs short: items 1 to 4 and 7 are what a guest sees first; item 6 (code, decline, closed cards) can drop to a minimal recolour (same tokens, no frame) and finish in Tier B.

The game, its HUD, the stations, the 3D scene and the saved poster stay as they are. The poster dialog (`dialog.poster`) stays dark and opens over the light page like a lightbox.

## Tier B (after Wed 18 Nov), Option A

| Item | Effort |
|---|---|
| Shorter notice wording so the collapsed summary is one to two lines (needs `NOTICE_VERSION` bump, `convex/lib/declineValidation.ts` allow-list update and a deploy together) | 2 h plus backend deploy |
| Paper-to-ink cross-fade on "Play the match", and a loading state ("Opening the gates…") styled for the light page | 2 h |
| Make the game's own confirmation card carry the light confirmation (or a deliberate dark twin of it), so a guest who played sees the same final screen | 3 h |
| Poster dialog and keepsake poster palette check against the light confirmation | 1.5 h |
| Desktop layout (one 480 px frame centred on the paper) and a pass on 768 px and up | 2 h |
| Subset the Cormorant files further (Latin basic only) to cut the 47 KB if wanted | 1 h |
| Capture candidate `LUX:` entries (calm pages, loud game; serif for the name only; selected never by colour alone) via reflect once the owner picks | 0.25 h |

## Wording changes I would want, listed separately

None is essential for Tier A, and none is in the plates; every notice string in the plates is the exact current wording.

1. **Optional, Tier B, forces `NOTICE_VERSION` bump plus backend update:** shorten the lead sentence of the Yes notice. It is a single 70-word sentence listing eight data items; guests aged 40 to 60 read six lines at 14 px. A shorter lead would make the collapsed variant worth using. Needs the owner's and the lawyer's or advisor's sign-off on the new text, a new version string (for example `popia-2026-11-v4`), and `convex/lib/declineValidation.ts` updated in the same deploy.
2. **Not wording, but flagged:** the form's first screen reads "You've been called up" above "Makes turns 30". It is the owner's voice and I left it; the invitation page has no equivalent line.
3. **Not in the plates:** the preview build's stray `null` line under the facts card (seen in all three screenshots) is a bug, not a copy item. It needs fixing before Wednesday whichever option wins; the plates do not reproduce it.

## Open questions for the owner

1. Pick A, B or C.
2. If A: filled crimson capsule halves (as in the plate), or outlined?
3. If A or C: is a light "Just reply" page next to a dark game acceptable, knowing the post-game confirmation stays dark until Tier B?
4. If A: is an ink-coloured error (instead of red) acceptable?


---

## A + C round (owner feedback)

Owner: "I like both A and C, I feel A could be perfect there is just a little something missing from it which I get from C." A stays the base. This round finds the "something" and shows it in four variants of A. Plates are in `plates/v2/` (`A1-` to `A4-` plus `invitation`, `form-yes`, `form-decline`, `confirm`, PNG at 390 x 844, 2x); source in `plates/v2/src/` (`A<n>-<state>.html`, `A<n>.css`). No copy changed, including the notice text.

### What C has that A lacks, ranked

I compared the four A plates with the four C plates. Ranked by how likely each is to be what the owner felt, given a football 30th and his earlier dislike of looks that felt "safe".

1. **A big, heavy "30" as the focal point.** On C's invitation the numeral is about 128 px tall, and it is the first thing you see. A's "30" is a 58 px disc and the title is a quiet line of light serif. This is the matchday-programme feel, and the strongest difference between the two pages.
2. **Left-aligned, editorial layout.** C reads like a programme or a ticket stub. A is centred, which reads as wedding stationery. Left alignment also puts the date, title and facts on one edge.
3. **Heavy title weight against light.** C's title is Inter Tight 800. A's is Cormorant 600, a thin stroke. The weight contrast is part of why C feels sporty, and it is tied to item 1.
4. **A neutral anchor, with red kept scarce.** C's buttons are black and red is only ink and accents, so the red stands out. In A, the buttons, disc, frame, tagline and selected states are all crimson, so the page has one note.
5. **Red italic tagline in the invitation's "What" row.** A's invitation shows the tagline in plain sans. A's form pages already have the red italic, so this is a gap on the invitation only.
6. **Red corner marks against a double frame.** Corner marks read as a pitch corner or crop marks. The double frame reads as engraved stationery. Small effect, but it adds to the sporty read.
7. **A stronger black rule under "YOUR REPLY".** Forms only. It gives the form a firm start. Real, but small.
8. **White card on chalk.** Weak. A's card contrast against its ground is 1.11 and C's is similar. The white looks cleaner, but I doubt this is what he felt.

My read: items 1 to 3 are one thing, a loud sporty numeral, and I expect it is the answer. Items 4 to 7 are supporting polish.

### The variants

All four keep A's cream paper, crimson as the ink colour and the Cormorant serif. All four tighten the gap between the title and the facts: the hero no longer stretches to fill the screen, and the block sits centred in the frame, so the gap between title and facts is about 22 px instead of about 200 px. A1, A3 and A4 drop the disc and put the numeral in its place on the invitation; their form and confirmation pages have no disc.

| Variant | Borrows from C | Keeps from A |
|---|---|---|
| **A1** | Oversized "30" (item 1, set in Cormorant, lining figures), left-aligned layout (2) | Double crimson frame, crimson buttons, serif numeral |
| **A2** | Black buttons (4), red italic tagline on the invitation (5), corner marks (6), black rule under "YOUR REPLY" (7), whiter card on a deeper cream ground (8) | Centred layout, crimson disc, light serif title |
| **A3** | Oversized, heavy "30" in Inter Tight 800, in crimson (1, 3), left-aligned layout (2) | Double crimson frame, crimson buttons, serif for "Makes turns" |
| **A4** | Heavy crimson Inter Tight "30" (1, 3), left alignment (2), red italic tagline (5), corner marks (6), black rule (7), whiter card (8) | Crimson buttons and selected states, Cormorant for the title, cream paper |

Files:
- A1: `plates/v2/A1-<state>.png`, `plates/v2/src/A1.css`, `plates/v2/src/A1-<state>.html`.
- A2, A3, A4: the same pattern.

The form and confirmation pages of A1 and A3 are identical to each other (neither has the numeral, corners or black rule), so the owner will only see the difference on the invitation. A2 and A4 differ on every page because of the corner marks, the black rule and the card colour.

A4 keeps crimson buttons on purpose. Black buttons are tested alone in A2, so the owner can say whether he missed them. If he likes A4 but wants less red, swap the buttons to ink with one token (`--btn`).

### Contrast ratios, new or changed pairs

Computed by script (`scratchpad/ratA.mjs`, same formula as the earlier round).

| Pair | Used in | Ratio |
|---|---|---|
| Crimson `#98002E` on card `#FEFBF6` (numeral, tagline) | A1, A3 | 8.57 |
| Crimson on new card `#FFFEFB` (numeral, tagline, corner marks) | A2, A4 | 8.77 |
| Ink `#1F1A17` on `#FFFEFB` | A2, A4 | 17.09 |
| Muted `#5C534B` on `#FFFEFB` | A2, A4 | 7.45 |
| Muted `#5C534B` on new ground `#EFE8D8` | A2, A4 | 6.16 |
| White on ink button `#1F1A17` | A2 | 17.24 |
| Ink button against card `#FFFEFB` (non-text) | A2 | 17.09 |
| Cream `#F4EFE4` divider on ink button | A2 | 15.03 |
| Control border `#7A6F64` on `#FFFEFB` (non-text) | A2, A4 | 4.86 |
| Crimson on selected tint `#F6E7E5` | A2, A4 | 7.36 |
| Card `#FFFEFB` against ground `#EFE8D8` (edge, decorative) | A2, A4 | 1.21 |

Every text pair clears 4.5:1, and every non-text control or mark clears 3:1. Unchanged pairs (white on crimson 8.84, placeholder 5.69) carry over from the first round. The card-to-ground ratio is low by design, as in A and C. The card edge is not the only cue, because the corner marks or frame outline it.

### Pick: A4

A4 takes the numeral (items 1 to 3, the likeliest answer), plus the italic tagline, corner marks and black rule, and keeps A's crimson buttons, selected states and serif title. It reads as a matchday programme printed on cream, still clearly A. The big numeral also fixes the empty gap: it fills the space the gap left, so the invitation uses the screen without stretching. If the owner finds A4 too close to C, A3 is the quieter step (numeral and left alignment only, A's double frame kept). If the numeral is the answer, A1 is the most elegant version, but its thin serif numeral is the least sporty of the three.

### Effort against Tier A

Only item 3 (invitation), item 4 and item 1 (tokens) move; the rest are unchanged. These are my estimates, not measured.

- **A1 or A3:** about 0 to +0.5 h. The numeral replaces the disc (A3 uses the Inter Tight variable file the page already loads, at weight 800, so no new font file; A1 needs the Cormorant lining-figures feature, which rendered correctly in the plate). The frame and colours are unchanged.
- **A2:** about +1 h. A new ground and card token, corner marks drawn with background gradients replacing the double frame, an ink button token, and the black rule. The theme-color, `html` background and `og.jpg` redraw (item 7) use the new ground.
- **A4:** about +1 to +1.5 h on the invitation and form pages (numeral, corner marks, ground and card token, rule), offset a little by dropping the disc and double frame. Tier A goes from about 16 h to about 17 h. The cut line is the same: keeping A's double frame instead of corner marks (as in A3) saves about 0.5 h.

None of the variants touches a word of copy or the privacy notice, so there is still no `NOTICE_VERSION` bump. Item 5 (collapsed notice) is still sequenced after the other agent's `fallback.js` fix lands.

### Open question for the owner

Which feels closest: A1, A2, A3 or A4? Whichever he picks tells us which quality he was missing (A1 and A3: the numeral and left layout; A2: the black, the red italic and the corners). If he picks A2 over the numeral versions, the ink buttons were the "something", and A4 should swap its buttons to ink.


---

## Luxury round (the owner's reference card)

Trigger: the owner shared a save-the-date image sent by a relative and said it is "the level of luxury I am looking for, can you beat that", still in red, black and white. This round is proposal only. Nothing in `src/`, `public/`, `direction.md`, `tokens.md` or `contract.yml` changed. The card itself is not copied into this repo; it is called "the owner's reference card" throughout.

What the card changes in my reading:
- It is black, centred, thin and formal. A dark ground was never the problem. The aggressive feel came from the claret, purple and blue tints and the heavy red fills, which the earlier rounds removed in A and C but also moved to paper.
- He never reacted to A1 to A4, so the big "30" is not assumed to be what he wanted. In these plates "30" is a secondary italic line and the date numeral "21" is the large figure, as on his card.

Plates, all 390 x 844 at device scale 2 (link previews 1200 x 630 at scale 1), in `plates/v2/`: `L<n>-invitation.png`, `L<n>-form-yes.png`, `L<n>-form-decline.png`, `L<n>-confirm.png`, `L<n>-og.png` for n = 1, 2, 3, plus one alternate, `L1-invitation-alt.png`. Source: `plates/v2/src/L.css`, `L<n>-<state>.html`, `L1-invitation-alt.html`. They are static mock-ups from the real copy and the real notice wording, not built pages. They are captured with reduced motion on, so each shows the finished picture.

### 1. Decoding the reference card

| Move on the card | What it does | Template median or earned? | What ours does instead |
|---|---|---|---|
| Didone all-caps name, large, metallic gradient fill | High stroke contrast and caps read as engraved stationery. The gradient fakes foil. | The Didone caps are earned. The linear gold gradient is the Canva-style median: it is the first thing every "luxury" template applies. | Keep the Didone caps. Flat ink with a single narrow sheen band that crosses the name once. Foil that moves, not a gradient painted on. |
| Thin, widely tracked geometric sans caps (SAVE THE DATE, FORMAL ATTIRE) | Quiet voice next to the loud name. Air between letters reads as time and room. | Earned, but the card's weight is too thin for guests up to 60. | Same Futura-like voice (Jost) at weight 400 and 14 px, never thinner. |
| Italic serif secondary lines | A softer second voice from the same Didone family. | Earned. | The tagline and "turns 30" in Bodoni Moda italic. |
| Double hairline frame | Gives the card a mat and a margin, like a printed card. | Common but works. | Kept, with the two lines in two colours (L1: crimson and warm grey; L3: champagne and crimson), or one crimson pair with pitch corner arcs (L2). |
| Deco sunburst with a small crown emblem | Symmetry and a focal point above the name. | The sunburst is the median art-deco template look. The crown is the card's own. | A football-derived sunburst that is not a crest: pitch centre circle on the halfway line with floodlight rays (L1), floodlight rays only (L3), a centre-circle roundel (L2). No crown, no club, no stadium. |
| Boxed SATURDAY \| 20 \| FEBRUARY 2027 lockup with a double border | Turns the date into an object. The big numeral is the one loud thing after the name. | Earned. This is the best move on the card. | MONDAY \| 21 \| DECEMBER 2026 in the same box, with the numeral in crimson (L1, L3) or crimson on ivory (L2). |
| Diamond bullets, strict symmetry, generous black space | Ceremony, calm, nothing competing. | Diamonds are median. Symmetry and space are earned. | Crimson diamonds flank "Venue TBA". Symmetry kept. The reply buttons stay pinned to the thumb zone at the foot, which a print card never needs. |
| Closing italic line with the dress code | A human instruction at the end. | Earned, but it is new copy. | Not in the main plates. See the new-words list. |

What our version adds that a printed card cannot do:
- A signature motion that is off under reduced motion (below).
- A link preview in the same language, so the card arrives as a card in WhatsApp.
- A reply that works with one thumb, with 48 px or larger targets.

### 2. The three directions

Common to all three:
- Facts recomposed from existing copy only: the title, "Monday 21 December 2026", "Venue TBA", "Makes", the tagline, "You've been called up", "Your reply", "Play the match", "Just reply". The WHO / WHAT / WHEN / WHERE table becomes a centred composition: name, date lockup, tagline, diamond-bulleted venue. The "Host: Makes" row on the form pages is folded into the name, so the form header no longer carries a separate Host line. Say if the owner wants it back.
- `<h1>` text stays "Makes turns 30": "Makes" is set in caps by CSS, and "turns 30" is its own italic span.
- Form labels and the privacy notice are verbatim from the A4 plates (no wording change, no `NOTICE_VERSION` bump).
- Type: Bodoni Moda (name, numeral, italics), Jost (tracked caps), Inter Tight (body, forms, buttons; already loaded). Body 17 px. Tracked caps 14 px at weight 400. Form labels, help text and the notice raised to 16 px (the A4 plates had 15, 14 and 14). Tap targets 52 to 56 px.
- No `style` attributes in the mock-up, no inline `<style>`, so the CSP `style-src 'self'` is not touched. SVG ornaments use presentation attributes and classes only.
- Fonts (self-hosted woff2, SIL OFL 1.1, from the Fontsource latin subsets, OFL texts alongside in `plates/v2/src/fonts/`):

| File | Bytes |
|---|---|
| `bodoni-moda-latin-500-normal.woff2` | 15,020 |
| `bodoni-moda-latin-400-italic.woff2` | 16,552 |
| `jost-latin-400-normal.woff2` | 9,404 |
| Total new | 40,976 |

Against the 160,000 B entry budget (21,172 B today; fonts are not counted by `check-entry-budget.mjs`): 21,172 + 40,976 = 62,148 B if counted. A used 47,320 B of new fonts. Bodoni Moda was kept as the static cut: at 78 px the hairlines look sharp enough, so the variable file with an optical-size axis is not needed.

### L1: Black, ivory and crimson

![L1, invitation](plates/v2/L1-invitation.png) ![L1, Yes](plates/v2/L1-form-yes.png) ![L1, Can't make it](plates/v2/L1-form-decline.png) ![L1, confirmation](plates/v2/L1-confirm.png) ![L1, link preview](plates/v2/L1-og.png)

- Ground `#0B0B0B` (equal R, G, B, so no purple or blue cast), ivory `#F2EDE2`, one crimson accent `#C8102E`, and a warm grey `#6B675F` for the inner frame line and rules.
- The name is flat ivory `#E4DECF` with one narrow pearl band `#FFFFFF`. The still frame shows the band resting over the "M".
- Crimson is used for: the outer frame hairline, the sunburst arc and rays, the "21" numeral, the diamond bullets, and the notice marker. It is never used as text below 3:1, as a button fill, or as the edge of a control.
- Buttons: outlined in warm grey (5.37:1) with ivory text. Continue is a solid ivory button with black text. Selected answers get a 2 px ivory border, a slightly lighter fill and a check mark.
- **What beats the card:** the card's gold gradient is the template median. L1 uses flat ink and a moving sheen, and the one colour it keeps from the owner's theme (crimson) carries the date numeral, so the date is the loud thing in his own red. Nothing is gold, so nothing leaves his red, black and white.
- **Signature (motion):** on load the crimson arc draws itself (1.8 s) while the thirteen rays draw outward from the centre, one after another (about 50 ms apart); the ivory centre circle and the halfway line draw at the same time; the centre spot fades in at 1.5 s. After a 1.9 s pause one pearl band crosses the name from left to right over 3.4 s, once. Nothing loops. The finished picture is the default state; all animation sits inside `@media (prefers-reduced-motion: no-preference)`.
- **Link preview:** `L1-og.png`, 1200 x 630, same frame, sunburst, name, date box and "Venue TBA". The content sits in the central 630 px square, so a square crop in WhatsApp keeps the name and the date.

### L2: Ivory and crimson

![L2, invitation](plates/v2/L2-invitation.png) ![L2, Yes](plates/v2/L2-form-yes.png) ![L2, Can't make it](plates/v2/L2-form-decline.png) ![L2, confirmation](plates/v2/L2-confirm.png) ![L2, link preview](plates/v2/L2-og.png)

- Ground `#F5F0E4`, ink `#1F1A17`, crimson `#98002E`, a double crimson frame with four quarter-circle corner arcs (pitch corner arcs), and ink buttons.
- The name is flat crimson Didone caps (7.78:1). Crimson is legible on ivory, so it carries type here.
- Buttons are ink with white text (17.24:1), the "something" the owner liked in C. Selected answers: crimson border, pale rose fill, check mark.
- **What beats the card:** the card is a dark card with a gold hairline; L2 is the one that does not look like a Canva dark template at all. It reads as printed engraved paper in his red, with two football cues that are not crests (the centre-circle roundel and the corner arcs).
- **Signature (motion):** the four corner arcs draw in from the frame corners over 1 s, then the roundel (circle, halfway line, centre spot) draws at 0.5 s. No sheen: crimson on ivory is flat ink, and a sheen would lighten the red toward the ground and lose contrast.
- **Link preview:** `L2-og.png`, same language.
- Two caveats, stated plainly:
  1. `feedback.md` records the owner overriding a paper palette (`#F3EDE1`, `#1B1A17`, `#B3261E`) as "still being safe". L2 is paper, so it is the direction most exposed to that verdict.
  2. His benchmark is black. L2 keeps the light-page, dark-game mismatch that A has (the post-game confirmation is dark until Tier B).

### L3: Black, champagne and crimson

![L3, invitation](plates/v2/L3-invitation.png) ![L3, Yes](plates/v2/L3-form-yes.png) ![L3, Can't make it](plates/v2/L3-form-decline.png) ![L3, confirmation](plates/v2/L3-confirm.png) ![L3, link preview](plates/v2/L3-og.png)

Gold is outside his red, black and white theme. The benchmark card is black and gold, so this is a real contender and not a footnote, but it is his call, and he should decide from the picture.

- Ground `#0B0B0B`, champagne `#D4AF7A` as the metal (name, caps, outer frame, buttons, selected borders), ivory for body text, crimson `#C8102E` as the single accent (inner frame line, "21", diamonds, the origin diamond in the sunburst).
- The name is flat champagne `#D4AF7A` with one narrow `#F4E3BE` band, not a gradient.
- Continue and "View your poster" are solid champagne with black text (9.57:1).
- **What beats the card:** the card's frame, sunburst and gradient are all one gold. L3 splits the frame into two metals (champagne outside, crimson inside), makes the date numeral crimson so the red from his theme is the loud thing, replaces the closed crown-and-arc sunburst with rays only, which is a floodlight rig, and swaps the gradient for a moving sheen. It is the closest to the card, so it is also the one most at risk of reading as a template.
- **Signature (motion):** seventeen floodlight rays switch on from the centre outward (the middle ray first, 110 ms between pairs), each with a brief flicker (full, dip to 55%, full) over 0.7 s, then one champagne sheen crosses the name once. Reduced motion shows the rays already lit and the band at rest.
- **Link preview:** `L3-og.png`.

### Computed WCAG ratios (script `scratchpad/ratL.mjs`, WCAG relative-luminance formula)

Every text pair clears 4.5:1, large text clears 3:1, and every control edge, selected border, button and focus ring clears 3:1. Gradient and sheen text uses its worst stop (the darkest stop on black; the lightest on ivory; L2 is flat, so one stop).

| Pair | L1 | L2 | L3 |
|---|---|---|---|
| Body text on ground | 16.86 | 15.16 | 16.86 |
| Tracked caps on ground | 13.20 | 10.88 | 11.35 |
| Muted text (notice, help) on ground | 9.86 | 6.83 | 9.31 |
| Name, worst stop on ground | 14.67 (`#E4DECF`) | 7.78 | 9.57 (`#D4AF7A`) |
| Name, highlight stop | 19.68 | n/a | 15.54 |
| "21" numeral (64 px, large text, 3:1) | 3.35 | 7.78 | 3.35 |
| Body on field | 15.64 | 17.09 | 15.64 |
| Placeholder on field | 6.07 | 5.64 | 6.07 |
| Body on selected fill | 13.96 | 13.84 | 14.67 |
| Muted on selected fill | 8.17 | 6.23 | 8.11 |
| Button text on button fill | 16.86 | 17.24 | 9.57 |
| Button fill against ground (3:1) | 16.86 | 15.16 | 9.57 |
| Link on ground | 16.86 | 7.78 | 12.09 |
| Control border on field (3:1) | 4.99 | 4.86 | 4.99 |
| Selected border on ground (3:1) | 16.86 | 7.78 | 9.57 |
| Capsule edge on ground (3:1) | 5.37 | 15.16 | 9.57 |
| Focus ring on ground (3:1) | 16.86 | 15.16 | 16.86 |
| Error text on field (existing `#FF9E8F`; L2 ink with icon) | 9.16 | 17.09 | 9.16 |
| Frame and date-box hairlines (decorative) | 3.35 / 3.50 | 7.78 | 9.57 / 3.35 |

Crimson on black, as you computed: `#98002E` is 2.06:1 and fails as text, so no direction uses it on black. `#C8102E` is 3.35:1 on `#0B0B0B` (3.3 on `#0D0D0D`): used only for the 64 px numeral (large text), diamonds and hairlines. Nowhere does crimson on black carry body or small text, the edge of a control, a selected border, an error or a focus ring.

### What failed or came close on the legibility floor, and how it was resolved

- The A4 plates' own sizes were below the new floor (labels 15 px, seat line 15 px, help 14 px, notice 14 px). All raised to 16 px here. Cost: the Yes form is about 1,980 px tall (A4: about 1,900), the Can't-make-it form about 1,590 px.
- Crimson `#98002E` on black at 2.06:1 fails as text and as a 3:1 edge. Resolved by switching to `#C8102E` for the one large numeral and for decoration, and by giving every control an ivory, warm-grey or champagne edge.
- The Didone italic tagline is 21 px at weight 400. Bodoni's hairlines are thin there. The ratios pass and it renders crisply at 2x, but I have not seen it on a low-density phone. If it looks thin on a real handset, Playfair Display 400 italic (21,884 B) has heavier hairlines; replace Bodoni's italic with it (about +5 KB).
- Tracked caps are 14 px at weight 400 (floor 13 px, 400). The card's own caps are lighter than 400 and are not copied.
- Inline "Full notice" link: an in-sentence link, so it is exempt from the 48 px target under WCAG 2.5.8; the notice summary row, Continue and every answer row are 52 px or taller.
- Nothing is left failing.

### Token deltas (scoped to `#inv`, `#fb` and `/privacy/`; the game's `THEME` is untouched)

| Token | Now | L1 | L2 | L3 |
|---|---|---|---|---|
| ground | `#0E0B13` | `#0B0B0B` | `#F5F0E4` | `#0B0B0B` |
| text / muted | `#F4F1EA` / `#B8B3A9` | `#F2EDE2` / `#BDB7AB` | `#1F1A17` / `#5A5148` | `#F2EDE2` / `#C4B08C` |
| caps colour (new) | n/a | `#D9D3C6` | `#3B332D` | `#D8C29B` |
| accent (large numeral, hairline, motif) | `#D9505C` | `#C8102E` | `#98002E` | `#C8102E` |
| metal / name (new) | n/a | `#E4DECF` with `#FFFFFF` band | `#98002E` | `#D4AF7A` with `#F4E3BE` band |
| field / selected fill | `rgba(0,0,0,.28)` / `#2F2740` | `#151515` / `#202020` | `#FFFEFB` / `#F3E3DF` | `#151515` / `#1F1B15` |
| control border | `#8E8A83` | `#8B857A` | `#7A6F64` | `#8B857A` |
| selected border | `#F4F1EA` | `#F2EDE2` | `#98002E` | `#D4AF7A` |
| primary button | `#8A1F2D` fill | `#F2EDE2` fill, black text | `#1F1A17` fill, white text | `#D4AF7A` fill, black text |
| frame lines (new) | n/a | `#C8102E` + `#6B675F` | `#98002E` x2 | `#D4AF7A` + `#C8102E` |
| display / caps faces (new) | Inter Tight | Bodoni Moda / Jost | Bodoni Moda / Jost | Bodoni Moda / Jost |
| radius | 8 | 2 | 2 | 2 |
| label, help, notice size | 15 / 12 / 12 | 16 / 16 / 16 | 16 / 16 / 16 | 16 / 16 / 16 |

New contract entries for any pick: a `display` family (Bodoni Moda), a `caps` family (Jost), a `metal` token, a `caps` colour token, and a `motif` asset (an SVG with classes). The blue `accentAway` stripes stay removed. The existing claret `primary` is not used on these three pages.

### Words that are not in the app today, for the owner's sign-off

None of these is baked into the 15 main plates. They are shown only in `plates/v2/L1-invitation-alt.png`.

1. **"Save the date"** as the kicker, replacing "You've been called up". It names what the card is, but the link is an invitation to reply, not only a save-the-date.
2. **"Formal attire"** as the closing tracked line. It tells guests to dress up, which the owner has not said.
3. **The football tagline:** keep "Thirty feels like half time. Come for the oranges." (the main plates) or drop it. The alt plate shows it cut to "Come for the oranges." only, which is a word change too. Dropping it entirely makes the card a closer match to his reference and costs the one funny line.
4. Dropping the form's separate "Host: Makes" line, because the name is the host (see above).

Not new and unchanged: the privacy notice text and every form label.

### Effort against the A4 Tier A estimate (about 17 h)

These are my estimates, not measured. They are for L1; the other two are adjustments.

| Item | L1 hours | Note |
|---|---|---|
| Scoped tokens | 1 | The page is already dark, so a neutral black and new text colours, no light theme to build |
| Self-host 3 fonts plus OFL, `font-display`, fallback metrics | 1.5 | A4: 1 h for two files |
| Invitation: frame, SVG sunburst, date lockup, sheen, buttons | 4 | A4: 2.5 to 3.5 h |
| "Just reply" page: header recomposition, form restyle, raised sizes | 3.5 | A4: 3 h; the 16 px floor makes the form longer |
| Collapsed notice styling | 0.5 | Same as A; still after the other agent's `fallback.js` fix |
| Cards that share `#fb` (confirmation, code, decline, closed, errors) | 2.5 | Same |
| Page edges: `html` background, `theme-color`, favicon, `og.jpg` redrawn from the plate | 2.5 | A4: 2 h |
| `/privacy/` | 0.5 | Same |
| Motion (draw, sheen, reduced-motion guard) | 1.5 | New in this round |
| Verify, ratios from built CSS, design-review | 3 | Same |
| Total | about 20.5 | About 3.5 h more than A4 |

- L3 is about 21 h (the staggered ray flicker and a second metal in the frame, about +0.5 h).
- L2 is about 19.5 h. It keeps the light-page build and does not need the sheen, but it still has the corner arcs and the roundel draw.
- Tier B is smaller for L1 and L3 than for A4 by about 5 h: there is no paper-to-ink cross-fade (2 h) and no need to rebuild the confirmation card to match a light page (3 h), because the pages and the game are both dark. L2 keeps that Tier B work.
- A Wednesday 18 November send is about two and a half working days. At 20 h it is tight for one person. The cut line is: invitation, the og image, theme colours and fonts first; the motion, the code and decline cards and `/privacy/` can follow. A fully static version of the signatures costs about 1.5 h less.

### Lux commits (consultation, `lux/SKILL.md`)

- Commits: inevitability through restraint (centred, symmetric, a single accent); time visible in detail (every state drawn, including the Can't-make-it form); specificity (the pitch geometry is this party's, not a template's); quiet by default, voice when chosen (one numeral, one motion); multi-sensory is not committed.
- Not committing to: material truth (no foil texture; a sheen is light, not a fake material), patina-aware, and multi-sensory (no sound or haptics on a party RSVP).

### Pick: L1, with L3 as the one to put in front of him if gold is acceptable

- L1 keeps his red, black and white and beats the card with flat ink plus a moving sheen, a red date numeral and pitch geometry in place of a crown. It also removes the dark-to-light jump into the game, which A and L2 have.
- L3 is the closest to what he is asking for and, honestly, the most likely to make him say yes to "the level of luxury", because the benchmark is gold. But the gold is outside his stated theme and his closest-to-template look. If he looks at L1 and L3 side by side and picks L3, nothing else in the plan changes.
- L2 is least exposed to a dark game, most exposed to "safe", and I would not lead with it.
- Which to ask him: show L1 and L3 invitations and og images side by side, and ask if gold is acceptable. If yes, L3; if no, L1.
