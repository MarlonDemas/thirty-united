import { useSyncExternalStore } from "react"

/**
 * Device tiers for the world stage (atlas render budget, section 4).
 * T3 Cinematic and T2 Lit get the WebGL world (phase 4); T1 Poster is the DOM layer stack; T0 Still is
 * T1 with no motion (reduced motion); forced colours hides the world. Demotion only: within a session the
 * tier never goes back up.
 */
export type Tier = "T3" | "T2" | "T1" | "T0" | "forced-colors"

const RANK: Record<Tier, number> = { "forced-colors": -1, T0: 0, T1: 1, T2: 2, T3: 3 }
const BY_RANK: Tier[] = ["T0", "T1", "T2", "T3"]

/** T0 and forced colours draw the final state with no motion. */
export const isStillTier = (t: Tier) => t === "T0" || t === "forced-colors"
export const isWebGLTier = (t: Tier) => t === "T2" || t === "T3"

/** Every threshold the heuristic uses. Phone-test results (phase 0a) change numbers here, not code. */
export const TIER_RULES = {
  /**
   * Phase 0a switch. If WhatsApp opens an Android System WebView, set this to 1: every Android guest then
   * starts one rung lower (never below T1).
   */
  androidRungsDown: 0,
  /** Below this a 1080x1920 plate can't be one texture: T1. */
  minTextureSize: 2048,
  /** T3 wants room for 1440x2560 plates. */
  t3TextureSize: 4096,
  /** `navigator.deviceMemory` (GB, Chrome only) at or below this: T1. */
  lowMemoryGb: 2,
  /** An Android T3 GPU also needs at least this much memory, when the browser reports it. */
  t3MemoryGb: 6,
  /** `hardwareConcurrency` at or below this: T1. */
  lowCores: 2,
  /** An unrecognised renderer reaches T3 only with this many cores and `t3MemoryGb` (desktops). */
  t3Cores: 6,
  /** Unmasked renderer strings. iOS masks to "Apple GPU" (iPhone 11 and later are all fine). */
  t3Gpu: /apple gpu|adreno \(tm\) [7-9]\d\d|mali-g(?:7[6-9]|[7-9]\d\d)\b|immortalis/i,
  t2Gpu: /mali-g(?:5\d|6\d|7[1-2]|[56]\d\d)\b|adreno \(tm\) 6\d\d/i,
  /** Slow-frame demotion (phase 4 consumer): median frame time over this in a 1 s window... */
  slowFrameMs: 33,
  /** ...for this many windows in a row... */
  slowWindowsInARow: 2,
  /** ...or this many windows in total. */
  slowWindowsTotal: 3,
} as const

/** The rules as a value a test (or the phase 0a result) may vary. */
export type TierRules = { readonly [K in keyof typeof TIER_RULES]: (typeof TIER_RULES)[K] extends number ? number : (typeof TIER_RULES)[K] }

export type TierSignals = {
  forcedColors: boolean
  reducedMotion: boolean
  saveData: boolean
  webgl2: boolean
  maxTextureSize: number | null
  /** Unmasked renderer string, or null when the debug extension is missing. */
  renderer: string | null
  deviceMemory: number | null
  cores: number | null
  android: boolean
}

export type TierPick = { tier: Tier; reason: string }

/** The heuristic. Pure: the same signals always give the same tier. */
export function pickTier(s: TierSignals, rules: TierRules = TIER_RULES): TierPick {
  if (s.forcedColors) return { tier: "forced-colors", reason: "forced-colors: active" }
  if (s.reducedMotion) return { tier: "T0", reason: "prefers-reduced-motion" }
  if (s.saveData) return { tier: "T1", reason: "saveData or prefers-reduced-data" }
  if (!s.webgl2) return { tier: "T1", reason: "no WebGL2" }
  if (s.maxTextureSize !== null && s.maxTextureSize < rules.minTextureSize)
    return { tier: "T1", reason: `MAX_TEXTURE_SIZE ${s.maxTextureSize} < ${rules.minTextureSize}` }
  if (s.deviceMemory !== null && s.deviceMemory <= rules.lowMemoryGb)
    return { tier: "T1", reason: `deviceMemory ${s.deviceMemory} <= ${rules.lowMemoryGb}` }
  if (s.cores !== null && s.cores <= rules.lowCores) return { tier: "T1", reason: `${s.cores} cores <= ${rules.lowCores}` }

  const gpu = s.renderer ?? ""
  const bigTextures = s.maxTextureSize === null || s.maxTextureSize >= rules.t3TextureSize
  let base: TierPick
  if (rules.t3Gpu.test(gpu) && bigTextures && (/apple gpu/i.test(gpu) || (s.deviceMemory ?? 0) >= rules.t3MemoryGb)) {
    base = { tier: "T3", reason: `T3 GPU (${gpu})` }
  } else if (rules.t3Gpu.test(gpu) || rules.t2Gpu.test(gpu)) {
    base = { tier: "T2", reason: `T2 GPU or T3 GPU without memory (${gpu})` }
  } else if (!s.android && bigTextures && (s.deviceMemory ?? 0) >= rules.t3MemoryGb && (s.cores ?? 0) >= rules.t3Cores) {
    base = { tier: "T3", reason: `unlisted GPU, ${s.deviceMemory} GB, ${s.cores} cores` }
  } else {
    base = { tier: "T2", reason: `WebGL2, unlisted or masked GPU (${gpu || "masked"})` }
  }
  if (s.android && rules.androidRungsDown > 0) {
    const down = BY_RANK[Math.max(RANK.T1, RANK[base.tier] - rules.androidRungsDown)]
    if (down !== base.tier) return { tier: down, reason: `${base.reason}; Android starts ${rules.androidRungsDown} rung lower` }
  }
  return base
}

/** Slow-frame rule (phase 4): true once the frame windows say to demote one tier. */
export function framesSayDemote(windowMedians: number[], rules: TierRules = TIER_RULES): boolean {
  let run = 0
  let total = 0
  for (const ms of windowMedians) {
    if (ms > rules.slowFrameMs) {
      run += 1
      total += 1
      if (run >= rules.slowWindowsInARow || total >= rules.slowWindowsTotal) return true
    } else run = 0
  }
  return false
}

const media = (q: string) =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(q).matches : false

/** Reads the live signals. The WebGL probe context is released straight away. */
export function readSignals(): TierSignals {
  const nav = (typeof navigator !== "undefined" ? navigator : {}) as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  const gpu = { webgl2: false, maxTextureSize: null as number | null, renderer: null as string | null }
  try {
    if (typeof document !== "undefined" && typeof WebGL2RenderingContext !== "undefined") {
      const gl = document.createElement("canvas").getContext("webgl2") as WebGL2RenderingContext | null
      if (gl) {
        gpu.webgl2 = true
        gpu.maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || null
        const ext = gl.getExtension("WEBGL_debug_renderer_info")
        gpu.renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : null
        gl.getExtension("WEBGL_lose_context")?.loseContext()
      }
    }
  } catch {
    /* no WebGL2: T1 */
  }
  return {
    forcedColors: media("(forced-colors: active)"),
    reducedMotion: media("(prefers-reduced-motion: reduce)"),
    saveData: !!nav.connection?.saveData || media("(prefers-reduced-data: reduce)"),
    ...gpu,
    deviceMemory: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    cores: typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null,
    android: /Android/i.test(nav.userAgent ?? ""),
  }
}

// --- The session store: one tier for the whole page, readable from any React tree (DeviceProbe too). ---

export const TIER_KEY = "thirty-united:tier"
export const STILL_KEY = "thirty-united:still"

export type Demotion = { from: Tier; to: Tier; reason: string; at: number }
export type TierState = {
  tier: Tier
  reason: string
  /** What the heuristic picked at load, before any demotion. */
  picked: TierPick
  demotions: Demotion[]
  /** The Still chip: ambient loops off for the session. */
  still: boolean
}

let state: TierState | null = null
const listeners = new Set<() => void>()

function readStored<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function store(key: string, v: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* private mode: the demotion holds for this page load only */
  }
}

function init(): TierState {
  const picked = pickTier(readSignals())
  let tier = picked.tier
  let reason = picked.reason
  // A demotion earlier in this session (context loss, Still, slow frames) still holds after a reload.
  const cap = readStored<{ tier: Tier; reason: string }>(TIER_KEY)
  if (cap && cap.tier in RANK && RANK[cap.tier] < RANK[tier]) {
    tier = cap.tier
    reason = `${cap.reason} (held for this session)`
  }
  return { tier, reason, picked, demotions: [], still: readStored<boolean>(STILL_KEY) === true }
}

export function getTierState(): TierState {
  return (state ??= init())
}

function set(next: TierState) {
  state = next
  listeners.forEach((l) => l())
}

/** Lower the tier. Returns false (and changes nothing) unless `to` is below the current tier. */
export function demote(to: Tier, reason: string): boolean {
  const cur = getTierState()
  if (RANK[to] >= RANK[cur.tier]) return false
  set({ ...cur, tier: to, reason, demotions: [...cur.demotions, { from: cur.tier, to, reason, at: Date.now() }] })
  if (to !== "T0" && to !== "forced-colors") store(TIER_KEY, { tier: to, reason }) // media-driven tiers follow the media query
  return true
}

/** The Still chip. Pressing it drops to T1 for the session (demotion only); releasing restarts ambient on T1. */
export function setStill(on: boolean) {
  if (on) demote("T1", "Still chip")
  set({ ...getTierState(), still: on })
  store(STILL_KEY, on)
}

export function subscribeTier(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useTier(): TierState {
  return useSyncExternalStore(subscribeTier, getTierState, getTierState)
}

/** Tests only: forget the session so the next read re-runs the heuristic. */
export function resetTier() {
  state = null
  listeners.forEach((l) => l())
}
