import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from "react"
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Vector3, type CanvasTexture } from "three"
import { Lanyard, settleScale } from "./rope"
import { makeTicketTextures, TICKET_ASPECT } from "./ticketTexture"
import { cssVar, makeShadowTexture, makeSheenTexture, makeStrapTexture } from "./sceneTextures"
import { DebugOverlay, recordFrame, stats } from "./DebugOverlay"

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
export const SETTLE_MS = 400
const CAMERA_Z = 10
// The shadow falls down and right, scaled with the ticket width (14 and 22px on a 358px ticket).
const SHADOW_DX = 0.039
const SHADOW_DY = 0.061

/** Brings the ticket face-front over the DOM ticket's rect in about 400 ms, input locked. Resolves when at rest. */
export type SettleFn = (domRect: DOMRect) => Promise<void>

type Faces = { front: CanvasTexture; back: CanvasTexture }

function Scene({ faces, onReady, settleRef }: { faces: Faces; onReady: () => void; settleRef: MutableRefObject<SettleFn | null> }) {
  const { viewport, invalidate, gl, camera } = useThree()
  const W = viewport.width
  const H = viewport.height
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

  const sim = useMemo(
    () => new Lanyard(0, H * 0.54, H * 0.58, SEGMENTS, cardH, { x: W / 2 - cardW / 2, yMin: -H / 2 + 0.03 * H }, cardW * 0.18),
    [W, H, cardW, cardH],
  )
  const card = useRef<Group>(null)
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
  const readied = useRef(false)

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
    stats.status = "running"
    return () => strap.dispose()
  }, [gl, strap])

  // Hand-off to "Tear open": ease to the DOM ticket's pose and size, input locked, strap fading out.
  useEffect(() => {
    settleRef.current = (rect) =>
      new Promise<void>((resolve) => {
        const c = card.current
        const box = gl.domElement.getBoundingClientRect()
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
        invalidate()
      })
    return () => {
      settleRef.current = null
    }
  }, [settleRef, gl, W, cardW, cardH, sim, invalidate])

  // Pointer: world position on the z=0 plane under the pointer.
  useEffect(() => {
    const el = gl.domElement
    const v = new Vector3()
    const toWorld = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      v.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1, 0.5).unproject(camera)
      v.sub(camera.position).normalize()
      const k = -camera.position.z / v.z
      return { x: camera.position.x + v.x * k, y: camera.position.y + v.y * k }
    }
    const move = (e: PointerEvent) => {
      if (locked.current) return
      const p = toWorld(e)
      if (sim.dragTo(p.x, p.y)) invalidate()
    }
    const up = (e: PointerEvent) => {
      if (!sim.release()) return
      el.releasePointerCapture?.(e.pointerId)
      invalidate()
    }
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up)
    el.addEventListener("pointercancel", up)
    return () => {
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerup", up)
      el.removeEventListener("pointercancel", up)
    }
  }, [gl, camera, sim, invalidate])

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (locked.current) return
    sim.grabAt(e.point.x, e.point.y)
    gl.domElement.setPointerCapture?.(e.pointerId)
    invalidate()
  }

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

  useFrame((_, delta) => {
    const st = settle.current
    if (st) {
      const t = Math.min(1, (performance.now() - st.t0) / SETTLE_MS)
      const e = 1 - Math.pow(1 - t, 3)
      const l = (a: number, b: number) => a + (b - a) * e
      pose(l(st.from.x, st.to.x), l(st.from.y, st.to.y), l(st.from.rz, 0), l(st.from.yaw, 0), l(1, st.to.s), l(1, st.to.s))
      for (const m of [strapMat.current, clipMat.current]) if (m) m.opacity = 1 - e
      if (t < 1) invalidate()
      else {
        settle.current = null
        st.done()
      }
      return
    }
    if (locked.current) return // handed off: the ticket stays where it settled until the scene is unmounted
    acc.current += Math.min(delta, 0.05)
    while (acc.current >= STEP) {
      acc.current -= STEP
      sim.step(H * 5, 0.98, STEP)
    }
    let moving = sim.active // a frame with no step (120 Hz, first frame) must not stall the demand loop
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
    const tile = (H * 0.58) / SEGMENTS / (strapW * 8) // one 64x512 texture tile is 8 strap widths long
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
    stats.canvas = `${gl.domElement.width}x${gl.domElement.height}`
    if (moving) invalidate()
    if (!readied.current) {
      readied.current = true
      requestAnimationFrame(onReady)
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
        <mesh onPointerDown={onDown}>
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

export default function LanyardTicket({
  hostLine,
  onReady,
  onFail,
  settleRef,
}: {
  hostLine: string
  onReady: () => void
  onFail: () => void
  settleRef: MutableRefObject<SettleFn | null>
}) {
  const debug = useMemo(() => new URLSearchParams(window.location.search).get("debug") === "1", [])
  const [faces, setFaces] = useState<Faces | null>(null)
  const onFailRef = useRef(onFail)
  useEffect(() => {
    onFailRef.current = onFail
  })
  // R3F forces a context loss when it tears its root down (the hand-off to the DOM pass): only a loss while mounted
  // is a failure. Without this every tear-open demoted the session to T1, and the WebGL world with it.
  const mountedRef = useRef(true)
  useLayoutEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let dead = false
    stats.status = "drawing ticket"
    makeTicketTextures(hostLine, 4)
      .then((f) => !dead && setFaces(f))
      .catch(() => onFailRef.current())
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

  return (
    <>
      {faces && (
        <Canvas
          className="lanyard-canvas"
          frameloop="demand"
          dpr={[1, 1.5]}
          flat
          camera={{ position: [0, 0, CAMERA_Z], fov: 30 }}
          gl={{ antialias: true, alpha: true }}
          style={{ touchAction: "none" }}
          onCreated={({ gl }) =>
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault()
              if (!mountedRef.current) return
              stats.status = "CONTEXT LOST"
              onFailRef.current()
            })
          }
        >
          <Scene faces={faces} onReady={onReady} settleRef={settleRef} />
        </Canvas>
      )}
      {debug && <DebugOverlay />}
    </>
  )
}
