// matchday-rsvp: the 3D invitation ticket (paper stock, die-cut perforation, foil crest). Built once by flow.js; the canvases draw in the theme face.
import * as THREE from 'three';
import { mulberry32, canvasTex, normalFromHeight } from './util.js';
import { EVENT, THEME, fontCss } from './config.js';

// ---- the invitation ticket (3D): paper stock, die-cut perforation, foil crest ---------------------------------------------------
// One MeshPhysicalMaterial, no emissive: colour map (print + fibre tint), roughness + metalness maps (the crest is foil), normal map from a fibre height map.
export function buildTicket(seed) {
  const W = 1.8, H = 0.86, DEPTH = 0.014, STUB = 400, PX = 1536, PY = Math.round(PX * H / W), MX = 1024, MY = Math.round(MX * H / W);
  const C = THEME.color, rnd = mulberry32(seed ^ 0x7ac3), sx = -W / 2 + W * STUB / PX;   // sx = x of the perforation line
  const spaced = (c, v) => { if ('letterSpacing' in c) c.letterSpacing = v; };
  const crestPath = (c, cx, cy, k) => { c.beginPath(); c.moveTo(cx - 118 * k, cy - 130 * k); c.lineTo(cx + 118 * k, cy - 130 * k); c.lineTo(cx + 118 * k, cy + 30 * k); c.quadraticCurveTo(cx + 118 * k, cy + 130 * k, cx, cy + 170 * k); c.quadraticCurveTo(cx - 118 * k, cy + 130 * k, cx - 118 * k, cy + 30 * k); c.closePath(); };
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const fibres = (c, w, h, n, tone, a0, a1) => {   // short random strokes: the paper fibre grain (seeded, so captures are reproducible)
    for (let i = 0; i < n; i++) {
      const x = rnd() * w, y = rnd() * h, len = 6 + rnd() * 26, ang = rnd() * Math.PI, bend = (rnd() - 0.5) * 8;
      c.strokeStyle = tone; c.globalAlpha = a0 + rnd() * (a1 - a0); c.lineWidth = 0.6 + rnd() * 1.3;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(ang) * len / 2 + bend, y + Math.sin(ang) * len / 2 + bend, x + Math.cos(ang) * len, y + Math.sin(ang) * len); c.stroke();
    }
    c.globalAlpha = 1;
  };
  const ccx = STUB / 2, ccy = PY / 2 - 40;   // crest centre (colour-map pixels)
  // colour map: paper stock + print. Only red on the ticket = the foil crest.
  const tex = canvasTex(PX, PY, (c, w, hh) => {
    c.fillStyle = C.paper100; c.fillRect(0, 0, w, hh);
    for (let i = 0; i < 38; i++) { const x = rnd() * w, y = rnd() * hh, r = 90 + rnd() * 240, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(216,207,186,.20)'); g.addColorStop(1, 'rgba(216,207,186,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
    fibres(c, w, hh, 9000, C.paper300, 0.10, 0.30); fibres(c, w, hh, 3000, C.paper100, 0.25, 0.6);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    // stub: foil crest + admit-one
    crestPath(c, ccx, ccy, 1); c.fillStyle = EVENT.kits.home; c.fill();
    c.strokeStyle = C.paper100; c.lineWidth = 8; c.beginPath(); c.arc(ccx, ccy + 6, 70, 0, 7); c.stroke();
    c.fillStyle = C.paper100; c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; c.lineTo(ccx + Math.cos(a) * 34, ccy + 6 + Math.sin(a) * 34); } c.fill();
    c.fillStyle = C.paperInk; c.font = fontCss(700, 34); spaced(c, '6px'); c.fillText('ADMIT ONE', ccx + 3, hh - 150);
    c.fillStyle = C.paperMuted; c.font = fontCss(600, 34); c.fillText(EVENT.shortDate, ccx + 3, hh - 106); spaced(c, '0px');
    // details
    const fit = (txt, size, weight, maxW) => { let sz = size; c.font = fontCss(weight, sz); while (c.measureText(txt).width > maxW && sz > 20) { sz -= 2; c.font = fontCss(weight, sz); } };
    const x0 = 470, maxW = w - x0 - 60; c.textAlign = 'left';
    c.fillStyle = C.paperMuted; spaced(c, '8px'); fit('MATCHDAY INVITATION', 36, 600, maxW); c.fillText('MATCHDAY INVITATION', x0, 112); spaced(c, '0px');
    c.fillStyle = C.paperInk; spaced(c, '-2px'); fit(EVENT.title, 112, 800, maxW); c.fillText(EVENT.title, x0, 236); spaced(c, '0px');
    c.fillStyle = C.paperRule; c.fillRect(x0, 278, maxW, 2);
    c.fillStyle = C.paperInk; fit(EVENT.date, 68, 600, maxW); c.fillText(EVENT.date, x0, 368);
    c.fillStyle = C.paperMuted; fit(`Kick-off ${EVENT.kickoff}  ·  ${EVENT.venue}`, 56, 500, maxW); c.fillText(`Kick-off ${EVENT.kickoff}  ·  ${EVENT.venue}`, x0, 452);
    fit(`Hosted by ${EVENT.host}`, 44, 500, maxW); c.fillText(`Hosted by ${EVENT.host}`, x0, 528);
    c.fillStyle = C.paperRule; c.fillRect(x0, hh - 124, maxW, 2);
    c.fillStyle = C.paperInk; fit('Hand this ticket in at the gate to RSVP', 46, 600, maxW); c.fillText('Hand this ticket in at the gate to RSVP', x0, hh - 62);
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  // data maps (linear): roughness (green) and metalness (blue) share one canvas; the crest is foil (metal 0.3, rough 0.35), the paper is rough with fibre variation
  const rm = cvs(MX, MY), rc = rm.getContext('2d'), k = MX / PX;
  rc.fillStyle = 'rgb(214,214,0)'; rc.fillRect(0, 0, MX, MY); fibres(rc, MX, MY, 5000, 'rgb(170,170,0)', 0.2, 0.5); fibres(rc, MX, MY, 5000, 'rgb(240,240,0)', 0.2, 0.5);
  crestPath(rc, ccx * k, ccy * k, k); rc.fillStyle = 'rgb(0,90,77)'; rc.fill();   // G = roughness 0.35, B = metalness 0.3
  const rmTex = new THREE.CanvasTexture(rm); rmTex.anisotropy = 8;
  // height map -> normal map: fibre relief plus a slight emboss under the crest
  const hm = cvs(MX, MY), hc = hm.getContext('2d');
  hc.fillStyle = 'rgb(128,128,128)'; hc.fillRect(0, 0, MX, MY); fibres(hc, MX, MY, 9000, 'rgb(190,190,190)', 0.25, 0.7); fibres(hc, MX, MY, 9000, 'rgb(70,70,70)', 0.25, 0.7);
  hc.save(); if ('filter' in hc) hc.filter = 'blur(2px)'; crestPath(hc, ccx * k, ccy * k, k); hc.fillStyle = 'rgb(255,255,255)'; hc.fill(); hc.restore();
  const nTex = new THREE.CanvasTexture(normalFromHeight(hm, 2.2)); nTex.anisotropy = 8;
  // body: a rounded sheet with corner radii, semicircular notches where the stub tears off, and real die-cut holes along that line
  const R = 0.04, NR = 0.05, x0 = -W / 2, x1 = W / 2, y0 = -H / 2, y1 = H / 2, HP = Math.PI / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x0 + R, y0); shape.lineTo(sx - NR, y0); shape.absarc(sx, y0, NR, Math.PI, 0, true); shape.lineTo(x1 - R, y0);
  shape.absarc(x1 - R, y0 + R, R, -HP, 0, false); shape.lineTo(x1, y1 - R); shape.absarc(x1 - R, y1 - R, R, 0, HP, false);
  shape.lineTo(sx + NR, y1); shape.absarc(sx, y1, NR, 0, -Math.PI, true); shape.lineTo(x0 + R, y1);
  shape.absarc(x0 + R, y1 - R, R, HP, Math.PI, false); shape.lineTo(x0, y0 + R); shape.absarc(x0 + R, y0 + R, R, Math.PI, 3 * HP, false);
  for (let y = y0 + NR + 0.03; y < y1 - NR - 0.02; y += 0.045) { const hole = new THREE.Path(); hole.absarc(sx, y, 0.011, 0, 2 * Math.PI, true); shape.holes.push(hole); }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false, curveSegments: 20 }); geo.translate(0, 0, -DEPTH / 2);
  { const pos = geo.attributes.position, uv = geo.attributes.uv, cap = geo.groups[0];   // group 0 = front + back caps: planar UVs on the front, a blank-paper texel on the back
    for (let i = cap.start; i < cap.start + cap.count; i++) { if (pos.getZ(i) > 0) uv.setXY(i, pos.getX(i) / W + 0.5, pos.getY(i) / H + 0.5); else uv.setXY(i, 0.995, 0.995); }
    uv.needsUpdate = true; }
  const paper = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 1, roughnessMap: rmTex, metalness: 1, metalnessMap: rmTex, normalMap: nTex, normalScale: new THREE.Vector2(0.45, 0.45),
    sheen: 0.7, sheenRoughness: 0.5, sheenColor: new THREE.Color(C.paper100) });
  const edge = new THREE.MeshStandardMaterial({ color: C.paper300, roughness: 0.9 });
  const group = new THREE.Group(); group.name = 'ticket';
  group.add(new THREE.Mesh(geo, [paper, edge]));
  group.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  // Warm key light that only reaches the ticket: a short-range point light (4 m) in front of the sheet, so the paper reads warm (#EFE9DB) and nothing else in the scene is lit by it.
  // It lives in the scene, not in the group, because hiding the group would remove a light and recompile every material; follow() keeps it with the sheet and zeroes it while the ticket is hidden.
  const KEY_I = 22, KEY_OFF = new THREE.Vector3(0.35, 0.5, 1.4);
  const key = new THREE.PointLight(0xfff3c8, KEY_I, 4, 2); key.name = 'ticketKey'; key.castShadow = false;
  const follow = () => { key.position.copy(group.position).add(KEY_OFF); key.intensity = group.visible ? KEY_I : 0; };
  follow();
  return { group, W, H, key, follow };
}
