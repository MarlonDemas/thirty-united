# Variant C (direction-signature anchor), save-the-date

Single variant, so the skill default (C) applies: the chosen direction's Signature expressed structurally.

**Hard-refuse check:** `src/App.tsx` is 101 bytes (a stub), so no built screen exists; wireframing is allowed.
**Canvas:** each file is a desktop 1440×900 and a mobile 390×844 pair. Long views (details, code) extend the frames past the fold (marked) so the full scroll is visible.

## Files (one per moment)
| File | Moment |
|---|---|
| `variant-C-01-sealed-ticket` | 1. Sealed ticket and tear |
| `variant-C-02-attendance` | 2a. Yes / Maybe / No |
| `variant-C-03-details-yes-maybe` | 2b. Details for Yes or Maybe |
| `variant-C-04-no-form` | 2c. The No path |
| `variant-C-05-verify-code` | 3. Email code, with the 10 status lines |
| `variant-C-06-stub-yes-maybe` | 4a. Returned stub, Yes and Maybe |
| `variant-C-07-stub-no` | 4b. "Sorry you'll miss it" stub |
Each exists as `.svg` and `.png`.

## Anchors
Mundial desktop (ruled 1px boxes), Paperless Post (invite as an object), Premier League (tabular numerals), from `references/rsvp-save-the-date-sports-ticket-2026-10-14.md`. No ticket or stub reference exists, so the ticket is designed.

## Message to channel list (resolved before wireframing; full tables in the brief)
| Message | Channel | Words (`none-fits`) |
|---|---|---|
| This is an invitation for me; the date | type (title, tabular date), position | "Thirty United" title only |
| Venue not set | icon (dashed map-pin) + muted type | "Venue TBA" |
| Do this next | icon + short label on the one red action; motion nudge | "Tear open" |
| Tear result | motion; live-region announcement | none visible |
| Yes / Maybe / No | icon + position + ink fill; stub preview | "Yes", "Maybe", "No" |
| Optional field | muted "optional" tag | "optional" |
| Fun-fact consent | helper line | "May be used in a game on the day" |
| Where the code went | icon + mono email | "Code sent to" |
| OTP outcomes (10) | icon + status colour + 2px rule for errors + live line | one short line each (see edge-cases) |
| On the list | red stamp (Yes), outlined stamp + icon (Maybe), void rule (No) | stamp text |
| Change answer | quiet link | "Change my answer", "Changed your mind?" |

## Non-obvious commitments
- The ticket is sized by content, never a fixed aspect ratio, so 200% text grows it.
- After the tear the ticket main stays as a header; the torn stub previews the pick.
- The stub returns as the same ticket filled in. On mobile the ruled data table sits under the ticket so the ticket stays landscape.
- The brief omitted an Email field on the Yes/Maybe details view; the wireframe adds it under CONTACT.
- No CHOSEN.md is written: the owner has not approved a variant, and the approach is a proposal.
