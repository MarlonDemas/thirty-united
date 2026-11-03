/*
 * matchday-rsvp scene API. Import with:  import { world } from './scene.js';   (module uses top-level await)
 *
 * world.THREE                                three namespace
 * world.scene, world.camera, world.renderer, world.composer, world.controls   (controls: look-around, see controls.js: { yaw, pitch, enabled, lookAt(v3), apply() })
 * world.sim                                  { t, scale, step(dt) } deterministic sim clock (scale: the slow-mo factor, game.js multiplies dt by it); step() advances crowd, keeper/taker idle, net ripples, flags.
 *                                             game.js calls world.sim.step(realDt) every frame and __dbg.simStep(dt) calls it without rendering.
 * world.crowd                                { cheer(at=0)  3 s jump-and-cheer burst, scarves up
 *                                              wave(seconds=32 | false)  Mexican wave (one lap = 16 s)
 *                                              applaud(seconds=4)  polite clapping,  step(dt), count, triangles, uniforms }
 * world.scoreboard                           { draw(lines?)  lines = ['text' | {text,size,color,weight}] redraws the LED screen (no args = default),
 *                                              canvas, ctx, texture, mesh, position }
 * world.goal  (= world.goals.north)          the goal the guest shoots at (z = -52.5, faces +z):
 *                                            { ripple(strength=1, x=0, y=1.2)  x metres in WORLD x, y metres up; mouth:{center,halfWidth:3.66,height:2.44}, net, group }
 * world.goals                                { north, south }
 * world.keeper                               { object (Group, feet at y=0), reach (3.7 m), pose, setPose('idle'|'diveLeft'|'diveRight', t), setHome(x,z), joints }
 *                                             'idle': t = sim seconds (side-shuffle sway on the line; sim.step keeps it animated while pose === 'idle').
 *                                             'diveLeft' = world -x, 'diveRight' = world +x (SCREEN left/right for the penalty taker looking north); t = 0..1 progress.
 * world.taker                                { object, setPose('idle'|'kick', t) }  standing 2.9 m behind the ball facing north (hidden in the 'penalty' view)
 * world.ball                                 Mesh, 0.22 m diameter truncated-icosahedron pattern, resting on the penalty spot
 * world.penaltySpot                          Vector3 (0, 0, -41.5);  world.goalMouth = { center: (0,1.22,-52.5), halfWidth: 3.66, height: 2.44, z: -52.5 }
 * world.turnstile                            { arm (Group; spin about local z in steps of 2*PI/3), readerLight (Mesh, material.emissive/emissiveIntensity: amber idle, set green), group, lanes[], position, z }
 * world.tunnelPath                           Vector3[] eye-height (1.7 m) camera glide: gate -> turnstiles -> concourse -> players' tunnel -> pitch edge
 * world.dugouts                              { home, away } Groups (home = x -37.4, z +8; away = z -8; open towards +x)
 * world.sign, world.seats, world.masts       misc handles
 * world.setLights(k = 1)                     floodlight level: the four mast spots and their lens emissive scale by k (1 = full, 0.6 = the AWAY ending's dim)
 * world.render()                             renders one frame through the composer;  world.measure() -> { triangles, calls } of one scene pass
 * world.resize()                            camera aspect now, renderer and composer buffers after 150 ms of quiet
 */
import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EffectComposer, RenderPass, EffectPass, SelectiveBloomEffect, ToneMappingEffect, ToneMappingMode } from 'postprocessing';
import { N8AOPostPass } from 'n8ao';
import { D } from './dims.js';
import { THEME, fontsReady } from './config.js';
import { texturesReady, V, LITE } from './util.js';
import { buildStadium } from './stadium.js';
import { buildPitch } from './pitch.js';
import { buildPlaza } from './plaza.js';
import { buildCrowd } from './crowd.js';
import { buildKeeper, buildTaker, buildBall } from './people.js';
import { createLookControls } from './controls.js';

// Measured from public/world/hdri/qwantani_dusk_2_puresky_2k.hdr: the brightness-weighted centroid of its brightest pixels
export const SUN = { dir: [0.784, 0.228, 0.577], elevationDeg: 13.21, horizonHex: '#ffdef0' };

async function create() {
  await fontsReady;   // every canvas texture below (scoreboard, LED boards, sign, ticket) draws in Inter Tight, never the fallback face
  const renderer = new THREE.WebGLRenderer(LITE ? { antialias: false } : { antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(LITE ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.info.autoReset = false;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1600);
  const controls = createLookControls(camera, renderer.domElement);

  // ---- light: HDRI dusk sky as environment + background, one measured sun, floodlights from the masts ---------------------
  const hdr = await new HDRLoader().loadAsync('/world/hdri/qwantani_dusk_2_puresky_2k.hdr');
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = scene.background = pmrem.fromEquirectangular(hdr).texture;
  scene.environmentIntensity = THEME.scene.environmentIntensity; scene.backgroundIntensity = THEME.scene.backgroundIntensity;   // deeper dusk sky: less milky, lets the fireworks read
  hdr.dispose(); pmrem.dispose();
  // fog = horizon haze mixed toward the ink; the horizon band (below) shares the colour so the bare ground edge dissolves into it
  const fogColor = new THREE.Color(THEME.scene.sky.horizon).lerp(new THREE.Color(THEME.color.ink950), THEME.scene.fogInkMix);
  {   // gradient sky dome (zenith -> mid -> warm horizon): the HDRI stays as the lighting environment, but its pale grey-mauve sky is not what the guest sees
    const { zenith, mid, horizon } = THEME.scene.sky;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1300, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { zenith: { value: new THREE.Color(zenith) }, mid: { value: new THREE.Color(mid) }, horizon: { value: new THREE.Color(horizon) } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 zenith, mid, horizon; varying vec3 vDir; void main(){ float t = clamp(vDir.y, 0.0, 1.0); vec3 c = mix(horizon, mid, smoothstep(0.0, 0.2, t)); c = mix(c, zenith, smoothstep(0.15, 0.7, t)); gl_FragColor = vec4(c, 1.0); }',
    }));
    dome.name = 'skyDome'; dome.renderOrder = -3; dome.frustumCulled = false; scene.add(dome);
  }
  scene.fog = new THREE.FogExp2(fogColor, THEME.scene.fogDensity);
  {
    const { radius, height } = THEME.scene.horizon;
    const gc = document.createElement('canvas'); gc.width = 4; gc.height = 64; const g = gc.getContext('2d');
    for (let y = 0; y < 64; y++) { const t = Math.min(1, (63 - y) / 63 / 0.4), a = t * t * (3 - 2 * t); g.fillStyle = `rgb(${Math.round(a * 255)},${Math.round(a * 255)},${Math.round(a * 255)})`; g.fillRect(0, y, 4, 1); }   // alphaMap reads green: opaque for the lower 60% of the band (hides the ground edge from the aerial view too), smooth fade above
    const band = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 64, 1, true),
      new THREE.MeshBasicMaterial({ color: fogColor, alphaMap: new THREE.CanvasTexture(gc), transparent: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    band.position.y = height / 2 - 0.5; band.renderOrder = -1; band.frustumCulled = false; band.name = 'horizonBand'; scene.add(band);
  }

  scene.add(new THREE.HemisphereLight(0x8a7aa8, 0x3a4a2a, 0.5));   // sky/ground bounce: gives the open ground a tonal gradient from the aerial

  const sunDir = new THREE.Vector3(...SUN.dir).normalize();
  const sun = new THREE.DirectionalLight(0xffcf9a, 2.4);
  sun.position.copy(sunDir).multiplyScalar(300); sun.target.position.set(0, 4, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(LITE ? 2048 : 4096, LITE ? 2048 : 4096);
  Object.assign(sun.shadow.camera, { left: -140, right: 140, top: 140, bottom: -140, near: 20, far: 700 });
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.12; sun.shadow.radius = 3;
  scene.add(sun, sun.target);

  // ---- parts -----------------------------------------------------------------------------------------------------------
  const stadium = buildStadium();
  const pitch = buildPitch();
  const plaza = await buildPlaza();
  const crowd = buildCrowd(stadium.seats);
  const keeper = buildKeeper(), taker = buildTaker(), ball = buildBall();
  keeper.setHome(0, -(D.halfL - 0.35)); keeper.setPose('idle', 0);
  taker.object.position.set(0, 0, -38.6);
  scene.add(stadium.group, pitch.group, plaza.group, crowd.group, keeper.object, taker.object, ball);
  for (const l of [...stadium.lights, ...plaza.lights]) scene.add(l);

  // ---- post: scene -> N8AO -> selective bloom (emissives only) -> AGX tone mapping ------------------------------------------
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: 0 });
  composer.addPass(new RenderPass(scene, camera));
  let ao = null;   // lite tier: no ambient occlusion
  if (!LITE) {
    ao = new N8AOPostPass(scene, camera, innerWidth, innerHeight);
    Object.assign(ao.configuration, { aoRadius: THEME.scene.n8ao.aoRadius, distanceFalloff: 1, intensity: THEME.scene.n8ao.intensity, color: new THREE.Color(0, 0, 0), gammaCorrection: false, halfRes: true, aoSamples: 10, denoiseSamples: 4 });
    composer.addPass(ao);
  }
  const bloom = new SelectiveBloomEffect(scene, camera, { intensity: THEME.scene.bloom.intensity, mipmapBlur: true, luminanceThreshold: THEME.scene.bloom.threshold, radius: THEME.scene.bloom.radius });
  const bloomMeshes = [...stadium.bloom, ...pitch.bloom, ...plaza.bloom];
  for (const m of bloomMeshes) bloom.selection.add(m);
  composer.addPass(new EffectPass(camera, bloom, new ToneMappingEffect({ mode: ToneMappingMode[THEME.scene.toneMapping] })));

  // ---- sim clock --------------------------------------------------------------------------------------------------------
  const sim = {
    t: 0, scale: 1,
    step(dt) {
      sim.t += dt;
      crowd.step(dt); pitch.update(sim.t);
      if (keeper.pose === 'idle') keeper.setPose('idle', sim.t);
      if (taker.pose === 'idle') taker.setPose('idle', sim.t);
    },
  };

  let resizeTimer = 0;
  const lensMats = new Set(); for (const m of stadium.masts) m.rig.traverse((o) => { if (o.isInstancedMesh) lensMats.add(o.material); });   // the floodlight lenses (setLights)
  await texturesReady();
  const world = {
    THREE, scene, camera, renderer, composer, controls, sim, sun, ao, bloom,
    crowd, scoreboard: stadium.scoreboard,
    goal: pitch.goals.north, goals: pitch.goals,
    keeper, taker, ball,
    penaltySpot: pitch.penaltySpot, goalMouth: { center: V(0, 1.22, -D.halfL), halfWidth: 3.66, height: 2.44, z: -D.halfL },
    turnstile: plaza.turnstile, tunnelPath: stadium.tunnelPath, dugouts: pitch.dugouts,
    sign: plaza.sign, seats: stadium.seats, masts: stadium.masts, flags: pitch.flags, stadium, pitch, plaza,
    lightLevel: 1,
    setLights(k = 1) {
      for (const l of stadium.lights) { l.userData.base ??= l.intensity; l.intensity = l.userData.base * k; }
      for (const m of lensMats) { m.userData.base ??= m.emissiveIntensity; m.emissiveIntensity = m.userData.base * k; }
      world.lightLevel = k;
    },
    render() { renderer.info.reset(); composer.render(); world.lastFrame = { triangles: renderer.info.render.triangles, calls: renderer.info.render.calls }; },
    measure() { renderer.info.reset(); renderer.render(scene, camera); return { triangles: renderer.info.render.triangles, calls: renderer.info.render.calls, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }; },
    // The aspect follows at once; the buffers (N8AO and the half-float targets are reallocated by composer.setSize) wait for the resizing to settle, so a phone's collapsing URL bar does not churn them.
    resize() {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); }, 150);
    },
    lastFrame: null, lite: LITE,
  };
  return world;
}

export const world = await create();
