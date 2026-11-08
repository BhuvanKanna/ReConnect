// First-person 3D scene for Lantern Lift: you sit on a porch at dusk with your arm resting on the rail,
// holding a lantern on a short pole. Raising the arm (shoulder flexion) swings the whole arm up from the
// shoulder; the lantern hangs from the pole tip and sways with the movement. A gold ring marks the target,
// and a string of lanterns in the garden lights up one per repetition.
//
// three.js (vendor/three, MIT) is an ES module, so it is loaded on demand with import() the first time
// Lantern Lift opens. Until it has loaded, or where WebGL isn't available, the exercise draws its flat 2D view.
(() => {
"use strict";
const RC = window.RC;
const L3 = { THREE: null, failed: false, loading: null, renderer: null };

L3.ensure = function () {
  if (L3.THREE || L3.failed || L3.loading) return;
  L3.loading = import(new URL("vendor/three/three.module.min.js", document.baseURI).href)
    .then((m) => { L3.THREE = m; })
    .catch(() => { L3.failed = true; });
};
L3.ready = () => !!L3.THREE && !L3.failed;

// One WebGL renderer is shared by every session, so playing again doesn't leak GPU contexts.
function renderer() {
  if (L3.renderer || L3.failed) return L3.renderer;
  const THREE = L3.THREE;
  try {
    const r = new THREE.WebGLRenderer({ canvas: document.createElement("canvas"), antialias: true, powerPreference: "high-performance" });
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;
    L3.renderer = r;
  } catch (e) { L3.failed = true; }
  return L3.renderer;
}

function glowTexture(THREE) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.25, "rgba(255,255,255,0.55)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function woodTexture(THREE) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 64;
  const g = c.getContext("2d"); g.fillStyle = "#8a5a36"; g.fillRect(0, 0, 512, 64);
  let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) {
    g.strokeStyle = `rgba(${rnd() < 0.5 ? "60,34,18" : "170,118,74"},${0.15 + rnd() * 0.25})`; g.lineWidth = 1 + rnd() * 2;
    const y = rnd() * 64; g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x / 60 + i) * 2.5);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// Build a lantern group whose origin is the top of its bail (the point it hangs from).
function makeLantern(THREE, glowTex, scale) {
  const grp = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x2f2a26, metalness: 0.7, roughness: 0.4 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc8963e, metalness: 0.85, roughness: 0.3 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffa040, emissiveIntensity: 0.6, transparent: true, opacity: 0.55, roughness: 0.1 });
  const bail = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.004, 8, 24, Math.PI), brass); bail.position.y = -0.035; grp.add(bail);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.05, 24), metal); cap.position.y = -0.06; grp.add(cap);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.012, 24), brass); rim.position.y = -0.088; grp.add(rim);
  const glassM = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 24), glass); glassM.position.y = -0.15; grp.add(glassM);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.125, 6), metal);
    rod.position.set(Math.cos(a) * 0.055, -0.15, Math.sin(a) * 0.055); grp.add(rod);
  }
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.072, 0.025, 24), brass); base.position.y = -0.222; grp.add(base);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd27a });
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), flameMat); flame.scale.set(1, 2, 1); flame.position.y = -0.16; grp.add(flame);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb050, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.setScalar(0.42); halo.position.y = -0.155; grp.add(halo);
  grp.scale.setScalar(scale || 1);
  return { grp, glass, flame, halo };
}

L3.create = function (opts) {
  if (!L3.ready()) return null;
  const THREE = L3.THREE, R = renderer();
  if (!R) return null;
  const side = opts.side === "left" ? -1 : 1, count = Math.max(1, Math.min(20, opts.count || 10)), calm = !!opts.calm;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x232a4a, 0.035);
  const glowTex = glowTexture(THREE), wood = woodTexture(THREE);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---- sky, stars, moon
  const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x0a1230) }, mid: { value: new THREE.Color(0x3a3f7a) }, low: { value: new THREE.Color(0xf09060) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP; void main(){ float h = vP.y; vec3 c = mix(low, mid, smoothstep(-0.02, 0.16, h)); c = mix(c, top, smoothstep(0.16, 0.75, h)); gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
  }));
  scene.add(sky);
  {
    const n = 500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * Math.PI * 2, v = 0.12 + Math.random() * 0.88, r = 75;
      pos[i * 3] = Math.cos(u) * Math.sqrt(1 - v * v) * r; pos[i * 3 + 1] = v * r; pos[i * 3 + 2] = Math.sin(u) * Math.sqrt(1 - v * v) * r;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })));
  }
  const moonPos = V(-24 * side, 15, -45);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff4d6, fog: false }));
  moon.position.copy(moonPos); scene.add(moon);
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xbfc8ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  moonGlow.scale.setScalar(16); moonGlow.position.copy(moonPos); scene.add(moonGlow);

  // ---- light
  scene.add(new THREE.HemisphereLight(0x9aa8e0, 0x3a3020, 1.7));
  const moonLight = new THREE.DirectionalLight(0xc8d4ff, 0.9); moonLight.position.copy(moonPos); scene.add(moonLight);
  const fill = new THREE.DirectionalLight(0xffc89a, 0.5); fill.position.set(2 * side, 3, 4); scene.add(fill);

  // ---- porch: floor, rail with balusters, posts
  const woodMat = new THREE.MeshStandardMaterial({ map: wood, color: 0xffffff, roughness: 0.75 });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.9 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 2.2), darkWood); floor.position.set(0, -0.05, 0.4); scene.add(floor);
  const RAIL_Z = -0.5, RAIL_Y = 0.8;
  const rail = new THREE.Mesh(new THREE.BoxGeometry(5, 0.07, 0.16), woodMat); rail.position.set(0, RAIL_Y - 0.035, RAIL_Z); scene.add(rail);
  const lowRail = new THREE.Mesh(new THREE.BoxGeometry(5, 0.05, 0.08), woodMat); lowRail.position.set(0, 0.12, RAIL_Z); scene.add(lowRail);
  const balGeo = new THREE.BoxGeometry(0.045, RAIL_Y - 0.16, 0.045);
  for (let x = -2.4; x <= 2.4; x += 0.16) { const b = new THREE.Mesh(balGeo, woodMat); b.position.set(x, (RAIL_Y + 0.08) / 2 - 0.02, RAIL_Z); scene.add(b); }
  for (const x of [-1.5, 1.5]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.12), woodMat); p.position.set(x, 1.3, RAIL_Z); scene.add(p); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5, 0.12, 0.2), darkWood); roof.position.set(0, 2.6, RAIL_Z); scene.add(roof);

  // ---- garden: ground, path, trees, bushes, fireflies
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshStandardMaterial({ color: 0x2f5a3a, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.7; scene.add(ground);
  const leaf = [0x2a5238, 0x31603f, 0x264a33].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true }));
  const bark = new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 1 });
  let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) {
    const x = (rnd() - 0.5) * 40, z = -8 - rnd() * 26; if (Math.abs(x) < 2.2 && z > -14) continue;
    const h = 3 + rnd() * 4, r = 1 + rnd() * 1.4, tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6), bark); trunk.position.y = 0.6; tree.add(trunk);
    for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(r * (1 - k * 0.22), h * 0.5, 8), leaf[k % 3]); c.position.y = 1.2 + k * h * 0.22 + h * 0.2; tree.add(c); }
    tree.position.set(x, -0.7, z); tree.rotation.y = rnd() * 6; scene.add(tree);
  }
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + rnd() * 0.5, 1), leaf[i % 3]);
    b.position.set((rnd() - 0.5) * 12, -0.6, -3 - rnd() * 4); b.scale.y = 0.7; scene.add(b);
  }
  const flies = [], flyGeo = new THREE.BufferGeometry(), NF = calm ? 0 : 40, flyPos = new Float32Array(Math.max(1, NF) * 3);
  for (let i = 0; i < NF; i++) flies.push({ x: (rnd() - 0.5) * 10, y: -0.3 + rnd() * 2.2, z: -2 - rnd() * 7, p: rnd() * 6, s: 0.3 + rnd() * 0.5 });
  flyGeo.setAttribute("position", new THREE.BufferAttribute(flyPos, 3));
  const flyPts = new THREE.Points(flyGeo, new THREE.PointsMaterial({ color: 0xd8ff8a, size: 0.07, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  if (NF) scene.add(flyPts);

  // ---- the string of lanterns: one lights up per repetition
  const posts = [-2.6, 2.6].map((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 3.4, 8), bark); p.position.set(x, 1.0, -5.2); scene.add(p); return p; });
  const curve = new THREE.CatmullRomCurve3([V(-2.6, 2.6, -5.2), V(-1.3, 2.05, -5.1), V(0, 1.85, -5.05), V(1.3, 2.05, -5.1), V(2.6, 2.6, -5.2)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.008, 5, false), new THREE.MeshBasicMaterial({ color: 0x15121a })));
  const string = [];
  for (let i = 0; i < count; i++) {
    const u = (i + 1) / (count + 1), p = curve.getPoint(u), L = makeLantern(THREE, glowTex, 1.7);
    L.grp.position.copy(p); L.glass.emissiveIntensity = 0; L.glass.color.set(0x6a5a48); L.glass.opacity = 0.8;
    L.flame.visible = false; L.halo.visible = false; scene.add(L.grp);
    string.push({ L, lit: false, pop: 0 });
  }
  const garden = new THREE.PointLight(0xffb060, 0, 9, 2); garden.position.set(0, 1.6, -4.8); scene.add(garden);

  // ---- the arm, from the shoulder: sleeve, wrist, fist around a wooden pole
  const rig = new THREE.Group(); rig.rotation.order = "YXZ"; rig.position.set(0.3 * side, 1.0, 0.02); rig.rotation.y = 0.02 * side; scene.add(rig);
  const shirt = new THREE.MeshStandardMaterial({ color: 0x5d7fb5, roughness: 0.9 });
  const cuffM = new THREE.MeshStandardMaterial({ color: 0x4c6a9a, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd8a07c, roughness: 0.6 });
  const along = (mesh, z) => { mesh.rotation.x = -Math.PI / 2; mesh.position.z = z; return mesh; };
  rig.add(along(new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.068, 0.52, 24), shirt), -0.24));
  rig.add(along(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 24), cuffM), -0.5));
  rig.add(along(new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.036, 0.07, 18), skin), -0.545));
  const hand = new THREE.Group(); hand.position.z = -0.6; hand.rotation.x = 0.17; rig.add(hand);
  const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.04, 6, 14), skin); palm.rotation.x = -Math.PI / 2; palm.scale.set(1.05, 1, 1.15); palm.position.set(0.012 * side, -0.006, 0.012); hand.add(palm);
  for (let i = 0; i < 4; i++) { // fingers curl round the pole from the outside, under, and back up
    const f = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0115 - i * 0.0007, 10, 18, Math.PI * 1.25), skin);
    f.position.set(0, 0, -0.028 + i * 0.021); f.rotation.z = side > 0 ? -Math.PI * 0.35 : Math.PI * 1.1; hand.add(f);
  }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0125, 0.045, 6, 10), skin); thumb.rotation.x = -Math.PI / 2; thumb.position.set(-0.012 * side, 0.026, -0.045); hand.add(thumb);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0135, 0.52, 12), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.6 }));
  hand.add(along(pole, -0.2));
  const brassM = new THREE.MeshStandardMaterial({ color: 0xc8963e, metalness: 0.85, roughness: 0.3 });
  hand.add(along(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 12), brassM), -0.455));
  const hookTip = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.003, 6, 16), brassM); hookTip.position.set(0, -0.012, -0.465); hookTip.rotation.y = Math.PI / 2; hand.add(hookTip);
  const TIP = V(0, -0.026, -0.465);

  // ---- the lantern you carry, and its light
  const mine = makeLantern(THREE, glowTex, 1);
  scene.add(mine.grp);
  const flameLight = new THREE.PointLight(0xffa34d, 1.4, 5, 2); scene.add(flameLight);

  // ---- the target: a gold ring with a soft glow
  const goal = new THREE.Group(); scene.add(goal);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffc34d, transparent: true, opacity: 0.95 });
  goal.add(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.011, 10, 64), ringMat));
  const goalGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc34d, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  goalGlow.scale.setScalar(0.62); goal.add(goalGlow);

  // ---- camera: seated eye height, looking a little down at the rail
  const cam = new THREE.PerspectiveCamera(66, 16 / 9, 0.03, 200);
  cam.position.set(0.02 * side, 1.3, 0.12); cam.rotation.set(-0.16, 0, 0, "YXZ");

  // Arm angle from the lift amount: 0 = resting on the rail, 1 = at the level's range target.
  const REST = -0.27, SPAN = 0.72;
  const phiOf = (f) => REST + Math.max(0, Math.min(1.45, f)) * SPAN;
  const tipAt = (phi, out) => { rig.rotation.x = phi; rig.updateMatrixWorld(true); return hand.localToWorld(out.copy(TIP)); };
  const HANG = 0.155; // bail top to the middle of the glass

  const tip = V(0, 0, 0), lastTip = V(0, 0, 0), vel = V(0, 0, 0), lastVel = V(0, 0, 0), acc = V(0, 0, 0);
  let swingX = 0, swingZ = 0, wX = 0, wZ = 0, primed = false, goalF = -1;
  const lanternCenter = V(0, 0, 0), goalPos = V(0, 0, 0);

  const world = {
    lantern: lanternCenter, goal: goalPos,
    // st: { f, goalF, holdP, lit, flare, showGoal }
    frame(W, H, pr, st, t, dt) {
      const w = Math.round(W * pr), h = Math.round(H * pr), cv = R.domElement;
      if (cv.width !== w || cv.height !== h) R.setSize(w, h, false);
      cam.aspect = W / H; cam.fov = W / H < 1.2 ? 76 : 66; cam.updateProjectionMatrix();
      // target ring sits where the lantern hangs at the goal angle
      if (st.goalF !== goalF) { goalF = st.goalF; tipAt(phiOf(goalF), goalPos); goalPos.y -= HANG; }
      tipAt(phiOf(st.f), tip);
      // lantern pendulum, pushed by the pole tip's acceleration
      if (!primed) { lastTip.copy(tip); primed = true; }
      if (dt > 0) {
        vel.copy(tip).sub(lastTip).divideScalar(dt); acc.copy(vel).sub(lastVel).divideScalar(dt).multiplyScalar(0.5);
        lastVel.lerp(vel, 0.5); lastTip.copy(tip);
        const k = 9.8 / 0.17, c = calm ? 7 : 3.2, steps = 4, hdt = dt / steps;
        for (let i = 0; i < steps; i++) {
          wX += (-k * Math.sin(swingX) - c * wX + Math.max(-30, Math.min(30, acc.z)) / 0.17) * hdt; swingX += wX * hdt;
          wZ += (-k * Math.sin(swingZ) - c * wZ - Math.max(-30, Math.min(30, acc.x)) / 0.17) * hdt; swingZ += wZ * hdt;
        }
        swingX = Math.max(-0.7, Math.min(0.7, swingX)); swingZ = Math.max(-0.7, Math.min(0.7, swingZ));
      }
      mine.grp.position.copy(tip); mine.grp.rotation.set(swingX, 0, swingZ);
      mine.grp.updateMatrixWorld(true); lanternCenter.set(0, -HANG, 0); mine.grp.localToWorld(lanternCenter);
      const flick = calm ? 1 : 1 + Math.sin(t * 13) * 0.05 + Math.sin(t * 7.3) * 0.05;
      const flare = 1 + (st.flare || 0) * 1.5;
      flameLight.position.copy(lanternCenter); flameLight.intensity = 1.3 * flick * flare;
      mine.halo.scale.setScalar(0.42 * flick * (1 + (st.flare || 0) * 0.8)); mine.flame.scale.set(1, 2 * flick, 1);
      mine.glass.emissiveIntensity = 0.6 * flare;

      goal.visible = !!st.showGoal; goal.position.copy(goalPos); goal.quaternion.copy(cam.quaternion);
      const pulse = calm ? 1 : 1 + Math.sin(t * 3) * 0.04, holding = st.holdP > 0;
      goal.scale.setScalar(pulse * (holding ? 1.06 : 1));
      ringMat.color.set(holding ? 0x8ff0b0 : 0xffc34d); goalGlow.material.color.set(holding ? 0x8ff0b0 : 0xffc34d);
      goalGlow.material.opacity = 0.3 + (holding ? 0.25 : 0);

      // garden lanterns
      let litN = 0;
      string.forEach((s, i) => {
        const on = i < st.lit;
        if (on && !s.lit) { s.lit = true; s.pop = 1; s.L.glass.color.set(0xffe2a8); s.L.glass.opacity = 0.55; s.L.flame.visible = s.L.halo.visible = true; }
        if (!on && s.lit) { s.lit = false; s.L.glass.color.set(0x6a5a48); s.L.glass.emissiveIntensity = 0; s.L.flame.visible = s.L.halo.visible = false; }
        if (s.lit) { litN++; s.pop = Math.max(0, s.pop - dt * 1.5); s.L.glass.emissiveIntensity = 0.7 + s.pop * 2; s.L.halo.scale.setScalar(0.42 * (1 + s.pop)); }
        s.L.grp.rotation.z = calm ? 0 : Math.sin(t * 0.8 + i) * 0.05;
      });
      garden.intensity = litN / count * 6;

      for (let i = 0; i < NF; i++) {
        const q = flies[i];
        flyPos[i * 3] = q.x + Math.sin(t * q.s + q.p) * 0.6; flyPos[i * 3 + 1] = q.y + Math.sin(t * q.s * 1.7 + q.p) * 0.25; flyPos[i * 3 + 2] = q.z + Math.cos(t * q.s + q.p) * 0.6;
      }
      if (NF) { flyGeo.attributes.position.needsUpdate = true; flyPts.material.opacity = 0.5 + 0.5 * Math.sin(t * 2); }

      R.render(scene, cam);
      return cv;
    },
    // CSS-pixel position of a world point on the stage
    // pixel radius of the gold ring on screen
    ringPx(W, H) { const a = this.toScreen(goalPos, W, H), e = new THREE.Vector3(0.17, 0, 0).applyQuaternion(cam.quaternion).add(goalPos), b = this.toScreen(e, W, H); return Math.hypot(b.x - a.x, b.y - a.y); },
    toScreen(p, W, H) { const v = p.clone().project(cam); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, front: v.z < 1 }; },
    dispose() {
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        ms.forEach((m) => { if (m.map && m.map !== glowTex && m.map !== wood) m.map.dispose(); m.dispose(); });
      });
      glowTex.dispose(); wood.dispose();
    },
  };
  return world;
};

RC.Lift3D = L3;
})();
