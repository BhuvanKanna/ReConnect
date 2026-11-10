// Fourth batch of 3D scenes for js/play3d.js: the exercises built on the other engines in js/moves.js
// (Circles, Seq, Throw, Dial, Track, Bursts, Path, Catch, Direction, Steer). Same contract as the other
// scene files; each engine's view() fields are described where it is defined in js/moves.js.
(() => {
"use strict";
const RC = window.RC;
const P3 = RC.Play3D;
if (!P3 || !P3.lib) return;
const { PI, clamp, damp, lerp, ease, A, fit, animal, trees, pines, flowers, stick, textTex, sunny, shadowBox, target } = P3.lib;
const TAU = PI * 2, bare = P3.lib.bare;
const meadow = (K, o = {}) => K.ground({ size: o.size || 280, seg: o.seg || 90,
  h: o.h || ((x, z) => (z < (o.z0 || -16) ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 10 * Math.min(1, ((o.z0 || -16) - z) / 40) : 0)),
  color: o.color || ((x, z) => K.mix(0x66a648, 0x92c85e, K.fbm(x * 0.15, z * 0.15))) });
const backdrop = (K, o = {}) => { K.peaks(o.n || 14, 150, 220, 30, 60, o.peak || 0x7aa0b0, { snow: 0xf4f8fc }); K.clouds(o.clouds || 12); };
const camPt = (cam, x, y, z, out) => out.set(x, y, z).applyMatrix4(cam.matrixWorld);
const glassMat = (THREE, o) => new THREE.MeshStandardMaterial(Object.assign({ color: 0xe8f4f8, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false }, o || {}));
const wrapA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
// Follows the angle of the tilt (x, y) round and round, unwrapped, while the tilt is past the ring.
function spinner() {
  let prev = null, phase = 0, speed = 0;
  return (v, dt) => {
    const r = Math.hypot(v.x, v.y);
    if (r >= v.minR * 0.9) { const th = Math.atan2(v.y, v.x); if (prev != null) { const d = wrapA(th - prev); phase += d; speed = damp(speed, d / Math.max(dt, 1e-3), 6, dt); } prev = th; }
    else { prev = null; speed = damp(speed, 0, 3, dt); }
    return { phase, speed, r };
  };
}
// a curved arrow lying flat that shows which way to go round (dir 1: counterclockwise seen from above)
function turnArrow(K, parent, r, color) {
  const THREE = K.THREE, END = PI * 1.3, g = K.group(parent), m = K.E(color || 0x5ad88c, { emissiveIntensity: 0.6, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  K.part(g, K.tor(r, r * 0.06, 6, 30, END), m, null, [-PI / 2, 0, 0], null, true);
  const head = K.part(g, K.cone(r * 0.16, r * 0.3, 10), m, [Math.cos(END) * r, 0, -Math.sin(END) * r], null, null, true);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-Math.sin(END), 0, -Math.cos(END)));
  return (dir, t) => { g.scale.z = dir > 0 ? 1 : -1; g.rotation.y = dir * t * 0.6; };
}

// ================================================================ 35. Stir the Pot (Circles)
// Camp soup. Your tilt moves the ladle round the pot; every full circle swirls the soup and drops in
// another vegetable. Halfway through, the arrow turns round and you stir the other way.
P3.add("stir", (K, THREE, cam, S) => {
  sunny(K, { top: 0x3a6ab8, mid: 0xf0b88a, low: 0xffe0b0, sunDir: [-0.6, 0.15, -1], sun: 1.4, sunColor: 0xffc890, fog: 0xe8c8a8, skyL: 0xffe8d0, sunL: 0xffd8a8, sunI: 2.0, dir: [-0.6, 0.6, -0.4] });
  meadow(K, { color: (x, z) => (Math.hypot(x, z) < 1.6 ? K.mix(0x8a7458, 0x6a5a44, K.noise(x * 3, z * 3)) : K.mix(0x5a8a3a, 0x7aa84a, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 6); backdrop(K);
  pines(K, K.ring(40, 7, 60, { free: true }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(0.9, 1.6) })));
  // campfire stones and logs under the pot
  K.inst(K.dod(0.12), K.M(0x8a8a90), Array.from({ length: 12 }, (_, i) => ({ x: Math.cos((i / 12) * TAU) * 0.62, y: 0.06, z: Math.sin((i / 12) * TAU) * 0.62, s: K.R(0.8, 1.2), ry: i })));
  for (let i = 0; i < 4; i++) K.part(null, K.cyl(0.05, 0.05, 0.7, 6), K.M(0x5a3a22), [0, 0.08, 0], [PI / 2, (i / 4) * PI, 0.2]);
  const flames = [0, 1, 2, 3, 4].map((i) => K.part(null, K.cone(0.09, 0.3, 6), K.E([0xff7a1a, 0xffb02a, 0xffd04a][i % 3], { emissiveIntensity: 1 }), [Math.cos(i * 1.3) * 0.12, 0.2, Math.sin(i * 1.3) * 0.12], null, null, true));
  K.sprite(0xff9a3a, 1.6, [0, 0.3, 0], 0.5);
  const fire = new THREE.PointLight(0xff9a4a, 2, 4, 1.6); fire.position.set(0, 0.35, 0); K.scene.add(fire);
  // tripod and the pot
  const PY = 0.42, PR = 0.42;
  K.part(null, K.lathe([[0.0, 0], [0.3, 0.02], [0.44, 0.15], [0.46, 0.32], [0.43, 0.46], [0.45, 0.48]], 28), new THREE.MeshStandardMaterial({ color: 0x4a4a56, roughness: 0.45, metalness: 0.3, side: THREE.DoubleSide }), [0, PY - 0.1, 0]);
  const swirl = K.tex(256, 256, (g, w, h) => {
    g.fillStyle = "#e8822a"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(255,210,140,0.65)"; g.lineWidth = 6;
    for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = 0; i < 120; i++) { const a = i * 0.12 + (k * TAU) / 3, r = i * 1.05; g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } g.stroke(); }
  });
  const soup = K.part(null, K.circle(PR, 32), new THREE.MeshStandardMaterial({ map: swirl, roughness: 0.35 }), [0, PY + 0.3, 0], [-PI / 2, 0, 0], null, true);
  const steam = Array.from({ length: 6 }, (_, i) => ({ s: K.sprite(0xffffff, 0.4, null, 0), t: i * 0.5 }));
  const arrow = turnArrow(K, K.group(null, [0, PY + 0.32, 0]), PR * 0.62);
  // vegetables floating in the swirl, one more per circle
  const VEG = [[K.cyl(0.04, 0.04, 0.015, 10), 0xff8a2a], [K.sph(0.025, 8, 6), 0x5ac84a], [K.box(0.05, 0.05, 0.05), 0xf4e8c8], [K.sph(0.035, 8, 6), 0xf4f0e8], [K.cyl(0.04, 0.04, 0.015, 10), 0xffc82a]];
  const veg = [], drops = [];
  // the ladle
  const ladle = K.group(null), wood = K.S(0xb07a44, { roughness: 0.6 });
  K.part(ladle, K.hemi(0.08, 14), new THREE.MeshStandardMaterial({ color: 0xc88a4a, roughness: 0.6, side: THREE.DoubleSide }), [0, 0.03, 0], [PI, 0, 0]);
  const handle = stick(K, 0.028, wood);
  // a hungry friend waiting with a bowl
  const pal = animal(K, "rabbit", 0.7); pal.g.position.set(-1.35, 0, -0.6); pal.g.rotation.y = 1.0;
  K.part(null, K.cyl(0.12, 0.08, 0.07, 14), K.M(0x5ab4f0), [-1.1, 0.04, -0.35]);
  const spin = spinner(), tip = new THREE.Vector3(), top = new THREE.Vector3(), glow = K.sprite(0xffe0a0, 0.6, null, 0);
  let rot = 0, laps = 0;
  cam.position.set(0, 1.85, 1.55); cam.lookAt(0, 0.62, 0);
  return {
    fov: 50, fovTall: 70, gauge: "none",
    update(v, t, dt) {
      const sp = spin(v, dt), r = Math.min(1.2, sp.r), a = Math.atan2(v.y, v.x), rr = PR * 0.72 * Math.min(1, r / Math.max(0.6, v.minR * 1.4));
      tip.set(Math.cos(a) * rr, PY + 0.33, -Math.sin(a) * rr);
      ladle.position.copy(tip); top.set(tip.x * 0.5 + 0.45, PY + 0.95, tip.z * 0.5 + 0.75); handle(tip.clone().add(new THREE.Vector3(0, 0.03, 0)), top);
      rot = damp(rot, sp.phase, 3, dt); soup.rotation.z = rot;
      arrow(v.dir, K.calm ? 0 : t);
      glow.position.copy(tip); glow.material.opacity = r >= v.minR ? 0.25 + v.prog * 0.5 : 0;
      flames.forEach((f, i) => { f.scale.set(1, K.calm ? 1 : 0.8 + Math.abs(Math.sin(t * 7 + i * 1.7)) * 0.5, 1); });
      fire.intensity = 1.8 + (K.calm ? 0 : Math.sin(t * 11) * 0.3);
      steam.forEach((q) => { q.t += dt * (0.6 + Math.abs(sp.speed) * 0.1); const k = q.t % 3 / 3; q.s.position.set(Math.sin(q.t * 2) * 0.15, PY + 0.4 + k * 1.1, Math.cos(q.t * 1.7) * 0.1); q.s.material.opacity = (1 - k) * 0.35; q.s.scale.setScalar(0.3 + k * 0.6); });
      if (v.fresh) { const [geo, c] = VEG[laps % VEG.length]; const m = K.part(null, geo, K.S(c, { roughness: 0.6 }), null, null, null, true); drops.push({ m, t: 0, a: K.R(0, TAU), r: K.R(0.08, PR * 0.75) }); laps++; }
      drops.forEach((d) => { d.t += dt; const k = Math.min(1, d.t / 0.6); if (k < 1) d.m.position.set(Math.cos(d.a) * d.r, PY + 0.32 + (1 - k) * 0.9, Math.sin(d.a) * d.r); else if (!d.done) { d.done = true; veg.push(d); } });
      veg.forEach((d, i) => { const aa = d.a - rot; d.m.position.set(Math.cos(aa) * d.r, PY + 0.315 + Math.sin(t * 2 + i) * 0.004, Math.sin(aa) * d.r); d.m.rotation.y = -rot + i; });
      if (pal.idle) pal.idle(t);
    },
    focus(p) { p.set(0, PY + 0.4, 0); },
  };
});

// ================================================================ 36. Wrist Circles (Circles)
// The animal carousel. Circling your wrist turns the carousel with you; each full circle lights another
// string of bulbs round the canopy. Halfway through, it turns the other way.
P3.add("wristcircle", (K, THREE, cam, S) => {
  K.sky(0x1a2a6a, 0x6a5aa8, 0xffa88a, { sunDir: [0.3, 0.05, -1], sun: 1.0, sunColor: 0xffb080, horizon: 0.14 });
  K.scene.fog = new THREE.Fog(0x8a7aa8, 30, 160);
  K.lights({ sky: 0xd8c8ff, ground: 0x4a5a3a, hemi: 1.2, sun: 0xffd0a8, sunI: 1.6, dir: [0.4, 0.6, 0.6] });
  meadow(K, { color: (x, z) => (Math.hypot(x, z) < 2.7 ? K.mix(0xd8c8a8, 0xc8b898, K.noise(x * 2, z * 2)) : K.mix(0x4a7a3a, 0x6a9a4a, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 6); K.stars(300, { minY: 0.35, opacity: 0.6 });
  trees(K, K.ring(30, 9, 60, { free: true }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  // string lights on poles round the fair
  const bulbs = [];
  for (let i = 0; i < 6; i++) { const a = -0.6 + i * 0.25, x = Math.sin(a) * 6, z = -Math.cos(a) * 6; K.part(null, K.cyl(0.05, 0.05, 3, 6), K.M(0x5a4a3a), [x, 1.5, z]); if (i) for (let k = 1; k < 8; k++) { const a0 = a - 0.25, u = k / 8, aa = lerp(a0, a, u); bulbs.push({ x: Math.sin(aa) * 6, y: 2.9 - Math.sin(u * PI) * 0.5, z: -Math.cos(aa) * 6, c: [0xffd23a, 0xff7aa8, 0x7ad0ff][k % 3] }); } }
  K.inst(K.sph(0.06, 6, 4), K.B(0xffffff), bulbs, { shadow: false });
  // the carousel
  const car = K.group(null), base = K.group(car);
  K.part(base, K.cyl(2.1, 2.2, 0.25, 32), K.M(0xf4e8d8), [0, 0.12, 0]);
  K.part(base, K.cyl(2.12, 2.12, 0.08, 32), K.M(0xd84a6a), [0, 0.27, 0]);
  K.part(car, K.cyl(0.18, 0.18, 2.6, 12), K.S(0xffd23a, { metalness: 0.3, roughness: 0.4 }), [0, 1.5, 0]);
  const canopyTex = K.tex(512, 64, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#e84a6a"; g.fillRect((i * w) / 16, 0, w / 16 + 1, h); } });
  K.part(car, K.cone(2.4, 0.9, 32), new THREE.MeshStandardMaterial({ map: canopyTex, roughness: 0.6 }), [0, 3.15, 0]);
  K.part(car, K.cyl(2.35, 2.35, 0.25, 32), K.M(0xffd23a), [0, 2.6, 0]);
  K.part(car, K.sph(0.18, 12, 10), K.S(0xffd23a, { metalness: 0.4 }), [0, 3.7, 0]);
  // bulbs round the canopy rim, lit a string at a time
  const NL = clamp(S.reps || 4, 4, 10), NB = 48, rim = [];
  for (let i = 0; i < NB; i++) { const a = (i / NB) * TAU; rim.push(K.part(car, K.sph(0.06, 6, 4), K.M(0x8a8070), [Math.cos(a) * 2.38, 2.6, Math.sin(a) * 2.38], null, null, true)); }
  // animals riding on poles
  const KINDS = [["horse", 0.95], ["pig", 0.7], ["rabbit", 0.7], ["panda", 0.75], ["sheep", 0.75], ["chicken", 0.6]], riders = [];
  KINDS.forEach(([k, h], i) => {
    const a = (i / KINDS.length) * TAU, g = K.group(car, [Math.cos(a) * 1.55, 0, Math.sin(a) * 1.55]);
    K.part(g, K.cyl(0.035, 0.035, 2.4, 6), K.S(0xffd23a, { metalness: 0.4, roughness: 0.3 }), [0, 1.5, 0]);
    const rideG = K.group(g, [0, 0.7, 0]), an = animal(K, k, h, rideG); an.g.position.y = -h * 0.35; an.g.rotation.y = PI;
    g.rotation.y = -a; riders.push({ g: rideG, an, i });
  });
  const spin = spinner(), notes = [], noteTex = textTex(K, "♪", { bg: "rgba(0,0,0,0)", color: "#ffffff", w: 128, h: 128 });
  let lit = 0, rot = 0;
  cam.position.set(0, 2.5, 6.6); cam.lookAt(0, 1.55, 0);
  return {
    fov: 52, fovTall: 72, gauge: "none",
    update(v, t, dt) {
      const sp = spin(v, dt); rot = damp(rot, sp.phase * 0.6, 4, dt); car.rotation.y = rot;
      riders.forEach((r) => { r.g.position.y = 0.7 + Math.sin(rot * 3 + r.i * 1.1) * 0.18; if (r.an.idle) r.an.idle(t); });
      if (v.fresh) {
        lit = Math.min(NL, lit + 1);
        for (let i = 0; i < NB; i++) if (i < Math.round((lit / NL) * NB)) rim[i].material = K.E([0xffd23a, 0xff7aa8, 0x7ad0ff][i % 3], { emissiveIntensity: 1 });
        for (let i = 0; i < 3; i++) { const sp2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex, color: [0xffd23a, 0xff7aa8, 0x7ad0ff][i], transparent: true, depthWrite: false })); sp2.scale.setScalar(0.5); K.scene.add(sp2); notes.push({ sp: sp2, t: -i * 0.3, x: K.R(-1.5, 1.5) }); }
      }
      notes.forEach((n) => { n.t += dt; const k = Math.max(0, n.t); n.sp.visible = n.t > 0 && k < 2.5; n.sp.position.set(n.x + Math.sin(k * 3) * 0.2, 3.9 + k * 0.8, 1.5); n.sp.material.opacity = 1 - k / 2.5; });
    },
    focus(p) { p.set(0, 3, 1.5); },
  };
});

// ================================================================ 37. Trunk Circles (Circles)
// Hula hoop on the beach. Circling your upper body spins the panda's hoop round its middle, the panda
// swaying with you. Every full circle earns it another hoop.
P3.add("trunkcircle", (K, THREE, cam, S) => {
  sunny(K, { top: 0x2a7ad8, mid: 0x9ad0f0, low: 0xf8f0d8, sunDir: [0.4, 0.5, -1], sun: 1.2 });
  K.ground({ size: 300, seg: 90, h: (x, z) => (z < -8 ? -0.6 : 0) + (z > -8 ? K.fbm(x * 0.2, z * 0.2) * 0.1 : 0), color: (x, z, y) => (y < -0.3 ? 0xd8c890 : K.mix(0xf4e4b8, 0xe8d4a0, K.fbm(x * 0.3, z * 0.3))) });
  K.water({ size: 400, seg: 70, color: 0x2a9ac8, y: -0.25, z: -205, amp: 0.1 });
  shadowBox(K, 6); K.clouds(12);
  // palm trees
  const palm = (x, z, h, lean) => { const g = K.group(null, [x, 0, z], [0, K.R(0, 6), lean]); for (let i = 0; i < 6; i++) K.part(g, K.cyl(0.13 - i * 0.012, 0.15 - i * 0.012, h / 6, 7), K.M(0x9a7a52), [Math.sin(i * 0.25) * 0.15 * i, (i + 0.5) * (h / 6), 0], [0, 0, -0.05 * i]); const top = K.group(g, [Math.sin(1.25) * 0.75, h, 0]); for (let i = 0; i < 7; i++) K.part(top, K.box(0.24, 0.03, 1.6), K.swayM(0x3a9a3a, 0.05, 1.2), [0, 0, 0.75], [-0.5, (i / 7) * TAU, 0]); };
  palm(-3.2, -3, 3.6, 0.15); palm(3.6, -2.4, 3.2, -0.2); palm(-6, -5, 4, 0.1); palm(6.5, -6, 3.8, -0.1);
  K.part(null, K.cyl(1.0, 1.0, 0.02, 24), K.M(0xff6a8a), [1.6, 0.01, 0.6], null, [1, 1, 0.55]);
  K.part(null, K.cyl(0.03, 0.03, 2.2, 6), K.M(0xf4f0e8), [-2.6, 1.1, -1.6], [0, 0, 0.15]); K.part(null, K.cone(1.1, 0.5, 12), K.S(0xff6a5a, { roughness: 0.6 }), [-2.76, 2.25, -1.6], [0, 0, 0.15]);
  // the panda and its hoops
  const body = K.group(null), pan = animal(K, "panda", 1.25, body);
  const COL = [0xff4a7a, 0xffd23a, 0x4ab8ff, 0x6ad86a, 0xb46aff, 0xff8a3a], NH = clamp((S.reps || 4) + 1, 2, 9);
  const hoops = Array.from({ length: NH }, (_, i) => { const g = K.group(null), inner = K.group(g, null, [0.3, 0, 0]); K.part(inner, K.tor(0.62 + i * 0.015, 0.03, 8, 40), K.S(COL[i % COL.length], { roughness: 0.3 }), null, [PI / 2, 0, 0]); g.visible = i === 0; return { g, inner, show: i === 0 ? 1 : 0 }; });
  let earned = 1;
  const spin = spinner(), conf = [];
  let lean = new THREE.Vector2();
  cam.position.set(0, 1.35, 3.6); cam.lookAt(0, 0.8, 0);
  return {
    fov: 52, fovTall: 72, gauge: "none",
    update(v, t, dt) {
      const sp = spin(v, dt);
      lean.x = damp(lean.x, clamp(v.x, -1.3, 1.3), 8, dt); lean.y = damp(lean.y, clamp(v.y, -1.3, 1.3), 8, dt);
      body.rotation.set(-lean.y * 0.18, 0, -lean.x * 0.18);
      if (pan.idle) pan.idle(t);
      if (v.fresh && earned < NH) { hoops[earned].g.visible = true; hoops[earned].show = 0; earned++; for (let i = 0; i < 24; i++) conf.push({ m: K.part(null, K.box(0.05, 0.05, 0.01), K.M(COL[i % COL.length], { side: THREE.DoubleSide }), null, null, null, true), p: new THREE.Vector3(0, 1.4, 0), v: new THREE.Vector3(K.R(-1.5, 1.5), K.R(2, 3.5), K.R(-1, 1)), life: 2 }); }
      hoops.forEach((h, i) => {
        if (!h.g.visible) return; h.show = Math.min(1, h.show + dt * 2);
        const ph = sp.phase * 1.0 + i * 0.7, y = 0.55 + i * 0.07, off = 0.09;
        h.g.position.set(Math.cos(ph) * off - lean.x * 0.08, y + Math.sin(ph * 2) * 0.02, -Math.sin(ph) * off);
        h.g.rotation.y = -ph; h.inner.rotation.x = 0.18 + Math.abs(Math.sin(ph)) * 0.04; h.g.scale.setScalar(ease(h.show));
      });
      for (const c of conf) { if (c.life <= 0) continue; c.life -= dt; c.v.y -= 4 * dt; c.p.addScaledVector(c.v, dt); c.m.position.copy(c.p); c.m.rotation.x += dt * 6; c.m.visible = c.life > 0 && c.p.y > 0; }
    },
    focus(p) { p.set(0, 1.0, 0); },
  };
});

// ================================================================ 38. Ankle Circles (Circles)
// The potter's wheel. Circling your foot works the pedal and spins the wheel; every circle raises the
// clay pot a little taller, and when it is done it is glazed and goes on the shelf.
P3.add("anklecircles", (K, THREE, cam, S) => {
  K.scene.background = new THREE.Color(0xe8dcc8);
  K.lights({ sky: 0xfff4e8, ground: 0x8a7a68, hemi: 1.3, sun: 0xfff0d8, sunI: 2.0, dir: [-0.5, 0.9, 0.6] });
  shadowBox(K, 4);
  const wood = new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#a8805a"), roughness: 0.8 });
  K.part(null, K.box(9, 0.1, 7), wood, [0, -0.05, -0.5]);
  K.part(null, K.box(9, 4, 0.1), K.M(0xf0e4d0), [0, 2, -2.6]);
  K.part(null, K.box(0.1, 4, 7), K.M(0xe8dcc8), [-3.4, 2, -0.5]);
  // a sunny window and shelves of finished pots
  K.part(null, K.plane(1.3, 1.1), K.B(0xbfe4ff), [1.7, 2.2, -2.54], null, null, true);
  for (const [w, h, x, y] of [[1.42, 0.07, 0, 0.58], [1.42, 0.07, 0, -0.58], [0.07, 1.2, 0.68, 0], [0.07, 1.2, -0.68, 0]]) K.part(null, K.box(w, h, 0.05), K.M(0xffffff), [1.7 + x, 2.2 + y, -2.52]);
  for (const y of [1.2, 1.9]) K.part(null, K.box(1.8, 0.05, 0.35), wood, [-1.6, y, -2.4]);
  const GLAZE = [0x4a8ad8, 0x3aa88a, 0xd85a4a, 0xe8b83a, 0x8a5ac8, 0x5ab8d8];
  const pots = [], potGeo = (h, belly, neck) => K.lathe([[0, 0], [0.09, 0], [0.11 + belly * 0.5, h * 0.25], [0.1 + belly, h * 0.5], [0.08 + neck, h * 0.85], [0.07 + neck, h]], 20);
  // the wheel
  K.part(null, K.box(1.0, 0.6, 0.8), K.M(0x6a8aa8), [0, 0.3, 0]);
  K.part(null, K.cyl(0.5, 0.52, 0.12, 24), K.M(0x5a7a98), [0, 0.66, 0]);
  const wheel = K.group(null, [0, 0.74, 0]);
  K.part(wheel, K.cyl(0.38, 0.38, 0.05, 28), K.M(0xb8b8c0, { metalness: 0.4 }), [0, 0, 0]);
  for (let i = 0; i < 4; i++) K.part(wheel, K.box(0.7, 0.002, 0.03), K.M(0x8a8a90), [0, 0.026, 0], [0, (i * PI) / 4, 0], null, true);
  const clayM = K.S(0xa8684a, { roughness: 0.55 });
  const clay = K.part(wheel, potGeo(0.1, 0.06, 0.04), clayM, [0, 0.025, 0]);
  // the foot pedal
  const pedal = K.group(null, [0.25, 0.08, 0.6]); K.part(pedal, K.box(0.3, 0.04, 0.42), K.M(0x3a3a40), [0, 0, 0]);
  const arrow = turnArrow(K, K.group(null, [0, 0.79, 0]), 0.46);
  // a cat watching from the stool
  K.part(null, K.cyl(0.25, 0.25, 0.05, 16), wood, [-1.3, 0.5, 0.2]); K.part(null, K.cyl(0.04, 0.04, 0.5, 6), K.M(0x5a4030), [-1.3, 0.25, 0.2]);
  const cat = animal(K, "fennec", 0.55); cat.g.position.set(-1.3, 0.53, 0.2); cat.g.rotation.y = 0.8;
  const N = clamp(S.reps || 4, 4, 10), spin = spinner(), glow = K.sprite(0xffe0a0, 0.9, [0, 1.0, 0], 0);
  let laps = 0, h = 0.1, shapeT = 0, done = null;
  cam.position.set(0, 1.55, 1.75); cam.lookAt(0, 0.85, 0);
  return {
    fov: 52, fovTall: 72, gauge: "none",
    update(v, t, dt) {
      const sp = spin(v, dt); wheel.rotation.y = sp.phase * 1.5;
      pedal.rotation.x = clamp(v.y, -1, 1) * 0.25; pedal.rotation.z = -clamp(v.x, -1, 1) * 0.15;
      arrow(v.dir, K.calm ? 0 : t);
      glow.material.opacity = sp.r >= v.minR ? 0.2 + v.prog * 0.4 : 0;
      if (v.fresh) { laps++; shapeT = 1; }
      if (shapeT > 0) {
        shapeT = Math.max(0, shapeT - dt * 1.5);
        const k = laps / N, want = 0.1 + Math.min(1, k) * 0.32; h = damp(h, want, 6, dt);
        clay.geometry.dispose(); clay.geometry = potGeo(h, 0.04 + Math.min(1, k) * 0.07 + Math.sin(laps) * 0.01, 0.02 + (laps % 3) * 0.015);
        if (laps >= N && shapeT === 0 && !done) done = { t: 0 };
      }
      if (done) {
        done.t += dt;
        if (done.t > 0.6 && clay.material === clayM) clay.material = K.S(GLAZE[pots.length % GLAZE.length], { roughness: 0.2 });
        if (done.t > 1.6) { const p = K.part(null, clay.geometry.clone(), clay.material, [-2.3 + (pots.length % 6) * 0.32, pots.length < 6 ? 1.225 : 1.925, -2.35], null, 0.75); pots.push(p); clay.material = clayM; laps = 0; h = 0.1; clay.geometry.dispose(); clay.geometry = potGeo(0.1, 0.06, 0.04); done = null; }
      }
      if (cat.idle) cat.idle(t);
    },
    focus(p) { p.set(0, 0.9, 0); },
  };
});

// ================================================================ 39. Reach and Turn (Seq: reach up, then turn)
// A street of little doors. Reach up to the round door handle, then turn your hand to open it, and a
// friend inside waves. Then on to the next door.
P3.add("reachturn", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.4, 0.5, -1], sun: 1.1 });
  meadow(K); shadowBox(K, 6); backdrop(K);
  const N = clamp(S.reps || 6, 3, 12), GAP = 2.2, COLS = [0xe84a5a, 0x4a8ad8, 0x4ab86a, 0xffb83a, 0xb46ad8, 0x3ab8b8], FR = ["rabbit", "panda", "pig", "sheep", "chicken", "fennec", "penguin"];
  const doors = [];
  for (let i = 0; i < N; i++) {
    const x = i * GAP, house = K.group(null, [x, 0, -0.6]);
    K.part(house, K.box(1.9, 2.6, 1.4), K.M([0xf4e8d8, 0xe8f0f8, 0xf8ecd0][i % 3]), [0, 1.3, -0.7]);
    for (const s of [-1, 1]) K.part(house, K.box(1.4, 0.1, 1.7), K.M(0x8a4a3a), [s * 0.5, 2.9, -0.7], [0, 0, -s * 0.75]);
    K.part(house, K.box(0.5, 0.36, 0.05), K.M(0x9ad0f0, { roughness: 0.2 }), [0.0, 2.25, 0.01]); K.part(house, K.box(0.58, 0.05, 0.08), K.M(0xffffff), [0, 2.05, 0.02]);
    K.part(house, K.box(1.05, 1.95, 0.06), K.M(0xffffff), [0, 0.98, 0.0]);
    const hinge = K.group(house, [-0.45, 0, 0.04]);
    K.part(hinge, K.box(0.9, 1.85, 0.06), K.M(COLS[i % COLS.length]), [0.45, 0.93, 0]);
    K.part(hinge, K.sph(0.07, 10, 8), K.M(0xffffff), [0.45, 1.65, 0.04], null, [1, 1, 0.4]);
    const knob = K.group(hinge, [0.78, 1.0, 0.05]);
    K.part(knob, K.cyl(0.06, 0.06, 0.05, 14), K.S(0xffd23a, { metalness: 0.6, roughness: 0.3 }), null, [PI / 2, 0, 0]);
    K.part(knob, K.box(0.17, 0.035, 0.03), K.S(0xffd23a, { metalness: 0.6, roughness: 0.3 }), [0, 0, 0.04]);
    K.part(house, K.box(0.95, 1.85, 0.02), K.M(0x3a2a20), [0, 0.93, -0.02]);
    const fr = animal(K, FR[i % FR.length], 0.8, house); fr.g.position.set(0.15, 0, 0.45); fr.g.visible = false; fr.g.userData.s0 = fr.g.scale.x;
    flowers(K, 10, [x - 1, x + 1, 0.2, 0.7]);
    doors.push({ hinge, knob, fr, open: 0 });
  }
  trees(K, Array.from({ length: N + 3 }, (_, i) => ({ x: i * GAP - GAP * 0.5 + K.R(-0.2, 0.2), z: -3.6, s: K.R(0.9, 1.2) })));
  // your hand
  const hand = K.group(null), skin = K.S(0xf0c8a0, { roughness: 0.7 }), sleeve = K.S(0x5a8ad8, { roughness: 0.8 });
  K.part(hand, K.sph(0.11, 12, 10), skin, null, null, [1, 0.8, 1.15]);
  for (let i = 0; i < 4; i++) K.part(hand, K.cyl(0.02, 0.02, 0.1, 6), skin, [-0.045 + i * 0.03, 0.02, -0.08], [PI / 2 - 0.4, 0, 0]);
  K.part(hand, K.cyl(0.022, 0.022, 0.08, 6), skin, [0.08, 0, -0.02], [PI / 2, 0, -0.8]);
  const arm = stick(K, 0.07, sleeve);
  let at = 0, camX = 0, cu = 0, turn = 0, pending = false, wrapped = false;
  const tmpA = new THREE.Vector3(), hp = new THREE.Vector3(), sh = new THREE.Vector3(), knobW = new THREE.Vector3(), rest = new THREE.Vector3(), glow = K.sprite(0x8affb0, 0.5, null, 0);
  cam.position.set(0, 1.35, 2.6);
  return {
    fov: 55, fovTall: 74, gauge: "v",
    update(v, t, dt) {
      if (v.fresh) pending = true;
      if (pending && !v.need) { pending = false; at++; if (at >= N) { at = 0; wrapped = true; } }
      const cur = doors[at];
      camX = damp(camX, at * GAP, 3, dt); cam.position.set(camX + 0.2, 1.45, 3.3); cam.lookAt(camX, 1.1, -0.6); cam.updateMatrixWorld();
      const step = v.need ? 2 : v.k;
      cu = damp(cu, step === 0 ? clamp(v.u, 0, 1.15) : 1, 8, dt);
      turn = damp(turn, step === 1 ? clamp(v.u, 0, 1.15) : step === 2 ? 1 : 0, 10, dt);
      doors.forEach((q, i) => { const want = (i < at && !wrapped) || (i === at && step === 2) ? 1 : 0; q.open = damp(q.open, want, 3, dt); q.hinge.rotation.y = -q.open * 1.7; q.fr.g.visible = q.open > 0.3; q.fr.g.scale.setScalar(Math.max(0.001, ease(clamp((q.open - 0.3) / 0.5, 0, 1))) * q.fr.g.userData.s0 || 1); if (q.fr.idle) q.fr.idle(t); if (q.fr.g.visible) q.fr.g.rotation.y = Math.sin(t * 5 + i) * 0.25; q.knob.rotation.z = q === cur ? -turn * 0.9 : 0; });
      cur.knob.getWorldPosition(knobW);
      camPt(cam, 0.35, -0.55, -0.9, rest); camPt(cam, 0.45, -0.75, 0.1, sh);
      hp.lerpVectors(rest, knobW, ease(Math.min(1, cu))); hp.z += 0.12;
      if (step === 2) hp.lerpVectors(knobW, rest, ease(Math.min(1, cur.open))).add(new THREE.Vector3(0, 0, 0.12));
      hand.position.copy(hp); hand.rotation.set(0.3, 0, -turn * 0.9 * (step >= 1 ? 1 : 0)); arm(sh, tmpA.lerpVectors(sh, hp, 0.86));
      glow.position.copy(knobW); glow.material.opacity = v.need ? 0 : 0.25 + v.prog * 0.55;
    },
    focus(p) { doors[at].knob.getWorldPosition(p); },
  };
});

// ================================================================ 40. Draw the Sword (Seq: up, then out)
// The sword in the stone. Sweep your arm up and the sword slides out of the stone; carry it out to the
// side and it lights up, and another banner rises on the castle.
P3.add("drawsword", (K, THREE, cam, S) => {
  sunny(K, { top: 0x3a76c8, mid: 0xa8d0f0, sunDir: [-0.4, 0.45, -1], sun: 1.2 });
  meadow(K, { z0: -12 }); shadowBox(K, 7); backdrop(K);
  trees(K, K.ring(26, 10, 60, { free: true, ok: (x, z) => Math.abs(x) > 5 || z > 0 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  flowers(K, 160, [-6, 6, -4, 2]);
  // the castle on the hill
  const castle = K.group(null, [0, 0, -16]), stone = K.M(0xc8c0b0);
  K.part(castle, K.box(7, 3.6, 2.4), stone, [0, 1.8, 0]);
  const NB = clamp(S.reps || 6, 3, 10), flags = [];
  for (let i = 0; i < 4; i++) { const x = -3.4 + i * 2.27; K.part(castle, K.cyl(0.75, 0.8, 5.2, 10), stone, [x, 2.6, 0.3]); K.part(castle, K.cone(0.95, 1.5, 10), K.M(0x4a6ab8), [x, 5.95, 0.3]); }
  for (let i = 0; i < 9; i++) K.part(castle, K.box(0.45, 0.45, 0.45), stone, [-3 + i * 0.75, 3.8, 1.0]);
  K.part(castle, K.box(1.4, 2.0, 0.1), K.M(0x5a3a22), [0, 1.0, 1.22]);
  for (let i = 0; i < NB; i++) {
    const x = -3.2 + (i / Math.max(1, NB - 1)) * 6.4, pole = K.group(castle, [x, 3.95, 1.0]);
    K.part(pole, K.cyl(0.03, 0.03, 1.6, 5), K.M(0xd8d8d8), [0, 0.8, 0]);
    const f = K.group(pole, [0, 0.2, 0]); K.part(f, K.box(0.55, 0.36, 0.02), K.M([0xe84a5a, 0xffd23a, 0x4ab86a, 0x4a8ad8][i % 4]), [0.28, 0, 0]);
    flags.push({ f, up: 0, on: false });
  }
  // the stone and the sword
  K.part(null, K.dod(0.7), K.M(0x8a8a90), [0, 0.3, 0.1], [0.3, 0.5, 0], [1.2, 0.7, 1]);
  K.inst(K.cone(0.04, 0.25, 4), K.swayM(0x4a9a3a, 0.08, 1.4), Array.from({ length: 40 }, () => { const a = K.R(0, TAU), r = K.R(0.75, 1.1); return { x: Math.cos(a) * r, y: 0.12, z: 0.1 + Math.sin(a) * r * 0.8 }; }));
  const sword = K.group(null, null, null, 1.35), blade = K.S(0xe0e8f0, { metalness: 0.8, roughness: 0.2 });
  K.part(sword, K.box(0.08, 1.1, 0.02), blade, [0, -0.55, 0]);
  K.part(sword, K.cone(0.04, 0.12, 4), blade, [0, -1.16, 0], [PI, PI / 4, 0], [1, 1, 0.25]);
  K.part(sword, K.box(0.36, 0.06, 0.07), K.S(0xffd23a, { metalness: 0.6, roughness: 0.3 }), [0, 0.02, 0]);
  K.part(sword, K.cyl(0.03, 0.03, 0.24, 8), K.S(0x6a3a2a), [0, 0.17, 0]);
  K.part(sword, K.sph(0.045, 10, 8), K.S(0xe84a5a, { metalness: 0.3, roughness: 0.2 }), [0, 0.31, 0]);
  const shine = K.sprite(0xc8e8ff, 1.4, null, 0, sword); shine.position.set(0, -0.5, 0);
  const SL = new THREE.Vector3(0, 1.15, 0.1), sparks = [];
  let up = 0, out = 0, raised = 0;
  cam.position.set(0.0, 1.6, 3.4); cam.lookAt(0, 1.45, -1.2);
  return {
    fov: 55, fovTall: 76, gauge: "v",
    update(v, t, dt) {
      const step = v.need ? 2 : v.k;
      up = damp(up, step === 0 ? clamp(v.u, 0, 1.15) : step === 1 ? 1 : 0, 8, dt);
      out = damp(out, step === 1 ? clamp(v.u, 0, 1.15) : 0, 8, dt);
      const e = ease(Math.min(1, up));
      sword.position.set(lerp(0, 0.1, e) + out * 0.7, SL.y + e * 0.85 - out * 0.15, SL.z + e * 0.6);
      sword.rotation.set(0, 0, -out * 1.0);
      shine.material.opacity = step === 1 ? 0.25 + v.prog * 0.6 : step === 2 ? 0.8 : 0;
      if (v.fresh) { const f = flags[raised % NB]; f.on = true; raised++; for (let i = 0; i < 20; i++) sparks.push({ s: K.sprite([0xffe080, 0xc8e8ff, 0xffffff][i % 3], 0.25, null, 1), p: sword.position.clone().add(new THREE.Vector3(0.5, 0.4, 0)), v: new THREE.Vector3(K.R(-1.5, 1.5), K.R(0.5, 2.5), K.R(-1, 1)), life: 1.3 }); }
      flags.forEach((f) => { if (f.on) f.up = Math.min(1, f.up + dt * 0.7); f.f.position.y = 0.2 + ease(f.up) * 1.2; f.f.rotation.y = Math.sin(t * 2.4 + f.up * 3) * 0.25; });
      for (const s of sparks) { if (s.life <= 0) continue; s.life -= dt; s.v.y -= 2 * dt; s.p.addScaledVector(s.v, dt); s.s.position.copy(s.p); s.s.material.opacity = Math.max(0, s.life); s.s.visible = s.life > 0; }
    },
    focus(p) { p.copy(sword.position).add(new THREE.Vector3(0.5, 0.3, 0)); },
  };
});

// ================================================================ 41. Water the Plants (Seq: aim, then pour)
// A garden bed with a plant on each side. Turn toward the plant, then tip the can to pour; it grows a
// little more each time it is watered, from a sprout to a big flower.
P3.add("water", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.3, 0.5, -1], sun: 1.1, dir: [0.4, 0.9, 0.6] });
  meadow(K, { color: (x, z) => (Math.abs(z + 0.6) < 0.6 && Math.abs(x) < 2.2 ? K.mix(0x6a4a30, 0x5a3e28, K.noise(x * 4, z * 4)) : K.mix(0x66a648, 0x92c85e, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 6); backdrop(K);
  trees(K, K.ring(26, 9, 60, { free: true, ok: (x, z) => z < -4 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  // the two plants, each with growth stages
  const plants = [1, -1].map((s) => {
    const g = K.group(null, [s * 0.95, 0, -0.6], null, 1.5), stem = K.part(g, K.cyl(0.025, 0.035, 1, 6), K.M(0x4a9a3a), [0, 0.5, 0]);
    const leaves = [0, 1, 2, 3].map((i) => K.part(g, K.sph(1, 8, 6), K.M(0x5aaa48), [0, 0, 0], [0, i * 1.6, 0.6], [0.16, 0.03, 0.07]));
    const bloom = K.group(g); const pc = s > 0 ? 0xff7aa8 : 0xffc83a;
    for (let j = 0; j < 8; j++) K.part(bloom, K.sph(1, 8, 6), K.S(pc), [Math.cos((j * PI) / 4) * 0.13, 0, Math.sin((j * PI) / 4) * 0.13], [0, -(j * PI) / 4, 0], [0.11, 0.03, 0.06]);
    K.part(bloom, K.sph(0.06, 10, 8), K.S(0xffe060), [0, 0.01, 0], null, [1, 0.6, 1]);
    const ring = target(K, [s * 0.95, 0.05, -0.6], 0.4); ring(false, 0).rotation.x = -PI / 2;
    return { g, stem, leaves, bloom, ring, grow: 0, want: 0.15, s };
  });
  const setPlant = (p) => { const h = 0.15 + p.grow * 0.85; p.stem.scale.y = h; p.stem.position.y = h / 2; p.leaves.forEach((l, i) => { l.position.set(Math.cos(i * 1.6) * 0.1, h * (0.3 + i * 0.15), Math.sin(i * 1.6) * 0.1); l.scale.set(0.16 * (0.5 + p.grow), 0.03, 0.07 * (0.5 + p.grow)); }); p.bloom.position.y = h + 0.02; p.bloom.scale.setScalar(Math.max(0.001, (p.grow - 0.35) * 1.5)); };
  plants.forEach(setPlant);
  // the watering can in your hand
  const can = K.group(null, null, null, 0.7), canM = K.S(0x4ab8a8, { roughness: 0.4, metalness: 0.2 });
  K.part(can, K.cyl(0.12, 0.13, 0.22, 16), canM, [0, 0, 0]);
  K.part(can, K.cyl(0.015, 0.025, 0.36, 8), canM, [0, 0.05, -0.24], [-PI / 2 + 0.6, 0, 0]);
  K.part(can, K.cyl(0.04, 0.02, 0.04, 10), canM, [0, 0.19, -0.38], [-PI / 2 + 0.6, 0, 0]);
  K.part(can, K.tor(0.09, 0.015, 6, 14, PI), canM, [0, 0.12, 0.05], [0, PI / 2, 0]);
  const drops = K.inst(K.sph(0.012, 5, 4), K.S(0x9ad8ff, { transparent: true, opacity: 0.8 }), Array.from({ length: 40 }, () => ({ s: 0.001 })), { shadow: false });
  const dropT = Array.from({ length: 40 }, (_, i) => i / 40), spout = new THREE.Vector3(), tmp = new THREE.Vector3();
  let yaw = 0, tip = 0, side = 1, lastNeed = true;
  cam.position.set(0, 1.45, 1.5);
  return {
    fov: 58, fovTall: 76, gauge: "v",
    update(v, t, dt) {
      const step = v.need ? 2 : v.k;
      if (!v.need && lastNeed) side = v.steps[0].target >= 0 ? 1 : -1;
      lastNeed = v.need;
      const P = plants[side > 0 ? 0 : 1];
      yaw = damp(yaw, step === 0 ? clamp(v.u, 0, 1.1) * side : step === 1 ? side : 0, 6, dt);
      tip = damp(tip, step === 1 ? clamp(v.u, 0, 1.2) : 0, 8, dt);
      cam.rotation.set(-0.5, -yaw * 0.42, 0, "YXZ"); cam.updateMatrixWorld();
      camPt(cam, 0.2, -0.26, -0.8, can.position); can.rotation.set(-0.3, -yaw * 0.42, 0, "YXZ"); can.rotateX(-tip * 0.85);
      plants.forEach((p) => { p.ring(p === P && step < 2, t); p.grow = damp(p.grow, p.want, 2, dt); setPlant(p); });
      const pouring = step === 1 && v.u >= 0.9;
      can.updateMatrixWorld(); spout.set(0, 0.2, -0.4); can.localToWorld(spout);
      for (let i = 0; i < 40; i++) {
        if (!pouring) { K.setInst(drops, i, { s: 0.001 }); continue; }
        dropT[i] = (dropT[i] + dt * 1.6) % 1; const k = dropT[i];
        tmp.lerpVectors(spout, P.g.position, k); tmp.y = lerp(spout.y, 0.15 + P.grow * 0.9, k) - k * k * 0.2; tmp.x += Math.sin(i * 7.1) * 0.05; tmp.z += Math.cos(i * 3.7) * 0.05;
        K.setInst(drops, i, { x: tmp.x, y: tmp.y, z: tmp.z, s: 1 });
      }
      drops.instanceMatrix.needsUpdate = true;
      if (v.fresh) P.want = Math.min(1, P.want + 1 / Math.max(2, Math.ceil((S.reps || 6) / 2)));
    },
    focus(p) { p.copy(plants[side > 0 ? 0 : 1].g.position).add(new THREE.Vector3(0, 0.6, 0)); },
  };
});

// ================================================================ 42. Spoon the Soup (Seq: scoop, then lift)
// Soup at the kitchen table. Turn your hand to scoop, then lift the spoon up to your mouth; each spoonful
// leaves a little less in the bowl, and the cat across the table approves.
P3.add("soup", (K, THREE, cam, S) => {
  K.scene.background = new THREE.Color(0xf4e8d8);
  K.lights({ sky: 0xfff4e8, ground: 0x9a8a78, hemi: 1.3, sun: 0xfff0d8, sunI: 1.9, dir: [-0.4, 0.9, 0.5] });
  shadowBox(K, 3);
  K.part(null, K.box(9, 4, 0.1), K.M(0xf4e4c8), [0, 2, -2.2]);
  K.part(null, K.box(9, 0.1, 6), new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#b08a62"), roughness: 0.8 }), [0, -0.05, 0]);
  K.part(null, K.plane(1.4, 1.0), K.B(0xc8e8ff), [-1.4, 1.8, -2.14], null, null, true);
  K.part(null, K.box(1.5, 0.06, 0.06), K.M(0xffffff), [-1.4, 1.3, -2.12]);
  const check = K.tex(256, 256, (g, w, h) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(220,70,80,0.75)"; for (let i = 0; i < 8; i++) { g.fillRect(i * 32, 0, 16, h); g.fillRect(0, i * 32, w, 16); } }, true);
  K.part(null, K.box(2.0, 0.05, 1.3), new THREE.MeshStandardMaterial({ map: check, roughness: 0.8 }), [0, 0.75, -0.3]);
  for (const [x, z] of [[-0.9, -0.85], [0.9, -0.85], [-0.9, 0.25], [0.9, 0.25]]) K.part(null, K.box(0.06, 0.75, 0.06), K.M(0x8a6a4a), [x, 0.37, z]);
  // a cat on the chair opposite
  K.part(null, K.box(0.6, 0.06, 0.5), K.M(0x8a6a4a), [0.1, 0.5, -1.25]); K.part(null, K.box(0.6, 0.8, 0.06), K.M(0x8a6a4a), [0.1, 0.9, -1.5]);
  const cat = animal(K, "fennec", 0.6); cat.g.position.set(0.1, 0.53, -1.25);
  // bowl of soup, bread and a cup
  const B = new THREE.Vector3(0, 0.775, 0.05);
  K.part(null, K.lathe([[0, 0], [0.12, 0], [0.2, 0.05], [0.24, 0.12], [0.25, 0.13]], 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, side: THREE.DoubleSide }), B.toArray());
  const soupM = K.S(0xe8622a, { roughness: 0.4 }), surf = K.part(null, K.circle(0.22, 24), soupM, [B.x, B.y + 0.1, B.z], [-PI / 2, 0, 0], null, true);
  const crou = K.inst(K.box(0.03, 0.02, 0.03), K.M(0xe8b868), Array.from({ length: 7 }, (_, i) => ({ x: B.x + Math.cos(i * 1.7) * 0.12, y: B.y + 0.105, z: B.z + Math.sin(i * 1.7) * 0.12, ry: i })), { shadow: false });
  K.part(null, K.box(0.3, 0.08, 0.14), K.M(0xd8a058), [0.5, 0.81, -0.15], [0, 0.4, 0]);
  K.part(null, K.cyl(0.06, 0.05, 0.12, 14), K.M(0x5ab4f0), [-0.5, 0.835, -0.1]);
  // the spoon
  const spoon = K.group(null), steel = K.S(0xd8dce4, { metalness: 0.8, roughness: 0.2 });
  K.part(spoon, K.sph(1, 14, 10), new THREE.MeshStandardMaterial({ color: 0xd8dce4, metalness: 0.8, roughness: 0.2, side: THREE.DoubleSide }), [0, 0, 0], null, [0.045, 0.012, 0.06]);
  K.part(spoon, K.box(0.016, 0.008, 0.26), steel, [0, 0.01, 0.18], [0.12, 0, 0]);
  const full = K.part(spoon, K.sph(1, 12, 8), soupM, [0, 0.008, 0], null, [0.001, 0.001, 0.001], true);
  const hearts = [], heartM = K.E(0xff5a7a, { emissiveIntensity: 0.6 });
  let level = 0.1, sc = 0, li = 0;
  const low = new THREE.Vector3(B.x + 0.02, B.y + 0.105, B.z), hi = new THREE.Vector3();
  cam.position.set(0, 1.35, 0.85); cam.lookAt(0, 0.82, -0.25); cam.updateMatrixWorld();
  return {
    fov: 55, fovTall: 74, gauge: "v",
    update(v, t, dt) {
      const step = v.need ? 2 : v.k;
      sc = damp(sc, step === 0 ? clamp(v.u, 0, 1.15) : step === 1 ? 1 : 0, 8, dt);
      li = damp(li, step === 1 ? clamp(v.u, 0, 1.15) : 0, 7, dt);
      camPt(cam, 0.02, -0.12, -0.32, hi);
      spoon.position.lerpVectors(low, hi, ease(Math.min(1, li))); spoon.position.y += (1 - li) * (0.06 - sc * 0.06);
      spoon.rotation.set(-0.2 + li * 0.5, 0.3, -sc * 0.9 * (1 - li));
      full.scale.set(sc > 0.85 || step === 1 ? 0.04 : 0.001, 0.01, sc > 0.85 || step === 1 ? 0.05 : 0.001);
      if (v.fresh) { level = Math.max(0.03, level - 0.07 / Math.max(1, (S.reps || 6) / 6)); surf.position.y = B.y + level; for (let i = 0; i < 3; i++) { const g = K.group(null); K.part(g, K.sph(0.03, 8, 6), heartM, [-0.022, 0, 0], null, null, true); K.part(g, K.sph(0.03, 8, 6), heartM, [0.022, 0, 0], null, null, true); K.part(g, K.cone(0.042, 0.055, 4), heartM, [0, -0.036, 0], [PI, PI / 4, 0], null, true); hearts.push({ g, t: -i * 0.2, x: K.R(-0.15, 0.25) }); } }
      surf.position.y = B.y + level; crou.position.y = level - 0.1;
      hearts.forEach((h) => { h.t += dt; const k = Math.max(0, h.t); h.g.visible = h.t > 0 && k < 1.8; h.g.position.set(0.1 + h.x, 1.15 + k * 0.35, -1.0); h.g.scale.setScalar(Math.min(1, k * 4) * 1.4); });
      cat.g.position.y = 0.53 + (step === 1 && !K.calm ? Math.abs(Math.sin(t * 6)) * 0.03 : 0); if (cat.idle) cat.idle(t);
    },
    focus(p) { p.copy(hi); },
  };
});
// ================================================================ 43. Bowling (Throw)
// A bowling lane where the pins stand on a green mat partway down. Swing to bowl: the harder the swing,
// the further the ball rolls. Stop it on the mat and the pins go flying; then they are set up again
// somewhere else.
P3.add("bowling", (K, THREE, cam) => {
  K.scene.background = new THREE.Color(0x2a2448);
  K.lights({ sky: 0xffe8f0, ground: 0x6a5a7a, hemi: 1.5, sun: 0xfff0e0, sunI: 1.9, dir: [0.2, 1, 0.4] });
  shadowBox(K, 8);
  const L = 10, laneTex = RC.Scene3D.woodTexture("#d8a868", 512, 512); laneTex.wrapS = laneTex.wrapT = THREE.RepeatWrapping; laneTex.repeat.set(1, 6);
  K.part(null, K.box(1.6, 0.1, L + 3), new THREE.MeshStandardMaterial({ map: laneTex, roughness: 0.25, metalness: 0.05 }), [0, -0.05, -L / 2 + 1]);
  for (const s of [-1, 1]) { K.part(null, K.box(0.26, 0.06, L + 3), K.M(0x2a2a36), [s * 0.93, -0.03, -L / 2 + 1]); K.part(null, K.box(0.5, 0.35, L + 3), K.M(0x5a3a6a), [s * 1.35, 0.12, -L / 2 + 1]); }
  for (let i = 0; i < 7; i++) K.part(null, K.cone(0.04, 0.12, 3), K.E(0xffd23a, { emissiveIntensity: 0.5 }), [-0.3 + i * 0.1, 0.002, -2.2], [-PI / 2, 0, 0], [1, 1, 0.1], true);
  // the back wall with lights and a big screen
  K.part(null, K.box(8, 4, 0.2), K.M(0x3a2a5a), [0, 2, -L - 0.6]);
  K.part(null, K.box(3, 1.2, 0.05), K.E(0x2a6ad8, { emissiveIntensity: 0.4 }), [0, 2.4, -L - 0.48], null, null, true);
  const lights = Array.from({ length: 10 }, (_, i) => K.part(null, K.sph(0.08, 8, 6), K.E([0xff5a8a, 0xffd23a, 0x5ad8ff][i % 3], { emissiveIntensity: 0.4 }), [-2 + i * 0.44, 3.3, -L - 0.45], null, null, true));
  for (const s of [-1, 1]) K.part(null, K.box(0.2, 4, L + 4), K.M(0x4a3a6a), [s * 3, 2, -L / 2]);
  // the green mat and its pins
  const mat = K.part(null, K.box(1.55, 0.012, 1), K.E(0x4ad884, { emissiveIntensity: 0.35, transparent: true, opacity: 0.85 }), [0, 0.006, -6], null, null, true);
  const pinM = K.S(0xfaf8f4, { roughness: 0.3 }), stripe = K.S(0xe8342a, { roughness: 0.3 });
  const pinGeo = K.lathe([[0, 0], [0.06, 0.0], [0.08, 0.1], [0.065, 0.24], [0.033, 0.33], [0.04, 0.4], [0.033, 0.45], [0, 0.48]], 14);
  const pins = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) { const g = K.group(null); K.part(g, pinGeo, pinM); K.part(g, K.cyl(0.036, 0.036, 0.04, 12), stripe, [0, 0.35, 0], null, null, true); pins.push({ g, dx: (c - r / 2) * 0.26, dz: -r * 0.24, v: null }); }
  const ball = K.part(null, K.sph(0.16, 20, 14), K.S(0x4a5ae8, { roughness: 0.15, metalness: 0.2 }));
  const ring = target(K, [0, 0.4, 0], 0.4);
  let zoneZ = -6, zoneW = 1, shown = null, roll = null, flash = 0;
  const setPins = (z) => pins.forEach((p) => { p.v = null; p.g.position.set(p.dx, 0, z + p.dz); p.g.rotation.set(0, 0, 0); });
  cam.position.set(0.0, 1.05, 2.2); cam.lookAt(0, 0.15, -4.5);
  return {
    fov: 50, fovTall: 70, gauge: "h",
    update(v, t, dt) {
      const want = -2 - v.zone * (L - 3), wW = v.width * (L - 3);
      if (v.phase === "aim" && !roll) { if (Math.abs(want - zoneZ) > 0.01 || shown == null) { zoneZ = want; zoneW = wW; setPins(zoneZ + wW * 0.25); shown = 1; } }
      mat.position.z = zoneZ; mat.scale.z = zoneW;
      const rg = ring(v.phase !== "show" && !roll, t); rg.position.set(0, 0.6, zoneZ); rg.lookAt(cam.position);
      if (v.fresh) roll = { t: 0, to: -2 - v.power * (L - 3), ok: v.ok, hit: false };
      if (roll) {
        roll.t += dt; const k = clamp(roll.t / 1.6, 0, 1), z = lerp(0.6, roll.to, 1 - Math.pow(1 - k, 2.2));
        ball.position.set(Math.sin(k * 5) * 0.03, 0.16, z); ball.rotation.x -= dt * 10 * (1 - k);
        if (roll.ok && !roll.hit && z <= zoneZ + zoneW * 0.5) { roll.hit = true; flash = 1.2; pins.forEach((p) => { p.v = new THREE.Vector3(K.R(-2, 2), K.R(1.5, 3.5), K.R(-3, -0.5)); p.spin = new THREE.Vector3(K.R(-8, 8), K.R(-8, 8), K.R(-8, 8)); }); }
        if (roll.t > 2.6 && v.phase !== "show") roll = null;
      } else { const c = v.phase === "charge" ? v.charge : 0; ball.position.set(0.2, 0.55 + c * 0.3, 0.9 + c * 0.6); ball.rotation.x = 0; }
      pins.forEach((p) => { if (!p.v) return; p.v.y -= 9 * dt; p.g.position.addScaledVector(p.v, dt); if (p.g.position.y < 0) { p.g.position.y = 0; p.v.multiplyScalar(0.5); p.v.y = Math.abs(p.v.y) * 0.4; } p.g.rotation.x += p.spin.x * dt; p.g.rotation.z += p.spin.z * dt; p.spin.multiplyScalar(0.97); });
      flash = Math.max(0, flash - dt);
      lights.forEach((l, i) => { l.material = K.E(l.material.color.getHex(), { emissiveIntensity: flash > 0 ? (Math.sin(t * 20 + i) > 0 ? 1 : 0.2) : 0.4 }); });
    },
    focus(p) { p.set(0, 0.6, zoneZ); },
  };
});

// ================================================================ 44. Penalty Kick (Throw)
// Kick the ball into the little goal standing on the green patch. A harder kick goes further; land it
// in the goal and the crowd of animals cheers. Then the goal moves.
P3.add("penalty", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.4, 0.5, -1], sun: 1.1 });
  const L = 14;
  K.ground({ size: 300, seg: 90, h: (x, z) => (z < -30 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 10 * Math.min(1, (-30 - z) / 40) : 0), color: (x, z) => (Math.abs(x) < 6 && z < 2 && z > -L - 4 ? (Math.floor(-z / 1.5) % 2 ? 0x5aa84a : 0x6ab858) : K.mix(0x66a648, 0x92c85e, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 12); backdrop(K);
  trees(K, K.ring(40, 14, 70, { free: true, ok: (x, z) => Math.abs(x) > 9 || z < -L - 6 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.1, 1.7) })));
  for (const x of [-6, 6]) K.part(null, K.box(0.06, 0.01, L + 6), K.B(0xffffff), [x, 0.01, -L / 2]);
  // stands with a cheering crowd
  const crowd = [];
  for (const s of [-1, 1]) { K.part(null, K.box(1.6, 0.8, L), K.M(0x8a8a98), [s * 8, 0.4, -L / 2]); K.part(null, K.box(1.6, 0.8, L), K.M(0x9a9aa8), [s * 9.3, 1.0, -L / 2]); ["rabbit", "pig", "panda", "sheep", "chicken", "penguin"].forEach((k, i) => { const a = animal(K, k, 0.8); a.g.position.set(s * (8 + (i % 2) * 1.3), 0.8 + (i % 2) * 0.6, -3 - i * 2.4); a.g.rotation.y = -s * PI / 2; crowd.push(a); }); }
  // the little goal on its green patch
  const goal = K.group(null, null, null, 1.3), post = K.S(0xffffff, { roughness: 0.4 });
  K.part(goal, K.box(2.6, 0.01, 1.4), K.E(0x4ad884, { emissiveIntensity: 0.3, transparent: true, opacity: 0.8 }), [0, 0.006, 0], null, null, true);
  for (const x of [-1.1, 1.1]) K.part(goal, K.cyl(0.05, 0.05, 1.2, 8), post, [x, 0.6, -0.4]);
  K.part(goal, K.cyl(0.05, 0.05, 2.3, 8), post, [0, 1.2, -0.4], [0, 0, PI / 2]);
  const net = K.part(goal, K.box(2.2, 1.15, 0.6), new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.6 }), [0, 0.6, -0.72], null, null, true);
  // ball and boot
  const ballTex = K.tex(128, 64, (g, w, h) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); g.fillStyle = "#222"; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc((i * w) / 6 + 10, (i % 2) * h * 0.5 + h * 0.25, 9, 0, PI * 2); g.fill(); } });
  const ball = K.part(null, K.sph(0.13, 18, 12), new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.5 }));
  const boot = K.group(null); K.part(boot, K.box(0.17, 0.13, 0.34), K.S(0xe84a3a, { roughness: 0.4 }), [0, 0, -0.04]); K.part(boot, K.box(0.18, 0.02, 0.36), K.M(0xffffff), [0, -0.07, -0.04]); K.part(boot, K.cyl(0.07, 0.08, 0.3, 10), K.S(0xffffff, { roughness: 0.7 }), [0, 0.2, 0.06]); K.part(boot, K.cyl(0.075, 0.075, 0.08, 10), K.S(0x2a6ad8), [0, 0.36, 0.06]);
  const ring = target(K, [0, 1.6, 0], 0.35);
  let goalZ = -9, kick = null, cheer = 0;
  cam.position.set(0.0, 1.0, 2.2); cam.lookAt(0, 0.7, -7);
  return {
    fov: 52, fovTall: 72, gauge: "h",
    update(v, t, dt) {
      const want = -2 - v.zone * (L - 2);
      if (v.phase === "aim" && !kick) goalZ = damp(goalZ, want, 4, dt);
      goal.position.set(0, 0, goalZ); goal.scale.set(1.3, 1.3, Math.max(0.8, v.width * (L - 2) / 1.4));
      ring(!kick, t).position.set(0, 1.7, goalZ - 0.3);
      const c = v.phase === "charge" ? v.charge : 0;
      if (v.fresh) kick = { t: 0, to: -2 - v.power * (L - 2), ok: v.ok };
      if (kick) {
        kick.t += dt; const k = clamp(kick.t / 1.3, 0, 1), z = lerp(0.3, kick.to, k);
        ball.position.set(0, 0.13 + Math.sin(k * PI) * (1.2 + Math.abs(kick.to) * 0.12), z); ball.rotation.x -= dt * 12;
        if (k >= 1 && kick.ok && cheer <= 0) { cheer = 2; net.scale.z = 1.4; }
        if (kick.t > 2.4 && v.phase !== "show") kick = null;
      } else { ball.position.set(0, 0.13, 0.3); }
      boot.position.set(0.3, 0.07 + c * 0.15, 0.95 + c * 0.3 - (kick && kick.t < 0.25 ? 0.5 : 0)); boot.rotation.x = -c * 0.6 + (kick && kick.t < 0.25 ? 0.5 : 0);
      net.scale.z = damp(net.scale.z, 1, 3, dt); cheer = Math.max(0, cheer - dt);
      crowd.forEach((a, i) => { a.g.position.y = (i % 2 ? 1.4 : 0.8) + (cheer > 0 && !K.calm ? Math.abs(Math.sin(t * 9 + i)) * 0.25 : 0); if (a.idle) a.idle(t); });
    },
    focus(p) { p.set(0, 0.8, goalZ); },
  };
});

// ================================================================ 45. Aim the Spotlight (Dial, raise and lower the arm)
// A theatre. The monkey acrobat climbs to a new height on the rope; raise or lower your arm to put the
// spotlight on it and hold it there while it takes a bow.
P3.add("spotlight", (K, THREE, cam) => {
  K.scene.background = new THREE.Color(0x120c1c);
  K.lights({ sky: 0x9a8ac0, ground: 0x2a1a30, hemi: 0.9, sun: 0xffe0c0, sunI: 0.9, dir: [0, 1, 0.6] });
  shadowBox(K, 6);
  const wood = RC.Scene3D.woodTexture("#8a5a3a");
  K.part(null, K.box(9, 0.5, 4), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.6 }), [0, 0.25, -2.5]);
  K.part(null, K.box(12, 0.1, 10), K.M(0x2a1a2a), [0, -0.05, 2]);
  const curtain = K.tex(256, 256, (g, w, h) => { const grd = g.createLinearGradient(0, 0, w, 0); for (let i = 0; i <= 8; i++) grd.addColorStop(i / 8, i % 2 ? "#a8182a" : "#d8283a"); g.fillStyle = grd; g.fillRect(0, 0, w, h); });
  const curM = new THREE.MeshStandardMaterial({ map: curtain, roughness: 0.8 });
  for (const s of [-1, 1]) K.part(null, K.box(2.6, 6, 0.2), curM, [s * 4.2, 3.5, -0.6]);
  K.part(null, K.box(11, 1.2, 0.2), curM, [0, 6.2, -0.6]);
  K.part(null, K.box(9, 6, 0.1), K.M(0x2a2040), [0, 3.2, -4.4]);
  K.inst(K.sph(0.05, 6, 4), K.B(0xffffff), Array.from({ length: 60 }, () => ({ x: K.R(-4, 4), y: K.R(1, 6), z: -4.3 })), { shadow: false });
  // the rope and the acrobat
  K.part(null, K.cyl(0.03, 0.03, 6, 6), K.M(0xd8c8a0), [0, 3.5, -2.6]);
  const mk = bare(K, "monkey", 2, 1.0); mk.g.position.set(0.1, 1, -2.6);
  // the audience in silhouette
  K.inst(K.sph(0.3, 10, 8), K.M(0x0a0610), Array.from({ length: 14 }, (_, i) => ({ x: -3.6 + (i % 7) * 1.2 + (i > 6 ? 0.6 : 0), y: 0.2 + (i > 6 ? 0.15 : 0), z: 1.4 + (i > 6 ? 0.9 : 0), sy: 1.3 })), { shadow: false });
  // the spotlight in your hands, beaming from the front
  const SRC = new THREE.Vector3(3.4, 5.6, 2.6), lamp = K.group(null, SRC.toArray());
  K.part(lamp, K.cyl(0.18, 0.24, 0.5, 14), K.M(0x2a2a30, { metalness: 0.5 }), [0, 0, 0], [PI / 2, 0, 0]);
  K.part(lamp, K.circle(0.17, 16), K.E(0xfff4d0), [0, 0, -0.26], [PI, 0, 0], null, true);
  const beam = K.part(null, new THREE.ConeGeometry(1, 1, 24, 1, true).translate(0, -0.5, 0).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), null, null, null, true);
  const spot = K.sprite(0xfff0c0, 1.5, null, 0.75), light = new THREE.SpotLight(0xfff0d0, 30, 14, 0.13, 0.5, 1.2);
  light.position.copy(SRC); K.scene.add(light); K.scene.add(light.target);
  const ring = target(K, [0, 0, -2.45], 0.42), notes = [];
  const H = (x) => 2.5 + x * 1.5;
  let beamY = H(0), mkY = H(0), bow = 0, prev = null;
  cam.position.set(0, 2.5, 5.2); cam.lookAt(0, 2.3, -2.6);
  return {
    fov: 50, fovTall: 70, gauge: "v",
    update(v, t, dt) {
      beamY = damp(beamY, H(clamp(v.x, -1.25, 1.25)), 10, dt);
      if (prev == null || Math.abs(v.tx - prev) > 1e-6) { prev = v.tx; }
      mkY = damp(mkY, H(v.tx) - 0.5, 3, dt); mk.g.position.y = mkY;
      const P = new THREE.Vector3(0, beamY, -2.55), d = P.clone().sub(SRC), Lb = d.length();
      lamp.lookAt(P); lamp.rotateY(PI);
      beam.position.copy(SRC); beam.lookAt(P); beam.scale.set(0.42, 0.42, Lb);
      spot.position.copy(P); light.target.position.copy(P);
      const on = Math.abs(v.x - v.tx) <= v.tw;
      ring(true, t).position.set(0, H(v.tx), -2.45);
      beam.material.opacity = on ? 0.26 : 0.14; spot.material.opacity = on ? 0.95 : 0.6;
      bow = damp(bow, on ? v.prog : 0, 6, dt); mk.g.rotation.set(bow * 0.6, Math.sin(t * 2) * 0.3 * (1 - bow), 0);
      if (mk.idle) mk.idle(t);
      if (v.fresh) for (let i = 0; i < 4; i++) { const sp = K.sprite([0xffd23a, 0xff7aa8, 0x7ad0ff, 0xffffff][i], 0.3, null, 1); notes.push({ sp, t: -i * 0.15, x: K.R(-0.8, 0.8), y: mkY + 0.6 }); }
      notes.forEach((n) => { n.t += dt; const k = Math.max(0, n.t); n.sp.visible = n.t > 0 && k < 1.6; n.sp.position.set(n.x * (1 + k), n.y + k * 1.2, -2.3); n.sp.material.opacity = 1 - k / 1.6; });
    },
    focus(p) { p.set(0, mkY + 0.4, -2.5); },
  };
});

// ================================================================ 46. Gas Pedal (Dial, foot)
// Driving along a country road. Press or lift your foot to match the speed on the next sign; the needle
// shows your speed, and holding it on the green band sets the cruise control.
P3.add("gaspedal", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.3, 0.45, -1], sun: 1.1 });
  K.ground({ size: 400, seg: 100, h: (x, z) => (Math.abs(x) > 14 ? Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 10 * Math.min(1, (Math.abs(x) - 14) / 30) : 0), color: (x, z) => (Math.abs(x) < 2.2 ? K.mix(0x55565e, 0x666670, K.noise(x * 2, z * 0.5)) : Math.abs(x) < 2.5 ? 0xb8a888 : K.mix(0x66a648, 0x92c85e, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 10); backdrop(K);
  // things that stream past: dashes, trees, fence posts
  const SP = 120;
  const dash = K.inst(K.box(0.12, 0.01, 1.4), K.B(0xf4f0e0), Array.from({ length: 30 }, (_, i) => ({ x: 0, y: 0.01, z: -i * 4 })), { shadow: false });
  const treeGs = [0, -60].map((off) => { const g = K.group(null, [0, 0, off]); trees(K, Array.from({ length: 22 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * K.R(4, 12), z: -K.R(0, 60), s: K.R(1, 1.6) })), null, g); return g; });
  const posts = K.inst(K.box(0.08, 0.7, 0.08), K.M(0xf0e6d0), Array.from({ length: 40 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * 2.9, y: 0.35, z: -Math.floor(i / 2) * 6 })));
  // the car: bonnet, dashboard, wheel and a big speedometer
  const car = K.group(null);
  K.part(car, K.box(2.2, 0.5, 1.6), K.S(0xe84a5a, { roughness: 0.35 }), [0, 0.65, -1.4]);
  K.part(car, K.box(1.8, 0.35, 0.5), K.M(0x2a2a32), [0, 0.95, -0.35]); K.part(car, K.cyl(0.32, 0.34, 0.12, 24, 1), K.M(0x2a2a32), [0, 1.16, -0.3], [PI / 2 - 0.45, 0, 0]);
  K.part(car, K.box(1.8, 0.04, 0.02), K.M(0xc8c8d0, { metalness: 0.5 }), [0, 1.12, -0.12]);
  const wheel = K.group(car, [-0.6, 1.0, 0.05], [-0.95, 0, 0]); K.part(wheel, K.tor(0.2, 0.025, 8, 28), K.M(0x1a1a22)); K.part(wheel, K.box(0.38, 0.03, 0.03), K.M(0x1a1a22));
  const dialTex = K.tex(256, 256, (g, w, h) => {
    g.fillStyle = "#14161e"; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, PI * 2); g.fill();
    g.strokeStyle = "#ffffff"; g.fillStyle = "#ffffff"; g.font = "700 22px Fredoka, Arial"; g.textAlign = "center"; g.textBaseline = "middle";
    for (let i = 0; i <= 10; i++) { const a = PI * 0.75 + (i / 10) * PI * 1.5, r0 = i % 2 ? 100 : 92; g.lineWidth = i % 2 ? 2 : 4; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * r0, h / 2 + Math.sin(a) * r0); g.lineTo(w / 2 + Math.cos(a) * 112, h / 2 + Math.sin(a) * 112); g.stroke(); if (!(i % 2)) g.fillText(String(i * 10), w / 2 + Math.cos(a) * 74, h / 2 + Math.sin(a) * 74); }
  });
  const dial = K.group(car, [0.0, 1.2, -0.22], [-0.45, 0, 0], 1.05);
  K.part(dial, K.circle(0.2, 32), new THREE.MeshBasicMaterial({ map: dialTex }), [0, 0, 0.005], null, null, true);
  const band = K.part(dial, K.tor(0.155, 0.018, 4, 20, 0.3), K.B(0x4ad884), [0, 0, 0.01], null, null, true);
  const needle = K.group(dial, [0, 0, 0.02]); K.part(needle, K.box(0.012, 0.16, 0.004), K.B(0xff5a3a), [0, 0.075, 0], null, null, true);
  K.part(dial, K.cyl(0.02, 0.02, 0.02, 10), K.B(0xffffff), [0, 0, 0.02], [PI / 2, 0, 0], null, true);
  const holdRing = K.part(dial, K.tor(0.215, 0.014, 4, 40, 0.01), K.B(0x5ad88c), [0, 0, 0.01], [0, 0, PI / 2], null, true);
  let holdQ = -1;
  // speed sign at the roadside
  const sign = K.group(null, [2.7, 0, -20], [0, -0.25, 0]); K.part(sign, K.cyl(0.05, 0.05, 2.2, 6), K.M(0xc8c8d0), [0, 1.1, 0]);
  const signFace = K.part(sign, K.circle(0.7, 28), K.B(0xffffff), [0, 2.3, 0.03], null, null, true);
  K.part(sign, K.tor(0.66, 0.08, 6, 28), K.B(0xe8342a), [0, 2.3, 0.04], null, null, true);
  let signTex = null, shownT = null, zoff = 0, spd = 0, bandKey = null;
  const kmh = (x) => clamp(((x + 1.2) / 2.4) * 100, 0, 100), th3 = (sp) => -(PI * 0.75 + (sp / 100) * PI * 1.5);
  cam.position.set(0, 1.62, 0.7); cam.lookAt(0, 1.0, -6);
  return {
    fov: 60, fovTall: 80, gauge: "none",
    update(v, t, dt) {
      const sp = kmh(clamp(v.x, -1.2, 1.2)), tgt = Math.round(kmh(v.tx));
      if (tgt !== shownT) { shownT = tgt; if (signTex) signTex.dispose(); signTex = textTex(K, String(tgt), { bg: "#ffffff", color: "#1a1a1a", w: 256, h: 256 }); signFace.material = new THREE.MeshBasicMaterial({ map: signTex }); }
      spd = damp(spd, sp, 5, dt);
      needle.rotation.z = th3(spd) - PI / 2;
      const s0 = kmh(v.tx - v.tw), s1 = kmh(v.tx + v.tw), key = `${s0.toFixed(1)},${s1.toFixed(1)}`;
      if (key !== bandKey) { bandKey = key; band.geometry = K.tor(0.155, 0.018, 4, 20, Math.max(0.05, th3(s0) - th3(s1))); band.rotation.z = th3(s1); }
      zoff = (zoff + spd * dt * 0.12) % 4;
      for (let i = 0; i < 30; i++) K.setInst(dash, i, { x: 0, y: 0.01, z: -i * 4 + zoff });
      dash.instanceMatrix.needsUpdate = true;
      const on = Math.abs(v.x - v.tx) <= v.tw, q = on ? Math.round(clamp(v.prog, 0, 1) * 24) : 0;
      if (q !== holdQ) { holdQ = q; holdRing.geometry = K.tor(0.215, 0.014, 4, 40, Math.max(0.01, (q / 24) * TAU)); }
      band.material = K.B(on ? 0x7affaa : 0x4ad884);
      const mv = spd * dt * 0.12;
      treeGs.forEach((g) => { g.position.z += mv; if (g.position.z > 62) g.position.z -= 120; });
      posts.position.z = (posts.position.z + mv) % 6;
      sign.position.z += mv; if (sign.position.z > -3) sign.position.z = -45;
      wheel.rotation.z = Math.sin(t * 0.6) * 0.05;
      car.position.y = K.calm ? 0 : Math.sin(t * 13) * 0.004 * (spd / 50);
    },
    focus(p) { p.set(0.25, 1.1, -0.15); },
  };
});

// ================================================================ 47. Follow the Moon (Track)
// A night lake. The moon drifts up and down across the sky, with its path ahead marked by little stars.
// Raise and lower your arm to keep your paper lantern beside it; on target, the lantern glows bright.
P3.add("moon", (K, THREE, cam) => {
  K.sky(0x060a24, 0x1a2a5a, 0x3a4a7a, { sunDir: [0, 0.2, -1], sun: 0, horizon: 0.1 });
  K.stars(900, { minY: 0.1 });
  K.scene.fog = new THREE.Fog(0x1a2448, 40, 200);
  K.lights({ sky: 0x8a9ae0, ground: 0x1a2a2a, hemi: 0.7, sun: 0xb8c8ff, sunI: 0.8, dir: [-0.4, 0.8, 0.3] });
  K.ground({ size: 300, seg: 80, h: (x, z) => (z < -12 ? 0.5 + Math.pow(K.fbm(x * 0.03, z * 0.03), 1.3) * 14 * Math.min(1, (-12 - z) / 40) : -0.5), color: (x, z, y) => (y < 0 ? 0x1a2a3a : K.mix(0x1e3a2a, 0x2e4e34, K.fbm(x * 0.15, z * 0.15))) });
  K.water({ size: 300, seg: 60, color: 0x1a3a6a, y: 0, opacity: 0.9, amp: 0.04 });
  pines(K, K.ring(40, 14, 70, { free: true, ok: (x, z) => z < -13 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.2, 2) })));
  // the moon, its path ahead and its reflection
  const Y = (x) => 8 + x * 4.6, X0 = 2.2, Z = -30;
  const moon = K.part(null, K.sph(2.1, 28, 20), K.B(0xfff4d0, { fog: false }), [X0, 6, Z]);
  const halo = K.sprite(0xfff0c0, 11, null, 0.45), refl = K.sprite(0xfff0c0, 3, null, 0.35);
  const path = K.inst(K.sph(0.16, 6, 4), K.B(0xd8e4ff, { fog: false }), Array.from({ length: 14 }, () => ({ s: 0.001 })), { shadow: false });
  // your paper lantern, beside the moon
  const lan = K.group(null, null, null, 1.7), lanM = K.E(0xff9a3a, { emissiveIntensity: 0.4 });
  K.part(lan, K.sph(0.55, 16, 12), lanM, null, null, [1, 1.2, 1], true);
  for (const y of [-0.62, 0.62]) K.part(lan, K.cyl(0.25, 0.25, 0.08, 12), K.M(0x2a1a10), [0, y, 0], null, null, true);
  const lGlow = K.sprite(0xffb060, 3.5, null, 0.4, lan);
  const ring = target(K, [0, 0, 0], 2.0), trail = [];
  let ly = Y(0), my = Y(0);
  cam.position.set(0, 2.2, 6); cam.lookAt(0, 7.6, -30);
  return {
    fov: 55, fovTall: 76, gauge: "v",
    update(v, t, dt) {
      my = damp(my, Y(v.tx), 8, dt); moon.position.y = my; halo.position.set(X0, my, Z + 0.5); refl.position.set(X0 * 0.5, 0.05, -12);
      for (let i = 0; i < 14; i++) { const s = 0.35 * (i + 1); K.setInst(path, i, { x: X0 + 2.6 + s * 3.4, y: Y(v.ahead(s)), z: Z, s: 1.4 - i / 14 }); }
      path.instanceMatrix.needsUpdate = true;
      ly = damp(ly, Y(clamp(v.x, -1.2, 1.2)), 10, dt);
      lan.position.set(X0 - 5.2, ly, Z + 1);
      lanM.emissiveIntensity = v.on ? 1.0 : 0.35; lGlow.material.opacity = v.on ? 0.75 : 0.2;
      const r = ring(v.on, t); r.position.set(X0 - 5.2, my, Z + 0.8);
      if (v.on && !K.calm && Math.random() < dt * 12) trail.push({ s: K.sprite(0xffd890, 0.5, lan.position.toArray(), 0.9), t: 0, vx: -K.R(1, 2), vy: K.R(-0.5, 0.5) });
      for (const q of trail) { if (q.t > 1.2) continue; q.t += dt; q.s.position.x += q.vx * dt; q.s.position.y += q.vy * dt; q.s.material.opacity = 0.9 * (1 - q.t / 1.2); q.s.visible = q.t < 1.2; }
      lan.rotation.z = Math.sin(t * 1.3) * 0.08;
    },
    focus(p) { p.copy(lan.position); },
  };
});

// ================================================================ 48. Sail the Boat (Track)
// Sailing down a channel marked with buoys. The channel bends with the wind ahead of you; turn your hand
// to keep the boat on the line, and the island with the lighthouse comes closer as the time runs.
P3.add("sail", (K, THREE, cam) => {
  sunny(K, { top: 0x2a7ad8, mid: 0x9ad0f0, low: 0xe8f4fc, sunDir: [0.5, 0.4, -1], sun: 1.2, fog: 0xd8ecf8 });
  K.water({ size: 400, seg: 80, color: 0x2a8ac8, y: 0, amp: 0.1 });
  shadowBox(K, 8); K.clouds(14); K.flock(4, { cz: -30, y0: 8, y1: 14, color: 0xffffff });
  // the island at the end
  const isl = K.group(null, [0, 0, -120]);
  K.part(isl, K.sph(12, 20, 10), K.M(0xe8d8a8), [0, -9, 0], null, [1, 1, 0.8]);
  K.part(isl, K.sph(8, 16, 10), K.M(0x5a9a40), [2, -4.5, -2], null, [1, 0.8, 0.8]);
  K.part(isl, K.cyl(0.8, 1.1, 6, 12), K.M(0xffffff), [-3, 4, 0]); K.part(isl, K.cyl(0.85, 0.85, 1, 12), K.M(0xe8342a), [-3, 5, 0]); K.part(isl, K.cone(1.0, 1.2, 12), K.M(0xe8342a), [-3, 7.6, 0]);
  K.part(isl, K.box(0.9, 0.7, 0.9), K.E(0xfff0a0, { emissiveIntensity: 0.6 }), [-3, 6.8, 0], null, null, true);
  // buoys marking the channel ahead
  const SPD = 7, NB = 16, LX = (x) => x * 3.2;
  const buoyM = [K.S(0xe8342a, { roughness: 0.4 }), K.S(0x3ac85a, { roughness: 0.4 })];
  const buoys = Array.from({ length: NB * 2 }, (_, i) => { const g = K.group(null); K.part(g, K.cyl(0.18, 0.24, 0.5, 10), buoyM[i % 2], [0, 0.15, 0]); K.part(g, K.cone(0.14, 0.3, 10), buoyM[i % 2], [0, 0.55, 0]); return g; });
  const line = K.inst(K.sph(0.08, 6, 4), K.B(0xffffff), Array.from({ length: NB * 3 }, () => ({ s: 0.001 })), { shadow: false });
  // the boat
  const boat = K.group(null), hullM = K.S(0xffffff, { roughness: 0.4 });
  K.part(boat, K.box(0.7, 0.3, 1.8), hullM, [0, 0.15, 0]);
  K.part(boat, K.cone(0.35, 0.6, 4), hullM, [0, 0.15, -1.15], [-PI / 2, PI / 4, 0], [1.4, 1, 0.6]);
  K.part(boat, K.box(0.72, 0.06, 1.82), K.M(0x2a6ad8), [0, 0.02, 0]);
  K.part(boat, K.cyl(0.035, 0.035, 2.2, 6), K.M(0x8a6a4a), [0, 1.3, -0.2]);
  const sail = K.part(boat, K.cone(0.9, 1.9, 3, 1, true), new THREE.MeshStandardMaterial({ color: 0xffe8a0, side: THREE.DoubleSide, roughness: 0.6 }), [0.0, 1.35, 0.2], [0, PI / 2, 0], [0.05, 1, 0.6], true);
  const pup = animal(K, "penguin", 0.45, boat); pup.g.position.set(0, 0.3, 0.55); pup.g.rotation.y = PI;
  const wake = K.inst(K.sph(0.1, 6, 4), K.B(0xffffff, { transparent: true, opacity: 0.7 }), Array.from({ length: 20 }, () => ({ s: 0.001 })), { shadow: false });
  const wk = []; let bx = 0, z0 = 0;
  cam.position.set(0, 3.0, 6.5);
  return {
    fov: 55, fovTall: 75, gauge: "h",
    update(v, t, dt) {
      z0 = (z0 + SPD * dt);
      bx = damp(bx, LX(clamp(v.x, -1.2, 1.2)), 6, dt);
      boat.position.set(bx, Math.sin(t * 1.4) * 0.05, 0); boat.rotation.z = (LX(v.x) - bx) * -0.12 + Math.sin(t * 1.1) * 0.03; boat.rotation.y = (LX(v.x) - bx) * -0.08;
      sail.scale.set(v.on ? 0.25 : 0.06, 1, 0.6); if (pup.idle) pup.idle(t);
      // buoys stream toward you along the channel; their offset follows the target ahead in time
      const frac = (z0 % (SPD * 0.5)) / (SPD * 0.5);
      for (let i = 0; i < NB; i++) {
        const s = (i - frac) * 0.5, z = -s * SPD, c = LX(v.ahead(Math.max(0, s))), w = 3.2 * v.tw + 0.9;
        buoys[i * 2].position.set(c - w, Math.sin(t * 2 + i) * 0.05, z); buoys[i * 2 + 1].position.set(c + w, Math.sin(t * 2 + i + 1) * 0.05, z);
        for (let k = 0; k < 3; k++) { const s2 = s + k / 6; K.setInst(line, i * 3 + k, { x: LX(v.ahead(Math.max(0, s2))), y: 0.05, z: -s2 * SPD, s: s2 < 0 ? 0.001 : 1 }); }
      }
      line.instanceMatrix.needsUpdate = true;
      if (Math.random() < dt * 20) wk.push({ x: bx + K.R(-0.3, 0.3), z: 1, t: 0 });
      for (let i = wk.length - 1; i >= 0; i--) { const w = wk[i]; w.t += dt; w.z += SPD * dt; if (w.t > 1.2) wk.splice(i, 1); }
      for (let i = 0; i < 20; i++) { const w = wk[wk.length - 1 - i]; K.setInst(wake, i, w ? { x: w.x, y: 0.05, z: w.z, s: 1 + w.t * 2, sy: 0.3 } : { s: 0.001 }); }
      wake.instanceMatrix.needsUpdate = true;
      isl.position.z = lerp(-150, -45, clamp(v.prog, 0, 1));
      cam.position.x = damp(cam.position.x, bx * 0.6, 3, dt); cam.lookAt(bx * 0.6, 0.8, -10);
    },
    focus(p) { p.copy(boat.position).add(new THREE.Vector3(0, 1.5, 0)); },
  };
});

// ================================================================ 49. Toe Taps (Bursts)
// The animal band's big drum has a foot pedal. Every tap of your foot hits the drum: the stage lights
// flash, the band bounces along, and another bulb lights up on the sign.
P3.add("toetap", (K, THREE, cam, S) => {
  K.scene.background = new THREE.Color(0x1a1438);
  K.lights({ sky: 0xffe0f0, ground: 0x2a2040, hemi: 1.0, sun: 0xfff0e0, sunI: 1.6, dir: [0.3, 1, 0.6] });
  shadowBox(K, 6);
  K.part(null, K.cyl(4, 4, 0.4, 40), new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#b07a4a"), roughness: 0.6 }), [0, 0.2, -1.2]);
  K.part(null, K.box(12, 0.1, 10), K.M(0x221a3a), [0, -0.05, 2]);
  K.part(null, K.box(10, 6, 0.2), K.M(0x2a2050), [0, 3, -4.5]);
  // the sign with bulbs that light one by one
  const NB = Math.min(30, S.reps || 10), bulbs = [];
  K.part(null, K.box(5, 1.1, 0.12), K.M(0x8a2a6a), [0, 4.2, -4.3]);
  K.part(null, K.plane(4.4, 0.7), new THREE.MeshBasicMaterial({ map: textTex(K, "TAP TAP BAND", { bg: "#8a2a6a", color: "#ffe8a0" }) }), [0, 4.2, -4.22], null, null, true);
  for (let i = 0; i < NB; i++) { const u = i / Math.max(1, NB - 1), x = -2.4 + u * 4.8; bulbs.push(K.part(null, K.sph(0.07, 8, 6), K.M(0x6a5a70), [x, 3.55, -4.2], null, null, true)); }
  // the drum and its pedal
  const D = new THREE.Vector3(0, 1.05, -1.0), drum = K.group(null, D.toArray());
  K.part(drum, K.cyl(0.65, 0.65, 0.5, 28), K.S(0xe84a5a, { roughness: 0.4 }), null, [PI / 2, 0, 0]);
  const skin = K.part(drum, K.circle(0.62, 28), K.S(0xfaf4ea, { roughness: 0.7 }), [0, 0, 0.26], null, null, true);
  K.part(drum, K.tor(0.64, 0.035, 6, 28), K.S(0xffd23a, { metalness: 0.5, roughness: 0.3 }), [0, 0, 0.26]);
  K.part(drum, K.tor(0.64, 0.035, 6, 28), K.S(0xffd23a, { metalness: 0.5, roughness: 0.3 }), [0, 0, -0.26]);
  K.part(drum, K.plane(0.7, 0.3), new THREE.MeshBasicMaterial({ map: textTex(K, "♪ ♪", { bg: "#faf4ea", color: "#e84a5a" }) }), [0, 0, 0.265], null, null, true);
  const beater = K.group(null, [0, 0.42, -0.2]); K.part(beater, K.cyl(0.015, 0.015, 0.6, 6), K.M(0xc8c8d0, { metalness: 0.5 }), [0, 0.3, 0]); K.part(beater, K.sph(0.07, 10, 8), K.S(0xffffff), [0, 0.6, 0]);
  const pedal = K.group(null, [0, 0.42, 0.25]); K.part(pedal, K.box(0.18, 0.03, 0.4), K.M(0x3a3a44, { metalness: 0.4 }), [0, 0, 0.2]);
  // the band
  const band = [["penguin", -1.8, 1.0], ["rabbit", 1.8, 0.95], ["panda", -0.9, 1.1], ["pig", 1.0, 0.85]].map(([k, x, h], i) => { const a = k === "penguin" ? bare(K, k, [1, 2], h) : animal(K, k, h); a.g.position.set(x, 0.4, -1.8 + (i % 2) * 0.4); a.g.rotation.y = -x * 0.15; return a; });
  const spots = [[-2.5, 0xff5a8a], [0, 0x5ad8ff], [2.5, 0xffd23a]].map(([x, c]) => K.sprite(c, 3.5, [x, 1.2, -1.5], 0.15));
  const notes = [];
  let hit = 0, beat = -1, lit = 0;
  cam.position.set(0, 1.9, 3.6); cam.lookAt(0, 1.4, -1.5);
  return {
    fov: 55, fovTall: 76, gauge: "h",
    update(v, t, dt) {
      if (beat < 0) beat = v.beat;
      if (v.beat !== beat) { beat = v.beat; hit = 1; for (let i = 0; i < 2; i++) { const sp = K.sprite([0xffd23a, 0xff7aa8, 0x7ad0ff][(beat + i) % 3], 0.35, null, 1); notes.push({ sp, t: -i * 0.1, x: K.R(-1, 1) }); } }
      if (v.fresh && lit < NB) { bulbs[lit].material = K.E([0xffd23a, 0xff7aa8, 0x7ad0ff][lit % 3], { emissiveIntensity: 1 }); lit++; }
      hit = Math.max(0, hit - dt * 4);
      const press = Math.max(hit, clamp(v.a, 0, 1) * 0.5);
      beater.rotation.x = -0.6 + press * 0.55; pedal.rotation.x = press * 0.25;
      drum.scale.setScalar(1 + hit * 0.04); skin.position.z = 0.26 - hit * 0.02;
      spots.forEach((s, i) => { s.material.opacity = 0.12 + hit * 0.6 * (i === beat % 3 ? 1 : 0.4); });
      band.forEach((a, i) => { a.g.position.y = 0.4 + (K.calm ? 0 : hit * 0.18 * (i % 2 ? 1 : 0.7)); if (a.idle) a.idle(t); });
      notes.forEach((n) => { n.t += dt; const k = Math.max(0, n.t); n.sp.visible = n.t > 0 && k < 1.5; n.sp.position.set(n.x + Math.sin(k * 4) * 0.2, 1.8 + k * 1.3, -0.6); n.sp.material.opacity = 1 - k / 1.5; });
    },
    focus(p) { p.copy(D).add(new THREE.Vector3(0, 0.3, 0.3)); },
  };
});

// ================================================================ 50. Shake the Bottle (Bursts)
// A snow globe. Every shake sends the snow swirling; as the shakes add up, a little winter village
// appears inside, piece by piece.
P3.add("shake", (K, THREE, cam, S) => {
  K.scene.background = new THREE.Color(0x24304a);
  K.lights({ sky: 0xe0ecff, ground: 0x3a3048, hemi: 1.1, sun: 0xfff0e0, sunI: 1.8, dir: [0.4, 1, 0.7] });
  shadowBox(K, 3);
  const wood = new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#8a5a3a"), roughness: 0.6 });
  K.part(null, K.box(6, 0.1, 4), wood, [0, -0.05, 0]);
  K.part(null, K.box(8, 4, 0.1), K.M(0x3a4a6a), [0, 2, -2]);
  const win = K.part(null, K.plane(1.4, 1.1), K.B(0x1a2a5a), [1.6, 1.9, -1.94], null, null, true);
  K.inst(K.sph(0.02, 4, 3), K.B(0xffffff), Array.from({ length: 30 }, () => ({ x: 1.6 + K.R(-0.65, 0.65), y: 1.9 + K.R(-0.5, 0.5), z: -1.93 })), { shadow: false });
  K.sprite(0xffd890, 2.5, [-1.8, 1.2, -1.2], 0.25);
  // the globe: a wooden base, a glass dome, a snowy floor and the village pieces
  const G = K.group(null, [0, 0, 0]), C = new THREE.Vector3(0, 0.95, 0), R = 0.62;
  K.part(G, K.cyl(0.55, 0.65, 0.3, 28), K.S(0x8a4a2a, { roughness: 0.4 }), [0, 0.15, 0]);
  K.part(G, K.cyl(0.57, 0.57, 0.04, 28), K.S(0xffd23a, { metalness: 0.5, roughness: 0.3 }), [0, 0.31, 0]);
  const inside = K.group(G, [0, 0.33, 0]);
  K.part(inside, K.cyl(0.55, 0.55, 0.06, 28), K.S(0xffffff, { roughness: 0.8 }), [0, 0.03, 0]);
  const dome = K.part(G, K.sph(R, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.02, metalness: 0, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }), [0, C.y, 0], null, null, true);
  const pieces = [];
  const add = (f) => { const g = K.group(inside); g.scale.setScalar(0.001); f(g); pieces.push({ g, s: 0 }); };
  add((g) => { pines(K, [{ x: -0.3, z: -0.15, s: 0.12 }, { x: 0.32, z: -0.2, s: 0.1 }], g); });
  add((g) => { K.part(g, K.box(0.24, 0.18, 0.2), K.M(0xe84a5a), [0.05, 0.15, -0.1]); K.part(g, K.cone(0.2, 0.14, 4), K.M(0xffffff), [0.05, 0.31, -0.1], [0, PI / 4, 0]); K.part(g, K.box(0.06, 0.08, 0.01), K.E(0xffd870, { emissiveIntensity: 0.8 }), [0.05, 0.12, 0.005], null, null, true); });
  add((g) => { const s = animal(K, "snowman", 0.28, g); s.g.position.set(-0.22, 0.06, 0.18); });
  add((g) => { pines(K, [{ x: 0.3, z: 0.18, s: 0.08 }, { x: -0.38, z: 0.05, s: 0.09 }], g); });
  add((g) => { const s = animal(K, "reindeer", 0.24, g); s.g.position.set(0.22, 0.06, 0.1); s.g.rotation.y = -0.7; });
  add((g) => { const s = bare(K, "penguin", [1, 2], 0.16, g); s.g.position.set(-0.05, 0.06, 0.28); });
  add((g) => { for (let i = 0; i < 6; i++) K.part(g, K.sph(0.02, 6, 4), K.E([0xff5a6a, 0xffd23a, 0x5ab4f0][i % 3], { emissiveIntensity: 0.8 }), [0.05 + Math.cos(i) * 0.13, 0.36 - i * 0.02, -0.1 + Math.sin(i) * 0.1], null, null, true); });
  const NF = 220, flakes = Array.from({ length: NF }, () => ({ p: new THREE.Vector3(K.R(-0.4, 0.4), K.R(0.05, 0.25), K.R(-0.4, 0.4)), v: new THREE.Vector3() }));
  const snow = K.inst(K.sph(0.012, 4, 3), K.B(0xffffff), flakes.map(() => ({ s: 1 })), { shadow: false, parent: G });
  let beat = -1, wob = 0, shown = 0;
  const goal = S.reps || 20;
  cam.position.set(0, 1.4, 2.15); cam.lookAt(0, 0.8, 0);
  return {
    fov: 50, fovTall: 70, gauge: "h",
    update(v, t, dt) {
      if (beat < 0) beat = v.beat;
      if (v.beat !== beat) { beat = v.beat; wob = 1; for (const f of flakes) f.v.add(new THREE.Vector3(K.R(-1.6, 1.6), K.R(1, 2.6), K.R(-1.6, 1.6))); }
      wob = Math.max(0, wob - dt * 3); G.position.y = wob * 0.06 * Math.sin(t * 40); G.rotation.z = wob * 0.08 * Math.sin(t * 30);
      const want = Math.min(pieces.length, Math.ceil((v.reps / goal) * pieces.length));
      while (shown < want) { pieces[shown].on = true; shown++; }
      pieces.forEach((p) => { if (p.on && p.s < 1) { p.s = Math.min(1, p.s + dt * 2); p.g.scale.setScalar(Math.max(0.001, ease(p.s))); } });
      for (let i = 0; i < NF; i++) {
        const f = flakes[i]; f.v.y -= 0.6 * dt; f.v.multiplyScalar(1 - dt * 1.4); f.v.x += Math.sin(t + i) * 0.02 * dt; f.p.addScaledVector(f.v, dt);
        if (f.p.y < 0.05) { f.p.y = 0.05; f.v.set(0, 0, 0); }
        const dx = f.p.x, dy = f.p.y + 0.33 - C.y, dz = f.p.z, d = Math.hypot(dx, dy, dz); if (d > R * 0.92) { const k = (R * 0.92) / d; f.p.set(dx * k, dy * k + C.y - 0.33, dz * k); f.v.multiplyScalar(-0.3); }
        K.setInst(snow, i, { x: f.p.x, y: f.p.y + 0.33, z: f.p.z });
      }
      snow.instanceMatrix.needsUpdate = true;
    },
    focus(p) { p.copy(C); },
  };
});
// ---------------------------------------------------------------- Path helpers
// The Path engine works in stage pixels; these scenes lay its line on a flat surface so that each point
// sits exactly under the pixel it stands for (a ray from the camera through the pixel hits the surface).
// planeY: the height of a flat surface, or any THREE.Plane.
function pathMapper(THREE, cam, planeY) {
  const rc = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = planeY instanceof THREE.Plane ? planeY : new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
  return (x, y, W, H, out) => { ndc.set((x / W) * 2 - 1, -((y / H) * 2 - 1)); rc.setFromCamera(ndc, cam); return rc.ray.intersectPlane(plane, out) || out.set(0, planeY, 0); };
}
P3.lib.pathMapper = pathMapper;
// Instanced dots for the guide line and short segments for the part already traced.
function pathDraw(K, THREE, o) {
  const MAX = 400, guide = K.inst(o.dot, o.dotM, Array.from({ length: MAX }, () => ({ s: 0.001 })), { shadow: false });
  const done = K.inst(o.seg, o.segM, Array.from({ length: MAX }, () => ({ s: 0.001 })), { shadow: false });
  const start = K.sprite(0xffa040, o.startS || 0.25, null, 0.9);
  let key = null, world = [], shownIdx = -1;
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  return (v, map) => {
    const k = `${v.name}|${v.W}|${v.H}|${v.pts.length}`;
    if (k !== key) {
      key = k; world = v.pts.map((p) => map(p[0], p[1], v.W, v.H, new THREE.Vector3()));
      for (let i = 0; i < MAX; i++) K.setInst(guide, i, i < world.length && i % 2 === 0 ? { x: world[i].x, y: world[i].y + 0.002, z: world[i].z } : { s: 0.001 });
      guide.instanceMatrix.needsUpdate = true; shownIdx = -1;
    }
    const n = Math.min(v.idx, world.length - 1);
    if (n !== shownIdx) {
      for (let i = 0; i < MAX; i++) {
        if (i < n && i + 1 < world.length) { a.copy(world[i]); b.copy(world[i + 1]); const L = a.distanceTo(b); K.setInst(done, i, { x: (a.x + b.x) / 2, y: a.y + 0.004, z: (a.z + b.z) / 2, ry: Math.atan2(b.x - a.x, b.z - a.z), sx: 1, sy: 1, sz: Math.max(0.001, L * 1.15) }); }
        else K.setInst(done, i, { s: 0.001 });
      }
      done.instanceMatrix.needsUpdate = true; shownIdx = n;
    }
    if (world[n]) start.position.copy(world[n]).add(new THREE.Vector3(0, 0.02, 0));
    return world;
  };
}

// ================================================================ 51. Ankle Trace (Path)
// Drawing in the sand. Tilt your foot to walk the crab along the shells; it leaves a groove in the sand
// behind it. Finish the shape and a wave washes it smooth for the next one.
P3.add("ankletrace", (K, THREE, cam) => {
  sunny(K, { top: 0x2a7ad8, mid: 0x9ad0f0, low: 0xf8f0d8, sunDir: [0.4, 0.5, -1], sun: 1.2 });
  K.ground({ size: 300, seg: 90, h: (x, z) => (z < -6 ? -0.6 : K.fbm(x * 0.5, z * 0.5) * 0.03), color: (x, z, y) => (y < -0.3 ? 0xd8c890 : K.mix(0xf4e4b8, 0xe8d4a0, K.fbm(x * 0.6, z * 0.6))) });
  const sea = K.water({ size: 400, seg: 70, color: 0x2a9ac8, y: -0.2, z: -206, amp: 0.08 });
  shadowBox(K, 5); K.clouds(10);
  K.inst(K.dod(0.12), K.M(0xa8a098), Array.from({ length: 16 }, () => ({ x: K.R(-4, 4) * (Math.random() < 0.5 ? 1 : 1), y: 0.03, z: K.R(-4.5, 1.5), s: K.R(0.6, 1.4), ry: K.R(0, 6) })).filter((p) => Math.abs(p.x) > 2.6 || p.z < -3.5));
  K.inst(K.cone(0.07, 0.1, 6), K.S(0xffd8c8), Array.from({ length: 14 }, () => ({ x: K.R(-4, 4), y: 0.02, z: K.R(-3.5, 1.5), rx: PI / 2, ry: K.R(0, 6) })).filter((p) => Math.abs(p.x) > 2.6), { shadow: false });
  const palm = (x, z, h) => { const g = K.group(null, [x, 0, z], [0, K.R(0, 6), 0.12]); for (let i = 0; i < 6; i++) K.part(g, K.cyl(0.12, 0.14, h / 6, 7), K.M(0x9a7a52), [Math.sin(i * 0.25) * 0.12 * i, (i + 0.5) * (h / 6), 0]); const top = K.group(g, [0.6, h, 0]); for (let i = 0; i < 7; i++) K.part(top, K.box(0.22, 0.03, 1.5), K.swayM(0x3a9a3a, 0.05, 1.2), [0, 0, 0.7], [-0.5, (i / 7) * TAU, 0]); };
  palm(-4.2, -2.5, 3.4); palm(4.6, -3.2, 3.8);
  const map = pathMapper(THREE, cam, 0.01);
  const draw = pathDraw(K, THREE, { dot: K.sph(0.035, 8, 6), dotM: K.S(0xfff8f0, { roughness: 0.5 }), seg: K.box(0.06, 0.012, 1), segM: K.M(0xb89a68) });
  const crab = animal(K, "crab", 0.32); const cp = new THREE.Vector3(), prev = new THREE.Vector3();
  const glow = K.sprite(0x8affb0, 0.6, null, 0);
  let wave = 0, lastReps = 0;
  cam.position.set(0, 4.2, 3.4); cam.lookAt(0, 0, -0.35);
  return {
    fov: 50, fovTall: 70, gauge: "none",
    update(v, t, dt) {
      cam.updateMatrixWorld();
      const world = draw(v, map);
      map(v.cur.x, v.cur.y, v.W, v.H, cp);
      prev.copy(crab.g.position); crab.g.position.lerp(cp, Math.min(1, dt * 12));
      const d = crab.g.position.clone().sub(prev); if (d.lengthSq() > 1e-6) crab.g.rotation.y = damp(crab.g.rotation.y, Math.atan2(d.x, d.z) + PI / 2, 6, dt);
      if (crab.idle) crab.idle(t);
      const nx = world[Math.min(v.idx + 3, world.length - 1)]; if (nx) { glow.position.copy(nx).add(new THREE.Vector3(0, 0.05, 0)); glow.material.opacity = 0.6; }
      if (v.reps > lastReps) { lastReps = v.reps; wave = 1; }
      wave = Math.max(0, wave - dt * 0.6); sea.position.z = -206 + Math.sin((1 - wave) * PI) * (wave > 0 ? 8 : 0);
    },
    focus(p) { p.copy(crab.g.position).add(new THREE.Vector3(0, 0.3, 0)); },
  };
});

// ================================================================ 52. Pen Grip Drawing (Path)
// A sheet of paper on the desk. Hold the phone like a pen and steer the pencil along the dotted shape;
// the crayon line follows. Each finished drawing is pinned up on the board.
P3.add("pengrip", (K, THREE, cam) => {
  K.scene.background = new THREE.Color(0xe8e0d0);
  K.lights({ sky: 0xfff8f0, ground: 0x8a7a68, hemi: 1.3, sun: 0xfff4e0, sunI: 2.0, dir: [-0.4, 1, 0.5] });
  shadowBox(K, 3);
  K.part(null, K.box(4, 0.08, 2.6), new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#b88a5a"), roughness: 0.7 }), [0, -0.04, -0.2]);
  K.part(null, K.box(6, 3, 0.1), K.M(0xf0e8d8), [0, 1.4, -1.6]);
  const board = K.group(null, [0, 1.25, -1.54]); K.part(board, K.box(2.6, 1.0, 0.04), K.M(0xc89a6a), [0, 0, 0]);
  const pinned = [];
  K.part(null, K.box(1.9, 0.004, 1.35), K.M(0xffffff, { roughness: 0.9 }), [0, 0.002, 0.05]);
  K.part(null, K.cyl(0.08, 0.07, 0.22, 12), K.M(0x5ab4f0), [1.45, 0.11, -0.6]);
  [0xe84a5a, 0xffd23a, 0x4ab86a].forEach((c, i) => K.part(null, K.cyl(0.012, 0.012, 0.3, 6), K.M(c), [1.43 + i * 0.03, 0.3, -0.6], [0.1 * (i - 1), 0, 0.15]));
  const map = pathMapper(THREE, cam, 0.006);
  const COL = [0xe84a5a, 0x3a7ae8, 0x2ab85a, 0xb44aff, 0xff8a2a];
  const lineM = K.M(COL[0]);
  const draw = pathDraw(K, THREE, { dot: K.sph(0.008, 6, 4), dotM: K.M(0xb8b8c8), seg: K.box(0.018, 0.004, 1), segM: lineM, startS: 0.12 });
  // the pencil, tip on the paper at the pointer
  const pencil = K.group(null), body = K.group(pencil, null, [0.55, 0, -0.35]);
  K.part(body, K.cyl(0.022, 0.022, 0.42, 6), K.S(0xffc828, { roughness: 0.5 }), [0, 0.27, 0]);
  K.part(body, K.cone(0.022, 0.06, 6), K.S(0xf0d8b0), [0, 0.03, 0], [PI, 0, 0]);
  K.part(body, K.cone(0.008, 0.02, 6), K.M(0x2a2a2a), [0, 0.003, 0], [PI, 0, 0]);
  K.part(body, K.cyl(0.023, 0.023, 0.04, 8), K.S(0xc8c8d0, { metalness: 0.5 }), [0, 0.49, 0]);
  K.part(body, K.cyl(0.022, 0.022, 0.04, 8), K.S(0xff9ab8), [0, 0.53, 0]);
  const cp = new THREE.Vector3();
  let lastReps = 0;
  cam.position.set(0, 2.0, 1.55); cam.lookAt(0, 0, -0.05);
  return {
    fov: 45, fovTall: 64, gauge: "none",
    update(v, t, dt) {
      cam.updateMatrixWorld();
      draw(v, map);
      map(v.cur.x, v.cur.y, v.W, v.H, cp); pencil.position.lerp(cp, Math.min(1, dt * 14));
      if (v.reps > lastReps) {
        lastReps = v.reps; lineM.color.setHex(COL[v.reps % COL.length]);
        const n = pinned.length, card = K.group(board, [-1.05 + (n % 6) * 0.42, (n < 6 ? 0.22 : -0.24), 0.03], [0, 0, K.R(-0.1, 0.1)]);
        K.part(card, K.box(0.34, 0.26, 0.005), K.M(0xffffff), [0, 0, 0]); K.part(card, K.tor(0.08, 0.012, 4, 16), K.M(COL[(v.reps - 1) % COL.length]), [0, 0, 0.004], null, null, true); K.part(card, K.sph(0.02, 6, 4), K.M(0xe84a5a), [0, 0.11, 0.01], null, null, true);
        pinned.push(card);
      }
    },
    focus(p) { p.copy(pencil.position).add(new THREE.Vector3(0, 0.1, 0)); },
  };
});

// ================================================================ 53. Fruit Catch (Catch)
// Apples, pears and oranges drop from the trees. Tip your hand to slide the basket under each one; a
// shadow on the grass shows where it will land.
P3.add("fruit", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.4, 0.45, -1], sun: 1.1 });
  meadow(K); shadowBox(K, 7); backdrop(K);
  const WX = 3.0, TOP = 3.4, BY = 0.42;
  trees(K, [-3.4, -1.15, 1.15, 3.4].map((x) => ({ x, z: -2.6, s: 1.45 })), [0x4a8a3a, 0x5a9a40]);
  trees(K, K.ring(30, 9, 60, { free: true, ok: (x, z) => z < -5 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  flowers(K, 120, [-6, 6, -1, 2.5]);
  const KINDS = [[0xe0302a, [1, 0.92, 1]], [0xb8d84a, [0.9, 1.2, 0.9]], [0xff9a2a, [1, 1, 1]], [0xffe040, [1.2, 0.9, 0.9]]];
  const fruitM = KINDS.map(([c]) => K.S(c, { roughness: 0.4 }));
  const mkFruit = (k) => { const g = K.group(null); K.part(g, K.sph(0.13, 14, 10), fruitM[k], null, null, KINDS[k][1]); K.part(g, K.cyl(0.01, 0.01, 0.07, 4), K.M(0x5a3a20), [0, 0.14, 0]); K.part(g, K.box(0.07, 0.01, 0.035), K.M(0x4aa83a), [0.04, 0.15, 0], [0, 0, 0.4]); return g; };
  // hanging fruit on the trees for decoration
  K.inst(K.sph(0.11, 8, 6), K.S(0xffffff, { roughness: 0.4 }), Array.from({ length: 40 }, (_, i) => ({ x: [-3.2, -1.1, 1.1, 3.2][i % 4] + K.R(-1.2, 1.2), y: K.R(2.6, 3.8), z: -2.6 + K.R(-0.6, 1.4), c: KINDS[i % 4][0] })), { shadow: false });
  // the basket
  const basket = K.group(null, [0, 0, 0.6]), wick = K.M(0xc89a5a);
  const bw = K.group(basket);
  K.part(bw, K.cyl(0.5, 0.38, 0.42, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xc89a5a, roughness: 0.8, side: THREE.DoubleSide }), [0, 0.21, 0]);
  K.part(bw, K.cyl(0.38, 0.38, 0.02, 20), wick, [0, 0.01, 0]);
  K.part(bw, K.tor(0.5, 0.03, 6, 24), K.M(0xa87a4a), [0, 0.42, 0], [PI / 2, 0, 0]);
  K.part(bw, K.tor(0.42, 0.025, 6, 24, PI), K.M(0xa87a4a), [0, 0.42, 0], [0, 0, 0]);
  for (const s of [-1, 1]) K.part(basket, K.cyl(0.08, 0.08, 0.05, 12), K.M(0x5a3a22), [s * 0.36, 0.05, 0.3], [0, 0, PI / 2]);
  const helper = animal(K, "rabbit", 0.7); helper.g.rotation.y = 0.3;
  let piled = 0;
  const shadowDisc = K.part(null, K.circle(0.22, 20), K.B(0x2a3a2a, { transparent: true, opacity: 0.25 }), null, [-PI / 2, 0, 0], null, true);
  const ring = target(K, [0, 0.03, 0.6], 0.3); ring(true, 0).rotation.x = -PI / 2;
  let cur = null, curN = -1, falling = [], bx = 0;
  cam.position.set(0, 1.9, 4.3); cam.lookAt(0, 1.45, -0.5);
  return {
    fov: 52, fovTall: 72, gauge: "h",
    update(v, t, dt) {
      bx = damp(bx, clamp(v.x, -1.1, 1.1) * WX, 12, dt);
      basket.position.x = bx; basket.scale.set(v.bw / 0.24, 1, 1);
      bw.scale.set(1, 1, 1); helper.g.position.set(bx - 0.75 * (v.bw / 0.24) - 0.2, 0, 0.7); if (helper.idle) helper.idle(t);
      if (v.item && v.item.n !== curN) { curN = v.item.n; cur = { g: mkFruit(curN % KINDS.length), k: curN % KINDS.length }; }
      if (cur && v.item) {
        const x = v.item.u * WX, y = lerp(TOP, BY + 0.2, v.item.y * v.item.y);
        cur.g.position.set(x, y, 0.6); cur.g.rotation.z = Math.sin(t * 6) * 0.2; cur.x = x;
        shadowDisc.position.set(x, 0.02, 0.6); shadowDisc.scale.setScalar(0.6 + v.item.y * 0.8); shadowDisc.visible = true;
        const r = ring(Math.abs(x - bx) <= v.bw * WX, t); r.position.set(x, 0.03, 0.6);
      } else { shadowDisc.visible = false; ring(false, t).position.set(0, -1, 0); }
      if (cur && !v.item) {
        const caught = v.flash > 0;
        falling.push({ g: cur.g, caught, t: 0, x0: cur.x - bx, k: cur.k }); cur = null;
      }
      falling = falling.filter((f) => {
        f.t += dt;
        if (f.caught) { const i = piled; f.g.removeFromParent(); basket.add(f.g); f.g.position.set(Math.cos(i * 2.4) * 0.18 * (i % 3 ? 1 : 0.2), 0.32 + Math.floor(i / 5) * 0.08, Math.sin(i * 2.4) * 0.18 * (i % 3 ? 1 : 0.2)); f.g.scale.set(0.24 / Math.max(0.05, basket.scale.x), 1, 1).multiplyScalar(1); piled++; return false; }
        f.g.position.y = Math.max(0.13, f.g.position.y - dt * 4); f.g.position.x += dt * 0.6; f.g.rotation.z -= dt * 4; if (f.t > 2.5) { f.g.visible = false; return false; } return true;
      });
    },
    focus(p) { p.set(bx, 1.0, 0.6); },
  };
});

// ================================================================ 54. Quick Reach (Direction)
// Whack-a-mole in the vegetable patch. Rest your hand in the middle; when a mole pops up, reach toward it
// as fast as you can to bop it (gently) back down.
P3.add("quickreach", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.4, 0.5, -1], sun: 1.1 });
  meadow(K, { color: (x, z) => (Math.hypot(x, z) < 2.3 ? K.mix(0x7a5a3a, 0x6a4a2e, K.noise(x * 3, z * 3)) : K.mix(0x66a648, 0x92c85e, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 6); backdrop(K);
  trees(K, K.ring(30, 7, 60, { free: true, ok: (x, z) => z < -3 || Math.abs(x) > 5 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  K.inst(K.cone(0.06, 0.25, 5), K.M(0x5aaa48), Array.from({ length: 40 }, () => { const a = K.R(0, TAU), r = K.R(2.4, 2.8); return { x: Math.cos(a) * r, y: 0.12, z: Math.sin(a) * r, ry: a }; }));
  const R = 1.35, P = (d) => new THREE.Vector3(d[0] * R, 0, -d[1] * R);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
  const holes = new Map(), fur = K.S(0x6a4a3a, { roughness: 0.8 });
  function mole() {
    const g = K.group(null), m = K.group(g);
    K.part(m, K.sph(0.24, 16, 12), fur, [0, 0.18, 0], null, [1, 1.15, 0.95]);
    K.part(m, K.sph(0.14, 12, 10), K.S(0xd8b898), [0, 0.12, 0.17], null, [1, 1, 0.6]);
    K.part(m, K.sph(0.05, 10, 8), K.S(0xff8aa8), [0, 0.24, 0.24]);
    K.eyes(m, 0.08, 0.33, 0.19, 0.035);
    for (const s of [-1, 1]) K.part(m, K.sph(1, 8, 6), K.S(0xff9ab8), [s * 0.17, 0.05, 0.16], null, [0.07, 0.04, 0.05]);
    return { g, m, up: 0 };
  }
  DIRS.forEach((d) => { const p = P(d), hole = K.group(null, p.toArray()); K.part(hole, K.circle(0.3, 20), K.M(0x2a1a10), [0, 0.012, 0], [-PI / 2, 0, 0], null, true); K.part(hole, K.tor(0.3, 0.06, 6, 18), K.M(0x8a6a48), [0, 0.02, 0], [PI / 2, 0, 0]); const mo = mole(); mo.g.position.copy(p); mo.hole = hole; holes.set(d.join(","), mo); });
  let shownDirs = false;
  const center = K.part(null, K.circle(0.32, 24), K.E(0x4ad884, { emissiveIntensity: 0.4, transparent: true, opacity: 0.7 }), [0, 0.015, 0], [-PI / 2, 0, 0], null, true);
  // the soft mallet that follows your tilt
  const mallet = K.group(null, null, null, 1.5), head = K.group(mallet, [0, 0.35, 0]);
  K.part(head, K.cyl(0.13, 0.13, 0.3, 16), K.S(0xff5a7a, { roughness: 0.4 }), [0, 0, 0], [0, 0, PI / 2]);
  K.part(mallet, K.cyl(0.03, 0.03, 0.8, 8), K.S(0xffd23a), [0, 0.75, 0.15], [0.35, 0, 0]);
  const stars = [];
  let bonk = 0, lastReps = 0, mx = 0, mz = 0;
  cam.position.set(0, 3.0, 3.0); cam.lookAt(0, 0.1, -0.2);
  return {
    fov: 50, fovTall: 70, gauge: "none",
    update(v, t, dt) {
      if (!shownDirs) { shownDirs = true; const keep = new Set(v.dirs.map((d) => d.join(","))); holes.forEach((mo, k) => { const on = keep.has(k); mo.hole.visible = on; mo.g.visible = on; }); }
      mx = damp(mx, clamp(v.x, -1.25, 1.25) * R, 12, dt); mz = damp(mz, -clamp(v.y, -1.25, 1.25) * R, 12, dt);
      mallet.position.set(mx, 0, mz);
      const hit = v.reps > lastReps; if (hit) { lastReps = v.reps; bonk = 1; const p = P(v.d); for (let i = 0; i < 6; i++) stars.push({ s: K.sprite(0xffe060, 0.3, null, 1), p: p.clone().add(new THREE.Vector3(0, 0.5, 0)), a: (i / 6) * TAU, t: 0 }); }
      bonk = Math.max(0, bonk - dt * 3); head.rotation.x = -bonk * 0.9; head.position.y = 0.35 - bonk * 0.12;
      holes.forEach((mo, k) => { const want = v.phase === "go" && k === v.d.join(",") ? 1 : 0; mo.up = damp(mo.up, want, want ? 14 : 6, dt); mo.m.position.y = -0.45 + mo.up * 0.45; mo.m.scale.y = 1 - (k === v.d.join(",") ? bonk * 0.4 : 0); mo.m.rotation.y = Math.sin(t * 3) * 0.2; });
      center.material.opacity = v.phase === "center" ? 0.75 : 0.25;
      stars.forEach((s) => { s.t += dt; const k = s.t; s.s.visible = k < 0.9; s.s.position.copy(s.p).add(new THREE.Vector3(Math.cos(s.a + k * 3) * 0.35 * k * 2, k * 0.4, Math.sin(s.a + k * 3) * 0.35 * k * 2)); s.s.material.opacity = 1 - k / 0.9; });
    },
    focus(p) { p.set(mx, 0.6, mz); },
  };
});

// ================================================================ 55. Ski Slalom (Steer)
// Ski down the mountain through the flag gates. Shift your weight to steer the skier; line up with each
// gap before it reaches you.
P3.add("slalom", (K, THREE, cam) => {
  K.sky(0x2a76d8, 0xa8d4f4, 0xf0f6fc, { sunDir: [0.4, 0.4, -1], sun: 1.1, sunColor: 0xfff6e0, horizon: 0.14 });
  K.scene.fog = new THREE.Fog(0xe4eef8, 40, 200);
  K.lights({ sky: 0xf0f6ff, ground: 0x9ab0c8, hemi: 1.05, sun: 0xfff2e0, sunI: 1.7, dir: [0.4, 0.8, 0.5] });
  const SL = 0.18, H = (x, z) => -z * SL + (Math.abs(x) > 6 ? Math.pow((Math.abs(x) - 6) * 0.25, 1.5) : 0);
  K.ground({ size: 400, seg: 110, h: (x, z) => H(x, z), color: (x, z) => K.mix(0xf4f8fc, 0xd4e2f0, K.fbm(x * 0.2, z * 0.2)) });
  shadowBox(K, 10);
  K.peaks(12, 160, 230, 40, 70, 0xe8f0f8, { snow: 0xffffff });
  K.clouds(10);
  const pineG = K.group(null); pines(K, Array.from({ length: 70 }, () => { const s = Math.random() < 0.5 ? -1 : 1, x = s * K.R(6.5, 22), z = -K.R(-4, 90); return { x, z, y: H(x, z), s: K.R(1.0, 1.8) }; }), pineG);
  const WX = 3.0, ZF = 34;
  const gateM = [K.S(0xe8342a, { roughness: 0.5 }), K.S(0x2a6ad8, { roughness: 0.5 })];
  const pool = Array.from({ length: 6 }, (_, i) => { const g = K.group(null); const flags = [-1, 1].map((s) => { const f = K.group(g); K.part(f, K.cyl(0.04, 0.04, 2.0, 6), K.M(0xffffff), [0, 1.0, 0]); const cl = K.part(f, K.box(0.8, 0.55, 0.02), gateM[i % 2], [s * -0.4, 1.7, 0]); return { f, cl }; }); g.visible = false; return { g, flags }; });
  // the skier: a penguin on two skis
  const sk = K.group(null), body = K.group(sk), pg = bare(K, "penguin", [1, 2], 0.85, body); pg.g.rotation.y = PI;
  for (const s of [-1, 1]) K.part(sk, K.box(0.1, 0.03, 1.2), K.S(0xff8a2a, { roughness: 0.4 }), [s * 0.14, 0.02, 0]);
  for (const s of [-1, 1]) K.part(body, K.cyl(0.012, 0.012, 0.8, 4), K.M(0xc8c8d0), [s * 0.36, 0.45, 0.05], [0.4, 0, s * 0.2]);
  const spray = K.inst(K.sph(0.05, 5, 4), K.B(0xffffff), Array.from({ length: 30 }, () => ({ s: 0.001 })), { shadow: false }), sp = [];
  let sx = 0, lean = 0, fl = 0, lastPassed = 0;
  return {
    fov: 58, fovTall: 76, gauge: "h",
    update(v, t, dt) {
      const want = clamp(v.x, -1.1, 1.1) * WX; lean = damp(lean, (want - sx) * 0.4, 8, dt); sx = damp(sx, want, 7, dt);
      sk.position.set(sx, H(sx, 0), 0); sk.rotation.set(SL, -lean * 0.4, 0); body.rotation.z = -lean * 0.5; if (pg.idle) pg.idle(t);
      pool.forEach((p) => { p.g.visible = false; });
      v.gates.forEach((q, i) => { const p = pool[(v.passed + i) % pool.length]; if (q.u > 1.08) return; const z = -q.u * ZF, c = q.c * WX, w = v.gapW * WX; p.g.visible = true; p.g.position.set(c, H(c, z), z); p.flags[0].f.position.x = -w; p.flags[1].f.position.x = w; p.flags.forEach((f, k) => { f.cl.rotation.y = Math.sin(t * 3 + k) * 0.2; }); });
      if (v.passed > lastPassed) { lastPassed = v.passed; fl = 1; }
      fl = Math.max(0, fl - dt * 2);
      pineG.position.z = 0;
      if (!K.calm && Math.random() < dt * 30) sp.push({ p: new THREE.Vector3(sx + K.R(-0.2, 0.2), H(sx, 0.5) + 0.05, 0.5), v: new THREE.Vector3(K.R(-1, 1) - lean * 3, K.R(0.5, 1.5), K.R(1, 2)), t: 0 });
      for (let i = sp.length - 1; i >= 0; i--) { const q = sp[i]; q.t += dt; q.v.y -= 4 * dt; q.p.addScaledVector(q.v, dt); if (q.t > 0.7) sp.splice(i, 1); }
      for (let i = 0; i < 30; i++) { const q = sp[i]; K.setInst(spray, i, q ? { x: q.p.x, y: q.p.y, z: q.p.z, s: 1 - q.t } : { s: 0.001 }); }
      spray.instanceMatrix.needsUpdate = true;
      cam.position.set(sx * 0.7, H(sx, 5) + 2.6, 5); cam.lookAt(sx * 0.5, H(0, -8) + 0.4, -8);
    },
    focus(p) { p.set(sx, H(sx, 0) + 1, 0); },
  };
});
})();
