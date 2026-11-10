// Ten more 3D scenes for js/play3d.js (the second batch; the first ten are in js/play3d-scenes.js).
// Same contract: P3.add(id, (K, THREE, cam, S) => ({ fov, fovTall, gauge, flip, update(view, t, dt), focus(vec) })).
// view comes from the exercise's engine (see the top of js/play3d-scenes.js for its fields).
(() => {
"use strict";
const RC = window.RC;
const P3 = RC.Play3D;
if (!P3) return;
const PI = Math.PI, D2R = PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (c, t, k, dt) => c + (t - c) * Math.min(1, k * dt);
const lerp = (a, b, u) => a + (b - a) * u;
const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const A = () => RC.TwistAnimals || {};

// ---------------------------------------------------------------- shared helpers
function fit(K, made, h, parent) {
  const THREE = K.THREE, model = made.g || made, outer = new THREE.Group(), inner = new THREE.Group();
  inner.add(model); outer.add(inner);
  const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -box.min.y, -c.z); outer.scale.setScalar(h / Math.max(0.01, size.y));
  (parent || K.scene).add(outer);
  return { g: outer, idle: made.idle || null };
}
const animal = (K, kind, h, parent) => (A()[kind] ? fit(K, A()[kind](K), h, parent) : { g: K.group(parent || null), idle: null });
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
function flag(K, parent, p, color, h) {
  const g = K.group(parent, p);
  K.part(g, K.cyl(0.04, 0.05, h, 6), K.M(0xd8d8d8), [0, h / 2, 0]);
  const cloth = K.group(g, [0, h - 0.35, 0]);
  K.part(cloth, K.box(0.9, 0.55, 0.02), K.M(color, { side: K.THREE.DoubleSide }), [0.45, 0, 0]);
  K.tick((t) => { cloth.rotation.y = Math.sin(t * 2.2 + p[0]) * 0.25; });
  return g;
}
function stick(K, r, mat, parent) {
  const THREE = K.THREE, m = K.part(parent || null, K.cyl(r, r, 1, 6), mat), up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
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
// green target ring that pulses when it is the one to reach
function target(K, p, r) {
  const ring = K.part(null, K.tor(r || 0.16, 0.03, 8, 28), K.E(0x4ad884), p, null, null, true);
  return (on, t) => { ring.scale.setScalar(on ? 1 + 0.12 * Math.sin(t * 6) : 0.8); ring.material = K.E(on ? 0x4ad884 : 0x9ab0a0, { emissiveIntensity: on ? 0.9 : 0.15 }); return ring; };
}
// a little duck (yellow duckling, or white for a grown-up), facing +z
function duck(K, parent, color, s) {
  const g = K.group(parent, null, null, s || 1), body = K.S(color || 0xffd84a, { roughness: 0.6 });
  K.part(g, K.sph(0.2, 14, 10), body, [0, 0.14, 0], null, [1, 0.8, 1.25]);
  const head = K.group(g, [0, 0.33, 0.15]); K.part(head, K.sph(0.12, 12, 10), body);
  K.part(head, K.cone(0.05, 0.12, 8), K.S(0xff8a2a), [0, -0.02, 0.13], [PI / 2, 0, 0], [1, 1, 0.6]);
  K.eyes(head, 0.06, 0.03, 0.09, 0.025);
  K.part(g, K.cone(0.07, 0.14, 6), body, [0, 0.2, -0.24], [-PI / 2 + 0.5, 0, 0]);
  return { g, head };
}
// a simple fish facing +z
function fish(K, parent, color) {
  const g = K.group(parent), body = K.S(color, { roughness: 0.35 });
  K.part(g, K.sph(1, 14, 10), body, null, null, [0.11, 0.15, 0.34]);
  K.part(g, K.sph(1, 10, 8), K.S(0xf8f4ec, { roughness: 0.4 }), [0, -0.04, 0.04], null, [0.09, 0.09, 0.26]);
  const tail = K.group(g, [0, 0, -0.3]); K.part(tail, K.cone(0.13, 0.2, 6), body, [0, 0, -0.08], [PI / 2, 0, 0], [0.25, 1, 1]);
  K.part(g, K.cone(0.06, 0.14, 5), body, [0, 0.15, -0.02], [-0.6, 0, 0], [0.3, 1, 1]);
  K.eyes(g, 0.075, 0.04, 0.22, 0.03);
  return { g, tail };
}

// ================================================================ 11. Pendulum Swing (Wave)
// A rope swing under a big oak. The arm's swing rocks the bunny on the swing out to the pinwheel on each
// side; every full swing makes another flower bloom in the pots along the front.
P3.add("pendulum", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.5, 0.4, -1], sun: 1.2 });
  K.ground({ size: 300, seg: 90, h: (x, z) => (z < -14 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 10 * Math.min(1, (-14 - z) / 40) : 0), color: (x, z) => (Math.hypot(x * 0.5, z) < 1.4 ? K.mix(0xa88a5a, 0x8a7048, K.noise(x * 2, z * 2)) : K.mix(0x62a648, 0x8cc45a, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 10);
  K.peaks(14, 150, 220, 30, 60, 0x7aa0b0, { snow: 0xf4f8fc });
  K.clouds(14); K.flock(4, { cz: -30, y0: 14, y1: 20 });
  trees(K, K.ring(30, 16, 70, { free: true, ok: (x, z) => z < -6 || Math.abs(x) > 14 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.1, 1.8) })));
  flowers(K, 220, [-14, 14, -10, 1.6, (x, z) => Math.hypot(x * 0.5, z) > 1.6]);
  // the oak with its long branch
  const bark = K.M(0x6a4a30), PIV = 4.55, L = 3.5;
  K.part(null, K.cyl(0.45, 0.68, 5.4, 9), bark, [-4.6, 2.7, -0.6]);
  K.part(null, K.cyl(0.17, 0.3, 5.6, 8), bark, [-1.9, 4.78, -0.2], [0, 0, PI / 2 - 0.05]);
  K.inst(K.ico(1, 1), K.M(0xffffff), [[-4.6, 6.8, -1.0, 2.5], [-2.6, 6.6, -0.8, 2.0], [-0.4, 6.6, -1.2, 1.6], [-6.2, 5.9, -0.4, 1.8], [-3.8, 7.8, -1.6, 1.9], [1.2, 6.9, -1.8, 1.4]].map(([x, y, z, s]) => ({ x, y, z, s, ry: K.R(0, 6), c: K.pick([0x4a8a3a, 0x5a9a40, 0x3f7f36]) })));
  // the swing and its rider
  const pivot = K.group(null, [0, PIV, 0]), rope = K.M(0xd8c8a0);
  for (const z of [-0.36, 0.36]) K.part(pivot, K.cyl(0.025, 0.025, L, 6), rope, [0, -L / 2, z]);
  K.part(pivot, K.box(0.62, 0.08, 0.86), K.M(0xb8783e), [0, -L - 0.04, 0]);
  const rider = animal(K, "rabbit", 0.95, pivot); rider.g.position.set(0, -L, 0); rider.g.rotation.y = 0.5;
  // pinwheels at the two turn points
  const SW = 0.55, wheels = [1, -1].map((s) => {
    const x = Math.sin(SW) * L * s, y = PIV - Math.cos(SW) * L;
    K.part(null, K.post(0.03, 0.03, y + 0.15, 6), K.M(0xf4f0e8), [x * 1.18, 0, -0.9]);
    const w = K.group(null, [x * 1.18, y + 0.2, -0.85]);
    [0xff5a6a, 0xffd23a, 0x5ab4f0, 0x6ad89a].forEach((c, i) => { const b = K.group(w, null, [0, 0, (i * PI) / 2]); K.part(b, K.cone(0.16, 0.38, 3), K.S(c, { side: THREE.DoubleSide }), [0.1, 0.17, 0], [0, 0, -0.5], [1, 1, 0.2]); });
    K.part(w, K.sph(0.05, 8, 6), K.S(0xffffff), [0, 0, 0.04]);
    return { w, glow: K.sprite(0x8affb0, 1.4, [x * 1.18, y + 0.2, -0.8], 0), spin: 0 };
  });
  // flower pots along the front: one blooms per swing
  const N = clamp(S.reps || 10, 6, 12), pots = [], petal = [0xff7aa8, 0xffd23a, 0xb48aff, 0xff9a4a, 0x5ab4f0, 0xffffff];
  for (let i = 0; i < N; i++) {
    const x = (i - (N - 1) / 2) * 0.62, p = K.group(null, [x, 0, 2.3]);
    K.part(p, K.cyl(0.17, 0.12, 0.3, 10), K.M(0xc8603a), [0, 0.15, 0]); K.part(p, K.cyl(0.15, 0.15, 0.02, 10), K.M(0x5a3a24), [0, 0.29, 0], null, null, true);
    K.part(p, K.cyl(0.015, 0.015, 0.34, 5), K.M(0x4a9a3a), [0, 0.46, 0]);
    const bloom = K.group(p, [0, 0.66, 0], [0.4, 0, 0], 0.001);
    for (let j = 0; j < 6; j++) K.part(bloom, K.sph(0.07, 8, 6), K.S(petal[i % petal.length]), [Math.cos((j * PI) / 3) * 0.08, Math.sin((j * PI) / 3) * 0.08, 0], null, [1, 1, 0.4]);
    K.part(bloom, K.sph(0.055, 8, 6), K.S(0xffc828), [0, 0, 0.02]);
    pots.push({ bloom, open: 0 });
  }
  let ang = 0;
  cam.position.set(0, 2.5, 8.6); cam.lookAt(0, 2.0, 0);
  return {
    fov: 50, fovTall: 72, gauge: "h",
    update(v, t, dt) {
      ang = damp(ang, clamp(v.x, -1.45, 1.45) * SW, 7, dt); pivot.rotation.z = ang;
      wheels.forEach((w, i) => {
        const on = (i === 0) === (v.want > 0), at = i === 0 ? v.x >= 1 : v.x <= -1;
        w.spin += dt * (at ? 14 : on ? 2.5 : 0.4); w.w.rotation.z = -w.spin;
        w.glow.material.opacity = on ? 0.35 + 0.25 * Math.sin(t * 5) : 0;
      });
      const done = Math.round((v.reps / Math.max(1, v.goal)) * N);
      pots.forEach((p, i) => { p.open = damp(p.open, i < done ? 1 : 0, 5, dt); p.bloom.scale.setScalar(Math.max(0.001, ease(p.open) * (1 + 0.04 * Math.sin(t * 2 + i)))); });
      if (rider.idle && !K.calm) rider.idle(t);
    },
    focus(p) { p.set(Math.sin(ang) * L, PIV - Math.cos(ang) * L + 0.5, 0); },
  };
});

// ================================================================ 12. Press Down (Reach)
// An old garden water pump. Press the handle down to the green ring and hold: water pours into the
// trough, and each press brings another duckling waddling over to hop in and swim.
P3.add("pressdown", (K, THREE, cam) => {
  sunny(K, { sunDir: [-0.5, 0.45, -1], dir: [-0.4, 0.9, 0.5] });
  K.ground({ size: 300, seg: 90, h: (x, z) => (z < -12 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 9 * Math.min(1, (-12 - z) / 40) : 0), color: (x, z) => (Math.hypot(x - 0.3, z) < 1.7 + K.noise(x * 2, z * 2) * 0.3 ? K.mix(0xb89a6a, 0x9a7e52, K.noise(x * 3, z * 3)) : K.mix(0x62a648, 0x8cc45a, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 7);
  K.peaks(14, 150, 220, 30, 60, 0x7aa0b0);
  K.clouds(12); K.flock(3, { cz: -25, y0: 12, y1: 16 });
  trees(K, K.ring(26, 14, 60, { free: true, ok: (x, z) => z < -5 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.1, 1.7) })));
  flowers(K, 200, [-10, 10, -6, 1.5, (x, z) => Math.hypot(x - 0.3, z) > 2]);
  // barn and fence behind
  const barn = K.group(null, [-7, 0, -12], [0, 0.35, 0]);
  K.part(barn, K.box(5, 3.2, 4), K.M(0xb8382e), [0, 1.6, 0]);
  for (const s of [-1, 1]) K.part(barn, K.box(5.4, 0.14, 2.6), K.M(0x5a4a44), [0, 3.75, s * 1.0], [s * 0.55, 0, 0]);
  K.part(barn, K.cyl(2.06, 2.06, 0.1, 3), K.M(0xb8382e), [0, 3.2, 2.0], [PI / 2, 0, 0], [1.2, 1, 0.45]).position.z = 1.95;
  K.part(barn, K.box(1.8, 2.2, 0.1), K.M(0xf4ece0), [0, 1.1, 2.02]);
  const posts = []; for (let x = -9; x <= 9; x += 1.5) posts.push({ x, y: 0, z: -4.5, sy: 1.1 });
  K.inst(K.post(0.06, 0.07, 1, 6), K.M(0x9a7a56), posts);
  K.inst(K.box(18.5, 0.08, 0.05), K.M(0xa8865e), [{ x: 0, y: 0.45, z: -4.46 }, { x: 0, y: 0.9, z: -4.46 }]);
  // the pump on a stone base
  const iron = K.S(0x2f6a50, { metalness: 0.35, roughness: 0.4 });
  K.part(null, K.box(0.7, 0.2, 0.7), K.M(0x9a9a92), [0, 0.1, 0]);
  K.part(null, K.cyl(0.15, 0.2, 1.3, 14), iron, [0, 0.85, 0]); K.part(null, K.sph(0.17, 14, 10), iron, [0, 1.5, 0]);
  K.part(null, K.cyl(0.06, 0.07, 0.55, 10), iron, [0.32, 1.12, 0], [0, 0, -PI / 2 - 0.35]);
  const spout = new THREE.Vector3(0.56, 1.0, 0);
  const handle = K.group(null, [-0.08, 1.45, 0]), HL = 1.05;
  K.part(handle, K.cyl(0.035, 0.03, HL, 8), iron, [-HL / 2, 0, 0], [0, 0, PI / 2]);
  K.part(handle, K.sph(0.07, 12, 10), K.S(0xd84a3a), [-HL, 0, 0]);
  const REST = -0.5, DOWN = 0.38, angOf = (u) => lerp(REST, DOWN, u);
  const ring = target(K, [-0.08 - Math.cos(DOWN) * HL, 1.45 - Math.sin(DOWN) * HL, 0], 0.15);
  // trough with water that rises with the presses
  const wood = K.M(0x8a6440), TX = 1.0;
  K.part(null, K.box(0.75, 0.06, 2.6), wood, [TX, 0.08, 0]);
  for (const z of [-1.3, 1.3]) K.part(null, K.box(0.75, 0.45, 0.06), wood, [TX, 0.3, z]);
  for (const x of [-0.37, 0.37]) K.part(null, K.box(0.06, 0.45, 2.66), wood, [TX + x, 0.3, 0]);
  const water = K.part(null, K.box(0.68, 1, 2.54), K.S(0x4aa8d8, { roughness: 0.1, transparent: true, opacity: 0.85 }), [TX, 0.12, 0], null, [1, 0.02, 1], true);
  const stream = K.part(null, K.cyl(0.035, 0.05, 1, 8), K.S(0x8ad0f4, { roughness: 0.05, transparent: true, opacity: 0.8 }), null, null, null, true);
  const splash = K.sprite(0xbfeaff, 0.6, [TX, 0.4, 0], 0);
  // mother duck by the trough, ducklings arrive one per press
  const mom = duck(K, null, 0xf8f4ec, 1.6); mom.g.position.set(1.9, 0, -1.4); mom.g.rotation.y = -1.2;
  const ducklings = [];
  let ang = REST, level = 0;
  cam.position.set(2.9, 2.0, 5.0); cam.lookAt(0.3, 0.85, 0);
  return {
    fov: 50, fovTall: 70, gauge: "v", flip: true,
    update(v, t, dt) {
      ang = damp(ang, angOf(clamp(v.u, 0, 1.15)), 12, dt); handle.rotation.z = ang;
      const pressing = v.state === "move" && v.u >= 0.88;
      ring(v.state === "move", t);
      const top = 0.14 + Math.min(1, (v.reps + (pressing ? v.prog : 0)) / Math.max(1, v.goal)) * 0.3;
      level = damp(level, top, 3, dt); water.scale.y = Math.max(0.02, level - 0.1); water.position.y = 0.1 + (level - 0.1) / 2;
      stream.visible = pressing; splash.material.opacity = pressing ? 0.45 + Math.random() * 0.2 : 0;
      if (pressing) { const bot = new THREE.Vector3(TX - 0.1, level, 0), L = spout.y - level; stream.position.set(lerp(spout.x, bot.x, 0.5), (spout.y + level) / 2, 0); stream.scale.set(1 + Math.sin(t * 30) * 0.1, Math.hypot(L, bot.x - spout.x), 1); stream.rotation.z = Math.atan2(bot.x - spout.x, L); splash.position.set(bot.x, level + 0.08, 0); }
      mom.head.rotation.x = pressing && !K.calm ? Math.sin(t * 9) * 0.3 : 0;
      if (v.fresh) {
        const d = duck(K, null); d.g.position.set(2.6, 0, 1.6);
        ducklings.push({ d, t: 0, z: -1.0 + (ducklings.length % 8) * 0.28, ph: K.R(0, 6) });
        if (ducklings.length > 8) { const old = ducklings.shift(); old.d.g.visible = false; }
      }
      ducklings.forEach((k) => {
        k.t += dt; const u = clamp(k.t / 1.3, 0, 1), g = k.d.g;
        if (u < 1) { g.position.set(lerp(2.6, TX, ease(u)), Math.sin(u * PI) * 0.6 + lerp(0, level - 0.05, u), lerp(1.6, k.z, ease(u))); g.rotation.y = -PI / 2 - 0.4; }
        else { const sw = Math.sin(t * 0.5 + k.ph); g.position.set(TX + Math.sin(t * 0.9 + k.ph) * 0.1, level - 0.05 + Math.sin(t * 3 + k.ph) * 0.015, clamp(k.z + sw * 0.15, -1.1, 1.1)); g.rotation.y = Math.cos(t * 0.5 + k.ph) > 0 ? 0 : PI; }
      });
    },
    focus(p) { p.set(TX, level + 0.3, 0.4); },
  };
});

// ================================================================ 13. Side Reach (Reach)
// An apple orchard, first person. Reach out to the side to the glowing apple on the branch and hold;
// it drops into the basket by your chair and the next apple lights up.
P3.add("sidereach", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.7, 0.4, -1], sun: 1.2, dir: [0.6, 0.85, 0.4] });
  K.ground({ size: 300, seg: 90, h: (x, z) => (z < -16 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 10 * Math.min(1, (-16 - z) / 40) : 0), color: (x, z) => K.mix(0x6aa84a, 0x92c85e, K.fbm(x * 0.15, z * 0.15)) });
  shadowBox(K, 8);
  K.peaks(14, 150, 220, 30, 60, 0x7aa0b0, { snow: 0xf4f8fc });
  K.clouds(12);
  // rows of apple trees
  const orchard = [];
  for (let r = 0; r < 4; r++) for (let x = -24; x <= 24; x += 4.5) { const p = { x: x + (r % 2) * 2.2 + K.R(-0.4, 0.4), z: -6 - r * 5 + K.R(-0.5, 0.5), s: K.R(0.9, 1.15) }; if (Math.abs(p.x - 2.6) > 2 || p.z < -10) orchard.push(p); }
  trees(K, orchard, [0x4a8a3a, 0x5a9a40, 0x3f7f36]);
  K.inst(K.sph(0.13, 8, 6), K.S(0xd8342a), orchard.flatMap((p) => Array.from({ length: 7 }, () => { const a = K.R(0, 6.28), b = K.R(-0.6, 0.9); return { x: p.x + Math.cos(a) * 1.05 * p.s, y: 2.2 * p.s + b * p.s, z: p.z + Math.sin(a) * 1.05 * p.s, s: p.s }; })), { shadow: false });
  flowers(K, 160, [-8, 8, -5, 0]);
  // the near tree beside you, with the branch you pick from
  const bark = K.M(0x6a4a30), TR = new THREE.Vector3(2.9, 0, -0.1);
  K.part(null, K.cyl(0.18, 0.28, 2.6, 8), bark, [TR.x, 1.3, TR.z]);
  K.inst(K.ico(1, 1), K.M(0xffffff), [[2.9, 3.0, -0.3, 1.4], [2.1, 2.7, 0.0, 1.0], [3.6, 2.8, 0.2, 1.1], [2.8, 3.7, -0.4, 0.9]].map(([x, y, z, s]) => ({ x, y, z, s, ry: K.R(0, 6), c: K.pick([0x4a8a3a, 0x5a9a40]) })));
  const branch = stick(K, 0.05, bark);
  const SPOTS = [[1.85, 1.22, 0.62], [1.95, 1.35, 0.45], [1.8, 1.12, 0.75], [1.9, 1.3, 0.55]].map((p) => new THREE.Vector3(...p));
  const apple = (p) => { const g = K.group(null, p.toArray()); K.part(g, K.sph(0.085, 14, 10), K.S(0xe0302a, { roughness: 0.35 }), null, null, [1, 0.92, 1]); K.part(g, K.cyl(0.008, 0.008, 0.06, 4), K.M(0x5a3a20), [0, 0.09, 0]); K.part(g, K.box(0.05, 0.01, 0.025), K.M(0x4aa83a), [0.03, 0.1, 0], [0, 0, 0.4]); return g; };
  let spot = 0, cur = apple(SPOTS[0]), pop = 1, flying = [];
  const glow = K.sprite(0x8affb0, 0.5, null, 0);
  // basket on a stool next to your chair
  const B = new THREE.Vector3(0.35, 0.82, 1.15);
  K.part(null, K.cyl(0.22, 0.2, 0.62, 12), K.M(0x8a6440), [B.x, 0.31, B.z]);
  K.part(null, K.cyl(0.24, 0.18, 0.22, 16, 1), K.M(0xc89a5a), [B.x, B.y - 0.08, B.z]);
  K.part(null, K.tor(0.17, 0.015, 6, 20, PI), K.M(0xa87a4a), [B.x, B.y + 0.02, B.z], [0, PI / 2, 0]);
  const inBasket = K.inst(K.sph(0.07, 10, 8), K.S(0xe0302a, { roughness: 0.35 }), Array.from({ length: 14 }, (_, i) => ({ x: B.x + Math.cos(i * 2.4) * 0.11 * (i % 3 ? 1 : 0.3), y: B.y + 0.02 + Math.floor(i / 5) * 0.07, z: B.z + Math.sin(i * 2.4) * 0.11 * (i % 3 ? 1 : 0.3), s: 0.001 })), { shadow: false });
  let inCount = 0;
  // the fruit picker: a long pole from your hands with a wire cup on the end
  const SH = new THREE.Vector3(-0.15, 0.55, 2.3), REST = new THREE.Vector3(0.5, 1.05, 1.3);
  const pole = stick(K, 0.03, K.S(0xc8904a, { roughness: 0.6 })), grip = stick(K, 0.045, K.S(0x2a5aa8, { roughness: 0.7 }));
  const hand = K.group(null), wire = K.S(0x3a8a4a, { roughness: 0.4, side: THREE.DoubleSide });
  K.part(hand, K.lathe([[0.02, -0.1], [0.08, -0.06], [0.11, 0.02], [0.12, 0.08]], 14), wire, [0, 0, 0], [PI / 2, 0, 0]);
  for (let i = 0; i < 6; i++) { const ang = (i / 6) * PI * 2; K.part(hand, K.cyl(0.008, 0.006, 0.12, 4), wire, [Math.cos(ang) * 0.12, Math.sin(ang) * 0.12, 0.13], [PI / 2, 0, 0]); }
  K.part(hand, K.tor(0.12, 0.012, 6, 18), K.S(0x2a6a3a), [0, 0, 0.08]);
  const hp = REST.clone(), tmp = new THREE.Vector3();
  cam.position.set(-0.9, 1.95, 3.6); cam.lookAt(1.0, 1.0, 0.2);
  return {
    fov: 58, fovTall: 76, gauge: "h",
    update(v, t, dt) {
      const goal = SPOTS[spot], u = clamp(v.state === "return" ? v.u * 0.8 : v.u, 0, 1.12);
      tmp.lerpVectors(REST, goal, Math.min(1, u)).add(new THREE.Vector3(0, Math.sin(Math.min(1, u) * PI) * 0.12, 0));
      if (u > 1) tmp.addScaledVector(new THREE.Vector3().subVectors(goal, REST).normalize(), (u - 1) * 0.3);
      hp.x = damp(hp.x, tmp.x, 12, dt); hp.y = damp(hp.y, tmp.y, 12, dt); hp.z = damp(hp.z, tmp.z, 12, dt);
      hand.position.copy(hp); hand.lookAt(hp.x + (hp.x - SH.x), hp.y + (hp.y - SH.y), hp.z + (hp.z - SH.z));
      pole(SH, tmp.copy(hp).addScaledVector(new THREE.Vector3().subVectors(SH, hp).normalize(), 0.1)); grip(SH, tmp.lerpVectors(SH, hp, 0.18));
      branch(new THREE.Vector3(TR.x - 0.1, 1.95, TR.z), new THREE.Vector3(goal.x + 0.02, goal.y + 0.22, goal.z));
      if (cur) {
        pop = Math.min(1, pop + dt * 2.5); cur.scale.setScalar(Math.max(0.001, ease(pop)));
        const hold = v.state === "move" && v.u >= 0.9;
        cur.position.copy(goal); if (hold && !K.calm) cur.position.x += Math.sin(t * 30) * 0.006;
        glow.position.copy(goal); glow.material.opacity = v.state === "move" ? 0.3 + v.prog * 0.5 : 0; glow.scale.setScalar(0.5 + v.prog * 0.4);
      }
      if (v.fresh && cur) { flying.push({ g: cur, from: cur.position.clone(), t: 0 }); spot = (spot + 1) % SPOTS.length; cur = apple(SPOTS[spot]); cur.scale.setScalar(0.001); pop = -0.6; glow.material.opacity = 0; }
      flying = flying.filter((f) => {
        f.t += dt; const k = clamp(f.t / 0.9, 0, 1);
        f.g.position.lerpVectors(f.from, B, ease(k)); f.g.position.y += Math.sin(k * PI) * 0.35; f.g.rotation.x += dt * 8;
        if (k >= 1) { f.g.visible = false; if (inCount < 14) K.setInst(inBasket, inCount, { x: B.x + Math.cos(inCount * 2.4) * 0.11 * (inCount % 3 ? 1 : 0.3), y: B.y + 0.02 + Math.floor(inCount / 5) * 0.07, z: B.z + Math.sin(inCount * 2.4) * 0.11 * (inCount % 3 ? 1 : 0.3), s: 1 }); inBasket.instanceMatrix.needsUpdate = true; inCount++; return false; }
        return true;
      });
    },
    focus(p) { p.copy(SPOTS[(spot + SPOTS.length - 1) % SPOTS.length]); },
  };
});

// ================================================================ 14. Forward and Back (Swing)
// Rowing down a river. Lean forward to reach the oars, lean back to pull: each full stroke glides the
// boat on past the buoys toward the finish dock.
P3.add("rock", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.3, 0.4, -1], sun: 1.2, fog: 0xd0e8f4, far: 220 });
  const RW = 6, bank = (x, z) => { const a = Math.abs(x + Math.sin(z * 0.05) * 1.5); return a < RW ? -1.3 : Math.min(0.5, (a - RW) * 0.6) + (a > 18 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 14 * Math.min(1, (a - 18) / 40) : 0); };
  K.ground({ size: 420, seg: 150, h: bank, color: (x, z, y) => (y < -0.6 ? 0x8a7a58 : y < 0.2 ? K.mix(0xb8a878, 0x7aae52, (y + 0.6) / 0.8) : K.mix(0x5aa046, 0x86c05a, K.fbm(x * 0.12, z * 0.12))) });
  const water = K.water({ size: 420, seg: 60, y: -0.05, color: 0x3a8ab8, amp: 0.04 }); water.scale.x = 0.06;
  shadowBox(K, 12);
  K.peaks(16, 160, 240, 30, 70, 0x7a9cb0, { snow: 0xf4f8fc });
  K.clouds(16); K.flock(4, { cz: -60, y0: 16, y1: 22 });
  const bankAt = (z, s) => s * (RW + 2.5) - Math.sin(z * 0.05) * 1.5;
  const list = []; for (let z = -200; z < 200; z += 5) for (const s of [-1, 1]) { list.push({ x: bankAt(z, s) + s * K.R(0, 10), z: z + K.R(-2, 2), s: K.R(1, 1.8) }); }
  trees(K, list.filter((_, i) => i % 3), null); pines(K, list.filter((_, i) => i % 3 === 0));
  const reeds = []; for (let z = -200; z < 200; z += 0.8) for (const s of [-1, 1]) if (K.rnd() < 0.5) reeds.push({ x: bankAt(z, s) - s * K.R(1.6, 2.6), y: 0.2, z, sy: K.R(0.5, 1), c: K.pick([0x6a9a3a, 0x7aaa48, 0x5a8a34]) });
  K.inst(K.cyl(0.02, 0.03, 1, 4), K.M(0xffffff), reeds, { shadow: false });
  const pads = []; for (let z = -200; z < 200; z += 2.5) if (K.rnd() < 0.5) pads.push({ x: K.pick([-1, 1]) * K.R(3, 4.6) - Math.sin(z * 0.05) * 1.5, y: 0.02, z, s: K.R(0.25, 0.45) });
  K.inst(K.cyl(1, 1, 0.02, 10), K.M(0x4a9a3a), pads, { shadow: false });
  // the course: buoys every 5 m to the finish dock
  const n = Math.max(4, S.reps || 10), STEP = Math.min(4.5, 140 / n), Z0 = 70, ZF = Z0 - n * STEP;
  const riverX = (z) => -Math.sin(z * 0.05) * 1.5;
  const buoys = []; for (let z = Z0 - 5; z > ZF; z -= 5) for (const s of [-1, 1]) buoys.push({ x: riverX(z) + s * 2.3, y: 0.08, z, c: s < 0 ? 0xe8402a : 0xf8f4ec });
  K.inst(K.sph(0.16, 10, 8), K.S(0xffffff), buoys);
  const dock = K.group(null, [riverX(ZF) + 3.5, 0, ZF - 1.5]);
  K.part(dock, K.box(3.4, 0.12, 2.4), K.M(0xa07a50), [0, 0.25, 0]);
  for (const [x, z] of [[-1.6, -1.1], [1.6, -1.1], [-1.6, 1.1], [1.6, 1.1]]) K.part(dock, K.cyl(0.08, 0.08, 1, 6), K.M(0x7a5a3a), [x, -0.2, z]);
  const fin = K.group(null, [riverX(ZF), 0, ZF]);
  for (const s of [-1, 1]) K.part(fin, K.cyl(0.08, 0.08, 3.4, 8), K.M(0xf4f0e8), [s * 4.2, 1.5, 0]);
  K.part(fin, K.box(8.6, 0.8, 0.06), new THREE.MeshStandardMaterial({ map: textTex(K, "FINISH", { bg: "#ffffff", color: "#e8402a" }), roughness: 0.7 }), [0, 3.0, 0]);
  flag(K, null, [riverX(ZF) + 4.8, 0.3, ZF - 2.2], 0xffc93a, 2.2);
  // the boat, its rower and the oars
  const boat = K.group(null, [riverX(Z0), 0, Z0]);
  K.part(boat, K.sph(1, 20, 12, 0), K.S(0xd8503a, { side: THREE.DoubleSide }), [0, 0.42, 0], null, [0.78, 0.5, 2.0]).geometry = new THREE.SphereGeometry(1, 20, 10, 0, PI * 2, PI / 2, PI / 2);
  K.part(boat, K.box(1.1, 0.04, 2.8), K.M(0xb8905a), [0, 0.12, 0]);
  K.part(boat, K.tor(1, 0.045, 6, 40), K.M(0xa07a50), [0, 0.42, 0], [PI / 2, 0, 0], [0.78, 2.0, 1]);
  for (const z of [0.2, -1.0]) K.part(boat, K.box(1.3, 0.06, 0.32), K.M(0xa07a50), [0, 0.3, z]);
  const rower = K.group(boat, [0, 0.3, 0.2]), who = animal(K, "rabbit", 0.95, rower); who.g.position.set(0, 0, -0.1);
  const oars = [1, -1].map((s) => {
    const yaw = K.group(boat, [s * 0.75, 0.48, 0.25]), tilt = K.group(yaw);
    K.part(tilt, K.cyl(0.025, 0.025, 2.1, 6), K.M(0xc8a070), [s * 0.55, 0, 0], [0, 0, PI / 2]);
    K.part(tilt, K.box(0.5, 0.03, 0.18), K.M(0xe8e0d0), [s * 1.45, 0, 0]);
    return { yaw, tilt, s };
  });
  const wake = K.sprite(0xffffff, 1.8, [0, 0.1, 1.9], 0, boat);
  let sx = 0, z = Z0, prevSide = 0, pull = 0;
  return {
    fov: 55, fovTall: 74, gauge: "v",
    update(v, t, dt) {
      sx = damp(sx, clamp(v.x, -1.25, 1.25), 9, dt);
      rower.rotation.x = sx * 0.32;
      const driving = v.targets[v.side] < 0; // heading back = pulling the blades through the water
      pull = damp(pull, driving ? 1 : 0, 6, dt);
      oars.forEach((o) => { o.yaw.rotation.y = o.s * sx * 0.55; o.tilt.rotation.z = o.s * lerp(0.15, -0.34, pull); });
      if (v.side !== prevSide) prevSide = v.side;
      const want = Z0 - Math.min(n, v.reps + (driving ? clamp(-v.x, 0, 1) * 0.3 : 0)) * STEP;
      const nz = damp(z, want, 1.6, dt), speed = (z - nz) / Math.max(dt, 0.001); z = nz;
      boat.position.set(riverX(z), Math.sin(t * 1.6) * 0.03, z); boat.rotation.y = Math.atan(Math.cos(z * 0.05) * 0.075) ; boat.rotation.z = Math.sin(t * 1.2) * 0.02;
      wake.material.opacity = clamp(speed * 0.15, 0, 0.5);
      if (who.idle && !K.calm) who.idle(t);
      cam.position.set(riverX(z) + 1.6, 2.5, z + 4.6); cam.lookAt(riverX(z - 6), 0.6, z - 4);
    },
    focus(p) { p.set(riverX(z), 1.2, z); },
  };
});

// ================================================================ 15. Knee Straighten (Reach)
// Penalty practice at the park, first person. Straighten your knee up to the ball on its stand and
// hold: it powers up, then flies into the net past a wobbly penguin goalie.
P3.add("kneeext", (K, THREE, cam) => {
  sunny(K, { sunDir: [-0.5, 0.45, -1], dir: [-0.4, 0.9, 0.5] });
  K.ground({ size: 300, seg: 80, h: (x, z) => (Math.hypot(x, z) > 40 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 12 * Math.min(1, (Math.hypot(x, z) - 40) / 40) : 0), color: (x, z) => (Math.abs(x) < 14 && z > -20 && z < 8 ? (Math.floor((z + 40) / 2.4) % 2 ? 0x5aa84a : 0x68b856) : K.mix(0x5aa046, 0x86c05a, K.fbm(x * 0.12, z * 0.12))) });
  shadowBox(K, 14);
  K.peaks(14, 150, 220, 30, 60, 0x88a8b8);
  K.clouds(14); K.flock(3, { cz: -30, y0: 14, y1: 18 });
  trees(K, K.ring(34, 24, 70, { free: true }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.3, 2) })));
  // pitch lines, the goal and its net
  const line = K.M(0xffffff, { roughness: 0.9 });
  K.part(null, K.box(8, 0.01, 0.08), line, [0, 0.01, -6], null, null, true);
  for (const s of [-1, 1]) K.part(null, K.box(0.08, 0.01, 3), line, [s * 4, 0.01, -7.5], null, null, true);
  const GZ = -9, GW = 2.4, GH = 1.6, post = K.S(0xffffff, { roughness: 0.3 });
  for (const s of [-1, 1]) K.part(null, K.cyl(0.06, 0.06, GH, 10), post, [s * GW, GH / 2, GZ]);
  K.part(null, K.cyl(0.06, 0.06, GW * 2 + 0.12, 10), post, [0, GH, GZ], [0, 0, PI / 2]);
  const netT = K.tex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 2; for (let i = 0; i <= w; i += 10) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } }, true);
  netT.repeat.set(5, 2);
  const netM = new THREE.MeshBasicMaterial({ map: netT, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const back = K.part(null, K.plane(GW * 2, GH), netM, [0, GH / 2, GZ - 1.0], null, null, true);
  K.part(null, K.plane(GW * 2, 1.0), netM, [0, GH, GZ - 0.5], [PI / 2, 0, 0], null, true);
  for (const s of [-1, 1]) K.part(null, K.plane(1.0, GH), netM, [s * GW, GH / 2, GZ - 0.5], [0, PI / 2, 0], null, true);
  const keeper = animal(K, "penguin", 0.9); keeper.g.position.set(0, 0, GZ + 0.4);
  // your leg: thigh along the chair, shin swinging up from the knee
  const KN = new THREE.Vector3(0.2, 0.7, 0.75), SL = 0.46;
  const pants = K.S(0x3a5aa8, { roughness: 0.8 });
  K.part(null, K.cyl(0.085, 0.08, 0.7, 10), pants, [KN.x, KN.y + 0.02, KN.z + 0.35], [PI / 2, 0, 0]);
  K.part(null, K.sph(0.085, 12, 10), pants, [KN.x, KN.y + 0.02, KN.z]);
  const shin = K.group(null, KN.toArray());
  K.part(shin, K.cyl(0.07, 0.055, SL * 0.55, 10), pants, [0, -SL * 0.27, 0]);
  K.part(shin, K.cyl(0.055, 0.05, SL * 0.45, 10), K.S(0xf4f0ea, { roughness: 0.8 }), [0, -SL * 0.77, 0]);
  K.part(shin, K.box(0.12, 0.1, 0.25), K.S(0x2a2a30, { roughness: 0.5 }), [0, -SL - 0.03, -0.07]);
  K.part(shin, K.box(0.125, 0.02, 0.26), K.S(0xffffff), [0, -SL - 0.075, -0.07]);
  const ANG = (u) => 0.15 + clamp(u, 0, 1.08) * (PI / 2 - 0.15);
  // the ball on its stand
  const ballT = K.tex(128, 64, (g, w, h) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); g.fillStyle = "#1a1a1a"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc((i * 37) % w, (i * 23) % h, 9, 0, PI * 2); g.fill(); } });
  const ballM = new THREE.MeshStandardMaterial({ map: ballT, roughness: 0.45 });
  const BP = new THREE.Vector3(KN.x, KN.y + 0.02, KN.z - SL - 0.24);
  K.part(null, K.cyl(0.02, 0.05, BP.y - 0.1, 8), K.M(0xff8a2a), [BP.x, (BP.y - 0.1) / 2, BP.z]);
  K.part(null, K.cone(0.05, 0.05, 8), K.M(0xff8a2a), [BP.x, BP.y - 0.1, BP.z], [PI, 0, 0]);
  const mkBall = () => K.part(null, K.sph(0.11, 16, 12), ballM);
  let ball = mkBall(); ball.position.copy(BP);
  const glow = K.sprite(0xffe07a, 0.6, BP.toArray(), 0);
  const shots = []; let pop = 1, ang = ANG(0), hop = 0, next = 0;
  cam.position.set(-0.75, 1.4, 1.75); cam.lookAt(0.15, 0.45, -4);
  return {
    fov: 56, fovTall: 74, gauge: "v",
    update(v, t, dt) {
      ang = damp(ang, ANG(v.state === "return" ? v.u * 0.9 : v.u), 12, dt); shin.rotation.x = ang;
      const charging = v.state === "move" && v.u >= 0.88;
      if (!ball && (next -= dt) <= 0) { ball = mkBall(); pop = 0; }
      if (ball) { pop = Math.min(1, pop + dt * 3); ball.scale.setScalar(Math.max(0.001, ease(pop))); ball.position.copy(BP); if (charging && !K.calm) ball.position.y += Math.sin(t * 25) * 0.004; ball.rotation.y += dt * (charging ? 4 : 0.3); }
      glow.material.opacity = charging ? 0.3 + v.prog * 0.6 : 0; glow.scale.setScalar(0.4 + v.prog * 0.5);
      if (v.fresh && ball) {
        shots.push({ b: ball, to: new THREE.Vector3(K.R(-1.7, 1.7), K.R(0.3, 1.2), GZ - 0.85), t: 0 });
        if (shots.length > 20) shots.shift().b.visible = false;
        ball = null; next = 0.7; hop = 1;
      }
      for (const s of shots) {
        s.t += dt; const k = clamp(s.t / 0.85, 0, 1);
        if (k < 1) { s.b.position.lerpVectors(BP, s.to, k); s.b.position.y += Math.sin(k * PI) * 1.1; s.b.rotation.x -= dt * 14; }
        else { s.b.position.y = Math.max(0.11, s.b.position.y - dt * 3); }
      }
      back.position.z = GZ - 1.0 - Math.max(0, hop) * 0.25; hop = Math.max(0, hop - dt * 1.5);
      keeper.g.position.x = Math.sin(t * 1.4) * 1.1; keeper.g.rotation.z = Math.sin(t * 5) * 0.12; keeper.g.position.y = hop > 0.3 ? Math.sin((1 - hop) * PI * 2) * 0.3 : 0;
      if (keeper.idle && !K.calm) keeper.idle(t);
    },
    focus(p) { p.set(0, 1.0, GZ); },
  };
});

// ================================================================ 16. Bridges (Reach)
// Lift your hips and the rope bridge over the creek pulls up out of the water. Hold it up while an
// animal walks across to the meadow on the other side; then the next one waits for you.
P3.add("bridge", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.5, 0.4, -1], sun: 1.2 });
  const creek = (x, z) => Math.abs(x + Math.sin(z * 0.15) * 0.4) < 2.5;
  K.ground({ size: 300, seg: 130, h: (x, z) => { const a = Math.abs(x + Math.sin(z * 0.15) * 0.4); return (a < 2.5 ? -0.9 : a < 3.2 ? lerp(-0.9, 0, (a - 2.5) / 0.7) : 0) + (z < -14 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 10 * Math.min(1, (-14 - z) / 40) : 0); }, color: (x, z, y) => (y < -0.5 ? 0x8a7a58 : y < -0.05 ? 0xb8a878 : K.mix(0x5aa046, 0x88c25a, K.fbm(x * 0.15, z * 0.15))) });
  const water = K.water({ size: 300, seg: 60, y: -0.35, color: 0x3a90c0, amp: 0.04 }); water.scale.x = 0.03;
  shadowBox(K, 9);
  K.peaks(14, 150, 220, 30, 60, 0x7aa0b0, { snow: 0xf4f8fc });
  K.clouds(14); K.flock(4, { cz: -30, y0: 14, y1: 20 });
  trees(K, K.ring(36, 12, 70, { free: true, ok: (x, z) => !creek(x, z) && Math.abs(x) > 4 && (z < -4 || Math.abs(x) > 12) }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1, 1.7) })));
  flowers(K, 260, [-14, 14, -10, 5, (x, z) => Math.abs(x) > 3.4]);
  const rocks = []; for (let i = 0; i < 30; i++) { const z = K.R(-20, 6), s = K.pick([-1, 1]); rocks.push({ x: s * K.R(2.5, 3.1) - Math.sin(z * 0.15) * 0.4, y: -0.1, z, s: K.R(0.15, 0.35), ry: K.R(0, 6), c: K.pick([0x9a9a92, 0x8a8a84, 0xaaa8a0]) }); }
  K.inst(K.dod(1), K.M(0xffffff), rocks);
  // the bridge: planks hanging between posts on each bank
  const N = 13, HALF = 3.0, TOPY = 0.12, wood = K.M(0xa07a50), woodOn = K.M(0xa07a50, { emissive: 0x2a9a50, emissiveIntensity: 0.35 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.part(null, K.post(0.07, 0.08, 1.0, 8), K.M(0x7a5a3a), [sx * (HALF + 0.15), 0, sz * 0.45]);
  const planks = Array.from({ length: N }, () => K.part(null, K.box(0.4, 0.06, 0.82), wood));
  const rails = [-1, 1].map(() => Array.from({ length: N + 1 }, () => stick(K, 0.02, K.M(0xd8c8a0))));
  const yAt = (x, depth) => TOPY - depth * (1 - (x / HALF) ** 2);
  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  // animals take turns crossing; the ones that made it graze in the meadow
  const kinds = [["rabbit", 0.55], ["sheep", 0.8], ["pig", 0.7], ["chicken", 0.55]];
  let k = 0, walker = null, wx = -4.2, pop = 0, wait = 0, depth = 0.9;
  const meadow = [];
  const spawn = () => { const [kind, h] = kinds[k++ % kinds.length]; walker = animal(K, kind, h); walker.unit = walker.g.scale.x; walker.g.rotation.y = PI / 2; wx = -4.2; pop = 0; };
  spawn();
  const ducks = [0, 1, 2].map((i) => { const d = duck(K, null, i ? 0xffd84a : 0xf8f4ec, i ? 0.8 : 1.3); return { d, z0: -3 - i * 0.7 }; });
  cam.position.set(1.4, 2.3, 5.8); cam.lookAt(0, 0.2, 0);
  return {
    fov: 52, fovTall: 72, gauge: "v",
    update(v, t, dt) {
      depth = damp(depth, lerp(0.9, -0.3, clamp(v.u, 0, 1.1)), 6, dt);
      const on = v.state === "move" && v.u >= 0.9;
      planks.forEach((p, i) => { const x = -HALF + (i * 2 * HALF) / (N - 1); p.position.set(x, yAt(x, depth), 0); p.rotation.z = Math.atan((depth * 2 * x) / (HALF * HALF)); p.material = on ? woodOn : wood; });
      rails.forEach((r, j) => { const z = j ? 0.45 : -0.45; for (let i = 0; i <= N; i++) { const x0 = -HALF - 0.15 + (i * (2 * HALF + 0.3)) / (N + 1), x1 = -HALF - 0.15 + ((i + 1) * (2 * HALF + 0.3)) / (N + 1); r[i](P(x0, (i === 0 ? 0.95 : yAt(x0, depth) + 0.6), z), P(x1, (i === N ? 0.95 : yAt(x1, depth) + 0.6), z)); } });
      if (walker) {
        pop = Math.min(1, pop + dt * 2.5); walker.g.scale.setScalar(Math.max(0.001, ease(pop) * walker.unit));
        const goal = v.state === "move" ? lerp(-4.2, 4.2, clamp(v.prog, 0, 1)) : -4.2, nx = damp(wx, goal, 5, dt), moving = Math.abs(nx - wx) > 0.003;
        walker.g.rotation.y = nx >= wx || !moving ? PI / 2 : -PI / 2; wx = nx;
        const y = Math.abs(wx) <= HALF ? Math.max(-0.35, yAt(wx, depth) + 0.03) : 0;
        walker.g.position.set(wx, y + (moving ? Math.abs(Math.sin(t * 11)) * 0.05 : 0), 0);
        if (walker.idle && !K.calm) walker.idle(t);
      }
      if (v.fresh && walker) { meadow.push({ a: walker, from: walker.g.position.clone(), to: P(K.R(5, 10), 0, K.R(-6, 3)), t: 0, ph: K.R(0, 6) }); if (meadow.length > 10) meadow.shift().a.g.visible = false; walker = null; wait = 1; }
      if (!walker && (wait -= dt) <= 0) spawn();
      for (const m of meadow) {
        m.t += dt; const u = clamp(m.t / 2, 0, 1), g = m.a.g;
        g.position.set(lerp(m.from.x, m.to.x, ease(u)), u < 1 ? Math.abs(Math.sin(m.t * 12)) * 0.08 : 0, lerp(m.from.z, m.to.z, ease(u)));
        if (u < 1) g.rotation.y = Math.atan2(m.to.x - m.from.x, m.to.z - m.from.z); else if (m.a.idle && !K.calm) m.a.idle(t + m.ph);
      }
      ducks.forEach((d, i) => { const z = ((d.z0 + t * 0.35 + 20) % 26) - 20; d.d.g.position.set(-Math.sin(z * 0.15) * 0.4 + 1.2 + (i ? 0.25 * (i % 2 ? 1 : -1) : 0), -0.33, z); d.d.g.rotation.y = 0; });
    },
    focus(p) { p.set(walker ? wx : 4.2, 0.8, 0); },
  };
});

// ================================================================ 17. Yes Nods (Swing)
// A pond garden in the evening light. Look up to the owl on the branch, then down to the koi in the
// pond: whoever you look at says hello (the owl ruffles, the koi jumps).
P3.add("nod", (K, THREE, cam, S) => {
  sunny(K, { top: 0x3a6ab8, mid: 0xf0b890, low: 0xffe0b0, sunDir: [0.6, 0.12, -1], sun: 1.6, sunColor: 0xffb070, fog: 0xf0d0b0, sunL: 0xffd8a8, sunI: 2.4, dir: [0.6, 0.5, 0.4] });
  const PZ = -3.0, PR = 3.5, pond = (x, z) => Math.hypot(x, (z - PZ) * 1.05) < PR;
  K.ground({ size: 300, seg: 120, h: (x, z) => (pond(x, z) ? -0.7 : (Math.hypot(x, z) > 14 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 10 * Math.min(1, (Math.hypot(x, z) - 14) / 40) : 0)), color: (x, z, y) => (y < -0.3 ? 0x6a6a52 : K.mix(0x5a9a44, 0x86c05a, K.fbm(x * 0.15, z * 0.15))) });
  K.water({ size: 2 * PR + 1, seg: 30, y: -0.15, z: PZ, color: 0x2a7aa8, amp: 0.02 });
  shadowBox(K, 10);
  K.peaks(14, 150, 220, 30, 60, 0x8a90b0);
  K.clouds(12, { color: 0xffd8c8, glow: 0.4 });
  const stones = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * PI * 2; stones.push({ x: Math.sin(a) * (PR + 0.1), y: 0, z: PZ + Math.cos(a) * (PR + 0.1) / 1.05, s: K.R(0.18, 0.32), ry: K.R(0, 6), c: K.pick([0x9a9a92, 0x8a8a84, 0xaaa8a0]) }); }
  K.inst(K.dod(1), K.M(0xffffff), stones.filter((s) => s.z < -0.2));
  const pads = []; for (let i = 0; i < 16; i++) { const a = K.R(0, 6.28), r = K.R(1.2, PR - 0.4); pads.push({ x: Math.sin(a) * r, y: -0.13, z: PZ + Math.cos(a) * r, s: K.R(0.2, 0.32) }); }
  K.inst(K.cyl(1, 1, 0.02, 10), K.M(0x4a9a3a), pads, { shadow: false });
  K.inst(K.cone(0.08, 0.12, 6), K.S(0xf5a0c8), pads.filter((_, i) => i % 3 === 0).map((p) => ({ x: p.x, y: -0.06, z: p.z })), { shadow: false });
  trees(K, K.ring(26, 9, 50, { free: true, ok: (x, z) => !pond(x, z) && z < 2 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1, 1.6) })), [0x4a8a3a, 0x5a9a40, 0x6a9a3a]);
  // lanterns by the pond
  for (const [x, z] of [[-2.2, 0.2], [2.4, 0.4]]) { K.part(null, K.post(0.05, 0.05, 1.0, 6), K.M(0x3a3a3a), [x, 0, z]); K.part(null, K.box(0.22, 0.26, 0.22), K.E(0xffd08a, { emissiveIntensity: 0.8 }), [x, 1.1, z]); K.sprite(0xffc070, 1.1, [x, 1.1, z], 0.5); }
  // the two targets: up = the owl on its branch, down = the koi in the pond
  const tgU = Math.max(16, (S.amp || 30) * 0.6), tgD = Math.max(16, (S.amp || 30) * 0.6), EYE = 1.35, CZ = 0.6;
  const OD = 4.2, oy = EYE + Math.sin(tgU * D2R) * OD, oz = CZ - Math.cos(tgU * D2R) * OD;
  const bark = K.M(0x5a4030);
  K.part(null, K.cyl(0.22, 0.32, oy + 1.4, 8), bark, [-2.3, (oy + 1.4) / 2, oz - 0.5]);
  stick(K, 0.08, bark)(new THREE.Vector3(-2.3, oy - 0.15, oz - 0.5), new THREE.Vector3(0.9, oy - 0.05, oz));
  K.inst(K.ico(1, 1), K.M(0xffffff), [[-2.0, oy + 1.4, oz - 0.8, 1.6], [-0.4, oy + 1.2, oz - 0.6, 1.2], [-3.3, oy + 0.8, oz - 0.4, 1.3], [0.9, oy + 1.0, oz - 1.0, 1.0]].map(([x, y, z, s]) => ({ x, y, z, s, ry: K.R(0, 6), c: K.pick([0x4a8a3a, 0x5a9a40]) })));
  // the owl model comes on its own stump: hide that and perch it on the branch
  const OS = 0.8, OB = oy - 1.22 * OS, om = A().owl ? A().owl(K) : { g: K.group(null), idle: null };
  if (A().owl) om.g.children.slice(0, 2).forEach((c) => { c.visible = false; });
  const owl = { g: K.group(null, [0, OB, oz], null, OS), idle: om.idle }; owl.g.add(om.g);
  const dd = clamp((EYE + 0.15) / Math.tan(tgD * D2R), 1.2, 5.5), KP = new THREE.Vector3(0, -0.15, CZ - dd);
  const koi = fish(K, null, 0xff7a2a), koiSpots = K.part(koi.g, K.sph(1, 8, 6), K.S(0xffffff), [0, 0.06, 0.05], null, [0.06, 0.06, 0.12]);
  koi.g.scale.setScalar(1.3); koiSpots.visible = true;
  const ripple = K.part(null, K.tor(0.3, 0.025, 5, 20), K.S(0xffffff, { transparent: true, opacity: 0 }), [KP.x, -0.12, KP.z], [PI / 2, 0, 0], null, true);
  const glows = [K.sprite(0x9affb0, 2.2, [0, oy + 0.5, oz], 0), K.sprite(0x9affb0, 1.6, [KP.x, 0.05, KP.z], 0)];
  let view = 0, prevSide = 0, owlHop = -1, jump = -1;
  cam.position.set(0, EYE, CZ);
  return {
    fov: 60, fovTall: 78, gauge: "v",
    update(v, t, dt) {
      view = damp(view, clamp(v.val, -80, 80), 9, dt);
      cam.rotation.set(view * D2R, 0, 0);
      const up = v.targets[v.side] > 0;
      if (v.side !== prevSide) { if (up) jump = 0; else owlHop = 0; prevSide = v.side; }
      glows[0].material.opacity = up ? 0.25 + v.prog * 0.5 : 0; glows[1].material.opacity = !up ? 0.25 + v.prog * 0.5 : 0;
      if (owl.idle && !K.calm) owl.idle(t);
      if (owlHop >= 0) { owlHop += dt; const u = clamp(owlHop / 0.8, 0, 1); owl.g.position.y = OB + Math.sin(u * PI) * 0.3; owl.g.rotation.y = u * PI * 2; if (u >= 1) owlHop = -1; }
      else owl.g.rotation.y = up && !K.calm ? Math.sin(t * 2) * 0.3 : 0;
      if (jump >= 0) {
        jump += dt; const u = clamp(jump / 1.1, 0, 1);
        koi.g.position.set(KP.x + lerp(-0.6, 0.6, u), -0.1 + Math.sin(u * PI) * 1.1, KP.z); koi.g.rotation.set(-(u - 0.5) * 2.4, PI / 2, 0);
        ripple.material.opacity = u > 0.9 ? 0.8 : ripple.material.opacity; if (u >= 1) jump = -1;
      } else { const a = t * 0.8; koi.g.position.set(KP.x + Math.cos(a) * 0.45, -0.22, KP.z + Math.sin(a) * 0.3); koi.g.rotation.set(0, -a, 0); }
      koi.tail.rotation.y = K.calm ? 0 : Math.sin(t * 8) * 0.4;
      ripple.material.opacity = Math.max(0, ripple.material.opacity - dt * 0.8); ripple.scale.setScalar(1 + (0.8 - ripple.material.opacity) * 2.5);
    },
    focus(p) { if (view > 0) p.set(0, oy + 0.3, oz); else p.copy(KP); },
  };
});

// ================================================================ 18. Side Bend Hold (Hold)
// Sailing across the bay. Lean into the green band and the sail fills, heeling the boat over; hold it
// there to reach the lighthouse. A dolphin cheers you in, and the next boat sets off.
P3.add("sidebendhold", (K, THREE, cam) => {
  K.sky(0x3a86d8, 0xa9d8f4, 0xf0f4e8, { sunDir: [0.4, 0.4, -1], sun: 1.2, sunColor: 0xfff2c8, horizon: 0.14 });
  K.scene.fog = new THREE.Fog(0xcfe6f4, 50, 280);
  K.lights({ sky: 0xfff6e8, ground: 0x4a7a90, hemi: 1.4, sun: 0xfff0d8, sunI: 2.3, dir: [0.4, 0.85, 0.5] });
  const isle = (x, z) => 2.6 * Math.exp(-((x - 12.5) ** 2 + (z + 3) ** 2) / 9) + 3 * Math.exp(-((x + 22) ** 2 + (z + 30) ** 2) / 40) + 5 * Math.exp(-((x - 30) ** 2 + (z + 60) ** 2) / 90) + 2 * Math.exp(-((x + 14) ** 2 + (z + 4) ** 2) / 6);
  K.ground({ size: 400, seg: 140, h: (x, z) => isle(x, z) - 1.2, color: (x, z, y) => (y < -0.3 ? 0xd8c890 : y < 0.25 ? 0xf0dca8 : K.mix(0x5aa046, 0x86c05a, K.fbm(x * 0.2, z * 0.2))) });
  K.water({ size: 400, seg: 80, y: 0, color: 0x2a86c0, amp: 0.07, rough: 0.12 });
  shadowBox(K, 18);
  K.peaks(14, 160, 240, 30, 60, 0x88a8c0);
  K.clouds(16); K.flock(4, { cz: -40, y0: 14, y1: 20 });
  trees(K, [{ x: 13.6, z: -4, y: isle(13.6, -4) - 1.2, s: 0.8 }, { x: -14, z: -4, y: isle(-14, -4) - 1.2, s: 0.9 }, { x: -13.2, z: -3.4, y: isle(-13.2, -3.4) - 1.2, s: 0.7 }, { x: -22, z: -30, y: 1.6, s: 1.5 }, { x: 30, z: -60, y: 3.6, s: 2 }]);
  // the lighthouse and its dock
  const LH = K.group(null, [12.4, isle(12.4, -3.2) - 1.2, -3.2]);
  for (let i = 0; i < 5; i++) K.part(LH, K.cyl(0.62 - i * 0.06, 0.66 - i * 0.06, 0.9, 16), K.S(i % 2 ? 0xe8402a : 0xf8f4ec), [0, 0.45 + i * 0.9, 0]);
  K.part(LH, K.cyl(0.5, 0.5, 0.1, 16), K.S(0x2a2a30), [0, 4.55, 0]);
  const lamp = K.part(LH, K.cyl(0.32, 0.32, 0.55, 12), K.E(0xfff0a0, { emissiveIntensity: 0.6 }), [0, 4.9, 0]);
  K.part(LH, K.cone(0.45, 0.5, 12), K.S(0xe8402a), [0, 5.42, 0]);
  const beam = K.group(LH, [0, 4.9, 0]), bm = K.part(beam, K.cone(1.2, 8, 16, 1), K.B(0xfff4c0, { transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }), [4, 0, 0], [0, 0, PI / 2], null, true);
  const lampGlow = K.sprite(0xfff0a0, 3, [12.4, LH.position.y + 4.9, -3.2], 0.3);
  K.part(null, K.box(3, 0.12, 0.9), K.M(0xa07a50), [9.6, 0.32, -1.2]);
  // wind streaks and the boat
  const streaks = Array.from({ length: 22 }, () => { const m = K.part(null, K.box(1.8, 0.05, 0.05), K.B(0xffffff, { transparent: true, opacity: 0.6 }), null, null, null, true); return { m, x: K.R(-16, 16), y: K.R(1.5, 5), z: K.R(-3, 1), sp: K.R(4, 7) }; });
  const boat = K.group(null, [-10, 0, 0], null, 1.35), heel = K.group(boat);
  K.part(heel, K.sph(1, 20, 12), K.S(0xf8f4ec), [0, 0.12, 0], null, [1.5, 0.42, 0.5]);
  K.part(heel, K.sph(1, 20, 12), K.S(0x2a5aa8), [0, 0.06, 0], null, [1.52, 0.3, 0.52]);
  K.part(heel, K.box(2.0, 0.06, 0.6), K.M(0xb8905a), [0, 0.4, 0]);
  K.part(heel, K.cyl(0.04, 0.05, 2.9, 8), K.S(0xd8d8d8), [0.15, 1.85, 0]);
  K.part(heel, K.cyl(0.03, 0.03, 1.4, 6), K.S(0xd8d8d8), [-0.55, 0.75, 0], [0, 0, PI / 2]);
  const tri = (pts) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); g.computeVertexNormals(); return g; };
  const sailMats = [0xf8f4ec, 0xffd23a, 0xff8a8a, 0x8ad0ff].map((c) => K.S(c, { side: THREE.DoubleSide, roughness: 0.7 }));
  const main = K.part(heel, tri([0, 0, 0, -1.3, 0, 0, 0, 2.5, 0]), sailMats[0], [0.13, 0.8, 0]);
  const jib = K.part(heel, tri([0, 0, 0, 1.25, 0, 0, 0, 2.2, 0]), sailMats[0], [0.18, 0.6, 0]);
  K.part(heel, K.box(0.02, 0.25, 0.4), K.M(0xe8402a), [0.15, 3.35, 0], null, [1, 1, 1]).position.x = 0.35;
  const sailor = K.group(heel, [-0.8, 0.43, 0.1]); K.part(sailor, K.cyl(0.13, 0.15, 0.32, 10), K.S(0xffc93a), [0, 0.16, 0]); K.part(sailor, K.sph(0.12, 12, 10), K.S(0xf0c8a0), [0, 0.42, 0]); K.part(sailor, K.cyl(0.13, 0.13, 0.05, 10), K.S(0x2a5aa8), [0, 0.53, 0]);
  const spray = K.sprite(0xffffff, 1.4, [1.4, 0.15, 0.2], 0, boat);
  const dolphin = animal(K, "dolphin", 0.9); dolphin.g.visible = false;
  const X0 = -10, X1 = 8.6;
  let x = X0, h = 0, mode = "sail", t0 = 0, look = 0, dj = -1;
  cam.position.set(0, 3.4, 15.5); cam.lookAt(0, 1.6, -1);
  return {
    fov: 50, fovTall: 72, gauge: "h",
    update(v, t, dt) {
      const top = Math.min(v.hi, 2.2), go = v.state === "go";
      streaks.forEach((s) => { s.x += s.sp * dt * (v.inBand ? 1.7 : 1); if (s.x > 18) s.x = -18; s.m.position.set(s.x, s.y, s.z); });
      streaks[0].m.material.opacity = v.inBand && go ? 0.75 : 0.3;
      h = damp(h, clamp(v.u, 0, top + 0.4), 6, dt); heel.rotation.x = -Math.min(0.55, h * 0.3);
      const full = v.inBand && go; main.rotation.y = full ? -0.35 : Math.sin(t * 9) * 0.12 - 0.1; jib.rotation.y = full ? 0.3 : Math.sin(t * 11) * 0.12;
      if (v.fresh) { mode = "dock"; t0 = 0; dj = 0; }
      if (mode === "dock") { t0 += dt; x = damp(x, X1, 3, dt); if (go && t0 > 1.6) mode = "new"; }
      else if (mode === "new") { look = (look + 1) % sailMats.length; main.material = jib.material = sailMats[look]; x = X0; mode = "sail"; }
      else x = damp(x, lerp(X0, X1, clamp(v.prog, 0, 1)), 2.5, dt);
      cam.position.set(x * 0.5, 3.4, 15.5); cam.lookAt(x * 0.5, 1.6, -1);
      boat.position.set(x, Math.sin(t * 1.5) * 0.05, 0); boat.rotation.z = Math.sin(t * 1.1) * 0.03;
      spray.material.opacity = full ? 0.35 + Math.random() * 0.25 : 0;
      beam.rotation.y = mode === "dock" ? t * 3 : t * 0.6; bm.material.opacity = mode === "dock" ? 0.35 : 0.08; lampGlow.material.opacity = mode === "dock" ? 0.6 + Math.sin(t * 10) * 0.2 : 0.25;
      lamp.material = K.E(0xfff0a0, { emissiveIntensity: mode === "dock" ? 1.2 : 0.6 });
      if (dj >= 0) { dj += dt; const u = clamp(dj / 1.4, 0, 1); dolphin.g.visible = u < 1; dolphin.g.position.set(lerp(4, 8, u), -0.6 + Math.sin(u * PI) * 2.2, 2.2); dolphin.g.rotation.set(0, PI / 2, -(u - 0.5) * 2.2); if (u >= 1) dj = -1; }
    },
    focus(p) { p.set(x, 1.6, 0); },
  };
});

// ================================================================ 19. Heel-Toe Rock (Swing)
// A seesaw in the playground with a panda and a bunny. Rock your foot to tip the seesaw up to the top
// ring, then down to the bottom one; each full rock ties another balloon to the seesaw.
P3.add("heeltoe", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [-0.5, 0.45, -1], dir: [-0.4, 0.9, 0.5] });
  K.ground({ size: 300, seg: 90, h: (x, z) => (Math.hypot(x, z) > 30 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 10 * Math.min(1, (Math.hypot(x, z) - 30) / 40) : 0), color: (x, z) => (Math.hypot(x * 0.55, z) < 2.0 ? K.mix(0xf0d8a0, 0xe0c488, K.noise(x * 3, z * 3)) : K.mix(0x62a648, 0x8cc45a, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 9);
  K.peaks(14, 150, 220, 30, 60, 0x7aa0b0, { snow: 0xf4f8fc });
  K.clouds(14); K.flock(3, { cz: -30, y0: 14, y1: 18 });
  trees(K, K.ring(30, 12, 60, { free: true, ok: (x, z) => z < -4 || Math.abs(x) > 10 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.1, 1.7) })));
  flowers(K, 200, [-12, 12, -8, 5, (x, z) => Math.hypot(x * 0.55, z) > 2.2]);
  // playground: slide and swing frame behind
  const red = K.S(0xe8503a), blue = K.S(0x3a8ae8), yel = K.S(0xffc93a);
  const slide = K.group(null, [-5, 0, -5], [0, 0.5, 0]);
  K.part(slide, K.box(1.0, 0.08, 1.0), yel, [0, 1.8, 0]); for (const [x, z] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) K.part(slide, K.cyl(0.05, 0.05, 1.8, 6), blue, [x, 0.9, z]);
  K.part(slide, K.box(0.8, 0.06, 2.8), red, [0, 0.95, 1.7], [0.62, 0, 0]);
  const frame = K.group(null, [4.5, 0, -5.5], [0, -0.4, 0]);
  for (const s of [-1, 1]) for (const z of [-0.5, 0.5]) K.part(frame, K.cyl(0.05, 0.05, 2.6, 6), blue, [s * 1.6, 1.2, z * 0.6], [z * 0.4, 0, 0]);
  K.part(frame, K.cyl(0.05, 0.05, 3.3, 6), blue, [0, 2.45, 0], [0, 0, PI / 2]);
  for (const x of [-0.6, 0.6]) { K.part(frame, K.cyl(0.015, 0.015, 1.6, 4), K.M(0x888888), [x, 1.65, 0]); K.part(frame, K.box(0.5, 0.05, 0.25), red, [x, 0.85, 0]); }
  // the seesaw
  const PY = 0.62, HL = 2.1;
  K.part(null, K.cyl(0.12, 0.12, 0.7, 10), K.S(0x8a8a90), [0, PY, 0], [PI / 2, 0, 0]);
  for (const z of [-0.3, 0.3]) for (const s of [-1, 1]) stick(K, 0.05, red)(new THREE.Vector3(s * 0.45, 0, z), new THREE.Vector3(0, PY, z));
  const plank = K.group(null, [0, PY, 0]);
  K.part(plank, K.box(HL * 2, 0.09, 0.42), yel, [0, 0.06, 0]);
  for (const s of [-1, 1]) { K.part(plank, K.box(0.5, 0.05, 0.46), blue, [s * (HL - 0.35), 0.13, 0]); K.part(plank, K.cyl(0.025, 0.025, 0.35, 6), K.S(0x2a2a30), [s * (HL - 0.75), 0.3, 0]); K.part(plank, K.cyl(0.025, 0.025, 0.4, 6), K.S(0x2a2a30), [s * (HL - 0.75), 0.47, 0], [PI / 2, 0, 0]); }
  const panda = animal(K, "panda", 0.85, plank); panda.g.position.set(-(HL - 0.35), 0.15, 0); panda.g.rotation.y = PI / 2;
  const bunny = animal(K, "rabbit", 0.75, plank); bunny.g.position.set(HL - 0.35, 0.15, 0); bunny.g.rotation.y = -PI / 2;
  const TILT = 0.27, endAt = (a) => [Math.cos(a) * (HL - 0.2), PY + Math.sin(a) * (HL - 0.2) + 0.15, 0.4];
  const rings = [target(K, endAt(TILT * 1.0), 0.2), target(K, endAt(-TILT * 1.0), 0.2)];
  // balloons tied to the middle: one per rep
  const NB = 12, bal = [];
  const bc = [0xff5a6a, 0xffd23a, 0x5ab4f0, 0x6ad89a, 0xb48af4, 0xff9a4a];
  for (let i = 0; i < NB; i++) {
    const a = (i / NB) * PI * 2, top = new THREE.Vector3(Math.cos(a) * 0.45, 2.1 + (i % 3) * 0.28, -0.6 + Math.sin(a) * 0.3);
    const g = K.group(null, top.toArray(), null, 0.001); K.part(g, K.sph(0.2, 14, 10), K.S(bc[i % bc.length], { roughness: 0.25 }), null, null, [1, 1.15, 1]); K.part(g, K.cone(0.04, 0.06, 6), K.S(bc[i % bc.length]), [0, -0.24, 0], [PI, 0, 0]);
    const str = stick(K, 0.006, K.M(0xf4f4f4)); str(new THREE.Vector3(0, PY - 0.2, -0.45), new THREE.Vector3(0, PY - 0.19, -0.45));
    bal.push({ g, top, str, on: 0 });
  }
  let ang = 0, prevSide = 0, bounce = [-1, -1];
  cam.position.set(1.8, 1.9, 6.4); cam.lookAt(0, 1.0, 0);
  return {
    fov: 50, fovTall: 72, gauge: "v",
    update(v, t, dt) {
      ang = damp(ang, clamp(v.x, -1.05, 1.05) * TILT, 10, dt); plank.rotation.z = ang;
      const up = v.targets[v.side] > 0;
      rings[0](up, t); rings[1](!up, t);
      if (v.side !== prevSide) { bounce[up ? 0 : 1] = 0; prevSide = v.side; }
      [panda, bunny].forEach((a, i) => { if (bounce[i] >= 0) { bounce[i] += dt; const u = clamp(bounce[i] / 0.6, 0, 1); a.g.position.y = 0.15 + Math.sin(u * PI) * 0.3; if (u >= 1) bounce[i] = -1; } if (a.idle && !K.calm) a.idle(t + i); });
      const done = Math.min(NB, Math.round((v.reps / Math.max(1, v.goal)) * NB));
      bal.forEach((b, i) => {
        b.on = damp(b.on, i < done ? 1 : 0, 4, dt); const s = ease(b.on);
        b.g.scale.setScalar(Math.max(0.001, s)); b.g.position.set(b.top.x + Math.sin(t * 1.3 + i) * 0.06, lerp(PY, b.top.y, s), b.top.z);
        b.str(new THREE.Vector3(0, PY + 0.02, -0.25), b.g.position.clone().add(new THREE.Vector3(0, -0.28 * s, 0)));
      });
    },
    focus(p) { const e = endAt(ang); p.set(e[0], e[1] + 0.3, 0); },
  };
});

// ================================================================ 20. Toes Up Hold (Hold)
// Fishing off a lake dock. Lift your toes to raise the rod into the green band and hold it there to reel
// the fish in; it leaps into your bucket and you cast again.
P3.add("toeshold", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.3, 0.3, -1], sun: 1.3, fog: 0xd8e8f0 });
  const lake = (x, z) => z < 0.6 && Math.hypot(x * 0.55, z + 26) < 27;
  K.ground({ size: 360, seg: 130, h: (x, z) => (lake(x, z) ? -1.6 : Math.min(0.3, 0.05 + (Math.hypot(x * 0.55, z + 26) - 27) * 0.1) + Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 12 * clamp((Math.hypot(x * 0.55, z + 26) - 32) / 40, 0, 1)), color: (x, z, y) => (y < -0.4 ? 0x7a7058 : y < 0.12 ? 0xc8b888 : K.mix(0x5aa046, 0x86c05a, K.fbm(x * 0.12, z * 0.12))) });
  K.water({ size: 120, seg: 60, y: -0.05, z: -26, color: 0x3a8ab8, amp: 0.05 });
  shadowBox(K, 12);
  K.peaks(18, 140, 230, 30, 70, 0x7a9cb0, { snow: 0xf4f8fc });
  K.clouds(16); K.flock(4, { cz: -40, y0: 16, y1: 22 });
  pines(K, K.ring(60, 30, 80, { free: true, ok: (x, z) => !lake(x, z) }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.4, 2.4) })));
  trees(K, K.ring(16, 5, 20, { free: true, ok: (x, z) => !lake(x, z) && z > 1.5 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1, 1.5) })));
  // the dock
  const DY = 0.35;
  K.inst(K.box(0.32, 0.06, 4.6), K.M(0xffffff), Array.from({ length: 6 }, (_, i) => ({ x: -0.9 + i * 0.36, y: DY, z: 0, c: K.pick([0xa07a50, 0x9a7448, 0xa88050]) })));
  for (const x of [-1, 1]) for (const z of [-2.1, -0.6, 0.9]) K.part(null, K.cyl(0.08, 0.08, 1.8, 6), K.M(0x6a4a30), [x, DY - 0.6, z]);
  // bucket and tackle box
  const BK = new THREE.Vector3(-0.6, DY, 0.1);
  K.part(null, K.cyl(0.2, 0.16, 0.34, 14), K.S(0x4a8ad0, { metalness: 0.3 }), [BK.x, DY + 0.17, BK.z]);
  K.part(null, K.cyl(0.18, 0.18, 0.02, 14), K.S(0x4aa8d8, { roughness: 0.1 }), [BK.x, DY + 0.3, BK.z], null, null, true);
  K.part(null, K.box(0.32, 0.14, 0.2), K.S(0x3a8a5a), [0.55, DY + 0.07, -0.7]);
  const tails = Array.from({ length: 6 }, (_, i) => { const g = K.group(null, [BK.x + Math.cos(i * 2.1) * 0.08, DY + 0.32, BK.z + Math.sin(i * 2.1) * 0.08], [0, i, 0.3 * (i % 2 ? 1 : -1)]); K.part(g, K.cone(0.07, 0.12, 5), K.S(0xff8a3a), [0, 0.06, 0], null, [1, 1, 0.3]); g.visible = false; return g; });
  // the rod
  const PV = new THREE.Vector3(0.15, 0.95, 1.25), RL = 2.6, YAW = -0.05;
  const rod = stick(K, 0.018, K.S(0x2a2a30, { roughness: 0.3 })), butt = stick(K, 0.035, K.S(0x8a5a3a, { roughness: 0.6 }));
  const reel = K.part(null, K.cyl(0.06, 0.06, 0.05, 12), K.S(0xc8ccd0, { metalness: 0.6 }), null, [0, 0, PI / 2]);
  const lineS = stick(K, 0.004, K.B(0xffffff));
  const ANG = (u) => 0.1 + clamp(u, 0, 2.6) * 0.32;
  const dir = (a) => new THREE.Vector3(Math.sin(YAW) * Math.cos(a), Math.sin(a), -Math.cos(YAW) * Math.cos(a));
  const bob = K.group(null); K.part(bob, K.sph(0.06, 10, 8), K.S(0xe8402a), [0, 0.03, 0]); K.part(bob, K.sph(0.055, 10, 8), K.S(0xffffff), [0, -0.02, 0]);
  const ripple = K.part(null, K.tor(0.18, 0.015, 5, 18), K.S(0xffffff, { transparent: true, opacity: 0.6 }), null, [PI / 2, 0, 0], null, true);
  const colors = [0xff8a3a, 0x8ab0d0, 0x6aa86a, 0xffc93a];
  let fishI = 0, cur = fish(K, null, colors[0]); cur.g.scale.setScalar(2);
  const FAR = -8.5, NEAR = -2.6, BX = -0.3;
  let a = ANG(0), bz = FAR, jump = null, caught = 0, cast = 0;
  cam.position.set(1.9, 1.55, 2.9); cam.lookAt(-0.6, 0.9, -4.5);
  return {
    fov: 55, fovTall: 74, gauge: "v",
    update(v, t, dt) {
      a = damp(a, ANG(v.state === "go" ? v.u : v.u * 0.6), 8, dt);
      const d = dir(a), tip = PV.clone().addScaledVector(d, RL);
      rod(PV.clone().addScaledVector(d, 0.35), tip); butt(PV.clone().addScaledVector(d, -0.15), PV.clone().addScaledVector(d, 0.38)); reel.position.copy(PV).addScaledVector(d, 0.12).add(new THREE.Vector3(0, -0.07, 0));
      const reeling = v.state === "go" && v.inBand;
      if (cast > 0) { cast -= dt; bz = lerp(NEAR, FAR, ease(1 - cast / 0.8)); }
      else if (v.state === "go") bz = damp(bz, lerp(FAR, NEAR, clamp(v.prog, 0, 1)), 3, dt);
      const tug = reeling && !K.calm ? Math.abs(Math.sin(t * 7)) * 0.05 : 0;
      const bobY = cast > 0 ? Math.sin((cast / 0.8) * PI) * 2 : -0.03 - tug;
      bob.position.set(BX + Math.sin(t * 0.7) * 0.08, bobY, bz); bob.visible = !jump;
      lineS(tip, bob.position);
      ripple.position.set(bob.position.x, -0.02, bz); ripple.scale.setScalar(1 + ((t * 0.8) % 1) * 1.5); ripple.material.opacity = cast > 0 || jump ? 0 : (reeling ? 0.7 : 0.4) * (1 - ((t * 0.8) % 1));
      if (!jump) { cur.g.position.set(bob.position.x + Math.sin(t * 3) * 0.1, -0.28 + (reeling ? Math.abs(Math.sin(t * 4)) * 0.12 : 0), bz - 0.35); cur.g.rotation.set(0, PI + Math.sin(t * 4) * 0.3, 0); cur.g.visible = cast <= 0 && v.prog > 0.05; }
      cur.tail.rotation.y = K.calm ? 0 : Math.sin(t * 12) * 0.5;
      if (v.fresh && !jump) { jump = { from: cur.g.position.clone(), t: 0 }; cur.g.visible = true; }
      if (jump) {
        jump.t += dt; const u = clamp(jump.t / 1.0, 0, 1);
        cur.g.position.lerpVectors(jump.from, BK, ease(u)); cur.g.position.y = lerp(jump.from.y, DY + 0.3, u) + Math.sin(u * PI) * 1.4; cur.g.rotation.x = u * PI * 2;
        lineS(tip, cur.g.position);
        if (u >= 1) { cur.g.visible = false; if (caught < tails.length) { tails[caught].visible = true; tails[caught].children[0].material = K.S(colors[fishI % colors.length]); } caught++; fishI++; cur = fish(K, null, colors[fishI % colors.length]); cur.g.scale.setScalar(2); cur.g.visible = false; jump = null; cast = 0.8; }
      }
    },
    focus(p) { p.copy(jump ? cur.g.position : bob.position); },
  };
});
})();
