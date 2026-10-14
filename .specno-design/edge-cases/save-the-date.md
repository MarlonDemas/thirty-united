# Edge cases and approach: save-the-date (one page, four moments)

Date: 2026-10-14. Stack: web-vite. Direction A. Inputs: `briefs/save-the-date-brief.md`, `wireframes/save-the-date-2026-10-14/`, `tokens.md`, `lux-notes/save-the-date-2026-10-14.md`. Status: built and verified 2026-10-14; invite-key states added 2026-10-14. Reconciled with the build below; see "As built" at the end.

Classification key: **WILL** = applies, will implement. **LATER** = applies, later. **N/A** = not applicable, with a reason.

## Approach proposal

### Component breakdown
- `InvitePage`: a small state machine (`sealed`, `attendance`, `details`, `no-details`, `code`, `stub-yes`, `stub-maybe`, `stub-no`). One heading per view; focus moves to it on every change; 160ms crossfade between views.
- `Ticket` (variants `sealed`, `header`, `filled`): one SVG mask draws the scalloped perforation, so the sealed and returned tickets share an edge. Sized by content, capped at 960px.
- `TearHandle` (pointer only, `aria-hidden`) beside a real `Button` "Tear open" that runs the same completion.
- `Stub` and `Stamp`: the ruled mono table (name, team, seat, date) and the ADMIT ONE stamp (full for Yes, outlined with MAYBE for Maybe, none for No).
- `RuledBox`: a `fieldset` with the label tab as its `legend`, so each group is announced.
- `AttendanceChoice`, `DetailsForm`, `NoForm`, `OtpField` (with `ResendTimer`), `StatusLine` (single `aria-live="polite"` region; errors also `role="alert"` on the field).

### shadcn primitives (base-nova, Base UI)
`button`, `input`, `label`, `field` (`Field`, `FieldLabel`, `FieldError`), `radio-group` (attendance, sport, channel), `checkbox` (plus-one), `select` (how you know Makes), `textarea` (fun fact), `input-otp` (needs the `input-otp` package, a build dependency to add; fallback is one native input with six display cells). Forms use `react-hook-form` with `Controller` and the `zod` resolver already installed. No `card`, `sonner`, `dialog` or `switch`.

### Tear motion plan (`motion` library)
1. A `progress` motion value runs 0 to 1. Dragging the handle down the perforation maps distance to progress. The stub rotates up to 12 degrees around the perforation's top end and shifts 16px; it fades from 60% progress. Transform and opacity only. The handle alone sets `touch-action: none`, so the page still scrolls elsewhere.
2. Release at 35% or more, or a fast flick: finish with `tear-finish` (700ms, ease-out cubic, no overshoot). Below 35%: return in `tear-cancel` (200ms).
3. The "Tear open" button runs the same 0 to 1 finish. A second activation while it runs is absorbed.
4. On completion: 160ms crossfade to the attendance view, where the ticket main is the header and the torn stub previews the pick. The live region says "Ticket opened"; focus goes to the heading.
5. Idle hint: after 3s the stub edge lifts 4px (600ms), at most twice, then still.
6. Reduced motion: no handle, no hint, no drag. The visible "Tear open" button swaps ticket and stub instantly; the stamp appears in place; announcement and focus move as above.
7. Verified success: `stamp-land` (180ms) then the stub fades in (160ms). No drop, no shake.

### OTP states (the contract; copy is a draft in the `brand.md` voice)
| State | Trigger | Treatment | Draft line |
|---|---|---|---|
| Sending | Submit pressed | Button disabled with loading state, label stays; after 5s add a still-working line, after 15s offer retry | "Sending your code" |
| Sent | Code issued | `mail-check`, `status-success`, email in mono; focus to the view heading (h1), not the input | "Code sent to <email>" |
| Cooldown | 60s after each send | Dashed disabled resend with `timer` and live countdown (announced at the start and the end only, not every second) | "Resend in 1:00" |
| Wrong code | Mismatch | 2px `status-error` rule, `circle-alert`, input keeps focus, cells cleared and selected for retype | "That code didn't match. 3 tries left" |
| Expired | Past `expiresAt` | Error line, resend enabled immediately | "That code has expired. Send a new one" |
| Too many attempts | Attempts exhausted | Cells disabled; resend stays disabled until the 60s cooldown ends (the backend enforces the cooldown, a new code then resets attempts) | "Too many tries. Send a new code" |
| Rate-limited | Too many sends | `status-warning`, resend disabled, wait time shown if the backend returns it | "Too many codes asked for. Try again in <time>" |
| Service unavailable | 5xx or network | `cloud-off`, answers kept, retry button | "We can't send codes right now. Your answers are kept, try again in a minute" |
| Saved | First verified RSVP | Stamp lands, stub appears, announcement | "You're on the list" |
| Updated | Re-verified same email | Same stub, new answers, seat number unchanged | "Your answer is updated" |

Attempts wording uses plural forms ("1 try left", "3 tries left"). Countdown is computed from timestamps, not from interval ticks.

## A. Data states
| # | Item | Class | Note |
|---|---|---|---|
| A-1 | Loading, first paint | N/A | No data is fetched on load; fonts use size-adjusted fallbacks so nothing jumps |
| A-2 | Loading, refresh | N/A | Nothing to refresh |
| A-3 | Loading, slow | WILL | Slow send or verify: still-working line at 5s, retry at 15s |
| A-4 | Loading, optimistic | N/A | A guest is never shown "on the list" before the code is verified |
| A-5 | Empty, first-time | N/A | No lists or empty collections |
| A-6 | Empty, after filter | N/A | No filters |
| A-7 | Empty, after deletion | N/A | No deletion |
| A-8 | Single result | N/A | No result lists |
| A-9 | Long content | WILL | 40+ character names, long emails, long team and fun-fact text wrap; stub grows taller, never clips |
| A-10 | Stale data | WILL | A code view left open past expiry shows the expired state on return |
| A-11 | Pagination, last page | N/A | No pagination |
| A-12 | Pagination, error mid-stream | N/A | No pagination |
| A-13 | First-time user | WILL | Every guest is first-time; the sealed ticket is the cold start, no silent recognition |

## B. Error and failure states
| # | Item | Class | Note |
|---|---|---|---|
| B-1 | Network unreachable | WILL | Inline line at the failed step, answers kept, retry; no persistent banner |
| B-2 | Server 5xx | WILL | "Service unavailable" OTP state |
| B-3 | Server 4xx validation | WILL | Backend field errors map to the field (invalid email, invalid WhatsApp number) |
| B-4 | Auth expired | N/A | No session; each change of answer is a fresh code |
| B-5 | Permission denied | N/A | No device permissions requested |
| B-6 | Timeout | WILL | 15s then "Couldn't send. Try again"; no silent retry because a retry would send a second email |
| B-7 | Conflicting concurrent edits | N/A | One guest, one record, last verified answer wins |
| B-8 | Force update | N/A | Web page |
| B-9 | Generic exception | WILL | Error boundary with a friendly state; answers kept |
| B-10 | Partial success | WILL | Code accepted but save failed must not burn the code; ask the backend to make verify and save one step |
| B-11 | Resource not found | N/A | Single page; any path shows the ticket |
| B-12 | Rate limit | WILL | "Rate-limited" OTP state |
| B-13 | Form abandonment | WILL | Answers survive reload and back in `sessionStorage` (never the code); cleared after saving |

## C. Input and interaction edges
| # | Item | Class | Note |
|---|---|---|---|
| C-1 | Rapid double tap | WILL | Submit and Tear guarded while pending |
| C-2 | Tap during animation | WILL | Absorbed: a second press during the tear does nothing |
| C-3 | Keyboard covers input | WILL | Scroll the focused field into view; no sticky bottom bar; `scroll-padding` for the keyboard |
| C-4 | Hardware keyboard | WILL | Tab order = reading order; Enter submits; arrow keys in radio groups; Esc does nothing destructive |
| C-5 | Long-press, swipe, pinch | WILL | Drag exists only on the tear handle; the button is the equal alternative; pinch zoom is never disabled |
| C-6 | Pull-to-refresh | WILL | Handle uses `touch-action: none` so a downward drag cannot trigger refresh |
| C-7 | Sheet dismissal | N/A | No sheets or modals |
| C-8 | Multi-select | N/A | No multi-select |
| C-9 | Swipe-to-delete | N/A | No deletion |
| C-10 | Undo | N/A | No destructive action; "Change my answer" is the correction path |
| C-11 | Copy and paste | WILL | Paste six digits into the code (spaces and dashes stripped); WhatsApp numbers accept spaces, dashes, `+27` and `0` forms |
| C-12 | Autofill | WILL | `given-name`, `family-name`, `email`, `tel`, `one-time-code` |
| C-13 | Cursor and selection | WILL | Focus moves only on view change or error; conditional fields never steal focus |

## D. Device and environment
| # | Item | Class | Note |
|---|---|---|---|
| D-1 | Smallest device | WILL | Holds at 360px; box padding drops to 20px |
| D-2 | Largest / wide | WILL | Ticket caps at 960px, form column at about 640px |
| D-3 | Notch and safe areas | WILL, implemented | `viewport-fit=cover` (added to `index.html` after verify) with `env(safe-area-inset-*)` padding, including phone landscape |
| D-4 | Landscape | WILL | Orientation is not locked; ticket fits a short viewport and the page scrolls |
| D-5 | Split view / tablet | WILL | Breakpoint at 768px; verified at 768×1024 |
| D-6 | Dynamic type / 200% text | WILL | `rem` sizes; ticket and stub sized by content; verified at 200% |
| D-7 | Dark mode | N/A | Owner decision: light only, `color-scheme: light` |
| D-8 | Increase contrast / transparency | WILL | `forced-colors` mapping in `tokens.md`; no transparency except the 4% grain |
| D-9 | Reduce motion | WILL | Instant reveal path described above |
| D-10 | Bold text / button shapes | N/A | iOS setting; buttons already carry 1px ink borders |
| D-11 | High DPI | WILL | Ticket, perforation and icons are vector |
| D-12 | Low power mode | N/A | No looping or background animation |

## E. Internationalization
| # | Item | Class | Note |
|---|---|---|---|
| E-1 | Translation overflow | N/A | English only |
| E-2 | RTL | N/A | English only |
| E-3 | Locale dates | N/A | One fixed event date, written as fixed strings |
| E-4 | Locale numbers | N/A | Only the seat number and code digits |
| E-5 | Currency | N/A | No money |
| E-6 | Pluralization | WILL | "1 try left" vs "3 tries left" |
| E-7 | Name order | WILL | Separate first name, surname and preferred name; accents and diacritics accepted, no ASCII-only validation |

## F. Connectivity and state
| # | Item | Class | Note |
|---|---|---|---|
| F-1 | Background to foreground | WILL | Cooldown and expiry recomputed from timestamps on return |
| F-2 | Closed and re-opened mid-flow | WILL | Answers restored; code view returns to "send a new code"; no silent recognition |
| F-3 | Notification deep link, same screen | N/A | No notifications |
| F-4 | Notification deep link, deleted | N/A | No notifications |
| F-5 | Notification batching | N/A | No notifications |
| F-6 | Auto-save state | N/A | Nothing is saved to the server before verification, and the page does not claim it |
| F-7 | Multi-device sync | WILL | The stub always renders from the server response after verification |

## G. Privacy and sensitive content
| # | Item | Class | Note |
|---|---|---|---|
| G-1 | Sensitive data when backgrounded | N/A | Low stakes; only the guest's own email is shown |
| G-2 | Screenshot blocking | N/A | Screenshots of the stub are welcome |
| G-3 | Biometric fallback | N/A | No biometrics |
| G-4 | Content moderation | N/A | Free text is shown back only to its author |
| G-5 | Read receipts | N/A | None |

## H. Haptics and audio
| # | Item | Class | Note |
|---|---|---|---|
| H-1 | Haptics | N/A | Not committed in the lux note; Vibration API is unsupported on iOS Safari |
| H-2 | Haptics and system settings | N/A | No haptics |
| H-3 | Sound | N/A | No sound |

## Brief Tier 1 to 3 cross-check
Tier 1 (wrong or expired code, cooldown, resend, invalid email and WhatsApp, network failure with answers kept, reduced motion, keyboard-only, same email re-verified, screen-reader tear announcement) is all WILL above. Tier 2 (long names, no team, other sport, blank plus-one name, slow code step, back after verification, 360px, 200%) is WILL; "back after verification" shows the stub again from server state, not the form. Tier 3 (offline, add-to-calendar, share, save as image) is LATER and outside this table.

## Open items for the build and the owner
- Backend: settled at build (10 minute code, 5 attempts, 60 second resend cooldown). The No stub shows no seat number.
- Dependencies: the four font packages and `input-otp` are installed.

## As built (reconciled 2026-10-14)

Differences between the proposal above and what shipped, from the verify report `captures/save-the-date-verify-2026-10-14.md`.

- **Focus on view change (C-13, code view):** focus goes to the view's h1 on every view change, including the code view, not to the code input. Heading-first focus is the deliberate pattern; a keyboard user needs one Tab to reach the code field.
- **Resend after lockout:** stays disabled until the 60s cooldown ends, because the backend enforces the cooldown anyway. Cooldown is 60s, not 30s (see `wireframes/save-the-date-2026-10-14/CHOSEN.md`).
- **D-3 safe areas:** implemented. `viewport-fit=cover` is in `index.html` and `index.css` pads the body with `env(safe-area-inset-*)`.
- **Validation timing (B-3, C-1):** after a failed submit, fields revalidate on change, not on blur, and radio-group errors clear when a choice is made. Mounting and unmounting errors on blur moved the layout and dropped clicks.
- **Offline verify (B-1, B-10):** a verify queued while offline is replayed by the Convex client after reconnect. The backend now replays idempotently for a correct, already-used code, so the guest sees "saved" instead of "no code".
- **Tear and reduced motion (D-9):** tear 700ms by drag or button; reduced motion is an instant reveal (68ms measured against 823ms).
- **Name wrapping (A-9):** long names wrap and the ticket grows taller. A single word wider than the name column at 390px still breaks mid-word (accepted: Chrome does not hyphenate all-caps).
- **Code and details views** are lazy-loaded; the stub is rendered from the server response.

### Accepted gaps
- No router or Back button: the page is one state machine at `/`, so browser Back leaves the page.
- Reload during the code step returns to the prefilled form (answers survive in `sessionStorage`, the code step does not), which matches F-2.
- The mobile "YOUR STUB" table is folded into the ticket rather than shown as a separate block.
- Sending Gmail account is pending an owner decision: the owner chose a new party-only Gmail, and the address is not supplied yet.

### Invite-key gate (as built, 2026-10-14)

Bot protection is a secret invite key in the shared link (`?k=...`). The key stays in the address bar so WhatsApp "open in browser" and copy-link keep working; a `sessionStorage` copy is the fallback (`src/lib/inviteKey.ts`, `src/main.tsx`, `src/App.tsx`). Both public backend functions (`otp.requestCode`, `rsvp.verifyAndSave`) check the key first (`convex/lib/inviteGate.ts`). All three states use one sentence: "This link is missing its invite key. Ask Makes to send you the full link." It is a neutral `StatusLine` (`role="status"`, polite), with no red and no icon.

| # | State | Trigger | Treatment |
|---|---|---|---|
| B-14 | Sealed, no key | Link opened without `k` and no stored copy | Tear open button and drag handle removed; the sentence sits under the ticket; nothing to act on, so no retry |
| B-15 | Send step, wrong key | `requestCode` returns `invalid_link` (first send or resend) | Sentence under "Send my code"; answers kept |
| B-16 | Verify, wrong key | `verifyAndSave` returns `invalid_link` | Sentence in the code view; not counted as a wrong code; entered code kept |

The accessibility scan (0 violations in 26 states) predates these states. They reuse the already-scanned `StatusLine`, so they are not separately scanned.
