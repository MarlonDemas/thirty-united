import { describe, expect, it } from "vitest"
import { scenePlates, triangleAffine, warpMesh } from "@/poster/scene"
import { applyMatrix, quadMatrix } from "@/world/draw"
import { QUADS, type Point } from "@/world/layers"

const names = (o: Parameters<typeof scenePlates>[0]) => scenePlates(o).map((l) => l.name)

describe("scenePlates", () => {
  it("the signing: every bank lit, the signing pose, THIRTY and UNITED; no other pose, no hanging shirt", () => {
    const n = names({ pose: "l7-makes-signing", lit: true, united: true })
    expect(n).toEqual(expect.arrayContaining(["l2b-stadium-on-b1", "l2b-stadium-on-b2", "l2b-stadium-on-b3", "l2b-stadium-on-b4"]))
    expect(n).toEqual(expect.arrayContaining(["l7-makes-signing", "thirty", "united", "l1-sky", "l4-foreground"]))
    expect(n).not.toContain("l5-makes")
    expect(n).not.toContain("l6-makes-wave")
    expect(n).not.toContain("l8-shirt")
  })

  it("the cover (the OG image): dark banks, Makes at rest, THIRTY only", () => {
    const n = names({ pose: "l5-makes", lit: false, united: false })
    expect(n.some((x) => x.startsWith("l2b-"))).toBe(false)
    expect(n).toContain("l5-makes")
    expect(n).toContain("thirty")
    expect(n).not.toContain("united")
  })

  it("back to front", () => {
    const z = scenePlates({ pose: "l7-makes-signing", lit: true, united: true }).map((l) => l.z)
    expect(z).toEqual([...z].sort((a, b) => a - b))
  })
})

const near = (p: Point, q: Point, eps = 1e-6) => {
  expect(p[0]).toBeCloseTo(q[0], -Math.log10(eps))
  expect(p[1]).toBeCloseTo(q[1], -Math.log10(eps))
}
const apply = ([a, b, c, d, e, f]: number[], [x, y]: Point): Point => [a * x + c * y + e, b * x + d * y + f]

describe("triangleAffine", () => {
  it("maps each source corner onto its destination corner", () => {
    const s: [Point, Point, Point] = [[0, 0], [100, 0], [0, 50]]
    const d: [Point, Point, Point] = [[10, 20], [120, 30], [5, 80]]
    const m = triangleAffine(s, d)
    s.forEach((p, i) => near(apply(m, p), d[i]))
  })
})

describe("warpMesh: the canvas warp matches the live shirt's matrix3d", () => {
  const quad = QUADS["l7-makes-signing"]
  const mesh = warpMesh(320, 360, quad, 10)

  it("n x n cells, two triangles each", () => {
    expect(mesh).toHaveLength(200)
  })

  it("every mesh vertex is where quadMatrix sends it, and the box corners land on the quad", () => {
    const m = quadMatrix(320, 360, quad)
    for (const [s, d] of mesh) s.forEach((p, i) => near(d[i], applyMatrix(m, p)))
    const corners: Point[] = [[0, 0], [320, 0], [320, 360], [0, 360]]
    corners.forEach((c, i) => near(applyMatrix(m, c), quad[i], 1e-4))
  })

  it("each triangle's affine carries its source triangle onto its destination", () => {
    for (const [s, d] of mesh.slice(0, 20)) {
      const m = triangleAffine(s, d)
      s.forEach((p, i) => near(apply(m, p), d[i], 1e-4))
    }
  })
})
