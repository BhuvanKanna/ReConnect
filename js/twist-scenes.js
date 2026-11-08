// The nine Trunk Twist worlds (see js/twist3d.js for the kit and js/twist-animals.js for what you find).
// Each builder fills K.scene with a full 360° surrounding and returns { spots, pitch? } where spots are
// the things to find, in the order they appear (first on the right, then the left, and so on).
(() => {
"use strict";
const TW = window.RC.Twist3D, A = window.RC.TwistAnimals;
const PI = Math.PI;
const sm = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

// ---------------------------------------------------------------- shared scenery
function trees(K, pts, o) {
  const trunks = [], puffs = [];
  pts.forEach((p) => {
    const h = K.R(o.h0, o.h1), w = h * (o.w || 0.05);
    trunks.push({ x: p.x, y: p.y - 0.3, z: p.z, sx: w, sz: w, sy: h, ry: K.R(0, 6) });
    const cr = h * (o.cr || 0.33), k = o.puffs || 4;
    for (let i = 0; i < k; i++) puffs.push({ x: p.x + K.R(-0.7, 0.7) * cr, y: p.y + h * (o.top || 0.95) + K.R(-0.35, 0.45) * cr, z: p.z + K.R(-0.7, 0.7) * cr, s: cr * K.R(0.6, 1.0), sy: cr * K.R(0.5, 0.85), c: K.pick(o.leaf), ry: K.R(0, 6) });
  });
  K.inst(K.post(0.7, 1, 1, 7), K.M(o.trunk), trunks);
  K.inst(K.ico(1, 1), K.M(0xffffff), puffs);
}
function pines(K, pts, o) {
  const trunks = [], tiers = [], snow = [];
  pts.forEach((p) => {
    const h = K.R(o.h0, o.h1), w = h * 0.22, ry = K.R(0, 6);
    trunks.push({ x: p.x, y: p.y - 0.2, z: p.z, sx: h * 0.03, sz: h * 0.03, sy: h * 0.3 });
    for (let i = 0; i < 3; i++) {
      const s = 1 - i * 0.24, y = p.y + h * (0.25 + i * 0.22);
      tiers.push({ x: p.x, y, z: p.z, sx: w * s * 1.2, sz: w * s * 1.2, sy: h * 0.42 * s, ry, c: o.leaf ? K.pick(o.leaf) : null });
      if (o.snow) snow.push({ x: p.x, y: y + h * 0.42 * s * 0.45, z: p.z, sx: w * s * 0.62, sz: w * s * 0.62, sy: h * 0.42 * s * 0.5, ry });
    }
  });
  K.inst(K.post(1, 1, 1, 6), K.M(o.trunk || 0x4a3020), trunks);
  K.inst(K.blade(1, 1, 7), K.M(o.leaf ? 0xffffff : 0x24502e), tiers);
  if (o.snow) K.inst(K.blade(1, 1, 7), K.S(0xf4f8ff, { roughness: 0.8, flatShading: true }), snow);
}
function palm(K, x, z, h, lean, frondM, o = {}) {
  const g = K.group(null, [x, K.h(x, z) - 0.1, z], [0, K.R(0, 6.28), 0]), n = 7, trunkM = K.M(o.trunk || 0x8a6a46);
  let px = 0, py = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n, seg = h / n, ang = lean * u * u * 1.6;
    K.part(g, K.cyl(0.12 - 0.04 * u, 0.15 - 0.04 * u, seg * 1.08, 7), i % 2 ? trunkM : K.M(o.trunk2 || 0x7a5a3a), [px + Math.sin(ang) * seg / 2, py + Math.cos(ang) * seg / 2, 0], [0, 0, -ang]);
    px += Math.sin(ang) * seg; py += Math.cos(ang) * seg;
  }
  const len = o.frond || h * 0.42;
  for (let k = 0; k < 9; k++) {
    const f = K.group(g, [px, py, 0], [0, k / 9 * PI * 2 + K.R(0, 0.3), -K.R(1.25, 1.85)]);
    K.part(f, K.blade(len * 0.16, len, 4), frondM, null, null, [0.18, 1, 1]);
  }
  if (o.nuts !== false) for (let k = 0; k < 3; k++) K.part(g, K.sph(0.13, 8, 6), K.M(0x5a3a1a), [px + Math.cos(k * 2.1) * 0.16, py - 0.15, Math.sin(k * 2.1) * 0.16]);
  return g;
}
function rocks(K, pts, colors, s0 = 0.4, s1 = 1.4) {
  K.inst(K.dod(1), K.M(0xffffff), pts.map((p) => { const s = K.R(s0, s1); return { x: p.x, y: p.y + s * 0.15, z: p.z, s, sy: s * K.R(0.5, 0.9), rx: K.R(0, 3), ry: K.R(0, 3), c: K.pick(colors) }; }));
}
function grass(K, pts, color, o = {}) {
  const list = [];
  pts.forEach((p) => { const k = o.k || 5, s = K.R(0.6, 1.2) * (o.s || 1); for (let i = 0; i < k; i++) list.push({ x: p.x + K.R(-0.15, 0.15), y: p.y, z: p.z + K.R(-0.15, 0.15), ry: K.R(0, 6), rz: K.R(-0.35, 0.35), sx: s, sz: s * 0.3, sy: s * K.R(0.7, 1.3), c: o.colors ? K.pick(o.colors) : null }); });
  K.inst(K.blade(0.06, o.h || 0.6, 3), K.swayM(o.colors ? 0xffffff : color, o.amp || 0.12, o.speed || 1.6, { side: K.THREE.DoubleSide }), list, { shadow: false });
}
function flowers(K, pts, colors, h = 0.35) {
  K.inst(K.post(0.012, 0.012, h, 4), K.M(0x3a7a2a), pts.map((p) => ({ x: p.x, y: p.y, z: p.z })), { shadow: false });
  K.inst(K.ico(0.07, 0), K.M(0xffffff, { emissive: 0x222222 }), pts.map((p) => ({ x: p.x, y: p.y + h, z: p.z, s: K.R(0.8, 1.4), sy: 0.6, c: K.pick(colors) })), { shadow: false });
}
// Little things that flutter around near the viewer (butterflies, petals, fireflies) as instanced quads
function flutter(K, n, colors, o = {}) {
  const geo = K.circle(o.size || 0.12, 6), list = [];
  for (let i = 0; i < n; i++) list.push({ cx: K.R(-9, 9), cz: K.R(-9, 9), y: K.R(o.y0 || 0.6, o.y1 || 3), r: K.R(0.8, 2.5), sp: K.R(0.3, 0.8), ph: K.R(0, 6), c: K.pick(colors) });
  const wings = [-1, 1].map(() => K.inst(geo, K.M(0xffffff, { side: K.THREE.DoubleSide, emissive: o.glow || 0x000000 }), list.map((q) => ({ x: q.cx, z: q.cz, c: q.c })), { shadow: false }));
  wings.forEach((w) => { w.frustumCulled = false; });
  K.tick((t) => {
    list.forEach((q, i) => {
      const a = q.ph + t * q.sp, x = q.cx + Math.cos(a) * q.r, z = q.cz + Math.sin(a * 1.3) * q.r, y = q.y + Math.sin(t * 1.7 + q.ph) * 0.3, f = Math.sin(t * 14 + q.ph) * 0.9;
      K.setInst(wings[0], i, { x, y, z, rx: -PI / 2, ry: -a, rz: 0, sx: 1, sy: 0.7, s: 1 }); K.setInst(wings[1], i, { x, y, z, rx: -PI / 2 + f, ry: -a + PI, sx: 1, sy: 0.7 });
    });
    wings.forEach((w) => { w.instanceMatrix.needsUpdate = true; });
  });
}
function sparkle(K, n, color, o = {}) { // drifting points: fireflies, snow, petals, bubbles, dust
  const pos = new Float32Array(n * 3), seed = [];
  for (let i = 0; i < n; i++) seed.push([K.R(-o.r, o.r), K.R(o.y0, o.y1), K.R(-o.r, o.r), K.R(0, 6)]);
  const geo = new K.THREE.BufferGeometry(); geo.setAttribute("position", new K.THREE.BufferAttribute(pos, 3));
  const pts = new K.THREE.Points(geo, new K.THREE.PointsMaterial({ color, size: o.size || 0.08, transparent: true, opacity: o.opacity || 0.9, depthWrite: false, blending: o.add ? K.THREE.AdditiveBlending : K.THREE.NormalBlending, map: o.add ? K.glow : null }));
  pts.frustumCulled = false; K.scene.add(pts);
  const span = o.y1 - o.y0;
  K.tick((t) => {
    for (let i = 0; i < n; i++) {
      const s = seed[i]; let y = s[1] + (o.vy || 0) * t; y = o.y0 + (((y - o.y0) % span) + span) % span;
      pos[i * 3] = s[0] + Math.sin(t * 0.5 + s[3]) * (o.wob || 0.5); pos[i * 3 + 1] = y; pos[i * 3 + 2] = s[2] + Math.cos(t * 0.4 + s[3]) * (o.wob || 0.5);
    }
    geo.attributes.position.needsUpdate = true;
  });
  return pts;
}

// ---------------------------------------------------------------- 1. Jungle
TW.builders.jungle = (K) => {
  const { THREE, scene } = K;
  K.sky(0x6fbbe6, 0xc4e7d2, 0xeaf3c6, { sunDir: [0.35, 0.5, -0.8], sun: 0.9, sunColor: 0xfff0c0, horizon: 0.25 });
  scene.fog = new THREE.Fog(0xb2d4a4, 16, 95);
  K.lights({ sky: 0xe0f4ff, ground: 0x2f4a1c, hemi: 1.6, sun: 0xfff0d0, sunI: 2.3, dir: [0.35, 0.9, -0.6] });
  const h = (x, z) => { const r = Math.hypot(x, z); return (K.fbm(x * 0.07, z * 0.07) - 0.45) * 3 * sm(6, 30, r) + sm(45, 100, r) * 8 * K.noise(x * 0.03, z * 0.03); };
  K.ground({ h, color: (x, z, y) => { const n = K.noise(x * 0.3, z * 0.3); if (Math.abs(x - Math.sin(z * 0.12) * 3) < 1.2 && z < -2) return K.mix(0x8a6a3e, 0x6e5432, n); return K.mix(0x3a7426, 0x6aa33a, n * 0.7 + y * 0.06); } });
  const leaf = [0x2f6b2a, 0x3c8a33, 0x24581f, 0x4f9a3c, 0x5aa040];
  trees(K, K.ring(70, 9, 50), { trunk: 0x5b4330, leaf, h0: 7, h1: 15, w: 0.045, cr: 0.34, puffs: 5 });
  trees(K, K.ring(70, 50, 110, { free: true }), { trunk: 0x4b3a2a, leaf, h0: 12, h1: 24, w: 0.04, cr: 0.32, puffs: 4 });
  const frondM = K.swayM(0x3f9a3a, 0.05, 1.3, { side: THREE.DoubleSide });
  K.ring(14, 4, 18).forEach((p) => palm(K, p.x, p.z, K.R(4, 7.5), K.R(0.1, 0.45), frondM));
  // ferns and big leaves
  const fern = [];
  K.ring(80, 3, 24).forEach((p) => { const k = 7, s = K.R(0.6, 1.3); for (let i = 0; i < k; i++) fern.push({ x: p.x, y: p.y, z: p.z, ry: i / k * 6.28 + K.R(0, 0.4), rz: -K.R(0.8, 1.25), sx: s * 0.3, sy: s, sz: s, c: K.pick([0x3f8f35, 0x56a83c, 0x2e7a2a]) }); });
  K.inst(K.blade(0.25, 1.6, 4), K.swayM(0xffffff, 0.06, 1.4, { side: THREE.DoubleSide }), fern);
  const bigLeaf = [];
  K.ring(30, 3.5, 16).forEach((p) => { for (let i = 0; i < 4; i++) { const s = K.R(0.35, 0.55); bigLeaf.push({ x: p.x, y: p.y + 0.35, z: p.z, ry: i * 1.6 + K.R(0, 1), rx: K.R(0.9, 1.3), sx: s * 0.6, sy: s, sz: 0.04, c: K.pick([0x2a7a3a, 0x3a8a2a]) }); } });
  K.inst(K.sph(1, 8, 6), K.M(0xffffff, { side: THREE.DoubleSide }), bigLeaf);
  grass(K, K.ring(300, 2.6, 20), 0x5aa83a, { k: 4, colors: [0x5aa83a, 0x6ab840, 0x3a8a2a] });
  flowers(K, K.ring(120, 2.8, 16), [0xff4a6a, 0xffd23a, 0xff8a2a, 0xd84aff, 0xffffff]);
  rocks(K, K.ring(30, 4, 30), [0x6f7a68, 0x5a6a52, 0x7a8070]);
  // hanging vines from the canopy
  K.inst(K.cyl(0.03, 0.03, 1, 4), K.swayM(0x3f7a2a, 0.02, 0.8), K.ring(70, 6, 22).map((p) => { const l = K.R(3, 7); return { x: p.x, y: p.y + 10 - l / 2, z: p.z, sy: l }; }), { shadow: false });
  // waterfall behind on the right
  const wf = K.at(2.3, 30), wfG = K.group(null, [wf.x, K.h(wf.x, wf.z) - 0.5, wf.z], [0, -2.3 + PI, 0]);
  for (let i = 0; i < 9; i++) K.part(wfG, K.dod(K.R(3, 5)), K.M(K.pick([0x5f6a5a, 0x6f7a68, 0x52604a])), [K.R(-7, 7), K.R(2, 11), K.R(-3, -1)], [K.R(0, 3), K.R(0, 3), 0]);
  const wtex = K.tex(64, 256, (c, w, hh) => { c.fillStyle = "#cfefff"; c.fillRect(0, 0, w, hh); for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.6})`; c.fillRect(Math.random() * w, Math.random() * hh, 2 + Math.random() * 3, 20 + Math.random() * 60); } }, true);
  K.part(wfG, K.plane(4.5, 12), new THREE.MeshBasicMaterial({ map: wtex, transparent: true, opacity: 0.9 }), [0, 6, 0.3], null, null, true);
  K.part(wfG, K.circle(6, 24), K.S(0x4aa8c8, { roughness: 0.05 }), [0, 0.15, 3], [-PI / 2, 0, 0]);
  for (let i = 0; i < 4; i++) K.sprite(0xffffff, K.R(3, 5), [K.R(-2, 2), K.R(0.5, 1.5), 2.5], 0.35, wfG);
  K.tick((t) => { wtex.offset.y = t * 0.9; });
  K.flock(6, { color: 0xd8302a, wing: 0x2a60d8, size: 0.9, y0: 9, y1: 15, r0: 12, r1: 22 });
  flutter(K, 16, [0xffd23a, 0x3ab8ff, 0xff6aa8, 0xffffff, 0xff8a2a]);
  sparkle(K, 60, 0xfff7a0, { r: 14, y0: 0.5, y1: 5, add: true, size: 0.25, opacity: 0.7, wob: 0.8 });
  return { spots: [
    { name: "monkey", make: A.monkey, d: 7, fit: 0.3, turn: 0.2 },
    { name: "parrot", make: A.parrot, d: 6, fit: 0.34, turn: 0.4 },
    { name: "elephant", make: A.elephant, d: 12, fit: 0.32, turn: 0.75 },
    { name: "tiger", make: A.tiger, d: 8, fit: 0.24, turn: 0.85 },
    { name: "frog", make: A.frog, d: 5, fit: 0.26, turn: 0.15 },
  ] };
};

// ---------------------------------------------------------------- 2. Dinosaur Valley
TW.builders.dino = (K) => {
  const { THREE, scene } = K;
  K.sky(0x5a9ad0, 0xf3c98b, 0xf6a060, { sunDir: [-0.5, 0.25, -0.8], sun: 1.2, sunColor: 0xffd090, horizon: 0.2 });
  scene.fog = new THREE.Fog(0xe8c090, 25, 170);
  K.lights({ sky: 0xfff0d8, ground: 0x5a4020, hemi: 1.4, sun: 0xffd8a0, sunI: 2.5, dir: [-0.5, 0.7, -0.6] });
  const lake = { x: 4, z: -48, r: 16 };
  const h = (x, z) => { const r = Math.hypot(x, z), l = Math.hypot(x - lake.x, z - lake.z); return (K.fbm(x * 0.05, z * 0.05) - 0.4) * 4 * sm(8, 40, r) - sm(lake.r + 6, lake.r - 4, l) * 3 + sm(60, 130, r) * 14 * K.noise(x * 0.025, z * 0.025); };
  K.ground({ h, color: (x, z, y) => { const n = K.noise(x * 0.2, z * 0.2); return y < -1.5 ? 0x8a7a50 : K.mix(K.mix(0x7a8a3a, 0xb8a050, n), 0x5a7a2a, K.noise(x * 0.05, z * 0.05)); } });
  K.part(null, K.circle(lake.r + 4, 40), K.S(0x3a8aa8, { roughness: 0.08 }), [lake.x, -1.2, lake.z], [-PI / 2, 0, 0]);
  K.peaks(26, 140, 220, 25, 55, 0x8a6a5a, { colors: [0x8a6a5a, 0x7a5a4a, 0x9a7a62], w0: 1.0, w1: 1.6, y: 4 });
  // volcano with lava, glow and smoke
  const vp = K.at(-0.45, 120), vol = K.group(null, [vp.x, 0, vp.z]);
  K.part(vol, K.cyl(10, 42, 48, 10), K.M(0x5a4a42), [0, 22, 0], null, null, true);
  K.part(vol, K.cyl(10.2, 10.2, 1, 10), K.E(0xff5a1a, { emissiveIntensity: 2 }), [0, 46.2, 0], null, null, true);
  for (let i = 0; i < 5; i++) { const a = K.R(-0.6, 0.6) + PI / 2 + 0.6; K.part(vol, K.box(1.4, 30, 0.6), K.E(0xff6a20, { emissiveIntensity: 1.6 }), [Math.cos(a) * 26, 26 - i * 0.3, Math.sin(a) * 26], [0, -a, 0.55]); }
  K.sprite(0xff7a30, 40, [0, 50, 0], 0.7, vol);
  const smoke = []; for (let i = 0; i < 12; i++) smoke.push({ s: K.sprite(0x8a7a70, 10, [0, 50, 0], 0.5, vol), p: i / 12 });
  smoke.forEach((q) => { q.s.material.blending = THREE.NormalBlending; });
  K.tick((t) => smoke.forEach((q) => { const u = (t * 0.05 + q.p) % 1; q.s.position.set(Math.sin(q.p * 20) * 4 + u * 12, 48 + u * 45, Math.cos(q.p * 20) * 3); q.s.scale.setScalar(8 + u * 30); q.s.material.opacity = 0.55 * (1 - u); }));
  // plants: cycads, tree ferns, conifers
  const frondM = K.swayM(0x4f8a2a, 0.05, 1.2, { side: THREE.DoubleSide });
  K.ring(22, 5, 30).forEach((p) => palm(K, p.x, p.z, K.R(2.5, 6), K.R(0, 0.3), frondM, { trunk: 0x6a5a3a, trunk2: 0x5a4a2a, nuts: false, frond: K.R(1.8, 2.8) }));
  pines(K, K.ring(70, 22, 95), { h0: 8, h1: 18, leaf: [0x2f5a2a, 0x3a6a30, 0x284a24] });
  const fern = [];
  K.ring(90, 3, 26).forEach((p) => { const s = K.R(0.7, 1.5); for (let i = 0; i < 6; i++) fern.push({ x: p.x, y: p.y, z: p.z, ry: i + K.R(0, 0.5), rz: -K.R(0.7, 1.2), sx: s * 0.3, sy: s, sz: s, c: K.pick([0x5a8a2a, 0x6a9a30, 0x4a7a26]) }); });
  K.inst(K.blade(0.3, 1.8, 4), K.swayM(0xffffff, 0.06, 1.3, { side: THREE.DoubleSide }), fern);
  rocks(K, K.ring(50, 4, 50), [0x8a7a68, 0x9a8a72, 0x7a6a5a], 0.5, 2.2);
  grass(K, K.ring(220, 2.6, 18), 0x8a9a3a, { k: 4, colors: [0x8a9a3a, 0x9aaa48, 0x6a8a2a] });
  // a skeleton half buried, and wading long-necks in the lake
  const bones = K.group(null, [K.at(-2.6, 9).x, 0, K.at(-2.6, 9).z], [0, 0.7, 0]), bm = K.S(0xf0e6d0);
  for (let i = 0; i < 7; i++) K.part(bones, K.tor(0.9 - i * 0.07, 0.06, 5, 14, PI), bm, [0, 0, i * 0.4 - 1.2], [0, 0, 0]);
  K.part(bones, K.cyl(0.08, 0.08, 3.5, 6), bm, [0, 0.85, 0], [PI / 2, 0, 0]);
  K.part(bones, K.sph(1, 10, 8), bm, [0, 0.6, 2.2], null, [0.5, 0.45, 0.7]);
  const herd = [];
  for (let i = 0; i < 3; i++) { const m = A.longneck(K), g = K.group(null, [lake.x + (i - 1) * 9, -1.6, lake.z - 4 + i * 3], [0, K.R(0, 6), 0], 1.6 - i * 0.3); g.add(m.g); herd.push(m); }
  K.tick((t) => herd.forEach((m, i) => m.idle(t + i * 2)));
  K.flock(5, { color: 0x7a5040, wing: 0x9a6a50, size: 2.2, y0: 18, y1: 28, r0: 20, r1: 34, cz: -25 });
  sparkle(K, 50, 0xfff0c0, { r: 18, y0: 0.5, y1: 8, add: true, size: 0.12, opacity: 0.5 });
  return { spots: [
    { name: "T. rex", make: A.trex, d: 12, fit: 0.36, turn: 0.6 },
    { name: "long-neck", make: A.longneck, d: 15, fit: 0.42, turn: 0.9 },
    { name: "triceratops", make: A.triceratops, d: 10, fit: 0.26, turn: 0.75 },
    { name: "stegosaurus", make: A.stego, d: 10, fit: 0.28, turn: 0.95 },
    { name: "baby dinosaur", make: A.babydino, d: 6, fit: 0.28, turn: 0.1 },
  ] };
};

// ---------------------------------------------------------------- 3. Outer Space
TW.builders.space = (K) => {
  const { THREE, scene } = K;
  K.sky(0x02020a, 0x0a0820, 0x141030, { horizon: 0.3 });
  K.stars(2600, { minY: -0.2, size: 1.8, colors: [0xffffff, 0xffffff, 0xbfd4ff, 0xffe0c0, 0xffc0e0] });
  [[0x7a3aff, 160, [-120, 120, -260]], [0xff3a9a, 130, [-60, 90, -300]], [0x3a9aff, 180, [200, 140, 120]], [0x3affd0, 120, [260, 80, -60]], [0xff8a3a, 100, [-260, 60, 140]]].forEach(([c, s, p]) => K.sprite(c, s, p, 0.22));
  K.lights({ sky: 0x6a7aa8, ground: 0x222230, hemi: 0.9, sun: 0xffffff, sunI: 3.0, dir: [0.6, 0.55, 0.4] });
  // cratered moon surface
  const craters = []; for (let i = 0; i < 70; i++) { const p = K.at(K.R(-PI, PI), K.R(12, 110)); craters.push([p.x, p.z, K.R(1.5, 7)]); }
  for (let i = 0; i < 10; i++) { const p = K.at(K.R(-PI, PI), K.R(4, 11)); craters.push([p.x, p.z, K.R(0.8, 1.6)]); }
  const h = (x, z) => {
    let y = (K.fbm(x * 0.06, z * 0.06) - 0.5) * 1.6 * sm(6, 30, Math.hypot(x, z));
    for (const [cx, cz, r] of craters) { const d = Math.hypot(x - cx, z - cz) / r; if (d < 1.4) y += d < 1 ? -(1 - d * d) * r * 0.12 + 0.06 * r * d * d * d : (1.4 - d) * r * 0.15; }
    return y;
  };
  K.ground({ h, size: 240, seg: 170, color: (x, z, y) => K.mix(0x55555e, 0x8e8e98, K.noise(x * 0.15, z * 0.15) * 0.6 + y * 0.08 + 0.2) });
  rocks(K, K.ring(90, 3, 60), [0x7a7a82, 0x5a5a62, 0x9a9aa2], 0.2, 1.4);
  // ringed planet and blue planet
  const band = K.tex(256, 128, (c, w, hh) => { for (let y = 0; y < hh; y++) { const v = Math.sin(y * 0.21) * 0.5 + Math.sin(y * 0.07 + 1) * 0.5; c.fillStyle = `rgb(${210 + v * 30},${160 + v * 40},${110 + v * 40})`; c.fillRect(0, y, w, 1); } });
  const gp = K.group(null, [-170, 110, -230], [0.35, 0, 0.3]);
  K.part(gp, K.sph(48, 40, 28), new THREE.MeshStandardMaterial({ map: band, roughness: 0.9, fog: false }), null, null, null, true);
  const ring = new THREE.RingGeometry(62, 98, 96, 6), rc = [], rp = ring.attributes.position, col = new THREE.Color();
  for (let i = 0; i < rp.count; i++) { const r = Math.hypot(rp.getX(i), rp.getY(i)); col.set(K.mix(0xd8c0a0, 0x8a7a68, Math.sin(r * 0.5) * 0.5 + 0.5)); rc.push(col.r, col.g, col.b); }
  ring.setAttribute("color", new THREE.Float32BufferAttribute(rc, 3));
  K.part(gp, ring, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.75, fog: false }), null, [-PI / 2 + 0.2, 0, 0], null, true);
  const earthTex = K.tex(256, 128, (c, w, hh) => { c.fillStyle = "#2a6ad8"; c.fillRect(0, 0, w, hh); for (let i = 0; i < 26; i++) { c.fillStyle = Math.random() < 0.7 ? "#3aa84a" : "#c8a868"; c.beginPath(); c.ellipse(Math.random() * w, 20 + Math.random() * (hh - 40), 8 + Math.random() * 22, 6 + Math.random() * 12, Math.random() * 3, 0, 7); c.fill(); } c.fillStyle = "rgba(255,255,255,0.7)"; for (let i = 0; i < 40; i++) { c.beginPath(); c.ellipse(Math.random() * w, Math.random() * hh, 6 + Math.random() * 18, 2 + Math.random() * 4, 0, 0, 7); c.fill(); } });
  const earth = K.part(null, K.sph(22, 36, 24), new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.7, fog: false }), [190, 70, 150], null, null, true);
  K.sprite(0x6ab8ff, 62, [190, 70, 150], 0.45);
  K.part(null, K.sph(6, 20, 14), K.M(0xc8b8a8, { roughness: 1 }), [60, 95, -180], null, null, true);
  // asteroid belt
  const belt = K.group(null, [0, 70, 0], [0.25, 0, 0.1]);
  K.inst(K.dod(1), K.M(0xffffff), Array.from({ length: 90 }, () => { const a = K.R(0, PI * 2), r = K.R(170, 200), s = K.R(0.6, 2.2); return { x: Math.cos(a) * r, y: K.R(-6, 6), z: Math.sin(a) * r, s, rx: K.R(0, 3), ry: K.R(0, 3), c: K.pick([0x8a7a6a, 0x6a6a72, 0xa8988a]) }; }), { parent: belt, shadow: false });
  K.tick((t) => { belt.rotation.y = t * 0.01; earth.rotation.y = t * 0.03; });
  // moon base behind you: domes, tubes, dish, solar panels, landing pad with blinking lights
  const bp = K.at(PI, 22), base = K.group(null, [bp.x, h(bp.x, bp.z) - 0.2, bp.z]);
  const white = K.S(0xe8eaf0, { roughness: 0.4 }), glass = K.S(0x8ad0ff, { emissive: 0x2a6a9a, transparent: true, opacity: 0.7, roughness: 0.05 });
  [[0, 0, 4], [8, -2, 2.8], [-7, 1, 3]].forEach(([x, z, r]) => { K.part(base, K.hemi(r, 20), white, [x, 0, z]); K.part(base, K.hemi(r * 0.5, 16), glass, [x, r * 0.86, z]); K.part(base, K.box(1.2, 1.6, 1), K.M(0x4a4e58), [x, 0.8, z + r * 0.95]); });
  K.part(base, K.cyl(0.6, 0.6, 8, 10), white, [4, 0.7, -1], [0, 0, PI / 2]); K.part(base, K.cyl(0.6, 0.6, 7, 10), white, [-3.5, 0.7, 0.5], [0, 0, PI / 2]);
  const dish = K.group(base, [3, 0, 5]); K.part(dish, K.cyl(0.12, 0.15, 3, 6), K.M(0x9aa0a8), [0, 1.5, 0]); const dh = K.group(dish, [0, 3, 0], [0.7, 0, 0]); K.part(dh, K.lathe([[0.001, 0], [0.8, 0.15], [1.6, 0.6]], 18), white);
  const pT = K.tex(64, 64, (c, w, hh) => { c.fillStyle = "#18306a"; c.fillRect(0, 0, w, hh); c.strokeStyle = "#8ab0ff"; for (let x = 0; x <= w; x += 8) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, hh); c.stroke(); c.beginPath(); c.moveTo(0, x); c.lineTo(w, x); c.stroke(); } });
  for (let i = 0; i < 4; i++) { const sp = K.group(base, [-10 + i * 2.6, 0, -6]); K.part(sp, K.cyl(0.06, 0.06, 1.4, 5), K.M(0x9aa0a8), [0, 0.7, 0]); K.part(sp, K.box(2.2, 0.05, 1.4), new THREE.MeshStandardMaterial({ map: pT, metalness: 0.6, roughness: 0.3 }), [0, 1.45, 0], [-0.6, 0, 0]); }
  const blinkers = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2, m = new THREE.MeshStandardMaterial({ color: 0xff4040, emissive: 0xff2020 }); blinkers.push(m); K.part(base, K.sph(0.15, 8, 6), m, [Math.cos(a) * 4 - 12, 0.15, Math.sin(a) * 4 + 6], null, null, true); }
  K.part(base, K.cyl(4, 4, 0.1, 24), K.M(0x5a5e68), [-12, 0.05, 6]);
  K.tick((t) => { dh.rotation.y = t * 0.3; blinkers.forEach((m, i) => { m.emissiveIntensity = (Math.floor(t * 4) % 8) === i ? 3 : 0.2; }); });
  // a little rover driving around, and the flag
  const rover = K.group(null), rb = K.group(rover, [0, 0.5, 0]);
  K.part(rb, K.box(1.4, 0.4, 2), white); K.part(rb, K.box(1.2, 0.05, 1.6), new THREE.MeshStandardMaterial({ map: pT, metalness: 0.6 }), [0, 0.25, 0]);
  K.part(rb, K.cyl(0.03, 0.03, 0.8, 5), K.M(0x9aa0a8), [0.5, 0.6, -0.7]); K.part(rb, K.sph(0.08, 8, 6), K.E(0x40ff60), [0.5, 1.0, -0.7]);
  for (const x of [-0.8, 0.8]) for (const z of [-0.75, 0, 0.75]) K.part(rover, K.cyl(0.25, 0.25, 0.2, 10), K.M(0x3a3a40), [x, 0.25, z], [0, 0, PI / 2]);
  K.tick((t) => { const a = t * 0.08 + 2, p = K.at(a, 16); rover.position.set(p.x, h(p.x, p.z), p.z); rover.rotation.y = -a - PI / 2 + PI; });
  const fp = K.at(-2.4, 8), flag = K.group(null, [fp.x, h(fp.x, fp.z), fp.z]);
  K.part(flag, K.cyl(0.04, 0.04, 2.4, 6), K.M(0xcfd2d8), [0, 1.2, 0]);
  K.part(flag, K.box(1.2, 0.75, 0.02), new THREE.MeshStandardMaterial({ map: K.tex(64, 40, (c) => { c.fillStyle = "#f4f4f4"; c.fillRect(0, 0, 64, 40); c.fillStyle = "#2a8ad8"; c.beginPath(); c.arc(32, 20, 12, 0, 7); c.fill(); c.fillStyle = "#ffd23a"; c.beginPath(); c.arc(32, 20, 5, 0, 7); c.fill(); }) }), [0.62, 2.0, 0]);
  // shooting stars
  const shoot = K.sprite(0xffffff, 6, [0, 0, 0], 0.9);
  K.tick((t) => { const u = (t * 0.12) % 1, k = Math.floor(t * 0.12); shoot.visible = u < 0.25; const a = k * 2.4; shoot.position.set(Math.cos(a) * 150 + u * 300 * Math.sin(a), 120 - u * 80, Math.sin(a) * 150 - u * 200); shoot.scale.set(10, 2, 1); });
  return { pitch: 0.02, spots: [
    { name: "astronaut", make: A.astronaut, d: 7, fit: 0.32, turn: 0.15, hover: true },
    { name: "rocket", make: A.rocket, d: 14, fit: 0.42, turn: 0 },
    { name: "alien", make: A.alien, d: 7, fit: 0.3, turn: 0.1 },
    { name: "flying saucer", make: A.ufo, d: 11, fit: 0.36, turn: 0, lift: 1.5, hover: true },
    { name: "satellite", make: A.satellite, d: 10, fit: 0.38, turn: 0.3, lift: 2, hover: true },
  ] };
};

// ---------------------------------------------------------------- 4. Coral Reef
TW.builders.reef = (K) => {
  const { THREE, scene } = K;
  K.sky(0x6ad8f0, 0x1a86b0, 0x0a3a5a, { horizon: 0.35 });
  scene.fog = new THREE.Fog(0x1a7aa0, 5, 55);
  K.lights({ sky: 0xbff4ff, ground: 0x1a4a5a, hemi: 1.7, sun: 0xd8fbff, sunI: 1.8, dir: [0.2, 1, 0.1] });
  const h = (x, z) => { const r = Math.hypot(x, z); return Math.sin(x * 0.9 + Math.sin(z * 0.4) * 2) * 0.05 + (K.fbm(x * 0.06, z * 0.06) - 0.45) * 3 * sm(6, 35, r); };
  K.ground({ h, color: (x, z, y) => { const n = K.noise(x * 0.4, z * 0.4), m = K.noise(x * 0.08 + 5, z * 0.08); return m > 0.62 ? K.mix(0x8aa86a, 0x6a8a5a, n) : K.mix(0xd8c89a, 0xa8986a, n * 0.6 - y * 0.1 + 0.2); } });
  K.water({ size: 200, seg: 50, y: 13, color: 0x9af0ff, opacity: 0.55, amp: 0.25, side: THREE.DoubleSide });
  // light rays from the surface
  const rayTex = K.tex(32, 128, (c, w, hh) => { for (let x = 0; x < w; x++) { const e = Math.sin((x + 0.5) / w * PI), g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, `rgba(255,255,255,${0.9 * e * e})`); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(x, 0, 1, hh); } });
  const rays = [];
  for (let i = 0; i < 14; i++) { const p = K.at(K.R(-PI, PI), K.R(4, 26)), s = new THREE.Sprite(new THREE.SpriteMaterial({ map: rayTex, color: 0xcff8ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.set(K.R(1.5, 3.5), 18, 1); s.position.set(p.x, 5, p.z); scene.add(s); rays.push(s); }
  K.tick((t) => rays.forEach((s, i) => { s.material.opacity = 0.1 + 0.08 * Math.sin(t * 0.6 + i); }));
  // corals: branching, brain, tube, fans, anemones, kelp
  const branch = [];
  K.ring(40, 3, 30).forEach((p) => { const c = K.pick([0xff6a8a, 0xffa04a, 0xc85aff, 0xff4a6a, 0xffd04a]); for (let i = 0; i < 7; i++) branch.push({ x: p.x + K.R(-0.3, 0.3), y: p.y, z: p.z + K.R(-0.3, 0.3), rx: K.R(-0.6, 0.6), rz: K.R(-0.6, 0.6), sy: K.R(0.6, 1.4), s: K.R(0.8, 1.3), c }); });
  K.inst(K.post(0.04, 0.07, 1, 6), K.M(0xffffff), branch);
  K.inst(K.ico(1, 1), K.M(0xffffff), K.ring(45, 3, 30).map((p) => { const s = K.R(0.4, 1.1); return { x: p.x, y: p.y, z: p.z, s, sy: s * 0.65, c: K.pick([0xd86a9a, 0x9a7ad8, 0xe8a05a, 0x7ac8a0]) }; }));
  const tube = []; K.ring(30, 4, 28).forEach((p) => { const c = K.pick([0xffc04a, 0x8a5ad8, 0xff7a5a]); for (let i = 0; i < 5; i++) tube.push({ x: p.x + K.R(-0.35, 0.35), y: p.y, z: p.z + K.R(-0.35, 0.35), sy: K.R(0.5, 1.4), c }); });
  K.inst(K.post(0.1, 0.12, 1, 8), K.M(0xffffff), tube);
  K.inst(K.circle(1, 12), K.swayM(0xffffff, 0.08, 1.0, { side: THREE.DoubleSide }), K.ring(24, 4, 26).map((p) => ({ x: p.x, y: p.y + 0.9, z: p.z, ry: K.R(0, 3), s: K.R(0.6, 1.1), c: K.pick([0xb83aff, 0xff3a6a, 0xff8a3a]) })));
  const kelp = []; K.ring(170, 3.5, 40).forEach((p) => { kelp.push({ x: p.x, y: p.y, z: p.z, sy: K.R(2, 6), s: K.R(0.8, 1.4), ry: K.R(0, 3), c: K.pick([0x3a8a3a, 0x5aa040, 0x2a7a4a]) }); });
  K.inst(K.blade(0.35, 1, 4), K.swayM(0xffffff, 0.12, 1.1, { side: THREE.DoubleSide }), kelp.map((q) => Object.assign({}, q, { sx: 0.55 })));
  rocks(K, K.ring(40, 4, 40), [0x6a7a7a, 0x5a6a72, 0x7a8a7a], 0.6, 2.4);
  // shells and starfish on the sand
  K.inst(K.cone(0.12, 0.2, 7), K.M(0xffffff), K.ring(60, 2.7, 14).map((p) => ({ x: p.x, y: p.y + 0.05, z: p.z, rx: PI / 2, ry: K.R(0, 6), c: K.pick([0xf4e0d0, 0xf4b0a0, 0xffd8a8]) })), { shadow: false });
  // sunken ship behind, with a treasure chest
  const sp = K.at(PI - 0.2, 24), ship = K.group(null, [sp.x, h(sp.x, sp.z) - 0.4, sp.z], [0.15, 0.6, 0.25]), wood = K.M(0x5a4030);
  K.part(ship, K.box(3.2, 2.2, 11), wood, [0, 1.1, 0]); K.part(ship, K.cone(1.6, 3, 4), wood, [0, 1.2, 6.8], [PI / 2, PI / 4, 0], [1, 1, 0.7]);
  K.part(ship, K.cyl(0.18, 0.2, 9, 7), wood, [0, 6, 1], [0.2, 0, 0]); K.part(ship, K.cyl(0.15, 0.18, 4, 7), wood, [0, 3.4, -3], [-0.6, 0, 0]);
  K.part(ship, K.plane(3.5, 3.5), K.M(0xd8d0b0, { side: THREE.DoubleSide, transparent: true, opacity: 0.7 }), [0, 6.5, 1.2], [0, 0, 0.3]);
  const cp = K.at(-PI + 0.5, 9), chest = K.group(null, [cp.x, h(cp.x, cp.z), cp.z], [0, 0.6, 0]);
  K.part(chest, K.box(1.0, 0.6, 0.7), K.M(0x7a4a2a), [0, 0.3, 0]); K.part(chest, K.cyl(0.35, 0.35, 1.0, 10, true), K.M(0x7a4a2a), [0, 0.6, -0.15], [0.5, 0, PI / 2]);
  K.part(chest, K.box(0.8, 0.2, 0.4), K.E(0xffc83a, { emissiveIntensity: 0.6, metalness: 0.9 }), [0, 0.6, 0.05]); K.sprite(0xffd23a, 2.5, [0, 0.8, 0.1], 0.6, chest);
  // schools of fish
  const fishGeo = new THREE.SphereGeometry(1, 8, 6).scale(0.06, 0.12, 0.26), tailGeo = new THREE.ConeGeometry(0.1, 0.16, 4).rotateX(-PI / 2).translate(0, 0, -0.32);
  [[0xffd23a, 30, -10, 3, 7], [0x3ab8ff, 26, 8, 4.5, 9], [0xff7a3a, 20, -4, 6, 12], [0xb8e0ff, 40, 12, 2.5, 18]].forEach(([c, n, cz, y, r], si) => {
    const list = Array.from({ length: n }, () => ({ o: [K.R(-1.6, 1.6), K.R(-0.8, 0.8), K.R(-1.6, 1.6)] }));
    const body = K.inst(fishGeo, K.M(c, { roughness: 0.4 }), list.map(() => ({})), { shadow: false }), tail = K.inst(tailGeo, K.M(c), list.map(() => ({})), { shadow: false });
    body.frustumCulled = tail.frustumCulled = false;
    const sp2 = 0.12 + si * 0.03, cx = si % 2 ? 6 : -6;
    K.tick((t) => {
      const a = t * sp2 + si * 1.7, hx = cx + Math.cos(a) * r, hz = cz + Math.sin(a) * r, head = -a + (sp2 > 0 ? PI : 0);
      list.forEach((q, i) => { const p = { x: hx + q.o[0], y: y + q.o[1] + Math.sin(t * 2 + i) * 0.1, z: hz + q.o[2], ry: head + Math.sin(t * 6 + i) * 0.15 }; K.setInst(body, i, p); K.setInst(tail, i, p); });
      body.instanceMatrix.needsUpdate = tail.instanceMatrix.needsUpdate = true;
    });
  });
  sparkle(K, 160, 0xdff8ff, { r: 18, y0: 0, y1: 12, vy: 0.8, size: 0.09, opacity: 0.6, wob: 0.15 });
  sparkle(K, 120, 0xffffff, { r: 22, y0: 0.5, y1: 10, size: 0.04, opacity: 0.5, wob: 1.2 });
  return { pitch: -0.02, spots: [
    { name: "sea turtle", make: A.turtle, d: 8, fit: 0.34, turn: 0.9, lift: 1.4, hover: true },
    { name: "octopus", make: A.octopus, d: 7, fit: 0.3, turn: 0.1 },
    { name: "clownfish", make: A.clownfish, d: 6, fit: 0.3, turn: 0.3 },
    { name: "jellyfish", make: A.jellyfish, d: 8, fit: 0.32, turn: 0, lift: 1, hover: true },
    { name: "crab", make: A.crab, d: 5, fit: 0.22, turn: 0 },
  ] };
};

// ---------------------------------------------------------------- 5. Farm
TW.builders.farm = (K) => {
  const { THREE, scene } = K;
  K.sky(0x4a9ae8, 0xa9d4f5, 0xeaf5fb, { sunDir: [0.5, 0.6, -0.6], sun: 1, sunColor: 0xfff4d0 });
  scene.fog = new THREE.Fog(0xd8ecf8, 40, 200);
  K.lights({ sky: 0xdff0ff, ground: 0x4a6a2a, hemi: 1.5, sun: 0xfff4e0, sunI: 2.6, dir: [0.5, 0.8, -0.4] });
  const h = (x, z) => { const r = Math.hypot(x, z); return (K.fbm(x * 0.03, z * 0.03) - 0.4) * 6 * sm(10, 50, r) + sm(70, 140, r) * 10 * K.noise(x * 0.02, z * 0.02); };
  const field = (x, z) => { const a = Math.atan2(x, -z), r = Math.hypot(x, z); return r > 18 && r < 70 && Math.abs(a + 0.4) < 0.5 ? 1 : r > 18 && r < 65 && Math.abs(a - 2.4) < 0.45 ? 2 : 0; };
  K.ground({ h, color: (x, z, y) => { const f = field(x, z), n = K.noise(x * 0.25, z * 0.25); if (f === 1) return Math.sin((x * 0.9 + z * 0.4) * 2) > 0 ? 0xd8b84a : 0xc8a03a; if (f === 2) return Math.sin((x * 0.3 - z * 0.9) * 2) > 0 ? 0x6a4a2a : 0x5aa83a; if (Math.abs(z + x * 0.2 - 3) < 1.1 && x < -3) return 0xb8a07a; return K.mix(0x5aa83a, 0x8ac850, n * 0.8 + y * 0.03); } });
  K.peaks(18, 150, 220, 18, 35, 0x6a9a5a, { colors: [0x6a9a5a, 0x7aa868, 0x5a8a50], w0: 2, w1: 3, segs: 9 });
  // barn and silo behind you
  const bp = K.at(PI - 0.25, 24), barn = K.group(null, [bp.x, h(bp.x, bp.z) - 0.2, bp.z], [0, 0.25, 0]), red = K.M(0xb8302a), wht = K.M(0xf4f0e6);
  K.part(barn, K.box(9, 6, 12), red, [0, 3, 0]);
  K.part(barn, K.cone(6.8, 3.6, 4), K.M(0x5a3a32), [0, 7.8, 0], [0, PI / 4, 0], [0.95, 1, 1.25]);
  K.part(barn, K.box(4, 4.2, 0.2), K.M(0x8a2420), [0, 2.1, 6.05]);
  for (const s of [-1, 1]) K.part(barn, K.box(0.25, 5.8, 0.1), wht, [0, 2.1, 6.17], [0, 0, s * 0.76]);
  K.part(barn, K.box(4.3, 0.3, 0.12), wht, [0, 4.25, 6.17]); K.part(barn, K.box(1.4, 1.4, 0.2), wht, [0, 5.4, 6.1]);
  const silo = K.group(barn, [7.2, 0, -2]); K.part(silo, K.cyl(2, 2, 10, 16), K.M(0xc8ccd0, { metalness: 0.5, roughness: 0.4 }), [0, 5, 0]); K.part(silo, K.hemi(2.05, 16), K.M(0x8a9098, { metalness: 0.6 }), [0, 10, 0]);
  // windmill with turning blades
  const wp = K.at(-2.1, 28), mill = K.group(null, [wp.x, h(wp.x, wp.z) - 0.2, wp.z], [0, 2.1, 0]);
  K.part(mill, K.cyl(1.0, 2.0, 9, 8), K.M(0xf4ead6), [0, 4.5, 0]); K.part(mill, K.cone(1.6, 2.2, 8), K.M(0x8a4a3a), [0, 10.1, 0]);
  const blades = K.group(mill, [0, 8.6, 1.3]);
  for (let i = 0; i < 4; i++) { const b = K.group(blades, null, [0, 0, i * PI / 2]); K.part(b, K.box(0.2, 5, 0.1), K.M(0x6a4a2a), [0, 2.6, 0]); K.part(b, K.box(1.0, 4, 0.04), K.M(0xf4f0e6), [0.55, 2.9, 0]); }
  K.tick((t) => { blades.rotation.z = t * 0.6; });
  // fence ring, hay bales, trees, crops, sunflowers, a tractor and a pond with ducks
  const posts = [], rails = [];
  for (let i = 0; i < 64; i++) { const a = i / 64 * PI * 2, p = K.at(a, 15); posts.push({ x: p.x, y: h(p.x, p.z), z: p.z }); const a2 = (i + 0.5) / 64 * PI * 2, q = K.at(a2, 15 * Math.cos(PI / 64)); for (const y of [0.55, 1.0]) rails.push({ x: q.x, y: h(q.x, q.z) + y, z: q.z, ry: -a2 + PI / 2 }); }
  K.inst(K.post(0.07, 0.08, 1.3, 6), K.M(0xd8c8a8), posts); K.inst(K.box(1.5, 0.1, 0.05), K.M(0xf0e6d0), rails);
  K.inst(K.cyl(0.7, 0.7, 1.2, 14), K.M(0xe8c45a), K.ring(14, 17, 40).map((p) => ({ x: p.x, y: p.y + 0.6, z: p.z, rx: PI / 2, rz: K.R(0, 3) })));
  trees(K, K.ring(40, 18, 90), { trunk: 0x6a4a30, leaf: [0x4a9a3a, 0x5aaa42, 0x3a8a32], h0: 4, h1: 9, w: 0.07, cr: 0.45, puffs: 4, top: 0.85 });
  const orchard = K.ring(10, 17, 30), apples = []; orchard.forEach((p) => { for (let i = 0; i < 6; i++) apples.push({ x: p.x + K.R(-1.6, 1.6), y: p.y + K.R(3.6, 5.6), z: p.z + K.R(-1.6, 1.6), s: 1 }); });
  trees(K, orchard, { trunk: 0x6a4a30, leaf: [0x3a8a32], h0: 4, h1: 5, w: 0.08, cr: 0.5, puffs: 3, top: 0.9 });
  K.inst(K.sph(0.12, 8, 6), K.M(0xd8202a), apples, { shadow: false });
  K.inst(K.blade(0.12, 1.4, 5), K.swayM(0x8aa83a, 0.05, 1.4), K.ring(260, 22, 60, { free: true, ok: (x, z) => field(x, z) === 1 }).map((p) => ({ x: p.x, y: p.y, z: p.z, s: K.R(0.8, 1.3) })), { shadow: false });
  const sf = K.ring(26, 8, 14, { a0: -0.5, a1: 0.5 });
  K.inst(K.post(0.03, 0.04, 1.8, 5), K.M(0x4a8a2a), sf.map((p) => ({ x: p.x, y: p.y, z: p.z })));
  K.inst(K.cyl(0.32, 0.32, 0.06, 14), K.M(0xffc82a), sf.map((p) => ({ x: p.x, y: p.y + 1.8, z: p.z, rx: PI / 2 - 0.3, ry: PI * 0.75 })), { shadow: false });
  K.inst(K.cyl(0.16, 0.16, 0.08, 10), K.M(0x5a3a1a), sf.map((p) => ({ x: p.x, y: p.y + 1.8, z: p.z, rx: PI / 2 - 0.3, ry: PI * 0.75 })), { shadow: false });
  grass(K, K.ring(380, 2.6, 22), 0x6ab840, { k: 4, colors: [0x6ab840, 0x7ac850, 0x5aa838] });
  flowers(K, K.ring(140, 2.8, 14), [0xffffff, 0xffe04a, 0xff9ad8, 0xb88aff]);
  const tp = K.at(2.4, 19), tractor = K.group(null, [tp.x, h(tp.x, tp.z), tp.z], [0, -1.2, 0]);
  K.part(tractor, K.box(1.4, 1.0, 2.6), K.M(0xd83a2a), [0, 1.1, 0]); K.part(tractor, K.box(1.3, 1.3, 1.2), K.M(0xd83a2a), [0, 2.0, -0.6]); K.part(tractor, K.box(1.2, 0.9, 1.0), K.S(0x9ad0f0, { transparent: true, opacity: 0.5 }), [0, 2.1, -0.6]);
  K.part(tractor, K.cyl(0.08, 0.08, 1.0, 6), K.M(0x333333), [0.4, 2.0, 0.8]);
  for (const s of [-1, 1]) { K.part(tractor, K.cyl(0.9, 0.9, 0.5, 14), K.M(0x2a2a2a), [s * 0.9, 0.9, -0.7], [0, 0, PI / 2]); K.part(tractor, K.cyl(0.5, 0.5, 0.4, 12), K.M(0x2a2a2a), [s * 0.85, 0.5, 1.0], [0, 0, PI / 2]); K.part(tractor, K.cyl(0.4, 0.4, 0.52, 12), K.M(0xf2c230), [s * 0.9, 0.9, -0.7], [0, 0, PI / 2]); }
  const pp = K.at(1.5, 26), pond = K.group(null, [pp.x, h(pp.x, pp.z) + 0.05, pp.z]);
  K.part(pond, K.circle(5, 28), K.S(0x4a9ac8, { roughness: 0.05 }), null, [-PI / 2, 0, 0], [1, 0.7, 1]);
  const ducks = [0, 1, 2].map((i) => { const d = K.group(pond); K.part(d, K.sph(1, 10, 8), K.M(0xffffff), [0, 0.15, 0], null, [0.22, 0.16, 0.32]); K.part(d, K.sph(0.13, 8, 6), K.M(0x2a7a3a), [0, 0.4, 0.22]); K.part(d, K.cone(0.05, 0.14, 6), K.M(0xf5a020), [0, 0.38, 0.38], [PI / 2, 0, 0]); return d; });
  K.tick((t) => ducks.forEach((d, i) => { const a = t * 0.25 + i * 2.1; d.position.set(Math.cos(a) * 3, 0, Math.sin(a) * 2); d.rotation.y = -a; }));
  K.clouds(16, { y0: 30, y1: 45 });
  K.flock(6, { color: 0x3a3a48, size: 0.5, y0: 12, y1: 18 });
  flutter(K, 12, [0xffffff, 0xffe04a, 0xff9a3a]);
  return { spots: [
    { name: "cow", make: A.cow, d: 9, fit: 0.28, turn: 0.85 },
    { name: "sheep", make: A.sheep, d: 7, fit: 0.22, turn: 0.75 },
    { name: "pig", make: A.pig, d: 7, fit: 0.22, turn: 0.7 },
    { name: "chicken", make: A.chicken, d: 5.5, fit: 0.25, turn: 0.3 },
    { name: "horse", make: A.horse, d: 9, fit: 0.28, turn: 0.85 },
  ] };
};

// ---------------------------------------------------------------- 6. Snowy North
TW.builders.arctic = (K) => {
  const { THREE, scene } = K;
  K.sky(0x081430, 0x1e3a6a, 0x6a8ab8, { horizon: 0.22 });
  K.stars(1400, { minY: 0.08, size: 1.6 });
  scene.fog = new THREE.Fog(0x5a7aa8, 30, 170);
  K.lights({ sky: 0xbcd4ff, ground: 0x6a7a9a, hemi: 1.6, sun: 0xd0e0ff, sunI: 1.6, dir: [-0.4, 0.7, -0.6] });
  // northern lights: wavy glowing ribbons across the sky
  const aur = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, uniforms: { t: { value: 0 } },
    vertexShader: "uniform float t; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.z += sin(p.x * 0.025 + t * 0.25) * 14.0; p.y += sin(p.x * 0.06 + t * 0.4) * 3.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }",
    fragmentShader: "uniform float t; varying vec2 vUv; void main(){ float band = smoothstep(0.0, 0.2, vUv.y) * (1.0 - smoothstep(0.3, 1.0, vUv.y)); float fl = 0.5 + 0.5 * sin(vUv.x * 50.0 + t * 0.8 + sin(vUv.x * 11.0 - t * 0.5) * 3.0); float edge = smoothstep(0.0, 0.1, vUv.x) * (1.0 - smoothstep(0.9, 1.0, vUv.x)); vec3 c = mix(vec3(0.15, 1.0, 0.55), vec3(0.65, 0.3, 1.0), smoothstep(0.25, 0.9, vUv.y)); gl_FragColor = vec4(c * band * (0.35 + fl * 0.5) * edge * 0.7, 1.0); }" });
  [[0, -170, 55, 0.25], [1.9, -160, 70, 0.3], [-2.0, -170, 62, 0.2]].forEach(([ry, z, y, rx]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(320, 50, 120, 6), aur); const g = K.group(null, null, [0, ry, 0]); m.position.set(0, y, z); m.rotation.x = rx; g.add(m); });
  K.tick((t) => { aur.uniforms.t.value = t; });
  K.part(null, K.sph(5, 20, 14), K.B(0xf4f8ff, { fog: false }), [80, 70, 120], null, null, true); K.sprite(0xbfd8ff, 40, [80, 70, 120], 0.5);
  const lake = { x: -6, z: 30, r: 13 };
  const h = (x, z) => { const r = Math.hypot(x, z), l = Math.hypot(x - lake.x, z - lake.z); return (K.fbm(x * 0.05, z * 0.05) - 0.45) * 3 * sm(6, 35, r) * sm(lake.r, lake.r + 6, l) + sm(60, 140, r) * 12 * K.noise(x * 0.025, z * 0.025); };
  K.ground({ h, color: (x, z, y) => K.mix(0xe8f0ff, 0xc8d8f0, K.noise(x * 0.2, z * 0.2) * 0.6 - y * 0.04) });
  K.part(null, K.circle(lake.r, 40), K.S(0xa8d8f0, { roughness: 0.05, metalness: 0.2 }), [lake.x, 0.04, lake.z], [-PI / 2, 0, 0]);
  K.peaks(30, 120, 200, 22, 55, 0x8aa0c0, { snow: 0xf4f8ff, w0: 0.8, w1: 1.3, y: 3 });
  pines(K, K.ring(110, 12, 90), { h0: 5, h1: 13, snow: true, leaf: [0x1f4a3a, 0x24553e, 0x1a4030] });
  K.inst(K.ico(1, 0), K.S(0xa8e0ff, { transparent: true, opacity: 0.85, roughness: 0.05, flatShading: true }), K.ring(24, 5, 30).map((p) => ({ x: p.x, y: p.y + 0.3, z: p.z, s: K.R(0.4, 1.2), sy: K.R(1, 2.2), rx: K.R(-0.3, 0.3), rz: K.R(-0.3, 0.3) })));
  K.inst(K.sph(1, 10, 6), K.S(0xf4f8ff, { roughness: 0.9 }), K.ring(50, 3, 30).map((p) => { const s = K.R(0.5, 1.6); return { x: p.x, y: p.y - s * 0.3, z: p.z, s, sy: s * 0.5 }; }));
  // igloo with a warm glow, a cabin with smoke, a sled
  const ip = K.at(-2.4, 13), ig = K.group(null, [ip.x, h(ip.x, ip.z) - 0.1, ip.z], [0, 2.4 + PI, 0]), snow = K.S(0xf8fbff, { roughness: 0.8 });
  K.part(ig, K.hemi(2.4, 20), snow);
  for (let i = 1; i < 5; i++) K.part(ig, K.tor(2.4 * Math.cos(i * 0.32), 0.03, 4, 32), K.M(0xc8d8ec), [0, 2.4 * Math.sin(i * 0.32), 0], [PI / 2, 0, 0]);
  K.part(ig, K.cyl(0.9, 0.9, 1.6, 12, true), snow, [0, 0.5, 2.4], [PI / 2, 0, 0]); K.part(ig, K.circle(0.75, 16), K.E(0xffa040, { emissiveIntensity: 1.4 }), [0, 0.55, 3.21]);
  K.sprite(0xffa040, 4, [0, 0.8, 3.4], 0.7, ig);
  const cp = K.at(2.0, 34), cabin = K.group(null, [cp.x, h(cp.x, cp.z) - 0.2, cp.z], [0, -2.0 + PI, 0]);
  K.part(cabin, K.box(6, 3.5, 5), K.M(0x6a4428), [0, 1.75, 0]); K.part(cabin, K.cone(5, 2.5, 4), snow, [0, 4.7, 0], [0, PI / 4, 0], [1, 1, 0.85]);
  for (const x of [-1.5, 1.5]) K.part(cabin, K.box(1, 1, 0.1), K.E(0xffc060, { emissiveIntensity: 1.2 }), [x, 1.9, 2.55]);
  K.part(cabin, K.box(0.7, 2.5, 0.7), K.M(0x5a5a62), [1.8, 5, -1]);
  const smoke = []; for (let i = 0; i < 8; i++) { const s = K.sprite(0xc8d0e0, 2, [1.8, 6.5, -1], 0.4, cabin); s.material.blending = THREE.NormalBlending; smoke.push({ s, p: i / 8 }); }
  K.tick((t) => smoke.forEach((q) => { const u = (t * 0.1 + q.p) % 1; q.s.position.set(1.8 + u * 3, 6.5 + u * 8, -1); q.s.scale.setScalar(1.5 + u * 5); q.s.material.opacity = 0.45 * (1 - u); }));
  const sl = K.at(-0.3, 6), sled = K.group(null, [sl.x, h(sl.x, sl.z), sl.z], [0, 0.8, 0]);
  for (const s of [-1, 1]) K.part(sled, K.box(0.06, 0.06, 1.8), K.M(0x3a3a3a), [s * 0.35, 0.05, 0]);
  K.part(sled, K.box(0.8, 0.08, 1.5), K.M(0xc83a2a), [0, 0.3, 0]); for (const z of [-0.5, 0, 0.5]) for (const s of [-1, 1]) K.part(sled, K.box(0.05, 0.25, 0.05), K.M(0x3a3a3a), [s * 0.35, 0.17, z]);
  sparkle(K, 700, 0xffffff, { r: 22, y0: 0, y1: 14, vy: -0.9, size: 0.07, opacity: 0.9, wob: 0.6 });
  return { pitch: -0.02, spots: [
    { name: "penguin", make: A.penguin, d: 6.5, fit: 0.3, turn: 0.1 },
    { name: "polar bear", make: A.polarbear, d: 10, fit: 0.24, turn: 0.8 },
    { name: "seal", make: A.seal, d: 7, fit: 0.3, turn: 0.2 },
    { name: "snowman", make: A.snowman, d: 7, fit: 0.34, turn: 0 },
    { name: "reindeer", make: A.reindeer, d: 9, fit: 0.28, turn: 0.8 },
  ] };
};

// ---------------------------------------------------------------- 7. Tropical Island
TW.builders.island = (K) => {
  const { THREE, scene } = K;
  K.sky(0x2a8ae0, 0x8fd3f4, 0xdaf3fb, { sunDir: [0.3, 0.55, -0.8], sun: 1.2, sunColor: 0xfff4d8 });
  scene.fog = new THREE.Fog(0xcfeef8, 50, 260);
  K.lights({ sky: 0xe0f6ff, ground: 0xd8c08a, hemi: 1.5, sun: 0xfff6e0, sunI: 2.8, dir: [0.3, 0.8, -0.6] });
  // a small sandy island; the beach widens behind you
  const rad = (a) => 9 + 16 * sm(1.9, 2.7, Math.abs(a));
  const h = (x, z) => { const a = Math.atan2(x, -z), r = Math.hypot(x, z), R0 = rad(a); return r < R0 ? 0.5 * Math.cos(Math.min(1, r / R0) * PI / 2) + 0.15 + (K.fbm(x * 0.2, z * 0.2) - 0.5) * 0.15 : -0.3 - Math.min(3, (r - R0) * 0.25); };
  K.ground({ h, size: 140, color: (x, z, y) => (y > 0.25 ? K.mix(0xf4e2b0, 0xe8d098, K.noise(x * 0.4, z * 0.4)) : y > 0.05 ? 0xe0c890 : K.mix(0x6ad8d0, 0x2ab0c0, -y * 0.4)) });
  K.water({ size: 600, seg: 80, y: 0.08, color: 0x1aa0c0, opacity: 0.82, amp: 0.1, rough: 0.08 });
  K.part(null, K.circle(300, 32), K.B(0x0a6a90), [0, -3.5, 0], [-PI / 2, 0, 0]);
  const frondM = K.swayM(0x3fa83a, 0.06, 1.3, { side: THREE.DoubleSide });
  K.ring(9, 3.5, 8.5, { ok: (x, z) => h(x, z) > 0.2 && Math.abs(Math.atan2(x, -z)) > 1.15 }).forEach((p) => palm(K, p.x, p.z, K.R(4.5, 7), K.R(0.3, 0.7), frondM));
  K.ring(8, 9, 22, { free: true, ok: (x, z) => h(x, z) > 0.25 }).forEach((p) => palm(K, p.x, p.z, K.R(5, 8), K.R(0.2, 0.6), frondM));
  // beach things behind you: umbrella, towel, chair, sandcastle, beach hut, tiki torches
  const bp = K.at(PI + 0.3, 7), beach = K.group(null, [bp.x, h(bp.x, bp.z), bp.z], [0, 0.3, 0]);
  K.part(beach, K.cyl(0.04, 0.04, 2.4, 6), K.M(0xf4f4f4), [0, 1.2, 0]);
  const ut = K.tex(128, 16, (c, w) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#ffffff" : "#e83a4a"; c.fillRect(i * w / 8, 0, w / 8 + 1, 16); } });
  K.part(beach, K.cone(1.6, 0.6, 16, true), new THREE.MeshStandardMaterial({ map: ut, side: THREE.DoubleSide, roughness: 0.7 }), [0, 2.4, 0]);
  K.part(beach, K.box(0.9, 0.02, 1.8), K.M(0x3a8ae8), [1.2, 0.02, 0.3]); K.part(beach, K.box(0.9, 0.022, 0.25), K.M(0xf4f4f4), [1.2, 0.03, 0.3]);
  const castle = K.group(beach, [-1.5, 0, 1.0]), sand = K.M(0xe8cc90);
  K.part(castle, K.box(1.0, 0.4, 1.0), sand, [0, 0.2, 0]); for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) { K.part(castle, K.cyl(0.18, 0.2, 0.7, 8), sand, [x, 0.35, z]); K.part(castle, K.cone(0.2, 0.25, 8), sand, [x, 0.82, z]); }
  K.part(castle, K.cyl(0.25, 0.28, 0.9, 8), sand, [0, 0.75, 0]); K.part(castle, K.box(0.2, 0.15, 0.01), K.M(0xe83a3a), [0.1, 1.45, 0]); K.part(castle, K.cyl(0.01, 0.01, 0.35, 4), K.M(0x5a4a3a), [0, 1.35, 0]);
  const hp = K.at(PI - 0.5, 17), hut = K.group(null, [hp.x, h(hp.x, hp.z), hp.z], [0, PI - 0.5 + PI, 0]);
  for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) K.part(hut, K.cyl(0.12, 0.12, 3, 6), K.M(0x7a5a3a), [x, 1.5, z]);
  K.part(hut, K.box(3.6, 0.15, 3.6), K.M(0x9a7a4a), [0, 0.9, 0]); K.part(hut, K.cone(3.4, 2.4, 8), K.M(0xc8a860), [0, 4.1, 0]);
  for (let i = 0; i < 4; i++) { const tp = K.at(PI + K.R(-0.8, 0.8), K.R(5, 9)), tg = K.group(null, [tp.x, h(tp.x, tp.z), tp.z]); K.part(tg, K.cyl(0.05, 0.06, 1.8, 6), K.M(0x7a5a3a), [0, 0.9, 0]); K.part(tg, K.cyl(0.12, 0.08, 0.3, 8), K.M(0x5a4a2a), [0, 1.9, 0]); K.sprite(0xffa040, 0.9, [0, 2.15, 0], 0.9, tg); }
  K.inst(K.cone(0.1, 0.18, 7), K.M(0xffffff), K.ring(50, 2.7, 9, { ok: (x, z) => h(x, z) > 0.15 }).map((p) => ({ x: p.x, y: p.y + 0.04, z: p.z, rx: PI / 2, ry: K.R(0, 6), c: K.pick([0xffe8d8, 0xf8c0a8, 0xfff0c8]) })), { shadow: false });
  grass(K, K.ring(120, 5, 9, { ok: (x, z) => h(x, z) > 0.3 }), 0x8ac850, { k: 3, h: 0.5 });
  // far islands, a lighthouse, sailboats that bob, dolphins leaping
  K.ring(8, 70, 160, { free: true, a0: -2.2, a1: 2.2 }).forEach((p) => { const s = K.R(6, 16); K.part(null, K.hemi(1, 16), K.M(0x4a9a4a), [p.x, -s * 0.15, p.z], null, [s * 1.6, s * 0.45, s]); for (let i = 0; i < 4; i++) palm(K, p.x + K.R(-s, s), p.z + K.R(-s * 0.5, s * 0.5), K.R(5, 9), 0.3, frondM, { nuts: false }); });
  const lp = K.at(-0.35, 60), lh = K.group(null, [lp.x, 0, lp.z]);
  K.part(lh, K.dod(4), K.M(0x6a6a62), [0, 0, 0], null, [1.4, 0.7, 1.4]);
  for (let i = 0; i < 5; i++) K.part(lh, K.cyl(1.2 - i * 0.1, 1.3 - i * 0.1, 2, 12), K.M(i % 2 ? 0xe83a3a : 0xf4f4f4), [0, 3 + i * 2, 0]);
  K.part(lh, K.cyl(0.8, 0.8, 1.2, 10), K.E(0xfff0a0), [0, 13.6, 0]); K.part(lh, K.cone(1.1, 1.2, 10), K.M(0xe83a3a), [0, 14.8, 0]);
  const beam = K.sprite(0xfff0a0, 10, [0, 13.6, 0], 0.7, lh);
  K.tick((t) => { beam.material.opacity = 0.3 + 0.5 * Math.max(0, Math.sin(t * 1.5)); });
  const boats = K.ring(5, 30, 70, { free: true, a0: -1.8, a1: 1.8 }).map((p, i) => {
    const b = K.group(null, [p.x, 0, p.z], [0, K.R(0, 6), 0]);
    K.part(b, K.box(1.4, 0.6, 4), K.M(i % 2 ? 0xf4f4f4 : 0x2a5ac8), [0, 0.2, 0]); K.part(b, K.cyl(0.06, 0.06, 5, 5), K.M(0x8a6a4a), [0, 2.8, 0.2]);
    const sail = new THREE.BufferGeometry(); sail.setAttribute("position", new THREE.Float32BufferAttribute([0, 0.8, 0.2, 0, 5.2, 0.25, 0, 0.8, -1.8, 0, 0.8, 0.4, 0, 4.6, 0.3, 0, 0.8, 2.0], 3)); sail.computeVertexNormals();
    K.part(b, sail, K.M(i % 3 ? 0xffffff : 0xf8d040, { side: THREE.DoubleSide }));
    return { b, ph: K.R(0, 6) };
  });
  K.tick((t) => boats.forEach((q) => { q.b.position.y = Math.sin(t * 1.2 + q.ph) * 0.15; q.b.rotation.z = Math.sin(t * 0.9 + q.ph) * 0.06; }));
  const pod = [0, 1].map((i) => { const d = A.dolphin(K), g = K.group(null, null, null, 1.2); g.add(d.g); return { d, g, i }; });
  K.tick((t) => pod.forEach((q) => { const a = t * 0.12 + q.i * 0.4 + 0.5, p = K.at(-a, 26 + q.i * 3), u = (t * 0.6 + q.i * 0.3) % 1; q.g.position.set(p.x, -1.6 + Math.sin(u * PI) * 2.2, p.z); q.g.rotation.set(0, -(-a) + PI / 2 + PI, 0); q.d.g.rotation.x = (0.5 - u) * 1.6; q.g.visible = u < 0.95; }));
  K.clouds(14, { y0: 32, y1: 48 });
  K.flock(7, { color: 0xffffff, wing: 0xd8dde4, size: 0.7, y0: 8, y1: 14, r0: 10, r1: 20, cz: -14 });
  return { spots: [
    { name: "crab", make: A.crab, d: 5, fit: 0.24, turn: 0 },
    { name: "dolphin", make: A.dolphin, d: 13, fit: 0.26, turn: 1.2, y: 0.05 },
    { name: "seagull", make: A.seagull, d: 6.5, fit: 0.32, turn: 0.4 },
    { name: "starfish", make: A.starfish, d: 5, fit: 0.24, turn: 0 },
    { name: "whale", make: A.whale, d: 22, fit: 0.24, turn: 1.1, y: -0.4 },
  ] };
};

// ---------------------------------------------------------------- 8. Blossom Garden
TW.builders.garden = (K) => {
  const { THREE, scene } = K;
  K.sky(0x7ab8ea, 0xf6d6e4, 0xfde4d0, { sunDir: [-0.4, 0.35, -0.8], sun: 1, sunColor: 0xffe0c8, horizon: 0.22 });
  scene.fog = new THREE.Fog(0xf3dde6, 30, 190);
  K.lights({ sky: 0xffeef4, ground: 0x5a6a3a, hemi: 1.6, sun: 0xffe8d8, sunI: 2.4, dir: [-0.4, 0.75, -0.5] });
  const stream = (x, z) => Math.abs(z - 12 - Math.sin(x * 0.15) * 3);
  const h = (x, z) => { const r = Math.hypot(x, z); return (K.fbm(x * 0.05, z * 0.05) - 0.45) * 2 * sm(8, 35, r) - sm(2.5, 1.0, stream(x, z)) * 0.6 + sm(60, 140, r) * 10 * K.noise(x * 0.02, z * 0.02); };
  K.ground({ h, color: (x, z, y) => { const r = Math.hypot(x, z), n = K.noise(x * 0.3, z * 0.3); if (stream(x, z) < 1.6) return 0x8a8a7a; if (r < 6.5 && Math.abs(Math.atan2(x, -z)) < 0.9) return Math.sin(r * 7) > 0.3 ? 0x9a978e : 0xb4b0a6; return K.mix(0x6aa04a, 0x8ab85a, n * 0.8 + y * 0.05); } });
  K.part(null, K.plane(140, 2.6), K.S(0x5aa8c8, { roughness: 0.05 }), [0, -0.35, 12], [-PI / 2, 0, 0]);
  // the big snowy mountain ahead and soft hills
  const fuji = K.at(0.15, 200), fj = K.group(null, [fuji.x, -2, fuji.z]);
  K.part(fj, K.cone(110, 70, 24), K.M(0x8a9ab8, { roughness: 1, fog: false }), [0, 35, 0], null, null, true);
  K.part(fj, K.cone(33, 21, 24), K.M(0xf8fbff, { roughness: 0.9, fog: false }), [0, 59.5, 0], null, null, true);
  K.peaks(20, 130, 210, 15, 30, 0x7a9a7a, { colors: [0x7a9a7a, 0x6a8a6a, 0x8aa88a], w0: 2, w1: 3, segs: 9, a0: 1.0, a1: 5.3 });
  // cherry trees and red maples
  const pink = [0xffb8d0, 0xffc8dc, 0xf8a8c8, 0xffd8e6];
  trees(K, K.ring(45, 7, 60), { trunk: 0x4a3028, leaf: pink, h0: 3.5, h1: 6.5, w: 0.06, cr: 0.5, puffs: 6, top: 0.85 });
  trees(K, K.ring(25, 12, 70), { trunk: 0x4a3028, leaf: [0xd8402a, 0xe8602a, 0xc8302a, 0xf08a3a], h0: 4, h1: 7, w: 0.06, cr: 0.45, puffs: 5, top: 0.85 });
  trees(K, K.ring(60, 60, 120, { free: true }), { trunk: 0x4a3028, leaf: [0x4a8a4a, 0xffc0d8, 0x5a9a50], h0: 6, h1: 12, w: 0.05, cr: 0.4, puffs: 4 });
  // bamboo grove on the left
  const bam = []; K.ring(160, 14, 32, { a0: -2.2, a1: -1.0 }).forEach((p) => bam.push({ x: p.x, y: p.y, z: p.z, sy: K.R(6, 11), c: K.pick([0x6aa84a, 0x7ab850, 0x5a9a3a]) }));
  K.inst(K.post(0.08, 0.09, 1, 7), K.swayM(0xffffff, 0.015, 0.9), bam);
  K.inst(K.cyl(0.1, 0.1, 0.06, 7), K.M(0x4a7a2a), bam.flatMap((b) => [0.25, 0.5, 0.75].map((u) => ({ x: b.x, y: b.y + b.sy * u, z: b.z }))), { shadow: false });
  K.inst(K.ico(1, 0), K.swayM(0xffffff, 0.04, 1.0), bam.map((b) => ({ x: b.x, y: b.y + b.sy, z: b.z, s: 1.2, sy: 0.9, c: K.pick([0x5aa040, 0x6ab848]) })));
  // pagoda, torii gate, red bridge over the stream, stone lanterns
  const pp = K.at(-2.6, 34), pag = K.group(null, [pp.x, h(pp.x, pp.z) - 0.2, pp.z], [0, 2.6 + PI, 0]), redW = K.M(0xc8302a), roofM = K.M(0x3a3a48);
  for (let i = 0; i < 5; i++) { const s = 1 - i * 0.14, y = i * 3.2; K.part(pag, K.box(6 * s, 2.6, 6 * s), i ? redW : K.M(0xf4ead6), [0, y + 1.3, 0]); K.part(pag, K.cone(6.4 * s, 1.6, 4), roofM, [0, y + 3.2, 0], [0, PI / 4, 0]); }
  K.part(pag, K.cyl(0.08, 0.08, 4, 6), K.M(0xd8b030), [0, 18.5, 0]);
  const tp = K.at(2.7, 16), torii = K.group(null, [tp.x, h(tp.x, tp.z) - 0.1, tp.z], [0, -2.7 + PI, 0]);
  for (const s of [-1, 1]) K.part(torii, K.cyl(0.25, 0.3, 5, 10), redW, [s * 2, 2.5, 0]);
  K.part(torii, K.box(6, 0.4, 0.6), K.M(0x2a2a2a), [0, 5.2, 0]); K.part(torii, K.box(5.2, 0.35, 0.4), redW, [0, 4.2, 0]); K.part(torii, K.box(0.3, 1.0, 0.3), redW, [0, 4.7, 0]);
  const br = K.group(null, [3, 0, 12 + Math.sin(3 * 0.15) * 3], [0, PI / 2, 0]);
  K.part(br, K.tor(3, 0.12, 6, 20, PI), redW, [0, -1.6, 1.0], null, [1, 0.7, 1]); K.part(br, K.tor(3, 0.12, 6, 20, PI), redW, [0, -1.6, -1.0], null, [1, 0.7, 1]);
  K.part(br, K.tor(3, 0.5, 4, 20, PI), K.M(0x8a5a3a), [0, -1.9, 0], [0, 0, 0], [1, 0.7, 2.0]);
  const lanterns = K.ring(8, 4, 16, { a0: -1.0, a1: 1.0 });
  lanterns.forEach((p) => { const l = K.group(null, [p.x, p.y, p.z]), st = K.M(0x9a9a92); K.part(l, K.cyl(0.25, 0.3, 0.2, 6), st, [0, 0.1, 0]); K.part(l, K.cyl(0.1, 0.12, 0.8, 6), st, [0, 0.6, 0]); K.part(l, K.box(0.5, 0.45, 0.5), K.E(0xffd090, { emissiveIntensity: 0.8 }), [0, 1.2, 0]); K.part(l, K.cone(0.5, 0.35, 4), st, [0, 1.6, 0], [0, PI / 4, 0]); K.sprite(0xffc080, 1.4, [0, 1.2, 0], 0.5, l); });
  rocks(K, K.ring(30, 4, 30), [0x8a8a82, 0x7a7a72, 0x9a9a90], 0.4, 1.4);
  K.inst(K.sph(1, 8, 6), K.M(0x4a7a3a), K.ring(50, 3, 25).map((p) => { const s = K.R(0.4, 0.9); return { x: p.x, y: p.y, z: p.z, s, sy: s * 0.7 }; }));
  grass(K, K.ring(250, 2.6, 20, { ok: (x, z) => Math.hypot(x, z) > 6.5 || Math.abs(Math.atan2(x, -z)) > 0.9 }), 0x6aa84a, { k: 3, colors: [0x6aa84a, 0x7ab850] });
  flowers(K, K.ring(120, 3, 18), [0xffffff, 0xff9ad8, 0xb88aff, 0xffe04a], 0.3);
  sparkle(K, 260, 0xffc0d8, { r: 20, y0: 0, y1: 9, vy: -0.4, size: 0.1, opacity: 0.95, wob: 1.4 });
  flutter(K, 10, [0xffffff, 0xffe04a, 0xff9ad8]);
  K.flock(4, { color: 0xf4f4f4, wing: 0xffffff, size: 1.1, y0: 14, y1: 20, r0: 18, r1: 30 });
  return { spots: [
    { name: "crane", make: A.crane, d: 7, fit: 0.36, turn: 0.6 },
    { name: "panda", make: A.panda, d: 7, fit: 0.28, turn: 0.15 },
    { name: "koi fish", make: A.koi, d: 6, fit: 0.24, turn: 0 },
    { name: "rabbit", make: A.rabbit, d: 5.5, fit: 0.24, turn: 0.4 },
    { name: "owl", make: A.owl, d: 6.5, fit: 0.33, turn: 0 },
  ] };
};

// ---------------------------------------------------------------- 9. Desert Pyramids
TW.builders.desert = (K) => {
  const { THREE, scene } = K;
  K.sky(0x3a7ac8, 0xf2c58a, 0xf59a5a, { sunDir: [0.45, 0.18, -0.85], sun: 1.4, sunColor: 0xffc070, horizon: 0.2 });
  scene.fog = new THREE.Fog(0xf0c896, 50, 240);
  K.lights({ sky: 0xffe8c8, ground: 0x8a5a2a, hemi: 1.4, sun: 0xffc890, sunI: 2.8, dir: [0.45, 0.5, -0.75] });
  const oasis = { x: 15, z: 14, r: 5 };
  const h = (x, z) => { const r = Math.hypot(x, z), l = Math.hypot(x - oasis.x, z - oasis.z); return (Math.sin(x * 0.045 + Math.sin(z * 0.035) * 2.2) * 2.6 + (K.fbm(x * 0.04, z * 0.04) - 0.5) * 2) * sm(7, 40, r) - sm(oasis.r + 3, oasis.r - 2, l) * 1.2; };
  K.ground({ h, size: 300, seg: 130, color: (x, z, y) => K.mix(0xe8b870, 0xd09850, K.noise(x * 0.08, z * 0.08) * 0.7 + Math.sin(x * 1.3 + z * 0.4) * 0.08 - y * 0.03) });
  // pyramids behind you and to the side, and far mesas
  [[PI - 0.15, 90, 34], [PI + 0.25, 120, 26], [PI - 0.55, 140, 20]].forEach(([a, r, s]) => { const p = K.at(a, r); K.part(null, K.cone(s * 1.4, s, 4), K.M(0xe0b070, { roughness: 1 }), [p.x, s / 2 - 1, p.z], [0, PI / 4 + a, 0], null, true); });
  K.ring(14, 120, 200, { free: true, a0: -1.6, a1: 1.6 }).forEach((p) => { const s = K.R(8, 18); K.part(null, K.cyl(s * 0.8, s, s * 0.7, 7), K.M(K.pick([0xc0704a, 0xb0603a, 0xd08050]), { roughness: 1 }), [p.x, s * 0.35 - 1, p.z], null, null, true); });
  // oasis: pond, palms, tents
  K.part(null, K.circle(oasis.r + 1, 28), K.S(0x2aa0b8, { roughness: 0.05 }), [oasis.x, -0.6, oasis.z], [-PI / 2, 0, 0]);
  const frondM = K.swayM(0x4a9a3a, 0.05, 1.2, { side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; palm(K, oasis.x + Math.cos(a) * (oasis.r + 1.8), oasis.z + Math.sin(a) * (oasis.r + 1.8), K.R(5, 8), K.R(0.2, 0.5), frondM); }
  grass(K, K.ring(80, 0, 9, { free: true, ok: () => true }).map((p) => ({ x: oasis.x + p.x, z: oasis.z + p.z, y: h(oasis.x + p.x, oasis.z + p.z) })), 0x6aa84a, { k: 4 });
  [[K.at(-2.3, 15), 0xd8402a], [K.at(-2.7, 18), 0x2a5ac8]].forEach(([p, c]) => { const tg = K.group(null, [p.x, h(p.x, p.z) - 0.1, p.z], [0, K.R(0, 6), 0]); K.part(tg, K.cone(2.8, 2.6, 4), K.M(c), [0, 1.3, 0], [0, PI / 4, 0], [1.3, 1, 1]); K.part(tg, K.box(1.2, 1.6, 0.1), K.M(0x3a2a1a), [0, 0.8, 1.6]); });
  // saguaro cacti, desert bushes, rocks
  K.ring(22, 5, 40).forEach((p) => { const c = K.group(null, [p.x, p.y - 0.1, p.z], [0, K.R(0, 6), 0]), m = K.M(0x4a8a3a), hh = K.R(1.8, 3.5); K.part(c, K.cyl(0.25, 0.28, hh, 8), m, [0, hh / 2, 0]); K.part(c, K.sph(0.25, 8, 6), m, [0, hh, 0]); for (const s of [-1, 1]) if (K.rnd() < 0.8) { const y = K.R(0.8, hh * 0.6), ah = K.R(0.6, 1.2); K.part(c, K.cyl(0.15, 0.15, 0.6, 7), m, [s * 0.4, y, 0], [0, 0, PI / 2]); K.part(c, K.cyl(0.15, 0.15, ah, 7), m, [s * 0.68, y + ah / 2, 0]); K.part(c, K.sph(0.15, 7, 5), m, [s * 0.68, y + ah, 0]); } });
  K.inst(K.ico(1, 0), K.M(0xffffff), K.ring(60, 3, 40).map((p) => { const s = K.R(0.3, 0.7); return { x: p.x, y: p.y + s * 0.3, z: p.z, s, sy: s * 0.6, c: K.pick([0x8a8a4a, 0x9a8a5a, 0x7a7a3a]) }; }));
  rocks(K, K.ring(40, 4, 50), [0xb87a4a, 0xa86a3a, 0xc88a5a], 0.4, 1.8);
  // a camel caravan walking far away, tumbleweeds and drifting hot-air balloons
  const caravan = [0, 1, 2].map((i) => { const c = A.camel(K), g = K.group(null, null, null, 1.6); g.add(c.g); return { c, g, i }; });
  K.tick((t) => caravan.forEach((q) => { const a = 0.3 + t * 0.012 - q.i * 0.07, p = K.at(a, 42); q.g.position.set(p.x, h(p.x, p.z), p.z); q.g.rotation.y = -a - PI / 2; q.c.idle(t + q.i); }));
  const weeds = [0, 1, 2].map((i) => K.part(null, K.ico(0.6, 1), K.M(0x9a7a4a, { wireframe: true }), [0, 0, 0]));
  K.tick((t) => weeds.forEach((w, i) => { const u = ((t * 0.04 + i * 0.33) % 1), a = -1.8 + i * 0.4, p = K.at(a + u * 1.2, 14 + i * 4); w.position.set(p.x, h(p.x, p.z) + 0.6 + Math.abs(Math.sin(t * 3 + i)) * 0.4, p.z); w.rotation.set(t * 3, 0, t * 2); }));
  const balloons = [0, 1].map((i) => { const b = A.balloon(K), g = K.group(null, null, null, 3.5); g.add(b.g); return { b, g, i }; });
  K.tick((t) => balloons.forEach((q) => { const a = (q.i ? -0.6 : 0.6) + Math.sin(t * 0.02 + q.i) * 0.3, p = K.at(a, 60 + q.i * 25); q.g.position.set(p.x, 14 + q.i * 6 + Math.sin(t * 0.3 + q.i) * 1.5, p.z); q.b.idle(t); }));
  sparkle(K, 120, 0xffe0b0, { r: 20, y0: 0, y1: 4, size: 0.05, opacity: 0.6, wob: 2.5 });
  K.flock(3, { color: 0x3a2a2a, size: 1.2, y0: 20, y1: 26, r0: 18, r1: 28 });
  return { spots: [
    { name: "camel", make: A.camel, d: 10, fit: 0.3, turn: 0.85 },
    { name: "meerkat", make: A.meerkat, d: 5.5, fit: 0.3, turn: 0.1 },
    { name: "lizard", make: A.lizard, d: 5.5, fit: 0.24, turn: 0.5 },
    { name: "fennec fox", make: A.fennec, d: 6, fit: 0.22, turn: 0.7 },
    { name: "hot-air balloon", make: A.balloon, d: 16, fit: 0.42, turn: 0, lift: 3, hover: true },
  ] };
};
})();
