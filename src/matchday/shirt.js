// matchday-rsvp: the guest's HOME shirt (director's addition). Hangs on a peg on the back wall of the HOME dugout, back outwards: their name over #30.
// One canvas texture (the shirt's silhouette, alpha-tested) on a PBR plane, a steel peg and a wire hanger. draw(name, number = '30') repaints it (the guest's seat number once their reply is saved, else the placeholder 30); draw('') leaves a plain #30.
// It sits in the scene, not inside the dugout group, so anything that restyles the dugout group's materials never touches it.
// The name only ever reaches the canvas through fillText.
import * as THREE from 'three';
import { EVENT, fontCss } from './config.js';

const W = 512, H = 560;
export const SHIRT_AT = { local: [-1.78, 1.24, -1.035], size: [0.72, 0.79] };   // dugout-local (x along the bench, y up, z from the pitch side to the back wall)

function shirtPath(c) {   // a short-sleeved shirt, back view, in canvas pixels
  c.beginPath();
  c.moveTo(196, 26); c.quadraticCurveTo(256, 52, 316, 26);         // collar
  c.lineTo(408, 58); c.lineTo(500, 156); c.lineTo(440, 222); c.lineTo(392, 180);   // right shoulder and sleeve
  c.lineTo(398, 540); c.quadraticCurveTo(256, 556, 114, 540);       // right side, the hem
  c.lineTo(120, 180); c.lineTo(72, 222); c.lineTo(12, 156); c.lineTo(104, 58); c.closePath();
}

export function createShirt(dugout) {
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82, metalness: 0, alphaTest: 0.5, side: THREE.DoubleSide });
  const group = new THREE.Group(); group.name = 'guestShirt';
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(...SHIRT_AT.size), mat); cloth.castShadow = true; cloth.receiveShadow = true;
  cloth.rotation.x = -0.05;   // hangs a touch off the wall at the hem
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.9, roughness: 0.35 });
  const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 10), steel); peg.rotation.x = Math.PI / 2; peg.position.set(0, SHIRT_AT.size[1] / 2 + 0.07, -0.02);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 16, Math.PI * 1.3), steel); hook.position.set(0, SHIRT_AT.size[1] / 2 + 0.06, 0.02); hook.rotation.z = -0.3;
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.62, 8), steel); bar.rotation.z = Math.PI / 2; bar.position.set(0, SHIRT_AT.size[1] / 2 - 0.08, 0.012);
  for (const m of [peg, hook, bar]) m.castShadow = true;
  group.add(cloth, peg, hook, bar);
  // place it from the dugout's transform once (dugouts never move)
  dugout.updateWorldMatrix(true, false);
  group.position.copy(dugout.localToWorld(new THREE.Vector3(...SHIRT_AT.local)));
  group.quaternion.copy(dugout.getWorldQuaternion(new THREE.Quaternion()));

  let shown = null;
  let shownNo = '30';
  function draw(name = '', number = '30') {
    const n = String(name).toUpperCase(), no = n ? String(number) : '30';
    if (n === shown && no === shownNo) return; shown = n; shownNo = no;
    c.clearRect(0, 0, W, H);
    c.save(); shirtPath(c); c.clip();
    const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, EVENT.kits.homeLight); g.addColorStop(0.55, EVENT.kits.home); g.addColorStop(1, EVENT.kits.homeDark);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(0, 0, W, 34);                       // white collar band
    c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(12, 150, 70, 14); c.fillRect(430, 150, 70, 14);   // sleeve cuffs
    c.globalAlpha = 0.16; c.strokeStyle = '#000'; c.lineWidth = 3;                          // a few soft folds
    for (const [x0, x1] of [[170, 150], [330, 356], [256, 262]]) { c.beginPath(); c.moveTo(x0, 220); c.quadraticCurveTo((x0 + x1) / 2 + 12, 380, x1, 540); c.stroke(); }
    c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    if (n) { let px = 58; c.font = fontCss(800, px); while (c.measureText(n).width > 250 && px > 24) { px -= 2; c.font = fontCss(800, px); } c.fillText(n, 256, 150); }
    let npx = 220; c.font = fontCss(800, npx); while (c.measureText(no).width > 280 && npx > 90) { npx -= 10; c.font = fontCss(800, npx); }   // a 3-digit seat shrinks to fit
    c.fillText(no, 256, 400);
    c.restore();
    tex.needsUpdate = true;
  }
  draw('');
  return { group, draw, state: () => ({ name: shown, number: shownNo }) };
}
