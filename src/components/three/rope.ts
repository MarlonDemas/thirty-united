/** One uniform factor that fits the card inside a rect: the ticket scales, never distorts. */
export function settleScale(rectW: number, rectH: number, cardPxW: number, cardPxH: number): number {
  return Math.min(rectW / cardPxW, rectH / cardPxH)
}

/**
 * Hand-rolled 2D verlet lanyard: a pinned rope of `segments` links, then a rigid card rod hanging from
 * its end. Plain maths, no dependencies. Point `a` is the card's top edge, `b` its bottom edge.
 * With a `lean`, the card's top is pulled softly toward `lean.x` (stiffness `k` per solver pass), so a rope pinned off to
 * one side leans in to the card instead of hanging straight down from the pin.
 */
export class Lanyard {
  readonly n: number
  readonly a: number // index of the card attach point
  readonly b: number
  x: Float64Array
  y: Float64Array
  px: Float64Array
  py: Float64Array
  private w: Float64Array
  private len: Float64Array
  private grab: { t: number; tx: number; ty: number } | null = null
  private still = 0

  readonly anchorX: number
  readonly anchorY: number
  readonly cardH: number
  readonly bounds: { x: number; yMin: number }
  readonly lean: { x: number; k: number } | null

  constructor(
    anchorX: number,
    anchorY: number,
    ropeLen: number,
    segments: number,
    cardH: number,
    bounds: { x: number; yMin: number },
    kick = 0,
    lean: { x: number; k: number } | null = null,
  ) {
    this.anchorX = anchorX
    this.anchorY = anchorY
    this.cardH = cardH
    this.bounds = bounds
    this.lean = lean
    this.n = segments + 2
    this.a = segments
    this.b = segments + 1
    this.x = new Float64Array(this.n)
    this.y = new Float64Array(this.n)
    this.w = new Float64Array(this.n).fill(1)
    this.len = new Float64Array(this.n - 1)
    const seg = ropeLen / segments
    // A leaning rope starts on the straight line from the pin to the card's rest point, so it does not whip across.
    const toX = lean ? lean.x : anchorX
    const drop = Math.sqrt(Math.max(0, ropeLen * ropeLen - (toX - anchorX) ** 2))
    for (let i = 0; i < this.n; i++) {
      const f = Math.min(i, segments) / segments
      this.x[i] = anchorX + (toX - anchorX) * f
      this.y[i] = anchorY - drop * f - (i > segments ? cardH : 0)
      if (i < segments + 1) this.len[i] = seg
    }
    this.len[this.a] = cardH
    this.w[0] = 0
    this.w[this.a] = 0.5
    this.w[this.b] = 0.3 // heavy card
    this.px = this.x.slice()
    this.py = this.y.slice()
    this.px[this.b] -= kick // a small initial swing so the guest sees it is alive
    this.px[this.a] -= kick * 0.4
  }

  /** True until the rope and card have been still for 30 steps. */
  get active(): boolean {
    return this.still < 30
  }

  /** One fixed step. Returns true while still moving. */
  step(g: number, damp: number, dt: number): boolean {
    const { n, x, y, px, py } = this
    for (let i = 1; i < n; i++) {
      const vx = (x[i] - px[i]) * damp
      const vy = (y[i] - py[i]) * damp
      px[i] = x[i]
      py[i] = y[i]
      x[i] += vx
      y[i] += vy - g * dt * dt
    }
    const gr = this.grab
    if (gr) {
      const { a, b } = this
      let dx = gr.tx - (x[a] + gr.t * (x[b] - x[a]))
      let dy = gr.ty - (y[a] + gr.t * (y[b] - y[a]))
      const m = Math.hypot(dx, dy)
      const max = this.cardH * 0.5
      if (m > max) {
        dx *= max / m
        dy *= max / m
      }
      x[a] += dx * (1 - gr.t)
      y[a] += dy * (1 - gr.t)
      x[b] += dx * gr.t
      y[b] += dy * gr.t
    }
    for (let it = 0; it < 14; it++) {
      x[0] = this.anchorX
      y[0] = this.anchorY
      for (let i = 0; i < n - 1; i++) {
        const dx = x[i + 1] - x[i]
        const dy = y[i + 1] - y[i]
        const d = Math.hypot(dx, dy) || 1e-9
        const diff = (d - this.len[i]) / d
        const wi = this.w[i]
        const wj = this.w[i + 1]
        const s = wi + wj
        if (s === 0) continue
        x[i] += (dx * diff * wi) / s
        y[i] += (dy * diff * wi) / s
        x[i + 1] -= (dx * diff * wj) / s
        y[i + 1] -= (dy * diff * wj) / s
      }
      if (this.lean) x[this.a] += (this.lean.x - x[this.a]) * this.lean.k
    }
    // keep the card inside the frame (a fling must not leave the screen)
    for (const i of [this.a, this.b]) {
      const lim = this.bounds.x
      if (x[i] > lim) { x[i] = lim; px[i] = Math.max(px[i], lim) }
      if (x[i] < -lim) { x[i] = -lim; px[i] = Math.min(px[i], -lim) }
      if (y[i] < this.bounds.yMin) { y[i] = this.bounds.yMin; py[i] = Math.min(py[i], y[i]) }
    }
    let v = 0
    for (let i = 1; i < n; i++) v = Math.max(v, Math.hypot(x[i] - px[i], y[i] - py[i]))
    this.still = v < this.cardH * 0.0008 && !gr ? this.still + 1 : 0
    return this.active
  }

  wake() {
    this.still = 0
  }

  /** Grab the card at a world point: remembers where along the card rod it was caught. */
  grabAt(x: number, y: number) {
    const { a, b } = this
    const ax = this.x[a]
    const ay = this.y[a]
    const dx = this.x[b] - ax
    const dy = this.y[b] - ay
    const t = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
    this.grab = { t, tx: x, ty: y }
    this.wake()
  }

  /** Move the held point. No-op when nothing is held; returns whether it was. */
  dragTo(x: number, y: number): boolean {
    if (!this.grab) return false
    this.grab.tx = x
    this.grab.ty = y
    return true
  }

  /** Let go. Returns whether anything was held. */
  release(): boolean {
    const had = this.grab !== null
    this.grab = null
    this.wake()
    return had
  }
}
