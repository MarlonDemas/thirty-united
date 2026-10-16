/**
 * GLSL for the WebGL world. Every shader works in poster px (1080 x 1920, y down) so it reads like layers.json.
 * Written GLSL 1 style; three.js maps it to GLSL ES 3.0 on WebGL2. No colour conversion anywhere: plates, tokens and
 * output are all stored sRGB values, so the canvas matches the DOM still it fades in over.
 */

const POSTER = /* glsl */ `
#define POSTER_W 1080.0
#define POSTER_H 1920.0
`

/** World units (y up, centred) back to poster px (y down). */
const TO_POSTER = /* glsl */ `
vec2 toPoster(vec3 p) { return vec2(p.x + POSTER_W * 0.5, POSTER_H * 0.5 - p.y); }
`

/**
 * One plate. `uOffset` is the parallax shift in poster px (already times the layer's depth). Bank plates reveal the
 * lit stadium through a soft disc that grows from the lamp head (`uHead`, `uRadius`); every other plate has
 * `uRadius < 0`, no mask.
 */
export const plateVertex = /* glsl */ `
${POSTER}${TO_POSTER}
uniform vec2 uOffset;
varying vec2 vUv;
varying vec2 vPoster;
void main() {
  vUv = uv;
  // The mask and the smoke's noise ride with the plate: both are measured from its unshifted place.
  vPoster = toPoster(position);
  vec3 p = position + vec3(uOffset.x, -uOffset.y, 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

export const plateFragment = /* glsl */ `
uniform sampler2D map;
uniform float uOpacity;
uniform vec2 uHead;
uniform float uRadius;
uniform float uFeather;
varying vec2 vUv;
varying vec2 vPoster;
void main() {
  vec4 c = texture2D(map, vUv);
  float m = uRadius < 0.0 ? 1.0 : 1.0 - smoothstep(uRadius - uFeather, uRadius, distance(vPoster, uHead));
  float a = c.a * uOpacity * m;
  if (a < 0.002) discard;
  gl_FragColor = vec4(c.rgb, a);
}
`

/**
 * A radial light: the bank glows and the moon's halo. Five stops (position, strength) along the radius, linear
 * between them, as the CSS radial-gradients on T1 draw them. Additive.
 */
export const glowVertex = /* glsl */ `
uniform vec2 uOffset;
varying vec2 vQ;
void main() {
  vQ = uv * 2.0 - 1.0;
  vec4 p = modelMatrix * vec4(position, 1.0);
  p.xy += vec2(uOffset.x, -uOffset.y);
  gl_Position = projectionMatrix * viewMatrix * p;
}
`

export const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform vec2 uStops[5];
varying vec2 vQ;
float profile(float t) {
  float v = uStops[0].y;
  for (int i = 1; i < 5; i++) {
    vec2 a = uStops[i - 1];
    vec2 b = uStops[i];
    if (t >= a.x) v = mix(a.y, b.y, clamp((t - a.x) / max(b.x - a.x, 1e-4), 0.0, 1.0));
  }
  return v;
}
void main() {
  float t = length(vQ);
  if (t >= 1.0) discard;
  float a = profile(t) * uOpacity;
  if (a < 0.002) discard;
  gl_FragColor = vec4(uColor, a);
}
`

/**
 * A beam card (T3): a soft cone from the lamp head (uv.y = 1) out along the beam, narrow at the head, fading with
 * distance. Static apart from its bank's level: no flicker, so a strike stays one way.
 */
export const beamFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vQ;
void main() {
  float along = 1.0 - (vQ.y * 0.5 + 0.5);
  float w = mix(0.07, 1.0, along);
  float across = 1.0 - smoothstep(w * 0.3, w, abs(vQ.x));
  float a = across * pow(1.0 - along, 1.7) * smoothstep(0.0, 0.04, along) * uOpacity * 0.2;
  if (a < 0.002) discard;
  gl_FragColor = vec4(uColor, a);
}
`

/**
 * GPU embers. Each point carries four seeds (x, y, size, index). The first `uBase` rise from the ground on a loop;
 * the rest only fly in the one-shot bursts: the Yes swirl around Makes (`uSwirl`) and the finale (`uBurst`), each a
 * progress from 0 to 1. On the No end (`uLone`) one ember drifts up past the moon and the rest stay down.
 * `uTime` is the ambient clock: it stops on the code beat, so the embers hang there.
 */
export const emberVertex = /* glsl */ `
${POSTER}
attribute vec4 aSeed;
uniform float uTime;
uniform float uBase;
uniform float uSwirlN;
uniform float uSwirl;
uniform float uBurst;
uniform float uLone;
uniform float uScale;
uniform vec2 uOffset;
varying float vA;
const float TAU = 6.2831853;
void hide() { vA = 0.0; gl_PointSize = 0.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }
void main() {
  float i = aSeed.w;
  vec2 p = vec2(0.0);
  float a = 0.0;
  float size = 2.5 + aSeed.z * 4.5;
  if (uLone > 0.5) {
    if (i > 0.5) { hide(); return; }
    float t = fract(uTime / 11.0);
    p = vec2(mix(720.0, 960.0, t) + sin(t * 9.0) * 14.0, mix(1060.0, 320.0, t));
    a = smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.8, 1.0, t));
    size = 5.0;
  } else if (i < uBase) {
    float period = 6.0 + aSeed.z * 6.0;
    float t = fract(uTime / period + aSeed.y * 7.31 + aSeed.x * 3.17);
    float x0 = 30.0 + aSeed.x * 1020.0;
    float y0 = 1300.0 + aSeed.y * 420.0;
    float rise = 420.0 + aSeed.z * 420.0;
    p = vec2(x0 + sin(uTime * (0.4 + aSeed.y) + aSeed.x * TAU) * 16.0 + (aSeed.y - 0.5) * 80.0 * t, y0 - rise * t);
    a = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.65, 1.0, t)) * (0.45 + 0.55 * aSeed.z);
  } else if (uSwirl > 0.0 && uSwirl < 1.0 && i < uBase + uSwirlN) {
    float d = aSeed.x * 0.35;
    float t = clamp((uSwirl - d) / (1.0 - 0.35), 0.0, 1.0);
    if (t <= 0.0 || t >= 1.0) { hide(); return; }
    float ang = aSeed.y * TAU + t * 5.0;
    float r = 110.0 + 150.0 * aSeed.z + 70.0 * t;
    p = vec2(470.0 + cos(ang) * r, 1480.0 - t * (900.0 + 300.0 * aSeed.z));
    a = sin(t * 3.14159) * 0.9;
  } else if (uBurst > 0.0 && uBurst < 1.0 && i >= uBase) {
    float d = aSeed.x * 0.25;
    float t = clamp((uBurst - d) / (1.0 - 0.25), 0.0, 1.0);
    if (t <= 0.0 || t >= 1.0) { hide(); return; }
    float e = 1.0 - (1.0 - t) * (1.0 - t);
    p = vec2(60.0 + aSeed.x * 960.0 + (aSeed.y - 0.5) * 160.0 * t, 1520.0 + aSeed.y * 300.0 - e * (500.0 + aSeed.z * 700.0));
    a = pow(1.0 - t, 1.3) * smoothstep(0.0, 0.04, t);
  } else {
    hide();
    return;
  }
  if (a < 0.003) { hide(); return; }
  vA = a;
  gl_PointSize = size * uScale;
  vec3 w = vec3(p.x - POSTER_W * 0.5 + uOffset.x, POSTER_H * 0.5 - p.y - uOffset.y, 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(w, 1.0);
}
`

export const emberFragment = /* glsl */ `
uniform vec3 uColor;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = vA * (1.0 - smoothstep(0.25, 1.0, d));
  if (a < 0.003) discard;
  vec3 core = mix(uColor, vec3(1.0, 0.82, 0.6), pow(max(0.0, 1.0 - d), 3.0) * 0.6);
  gl_FragColor = vec4(core, a);
}
`

/**
 * Scrolling-noise smoke: four octaves of value noise drifting sideways along a band of poster space, strongest in
 * the middle of the band. Tinted `scene-smoke-red`. `uTime` is the ambient clock.
 */
export const smokeFragment = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uSpeed;
uniform float uAlpha;
uniform vec3 uColor;
uniform vec4 uRect;
varying vec2 vPoster;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int k = 0; k < 4; k++) {
    v += amp * noise(p);
    p = p * 2.03 + vec2(17.0, 9.0);
    amp *= 0.5;
  }
  return v;
}
void main() {
  vec2 q = vPoster / vec2(260.0, 150.0) + vec2(uSeed, uSeed * 0.5);
  q.x -= uTime * uSpeed / 260.0;
  q.y += sin(q.x * 0.7 + uTime * 0.1) * 0.15;
  float n = fbm(q);
  float yN = (vPoster.y - uRect.y) / (uRect.w - uRect.y);
  float band = smoothstep(0.0, 0.35, yN) * (1.0 - smoothstep(0.7, 1.0, yN));
  float a = smoothstep(0.42, 0.78, n) * band * uAlpha;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor * (0.75 + 0.5 * n), a);
}
`
