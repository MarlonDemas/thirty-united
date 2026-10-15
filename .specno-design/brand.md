---
name: brand
schemaVersion: "1.0"
profileVersion: "1.0.0"
clientName: thirty-united
stack: web-vite
direction: D
lastUpdated: "2026-10-15"
---

# Brand: Thirty United

## Direction

- **Chosen:** Direction D, "Matchday: The Signing" (owner, 2026-10-15, by replying "defaults" to `audits/cinematic-recommendation-2026-10-15.md`).
- **Signature:** the invite is Makes's own living matchday poster, where every answer switches on a bank of floodlights until he holds up your shirt, with your name and number, as his new signing. (Pixel's wording, accepted through "defaults"; the owner did not write it.)
- **Rejected (hard constraints, from 2026-10-14):** B Terrace Ticket (letterpress ink bleed, deckled edge, off-register stamp, one question per screen) and C Scoreboard Broadcast (solid ink strips, scrolling ticker, wipes, shirt-number form rows, scoreboard digits). Do not drift back into either.
- **Retired:** Direction A "Matchday Programme" (2026-10-14) and its paper palette, overridden by the owner on 2026-10-14. History in `direction-archive/2026-10-14.md`.

## What this is

A personal invite for Marlon "Makes" Demas's 30th birthday, Monday 21 December 2026, venue to be announced. The host is a person, not a company. There is no logo: Makes's poster is the mark, and the guest leaves with a poster of their own signing.

## Voice and tone

- A matchday with a film's sense of occasion, written by Makes in first person. Warm, short, a little playful, confident. Signed "Makes".
- Football is a nod, never a requirement: a guest who has never watched a match must understand every word. "You've been called up" and "Signed" are shirt-presentation language that non-fans know from the news. Gentle, family-safe banter only.
- Draft lines from the recommendation ("You've been called up", "Your shirt", "Seal it", "SIGNED", "PENCILLED IN", "Save it now. We don't keep a copy.") are drafts for Makes to rewrite in his voice.
- Words only where no icon, type, colour, position or motion can carry the meaning (`copy-rules.md`). Control labels are short and literal ("Tear open", "Continue", "Send my code", "Save your poster", "Share").
- Errors say what to do, not what went wrong with the system. Never blame the guest. No exclamation marks, no emoji, no "Oops".
- Specno writing rules apply to all copy: no inflated vocabulary (seamless, elevate, delve and the like), no filler openers, commas instead of drama dashes.
- Dates: "Monday 21 December 2026 · Venue TBA" on the panel; "MON 21 DEC 2026 · VENUE TBA" on the poster; "21 DEC 2026" on the stamp. No kick-off time until there is one. When the venue is set, it is one config change, and posters made after that carry it.

## Marks and imagery

- **No official club crest, badge, wordmark, kit or club imagery, ever (trademark).** This rule stands unchanged from 2026-10-14 and binds every generated plate and every shipped layer: no crest, badge or emblem (shirt, ball, flags, sky, stand); no sponsor or kit-maker mark, no stripes on shoulders or sleeves; no starball; no club or stadium name or signage; no devil or trident. Makes's AI poster carries several of these, so it is a head-and-neck likeness reference only, never a base image. Every generation passes the nine-point checklist in the recommendation (section 3) before it is accepted, and Claude re-checks every shipped layer and a sample poster before launch. Guests' teams appear only as plain text on the poster's credit line, never as badges.
- **Illustration on every view.** Amended 2026-10-15 (owner decision, through "defaults"). The 2026-10-14 rules "no stadium photo", "the ticket is the only illustration" and "every other view stays photo-free and illustration-free" are reversed. The medium is a cinematic, photo-real night poster (a generated image that reads as a film still; owner decision 2026-10-15, replacing the earlier painted, anime-lit style), behind every beat from the cover to the finale. It is never a stock or found photograph, an HDRI or a video in v1. The style locks are in `direction.md`, Plate style. The Ballotaku images are inspiration only: never an input, never traced, and no artist or studio is named in a prompt.
- **Red in the scene.** Amended 2026-10-15. The 2026-10-14 rule "no red in the scene" is reversed: red is the one hot colour, in the smoke, the shirt, the flags, the embers and the "UNITED" lockup (`poster-red`, `scene-smoke-red`, `scene-ember`). On the UI layer red stays limited to the primary button fill (`shirt-red`, with its moonlight ring).
- **Makes's likeness (consent given 2026-10-15).** Makes is the hero of every frame, smiling, in three poses, and his face goes out on every poster guests save and post. The owner answered "likeness yes" on 2026-10-15 to "may my likeness appear on every shared poster". G1, the first image generation, is unblocked. His photo arrived on 2026-10-15 and the first G1 attempt is in review, not approved (it needs a file of at least 1080 x 1920 and a lights-off edit); he still approves G1 for likeness and cleanliness. Guests have no likeness on the poster: they are a shirt with a name and a number.
- **What the poster carries:** Makes holding up the guest's shirt with their preferred name (or first name) and their number (`ticketNo`); THIRTY UNITED; "MON 21 DEC 2026 · VENUE TBA"; the credit line ("+ name" for a plus-one only; no team and no sport, owner decision 2026-10-15; the data is still collected for the host); the AI credit line "Poster art made with AI" under it, small, in `moonlight` over a `panel` scrim (owner decision 2026-10-15; saved poster only, never in the live page UI, never on the Open Graph image). No footer line: "Makes, 21 DEC 2026" is removed, the date is on the cover. Never a surname, email, WhatsApp number, fun fact or anything about other guests. A No gets no poster.
- **Still banned:** confetti, balloons, gold foil, "30" clip-art, stock photography, neon, glow borders, betting-app chips, anything pointed at the camera (weapons, gauntlets, swords).
- **Open Graph image:** carries no AI credit line. A teaser composite, never a guest's poster: Makes from the chest up, moonlit, looking up at four dark floodlight towers, red smoke low in the frame, "THIRTY" in the sky and "21 DEC 2026" beneath it. 1200 × 630 JPEG, composited from the layers. Title and description stay as built. `noindex`.

## Accessibility floor

- WCAG 2.2 AA on every beat; text 4.5:1 on its surface, control edges and focus 3:1 against both the surface and the brightest scene pixels behind them (values in `tokens.md`).
- Every readable word is DOM text on the solid panel or a solid chip; the scene, the title and the stamp are `aria-hidden` art. The Save your poster image has alt text naming what is on it.
- Keyboard completion of every beat, a visible focus ring, focus moves to the new beat's heading, live-region announcement of every world reaction that carries meaning.
- `prefers-reduced-motion`: the T0 still, instant beats, "Tear open" only, nothing loops. `forced-colors`: no poster, the panel in system colours. 200 percent text supported. One dark scheme (`color-scheme: dark`).
- Flashes: every large-area brightness change is one-way and 300 ms or longer; at most three flashes in any second.
- Minimum text 14 px, inputs 16 px, targets 48 px.

## Motion and sound

- **Ambient motion.** Amended 2026-10-15 (owner decision 5, "go all out, within limits"). The round-2 rule "nothing loops" is reversed for the world on T3 and T2: embers, smoke and cloud move at 30 Hz, paused when the page is hidden and for the whole code beat. It still holds under reduced motion (nothing loops at all), on the UI layer (the panel and chips never loop) and for anyone who presses the Still chip.
- Sound stays opt-in, off by default, synthesised, behind a Sound chip. It follows only its own opt-in, so a guest who asked for less motion can still have the crowd.
- Haptics: Android only, after the first tap, never under reduced motion (values in `tokens.md`).

## Prohibited patterns

Shadows on the UI layer; gradients on the UI layer (the poster carries all light and depth); red fills beyond the primary button; `poster-red` on the UI layer; pill buttons; toasts; a light theme; text on the moving scene; wipes or page fades between beats; forward camera travel, gyro parallax or idle camera drift; looping motion under reduced motion, in the UI layer or on the code beat; post-processing bloom, halftone or posterise in v1; video in v1; placeholder-only labels; red asterisks for required fields (optional fields carry a muted "optional" tag instead); any official club imagery; a poster for a No; a guest's surname or contact details on a poster.
