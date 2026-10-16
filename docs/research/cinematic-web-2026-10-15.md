# Cinematic web in 2026: what is achievable for Thirty United

Research brief for the design lead. Findings only; no design recommendation is made.
All sources were accessed on 2026-10-15 unless a different date is given. "Unverified" marks anything I could not confirm from a primary source. Screenshots are in `cinematic-web-2026-10-15/` next to this file.

## Summary: five findings that matter most

1. **The "WhatsApp in-app browser" premise is not confirmed by any Meta source, and the evidence leans the other way for personal chats.** Felix Krause's 2022 audit says WhatsApp on iOS opened Safari, not an embedded view. WhatsApp's 2025 in-app browser covers only business template call-to-action buttons and payment links; ordinary links still open in the default browser. Android behaviour for plain chat links is unconfirmed. Section 4 gives both branches.
2. **If links open in Safari or Chrome, most constraints disappear.** Web Share with files, the motion-sensor permission prompt and WebGL2 all work on the system-browser rows of MDN's compatibility data. If they open in a WebView, Android System WebView has no `navigator.share` at all (MDN, BCD 8.1.5).
3. **Claude can author a large share of the look in code, with public receipts.** Guronnimo's "touch grass" post (2026-10-08, about 193K views) says "One shotted with Opus 5.5". The flxrnc Motion Lab article documents three Opus 5.5 pieces with every prompt and follow-up. Opus 5.5 outputs code, not pixels, and checks frames by rendering stills. The Motion Lab author states it cannot hear, so audio is synthesised and checked by measurement.
4. **The photo-real hero figure and the moonlit poster still need external assets.** Layer splitting (Qwen-Image-Layered, Apache-2.0), background removal, depth maps and image-to-video all have current tools. Several have licence traps: Depth Anything V2 Base/Large and RMBG-2.0 are non-commercial; Hunyuan3D 2.x excludes the EU, UK and South Korea.
5. **Licensing and gating differ per tool, and some moved recently.** Sora 2 left the API on 2026-09-24. Suno downloads are paid-only with monthly caps, and Udio downloads were reported disabled. ElevenLabs free-plan sound effects require attribution. Meshy free output is CC BY 4.0.

---

## 1. State of the art in cinematic web experiences (2024 to 2026)

### 1.1 Method and coverage gaps

I pulled examples from Awwwards pages and from three roundup articles (Utsubo, Hontran, Digital Strategy Force). For each live site I loaded it in headless Chromium with an iPhone 14 profile and software WebGL (SwiftShader) and waited 9 seconds. That is emulation: it is not WKWebView, not a real GPU, and not the WhatsApp view. Several sites sat on a loader or gate at the capture time, and the captions say so.

Gaps:
- **Football and club campaigns (Nike, adidas, EA FC, clubs):** I found no Site of the Day, Site of the Month or FWA winner. The Awwwards sport category lists three football entries, none of them SOTD ([Awwwards sport](https://www.awwwards.com/websites/sport/)): *World Cup, The Immortals* (Jason Jerez, Honorable Mention, 2026-08-03), *WC 2026 Data Portraits* (aleksandr-bogachev, no badge), *United in Football* (Till Janek, Honors, July 2026). I did not open them. Manchester United's 2026/27 kit launches turned up in search as news items only ([manutd.com](https://www.manutd.com/en/news/united-and-adidas-launch-new-home-kit-for-202627-season)); whether any has a WebGL microsite is unverified.
- **Anime-styled web experiences:** no award-listed site found. What exists is tooling: [xymeow/three-anime-style](https://github.com/xymeow/three-anime-style) (cel shading, outlines, painted backgrounds, film effects, targets three.js r186) and [sdshan8/Three-js-Anime-Shader](https://github.com/sdshan8/Three-js-Anime-Shader).
- **Interactive invites:** no award-winning WebGL invite found. The closest result was a 2013 three.js Christmas card ([Experiments with Google](https://experiments.withgoogle.com/christmas-tree)).

### 1.2 Examples

Awards are as reported by the cited article unless I say otherwise. Mobile column: "emulated" means my headless iPhone 14 capture; it does not prove performance on a phone.

| # | Site | What makes it cinematic | Technique (source) | Mobile | Screenshot |
|---|---|---|---|---|---|
| 1 | [Lando Norris](https://landonorris.com/) (OFF+BRAND) | Awwwards Site of the Year 2025, 43 votes; users' choice 596 votes ([Awwwards winners](https://www.awwwards.com/annual-awards/winners)). Hero uses oversized type over a contour-line world with a "tap to lock" control. | I counted 21 canvas elements and a WebGL2 context. Stack not documented in a source I could open. | Loads on emulated iPhone 14 and shows a touch control | `landonorris-mobile.png` |
| 2 | [Oryzo](https://oryzo.ai/) (Lusion) | Product hero with depth-of-field blur, giant type and a video inset. Awwwards Site of the Month April 2026, Developer Award ([Utsubo](https://www.utsubo.com/blog/best-threejs-websites-2026)). | Three.js product render, inertial easing, Z-axis depth scroll (Utsubo). I counted 6 canvases, 2 videos. | Renders on emulated iPhone 14 | `oryzo-mobile.png` |
| 3 | [IVRESS "Spin a Tale"](https://brand.ivress.co.jp/) (Utsubo) | Seven scenes that loop back to the first, with continuous camera and material transitions in place of cuts. FWA Site of the Month May 2026, Awwwards SOTD 2026-06-28 ([Utsubo storytelling guide](https://www.utsubo.com/blog/immersive-storytelling-websites-guide)). | WebGPU with TSL shaders; the Three.js roundup says WebGL fallback. | Capture stuck at the 0% loader at 9 s (software GL). Mobile behaviour unverified. | `ivress-mobile.png` |
| 4 | [Santioni Spirits, Notturno](https://santionispirits.com/) (Active Theory, sound by plan8) | Black-and-white comic panels with one spot colour; progress is hold-to-advance and the audio builds against the hold. FWA of the Day 2026-08-18, FWA of the Month August 2026 (Utsubo guide). | Stack not named in the article. | My emulated capture returned a "Not Supported" page. Could be headless detection; unverified. | `santioni-notturno-mobile.png` |
| 5 | [Where Worlds Take Shape](https://paodao.fr/) (paodao) | Playable open world with procedural grass, parallax occlusion mapping and mini-games. Awwwards SOTD 2026-05-03 (Utsubo guide). | Playable WebGL; touch and gamepad listed as inputs. | In portrait my capture showed a "rotate your device" gate (French text), so the experience expects landscape | `paodao-mobile.png` |
| 6 | [Ponpon Mania](https://ponpon-mania.com/) | Interactive comic, chapters laid out like album tracks. SOTD 2025-10-22, Developer Award, Site of the Month October 2025 (Utsubo guide). | OGL (WebGL), Nuxt, GSAP, Matter.js, Lenis (Utsubo guide). | Renders on emulated iPhone 14; article says the runtime suits mid-range phones | `ponpon-mania-mobile.png` |
| 7 | [Why Zero](https://why.zero.university/) | Scroll-driven 3D parallax with gated sections. Awwwards SOTD 2026-09-07 (Utsubo guide). | I counted 1 canvas and 2 videos. | Renders on emulated iPhone 14 | `why-zero-mobile.png` |
| 8 | [Explore Primland](https://explore.ownprimland.com/) | 3D landscape flythrough with fog and a scroll-driven camera. Awwwards SOTD February 2026 ([Utsubo](https://www.utsubo.com/blog/best-threejs-websites-2026)). | I counted 1 canvas, 1 video, 1 audio element. | Renders on emulated iPhone 14 | `primland-mobile.png` |
| 9 | [Sleep Well Creatives](https://sleep-well-creatives.com/) | Scroll-driven illustrated 3D narrative. Awwwards SOTD January 2026 (Utsubo). | I counted 1 canvas, 14 videos, 7 audio elements. | Opens on an "Enter Site" gate: a tap-to-enter pattern that doubles as an audio unlock | `sleep-well-mobile.png` |
| 10 | [Lacoste Ace Breaker](https://members-play.lacoste.com/ace-breaker-rg/gb/en/) | Branded Roland-Garros brick-breaker game; Awwwards nominee only (Utsubo). | Three.js/WebGL (Utsubo). | Renders on emulated iPhone 14 | `lacoste-ace-breaker-mobile.png` |
| 11 | [Bruno Simon](https://bruno-simon.com/) | Drivable 3D portfolio. The PR in 3.2 cites it as an inspiration; I did not source its awards. | I counted 1 canvas. | Shows a "CLICK TO START" prompt with a sound icon (a tap gate before audio) | `bruno-simon-mobile.png` |
| 12 | [Shopify Editions Spring 2026](https://www.shopify.com/editions/spring2026) | Scroll-sequenced reveal, particle-dispersing type, depth-layered panels (Utsubo). | I counted 13 videos and no canvas, so it is video and layered DOM rather than WebGL. | Renders on emulated iPhone 14 | `shopify-editions-mobile.png` |
| 13 | [Cartier Watches & Wonders 2026](https://www.cartier.com/en-fr/watchesandwonders) (Immersive Garden) | Six 3D alcoves with a Web Audio score; Awwwards SOTD per Utsubo. Immersive Garden is Awwwards Agency of the Year 2025 ([Awwwards winners](https://www.awwwards.com/annual-awards/winners)). | Three.js, GLSL, GSAP, Lenis, Web Audio (Utsubo). | My capture got "Access Denied" (bot block); no screenshot kept. Mobile unverified. | none |
| 14 | [Hubtown](https://hubtown.co.in/) (Unseen Studio) | 3D monolith hero with mouse-reveal; Awwwards SOTD June 2026 (Utsubo). | Three.js, WebGL, GSAP (Utsubo). | Not captured. Mouse-reveal is a pointer interaction; touch behaviour unverified. | none |

Context numbers, all from one third-party source and so low-confidence: Digital Strategy Force says 29 of 47 Q1-2026 Site of the Day winners used Three.js, and that immersive 3D accounts for 61 percent of Q1-2026 SOTDs against 23 percent in Q1 2024 ([article](https://digitalstrategyforce.com/journal/why-are-immersive-experiences-dominating-the-2026-awwwards/)). I could not corroborate either.

Hontran's guide says jurors test on real devices and cites a 3D hero dropping to 18 fps on a mid-range Android as a failure, with about 60 fps the target ([Hontran](https://www.hontran.dev/blog/best-award-winning-websites-2026)). Author is a studio that built the sites it lists; treat as opinion.

Also captured, no table row: `igloo-mobile.png` (igloo.inc, blank, 0 canvases) and `getinform-mobile.png` (getinform.co, 0 canvases). Neither was assessed; both come from the Tarnn PR's inspiration list.

### 1.3 Patterns visible across the set
- **Entry gate before audio:** Sleep Well ("Enter Site"), Bruno Simon ("CLICK TO START" with a speaker icon). Observed in my captures.
- **Orientation gate:** Paodao asked for landscape.
- **Loader with progress:** IVRESS shows a percentage counter.
- **Hold-to-advance and scroll choreography** in Santioni and Why Zero (Utsubo guides).

---

## 2. AI asset pipelines available now (October 2026)

Prices are list prices found on the cited page. Where only aggregators carried a number I say so.

### 2.1 Crest-free layered poster (figure separate from background)

| Option | What it does | Cost | Output | Licence | Source |
|---|---|---|---|---|---|
| Qwen-Image-Layered | Splits one image into multiple RGBA layers (examples with 3, 4 and 8 layers; layers can be split again). Runs in ComfyUI. | Free weights. Needs CUDA (quick-start uses bf16). Hugging Face Space and Replicate hosts exist. | Numbered PNG layers; the Gradio app exports PPTX, ZIP or PSD | Apache-2.0 | [GitHub](https://github.com/QwenLM/Qwen-Image-Layered), released 2025-12-19; [ComfyUI wiki](https://comfyui-wiki.com/en/tutorial/advanced/image/qwen/qwen-image-layered) notes it is slow |
| Re-generate with an image model, prompting "no crest, separate background plate" | Gemini image models (Nano Banana family) via API | Nano Banana 2.1 $0.0336 (1K) to $0.113 (4K) per image; Nano Banana Pro $0.134 (1K/2K); batch is about half; no free tier | PNG/JPEG | Google API terms not read; unverified | [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) |

Notes: the owner's current image tool is not named in the brief, so I did not research its terms. Whether any model can reliably remove a club crest and keep the figure consistent is untested by me. Using a club's crest or kit marks commercially is a trademark question I did not research.

### 2.2 Background removal

| Tool | Licence | Browser option | Source |
|---|---|---|---|
| BiRefNet | Repo is MIT; ONNX exports provided in GitHub releases. The README does not state weight terms separately. | A third-party tool (SafeResize) runs BiRefNet_lite in-browser via ONNX Runtime Web | [GitHub](https://github.com/ZhengPeng7/BiRefNet) |
| BRIA RMBG-2.0 (built on BiRefNet) | CC BY-NC 4.0; commercial use needs an agreement with BRIA | Transformers.js usage shown on forks | [Bria-AI/RMBG-2.0](https://github.com/Bria-AI/RMBG-2.0); BiRefNet README warns the weights are non-commercial |
| Qwen-Image-Layered (see 2.1) | Apache-2.0 | no | above |

### 2.3 Monocular depth for 2.5D parallax

| Model | Licence | In-browser | Source |
|---|---|---|---|
| Depth Anything V2 Small (24.8M) | Apache-2.0 | Transformers.js real-time demo listed by the project; HF `pipeline` supported since 2024-07-06 | [GitHub](https://github.com/DepthAnything/Depth-Anything-V2) |
| Depth Anything V2 Base / Large | CC-BY-NC-4.0 | same | same |
| Depth Anything 3 Small and Base | Apache-2.0 | community 8-bit ONNX of V3 Small is about 28.9 MB (secondary source, [HF](https://huggingface.co/en970/depth-anything-v3-small-onnx)) | [GitHub, released 2025-11-14](https://github.com/ByteDance-Seed/Depth-Anything-3) |
| Depth Anything 3 Large, Giant, Nested | CC BY NC 4.0 | not checked | same |

Precomputing a depth PNG offline avoids shipping any model to the phone. WebGPU is available in WebView Android 121+ and iOS 26+ per MDN (see 4.2); WebGL/WASM paths are the older fallback. Not benchmarked here.

### 2.4 Image-to-video for a short loop

Prices are official API list prices checked by Teamday on 2026-09-23 ([article](https://www.teamday.ai/blog/best-ai-video-models-2026)), except Veo, which I confirmed on Google's page.

| Model | Max clip | Max res | $/second (720p unless noted) | Image-to-video | Audio |
|---|---|---|---|---|---|
| Veo 3.1 Standard | 8 s | 4K | 0.40 (1080p 0.40; 4K 0.60) | yes | always on |
| Veo 3.1 Fast | 8 s | 4K | 0.10 (1080p 0.12; 4K 0.30) | yes | always on |
| Veo 3.1 Lite | 8 s | 1080p | 0.05 (1080p 0.08) | yes | always on |
| Kling 3.0 | 3 to 15 s | 4K | 0.084 silent, 0.126 with audio | yes | optional |
| Runway Gen-4.5 | 10 s | 720p (API) | 0.12 | yes | no (API) |
| Luma Ray 3.2 | 10 s | 1080p | 0.06 (1080p 0.24) | yes (keyframes) | no (API) |
| Wan 3.0 | 30 s | 1080p | 0.083 | yes | yes |
| Seedance 2.0 | 15 s | 1080p | about 0.15 | yes | yes |
| Sora 2 | n/a | n/a | n/a | n/a | n/a |

- Veo 3.1 has no free API tier; billing only on successful generations ([Google](https://ai.google.dev/gemini-api/docs/pricing)).
- Sora 2: Teamday says OpenAI removes it from the API on 2026-09-24. Secondary source for the date, but two sources agreed.
- Commercial-use terms for Veo, Kling, Runway and Luma were not found in any source I opened. Unverified; read each provider's terms.
- Loop support (first and last frame matching): Veo accepts optional start and end frames per one third-party description ([benchlm](https://benchlm.ai/md/media-pricing/veo.md)); I did not verify the quality of loops from any model.

### 2.5 Image-to-3D (stylised figure as GLB), rigging and animation

| Tool | Cost found | Licence found | Rig / animate | Source |
|---|---|---|---|---|
| Meshy | Free 100 credits/month; Image to 3D 20 credits on Meshy 6 and 7, 25 on Meshy 7 image-to-3D; paid plans around $20 for Pro (aggregators only) | Free: CC BY 4.0 (attribution required), you own output. Pro: private licence, full commercial use | Rigging 0 credits, Animate 0 credits per clip | [Meshy docs](https://docs.meshy.ai/en/webapp/pricing); GLB not mentioned on that page |
| Tripo | Aggregators: Pro $19.90, Max $89.90, Team $109.90/month; free 200 to 300 credits (sources disagree) | Aggregators: free models public under CC BY 4.0; private and commercial need paid. Official page returned 403. | Not confirmed | [Costbench](https://costbench.com/software/ai-3d-generation/tripo-ai/) (secondary) |
| Hunyuan3D 2.0 and 2.1 (open weights) | Free to run | Tencent community licence; Territory excludes the EU, UK and South Korea | Not in scope of what I found | [HF licence for 2.0](https://huggingface.co/tencent/Hunyuan3D-2/blob/main/LICENSE), [2.1 licence](https://gitserver.onethingai.com/ai-models/Hunyuan3D-2.1/raw/branch/main/LICENSE) (mirror) |
| Hyper3D Rodin | Aggregators: Creator $24, Business $120/month; API about $0.80/generation (secondary) | Only Business tier clearly states commercial licence (one third-party breakdown) | Not confirmed | [Costbench](https://costbench.com/software/ai-3d-generation/rodin-hyper3d/) (secondary) |

Hunyuan3D 3.0 licence: not found. Rodin and Tripo official pricing pages were not reached. GLB export was listed as supported for Rodin by a review ([makerstack](https://makerstack.co/reviews/hyper3d-rodin-review/)); Meshy and Tripo GLB export not confirmed on pages I could open.

### 2.6 Gaussian splats on the web

- **Renderer:** Spark by World Labs, MIT, for three.js (needs r180 or later). Spark 2.0 shipped 2026-04-14 with level-of-detail streaming; targets WebGL2; formats PLY, SPZ, SPLAT, KSPLAT, SOG and a streaming RAD format. Docs claim real-time rendering of very large scenes on memory-limited mobile as a design goal, not a benchmark ([Spark docs](https://sparkjs.dev/docs/new-features-2.0/), [World Labs post](https://www.worldlabs.ai/blog/spark-2.0)).
- **Generator:** World Labs Marble. Per its docs, export requires a paid plan; splat export (SPZ, PLY) on Standard; textured GLB and commercial rights on Pro; free plan cannot export ([Marble docs](https://docs.worldlabs.ai/marble/export/gaussian-splat/index.md), via search summary). Price points ($20, $35, $95/month) are from a third-party guide and unverified.
- Mobile splat performance in a WebView: untested.

### 2.7 AI SFX and music

| Tool | Cost | Commercial terms | Source |
|---|---|---|---|
| ElevenLabs Sound Effects | About 200 credits per generation; Free $0 (10,000 credits), Starter $6, Creator $22, Pro $99 per month | Free plan: attribution to elevenlabs.io required. Paid: no attribution, commercial use allowed; no selling the tools or building competing products | [Pricing](https://elevenlabs.io/pricing), [SFX terms](https://elevenlabs.io/sound-effects/commercial) |
| Eleven Music | About 900 credits per minute | "Music commercial use" listed from Starter | [Pricing](https://elevenlabs.io/pricing) |
| Suno | Not fetched | Free output non-commercial; paid plans carry commercial rights, not retroactive. After the Warner deal (2025-11-25), downloads are paid-only with monthly caps; licensed models had not shipped as of August 2026. A source describes terms effective 2026-09-03 tying commercial rights to a permitted download; unverified. Universal and Sony litigation continued as of July 2026 | [Digital Music News](https://www.digitalmusicnews.com/2025/12/22/suno-warner-music-deal-changes/), [Dubspot](https://blog.dubspot.com/ai-music-licensing-explained-2026), [terms.law](https://terms.law/ai-output-rights/suno/) |
| Udio | Not fetched | One source: downloads and stems disabled after the October 2025 UMG settlement, licensed version not shipped as of June 2026 | [Dubspot](https://blog.dubspot.com/ai-music-licensing-explained-2026) |

Suno and Udio are secondary sources only; I did not reach either company's terms.

---

## 3. What Claude Code authors directly vs what needs external assets

### 3.1 Public evidence of Claude-built WebGL scenes

| Evidence | Detail | Source |
|---|---|---|
| Guronnimo "touch grass" site | Post by @Guronnimo (Jeroen van Welsenes), 2026-10-08: "made my own website so i can touch grass without going outside. One shotted with Opus 5.5". 192,890 views, 5,829 likes at fetch time. Video is a 1080x1080 recording. The PR body links the X post only, not a live URL; I did not find one. | [fxtwitter API](https://api.fxtwitter.com/Guronnimo/status/2108095076929085510); post id 2108095076929085510 |
| Re-implementation of that idea | A PR on Tarnn/Hobby says it is inspired by Guronnimo's site: React Three Fiber and custom GLSL, about 72k instanced grass blades, cursor parts grass, tap plants a flower, sky dome with sun, moon, stars, night fireflies, analytic terrain mirrored in TypeScript and GLSL. Mobile and low-end fallbacks: fewer blades, adaptive pixel ratio, render pauses off-screen, poster still when WebGL is missing or Save-Data is on. Commits co-authored by Claude Opus 5.5. | [Tarnn/Hobby PR 2](https://github.com/Tarnn/Hobby/pull/2) |
| flxrnc "autumn cottage diorama" | **Not found.** Two searches, the fxtwitter profile and the yihui-dev index returned nothing matching. Related: flxrnc's 14-second UI loop post (id 2108242454105251921, date not checked) and Motion Lab. | [yihui-dev index](https://github.com/yihui-dev/awesome-opus5-5-videos) |
| Other Opus 5.5 scenes with source posts | Single-file WebGPU "Jelly Press" (Vib3Coded), WebGPU gummy octopus (Cheer), voxel game on three.js from CDN (DreykØ), interactive cartoony planet (Aman), dragon and castle in three.js (ReconScribe). All are prompts plus X links in a catalogue of 63 examples. | [TripoGrowthLab/awesome-opus-5-5-prompts](https://github.com/TripoGrowthLab/awesome-opus-5-5-prompts) (published by a 3D-AI vendor; links are the primary evidence) |
| Large 3D piece | Shikhar's browser world, about 1.75M views, built from Blender assets, generated images and Three.js, "third iteration with Opus 5.5 medium" (as reported in Motion Lab) | Motion Lab article, below |

### 3.2 Motion Lab article: reached and summarised

- **Title:** "Opus 5.5 Motion Lab: Make Claude Animate Like a Studio", by Florence (@flxrnc). X Article, created 2026-09-30T15:00:30Z. URL: <https://x.com/flxrnc/status/2105311836190978392>. Retrieved as JSON through `api.fxtwitter.com/flxrnc/status/2105311836190978392`, about 29,000 characters. All claims below are the author's.
- **Core claim:** Opus 5.5 "does not generate pixels, it writes code that paints pixels." Typical output is one HTML file; a headless browser freezes each frame, saves PNGs, and ffmpeg stitches them. Every frame is a pure function of time `t`, so renders are reproducible and edits are cheap.
- **Three pieces, each with prompts and follow-ups printed:**
  1. A 6-second chrome-blob loop: a single raymarched shader shape, real three.js `TextGeometry` letters, 60 fps, motion blur from subframes; 10 follow-ups; about 2 hours plus about 45 minutes for sound. A three.js r160 trap is called out: `TextGeometry` reads `height` and overwrites `depth` with 50.
  2. Earbuds product loop, vague prompt (0 follow-ups) versus a 448-word directed prompt (15 follow-ups, 4 review rounds). The vague prompt returned the model's defaults: dark navy space, halo ring, bloom, particles, spinning turntable.
  3. A voxel mascot loop built on five animation principles; 4 follow-ups; 71 numeric checks across 480 frames, 6 failed first time and were fixed.
- **Method:** replace adjectives with numbers (hex colours, seconds, damping ratios, frame counts); ban the model's defaults by name (purple/blue gradients, glow, lens flares, decorative particles, fade-and-slide-up everywhere); one hero move per shot; render stills, review a contact sheet, write notes with frame numbers; add each fixed failure to a "render contract". The author cites Anthropic's Opus 5.5 prompting guide for "falls back on a few default styles".
- **Audio:** Opus 5.5 "can't hear". Sound was synthesised in code with the Web Audio API (no samples), timed to frame numbers and checked by decoding the audio and measuring offsets. Corrections found by measurement: hits 8 to 11 ms late, 80 percent of energy under 60 Hz (inaudible on phone speakers), limiter squashing a final hit, 16 ms codec padding at the loop seam.
- **Numbers offered:** springs by damping ratio (1.0 no bounce, 0.7 to 0.85 premium, 0.4 to 0.6 playful); parallax speeds 1.0 / 0.5 / 0.2 for foreground, middle, background; text at 4.5:1 contrast; no more than 3 flashes per second (WCAG).
- **Tooling named:** Three.js (r186 shipped 2026-09-24), Remotion, HyperFrames (Apache-2.0, open-sourced 2026-04-17), GSAP (stated as fully free), Motion (MIT). Effort setting: medium by default; the author runs everything at medium.
- **Caveats the article itself gives:** viral "one prompt" pieces often hide long briefs (one music video: five minutes of speech plus a 12-hour run); a 5-hour, about $90 explainer used polish rounds. Times quoted are the author's own and include review rounds on a desktop GPU (RTX 4060 Ti).
- Related coverage reached by search, not independently checked: [nocode.mba](https://www.nocode.mba/articles/claude-opus-5-5-motion-graphics), [OfficeChai](https://officechai.com/ai/claude-opus-5-5-motion-graphic-videos/).

### 3.3 Capability table: authored in code vs external asset

"Evidence" is public proof found; blank means I found none specific to this stack.

| Element | Claude Code can author directly | Needs an external asset | Evidence |
|---|---|---|---|
| Fragment shaders (moon glow, fog, god rays, heat haze) | yes | no | Chrome-blob raymarch (3.2); Guronnimo sky with sun, moon, stars |
| GPU particles (embers, smoke) | yes (instanced points, shader-driven) | no | 72k-blade instancing and fireflies (Tarnn PR); Motion Lab says defaults like decorative particles must be banned by name, so direction matters |
| Post-processing (bloom, grain, vignette, chromatic aberration) | yes | no | Motion Lab names bloom as a model default to control |
| Procedural geometry (stadium bowl, floodlight towers, terraces, pitch) | yes, low-detail | detail would need modelling | Procedural single-file scenes in the Tripo catalogue |
| Anime/cel look on 3D | yes, via library or custom shader | no | [three-anime-style](https://github.com/xymeow/three-anime-style) (open-source building block) |
| Big "MATCHDAY" type | yes (SVG, canvas or TextGeometry); font file needed for a specific typeface | font licence | `TextGeometry` letters in the chrome loop |
| WebAudio synthesised crowd, whistles, drones | yes | recorded crowd needs samples or AI SFX | Motion Lab audio, all synthesised |
| Hero figure | no (a recognisable likeness cannot be coded) | AI-generated poster layers, or image-to-3D | Section 2 |
| Painterly poster look (the owner's current image) | not reproduced by code | the image itself | n/a |
| Moon and sky plate | partly (procedural sky exists) | painted plate gives the poster look | Guronnimo sky is procedural |

---

## 4. WhatsApp in-app browser constraints in 2026

### 4.1 Which view does WhatsApp use for a link in a chat?

Findings, with provenance:

- **iOS, 2022:** Krause's audit says "WhatsApp is opening iOS Safari by default, therefore no issues", and elsewhere that WhatsApp "can operate perfectly fine without using a custom in-app browser" ([Felix Krause, krausefx.com](https://krausefx.com/blog/ios-privacy-instagram-and-facebook-can-track-anything-you-do-on-any-website-in-their-in-app-browser)). Four years old; current behaviour unverified.
- **2025 change, businesses only:** WhatsApp added an in-app browser (IAB) for links in call-to-action buttons of marketing and utility template messages, plus payment links. Eligibility needs 1,000 or more business-initiated conversations per day per number. Links in free-form messages and replies "continue to open in the phone's default browser". Rollout expected complete by 2025-11-15. Source: [Sprinklr help article](https://www.sprinklr.com/help/articles/whatsapp-webview-support/whatsapp-business-webview-support-inapp-browser-iab/691304747e4ef1475ff48386), corroborated by [WATI](https://support.wati.io/en/articles/12867737-meta-introduces-in-app-browser-iab-experience-for-whatsapp). Both are vendors; I found no Meta primary page. The article names neither engine nor platform.
- **Android:** WABetaInfo reported an in-app browser beta limited to business websites over HTTPS ([WABetaInfo](https://wabetainfo.com/whatsapp-beta-for-android-2-25-14-10-whats-new/)). I found no source for plain chat links on Android. Unverified.

So: nothing I found shows that a link a friend sends from a personal WhatsApp account opens in WKWebView or Android System WebView. It is also not disproved for current iOS and Android versions. A real-device test (iPhone and Android, link sent from a personal account) settles it in minutes. I could not run that.

### 4.2 Capability matrix, both branches

Source for all rows: MDN browser-compat-data 8.1.5 (`unpkg.com/@mdn/browser-compat-data`), queried 2026-10-15. "System browser" means the `safari_ios` and `chrome_android` rows. "WebView" means `webview_ios` and `webview_android`. BCD does not model how a host app configures its WebView, so the iOS WebView rows are best case.

| Feature | iOS system browser (Safari) | iOS WKWebView | Chrome Android | Android System WebView |
|---|---|---|---|---|
| WebGL2 | 15 | 15 | 58 | 58 |
| WebGPU (`navigator.gpu`) | 26 | 26 | 121 | 121 |
| `navigator.share` | 12.2 | 12.2 | 61 | **false** (crbug 40540400) |
| `navigator.canShare` (needed for files) | 14 | 14 | 75 | **false** |
| `DeviceOrientationEvent.requestPermission` | 14.5 | 14.5 | 152 | 152 |
| `AudioContext` unprefixed | 14.5 | 14.5 | 37 | 37 |
| `AudioWorklet` | 14.5 | 14.5 | 66 | 66 |
| `OffscreenCanvas` | 16.4 | 16.4 | 69 | 69 |
| `HTMLCanvasElement.toBlob` | 11 | 11 | 50 | 50 |
| `<a download>` | 13 | 13 | not queried | 4.4, but from WebView 65 cross-origin downloads are unsupported |
| `<video playsinline>` | 10 | 10 | not queried | 75 |
| Fullscreen API | iPad only, not iPhone | iPad only, not iPhone | n/a | 71 |
| `navigator.vibrate` | not supported | not supported | yes | yes, needs user gesture |

Other points:
- **Video autoplay and audio unlock.** In a WebView these are controlled by the host app, not the page. Apple's `mediaTypesRequiringUserActionForPlayback` defaults to requiring a gesture, and `allowsInlineMediaPlayback` defaults to false on iPhone, from API knowledge; my fetches of the Apple and Android reference pages did not render the text, so **those two defaults are not verified from the docs**. Apple forum reports describe iOS 18 inline autoplay launching fullscreen in a WKWebView ([thread 764194](https://developer.apple.com/forums/thread/764194)) and audio needing a gesture after iOS 16 ([thread 764453](https://developer.apple.com/forums/thread/764453)). Both branches need a user gesture before audio, per the cited reports; Sleep Well and Bruno Simon show a tap gate (section 1).
- **Motion-sensor prompt.** Chromium's Intent to Ship says Android WebView always resolves to "granted"; the iOS call must come from a user gesture. Apple forum and WebKit bug reports say the prompt may not appear in a WKWebView unless the host sets a UI delegate, and one older bug says it was not needed ([Apple forum 125490](https://developer.apple.com/forums/thread/125490), [WebKit 203287](https://bugs.webkit.org/show_bug.cgi?id=203287), [Chromium intent](https://groups.google.com/a/chromium.org/g/Blink-dev/c/ckd2rFmT3PA)). Version-dependent; unverified on current iOS.
- **Memory and tab-kill.** No official Apple figure. A WebKit bug records "Total canvas memory use exceeds the maximum limit (384 MB)" with context creation returning null on iOS 12, with reports on later versions and in WKWebView ([WebKit 195325](https://bugs.webkit.org/show_bug.cgi?id=195325)). Another bug records a WebGL-canvas process kill at about 1.25 GB on an iPad Air 3 under iOS 14.2, reported fixed in 14.3 ([WebKit 219780](https://bugs.webkit.org/show_bug.cgi?id=219780)). An Apple-side reply says WKWebView's limit depends on device RAM and system load and cannot be raised ([Apple forum 133449](https://developer.apple.com/forums/thread/133449)). Treat these as historical data points, not current limits.
- **Autoplay in the Safari branch:** not researched beyond the WebView rows; Safari's muted-inline autoplay rule is not sourced here.

### 4.3 What I could and could not test
I captured 15 sites in headless Chromium with an iPhone 14 profile (Hubtown was not captured). Santioni returned "Not Supported" and Cartier "Access Denied"; IVRESS, Paodao, Igloo, Sleep Well and Lando Norris showed loaders or gates. This is Chromium, not WebKit, so it says nothing about WKWebView or the WhatsApp host. WebKit is not installed in the local Playwright cache I used.

---

## 5. Per-user shareable image generation in the browser

### 5.1 What the standards data says
- Canvas to PNG: `toBlob` is available in all four environments from iOS 11 and Android 50 (MDN BCD).
- Web Share with files: `navigator.canShare({files})` and `navigator.share({files})` work from iOS 14 and Chrome Android 75 in the system browsers. **Android System WebView does not implement either** (BCD `webview_android` = false, crbug 40540400). iOS WKWebView is listed as supported from the same versions, but a Whereby integration guide says WKWebView embeds need extra host delegate code for file sharing ([Whereby docs](https://docs.whereby.com/whereby-for-mobile-development/whereby-for-ios/in-ios-apps)), so the BCD row is optimistic.
- The call needs a user gesture; calling on load fails ([DEV article](https://dev.to/thisdotmedia/share-in-a-pwa-like-a-native-app-using-the-web-share-api-3eco), [W3C spec](https://www.w3.org/TR/web-share/)). `canShare` can return true for data it later drops if unknown keys are passed ([W3Tweaks](https://www.w3tweaks.com/html/web-share-api-native-sharing-files-fallbacks/)); Microsoft and MDN recommend gating the button on `canShare` with a dummy `File` ([MS Edge docs](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/share), [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Share_data_between_apps)).
- `<a download>`: iOS 13 and later; on Android WebView, cross-origin downloads are unsupported from WebView 65 (BCD note). Whether a same-origin `blob:` download works inside a given host app depends on that app's download handling; unverified.
- `ClipboardItem` (copy image): iOS 13.4 and Android WebView 84 (BCD). Support alone does not show a permission prompt or paste target works in-app.
- Canvas limits in WebKit are in 4.2 (384 MB total canvas memory in the cited bug).

### 5.2 Reliability verdict
No source I found tests canvas export plus file share inside WhatsApp's view, on either OS. The only evidence is API-support data and host-app caveats. In the system-browser branch the data points to working on iOS 14+ and Chrome Android 75+. In the WebView branch it points to failure on Android and an unknown on iOS. Unverified in WhatsApp itself; a two-device test is the deciding step. Fallback techniques listed by sources (hide the share button when `canShare` is false, offer a download link) come from MDN and Microsoft guidance; long-press-to-save on an `<img>` is general practice I did not find a source for.

---

## Source list by access date (2026-10-15)

Awwwards: [winners](https://www.awwwards.com/annual-awards/winners), [sport](https://www.awwwards.com/websites/sport/). Roundups: [Utsubo Three.js](https://www.utsubo.com/blog/best-threejs-websites-2026), [Utsubo storytelling](https://www.utsubo.com/blog/immersive-storytelling-websites-guide), [Hontran](https://www.hontran.dev/blog/best-award-winning-websites-2026). X and Claude evidence: [Motion Lab](https://x.com/flxrnc/status/2105311836190978392), [Guronnimo post](https://x.com/Guronnimo/status/2108095076929085510), [Tarnn PR](https://github.com/Tarnn/Hobby/pull/2). Models: [Qwen-Image-Layered](https://github.com/QwenLM/Qwen-Image-Layered), [Depth Anything V2](https://github.com/DepthAnything/Depth-Anything-V2), [Depth Anything 3](https://github.com/ByteDance-Seed/Depth-Anything-3), [BiRefNet](https://github.com/ZhengPeng7/BiRefNet), [RMBG-2.0](https://github.com/Bria-AI/RMBG-2.0), [Spark](https://sparkjs.dev/docs/new-features-2.0/). Pricing: [Gemini API](https://ai.google.dev/gemini-api/docs/pricing), [Teamday](https://www.teamday.ai/blog/best-ai-video-models-2026), [Meshy](https://docs.meshy.ai/en/webapp/pricing), [ElevenLabs](https://elevenlabs.io/pricing). Platform data: [MDN BCD 8.1.5](https://unpkg.com/@mdn/browser-compat-data/data.json), [Krause](https://krausefx.com/blog/ios-privacy-instagram-and-facebook-can-track-anything-you-do-on-any-website-in-their-in-app-browser), [Sprinklr](https://www.sprinklr.com/help/articles/whatsapp-webview-support/whatsapp-business-webview-support-inapp-browser-iab/691304747e4ef1475ff48386).

## Not verified (consolidated)
- Which view WhatsApp opens for a personal-chat link on current iOS and Android.
- Apple and Android default autoplay settings (doc pages did not render).
- flxrnc autumn cottage post; Guronnimo live site URL.
- Football, Nike, adidas, EA FC, club WebGL campaign sites; anime-styled award winners; invite sites.
- Commercial terms for Veo, Kling, Runway, Luma, Tripo, Rodin (official), Suno and Udio (primary), Marble (primary).
- Hunyuan3D 3.0 licence; rigging options for Tripo and Rodin; GLB export for Meshy and Tripo.
- Real-device behaviour of anything in Sections 4 and 5.
