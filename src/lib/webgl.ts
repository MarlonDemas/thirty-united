/** True when a WebGL context can be created. The probe context is released straight away. */
export function hasWebGL(): boolean {
  if (typeof WebGLRenderingContext === "undefined") return false
  try {
    const c = document.createElement("canvas")
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null
    if (!gl) return false
    gl.getExtension("WEBGL_lose_context")?.loseContext()
    return true
  } catch {
    return false
  }
}
