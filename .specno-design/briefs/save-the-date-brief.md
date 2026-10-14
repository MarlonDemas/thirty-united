# Brief: Thirty United, save-the-date RSVP page

Date: 2026-10-14
Resolved stack: web-vite
Family: web

## Goal
A guest opens one link on their phone, tears the ticket open, RSVPs in under a minute, verifies their email, and keeps a personalised stub that says they are on the list.

## Persona
- Primary: friends and family of Marlon "Makes" Demas, mostly South African, ages roughly 20 to 70. Many are not football fans. Some are not comfortable with forms.
- Device context (web): primarily mobile (opened from a WhatsApp or email link, one-handed, portrait). Desktop is a secondary, wider view of the same flow.
- Frequency: rare. Each guest visits once, maybe twice (re-verifying the same email to change an answer).

## Stakes
Low and reversible, but personal. A guest's name, email and optional WhatsApp number are collected, so the code step and the data shown back must feel trustworthy. Re-verifying the same email updates the RSVP, so a wrong answer is never permanent.

## Reading mode
glance (ticket), then scan (form), inferred from data shape: the sealed ticket is a one-object hero; the RSVP, details and code views are forms. The stub is glance. User override: owner's decision, "glance (ticket) → scan (form)".

## Aesthetic anchors
- Loves: Paperless Post (the invite as a physical object), Mundial (ruled print-programme boxes, football through print culture), Man Utd site (serif gravitas, one red action), Premier League (tabular numerals for match facts).
- Avoids: Evite (confetti, balloons, gold-foil "30"), Partiful (club-night distressed promo), Luma (gradient headline word), Copa90 (glitchy loud intro), any official club crest (trademarked), photo-led dark heroes as the default.

## Scope
- In: the single page and its states: sealed ticket and tear, RSVP attendance, Yes/Maybe details form, No form, email code verification (6 digits, resend cooldown), personalised stub (Yes/Maybe), "sorry you'll miss it" stub (No), re-verify updates the RSVP, error and edge states.
- Out: no host dashboard or guest-list view, no game engine (the fun fact is only collected; "may be used in a game on the day"), no automated invites or reminders, no venue map (venue is TBA), no payments, no gift registry.

## Edge case priority
- Tier 1 (must): wrong or expired code, resend cooldown running, resend sent, invalid email, invalid WhatsApp number, network failure on submit (answers kept), reduced-motion instant reveal, keyboard-only completion of every step, same email re-verified (update, not duplicate), screen-reader announcement of the tear result.
- Tier 2 (should): very long names (stub must not overflow), no team given, other-sport team instead of football, plus-one name left blank, slow network on the code step, browser back after verification, small phone (360 px wide) and large text (200%).
- Tier 3 (later): offline, add-to-calendar, share-the-link, saving the stub as an image.

## Web-specific
- Above-the-fold priority (desktop): the sealed ticket at full size, centred, with the single tear affordance visible.
- Above-the-fold priority (mobile): the ticket (landscape, rotated hint not required) fills the width at 390 px; the tear handle and stub line are visible without scrolling.
- Responsive behaviour: same layout concept at all breakpoints (one object, one column of content); the ticket scales and the form column caps at a readable width on desktop.
- Keyboard model: Tab order follows reading order. The tear is a real button ("Tear open", Enter or Space triggers the tear; pointer users may also drag along the stub line). Attendance is a radio group (arrow keys move, Space selects). The code field accepts paste of 6 digits and auto-advances; Backspace moves back. Focus moves to the new view's heading after each step. Esc does nothing destructive.
- SEO / sharability: Open Graph image and title for the link preview in WhatsApp and email (sealed ticket artwork, "Thirty United, 21 Dec 2026"). No indexing needed (`noindex`).

## Decisions
- Distinctiveness Sentence (owner, verbatim): "The thing that makes this unmistakable in a screenshot is a landscape match ticket with a punched perforation that the guest tears along the stub line to open the page, and their RSVP comes back as a stub with their name, team and seat number in tabular numerals, stamped ADMIT ONE · 21 DEC 2026." This is Candidate Signatures 1 and 2 from the reference set combined. Do not re-ask.
- Motion budget (owner): signature. The tear is the brand moment. `prefers-reduced-motion` means an instant reveal with no tear.
- Brief texture (owner): premium-consumer. Likely lux commits: material truth (paper stock, ink, perforation), quiet by default, specificity, patina-aware. Run `/specno-design:lux` before the build.
- Reading mode (owner): glance (ticket) → scan (form).
- Palette (owner): A "Matchday Paper". Ticket stock `#F3EDE1`, ink `#1B1A17`, a single terrace-red accent `#B3261E`. Starting type pairing Barlow Condensed / Inter / JetBrains Mono. All three proposed directions keep paper + ink + one red accent and differ on typography identity, layout primitive, ticket rendering, motion philosophy, density and tone.
- Dark mode (owner confirmed 2026-10-14, light theme only): ship one deliberate light theme ("paper") and set `color-scheme: light` so browsers do not auto-darken it. Reasons: the paper stock is the material of the Signature; the event is one night and the page lives for weeks; inverting a ticket into a dark card weakens the screenshot test. Guard against the cost: contrast is checked at AA on paper, `forced-colors` and 200% text are supported, and no content depends on a light-only effect. Revisit only if user testing shows glare complaints at night. Build note: neutralise the `.dark` block in `src/index.css` and set `color-scheme: light` on `:root`.
- Brand constraint: no official Manchester United crest, wordmark or kit. The United nod is the red, the serif or condensed type, and the football-programme culture.
- Copy tone: warm, short, a little playful. Words only where no icon, type, colour, position or motion can carry the meaning.

## Message list per view
Channel key: icon / type / colour / position / motion. Words only where nothing else fits (each such string is logged in `channel-log.yaml` at build).

### View 1: Sealed ticket (glance)
| Meaning | Channel | Words |
|---|---|---|
| "This is an invitation and it is for me" | Type: the display "30" and "THIRTY UNITED" at the largest size; position: ticket centred | "Thirty United" (title, needed) |
| Date | Type: tabular numerals, high on the ticket | "21 DEC 2026" (the Signature stamp text) |
| Venue is not set yet | Icon: map-pin with a dashed outline; type: muted ink | "Venue TBA" (nothing else fits) |
| "Do this next" | Icon (scissors/arrow along the stub line) plus a short label on the one red action; motion: a slow nudge of the stub edge | "Tear open" |
| Tear result | Motion: the stub separates along the perforation, page content reveals from the tear origin; reduced motion: instant swap | none |

### View 2: RSVP attendance (scan)
| Meaning | Channel | Words |
|---|---|---|
| Three options | Icons: check, help-circle (maybe), x; position: three equal choices in a row; colour: selected state ink fill plus icon fill change plus accessible name | "Yes", "Maybe", "No" (short labels) |
| Question | Type: heading size | "Are you coming?" |
| Selected | Colour plus icon state change plus the ticket stub previews the choice | none |
| Continue | Red primary action, arrow icon plus label | "Continue" |

### View 3: Details, Yes or Maybe (scan)
| Meaning | Channel | Words |
|---|---|---|
| Name fields | Position: first name, surname side by side on desktop, stacked on mobile; labels above fields | "First name", "Surname", "Preferred name (optional)" |
| Plus-one | Icon: user-plus on a toggle; the name field appears from the toggle's origin | "Bringing someone?" and "Their name" |
| Team | Segmented choice: football icon vs other-sports icon; then a team field | "Football team" or "Sport and team" |
| Fun fact | Helper line under the field, small muted type | "May be used in a game on the day" (needed, it sets consent expectations) |
| How you know Makes | Optional select | "How do you know Makes? (optional)" |
| Invite channel | Two icon choices: mail, message-circle (WhatsApp); a phone field appears only for WhatsApp | "Email", "WhatsApp", "WhatsApp number" |
| Required vs optional | Position and type: optional fields carry a muted "optional" tag; no red asterisks | "optional" |
| Field error | Colour (red) plus alert icon plus inline text under the field plus focus moved to the first error | specific text, e.g. "Add a first name" |
| Submit | Red primary action | "Send my code" |

### View 4: No (scan)
| Meaning | Channel | Words |
|---|---|---|
| Only name and email are needed | Position: two fields, nothing else; the ticket shows a dimmed seat | "First name", "Surname", "Email" |
| Submit | Red primary action | "Send my code" |

### View 5: Email code (scan)
| Meaning | Channel | Words |
|---|---|---|
| Where the code went | Icon: mail; the email address shown in tabular numerals/mono | "Code sent to" plus the address |
| Six digits | Position: six separate boxes in a row, mono numerals, paste-aware | none |
| Wrong code | Colour plus alert icon plus a short horizontal shake (reduced motion: no shake) | "That code didn't match" |
| Resend cooldown | Icon: timer plus a countdown in tabular numerals; button disabled with accessible name | "Resend in 0:30", then "Send a new code" |
| Resent | Check icon and a brief status line (live region) | "New code sent" |
| Success | Motion: the verified ticket is stamped and the stub drops in; reduced motion: instant | none |

### View 6: Stub, Yes or Maybe (glance)
| Meaning | Channel | Words |
|---|---|---|
| You are on the list | Type: the ADMIT ONE · 21 DEC 2026 stamp, terrace red, the only red area | the stamp text (part of the Signature) |
| Whose ticket | Type: guest name large; team beneath in condensed caps | the guest's own words |
| Seat | Type: seat number in tabular numerals | "SEAT" label, short |
| Maybe vs Yes | Stamp wording and icon: Yes is "ADMIT ONE", Maybe is "ADMIT ONE" in outline with a help-circle (the seat is held, not confirmed) | "MAYBE" tag, short |
| Update later | Quiet link; same email re-verifies and overwrites | "Change my answer" |
| Venue | Icon: map-pin dashed | "Venue TBA" |

### View 7: Stub, No (glance)
| Meaning | Channel | Words |
|---|---|---|
| Sorry you'll miss it | Type: ticket marked void by a diagonal rule in ink (no red stamp: red is reserved for a Yes); a heart or hand icon | "Sorry you'll miss it, [preferred or first name]" |
| Change of mind | Quiet link | "Changed your mind?" |

### Global edge states
| Meaning | Channel | Words |
|---|---|---|
| Network failure on submit | Alert icon, inline, answers preserved, retry action | "Couldn't send. Try again" |
| Link opened after RSVP on the same device | Page shows the guest's stub directly after re-verification only; no silent recognition | none |

## Resolved decisions and backend (2026-10-14)
- Direction (owner): A, Matchday Programme. B Terrace Ticket and C Scoreboard Broadcast are rejected (see `direction.md`, Decision).
- Seat numbers (owner): sequential in RSVP order, so "SEAT 007" is the 7th reply. The backend assigns `ticketNo` on the first RSVP and keeps it when the guest updates their answer. Design note: if No replies also take a number, Yes and Maybe seats will show gaps (1, 2, 4). The No stub shows no seat, so guests will not see this unless they compare.
- Backend (decided, not open): Convex, with the email code sent through Gmail. Stored fields per `convex/schema.ts`: `email` (trimmed, lowercase), `firstName`, `surname`, `preferredName`, `attending` (yes | maybe | no), `plusOne`, `plusOneName`, `sport` (football | other), `team`, `otherSport`, `funFact`, `howKnowMakes`, `inviteChannel` (email | whatsapp), `whatsapp`, `ticketNo`, `createdAt`, `updatedAt`. Code challenges keep `codeHash`, `expiresAt`, `attempts` and `consumed`; `@convex-dev/rate-limiter` backs the rate-limit state. The design needs these backend facts at build: the code lifetime, the attempt limit and the resend limit (the design assumes 10 minutes, 5 attempts, 30 seconds between sends).
- Light theme only (owner): `color-scheme: light`, AA contrast, `forced-colors` and 200% text support.
- Maybe guests: the RSVP records the status. Reminders stay out of scope.

## Opening line: options
One short line from Makes, set in the serif standfirst on the sealed ticket and signed "Makes". The owner picks one. No exclamation marks, no club names.

1. "Turning 30, and I've kept you a seat in the stands."
2. "Thirty feels like half time. Come for the oranges." **(CHOSEN by the owner, 2026-10-14)**
3. "Turning 30 on a Monday, which is brave. You're in my starting eleven."

Lean: option 1 is the safest for guests who do not follow football and ties to the seat number on the stub. Option 2 is the funniest for fans and still readable by everyone. Option 3 is the driest and mentions the Monday, so it also helps the date register.

## Open questions
- Which opening line (above)? Owner to pick.
- Code lifetime, attempt limit and resend limit: confirm the backend values against the design assumptions above.
- Whether No replies consume a seat number (see the gap note above).
