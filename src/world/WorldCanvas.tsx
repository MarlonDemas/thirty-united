import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { advance, Canvas, useThree } from "@react-three/fiber"
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  ClampToEdgeWrapping,
  Group,
  LinearFilter,
  Mesh,
  NormalBlending,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  TextureLoader,
  type Blending,
  type Texture,
} from "three"
import type { Attending } from "@/lib/schemas/rsvp"
import { poseFor, type Beat } from "@/world/beats"
import { ambientOn, demotionFor, FrameSampler, frameAction } from "@/world/gl/ambient"
import {
  BEAM_TARGET,
  canvasDpr,
  hexToRgb,
  plateQuad,
  SCENE,
  smokeQuadsFor,
  toWorld,
  worldConfig,
  type GLTier,
  type WorldConfig,
} from "@/world/gl/config"
import * as glsl from "@/world/gl/shaders"
import { flying, PROPS, sample, trackEnd, tracksFor, type Prop, type Track } from "@/world/gl/tracks"
import { ANCHORS, LAYERS, layerUrl, type Layer } from "@/world/layers"
import { MOON } from "@/world/draw"
import { PARALLAX, parallaxDepth } from "@/world/parallax"
import { demote, type Tier } from "@/world/tier"
import { usePass } from "@/world/pass"
import LanyardPass from "@/components/three/LanyardTicket"

/**
 * The WebGL world for T3 and T2 (phase 4): the same plates as the DOM still, as planes in poster space, with the
 * floodlight banks revealed from their lamp heads, glow sprites, beam cards (T3), GPU embers and scrolling-noise
 * smoke. No post-processing, no bloom, no video.
 *
 * The canvas is laid out at 1080 x 1920 CSS px inside the `.poster` element, so the camera shots (the poster's CSS
 * transform, pushes and keyboard reframes included) carry it exactly as they carry the DOM layers and overlays. The
 * DOM keeps everything that is not a plate: the moon disc, the title lockups, the code lamps, the shirt lettering and
 * the stamp, drawn over the canvas. WorldStage cross-fades the canvas in once its first frame is drawn, then hides
 * the DOM plates under it. On the cover it also hangs the lanyard pass (B2, phase 5) when the sealed view asks for it
 * (`@/world/pass`), so the cover has one WebGL context.
 *
 * Its own chunk: three and R3F load only on T3 and T2.
 */
export type WorldCanvasProps = {
  beat: Beat
  attending?: Attending
  tier: Tier
  still: boolean
  /** Pose and shirt plates the still layer has asked for; the canvas loads the same files. */
  mounted: readonly string[]
  frame: { w: number; h: number }
  /** The canvas covers the DOM plates now: parallax may move it. */
  live: boolean
  /** The first frame with the base plates is on screen. */
  onReady: () => void
}

const TITLE = new Set(["thirty", "united"])
const PLATES = LAYERS.filter((l) => !TITLE.has(l.name))
const LAZY = new Set(["l5-makes", "l6-makes-wave", "l7-makes-signing", "l8-shirt"])
const BASE = PLATES.filter((l) => !LAZY.has(l.name)).map((l) => l.name)
const FEATHER = 90 // the bank mask's soft edge, poster px
/** The shirt swings in from 60 px right of its slot (index.css, `.layer-shirt`). */
const SHIRT_SWING_PX = 60
/** Parallax eases toward the finger with this time constant (s). */
const PARALLAX_TAU = 0.12
/** Smoke and the beams sit at these depths for parallax; the embers rise in front of everything. */
const DEPTH = { halo: 0.05, glow: 0.25, embers: 0.85 }
/** CSS radial-gradient stops (index.css) as [position, strength] along the radius. */
const GLOW_STOPS: [number, number][] = [
  [0, 1],
  [0.12, 0.85],
  [0.3, 0.42],
  [0.58, 0.16],
  [1, 0],
]
const GLOW_SOFT: [number, number][] = [
  [0, 0.42],
  [0.4, 0.24],
  [0.72, 0.08],
  [1, 0],
  [1, 0],
]
const haloStops = (core: number): [number, number][] => [
  [0, 0.55],
  [core, 0.55],
  [core + 0.09, 0.24],
  [core + 0.28, 0.09],
  [1, 0],
]

const isMobileAndroid = () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)

export default function WorldCanvas(props: WorldCanvasProps) {
  const glTier: GLTier = props.tier === "T3" ? "T3" : "T2"
  const cfg = useMemo(() => worldConfig(glTier, isMobileAndroid()), [glTier])
  const dpr = canvasDpr(props.frame, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, cfg.dprCap)
  // R3F forces a context loss when it tears the root down; only a loss while mounted is the browser's.
  const mounted = useRef(true)
  useLayoutEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  return (
    <div className="world-gl" data-testid="world-gl">
      <Canvas
        frameloop="never"
        linear
        flat
        orthographic
        dpr={dpr}
        camera={{ position: [0, 0, 10], near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: false, depth: false, stencil: false }}
        // offsetSize: measure the 1080 x 1920 layout box, not the shot-scaled rect.
        resize={{ offsetSize: true, scroll: false }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault()
            if (mounted.current) demote("T1", "world canvas: WebGL context lost")
          })
        }}
      >
        <Scene {...props} glTier={glTier} cfg={cfg} />
      </Canvas>
    </div>
  )
}

type SceneProps = WorldCanvasProps & { glTier: GLTier; cfg: WorldConfig }

type Built = {
  group: Group
  plates: Map<string, { mesh: Mesh; mat: ShaderMaterial; layer: Layer; depth: number; head?: [number, number]; reach?: number }>
  glows: { mesh: Mesh; mat: ShaderMaterial; r: number }[]
  beams: ShaderMaterial[]
  halo: ShaderMaterial
  embers: ShaderMaterial
  smoke: { mat: ShaderMaterial; depth: number }[]
  dispose: () => void
}

function material(vertex: string, fragment: string, uniforms: Record<string, { value: unknown }>, blending: Blending) {
  return new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending,
  })
}

/** A quad from a poster-px rect, with UVs at its corners. */
function quad(rect: { x0: number; y0: number; x1: number; y1: number }, uv = { x0: 0, y0: 1, x1: 1, y1: 0 }) {
  const [ax, ay] = toWorld(rect.x0, rect.y0)
  const [bx, by] = toWorld(rect.x1, rect.y1)
  const g = new BufferGeometry()
  g.setAttribute("position", new BufferAttribute(new Float32Array([ax, ay, 0, bx, ay, 0, bx, by, 0, ax, by, 0]), 3))
  g.setAttribute("uv", new BufferAttribute(new Float32Array([uv.x0, uv.y0, uv.x1, uv.y0, uv.x1, uv.y1, uv.x0, uv.y1]), 2))
  g.setIndex([0, 3, 1, 1, 3, 2])
  return g
}

/** Seeded so the embers fall the same way on every visit (and in every screenshot). */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t >>> 14) ^ t) / 4294967296 + 0.5
  }
}

function build(tier: GLTier, cfg: WorldConfig): Built {
  const group = new Group()
  const geometries: BufferGeometry[] = []
  const materials: ShaderMaterial[] = []
  const add = (obj: Mesh | Points, z: number) => {
    obj.renderOrder = z * 10
    obj.frustumCulled = false
    group.add(obj)
    geometries.push(obj.geometry)
    materials.push(obj.material as ShaderMaterial)
    return obj
  }

  // Plates, back to front by their z. Bank plates carry the reveal mask from their lamp head.
  const plates: Built["plates"] = new Map()
  for (const layer of PLATES) {
    const { rect, uv } = plateQuad(layer.bbox, PARALLAX.maxPx + 2)
    const head = layer.bank ? ANCHORS.banks[layer.bank - 1] : undefined
    const mat = material(
      glsl.plateVertex,
      glsl.plateFragment,
      {
        map: { value: null },
        uOpacity: { value: 0 },
        uOffset: { value: [0, 0] },
        uHead: { value: head ? [head.x, head.y] : [0, 0] },
        uRadius: { value: head ? 0 : -1 },
        uFeather: { value: FEATHER },
      },
      NormalBlending,
    )
    const mesh = add(new Mesh(quad(rect, uv), mat), layer.z) as Mesh
    mesh.visible = false // until its texture lands
    const [x, y, w, h] = layer.bbox
    const reach = head ? Math.max(...[[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([px, py]) => Math.hypot(px - head.x, py - head.y))) : 0
    plates.set(layer.name, { mesh, mat, layer, depth: parallaxDepth(layer.name, layer.depth, tier), head: head ? [head.x, head.y] : undefined, reach })
  }

  // The moon's halo (the disc stays DOM, over the canvas: no plate ever covers it).
  const { x: mx, y: my, r: mr } = ANCHORS.moon
  const R = mr * MOON.haloScale
  const halo = material(
    glsl.glowVertex,
    glsl.glowFragment,
    { uColor: { value: hexToRgb(SCENE.moonHalo) }, uOpacity: { value: 1 }, uOffset: { value: [0, 0] }, uStops: { value: haloStops(mr / R).flat() } },
    AdditiveBlending,
  )
  add(new Mesh(quad({ x0: mx - R, y0: my - R, x1: mx + R, y1: my + R }), halo), 1)

  // A glow sprite per bank on its tower head. Bank 3's head is behind the hanging shirt: a soft glow over it.
  const floodlight = hexToRgb(SCENE.floodlight)
  const glows: Built["glows"] = ANCHORS.banks.map((b, i) => {
    const mat = material(
      glsl.glowVertex,
      glsl.glowFragment,
      { uColor: { value: floodlight }, uOpacity: { value: 0 }, uOffset: { value: [0, 0] }, uStops: { value: (i === 2 ? GLOW_SOFT : GLOW_STOPS).flat() } },
      AdditiveBlending,
    )
    const mesh = add(new Mesh(new PlaneGeometry(1, 1), mat), b.z === 3 ? 3.2 : b.z + 0.5) as Mesh
    const [wx, wy] = toWorld(b.x, b.y)
    mesh.position.set(wx, wy, 0)
    return { mesh, mat, r: b.r }
  })

  // Beam cards (T3 only): from each lamp head toward the pitch, behind the crowd.
  const beams: ShaderMaterial[] = []
  if (cfg.beams) {
    for (const b of ANCHORS.banks) {
      const mat = material(glsl.glowVertex, glsl.beamFragment, { uColor: { value: floodlight }, uOpacity: { value: 0 }, uOffset: { value: [0, 0] } }, AdditiveBlending)
      const dx = BEAM_TARGET[0] - b.x
      const dy = BEAM_TARGET[1] - b.y
      const len = Math.hypot(dx, dy) * 1.15
      const mesh = add(new Mesh(new PlaneGeometry(len * 0.5, len), mat), 3.5) as Mesh
      const [hx, hy] = toWorld(b.x + (dx / Math.hypot(dx, dy)) * (len / 2), b.y + (dy / Math.hypot(dx, dy)) * (len / 2))
      mesh.position.set(hx, hy, 0)
      // The card's +y (uv.y = 1, the head end) points back at the lamp head: world (-dx, dy), as world y is up.
      mesh.rotation.z = Math.atan2(dx, dy)
      beams.push(mat)
    }
  }

  // Smoke bands.
  const smoke = smokeQuadsFor(cfg).map((s) => {
    const mat = material(
      glsl.plateVertex,
      glsl.smokeFragment,
      {
        uTime: { value: 0 },
        uSeed: { value: s.seed },
        uSpeed: { value: s.speed },
        uAlpha: { value: s.alpha },
        uColor: { value: hexToRgb(SCENE.smokeRed) },
        uRect: { value: [s.rect.x0, s.rect.y0, s.rect.x1, s.rect.y1] },
        uOffset: { value: [0, 0] },
      },
      NormalBlending,
    )
    add(new Mesh(quad(s.rect), mat), s.z)
    return { mat, depth: tier === "T3" ? s.depth : 0 }
  })

  // Embers: `cap` points; the first `base` rise all the time, the rest are the bursts.
  const { base, cap } = cfg.embers
  const rnd = mulberry32(2112)
  const seeds = new Float32Array(cap * 4)
  for (let i = 0; i < cap; i++) seeds.set([rnd(), rnd(), rnd(), i], i * 4)
  const eg = new BufferGeometry()
  eg.setAttribute("position", new BufferAttribute(new Float32Array(cap * 3), 3))
  eg.setAttribute("aSeed", new BufferAttribute(seeds, 4))
  const embers = material(
    glsl.emberVertex,
    glsl.emberFragment,
    {
      uTime: { value: 0 },
      uBase: { value: base },
      uSwirlN: { value: Math.min(240, cap - base) },
      uSwirl: { value: 0 },
      uBurst: { value: 0 },
      uLone: { value: 0 },
      uScale: { value: 1 },
      uOffset: { value: [0, 0] },
      uColor: { value: hexToRgb(SCENE.ember) },
    },
    AdditiveBlending,
  )
  add(new Points(eg, embers), 9)

  return {
    group,
    plates,
    glows,
    beams,
    halo,
    embers,
    smoke,
    dispose: () => {
      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
    },
  }
}

/** Loads the plates the scene needs from the same hashed files the DOM still uses (a cache hit, same origin). */
export function usePlateTextures(names: readonly string[]) {
  const [textures, setTextures] = useState<ReadonlyMap<string, Texture>>(new Map())
  const cache = useRef(new Map<string, Texture>())
  const asked = useRef(new Set<string>())
  const gone = useRef(false)
  // Declared first so a StrictMode remount clears `gone` before the loads below start again.
  useEffect(() => {
    gone.current = false
    const all = cache.current
    const seen = asked.current
    return () => {
      gone.current = true
      all.forEach((t) => t.dispose())
      all.clear()
      seen.clear() // a remount asks again
    }
  }, [])
  useEffect(() => {
    const loader = new TextureLoader()
    for (const name of names) {
      if (asked.current.has(name)) continue
      const url = layerUrl(name, 1080)
      if (!url) continue
      asked.current.add(name)
      loader.load(
        url,
        (tex) => {
          // Unmounted, or a plate already in from a load started before a StrictMode remount.
          if (gone.current || cache.current.has(name)) return tex.dispose()
          tex.generateMipmaps = false
          tex.minFilter = LinearFilter
          tex.magFilter = LinearFilter
          tex.wrapS = ClampToEdgeWrapping
          tex.wrapT = ClampToEdgeWrapping
          cache.current.set(name, tex)
          setTextures(new Map(cache.current))
        },
        undefined,
        () => asked.current.delete(name), // a failed plate stays the DOM's; the next render may ask again
      )
    }
  }, [names])
  return textures
}

type Clock = { tracks: Record<Prop, Track>; from: Record<Prop, number>; at: number; beat: Beat; attending?: Attending }

const valueOf = (c: Clock, p: Prop, now: number) => sample(c.tracks[p], c.from[p], now - c.at)

/** A clock whose tracks have all played out: the beat's final state, drawn at once. */
function settledClock(beat: Beat, attending?: Attending): Clock {
  const zero = Object.fromEntries(PROPS.map((p) => [p, 0])) as Record<Prop, number>
  return { tracks: tracksFor(beat, attending), from: zero, at: Number.NEGATIVE_INFINITY, beat, attending }
}

/** Textures onto the plate materials; a plate draws once its texture is in. */
function bindTextures(built: Built, textures: ReadonlyMap<string, Texture>) {
  for (const [name, p] of built.plates) {
    const tex = textures.get(name)
    p.mat.uniforms.map.value = tex ?? null
    p.mesh.visible = !!tex
  }
}

function Scene({ beat, attending, tier, still, mounted, live, onReady, glTier, cfg }: SceneProps) {
  const pass = usePass()
  const passBusy = useRef<() => boolean>(() => false)
  const get = useThree((s) => s.get)
  const gl = useThree((s) => s.gl)
  const built = useMemo(() => build(glTier, cfg), [glTier, cfg])
  useEffect(() => () => built.dispose(), [built])

  const wanted = useMemo(() => [...BASE, ...mounted.filter((n) => LAZY.has(n))], [mounted])
  const textures = usePlateTextures(wanted)

  // Live inputs the frame loop reads without re-subscribing.
  const input = useRef({ beat, attending, tier, still, live })
  useLayoutEffect(() => {
    input.current = { beat, attending, tier, still, live }
  })

  // Beat changes become tracks, starting from wherever the last ones had got to. The canvas mounts settled.
  const [settled] = useState(() => settledClock(beat, attending))
  const clock = useRef<Clock>(settled)
  const wake = useRef<() => void>(() => {})
  const wakeLoop = useCallback(() => wake.current(), [])
  useEffect(() => {
    const c = clock.current
    if (c.beat === beat && c.attending === attending) return
    const now = performance.now()
    const from = Object.fromEntries(PROPS.map((p) => [p, valueOf(c, p, now)])) as Record<Prop, number>
    clock.current = { tracks: tracksFor(beat, attending, c.beat), from, at: now, beat, attending }
    wake.current()
  }, [beat, attending])

  // Textures onto the materials; a plate shows once its texture is in.
  const readyRef = useRef(false)
  const readied = useRef(false)
  useEffect(() => {
    bindTextures(built, textures)
    const pose = poseFor(input.current.beat, input.current.attending)
    if (!readyRef.current && BASE.every((n) => textures.has(n)) && textures.has(pose)) readyRef.current = true
    wake.current()
  }, [textures, built])

  // Parallax (tokens.md: touch-drag, a few px of depth offset): a drag that starts on the poster, by finger, pen or
  // mouse, shifts each layer by its depth; letting go settles it back. No hover, no gyro, never idle.
  const par = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  useEffect(() => {
    const host = gl.domElement.closest<HTMLElement>(".world")
    const frameEl = gl.domElement.closest<HTMLElement>(".world-frame")
    let drag: { id: number; x: number; y: number } | null = null
    const off = (t: EventTarget | null) => t instanceof Element && !!t.closest("main, .chips, .pass-zone, button, input, select, textarea, a")
    const onPoster = (e: PointerEvent) => {
      const r = frameEl?.getBoundingClientRect()
      return !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    }
    const clampUnit = (v: number) => Math.max(-1, Math.min(1, v))
    const set = (tx: number, ty: number) => {
      par.current.tx = tx
      par.current.ty = ty
      wake.current()
    }
    const down = (e: PointerEvent) => {
      if (drag || off(e.target) || !onPoster(e) || !input.current.live) return
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY }
    }
    const move = (e: PointerEvent) => {
      if (drag && e.pointerId === drag.id && input.current.live) set(clampUnit((e.clientX - drag.x) / 120), clampUnit((e.clientY - drag.y) / 120))
    }
    const up = (e: PointerEvent) => {
      if (drag && e.pointerId === drag.id) {
        drag = null
        set(0, 0)
      }
    }
    window.addEventListener("pointerdown", down, { passive: true })
    window.addEventListener("pointermove", move, { passive: true })
    window.addEventListener("pointerup", up, { passive: true })
    window.addEventListener("pointercancel", up, { passive: true })
    return () => {
      window.removeEventListener("pointerdown", down)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      host?.style.removeProperty("--par-x")
      host?.style.removeProperty("--par-y")
    }
  }, [gl])

  // The loop: one rAF tick per display frame while anything moves; draws at 30 Hz for ambient, every frame for a
  // beat change or a drag; stops when hidden, on the code beat once the strike has landed, and when nothing moves.
  useEffect(() => {
    const host = gl.domElement.closest<HTMLElement>(".world")
    const sampler = new FrameSampler()
    let raf = 0
    let running = false
    let lastTick = 0
    let lastRender = 0
    let renderedLast = false
    let ambientT = 0
    let demoted = false
    let parWritten = { x: Number.NaN, y: Number.NaN }

    const apply = (now: number, dt: number) => {
      const c = clock.current
      const v = (p: Prop) => valueOf(c, p, now)
      const { beat: b, tier: t } = input.current
      // Parallax: ease toward the target.
      const p = par.current
      const k = 1 - Math.exp(-dt / PARALLAX_TAU)
      p.x += (p.tx - p.x) * k
      p.y += (p.ty - p.y) * k
      if (Math.abs(p.tx - p.x) < 0.002 && Math.abs(p.ty - p.y) < 0.002) {
        p.x = p.tx
        p.y = p.ty
      }
      const px = p.x * PARALLAX.maxPx
      const py = p.y * PARALLAX.maxPx
      const offset = (depth: number) => [px * depth, py * depth]
      if (host && (px !== parWritten.x || py !== parWritten.y)) {
        host.style.setProperty("--par-x", `${px.toFixed(2)}px`)
        host.style.setProperty("--par-y", `${py.toFixed(2)}px`)
        parWritten = { x: px, y: py }
      }

      for (const [name, pl] of built.plates) {
        const u = pl.mat.uniforms
        let o = offset(pl.depth)
        if (pl.layer.bank) {
          const n = pl.layer.bank
          u.uOpacity.value = v(`bank${n}` as Prop)
          u.uRadius.value = v(`reveal${n}` as Prop) * (pl.reach! + FEATHER)
        } else if (name === "l8-shirt") {
          const s = v("shirt")
          u.uOpacity.value = s
          o = [o[0] + SHIRT_SWING_PX * (1 - s), o[1]]
        } else if (LAZY.has(name)) {
          u.uOpacity.value = v(name as Prop)
        } else {
          u.uOpacity.value = 1
        }
        u.uOffset.value = o
      }
      built.glows.forEach((g, i) => {
        const level = v(`bank${i + 1}` as Prop)
        g.mat.uniforms.uOpacity.value = level
        g.mat.uniforms.uOffset.value = offset(parallaxDepth("glow", DEPTH.glow, t))
        const d = 2 * g.r * v(`glow${i + 1}` as Prop)
        g.mesh.scale.set(d, d, 1)
      })
      built.beams.forEach((m, i) => {
        m.uniforms.uOpacity.value = v(`bank${i + 1}` as Prop)
        m.uniforms.uOffset.value = offset(parallaxDepth("glow", DEPTH.glow, t))
      })
      built.halo.uniforms.uOffset.value = offset(parallaxDepth("halo", DEPTH.halo, t))
      for (const s of built.smoke) {
        s.mat.uniforms.uTime.value = ambientT
        s.mat.uniforms.uOffset.value = offset(s.depth)
      }
      const e = built.embers.uniforms
      e.uTime.value = ambientT
      e.uSwirl.value = v("swirl")
      e.uBurst.value = v("burst")
      e.uLone.value = b === "no-end" ? 1 : 0
      e.uScale.value = gl.getPixelRatio()
      e.uOffset.value = offset(parallaxDepth("embers", DEPTH.embers, t))
    }

    const busy = (now: number) => {
      const c = clock.current
      const p = par.current
      const tweening = PROPS.some((pr) => now - c.at < trackEnd(c.tracks[pr]))
      const bursting = flying(valueOf(c, "swirl", now)) || flying(valueOf(c, "burst", now))
      // Until the first frame with the base plates is drawn (the textures effect wakes the loop as they land).
      const waiting = !readied.current && readyRef.current
      return tweening || bursting || p.x !== p.tx || p.y !== p.ty || waiting || passBusy.current()
    }

    const tick = (now: number) => {
      const i = input.current
      const ambient = ambientOn({ beat: i.beat, tier: i.tier, still: i.still, reduced: false })
      const gap = lastTick ? now - lastTick : 0
      lastTick = now
      const action = frameAction({ hidden: document.visibilityState === "hidden", busy: busy(now), ambient, sinceRenderMs: now - lastRender })
      if (renderedLast && gap > 0 && !demoted && sampler.add(now, gap)) {
        demoted = true
        demote(demotionFor(glTier), `slow frames (median ${Math.round(sampler.medians.at(-1) ?? 0)} ms)`)
      }
      renderedLast = false
      if (action === "stop") {
        running = false
        lastTick = 0
        sampler.pause()
        return
      }
      raf = requestAnimationFrame(tick)
      if (action === "wait") return
      const dt = lastRender ? Math.min(0.1, (now - lastRender) / 1000) : 0
      if (ambient) ambientT += dt
      lastRender = now
      apply(now, dt)
      advance(now / 1000, false, get())
      renderedLast = true
      if (!readied.current && readyRef.current) {
        readied.current = true
        // The frame just drawn is on screen at the next one: then the stage may fade the canvas in.
        requestAnimationFrame(() => onReady())
      }
    }

    wake.current = () => {
      if (running) return
      running = true
      lastRender = 0
      raf = requestAnimationFrame(tick)
    }
    const onVisibility = () => document.visibilityState === "visible" && wake.current()
    document.addEventListener("visibilitychange", onVisibility)
    wake.current()
    return () => {
      cancelAnimationFrame(raf)
      running = false
      wake.current = () => {}
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [built, get, gl, glTier, onReady])

  // A change of tier, Still or liveness can turn the ambient loop back on.
  useEffect(() => {
    wake.current()
  }, [tier, still, live])

  return (
    <>
      <primitive object={built.group} dispose={null} />
      {pass && beat === "cover" && <LanyardPass request={pass} live={live} wake={wakeLoop} busyRef={passBusy} />}
    </>
  )
}
