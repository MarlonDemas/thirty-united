/**
 * Hand-rolled 2D verlet lanyard: a pinned rope of `segments` links, then a rigid card rod hanging from
 * its end. Plain maths, no dependencies. Point `a` is the card's top edge, `b` its bottom edge.
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
  grab: { t: number; tx: number; ty: number } | null = null
  private still = 0

  readonly anchorX: number
  readonly anchorY: number
  readonly cardH: number
  readonly bounds: { x: number; yMin: number }

  constructor(
    anchorX: number,
    anchorY: number,
    ropeLen: number,
    segments: number,
    cardH: number,
    bounds: { x: number; yMin: number },
    kick = 0,
  ) {
    this.anchorX = anchorX
    this.anchorY = anchorY
    this.cardH = cardH
    this.bounds = bounds
    this.n = segments + 2
    this.a = segments
    this.b = segments + 1
    this.x = new Float64Array(this.n)
    this.y = new Float64Array(this.n)
    this.w = new Float64Array(this.n).fill(1)
    this.len = new Float64Array(this.n - 1)
    const seg = ropeLen / segments
    for (let i = 0; i < this.n; i++) {
      this.x[i] = anchorX
      this.y[i] = anchorY - (i < segments + 1 ? i * seg : segments * seg + cardH)
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
    return this.still < 30
  }

  wake() {
    this.still = 0
  }
}
