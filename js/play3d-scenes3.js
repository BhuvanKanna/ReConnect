// Third batch of 3D scenes for js/play3d.js (after js/play3d-scenes.js and js/play3d-scenes2.js).
// Same contract: P3.add(id, (K, THREE, cam, S) => ({ fov, fovTall, gauge, flip, update(view, t, dt), focus(vec) })).
// view comes from the exercise's engine (see the top of js/play3d-scenes.js for its fields).
// Shared helpers (fit, animal, trees, sunny, ...) come from P3.lib, set by js/play3d-scenes2.js.
(() => {
"use strict";
const RC = window.RC;
const P3 = RC.Play3D;
if (!P3 || !P3.lib) return;
const { PI, clamp, damp, lerp, ease, A, fit, animal, trees, pines, flowers, stick, textTex, sunny, shadowBox, target } = P3.lib;

// a meadow with far hills; z < z0 rises into hills
const meadow = (K, o = {}) => K.ground({ size: o.size || 280, seg: o.seg || 90,
  h: o.h || ((x, z) => (z < (o.z0 || -16) ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 10 * Math.min(1, ((o.z0 || -16) - z) / 40) : 0)),
  color: o.color || ((x, z) => K.mix(0x66a648, 0x92c85e, K.fbm(x * 0.15, z * 0.15))) });
const backdrop = (K, o = {}) => { K.peaks(o.n || 14, 150, 220, 30, 60, o.peak || 0x7aa0b0, { snow: 0xf4f8fc }); K.clouds(o.clouds || 12); };
// world position of a point given in camera space
const camPt = (cam, x, y, z, out) => out.set(x, y, z).applyMatrix4(cam.matrixWorld);
// make an animal model without the rock or stump it was built standing on
// drop: how many parts to remove from the start, or a list of part numbers
function bare(K, kind, drop, h, parent) {
  const made = A()[kind](K), g = made.g || made, list = Array.isArray(drop) ? drop.map((i) => g.children[i]) : g.children.slice(0, drop);
  list.forEach((c) => g.remove(c));
  return fit(K, made, h, parent);
}
P3.lib.bare = bare;
P3.lib.meadow = (K, o) => meadow(K, o); P3.lib.backdrop = (K, o) => backdrop(K, o); P3.lib.camPt = (cam, x, y, z, out) => camPt(cam, x, y, z, out); P3.lib.glassMat = (THREE, o) => glassMat(THREE, o);
const glassMat = (THREE, o) => new THREE.MeshStandardMaterial(Object.assign({ color: 0xe8f4f8, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false }, o || {}));

// ================================================================ 21. Reach to the Floor (Reach, lean forward)
// Gather the eggs. Leaning forward tips your view down to the nest by your feet, where a grabber tool
// reaches for the egg; hold to pick it up and it goes into the basket. The hen lays the next one.
P3.add("floor", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.4, 0.5, -1], sun: 1.1, dir: [0.45, 0.9, 0.55] });
  const N = new THREE.Vector3(0, 0, 0.78);
  meadow(K, { color: (x, z) => (Math.hypot(x, z - N.z) < 0.9 ? K.mix(0xd8b868, 0xb89048, K.noise(x * 4, z * 4)) : K.mix(0x66a648, 0x92c85e, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 6); backdrop(K);
  trees(K, K.ring(26, 18, 70, { free: true, ok: (x, z) => z < -6 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.1, 1.7) })));
  flowers(K, 120, [-7, 7, -9, -2.5]);
  // hen house
  const coop = K.group(null, [-1.7, 0, -3.4], [0, 0.4, 0]);
  for (const [x, z] of [[-0.9, -0.6], [0.9, -0.6], [-0.9, 0.6], [0.9, 0.6]]) K.part(coop, K.box(0.12, 0.4, 0.12), K.M(0x6a4a30), [x, 0.2, z]);
  K.part(coop, K.box(2, 1.3, 1.4), K.M(0xc8443a), [0, 1.05, 0]);
  for (const s of [-1, 1]) K.part(coop, K.box(2.3, 0.08, 0.95), K.M(0x5a4a44), [0, 1.95, s * 0.38], [s * 0.62, 0, 0]);
  K.part(coop, K.box(0.5, 0.6, 0.04), K.M(0x2a1a14), [0.3, 0.9, 0.71]);
  K.part(coop, K.box(0.4, 0.04, 0.9), K.M(0x8a6a44), [0.3, 0.32, 1.1], [0.62, 0, 0]);
  K.part(coop, K.box(1.9, 0.1, 0.06), K.M(0xf4f0e8), [0, 1.66, 0.72]);
  // fence round the yard
  const posts = []; for (let x = -6; x <= 6; x += 1.2) posts.push({ x, y: 0.4, z: -5.2, s: 1 });
  K.inst(K.box(0.1, 0.8, 0.1), K.M(0xf0e6d0), posts);
  for (const y of [0.3, 0.62]) K.part(null, K.box(12.2, 0.08, 0.04), K.M(0xf0e6d0), [0, y, -5.2]);
  // more hens pecking about
  const hens = [[-2.6, -1.6, 0.6], [2.4, -2.4, -0.9], [1.3, -4.1, 2.6]].map(([x, z, r]) => { const h = animal(K, "chicken", 0.42); h.g.position.set(x, 0, z); h.g.rotation.y = r; return h; });
  // the nest by your feet, and the hen that lays the eggs
  K.part(null, K.tor(0.17, 0.07, 8, 18), K.M(0xc8a050), [N.x, 0.06, N.z], [-PI / 2, 0, 0]);
  K.part(null, K.cyl(0.17, 0.15, 0.04, 14), K.M(0x8a6a3a), [N.x, 0.03, N.z]);
  K.inst(K.cyl(0.006, 0.006, 0.22, 3), K.M(0xe0c070), Array.from({ length: 40 }, (_, i) => { const a = (i / 40) * PI * 2 + K.R(-0.1, 0.1), r = K.R(0.12, 0.3); return { x: N.x + Math.cos(a) * r, y: 0.05, z: N.z + Math.sin(a) * r, rx: PI / 2 + K.R(-0.3, 0.3), rz: K.R(0, PI), s: K.R(0.7, 1.2) }; }), { shadow: false });
  const hen = animal(K, "chicken", 0.48); hen.g.position.set(N.x - 0.5, 0, N.z - 0.25); hen.g.rotation.y = 0.9;
  const shell = K.S(0xfaf0e0, { roughness: 0.5 }), brown = K.S(0xd8a878, { roughness: 0.5 });
  const egg = (c) => K.part(null, K.sph(0.045, 14, 10), c, null, null, [1, 1.3, 1]);
  let cur = egg(shell), pop = 1, flying = [], laid = 0;
  const EGG = new THREE.Vector3(N.x + 0.02, 0.1, N.z);
  // the basket beside your chair
  const B = new THREE.Vector3(0.62, 0, 1.25);
  K.part(null, K.cyl(0.2, 0.16, 0.22, 16), K.M(0xc89a5a), [B.x, 0.11, B.z]);
  K.part(null, K.tor(0.2, 0.02, 6, 20), K.M(0xa87a4a), [B.x, 0.22, B.z], [PI / 2, 0, 0]);
  K.part(null, K.tor(0.18, 0.015, 6, 20, PI), K.M(0xa87a4a), [B.x, 0.22, B.z], [0, 0.3, 0]);
  const SLOT = (i) => ({ x: B.x + Math.cos(i * 2.4) * 0.1 * (i % 4 ? 1 : 0.2), y: 0.2 + Math.floor(i / 6) * 0.05, z: B.z + Math.sin(i * 2.4) * 0.1 * (i % 4 ? 1 : 0.2), rx: 0.3 * (i % 3), sy: 1.3, s: 0.001 });
  const inBasket = K.inst(K.sph(0.045, 12, 8), K.S(0xffffff, { roughness: 0.5 }), Array.from({ length: 24 }, (_, i) => Object.assign(SLOT(i), { c: i % 3 === 1 ? 0xd8a878 : 0xfaf0e0 })), { shadow: false });
  let inCount = 0;
  // the grabber: a pole from your hand with two jaws on the end
  const pole = stick(K, 0.016, K.S(0xb8c0c8, { metalness: 0.6, roughness: 0.3 })), handle = stick(K, 0.03, K.S(0x2a6ad8, { roughness: 0.6 }));
  const jaws = K.group(null), jawM = K.S(0xffc828, { roughness: 0.5 });
  const fingers = [-1, 1].map((s) => { const f = K.group(jaws); K.part(f, K.box(0.025, 0.012, 0.1), jawM, [s * 0.02, 0, 0.05]); K.part(f, K.box(0.03, 0.03, 0.02), jawM, [s * 0.006, 0, 0.1]); return f; });
  const glow = K.sprite(0x8affb0, 0.4, EGG.toArray(), 0);
  const hand = new THREE.Vector3(), tip = new THREE.Vector3(), rest = new THREE.Vector3(), tmp = new THREE.Vector3(), side = new THREE.Vector3(), goal = new THREE.Vector3();
  let cu = 0, close = 0, wobble = 0;
  return {
    fov: 60, fovTall: 78, gauge: "v", flip: true,
    update(v, t, dt) {
      for (const h of hens) if (h.idle) h.idle(t);
      const u = clamp(v.u, 0, 1.25); cu = damp(cu, u, 6, dt); const e = ease(Math.min(1, cu));
      cam.position.set(0, lerp(1.25, 1.06, e), lerp(1.95, 1.62, e)); cam.rotation.set(lerp(-0.34, -1.02, e) - Math.max(0, cu - 1) * 0.3, 0, 0);
      cam.updateMatrixWorld();
      camPt(cam, 0.2, -0.3, -0.35, hand); camPt(cam, 0.08, -0.22, -0.95, rest);
      tip.lerpVectors(rest, tmp.copy(EGG).add(new THREE.Vector3(0, 0.06, 0.02)), e);
      const holding = v.state === "move" && v.u >= 0.9;
      close = damp(close, holding ? 1 : 0, 8, dt);
      handle(hand, tmp.lerpVectors(hand, tip, 0.2)); pole(tmp.copy(hand), tip);
      jaws.position.copy(tip); jaws.lookAt(tmp.copy(tip).multiplyScalar(2).sub(hand));
      fingers[0].rotation.y = 0.45 * (1 - close); fingers[1].rotation.y = -0.45 * (1 - close);
      // the egg wobbles and lifts in the jaws while you hold
      wobble = holding ? v.prog : damp(wobble, 0, 6, dt);
      if (cur) {
        pop = Math.min(1, pop + dt * 2); cur.scale.set(1, 1.3, 1).multiplyScalar(Math.max(0.001, ease(pop)));
        cur.position.copy(EGG); cur.position.y += wobble * 0.05; cur.rotation.z = holding && !K.calm ? Math.sin(t * 22) * 0.12 * v.prog : 0;
      }
      glow.material.opacity = v.state === "move" ? 0.25 + v.prog * 0.5 : 0; glow.scale.setScalar(0.35 + v.prog * 0.3);
      if (v.fresh && cur) { flying.push({ g: cur, from: cur.position.clone(), t: 0, brown: cur.material === brown }); cur = null; laid = 0.9; }
      if (!cur && (laid -= dt) <= 0) { cur = egg(inCount % 3 === 0 ? brown : shell); pop = -0.2; }
      hen.g.position.y = laid > 0 && !K.calm ? Math.abs(Math.sin(t * 12)) * 0.08 : 0;
      if (hen.idle) hen.idle(t);
      flying = flying.filter((f) => {
        f.t += dt; const k = clamp(f.t / 0.8, 0, 1), to = SLOT(Math.min(inCount, 23));
        f.g.position.lerpVectors(f.from, tmp.set(to.x, to.y, to.z), ease(k)); f.g.position.y += Math.sin(k * PI) * 0.3; f.g.rotation.x += dt * 6;
        if (k >= 1) { f.g.visible = false; if (inCount < 24) { K.setInst(inBasket, inCount, Object.assign(to, { s: 1 })); inBasket.instanceMatrix.needsUpdate = true; } inCount++; return false; }
        return true;
      });
    },
    focus(p) { p.copy(EGG); },
  };
});

// ================================================================ 22. Knees Apart (Reach, knee out to the side)
// A butterfly on a giant daisy. Moving your knee out opens its wings; hold them open and it flies off to
// rest in the garden, and the next butterfly lands.
P3.add("kneeout", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.5, 0.45, -1], sun: 1.2 });
  meadow(K); shadowBox(K, 6); backdrop(K);
  trees(K, K.ring(24, 16, 70, { free: true, ok: (x, z) => z < -5 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.1, 1.7) })));
  flowers(K, 220, [-8, 8, -10, -0.6]);
  // the giant daisy
  const F = new THREE.Vector3(0, 1.0, 0);
  K.part(null, K.cyl(0.03, 0.04, 1.0, 6), K.M(0x4a9a3a), [0, 0.5, 0]);
  for (const s of [-1, 1]) K.part(null, K.sph(1, 8, 6), K.M(0x4a9a3a), [s * 0.14, 0.42, 0], [0, 0, s * 0.6], [0.16, 0.03, 0.07]);
  const head = K.group(null, F.toArray(), [0.25, 0, 0]);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; K.part(head, K.sph(1, 8, 6), K.S(0xffffff, { roughness: 0.7 }), [Math.cos(a) * 0.28, 0, Math.sin(a) * 0.28], [0, -a, 0], [0.2, 0.025, 0.065]); }
  K.part(head, K.sph(0.12, 14, 10), K.S(0xffc020, { roughness: 0.8 }), [0, 0.0, 0], null, [1, 0.45, 1]);
  // flowers round the garden where the butterflies rest
  const NS = clamp(S.reps || 10, 6, 14), spots = [];
  for (let i = 0; i < NS; i++) {
    const a = -1.15 + (i / (NS - 1)) * 2.3, r = 2.4 + (i % 2) * 0.9, p = new THREE.Vector3(Math.sin(a) * r, 0.55 + (i % 3) * 0.12, -Math.cos(a) * r * 0.8 - 0.4);
    K.part(null, K.cyl(0.015, 0.02, p.y, 5), K.M(0x4a9a3a), [p.x, p.y / 2, p.z]);
    const c = [0xff7aa8, 0xffd23a, 0xb48aff, 0xff9a4a, 0x7ad0ff][i % 5];
    for (let j = 0; j < 6; j++) K.part(null, K.sph(1, 6, 5), K.S(c), [p.x + Math.cos((j * PI) / 3) * 0.08, p.y, p.z + Math.sin((j * PI) / 3) * 0.08], null, [0.07, 0.02, 0.07], true);
    K.part(null, K.sph(0.04, 8, 6), K.S(0xffe060), [p.x, p.y + 0.01, p.z], null, null, true);
    spots.push(p);
  }
  // butterflies: a body and two textured wings that hinge along it
  const SETS = [["#ff9a2a", "#ffd27a", "#1a1008"], ["#2a7aff", "#9ad8ff", "#0a1a40"], ["#ffd82a", "#fff6a0", "#3a2a0a"], ["#ff5aa0", "#ffc0e0", "#40102a"], ["#9a5aff", "#e0c8ff", "#20103a"], ["#2ac88a", "#b8f8d8", "#0a2a1a"]];
  const wingGeo = new THREE.PlaneGeometry(0.3, 0.34).rotateX(-PI / 2).translate(-0.15, 0, 0);
  const wingTex = (c) => K.tex(256, 256, (g, w, h) => {
    const lobe = (cx, cy, rx, ry, rot) => { g.beginPath(); g.ellipse(cx, cy, rx, ry, rot, 0, PI * 2); };
    for (const pass of [0, 1]) {
      const grd = g.createRadialGradient(w, h * 0.5, 10, w, h * 0.5, w); grd.addColorStop(0, c[1]); grd.addColorStop(0.55, c[0]); grd.addColorStop(1, c[0]);
      g.fillStyle = pass ? grd : c[2];
      const k = pass ? 0.9 : 1;
      lobe(w * 0.47, h * 0.66, w * 0.45 * k, h * 0.3 * k, -0.35); g.fill();
      lobe(w * 0.62, h * 0.3, w * 0.34 * k, h * 0.26 * k, 0.3); g.fill();
    }
    g.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(w * (0.12 + i * 0.07), h * (0.8 - i * 0.04), 7, 0, PI * 2); g.fill(); }
    g.strokeStyle = c[2]; g.lineWidth = 4; g.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(w, h * 0.5); g.lineTo(w * (0.1 + i * 0.15), h * (0.55 + i * 0.08)); g.stroke(); }
  });
  function butterfly(i) {
    const c = SETS[i % SETS.length], g = K.group(null, null, null, 1.7), mat = new THREE.MeshStandardMaterial({ map: wingTex(c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
    const dark = K.S(0x2a2028, { roughness: 0.6 });
    K.part(g, K.sph(1, 10, 8), dark, [0, 0.02, 0], null, [0.022, 0.022, 0.13]);
    K.part(g, K.sph(0.03, 10, 8), dark, [0, 0.03, 0.13]);
    for (const s of [-1, 1]) { K.part(g, K.cyl(0.003, 0.003, 0.12, 3), dark, [s * 0.025, 0.08, 0.18], [0.7, 0, -s * 0.3], null, true); K.part(g, K.sph(0.008, 6, 4), dark, [s * 0.042, 0.125, 0.22], null, null, true); }
    const hinge = [-1, 1].map((s) => { const side = K.group(g, [0, 0.03, 0], null, [s, 1, 1]), h = K.group(side); K.part(h, wingGeo, mat, null, null, null, true); return h; });
    return { g, hinge, flap: 0 };
  }
  let n = 0, cur = butterfly(n++), arrive = 1, flying = [], resting = [];
  const IN = new THREE.Vector3(-3, 2.4, 1.2), LAND = new THREE.Vector3(F.x, F.y + 0.08, F.z + 0.02), glow = K.sprite(0xfff0a0, 1.6, [F.x, F.y + 0.12, F.z - 0.05], 0);
  const setWings = (b, ang) => { b.hinge[0].rotation.z = ang; b.hinge[1].rotation.z = ang; };
  cam.position.set(0, 1.72, 1.3); cam.lookAt(0, 1.1, -0.05);
  let open = 0;
  return {
    fov: 50, fovTall: 70, gauge: "h",
    update(v, t, dt) {
      open = damp(open, clamp(v.state === "return" ? v.u * 0.7 : v.u, 0, 1.15), 10, dt);
      if (cur) {
        if (arrive < 1) {
          arrive = Math.min(1, arrive + dt * 0.8); const k = ease(arrive);
          cur.g.position.lerpVectors(IN, LAND, k); cur.g.position.y += Math.sin(k * PI) * 0.4; cur.g.rotation.y = lerp(1.2, 0, k);
          setWings(cur, -0.7 + Math.sin(t * 18) * 0.7);
        } else {
          cur.g.position.copy(LAND); cur.g.rotation.y = 0;
          const flutter = v.state === "move" && v.u >= 0.9 && !K.calm ? Math.sin(t * 9) * 0.06 : 0;
          setWings(cur, -(1 - Math.min(1, open)) * 1.45 + Math.max(0, open - 1) * 0.6 + flutter);
        }
      }
      glow.material.opacity = v.state === "move" ? v.prog * 0.7 : 0;
      if (v.fresh && cur) { flying.push({ b: cur, from: cur.g.position.clone(), to: spots[(n - 1) % spots.length].clone().add(new THREE.Vector3(0, 0.05, 0)), t: 0 }); cur = null; }
      if (!cur && !flying.some((f) => f.t < 0.5)) { cur = butterfly(n++); arrive = 0; cur.g.position.copy(IN); }
      flying = flying.filter((f) => {
        f.t += dt; const k = clamp(f.t / 2.2, 0, 1);
        f.b.g.position.lerpVectors(f.from, f.to, ease(k)); f.b.g.position.y += Math.sin(k * PI) * 0.9; f.b.g.rotation.y = Math.atan2(f.to.x - f.from.x, f.to.z - f.from.z) * (1 - k);
        f.b.g.scale.setScalar(lerp(1.7, 0.8, ease(k))); setWings(f.b, -0.7 + Math.sin(t * 20) * 0.7);
        if (k >= 1) { resting.push({ b: f.b, ph: K.R(0, 6) }); return false; }
        return true;
      });
      for (const r of resting) setWings(r.b, K.calm ? -0.3 : -0.5 + Math.sin(t * 1.6 + r.ph) * 0.5);
    },
    focus(p) { p.copy(LAND); },
  };
});

// ================================================================ 23. Foot Lift (Reach, toes up)
// A marble run on the garden table. Lifting the front of your foot lifts the far end of the ramp; hold it
// up and the marble rolls down and drops into the jar.
P3.add("foottilt", (K, THREE, cam) => {
  sunny(K, { sunDir: [-0.5, 0.45, -1], sun: 1.1, dir: [-0.4, 0.9, 0.5] });
  meadow(K); shadowBox(K, 5); backdrop(K);
  trees(K, K.ring(26, 12, 60, { free: true, ok: (x, z) => z < -4 || x < -6 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  flowers(K, 140, [-6, 6, -6, -2]);
  // table
  const wood = new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#b07a4a"), roughness: 0.7 });
  K.part(null, K.box(1.4, 0.07, 2.4), wood, [0, 0.75, -0.2]);
  for (const [x, z] of [[-0.6, -1.3], [0.6, -1.3], [-0.6, 0.9], [0.6, 0.9]]) K.part(null, K.box(0.07, 0.75, 0.07), K.M(0x8a5a36), [x, 0.375, z]);
  // the ramp, hinged on a block at the near end
  const HY = 1.08, HZ = 0.42, L = 1.5;
  K.part(null, K.box(0.34, HY - 0.79, 0.16), K.M(0x5a8ad8), [0, (HY + 0.79) / 2 - 0.02, HZ]);
  const ramp = K.group(null, [0, HY, HZ]);
  K.part(ramp, K.box(0.2, 0.03, L), K.M(0xffd23a), [0, 0, -L / 2]);
  for (const s of [-1, 1]) K.part(ramp, K.box(0.03, 0.06, L), K.M(0xe84a3a), [s * 0.11, 0.02, -L / 2]);
  for (let i = 0; i < 6; i++) K.part(ramp, K.box(0.2, 0.032, 0.04), K.M(0xff8a2a), [0, 0.001, -0.15 - i * 0.24], null, null, true);
  K.part(ramp, K.box(0.24, 0.1, 0.04), K.M(0xe84a3a), [0, 0.05, -L + 0.02]);
  // a prop under the far end shows where it rests
  K.part(null, K.box(0.14, 0.24, 0.14), K.M(0x5a8ad8), [0, 0.9, HZ - L + 0.08]);
  // chute that drops a new marble in
  K.part(null, K.cyl(0.07, 0.07, 0.5, 12, 1), glassMat(THREE, { opacity: 0.35 }), [0, 1.55, HZ - L + 0.1]);
  // glass jar at the near end
  const J = new THREE.Vector3(0, 0.79, 0.74);
  K.part(null, K.cyl(0.16, 0.16, 0.3, 20, 1, true), glassMat(THREE), [J.x, J.y + 0.15, J.z]);
  K.part(null, K.cyl(0.16, 0.16, 0.01, 20), glassMat(THREE, { opacity: 0.4 }), [J.x, J.y + 0.005, J.z]);
  K.part(null, K.tor(0.16, 0.012, 6, 24), glassMat(THREE, { opacity: 0.5 }), [J.x, J.y + 0.3, J.z], [PI / 2, 0, 0]);
  const COLS = [0xe8342a, 0x2a7ae8, 0x2ab85a, 0xffc828, 0xb44aff, 0xff7a2a, 0x2ad0d0];
  const SLOT = (i) => { const layer = Math.floor(i / 7), k = i % 7, a = k * 0.9 + layer * 0.45, r = k ? 0.09 : 0; return { x: J.x + Math.cos(a) * r, y: J.y + 0.045 + layer * 0.075, z: J.z + Math.sin(a) * r }; };
  const jar = K.inst(K.sph(0.042, 14, 10), K.S(0xffffff, { roughness: 0.08, metalness: 0.1 }), Array.from({ length: 28 }, (_, i) => Object.assign(SLOT(i), { s: 0.001, c: COLS[i % COLS.length] })), { shadow: false });
  let inJar = 0;
  const marble = (i) => K.part(null, K.sph(0.042, 16, 12), K.S(COLS[i % COLS.length], { roughness: 0.08, metalness: 0.1 }));
  let cur = marble(0), drop = 1, falling = [], ang = 0, roll = 0;
  const tmp = new THREE.Vector3(), glow = K.sprite(0x8affb0, 0.5, null, 0);
  cam.position.set(2.05, 1.55, 1.0); cam.lookAt(0, 1.02, -0.32);
  return {
    fov: 52, fovTall: 72, gauge: "v",
    update(v, t, dt) {
      const want = clamp(v.state === "return" ? v.u * 0.8 : v.u, 0, 1.25) * 0.24;
      ang = damp(ang, want, 9, dt); ramp.rotation.x = ang;
      const holding = v.state === "move" && v.u >= 0.9;
      roll = damp(roll, holding ? v.prog : 0, holding ? 14 : 3, dt);
      if (cur) {
        drop = Math.min(1, drop + dt * 2.2);
        const z = -L + 0.12 + roll * (L - 0.2);
        tmp.set(0, 0.055, z); ramp.localToWorld(tmp);
        if (drop < 1) tmp.y += (1 - ease(drop)) * 0.5;
        cur.position.copy(tmp); cur.rotation.x = -roll * (L / 0.042);
        glow.position.copy(tmp); glow.material.opacity = holding ? 0.3 + v.prog * 0.4 : 0;
      }
      if (v.fresh && cur) { falling.push({ g: cur, from: cur.position.clone(), t: 0, i: inJar }); cur = null; }
      if (!cur && !falling.some((f) => f.t < 0.5)) { cur = marble(inJar + falling.length); drop = 0; roll = 0; }
      falling = falling.filter((f) => {
        f.t += dt; const k = clamp(f.t / 0.55, 0, 1), s = SLOT(Math.min(f.i, 27));
        f.g.position.set(lerp(f.from.x, s.x, k), lerp(f.from.y, s.y, k * k) + Math.sin(k * PI) * 0.12, lerp(f.from.z, s.z, k));
        if (k >= 1) { f.g.visible = false; if (f.i < 28) { K.setInst(jar, f.i, Object.assign(s, { s: 1 })); jar.instanceMatrix.needsUpdate = true; } inJar++; return false; }
        return true;
      });
    },
    focus(p) { p.copy(J).add(new THREE.Vector3(0, 0.3, 0)); },
  };
});

// ================================================================ 24. Standing Weight Shift (Swing, side to side)
// A penguin waddles across the ice to its family. Shift your weight and it leans the same way (you see it
// from behind); each shift that reaches the ring is a waddle step.
P3.add("standshift", (K, THREE, cam, S) => {
  K.sky(0x5a9ae0, 0xc8e4f8, 0xf4f8fc, { sunDir: [0.4, 0.35, -1], sun: 1.0, sunColor: 0xfff6e0, horizon: 0.14 });
  K.scene.fog = new THREE.Fog(0xe0eef8, 40, 200);
  K.lights({ sky: 0xf0f6ff, ground: 0x8aa0b8, hemi: 1.05, sun: 0xfff2e0, sunI: 1.7, dir: [0.5, 0.7, 0.5] });
  const steps = Math.max(2, (S.reps || 10) * 2), STEP = Math.min(0.42, 12 / steps), D = steps * STEP, END = -D - 1.4;
  K.ground({ size: 300, seg: 100, h: (x, z) => (z < END - 2.5 ? -1.2 : Math.abs(x) > 4 ? K.fbm(x * 0.08, z * 0.08) * 1.6 * Math.min(1, (Math.abs(x) - 4) / 4) : 0), color: (x, z, y) => (y < -0.5 ? 0x9ab8d0 : K.mix(0xe8f0f8, 0xc4d6e8, K.fbm(x * 0.3, z * 0.3))) });
  shadowBox(K, 8);
  K.water({ size: 400, seg: 60, color: 0x2a6aa8, y: -0.35, z: END - 200, amp: 0.06 });
  K.peaks(10, 160, 230, 25, 55, 0xe8f0f8, { snow: 0xffffff });
  K.clouds(10);
  K.inst(K.ico(1, 0), K.M(0xf4faff, { roughness: 0.6 }), Array.from({ length: 14 }, () => ({ x: K.R(-40, 40), y: 0, z: END - K.R(8, 60), sx: K.R(1.5, 5), sy: K.R(1.5, 4), sz: K.R(1.5, 4), ry: K.R(0, 6) })));
  // ice blocks, a snowman and seals along the way
  K.inst(K.box(0.6, 0.4, 0.5), K.M(0xd8ecf8, { roughness: 0.3 }), Array.from({ length: 22 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * K.R(1.8, 4.5), y: 0.15, z: -K.R(0, D + 2), ry: K.R(0, 3), s: K.R(0.6, 1.4) })));
  const snowman = animal(K, "snowman", 1.3); snowman.g.position.set(-2.2, 0, -D * 0.35); snowman.g.rotation.y = 0.6;
  const seal = animal(K, "seal", 0.5); seal.g.position.set(2.0, 0, -D * 0.6); seal.g.rotation.y = -1.1;
  // the family waiting at the end, with a bucket of fish
  const family = [[-0.7, 0.75, 0.3], [0.7, 0.62, -0.3], [0.05, 0.5, 0]].map(([x, h, r]) => { const p = animal(K, "penguin", h); p.g.position.set(x, 0, END - 0.3); p.g.rotation.y = r; return p; });
  K.part(null, K.cyl(0.2, 0.16, 0.3, 14), K.M(0x5a8ad8), [1.4, 0.15, END]);
  for (let i = 0; i < 4; i++) K.part(null, K.cone(0.05, 0.22, 5), K.S(0x9ab0c0, { metalness: 0.3 }), [1.4 + Math.cos(i * 1.6) * 0.07, 0.34, END + Math.sin(i * 1.6) * 0.07], [0.3 * Math.cos(i), 0, PI + 0.3 * Math.sin(i)]);
  const flagG = K.group(null, [-1.4, 0, END + 0.2]); K.part(flagG, K.cyl(0.03, 0.03, 1.6, 6), K.M(0xd8d8d8), [0, 0.8, 0]);
  const cloth = K.part(flagG, K.box(0.6, 0.38, 0.02), K.M(0xff5a6a), [0.3, 1.38, 0]);
  // our penguin, seen from behind
  const lean = K.group(null), hop = K.group(lean), pg = bare(K, "penguin", [1, 2], 0.9, hop); pg.g.rotation.y = PI;
  const rings = [1, -1].map((s) => target(K, [s * 0.55, 0.8, 0], 0.12)), ringGlow = K.sprite(0x8affb0, 0.5, null, 0);
  const igloo = K.group(null, [2.6, 0, END - 0.8]); K.part(igloo, K.hemi(1.1, 16), K.S(0xf4faff, { roughness: 0.5 })); K.part(igloo, K.cyl(0.42, 0.42, 0.9, 12, 1, false), K.S(0xf4faff, { roughness: 0.5 }), [-0.75, 0.3, 0.7], [PI / 2, 0, 0.9], [1, 1, 0.8]); K.part(igloo, K.circle(0.3, 14), K.M(0x2a3a4a), [-1.08, 0.3, 1.0], [0, -0.68, 0]);
  const prints = K.inst(K.sph(0.06, 8, 6), K.M(0xb8cce0), Array.from({ length: steps }, () => ({ s: 0.001 })), { shadow: false });
  let pz = 0, goalZ = 0, done = 0, lastSide = 0, tilt = 0, hopT = 1, cheer = 0;
  return {
    fov: 56, fovTall: 74, gauge: "h",
    update(v, t, dt) {
      if (v.side !== lastSide || v.fresh) {
        if (done < steps) { const sx = done % 2 ? 0.1 : -0.1; K.setInst(prints, done, { x: sx, y: 0.005, z: pz, sx: 1, sy: 0.15, sz: 1.4 }); prints.instanceMatrix.needsUpdate = true; }
        done++; goalZ = -Math.min(D, done * STEP); hopT = 0; lastSide = v.side;
      }
      if (done >= steps && cheer === 0) cheer = 0.001;
      pz = damp(pz, goalZ, 5, dt); hopT = Math.min(1, hopT + dt * 3);
      tilt = damp(tilt, clamp(v.x, -1.3, 1.3), 10, dt);
      lean.position.set(0, 0, pz); lean.rotation.z = -tilt * 0.32;
      hop.position.y = Math.sin(hopT * PI) * 0.1; hop.rotation.y = Math.sin(hopT * PI) * 0.15 * (done % 2 ? 1 : -1);
      const plus = v.targets[v.side] > 0;
      rings.forEach((r, i) => { const ring = r((i === 0) === plus, t); ring.position.set(i === 0 ? 0.55 : -0.55, 0.8, pz); ring.lookAt(cam.position); });
      ringGlow.position.set(plus ? 0.55 : -0.55, 0.8, pz); ringGlow.material.opacity = v.prog * 0.8;
      if (cheer > 0) { cheer += dt; family.forEach((f, i) => { f.g.position.y = Math.abs(Math.sin(cheer * 6 + i)) * 0.18; }); }
      for (const f of family) if (f.idle) f.idle(t);
      cloth.rotation.y = Math.sin(t * 2) * 0.2;
      cam.position.set(0, 1.4, pz + 2.5); cam.lookAt(0, 0.72, pz - 1.6); if (pg.idle) pg.idle(t);
    },
    focus(p) { p.set(0, 0.9, pz); },
  };
});

// ================================================================ 25. Mini Squats (Reach, bend the knees)
// A frog hops across the pond. Bend your knees and the frog crouches; hold it and it leaps to the next
// lily pad, all the way to its friends on the log.
P3.add("minisquat", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.5, 0.42, -1], sun: 1.1 });
  const n = clamp(S.reps || 10, 3, 24), GAP = 1.05, pads = [];
  for (let i = 0; i <= n; i++) pads.push(new THREE.Vector3(Math.sin(i * 0.9) * 0.7, 0.02, -i * GAP));
  const inPond = (x, z) => Math.abs(x - Math.sin(-z / GAP * 0.9) * 0.5) < 3.2 && z < 2.5 && z > -n * GAP - 4;
  K.ground({ size: 300, seg: 120, h: (x, z) => (inPond(x, z) ? -0.5 : 0.15 + (z < -n * GAP - 14 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 10 : K.fbm(x * 0.2, z * 0.2) * 0.4)), color: (x, z, y) => (y < -0.2 ? 0x6a5a3a : K.mix(0x5a9a40, 0x8ac458, K.fbm(x * 0.15, z * 0.15))) });
  K.water({ size: 300, seg: 80, color: 0x3a8a9a, y: -0.02, opacity: 0.85, amp: 0.025 });
  shadowBox(K, 8); backdrop(K);
  trees(K, K.ring(40, 9, 70, { free: true, ok: (x, z) => !inPond(x, z) && Math.abs(x) > 4.5 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  // reeds and cattails along the banks
  const reeds = [];
  for (let i = 0; i < 160; i++) { const z = K.R(-n * GAP - 3, 2), s = K.pick([-1, 1]), x = Math.sin(-z / GAP * 0.9) * 0.5 + s * K.R(2.6, 3.4); reeds.push({ x, y: 0.2, z, sy: K.R(0.8, 1.6), s: 1, rz: K.R(-0.15, 0.15) }); }
  K.inst(K.cyl(0.012, 0.018, 0.9, 4), K.swayM(0x5a8a3a, 0.06, 1.4), reeds);
  K.inst(K.cyl(0.03, 0.03, 0.14, 6), K.M(0x6a3a1a), reeds.filter((_, i) => i % 3 === 0).map((r) => ({ x: r.x, y: 0.2 + 0.45 * r.sy - 0.04, z: r.z })), { shadow: false });
  // lily pads
  const padGeo = new THREE.CircleGeometry(0.4, 22, 0.25, PI * 2 - 0.5).rotateX(-PI / 2), padM = K.M(0x4a9a3a, { side: THREE.DoubleSide });
  const padMeshes = pads.map((p, i) => { const m = K.part(null, padGeo, padM, [p.x, p.y, p.z], [0, K.R(0, 6), 0]); if (i % 3 === 2) { for (let j = 0; j < 6; j++) K.part(m, K.sph(1, 6, 4), K.S(0xff9ac8), [0.18 + Math.cos(j) * 0.05, 0.05, Math.sin(j) * 0.05], [0, j, 0.6], [0.06, 0.025, 0.03], true); } return m; });
  // the log at the far side with friends on it
  const E = pads[n];
  K.part(null, K.cyl(0.28, 0.3, 2.4, 10), K.M(0x7a5232), [E.x, 0.05, E.z - 0.7], [0, 0, PI / 2]);
  const friends = [-0.7, 0.75].map((x, i) => { const f = bare(K, "frog", 2, 0.3); f.g.position.set(E.x + x, 0.3, E.z - 0.7); f.g.rotation.y = i ? -0.4 : 0.4; return f; });
  // dragonflies
  const flies = [0, 1].map((i) => { const g = K.group(null); K.part(g, K.cyl(0.008, 0.006, 0.16, 4), K.S(0x2ab8d8), null, [PI / 2, 0, 0], null, true); const w = K.part(g, K.box(0.24, 0.003, 0.04), K.M(0xe0f8ff, { transparent: true, opacity: 0.6 }), [0, 0.01, 0.02], null, null, true); return { g, w, ph: i * 3 }; });
  // the frog
  const frog = bare(K, "frog", 2, 0.3), body = frog.g;
  const sac = K.part(body, K.sph(0.05, 10, 8), K.S(0xe8f8c0), [0, 0.07, 0.11], null, 0.001, true);
  let at = 0, jumpT = 1, crouch = 0, from = pads[0].clone(), cheer = 0;
  const pos = pads[0].clone(), tmp = new THREE.Vector3(), look = new THREE.Vector3(-0.3, 0, -1.0);
  cam.position.set(1.9, 0.95, 0.25);
  return {
    fov: 55, fovTall: 74, gauge: "v", flip: true,
    update(v, t, dt) {
      if (v.fresh && at < n) { from = pos.clone(); at++; jumpT = 0; }
      const to = pads[at];
      if (jumpT < 1) {
        jumpT = Math.min(1, jumpT + dt * 1.6); const k = ease(jumpT);
        pos.lerpVectors(from, to, k); pos.y = to.y + Math.sin(jumpT * PI) * 0.75; crouch = damp(crouch, -0.25, 12, dt);
        if (jumpT >= 1) { padMeshes[at].position.y = -0.04; if (at >= n) cheer = 0.001; }
      } else { pos.copy(to); crouch = damp(crouch, clamp(v.state === "return" ? 0 : v.u, 0, 1.2), 10, dt); }
      padMeshes.forEach((m, i) => { m.position.y = damp(m.position.y, pads[i].y, 4, dt); });
      body.position.copy(pos); body.position.y += 0.02;
      const nx = pads[Math.min(n, at + 1)]; if (at < n) body.rotation.y = Math.atan2(nx.x - pos.x, nx.z - pos.z);
      body.scale.set(1 + crouch * 0.12, Math.max(0.6, 1 - crouch * 0.33), 1 + crouch * 0.12).multiplyScalar(body.userData.s || (body.userData.s = body.scale.x));
      const holding = v.state === "move" && v.u >= 0.9;
      sac.scale.setScalar(holding ? 0.3 + v.prog * 0.9 : 0.001);
      if (cheer > 0) { cheer += dt; friends.forEach((f, i) => { f.g.position.y = 0.3 + Math.abs(Math.sin(cheer * 5 + i)) * 0.25; }); }
      flies.forEach((f) => { const a = t * 0.6 + f.ph; f.g.position.set(pos.x + Math.sin(a) * 1.6, 0.6 + Math.sin(a * 2.3) * 0.15, pos.z - 1 + Math.cos(a * 0.7) * 1.2); f.g.rotation.y = a; f.w.scale.x = K.calm ? 1 : 0.6 + Math.abs(Math.sin(t * 40)) * 0.4; });
      tmp.set(pos.x + 1.9, 0.95, pos.z + 0.25); cam.position.x = damp(cam.position.x, tmp.x, 4, dt); cam.position.y = 0.95; cam.position.z = damp(cam.position.z, tmp.z, 4, dt);
      look.x = damp(look.x, pos.x - 0.3, 4, dt); look.z = damp(look.z, pos.z - 1.0, 4, dt); cam.lookAt(look.x, 0.25, look.z);
    },
    focus(p) { p.copy(pos).add(new THREE.Vector3(0, 0.2, 0)); },
  };
});

// ================================================================ 26. Lean Forward and Hold (Hold, lean forward)
// A garden party. Leaning forward brings you close to the birthday cake; hold the lean and you blow the
// candles out one by one. Then the next cake comes.
P3.add("leanhold", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.4, 0.4, -1], sun: 1.1, dir: [0.5, 0.85, 0.6] });
  meadow(K); shadowBox(K, 5); backdrop(K);
  trees(K, K.ring(26, 9, 60, { free: true, ok: (x, z) => z < -3 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  flowers(K, 120, [-6, 6, -6, -1.5]);
  // table with a cloth
  K.part(null, K.box(1.3, 0.05, 0.9), K.M(0xffffff), [0, 0.74, -0.05]);
  K.part(null, K.box(1.34, 0.16, 0.94), K.M(0xff9ab8), [0, 0.66, -0.05]);
  for (const [x, z] of [[-0.58, -0.42], [0.58, -0.42], [-0.58, 0.32], [0.58, 0.32]]) K.part(null, K.cyl(0.03, 0.03, 0.72, 6), K.M(0xf4f0e8), [x, 0.36, z]);
  // bunting between two poles
  for (const x of [-2.2, 2.2]) K.part(null, K.cyl(0.04, 0.05, 2.4, 6), K.M(0xf4f0e8), [x, 1.2, -1.6]);
  const bunt = []; for (let i = 0; i < 17; i++) { const x = -2.1 + i * 0.26, y = 2.25 - Math.sin((i / 16) * PI) * 0.4; bunt.push({ x, y: y - 0.12, z: -1.6, rx: PI, sx: 0.12, sy: 0.22, sz: 0.02, c: [0xff5a6a, 0xffd23a, 0x5ab4f0, 0x6ad89a, 0xb48aff][i % 5] }); }
  K.inst(K.cone(1, 1, 3), K.M(0xffffff, { side: THREE.DoubleSide }), bunt, { shadow: false });
  // balloons tied to the table, and guests in party hats
  const balloons = [[-0.6, 0xff5a6a, 0.55], [0.6, 0x5ab4f0, 0.62], [-0.48, 0xffd23a, 0.7]].map(([x, c, h], i) => { const g = K.group(null, [x, 0.77, -0.45 + i * 0.04]); K.part(g, K.cyl(0.003, 0.003, h, 3), K.M(0xffffff), [0, h / 2, 0], null, null, true); K.part(g, K.sph(0.11, 16, 12), K.S(c, { roughness: 0.25 }), [0, h + 0.1, 0], null, [1, 1.18, 1]); return g; });
  const guests = [["rabbit", -1.25, 0.8], ["panda", 1.3, -0.8]].map(([k, x, r], i) => { const a = animal(K, k, 0.95); a.g.position.set(x * 0.62, 0, -0.95); a.g.rotation.y = r * 0.35; const hat = K.part(a.g, K.cone(0.11, 0.3, 12), K.S([0x5ab4f0, 0xff5a6a][i]), [0, 0, 0], null, null, true); return { a, hat }; });
  // cakes: two tiers of frosting with candles on top
  const FROST = [[0xffc8dc, 0xfff6e8], [0xb8e0ff, 0xffffff], [0xfff0a0, 0xffb8d0], [0xc8f0c0, 0xffe8f0], [0xe0c8ff, 0xfff0a0]];
  const NC = 6;
  function cake(i) {
    const g = K.group(null), [c1, c2] = FROST[i % FROST.length];
    K.part(g, K.cyl(0.36, 0.36, 0.02, 24), K.S(0xf0f0f0), [0, 0.01, 0]);
    K.part(g, K.cyl(0.28, 0.28, 0.2, 24), K.S(c1, { roughness: 0.6 }), [0, 0.12, 0]);
    K.part(g, K.cyl(0.19, 0.19, 0.14, 24), K.S(c2, { roughness: 0.6 }), [0, 0.29, 0]);
    for (let j = 0; j < 14; j++) { const a = (j / 14) * PI * 2; K.part(g, K.sph(0.035, 8, 6), K.S(c2), [Math.cos(a) * 0.28, 0.21, Math.sin(a) * 0.28], null, [1, 1.4, 1], true); }
    K.inst(K.box(0.02, 0.008, 0.008), K.M(0xffffff), Array.from({ length: 40 }, () => { const a = K.R(0, 6.3), r = K.R(0.03, 0.18); return { x: Math.cos(a) * r, y: 0.365, z: Math.sin(a) * r, ry: K.R(0, 3), c: K.pick([0xff5a6a, 0x5ab4f0, 0xffd23a, 0x6ad89a]) }; }), { parent: g, shadow: false });
    const candles = [];
    for (let j = 0; j < NC; j++) {
      const a = (j / NC) * PI * 2, p = [Math.cos(a) * 0.12, 0.36, Math.sin(a) * 0.12];
      K.part(g, K.cyl(0.011, 0.011, 0.085, 8), K.S([0xff5a6a, 0x5ab4f0, 0xffd23a, 0x6ad89a, 0xb48aff, 0xff9a4a][j]), [p[0], p[1] + 0.043, p[2]]);
      const fl = K.group(g, [p[0], p[1] + 0.11, p[2]]);
      K.part(fl, K.sph(0.018, 8, 6), K.E(0xffb030), [0, 0.012, 0], null, [1, 1.7, 1], true);
      const halo = K.sprite(0xffc860, 0.16, null, 0.85, fl);
      candles.push({ fl, halo, out: false, smoke: 0, p });
    }
    return { g, candles };
  }
  const C = new THREE.Vector3(0, 0.765, -0.05);
  let k = 0, cur = cake(k++), slide = 1, leaving = null, cu = 0;
  cur.g.position.copy(C);
  const smoke = K.inst(K.sph(0.025, 6, 5), K.M(0xd8d8d8, { transparent: true, opacity: 0.6 }), Array.from({ length: NC }, () => ({ s: 0.001 })), { shadow: false });
  const conf = []; const confM = K.inst(K.box(0.03, 0.005, 0.02), K.M(0xffffff, { side: THREE.DoubleSide }), Array.from({ length: 50 }, (_, i) => ({ s: 0.001, c: [0xff5a6a, 0x5ab4f0, 0xffd23a, 0x6ad89a, 0xb48aff][i % 5] })), { shadow: false });
  return {
    fov: 55, fovTall: 74, gauge: "v",
    update(v, t, dt) {
      cu = damp(cu, clamp(v.u, 0, 1.4), 5, dt); const e = Math.min(1.4, cu);
      cam.position.set(0, lerp(1.55, 1.4, Math.min(1, e)) - Math.max(0, e - 1) * 0.1, lerp(1.55, 0.95, Math.min(1, e)) - Math.max(0, e - 1) * 0.2);
      cam.lookAt(0, lerp(1.0, 1.06, Math.min(1, e)), -0.1);
      const blowing = v.state === "go" && v.inBand;
      if (cur) {
        if (slide < 1) { slide = Math.min(1, slide + dt * 1.3); cur.g.position.set(lerp(2.4, 0, ease(slide)), C.y, C.z); }
        const outN = v.state === "go" ? Math.floor(v.prog * NC + 1e-6) : 0;
        cur.candles.forEach((c, j) => {
          if (j < outN && !c.out) { c.out = true; c.smoke = 0.001; }
          c.fl.visible = !c.out;
          const f = K.calm ? 1 : 1 + Math.sin(t * 17 + j * 2) * 0.12;
          c.fl.scale.set(1, blowing ? f * 0.75 : f, 1); c.fl.rotation.x = blowing ? -0.6 : Math.sin(t * 3 + j) * 0.08;
          c.halo.material.opacity = blowing ? 0.5 : 0.85;
        });
      }
      if (v.fresh && cur) {
        cur.candles.forEach((c) => { if (!c.out) { c.out = true; c.smoke = 0.001; } });
        for (let i = 0; i < 50; i++) conf[i] = { p: new THREE.Vector3(C.x, C.y + 0.45, C.z), v: new THREE.Vector3(K.R(-1, 1), K.R(1.5, 3), K.R(-1, 0.6)), r: K.R(0, 6), life: 2.2 };
        leaving = { c: cur, t: -0.8 }; cur = null;
      }
      if (leaving) {
        leaving.t += dt; if (leaving.t > 0) leaving.c.g.position.x = -ease(Math.min(1, leaving.t)) * 2.6;
        if (leaving.t > 0.25 && !cur) { cur = cake(k++); slide = 0; cur.g.position.set(2.4, C.y, C.z); }
        if (leaving.t >= 1) { leaving.c.g.visible = false; leaving = null; }
      }
      for (const ck of [cur, leaving && leaving.c]) if (ck) ck.candles.forEach((c, j) => {
        if (c.smoke <= 0) return; c.smoke += dt; const s = c.smoke;
        K.setInst(smoke, j, s < 1.6 ? { x: ck.g.position.x + c.p[0], y: C.y + c.p[1] + 0.12 + s * 0.25, z: C.z + c.p[2], s: 1 + s * 1.5 } : { s: 0.001 }); smoke.instanceMatrix.needsUpdate = true; if (s >= 1.6) c.smoke = -1;
      });
      conf.forEach((c, i) => { if (!c || c.life <= 0) return; c.life -= dt; c.v.y -= 3.2 * dt; c.p.addScaledVector(c.v, dt); c.r += dt * 8; K.setInst(confM, i, c.life > 0 ? { x: c.p.x, y: Math.max(0.77, c.p.y), z: c.p.z, rx: c.r, ry: c.r * 0.7 } : { s: 0.001 }); });
      confM.instanceMatrix.needsUpdate = true;
      balloons.forEach((b, i) => { b.rotation.z = Math.sin(t * 1.1 + i * 2) * 0.06; });
      guests.forEach(({ a, hat }) => { if (a.idle) a.idle(t); hat.position.set(0, (a.g.userData.top || (a.g.userData.top = new THREE.Box3().setFromObject(a.g).max.y / a.g.scale.y)) - 0.03, 0.05); });
    },
    focus(p) { p.copy(C).add(new THREE.Vector3(0, 0.5, 0)); },
  };
});

// ================================================================ 27. Reach Across (Reach, turn the trunk)
// Feeding time at the farm fence. Turning your shoulders swings your view round to the animal waiting at
// the side; hold the carrot out while it munches, then the next animal comes up.
P3.add("crossreach", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.2, 0.45, -1], sun: 1.1, dir: [0.3, 0.9, 0.5] });
  meadow(K, { z0: -20 }); shadowBox(K, 7); backdrop(K);
  trees(K, K.ring(34, 16, 70, { free: true }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.1, 1.8) })));
  flowers(K, 200, [-8, 8, -8, 2, (x, z) => Math.hypot(x, z) > 2.2]);
  // fence round you, curving from straight ahead to the right
  const FR = 1.6, posts = [];
  for (let a = -0.5; a <= 1.9; a += 0.2) posts.push({ x: Math.sin(a) * FR, y: 0.37, z: -Math.cos(a) * FR, ry: -a });
  K.inst(K.box(0.08, 0.74, 0.08), K.M(0xf0e6d0), posts);
  K.inst(K.box(0.04, 0.07, 1), K.M(0xf0e6d0), posts.slice(1).flatMap((p, i) => { const o = posts[i], L = Math.hypot(p.x - o.x, p.z - o.z); return [0.3, 0.62].map((y) => ({ x: (p.x + o.x) / 2, y, z: (p.z + o.z) / 2, ry: Math.atan2(p.x - o.x, p.z - o.z), sz: L })); }));
  // red barn straight ahead
  const barn = K.group(null, [-3.5, 0, -11], [0, 0.35, 0]);
  K.part(barn, K.box(4, 3, 3.2), K.M(0xc8443a), [0, 1.5, 0]);
  for (const s of [-1, 1]) K.part(barn, K.box(4.3, 0.12, 2.1), K.M(0x5a4a44), [0, 3.6, s * 0.82], [s * 0.72, 0, 0]);
  K.part(barn, K.box(1.4, 1.8, 0.05), K.M(0xf4f0e8), [0, 0.9, 1.62]); K.part(barn, K.box(1.2, 1.6, 0.06), K.M(0x8a2a24), [0, 0.85, 1.63]);
  const grazers = [["cow", 1.3, [2.5, -8, 1.2]], ["sheep", 0.8, [-1.2, -6.5, -0.6]], ["horse", 1.6, [4.5, -12, -0.4]]].map(([k, h, [x, z, r]]) => { const a = animal(K, k, h); a.g.position.set(x, 0, z); a.g.rotation.y = r; return a; });
  // the feeding spot to your right, and the queue behind it
  const AF = 1.05, dir = new THREE.Vector3(Math.sin(AF), 0, -Math.cos(AF)), SPOT = dir.clone().multiplyScalar(FR + 0.5);
  const KINDS = [["sheep", 1.0], ["pig", 0.85], ["cow", 1.35], ["horse", 1.55], ["chicken", 0.75]];
  const make = (i) => { const [k, h] = KINDS[i % KINDS.length], a = animal(K, k, h); a.h = h; return a; };
  const q = [0, 1, 2].map((i) => make(i)), Q = (j) => SPOT.clone().addScaledVector(dir, 1.3 * j).add(new THREE.Vector3(j * 0.6, 0, -j * 0.4));
  q.forEach((a, j) => { a.g.position.copy(Q(j)); a.at = Q(j); });
  let next = 3, leaving = [], hearts = [];
  // your hand with a carrot
  const hand = K.group(null, null, null, 1.7), skin = K.S(0xf0c8a0, { roughness: 0.7 });
  K.part(hand, K.sph(0.06, 12, 10), skin, null, null, [1, 0.8, 1.2]);
  for (let i = 0; i < 4; i++) K.part(hand, K.cyl(0.014, 0.014, 0.07, 6), skin, [-0.03 + i * 0.02, 0.0, 0.05], [PI / 2, 0, 0]);
  const carrot = K.group(hand, [0, 0, 0.06]);
  K.part(carrot, K.cone(0.025, 0.22, 8), K.S(0xff8a2a, { roughness: 0.6 }), [0, 0, 0.11], [PI / 2, 0, 0]);
  for (let i = 0; i < 3; i++) K.part(carrot, K.cone(0.012, 0.08, 4), K.M(0x4aa83a), [0, 0, -0.03], [-PI / 2 + (i - 1) * 0.4, 0, 0], null, true);
  const heartM = K.E(0xff5a7a, { emissiveIntensity: 0.6 });
  const heart = () => { const g = K.group(null); K.part(g, K.sph(0.05, 8, 6), heartM, [-0.035, 0, 0], null, null, true); K.part(g, K.sph(0.05, 8, 6), heartM, [0.035, 0, 0], null, null, true); K.part(g, K.cone(0.07, 0.09, 4), heartM, [0, -0.06, 0], [PI, PI / 4, 0], null, true); return g; };
  const glow = K.sprite(0x8affb0, 0.6, null, 0);
  let cu = 0, munch = 0;
  const hp = new THREE.Vector3(), mouth = new THREE.Vector3(), rest = new THREE.Vector3(), tmp = new THREE.Vector3(), side = new THREE.Vector3(), goal = new THREE.Vector3();
  cam.position.set(0, 1.2, 0.15);
  return {
    fov: 60, fovTall: 80, gauge: "h",
    update(v, t, dt) {
      cu = damp(cu, clamp(v.state === "return" ? v.u * 0.85 : v.u, 0, 1.2), 6, dt);
      cam.rotation.set(-0.12 - Math.min(1, cu) * 0.08, -cu * AF, 0); cam.updateMatrixWorld();
      const a = q[0], holding = v.state === "move" && v.u >= 0.9;
      // the animal at the front looks at you and leans in to eat
      a.g.rotation.y = Math.atan2(-a.g.position.x, 0.15 - a.g.position.z);
      a.g.position.lerp(a.at, Math.min(1, dt * 2));
      if (a.idle) a.idle(t);
      mouth.copy(a.g.position).addScaledVector(dir, -0.45 - a.h * 0.25); mouth.y = a.h * 0.72;
      camPt(cam, 0.16, -0.24, -0.45, rest);
      const e = ease(clamp((cu - 0.55) / 0.45, 0, 1));
      camPt(cam, 0.34, -0.06, 0, side).sub(cam.position); goal.copy(mouth).add(side).addScaledVector(dir, -0.08);
      hp.lerpVectors(rest, goal, e); hand.position.copy(hp); hand.lookAt(tmp.lerpVectors(rest, mouth, 0.5).lerp(mouth, e));
      munch = holding ? v.prog : damp(munch, 0, 4, dt);
      carrot.scale.set(1, 1, Math.max(0.2, 1 - munch * 0.8)); carrot.position.z = 0.06 + (1 - carrot.scale.z) * 0.02;
      glow.position.copy(mouth); glow.material.opacity = v.state === "move" ? 0.25 + v.prog * 0.5 : 0;
      if (holding && !K.calm && a.idle) a.g.position.y = Math.abs(Math.sin(t * 10)) * 0.02;
      if (v.fresh) {
        for (let i = 0; i < 4; i++) hearts.push({ g: heart(), p: mouth.clone().add(new THREE.Vector3(K.R(-0.2, 0.2), 0.2, K.R(-0.2, 0.2))), t: -i * 0.15 });
        leaving.push({ a: q.shift(), t: 0 }); const b = make(next++); b.g.position.copy(Q(3)); q.push(b);
        q.forEach((x, j) => { x.at = Q(j); });
        carrot.scale.set(1, 1, 1); munch = 0;
      }
      q.slice(1).forEach((x) => { x.g.position.lerp(x.at, Math.min(1, dt * 1.5)); x.g.rotation.y = Math.atan2(-dir.x, -dir.z); if (x.idle) x.idle(t); });
      leaving = leaving.filter((l) => { l.t += dt; l.a.g.rotation.y = Math.atan2(dir.x + 0.5, dir.z - 0.8); l.a.g.position.add(new THREE.Vector3(dir.x + 0.5, 0, dir.z - 0.8).multiplyScalar(dt * 1.4)); if (l.t > 6) { l.a.g.visible = false; return false; } return true; });
      hearts = hearts.filter((h) => { h.t += dt; const k = Math.max(0, h.t); h.g.visible = h.t > 0; h.g.position.copy(h.p).add(new THREE.Vector3(0, k * 0.6, 0)); h.g.scale.setScalar(Math.min(1, k * 4) * (1 - Math.max(0, k - 1.2))); h.g.lookAt(cam.position); if (k > 2.2) { h.g.visible = false; return false; } return true; });
      for (const g of grazers) if (g.idle) g.idle(t);
    },
    focus(p) { p.copy(mouth); },
  };
});
// ================================================================ 28. Gaze Stabilization (Wave, small head turns)
// A quiet night meadow. Keep your eyes on the golden star in the middle while you turn your head; the
// lanterns on each side brighten as you turn toward them, and every turn lights a star in a constellation.
// The view stays still on purpose, so the star in the middle never moves.
P3.add("gaze", (K, THREE, cam, S) => {
  K.sky(0x060a24, 0x16245a, 0x3a3a6a, { sunDir: [0, 0.2, -1], sun: 0, horizon: 0.1 });
  K.stars(1100, { minY: 0.06 });
  K.scene.fog = new THREE.Fog(0x1a2448, 30, 160);
  K.lights({ sky: 0x8a9ae0, ground: 0x1a2a2a, hemi: 0.7, sun: 0xb8c8ff, sunI: 0.9, dir: [-0.4, 0.8, 0.3] });
  K.ground({ size: 260, seg: 80, h: (x, z) => (z < -14 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 12 * Math.min(1, (-14 - z) / 40) : 0), color: (x, z) => K.mix(0x1e3a2a, 0x2e4e34, K.fbm(x * 0.15, z * 0.15)) });
  shadowBox(K, 8);
  pines(K, K.ring(40, 12, 70, { free: true, ok: (x, z) => z < -5 || Math.abs(x) > 9 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.8) })));
  K.part(null, K.sph(1, 24, 16), K.B(0xfff4d0, { fog: false }), [-60, 70, -200], null, 7);
  K.sprite(0xfff0c0, 60, [-60, 70, -199], 0.35);
  // fireflies drifting over the grass
  const ffs = Array.from({ length: 40 }, () => ({ x: K.R(-7, 7), y: K.R(0.3, 1.6), z: K.R(-8, 0.5), ph: K.R(0, 6) }));
  const ffM = K.inst(K.sph(0.035, 6, 4), K.B(0xd8ff7a), ffs.map((f) => ({ x: f.x, y: f.y, z: f.z })), { shadow: false });
  // the golden star you keep your eyes on
  const FOC = new THREE.Vector3(0, 2.3, -1.6);
  const star = K.part(null, starGeo(K, THREE, 0.38, 0.16, 0.08), K.E(0xffc83a, { emissiveIntensity: 0.8, roughness: 0.3 }), FOC.toArray(), null, null, true);
  const halo = K.sprite(0xffd870, 1.6, FOC.toArray(), 0.55);
  // lanterns on posts at each side
  const lanterns = [1, -1].map((s) => {
    const g = K.group(null, [s * 2.4, 0, -1.2]);
    K.part(g, K.cyl(0.04, 0.05, 1.5, 6), K.M(0x3a2a20), [0, 0.75, 0]);
    K.part(g, K.box(0.3, 0.04, 0.04), K.M(0x3a2a20), [-s * 0.12, 1.5, 0]);
    const lamp = K.part(g, K.box(0.2, 0.26, 0.2), K.E(0xffb84a, { emissiveIntensity: 0.3 }), [-s * 0.22, 1.32, 0], null, null, true);
    K.part(g, K.cone(0.17, 0.12, 4), K.M(0x3a2a20), [-s * 0.22, 1.5, 0], [0, PI / 4, 0]);
    const glow = K.sprite(0xffc870, 1.4, [s * 2.4 - s * 0.22, 1.32, -1.2], 0.2);
    return { lamp, glow, s };
  });
  // constellations that fill in one star per turn
  const SHAPES = [
    [[0, 0], [1, 0.2], [2, 0], [2.6, 0.7], [2.2, 1.5], [3.2, 1.9], [4.2, 1.6]],
    [[0, 0], [0.8, 1], [1.6, 0.2], [2.4, 1.2], [3.2, 0.3]],
    [[0, 1.2], [0.6, 2], [1.4, 1.6], [1.4, 0.8], [0.7, 0], [0, 0.6], [-0.7, 0], [-1.4, 0.8], [-1.4, 1.6], [-0.6, 2]],
    [[0, 0], [1, 0.6], [2, 0.4], [2.8, 1.2], [2, 1.9], [1, 1.5]],
  ];
  const AT = [[-26, 22], [14, 26], [-4, 32], [24, 14]], skyStars = [];
  SHAPES.forEach((sh, si) => sh.forEach(([x, y], i) => skyStars.push({ p: new THREE.Vector3(AT[si][0] + x * 4, AT[si][1] + y * 4, -70), si, i })));
  const lit = K.inst(K.sph(0.6, 8, 6), K.B(0xffffff, { fog: false }), skyStars.map((q) => ({ x: q.p.x, y: q.p.y, z: q.p.z, s: 0.35 })), { shadow: false });
  const lineM = K.B(0xa8c8ff, { fog: false, transparent: true, opacity: 0.6 });
  let litN = 0, flashes = [], sx = 0;
  cam.position.set(0, 1.35, 3.2); cam.lookAt(0, 2.6, -6);
  return {
    fov: 60, fovTall: 78, gauge: "h",
    update(v, t, dt) {
      sx = damp(sx, clamp(v.x, -1.4, 1.4), 10, dt);
      star.rotation.y = K.calm ? 0 : Math.sin(t * 0.8) * 0.25; halo.material.opacity = 0.45 + Math.sin(t * 2) * 0.1;
      lanterns.forEach((l) => {
        const near = clamp(sx * l.s, 0, 1.2), want = (v.want > 0) === (l.s > 0);
        l.lamp.material = K.E(0xffb84a, { emissiveIntensity: Math.round((0.25 + near * 0.9) * 10) / 10 });
        l.glow.material.opacity = 0.12 + near * 0.6 + (want && !K.calm ? 0.12 * (1 + Math.sin(t * 5)) : 0);
        l.glow.scale.setScalar(1.2 + near * 0.9);
      });
      if (v.fresh && litN < skyStars.length) {
        const q = skyStars[litN];
        K.setInst(lit, litN, { x: q.p.x, y: q.p.y, z: q.p.z, s: 1.6 }); lit.instanceMatrix.needsUpdate = true;
        if (q.i > 0) stick(K, 0.12, lineM)(skyStars[litN - 1].p, q.p);
        flashes.push({ s: K.sprite(0xc8e0ff, 1, q.p.toArray(), 1), t: 0 });
        litN++;
      }
      flashes = flashes.filter((f) => { f.t += dt; f.s.scale.setScalar(4 + f.t * 30); f.s.material.opacity = Math.max(0, 1 - f.t); if (f.t > 1) { f.s.visible = false; return false; } return true; });
      if (!K.calm) { ffs.forEach((f, i) => K.setInst(ffM, i, { x: f.x + Math.sin(t * 0.4 + f.ph) * 0.4, y: f.y + Math.sin(t * 0.9 + f.ph) * 0.2, z: f.z, s: 0.6 + 0.6 * Math.max(0, Math.sin(t * 2 + f.ph * 3)) })); ffM.instanceMatrix.needsUpdate = true; }
    },
    focus(p) { p.copy(FOC); },
  };
});
// a five-pointed star shape, extruded
function starGeo(K, THREE, ro, ri, depth) {
  const key = `star${ro},${ri},${depth}`; K._geo = K._geo || {};
  if (K._geo[key]) return K._geo[key];
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? ri : ro, a = PI / 2 + (i * PI) / 5; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  return (K._geo[key] = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: depth > 0.05, bevelThickness: depth * 0.5, bevelSize: ri * 0.2, bevelSegments: 2 }).translate(0, 0, -depth / 2));
}

// ================================================================ 29. Ankle In and Out (Swing, roll the foot)
// A night-time nursery. Rolling your foot to each side rocks the cradle to the ring on that side; every
// rock sends up a sleepy "z" and lights a charm on the mobile.
P3.add("anklerock", (K, THREE, cam) => {
  K.scene.background = new THREE.Color(0x1a1830);
  K.lights({ sky: 0xffe8d0, ground: 0x5a4a6a, hemi: 1.1, sun: 0xffe2b8, sunI: 1.4, dir: [0.5, 0.9, 0.7] });
  shadowBox(K, 4);
  const wood = new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#c89a68"), roughness: 0.75 });
  K.part(null, K.box(9, 0.1, 7), wood, [0, -0.05, -0.5]);
  K.part(null, K.circle(1.5, 32), K.M(0xb8a8e8, { roughness: 1 }), [0, 0.006, 0.1], [-PI / 2, 0, 0], null, true);
  K.part(null, K.circle(1.1, 32), K.M(0xd8c8f8, { roughness: 1 }), [0, 0.008, 0.1], [-PI / 2, 0, 0], null, true);
  const wallTex = K.tex(256, 256, (g, w, h) => { g.fillStyle = "#c8d4f0"; g.fillRect(0, 0, w, h); g.fillStyle = "#e8eefc"; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc((i * 97) % w, (i * 53) % h, 6, 0, PI * 2); g.fill(); } }, true);
  wallTex.repeat.set(4, 2);
  const wallM = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 });
  K.part(null, K.box(9, 4, 0.1), wallM, [0, 2, -2.6]);
  K.part(null, K.box(0.1, 4, 7), wallM, [-3.6, 2, -0.5]); K.part(null, K.box(0.1, 4, 7), wallM, [3.6, 2, -0.5]);
  K.part(null, K.box(9, 0.15, 0.06), K.M(0xffffff), [0, 0.07, -2.53]);
  // window with the night sky
  const night = K.tex(256, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#0a1438"); grd.addColorStop(1, "#2a3a78"); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = "#ffffff"; for (let i = 0; i < 40; i++) { g.globalAlpha = 0.4 + (i % 3) * 0.2; g.fillRect((i * 71) % w, (i * 37) % (h * 0.8), 2, 2); }
    g.globalAlpha = 1; g.fillStyle = "#fff4c8"; g.beginPath(); g.arc(w * 0.7, h * 0.3, 26, 0, PI * 2); g.fill(); g.fillStyle = "#1a2450"; g.beginPath(); g.arc(w * 0.7 + 12, h * 0.3 - 6, 22, 0, PI * 2); g.fill();
  });
  K.part(null, K.plane(1.4, 1.2), new THREE.MeshBasicMaterial({ map: night }), [1.6, 2.1, -2.54], null, null, true);
  for (const [w, h, x, y] of [[1.56, 0.08, 0, 0.64], [1.56, 0.08, 0, -0.64], [0.08, 1.36, 0.74, 0], [0.08, 1.36, -0.74, 0], [0.05, 1.2, 0, 0], [1.4, 0.05, 0, 0]]) K.part(null, K.box(w, h, 0.06), K.M(0xffffff), [1.6 + x, 2.1 + y, -2.52]);
  // a lamp, a shelf of toys and a bunny friend
  K.part(null, K.cyl(0.03, 0.03, 1.5, 6), K.M(0xe8e0d0), [-2.4, 0.75, -1.8]); K.part(null, K.cyl(0.18, 0.18, 0.02, 12), K.M(0xe8e0d0), [-2.4, 0.01, -1.8]);
  K.part(null, K.cyl(0.14, 0.26, 0.3, 14, 1, true), K.E(0xffd89a, { emissiveIntensity: 0.6, side: THREE.DoubleSide }), [-2.4, 1.55, -1.8], null, null, true);
  K.sprite(0xffd090, 2.4, [-2.4, 1.5, -1.8], 0.45);
  const lampLight = new THREE.PointLight(0xffc880, 1.6, 6, 1.5); lampLight.position.set(-2.4, 1.45, -1.6); K.scene.add(lampLight);
  K.part(null, K.box(1.4, 0.06, 0.3), K.M(0xffffff), [-1.3, 1.5, -2.42]);
  [[0xff7a7a, -1.8], [0x7ac0ff, -1.6], [0xffd85a, -1.4]].forEach(([c, x], i) => K.part(null, K.box(0.16, 0.16, 0.16), K.M(c), [x, 1.61, -2.4], [0, i * 0.3, 0]));
  K.part(null, K.sph(0.12, 12, 10), K.S(0xff8ab8), [-0.95, 1.65, -2.4]);
  const bunny = animal(K, "rabbit", 0.5); bunny.g.position.set(-1.9, 0, -0.4); bunny.g.rotation.y = 0.7;
  // the cradle on its rockers, pivoting about the rockers' centre so it rolls
  const PR = 0.95, piv = K.group(null, [0, PR, 0.1]), cr = K.group(piv, [0, -PR, 0]);
  const cw = K.S(0xfaf4ea, { roughness: 0.5 }), trim = K.S(0x9ad0c8, { roughness: 0.5 });
  for (const z of [-0.32, 0.32]) K.part(piv, K.tor(PR, 0.04, 6, 30, 1.3), trim, [0, 0, z], [0, 0, -PI / 2 - 0.65]);
  for (const x of [-0.42, 0.42]) for (const z of [-0.32, 0.32]) K.part(cr, K.cyl(0.03, 0.03, 0.42, 6), trim, [x, 0.22, z]);
  K.part(cr, K.box(1.0, 0.36, 0.62), cw, [0, 0.56, 0]);
  K.part(cr, K.box(1.04, 0.05, 0.66), trim, [0, 0.75, 0]);
  K.part(cr, K.hemi(0.3, 16), K.S(0xc8b8f0, { side: THREE.DoubleSide }), [-0.46, 0.77, 0], [0, 0, PI / 2], [1, 0.9, 1]);
  const baby = animal(K, "panda", 0.7, cr); baby.g.position.set(-0.22, 0.36, 0); baby.g.rotation.set(0, PI / 2, -0.25);
  K.part(cr, K.box(0.55, 0.12, 0.56), K.S(0xffb8d0, { roughness: 0.8 }), [0.16, 0.8, 0]);
  // mobile hanging above with charms that light up
  const mob = K.group(null, [0.15, 2.0, 0.25]);
  K.part(null, K.cyl(0.006, 0.006, 2.0, 3), K.M(0xffffff), [0.15, 3.0, 0.25], null, null, true);
  K.part(mob, K.tor(0.4, 0.012, 4, 24), K.M(0xffffff), null, [PI / 2, 0, 0], null, true);
  const NCH = 6, charms = [];
  for (let i = 0; i < NCH; i++) {
    const a = (i / NCH) * PI * 2, x = Math.cos(a) * 0.4, z = Math.sin(a) * 0.4, len = 0.25 + (i % 2) * 0.12, c = [0xffd23a, 0x9ad8ff, 0xff9ac8][i % 3];
    K.part(mob, K.cyl(0.004, 0.004, len, 3), K.M(0xffffff), [x, -len / 2, z], null, null, true);
    charms.push({ m: K.part(mob, i % 2 ? K.sph(0.07, 10, 8) : starGeo(K, THREE, 0.085, 0.035, 0.025), K.E(c, { emissiveIntensity: 0.05 }), [x, -len - 0.06, z], null, null, true), c });
  }
  const rings = [1, -1].map((s) => target(K, [s * 0.95, 1.1, 0.35], 0.12)), ringGlow = K.sprite(0x8affb0, 0.5, null, 0);
  const zTex = textTex(K, "z", { bg: "rgba(0,0,0,0)", color: "#ffffff", w: 128, h: 128 }), zs = [];
  let rock = 0, onN = 0;
  cam.position.set(0, 1.62, 2.85); cam.lookAt(0, 1.08, 0);
  return {
    fov: 55, fovTall: 74, gauge: "h",
    update(v, t, dt) {
      rock = damp(rock, clamp(v.x, -1.3, 1.3), 7, dt); piv.rotation.z = -rock * 0.3;
      const plus = v.targets[v.side] > 0;
      rings.forEach((r, i) => r((i === 0) === plus, t).lookAt(cam.position));
      ringGlow.position.set(plus ? 0.95 : -0.95, 1.1, 0.35); ringGlow.material.opacity = v.prog * 0.8;
      mob.rotation.y = K.calm ? 0 : t * 0.3;
      if (v.fresh) {
        const ch = charms[onN % NCH]; ch.m.material = K.E(ch.c, { emissiveIntensity: 0.9 }); onN++;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false })); sp.scale.setScalar(0.3); K.scene.add(sp); zs.push({ sp, t: 0 });
      }
      zs.forEach((z) => { if (z.t > 3) return; z.t += dt; z.sp.position.set(-0.2 + Math.sin(z.t * 2) * 0.12 + z.t * 0.1, 1.2 + z.t * 0.35, 0.1); z.sp.material.opacity = Math.max(0, 1 - z.t / 3); z.sp.visible = z.t < 3; });
      if (bunny.idle) bunny.idle(t);
    },
    focus(p) { p.set(0, 1.1, 0.1); },
  };
});

// ================================================================ 30. Side-Lying Leg Lift (Reach, lift the top leg)
// A toll gate on a country road. Lifting your leg raises the striped barrier; hold it up and the next
// little convertible, with an animal at the wheel, drives through.
P3.add("sidelegs", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.5, 0.45, -1], sun: 1.1 });
  K.ground({ size: 280, seg: 100, h: (x, z) => (z < -16 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 10 * Math.min(1, (-16 - z) / 40) : 0),
    color: (x, z) => (Math.abs(z) < 1.15 ? K.mix(0x55565e, 0x6a6a72, K.noise(x * 2, z * 2)) : Math.abs(z) < 1.4 ? 0xb8a888 : K.mix(0x66a648, 0x92c85e, K.fbm(x * 0.15, z * 0.15))) });
  K.inst(K.box(0.5, 0.01, 0.08), K.M(0xf4f0e0), Array.from({ length: 30 }, (_, i) => ({ x: -30 + i * 2, y: 0.01, z: 0 })), { shadow: false });
  shadowBox(K, 9); backdrop(K);
  trees(K, K.ring(40, 9, 70, { free: true, ok: (x, z) => Math.abs(z) > 4 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  flowers(K, 160, [-10, 10, -6, -1.6]);
  // the gate: a post, a little booth and the striped arm
  const PIV = new THREE.Vector3(0.15, 1.0, 1.55);
  K.part(null, K.box(0.3, 1.0, 0.3), K.M(0xe8e4dc), [PIV.x, 0.5, PIV.z]);
  const booth = K.group(null, [1.5, 0, -2.4], [0, PI, 0]);
  K.part(booth, K.box(1.1, 1.7, 1.0), K.M(0xf4f0e8), [0, 0.85, 0]); K.part(booth, K.box(1.3, 0.12, 1.2), K.M(0xd8342a), [0, 1.76, 0]);
  K.part(booth, K.box(0.7, 0.5, 0.02), K.M(0x8ac8e8, { roughness: 0.2 }), [0, 1.2, -0.51]);
  const arm = K.group(null, PIV.toArray()), stripe = K.tex(256, 32, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#e8342a"; g.fillRect((i * w) / 8, 0, w / 8 + 1, h); } });
  K.part(arm, K.box(0.08, 0.1, 2.9), new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.6 }), [0, 0, -1.45]);
  K.part(arm, K.box(0.2, 0.22, 0.32), K.M(0x5a5a62), [0, 0, 0.18]);
  const lamp = K.part(arm, K.sph(0.06, 10, 8), K.E(0xff4a3a), [0, 0.09, -2.7], null, null, true);
  K.part(null, K.box(0.12, 0.85, 0.12), K.M(0xe8e4dc), [PIV.x, 0.42, -1.55]);
  // cars: little convertibles with an animal driving, queued on the left
  const COL = [0x3a8ae8, 0xffc828, 0xe84a6a, 0x4ac88a, 0xb46aff, 0xff8a3a], DRV = ["rabbit", "pig", "panda", "sheep", "chicken"];
  function car(i) {
    const g = K.group(null), body = K.S(COL[i % COL.length], { roughness: 0.35 });
    K.part(g, K.box(1.4, 0.32, 0.72), body, [0, 0.36, 0]);
    K.part(g, K.box(0.5, 0.18, 0.72), body, [0.42, 0.56, 0]);
    K.part(g, K.box(0.04, 0.24, 0.66), glassMat(THREE, { opacity: 0.4 }), [0.16, 0.66, 0], [0, 0, 0.35], null, true);
    K.part(g, K.box(0.24, 0.2, 0.6), K.M(0x5a3a2a), [-0.32, 0.6, 0]);
    for (const [x, z] of [[0.45, 0.36], [0.45, -0.36], [-0.45, 0.36], [-0.45, -0.36]]) K.part(g, K.cyl(0.16, 0.16, 0.12, 14), K.M(0x222228), [x, 0.16, z], [PI / 2, 0, 0]);
    for (const z of [0.24, -0.24]) K.part(g, K.sph(0.05, 8, 6), K.E(0xfff4c0, { emissiveIntensity: 0.6 }), [0.7, 0.4, z], null, null, true);
    const d = animal(K, DRV[i % DRV.length], 0.55, g); d.g.position.set(-0.12, 0.4, 0); d.g.rotation.y = PI / 2;
    return { g, d };
  }
  const WAIT = -1.6, GAP = 2.1, q = [0, 1, 2].map((i) => { const c = car(i); c.x = WAIT - i * GAP; c.g.position.x = c.x; return c; });
  let n = 3, gone = [], ang = 0;
  cam.position.set(-1.7, 2.6, 7.0); cam.lookAt(0.1, 1.05, -0.2);
  return {
    fov: 55, fovTall: 74, gauge: "v",
    update(v, t, dt) {
      const holding = v.state === "move" && v.u >= 0.9, front = q[0];
      if (holding) front.x = WAIT + v.prog * 1.2;
      const under = Math.abs(front.g.position.x - PIV.x) < 1.1 || gone.some((c) => Math.abs(c.x - PIV.x) < 1.1);
      const want = Math.max(clamp(v.state === "return" ? v.u * 0.8 : v.u, 0, 1.15) * 1.15, under ? 1.1 : 0);
      ang = damp(ang, want, 7, dt); arm.rotation.x = ang;
      lamp.material = K.E(holding ? 0x4ad884 : 0xff4a3a, { emissiveIntensity: 0.9 });
      if (v.fresh) { const c = q.shift(); c.x = c.g.position.x; gone.push(c); const nc = car(n++); nc.x = WAIT - 3 * GAP; nc.g.position.x = nc.x - 3; q.push(nc); }
      q.forEach((c, j) => { if (j > 0 || !holding) c.x = damp(c.x, WAIT - j * GAP, 2, dt); c.g.position.x = damp(c.g.position.x, c.x, 6, dt); if (c.d.idle) c.d.idle(t); });
      gone = gone.filter((c) => { c.x += dt * (2 + (c.x - WAIT) * 1.2); c.g.position.x = c.x; c.d.g.position.y = 0.4 + (!K.calm ? Math.abs(Math.sin(t * 8)) * 0.04 : 0); if (c.x > 30) { c.g.visible = false; return false; } return true; });
    },
    focus(p) { p.set(PIV.x, 1.4, 0); },
  };
});

// ================================================================ 31. Knee Rolls (Swing, both knees side to side)
// Paint a rainbow. Rolling your knees sweeps the bright brush along the arc from one end to the other;
// every roll there and back paints one more band, until the whole rainbow shines over the valley.
P3.add("kneerolls", (K, THREE, cam, S) => {
  sunny(K, { top: 0x4a8ae0, mid: 0xb8dcf4, sunDir: [0.6, 0.35, -1] });
  K.ground({ size: 300, seg: 100, h: (x, z) => (z < -12 ? Math.pow(K.fbm(x * 0.025, z * 0.025), 1.4) * 16 * Math.min(1, (-12 - z) / 40) : 0), color: (x, z, y) => (y > 9 ? 0xf4f8fc : K.mix(0x5a9a40, 0x8ac458, K.fbm(x * 0.1, z * 0.1))) });
  shadowBox(K, 10); K.clouds(16);
  trees(K, K.ring(40, 10, 70, { free: true }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.7) })));
  flowers(K, 200, [-10, 10, -5, 2]);
  K.flock(5, { cz: -25, y0: 10, y1: 16 });
  // the rainbow: one instanced arc of segments per band, shown as the brush passes
  const N = clamp(S.reps || 10, 5, 12), C = new THREE.Vector3(0, 0.5, -28), R0 = 20, BW = 1.35, SEG = 64, A0 = 0.2;
  const hue = (i) => new THREE.Color().setHSL((i / N) * 0.78, 0.95, 0.55).getHex();
  const angAt = (k) => PI - A0 - (k / (SEG - 1)) * (PI - 2 * A0);
  const bands = Array.from({ length: N }, (_, i) => {
    const r = R0 - i * BW, L = ((r * (PI - 2 * A0)) / SEG) * 1.08;
    const im = K.inst(K.box(L, BW * 0.98, 0.2), K.M(hue(i), { emissive: hue(i), emissiveIntensity: 0.6, roughness: 0.8, fog: false }), Array.from({ length: SEG }, () => ({ s: 0.001 })), { shadow: false });
    return { im, r, on: new Uint8Array(SEG), grow: new Float32Array(SEG) };
  });
  const setSeg = (b, k, s) => { const a = angAt(k); K.setInst(b.im, k, { x: C.x + Math.cos(a) * b.r, y: C.y + Math.sin(a) * b.r, z: C.z, rz: a - PI / 2, sx: 1, sy: s, sz: s }); };
  // the brush: a bright ball that rides along the band being painted
  const brush = K.group(null), ballM = (c) => K.E(c, { emissiveIntensity: 0.9, fog: false });
  const ball = K.part(brush, K.sph(1.0, 16, 12), ballM(hue(0)), null, null, null, true);
  const bGlow = K.sprite(0xffffff, 6, null, 0.8, brush);
  const ends = [1, -1].map(() => { const r = target(K, [0, 0, 0], 1.3); return { r, glow: K.sprite(0x8affb0, 6, null, 0) }; });
  let band = 0, bx = 0, lastA = null;
  cam.position.set(0, 1.5, 6); cam.lookAt(0, 7.5, -26);
  return {
    fov: 56, fovTall: 80, gauge: "h",
    update(v, t, dt) {
      bx = damp(bx, clamp(v.x, -1.15, 1.15), 9, dt);
      const b = bands[band % N], a = PI / 2 - bx * (PI / 2 - A0);
      brush.position.set(C.x + Math.cos(a) * b.r, C.y + Math.sin(a) * b.r, C.z + 0.4);
      ball.material = ballM(hue(band % N)); bGlow.material.color.setHex(hue(band % N));
      const lo = Math.min(lastA == null ? a : lastA, a) - 0.03, hi = Math.max(lastA == null ? a : lastA, a) + 0.03; lastA = a;
      for (let k = 0; k < SEG; k++) { const ak = angAt(k); if (!b.on[k] && ak >= lo && ak <= hi) b.on[k] = 1; }
      const plus = v.targets[v.side] > 0;
      ends.forEach((e, i) => { const ea = i === 0 ? A0 + 0.12 : PI - A0 - 0.12, on = (i === 0) === plus, ring = e.r(on, t); ring.position.set(C.x + Math.cos(ea) * b.r, C.y + Math.sin(ea) * b.r, C.z + 1); e.glow.position.copy(ring.position); e.glow.material.opacity = on ? v.prog * 0.8 : 0; });
      if (v.fresh) { b.on.fill(1); band++; lastA = null; if (band % N === 0) bands.forEach((x) => { x.on.fill(0); x.grow.fill(0); for (let k = 0; k < SEG; k++) setSeg(x, k, 0.001); x.im.instanceMatrix.needsUpdate = true; }); }
      for (const x of bands) {
        let dirty = false;
        for (let k = 0; k < SEG; k++) if (x.on[k] && x.grow[k] < 1) { x.grow[k] = Math.min(1, x.grow[k] + dt * 4); setSeg(x, k, Math.max(0.001, ease(x.grow[k]))); dirty = true; }
        if (dirty) x.im.instanceMatrix.needsUpdate = true;
      }
    },
    focus(p) { p.copy(brush.position); },
  };
});

// ================================================================ 32. Sit Up Tall (Reach, lift the chest)
// A sleepy sunflower. Lift your chest and the sunflower straightens up and turns its face to the sun;
// hold it tall and the bees come. Each time, another sunflower opens in the field and the sun climbs.
P3.add("chestup", (K, THREE, cam, S) => {
  const sky = K.sky(0x3f86d8, 0xa9d4f0, 0xffe8c8, { sunDir: [0.3, 0.12, -1], sun: 1.3, sunColor: 0xffe0a0, horizon: 0.16 });
  K.scene.fog = new THREE.Fog(0xe8e0d0, 45, 240);
  const sun = K.lights({ sky: 0xfff0e0, ground: 0x6a7a40, hemi: 1.3, sun: 0xffe8c8, sunI: 2.2, dir: [0.3, 0.5, -0.8] });
  meadow(K, { color: (x, z) => K.mix(0x6a9a3a, 0x9ab84a, K.fbm(x * 0.12, z * 0.12)) });
  shadowBox(K, 8); backdrop(K, { clouds: 10 });
  trees(K, K.ring(20, 22, 70, { free: true, ok: (x, z) => z < -12 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.1, 1.7) })));
  const head = (parent, s) => {
    const h = K.group(parent, null, null, s);
    K.part(h, K.cyl(0.2, 0.2, 0.06, 20), K.M(0x5a3a1a), [0, 0, 0], [PI / 2, 0, 0]);
    K.part(h, K.cyl(0.13, 0.13, 0.065, 16), K.M(0x7a5228), [0, 0, 0.002], [PI / 2, 0, 0], null, true);
    for (let i = 0; i < 18; i++) { const a = (i / 18) * PI * 2; K.part(h, K.sph(1, 6, 4), K.S(0xffc81e, { roughness: 0.6 }), [Math.cos(a) * 0.29, Math.sin(a) * 0.29, -0.01], [0, 0, a], [0.13, 0.05, 0.015]); }
    K.part(h, K.cyl(0.21, 0.12, 0.08, 12), K.M(0x4a8a2a), [0, 0, -0.07], [PI / 2, 0, 0]);
    return h;
  };
  // grown sunflowers at the back of the field
  const far = [];
  for (let r = 0; r < 3; r++) for (let x = -9; x <= 9; x += 0.9) far.push({ x: x + K.R(-0.2, 0.2) + (r % 2) * 0.45, z: -5 - r * 1.3, s: K.R(0.85, 1.15) });
  K.inst(K.cyl(0.03, 0.04, 1, 5), K.M(0x4a8a2a), far.map((p) => ({ x: p.x, y: 0.8 * p.s, z: p.z, sy: 1.6 * p.s })));
  far.forEach((p) => { const h = head(null, 0.75 * p.s); h.position.set(p.x, 1.62 * p.s, p.z); h.rotation.set(-0.15, 0.25, 0); });
  // a row of buds in front that open one per rep
  const NB = clamp(S.reps || 10, 4, 12), buds = [];
  for (let i = 0; i < NB; i++) {
    const x = (i - (NB - 1) / 2) * 0.62 + (i % 2) * 0.1, z = -2.4 - (i % 2) * 0.4, g = K.group(null, [x, 0, z]);
    K.part(g, K.cyl(0.02, 0.025, 1, 5), K.M(0x4a8a2a), [0, 0.5, 0]);
    const bud = K.part(g, K.sph(0.08, 8, 6), K.M(0x5a9a2a), [0, 1.0, 0]);
    const h = head(g, 0.001); h.position.set(0, 1.02, 0.02); h.rotation.x = -0.1;
    buds.push({ h, bud, open: 0, on: false });
  }
  // the hero sunflower: a bendy stem in four pieces and a friendly face
  const segs = []; let parent = K.group(null, [0, 0, 0]);
  for (let i = 0; i < 4; i++) { const sg = K.group(parent, [0, i ? 0.42 : 0, 0]); K.part(sg, K.cyl(0.035, 0.045, 0.43, 7), K.M(0x4a9a2a), [0, 0.21, 0]); if (i === 1 || i === 2) K.part(sg, K.sph(1, 8, 6), K.M(0x4a9a2a), [i === 1 ? 0.16 : -0.16, 0.2, 0], [0, 0, i === 1 ? -0.5 : 0.5], [0.18, 0.025, 0.08]); segs.push(sg); parent = sg; }
  const neck = K.group(parent, [0, 0.42, 0]), face = head(neck, 1.25); face.position.set(0, 0.1, 0.05);
  K.eyes(face, 0.07, 0.06, 0.045, 0.035);
  K.part(face, K.tor(0.06, 0.012, 6, 14, PI), K.M(0x2a1a0a), [0, -0.03, 0.045], [0, 0, PI], null, true);
  for (const s of [-1, 1]) K.part(face, K.sph(0.03, 8, 6), K.S(0xff9a7a), [s * 0.11, -0.02, 0.04], null, [1, 0.6, 0.4], true);
  const bees = [0, 1, 2].map((i) => { const b = K.group(null, null, null, 0.8); K.part(b, K.sph(1, 10, 8), K.S(0xffc828), null, null, [0.05, 0.045, 0.07], true); K.part(b, K.box(0.1, 0.09, 0.02), K.M(0x2a2a2a), [0, 0, -0.01], null, null, true); for (const s of [-1, 1]) K.part(b, K.sph(1, 6, 4), K.M(0xe8f4ff, { transparent: true, opacity: 0.7 }), [s * 0.05, 0.05, 0], null, [0.05, 0.015, 0.03], true); b.visible = false; return { b, ph: i * 2.1 }; });
  const glow = K.sprite(0xfff0a0, 1.6, null, 0), tmp = new THREE.Vector3();
  let up = 0, opened = 0, sunUp = 0, beeAmt = 0;
  cam.position.set(0, 1.35, 3.0); cam.lookAt(0, 1.3, 0);
  return {
    fov: 55, fovTall: 76, gauge: "v",
    update(v, t, dt) {
      up = damp(up, clamp(v.state === "return" ? v.u * 0.8 : v.u, 0, 1.2), 6, dt); const e = Math.min(1, up);
      const sway = K.calm ? 0 : Math.sin(t * 1.3) * 0.03;
      segs[0].rotation.x = lerp(0.12, 0, e) + sway; segs[1].rotation.x = lerp(0.3, 0, e); segs[2].rotation.x = lerp(0.42, 0, e) - Math.max(0, up - 1) * 0.15; segs[3].rotation.x = lerp(0.5, -0.04, e);
      neck.rotation.x = lerp(0.9, -0.35, e); neck.rotation.y = lerp(0, 0.2, e);
      const holding = v.state === "move" && v.u >= 0.9;
      face.getWorldPosition(tmp); glow.position.copy(tmp); glow.material.opacity = v.state === "move" ? v.prog * 0.6 : 0;
      beeAmt = damp(beeAmt, holding ? 1 : 0, 3, dt);
      bees.forEach((q, i) => { q.b.visible = beeAmt > 0.05; const a = t * (1.6 + i * 0.3) + q.ph, r = 0.35 + (1 - beeAmt) * 1.5; q.b.position.set(tmp.x + Math.cos(a) * r, tmp.y + 0.1 + Math.sin(a * 2) * 0.12, tmp.z + Math.sin(a) * r * 0.6); q.b.rotation.y = -a; });
      if (v.fresh && opened < NB) { buds[opened].on = true; opened++; }
      buds.forEach((b) => { if (!b.on || b.open >= 1) return; b.open = Math.min(1, b.open + dt * 1.5); b.h.scale.setScalar(Math.max(0.001, ease(b.open) * 0.7)); b.bud.visible = b.open < 0.3; });
      sunUp = damp(sunUp, opened / NB, 1.5, dt);
      sky.material.uniforms.sunDir.value.set(0.3, 0.12 + sunUp * 0.4, -1).normalize();
      sun.position.set(0.3, 0.5 + sunUp * 0.5, -0.8).normalize().multiplyScalar(60);
    },
    focus(p) { face.getWorldPosition(p); },
  };
});

// ================================================================ 33. Scoop and Hold (Hold, curl the wrist down)
// An ice-cream cart in the park. Curl your wrist and the scoop dips into the tub; hold it there and a ball
// of ice cream forms. Each scoop goes on the cone, and full cones go to the animals in the queue.
P3.add("scoophold", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.4, 0.45, -1], sun: 1.1, dir: [0.4, 0.9, 0.6] });
  meadow(K); shadowBox(K, 5); backdrop(K);
  trees(K, K.ring(30, 8, 60, { free: true, ok: (x, z) => z < -3 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  flowers(K, 120, [-6, 6, -6, -2.2]);
  // the cart
  K.part(null, K.box(1.9, 0.85, 0.9), K.M(0x8ad0e8), [0, 0.45, 0]);
  K.part(null, K.box(1.96, 0.06, 0.96), K.M(0xffffff), [0, 0.9, 0]);
  for (const x of [-0.75, 0.75]) K.part(null, K.cyl(0.22, 0.22, 0.08, 16), K.M(0x2a2a30), [x, 0.22, 0.48], [PI / 2, 0, 0]);
  for (const x of [-0.9, 0.9]) K.part(null, K.cyl(0.025, 0.025, 1.35, 6), K.M(0xe8e4dc), [x, 1.55, -0.4]);
  const awn = K.tex(256, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#ff7ab0"; g.fillRect((i * w) / 8, 0, w / 8 + 1, h); } });
  K.part(null, K.box(2.2, 0.06, 1.3), new THREE.MeshStandardMaterial({ map: awn, roughness: 0.7 }), [0, 2.2, -0.15], [0.12, 0, 0]);
  // the tubs in the counter
  const FL = [0xffb8d0, 0x9af0c8, 0x8a5a3a, 0xfff0c8, 0xb8a8ff];
  const tubs = FL.map((c, i) => { const x = -0.6 + i * 0.3, g = K.group(null, [x, 0.93, 0.05]); K.part(g, K.cyl(0.13, 0.12, 0.05, 16), K.M(0xd8dce4, { metalness: 0.3 }), [0, 0, 0]); K.part(g, K.cyl(0.115, 0.115, 0.02, 16), K.S(c, { roughness: 0.8 }), [0, 0.02, 0]); for (let j = 0; j < 5; j++) K.part(g, K.sph(0.04, 8, 6), K.S(c, { roughness: 0.8 }), [Math.cos(j * 1.3) * 0.06, 0.03, Math.sin(j * 1.3) * 0.06], null, [1, 0.5, 1], true); return { c, x }; });
  let tub = 0;
  // the cone stand at the left of the counter
  const CONE = new THREE.Vector3(-0.85, 0.93, 0.25);
  K.part(null, K.cyl(0.07, 0.09, 0.08, 12), K.M(0xe8e4dc), [CONE.x, CONE.y + 0.04, CONE.z]);
  const waffle = K.tex(64, 64, (g, w, h) => { g.fillStyle = "#d89a4a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#a86a2a"; g.lineWidth = 3; for (let i = -w; i < w * 2; i += 12) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); } });
  const coneM = new THREE.MeshStandardMaterial({ map: waffle, roughness: 0.8 });
  const makeCone = () => { const g = K.group(null, CONE.toArray()); K.part(g, K.cone(0.07, 0.26, 14), coneM, [0, 0.16, 0], [PI, 0, 0]); return { g, balls: 0 }; };
  let cone = makeCone(), flying = [], handing = [], waitHand = -1;
  // customers across the counter
  const KINDS = ["penguin", "rabbit", "panda", "pig", "sheep"];
  const SPOT = (j) => new THREE.Vector3(-0.6 - j * 0.9, 0, -1.25 - j * 0.5);
  const make = (i) => { const k = KINDS[i % KINDS.length]; return k === "penguin" ? bare(K, k, [1, 2], 0.95) : animal(K, k, 0.95); };
  const q = [0, 1, 2].map((i) => { const a = make(i); a.g.position.copy(SPOT(i)); a.at = SPOT(i); return a; });
  let nextC = 3;
  // the scoop in your hand
  const scoop = K.group(null, null, null, 1.35), steel = K.S(0xd8dce4, { metalness: 0.7, roughness: 0.25 });
  K.part(scoop, K.cyl(0.02, 0.025, 0.32, 8), K.S(0x2a6ad8, { roughness: 0.6 }), [0, 0, 0.24], [PI / 2, 0, 0]);
  K.part(scoop, K.cyl(0.012, 0.012, 0.1, 6), steel, [0, 0, 0.05], [PI / 2, 0, 0]);
  K.part(scoop, K.hemi(0.055, 14), new THREE.MeshStandardMaterial({ color: 0xd8dce4, metalness: 0.7, roughness: 0.25, side: THREE.DoubleSide }), [0, -0.02, -0.01], [PI, 0, 0]);
  const ball = K.part(scoop, K.sph(0.06, 14, 10), K.S(FL[0], { roughness: 0.8 }), [0, -0.035, -0.01], null, 0.001);
  const tmp = new THREE.Vector3(), upP = new THREE.Vector3(), glow = K.sprite(0x8affb0, 0.4, null, 0);
  let cu = 0;
  cam.position.set(0.15, 1.52, 1.0); cam.lookAt(-0.22, 0.98, -0.3);
  return {
    fov: 55, fovTall: 74, gauge: "v", flip: true,
    update(v, t, dt) {
      cu = damp(cu, clamp(v.u, 0, 1.6), 7, dt); const e = Math.min(1, cu), T = tubs[tub];
      upP.set(T.x + 0.1, 1.25, 0.3); tmp.set(T.x, 1.0, 0.1);
      scoop.position.lerpVectors(upP, tmp, ease(e)); scoop.position.y -= Math.max(0, cu - 1) * 0.04;
      scoop.rotation.set(-0.25 - e * 0.75, 0.2, 0);
      ball.material = K.S(T.c, { roughness: 0.8 });
      ball.scale.setScalar(v.state === "go" ? Math.max(0.001, v.prog) : 0.001);
      glow.position.copy(tmp).add(new THREE.Vector3(0, 0.06, 0)); glow.material.opacity = v.state === "go" && v.inBand ? 0.3 + v.prog * 0.4 : 0;
      if (v.fresh && cone) {
        const b = K.part(null, K.sph(0.06, 14, 10), K.S(T.c, { roughness: 0.8 }));
        scoop.updateMatrixWorld(); ball.getWorldPosition(b.position);
        flying.push({ m: b, from: b.position.clone(), c: cone, i: cone.balls, t: 0 }); cone.balls++;
        tub = (tub + 1) % tubs.length;
        if (cone.balls >= 3) waitHand = 1.0;
      }
      if (waitHand > 0 && (waitHand -= dt) <= 0) {
        handing.push({ c: cone, a: q.shift(), t: 0 }); const nb = make(nextC++); nb.g.position.copy(SPOT(3)); q.push(nb); q.forEach((x, j) => { x.at = SPOT(j); });
        cone = makeCone();
      }
      flying = flying.filter((f) => {
        f.t += dt; const k = clamp(f.t / 0.6, 0, 1); tmp.copy(f.c.g.position).add(new THREE.Vector3(0, 0.32 + f.i * 0.1, 0));
        f.m.position.lerpVectors(f.from, tmp, ease(k)); f.m.position.y += Math.sin(k * PI) * 0.2;
        if (k >= 1) { f.c.g.attach(f.m); return false; }
        return true;
      });
      handing = handing.filter((h) => {
        h.t += dt; const k = clamp(h.t / 1.2, 0, 1), a = h.a, p = a.g.position;
        if (h.t < 1.4) { h.c.g.position.lerpVectors(CONE, tmp.set(p.x + 0.18, 0.62, p.z + 0.25), ease(k)); a.g.position.y = Math.abs(Math.sin(h.t * 8)) * 0.06; }
        else { p.x -= dt * 1.2; p.y = 0; a.g.rotation.y = -PI / 2; h.c.g.position.set(p.x + 0.1, 0.62, p.z + 0.2); if (h.t > 6.5) { a.g.visible = false; h.c.g.visible = false; return false; } }
        if (a.idle) a.idle(t);
        return true;
      });
      q.forEach((a) => { a.g.position.lerp(a.at, Math.min(1, dt * 1.5)); a.g.rotation.y = Math.atan2(cam.position.x - a.g.position.x, cam.position.z - a.g.position.z); if (a.idle) a.idle(t); });
    },
    focus(p) { p.copy(CONE).add(new THREE.Vector3(0, 0.4, 0)); },
  };
});

// ================================================================ 34. Fill to the Line (Hold, tip to pour)
// A lemonade stand. Tip the jug into the band and lemonade pours into the glass; keep it steady to fill it
// to the line, and it goes to the next thirsty animal.
P3.add("fill", (K, THREE, cam) => {
  sunny(K, { sunDir: [-0.4, 0.45, -1], sun: 1.15, dir: [-0.4, 0.9, 0.6] });
  meadow(K); shadowBox(K, 5); backdrop(K);
  trees(K, K.ring(30, 8, 60, { free: true, ok: (x, z) => z < -3 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  flowers(K, 120, [-6, 6, -6, -2.2]);
  // the stand
  const wood = new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#d8a868"), roughness: 0.75 });
  K.part(null, K.box(1.8, 0.85, 0.7), wood, [0, 0.43, 0]);
  K.part(null, K.box(1.9, 0.05, 0.8), K.M(0xfff4d8), [0, 0.88, 0]);
  for (const x of [-0.85, 0.85]) K.part(null, K.box(0.07, 1.45, 0.07), wood, [x, 1.6, -0.3]);
  const awn = K.tex(256, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#ffd23a"; g.fillRect((i * w) / 8, 0, w / 8 + 1, h); } });
  K.part(null, K.box(2.1, 0.06, 1.1), new THREE.MeshStandardMaterial({ map: awn, roughness: 0.7 }), [0, 2.3, -0.2], [0.1, 0, 0]);
  K.part(null, K.plane(1.4, 0.32), new THREE.MeshStandardMaterial({ map: textTex(K, "LEMONADE", { bg: "#fff8e0", color: "#e8a020" }) }), [0, 0.55, -0.36], [0, PI, 0], null, true);
  // a bowl of lemons
  K.part(null, K.cyl(0.16, 0.1, 0.08, 14), K.M(0x5ab4f0), [-0.65, 0.95, 0.05]);
  for (let i = 0; i < 5; i++) K.part(null, K.sph(0.055, 10, 8), K.S(0xffe040, { roughness: 0.6 }), [-0.65 + Math.cos(i * 1.3) * 0.07, 1.0 + (i === 4 ? 0.04 : 0), 0.05 + Math.sin(i * 1.3) * 0.07], null, [1, 0.85, 0.85]);
  // the glass, filling up
  const G0 = new THREE.Vector3(-0.02, 0.905, 0.12), GH = 0.24, liqM = K.S(0xffe24a, { transparent: true, opacity: 0.85, roughness: 0.2 });
  const setLvl = (gl, l) => { gl.lvl = l; const h = Math.max(0.001, l * GH * 0.85); gl.liq.scale.y = h; gl.liq.position.y = 0.01 + h / 2; };
  const glassG = () => { const g = K.group(null, G0.toArray()); K.part(g, K.cyl(0.075, 0.065, GH, 18, 1, true), glassMat(THREE), [0, GH / 2, 0]); K.part(g, K.cyl(0.065, 0.065, 0.01, 18), glassMat(THREE, { opacity: 0.4 }), [0, 0.005, 0]); const liq = K.part(g, K.cyl(0.066, 0.06, 1, 16), liqM, [0, 0.01, 0], null, [1, 0.001, 1], true); K.part(g, K.tor(0.074, 0.004, 4, 20), K.B(0xffffff), [0, GH * 0.85, 0], [PI / 2, 0, 0], null, true); return { g, liq, lvl: 0 }; };
  let glass = glassG(), served = [];
  // the jug, pivoting on its base edge so it tips toward the glass
  const PV = new THREE.Vector3(0.17, 1.08, 0.12), jug = K.group(null, PV.toArray()), jm = glassMat(THREE, { opacity: 0.35 });
  K.part(jug, K.cyl(0.1, 0.11, 0.3, 18, 1, true), jm, [0.11, 0.15, 0]);
  K.part(jug, K.cyl(0.1, 0.1, 0.01, 18), jm, [0.11, 0.005, 0]);
  const jLiq = K.part(jug, K.cyl(0.095, 0.105, 0.2, 16), liqM, [0.11, 0.11, 0], null, null, true);
  K.part(jug, K.tor(0.07, 0.012, 6, 14, PI), jm, [0.22, 0.15, 0], [0, 0, -PI / 2]);
  K.part(jug, K.cone(0.04, 0.06, 8), jm, [0.0, 0.29, 0], [0, 0, 0.9]);
  const stream = K.part(null, K.cyl(0.012, 0.016, 1, 8), liqM, null, null, null, true);
  const spout = new THREE.Vector3(), tmp = new THREE.Vector3();
  // the queue of thirsty animals across the stand
  const KINDS = ["rabbit", "pig", "panda", "sheep", "chicken"], SPOT = (j) => new THREE.Vector3(-0.3 - j * 0.85, 0, -1.15 - j * 0.45);
  const q = [0, 1, 2].map((i) => { const a = animal(K, KINDS[i], 0.95); a.g.position.copy(SPOT(i)); a.at = SPOT(i); return a; });
  let nextC = 3, tip = 0;
  cam.position.set(-0.4, 1.5, 1.3); cam.lookAt(0.0, 1.02, -0.05);
  return {
    fov: 52, fovTall: 72, gauge: "h",
    update(v, t, dt) {
      tip = damp(tip, Math.min(1.35, clamp(v.u, 0, 2) * 0.8), 8, dt); jug.rotation.z = tip;
      const pouring = v.state === "go" && v.inBand && !!glass;
      jug.updateMatrixWorld(); spout.set(-0.02, 0.31, 0); jug.localToWorld(spout);
      if (glass && v.state === "go") setLvl(glass, v.prog);
      stream.visible = pouring;
      if (pouring) { tmp.set(G0.x, G0.y + 0.02 + glass.lvl * GH * 0.85, G0.z); const L = Math.max(0.01, spout.y - tmp.y); stream.position.set((spout.x + tmp.x) / 2, (spout.y + tmp.y) / 2, tmp.z); stream.scale.set(1, L, 1); stream.rotation.z = Math.atan2(spout.x - tmp.x, L); }
      jLiq.scale.y = Math.max(0.25, 1 - (served.length % 6) * 0.1);
      if (v.fresh && glass) { setLvl(glass, 1); served.push({ g: glass, a: q.shift(), t: 0 }); glass = null; const nb = animal(K, KINDS[nextC++ % KINDS.length], 0.95); nb.g.position.copy(SPOT(3)); q.push(nb); q.forEach((x, j) => { x.at = SPOT(j); }); }
      if (!glass && !served.some((s) => s.t < 0.9)) glass = glassG();
      served = served.filter((s) => {
        s.t += dt; const a = s.a, p = a.g.position, k = clamp(s.t / 0.9, 0, 1);
        if (s.t < 2.2) s.g.g.position.lerpVectors(G0, tmp.set(p.x + 0.12, 0.905, p.z + 0.62), ease(k));
        if (s.t > 1.1 && s.t < 2.2) { setLvl(s.g, 1 - (s.t - 1.1) / 1.1); a.g.position.y = Math.abs(Math.sin(s.t * 6)) * 0.05; }
        if (s.t >= 2.2) { p.x -= dt * 1.1; p.y = 0; a.g.rotation.y = -PI / 2; if (s.t > 7) { a.g.visible = false; s.g.g.visible = false; return false; } }
        if (a.idle) a.idle(t);
        return true;
      });
      q.forEach((a) => { a.g.position.lerp(a.at, Math.min(1, dt * 1.5)); a.g.rotation.y = Math.atan2(cam.position.x - a.g.position.x, cam.position.z - a.g.position.z); if (a.idle) a.idle(t); });
    },
    focus(p) { p.copy(G0).add(new THREE.Vector3(0, 0.3, 0)); },
  };
});
})();
