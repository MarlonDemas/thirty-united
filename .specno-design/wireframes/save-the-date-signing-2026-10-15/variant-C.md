# Variant C (direction-signature anchor), save-the-date, Direction D

Date: 2026-10-15. One variant only, so the skill default (C) applies: the chosen direction's Signature expressed structurally. The dispatch fixed the layout (the panel at 40 to 45 percent, one camera shot per beat), so there was nothing to compare.

**Status:** approved by the owner on 2026-10-15 ("wireframes ok"); see `CHOSEN.md`. The layout commitments below come from `direction.md`, `components.md` and `tokens.md`, which he accepted with "defaults"; the frames only show them.

**Hard-refuse check:** the views exist in `src/components/` (`SealedView`, `AttendanceView`, `DetailsView`, `CodeView`, `StubView`), but they are built to Direction A, the paper ticket. Nothing in `src/` builds the poster, the step panel or a camera shot (no `WorldStage`, `StepPanel` or `PosterCompositor`). Each frame is a clear change from the built screen, so wireframing is allowed. The panel content follows the built views (radio tiles with Continue, the grouped detail fields, the code input with resend and Confirm code) so the frames show what changes, not what stays.

**Canvas:** a 390 × 844 phone per beat with an annotation column, and one 1440 × 900 desktop reference. Poster space is 1080 × 1920 (the 9:16 plate set). Each shot is a scale and translate of that poster, clipped to the phone. Greyscale only, token names instead of colours, `[ icon ]` blocks, every text bar tagged `[msg: …]`, no final copy.

## Files (one per beat)

| File | Beat | Banks lit |
|---|---|---|
| `variant-C-01-cover` | Cover, before the tear | 0 of 4 |
| `variant-C-02-chapter-1` | Chapter 1, "Are you in?" | 1 |
| `variant-C-03-chapter-2` | Chapter 2, details, keyboard closed | 2 (half on Maybe) |
| `variant-C-04-chapter-2-keyboard` | Chapter 2 with the keyboard open | 2 |
| `variant-C-05-code` | Chapter 3, the code | 3, plus six code lamps |
| `variant-C-06-signed` | The Signing finale (Yes and Maybe) | 4 |
| `variant-C-07-no-end` | The No end | 1, held |
| `variant-C-08-save-poster` | Save your poster (the one overlay) | none (still image) |
| `variant-C-09-desktop-cover` | Desktop reference, the cover | 0 |

Each exists as `.svg` and `.png`. The PNGs were exported with the repo's Playwright Chromium.

## Anchors

All paths are under `references/immersive-night-world-rsvp/`.

- `owner-gameday/04-makes-08-moonlit-poster-ai.png` (his AI poster): the low-angle hero with the moon top right. Used for the cover and No shots.
- `owner-gameday/03-anime-matchday-header-red-sword-embers.png` (the MATCHDAY title card): the title sits behind the hero. Used for the title band.
- Direction C (considered, not chosen): banks of floodlights switching on one by one to show progress. Used for the banks-lit column.
- `vercel-ship-badge-1-mobile.png`: a personal object you handle and keep. Used for the lanyard pass on the cover.

## Non-obvious layout commitments

- **The panel's top edge never moves between beats** (y 481 on an 844 phone, 43 percent). Only the shot changes. The one exception is the keyboard: then the panel fills the visual viewport below a shirt strip of at least 120 px (est.).
- **Every shot keeps Makes's face above the panel.** The keyboard strip is the only shot without it, because it frames the shirt. In the finale the shot is placed so the shirt and the THIRTY UNITED title both clear the panel.
- **The chips sit at the safe-area top + 12 px, top right, in every shot.** They cover part of the title band's sky, so **the plates must keep the lockup clear of the top-right chip zone (about 200 × 64 px of the phone at the cover shot)**. Otherwise the solid chips hide part of "THIRTY". This is a brief for the plates (decision 7), not something the code can fix.
- **The stamp has two positions.** In the live finale it sits at the lower right of the visible shot, above the panel, so a guest sees it on a phone. In the exported poster it sits in the lower corner of the 9:16 frame. The poster compositor is separate from the live scene, so the two positions don't conflict, but nova has to place it twice.
- **The chips hide while the on-screen keyboard is open.** The shirt strip is too short to share with them, and there is nothing to toggle mid-typing. They return when the keyboard closes.
- **Six lamps on the code beat, never numerals.** The real input is the six cells on the panel.
- **No red on the No beat.** "Changed your mind?" is a secondary button.
- **Desktop never overlaps the poster.** The poster is a 9:16 frame at 100dvh − 64 px, centre-left, with the panel in a 420 px column. Every shot shows the whole composition.

## Message to channel list (per beat)

| Beat | Message | Channel | Words (`none-fits`) |
|---|---|---|---|
| All | Sound, Still | icon + short label on a solid chip | one word each |
| All | Progress | light: banks lit (the world), announced in the live region on each strike | none visible |
| Cover | This invite is for me; the date | type (h1, focus target), icon + mono date | heading, date line |
| Cover | Venue not set | dashed map-pin + muted type | "Venue TBA" |
| Cover | Do this next | icon + label on the one primary; drag on the lanyard pass | "Tear open" |
| Chapter 1 | Yes / Maybe / No | icon + word + selected edge (not colour alone) | the three words |
| Chapter 1 | The world's answer | light and pose, announced in the live region | none visible |
| Chapter 2 | Field groups | position + caps legend + 1 px top rule | group labels |
| Chapter 2 | Optional | muted tag | "optional" |
| Chapter 2 | Your name on the shirt | the world mirrors the field (second channel; the field is the first) | none visible |
| Code | Where the code went | mail icon + mono email | heading |
| Code | Digits typed | the input cells; the lamps mirror them, never as numerals | none |
| Code | Cooldown | timer icon + live countdown | resend label |
| Code | Error | icon + `status-error` line + 2 px rule | one short line per outcome (`edge-cases`) |
| Signed | You're on the list | type + stamp (shape + words + icon: solid SIGNED, outlined PENCILLED IN) | heading, stamp words |
| Signed | Seat and shirt | mono type | "Seat 017 · Shirt 17" (draft) |
| Signed | Keep it | icon + label (primary); Share only where files can be shared | button labels, the no-copy line |
| No end | Sorry you'll miss it | heart-handshake icon + type; the world holds at the pre-match lights | heading |
| Save poster | How to save | type (`none-fits`: a gesture instruction, read once) | one line |

## Open (for Makes)

- Look at the frames. If the layout holds, a `CHOSEN.md` gets written before nova builds the world stage.
- The keyboard height (336 px) and the strip height are guesses. Set them on a real phone inside WhatsApp (phase 0a).
