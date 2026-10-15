import { act, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const load = async () => {
  vi.resetModules() // the probe stamps sessionStorage once per page load, at module scope
  return (await import("@/components/DeviceProbe")).default
}

describe("device probe (?debug=1)", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
  })

  it("reports the device facts as plain text, with the browser kind labelled a guess", async () => {
    const DeviceProbe = await load()
    render(<DeviceProbe />)
    const probe = screen.getByTestId("device-probe")
    expect(probe).toHaveTextContent(`ua ${navigator.userAgent}`)
    expect(probe).toHaveTextContent(/\[GUESS from UA\]/)
    expect(probe).toHaveTextContent(/share \w+ \| canShare\(files png\) .+ \| vibrate \w+/)
    expect(probe).toHaveTextContent("webgl2 no | context none")
    expect(probe).toHaveTextContent(/deviceMemory .+ \| cores/)
    expect(probe).toHaveTextContent(/dpr [\d.]+ \| viewport \d+x\d+/)
    expect(probe).toHaveTextContent("reduced-motion false | forced-colors false")
  })

  it("shows the tier, its reason, the load-time pick and each demotion", async () => {
    const DeviceProbe = await load()
    const { demote } = await import("@/world/tier") // the same fresh module instance the probe imported
    render(<DeviceProbe />)
    const probe = screen.getByTestId("device-probe")
    expect(probe).toHaveTextContent(/tier T1 \| reason no WebGL2/)
    expect(probe).toHaveTextContent(/picked T1 \(no WebGL2/)
    expect(probe).toHaveTextContent("demotions none")
    act(() => {
      demote("T0", "test")
    })
    expect(probe).toHaveTextContent("tier T0 | reason test")
    expect(probe).toHaveTextContent(/demotions T1>T0 test @\d\d:\d\d:\d\d/)
  })

  it("shows the previous load's stamp from sessionStorage, then writes its own", async () => {
    let DeviceProbe = await load()
    const { unmount } = render(<DeviceProbe />)
    expect(screen.getByTestId("device-probe")).toHaveTextContent("previous load none")
    const first = window.sessionStorage.getItem("thirty-united:debug-probe")
    expect(Number(first)).toBeGreaterThan(0)
    unmount()

    DeviceProbe = await load() // a reload
    render(<DeviceProbe />)
    expect(screen.getByTestId("device-probe")).toHaveTextContent(/previous load \d\d:\d\d:\d\d \(\d+ s before this one\)/)
  })
})
