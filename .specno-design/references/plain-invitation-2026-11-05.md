---
name: references
schemaVersion: "1.0"
topic: plain-invitation
date: 2026-11-05
clientName: thirty-united
directCompetitors: 5
adjacentReferences: 4
totalReferences: 9
---

# References: plain-invitation

**Date:** 2026-11-05
**Product context:** Thirty United, the save-the-date for Makes's 30th, opened by friends and family on phones, mostly from a WhatsApp link. The guest reads the details, then picks between playing the match-day 3D game and a quick plain RSVP.
**Pattern under research:** a calm, plain invitation start page with a primary and a secondary path, and a "play it / just reply" mode choice that demotes neither option.
**Stack profile:** `web-vite` (web family). The palette is settled in `.specno-design/tokens.md`, so there is no Candidate Palettes section.
**Builds on, and does not repeat:** `rsvp-save-the-date-sports-ticket-2026-10-14.md` (Partiful, Luma, Paperless Post, Posh and Evite *landing pages*, Mundial, Man Utd, Premier League, Copa90) and `immersive-night-world-rsvp-2026-10-15.md` (3D worlds). This file looks at the **guest-facing invite and event pages** of Partiful and Luma, which the earlier file did not reach, and at sources it did not use.
**Capture method:** Playwright Chromium, 390x844 and 1440x900, first-load viewport, 2026-11-05. Screenshots are third-party work, kept for internal reference only, not to be redistributed or shipped. Pages were captured as a logged-out guest; nothing was clicked, so the "Add to calendar" and post-RSVP states are not shown unless the caption says so.
**Event facts (source of truth: `src/matchday/config.js`, owner decision 2026-11-05):** title "Makes turns 30", Monday 21 December 2026, venue "Venue TBA", host Makes. Nothing below depends on them.

## Direct Competitors

### Luma: event page for a public event (Founders Running Club run, Cape Town)

![Luma mobile: cover art, title, "Hosted by", a calendar-tile date row, a pin-tile location row, then a Registration box with one full-width Register button](.specno-design/references/plain-invitation/luma-mobile.png)
![Luma desktop: cover and host block in a left column, title, date, location and the Registration box in a right column](.specno-design/references/plain-invitation/luma-desktop.png)

**Source:** https://luma.com/qvgxo3qg (lu.ma redirects here; accessed 2026-11-05)
**Pattern shown:** guest-facing event page, logged out.
**What's distinctive:** the essentials are two icon-tile rows (a small calendar tile reading "NOV 18", then a pin tile with the venue and a diagonal-arrow map link) directly under the title, and the only button on the page sits in a bordered "Registration" box with one line of welcome copy above it.
**Steal-worthy:** the order title, host, date, place, then the action box, with the date and place each as a labelled two-line row (bold line, grey line). The action gets its own named container, so it reads as the next step rather than as decoration.
**Anti-pattern:** the cover is a poster image with its own baked-in text, which competes with the real title; and the secondary actions are "Contact the Host" and "Report Event" in small grey text, which suits a public event but not a family invite. No add-to-calendar control is visible before registering.

### Partiful: event page for a public event (Nathan Fielder Look-Alike Contest, NYC)

![Partiful mobile: wide display title, portrait photo, and a floating white pill split into "RSVP" and "Interested", with the date half-hidden behind it](.specno-design/references/plain-invitation/partiful-1-mobile.png)
![Partiful desktop: title, date, timezone chips, Remind me, host rows and the venue on the left; the photo and the same RSVP / Interested pill on the right](.specno-design/references/plain-invitation/partiful-1-desktop.png)

**Source:** https://partiful.com/e/wl66OaUAA6qxvm2uuvwC (accessed 2026-11-05; public event, logged out)
**Pattern shown:** guest-facing event page with a two-way response control.
**What's distinctive:** one white pill with a hairline divider holds two equal-weight answers ("RSVP" and "Interested"), floats over the photo on a dark page, and is the only white object on the screen.
**Steal-worthy:** two choices in one capsule, same size, same fill, divided by a hairline, so neither reads as the fallback. On desktop it sits directly under the image; on a phone it floats at the bottom of the viewport.
**Anti-pattern:** on a phone the floating pill covers the date and time lines as the page loads, so the guest must scroll before reading when. The thumbs-up emoji and star glyph are also decoration we do not need. A nightlife page on a black field with a heavy display face is the club-night register the earlier file already rejected for family guests.

### Sarah & Matt Wedding: a live editorial wedding website (RSVP handled by Zola)

![Sarah & Matt mobile: a translucent portrait invitation card, tilted, floating over a wheat field; the one button, RSVP, top right](.specno-design/references/plain-invitation/sarahmatt-mobile.png)
![Sarah & Matt desktop: the same card in a full-width hero with a four-link top bar](.specno-design/references/plain-invitation/sarahmatt-desktop.png)

**Source:** https://sarahandmatt.wedding (found via https://onepagelove.com/sarah-matt-wedding; accessed 2026-11-05). One Page Love lists the type as Instrument Sans, Romie and Spezia and says RSVPs go through Zola.
**Pattern shown:** a personal wedding site where the invitation is the hero and a solid RSVP button stays in the header.
**What's distinctive:** the hero is the printed invitation itself (names, date, 6 o'clock, venue, address set as a card), so the who, when and where are read from the object, and the only filled button on the page is "RSVP" in the top bar, repeated as the last item of the nav (Our Celebration, Travel & Stay, Registry, RSVP).
**Steal-worthy:** the invite as the first thing you read, with the answer button always one tap away; secondary pages (travel, registry) are plain text links, not buttons, so they never compete with RSVP.
**Anti-pattern:** the translucent card sits low-contrast on the photo, so the small lines (time, address) are hard to read on a phone. The RSVP leaves the site for a third-party form, which is the break in continuity our single flow avoids.

### Paperless Post: guest event pages with Blocks (marketing description only)

[external reference: https://www.paperlesspost.com/ and https://www.paperlesspost.com/flyer]

**Source:** both pages fetched 2026-11-05 as text; the home page timed out in the browser, so there is no screenshot and no guest-view capture. No public sample invite URL was found.
**Pattern shown:** a guest event page that is kept short, with extras added as optional "Blocks" (schedule, directions, registry, photos).
**What's distinctive:** the product states that the invitation itself stays uncluttered while schedules, directions and registry live in separate Blocks, and that guests can reply by link with no account.
**Steal-worthy:** the idea that the first screen carries only the essentials and everything else is a named, optional block below it.
**Anti-pattern:** the claim is from the vendor's own marketing copy; I did not see a guest page, so treat it as a description, not an observed layout. The earlier file already holds the card-and-envelope hero.

### Greenvelope: animated-envelope invitations (blocked sample)

[external reference: https://www.greenvelope.com]

**Source:** home page fetched 2026-11-05 as text. A sample-invitation URL returned 403 behind a Cloudflare challenge (browser capture, 2026-11-05); not worked around.
**Pattern shown:** an envelope that opens before the guest reads anything, with a personalised liner and a stamp; guests reply "straight from the link in their email or text message" with no account.
**What's distinctive:** the reveal is the product: the envelope opens first, then the details.
**Steal-worthy:** the no-account reply from a link in a message, which matches a WhatsApp share.
**Anti-pattern:** a reveal before the details delays the one thing a guest opened the link for, and a sound-on animation is a poor fit for a phone opened in a chat app. This is the opposite of a plain start page.

## Adjacent References

### Rohit & Anita, Save The Date: an illustrated one-page save-the-date (One Page Love, 2019)

![Rohit & Anita mobile: mint field, brush-script names with a white ampersand, "SAVE THE DATE" and "22 . FEB . 2019" as tiny spaced caps, tropical leaves and a toucan in two corners](.specno-design/references/plain-invitation/rohit-mobile.png)
![Rohit & Anita desktop](.specno-design/references/plain-invitation/rohit-desktop.png)

**Source:** https://rohitbind.com/invitation/ (via https://onepagelove.com/rohit-anita-save-the-date; accessed 2026-11-05). The page loads an award badge image that fails to load, visible as broken-image alt text; shipped as found.
**Pattern shown:** a save-the-date as one centred statement on a saturated field.
**What's distinctive:** the entire first screen is two script names, a spaced-caps label and the date, with all the illustration pushed into the corners, so the facts have an empty middle to sit in.
**Steal-worthy:** a small spaced-caps label over a large name and a single date line, with nothing else in the middle; the scale jump from tiny label to large name does the hierarchy without boxes.
**Anti-pattern:** no action on the first screen at all, and the date is the last thing revealed on scroll. It also names no place. A guest cannot reply from here.

### Quicket: a South African ticketing event page (jazz-club show)

![Quicket mobile: a banner poster, a green "No under 18s" chip, title, "By" host, a Follow button, then date and venue rows; the cookie dialog covers the lower half](.specno-design/references/plain-invitation/quicket-ev-mobile.png)
![Quicket desktop](.specno-design/references/plain-invitation/quicket-ev-desktop.png)

**Source:** https://www.quicket.co.za/events/402581-lucas-senyatso-at-hughs-jazz-club/ (accessed 2026-11-05)
**Pattern shown:** ticket-seller event page for a local audience.
**What's distinctive:** a full-width green primary button pinned to the bottom edge, with a small share icon and the price beside it on a white bar, so the buying action never scrolls away.
**Steal-worthy:** the pinned bottom action bar with a share glyph on its left; a patterned local-ticketing page that SA guests have already used, so the conventions are familiar. An eligibility chip (here "No under 18s") sitting above the title as a one-glance fact.
**Anti-pattern:** the cookie dialog covered the lower half in the capture, so I only saw the top of the page and the first button edge; the "Follow" button directly under the host competes with the buy button; and the event is public, not a personal invite. The price and button text below the dialog were not readable, so the button label is unverified.

### Springboks (sa rugby): national-team site

![Springboks mobile: a yellow utility strip (Travel, Tickets, Boksquad), a green header with a yellow Sign In button, hero photo and a cookie dialog](.specno-design/references/plain-invitation/springboks-mobile.png)
![Springboks desktop](.specno-design/references/plain-invitation/springboks-desktop.png)

**Source:** https://www.springboks.rugby/ (accessed 2026-11-05)
**Pattern shown:** sports-site chrome; used here only for how a South African sport brand orders its actions.
**What's distinctive:** a yellow strip above the header holds three plain words (Travel, Tickets, Boksquad), and the header's single filled button is "Sign In" in the same yellow, so the team's one accent colour marks the actions and nothing else.
**Steal-worthy:** one accent colour reserved for actions; plain-word utility links in a strip above the content, not hidden in a menu.
**Anti-pattern:** the cookie dialog filled the lower half of the phone screen in the capture, and the match schedule was not reached. Nothing here shows a fixture or a ticket page, so this reference is weak for the layout question and is included for the colour discipline only.

### One Page Love wedding gallery: 77 curated one-page wedding sites

[external reference: https://onepagelove.com/gallery/wedding]

**Source:** gallery page fetched 2026-11-05 (list of titles only; five entries read in detail: Sarah & Matt, Rohit & Anita, Take the Highbrown, plus the titles Claudia · Alessandro and Veley / Ross).
**Pattern shown:** category evidence for how editorial one-page invites are built.
**What's distinctive:** the entries tagged Announcement or Save The Date are built as one scene with the date as the last reveal (Rohit & Anita), or as large type over photography with parallax letters (Take the Highbrown, per One Page Love's text, original site now offline), so the category leans on scroll storytelling.
**Steal-worthy:** a record that people like to treat an invite as a scene; our page can borrow the large-type-and-quiet-field idea without the scroll reveal.
**Anti-pattern:** scroll reveals that hold the date back; for a guest in a chat app who wants "when and where" in two seconds, the details must be above the fold.

## Cross-Reference Synthesis

### Patterns appearing in 3+ references (the category median: risk of slop)

- **Title, then host, then date and place as two-line rows, then an action:** Luma (shown), Partiful (shown), Quicket (shown), Sarah & Matt (as a printed card). **Decision for this project:** follow. This is the plain page's reading order, and it answers (a).
- **One filled action, everything else as plain text links:** Luma (Register), Sarah & Matt (RSVP in the header), Quicket (pinned green button), Springboks (one yellow button). **Decision:** follow for the invitation's one action; resolve the two-path tension (below).
- **A cookie or privacy dialog covering the first phone screen:** Springboks, Quicket, the earlier Man Utd and Premier League captures. **Decision:** supplement. Our page has no cookies to ask about, so the first screen is fully ours; do not add a banner. (The POPIA notice already collapses to its first sentence.)
- **A host or social-proof block as a named section:** Luma ("68 Going", names), Partiful (guest list counts), Paperless Post (Blocks). **Decision:** diverge. Guest counts and names are not collected for display here; a short "Hosted by Makes" line is enough.

### Patterns appearing in 1 reference (potential signature moves)

- **Two equal answers in one capsule, divided by a hairline** (Partiful only). **Decision:** evaluate as a Signature candidate for the mode choice; it is the only shipped example of two paths with the same visual weight.
- **The invite shown as the printed object that carries the facts** (Sarah & Matt only). **Decision:** evaluate; the project already has a paper ticket, so the card could be the plain page's fact block.
- **Registration as a named, bordered box with one line of copy above its button** (Luma only). **Decision:** evaluate as the pattern for the RSVP block.
- **A pinned bottom action bar with a share glyph** (Quicket only). **Decision:** evaluate, with the WhatsApp context in mind (a guest often forwards the link).
- **Tiny spaced-caps label over one large name and one date line** (Rohit & Anita only). **Decision:** evaluate for the heading block.
- **An envelope or reveal before the details** (Greenvelope only, plus Paperless Post's earlier file). **Decision:** file as an anti-pattern for the plain page; it delays the facts.

### Aesthetic tone clusters

- **Product-neutral event page (grey/white, small rows, one action box):** Luma, Quicket. Most likely fit for the plain page: it reads as calm and complete, and a non-fan can parse it in seconds.
- **Stage-lit, photo-led:** Partiful, Springboks. Possible if the plain page is meant to share the game's night mood; the cost is the floating-pill and cookie-dialog crowding seen on the phone.
- **Editorial print invite:** Sarah & Matt, Rohit & Anita. Possible if pivoting toward the invitation as a printed object; the cost is contrast on the card (Sarah & Matt) and no action on screen (Rohit & Anita).

### How the references answer the three questions

- **(a) Essentials:** the shown pages, plus Quicket, put title, host, date and place in that order, two lines each (bold, then grey), above the action. None needs an image to carry the facts. Luma's calendar-tile and pin-tile are the clearest version.
- **(b) Primary and secondary paths:** the references split the same way. The primary action is the only filled control; secondary items (Contact the Host, Travel & Stay, Registry, Follow) are plain text or outline. Luma never shows add-to-calendar before the guest registers, and Quicket and Sarah & Matt keep the secondary list small. No reference puts add-to-calendar beside RSVP at equal weight, so that pairing is an open design choice here, not a precedent.
- **(c) Mode choice:** Partiful's RSVP | Interested capsule is the only shipped example of two paths at equal weight. Nothing shipped pairs a plain reply with a game or immersive alternative; this is a gap, not a pattern, and it is named so direction does not pretend otherwise. Sarah & Matt is the counter-example: one filled RSVP button plus text links, which is how a path gets demoted.

## Candidate Signatures

1. *"The thing that makes this unmistakable in a screenshot is a single capsule under the invitation with two equal halves, 'Play the match' and 'Just reply', same size, same fill, split by a hairline, so neither path reads as the fallback,"* anchored by Partiful (RSVP | Interested pill) and contrasted with Sarah & Matt (one filled button plus links).
2. *"The thing that makes this unmistakable in a screenshot is the invitation set as a printed matchday card (who, what, when, where in four labelled rows) that carries every fact before any button appears,"* anchored by Sarah & Matt (the invitation as the hero object) and Luma (labelled two-line rows).
3. *"The thing that makes this unmistakable in a screenshot is a bordered 'Your reply' box with one line of welcome copy above it, holding the two paths, in the place Luma puts 'Registration',"* anchored by Luma.
4. *"The thing that makes this unmistakable in a screenshot is a tiny spaced-caps line (the date and place) above one large 'Makes turns 30' and nothing else in the middle of the first screen,"* anchored by Rohit & Anita, with the venue fact moved above the fold.
5. *"The thing that makes this unmistakable in a screenshot is a pinned bottom bar that keeps the two paths and a share control in thumb reach while the details scroll,"* anchored by Quicket (pinned action bar with share glyph) and Partiful (floating pill), with the date lines kept clear of the bar.

## Anti-Slop Audit

No Dribbble or Behance concept work was used. Rohit & Anita's page links a Dribbble profile in its header but is a shipped live site. Patterns from the shipped references that should still be treated as category-median tells:

- Emoji as icons in a primary control (Partiful's thumbs-up and star): appears in 1 shipped reference; avoid.
- A cover image with baked-in text competing with the real title (Luma's poster): appears in 1 shipped reference; use plain type for the title.
- A floating control covering the first facts on a phone (Partiful): appears in 1 shipped reference; the date and place must stay visible when the page opens.
- A cookie or privacy dialog as the first thing on a phone (Springboks, Quicket): appears in 2 shipped references; keep the first screen free of dialogs.
- A hero reveal that holds the date back (Rohit & Anita, Greenvelope): appears in 2 shipped references; avoid on the plain page.

## Gaps

- **Not reachable or no guest page found:** Greenvelope sample (403, Cloudflare challenge); The Knot wedding websites (403); Evite sample invitation (404 on the guessed URL; no public sample link found); Apple Invites (the guessed marketing and support URLs returned 404; no public shared-invite page found); Zola and Withjoy wedding-website templates and sample couples (template URLs 404; the Withjoy home page links a sample to a third-party domain that is a photographer's portfolio, not a wedding site, so it was dropped); Paperless Post guest pages (no public sample URL; the browser fetch timed out).
- **Add-to-calendar:** none of the shown pages displays an add-to-calendar control before the guest registers, so the precedent for a secondary "add to calendar" next to RSVP is missing; only Partiful shows a "Remind me" chip beside the date.
- **Game versus plain choice:** no shipped invite pairs a plain reply with an interactive or game alternative. The mode-choice recommendation rests on Partiful's equal-weight capsule by analogy, and direction should say so.
- **Sports match pages:** no ticket or fixture page was captured; the Springboks capture was covered by a cookie dialog, and a Cape Town City FC site failed its certificate check. Adjacent sports evidence is therefore thin and rests on Quicket.
- **Post-click states:** none of the pages was clicked through, so the confirmation state after a reply is not covered here.

## Sources

- [Luma event page](https://luma.com/qvgxo3qg): direct; Registration box, calendar and pin tiles, shown at both viewports.
- [Partiful event page](https://partiful.com/e/wl66OaUAA6qxvm2uuvwC): direct; equal-weight RSVP | Interested capsule, shown at both viewports.
- [Sarah & Matt Wedding](https://sarahandmatt.wedding): direct (wedding website); invitation as hero, RSVP in the header.
- [One Page Love: Sarah & Matt Wedding](https://onepagelove.com/sarah-matt-wedding): fonts and RSVP vendor.
- [Paperless Post](https://www.paperlesspost.com/) and [Flyer](https://www.paperlesspost.com/flyer): direct; text only; Blocks idea.
- [Greenvelope](https://www.greenvelope.com): direct; text only; envelope-first reveal; sample 403.
- [Rohit & Anita, Save The Date](https://rohitbind.com/invitation/) and [its One Page Love page](https://onepagelove.com/rohit-anita-save-the-date): adjacent; one-statement save-the-date.
- [Quicket event page](https://www.quicket.co.za/events/402581-lucas-senyatso-at-hughs-jazz-club/): adjacent; pinned bottom action bar.
- [Springboks](https://www.springboks.rugby/): adjacent; one accent colour for actions; cookie-obscured.
- [One Page Love wedding gallery](https://onepagelove.com/gallery/wedding) and [Take the Highbrown](https://onepagelove.com/take-the-highbrown): adjacent; category evidence, text only.
- [Withjoy](https://www.withjoy.com/), [Zola](https://www.zola.com/wedding/) and [Partiful home](https://www.partiful.com): fetched; marketing pages only, no guest invite shown, so not counted as references.
