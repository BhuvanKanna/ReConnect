// The 3D scenes drawn by js/play3d.js, one per exercise id. Each builder gets the shape kit (K, from
// js/twist3d.js), three.js, the camera and the session settings, builds its world, and returns
// { fov, gauge ("h" or "v"), update(view, t, dt), focus(vec) }. view comes from the engine (see play3d.js):
// reach → u (1 = at the target), prog, state; hold → u (1 = bottom of the band), hi, prog, state;
// swing → x (+1 / -1 at the two targets), side, prog; wave → x (+1 / -1 at the turn points), want.
// view.fresh is true on the frame a rep was completed.
(() => {
"use strict";
const RC = window.RC;
const P3 = RC.Play3D;
if (!P3) return;
const PI = Math.PI, D2R = PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (c, t, k, dt) => c + (t - c) * Math.min(1, k * dt);
const lerp = (a, b, u) => a + (b - a) * u;
const mod = (a, n) => ((a % n) + n) % n;
const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const A = () => RC.TwistAnimals || {};

// ---------------------------------------------------------------- shared helpers
// An animal (or any model) scaled to a height, standing on y = 0 at its group's origin.
function fit(K, made, h, parent) {
  const THREE = K.THREE, model = made.g || made, outer = new THREE.Group(), inner = new THREE.Group();
  inner.add(model); outer.add(inner);
  const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -box.min.y, -c.z); outer.scale.setScalar(h / Math.max(0.01, size.y));
  (parent || K.scene).add(outer);
  return { g: outer, idle: made.idle || null };
}
// Round-topped trees: list of {x, z, y, s}
function trees(K, list, colors, parent) {
  if (!list.length) return;
  K.inst(K.cyl(0.13, 0.2, 1, 6), K.M(0x6a4a30), list.map((p) => ({ x: p.x, y: (p.y || 0) + 0.9 * p.s, z: p.z, sx: p.s, sy: 1.8 * p.s, sz: p.s })), { parent });
  const puffs = [];
  list.forEach((p) => {
    const c = K.pick(colors || [0x4a8a3a, 0x5a9a40, 0x3f7f36, 0x6aa848]);
    puffs.push({ x: p.x, y: (p.y || 0) + 2.3 * p.s, z: p.z, s: 1.15 * p.s, ry: K.R(0, 6), c });
    puffs.push({ x: p.x + 0.5 * p.s, y: (p.y || 0) + 2.0 * p.s, z: p.z + 0.3 * p.s, s: 0.8 * p.s, ry: K.R(0, 6), c });
    puffs.push({ x: p.x - 0.5 * p.s, y: (p.y || 0) + 2.1 * p.s, z: p.z - 0.2 * p.s, s: 0.85 * p.s, ry: K.R(0, 6), c });
  });
  K.inst(K.ico(1, 1), K.M(0xffffff), puffs, { parent });
}
function pines(K, list, parent) {
  if (!list.length) return;
  K.inst(K.cyl(0.1, 0.16, 1, 6), K.M(0x5a3e2a), list.map((p) => ({ x: p.x, y: (p.y || 0) + 0.5 * p.s, z: p.z, sx: p.s, sy: p.s, sz: p.s })), { parent });
  K.inst(K.cone(1, 1, 7), K.M(0xffffff), list.flatMap((p) => [0, 1, 2].map((i) => ({ x: p.x, y: (p.y || 0) + (1.4 + i * 0.9) * p.s, z: p.z, sx: (1.2 - i * 0.3) * p.s, sz: (1.2 - i * 0.3) * p.s, sy: 1.5 * p.s, c: K.pick([0x2f6a40, 0x3a7a48, 0x2a5e3a]) }))), { parent });
}
function flowers(K, n, area, parent) {
  const list = [];
  for (let i = 0; i < n; i++) { const x = K.R(area[0], area[1]), z = K.R(area[2], area[3]); if (area[4] && !area[4](x, z)) continue; list.push({ x, y: (area[5] ? area[5](x, z) : 0) + 0.12, z, s: K.R(0.06, 0.1), c: K.pick([0xffffff, 0xffd84a, 0xff7aa8, 0xb48aff, 0xff9a4a]) }); }
  K.inst(K.ico(1, 0), K.M(0xffffff, { emissive: 0x222222 }), list, { parent, shadow: false });
}
// a model with a wavy cloth flag on a pole
function flag(K, parent, p, color, h) {
  const g = K.group(parent, p);
  K.part(g, K.cyl(0.04, 0.05, h, 6), K.M(0xd8d8d8), [0, h / 2, 0]);
  const cloth = K.group(g, [0, h - 0.35, 0]);
  K.part(cloth, K.box(0.9, 0.55, 0.02), K.M(color, { side: K.THREE.DoubleSide }), [0.45, 0, 0]);
  K.tick((t) => { cloth.rotation.y = Math.sin(t * 2.2 + p[0]) * 0.25; });
  return g;
}
// A cylinder stretched between two points (ropes and chains). Returns set(a, b).
function stick(K, r, mat) {
  const THREE = K.THREE, m = K.part(null, K.cyl(r, r, 1, 6), mat), up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
  return (a, b) => { d.subVectors(b, a); const L = d.length(); m.position.addVectors(a, b).multiplyScalar(0.5); m.scale.set(1, Math.max(0.001, L), 1); m.quaternion.setFromUnitVectors(up, d.normalize()); };
}
function textTex(K, text, o = {}) {
  return K.tex(o.w || 512, o.h || 128, (g, w, h) => {
    g.fillStyle = o.bg || "#ffffff"; g.fillRect(0, 0, w, h);
    g.fillStyle = o.color || "#d8342a"; g.font = `700 ${Math.round(h * 0.62)}px Fredoka, Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(text, w / 2, h / 2 + 4);
  });
}
const sunny = (K, o = {}) => {
  K.sky(o.top || 0x3f86d8, o.mid || 0xa9d4f0, o.low || 0xf4f0dc, { sunDir: o.sunDir || [0.5, 0.45, -1], sun: o.sun == null ? 1.1 : o.sun, sunColor: o.sunColor || 0xfff2c8, horizon: 0.16 });
  K.scene.fog = new K.THREE.Fog(o.fog || 0xcfe6f2, o.near || 45, o.far || 260);
  K.lights({ sky: o.skyL || 0xfff6e8, ground: o.groundL || 0x5a7a40, hemi: o.hemi || 1.35, sun: o.sunL || 0xfff0d8, sunI: o.sunI || 2.3, dir: o.dir || [0.55, 0.85, 0.45] });
};
const shadowBox = (K, s) => { const c = K.sun.shadow.camera; c.left = c.bottom = -s; c.right = c.top = s; c.updateProjectionMatrix(); };

// ================================================================ 1. Swing the Gate (Reach)
// A farm gate opens as the forearm swings out. A sheep waits at the gate and walks through while you
// hold it open; when the rep is done it trots off to join the flock in the field.
P3.add("gate", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.6, 0.35, -1], sun: 1.3 });
  const grassAt = (x, z) => K.mix(0x6aa84a, 0x8ac058, K.fbm(x * 0.12, z * 0.12));
  const hH = (x, z) => (z < -16 ? Math.pow(K.fbm(x * 0.025 + 3, z * 0.025), 1.4) * 9 * Math.min(1, (-16 - z) / 40) : 0);
  K.ground({ size: 320, seg: 110, h: hH, color: (x, z) => (Math.abs(x - 0.2) < 1.1 + K.noise(z * 0.4, 1) * 0.3 && z > -7 ? K.mix(0xc8a26e, 0xb08a5a, K.noise(x, z)) : grassAt(x, z)) });
  shadowBox(K, 14);
  K.peaks(16, 150, 220, 30, 60, 0x7aa0b0, { colors: [0x8aaebe, 0x7a9cb0, 0x98b8c4] });
  K.clouds(14); K.flock(5, { cz: -30, y0: 14, y1: 20 });
  // fence with a gap for the gate
  const wood = K.M(0x9a7a56), posts = [], rails = [];
  for (const s of [-1, 1]) {
    for (let x = 1.75; x < 34; x += 2.4) posts.push({ x: s * x, y: 0, z: 0, sy: 1.5 });
    rails.push({ x: s * 18, y: 0.55, z: 0.06, sx: 32.5 }, { x: s * 18, y: 1.2, z: 0.06, sx: 32.5 });
  }
  K.inst(K.post(0.09, 0.11, 1, 7), wood, posts);
  K.inst(K.box(1, 0.12, 0.07), K.M(0xa8865e), rails);
  for (const x of [-1.75, 1.75]) K.part(null, K.post(0.15, 0.17, 1.75, 8), K.M(0x8a6a48), [x, 0, 0]);
  // the gate: hinged at the left post, opens away from you
  const gate = K.group(null, [-1.68, 0, 0.02]), gm = K.M(0xe8e0d0, { roughness: 0.7 });
  for (const y of [0.35, 0.8, 1.25]) K.part(gate, K.box(3.3, 0.14, 0.07), gm, [1.67, y, 0]);
  for (const x of [0.06, 3.28]) K.part(gate, K.box(0.12, 1.15, 0.08), gm, [x, 0.8, 0]);
  const brace = K.part(gate, K.box(3.5, 0.12, 0.06), gm, [1.67, 0.8, 0.03]); brace.rotation.z = Math.atan2(0.9, 3.2);
  K.part(gate, K.cyl(0.05, 0.05, 0.2, 8), K.S(0x555a60, { metalness: 0.6 }), [3.3, 1.1, 0.06], [PI / 2, 0, 0]);
  // green target post where the open gate should reach
  const OPEN = 1.45, aim = K.group(null, [-1.68 + Math.cos(OPEN * 0.92) * 3.3, 0, Math.sin(OPEN * 0.92) * 3.3]);
  K.part(aim, K.post(0.07, 0.07, 1.4, 8), K.E(0x4ad884, { emissiveIntensity: 0.6 }));
  const aimGlow = K.sprite(0x6aff9a, 2.2, [0, 1.3, 0], 0.5, aim);
  // farm in the field: barn, silo, hay bales, trees, flowers
  const barn = K.group(null, [-16, hH(-16, -30), -30], [0, 0.45, 0]);
  K.part(barn, K.box(7, 4.2, 6), K.M(0xb8382e), [0, 2.1, 0]);
  const roof = K.group(barn, [0, 4.2, 0], [0, PI / 2, 0]); K.part(roof, K.cyl(4.3, 4.3, 7.3, 3), K.M(0x5a4a44), [0, 0.5, 0], [-PI / 2, 0, 0], [1, 0.48, 1]);
  K.part(barn, K.box(2.4, 2.8, 0.1), K.M(0xf4ece0), [0, 1.4, 3.02]); K.part(barn, K.box(2.2, 2.6, 0.12), K.M(0x8a2a24), [0, 1.4, 3.03]);
  K.part(null, K.cyl(1.4, 1.4, 8, 14), K.S(0xc8ccd0, { metalness: 0.4 }), [-22, 4 + hH(-22, -34), -34]); K.part(null, K.hemi(1.4, 14), K.S(0xa8b0b8, { metalness: 0.4 }), [-22, 8 + hH(-22, -34), -34]);
  for (const [x, z] of [[6, -9], [7.6, -10], [9, -14]]) K.part(null, K.cyl(0.6, 0.6, 1.1, 14), K.M(0xe8c060), [x, 0.6, z], [0, 0, PI / 2]);
  trees(K, K.ring(26, 18, 70, { free: true, ok: (x, z) => z < -12 || Math.abs(x) > 22 }).map((p) => ({ x: p.x, z: p.z, y: hH(p.x, p.z), s: K.R(1.1, 1.8) })));
  trees(K, [{ x: 6, z: 3, s: 1.3 }, { x: -7, z: 4, s: 1.5 }, { x: 9.5, z: -3, s: 1.2 }]);
  flowers(K, 260, [-16, 16, -14, 6, (x) => Math.abs(x) > 1.6]);
  // sheep: one waiting at the gate, the rest grazing in the field
  const waiting = { s: null, z: 4.2, pop: 0 }, flock = [];
  const spawn = () => { const s = fit(K, A().sheep ? A().sheep(K) : K.group(null), 1.0); s.unit = s.g.scale.x; s.g.scale.setScalar(0.001); s.g.rotation.y = PI; s.g.position.set(0.5, 0, 4.2); return s; };
  waiting.s = spawn();
  let ang = 0, walkT = 0;
  cam.position.set(4.2, 2.3, 8.2); cam.lookAt(-0.8, 0.7, 0.4);
  return {
    fov: 52, gauge: "h",
    update(v, t, dt) {
      const want = (v.state === "return" ? clamp(v.u, 0, 1.2) : clamp(v.u, 0, 1.25)) * OPEN;
      ang = damp(ang, want, 10, dt); gate.rotation.y = -ang;
      aimGlow.material.opacity = v.state === "move" ? 0.45 + 0.35 * Math.sin(t * 5) : 0.15;
      const w = waiting.s;
      if (w) {
        waiting.pop = Math.min(1, waiting.pop + dt * 2.5); const sc = ease(waiting.pop);
        w.g.scale.setScalar(Math.max(0.001, sc * w.unit));
        const goalZ = v.state === "move" ? 4.2 - v.prog * 5.4 : 4.2;
        const nz = damp(waiting.z, goalZ, 6, dt), moving = Math.abs(nz - waiting.z) > 0.002; waiting.z = nz;
        w.g.position.set(0.5, moving ? Math.abs(Math.sin(t * 11)) * 0.06 : 0, waiting.z);
        if (w.idle && !K.calm) w.idle(t);
      }
      if (v.fresh && w) { // through the gate: run to a spot in the field
        const spot = { x: K.R(-9, 10), z: K.R(-8, -15) };
        flock.push({ s: w, from: w.g.position.clone(), to: spot, t: 0, ph: K.R(0, 6) });
        if (flock.length > 12) { const old = flock.shift(); old.s.g.visible = false; }
        waiting.s = null; walkT = 0.9;
      }
      if (!waiting.s && (walkT -= dt) <= 0) { waiting.s = spawn(); waiting.z = 4.2; waiting.pop = 0; }
      for (const f of flock) {
        f.t += dt; const u = clamp(f.t / 2.4, 0, 1), g = f.s.g;
        g.position.set(lerp(f.from.x, f.to.x, ease(u)), u < 1 ? Math.abs(Math.sin(f.t * 12)) * 0.1 : 0, lerp(f.from.z, f.to.z, ease(u)));
        if (u < 1) g.rotation.y = Math.atan2(f.to.x - f.from.x, f.to.z - f.from.z); else { g.rotation.y += Math.sin(t * 0.3 + f.ph) * 0.002; if (f.s.idle && !K.calm) f.s.idle(t + f.ph); }
      }
    },
    focus(p) { p.set(-1.68 + Math.cos(ang) * 3.2, 1.0, Math.sin(ang) * 3.2); },
  };
});

// ================================================================ 2. Paint the Fence (Swing)
// Brush strokes up and down a picket. Each full stroke paints the board; the brush moves to the next.
// Every time the whole fence is done it starts again in a new colour.
P3.add("paint", (K, THREE, cam) => {
  sunny(K, { sunDir: [-0.4, 0.5, -1], dir: [-0.4, 0.9, 0.6] });
  K.ground({ size: 260, seg: 60, h: (x, z) => (z < -14 ? K.fbm(x * 0.03, z * 0.03) * 6 * Math.min(1, (-14 - z) / 30) : 0), color: (x, z) => K.mix(0x6cae4c, 0x8cc45a, K.fbm(x * 0.2, z * 0.2)) });
  shadowBox(K, 6);
  K.clouds(12); K.flock(4, { cz: -25, y0: 10, y1: 14 });
  const N = 7, GAP = 0.44, BOT = 0.12, TOP = 1.42, YB = 0.28, YT = 1.32;
  const COLORS = [0x5ab4f0, 0xffc94a, 0xff7a8a, 0x6ad89a, 0xb48af4, 0xf8f4ec];
  const raw = K.M(0x9a8c7a, { roughness: 0.95 });
  K.inst(K.box(1, 0.1, 0.06), K.M(0x8a7c6a), [{ x: 0, y: 0.42, z: -0.06, sx: N * GAP + 0.6 }, { x: 0, y: 1.12, z: -0.06, sx: N * GAP + 0.6 }]);
  const boards = [];
  for (let i = 0; i < N; i++) {
    const x = (i - (N - 1) / 2) * GAP, b = K.group(null, [x, 0, 0]);
    K.part(b, K.box(0.34, TOP - BOT, 0.05), raw, [0, (TOP + BOT) / 2, 0]);
    K.part(b, K.box(0.24, 0.24, 0.05), raw, [0, TOP, 0], [0, 0, PI / 4]);
    const coat = K.part(b, K.box(0.35, 1, 0.056), K.S(COLORS[0], { roughness: 0.4 }), [0, 0.5, 0.004], null, null, true); coat.visible = false;
    const cap = K.part(b, K.box(0.245, 0.245, 0.056), coat.material, [0, TOP, 0.004], [0, 0, PI / 4], null, true); cap.visible = false;
    boards.push({ x, coat, cap, lo: 9, hi: -9 });
  }
  // the house wall, flower bed, a tree, a paint tin and a cat watching
  K.part(null, K.box(12, 4, 0.3), K.M(0xf0d8b8), [0, 2, -5]); K.part(null, K.box(12.4, 0.3, 0.6), K.M(0x8a5a44), [0, 4.1, -4.9]);
  for (const x of [-3.5, 3.5]) { K.part(null, K.box(1.4, 1.2, 0.1), K.M(0x9ad0f0, { roughness: 0.1 }), [x, 2.2, -4.82]); K.part(null, K.box(1.6, 0.12, 0.2), K.M(0xffffff), [x, 1.55, -4.78]); }
  K.part(null, K.box(1.1, 2.1, 0.1), K.M(0x4a7ab8), [0, 1.05, -4.82]);
  flowers(K, 140, [-6, 6, -4.5, -3.6]);
  trees(K, [{ x: -5.2, z: -2.5, s: 1.3 }, { x: 6, z: -3, s: 1.5 }, { x: -14, z: -12, s: 2 }, { x: 13, z: -14, s: 2.2 }]);
  const tin = K.group(null, [1.1, 0, 0.35]);
  K.part(tin, K.cyl(0.13, 0.13, 0.24, 16), K.S(0xc8ccd2, { metalness: 0.5 }), [0, 0.12, 0]);
  const tinPaint = K.part(tin, K.cyl(0.12, 0.12, 0.01, 16), K.S(COLORS[0]), [0, 0.245, 0], null, null, true);
  const bunny = A().rabbit ? fit(K, A().rabbit(K), 0.35) : null; if (bunny) { bunny.g.position.set(-1.1, 0, 0.7); bunny.g.rotation.y = 0.5; }
  // the brush
  const brush = K.group(null, [boards[0].x, YB, 0.16], null, 1.5);
  K.part(brush, K.cyl(0.025, 0.03, 0.42, 8), K.M(0xb8803e), [0, -0.05, 0.3], [PI / 2 - 0.25, 0, 0]);
  K.part(brush, K.box(0.2, 0.08, 0.07), K.S(0xc8ccd0, { metalness: 0.6 }), [0, 0, 0.07]);
  const bristle = K.part(brush, K.box(0.19, 0.075, 0.08), K.M(COLORS[0]), [0, 0, 0.0]);
  // stroke targets on the current board
  const ringTop = K.part(null, K.tor(0.13, 0.025, 8, 28), K.E(0x4ad884), [0, YT, 0.1]), ringBot = K.part(null, K.tor(0.13, 0.025, 8, 28), K.E(0x4ad884), [0, YB, 0.1]);
  let cur = 0, round = 0, bx = boards[0].x, by = YB, last = YB;
  cam.position.set(0.1, 1.05, 2.5); cam.lookAt(0, 0.78, 0);
  return {
    fov: 50, fovTall: 70, gauge: "v",
    update(v, t, dt) {
      const color = COLORS[round % COLORS.length], b = boards[cur];
      by = damp(by, lerp(YB, YT, (clamp(v.x, -1.15, 1.15) + 1) / 2), 14, dt);
      bx = damp(bx, b.x, 6, dt);
      brush.position.set(bx, by, 0.2); brush.rotation.x = clamp((by - last) / Math.max(dt, 0.001), -2, 2) * -0.12; last = by;
      bristle.material = K.M(color); tinPaint.material = K.S(color);
      if (Math.abs(bx - b.x) < 0.05) { // painting this board
        b.lo = Math.min(b.lo, by - 0.05); b.hi = Math.max(b.hi, by + 0.05);
        const lo = clamp(b.lo, BOT, TOP), hi = clamp(b.hi, BOT, TOP);
        if (hi > lo) { b.coat.visible = true; b.coat.material = K.S(color, { roughness: 0.4 }); b.coat.scale.y = hi - lo; b.coat.position.y = (lo + hi) / 2; }
      }
      if (v.fresh) {
        b.coat.visible = true; b.coat.scale.y = TOP - BOT; b.coat.position.y = (TOP + BOT) / 2; b.cap.visible = true; b.cap.material = b.coat.material;
        cur++; if (cur >= N) { cur = 0; round++; }
        boards[cur].lo = 9; boards[cur].hi = -9;
      }
      const up = v.targets[v.side] > 0;
      for (const [r, on, y] of [[ringTop, up, YT], [ringBot, !up, YB]]) {
        r.position.set(boards[cur].x, y, 0.1); r.scale.setScalar(on ? 1 + 0.12 * Math.sin(t * 6) : 0.8);
        r.material = K.E(on ? 0x4ad884 : 0x9ab0a0, { emissiveIntensity: on ? 0.9 : 0.15 });
      }
      if (bunny && bunny.idle && !K.calm) bunny.idle(t);
    },
    focus(p) { p.set(bx, by, 0.2); },
  };
});

// ================================================================ 3. Turn the Key (Reach)
// A treasure chest on a beach at sunset. Turn the key to unlock it: the lid flies open and gold coins
// spill out onto the sand. Turn back to rest and the lid closes for the next one.
P3.add("key", (K, THREE, cam) => {
  K.sky(0x3a5aa8, 0xf0a878, 0xffd8a0, { sunDir: [0.5, 0.08, -1], sun: 1.6, sunColor: 0xffb060, horizon: 0.12 });
  K.scene.fog = new THREE.Fog(0xf4c8a0, 40, 260);
  K.lights({ sky: 0xffe8d0, ground: 0x8a6a4a, hemi: 1.4, sun: 0xffd8a8, sunI: 2.6, dir: [0.4, 0.6, 0.7] });
  shadowBox(K, 5);
  K.ground({ size: 160, seg: 70, h: (x, z) => (z > -7 ? K.fbm(x * 0.3, z * 0.3) * 0.15 : -0.6 - (-7 - z) * 0.05), color: (x, z) => K.mix(0xf0d8a8, 0xe0c490, K.noise(x * 0.8, z * 0.8)) });
  K.water({ size: 400, seg: 70, y: -0.35, color: 0x2a7ab0, amp: 0.06, rough: 0.12 });
  K.part(null, K.sph(10, 20, 14), K.B(0xffd090, { fog: false }), [80, 12, -250], null, null, true); K.sprite(0xffa050, 90, [80, 14, -250], 0.55);
  K.clouds(10, { color: 0xffd0c0, glow: 0.4 });
  // palm trees, rocks, a crab
  const palm = (x, z, h, lean) => {
    const g = K.group(null, [x, 0, z], [0, K.R(0, 6), 0]);
    const pts = [[0, 0, 0], [lean * 0.3, h * 0.4, 0], [lean, h, 0]];
    K.part(g, K.tube(pts, 0.14, 12, 7), K.M(0x8a6a48));
    for (let i = 0; i < 7; i++) { const f = K.group(g, [lean, h, 0], [0, (i / 7) * PI * 2, 0]); K.part(f, K.box(0.35, 0.04, 1.8), K.swayM(0x3a8a3a, 0.08, 1.4), [0, -0.3, 0.85], [0.45, 0, 0]); }
    K.part(g, K.sph(0.13, 8, 6), K.M(0x6a4a2a), [lean, h - 0.15, 0.12]);
  };
  palm(-3.2, -3.4, 3.6, 0.8); palm(3.6, -4.5, 4.2, -0.9); palm(-5, -6, 3.6, 0.5);
  [[1.9, -0.6, 0.32], [-1.9, -0.2, 0.25], [2.8, -2.4, 0.5]].forEach(([x, z, s]) => K.part(null, K.dod(s), K.M(0x8a8278), [x, s * 0.3, z], [K.R(0, 3), K.R(0, 3), 0], [1, 0.6, 1]));
  const crab = A().crab ? fit(K, A().crab(K), 0.22) : null; if (crab) { crab.g.position.set(-1.0, 0.03, 0.9); crab.g.rotation.y = 0.8; }
  const star = A().starfish ? fit(K, A().starfish(K), 0.05) : null; if (star) star.g.position.set(1.0, 0.03, 1.1);
  // the chest
  const chest = K.group(null, [0, 0.02, 0]), wood = K.M(0x9a5e34), iron = K.S(0x3a3a40, { metalness: 0.6, roughness: 0.4 }), gold = K.S(0xffc832, { metalness: 0.3, roughness: 0.32, emissive: 0x6a4400, emissiveIntensity: 0.6 });
  K.part(chest, K.box(1.3, 0.62, 0.8), wood, [0, 0.31, 0]);
  for (const x of [-0.47, 0.47]) K.part(chest, K.box(0.08, 0.64, 0.82), iron, [x, 0.31, 0]);
  K.part(chest, K.box(1.32, 0.06, 0.82), iron, [0, 0.06, 0]);
  const lid = K.group(chest, [0, 0.62, -0.4]);
  const dome = new THREE.CylinderGeometry(0.4, 0.4, 1.3, 20, 1, false, 0, PI);
  K.part(lid, dome, wood, [0, 0, 0.4], [0, 0, PI / 2], [1, 1, 1]).scale.set(0.6, 1, 1);
  for (const x of [-0.47, 0.47]) K.part(lid, new THREE.CylinderGeometry(0.41, 0.41, 0.08, 20, 1, false, 0, PI), iron, [x, 0, 0.4], [0, 0, PI / 2]).scale.set(0.61, 1, 1);
  K.part(chest, K.box(0.3, 0.32, 0.04), gold, [0, 0.46, 0.41]);
  K.part(chest, K.cyl(0.03, 0.03, 0.05, 10), K.B(0x111111), [0, 0.49, 0.43], [PI / 2, 0, 0], null, true);
  K.part(chest, K.box(0.025, 0.06, 0.05), K.B(0x111111), [0, 0.455, 0.43], null, null, true);
  const glowIn = K.sprite(0xffd860, 0.1, [0, 0.75, 0], 0.9, chest);
  const lockGlow = K.sprite(0x7aff9a, 0.6, [0, 0.47, 0.46], 0, chest);
  // the key, in the lock
  const key = K.group(chest, [0, 0.47, 0.44], null, 1.4);
  K.part(key, K.cyl(0.022, 0.022, 0.26, 10), gold, [0, 0, 0.13], [PI / 2, 0, 0]);
  K.part(key, K.tor(0.085, 0.028, 10, 24), gold, [0, 0, 0.33], [0, PI / 2, 0]);
  K.part(key, K.box(0.03, 0.05, 0.03), gold, [0, 0, 0.27]);
  K.part(key, K.sph(0.03, 8, 6), K.S(0xe83a5a, { roughness: 0.2 }), [0, 0, 0.33]);
  const coins = [];
  let ang = 0, lidA = 0, open = false;
  cam.position.set(0.15, 1.15, 2.35); cam.lookAt(0, 0.45, 0);
  return {
    fov: 48, fovTall: 66, gauge: "h",
    update(v, t, dt) {
      ang = damp(ang, clamp(v.u, 0, 1.15) * PI / 2, 12, dt); key.rotation.z = -ang;
      lockGlow.material.opacity = v.state === "move" ? v.prog * 0.9 : 0;
      if (v.fresh) {
        open = true;
        for (let i = 0; i < 9; i++) {
          const c = K.part(null, K.cyl(0.055, 0.055, 0.012, 14), gold, [K.R(-0.25, 0.25), 0.8, K.R(-0.15, 0.15)]);
          coins.push({ m: c, vx: K.R(-1.1, 1.1), vy: K.R(1.6, 2.6), vz: K.R(0.2, 1.3), spin: K.R(4, 10), rest: false });
          if (coins.length > 70) { const o = coins.shift(); o.m.visible = false; }
        }
      }
      if (v.state === "rest") open = false;
      lidA = damp(lidA, open ? -1.95 : 0, open ? 9 : 6, dt); lid.rotation.x = lidA;
      glowIn.scale.setScalar(damp(glowIn.scale.x, open ? 1.8 : 0.01, 6, dt));
      for (const c of coins) {
        if (c.rest) continue;
        c.vy -= 9.8 * dt; c.m.position.x += c.vx * dt; c.m.position.y += c.vy * dt; c.m.position.z += c.vz * dt; c.m.rotation.x += c.spin * dt;
        const inChest = Math.abs(c.m.position.x) < 0.68 && Math.abs(c.m.position.z) < 0.42;
        if (!inChest && c.m.position.y < 0.04) { c.m.position.y = 0.04; c.rest = true; c.m.rotation.set(K.R(-0.2, 0.2), 0, K.R(-0.2, 0.2)); }
      }
      if (crab && crab.idle && !K.calm) { crab.idle(t); crab.g.position.x = -1.0 + Math.sin(t * 0.5) * 0.25; }
    },
    focus(p) { p.set(0, 0.85, 0.2); },
  };
});

// ================================================================ 4. Raise the Drawbridge (Hold)
// Lift the bridge and hold it up: a little boat sails along the moat underneath. When it is through,
// the rep is done and the next boat waits at the corner.
P3.add("drawbridge", (K, THREE, cam) => {
  sunny(K, { sunDir: [-0.5, 0.4, -1], dir: [-0.5, 0.8, 0.6] });
  const moat = (z) => z > 0.6 && z < 4.6;
  K.ground({ size: 300, seg: 120, h: (x, z) => (moat(z) ? -1.7 : z < -20 ? K.fbm(x * 0.03, z * 0.03) * 10 * Math.min(1, (-20 - z) / 40) : 0), color: (x, z, y) => (y < -0.5 ? 0x7a6a50 : K.mix(0x6aa84a, 0x8ac058, K.fbm(x * 0.15, z * 0.15))) });
  K.water({ size: 300, seg: 90, y: -0.75, color: 0x3a8ab8, amp: 0.05, rough: 0.1 });
  shadowBox(K, 16);
  K.peaks(14, 150, 230, 30, 70, 0x8aa8b8, { snow: 0xf4f8fc });
  K.clouds(14); K.flock(6, { cz: -20, y0: 14, y1: 20 });
  const stone = K.M(0xc4bcae), dark = K.M(0xa89e90);
  K.part(null, K.box(14, 5, 1.6), stone, [0, 2.5, -0.8]);
  const crenels = []; for (let x = -6.8; x <= 6.8; x += 0.8) crenels.push({ x, y: 5.25, z: -0.15, c: 0xffffff });
  K.inst(K.box(0.45, 0.5, 0.35), stone, crenels);
  for (const s of [-1, 1]) {
    const tw = K.group(null, [s * 4.6, 0, -0.6]);
    K.part(tw, K.cyl(1.5, 1.6, 7.5, 14), dark, [0, 3.75, 0]);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; K.part(tw, K.box(0.4, 0.5, 0.35), dark, [Math.cos(a) * 1.45, 7.75, Math.sin(a) * 1.45], [0, -a, 0]); }
    K.part(tw, K.cone(1.75, 2.8, 14), K.M(0x3a5ab8), [0, 9.4, 0]);
    flag(K, tw, [0, 10.6, 0], s < 0 ? 0xffc83a : 0xe84a5a, 1.6);
    K.part(tw, K.box(0.3, 0.6, 0.1), K.B(0x2a2420), [0, 5.5, 1.56], null, null, true);
  }
  K.part(null, K.box(2.5, 3.0, 0.1), K.B(0x2a2018), [0, 1.5, 0.02], null, null, true);
  K.part(null, new THREE.CylinderGeometry(1.25, 1.25, 0.1, 20, 1, false, -PI / 2, PI), K.B(0x2a2018), [0, 3.0, 0.02], [PI / 2, 0, 0], null, true);
  // the bridge, hinged at the gate
  const bridge = K.group(null, [0, 0.05, 0.12]), plank = K.M(0x9a6a40);
  K.part(bridge, K.box(2.3, 0.16, 4.7), plank, [0, 0, 2.35]);
  for (let z = 0.3; z < 4.6; z += 0.55) K.part(bridge, K.box(2.32, 0.03, 0.06), K.M(0x6a4a2a), [0, 0.09, z], null, null, true);
  const chains = [stick(K, 0.035, K.S(0x4a4a50, { metalness: 0.6 })), stick(K, 0.035, K.S(0x4a4a50, { metalness: 0.6 }))];
  const hookL = new THREE.Vector3(-1.05, 3.6, 0.05), hookR = new THREE.Vector3(1.05, 3.6, 0.05), endL = new THREE.Vector3(), endR = new THREE.Vector3();
  trees(K, K.ring(30, 14, 80, { free: true, ok: (x, z) => z > 7 || z < -12 || Math.abs(x) > 12 }).map((p) => ({ x: p.x, z: p.z, s: K.R(1, 1.7) })));
  // boats on the moat
  const boat = (c) => {
    const g = K.group(null, [-12, -0.72, 2.6]);
    K.part(g, K.box(0.8, 0.35, 1.8), K.M(c), [0, 0.1, 0], [0, PI / 2, 0]); K.part(g, K.box(0.6, 0.08, 1.4), K.M(0xd8b888), [0, 0.3, 0], [0, PI / 2, 0]);
    K.part(g, K.cyl(0.03, 0.03, 1.8, 6), K.M(0x8a6a4a), [0, 1.2, 0]);
    const sail = new THREE.BufferGeometry(); sail.setAttribute("position", new THREE.Float32BufferAttribute([0, 0.4, 0.04, 0, 2.0, 0.04, 0.9, 0.4, 0.04, 0, 0.4, -0.04, 0.9, 0.4, -0.04, 0, 2.0, -0.04], 3)); sail.computeVertexNormals();
    K.part(g, sail, K.M(0xfff8ec, { side: THREE.DoubleSide }));
    g.scale.setScalar(0.001); return g;
  };
  const colors = [0xe84a3a, 0x3a7ae8, 0xf0b030, 0x4ab86a];
  let ang = 0, cur = boat(colors[0]), curX = -9, pop = 0, leaving = null, leaveX = 0, n = 1;
  cam.position.set(6.8, 3.2, 10.5); cam.lookAt(-0.3, 1.6, 1.2);
  return {
    fov: 52, gauge: "v",
    update(v, t, dt) {
      const target = v.state === "go" ? clamp(v.u, 0, 1.3) * 1.18 : clamp(v.u, 0, 1.3) * 0.6;
      ang = damp(ang, target, 8, dt); bridge.rotation.x = -ang;
      const L = 4.55; endL.set(-1.05, 0.05 + Math.sin(ang) * L, 0.12 + Math.cos(ang) * L); endR.set(1.05, endL.y, endL.z);
      chains[0](hookL, endL); chains[1](hookR, endR);
      pop = Math.min(1, pop + dt * 2); cur.scale.setScalar(Math.max(0.001, ease(pop)));
      const goalX = -9 + 18 * clamp(v.state === "go" ? v.prog : 0, 0, 1);
      curX = v.state === "go" ? damp(curX, goalX, 5, dt) : curX;
      cur.position.set(curX, -0.72 + Math.sin(t * 2) * 0.04, 2.6); cur.rotation.z = Math.sin(t * 1.6) * 0.05;
      if (v.fresh) { leaving = cur; leaveX = curX; cur = boat(colors[n++ % colors.length]); curX = -9; pop = 0; }
      if (leaving) { leaveX += dt * 4; leaving.position.x = leaveX; if (leaveX > 16) { leaving.visible = false; leaving = null; } }
    },
    focus(p) { p.set(leaving ? leaveX : curX, 0.2, 2.6); },
  };
});

// ================================================================ 5. Open the Jar (Wave)
// A cookie jar on the kitchen counter. Each twist back and forth loosens the lid a little;
// on the last one it pops off and a cookie jumps out.
P3.add("jar", (K, THREE, cam) => {
  K.sky(0x6aa8e8, 0xcfe6f6, 0xffffff, { sun: 0 });
  K.lights({ sky: 0xfff4e4, ground: 0x8a7058, hemi: 1.6, sun: 0xfff0d8, sunI: 2.2, dir: [0.6, 0.9, 0.7] });
  shadowBox(K, 3);
  const TOP = 0.92;
  K.part(null, K.box(5, 0.08, 1.6), K.S(0xeee8de, { roughness: 0.3 }), [0, TOP - 0.04, -0.1]);
  K.part(null, K.box(5, 0.86, 1.5), K.M(0x8ab89a), [0, 0.43, -0.12]);
  for (const x of [-1.2, 0, 1.2]) K.part(null, K.cyl(0.02, 0.02, 0.24, 8), K.S(0xd8c8a0, { metalness: 0.6 }), [x, 0.74, 0.64], [0, 0, PI / 2]);
  const tile = K.tex(256, 256, (g, w, h) => { g.fillStyle = "#e9eef0"; g.fillRect(0, 0, w, h); g.strokeStyle = "#c8d4d8"; g.lineWidth = 6; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } g.fillStyle = "#7ab8d8"; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) { g.beginPath(); g.arc(i * 64 + 32, j * 64 + 32, 7, 0, PI * 2); g.fill(); } }, true);
  tile.repeat.set(8, 3);
  K.part(null, K.plane(5, 2.2), new THREE.MeshStandardMaterial({ map: tile, roughness: 0.4 }), [0, TOP + 1.1, -0.85], null, null, true);
  // window with a garden view
  const view = K.tex(256, 192, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5aa0e8"); gr.addColorStop(0.6, "#bfe2f8"); gr.addColorStop(0.61, "#7ac05a"); gr.addColorStop(1, "#5a9a40"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "#3f7f36"; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(20 + i * 45, 112, 24, 0, PI * 2); g.fill(); } g.fillStyle = "#fff"; g.beginPath(); g.ellipse(70, 40, 30, 10, 0, 0, PI * 2); g.fill(); });
  K.part(null, K.plane(1.1, 0.8), new THREE.MeshBasicMaterial({ map: view }), [1.05, TOP + 0.95, -0.83], null, null, true);
  for (const [x, y, w, h] of [[1.05, TOP + 1.37, 1.22, 0.06], [1.05, TOP + 0.53, 1.3, 0.08], [0.47, TOP + 0.95, 0.06, 0.86], [1.63, TOP + 0.95, 0.06, 0.86], [1.05, TOP + 0.95, 0.04, 0.8]]) K.part(null, K.box(w, h, 0.06), K.M(0xffffff), [x, y, -0.8]);
  // things on the counter
  const pot = K.group(null, [-1.15, TOP, -0.35]); K.part(pot, K.cyl(0.14, 0.11, 0.22, 14), K.M(0xd8784a), [0, 0.11, 0]);
  const leaf = new THREE.BoxGeometry(0.05, 0.32, 0.02).translate(0, 0.16, 0), leafM = K.swayM(0x4a9a4a, 0.05, 1.2);
  for (let i = 0; i < 8; i++) K.part(pot, leaf, leafM, [K.R(-0.05, 0.05), 0.2, K.R(-0.05, 0.05)], [K.R(-0.4, 0.4), K.R(0, 3), K.R(-0.4, 0.4)]);
  const mug = K.group(null, [0.62, TOP, 0.05]); K.part(mug, K.cyl(0.07, 0.065, 0.15, 16), K.S(0xf4c84a), [0, 0.075, 0]); K.part(mug, K.tor(0.045, 0.014, 8, 14), K.S(0xf4c84a), [0.08, 0.08, 0], [0, 0, 0]);
  K.part(null, K.box(0.5, 0.03, 0.32), K.M(0xc89a62), [-0.65, TOP + 0.015, 0.1], [0, 0.25, 0]);
  K.part(null, K.sph(0.07, 12, 10), K.S(0xffd84a), [-0.62, TOP + 0.08, 0.12], null, [1, 0.85, 1.2]);
  // the jar, with cookies inside
  const jar = K.group(null, [0, TOP, 0]);
  const glass = new THREE.MeshStandardMaterial({ color: 0xe4f2f6, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false });
  const body = K.part(jar, K.lathe([[0, 0], [0.17, 0], [0.19, 0.02], [0.19, 0.3], [0.155, 0.34], [0.155, 0.4]], 28), glass, null, null, null, true); body.renderOrder = 2;
  const cookies = [];
  for (let i = 0; i < 9; i++) cookies.push({ x: K.R(-0.07, 0.07), y: 0.025 + i * 0.03, z: K.R(-0.07, 0.07), rx: K.R(-0.25, 0.25), rz: K.R(-0.25, 0.25), c: K.pick([0xc8884a, 0xb8783a, 0xd8985a]) });
  K.inst(K.cyl(0.075, 0.075, 0.025, 14), K.M(0xffffff), cookies, { parent: jar });
  const chipT = K.tex(64, 64, (g) => { g.fillStyle = "#c8884a"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#4a2a18"; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(8 + Math.random() * 48, 8 + Math.random() * 48, 4, 0, PI * 2); g.fill(); } });
  const checks = K.tex(128, 128, (g) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, 128, 128); g.fillStyle = "rgba(214,48,48,0.85)"; for (let i = 0; i < 8; i++) { g.fillRect(i * 16, 0, 8, 128); g.fillRect(0, i * 16, 128, 8); } });
  const lid = K.group(null, [0, TOP + 0.4, 0]);
  K.part(lid, K.cyl(0.175, 0.175, 0.07, 28), K.S(0xd8342a, { roughness: 0.35 }), [0, 0.035, 0]);
  K.part(lid, K.circle(0.17, 28), new THREE.MeshStandardMaterial({ map: checks, roughness: 0.6 }), [0, 0.072, 0], [-PI / 2, 0, 0], null, true);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; K.part(lid, K.box(0.012, 0.06, 0.02), K.S(0xb82a22), [Math.cos(a) * 0.176, 0.035, Math.sin(a) * 0.176], [0, -a, 0], null, true); }
  const cookie = K.group(null, [0, TOP + 0.3, 0]); cookie.visible = false;
  K.part(cookie, K.cyl(0.075, 0.075, 0.025, 16), new THREE.MeshStandardMaterial({ map: chipT, roughness: 0.8 }));
  let spin = 0, rise = 0, popT = -1;
  cam.position.set(0, TOP + 0.78, 1.3); cam.lookAt(0, TOP + 0.22, 0);
  return {
    fov: 46, fovTall: 64, gauge: "h",
    update(v, t, dt) {
      const done = v.reps >= v.goal;
      if (v.fresh) { rise += 0.004; if (done) popT = 0; }
      spin = damp(spin, clamp(v.x, -1.3, 1.3) * 0.9, 12, dt);
      if (popT < 0) {
        lid.position.set(0, TOP + 0.4 + rise + (v.prog * 0.04), 0); lid.rotation.set(0, -spin - v.prog * 6, 0);
      } else {
        popT += dt; const u = clamp(popT / 0.9, 0, 1);
        // the lid flips off and lands upside down beside the jar; a cookie hops out the other side
        lid.position.set(lerp(0, 0.42, u), lerp(TOP + 0.44, TOP + 0.075, u) + Math.sin(u * PI) * 0.45, lerp(0, 0.22, u)); lid.rotation.set(ease(u) * PI * 3, -spin, 0);
        cookie.visible = true; const c = clamp((popT - 0.3) / 0.8, 0, 1);
        cookie.position.set(lerp(0, -0.34, c), lerp(TOP + 0.3, TOP + 0.014, c) + Math.sin(c * PI) * 0.5, lerp(0, 0.25, c)); cookie.rotation.set(ease(c) * PI * 2, 0, 0);
      }
    },
    focus(p) { p.set(lid.position.x, lid.position.y + 0.05, lid.position.z); },
  };
});

// ================================================================ 6. Airplane Arms (Hold)
// Fly a little plane over the sea. Lifting the arm climbs; the band is a line of golden rings to fly
// through. Holding in the band carries you to the next island, where a crowd of balloons goes up.
P3.add("airplane", (K, THREE, cam) => {
  sunny(K, { top: 0x2f78d8, mid: 0x9ccff0, low: 0xe8f4f8, fog: 0xbfe0f0, near: 60, far: 300, dir: [0.4, 0.9, 0.3] });
  K.water({ size: 600, seg: 60, y: 0, color: 0x2a8ac8, amp: 0.12, rough: 0.2 });
  shadowBox(K, 20);
  const H0 = 3, HS = 5, SPEED = 16, WRAP = 320;
  const alt = (u) => H0 + u * HS;
  // scrolling world: islands, little boats and clouds
  const scroll = [];
  const island = (x, z, s, c) => { const g = K.group(null, [x, 0, z]); K.part(g, K.hemi(1, 14), K.M(0xe8d8a8), [0, -0.3 * s, 0], null, [s * 1.3, s * 0.35, s * 1.1]); K.part(g, K.hemi(1, 14), K.M(c), [0, -0.1 * s, 0], null, [s, s * 0.5, s * 0.85]); trees(K, [0, 1, 2].map(() => ({ x: K.R(-0.5, 0.5) * s, z: K.R(-0.4, 0.4) * s, y: s * 0.3, s: s * 0.18 })), null, g); return g; };
  for (let i = 0; i < 16; i++) { const x = (K.rnd() < 0.5 ? -1 : 1) * K.R(14, 90), z = K.R(-WRAP + 20, 20); scroll.push({ g: island(x, z, K.R(4, 12), K.pick([0x5aa84a, 0x6ab858, 0x4a9a40])), z0: z }); }
  for (let i = 0; i < 6; i++) { const z = K.R(-WRAP + 20, 20), g = K.group(null, [K.R(-50, 50), 0.1, z]); K.part(g, K.box(1.2, 0.4, 3), K.M(0xffffff)); K.part(g, K.box(0.8, 0.5, 1), K.M(0xe84a3a), [0, 0.4, -0.3]); scroll.push({ g, z0: z }); }
  const puff = K.M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 1 });
  for (let i = 0; i < 26; i++) {
    const z = K.R(-WRAP + 20, 20), g = K.group(null, [(K.rnd() < 0.5 ? -1 : 1) * K.R(7, 45), K.R(4, 22), z]), k = 3 + Math.floor(K.R(0, 4)), s = K.R(1.2, 3);
    for (let j = 0; j < k; j++) K.part(g, K.ico(1, 1), puff, [K.R(-1.2, 1.2) * s, K.R(-0.2, 0.4) * s, K.R(-0.6, 0.6) * s], null, [s, s * 0.6, s], true);
    scroll.push({ g, z0: z });
  }
  // the rings that mark the band
  const rings = [];
  for (let i = 0; i < 7; i++) { const r = K.part(null, K.tor(1, 0.09, 10, 40), K.E(0xffcc3a, { emissiveIntensity: 0.6 }), [0, 9, -20 - i * 34], null, null, true); rings.push({ m: r, glow: 0 }); }
  // destination island with a lighthouse and balloons
  const goal = K.group(null, [0, 0, -180]);
  K.part(goal, K.hemi(1, 18), K.M(0xe8d8a8), [0, -2, 0], null, [16, 4, 12]); K.part(goal, K.hemi(1, 18), K.M(0x5ab850), [0, -1, 0], null, [12, 4.5, 9]);
  const lh = K.group(goal, [3, 2.5, -2]); for (let i = 0; i < 4; i++) K.part(lh, K.cyl(0.9 - i * 0.08, 1 - i * 0.08, 1.6, 12), K.M(i % 2 ? 0xd8342a : 0xffffff), [0, 0.8 + i * 1.6, 0]);
  K.part(lh, K.cone(1, 1.2, 12), K.M(0xd8342a), [0, 7.2, 0]);
  flag(K, goal, [-4, 2.5, 1], 0xffc83a, 3);
  trees(K, [{ x: -6, z: -3, y: 2, s: 1.4 }, { x: -2, z: 3, y: 2.4, s: 1.2 }, { x: 7, z: 2, y: 1.8, s: 1.3 }], null, goal);
  const balloons = [];
  for (let i = 0; i < 9; i++) { const b = K.part(goal, K.sph(0.6, 12, 10), K.S(K.pick([0xff5a5a, 0xffd23a, 0x5ab0ff, 0x8ae07a, 0xff8ad8]), { roughness: 0.3 }), [K.R(-6, 6), 3, K.R(-4, 4)], null, [1, 1.2, 1]); b.visible = false; balloons.push({ b, vy: K.R(2, 4), x0: b.position.x }); }
  // the plane
  const plane = K.group(null, [0, alt(0), 0]), body = K.group(plane), red = K.S(0xe83a3a, { roughness: 0.35 }), white = K.S(0xf8f8f8, { roughness: 0.35 });
  K.part(body, K.cyl(0.22, 0.35, 2.6, 14), red, [0, 0, 0], [PI / 2, 0, 0]); K.part(body, K.sph(0.35, 14, 10), red, [0, 0, -1.3]);
  K.part(body, K.sph(0.24, 12, 8), K.S(0x9ad8ff, { roughness: 0.05, metalness: 0.3 }), [0, 0.28, -0.35], null, [1, 0.8, 1.6]);
  K.part(body, K.box(4.2, 0.08, 0.75), white, [0, -0.05, -0.35]); for (const s of [-1, 1]) K.part(body, K.box(0.5, 0.085, 0.76), red, [s * 1.85, -0.05, -0.35]);
  K.part(body, K.box(1.5, 0.06, 0.45), white, [0, 0.05, 1.15]); K.part(body, K.box(0.06, 0.6, 0.5), red, [0, 0.35, 1.2]);
  const prop = K.group(body, [0, 0, -1.68]); K.part(prop, K.box(0.12, 1.2, 0.04), K.M(0x333338)); K.part(body, K.sph(0.1, 8, 6), K.S(0xffd23a), [0, 0, -1.66]);
  const trail = K.sprite(0xffffff, 1.4, [0, 0, 1.6], 0, plane);
  let y = alt(0), vy = 0, goalZ = -180, arrive = -1, s = 0;
  cam.position.set(0, 5, 8);
  return {
    fov: 58, fovTall: 74, gauge: "v",
    update(v, t, dt) {
      const top = Math.min(v.hi, 2.2), bandMid = alt((1 + top) / 2), bandR = Math.max(1.4, ((top - 1) / 2) * HS + 0.7);
      const ny = damp(y, alt(clamp(v.u, 0, top + 0.4)), 4, dt); vy = (ny - y) / Math.max(dt, 0.001); y = ny;
      s += SPEED * dt;
      plane.position.set(Math.sin(t * 0.7) * 0.3, y, 0); body.rotation.set(clamp(vy * 0.08, -0.4, 0.4), 0, Math.sin(t * 0.9) * 0.08);
      prop.rotation.z += dt * 40;
      trail.material.opacity = v.inBand ? 0.5 : 0;
      for (const q of scroll) q.g.position.z = 20 - mod(20 - q.z0 - s, WRAP);
      for (let i = 0; i < rings.length; i++) {
        const r = rings[i], z = 20 - mod(i * 34 + 40 - s, rings.length * 34);
        const prevZ = r.m.position.z; r.m.position.set(0, bandMid, z); r.m.scale.setScalar(bandR);
        if (prevZ < 0 && z >= 0 && v.inBand) r.glow = 1;
        r.glow = Math.max(0, r.glow - dt * 1.5);
        r.m.material = K.E(r.glow > 0 ? 0xfff2a0 : v.state === "go" ? 0xffcc3a : 0xc8b890, { emissiveIntensity: 0.4 + r.glow * 1.2 });
      }
      // the destination island comes closer as the hold builds up
      if (v.fresh) arrive = 0;
      if (arrive >= 0) {
        arrive += dt; goalZ += SPEED * dt; balloons.forEach((b) => { b.b.visible = true; b.b.position.y += b.vy * dt; b.b.position.x = b.x0 + Math.sin(t * 2 + b.vy) * 0.4; });
        if (goalZ > 30) { arrive = -1; goalZ = -230; balloons.forEach((b) => { b.b.visible = false; b.b.position.y = 3; }); }
      } else goalZ = damp(goalZ, -25 - (1 - clamp(v.prog, 0, 1)) * 155, 2, dt);
      goal.position.z = goalZ;
      cam.position.set(0, y * 0.8 + 2.2, 7); cam.lookAt(0, y * 0.9 + 0.5, -10);
    },
    focus(p) { p.copy(plane.position); },
  };
});

// ================================================================ 7. Seated Cycling (Wave)
// Ride a bike down a park path. Every push of the legs carries you forward; the finish arch is as far
// away as the number of cycles set.
P3.add("cycling", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.3, 0.5, -1], dir: [0.4, 0.85, -0.3] });
  K.scene.add(cam);
  const LEN = 120, STEP = 7, path = (x) => Math.abs(x) < 1.6;
  K.ground({ size: 400, seg: 100, h: (x, z) => (Math.abs(x) > 26 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.5) * 12 * Math.min(1, (Math.abs(x) - 26) / 30) : 0), color: (x, z) => (path(x) ? K.mix(0xd8c8a8, 0xc8b898, K.noise(x * 2, z * 0.5)) : Math.abs(x) < 1.8 ? 0xf0f0e8 : K.mix(0x6aac4a, 0x8ac458, K.fbm(x * 0.2, z * 0.2))) });
  shadowBox(K, 18);
  K.peaks(14, 160, 230, 30, 60, 0x88a8b8, { colors: [0x8aaebe, 0x98b8c4] });
  K.clouds(14); K.flock(5, { cz: -40, y0: 16, y1: 22 });
  // two copies of a park segment slide past
  const seg = () => {
    const g = K.group(null);
    trees(K, Array.from({ length: 16 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * K.R(4.5, 12), z: -i * (LEN / 16) - K.R(0, 5), s: K.R(1, 1.6) })), null, g);
    pines(K, Array.from({ length: 10 }, () => ({ x: (K.rnd() < 0.5 ? -1 : 1) * K.R(13, 25), z: -K.R(0, LEN), s: K.R(1.4, 2.2) })), g);
    K.inst(K.box(0.12, 0.012, 1.2), K.M(0xffffff), Array.from({ length: LEN / 3 }, (_, i) => ({ x: 0, y: 0.01, z: -i * 3 })), { parent: g, shadow: false });
    for (let z = -10; z > -LEN; z -= 30) { // lamp posts and benches
      const l = K.group(g, [2.3, 0, z]); K.part(l, K.cyl(0.05, 0.07, 3, 8), K.M(0x2a3a30), [0, 1.5, 0]); K.part(l, K.sph(0.18, 10, 8), K.E(0xfff0c0, { emissiveIntensity: 0.4 }), [0, 3.05, 0]);
      const b = K.group(g, [-2.6, 0, z - 12], [0, PI / 2, 0]); K.part(b, K.box(1.5, 0.08, 0.45), K.M(0xa8784a), [0, 0.45, 0]); K.part(b, K.box(1.5, 0.4, 0.06), K.M(0xa8784a), [0, 0.75, -0.22]); for (const x of [-0.6, 0.6]) K.part(b, K.box(0.06, 0.45, 0.4), K.M(0x333333), [x, 0.22, 0]);
    }
    const pond = K.group(g, [-9, 0.02, -60]); K.part(pond, K.circle(4.5, 28), K.S(0x4a9ad8, { roughness: 0.08 }), null, [-PI / 2, 0, 0], [1, 0.6, 1], true);
    for (let i = 0; i < 3; i++) { const d = K.group(pond, [K.R(-2, 2), 0.1, K.R(-1, 1)], [0, K.R(0, 6), 0]); K.part(d, K.sph(0.22, 10, 8), K.S(0xffffff), [0, 0.1, 0], null, [1, 0.8, 1.4]); K.part(d, K.sph(0.13, 10, 8), K.S(0xffffff), [0, 0.32, 0.22]); K.part(d, K.cone(0.05, 0.15, 6), K.S(0xff9a2a), [0, 0.3, 0.38], [PI / 2, 0, 0]); }
    flowers(K, 180, [-12, 12, -LEN, 0, (x) => Math.abs(x) > 2.2], g);
    return g;
  };
  const segs = [seg(), seg()];
  // the finish arch
  const finish = K.group(null, [0, 0, -200]);
  for (const s of [-1, 1]) K.part(finish, K.cyl(0.14, 0.14, 4, 10), K.S(0xffffff), [s * 2.6, 2, 0]);
  K.part(finish, K.box(5.6, 0.9, 0.12), new THREE.MeshStandardMaterial({ map: textTex(K, "FINISH", { bg: "#ffffff", color: "#e8342a" }) }), [0, 3.7, 0]);
  for (let i = 0; i < 10; i++) K.part(finish, K.sph(0.3, 10, 8), K.S([0xff5a5a, 0xffd23a, 0x5ab0ff, 0x8ae07a][i % 4]), [(i < 5 ? -1 : 1) * (2.6 + K.R(-0.2, 0.3)), 4.2 + (i % 5) * 0.35, K.R(-0.2, 0.2)]);
  // the bike in front of you, and your knees
  const bike = K.group(cam, [0, -0.62, -0.9]), frame = K.S(0x2a8ad8, { roughness: 0.35 }), black = K.M(0x222222);
  K.part(bike, K.cyl(0.02, 0.02, 0.78, 8), K.S(0xc8ccd0, { metalness: 0.6 }), [0, 0.22, -0.05], [0, 0, PI / 2]);
  for (const s of [-1, 1]) K.part(bike, K.cyl(0.032, 0.032, 0.14, 10), black, [s * 0.42, 0.22, -0.05], [0, 0, PI / 2]);
  K.part(bike, K.cyl(0.025, 0.025, 0.5, 8), frame, [0, -0.02, -0.12], [0.35, 0, 0]);
  const bell = K.part(bike, K.sph(0.035, 10, 8), K.S(0xffd23a, { metalness: 0.5 }), [-0.24, 0.255, -0.05]);
  const basket = K.group(bike, [0, 0.02, -0.32]); K.part(basket, K.box(0.38, 0.2, 0.26), K.M(0xc89a5a), [0, 0, 0]);
  for (let i = 0; i < 6; i++) K.part(basket, K.sph(0.05, 8, 6), K.S([0xff6a8a, 0xffd23a, 0xffffff][i % 3]), [K.R(-0.12, 0.12), 0.12, K.R(-0.08, 0.08)]);
  const wheel = K.group(bike, [0, -0.62, -0.42]); K.part(wheel, K.tor(0.34, 0.03, 8, 30), black, null, [0, PI / 2, 0]);
  for (let i = 0; i < 6; i++) K.part(wheel, K.box(0.006, 0.66, 0.006), K.M(0xd8d8d8), null, [i * PI / 6, 0, 0], null, true);
  const pants = K.S(0x3a4a7a, { roughness: 0.8 }), knees = [-1, 1].map((s) => { return K.part(cam, K.sph(0.14, 14, 10), pants, [s * 0.3, -0.6, -0.85], null, [1, 0.9, 1.1]); });
  let s = 0, speed = 0, sFinish = (S.reps || 15) * STEP + 4, kx = 0;
  cam.position.set(0, 1.55, 0); cam.rotation.set(-0.1, 0, 0);
  return {
    fov: 64, fovTall: 80, gauge: "h",
    update(v, t, dt) {
      const want = v.reps * STEP + (v.want < 0 ? STEP / 2 : 0);
      speed = clamp((want - s) * 1.4, 0, 9); s += speed * dt;
      segs[0].position.z = s % LEN; segs[1].position.z = (s % LEN) - LEN;
      finish.position.z = -(sFinish - s);
      wheel.rotation.x -= speed * dt / 0.34;
      kx = damp(kx, clamp(v.x, -1.4, 1.4), 10, dt);
      knees[0].position.y = -0.6 + kx * 0.1; knees[1].position.y = -0.6 - kx * 0.1;
      knees[0].position.z = -0.85 - kx * 0.05; knees[1].position.z = -0.85 + kx * 0.05;
      cam.position.y = 1.55 + Math.sin(s * 1.6) * 0.012; cam.rotation.z = Math.sin(s * 0.8) * 0.006;
      bell.rotation.y = t;
    },
    focus(p) { p.set(0, 1.2, -4); },
  };
});

// ================================================================ 8. Head Turns (Swing)
// Bird watching from a lakeside dock. A bird sings on one side; turn your head to bring it into the
// middle of your view and take its picture, then the bird on the other side starts singing.
P3.add("neckturn", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.2, 0.35, -1], sun: 1.2, fog: 0xd0e8f0 });
  K.scene.add(cam);
  const lake = (x, z) => z < -3 && Math.hypot(x * 0.6, z + 30) < 26;
  K.ground({ size: 320, seg: 120, h: (x, z) => (lake(x, z) ? -1.5 : Math.pow(K.fbm(x * 0.03, z * 0.03), 1.4) * 8 * clamp((Math.hypot(x, z) - 14) / 40, 0, 1)), color: (x, z, y) => (y < -0.5 ? 0x8a7a58 : K.mix(0x5aa046, 0x86c05a, K.fbm(x * 0.15, z * 0.15))) });
  K.water({ size: 120, seg: 50, y: -0.35, z: -30, color: 0x3a8ac0, amp: 0.05 });
  shadowBox(K, 16);
  K.peaks(18, 130, 220, 30, 70, 0x7a9cb0, { snow: 0xf4f8fc });
  K.clouds(16); K.flock(4, { cz: -40, y0: 18, y1: 24 });
  pines(K, K.ring(50, 16, 70, { free: true, ok: (x, z) => !lake(x, z) }).map((p) => ({ x: p.x, z: p.z, s: K.R(1.4, 2.4) })));
  trees(K, K.ring(20, 12, 40, { free: true, ok: (x, z) => !lake(x, z) && z > -8 }).map((p) => ({ x: p.x, z: p.z, s: K.R(1, 1.5) })));
  flowers(K, 240, [-14, 14, -4, 10, (x, z) => Math.hypot(x, z) > 2]);
  K.inst(K.box(0.3, 0.06, 3.2), K.M(0xa07a50), Array.from({ length: 9 }, (_, i) => ({ x: -1.2 + i * 0.3, y: 0.03, z: -1, c: K.pick([0xffffff, 0xeeeeee, 0xdddddd]) })));
  // two birds on perches; bearing = the target angle, so the bird is centred when you reach it
  const tg = (S.amp || 30) * 0.9, bird = (body, belly, side) => {
    const B = Math.max(14, tg) * D2R * side, d = 5.2, x = Math.sin(B) * d, z = -Math.cos(B) * d;
    const perch = K.group(null, [x, 0, z], [0, -B, 0]);
    K.part(perch, K.post(0.08, 0.1, 1.5, 8), K.M(0x7a5a3a)); K.part(perch, K.cyl(0.05, 0.05, 0.9, 8), K.M(0x7a5a3a), [0, 1.5, 0], [0, 0, PI / 2]);
    const g = K.group(perch, [0, 1.55, 0], [0, PI, 0]), hop = K.group(g);
    K.part(hop, K.sph(0.22, 14, 10), K.S(body), [0, 0.2, 0], null, [0.9, 1, 1.1]); K.part(hop, K.sph(0.16, 12, 10), K.S(belly), [0, 0.15, 0.1], null, [0.9, 1, 0.8]);
    const head = K.group(hop, [0, 0.45, 0.06]); K.part(head, K.sph(0.15, 14, 10), K.S(body)); K.part(head, K.cone(0.05, 0.14, 8), K.S(0xffa020), [0, -0.02, 0.17], [PI / 2, 0, 0]);
    K.eyes(head, 0.07, 0.04, 0.11, 0.035);
    const wings = [-1, 1].map((s) => { const w = K.group(hop, [s * 0.19, 0.25, 0]); K.part(w, K.sph(0.15, 10, 8), K.S(body), [s * 0.04, 0, -0.02], null, [0.35, 0.75, 1.1]); return w; });
    K.part(hop, K.box(0.14, 0.04, 0.26), K.S(body), [0, 0.1, -0.24], [0.5, 0, 0]);
    const notes = [0, 1, 2].map(() => { const n = K.sprite(0xffffff, 0.22, [0, 0.8, 0], 0, g); n.material = new THREE.SpriteMaterial({ map: noteTex, transparent: true, depthWrite: false, opacity: 0 }); return { n, ph: K.R(0, 1) }; });
    return { perch, g, hop, head, wings, notes, B, glow: K.sprite(0x9affb0, 1.6, [0, 0.35, 0], 0, g), happy: -1 };
  };
  const noteTex = K.tex(64, 64, (g) => { g.fillStyle = "#2a3350"; g.font = "700 52px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("♪", 32, 34); });
  const birds = [bird(0x3a7ae8, 0xf4e8d0, 1), bird(0xe84a3a, 0xffe0c0, -1)];
  // a viewfinder fixed in the middle of the view
  const finder = K.group(cam, [0, 0, -2]);
  const corner = K.M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 }), cs = 0.32;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { K.part(finder, K.box(0.14, 0.02, 0.01), corner, [sx * (cs - 0.07), sy * cs, 0], null, null, true); K.part(finder, K.box(0.02, 0.14, 0.01), corner, [sx * cs, sy * (cs - 0.07), 0], null, null, true); }
  const flash = K.part(cam, K.plane(4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, fog: false }), [0, 0, -0.5], null, null, true); flash.renderOrder = 10;
  let view = 0, fl = 0, prevSide = 0;
  cam.position.set(0, 1.35, 0.6);
  return {
    fov: 62, fovTall: 78, gauge: "h",
    update(v, t, dt) {
      view = damp(view, clamp(v.val, -90, 90), 9, dt);
      cam.rotation.set(-0.03, -view * D2R, 0);
      const active = v.targets[v.side] > 0 ? 0 : 1;
      if (v.side !== prevSide) { birds[prevSide === 0 ? (v.targets[0] > 0 ? 0 : 1) : (v.targets[1] > 0 ? 0 : 1)].happy = 0; fl = 1; prevSide = v.side; }
      fl = Math.max(0, fl - dt * 2.5); flash.material.opacity = fl * 0.7;
      birds.forEach((b, i) => {
        const on = i === active, sing = on && !K.calm;
        b.head.rotation.z = sing ? Math.sin(t * 6) * 0.2 : 0; b.head.rotation.x = sing ? -0.25 + Math.sin(t * 9) * 0.1 : 0;
        const f = sing ? Math.abs(Math.sin(t * 10)) * 0.5 : 0; b.wings[0].rotation.z = f; b.wings[1].rotation.z = -f;
        b.glow.material.opacity = on ? 0.25 + v.prog * 0.5 : 0;
        b.notes.forEach((n) => { const u = (t * 0.6 + n.ph) % 1; n.n.position.set(Math.sin(u * 6 + n.ph * 9) * 0.25, 0.6 + u * 0.9, 0); n.n.material.opacity = on ? Math.sin(u * PI) : 0; });
        if (b.happy >= 0) { b.happy += dt; const u = clamp(b.happy / 0.8, 0, 1); b.hop.position.y = Math.sin(u * PI) * 0.35; b.hop.rotation.y = u * PI * 2; if (u >= 1) b.happy = -1; }
      });
      finder.scale.setScalar(1 - v.prog * 0.12);
    },
    focus(p) { p.set(Math.sin(view * D2R) * 4, 1.6, -Math.cos(view * D2R) * 4); },
  };
});

// ================================================================ 9. Knee Lift Hold (Hold)
// A hot-air balloon over green hills. Lift the knee to rise into the breeze (the band of streaming
// wind); holding there drifts the balloon across the valley to the flag on the far hill.
P3.add("kneelift", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.6, 0.4, -1], sun: 1.3, fog: 0xd8ecf6, far: 280 });
  const hill = (x, z) => 3.2 * Math.exp(-((x + 11) ** 2 + (z + 1) ** 2) / 28) + 3.6 * Math.exp(-((x - 11) ** 2 + (z + 1) ** 2) / 30) + (z < -12 ? K.fbm(x * 0.03, z * 0.03) * 14 * Math.min(1, (-12 - z) / 40) : 0);
  K.ground({ size: 320, seg: 130, h: hill, color: (x, z, y) => K.mix(K.mix(0x5aa046, 0x8ac458, K.fbm(x * 0.12, z * 0.12)), 0x9ac868, y / 12) });
  shadowBox(K, 22);
  K.peaks(16, 150, 230, 30, 70, 0x88a8c0, { snow: 0xf4f8fc });
  K.clouds(18);
  trees(K, K.ring(44, 8, 70, { free: true, ok: (x, z) => z < 6 && Math.abs(x + 11) > 3 && Math.abs(x - 11) > 3 }).map((p) => ({ x: p.x, z: p.z, y: hill(p.x, p.z), s: K.R(0.9, 1.5) })));
  // a village and a river in the valley
  for (const [x, z, c] of [[-2, -6, 0xf4e0c0], [1.5, -8, 0xe8d0b0], [-4.5, -10, 0xf0e8d8], [3.5, -12, 0xf8d8c8]]) {
    const g = K.group(null, [x, hill(x, z), z], [0, K.R(0, 1), 0]); K.part(g, K.box(1.4, 1.1, 1.2), K.M(c), [0, 0.55, 0]);
    const r = K.group(g, [0, 1.1, 0], [0, PI / 2, 0]); K.part(r, K.cyl(1, 1, 1.5, 3), K.M(0xc8503a), [0, 0.25, 0], [-PI / 2, 0, 0], [1, 0.5, 1]);
  }
  flowers(K, 260, [-20, 20, -6, 8]);
  const goalFlag = flag(K, null, [11, hill(11, -1), -1], 0xe84a5a, 2.5);
  K.part(null, K.cyl(1.4, 1.4, 0.05, 20), K.M(0xf4f0e0), [11, hill(11, -1) + 0.03, -1], null, null, true);
  // the wind band: streaks drifting to the right
  const streaks = Array.from({ length: 26 }, () => { const m = K.part(null, K.box(2.2, 0.1, 0.1), K.B(0xffffff, { transparent: true, opacity: 0.7 }), [0, 0, -1], null, null, true); return { m, x: K.R(-18, 18), f: K.rnd(), z: K.R(-2.5, 0.5), sp: K.R(3, 6) }; });
  const lane = K.part(null, K.plane(46, 1), K.B(0x7af0a8, { transparent: true, opacity: 0.16, depthWrite: false }), [0, 0, -2.6], null, null, true);
  // the balloon
  const stripes = (cs) => K.tex(256, 64, (g, w, h) => { cs.forEach((c, i) => { g.fillStyle = c; g.fillRect((i * w) / cs.length, 0, w / cs.length + 1, h); }); }, true);
  const looks = [["#ff5a5a", "#ffd23a", "#ff5a5a", "#ffd23a", "#ff5a5a", "#ffd23a", "#ff5a5a", "#ffd23a"], ["#5ab0ff", "#ffffff", "#5ab0ff", "#ffffff", "#5ab0ff", "#ffffff", "#5ab0ff", "#ffffff"], ["#8ae07a", "#ff8ad8", "#ffd23a", "#8ae07a", "#ff8ad8", "#ffd23a", "#8ae07a", "#ff8ad8"]];
  const texs = looks.map(stripes);
  const bal = K.group(null, [-11, 4, -1]);
  const env = K.part(bal, K.sph(1.5, 24, 18), new THREE.MeshStandardMaterial({ map: texs[0], roughness: 0.6 }), [0, 2.6, 0], null, [1, 1.15, 1]);
  K.part(bal, K.cyl(0.55, 0.32, 0.8, 16), env.material, [0, 0.95, 0]);
  const basket = K.M(0xa8784a); K.part(bal, K.box(0.7, 0.5, 0.7), basket, [0, -0.25, 0]);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.part(bal, K.cyl(0.015, 0.015, 1.15, 4), K.M(0x5a4a3a), [x * 0.32, 0.4, z * 0.32], [z * 0.2, 0, -x * 0.2]);
  const fire = K.sprite(0xffa040, 0.8, [0, 0.35, 0], 0, bal);
  const pilot = K.group(bal, [0, 0.05, 0]); K.part(pilot, K.sph(0.13, 12, 10), K.S(0xf0c8a0), [0, 0.15, 0]); K.part(pilot, K.cyl(0.12, 0.13, 0.08, 12), K.M(0x3a7ae8), [0, 0.27, 0]);
  const BASE = 1.3, STEPY = 4.6, X0 = -11, X1 = 11;
  const altOf = (u) => BASE + u * STEPY;
  let y = hill(X0, -1) + 0.5, x = X0, mode = "fly", t0 = 0, look = 0;
  cam.position.set(0, 7, 21.5); cam.lookAt(0, 6, -1);
  return {
    fov: 50, fovTall: 70, gauge: "v",
    update(v, t, dt) {
      const top = Math.min(v.hi, 2.2), lo = altOf(1) + 2, hi2 = altOf(top) + 2;
      streaks.forEach((s) => { s.x += s.sp * dt * (v.inBand ? 1.6 : 1); if (s.x > 20) s.x = -20; s.m.position.set(s.x, lerp(lo, hi2, s.f), s.z); s.m.material.opacity = v.state === "go" ? 0.75 : 0.25; });
      lane.position.y = (lo + hi2) / 2; lane.scale.y = Math.max(0.5, hi2 - lo); lane.material.opacity = v.state === "go" ? (v.inBand ? 0.26 : 0.16) : 0.06;
      if (v.fresh) { mode = "land"; t0 = 0; }
      if (mode === "land") {
        t0 += dt; x = damp(x, X1, 3, dt); y = damp(y, hill(X1, -1) + 0.5, 2, dt);
        if (v.state === "go" && t0 > 1.5) { mode = "new"; t0 = 0; }
      } else if (mode === "new") { // a fresh balloon pops up on the left hill
        t0 += dt; look = (look + 1) % texs.length; env.material.map = texs[look]; x = X0; y = hill(X0, -1) + 0.5; mode = "fly";
      } else {
        x = damp(x, lerp(X0, X1, clamp(v.prog, 0, 1)), 3, dt);
        const ground = hill(x, -1) + 0.5; y = damp(y, Math.max(ground, altOf(clamp(v.u, 0, top + 0.3)) + 2), 3, dt);
      }
      bal.position.set(x, y, -1); bal.rotation.z = Math.sin(t * 0.8) * 0.04;
      fire.material.opacity = mode === "fly" && v.u > 0.3 ? 0.5 + Math.random() * 0.4 : 0;
      goalFlag.scale.setScalar(mode === "land" ? 1 + Math.sin(t * 8) * 0.05 : 1);
    },
    focus(p) { p.set(x, y + 2, -1); },
  };
});

// ================================================================ 10. Tennis Swing (Swing)
// On the court, first person. The ball machine feeds balls to your forehand, then your backhand;
// swing the racket across to hit each one back over the net.
P3.add("tennis", (K, THREE, cam) => {
  sunny(K, { sunDir: [-0.4, 0.5, -1], dir: [-0.3, 0.9, 0.4], fog: 0xd8ecf6 });
  K.scene.add(cam);
  K.ground({ size: 300, seg: 60, h: (x, z) => (Math.hypot(x, z) > 60 ? K.fbm(x * 0.03, z * 0.03) * 12 * Math.min(1, (Math.hypot(x, z) - 60) / 40) : 0), color: (x, z) => K.mix(0x5aa046, 0x86c05a, K.fbm(x * 0.1, z * 0.1)) });
  shadowBox(K, 16);
  K.peaks(14, 150, 220, 30, 60, 0x88a8b8);
  K.clouds(12);
  const court = K.tex(512, 1024, (g, w, h) => {
    g.fillStyle = "#3f7ac0"; g.fillRect(0, 0, w, h); g.strokeStyle = "#ffffff"; g.lineWidth = 8;
    const X = (m) => (m / 12) * w + w / 2, Z = (m) => (m / 26) * h + h / 2;
    g.strokeRect(X(-5.485), Z(-11.885), X(5.485) - X(-5.485), Z(11.885) - Z(-11.885));
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(X(s * 4.115), Z(-11.885)); g.lineTo(X(s * 4.115), Z(11.885)); g.stroke(); }
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(X(-4.115), Z(s * 6.4)); g.lineTo(X(4.115), Z(s * 6.4)); g.stroke(); }
    g.beginPath(); g.moveTo(X(0), Z(-6.4)); g.lineTo(X(0), Z(6.4)); g.stroke();
  });
  K.part(null, K.plane(18, 36), K.M(0x4a9a6a, { roughness: 0.9 }), [0, 0.01, 0], [-PI / 2, 0, 0], null, true);
  K.part(null, K.plane(12, 26), new THREE.MeshStandardMaterial({ map: court, roughness: 0.85 }), [0, 0.02, 0], [-PI / 2, 0, 0], null, true);
  const netT = K.tex(128, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = "rgba(20,20,20,0.85)"; g.lineWidth = 2; for (let i = 0; i <= w; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); } for (let j = 0; j <= h; j += 8) { g.beginPath(); g.moveTo(0, j); g.lineTo(w, j); g.stroke(); } }, true);
  netT.repeat.set(8, 1);
  K.part(null, K.plane(12.8, 0.9), new THREE.MeshBasicMaterial({ map: netT, transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0.5, 0], null, null, true);
  K.part(null, K.box(12.8, 0.07, 0.04), K.M(0xffffff), [0, 0.96, 0]);
  for (const s of [-1, 1]) K.part(null, K.cyl(0.05, 0.05, 1.07, 8), K.M(0x2a3a30), [s * 6.4, 0.53, 0]);
  // fence, windscreens and trees around
  const fence = K.M(0x3f8a62, { roughness: 0.9 });
  K.part(null, K.box(18, 2.6, 0.08), fence, [0, 1.3, -18]); for (const s of [-1, 1]) K.part(null, K.box(0.08, 2.6, 36), fence, [s * 9, 1.3, 0]);
  trees(K, K.ring(34, 24, 70, { free: true }).map((p) => ({ x: p.x, z: p.z, s: K.R(1.4, 2) })));
  const machine = K.group(null, [0, 0, -12.5]);
  K.part(machine, K.box(0.9, 0.7, 0.9), K.S(0x2a2a30), [0, 0.45, 0]); K.part(machine, K.cyl(0.12, 0.12, 0.6, 12), K.S(0x444448), [0, 0.95, 0.25], [1.1, 0, 0]);
  K.part(machine, K.hemi(0.42, 14), K.S(0xd8e86a), [0, 0.8, -0.1]);
  for (const s of [-1, 1]) K.part(machine, K.cyl(0.12, 0.12, 0.08, 10), K.M(0x111111), [s * 0.5, 0.12, 0], [0, 0, PI / 2]);
  // the ball and the racket
  const ball = K.part(null, K.sph(0.11, 14, 10), K.S(0xd8f04a, { roughness: 0.6 }));
  const ballShadow = K.part(null, K.circle(0.11, 14), K.B(0x000000, { transparent: true, opacity: 0.25 }), [0, 0.025, 0], [-PI / 2, 0, 0], null, true);
  const strings = K.tex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 2; for (let i = 0; i <= w; i += 11) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } });
  const pivot = K.group(null, [0, 0.95, 12.2]), racket = K.group(pivot, [0, 0, -0.75]);
  K.part(racket, K.tor(0.17, 0.018, 8, 30), K.S(0xe8342a, { roughness: 0.3 }), [0, 0.45, 0], null, [1, 1.35, 1]);
  K.part(racket, K.circle(0.165, 24), new THREE.MeshBasicMaterial({ map: strings, transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0.45, 0], null, [1, 1.35, 1], true);
  K.part(racket, K.cyl(0.018, 0.018, 0.28, 8), K.S(0xe8342a), [0, 0.12, 0]); K.part(racket, K.cyl(0.026, 0.024, 0.22, 10), K.M(0x222226), [0, -0.12, 0]);
  const hit = (sideSign) => new THREE.Vector3(sideSign * 1.15, 0.9, 11.3);
  let a = 0, fly = { from: new THREE.Vector3(0, 1, -12), to: hit(1), t: 0, dur: 1.5, back: false, bounce: true }, prevSide = 0, wait = 0;
  cam.position.set(0, 1.65, 13.4); cam.lookAt(0, 0.9, 2);
  const feed = (sideSign) => { fly = { from: new THREE.Vector3(0, 1.0, -12.2), to: hit(sideSign), t: 0, dur: 1.5, back: false, bounce: true }; };
  const signOf = (v) => (v.targets[v.side] > 0 ? 1 : -1);
  return {
    fov: 56, fovTall: 74, gauge: "h",
    update(v, t, dt) {
      a = damp(a, clamp(v.x, -1.3, 1.3) * 1.15, 14, dt);
      pivot.rotation.set(0, -a, 0); racket.rotation.set(-0.25, 0, a * 0.5);
      if (v.side !== prevSide) { // a hit: send the ball back, then feed the other side
        const at = ball.position.clone();
        fly = { from: at, to: new THREE.Vector3(K.R(-3, 3), 0.11, -K.R(7, 10)), t: 0, dur: 1.0, back: true, bounce: false };
        prevSide = v.side; wait = 1.25;
      }
      if (wait > 0 && (wait -= dt) <= 0) feed(signOf(v));
      fly.t += dt; const u = clamp(fly.t / fly.dur, 0, 1);
      if (fly.back) {
        ball.position.lerpVectors(fly.from, fly.to, u); ball.position.y = lerp(fly.from.y, 0.11, u) + Math.sin(u * PI) * 2.4;
      } else if (u < 1) { // over the net with one bounce on your side
        const b = 0.62; ball.position.lerpVectors(fly.from, fly.to, u);
        ball.position.y = u < b ? lerp(fly.from.y, 0.11, u / b) + Math.sin((u / b) * PI) * 1.6 : lerp(0.11, fly.to.y, (u - b) / (1 - b)) + Math.sin(((u - b) / (1 - b)) * PI) * 0.7;
      } else { ball.position.copy(fly.to); ball.position.y = fly.to.y + Math.abs(Math.sin(t * 3)) * 0.12; } // waits for your swing
      ballShadow.position.set(ball.position.x, 0.025, ball.position.z);
    },
    focus(p) { p.copy(ball.position); },
  };
});
})();
