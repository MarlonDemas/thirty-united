---
name: direction-review
surface: invitation, reply form, game HUD and scene, saved poster, og.jpg
date: 2026-11-16
author: Pixel
status: PROPOSAL ONLY. Nothing in src/, public/, convex/ or the existing contract files was changed. The owner approves before anything is implemented.
trigger: owner feedback, "the colours are too aggressive; make the UI/UX a little more minimalist and premium looking, bearing in mind the age group is 18 to 60"
deadline: guests get the link on Wed 18 Nov 2026
build: branch feat/world-front-end at 03ffcd4, preview https://deploy-preview-7--thirty-united.netlify.app
read in full: references/contract-schema.md, references/design-token-patterns.md, specno-writing.md (applied to prose only), direction-plain-invitation.md, tokens.md, brand.md, components.md, feedback.md, DESIGN.md, contract.yml, audits/plain-invitation-design-review-2026-11-12.md, src/matchday/config.js, world.css, invite.js. Skimmed by search or first lines only: direction.md (colour, palette and Direction D lines), lux-notes/invite-journey-2026-10-16.md (first 40 lines), docs/matchday-brief.md (search for kit, colour, confetti, bloom and the premium-pass line)
note: other edits appeared in the working tree during this review (src/matchday/codecard.js, e2e/world-decline.spec.ts, .gitignore, docs/privacy-notice-draft.md). They are not Pixel's and are not part of this proposal
---

# Direction review, 2026-11-16: calmer colour, quieter UI

Evidence labels used below: **[live]** seen on the preview in a 390 x 844 touch viewport today; **[capture]** seen in `.specno-design/captures/plain-invitation-2026-11-12/`; **[source]** read from code only; **[mock]** rendered today by injecting the proposed values into the live preview (scratch only, nothing saved in the repo). The game was seen once, as one software-GL frame of the entrance plaza [live]. The reply form could not be opened live because replies are closed on the preview, so every form claim is [capture] or [source].

## Summary

1. The aggression is one hue family used at full strength: kit red `#9F0B19` as two large capsule halves, a brighter red `#F81E24` as side stripes, beacon and stamp, and a saturated periwinkle `#B7D3FA` as the outline, kicker and muted text colour. Pure white `#FFFFFF` on near-black (19.52:1) adds glare. Red plus periwinkle plus cream on a violet-black is four colour families on one screen.
2. A calmer palette is mostly a `config.js` plus `world.css` change (about 25 values on the UI layer). The scene does not need recolouring for Wednesday; roughly ten loud accents in it do.
3. Proposed Tier A palette: claret `#8A1F2D` for the one action colour, chalk `#F4F1EA` for text, stone `#B8B3A9` for muted text and edges, rose `#D9505C` for the few scene accents. Every pair is measured; the table is in section 4 and the diff is in section 6.
4. One finding is bigger than the colour brief. On the as-built invitation the capsule falls below the fold at 360 x 780, 375 x 667 and 360 x 640 [live, measured], so the main action is hidden on common Android phones. The fix is one CSS line (A4) and it also settles open call 1.
5. The contract is stale against the build in ways that matter here (section 6, "Contract decisions this diff overrides").

**Decisions needed from the owner** (details in the sections named):

| # | Decision | Recommendation |
|---|---|---|
| D1 | Palette: claret + chalk + stone (section 6) | Approve |
| D2 | Capsule: (a) filled claret with a stone hairline, (b) outline only with no fill, or (c) chalk fill with ink text. `docs/matchday-brief.md:86` records an earlier "premium pass (v4)" with a light, fog-fill primary and red only as the 3 px home rule; the red button first appears in `9e4bf61` (2026-11-03), the commit that also added the brief. Option (c) is therefore a return to a decision the owner already made once | (a), because it keeps a clear action for the 50+ end and keeps the brand red. (c) is the quietest filled option and is measured in section 4; it makes two cream blocks (card and capsule) sit one above the other |
| D3 | Phone first screen (section 5a) | Correct the direction sentence, and change the CSS to match it |
| D4 | "Check my answers" focus (section 5b) | First invalid field when there are errors, heading when there are none |
| D5 | `hero` token (section 5c) | Record `hero` and a new `hero-wide` in `tokens.md` |
| D6 | Wider type bump on in-game cards (A6) | Only after a phone pass; not required for Wednesday |
| D7 | `og.jpg` date-line colour and a re-render before the link goes out (A8) | Approve; this one cannot wait |
| D8 | Finale and scene accents recoloured to the palette, and the yellow keeper and flags to stone (A7). `feedback.md:91` ("go all out"), `:112` and `:119` (the world is loud by design, the brand speaks at full voice at the finale) are hard constraints by `feedback.md:12`. This proposal does not override them without the owner saying so | Owner to decide. Recommendation: recolour the neon green and the blue (the two outside the palette), keep fireworks and confetti, leave the keeper yellow if he reads as a goalkeeper to non-fans |

---

## 1. Diagnosis: where the aggression comes from

Chroma is OKLCH C (0 is grey; UI colours usually sit below about 0.15). Ratios are WCAG 2.x.

| # | Surface | What reads aggressive | Values | Evidence |
|---|---|---|---|---|
| 1 | Invitation capsule | The largest saturated area on the first screen: two 169 x 56 solid red halves, pill-shaped, in a 2 px pale-blue ring. Red against periwinkle is the loudest pairing in the product, and both halves carry the same weight so nothing is calm | fill `#9F0B19` (C 0.175), ring `#B7D3FA` 2px (`world.css:207-210`) | [live] 390 x 844 |
| 2 | Invitation title and date line | Pure white at weight 800 with -0.02em tracking on near-black is the maximum possible contrast (19.52:1), which halates for older eyes. The date line is 11 px caps at 600 in periwinkle, so the smallest text is also the most coloured | `#FFFFFF` on `#0E0B13`; `world.css:196-197` | [live] |
| 3 | Invitation card | A cream slab (`#EFE9DB`, 14.8:1) is the brightest large area. Its row rules are dark (`#8A8576`, 3.05:1) and its labels are a cool blue-grey (`#4A4F5C`) on warm cream, a third temperature | `world.css:198-203`, `config.js:37` | [live] |
| 4 | Reply form and closed card | A 3 px kit-red left rule on the whole card, 3 px bright-red `#F81E24` stripes on the Yes and Not sure choices, a periwinkle stripe on Can't make it, and a red Continue with a 2 px periwinkle ring. Four reds and blues stacked in one 390 px column. The 11 px privacy notice in periwinkle is also the densest text on the page | `world.css:47-48, 53, 63-64, 126, 156`; `--accent` = `EVENT.kits.homeLight` `#F81E24` (C 0.243) | [capture] `failure-no-webgl2-390.png`, [live] closed card |
| 5 | Game HUD | Not the problem. Chips and the card are dark ink glass with white text. One soft drop shadow (`world.css:19`) and blur that the contract forbids but that reads fine | `world.css:19` | [live] game frame |
| 6 | 3D scene | The world is mostly grey concrete and muted brick, so the loud parts are the hot accents: the additive red beacon column (accent emissive 2.2, plus selective bloom 0.55), full-saturation red LED boards, yellow corner flags and a yellow goalkeeper, and the finale fireworks and confetti (red, yellow, blue, neon green). Station-complete lights go neon green. The scene is also lit as a warm dusk (sun `0xffcf9a` at 2.4, horizon fog `#d98a5f`) while the contract describes a moonlit night, so warm light and cold UI sit side by side | `fx.js:8-9`, `flow.js:126`, `pitch.js:174,181,194`, `people.js:59`, `stations.js:52,81-82`, `config.js:57-58`, `scene.js:70,94,121` | [live] one frame (beacon, banners, red kit seen); the rest [source] |
| 7 | Saved poster and stamp | Stamp fill and the "UNITED" lockup use `#F81E24`, the loudest red in the product (C 0.243, 4.84:1 on ink) | `src/poster/layout.ts:9`, `src/world/layers/united.svg`, `compositor.ts:231` | [source] |
| 8 | `og.jpg` (what WhatsApp shows before the page opens) | A fully saturated red tee on a night photo, a blown-out blue-white moon, a bright white wide-tracked "THIRTY" and a `#F81E24` date line. This is the first impression, before anyone taps | `public/og.jpg`, `src/poster/og.ts:55` | [live] viewed `public/og.jpg` |
| 9 | Browser tab | The favicon is the Vite starter logo in purple `#863bff`, a colour that appears nowhere else | `public/favicon.svg:1` | [source] |

Not aggressive, and kept: the dark ink surfaces (`#0E0B13`, `#18131F`, `#241D2E`), the status colours, the cream card as an idea, the layout, the type family (Inter Tight).

## 2. Colour inventory: every colour set outside `tokens.md`

`tokens.md` uses contract names (`panel`, `moonlight`, `shirt-red`, Barlow Condensed). The code uses other names (`ink-900`, `fog-300`, `primary`, Inter Tight). The hex values for the shared tokens match; the `paper-*` set, `ink-700`, `ruleHairline`, `scoreboard*`, `focus*`, `sky` and the kit set are in code only.

| Group | Where | What is set | Palette-change weight |
|---|---|---|---|
| Kit colours | `config.js:20` | `home #9F0B19`, `homeDark #850914`, `homeLight #F81E24`, `away #18131F`, `awayLight #B7D3FA`, `awayTint #241D2E`. `KIT_HEX` (`config.js:27`) feeds the scene. About 50 lines in 14 files read `KIT_HEX`, `THEME.color` or `EVENT.kits` (for example crowd `crowd.js:55`, avatar `avatar.js:62`, teammates `teammates.js:14`, LED board `pitch.js:174`, scoreboard bars `stadium.js:358`, station boards `stations.js:51-56`, beacons `stations.js:81-82`) | One edit recolours all of them. This is the lever |
| THEME colours | `config.js:34-45` | ink, fog, paper, danger/success/warning, primary set, surface, text, rules, focus, scoreboard, accent | About 25 values; the UI layer's whole palette |
| THEME scene | `config.js:57-58` | sky `#1a2140 / #4a3a55 / #d98a5f`, bloom 0.55, AGX tone mapping | Tier B (changes the look of the whole world) |
| CSS fallbacks | `world.css:4-12` | A second copy of every token. `#boot` and the first paint use it before `config.js` runs, so a change in `config.js` alone flashes the old colours on load. It already differs from `config.js` in six places: `--primary-hover #850914` (config `#B3101F`), `--primary-pressed #6E0710` (config `#850914`), `--rule-control #6B7487` (config `#8A8FB0`), `--rule-hairline rgba(242,244,248,.14)` (config `rgba(183,211,250,.22)`), `--focus-outer #F2F4F8` (config `#FFFFFF`), `--focus-inner #0B0D12` (config `#0E0B13`) | Must be edited with `config.js` (A1) |
| CSS raw values | `world.css:19` (shadow rgba(0,0,0,.28)), `:36,45` (input and option fill rgba(0,0,0,.28)), `:53,208` (`#fff` labels), `:81-82` (stick white), `:87,90` (`#000` letterbox and dip), `:92`, `:182-188` (poster dialog) | 14 lines | Only `#fff` at `:53,208` changes in Tier A |
| Scene materials, raw hex (visible) | `plaza.js:16` (brick palette `#8c3d2b` ...), `:15` mortar, `stadium.js:24-29,84,93,268-284,308`, `pitch.js:72,114,131,193-194`, `people.js:59,159`, `crowd.js:49-58`, `shirt.js:44-52`, `scene.js:91,94`, `teammates.js:15-16`, `avatar.js:63` | About 110 lines with a raw literal in 14 files (excluding `config.js` and `world.css`). Mostly neutral: concrete, steel, skin, hair, brick. Loud ones: `pitch.js:194` yellow flags `0xffd23a`, `people.js:59` yellow keeper `0xe8c400`, `flow.js:126` neon green `0x22ff66` | Ten lines matter (A7); the rest is neutral and stays |
| Scene data textures (not visible colour) | `pitch.js:13-19` (R = mown-stripe brightness, G = line mask), `ticket.js:44-56` (roughness, metalness, height maps), `plaza.js:13` (brick height map) | `rgb(190,0,0)`, `rgb(200,255,0)`, `rgb(0,90,77)`, `#000` fills | Ignore. These are channels, not paint |
| Canvas textures with visible text | `stations.js:51-56` (ink900 band, accent header, `#fff`, fog100, fog300 text), `pitch.js:174-181` (LED fill = kit home, `#fff` text, emissive 1.15), `stadium.js:274,318,358` (sign, `LED_BG #05070a`, accent bars), `plaza.js:178-180`, `ticket.js:10,30` | Read the kit and THEME tokens, so they follow A1. Literal `#fff` stays | Follows A1 |
| Effects | `fx.js:8-9,21,48` burst `[0xff3b30, 0xffd23a, 0xfff4e0, 0x4aa8ff, 0x57ff9a]`, confetti `[home, 0xf4f4f0, 0xffd23a, away, 0xff7a45, 0x57d68d]` | Finale only | A7 |
| Poster | `src/poster/layout.ts:9` `INK {text #FFFFFF, moonlight #B7D3FA, panel #18131F, posterRed #F81E24}`, `:27-29` line colours, `:88` stamp shadow; `compositor.ts:155,183,231,252,265`; `scene.ts:12-14` (moon `#E8F5FD`, halo `#B7D3FA`, floodlight `#F1C7A0`), `:78-80` (`#2B3142`), `:104-105`; `src/world/lettering.ts:5` `#FFFFFF`; `src/world/layers/united.svg` fill `#F81E24`, `thirty.svg` `#FFFFFF` | Two constants and one SVG fill carry the red | A8 |
| og.jpg | `public/og.jpg`, rendered by `scripts/render-og.mjs` through `src/poster/og.ts` (`:55` date line `INK.posterRed`) | Text colour is code. The red tee and moon are photo plates (`src/world/layers/*.webp`) | A8 for the text; the photo is Tier B |
| Static assets | `public/favicon.svg:1` (`#863bff`), `index.html` (no inline colour, no `theme-color` meta) | | A9 |
| Plates | `src/world/layers/l1..l8*.webp` | Photographic. Not token-controlled | Out of scope |

**How big is a palette change?** For the UI layer, a day's work at most and one place per value: `config.js` plus its `world.css:4-12` mirror. The kit change reaches the scene for free. The scene's other raw literals are neutral materials and do not need touching. The poster and `og.jpg` need two constants, one SVG fill and a re-render. Re-grading the photo plates and the scene's lighting is the part that is genuinely large (Tier B).

Tests do not pin colours. The only colour assertion is `src/poster/layout.test.ts:38` (`INK.panel === "#18131F"`, which this proposal keeps). `e2e/world-invite.spec.ts` pins structure: both halves 56 px tall and equal (`:24-25, 117`), equal focus ring on both halves (`:101-109`), a 1 px divider border on the right half and 1 px top border when stacked (`:110, 116, 144`). The capsule edits below keep all of those, so they need no test changes. No test asserts focus after "Check my answers" (section 5b).

## 3. Two tiers

Effort: S under 1 hour, M up to half a day, L a day or more. Owner of the files is whoever holds `src/matchday` (nova's lane for the CSS and JS); the contract files are Pixel's via `/specno-design:design-system`.

### Tier A: fits before Wednesday

Order matters. A1 to A5, A8 and A9 are the cut line; A6 and A7 are optional extras if time and a phone pass allow.

| # | Change | Files | Effort | Notes |
|---|---|---|---|---|
| A1 | Palette tokens (section 6, table 1): text, muted text, edges, primary set, accent, kit, focus, paper, scoreboard text | `config.js:20,34-45`, mirrored in `world.css:4-12` (which also fixes the six drift items) | S | Edit both blocks in one commit. `#boot` and the first paint read the CSS copy |
| A2 | Quieter capsule and buttons: outer ring 2 px to 1 px in stone, divider stays a real 1 px border in stone, label colour from `#fff` to `var(--text)`, `.btn` ring 2 px to 1 px | `world.css:53, 207-210, 219, 221` | S | Keeps every e2e assertion above. Hover and pressed come from A1 |
| A3 | Invitation type: `hero` 34/38 at 700 (was 32/34 at 800), new `hero-wide` 44/48 at 700 (so 44/46 stops being a raw value, section 5c), `caption` 12 px (date line and kicker read it; tracking .14em to .12em, a raw CSS value as today), new scoped tokens `card-label` 14/20/500 and `card-value` 16/22/600 read only by `.inv-card`, card rules `#CBC3AE` | `config.js:48`, `world.css:11,195-205,215` | S | The rendered mock looked right at 390 wide. The two card tokens exist so the card can be readable without waiting for A6; if A6 lands they merge into `bodySm` and `label`. Re-run the 320, 360 and 200% text checks from the 2026-11-12 review |
| A4 | First-screen height so the capsule stays on screen: `.inv-hero{min-height:clamp(180px, calc(100svh - 420px), 56svh)}` | `world.css:195` (the 1024 rule at `:216` stays) | S | Measured today, section 5a. Fixes the hidden action on 360 x 780, 375 x 667 and 360 x 640 |
| A5 | Tap targets to 48 px on form controls: inputs, `.opt`, `.btn`, `.choice` minimum height; the challenge chip's Skip from 36 to 44 | `world.css:36,45,53,60,115` | S | Needs one phone pass on the fast form and the station cards (taller controls) |
| A6 | Wider type bump: `bodySm` 13 to 14, `label` 15 to 16, `body` 15 to 16 line 24, `display` weight 800 to 700, `caption` 11 to 12 | `config.js:48` | M | **Not applied until a phone pass.** It changes every in-game card (`#card.under` is capped at 56svh, the compact fast form scrolls inside itself). The invitation and caption sizes in A3 are the default; this goes further. Skip if there is no time |
| A7 | **Owner decision D8 first.** Scene accents: finale colours to the palette (burst `[0xD9505C, 0xF4F1EA, 0xB8B3A9, 0xB7D3FA]`, confetti `[home, chalk, stone, away]`), station-complete light from `0x22ff66` to `0x8EDDA9`, corner flags and the keeper's shirt from yellow to stone `0xB8B3A9`, bloom 0.55 to 0.40, LED board emissive 1.15 to 0.9 | `fx.js:8-9`, `flow.js:126`, `pitch.js:181,194`, `people.js:59`, `config.js:58` | S each, M together with a phone check of the pitch and finale | Only guests who press Play see these. `docs/matchday-brief.md:80` accepts fireworks and confetti, so they stay, in calmer colours. The keeper is a scene identity decision |
| A8 | Poster and og: `INK.posterRed` and the `united.svg` fill to `#D9505C`; og date line follows through `og.ts:55`; re-render and commit `public/og.jpg` (`npm run og`) | `src/poster/layout.ts:9`, `src/world/layers/united.svg`, `public/og.jpg` | S plus render | **Before the link goes out.** Chat apps cache link previews per URL, so a changed image after the first share will not reach people who already saw the old one. The photo itself (red tee, moon) stays; see B4 |
| A9 | Favicon replaced with a plain mark in the new palette; `<meta name="theme-color" content="#0E0B13">` | `public/favicon.svg`, `index.html` | S | The favicon needs a drawn mark: a stone "30" on ink is enough. Pixel can supply the SVG on approval |
| A10 | Record the result in the contract: `hero` and `hero-wide`, the `paper-*`, `ink-700` and code-name rows, the new palette, and the overridden lines in section 6 | `tokens.md`, `direction-plain-invitation.md:41,52,96`, `feedback.md` (append), DESIGN.md regenerated | M | After approval, through `/specno-design:design-system`. Not blocking Wednesday |
| A11 | "Check my answers" focus (section 5b) | `fallback.js:37`, `ui.js:173` (`fastLaneForm` does not return `setErrors`) | S | Behaviour fix, not palette. Include if D4 is approved |

Suggested order: Monday A1 to A5 and A8, check at 320, 360, 390, 412 and 200% text; Tuesday phone pass on the invitation, form and closed card, then A9, then A6/A7 only if the pass was clean; Wednesday morning freeze, with `og.jpg` already deployed.

Risks for Tier A: (1) `kits.home` moves the red of every shirt, LED board and crowd seat; check HOME and AWAY still read as two teams (section 6 pairs). (2) Two contract sentences are overridden and must be recorded, or the next audit reads them as drift. (3) I measured nothing on a real phone or in WhatsApp's in-app browser.

### Tier B: after launch

| # | Change | Files | Effort |
|---|---|---|---|
| B1 | One source for tokens: generate the `world.css` fallbacks from `THEME` at build, or drop them and inline a tiny boot style. Add a unit test that the two agree | `config.js`, `world.css:4-12`, build script | M |
| B2 | Re-light the scene for one mood: decide dusk or night, then align sky (`config.js:57`), fog (`scene.js:70`), sun (`scene.js:94`), hemisphere (`scene.js:91`), bloom and LED boards to the palette | `config.js`, `scene.js`, `stadium.js`, `pitch.js` | L |
| B3 | Reply form restyle: drop the card's left rule and the stripes (use wording and the selected state), flat surface without shadow or blur (`world.css:19`), 8-point spacing, privacy notice as a short summary with the full text behind a disclosure on every width | `world.css`, `ui.js:157-173` | M |
| B4 | Grade the poster and og photo plates: about 15 percent less saturation on the red tee, a softer moon halo. Needs the owner's eye on likeness and the C2PA originals | `src/poster/og.ts`, `src/poster/scene.ts`, plates | M to L |
| B5 | Title typography: one display face for the title only (a variable serif or a lighter Inter Tight cut). Entry bundle is 20,966 B of 160,000 B, so budget allows one file, but it adds a font licence, a preload and a CSP check | `index.html`, `world.css`, `public/world/fonts` | M |
| B6 | Motion audit in the game: confirm the 3D camera moves honour reduced motion (the UI does, `world.css:174-175`), and count flashes in the finale against WCAG 2.3.1 (not measured in this pass) | `flow.js`, `cine.js`, `fx.js` | M |
| B7 | In-world text sizes: station boards and the ticket text are small on a phone at walking distance (not measured in this pass) | `stations.js:50-56`, `ticket.js` | M |
| B8 | Rebase the contract to the build (Direction D describes a React poster app; the code is the three.js matchday world with pills, Inter Tight and a drop shadow). `DESIGN.md:5` already says it describes the contract, not the build | `tokens.md`, `components.md`, `brand.md`, `direction.md` | L |

## 4. Audience: guests aged 18 to 60

| Check | Today | Proposed | Result |
|---|---|---|---|
| Smallest text | 11 px: date line, kicker, privacy notice, `.choice b`, walk caption (`config.js:48` caption) | 12 px (A3 and A6) | 12 px is the floor for older readers; below that, uppercase tracked text strains |
| Body and labels | body 15, label 15, card labels 13, card values 15 | invitation: labels 14, values 16 (A3). Rest of the game: 16 and 14 after a phone pass (A6) | iOS body is 17, Material 16. 15 sits below both |
| Weight and tracking | title 800 at -0.02em; caps at 600 and .14em | title 700 at -0.015em; date 600 at .12em | Heavy tight type blurs for ageing eyes; lighter and a touch looser is easier |
| Glare | white on near-black, 19.52:1 | chalk on near-black, 17.30:1 | Still far above AA, with less halation |
| Contrast | all text passes AA today | all proposed pairs pass AA; see table below | Two proposed pairs are large-text only and are flagged |
| Tap targets | inputs, options, buttons 44 px; capsule 56 px; Skip chip 36 px (`world.css:36,45,53,115,208`) | 48 px on controls, 44 px on the chip; capsule 56 px | WCAG 2.2 AA asks 24 px, Apple 44, Material 48. 48 suits a thumb on a moving train and an older hand |
| Spacing between targets | 8 to 10 px | unchanged | Fine |
| First action | the capsule is off screen on 360 x 780, 375 x 667, 360 x 640 [live] | on screen from 360 x 640 up (A4) | The one real usability failure in this review |
| Motion | UI motion is one 8 px rise at 200 ms, zeroed under reduced motion (`world.css:174-175`, verified in the 2026-11-12 review). The game's camera, fireworks and the black dip are not audited here | unchanged; B6 audits the game | Nothing in the UI layer needs to change for motion |
| Text size and zoom | reflows at 200%, verified on 2026-11-12 | re-check after A3 and A5 | Part of the Tuesday pass |

**Contrast for every proposed pair** (WCAG 2.x relative luminance, computed 2026-11-16). Required: 4.5 for normal text, 3 for large text and non-text edges.

| Foreground | Background | Ratio | Needs | Used for | Result |
|---|---|---|---|---|---|
| chalk `#F4F1EA` | ink-950 `#0E0B13` | 17.30 | 4.5 | title, text on page | Pass |
| chalk | ink-900 `#18131F` | 16.16 | 4.5 | text on cards | Pass |
| chalk | ink-800 `#241D2E` | 14.43 | 4.5 | ghost hover, raised choice | Pass |
| chalk | ink-700 `#2F2740` | 12.54 | 4.5 | selected option | Pass |
| chalk | claret `#8A1F2D` | 8.04 | 4.5 | capsule and button labels | Pass |
| chalk | claret hover `#9A2536` | 6.92 | 4.5 | hover | Pass |
| chalk | claret pressed `#6A1622` | 10.63 | 4.5 | pressed | Pass |
| white `#FFFFFF` | claret | 9.07 (was 8.28 on `#9F0B19`) | 4.5 | HOME END sign, LED text, shirt canvas | Pass |
| white | claret pressed | 12.00 | 4.5 | pressed, where white is used | Pass |
| ink-950 | chalk fill (option D2c) | 17.30 | 4.5 | capsule label if D2 is (c) | Pass |
| ink-950 | chalk hover `#E4DFD3` | 14.68 | 4.5 | hover under D2 (c) | Pass |
| ink-950 | chalk pressed `#D3CDBF` | 12.32 | 4.5 | pressed under D2 (c); no edge needed | Pass |
| rose `#D9505C` | LED background `#05070A` | 5.04 | 4.5 | scoreboard goal accent | Pass |
| rose | ink-900 | 4.56 | 4.5 | "DONE" text at `stations.js:56` | Pass |
| stone | ink-900 (station text) | 8.73 | 4.5 | `stations.js:56` secondary text | Pass |
| chalk | LED background `#05070A` | 17.88 | 4.5 | scoreboard text | Pass |
| stone `#B8B3A9` | ink-950 | 9.35 | 4.5 | date line, kicker, muted text, capsule edge | Pass |
| stone | ink-900 | 8.73 | 4.5 | helper text on cards, `.btn` edge | Pass |
| stone | ink-800 | 7.80 | 4.5 | toast, muted text on raised | Pass |
| stone | ink-700 | 6.77 | 4.5 | muted text on selected | Pass |
| stone | LED background | 9.66 | 4.5 | scoreboard dim line | Pass |
| stone | claret | 4.35 | 3 (edge) | capsule divider only | Pass as a line. **Not for text** (fails 4.5) |
| stone | claret hover, pressed | 3.74, 5.75 | 3 (edge) | divider in those states | Pass |
| rule `#8E8A83` | ink-950, ink-900 | 5.68, 5.31 | 3 | input and option edges | Pass |
| rule | ink-800 | 4.74 | 3 | `.choice` edge on raised | Pass |
| rule | input fill (about `#110E17`) | 5.56 | 3 | input edge | Pass |
| claret fill (alone) | ink-950, ink-900 | 2.15, 2.01 | 3 (edge) | button boundary | **Fails alone**; carried by the 1 px stone edge (9.35 and 8.73). The edge is required, as the ring was |
| paper-ink `#14171F` | paper-100 `#EFE9DB` | 14.80 | 4.5 | card values (unchanged) | Pass |
| paper-muted `#5B564D` | paper-100 | 6.02 | 4.5 | card labels at 14 px (was 6.77 at 13 px) | Pass |
| paper-rule `#CBC3AE` | paper-100 | 1.45 | none | row rules, decorative; also the 3D ticket rule (`ticket.js:44-48`) | n/a. Rows are separated by 12 px padding and the label column |
| paper-muted, paper-ink | paper-100 (3D ticket) | 6.02, 14.80 | 4.5 | ticket text (`ticket.js:44-48`) | Pass |
| chalk focus ring | ink-950, ink-900, claret | 17.30, 16.16, 8.04 | 3 | focus outline | Pass |
| ink-950 halo | chalk ring | 17.30 | 3 | focus halo | Pass |
| rose `#D9505C` | ink-950, ink-900, ink-800 | 4.88, 4.56, 4.07 | 3 (non-text) | stripes, beacon, og date line (large text) | Pass |
| ink-900 `#18131F` | rose | 4.56 | 4.5 | Yes stamp text (`compositor.ts:231`) | Pass (was 4.52 on `#F81E24`) |
| white `#FFFFFF` | rose | 4.00 | 3 (large) | shirt number, station header at 44 px+ | Large only; in-world art, not DOM text |
| chalk | rose | 3.54 | 3 (large) | not used for normal text | Large only |
| kit home `#8A1F2D` | kit away `#18131F` | 2.01 (was 2.20) | n/a | HOME vs AWAY shirts, LED | Distinguished by hue (OKLCH 19 vs 303), the AWAY trim `#B7D3FA` (5.92 against home) and the signs, not by luminance |
| danger `#FF9E8F`, success `#8EDDA9`, warning `#FFC978` | ink-900 | 9.15, 11.34, 12.05 | 4.5 | status lines (unchanged) | Pass |

## 5. The three open design calls

### 5a. Phone first screen: grow the title area, or correct the direction sentence

**Recommendation: correct the sentence, and change the CSS to match the new one. Do not grow the title area.**

`direction-plain-invitation.md:41` says the first screen at 390 x 844 shows the date line and title "with the top edge of the card peeking in". The build shows the whole card and the whole capsule instead (`audits/plain-invitation-design-review-2026-11-12.md` row 14). Growing the hero to make the card peek would push the capsule below the fold for the people most likely to miss a scroll cue, so the as-built behaviour is closer to right. But 56svh is not right either. Measured today on the preview, as built versus A3 and A4 together (34/38 title, 12 px date line, 14/16 card text, 1 px capsule edge, and `min-height:clamp(180px, calc(100svh - 420px), 56svh)`) [live, injected rules]. The new card is 10 px taller than today's, which is included:

| Viewport | Capsule bottom as built | Visible | Capsule bottom proposed | Visible |
|---|---|---|---|---|
| 320 x 568 (stacked capsule) | 777 | No | 651 | No (accepted, stacked is 116 px tall) |
| 360 x 640 | 721 | No | 591 | Yes, 49 px clear |
| 360 x 780 | 800 | **No** | 731 | Yes |
| 375 x 667 | 737 | No | 618 | Yes |
| 390 x 844 | 836 | Yes, 8 px from the edge | 795 | Yes, 49 px clear |
| 412 x 915, 430 x 932, 768 x 1024 | visible | Yes | same | Yes |

Real browser viewports are shorter than the device (toolbars, WhatsApp's in-app bar), so the margin matters more than the table suggests.

Proposed replacement for `direction-plain-invitation.md:41`: "From 360 x 640 up, the first screen shows the date line, the title, the card and the capsule. Below 360 wide the capsule stacks and may need a scroll. Nothing is fixed or sticky." Effort S (A4).

### 5b. "Check my answers" focus: the heading (as built) or the first invalid field

**Recommendation: focus the first invalid field when the server sent field errors; keep the heading when there are none.**

What happens today:

- **Page form** (`fallback.js:33-42`, `codecard.js:118,130,138`): "Check my answers" calls `onFix(errors)`, which calls `showForm(errors)`. `fastLaneForm` runs `setErrors` (`ui.js:172`), which focuses the first invalid field, but the nodes are not attached yet so that focus does nothing. `fallback.js:37` then focuses the card heading. The heading is the event title ("Makes turns 30"), not anything about checking answers, so a screen reader user hears the wrong cue.
- **Game card** (`flow.js:325-331`, `hud.js:58-66`): the heading is "Check your answers", and `showCard` focuses the first input on pointer devices and the card itself on touch devices (to avoid opening the keyboard over the scene).

Two contract lines pull opposite ways: `feedback.md:38` ("focus goes to the view's h1, not the first input, on every view change") and `DESIGN.md:255` ("focus goes to the first invalid field" after a failed submit). The client-side path already follows the second (`ui.js:81, 88`). Returning to a form with errors is a correction of a form already in use, not a new view, so the second rule is the right one, and the first should say so.

Why not keep the heading: it is the less useful of the two for the person who must now fix a field, it differs from the in-game path, and a sighted keyboard user lands at the top of a long form with no indication of what is wrong. When the error set is empty there is no invalid field, so the heading stays. That now covers two routes: the kill switch (`world-decline.spec.ts:201-220`) and, in the uncommitted edit to `codecard.js:130-132` seen during this review, rate limiting, both of which tell the guest to pick Yes and use email. No test pins either behaviour. Proposed code shape for `fallback.js:37`: after the card is attached, call the form's `setErrors(errors)` again when `errors` has keys, otherwise `focusHead()`. That needs `fastLaneForm` to return `setErrors` (`ui.js:173`). Effort S (A11). Record the carve-out in `feedback.md` when approved.

### 5c. The `hero` type token

**Recommendation: add `hero` and a new `hero-wide` to `tokens.md`, and stop using a raw 44/46.**

`hero` exists in `config.js:48` as `[32, 34, 800]` with CSS variables at `world.css:11`, but `world.css:215` hard-codes `44px / 46px` from 768 px, and `tokens.md` lists neither. That is the drift `references/design-token-patterns.md` warns about (a size invented mid-design). Fix in two parts:

1. Code (A3): `hero: [34, 38, 700]` and `heroWide: [44, 48, 700]` in `THEME.type`, with `world.css:215` reading `var(--fs-hero-wide)` and `var(--lh-hero-wide)`. The values change with the type pass; if the owner rejects A3, record today's values instead (`hero 32/34/800`, `hero-wide 44/46/800`).
2. Contract (A10): add both rows to the `tokens.md` Scale table with the 768 px breakpoint, plus the `paper-*`, `ink-700` and code-name rows the 2026-11-12 review also found missing.

## 6. Proposed token diff, for approval

Names are code names, with the contract name in brackets where one exists. Ratios are on the surface each value lands on (full table in section 4). Nothing here is applied.

### Table 1: colour

| Token | Old | New | Reason | Key ratio (new) |
|---|---|---|---|---|
| `text`, `fog100`, `scoreboardText`, `scoreboardAccent`, `focusOuter` [`text`] | `#FFFFFF` | `#F4F1EA` chalk | Less glare; warm, so it sits with the cream card | 17.30 on ink-950 (was 19.52) |
| `textMuted`, `fog300` [`moonlight`] | `#B7D3FA` | `#B8B3A9` stone | Removes the saturated blue from the UI; used for date line, kicker, helper text, hover edge, capsule edge | 9.35 on ink-950 (was 12.74) |
| `scoreboardDim` | `#B7D3FA` | `#B8B3A9` | Follows `fog300` | 9.66 on LED bg |
| `fog500`, `ruleControl` [`line`] | `#8A8FB0` | `#8E8A83` | Warm neutral edge for inputs and options; same job | 5.31 on ink-900 (was 5.76) |
| `ruleHairline` | `rgba(183,211,250,.22)` | `rgba(244,241,234,.14)` | Same neutral family; decorative | n/a |
| `primary`, `kits.home` [`shirt-red`] | `#9F0B19` | `#8A1F2D` claret | C 0.175 to 0.141, a deeper, calmer red. Stays equal to the kit, as today | chalk 8.04 (was 8.28) |
| `primaryHover` | `#B3101F` (CSS fallback `#850914`) | `#9A2536` | Lighter on hover, as in `config.js` today; fallback drift removed | chalk 6.92 |
| `primaryPressed`, `kits.homeDark` | `#850914` (CSS fallback `#6E0710`) | `#6A1622` | Darker on press | chalk 10.63 |
| `accent`, `kits.homeLight`, `scoreboardAccentGoal`, `INK.posterRed`, `united.svg` fill [`poster-red`] | `#F81E24` | `#D9505C` rose | C 0.243 to 0.172, the loudest value in the product; scene and poster only. Constrained by the stamp: ink-900 text on it must stay at or above 4.5 | 4.56 ink-900 on rose (was 4.52); 4.88 on ink-950 |
| `paperMuted` | `#4A4F5C` | `#5B564D` | Warm label colour on warm paper | 6.02 on paper-100 (was 6.77) |
| `paperRule` | `#8A8576` | `#CBC3AE` | Quieter row rules; decorative | 1.45 (was 3.05, not required) |
| `focusInner` (CSS fallback `#0B0D12`) | `#0E0B13` | unchanged, fallback aligned | Fallback drift only | 17.30 against chalk |
| `ink950`, `ink900`, `ink800`, `ink700`, `paper100`, `paperInk` | unchanged | unchanged | `ink900` is also the AWAY kit (`kits.away`) and `awayTint` is `ink800`; leave the dark family alone | n/a |
| `kits.awayLight`, `accentAway` [`scene-moon-halo`] | `#B7D3FA` | unchanged | Kept on purpose: the cool AWAY trim is what separates AWAY from HOME. This does decouple it from `fog300` | 5.92 against kit home |
| `danger300`, `success300`, `warning300` | unchanged | unchanged | Already pale and measured | 9.15, 11.34, 12.05 |
| Scene sky, sun, hemisphere, `scene.*` | unchanged | unchanged | Tier B (B2) | n/a |

### Table 2: type and shape

| Token | Old | New | Reason | Tier |
|---|---|---|---|---|
| `hero` | `[32, 34, 800]` | `[34, 38, 700]` | Slightly larger, lighter, no longer cramped | A3 |
| `heroWide` (new, from `world.css:215` raw 44/46) | `44px / 46px` raw | `[44, 48, 700]` | Closes the open `hero` call | A3 |
| `caption` | `[11, 16, 600]` | `[12, 16, 600]` | Smallest text; used by kicker, privacy notice | A3 |
| `.inv-date` | 11 px, 600, .14em | 12 px, 600 (caption weight), .12em (raw CSS) | First small line a guest reads | A3 |
| `cardLabel` (new, scoped to `.inv-card dt`) | 13 px | `[14, 20, 500]` | Card is the content of the page; merges into `bodySm` if A6 lands | A3 |
| `cardValue` (new, scoped to `.inv-card dd`) | 15 px | `[16, 22, 600]` | Same; merges into `label` if A6 lands | A3 |
| `display` | `[28, 32, 800]` | `[28, 32, 700]` | Matches the lighter hero | A6 |
| `bodySm` | `[13, 18, 500]` | `[14, 20, 500]` | Helper and error text | A6 |
| `label` | `[15, 20, 600]` | `[16, 22, 600]` | Buttons and field labels | A6 |
| `body` | `[15, 22, 450]` | `[16, 24, 450]` | Card body | A6 |
| Capsule edge | 2 px `fog300` outer ring | 1 px `fog300` (stone) | Quieter; fill alone fails 3:1 so the edge stays | A2 |
| `.btn` edge | 2 px `fog300` | 1 px `fog300` | Same | A2 |
| Control min height | 44 px | 48 px | Thumb size for 18 to 60 | A5 |

### Contract decisions this diff overrides (to record when approved; `feedback.md` is append-only)

| Where | What it says | Effect of the diff |
|---|---|---|
| `tokens.md:36,58` | `moonlight` `#B7D3FA` is the UI's cold colour and the moon's colour ("same value as `moonlight`, on purpose") | UI muted colour becomes stone; the moon and AWAY trim keep `#B7D3FA`. The link between UI and moon ends |
| `tokens.md:106,119`, `feedback.md:117,123` | A 2 px moonlight ring on the primary button is "required, not decoration" and "do not drop the ring or the halo as clutter" | The ring becomes a 1 px stone edge. It is still there, still required (claret alone is 2.15:1), and 9.35:1 on ink-950 |
| `tokens.md:122` | "Never use anything dimmer than `moonlight` for text" | Stone is dimmer than the old moonlight (9.35 against 12.74). The intent, AA text, still holds with margin |
| `tokens.md:41,119`, `brand.md:41,61` | `poster-red` never on the UI layer; no glow, no neon; red only on the primary button | Already breached by the build (side stripes use `--accent`). The diff quiets the stripes but does not remove them (B3). Fireworks and confetti stay, per `docs/matchday-brief.md:80`, in palette colours |
| `direction-plain-invitation.md:52,86,96` | Capsule: 2 px `fog-300` ring, 1 px `fog-300` divider, `fog-300` edge "above 3:1 on primary" | Ring 1 px; divider still 1 px stone; ratio against claret is 4.35 |
| `direction-plain-invitation.md:41` | The card peeks at 390 x 844 | Replaced (section 5a) |
| `feedback.md:38` | Focus goes to the heading on every view change | Carve-out for a form returning with errors (section 5b) |
| `tokens.md` and `components.md` generally | Barlow Condensed, `radius 0`, no shadows, no pills, `panel` and `moonlight` names | The code is Inter Tight, pills, `ink`/`fog` names and one soft shadow. `DESIGN.md:5` and the 2026-11-12 review already note the drift; B8 rebases it |

### Brand rules that still hold

No club, crest, badge or stadium names and no club imagery anywhere. HOME and AWAY stay distinguishable (hue, trim and signs; luminance gap 2.01 against 2.20 today). One primary colour for the action. No gold, no neon: A7 removes the yellow flags and keeper and the neon-green station light that were the nearest things to both.

### Self-check: each new value against every surface it lands on

| New value | Surfaces checked | Not checked |
|---|---|---|
| chalk `#F4F1EA` | ink-950, ink-900, ink-800, ink-700, claret (rest, hover, pressed), LED bg, the focus ring on ink-950, ink-900 and claret | Text over the moving scene (no readable text sits there by contract) |
| stone `#B8B3A9` | ink-950, ink-900, ink-800, ink-700, LED bg as text; claret rest, hover and pressed as a line only | Stone as text on claret (fails 4.35, so none is proposed) |
| rule `#8E8A83` | ink-950, ink-900, ink-800, input fill | Over the poster dialog backdrop (`rgba(14,11,19,.82)`, darker than ink-900, so higher) |
| claret `#8A1F2D` and states | chalk label; stone edge; as a fill alone on ink-950 and ink-900 (fails by design, edge carries it) | Disabled state (`button:disabled` opacity .45, exempt) |
| rose `#D9505C` | ink-950, ink-900, ink-800 as non-text; ink-900 and white and chalk as text on it | Bloom and additive blending change the on-screen value of the beacon; it is a base colour, as in `tokens.md` scene tokens |
| paper values | paper-100 only | The `#card.fb` paper strip uses the same pair |
| Canvas uses (`stations.js:51-56`, `pitch.js:174-181`, `stadium.js:274,318,358`) | accent band with `#fff` text (4.00, large text at 44 px); `fog100` question text on ink-900 (16.16); LED text on `LED_BG` (17.88, 9.66) | Legibility of the boards at walking distance on a phone (B7) |

### Not verified in this pass

- Anything on a real phone, in WhatsApp's in-app browser, on Android, or with a notch. The preview was viewed in a Chromium touch emulation.
- The live reply form (closed on the preview). The form diagnosis rests on the 2026-11-12 capture and source.
- The game beyond one software-GL frame of the entrance plaza. Colours inside the stadium, pitch, finale and fireworks are from source.
- WCAG 2.3.1 flash counts and reduced-motion behaviour of the 3D camera (B6).
- The mocks changed only CSS custom properties and a few overrides on the live invitation; they do not show the scene, the form or the poster in the new palette.
