import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from "react"
import { createPortal, useFrame, useThree } from "@react-three/fiber"
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NormalBlending,
  PerspectiveCamera,
  type Material,
  type Object3D,
  Raycaster,
  Scene as ThreeScene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  type CanvasTexture,
} from "three"
import { toWorld } from "@/world/gl/config"
import { boundsOf, passTarget, posterRect, type PassRequest } from "@/world/pass"
import { fadeToward } from "@/world/passFade"
import { POSTER } from "@/world/layers"
import { Lanyard, settleScale } from "./rope"
import { makeTicketTextures, TICKET_ASPECT } from "./ticketTexture"
import { cssVar, makeShadowTexture, makeSheenTexture, makeStrapTexture } from "./sceneTextures"
import { recordFrame, stats } from "./DebugOverlay"

const STEP = 1 / 60
const SEGMENTS = 6
const INK2 = "#5E5A50"
const EDGE = "#CFC6B2"
// The pass's own lights: two neutral whites at the positions and intensities the pass was tuned with, so it keeps its look
// over the world stage without tinting it. Light and strap colours are read from the scoped --pass-* tokens; the card
// edge and clip colours above are literals.
const KEY_POS: [number, number, number] = [-4, 6, 5] // upper left, in front: the left floodlight's side
const KEY_INTENSITY = 4.2
const AMBIENT_INTENSITY = 1.6
const SETTLE_MS = 400
const CAMERA_Z = 10
const FOV = 30
// The shadow falls down and right, scaled with the ticket width (14 and 22px on a 358px ticket).
const SHADOW_DX = 0.039
const SHADOW_DY = 0.061
/**
 * Lux move 2 (2026-10-16): the strap is pinned left of Makes's face (this fraction of the pass box's width, from its
 * centre) and leans in to the card, so it never crosses his eyes on the cover, through the swing included (checked
 * across phone and desktop cover shots). LEAN_K is the softest pull on the card's top that keeps the face clear.
 */
const ANCHOR_X = -0.4
const LEAN_K = 0.05
/** The composite sits over everything else the world draws (plates, smoke, embers). */
const PASS_ORDER = 1000

type Faces = { front: CanvasTexture; back: CanvasTexture }
type View = { opacity: number; fadeAt: number; drawn: boolean; wasMoving: boolean; moving: boolean; ready: boolean }

/**
 * The composite: the pass's own render target onto the world canvas. The target holds what the pass's own canvas held
 * (sRGB-encoded, premultiplied by the blending), so it goes on as is, over everything the world draws.
 */
const compositeVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
const compositeFragment = /* glsl */ `
uniform sampler2D map;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(map, vUv) * uOpacity;
}`

/**
 * three writes linear colour into any render target. The pass's materials write sRGB-encoded colour instead, as they
 * did into the pass's own canvas: an 8-bit target then keeps the same precision in the darks, blends the same way, and
 * stays a plain RGBA8 target (an sRGB multisampled target was the slow path: it halved the frame rate in testing).
 */
const encoded = new WeakSet<Material>()
function encodeOutput(o: Object3D) {
  const mats = (o as Mesh).material
  if (!mats) return
  for (const m of Array.isArray(mats) ? mats : [mats]) {
    if (encoded.has(m)) continue
    encoded.add(m)
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace("#include <colorspace_fragment>", "gl_FragColor = sRGBTransferOETF( gl_FragColor );")
    }
    m.needsUpdate = true
  }
}

type SceneProps = {
  faces: Faces
  W: number
  H: number
  camera: PerspectiveCamera
  rt: WebGLRenderTarget
  quad: MutableRefObject<Mesh | null>
  composite: ShaderMaterial
  request: PassRequest
  wake: () => void
  busyRef: MutableRefObject<() => boolean>
}

function Scene({ faces, W, H, camera, rt, quad, composite, request, wake, busyRef }: SceneProps) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene) // the portal's own scene
  const { host, hit, settleRef, shown } = request
  const cardW = Math.min(W * 0.84, H * 0.8)
  const cardH = cardW / TICKET_ASPECT
  const strapW = cardW * 0.07
  const colors = useMemo(
    () => ({ key: cssVar("--pass-light"), ambient: cssVar("--pass-light"), paper: cssVar("--pass-paper"), ink: cssVar("--pass-ink") }),
    [],
  )
  const strapTex = useMemo(() => makeStrapTexture(colors.ink, colors.paper), [colors])
  const sheenTex = useMemo(() => makeSheenTexture(TICKET_ASPECT), [])
  const shadow = useMemo(() => makeShadowTexture(TICKET_ASPECT), [])
  useEffect(
    () => () => {
      strapTex.dispose()
      sheenTex.dispose()
      shadow.tex.dispose()
    },
    [strapTex, sheenTex, shadow],
  )

  const ropeLen = Math.hypot(ANCHOR_X * W, H * 0.58) // the pin is off to the side: the same drop, on the slant
  const sim = useMemo(
    () =>
      // The first swing goes away from his face (a negative kick).
      new Lanyard(ANCHOR_X * W, H * 0.54, ropeLen, SEGMENTS, cardH, { x: W / 2 - cardW / 2, yMin: -H / 2 + 0.03 * H }, -cardW * 0.18, {
        x: 0,
        k: LEAN_K,
      }),
    [W, H, cardW, cardH, ropeLen],
  )
  const card = useRef<Group>(null)
  const cardMesh = useRef<Mesh>(null)
  const clip = useRef<Mesh>(null)
  const shadowMesh = useRef<Mesh>(null)
  const strapMat = useRef<MeshStandardMaterial>(null)
  const clipMat = useRef<MeshStandardMaterial>(null)
  const sheenMat = useRef<MeshBasicMaterial>(null)
  const locked = useRef(false)
  const settle = useRef<{
    t0: number
    from: { x: number; y: number; rz: number; yaw: number }
    to: { x: number; y: number; s: number }
    done: () => void
  } | null>(null)
  const yaw = useRef(0)
  const acc = useRef(0)
  const view = useRef<View>({ opacity: 0, fadeAt: 0, drawn: false, wasMoving: false, moving: true, ready: false })
  // The frame that tells the stage the pass is up: cancelled if the pass goes first, so a pass never drawn is never handed over to.
  const readyRaf = useRef(0)
  useEffect(() => () => cancelAnimationFrame(readyRaf.current), [])
  // Live inputs the frame loop reads (and the DOM and GL handles it writes) without re-subscribing.
  const input = useRef({ shown, request, quad, composite })
  useLayoutEffect(() => {
    input.current = { shown, request, quad, composite }
  })
  // A fade (in once the pass is up, out when the DOM pass takes over) needs frames.
  useEffect(() => {
    wake()
  }, [shown, wake])

  // The world's loop runs at full rate while the pass swings, settles or fades, and stops when it is at rest.
  useEffect(() => {
    busyRef.current = () => {
      const v = view.current
      return v.moving || settle.current !== null || v.opacity !== (input.current.shown ? 1 : 0)
    }
    return () => {
      busyRef.current = () => false
    }
  }, [busyRef])

  const strap = useMemo(() => {
    const g = new BufferGeometry()
    const pts = SEGMENTS + 1
    g.setAttribute("position", new BufferAttribute(new Float32Array(pts * 2 * 3), 3))
    const idx: number[] = []
    for (let i = 0; i < pts - 1; i++) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    g.setAttribute("uv", new BufferAttribute(new Float32Array(pts * 2 * 2), 2))
    g.setIndex(idx)
    return g
  }, [])

  useEffect(() => {
    stats.renderer = "n/a"
    try {
      const ctx = gl.getContext()
      const ext = ctx.getExtension("WEBGL_debug_renderer_info")
      stats.renderer = ext ? String(ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "masked (no debug ext)"
      stats.glVersion = gl.capabilities.isWebGL2 ? "2" : "1"
    } catch {
      /* ignore */
    }
    stats.dpr = gl.getPixelRatio()
    stats.status = "running (world canvas)"
    return () => strap.dispose()
  }, [gl, strap])

  // Hand-off to "Tear open": ease to the DOM ticket's pose and size, input locked, strap fading out.
  useEffect(() => {
    settleRef.current = (rect) =>
      new Promise<void>((resolve) => {
        const c = card.current
        const box = host.getBoundingClientRect()
        if (!c || !box.width) return resolve()
        const unit = W / box.width // world units per css px
        locked.current = true
        sim.release()
        const cardPxW = cardW / unit
        const cardPxH = cardH / unit
        settle.current = {
          t0: performance.now(),
          from: { x: c.position.x, y: c.position.y, rz: c.rotation.z, yaw: yaw.current },
          to: {
            x: (rect.left + rect.width / 2 - box.left - box.width / 2) * unit,
            y: -(rect.top + rect.height / 2 - box.top - box.height / 2) * unit,
            s: settleScale(rect.width, rect.height, cardPxW, cardPxH),
          },
          done: resolve,
        }
        wake()
      })
    return () => {
      settleRef.current = null
      // Torn down mid-settle (the world canvas went: demotion, hidden tab, resize): let the tear go on in the DOM.
      const st = settle.current
      settle.current = null
      st?.done()
    }
  }, [settleRef, host, W, cardW, cardH, sim, wake])

  // Pointer: the world canvas never takes the pointer, so the pass has its own hit box (`hit`, inside the pass zone,
  // touch-action none) that follows the card. A press there that lands on the card grabs it; the world's parallax
  // ignores the pass zone, so a drag on the pass is a pull, never parallax.
  useEffect(() => {
    const ray = new Raycaster()
    const ndc = new Vector2()
    const v = new Vector3()
    const toNdc = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      return ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    }
    // World position on the z=0 plane under the pointer.
    const onPlane = (e: PointerEvent) => {
      toNdc(e)
      v.set(ndc.x, ndc.y, 0.5).unproject(camera)
      v.sub(camera.position).normalize()
      const k = -camera.position.z / v.z
      return { x: camera.position.x + v.x * k, y: camera.position.y + v.y * k }
    }
    const down = (e: PointerEvent) => {
      const mesh = cardMesh.current
      if (locked.current || !mesh) return
      ray.setFromCamera(toNdc(e), camera)
      const at = ray.intersectObject(mesh, false)[0]
      if (!at) return
      sim.grabAt(at.point.x, at.point.y)
      hit.setPointerCapture?.(e.pointerId)
      wake()
    }
    const move = (e: PointerEvent) => {
      if (locked.current) return
      const p = onPlane(e)
      if (sim.dragTo(p.x, p.y)) wake()
    }
    const up = (e: PointerEvent) => {
      if (!sim.release()) return
      hit.releasePointerCapture?.(e.pointerId)
      wake()
    }
    hit.addEventListener("pointerdown", down)
    hit.addEventListener("pointermove", move)
    hit.addEventListener("pointerup", up)
    hit.addEventListener("pointercancel", up)
    return () => {
      hit.removeEventListener("pointerdown", down)
      hit.removeEventListener("pointermove", move)
      hit.removeEventListener("pointerup", up)
      hit.removeEventListener("pointercancel", up)
    }
  }, [host, hit, camera, sim, wake])

  // One key light, upper left: the shadow plane sits behind the card, offset down and right, and rides
  // the card's pose. The sheen slides a little with the swing. No shadow maps.
  const pose = (px: number, py: number, rz: number, yawNow: number, sx: number, sy: number) => {
    const c = card.current
    c?.position.set(px, py, 0)
    c?.rotation.set(0, yawNow, rz, "ZYX")
    c?.scale.set(sx, sy, 1)
    // The plane sits well behind the card (a swinging card never dips behind it); position and scale are
    // pre-compensated for the camera's perspective so it lands where the key light would throw it.
    const depth = cardW * 0.6
    const k = (CAMERA_Z + depth) / CAMERA_Z
    shadowMesh.current?.position.set((px + cardW * SHADOW_DX * sx) * k, (py - cardW * SHADOW_DY * sy) * k, -depth)
    shadowMesh.current?.rotation.set(0, 0, rz)
    shadowMesh.current?.scale.set(sx * k, sy * k, 1)
    // The clip sits just past the card's top edge along the card's own up axis, so it never covers the wordmark.
    const topEdge = (cardH * sy) / 2 + strapW * 0.7
    clip.current?.position.set(px - Math.sin(rz) * topEdge, py + Math.cos(rz) * topEdge, 0.01)
    clip.current?.rotation.set(0, 0, rz)
    const map = sheenMat.current?.map
    if (map) map.offset.x = Math.max(-0.15, Math.min(0.15, (rz + yawNow * 0.4) * -0.25))
  }

  /** Steps the rope and poses the pass. Returns whether anything moved. */
  const simulate = (delta: number): boolean => {
    const st = settle.current
    if (st) {
      const t = Math.min(1, (performance.now() - st.t0) / SETTLE_MS)
      const e = 1 - Math.pow(1 - t, 3)
      const l = (a: number, b: number) => a + (b - a) * e
      pose(l(st.from.x, st.to.x), l(st.from.y, st.to.y), l(st.from.rz, 0), l(st.from.yaw, 0), l(1, st.to.s), l(1, st.to.s))
      for (const m of [strapMat.current, clipMat.current]) if (m) m.opacity = 1 - e
      if (t >= 1) {
        settle.current = null
        st.done()
      }
      return true
    }
    if (locked.current) return false // handed off: the ticket stays where it settled until the pass is unmounted
    acc.current += Math.min(delta, 0.05)
    while (acc.current >= STEP) {
      acc.current -= STEP
      sim.step(H * 5, 0.98, STEP)
    }
    let moving = sim.active // a frame with no step (120 Hz, first frame) must not stall the loop
    const { a, b, x, y, px } = sim
    // yaw follows sideways speed, then relaxes to flat
    const target = Math.max(-0.7, Math.min(0.7, ((x[a] - px[a]) / STEP) * (0.9 / H)))
    yaw.current += (target - yaw.current) * 0.12
    if (!moving && Math.abs(yaw.current) < 0.002) yaw.current = 0
    else moving = true
    pose((x[a] + x[b]) / 2, (y[a] + y[b]) / 2, Math.atan2(x[b] - x[a], -(y[b] - y[a])), yaw.current, 1, 1)
    // strap ribbon
    const pos = strap.getAttribute("position") as BufferAttribute
    const uv = strap.getAttribute("uv") as BufferAttribute
    const tile = ropeLen / SEGMENTS / (strapW * 8) // one 64x512 texture tile is 8 strap widths long
    for (let i = 0; i <= SEGMENTS; i++) {
      uv.setXY(i * 2, 0, i * tile)
      uv.setXY(i * 2 + 1, 1, i * tile)
      const i0 = Math.max(0, i - 1)
      const i1 = Math.min(SEGMENTS, i + 1)
      let tx = x[i1] - x[i0]
      let ty = y[i1] - y[i0]
      const l = Math.hypot(tx, ty) || 1
      tx /= l
      ty /= l
      pos.setXYZ(i * 2, x[i] - ty * strapW * 0.5, y[i] + tx * strapW * 0.5, 0)
      pos.setXYZ(i * 2 + 1, x[i] + ty * strapW * 0.5, y[i] - tx * strapW * 0.5, 0)
    }
    pos.needsUpdate = true
    uv.needsUpdate = true
    recordFrame(moving)
    return moving
  }

  // The hit box follows the card's corners on screen (host px).
  const corner = useMemo(() => new Vector3(), [])
  const placeHit = (w: number, h: number) => {
    const c = card.current
    if (!c) return
    const pts: [number, number][] = []
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      corner.set((sx * cardW) / 2, (sy * cardH) / 2, 0).applyMatrix4(c.matrixWorld).project(camera)
      pts.push([((corner.x + 1) / 2) * w, ((1 - corner.y) / 2) * h])
    }
    const b = boundsOf(pts)
    if (!b) return
    const s = input.current.request.hit.style
    s.left = `${Math.round(b.left)}px`
    s.top = `${Math.round(b.top)}px`
    s.width = `${Math.round(b.width)}px`
    s.height = `${Math.round(b.height)}px`
  }

  useFrame((_, delta) => {
    const v = view.current
    const now = performance.now()
    const moving = simulate(delta)
    v.moving = moving

    // Its own target: the host's box in the world canvas's own pixels, at most at the pass's as-built pixel ratio.
    const hb = host.getBoundingClientRect()
    const cb = gl.domElement.getBoundingClientRect()
    const box = posterRect(cb, hb)
    const snap = box && passTarget(box, gl.getPixelRatio(), cb.width / POSTER.w)
    if (snap && (rt.width !== snap.w || rt.height !== snap.h)) {
      rt.setSize(snap.w, snap.h)
      v.drawn = false
    }
    if (snap && (moving || v.wasMoving || !v.drawn)) {
      scene.traverse(encodeOutput)
      const prev = gl.getRenderTarget()
      gl.setRenderTarget(rt)
      gl.render(scene, camera)
      gl.setRenderTarget(prev)
      v.drawn = true
      stats.canvas = `${rt.width}x${rt.height} (target)`
      if (input.current.shown) placeHit(hb.width, hb.height)
    }
    v.wasMoving = moving

    // The cross-fade with the DOM pass, same 160 ms and --ease-fade curve as its CSS fade.
    const want = input.current.shown ? 1 : 0
    if (v.opacity !== want) {
      v.opacity = fadeToward(v.opacity, want, v.fadeAt ? now - v.fadeAt : 0)
      v.fadeAt = v.opacity === want ? 0 : now
    }
    const { shown: on, request: req, quad: quadRef, composite: mat } = input.current
    mat.uniforms.uOpacity.value = v.opacity
    req.hit.hidden = !on
    if (on && req.hit.style.width === "") placeHit(hb.width, hb.height)

    // The composite quad over the host's box, in poster px.
    const q = quadRef.current
    const r = snap?.rect
    if (q) {
      q.visible = !!r && v.opacity > 0
      if (r) {
        const [cx, cy] = toWorld((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2)
        q.position.set(cx, cy, 0)
        q.scale.set(r.x1 - r.x0, r.y1 - r.y0, 1)
      }
    }

    if (!v.ready) {
      v.ready = true
      // The frame just drawn is on screen at the next one: then the stage may hand over to the pass.
      readyRaf.current = requestAnimationFrame(() => input.current.request.onReady())
    }
  })

  return (
    <>
      <ambientLight color={colors.ambient} intensity={AMBIENT_INTENSITY} />
      <directionalLight color={colors.key} position={KEY_POS} intensity={KEY_INTENSITY} />
      <mesh ref={shadowMesh} frustumCulled={false} renderOrder={-1}>
        <planeGeometry args={[cardW * (1 + shadow.padX), cardH * (1 + shadow.padY)]} />
        <meshBasicMaterial map={shadow.tex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh geometry={strap} frustumCulled={false}>
        <meshStandardMaterial ref={strapMat} map={strapTex} transparent side={DoubleSide} roughness={0.9} />
      </mesh>
      <mesh ref={clip} frustumCulled={false}>
        <boxGeometry args={[strapW * 1.5, strapW * 1.4, strapW * 0.5]} />
        <meshStandardMaterial ref={clipMat} transparent color={INK2} roughness={0.5} metalness={0.4} />
      </mesh>
      <group ref={card} frustumCulled={false}>
        <mesh ref={cardMesh}>
          <boxGeometry args={[cardW, cardH, cardW * 0.014]} />
          <meshStandardMaterial attach="material-0" color={EDGE} />
          <meshStandardMaterial attach="material-1" color={EDGE} />
          <meshStandardMaterial attach="material-2" color={EDGE} />
          <meshStandardMaterial attach="material-3" color={EDGE} />
          <meshStandardMaterial attach="material-4" map={faces.front} roughness={0.9} />
          <meshStandardMaterial attach="material-5" map={faces.back} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, cardW * 0.007 + 0.002]} renderOrder={1}>
          <planeGeometry args={[cardW, cardH]} />
          <meshBasicMaterial ref={sheenMat} map={sheenTex} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </>
  )
}

/** The pass's box on screen, in CSS px; follows resizes as the pass's canvas used to. */
function useHostSize(host: HTMLElement) {
  const [size, setSize] = useState(() => ({ w: host.clientWidth, h: host.clientHeight }))
  useEffect(() => {
    const measure = () => setSize((s) => (s.w === host.clientWidth && s.h === host.clientHeight ? s : { w: host.clientWidth, h: host.clientHeight }))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(host)
    return () => ro.disconnect()
  }, [host])
  return size
}

function PassView({ faces, w, h, request, wake, busyRef }: { faces: Faces; w: number; h: number } & Omit<LanyardPassProps, "live">) {
  const gl = useThree((s) => s.gl)
  const [scene] = useState(() => new ThreeScene())
  const camera = useMemo(() => {
    const c = new PerspectiveCamera(FOV, w / h, 0.1, 100)
    c.position.set(0, 0, CAMERA_Z)
    c.updateMatrixWorld()
    return c
  }, [w, h])
  // The visible height and width at z=0, as R3F's viewport gave them to the pass's own canvas.
  const H = 2 * CAMERA_Z * Math.tan((FOV * Math.PI) / 360)
  const W = (H * w) / h
  // Multisampled, as the pass's canvas was (antialias), with a depth buffer the world canvas does not have.
  const rt = useMemo(() => new WebGLRenderTarget(1, 1, { samples: Math.min(4, gl.capabilities.maxSamples) }), [gl])
  const composite = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: compositeVertex,
        fragmentShader: compositeFragment,
        uniforms: { map: { value: rt.texture }, uOpacity: { value: 0 } },
        transparent: true,
        premultipliedAlpha: true,
        blending: NormalBlending,
        depthTest: false,
        depthWrite: false,
      }),
    [rt],
  )
  useEffect(
    () => () => {
      composite.dispose()
      rt.dispose()
    },
    [composite, rt],
  )
  const quad = useRef<Mesh>(null)
  return (
    <>
      {createPortal(
        <Scene faces={faces} W={W} H={H} camera={camera} rt={rt} quad={quad} composite={composite} request={request} wake={wake} busyRef={busyRef} />,
        scene,
      )}
      <mesh ref={quad} material={composite} renderOrder={PASS_ORDER} frustumCulled={false} visible={false}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </>
  )
}

export type LanyardPassProps = {
  request: PassRequest
  /** The world canvas covers the DOM plates: the pass may start (so the guest sees its drop and swing). */
  live: boolean
  /** Wakes the world's frame loop. */
  wake: () => void
  /** The pass sets this to tell the world's loop it needs frames. */
  busyRef: MutableRefObject<() => boolean>
}

/**
 * The lanyard pass as one object inside the world canvas (B2): the card, rope, strap and its two neutral lights in
 * their own scene and perspective camera, drawn into their own multisampled target and composited over the world on
 * the host's box. One WebGL context for the cover on T3 and T2.
 */
export default function LanyardPass({ request, live, wake, busyRef }: LanyardPassProps) {
  const { host, hostLine } = request
  const size = useHostSize(host)
  const [faces, setFaces] = useState<Faces | null>(null)
  const latest = useRef(request)
  useLayoutEffect(() => {
    latest.current = request
  })

  useEffect(() => {
    let dead = false
    stats.status = "drawing ticket"
    makeTicketTextures(hostLine, 4)
      .then((f) => !dead && setFaces(f))
      .catch(() => latest.current.onFail())
    return () => {
      dead = true
    }
  }, [hostLine])
  useEffect(
    () => () => {
      faces?.front.dispose()
      faces?.back.dispose()
    },
    [faces],
  )
  // Leaving the world canvas (it unmounted, or the sealed view let go): the stage shows its DOM pass again.
  useEffect(
    () => () => {
      latest.current.hit.hidden = true
      latest.current.onGone()
    },
    [],
  )

  if (!faces || !live || !size.w || !size.h) return null
  return <PassView faces={faces} w={size.w} h={size.h} request={request} wake={wake} busyRef={busyRef} />
}
