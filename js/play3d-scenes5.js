// Fifth batch of 3D scenes for js/play3d.js: the motion exercises that have their own game code in
// js/games/arm.js, wrist.js and trunk.js (each game gives play3d a view() like the shared engines do).
// Same contract as the other scene files.
(() => {
"use strict";
const RC = window.RC;
const P3 = RC.Play3D;
if (!P3 || !P3.lib || !P3.lib.pathMapper) return;
const { PI, clamp, damp, lerp, ease, A, fit, animal, trees, pines, flowers, stick, textTex, sunny, shadowBox, target, bare, meadow, backdrop, camPt, glassMat, pathMapper } = P3.lib;
const TAU = PI * 2;
// text that shrinks to fit its label
const fitText = (K, text, bg, color, w, h) => K.tex(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle";
  let size = Math.round(h * 0.62); g.font = `700 ${size}px Fredoka, Arial, sans-serif`;
  while (size > 12 && g.measureText(text).width > w * 0.9) { size -= 4; g.font = `700 ${size}px Fredoka, Arial, sans-serif`; }
  g.fillText(text, w / 2, h / 2 + 4);
});
// a small songbird facing +z
function bird(K, color) {
  const g = K.group(null), m = K.S(color, { roughness: 0.5 });
  K.part(g, K.sph(0.09, 12, 10), m, [0, 0.08, 0], null, [0.9, 0.85, 1.2]);
  K.part(g, K.sph(0.065, 12, 10), m, [0, 0.17, 0.07]);
  K.part(g, K.cone(0.02, 0.05, 6), K.S(0xffb02a), [0, 0.165, 0.14], [PI / 2, 0, 0]);
  K.eyes(g, 0.03, 0.18, 0.115, 0.012);
  K.part(g, K.box(0.06, 0.012, 0.1), m, [0, 0.1, -0.12], [0.4, 0, 0]);
  const wings = [-1, 1].map((s) => { const w = K.group(g, [s * 0.07, 0.11, 0]); K.part(w, K.box(0.12, 0.012, 0.09), m, [s * 0.05, 0, 0]); return w; });
  K.part(g, K.sph(0.05, 8, 6), K.S(0xfff4e0), [0, 0.06, 0.05], null, [1, 0.8, 1], true);
  return { g, wings };
}

// ================================================================ 56. Side Raise (Reach, arm out to the side)
// The friendly scarecrow. Lift your arm out to the side and the scarecrow lifts its arm with you; hold it
// at the line and a bird lands on its hand, then hops up to join the others on its hat and shoulders.
P3.add("sideraise", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.5, 0.45, -1], sun: 1.2 });
  meadow(K, { color: (x, z) => (z < -1.2 && z > -9 && Math.abs(x) < 9 ? K.mix(0xd8b84a, 0xc8a83a, K.noise(x * 2, z * 2)) : K.mix(0x66a648, 0x92c85e, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 6); backdrop(K);
  K.inst(K.cyl(0.02, 0.025, 1, 4), K.swayM(0xe8c85a, 0.05, 1.6), Array.from({ length: 500 }, () => ({ x: K.R(-9, 9), y: 0.5, z: K.R(-9, -1.4), sy: K.R(0.7, 1.2) })).filter((p) => Math.abs(p.x) > 1.2 || p.z < -2.5));
  trees(K, K.ring(30, 12, 60, { free: true, ok: (x, z) => z < -10 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  const barn = K.group(null, [-6, 0, -12], [0, 0.4, 0]); K.part(barn, K.box(4, 3, 3), K.M(0xc8443a), [0, 1.5, 0]); for (const s of [-1, 1]) K.part(barn, K.box(4.3, 0.12, 2.0), K.M(0x5a4a44), [0, 3.55, s * 0.78], [s * 0.72, 0, 0]);
  // the scarecrow
  const sc = K.group(null, [0, 0, -0.4]), wood = K.M(0x8a6a44), straw = K.S(0xe8c85a, { roughness: 0.9 });
  K.part(sc, K.cyl(0.06, 0.07, 2.0, 7), wood, [0, 1.0, 0]);
  const shirtTex = K.tex(128, 128, (g, w, h) => { g.fillStyle = "#4a7ad8"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(255,255,255,0.35)"; for (let i = 0; i < 8; i++) { g.fillRect(i * 16, 0, 5, h); g.fillRect(0, i * 16, w, 5); } g.fillStyle = "rgba(230,70,70,0.6)"; for (let i = 0; i < 4; i++) g.fillRect(i * 32 + 8, 0, 3, h); });
  const shirt = new THREE.MeshStandardMaterial({ map: shirtTex, roughness: 0.8 });
  K.part(sc, K.cyl(0.26, 0.3, 0.75, 12), shirt, [0, 1.55, 0]);
  K.part(sc, K.cyl(0.24, 0.24, 0.5, 10), K.M(0x8a5a3a), [0, 1.0, 0]);
  const head = K.group(sc, [0, 2.12, 0]);
  K.part(head, K.sph(0.24, 16, 12), K.S(0xe8d0a0, { roughness: 0.9 }));
  K.part(head, K.cyl(0.36, 0.36, 0.03, 18), K.M(0xb8863a), [0, 0.16, 0]); K.part(head, K.cyl(0.18, 0.21, 0.24, 14), K.M(0xb8863a), [0, 0.28, 0]); K.part(head, K.cyl(0.215, 0.215, 0.06, 14), K.M(0xd84a4a), [0, 0.2, 0]);
  for (const s of [-1, 1]) K.part(head, K.cyl(0.035, 0.035, 0.02, 10), K.M(0x2a2a2a), [s * 0.08, 0.04, 0.22], [PI / 2, 0, 0]);
  K.part(head, K.tor(0.08, 0.012, 4, 12, PI), K.M(0x5a3a2a), [0, -0.06, 0.21], [0, 0, PI]);
  K.part(head, K.cone(0.03, 0.12, 6), K.M(0xff8a2a), [0, 0, 0.27], [PI / 2, 0, 0]);
  K.inst(K.cone(0.02, 0.12, 4), straw, Array.from({ length: 10 }, (_, i) => ({ x: Math.cos(i) * 0.2, y: 2.0, z: Math.sin(i) * 0.2, rx: PI, rz: K.R(-0.4, 0.4) })), { parent: sc });
  // the still arm (hanging) and the moving arm, from the shoulder
  const armOf = (side) => { const sh = K.group(sc, [side * 0.3, 1.82, 0]); K.part(sh, K.cyl(0.07, 0.065, 0.7, 8), shirt, [0, -0.35, 0]); K.part(sh, K.sph(0.07, 10, 8), K.S(0xe8d0a0, { roughness: 0.9 }), [0, -0.75, 0]); K.inst(K.cone(0.02, 0.1, 4), straw, [0, 1, 2].map((i) => ({ x: (i - 1) * 0.03, y: -0.82, z: 0, rx: PI })), { parent: sh }); return sh; };
  const still = armOf(-1), arm = armOf(1); still.rotation.z = -0.1;
  const L = 0.75, SH = new THREE.Vector3(0.3, 1.82, -0.4);
  const guide = K.part(sc, K.box(0.9, 0.025, 0.025), K.E(0x4ad884, { emissiveIntensity: 0.5, transparent: true, opacity: 0.6 }), [0.3 + 0.45, 1.82, 0.01], null, null, true);
  const ring = target(K, [SH.x + L, SH.y, SH.z + 0.05], 0.14);
  // birds: one flies in when you hold, then perches on the scarecrow
  const PERCH = [[0, 2.44, -0.4], [-0.32, 1.95, -0.4], [-0.15, 2.44, -0.35], [0.15, 2.44, -0.45], [-0.05, 2.5, -0.5], [0.3, 1.95, -0.38], [-1.2, 0.95, 0.4], [1.3, 0.95, 0.4], [-1.0, 0.95, 0.4], [1.1, 0.95, 0.4]];
  K.part(null, K.box(3.4, 0.06, 0.06), wood, [0, 0.9, 0.4]); for (const x of [-1.6, -0.6, 0.6, 1.6]) K.part(null, K.box(0.08, 0.95, 0.08), wood, [x, 0.47, 0.4]);
  const COLS = [0xff6a4a, 0x4a9ae8, 0xffd23a, 0x6ad86a, 0xb46aff, 0xff8ab8];
  let cur = null, n = 0, perched = [], ang = 0;
  const hand = new THREE.Vector3(), from = new THREE.Vector3(-4, 3.5, 1);
  cam.position.set(0.5, 1.7, 3.4); cam.lookAt(0.25, 1.55, -0.4);
  return {
    fov: 52, fovTall: 72, gauge: "h",
    update(v, t, dt) {
      ang = damp(ang, clamp(v.state === "return" ? v.u * 0.85 : v.u, 0, 1.18) * (PI / 2), 8, dt);
      arm.rotation.z = ang;
      hand.set(SH.x + Math.sin(ang) * L * 1.05, SH.y - Math.cos(ang) * L * 1.05 + 0.08, SH.z);
      const holding = v.state === "move" && v.u >= 0.9;
      ring(v.state === "move", t);
      guide.material.opacity = v.state === "move" ? 0.6 : 0.2;
      if (holding && !cur) { cur = bird(K, COLS[n % COLS.length]); cur.t = 0; cur.g.position.copy(from); }
      if (cur) {
        cur.t += dt; const k = clamp(cur.t / 0.8, 0, 1);
        cur.g.position.lerpVectors(from, hand, ease(k)); cur.g.position.y += Math.sin(k * PI) * 0.5;
        cur.g.rotation.y = k < 1 ? -1.2 : Math.sin(t * 2) * 0.4;
        const f = k < 1 && !K.calm ? Math.sin(t * 30) * 0.8 : 0; cur.wings[0].rotation.z = f; cur.wings[1].rotation.z = -f;
        if (!holding && !v.fresh && k >= 1 && v.state !== "move") { cur.leave = true; }
      }
      if (v.fresh && cur) { const p = PERCH[perched.length % PERCH.length]; perched.push({ b: cur, from: cur.g.position.clone(), to: new THREE.Vector3(...p), t: 0 }); cur = null; n++; }
      else if (cur && cur.leave) { cur.g.visible = false; cur = null; }
      perched.forEach((q) => { q.t += dt; const k = clamp(q.t / 0.7, 0, 1); q.b.g.position.lerpVectors(q.from, q.to, ease(k)); q.b.g.position.y += Math.sin(k * PI) * 0.3; const f = k < 1 && !K.calm ? Math.sin(t * 30) * 0.8 : 0; q.b.wings[0].rotation.z = f; q.b.wings[1].rotation.z = -f; if (k >= 1) q.b.g.rotation.y = Math.sin(t * 0.8 + q.to.x * 3) * 0.6; });
    },
    focus(p) { p.copy(hand); },
  };
});

// ================================================================ 57. Cup to Mouth (Reach, bend the elbow)
// Hot cocoa by the fire. Bend your elbow to bring the mug up for a sip; hold it there and the cocoa goes
// down, with a marshmallow bobbing on top. Lower it to the table to rest.
P3.add("cupmouth", (K, THREE, cam, S) => {
  K.scene.background = new THREE.Color(0x3a2a2a);
  K.lights({ sky: 0xffe8d0, ground: 0x5a4030, hemi: 1.05, sun: 0xffe0c0, sunI: 1.5, dir: [-0.4, 0.9, 0.5] });
  shadowBox(K, 3);
  const logW = RC.Scene3D.woodTexture("#8a5a3a"); logW.wrapS = logW.wrapT = THREE.RepeatWrapping; logW.repeat.set(1, 4);
  K.part(null, K.box(8, 4, 0.1), new THREE.MeshStandardMaterial({ map: logW, roughness: 0.8 }), [0, 2, -2.2]);
  K.part(null, K.box(9, 0.1, 6), new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#6a4a32"), roughness: 0.8 }), [0, -0.05, 0]);
  // fireplace with a crackling fire
  const fp = K.group(null, [-1.6, 0, -2.0]);
  K.part(fp, K.box(1.8, 1.6, 0.5), K.M(0x9a8a80), [0, 0.8, 0]); K.part(fp, K.box(1.1, 0.9, 0.52), K.M(0x1a1010), [0, 0.5, 0.01]); K.part(fp, K.box(2.1, 0.12, 0.6), K.M(0x6a4a32), [0, 1.65, 0.05]);
  const flames = [0, 1, 2].map((i) => K.part(fp, K.cone(0.14, 0.45, 6), K.E([0xff7a1a, 0xffb02a, 0xffd04a][i], { emissiveIntensity: 1 }), [(i - 1) * 0.18, 0.3, 0.1], null, null, true));
  K.sprite(0xff9a3a, 2.2, [-1.6, 0.6, -1.7], 0.5);
  const fire = new THREE.PointLight(0xff9a4a, 2.5, 6, 1.4); fire.position.set(-1.6, 0.7, -1.4); K.scene.add(fire);
  // window with falling snow
  K.part(null, K.plane(1.2, 1.0), K.B(0x2a3a6a), [1.4, 1.9, -2.14], null, null, true);
  const snow = K.inst(K.sph(0.015, 4, 3), K.B(0xffffff), Array.from({ length: 40 }, () => ({ s: 0.001 })), { shadow: false });
  const flakes = Array.from({ length: 40 }, () => ({ x: K.R(-0.55, 0.55), y: K.R(-0.45, 0.45), sp: K.R(0.1, 0.25) }));
  for (const [w, h, x, y] of [[1.3, 0.06, 0, 0.53], [1.3, 0.06, 0, -0.53], [0.06, 1.1, 0.63, 0], [0.06, 1.1, -0.63, 0], [0.04, 1.0, 0, 0]]) K.part(null, K.box(w, h, 0.05), K.M(0xffffff), [1.4 + x, 1.9 + y, -2.12]);
  // the table and a sleepy dog by the fire
  K.part(null, K.box(1.8, 0.06, 1.0), new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#b08a62"), roughness: 0.7 }), [0, 0.75, 0.1]);
  const dog = animal(K, "fennec", 0.55); dog.g.position.set(-0.9, 0, -1.2); dog.g.rotation.y = 0.6;
  // the mug
  const mug = K.group(null), mugM = K.S(0xe84a5a, { roughness: 0.4 });
  K.part(mug, K.cyl(0.07, 0.065, 0.16, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xe84a5a, roughness: 0.4, side: THREE.DoubleSide }), [0, 0.08, 0]);
  K.part(mug, K.cyl(0.065, 0.065, 0.01, 20), mugM, [0, 0.005, 0]);
  K.part(mug, K.tor(0.04, 0.012, 6, 14, PI), mugM, [0.075, 0.08, 0], [0, 0, -PI / 2]);
  K.part(mug, K.box(0.07, 0.03, 0.005), K.M(0xffffff), [0, 0.09, 0.068], null, null, true);
  const cocoa = K.part(mug, K.cyl(0.064, 0.064, 0.005, 18), K.S(0x6a3a1a, { roughness: 0.3 }), [0, 0.14, 0], null, null, true);
  const mallow = K.part(mug, K.box(0.03, 0.025, 0.03), K.S(0xffffff, { roughness: 0.6 }), [0.015, 0.15, 0.01], [0.3, 0.5, 0], null, true);
  const steam = Array.from({ length: 4 }, (_, i) => ({ s: K.sprite(0xffffff, 0.12, null, 0), t: i * 0.5 }));
  const low = new THREE.Vector3(0.15, 0.78, 0.25), hi = new THREE.Vector3(), tmp = new THREE.Vector3();
  let cu = 0, level = 1, sip = 0;
  cam.position.set(0, 1.35, 0.95); cam.lookAt(0, 0.95, -0.5); cam.updateMatrixWorld();
  const hearts = [];
  return {
    fov: 55, fovTall: 74, gauge: "v",
    update(v, t, dt) {
      cu = damp(cu, clamp(v.state === "return" ? v.u * 0.8 : v.u, 0, 1.15), 7, dt); const e = ease(Math.min(1, cu));
      camPt(cam, 0.03, -0.13, -0.46, hi);
      mug.position.lerpVectors(low, hi, e); mug.rotation.set(Math.max(0, cu - 0.7) * 1.1, 0.4 * (1 - e), 0);
      const holding = v.state === "move" && v.u >= 0.9;
      sip = holding ? v.prog : damp(sip, 0, 4, dt);
      const lv = Math.max(0.15, level - sip * 0.12); cocoa.position.y = 0.02 + lv * 0.12; mallow.position.y = cocoa.position.y + 0.012 + Math.sin(t * 2) * 0.003;
      if (v.fresh) { level = Math.max(0.2, level - 0.8 / Math.max(3, S.reps || 10)); for (let i = 0; i < 3; i++) { const g = K.group(null); const m = K.E(0xff5a7a, { emissiveIntensity: 0.6 }); K.part(g, K.sph(0.02, 8, 6), m, [-0.015, 0, 0], null, null, true); K.part(g, K.sph(0.02, 8, 6), m, [0.015, 0, 0], null, null, true); K.part(g, K.cone(0.028, 0.035, 4), m, [0, -0.024, 0], [PI, PI / 4, 0], null, true); hearts.push({ g, t: -i * 0.2, x: K.R(-0.12, 0.12) }); } }
      hearts.forEach((h) => { h.t += dt; const k = Math.max(0, h.t); h.g.visible = h.t > 0 && k < 1.4; camPt(cam, h.x, -0.05 + k * 0.12, -0.5, h.g.position); h.g.scale.setScalar(Math.min(1, k * 5)); });
      mug.updateMatrixWorld(); tmp.set(0, 0.2, 0); mug.localToWorld(tmp);
      steam.forEach((q) => { q.t += dt; const k = (q.t % 2) / 2; q.s.position.copy(tmp).add(new THREE.Vector3(Math.sin(q.t * 3) * 0.02, k * 0.25, 0)); q.s.material.opacity = (1 - k) * 0.4 * (1 - e * 0.7); });
      flames.forEach((f, i) => { f.scale.y = K.calm ? 1 : 0.8 + Math.abs(Math.sin(t * 7 + i * 2)) * 0.5; });
      fire.intensity = 2.3 + (K.calm ? 0 : Math.sin(t * 9) * 0.4);
      flakes.forEach((f, i) => { f.y -= f.sp * dt; if (f.y < -0.45) f.y = 0.45; K.setInst(snow, i, { x: 1.4 + f.x + Math.sin(t + i) * 0.02, y: 1.9 + f.y, z: -2.13 }); }); snow.instanceMatrix.needsUpdate = true;
      if (dog.idle) dog.idle(t);
    },
    focus(p) { p.copy(mug.position).add(new THREE.Vector3(0, 0.15, 0)); },
  };
});

// ================================================================ 58. Reach Targets (3x3 board)
// Lights on in the apartment block. Point your torch at the window with the green ring and hold it there;
// the light comes on and whoever lives there waves hello.
P3.add("reach", (K, THREE, cam) => {
  K.sky(0x0a1030, 0x1a2a5a, 0x3a3a6a, { sunDir: [0, 0.2, -1], sun: 0, horizon: 0.1 });
  K.stars(700, { minY: 0.1 });
  K.scene.fog = new THREE.Fog(0x1a2448, 30, 160);
  K.lights({ sky: 0x8a9ae0, ground: 0x2a2a3a, hemi: 0.75, sun: 0xc8d8ff, sunI: 0.8, dir: [-0.3, 0.8, 0.6] });
  K.ground({ size: 200, seg: 40, h: () => 0, color: (x, z) => (z > -1.6 && z < 1.4 ? 0x4a4a52 : K.mix(0x1e3a2a, 0x2e4e34, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 6);
  K.part(null, K.sph(1, 20, 14), K.B(0xfff4d0, { fog: false }), [18, 26, -60], null, 3);
  // the building
  const B = K.group(null, [0, 0, -2.2]);
  K.part(B, K.box(4.6, 5.6, 1.6), K.M(0xc89a7a), [0, 2.8, -0.8]);
  K.part(B, K.box(4.8, 0.2, 1.8), K.M(0x8a5a4a), [0, 5.7, -0.8]);
  K.part(B, K.box(1.0, 1.1, 0.05), K.M(0x5a3a2a), [0, 0.55, 0.01]);
  const C = (i) => new THREE.Vector3((i % 3 - 1) * 1.3, 4.35 - Math.floor(i / 3) * 1.3, 0.04);
  const FR = ["rabbit", "panda", "pig", "sheep", "chicken", "fennec", "penguin", "rabbit", "pig"], wins = [];
  for (let i = 0; i < 9; i++) {
    const p = C(i), w = K.group(B, p.toArray());
    K.part(w, K.box(0.86, 0.86, 0.06), K.M(0xffffff), [0, 0, -0.02]);
    const glass = K.part(w, K.box(0.74, 0.74, 0.04), K.M(0x1a2440, { roughness: 0.3 }), [0, 0, 0.01], null, null, true);
    K.part(w, K.box(0.03, 0.74, 0.06), K.M(0xffffff), [0, 0, 0.02], null, null, true);
    K.part(w, K.box(0.92, 0.06, 0.12), K.M(0x8a5a4a), [0, -0.46, 0.04]);
    const kind = FR[i], a = kind === "penguin" ? bare(K, "penguin", [1, 2], 0.55, w) : animal(K, kind, 0.55, w); a.g.position.set(0, -0.37, -0.04); a.g.visible = false;
    wins.push({ glass, a, on: false, wave: 0 });
  }
  const ring = target(K, [0, 0, 0], 0.5);
  // the torch beam: a bright spot on the wall where you point
  const spot = K.sprite(0xfff0c0, 1.2, null, 0.85), glowRing = K.sprite(0x8affb0, 1.6, null, 0);
  const torch = K.group(null); K.part(torch, K.cyl(0.05, 0.07, 0.35, 12), K.M(0x2a6ad8), [0, 0, 0], [PI / 2, 0, 0]); K.part(torch, K.circle(0.06, 12), K.E(0xfff4d0), [0, 0, -0.18], [PI, 0, 0], null, true);
  const beam = K.part(null, new THREE.ConeGeometry(1, 1, 20, 1, true).translate(0, -0.5, 0).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), null, null, null, true);
  const P = new THREE.Vector3(), SRC = new THREE.Vector3();
  let px = 0, py = 0, last = -1, prevLit = 0;
  cam.position.set(0, 2.9, 4.4); cam.lookAt(0, 2.95, -2.2); cam.updateMatrixWorld();
  return {
    fov: 55, fovTall: 76, gauge: "none",
    update(v, t, dt) {
      px = damp(px, clamp(v.x, -1.3, 1.3), 14, dt); py = damp(py, clamp(v.y, -1.3, 1.3), 14, dt);
      P.set(px * 1.95, 4.35 - 1.3 - py * 1.95 + 0, -2.15);
      spot.position.copy(P); camPt(cam, 0.45, -0.5, -1.0, SRC); torch.position.copy(SRC); torch.lookAt(P); torch.rotateY(PI);
      beam.position.copy(SRC); beam.lookAt(P); const Lb = SRC.distanceTo(P); beam.scale.set(0.35, 0.35, Lb);
      const r = ring(true, t), c = C(v.lit); r.position.set(c.x, c.y, -2.08);
      glowRing.position.set(c.x, c.y, -2.0); glowRing.material.opacity = v.prog * 0.9;
      if (v.reps > last) { if (last >= 0) { const w = wins[prevLit]; if (w) { w.on = true; w.wave = 2.5; } } last = v.reps; }
      prevLit = v.lit;
      wins.forEach((w, i) => { w.glass.material = K.M(w.on ? 0xffd890 : 0x1a2440, w.on ? { emissive: 0xffc860, emissiveIntensity: 0.8, roughness: 0.3 } : { roughness: 0.3 }); w.a.g.visible = w.on; if (w.wave > 0) { w.wave -= dt; w.a.g.rotation.z = Math.sin(t * 10) * 0.2; } else w.a.g.rotation.z = 0; if (w.a.idle && w.on) w.a.idle(t); });
    },
    focus(p) { p.copy(C(prevLit)).add(new THREE.Vector3(0, 0, -2.1)); },
  };
});

// ================================================================ 59. Push Away (accel push)
// Curling on the frozen lake. Each smooth push slides a stone down the ice toward the rings while two
// penguins sweep ahead of it; the stones gather in the house.
P3.add("push", (K, THREE, cam, S) => {
  K.sky(0x4a8ae0, 0xc8e4f8, 0xf4f8fc, { sunDir: [0.4, 0.35, -1], sun: 1.0, sunColor: 0xfff6e0, horizon: 0.14 });
  K.scene.fog = new THREE.Fog(0xe0eef8, 40, 200);
  K.lights({ sky: 0xf0f6ff, ground: 0x8aa0b8, hemi: 1.1, sun: 0xfff2e0, sunI: 1.7, dir: [0.4, 0.8, 0.5] });
  K.ground({ size: 300, seg: 60, h: (x, z) => (Math.abs(x) > 8 ? K.fbm(x * 0.05, z * 0.05) * 4 * Math.min(1, (Math.abs(x) - 8) / 10) : 0), color: (x, z) => (Math.abs(x) < 1.6 ? K.mix(0xd8ecf8, 0xc4e0f4, K.noise(x * 3, z * 0.3)) : K.mix(0xf4f8fc, 0xd8e6f2, K.fbm(x * 0.3, z * 0.3))) });
  shadowBox(K, 8);
  pines(K, K.ring(40, 10, 60, { free: true, ok: (x) => Math.abs(x) > 6 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.8) })));
  K.peaks(10, 160, 230, 25, 55, 0xe8f0f8, { snow: 0xffffff });
  const L = 16, HZ = -L;
  for (let i = 0; i < 4; i++) K.part(null, K.circle(1.5 - i * 0.37, 32), K.M([0x3a6ad8, 0xffffff, 0xe84a5a, 0xffffff][i], { roughness: 0.4 }), [0, 0.004 + i * 0.002, HZ], [-PI / 2, 0, 0], null, true);
  for (const z of [-3, HZ + 2.2]) K.part(null, K.box(3.2, 0.005, 0.05), K.B(0x2a4ad8), [0, 0.003, z]);
  for (const s of [-1, 1]) K.part(null, K.box(0.12, 0.2, L + 6), K.M(0xffffff), [s * 1.65, 0.1, -L / 2]);
  const stone = (c) => { const g = K.group(null); K.part(g, K.cyl(0.2, 0.22, 0.14, 20), K.S(0x8a8a90, { roughness: 0.4 }), [0, 0.07, 0]); K.part(g, K.cyl(0.18, 0.18, 0.03, 18), K.S(c), [0, 0.155, 0]); K.part(g, K.box(0.05, 0.05, 0.22), K.S(c), [0, 0.19, 0.03]); return g; };
  const COL = [0xe84a5a, 0xffd23a];
  const sweepers = [-0.55, 0.55].map((x) => { const p = bare(K, "penguin", [1, 2], 0.6); p.g.position.set(x, 0, -6); const br = K.group(p.g, [0, 0.4, 0.25], [0.6, 0, 0]); K.part(br, K.cyl(0.015, 0.015, 0.7, 4), K.M(0x5a3a2a), [0, -0.3, 0]); K.part(br, K.box(0.2, 0.05, 0.08), K.M(0xe84a5a), [0, -0.65, 0]); return { p, br }; });
  // your gloves on the handle
  const hands = K.group(null); for (const s of [-1, 1]) K.part(hands, K.sph(0.07, 10, 8), K.S(0x2a6ad8, { roughness: 0.8 }), [s * 0.08, 0, 0]);
  let cur = stone(COL[0]), slide = null, n = 0, lastBeat = null, house = [], sz = 0.8;
  cur.position.set(0, 0, 0.8);
  cam.position.set(0, 1.4, 2.6); cam.lookAt(0, 0.1, -8);
  return {
    fov: 50, fovTall: 70, gauge: "h",
    update(v, t, dt) {
      if (lastBeat == null) lastBeat = v.beat;
      if (v.beat !== lastBeat && v.phase === "push" && !slide) { slide = { t: 0, to: HZ + K.R(-0.6, 0.6), x: K.R(-0.5, 0.5), g: cur }; }
      lastBeat = v.beat;
      if (slide) {
        slide.t += dt; const k = clamp(slide.t / 2.4, 0, 1), z = lerp(0.8, slide.to, 1 - Math.pow(1 - k, 2.4));
        slide.g.position.set(lerp(0, slide.x, k), 0, z); slide.g.rotation.y += dt * 1.5 * (1 - k);
        sweepers.forEach((s, i) => { s.p.g.position.set((i ? 0.55 : -0.55) + slide.g.position.x, 0, z - 1.2); s.br.rotation.z = Math.sin(t * 16 + i * 2) * 0.5; s.p.g.rotation.y = PI; });
        if (k >= 1) { house.push(slide.g); slide = null; n++; cur = stone(COL[n % 2]); cur.position.set(0, 0, 3); sz = 3; }
      } else sweepers.forEach((s, i) => { s.p.g.position.z = damp(s.p.g.position.z, -6, 1.5, dt); s.br.rotation.z = 0; s.p.g.rotation.y = PI; });
      if (!slide) { sz = damp(sz, 0.8 - (v.phase === "push" ? 0 : 0) + clamp(v.a, 0, 1) * -0.25, 4, dt); cur.position.z = sz; }
      hands.position.set(cur.position.x, 0.25, (slide ? 0.8 : cur.position.z) + 0.15); hands.visible = !slide || slide.t < 0.4;
    },
    focus(p) { p.set(0, 0.5, slide ? slide.g.position.z : HZ); },
  };
});

// ================================================================ 60. Trace It (path on the sky)
// Skywriting. Steer the little plane along the dotted shape in the sky; it draws a smoke trail where it
// has been. A finished shape glows, and the next one is drawn.
P3.add("trace", (K, THREE, cam) => {
  sunny(K, { top: 0x2a76d8, mid: 0x9ad0f0, low: 0xe8f4fc, sunDir: [0.6, 0.5, -1], sun: 1.2 });
  meadow(K, { z0: -10 }); shadowBox(K, 8); K.peaks(14, 150, 220, 30, 60, 0x7aa0b0, { snow: 0xf4f8fc });
  trees(K, K.ring(30, 8, 60, { free: true, ok: (x, z) => z < -4 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  flowers(K, 120, [-6, 6, -4, 1]);
  const Z = -14, plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -Z), map = pathMapper(THREE, cam, plane);
  const MAX = 160, guide = K.inst(K.sph(0.09, 8, 6), K.B(0xffffff, { transparent: true, opacity: 0.85 }), Array.from({ length: MAX }, () => ({ s: 0.001 })), { shadow: false });
  const puffs = K.inst(K.ico(0.28, 1), K.M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 1 }), Array.from({ length: MAX }, () => ({ s: 0.001 })), { shadow: false });
  // the plane
  const pl = K.group(null, null, null, 2), red = K.S(0xe84a5a, { roughness: 0.4 });
  K.part(pl, K.cyl(0.12, 0.08, 0.9, 12), red, [0, 0, 0], [0, 0, PI / 2]);
  K.part(pl, K.box(0.18, 0.04, 1.1), K.S(0xffd23a, { roughness: 0.4 }), [0.05, 0, 0]);
  K.part(pl, K.box(0.12, 0.25, 0.04), red, [-0.42, 0.12, 0]);
  K.part(pl, K.box(0.12, 0.03, 0.4), K.S(0xffd23a), [-0.42, 0.02, 0]);
  const prop = K.part(pl, K.box(0.02, 0.4, 0.04), K.M(0x3a3a3a), [0.47, 0, 0]);
  const ring = K.sprite(0xffa040, 0.9, null, 0.9);
  let key = null, world = [], shown = -1, lastReps = 0, glowT = 0;
  const cp = new THREE.Vector3(), prev = new THREE.Vector3();
  cam.position.set(0, 1.6, 6); cam.lookAt(0, 5.5, Z);
  return {
    fov: 55, fovTall: 74, gauge: "none",
    update(v, t, dt) {
      cam.updateMatrixWorld();
      const k = `${v.name}|${v.W}|${v.H}|${v.pts.length}`;
      if (k !== key && v.pts.length) {
        key = k; const step = Math.max(1, Math.ceil(v.pts.length / MAX)); world = [];
        for (let i = 0; i < v.pts.length; i += step) world.push({ i, p: map(v.pts[i][0], v.pts[i][1], v.W, v.H, new THREE.Vector3()) });
        for (let i = 0; i < MAX; i++) K.setInst(guide, i, world[i] && i % 2 === 0 ? { x: world[i].p.x, y: world[i].p.y, z: world[i].p.z } : { s: 0.001 });
        guide.instanceMatrix.needsUpdate = true; shown = -1;
      }
      const n = world.findIndex((w) => w.i >= v.idx), upto = n < 0 ? world.length : n;
      if (upto !== shown) { for (let i = 0; i < MAX; i++) K.setInst(puffs, i, i < upto && world[i] ? { x: world[i].p.x, y: world[i].p.y, z: world[i].p.z, ry: i, s: 0.8 + (i % 3) * 0.15 } : { s: 0.001 }); puffs.instanceMatrix.needsUpdate = true; shown = upto; }
      if (world[upto]) ring.position.copy(world[upto].p).add(new THREE.Vector3(0, 0, 0.1));
      if (v.reps > lastReps) { lastReps = v.reps; glowT = 1.2; }
      glowT = Math.max(0, glowT - dt); puffs.material.emissiveIntensity = 0.4 + glowT * 0.6;
      if (v.cur && v.W) { map(v.cur.x, v.cur.y, v.W, v.H, cp); prev.copy(pl.position); pl.position.lerp(cp, Math.min(1, dt * 12)); const d = pl.position.clone().sub(prev); if (d.lengthSq() > 1e-6) pl.rotation.z = damp(pl.rotation.z, Math.atan2(d.y, d.x), 8, dt); }
      pl.rotation.x = Math.sin(t * 2) * 0.1; prop.rotation.x = t * 40;
    },
    focus(p) { p.copy(pl.position); },
  };
});

// ================================================================ 61. Combination Lock
// The treasure safe. Read the code on the note, then turn your wrist to swing the pointer to each number
// and hold it there. Get them all right and the door swings open on the treasure.
P3.add("lock", (K, THREE, cam) => {
  K.scene.background = new THREE.Color(0x2a3040);
  K.lights({ sky: 0xfff0e0, ground: 0x4a4048, hemi: 1.1, sun: 0xfff0e0, sunI: 1.8, dir: [-0.3, 0.9, 0.7] });
  shadowBox(K, 4);
  K.part(null, K.box(9, 4, 0.1), K.M(0x5a6a7a), [0, 2, -1.6]);
  K.part(null, K.box(9, 0.1, 6), new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#7a5a3a"), roughness: 0.8 }), [0, -0.05, 0]);
  // the safe
  const safe = K.group(null, [0, 0, -0.6]), steel = K.S(0x3a4a5a, { metalness: 0.5, roughness: 0.35 });
  K.part(safe, K.box(2.0, 2.0, 1.4), steel, [0, 1.0, -0.2]);
  K.part(safe, K.box(1.7, 1.7, 0.6), K.M(0x1a1410), [0, 1.0, 0.2]);
  K.inst(K.cyl(0.07, 0.07, 0.02, 12), K.S(0xffc828, { metalness: 0.7, roughness: 0.25 }), Array.from({ length: 50 }, () => ({ x: K.R(-0.7, 0.7), y: 0.22 + K.R(0, 0.35), z: K.R(-0.2, 0.3), rx: K.R(0, 3), rz: K.R(0, 3) })), { parent: safe });
  K.part(safe, K.dod(0.12), K.S(0x5ad8ff, { metalness: 0.2, roughness: 0.1 }), [0.3, 0.75, 0.3]); K.part(safe, K.dod(0.1), K.S(0xff5a8a, { metalness: 0.2, roughness: 0.1 }), [-0.35, 0.7, 0.25]);
  const door = K.group(safe, [-0.85, 1.0, 0.52]), doorM = K.S(0x4a5a6a, { metalness: 0.5, roughness: 0.3 });
  K.part(door, K.box(1.7, 1.7, 0.12), doorM, [0.85, 0, 0]);
  for (const y of [-0.55, 0.55]) K.part(door, K.cyl(0.05, 0.05, 0.2, 10), K.S(0xc8c8d0, { metalness: 0.7 }), [0.02, y, 0], [0, 0, 0]);
  // dial face with numbers 0..9 across the top half, and a pointer
  const face = K.group(door, [0.85, -0.1, 0.07]);
  const faceTex = K.tex(512, 512, (g, w, h) => {
    g.fillStyle = "#e8e4dc"; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, TAU); g.fill();
    g.fillStyle = "#1a1a22"; g.font = "700 54px Fredoka, Arial"; g.textAlign = "center"; g.textBaseline = "middle";
    for (let n = 0; n <= 9; n++) { const a = PI + (n / 9) * PI; g.fillText(String(n), w / 2 + Math.cos(a) * 190, h / 2 + Math.sin(a) * 190); g.fillRect(w / 2 + Math.cos(a) * 235 - 3, h / 2 + Math.sin(a) * 235 - 3, 6, 6); }
  });
  K.part(face, K.circle(0.55, 40), new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5 }), [0, 0, 0.005], null, null, true);
  K.part(face, K.tor(0.56, 0.035, 8, 40), K.S(0xc8c8d0, { metalness: 0.7, roughness: 0.25 }), [0, 0, 0.01]);
  const hi = K.part(face, K.circle(0.09, 20), K.E(0x4ad884, { emissiveIntensity: 0.6, transparent: true, opacity: 0.7 }), [0, 0, 0.012], null, null, true);
  const ptr = K.group(face, [0, 0, 0.03]); K.part(ptr, K.box(0.05, 0.36, 0.02), K.S(0xe84a3a, { roughness: 0.4 }), [0, 0.18, 0]);
  K.part(face, K.cyl(0.11, 0.11, 0.06, 20), K.S(0x2a2a32, { metalness: 0.5 }), [0, 0, 0.04], [PI / 2, 0, 0]);
  const holdRing = K.part(face, K.tor(0.12, 0.012, 4, 30, 0.01), K.B(0x5ad88c), [0, 0, 0.075], [0, 0, PI / 2], null, true);
  // little screens above the dial for the digits entered, and the note with the code
  const slots = [], slotTex = (s, c) => textTex(K, s, { w: 128, h: 128, bg: "#10141c", color: c });
  for (let i = 0; i < 4; i++) { const m = K.part(door, K.plane(0.26, 0.26), new THREE.MeshBasicMaterial({ map: slotTex(" ", "#ffffff") }), [0.85 + (i - 1.5) * 0.32, 0.62, 0.065], null, null, true); slots.push({ m, s: null }); }
  const note = K.group(null, [1.75, 1.9, -1.53], [0, 0, 0.06]);
  K.part(note, K.box(0.9, 0.62, 0.01), K.M(0xfff07a), [0, 0, 0]);
  const noteText = K.part(note, K.plane(0.8, 0.4), new THREE.MeshBasicMaterial({ map: textTex(K, " ", { bg: "#fff07a", color: "#1a1a1a" }), transparent: true }), [0, -0.04, 0.007], null, null, true);
  K.part(note, K.plane(0.8, 0.14), new THREE.MeshBasicMaterial({ map: textTex(K, "CODE", { bg: "#fff07a", color: "#8a6a2a" }) }), [0, 0.22, 0.007], null, null, true);
  const pal = animal(K, "panda", 0.9); pal.g.position.set(-1.7, 0, 0.1); pal.g.rotation.y = 0.6;
  const sparkle = K.sprite(0xffe08a, 3, [0, 1.0, 0.0], 0);
  let open = 0, noteKey = null, ptrA = PI / 2, holdQ = -1, shake = 0, lastPhase = null;
  cam.position.set(0.3, 1.55, 3.0); cam.lookAt(0.1, 1.15, -0.6);
  return {
    fov: 50, fovTall: 70, gauge: "none",
    update(v, t, dt) {
      ptrA = damp(ptrA, PI / 2 - (clamp(v.dial, 0, 9) / 9) * PI, 12, dt); ptr.rotation.z = ptrA;
      const d = Math.round(clamp(v.dial, 0, 9)), a = PI + (d / 9) * PI; hi.position.set(Math.cos(a) * 0.4, -Math.sin(a) * 0.4, 0.012); hi.visible = v.phase === "dial";
      const q = Math.round(clamp(v.prog, 0, 1) * 20); if (q !== holdQ) { holdQ = q; holdRing.geometry = K.tor(0.12, 0.012, 4, 30, Math.max(0.01, (q / 20) * TAU)); }
      const nk = v.phase === "show" ? v.code.join(" ") : v.phase === "reveal" ? v.code.join(" ") : "? ".repeat(v.len).trim();
      if (nk !== noteKey) { noteKey = nk; noteText.material.map.dispose(); noteText.material.map = textTex(K, nk, { bg: "#fff07a", color: "#1a1a1a" }); }
      for (let i = 0; i < 4; i++) {
        const sl = slots[i]; sl.m.visible = i < v.len;
        const e = v.entered[i], s = v.phase === "show" ? " " : e == null ? (i === v.entered.length && v.phase === "dial" ? "_" : " ") : String(e), c = e == null ? "#ffffff" : e === v.code[i] ? "#5ad88c" : "#ff7a5a";
        if (sl.s !== s + c) { sl.s = s + c; sl.m.material.map.dispose(); sl.m.material.map = slotTex(s, c); }
      }
      if (v.phase !== lastPhase) { if (v.phase === "reveal" && !v.opened) shake = 0.6; lastPhase = v.phase; }
      open = damp(open, v.opened ? 1 : 0, 3, dt); door.rotation.y = -open * 1.9; sparkle.material.opacity = open * 0.6;
      shake = Math.max(0, shake - dt); safe.position.x = Math.sin(t * 60) * 0.02 * (shake > 0 ? 1 : 0);
      if (pal.idle) pal.idle(t); pal.g.position.y = open > 0.5 && !K.calm ? Math.abs(Math.sin(t * 8)) * 0.1 : 0;
    },
    focus(p) { p.set(0, 1.0, 0); },
  };
});

// ================================================================ 62. Tilt Maze
// A wooden labyrinth on the table. Tilt your hand like a tray and the board tilts with it; roll the steel
// ball to the flag without bumping the walls.
P3.add("maze", (K, THREE, cam) => {
  K.scene.background = new THREE.Color(0xe8dcc8);
  K.lights({ sky: 0xfff8f0, ground: 0x8a7a68, hemi: 1.3, sun: 0xfff4e0, sunI: 2.0, dir: [-0.4, 1, 0.6] });
  shadowBox(K, 3);
  K.part(null, K.box(8, 0.1, 6), new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#6a4a32"), roughness: 0.8 }), [0, -0.05, 0]);
  K.part(null, K.box(9, 4, 0.1), K.M(0xd8e4f0), [0, 2, -2.6]);
  const tilt = K.group(null, [0, 0.35, 0]), board = K.group(tilt);
  const woodM = new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#d8a868"), roughness: 0.6 }), wallM = K.S(0x8a5a3a, { roughness: 0.6 });
  K.part(null, K.box(0.3, 0.35, 0.3), K.M(0x5a4a3a), [0, 0.17, 0]);
  const ball = K.part(tilt, K.sph(1, 20, 14), K.S(0xe8ecf4, { metalness: 0.55, roughness: 0.2 }), null, null, 0.1);
  let maze = null, cs = 0.3, W = 0, Hh = 0, flag = null;
  const build = (m) => {
    board.clear(); maze = m; const { C, R, cells } = m;
    cs = Math.min(2.6 / C, 1.6 / R); W = C * cs; Hh = R * cs;
    K.part(board, K.box(W + 0.2, 0.06, Hh + 0.2), woodM, [0, -0.03, 0]);
    const list = [], wh = 0.12, wt = cs * 0.08;
    const X = (x) => x * cs - W / 2, Zc = (y) => y * cs - Hh / 2;
    for (const c of cells) {
      if (c.n) list.push({ x: X(c.x + 0.5), z: Zc(c.y), sx: cs + wt, sz: wt });
      if (c.w) list.push({ x: X(c.x), z: Zc(c.y + 0.5), sx: wt, sz: cs + wt });
      if (c.y === R - 1 && c.s) list.push({ x: X(c.x + 0.5), z: Zc(c.y + 1), sx: cs + wt, sz: wt });
      if (c.x === C - 1 && c.e) list.push({ x: X(c.x + 1), z: Zc(c.y + 0.5), sx: wt, sz: cs + wt });
    }
    K.inst(K.box(1, 1, 1), wallM, list.map((p) => ({ x: p.x, y: wh / 2, z: p.z, sx: p.sx, sy: wh, sz: p.sz })), { parent: board });
    const gx = X(C - 0.5), gz = Zc(R - 0.5);
    K.part(board, K.circle(cs * 0.3, 20), K.M(0x1a1a1a), [gx, 0.002, gz], [-PI / 2, 0, 0], null, true);
    K.part(board, K.circle(cs * 0.45, 20), K.E(0x4ad884, { emissiveIntensity: 0.4, transparent: true, opacity: 0.5 }), [gx, 0.001, gz], [-PI / 2, 0, 0], null, true);
    flag = K.group(board, [gx + cs * 0.3, 0, gz - cs * 0.3]); K.part(flag, K.cyl(0.008, 0.008, 0.3, 4), K.M(0xffffff), [0, 0.15, 0]); K.part(flag, K.box(0.12, 0.08, 0.005), K.M(0xe84a5a), [0.06, 0.26, 0]);
    K.part(board, K.circle(cs * 0.3, 16), K.E(0xffa040, { emissiveIntensity: 0.4, transparent: true, opacity: 0.4 }), [X(0.5), 0.001, Zc(0.5)], [-PI / 2, 0, 0], null, true);
    ball.scale.setScalar(cs * 0.22);
    cam.position.set(0, 0.35 + Math.max(2.0, W * 0.9), Math.max(1.4, Hh * 0.95) + 0.6); cam.lookAt(0, 0.3, 0.05);
  };
  let tx = 0, ty = 0, win = 0;
  return {
    fov: 50, fovTall: 70, gauge: "none",
    update(v, t, dt) {
      if (v.maze !== maze) build(v.maze);
      tx = damp(tx, v.tilt.x, 8, dt); ty = damp(ty, v.tilt.y, 8, dt);
      tilt.rotation.set(ty * 0.12, 0, -tx * 0.12);
      ball.position.set(v.ball.x * cs - W / 2, cs * 0.22, v.ball.y * cs - Hh / 2);
      ball.rotation.z = -v.ball.x * 4; ball.rotation.x = v.ball.y * 4;
      if (v.win > 0) { win = 1; flag.rotation.y += dt * 6; } else { win = 0; if (flag) flag.rotation.y = Math.sin(t * 2) * 0.3; }
    },
    focus(p) { p.copy(ball.position).applyMatrix4(tilt.matrixWorld); },
  };
});
// ================================================================ 63. Wrist Bend (swing, wrist up then down)
// The temple gong. Bend your wrist up to lift the soft mallet, then down to strike: the gong shimmers,
// rings of sound spread out and the koi in the pond jump.
P3.add("wristbend", (K, THREE, cam, S) => {
  sunny(K, { top: 0x3a76c8, mid: 0xf0c8a0, low: 0xffe8c8, sunDir: [-0.5, 0.25, -1], sun: 1.3, sunColor: 0xffd0a0, fog: 0xf0d8c0 });
  meadow(K, { color: (x, z) => (Math.hypot(x - 1.8, z + 0.6) < 1.4 ? 0x3a7a9a : K.mix(0x5a9a40, 0x7aa84a, K.fbm(x * 0.15, z * 0.15))) });
  K.part(null, K.circle(1.35, 28), K.S(0x3a8ab8, { roughness: 0.15 }), [1.8, 0.02, -0.6], [-PI / 2, 0, 0], null, true);
  shadowBox(K, 6); backdrop(K);
  trees(K, K.ring(26, 8, 60, { free: true, ok: (x, z) => z < -3 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })), [0xe88aa8, 0xf0a8c0, 0x4a8a3a]);
  // the gong in its wooden frame
  const red = K.S(0xb8342a, { roughness: 0.5 }), gongG = K.group(null, [-0.3, 0, -1.0]);
  for (const x of [-1.0, 1.0]) K.part(gongG, K.box(0.14, 2.2, 0.14), red, [x, 1.1, 0]);
  K.part(gongG, K.box(2.5, 0.16, 0.18), red, [0, 2.25, 0]); K.part(gongG, K.box(2.8, 0.1, 0.26), K.M(0x2a2a2a), [0, 2.38, 0]);
  const gong = K.group(gongG, [0, 1.3, 0]);
  for (const x of [-0.35, 0.35]) K.part(gongG, K.cyl(0.01, 0.01, 0.4, 4), K.M(0x5a3a2a), [x, 2.0, 0]);
  K.part(gong, K.cyl(0.75, 0.75, 0.06, 40), K.S(0xd8a838, { metalness: 0.8, roughness: 0.3 }), null, [PI / 2, 0, 0]);
  K.part(gong, K.cyl(0.25, 0.25, 0.08, 30), K.S(0xe8c058, { metalness: 0.8, roughness: 0.25 }), null, [PI / 2, 0, 0]);
  K.part(gong, K.tor(0.55, 0.012, 4, 40), K.S(0xb8882a, { metalness: 0.8 }), [0, 0, 0.035]);
  // koi in the pond
  const koi = [0xff7a2a, 0xffffff, 0xff4a2a].map((c, i) => { const g = K.group(null, null, null, 0.7); K.part(g, K.sph(1, 10, 8), K.S(c, { roughness: 0.3 }), null, null, [0.06, 0.06, 0.18]); K.part(g, K.cone(0.06, 0.1, 5), K.S(c), [0, 0, -0.2], [-PI / 2, 0, 0], [1, 1, 0.3]); return { g, ph: i * 2.1, jump: 0 }; });
  // the mallet on a pivot, swung by your wrist
  // the soft mallet hangs from a hook in front of the gong: wrist up pulls it back, wrist down swings it in
  const ML = 0.8, piv = K.group(null, [-0.3, 2.15, -0.72]), mal = K.group(piv), rOf = (x) => (x >= 0 ? -x * 0.85 : -x * 0.32);
  K.part(mal, K.cyl(0.025, 0.025, ML, 8), K.M(0x8a5a3a), [0, -ML / 2, 0]);
  K.part(mal, K.sph(0.13, 14, 10), K.S(0xf4e8d0, { roughness: 0.8 }), [0, -ML, 0]);
  const headAt = (x) => [-0.3, 2.15 - ML * Math.cos(rOf(x)), -0.72 - ML * Math.sin(rOf(x))];
  const rings = [1, -1].map((s) => target(K, headAt(s), 0.17));
  const waves = [];
  let ang = 0, lastReps = 0, ring = 0;
  cam.position.set(1.9, 1.7, 2.6); cam.lookAt(-0.1, 1.35, -0.8);
  return {
    fov: 52, fovTall: 72, gauge: "v",
    update(v, t, dt) {
      ang = damp(ang, clamp(v.x, -1.2, 1.15), 12, dt); piv.rotation.x = rOf(ang);
      const plus = v.targets[v.side] > 0;
      rings.forEach((r, i) => r((i === 0) === plus, t).lookAt(cam.position));
      if (v.reps > lastReps) { lastReps = v.reps; ring = 1; for (let i = 0; i < 3; i++) waves.push({ m: K.part(null, K.tor(0.8, 0.02, 4, 40), K.E(0xffe08a, { emissiveIntensity: 0.8, transparent: true, opacity: 0.8 }), [-0.3, 1.3, -0.9], null, null, true), t: -i * 0.2 }); koi.forEach((k, i) => { k.jump = 1 + i * 0.25; }); }
      ring = Math.max(0, ring - dt * 0.6); gong.rotation.x = Math.sin(t * 30) * 0.05 * ring; gong.rotation.z = Math.sin(t * 7) * 0.08 * ring;
      waves.forEach((w) => { w.t += dt; const k = Math.max(0, w.t); w.m.visible = w.t > 0 && k < 1.5; w.m.scale.setScalar(1 + k * 0.7); w.m.material.opacity = 0.7 * (1 - k / 1.5); });
      koi.forEach((k, i) => { const a = t * 0.5 + k.ph; k.jump = Math.max(0, k.jump - dt); const j = k.jump > 0 && k.jump < 1 ? Math.sin(k.jump * PI) * 0.6 : 0; k.g.position.set(1.8 + Math.cos(a) * 0.8, 0.0 + j, -0.6 + Math.sin(a) * 0.7); k.g.rotation.set(j > 0 ? -0.8 * Math.cos(k.jump * PI) : 0, -a, 0); });
    },
    focus(p) { p.set(-0.3, 1.3, -0.9); },
  };
});

// ================================================================ 64. Wrist Wiper (swing, side to side)
// Driving in the rain. Sweep your hand side to side and the wiper clears the windscreen; reach each end
// and hold, and the road ahead comes into view.
P3.add("wiper", (K, THREE, cam, S) => {
  K.sky(0x4a5a78, 0x8a9ab0, 0xb8c4d0, { sunDir: [0, 0.3, -1], sun: 0, horizon: 0.14 });
  K.scene.fog = new THREE.Fog(0x9aa8b8, 15, 90);
  K.lights({ sky: 0xd8e4f4, ground: 0x6a7a6a, hemi: 1.6, sun: 0xdde4f0, sunI: 1.0, dir: [0.3, 1, 0.5] });
  K.ground({ size: 300, seg: 80, h: (x, z) => (Math.abs(x) > 12 ? K.fbm(x * 0.04, z * 0.04) * 6 * Math.min(1, (Math.abs(x) - 12) / 20) : 0), color: (x, z) => (Math.abs(x) < 2.2 ? K.mix(0x4a4a52, 0x56565e, K.noise(x * 2, z * 0.5)) : K.mix(0x4a7a3a, 0x5a8a44, K.fbm(x * 0.15, z * 0.15))) });
  K.inst(K.box(0.12, 0.01, 1.4), K.B(0xe8e4d8), Array.from({ length: 20 }, (_, i) => ({ x: 0, y: 0.01, z: -i * 4 - 2 })), { shadow: false });
  trees(K, Array.from({ length: 30 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * K.R(4, 10), z: -K.R(4, 80), s: K.R(1, 1.6) })));
  const house = K.group(null, [5, 0, -22]); K.part(house, K.box(3, 2.4, 3), K.M(0xf0e4d0), [0, 1.2, 0]); K.part(house, K.box(0.6, 0.5, 0.05), K.E(0xffd890, { emissiveIntensity: 0.7 }), [-0.6, 1.4, 1.51], null, null, true);
  // the car's inside: dashboard, the windscreen and its wiper
  const car = K.group(null);
  K.part(car, K.box(3, 0.5, 0.8), K.M(0x2a2a32), [0, 0.85, -0.2]);
  K.part(car, K.box(3, 0.08, 1.2), K.M(0x1a1a22), [0, 1.95, -0.5]);
  for (const s of [-1, 1]) K.part(car, K.box(0.12, 1.2, 0.12), K.M(0x1a1a22), [s * 1.2, 1.5, -0.7], [0.35, 0, s * -0.15]);
  const wheel = K.group(car, [-0.5, 1.12, 0.15], [-1.0, 0, 0]); K.part(wheel, K.tor(0.22, 0.03, 8, 28), K.M(0x1a1a22)); K.part(wheel, K.box(0.42, 0.035, 0.035), K.M(0x1a1a22));
  const GZ = -0.75, GY = 1.5, glass = new THREE.Plane(new THREE.Vector3(0, 0, 1), -GZ);
  const PIV = new THREE.Vector3(0.0, 1.0, GZ + 0.02), WL = 0.95;
  const wip = K.group(null, PIV.toArray()); K.part(wip, K.box(0.03, WL, 0.02), K.M(0x111111), [0, WL / 2, 0]); K.part(wip, K.box(0.05, WL * 0.9, 0.03), K.M(0x222222), [0.02, WL * 0.55, 0.01]);
  // raindrops on the glass: they gather, and the wiper clears the ones it passes
  const ND = 220, drops = Array.from({ length: ND }, () => ({ a: K.R(-1.05, 1.05), r: K.R(0.25, WL * 1.05), on: Math.random() < 0.7 ? 1 : 0, s: K.R(0.6, 1.3) }));
  const dropM = K.inst(K.sph(0.018, 6, 4), K.S(0xe8f4ff, { transparent: true, opacity: 0.55, roughness: 0.05 }), drops.map(() => ({ s: 0.001 })), { shadow: false });
  const rain = K.inst(K.box(0.008, 0.25, 0.008), K.B(0xc8d8e8, { transparent: true, opacity: 0.35 }), Array.from({ length: 60 }, () => ({ s: 0.001 })), { shadow: false });
  const rp = Array.from({ length: 60 }, () => ({ x: K.R(-6, 6), y: K.R(0, 6), z: K.R(-12, -1) }));
  const rings = [1, -1].map((s) => target(K, [PIV.x + Math.sin(s * 0.95) * WL * 0.9, PIV.y + Math.cos(s * 0.95) * WL * 0.9, GZ + 0.04], 0.1));
  let ang = 0, prevA = 0;
  cam.position.set(-0.5, 1.55, 0.6); cam.lookAt(-0.2, 1.4, -6);
  return {
    fov: 60, fovTall: 80, gauge: "h",
    update(v, t, dt) {
      prevA = ang; ang = damp(ang, clamp(v.x, -1.2, 1.2) * 0.95, 10, dt); wip.rotation.z = -ang;
      const lo = Math.min(prevA, ang) - 0.04, hi = Math.max(prevA, ang) + 0.04;
      drops.forEach((d, i) => {
        if (d.on && d.a >= lo && d.a <= hi) d.on = 0;
        if (!d.on && !K.calm && Math.random() < dt * 0.25) d.on = 0.01;
        if (d.on > 0 && d.on < 1) d.on = Math.min(1, d.on + dt * 3);
        K.setInst(dropM, i, d.on > 0 ? { x: PIV.x + Math.sin(d.a) * d.r, y: PIV.y + Math.cos(d.a) * d.r, z: GZ + 0.01, s: d.on * d.s } : { s: 0.001 });
      });
      dropM.instanceMatrix.needsUpdate = true;
      if (!K.calm) { rp.forEach((r, i) => { r.y -= dt * 12; if (r.y < 0) r.y = 6; K.setInst(rain, i, { x: r.x, y: r.y, z: r.z }); }); rain.instanceMatrix.needsUpdate = true; }
      const plus = v.targets[v.side] > 0;
      rings.forEach((r, i) => r((i === 0) === plus, t));
    },
    focus(p) { p.set(PIV.x + Math.sin(ang) * WL, PIV.y + Math.cos(ang) * WL, GZ); },
  };
});

// ================================================================ 65. Steady Cup (keep it level)
// Carrying lemonade across the garden on a tray with a bubble level. Keep the tray level so the bubble
// stays in the green circle; the glasses stay still and you walk on toward the picnic.
P3.add("steady", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.4, 0.45, -1], sun: 1.1 });
  meadow(K, { color: (x, z) => (Math.abs(x) < 0.9 ? K.mix(0xd8c8a0, 0xc8b890, K.noise(x * 3, z * 3)) : K.mix(0x66a648, 0x92c85e, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 6); backdrop(K);
  trees(K, Array.from({ length: 30 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * K.R(3, 9), z: -K.R(0, 40), s: K.R(1, 1.6) })));
  flowers(K, 260, [-6, 6, -40, 2, (x) => Math.abs(x) > 1.1]);
  // the picnic at the end of the path
  const END = -24;
  K.part(null, K.box(2.2, 0.02, 1.6), K.M(0xe84a5a), [0, 0.01, END]);
  ["rabbit", "panda", "pig"].forEach((k, i) => { const a = animal(K, k, 0.8); a.g.position.set(-0.8 + i * 0.8, 0, END - 0.9); });
  // the tray in your hands
  const tray = K.group(null), wood = new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#c89a68"), roughness: 0.6 });
  K.part(tray, K.box(0.7, 0.025, 0.45), wood, [0, 0, 0]);
  for (const [x, z, w, d] of [[0, 0.225, 0.72, 0.02], [0, -0.225, 0.72, 0.02], [0.35, 0, 0.02, 0.45], [-0.35, 0, 0.02, 0.45]]) K.part(tray, K.box(w, 0.05, d), wood, [x, 0.025, z]);
  const glasses = [-0.18, 0.18].map((x) => { const g = K.group(tray, [x, 0.013, -0.05]); K.part(g, K.cyl(0.05, 0.045, 0.2, 16, 1, true), glassMat(THREE), [0, 0.1, 0]); const liq = K.part(g, K.cyl(0.047, 0.043, 0.15, 14), K.S(0xffe24a, { transparent: true, opacity: 0.85 }), [0, 0.078, 0], null, null, true); K.part(g, K.sph(0.025, 8, 6), K.S(0xffe040), [0.03, 0.17, 0], null, [1, 0.3, 1], true); return { g, liq }; });
  // the bubble level, built into the tray
  const LV = K.group(tray, [0, 0.016, 0.13]);
  K.part(LV, K.cyl(0.085, 0.085, 0.01, 24), K.M(0xf4f0e8), [0, 0, 0]);
  const zone = K.part(LV, K.cyl(1, 1, 0.012, 24), K.E(0x4ad884, { emissiveIntensity: 0.4, transparent: true, opacity: 0.7 }), [0, 0.001, 0], null, null, true);
  K.part(LV, K.cyl(0.088, 0.088, 0.02, 24, 1, true), glassMat(THREE, { opacity: 0.35 }), [0, 0.01, 0]);
  const bub = K.part(LV, K.sph(0.014, 10, 8), K.S(0xffffff, { roughness: 0.1 }), [0, 0.012, 0], null, [1, 0.5, 1], true);
  const tx = new THREE.Vector2();
  let walk = 0;
  return {
    fov: 55, fovTall: 74, gauge: "none",
    update(v, t, dt) {
      tx.x = damp(tx.x, clamp(v.x, -1, 1), 10, dt); tx.y = damp(tx.y, clamp(v.y, -1, 1), 10, dt);
      walk = damp(walk, clamp(v.prog, 0, 1), 2, dt);
      const z = lerp(2.5, END + 3.2, walk), bob = K.calm ? 0 : Math.sin(t * 5) * 0.01;
      cam.position.set(0, 1.55 + bob, z); cam.lookAt(0, 0.75, z - 3); cam.updateMatrixWorld();
      camPt(cam, 0.0, -0.3, -0.8, tray.position); tray.rotation.set(-tx.y * 0.3, 0, -tx.x * 0.3);
      zone.scale.set(Math.max(0.005, v.r * 0.16), 1, Math.max(0.005, v.r * 0.16)); zone.material = K.E(v.inside ? 0x4ad884 : 0xffb04a, { emissiveIntensity: 0.4, transparent: true, opacity: 0.7 });
      bub.position.set(clamp(tx.x * 0.16, -0.075, 0.075), 0.012, -clamp(tx.y * 0.16, -0.075, 0.075));
      glasses.forEach((g, i) => { const w = v.inside || K.calm ? 0 : Math.sin(t * 18 + i) * 0.05; g.g.rotation.set(w, 0, -w); g.liq.rotation.set(tx.y * 0.3, 0, tx.x * 0.3); });
    },
    focus(p) { p.copy(tray.position).add(new THREE.Vector3(0, 0.2, 0)); },
  };
});

// ================================================================ 66. Lean & Shift (left, right, forward)
// Feeding the ducks from the bench. Lean toward the duck with the ring (left, right or ahead) and hold
// the lean while it gobbles the crumbs; then sit up in the middle for the next one.
P3.add("lean", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.4, 0.45, -1], sun: 1.1 });
  meadow(K, { color: (x, z) => (Math.hypot(x, z + 2.4) < 2.6 ? 0x3a8aa8 : K.mix(0x66a648, 0x92c85e, K.fbm(x * 0.15, z * 0.15))) });
  K.part(null, K.circle(2.55, 40), K.S(0x3a9ac8, { roughness: 0.15 }), [0, 0.02, -2.4], [-PI / 2, 0, 0], null, true);
  K.inst(K.dod(0.15), K.M(0x9a9aa0), Array.from({ length: 36 }, (_, i) => ({ x: Math.cos((i / 36) * TAU) * 2.62, y: 0.05, z: -2.4 + Math.sin((i / 36) * TAU) * 2.62, s: K.R(0.7, 1.3), ry: i })));
  shadowBox(K, 6); backdrop(K);
  trees(K, K.ring(30, 6, 60, { free: true, ok: (x, z) => z < -5 || Math.abs(x) > 4 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  flowers(K, 160, [-6, 6, -1, 2]);
  // the bench under you, seen at the bottom of the view
  K.part(null, K.box(1.6, 0.06, 0.45), new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#8a5a3a"), roughness: 0.7 }), [0, 0.45, 0.6]);
  const SPOTS = { left: new THREE.Vector3(-1.5, 0.05, -0.6), right: new THREE.Vector3(1.5, 0.05, -0.6), forward: new THREE.Vector3(0, 0.05, -1.5) };
  const ducks = {}; Object.keys(SPOTS).forEach((k, i) => { const d = P3.lib.duck(K, null, i === 2 ? 0xffffff : 0xffd84a, i === 2 ? 1.25 : 1.0); d.g.position.copy(SPOTS[k]); d.g.lookAt(0, 0.05, 0.6); ducks[k] = d; });
  const rings = {}; Object.keys(SPOTS).forEach((k) => { const r = target(K, [0, 0, 0], 0.3); rings[k] = r; });
  const crumbs = K.inst(K.box(0.03, 0.02, 0.03), K.M(0xe8b868), Array.from({ length: 12 }, () => ({ s: 0.001 })), { shadow: false });
  const lean = new THREE.Vector2(), hp = new THREE.Vector3();
  let eat = 0, curDir = "forward";
  return {
    fov: 60, fovTall: 80, gauge: "none",
    update(v, t, dt) {
      curDir = v.dir;
      lean.x = damp(lean.x, clamp(v.x, -1.3, 1.3), 6, dt); lean.y = damp(lean.y, clamp(v.y, -1.3, 1.3), 6, dt);
      cam.position.set(lean.x * 0.5, 1.6 - Math.abs(lean.x) * 0.1 - lean.y * 0.2, 1.7 - lean.y * 0.5);
      cam.rotation.set(-0.42 - lean.y * 0.2, -lean.x * 0.15, -lean.x * 0.15, "YXZ");
      Object.keys(SPOTS).forEach((k) => { const on = v.phase === "go" && v.dir === k, r = rings[k](on, t); r.position.copy(SPOTS[k]).add(new THREE.Vector3(0, 0.03, 0)); r.rotation.x = -PI / 2; r.visible = on; const d = ducks[k]; d.g.position.y = 0.05 + Math.sin(t * 2 + d.g.position.x) * 0.02; d.head.rotation.x = on && v.prog > 0 ? Math.abs(Math.sin(t * 12)) * 0.6 : 0; });
      eat = v.phase === "go" ? v.prog : damp(eat, 0, 4, dt);
      const tg = SPOTS[v.dir] || SPOTS.forward;
      for (let i = 0; i < 12; i++) { const k = (i / 12 + t * 0.7) % 1; hp.copy(tg).add(new THREE.Vector3(Math.cos(i * 2.3) * 0.18, 0.4 * (1 - k) + 0.02, Math.sin(i * 2.3) * 0.18)); K.setInst(crumbs, i, eat > 0.05 ? { x: hp.x, y: hp.y, z: hp.z, ry: i } : { s: 0.001 }); }
      crumbs.instanceMatrix.needsUpdate = true;
    },
    focus(p) { p.copy(SPOTS[curDir] || SPOTS.forward).add(new THREE.Vector3(0, 0.4, 0)); },
  };
});

// ================================================================ 67. Sit to Stand (bursts: stand, then sit)
// The hedge garden. Stand up and you can see over the tall hedge to the hot-air balloon festival; each
// time you stand, another balloon has risen. Sit down slowly and the hedge hides it again.
P3.add("sit2stand", (K, THREE, cam, S) => {
  sunny(K, { top: 0x2a76d8, mid: 0xa8d4f0, sunDir: [0.4, 0.35, -1], sun: 1.2 });
  meadow(K, { z0: -30 }); shadowBox(K, 8); backdrop(K);
  trees(K, K.ring(30, 30, 80, { free: true }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.2, 1.8) })));
  // the hedge and the garden chair you sit on
  K.part(null, K.box(14, 1.55, 0.9), K.M(0x3a7a32), [0, 0.78, -2.2]);
  K.inst(K.ico(0.45, 1), K.M(0x4a8a3a), Array.from({ length: 30 }, (_, i) => ({ x: -7 + i * 0.48, y: 1.55, z: -2.2 + K.R(-0.2, 0.2), s: K.R(0.8, 1.1) })));
  flowers(K, 60, [-4, 4, -1.6, 0.5]);
  K.part(null, K.box(0.6, 0.06, 0.5), K.M(0xffffff), [0.5, 0.45, 0.6]);
  // the balloons beyond the hedge
  const COL = [[0xe84a5a, 0xffd23a], [0x4a8ad8, 0xffffff], [0x4ab86a, 0xffd23a], [0xb46ad8, 0xffffff], [0xff8a3a, 0x4a8ad8], [0x3ab8b8, 0xff7aa8]];
  const balloon = (c, x, z) => { const g = K.group(null, [x, 0, z]); const tex = K.tex(256, 128, (gg, w, h) => { for (let i = 0; i < 8; i++) { gg.fillStyle = "#" + (i % 2 ? c[1] : c[0]).toString(16).padStart(6, "0"); gg.fillRect((i * w) / 8, 0, w / 8 + 1, h); } }); K.part(g, K.sph(1.4, 20, 16), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), [0, 2.4, 0], null, [1, 1.2, 1]); K.part(g, K.box(0.6, 0.45, 0.6), K.M(0x8a5a3a), [0, 0.3, 0]); for (const s of [-1, 1]) for (const r of [-1, 1]) K.part(g, K.cyl(0.01, 0.01, 1.0, 3), K.M(0x5a4a3a), [s * 0.28, 0.95, r * 0.28]); return g; };
  const N = Math.max(3, Math.min(10, S.reps || 5)), balloons = [];
  for (let i = 0; i < N; i++) { const b = balloon(COL[i % COL.length], (i - (N - 1) / 2) * 4.2 + K.R(-0.6, 0.6), -14 - (i % 3) * 5); b.userData.up = 0; b.userData.on = false; balloons.push(b); }
  let h = 0, beat = null, up = 0, shown = 0;
  cam.position.set(0, 1.15, 1.2);
  return {
    fov: 55, fovTall: 74, gauge: "h",
    update(v, t, dt) {
      if (beat == null) beat = v.beat;
      if (v.beat !== beat) { beat = v.beat; if (v.phase === 1 && shown < N) { balloons[shown].userData.on = true; shown++; } }
      up = v.phase === 1 ? 1 : 0;
      h = damp(h, up, 2.2, dt);
      cam.position.set(0, lerp(1.15, 1.95, ease(h)), lerp(1.2, 0.95, h)); cam.lookAt(0, lerp(1.3, 2.4, h), -10);
      balloons.forEach((b, i) => { if (b.userData.on) b.userData.up = Math.min(1, b.userData.up + dt * 0.4); b.position.y = ease(b.userData.up) * (3 + (i % 3)) + Math.sin(t * 0.6 + i) * 0.2 - 1.5 * (1 - b.userData.up); b.visible = b.userData.on || i === 0; });
    },
    focus(p) { p.set(0, 2.5, -10); },
  };
});

// ================================================================ 68. Seated March (bursts: knee lifts)
// The animal parade. Every knee lift is a step; the band marches down the village street to the beat,
// bunting overhead, and the crowd cheers along.
P3.add("march", (K, THREE, cam, S) => {
  sunny(K, { sunDir: [0.4, 0.45, -1], sun: 1.1 });
  const LEN = 40;
  K.ground({ size: 300, seg: 80, h: () => 0, color: (x, z) => (Math.abs(x) < 2.2 ? K.mix(0xc8b8a0, 0xb8a890, (Math.floor(x * 2) + Math.floor(z * 2)) % 2 ? 0.2 : 0.8) : K.mix(0x66a648, 0x92c85e, K.fbm(x * 0.15, z * 0.15))) });
  shadowBox(K, 8); backdrop(K);
  const HC = [0xf4e8d8, 0xf8d8c8, 0xd8e8f4, 0xf4f0c8, 0xe8d8f0];
  for (let i = 0; i < 14; i++) for (const s of [-1, 1]) { const z = -i * 3.2, h = K.group(null, [s * 4.2, 0, z]); K.part(h, K.box(2.6, 2.6 + (i % 3) * 0.4, 2.6), K.M(HC[(i + (s > 0 ? 2 : 0)) % HC.length]), [0, 1.3 + (i % 3) * 0.2, 0]); K.part(h, K.cone(2.0, 1.1, 4), K.M(0x8a4a3a), [0, 3.15 + (i % 3) * 0.4, 0], [0, PI / 4, 0]); K.part(h, K.box(0.5, 0.5, 0.05), K.M(0x9ad0f0), [-s * 1.31, 1.6, 0.4], [0, PI / 2, 0]); }
  const bunt = []; for (let i = 0; i < 12; i++) for (let k = 0; k < 14; k++) { const z = -i * 3.4 - 1, x = -2.9 + (k / 13) * 5.8; bunt.push({ x, y: 3.1 - Math.sin((k / 13) * PI) * 0.4, z, rx: PI, sx: 0.14, sy: 0.25, sz: 0.02, c: [0xff5a6a, 0xffd23a, 0x5ab4f0, 0x6ad89a][k % 4] }); }
  K.inst(K.cone(1, 1, 3), K.M(0xffffff, { side: THREE.DoubleSide }), bunt, { shadow: false });
  // the band: a drum major and three players, marching away from you
  const band = [["penguin", 0, 0, 1.0], ["rabbit", -0.8, -1.0, 0.9], ["panda", 0.8, -1.0, 0.95], ["pig", 0, -2.0, 0.85]].map(([k, x, z, h]) => { const a = k === "penguin" ? bare(K, k, [1, 2], h) : animal(K, k, h); a.g.rotation.y = PI; a.x = x; a.z = z; return a; });
  const hat = K.group(band[0].g, [0, 1.15 / band[0].g.scale.x, 0]); K.part(hat, K.cyl(0.18, 0.18, 0.4, 12), K.M(0xe84a5a), [0, 0, 0]);
  const drum = K.group(null); K.part(drum, K.cyl(0.28, 0.28, 0.3, 18), K.S(0xffffff), [0, 0, 0], [0, 0, PI / 2]); K.part(drum, K.tor(0.28, 0.025, 6, 20), K.S(0xe84a5a), [0.15, 0, 0], [0, PI / 2, 0]); K.part(drum, K.tor(0.28, 0.025, 6, 20), K.S(0xe84a5a), [-0.15, 0, 0], [0, PI / 2, 0]);
  const crowd = []; for (let i = 0; i < 8; i++) { const k = ["sheep", "chicken", "fennec", "rabbit"][i % 4], a = animal(K, k, 0.7); a.g.position.set((i % 2 ? 1 : -1) * 2.6, 0, -2 - i * 4); a.g.rotation.y = (i % 2 ? -1 : 1) * PI / 2; crowd.push(a); }
  const steps = Math.max(10, S.reps || 10), STEP = Math.min(0.9, LEN / steps);
  let beat = null, bz = 0, goal = 0, hop = 0, flip = 0;
  return {
    fov: 55, fovTall: 75, gauge: "h",
    update(v, t, dt) {
      if (beat == null) beat = v.beat;
      if (v.beat !== beat) { beat = v.beat; goal -= STEP; hop = 1; flip = 1 - flip; }
      bz = damp(bz, goal, 4, dt); hop = Math.max(0, hop - dt * 3);
      band.forEach((a, i) => { a.g.position.set(a.x, Math.sin(hop * PI) * 0.12 * ((i + flip) % 2 ? 1 : 0.5), bz + a.z - 1.5); a.g.rotation.z = (flip ? 1 : -1) * 0.08 * hop; if (a.idle) a.idle(t); });
      drum.position.set(band[1].g.position.x + 0.25, 0.55, band[1].g.position.z + 0.3);
      crowd.forEach((a, i) => { a.g.position.y = Math.abs(bz + 2 + i * 4) < 5 && !K.calm ? Math.abs(Math.sin(t * 8 + i)) * 0.15 : 0; if (a.idle) a.idle(t); });
      cam.position.set(0.0, 1.7, bz + 1.9); cam.lookAt(0, 0.8, bz - 4);
    },
    focus(p) { p.set(0, 1.2, bz - 1.5); },
  };
});

// ================================================================ 69. Balance Hold (stand still)
// The block tower. Stand tall and still: the platform under the tower stays level and a new block lands
// on top every few seconds. Sway, and the tower wobbles.
P3.add("balance", (K, THREE, cam, S) => {
  K.scene.background = new THREE.Color(0xe8f0f8);
  K.lights({ sky: 0xffffff, ground: 0x9a9aa8, hemi: 1.3, sun: 0xfff4e8, sunI: 2.0, dir: [0.4, 1, 0.6] });
  shadowBox(K, 4);
  K.part(null, K.box(9, 0.1, 7), new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#c8a070"), roughness: 0.7 }), [0, -0.05, -0.5]);
  K.part(null, K.box(9, 4, 0.1), K.M(0xd8e8f4), [0, 2, -2.6]);
  K.part(null, K.plane(1.4, 1.1), K.B(0xbfe4ff), [-1.8, 2.1, -2.54], null, null, true);
  const pal = animal(K, "panda", 0.9); pal.g.position.set(1.6, 0, -0.8); pal.g.rotation.y = -0.6;
  // the wobbly platform on a ball, and the tower on it
  K.part(null, K.sph(0.18, 16, 12), K.S(0xe84a5a, { roughness: 0.3 }), [0, 0.18, 0]);
  const plat = K.group(null, [0, 0.38, 0]); K.part(plat, K.cyl(0.6, 0.6, 0.05, 28), K.S(0x4a8ad8, { roughness: 0.4 }));
  const tower = K.group(plat, [0, 0.025, 0]);
  const COL = [0xe84a5a, 0xffd23a, 0x4ab86a, 0x4a8ad8, 0xb46ad8, 0xff8a3a], BH = 0.16, NB = 14, blocks = [];
  for (let i = 0; i < NB; i++) { const b = K.part(tower, K.box(0.34 - (i % 2) * 0.04, BH, 0.34 - (i % 2) * 0.04), K.S(COL[i % COL.length], { roughness: 0.5 }), [0, BH / 2 + i * BH, 0], [0, (i % 2) * 0.3, 0]); b.visible = false; blocks.push({ b, drop: 0 }); }
  const tx = new THREE.Vector2();
  let shown = 0;
  cam.position.set(0, 1.6, 3.4); cam.lookAt(0, 1.0, 0);
  return {
    fov: 52, fovTall: 72, gauge: "none",
    update(v, t, dt) {
      tx.x = damp(tx.x, clamp(v.x, -1.2, 1.2), 6, dt); tx.y = damp(tx.y, clamp(v.y, -1.2, 1.2), 6, dt);
      plat.rotation.set(-tx.y * 0.25, 0, -tx.x * 0.25);
      const want = Math.min(NB, 1 + Math.floor(clamp(v.prog, 0, 1) * (NB - 1)));
      while (shown < want) { blocks[shown].b.visible = true; blocks[shown].drop = 1; shown++; }
      blocks.forEach((q, i) => { if (q.drop > 0) { q.drop = Math.max(0, q.drop - dt * 2.5); q.b.position.y = BH / 2 + i * BH + ease(q.drop) * 1.2; } const w = v.inside || K.calm ? 0 : Math.sin(t * 9 + i * 0.5) * 0.012 * i; q.b.position.x = w + tx.x * 0.004 * i * i; q.b.position.z = -tx.y * 0.004 * i * i; });
      if (pal.idle) pal.idle(t);
    },
    focus(p) { p.set(0, 0.5 + shown * BH, 0); },
  };
});
// ================================================================ 70. Memory Moves (tilt in a remembered pattern)
// The music garden. Four giant bell flowers stand round a frog on its lily pad: up, right, down and left.
// Watch them ring in order, then tilt toward each one in the same order; the frog hops that way and the
// flower rings again.
P3.add("simon", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.4, 0.5, -1], sun: 1.1 });
  meadow(K, { color: (x, z) => (Math.hypot(x, z) < 2.6 ? 0x3a8aa8 : K.mix(0x66a648, 0x92c85e, K.fbm(x * 0.15, z * 0.15))) });
  K.part(null, K.circle(2.55, 40), K.S(0x3a9ac8, { roughness: 0.15 }), [0, 0.02, 0], [-PI / 2, 0, 0], null, true);
  K.inst(K.dod(0.16), K.M(0x9a9aa0), Array.from({ length: 36 }, (_, i) => ({ x: Math.cos((i / 36) * TAU) * 2.62, y: 0.05, z: Math.sin((i / 36) * TAU) * 2.62, s: K.R(0.7, 1.3), ry: i })));
  shadowBox(K, 6); backdrop(K);
  trees(K, K.ring(30, 6, 60, { free: true, ok: (x, z) => z < -4 || Math.abs(x) > 4.5 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  // the four flowers: 0 up (far), 1 right, 2 down (near), 3 left
  const POS = [[0, -1.6], [1.7, 0], [0, 1.25], [-1.7, 0]], COL = [0xe84a5a, 0x3a8ae8, 0xffc828, 0x3ab86a];
  const bells = POS.map(([x, z], i) => {
    const g = K.group(null, [x, 0, z]);
    K.part(g, K.circle(0.5, 20), K.M(0x4a9a3a, { side: THREE.DoubleSide }), [0, 0.03, 0], [-PI / 2, 0, 0], null, true);
    K.part(g, K.cyl(0.03, 0.04, 0.8, 6), K.M(0x4a9a3a), [0, 0.4, 0]);
    const head = K.group(g, [0, 0.82, 0]);
    const mat = K.S(COL[i], { roughness: 0.35, side: THREE.DoubleSide });
    K.part(head, K.lathe([[0.02, 0], [0.16, 0.05], [0.26, 0.22], [0.32, 0.38], [0.36, 0.42]], 18), mat, [0, -0.1, 0], [PI, 0, 0]);
    K.part(head, K.sph(0.06, 10, 8), K.S(0xfff4c0), [0, -0.5, 0]);
    const glow = K.sprite(COL[i], 1.6, [x, 0.75, z], 0);
    const arrow = K.group(null, [x * 0.55, 0.06, z * 0.55], [0, [0, -PI / 2, PI, PI / 2][i], 0]);
    K.part(arrow, K.cone(0.12, 0.22, 3), K.M(0xffffff, { transparent: true, opacity: 0.8 }), [0, 0, -0.1], [-PI / 2, 0, 0], [1, 1, 0.3], true);
    return { g, head, mat, glow, ring: 0 };
  });
  // the frog in the middle, leaning the way you tilt
  const frog = bare(K, "frog", 2, 0.35); frog.g.position.set(0, 0.06, 0);
  K.part(null, new THREE.CircleGeometry(0.45, 22, 0.25, PI * 2 - 0.5).rotateX(-PI / 2), K.M(0x4a9a3a, { side: THREE.DoubleSide }), [0, 0.04, 0]);
  const notes = [], noteTex = textTex(K, "♪", { bg: "rgba(0,0,0,0)", color: "#ffffff", w: 128, h: 128 });
  let lastLit = -1, lastFlash = -1, hopT = 1, hopTo = new THREE.Vector3();
  cam.position.set(0, 3.4, 4.0); cam.lookAt(0, 0.3, -0.2);
  return {
    fov: 50, fovTall: 70, gauge: "none",
    update(v, t, dt) {
      const ring = (i, ok) => { const b = bells[i]; b.ring = 1; b.ok = ok; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex, color: COL[i], transparent: true, depthWrite: false })); sp.scale.setScalar(0.4); K.scene.add(sp); notes.push({ sp, t: 0, p: b.g.position.clone().add(new THREE.Vector3(0, 1.0, 0)) }); };
      if (v.lit !== lastLit) { if (v.lit >= 0) ring(v.lit, true); lastLit = v.lit; }
      if (v.flashDir !== lastFlash) { if (v.flashDir >= 0) { ring(v.flashDir, v.flashOk); hopT = 0; hopTo.set(POS[v.flashDir][0] * 0.25, 0.06, POS[v.flashDir][1] * 0.25); } lastFlash = v.flashDir; }
      bells.forEach((b, i) => {
        b.ring = Math.max(0, b.ring - dt * 1.6);
        const on = b.ring > 0, bad = on && b.ok === false;
        b.head.rotation.z = on && !K.calm ? Math.sin(t * 22) * 0.25 * b.ring : 0;
        b.glow.material.color.setHex(bad ? 0xff7a5a : COL[i]); b.glow.material.opacity = on ? 0.8 * b.ring : 0;
        b.head.scale.setScalar(1 + (on ? 0.15 * b.ring : 0));
      });
      hopT = Math.min(1, hopT + dt * 2.5);
      const lean = new THREE.Vector3(clamp(v.x, -1.2, 1.2) * 0.25, 0.06, -clamp(v.y, -1.2, 1.2) * 0.25);
      frog.g.position.lerpVectors(lean, hopTo, Math.sin(hopT * PI) * 0.6); frog.g.position.y = 0.06 + Math.sin(hopT * PI) * 0.35;
      if (Math.hypot(v.x, v.y) > 0.25) frog.g.rotation.y = damp(frog.g.rotation.y, Math.atan2(v.x, v.y), 8, dt);
      if (frog.idle) frog.idle(t);
      notes.forEach((n) => { if (n.t > 1.6) return; n.t += dt; n.sp.position.copy(n.p).add(new THREE.Vector3(Math.sin(n.t * 4) * 0.15, n.t * 0.8, 0)); n.sp.material.opacity = 1 - n.t / 1.6; n.sp.visible = n.t < 1.6; });
    },
    focus(p) { p.set(0, 0.6, 0); },
  };
});

// ================================================================ 71. Sort It (turn left or right by word group)
// The market stall. A crate with a word on it waits on the counter; turn your hand toward the basket
// whose sign names its group, and hold. Right answers slide into the basket; wrong ones bounce back.
P3.add("sort", (K, THREE, cam) => {
  sunny(K, { sunDir: [0.4, 0.45, -1], sun: 1.1, dir: [0.4, 0.9, 0.6] });
  meadow(K); shadowBox(K, 5); backdrop(K);
  trees(K, K.ring(30, 7, 60, { free: true, ok: (x, z) => z < -3 }).map((p) => ({ x: p.x, z: p.z, y: p.y, s: K.R(1.0, 1.6) })));
  flowers(K, 120, [-6, 6, -6, -2]);
  const wood = new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#c89a68"), roughness: 0.7 });
  K.part(null, K.box(3.6, 0.8, 0.9), wood, [0, 0.4, -0.2]);
  K.part(null, K.box(3.7, 0.05, 1.0), K.M(0xf4ecd8), [0, 0.82, -0.2]);
  for (const x of [-1.75, 1.75]) K.part(null, K.box(0.07, 1.4, 0.07), wood, [x, 1.55, -0.55]);
  const awn = K.tex(256, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#3ab86a"; g.fillRect((i * w) / 8, 0, w / 8 + 1, h); } });
  K.part(null, K.box(4.0, 0.06, 1.2), new THREE.MeshStandardMaterial({ map: awn, roughness: 0.7 }), [0, 2.25, -0.35], [0.12, 0, 0]);
  // the two baskets with their signs
  const SIDE = [-1.25, 1.25], baskets = SIDE.map((x) => {
    const g = K.group(null, [x, 0.84, -0.2]);
    K.part(g, K.cyl(0.42, 0.34, 0.36, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xc89a5a, roughness: 0.8, side: THREE.DoubleSide }), [0, 0.18, 0]);
    K.part(g, K.cyl(0.34, 0.34, 0.02, 20), K.M(0xa87a4a), [0, 0.01, 0]);
    K.part(g, K.tor(0.42, 0.03, 6, 24), K.M(0xa87a4a), [0, 0.36, 0], [PI / 2, 0, 0]);
    const sign = K.part(null, K.plane(1.1, 0.34), new THREE.MeshBasicMaterial({ map: textTex(K, " ") }), [x, 1.62, -0.5], null, null, true);
    const bar = K.part(null, K.box(1, 0.05, 0.01), K.B(0x4ad884), [x, 1.42, -0.49], null, null, true);
    return { g, sign, bar, key: null, count: 0 };
  });
  // the crate with the word
  const crate = K.group(null), cw = new THREE.MeshStandardMaterial({ map: RC.Scene3D.woodTexture("#d8b07a"), roughness: 0.7 });
  K.part(crate, K.box(0.62, 0.36, 0.42), cw, [0, 0.18, 0]);
  const label = K.part(crate, K.plane(0.56, 0.24), new THREE.MeshBasicMaterial({ map: textTex(K, " ") }), [0, 0.19, 0.215], null, null, true);
  const vendor = animal(K, "pig", 0.95); vendor.g.position.set(0.0, 0, -1.25);
  let wordKey = null, cx = 0, fbT = 0, fly = null, lastPhase = null;
  cam.position.set(0, 1.85, 2.7); cam.lookAt(0, 1.1, -0.3);
  return {
    fov: 52, fovTall: 72, gauge: "none",
    update(v, t, dt) {
      baskets.forEach((b, i) => { const k = v.cats[i]; if (b.key !== k) { b.key = k; b.sign.material.map.dispose(); b.sign.material.map = fitText(K, k, "#fff8e0", "#3a6a2a", 512, 160); } const on = v.side === (i ? 1 : -1); b.bar.scale.x = Math.max(0.001, on ? v.prog : 0); });
      const key = v.word + "|" + v.n;
      if (key !== wordKey && v.phase !== "feedback") { wordKey = key; label.material.map.dispose(); label.material.map = fitText(K, v.word, "#fffaf0", "#2a2a2a", 512, 220); }
      if (v.phase !== lastPhase) { if (v.phase === "feedback" && v.fb) fly = { side: v.fb.side, right: v.fb.right, t: 0 }; lastPhase = v.phase; }
      if (v.phase === "card") { cx = damp(cx, clamp(v.x, -1, 1) * 0.35, 10, dt); crate.position.set(cx, 0.845, -0.15); crate.rotation.z = -cx * 0.15; crate.visible = true; crate.scale.setScalar(1); }
      else if (v.phase === "center") { cx = damp(cx, 0, 8, dt); crate.position.set(cx, 0.845 + 0.4 * Math.max(0, 1 - (crate.userData.pop || 1)), -0.15); crate.rotation.z = 0; crate.visible = true; }
      if (fly) {
        fly.t += dt; const k = clamp(fly.t / 0.6, 0, 1), bx = SIDE[fly.side > 0 ? 1 : 0];
        if (fly.right) { crate.position.set(lerp(cx, bx, ease(k)), 0.845 + Math.sin(k * PI) * 0.4 + (k > 0.8 ? -(k - 0.8) * 0.8 : 0), -0.18); crate.scale.setScalar(1 - k * 0.45); crate.rotation.z = -fly.side * k * 0.6; if (k >= 1 && !fly.done) { fly.done = true; baskets[fly.side > 0 ? 1 : 0].count++; } }
        else { const b = Math.sin(k * PI * 2) * (1 - k); crate.position.set(cx + fly.side * 0.4 * b, 0.845 + Math.abs(b) * 0.1, -0.15); crate.rotation.z = -fly.side * b * 0.3; }
        if (v.phase !== "feedback" && fly.t > 0.6) { fly = null; crate.scale.setScalar(1); }
      }
      if (vendor.idle) vendor.idle(t);
    },
    focus(p) { p.copy(crate.position).add(new THREE.Vector3(0, 0.3, 0)); },
  };
});
})();
