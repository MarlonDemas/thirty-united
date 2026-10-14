import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, Vector3, type CanvasTexture } from "three"
import { Lanyard } from "./rope"
import { makeTicketTextures, TICKET_ASPECT } from "./ticketTexture"
import { DebugOverlay, recordFrame, stats } from "./DebugOverlay"

const STEP = 1 / 60
const SEGMENTS = 6
const INK = "#1B1A17"
const INK2 = "#5E5A50"
const EDGE = "#CFC6B2"

type Faces = { front: CanvasTexture; back: CanvasTexture }

function Scene({ faces, onReady }: { faces: Faces; onReady: () => void }) {
  const { viewport, invalidate, gl, camera } = useThree()
  const W = viewport.width
  const H = viewport.height
  const cardW = Math.min(W * 0.84, H * 0.8)
  const cardH = cardW / TICKET_ASPECT
  const strapW = cardW * 0.06

  const sim = useMemo(
    () => new Lanyard(0, H * 0.54, H * 0.58, SEGMENTS, cardH, { x: W / 2 - cardW / 2, yMin: -H / 2 + 0.03 * H }, cardW * 0.18),
    [W, H, cardW, cardH],
  )
  const card = useRef<Group>(null)
  const clip = useRef<Mesh>(null)
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
      if (!sim.grab) return
      const p = toWorld(e)
      sim.grab.tx = p.x
      sim.grab.ty = p.y
      invalidate()
    }
    const up = (e: PointerEvent) => {
      if (!sim.grab) return
      sim.grab = null
      sim.wake()
      el.releasePointerCapture?.(e.pointerId)
      el.style.cursor = "grab"
      invalidate()
    }
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up)
    el.addEventListener("pointercancel", up)
    el.style.cursor = "grab"
    return () => {
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerup", up)
      el.removeEventListener("pointercancel", up)
    }
  }, [gl, camera, sim, invalidate])

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const { a, b } = sim
    const ax = sim.x[a]
    const ay = sim.y[a]
    const dx = sim.x[b] - ax
    const dy = sim.y[b] - ay
    const t = Math.min(1, Math.max(0, ((e.point.x - ax) * dx + (e.point.y - ay) * dy) / (dx * dx + dy * dy)))
    sim.grab = { t, tx: e.point.x, ty: e.point.y }
    sim.wake()
    gl.domElement.setPointerCapture?.(e.pointerId)
    gl.domElement.style.cursor = "grabbing"
    invalidate()
  }

  useFrame((_, delta) => {
    acc.current += Math.min(delta, 0.05)
    let moving = false
    while (acc.current >= STEP) {
      acc.current -= STEP
      moving = sim.step(H * 5, 0.98, STEP)
    }
    const { a, b, x, y, px } = sim
    // yaw follows sideways speed, then relaxes to flat
    const target = Math.max(-0.7, Math.min(0.7, ((x[a] - px[a]) / STEP) * (0.9 / H)))
    yaw.current += (target - yaw.current) * 0.12
    if (!moving && Math.abs(yaw.current) < 0.002) yaw.current = 0
    else moving = true
    const c = card.current
    if (c) {
      c.position.set((x[a] + x[b]) / 2, (y[a] + y[b]) / 2, 0)
      c.rotation.set(0, yaw.current, Math.atan2(x[b] - x[a], -(y[b] - y[a])), "ZYX")
    }
    clip.current?.position.set(x[a], y[a], 0.01)
    // strap ribbon
    const pos = strap.getAttribute("position") as BufferAttribute
    for (let i = 0; i <= SEGMENTS; i++) {
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
      <ambientLight intensity={2.2} />
      <directionalLight position={[-3, 5, 7]} intensity={0.8} />
      <mesh geometry={strap} frustumCulled={false}>
        <meshStandardMaterial color={INK} side={DoubleSide} roughness={0.9} />
      </mesh>
      <mesh ref={clip} frustumCulled={false}>
        <boxGeometry args={[strapW * 1.5, strapW * 1.4, strapW * 0.5]} />
        <meshStandardMaterial color={INK2} roughness={0.5} metalness={0.4} />
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
      </group>
    </>
  )
}

export default function LanyardTicket({
  hostLine,
  onReady,
  onFail,
}: {
  hostLine: string
  onReady: () => void
  onFail: () => void
}) {
  const debug = useMemo(() => new URLSearchParams(window.location.search).get("debug") === "1", [])
  const [faces, setFaces] = useState<Faces | null>(null)
  const onFailRef = useRef(onFail)
  useEffect(() => {
    onFailRef.current = onFail
  })

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
          frameloop="demand"
          dpr={[1, 1.5]}
          flat
          camera={{ position: [0, 0, 10], fov: 30 }}
          gl={{ antialias: true, alpha: true }}
          style={{ touchAction: "none" }}
          onCreated={({ gl }) =>
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault()
              stats.status = "CONTEXT LOST"
              onFailRef.current()
            })
          }
        >
          <Scene faces={faces} onReady={onReady} />
        </Canvas>
      )}
      {debug && <DebugOverlay />}
    </>
  )
}
