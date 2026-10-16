# Brief: Thirty United, save-the-date RSVP (redesign: the world and the journey)

Date: 2026-10-15 (owner decisions of 2026-10-14, tonight). Updated 2026-10-15 after the direction gate closed on Direction D, "Matchday: The Signing" (owner reply: "defaults").
Resolved stack: web-vite
Family: web
Supersedes: `briefs/archive/save-the-date-brief-2026-10-14.md`. Facts that did not change (backend, stored fields, code limits, scope out-list, edge-case tiers, opening line) are carried forward below or by reference to that file. Its Distinctiveness Sentence, Palette A, light-theme-only decision and Direction A are no longer current.

## Goal
A guest opens one link on their phone, opens Makes's own matchday poster alive in depth layers, and moves through it to RSVP: tear open the pass, say whether they are coming, tell us who they are, confirm their email, and end as Makes's new signing, with a poster of their own shirt to keep. They should want to reach the end because each answer switches on more of the ground's floodlights, and their shirt number appears only after the code.

(The world described under "World (owner)" below was the 2026-10-14 brief. After the owner's gameday set of 2026-10-15, the chosen world is Makes's poster, not a miniature ground; see `direction.md` Direction D.)

## Owner direction (2026-10-14, verbatim)
- "I still don't like the color or theme currently and I feel like we still being safe! … go all out … Don't hold back at all"
- "the second part felt too much like a boring form that people might get tired of filling in, it also needs to feel like a story or journey. Just something interactive that makes you feel you want to finish the form."

## Persona
- Primary: friends and family of Marlon "Makes" Demas, mostly South African, ages roughly 20 to 70. Many are not football fans. Some are not comfortable with forms.
- Device context (web): primarily mobile, opened from one WhatsApp link, often inside WhatsApp's in-app browser, one-handed, portrait. Many guests are on low-end Android. Desktop is a secondary, wider view of the same world.
- Frequency: rare. Each guest visits once, maybe twice (re-verifying the same email to change an answer).

## Stakes
Low and reversible, but personal. Name, email and an optional WhatsApp number are collected, so the code step and the data shown back must feel trustworthy. Re-verifying the same email updates the RSVP.

## World (owner)
- Football stays. A stylised miniature night stadium the guest is inside: floodlights through haze, a glowing pitch, the ticket living in it.
- No club crest, wordmark or kit (trademark, unchanged). The United nod can no longer lean on terrace red; it lives in football culture itself (floodlights, tunnel, turnstile, pitch markings).
- Out: the paper palette (`#F3EDE1`, `#B3261E` and its neutrals) and the drawn CSS green night stand (stadium A scene tokens `#0B1411`, `#16231E`, `#22342D`, `#FFF6DC`, `#2F5D3A`, `#2A4A31`). A new palette is required.
- Reach: the world persists behind every step: sealed ticket → attendance (Yes / Maybe / No and plus-one) → details → email code → returned stub. This reverses "fade to paper after Tear open" and "stub stays on paper" (see `feedback.md`, 2026-10-14 owner override).

## Ambition calibration (owner)
Two reference videos, copied to `references/immersive-night-world-rsvp/owner-calibration/` and cited in the reference file:
- @Guronnimo: a first-person meadow of cursor-reactive grass, wildflowers and haze, with a small Morning / Golden / Night chip that relights the whole world.
- @flxrnc: an autumn cottage diorama on a dark lacquered turntable, lit windows and lamp posts, chimney smoke, falling leaves, volumetric dusk haze and an orbiting camera.
Both are whole lit worlds where the UI is one small chip. Today's page is a page with a 3D object on it. That gap is the redesign.

## Journey requirement
The RSVP must stop reading as a form. Rules every direction follows:
1. **Each step is a place or moment in the world**, and every answer gets a visible reaction in the world (a gate turns, a light strikes, a name appears on an object). The guest sees progress in the world, not in a numbered stepper.
2. **The world decorates; the control decides.** Every step is completed by a plain, labelled DOM control with one tap, Enter or Space. No beat requires playing, dragging, aiming or finding something. World gestures (drag to turn, touch the grass) are optional extras with no effect on the data.
3. **Beats group fields.** The five beats map to the existing views. Details stays one beat with its fields together; this is not a one-question-per-screen sequence (that was part of rejected Direction B).
4. **Text never sits directly on the moving scene.** Every label, input, status line and button sits on a solid or near-solid surface defined by the direction, so contrast is fixed whatever the scene is doing.
5. **Answers persist.** The existing `sessionStorage` draft (`thirty-united:answers`, never the code) keeps answers across reload and back, as today.
6. **No game engine.** The fun fact is still only collected ("May be used in a game on the day"). No scores, timers, achievements or leaderboards.

## Motion budget
Signature. Motion is the brand: the world's light and camera answer the guest's answers. One continuous world, so view changes are camera shots or light changes, never page fades or wipes.

Direction D, owner decision 5 ("go all out, within limits", accepted through "defaults" on 2026-10-15):
- **Ambient:** embers, smoke and cloud at 30 Hz on T3 and T2; paused when the page is hidden and for the whole code beat. The UI layer never loops.
- **Beats:** each answer is a one-way floodlight strike (about 600 ms); camera push-ins of 3 to 4 percent at most; no forward travel, no gyro, no idle drift. The finale runs about 3.2 s. Every large-area brightness change is one-way and 300 ms or longer.
- **Still chip:** stops every ambient loop for the session and drops to T1, without an OS setting.
- **Reduced motion (T0):** nothing loops; no camera travel, no particles, no relight animation; each beat swaps instantly to its final framing, and every reaction has a static equivalent (a lit state instead of a lighting animation).

Timings and tokens: `tokens.md` Motion. All durations are estimates to tune on a device.

## Brief texture
premium-consumer. Lux re-run on 2026-10-15 for Direction D: `lux-notes/save-the-date-2026-10-15.md`. Committed: material truth, specificity, time visible in detail, multi-sensory, and quiet by default recast for the UI layer only; inevitability through restraint kept as a list of refusals. Not committing: patina-aware. "Nothing loops" is reversed for ambient motion on T3 and T2 and kept under reduced motion, in the UI layer and on the code beat.

## Reading mode (per step)
| Step | Mode | Why |
|---|---|---|
| Sealed ticket | glance | One object in one place, one action. |
| Attendance (Yes / Maybe / No, plus-one) | glance | Three choices and a toggle, understood in about two seconds. |
| Details (name, email, WhatsApp and the optional fields) | scan | The one step with several fields; short labels, one-line helpers. |
| Email code | scan | Where the code went, six digits, resend state. |
| Returned stub | glance | Your name, your seat, the stamp. |
| World chrome (relight chip, sound, quality) | glance | Small controls, icon plus short label. |

## Accessibility floor (unchanged in substance, re-proven over the scene)
- WCAG 2.2 AA on every step: text 4.5:1 on its surface, control edges and focus 3:1 against both the surface and the brightest scene pixels behind them (floodlight glare included).
- Keyboard completion of every step. Tab order follows reading order; the canvas is never in the tab order; focus moves to the new step's heading (project rule, see `feedback.md`).
- Live-region announcement of every world reaction that carries meaning (tear result, code status, seat assigned).
- `prefers-reduced-motion`, `forced-colors: active` and 200% text supported. In forced colours the scene is hidden and the UI uses system colours.
- Minimum text 14 px, inputs 16 px, targets 48 px.
- `color-scheme` changes from light to dark with this redesign; the old light-only decision is reversed with the paper palette (inferred from the reach decision on 2026-10-14; confirmed by the Direction D pick on 2026-10-15).

## Performance and fallback (constraint for every direction)
- Stack: Vite, React 19, `@react-three/fiber` and `three` (already in the lazy chunk, 246 kB gzip), `motion`, Tailwind, Convex, Netlify. Entry chunk stays free of three.
- Every direction keeps a three-rung ladder where every rung is still that direction's world and journey: (1) WebGL world; (2) a 2D world (baked stills or layered illustration, same palette, same beats) for no WebGL, slow frames, low memory or a chunk failure; (3) reduced motion and forced colours (flat, instant, no camera or relight). Dropping to the old paper flow is not a fallback.
- Each direction states its render cost honestly: what is instanced, what is baked, what drops on a weak GPU. An architecture pass sizes the budget after the pick.
- Current CSP (`netlify.toml`): no `unsafe-inline`, no wasm. Decoders that need wasm (Draco, Meshopt, KTX2/Basis) need a CSP change, decided in the architecture pass.

## Aesthetic anchors
- Loves: the two owner videos above (whole lit worlds, UI as one small chip); the current 3D lanyard ticket and the tear (he approved both in WhatsApp tests).
- Avoids: anything "safe"; the paper-and-red programme look; rejected B (letterpress ink bleed, deckled edge, off-register stamp, one question per screen) and rejected C (solid ink strips, scrolling ticker, wipes, shirt-number form rows, scoreboard digits); Evite-style confetti, balloons and gold foil; club crests, wordmarks and kits.

## Scope
- In: the single page and all its states: sealed ticket and tear, attendance (Yes / Maybe / No, plus-one), Yes/Maybe details, No details, email code (6 digits, resend cooldown), personalised stub (Yes/Maybe), "sorry you'll miss it" stub (No), re-verify updates the RSVP, error and edge states, all inside the world.
- Out: no host dashboard or guest-list view, no game engine, no automated invites or reminders, no venue map (venue TBA), no payments, no gift registry. **No new backend reads**: Convex and the RSVP logic are unchanged, so nothing may show other guests' data (who else is coming, how many seats are lit). The guest's own `ticketNo` is available and may drive "your seat lights up".

## Data shape (unchanged, `convex/schema.ts`)
`email`, `firstName`, `surname`, `preferredName`, `attending` (yes | maybe | no), `plusOne`, `plusOneName`, `sport` (football | other), `team`, `otherSport`, `funFact`, `howKnowMakes`, `inviteChannel` (email | whatsapp), `whatsapp`, `ticketNo`. Code challenge: 6 digits; design assumes 10 minutes, 5 attempts, 30 s between sends (see archived brief).

## Edge case priority
Carried forward from the archived brief (Tier 1 to 3 unchanged), plus world-specific items:
- Tier 1 (must): WebGL unavailable or lost mid-journey (drop to the 2D rung without losing the step or answers); slow frames on low-end Android (drop silently); the on-screen keyboard covering the lower half of the screen while the scene is still visible; WhatsApp in-app browser on iOS and Android; reduced motion; forced colours; keyboard-only completion over the scene.
- Tier 2 (should): device rotation mid-step; tab hidden and restored (pause the world); 200% text with the scene squeezed to a strip; slow network while the world assets load (the first beat must be usable before the world finishes loading).
- Tier 3 (later): offline, add-to-calendar, share-the-link, saving the stub as an image.

## Web-specific
- Above-the-fold priority (mobile): the world, with the sealed ticket inside it and the one action visible without scrolling.
- Above-the-fold priority (desktop): the same world, wider; the step surface sits beside or below the world without covering its focal point.
- Responsive behaviour: one world at every breakpoint; the camera framing changes, not the concept. The step surface caps at a readable width on desktop.
- Keyboard model: unchanged from the archived brief (tear is a real button; attendance is a radio group; code field takes paste of 6 digits; focus to the step heading). World extras (relight chip, sound) are real buttons with `aria-pressed`.
- SEO / sharability: the Open Graph image for the WhatsApp preview becomes a teaser composite of the poster (Makes from the chest up, dark floodlights, "THIRTY", "21 DEC 2026"), never a guest's poster. `noindex`.

## Decisions
- Distinctiveness Sentence (Pixel's wording, accepted by the owner through "defaults" on 2026-10-15; he did not write it): "The thing that makes this unmistakable in a screenshot is that the invite is Makes's own living matchday poster, where every answer switches on a bank of floodlights until he holds up your shirt, with your name and number, as his new signing."
- Direction: D, "Matchday: The Signing" (`direction.md`).
- Motion budget: signature, with ambient motion within limits (above).
- Brief texture: premium-consumer (above); lux re-run done.
- Colour scheme: dark, `color-scheme: dark` (confirmed by the pick: the poster persists behind every beat).
- The eight owner decisions of 2026-10-15 (crests, shirt number, No poster, name, motion, lanyard, plates, date line): `direction.md` Decision.
- Reading mode: per step (above).
- Opening line, carried forward: "Thirty feels like half time. Come for the oranges." (owner, 2026-10-14).

## Open questions
- Closed 2026-10-15: which direction (D), the Distinctiveness Sentence (above), `color-scheme` (dark), and the lux commits (lux note 2026-10-15).
- Closed 2026-10-15: likeness (owner: "likeness yes"), wireframes ("wireframes ok"), typography (keep the four shipped faces plus SVG title lockups; brush font picked in the asset phase) and the moon default (about 93 percent waxing gibbous on 21 December 2026; the phase itself is still an estimate).
- Open: the owner's decision on G1 (keep the photo-real attempt or have it repainted in the painted style). His photo arrived on 2026-10-15 and the first G1 attempt is in review, not approved.
- Draft copy stays as drafts until he rewrites it.
- Carried forward: confirm code lifetime, attempt limit and resend limit against the design assumptions; whether No replies consume a seat number.
