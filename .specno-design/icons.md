---
name: icons
schemaVersion: "1.0"
profileVersion: "1.0.0"
clientName: thirty-united
stack: web-vite
lastUpdated: "2026-10-14"
---

# Icons: Thirty United

## Library

`lucide-react` (already installed; `iconLibrary: lucide` in `components.json`). One family, never mixed. No emoji as icons.

## Spec

- Sizes: 20px inline with body text, 24px on tiles and buttons. Stroke 1.5px (matches the 1px ink rules). Colour `ink` by default; `status-*` only inside status lines.
- Decorative icons carry `aria-hidden="true"`; an icon that is the only content of a control gets an accessible name on the control.
- Direction-bearing icons (arrow) do not mirror: the site is LTR English only.

## Mapping (from the brief's message list)

| Meaning | Icon |
|---|---|
| Tear open | `scissors` (with `arrow-right` for Continue) |
| Yes | `check` |
| Maybe | `circle-help` |
| No | `x` |
| Continue / next | `arrow-right` |
| Venue TBA | `map-pin` (drawn with a dashed outline via a wrapper, since lucide has no dashed variant) |
| Bringing someone | `user-plus` |
| Football / other sport | `trophy` for other sport; for football use a plain text label, since lucide has no football glyph and a generic circle reads as a ball only by accident |
| Email | `mail` |
| WhatsApp | `message-circle` (no brand logo) |
| Code sent | `mail-check` |
| Resend cooldown | `timer` |
| Field error and alert | `circle-alert` |
| Saved / updated / new code sent | `check` in `status-success` |
| Sorry you'll miss it | `heart-handshake`, or `hand` if the owner prefers (lean: `heart-handshake`, to confirm at build) |
| Service unavailable | `cloud-off` |
| Change my answer | `pencil` |

Every glyph name above was checked against the installed `lucide-react` icon files on 2026-10-14.
