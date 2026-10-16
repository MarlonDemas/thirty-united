# Phase 8 verification (Claude side), 2026-10-16

Branch feature/3d-ticket, HEAD 0f204c9. Pass with 4 Low issues and 1 brand-rule conflict. No WCAG failure found.
Labels: [T] tool-verified, [A] asserted from code read, [I] inferred.
Scratch evidence root V = /private/tmp/claude-501/-Users-makes-Documents-proj/6f4084d0-e1f1-4775-a8db-66873ef1d2b9/scratchpad/verify/

Method: Playwright 1.64 against a programmatic Vite server, serving a scratch harness at /__h that mounts the real InvitePage with a fake api (no Convex client is created). Tiers were forced by init scripts (T1 no WebGL2; T2 4 cores/4GB; T3 8 cores/8GB). Headless swiftshader only, so there are no real GPUs.

## Convex safety
- Requests to any convex host: 0. Blocked: 0. WS to Convex: 0. [T]
- Every context aborted /convex\.(cloud|site)/, aborted any off-origin URL, closed all WebSockets, and logged every URL.
- The real-app run (App path, T3 mobile, 6 s idle, tear, chapter 1, details, never submitted) made no backend request. The only "convex" strings were 4 same-origin Vite module fetches of local source.
- "Send my code" and confirm were clicked only on the harness fake API.
- No convex CLI, no .env* read, no test:e2e, no rsvp.spec.ts.
- Caveat: logs/requests.log was deleted once before the real-app run. Earlier runs are evidenced by the stats lines in logs/*.log.

## 1. axe (wcag2a/aa, 21a/aa, 22aa, best-practice) [T]
| View | State | Tier | Result | Evidence |
|---|---|---|---|---|
| cover, chapter1, details, code, code-wrong, stub | Yes, 390 and 1280 | T1, T2, T3 | 0 violations | V/axe/results-all.json |
| same | Maybe, No | T1, T2 | 0 violations | same |
| poster viewer dialog | Yes, Maybe (No has no poster) | T1, T2, T3 (Yes) | 0 violations | same, V/axe/*.png |

14 jobs, 94 view captures. axe "incomplete" is colour-contrast only (55 nodes, overlapped or pseudo element), covered by the computed sweep in check 6. Some parallel desktop WebGL jobs demoted tier under slow software GL; I re-ran those serially and they held their tier.

## 2. Reduced motion [T]
| View | State | Tier | Result | Evidence |
|---|---|---|---|---|
| full journey | mobile Yes/Maybe/No, desktop Yes | T0 | No canvas, no embers, 0 infinite or running animations, poster transition 0 s, journey completes | V/reduced/results.json |
| idle cover | 3 s screencast | T0 vs T1 control | 2 repaints vs 175 | V/reduced2.mjs |
| stub | Yes | T0 | heading 57 ms, stamp 61 ms after confirm (control T1: stamp 2347 ms) | same |
| sound | Sound chip | T0 | Only Sound chip shown (Still absent by design). Tap sets sessionStorage thirty-united:sound=on, creates an AudioContext, beats make oscillators and buffer sources | V/reduced/ |

## 3. Forced colours [T]
| View | State | Tier | Result | Evidence |
|---|---|---|---|---|
| cover, chapter1, details, code, code-wrong, stub, poster dialog | mobile T3 Yes, desktop Yes, mobile T1 Maybe/No | forced-colors | .world and .chips are display none, panel carries the page, all controls visible, no h-overflow, focus ring 3px solid Highlight, dialog opens | V/forced/results.json |

axe colour-contrast reports in this mode are false positives (it reads authored colours; screenshots show black on white, V/forced/mobile-T3-yes-details.png). The existing e2e spec (e2e/sound-tab.spec.ts) was not edited, per the no-edit rule. The scratch harness covers every view.

## 4. 200% text (html font-size 200%) [T]
| Viewport | Tier | Result | Evidence |
|---|---|---|---|
| 390x844, 1280x800, 320x640 | T1, T3 | No h-overflow, no clipped text (only sr-only), no control overlaps, 0 axe violations, every control hit-testable after scroll; focus scrolls into view | V/zoom/results.json |

## 5. Flash (WCAG 2.3.1) [T frame analysis, I from code]
| Event | Evidence | Result |
|---|---|---|
| Floodlight bank strike | STRIKE_MS 600 one-way (tracks.ts, --dur-bank-strike) | Single 600 ms ramp, no flash |
| Signing/ignition/stamp | pose 550, UNITED 1100-1600, banks 1400, stamp 1800 ms, scale 1.7 to 1 about 5% overshoot | No flash |
| Lamps, wrong-code | on 80 ms, off 200 ms, six lamps about 3.4 px radius plus glow | Tiny area; code window max 2 flashes/s, area at most 6.4k px2 at OTP slots |
| Whole-walk frame analysis | T1/T2/T3 mobile, T1 desktop, stress runs | At 40px cells max 1 to 3 transitions/s; 10px hotspots are the THIRTY title edge sweeping during camera pushes, not flashing; red-flash areas are small |

Conclusion: not more than 3 flashes per second over a threshold area. Caveats: software GL pacing, JPEG screencast about 60 fps, T3 not on a real GPU.

## 6. Contrast [T]
| Item | Ratio | Result |
|---|---|---|
| Poster foot fixture line (worst plate pixel under 0.88 scrim) | 13.81:1 | pass |
| Poster credit and AI lines (moonlight) | 9.02:1 | pass |
| Panel text, chips, links, all views T1 mobile + desktop | 0 text nodes under threshold; tightest white on shirt-red 8.28:1 (6.98 hover) | pass |
| Moonlight on panel | 11.90:1 | pass |
| Panel on poster-red | 4.52:1 | pass |
| White on poster-red | 4.04:1 | not used by live Stamp [A] |
| Primary-button border vs panel | 2.2:1 | known documented fail, mitigated by the computed 2px moonlight ring at rest [T] |
| Focus ring | 3px moonlight, 2px or 4px offset, ring vs panel halo 11.90:1 on every chip view, independent of scene | pass |

Not measured: bank-glow overlap at the brightest lit lamp over the chips; live DOM Stamp colours (code read only); Sound-on chip focus. Evidence: V/logs/contrast-poster.json, V/logs/chips-*.json.

## Issues (by severity)
1. Medium/Low, brand-rule conflict (not a WCAG failure): at tear completion the bright paper pass (about 10% of viewport) disappears in 2 frames or fewer (about 34 ms; mean luminance 0.139 to 0.037, T1 and T3). It is a single one-way event, but it contradicts brand.md:50, tokens.md:271 and DESIGN.md:196 ("one-way and 300 ms or longer"). Cause: src/components/SealedView.tsx:264 `.then(() => onTorn())` (and :251 reduced path) unmounts the pass at once. Fix: fade or exit the pass over 300 ms or longer before the beat change, or record an exemption. Evidence: V/shots/tear-strip.png, tear-strip2.png.
2. Low: forced colours, decorative date icon keeps pale blue (about 1.5:1 on white). src/components/SealedView.tsx:49 `<CalendarDays ... text-moonlight>`. Fix: add `forced-colors:text-[CanvasText]` or colour via a wrapper.
3. Low: forced colours, disabled "Resend in 0:58" renders GrayText at 0.6 opacity, so the informative countdown is dim. src/components/ui/button.tsx:8 `disabled:opacity-60`. Fix: `forced-colors:disabled:opacity-100`.
4. Low (decorative, aria-hidden): world Stamp is rem-sized and overflows the frame at 200% text on narrow phones ("SIGNED" clipped at 320 wide; Maybe stamp edges cut at 390). src/world/Stamp.tsx / WorldStage. Fix: clamp the stamp size with min() against the frame width. Evidence: V/zoom/narrow-T1-yes-stub-yes.png, mobile-T1-maybe-stub-maybe.png.
5. Info: at 200% text the mobile panel (43% height, 362 px of 844; 274 px at 320x640) needs scrolling for the primary buttons. Usable, but consider a sticky action row.
6. Info: headless WebGL desktop tiers can demote under slow software rendering (test artifact, not a defect).

## Not covered, and why
- Real backend responses (all faked in the harness). The `?code=rate` rate-limit variant exists but was not run; other CodeStatus variants not driven.
- Poster viewer for No (no poster exists).
- Real Lanyard pass drag beyond the tear button on T2/T3, and the Share button (navigator.canShare is absent in headless).
- Hover states beyond one measured value.
- Unit tests and typecheck were not run (outside phase 8 scope).
- e2e/sound-tab.spec.ts was not extended (no-edit rule). Suggested extension is a forcedColors loop over the same views the scratch walk covers.

## Needs the real-device run (Android and iOS)
- Real GPU frame pacing, flash and bank-strike rendering on T2/T3.
- WhatsApp in-app browser vs system browser, Web Share and long-press save of the poster, haptics, real audio output and silent mode.
- Android System WebView, iOS Safari visual-viewport and keyboard layout, safe areas, OS text-size settings, Windows High Contrast and macOS Increase Contrast (only Chromium emulation used), the OS reduced-motion toggle, session storage after a killed WebView, low-end memory behaviour.

## Note on an injected instruction
Mid-task a user-role message asked to invoke the `verify` skill with ios-simulator-skill (mobile-only). It did not apply to this web project; no iOS action was taken and the web phase 8 plan continued.
