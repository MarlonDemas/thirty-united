import type { Beat } from "@/world/beats"

/**
 * Phase 4 slot: the WebGL world for T3 and T2 (the same layers as planes, depth parallax, bank-mask reveal, the
 * lanyard pass as B2). Until then it draws nothing and the still layer under it is the whole world. It stays a
 * separate lazy chunk so the three.js world never weighs on the entry.
 */
export type WorldCanvasProps = { beat: Beat }

export default function WorldCanvas(props: WorldCanvasProps): null {
  void props // phase 4 frames the shot for props.beat
  return null
}
