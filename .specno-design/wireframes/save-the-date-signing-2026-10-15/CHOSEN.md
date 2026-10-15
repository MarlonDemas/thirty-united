# Chosen: save-the-date wireframes, Direction D "Matchday: The Signing"

Date: 2026-10-15. Chosen variant: **C** (direction-signature anchor), the only variant drawn. Approved by the owner on 2026-10-15 with "wireframes ok" for all nine frames (`variant-C-01` to `variant-C-09`). This is a pre-build contract: `nova` builds the world stage against it, and `page`, `component` and `verify` check the result against it. Frames and anchors are in `variant-C.md`.

## Rationale

The Signature says the invite is Makes's own living matchday poster, so the poster has to stay on screen the whole way through. C expresses that structurally: one 9:16 poster behind every beat, one step panel at about 43 percent of the phone height, and a change of camera shot instead of a change of page. A guest never leaves the poster, and progress is the four floodlight banks lighting up in the world, not a bar.

## Binding layout commitments

- **The panel's top edge never moves between beats** (y 481 on an 844 phone, 43 percent). Only the shot changes. The one exception is the keyboard: then the panel fills the visual viewport below a shirt strip of at least 120 px (estimate, set on a real phone in phase 0a).
- **Every shot keeps Makes's face above the panel.** The keyboard strip is the only shot without it, because it frames the shirt. In the finale the shot is placed so the shirt and the THIRTY UNITED title both clear the panel.
- **The chips sit at the safe-area top + 12 px, top right, in every shot**, as solid panel chips. The plates must keep the lockup clear of the top-right chip zone (about 200 x 64 px of the phone at the cover shot). This is a brief for the plates, not something the code can fix.
- **The chips hide while the on-screen keyboard is open** and return when it closes.
- **The stamp has two positions.** Live finale: lower right of the visible shot, above the panel. Exported poster: the lower corner of the 9:16 frame. The poster compositor is separate from the live scene, so nova places it twice.
- **Six lamps on the code beat, never numerals.** The real input is the six cells on the panel.
- **No red on the No beat.** "Changed your mind?" is a secondary button, and the world holds at the pre-match lights.
- **Desktop never overlaps the poster.** The poster is a 9:16 frame at 100dvh minus 64 px, centre-left, with the panel in a 420 px column. Every shot shows the whole composition.
- Poster space is 1080 x 1920. Each shot is a scale and translate of that poster, clipped to the phone. Nothing in the frames is final copy; the draft lines stay drafts until the owner rewrites them.

| Beat | Frame | Banks lit |
|---|---|---|
| Cover, before the tear | `variant-C-01-cover` | 0 of 4 |
| Chapter 1 | `variant-C-02-chapter-1` | 1 |
| Chapter 2, keyboard closed | `variant-C-03-chapter-2` | 2 (half on Maybe) |
| Chapter 2, keyboard open | `variant-C-04-chapter-2-keyboard` | 2 |
| Chapter 3, the code | `variant-C-05-code` | 3, plus six code lamps |
| The Signing (Yes and Maybe) | `variant-C-06-signed` | 4 |
| The No end | `variant-C-07-no-end` | 1, held |
| Save your poster (the one overlay) | `variant-C-08-save-poster` | none |
| Desktop reference, cover | `variant-C-09-desktop-cover` | 0 |

## Channel decisions

`none-fits` entries rely on the reading mode named in the last column.

| Beat | Message | Channel | Words (`none-fits`) |
|---|---|---|---|
| All | Sound, Still | icon + short label on a solid chip | one word each; read on glance |
| All | Progress | light: banks lit in the world, announced in the live region on each strike | none visible |
| Cover | This invite is for me; the date | type (h1, focus target), icon + mono date | heading and date line; read once |
| Cover | Venue not set | dashed map-pin + muted type | "Venue TBA"; read once |
| Cover | Do this next | icon + label on the one primary; drag on the lanyard pass | "Tear open"; read on glance |
| Chapter 1 | Yes / Maybe / No | icon + word + selected edge (not colour alone) | the three words; read on glance |
| Chapter 1 | The world's answer | light and pose, announced in the live region | none visible |
| Chapter 2 | Field groups | position + caps legend + 1 px top rule | group labels; read on glance |
| Chapter 2 | Optional | muted tag | "optional"; read on glance |
| Chapter 2 | Your name on the shirt | the world mirrors the field (second channel; the field is the first) | none visible |
| Code | Where the code went | mail icon + mono email | heading; read once |
| Code | Digits typed | the input cells; the lamps mirror them, never as numerals | none |
| Code | Cooldown | timer icon + live countdown | resend label; read on glance |
| Code | Error | icon + `status-error` line + 2 px rule | one short line per outcome (`edge-cases`); read once |
| Signed | You're on the list | type + stamp (shape + words + icon: solid SIGNED, outlined PENCILLED IN) | heading, stamp words; read once |
| Signed | Seat and shirt | mono type | "Seat 017 · Shirt 17" (draft); read once |
| Signed | Keep it | icon + label (primary); Share only where files can be shared | button labels, the no-copy line; read once |
| No end | Sorry you'll miss it | heart-handshake icon + type; the world holds at the pre-match lights | heading; read once |
| Save poster | How to save | type | one line (a gesture instruction); read once |

## Still open

- The keyboard height (336 px) and the shirt strip height are guesses. Set them on a real phone inside WhatsApp (phase 0a). The iPhone run is in (2026-10-15): the link opened in Safari, the system browser, not a WebView; `canShare(files)` true; WebGL2 yes; 3D chunk ready at 1730 ms, first frame at 2131 ms. Android is still untested, so the WhatsApp WebView risk stays open there.
- G1 (the first plate) is in review, not approved. The owner has to decide whether to keep the photo-real attempt or have it repainted in the painted style.
