// 3D scene for Steering Wheel: driving down a country road, seen from the driver's seat of a little red
// convertible. The patient's hands hold the steering wheel, which turns exactly as far as the phone does.
// The road is three lanes wide; at each gate a green arch spans one lane and striped barriers block the
// others. A green marker beside the wheel shows where the top of the wheel needs to point.
// The road and scenery are built in 60 m pieces that move ahead of the car as it passes them, so the
// drive never ends. Uses the shape kit from js/twist3d.js; three.js is loaded by js/scene3d.js.
(() => {
"use strict";
const RC = window.RC;
const S3 = RC.Scene3D;
const DR = { ensure: () => S3.ensure(), ready: () => S3.ready() && !!(RC.Twist3D && RC.Twist3D.kit) };
const PI = Math.PI, D2R = PI / 180;
const LANE = 3.2, ROAD = LANE * 3 + 2.6, CH = 60, N = 7, EYE = 1.3;
DR.LANE = LANE;
const sm = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const THEMES = ["meadow", "village", "farm", "forest", "lake", "village", "farm"];

DR.create = function (opts) {
  if (!DR.ready()) return null;
  const THREE = S3.THREE, R = S3.getRenderer();
  if (!R) return null;
  const scene = new THREE.Scene(), K = RC.Twist3D.kit(THREE, scene, { calm: opts.calm, avoid: [] });
  const SKY_LOW = 0xdcecf2;
  scene.fog = new THREE.Fog(SKY_LOW, 110, 390);

  // ---- far away things that travel with the car: sky, mountains, hills, clouds, birds, balloons
  const far = new THREE.Group(); scene.add(far);
  const adopt = (fn) => { const n = scene.children.length; fn(); scene.children.slice(n).forEach((o) => far.add(o)); };
  adopt(() => {
    K.sky(0x3a78d0, 0x9cc8ec, SKY_LOW, { sunDir: [0.45, 0.32, -0.83], sun: 1.1, sunColor: 0xfff0c8, horizon: 0.16 });
    K.peaks(28, 230, 320, 50, 110, 0x7c8fa8, { snow: 0xf4f6fa, colors: [0x7c8fa8, 0x6f84a0, 0x8898b0] });
    for (const [a0, a1] of [[0.3, 2.9], [-2.9, -0.3]]) K.peaks(16, 150, 200, 16, 38, 0x6a9a68, { a0, a1, segs: 7, colors: [0x5f8f5e, 0x6a9a68, 0x78a46a, 0x86a86a] });
    K.clouds(16, { r0: 90, r1: 230, y0: 48, y1: 75, glow: 0.3, speed: 0.003 });
    K.flock(5, { size: 0.7, y0: 16, y1: 24, r0: 14, r1: 28, cz: -45 });
    [[-60, 34, -150, 0xe8503a, 0xffd23a], [80, 46, -200, 0x3a8ae8, 0xffffff]].forEach(([x, y, z, c1, c2]) => {
      const b = K.group(null, [x, y, z]);
      for (let i = 0; i < 8; i++) K.part(b, new THREE.SphereGeometry(4, 6, 12, i * PI / 4, PI / 4), K.S(i % 2 ? c1 : c2, { roughness: 0.6 }), null, null, [1, 1.2, 1], true);
      K.part(b, K.box(1.4, 1.1, 1.4), K.M(0x8a5a34), [0, -6.8, 0], null, null, true);
      K.tick((t) => { b.position.y = y + Math.sin(t * 0.4 + x) * 1.2; });
    });
  });
  K.lights({ sky: 0xeaf4ff, ground: 0x6a7a50, hemi: 1.5, sun: 0xfff2dc, sunI: 2.5, dir: [0.5, 0.85, -0.3] });
  const sc = K.sun.shadow.camera; sc.left = sc.bottom = -26; sc.right = sc.top = 26; sc.far = 160; sc.updateProjectionMatrix();
  const sunOff = K.sun.position.clone();

  // ---- textures
  const aniso = Math.min(8, R.capabilities.getMaxAnisotropy());
  const roadTex = K.tex(256, 256, (g, w, h) => {
    const px = (m) => (m / ROAD + 0.5) * w;
    g.fillStyle = "#5c6068"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = 78 + ((Math.random() * 36) | 0); g.fillStyle = `rgb(${v},${v + 2},${v + 7})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.fillStyle = "#a89c80"; g.fillRect(0, 0, px(-LANE * 1.5 - 0.5), h); g.fillRect(px(LANE * 1.5 + 0.5), 0, w, h);
    g.fillStyle = "#f4f4ee"; for (const s of [-1.5, 1.5]) g.fillRect(px(s * LANE) - 3, 0, 6, h);
    g.fillStyle = "#f6f2e0"; for (const s of [-0.5, 0.5]) g.fillRect(px(s * LANE) - 2.5, h * 0.3, 5, h * 0.4);
  }, true);
  roadTex.repeat.set(1, CH / 10); roadTex.anisotropy = aniso;
  const roadM = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.92 });
  const chevTex = K.tex(64, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = "#ffffff"; g.lineWidth = 12; g.lineCap = "round"; g.lineJoin = "round";
    g.beginPath(); g.moveTo(10, 86); g.lineTo(32, 48); g.lineTo(54, 86); g.stroke();
  }, true);
  chevTex.repeat.set(1, 5);
  const guideM = new THREE.MeshBasicMaterial({ map: chevTex, color: 0x5cf08a, transparent: true, opacity: 0.75, depthWrite: false });
  const stripeTex = K.tex(128, 32, (g, w, h) => {
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); g.fillStyle = "#e8402a";
    for (let i = -1; i < 8; i += 2) { g.beginPath(); g.moveTo(i * 16, h); g.lineTo(i * 16 + 16, 0); g.lineTo(i * 16 + 32, 0); g.lineTo(i * 16 + 16, h); g.fill(); }
  });
  const stripeM = new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.6 });
  const signTex = K.tex(256, 128, (g, w, h) => {
    g.fillStyle = "#1f7a4a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#ffffff"; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = "#ffffff"; g.font = "bold 40px sans-serif"; g.textAlign = "left"; g.textBaseline = "middle";
    g.fillText("Home", 26, 44); g.fillText("Lakeside", 26, 90); g.textAlign = "right"; g.fillText("2", w - 26, 44); g.fillText("5", w - 26, 90);
  });

  // ---- ground: gentle hills that rise away from the road. Heights repeat every piece so the pieces join up.
  function groundH(theme, x, z) {
    const ax = Math.abs(x), per = 2 * PI * z / CH, c = Math.cos(per), s = Math.sin(per);
    let y = -0.08 + sm(13, 110, ax) * 16 * K.noise(ax * 0.03 + c * 0.6, 3 + s * 0.6) + sm(8, 30, ax) * 0.8 * K.noise(ax * 0.2 + c, s * 2 + 7);
    if (theme === "lake") { const e = Math.pow((x - 46) / 36, 2) + Math.pow((z + CH / 2) / 22, 2); y = -1 + (y + 1) * sm(0.75, 1.12, e); }
    return y;
  }
  function groundMesh(theme, parent) {
    const geo = new THREE.PlaneGeometry(560, CH, 112, 12); geo.rotateX(-PI / 2); geo.translate(0, 0, -CH / 2);
    const pos = geo.attributes.position, cols = new Float32Array(pos.count * 3), col = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), y = groundH(theme, x, z), ax = Math.abs(x), per = 2 * PI * z / CH;
      pos.setY(i, y);
      const n = K.noise(x * 0.05 + Math.cos(per), Math.sin(per) + 11);
      let c = K.mix(0x5f9e45, 0x93c25a, n);
      if (ax > 60) c = K.mix(c, 0x7aa858, 0.4);
      if (theme === "farm" && x < -14 && x > -70) c = (Math.floor(-x / 3) % 2) ? 0xa88850 : 0x86a848;
      if (theme === "meadow" && n > 0.62 && ax > 10) c = K.mix(c, 0xe8d860, 0.55);
      if (theme === "lake") { const e = Math.pow((x - 46) / 36, 2) + Math.pow((z + CH / 2) / 22, 2); if (e < 1.18) c = K.mix(0xd8c890, c, sm(0.98, 1.18, e)); }
      if (ax < 7.2) c = 0x8aa860;
      col.set(c); cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, groundMat); m.receiveShadow = true; parent.add(m); return m;
  }
  const groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true });

  // ---- roadside pieces
  const roofGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.lineTo(0, 1); sh.lineTo(-0.5, 0); const g = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); g.rotateY(PI / 2); return g; })();
  function trees(g, theme, n, x0, x1, pine, ok) {
    const trunks = [], crowns = [], tips = [];
    for (let i = 0, tries = 0; i < n && tries < n * 20; tries++) {
      const x = (K.rnd() < 0.5 ? -1 : 1) * K.R(x0, x1), z = -K.R(1, CH - 1);
      if (ok && !ok(x, z)) continue;
      i++; const y = groundH(theme, x, z), s = K.R(0.8, 1.4);
      if (pine) {
        trunks.push({ x, y, z, sx: s, sy: s * 1.4, sz: s });
        for (let k = 0; k < 3; k++) crowns.push({ x, y: y + s * (1.6 + k * 1.3), z, sx: s * (2.0 - k * 0.5), sy: s * 2.2, sz: s * (2.0 - k * 0.5), ry: K.R(0, 3), c: K.pick([0x2f6a40, 0x3a7a48, 0x2a5e3c]) });
      } else {
        trunks.push({ x, y, z, sx: s, sy: s * 2.2, sz: s });
        const c = K.pick([0x4f8f3f, 0x5fa048, 0x3f7f3a, 0x78a840, 0x6a9a3a]);
        crowns.push({ x, y: y + s * 3.4, z, s: s * 1.9, ry: K.R(0, 3), c });
        tips.push({ x: x + K.R(-0.8, 0.8) * s, y: y + s * 4.5, z: z + K.R(-0.6, 0.6) * s, s: s * 1.3, ry: K.R(0, 3), c: K.mix(c, 0xa8d070, 0.25) });
      }
    }
    K.inst(K.post(0.14, 0.22, 1, 6), K.M(0x6a4a30), trunks, { parent: g });
    if (pine) K.inst(K.cone(1, 1, 7), K.M(0xffffff), crowns, { parent: g });
    else { K.inst(K.ico(1, 1), K.M(0xffffff), crowns, { parent: g }); K.inst(K.ico(1, 1), K.M(0xffffff), tips, { parent: g }); }
  }
  function bushes(g, theme, n) {
    const list = [];
    for (let i = 0; i < n; i++) { const x = (K.rnd() < 0.5 ? -1 : 1) * K.R(7.6, 11), z = -K.R(0, CH); list.push({ x, y: groundH(theme, x, z) + 0.15, z, sx: K.R(0.6, 1.2), sy: K.R(0.4, 0.7), sz: K.R(0.6, 1.2), c: K.pick([0x4a8a3a, 0x5a9a44, 0x6aa84a]) }); }
    K.inst(K.ico(1, 1), K.M(0xffffff), list, { parent: g });
  }
  function flowers(g, theme, n, x0, x1) {
    const list = [];
    for (let i = 0; i < n; i++) { const x = (K.rnd() < 0.5 ? -1 : 1) * K.R(x0, x1), z = -K.R(0, CH); list.push({ x, y: groundH(theme, x, z) + 0.12, z, s: K.R(0.12, 0.2), c: K.pick([0xff5a7a, 0xffd23a, 0xffffff, 0xb070f0, 0xff8a3a]) }); }
    K.inst(K.ico(1, 0), K.M(0xffffff, { roughness: 0.6 }), list, { parent: g, shadow: false });
  }
  function house(g, theme, x, z, o = {}) {
    const side = Math.sign(x), w = o.w || K.R(6, 8), hh = o.h || K.R(3.2, 4.2), d = o.d || K.R(5, 6.5);
    const hg = K.group(g, [x, groundH(theme, x, z), z], [0, side > 0 ? -PI / 2 : PI / 2, 0]);
    K.part(hg, K.box(w, hh, d), K.M(o.color || K.pick([0xf4e4c4, 0xe8c8b0, 0xd8e4f0, 0xf0d890, 0xe0f0d8])), [0, hh / 2, 0]);
    K.part(hg, roofGeo, K.M(o.roof || K.pick([0xb8483a, 0x7a4a3a, 0x4a5a78, 0x9a5a3a])), [0, hh, 0], null, [w + 0.6, K.R(1.8, 2.6), d + 0.6]);
    K.part(hg, K.box(1.0, 2.0, 0.12), K.M(K.pick([0x7a4a2a, 0x3a6a8a, 0xb84a3a])), [0, 1.0, d / 2]);
    for (const s of [-1, 1]) {
      K.part(hg, K.box(1.1, 1.0, 0.1), K.S(0xbfe3f5, { emissive: 0x507090, emissiveIntensity: 0.3 }), [s * w * 0.3, hh * 0.58, d / 2 + 0.01], null, null, true);
      K.part(hg, K.box(1.3, 0.12, 0.2), K.M(0xffffff), [s * w * 0.3, hh * 0.58 - 0.56, d / 2 + 0.05], null, null, true);
    }
    K.part(hg, K.box(0.7, 1.6, 0.7), K.M(0x9a6a5a), [w * 0.28, hh + 1.4, -d * 0.15]);
    if (o.fence !== false) {
      const posts = []; for (let i = -5; i <= 5; i++) if (Math.abs(i) > 0) posts.push({ x: i * 0.7, y: 0.45, z: d / 2 + 2.5 });
      K.inst(K.box(0.12, 0.9, 0.08), K.M(0xffffff), posts, { parent: hg });
      for (const s of [-1, 1]) K.part(hg, K.box(3.2, 0.1, 0.06), K.M(0xffffff), [s * 2.1, 0.6, d / 2 + 2.5]);
    }
    return hg;
  }
  function lamp(g, theme, x, z) {
    const l = K.group(g, [x, groundH(theme, x, z), z]), s = -Math.sign(x);
    K.part(l, K.post(0.07, 0.1, 5, 8), K.M(0x2a3038), null);
    K.part(l, K.box(1.2, 0.08, 0.08), K.M(0x2a3038), [s * 0.55, 4.95, 0]);
    K.part(l, K.box(0.5, 0.12, 0.28), K.E(0xfff0c0, { emissiveIntensity: 0.6 }), [s * 1.1, 4.88, 0]);
  }
  function animal(g, theme, kind, x, z, hgt, face) {
    const A = RC.TwistAnimals && RC.TwistAnimals[kind]; if (!A) return;
    const a = A(K), box = new THREE.Box3().setFromObject(a.g), s = hgt / Math.max(0.01, box.max.y - box.min.y);
    const holder = K.group(g, [x, groundH(theme, x, z), z], [0, face, 0], s), inner = K.group(holder, [0, -box.min.y, 0]);
    inner.add(a.g); if (a.idle) K.tick((t) => a.idle(t));
  }
  function fence(g, theme, x) {
    const posts = []; for (let z = -1; z > -CH; z -= 3) posts.push({ x, y: groundH(theme, x, z), z, sy: 1.1 });
    K.inst(K.post(0.07, 0.08, 1, 5), K.M(0x8a6a4a), posts, { parent: g });
    for (const y of [0.5, 0.9]) K.part(g, K.box(0.06, 0.08, CH), K.M(0x9a7a54), [x, groundH(theme, x, -CH / 2) + y, -CH / 2]);
  }
  function sign(g, theme, x, z) {
    const sg = K.group(g, [x, groundH(theme, x, z), z]);
    for (const s of [-1, 1]) K.part(sg, K.post(0.06, 0.06, 3.2, 6), K.M(0x9aa0a8), [s * 0.9, 0, 0]);
    K.part(sg, K.box(2.4, 1.2, 0.08), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.5 }), [0, 2.6, 0]);
  }
  function windmill(g, theme, x, z) {
    const w = K.group(g, [x, groundH(theme, x, z), z]);
    K.part(w, K.post(1.3, 2.3, 11, 8), K.M(0xf4ece0), null);
    K.part(w, K.cone(1.8, 2.4, 8), K.M(0x8a4a3a), [0, 12.1, 0]);
    const hub = K.group(w, [0, 10.6, 1.9]), blades = K.group(hub);
    for (let i = 0; i < 4; i++) { const b = K.group(blades, null, [0, 0, i * PI / 2]); K.part(b, K.box(0.25, 6, 0.08), K.M(0x6a4a30), [0, 3.1, 0]); K.part(b, K.box(1.3, 4.6, 0.04), K.M(0xf8f4ea), [0.7, 3.6, 0]); }
    w.rotation.y = x > 0 ? -PI / 2 : PI / 2;
    K.tick((t) => { blades.rotation.z = -t * 0.8; });
  }
  function barn(g, theme, x, z) {
    const b = K.group(g, [x, groundH(theme, x, z), z], [0, x > 0 ? -PI / 2 : PI / 2, 0]);
    K.part(b, K.box(10, 6, 8), K.M(0xb8342a), [0, 3, 0]);
    K.part(b, roofGeo, K.M(0x4a4a50), [0, 6, 0], null, [10.6, 3.6, 8.6]);
    K.part(b, K.box(3.6, 4.2, 0.1), K.M(0x8a241e), [0, 2.1, 4.02]);
    for (const s of [-1, 1]) K.part(b, K.box(0.18, 5.4, 0.06), K.M(0xffffff), [0, 2.1, 4.1], [0, 0, s * 0.7]);
    const silo = K.group(b, [7.5, 0, -1]);
    K.part(silo, K.cyl(2, 2, 11, 16), K.S(0xd8dce0), [0, 5.5, 0]); K.part(silo, K.hemi(2, 16), K.S(0x9aa4b0), [0, 11, 0]);
    const bales = []; for (let i = 0; i < 4; i++) bales.push({ x: -4 + i * 2.2, y: 0.7, z: 7 + (i % 2), rz: PI / 2, ry: K.R(-0.2, 0.2) });
    K.inst(K.cyl(0.7, 0.7, 1.2, 12), K.M(0xe0c060), bales, { parent: b });
  }
  function lake(g) {
    const w = new THREE.Mesh(K.circle(1, 40), new THREE.MeshStandardMaterial({ color: 0x3a82c0, roughness: 0.12, metalness: 0.1 }));
    w.rotation.x = -PI / 2; w.scale.set(33, 20, 1); w.position.set(46, -0.35, -CH / 2); w.receiveShadow = true; g.add(w);
    const boat = K.group(g, [52, -0.35, -CH / 2 - 4], [0, 0.6, 0]);
    K.part(boat, K.box(1.4, 0.5, 3.6), K.M(0xffffff), [0, 0.2, 0]);
    K.part(boat, K.post(0.05, 0.05, 4.4, 5), K.M(0x8a6a4a), [0, 0.3, 0.2]);
    const sail = new THREE.BufferGeometry(); sail.setAttribute("position", new THREE.Float32BufferAttribute([0, 0.8, 0.25, 0, 4.6, 0.25, 0, 0.8, -1.5, 0, 0.8, 0.25, 0, 4.6, 0.25, 0, 0.8, -1.5], 3)); sail.computeVertexNormals();
    K.part(boat, sail, K.M(0xf8b040, { side: THREE.DoubleSide }));
    K.tick((t) => { boat.position.y = -0.35 + Math.sin(t * 1.2) * 0.08; boat.rotation.z = Math.sin(t * 0.9) * 0.05; });
    const dock = K.group(g, [17, 0, -CH / 2 + 6]);
    K.part(dock, K.box(8, 0.15, 1.8), K.M(0x9a7048), [4, 0.1, 0]);
    const piles = []; for (let i = 0; i < 4; i++) for (const s of [-1, 1]) piles.push({ x: 1 + i * 2.2, y: -0.8, z: s * 0.8, sy: 1.2 });
    K.inst(K.post(0.08, 0.08, 1, 6), K.M(0x6a4a30), piles, { parent: dock });
    const reeds = []; for (let i = 0; i < 60; i++) { const a = K.R(0, PI * 2), x = 46 + Math.cos(a) * 33 * K.R(0.92, 1.02), z = -CH / 2 + Math.sin(a) * 20 * K.R(0.92, 1.02); if (x < 14) continue; reeds.push({ x, y: -0.3, z, sy: K.R(0.8, 1.6), rz: K.R(-0.15, 0.15) }); }
    K.inst(K.blade(0.06, 1.4, 4), K.swayM(0x6a9a4a, 0.08, 1.4), reeds, { parent: g, shadow: false });
  }

  function buildPiece(theme, k) {
    const g = K.group();
    groundMesh(theme, g);
    const road = new THREE.Mesh(K.plane(ROAD, CH), roadM); road.rotation.x = -PI / 2; road.position.set(0, 0.01, -CH / 2); road.receiveShadow = true; g.add(road);
    bushes(g, theme, 10);
    if (theme === "meadow") {
      trees(g, theme, 14, 14, 80);
      flowers(g, theme, 260, 8, 45);
      windmill(g, theme, -24, -30);
      animal(g, theme, "sheep", 16, -14, 1.0, -1.2); animal(g, theme, "sheep", 19, -20, 0.9, -2.2); animal(g, theme, "horse", 20, -40, 1.9, 2.4);
      fence(g, theme, 12);
    } else if (theme === "village") {
      const xs = [[-15, -10], [15, -24], [-16, -38], [14, -52]];
      xs.forEach(([x, z]) => house(g, theme, x, z));
      lamp(g, theme, 7.2, -15); lamp(g, theme, -7.2, -45);
      trees(g, theme, 10, 24, 80);
      flowers(g, theme, 80, 8, 22);
      if (k === 1) sign(g, theme, 8.2, -32);
    } else if (theme === "farm") {
      barn(g, theme, 22, -28);
      fence(g, theme, -11); fence(g, theme, 11);
      animal(g, theme, "cow", 16, -8, 1.6, -1.4); animal(g, theme, "cow", 18, -48, 1.5, -2.0); animal(g, theme, "chicken", 13, -16, 0.45, -0.6);
      trees(g, theme, 8, 40, 90, false, (x) => x > 0);
      if (k === 6) sign(g, theme, 8.2, -50);
    } else if (theme === "forest") {
      trees(g, theme, 70, 8.5, 70, true);
      trees(g, theme, 12, 9, 40);
      const rocks = []; for (let i = 0; i < 12; i++) { const x = (K.rnd() < 0.5 ? -1 : 1) * K.R(8, 30), z = -K.R(0, CH); rocks.push({ x, y: groundH(theme, x, z), z, s: K.R(0.4, 1.2), ry: K.R(0, 3) }); }
      K.inst(K.dod(1), K.M(0x8a8a88), rocks, { parent: g });
      animal(g, theme, "rabbit", -9, -26, 0.45, 1.2);
    } else if (theme === "lake") {
      lake(g);
      trees(g, theme, 18, 10, 70, false, (x, z) => x < 0 || Math.pow((x - 46) / 38, 2) + Math.pow((z + CH / 2) / 24, 2) > 1.1);
      flowers(g, theme, 60, 8, 20);
      animal(g, theme, "crane", 20, -36, 1.6, -1.0);
    }
    return g;
  }
  const pieces = THEMES.map((th, k) => { const g = buildPiece(th, k); g.position.z = -k * CH; return { g, k }; });

  // ---- gates: a green arch over one lane, striped barriers and cones in the other two
  const coneM = K.S(0xff7a1a), archM = K.E(0x3ad06a, { emissiveIntensity: 0.8 }), postM = K.S(0xf4f4f0);
  const slots = [];
  for (let i = 0; i < 8; i++) {
    const g = K.group(); g.visible = false;
    const arch = K.group(g);
    for (const s of [-1, 1]) { K.part(arch, K.post(0.11, 0.13, 3.1, 10), postM, [s * 1.45, 0, 0]); K.part(arch, K.post(0.14, 0.14, 0.5, 10), archM, [s * 1.45, 0, 0]); }
    K.part(arch, K.tor(1.45, 0.14, 8, 32, PI), archM, [0, 3.1, 0]);
    const glow = K.sprite(0x7af09a, 4, [0, 4.2, 0], 0.5, arch);
    const guide = new THREE.Mesh(K.plane(2.4, 20), guideM); guide.rotation.x = -PI / 2; guide.position.set(0, 0.03, 10.5); arch.add(guide);
    const blocks = [0, 1].map(() => {
      const b = K.group(g);
      for (const y of [0.5, 1.0]) K.part(b, K.box(2.6, 0.3, 0.08), stripeM, [0, y, 0]);
      for (const s of [-1, 1]) K.part(b, K.box(0.08, 1.15, 0.5), K.M(0x8a8a90), [s * 1.15, 0.57, 0]);
      for (const s of [-0.9, 0, 0.9]) { const c = K.group(b, [s, 0, 1.4]); K.part(c, K.cone(0.22, 0.65, 14), coneM, [0, 0.33, 0]); K.part(c, K.box(0.48, 0.05, 0.48), coneM, [0, 0.025, 0]); K.part(c, K.cyl(0.13, 0.155, 0.1, 14), K.S(0xffffff), [0, 0.36, 0]); }
      return b;
    });
    slots.push({ g, arch, glow, guide, blocks });
  }

  // ---- the car: hood, dashboard, windscreen pillars, mirror, a rubber duck, the wheel and the driver's hands
  const car = K.group();
  const bodyM = K.S(0xd23a3a, { roughness: 0.3 }), dashM = K.M(0x3a3f4a, { roughness: 0.9, flatShading: false }), trimM = K.S(0x30343c, { roughness: 0.5 });
  K.part(car, K.box(1.76, 0.1, 2.0), bodyM, [0, 0.83, -2.25], [-0.05, 0, 0]);
  for (const s of [-1, 1]) K.part(car, K.cyl(0.13, 0.13, 2.0, 12), bodyM, [s * 0.82, 0.81, -2.25], [PI / 2 - 0.05, 0, 0]);
  K.part(car, K.box(0.05, 0.012, 1.9), K.S(0xe8605a, { roughness: 0.3 }), [0, 0.885, -2.25], [-0.05, 0, 0], null, true);
  K.part(car, K.box(2.0, 0.06, 0.16), trimM, [0, 0.93, -1.24]);
  for (const s of [-1, 1]) K.part(car, K.box(0.55, 0.02, 0.03), K.M(0x1a1c20), [s * 0.32, 0.97, -1.27], [0, 0, s * 0.12], null, true);
  // dashboard: a soft top, a lighter lower panel, air vents and a little map screen
  K.part(car, K.box(3.2, 0.5, 0.5), dashM, [0, 0.7, -0.98]);
  K.part(car, K.cyl(0.06, 0.06, 3.2, 14), dashM, [0, 0.93, -0.76], [0, 0, PI / 2]);
  K.part(car, K.box(3.2, 0.36, 0.22), K.M(0x4a505c, { roughness: 0.9, flatShading: false }), [0, 0.5, -0.66]);
  for (const x of [-0.62, 0.62]) {
    K.part(car, K.box(0.26, 0.09, 0.02), K.S(0xb8bec8, { roughness: 0.3 }), [x, 0.86, -0.725], null, null, true);
    K.part(car, K.box(0.22, 0.06, 0.022), K.M(0x15171b), [x, 0.86, -0.722], null, null, true);
  }
  const mapTex = K.tex(160, 96, (g, w, h) => {
    g.fillStyle = "#cfe8c4"; g.fillRect(0, 0, w, h); g.fillStyle = "#9ccbe8"; g.beginPath(); g.ellipse(124, 30, 30, 18, 0, 0, PI * 2); g.fill();
    g.strokeStyle = "#ffffff"; g.lineWidth = 10; g.beginPath(); g.moveTo(80, h); g.lineTo(80, 50); g.quadraticCurveTo(80, 20, 40, 14); g.stroke();
    g.strokeStyle = "#3a8ae8"; g.lineWidth = 5; g.beginPath(); g.moveTo(80, h); g.lineTo(80, 50); g.quadraticCurveTo(80, 20, 40, 14); g.stroke();
    g.fillStyle = "#e8402a"; g.beginPath(); g.moveTo(80, 70); g.lineTo(70, 88); g.lineTo(90, 88); g.fill();
  });
  K.part(car, K.box(0.3, 0.2, 0.02), K.M(0x15171b), [0.62, 0.7, -0.715], null, null, true);
  K.part(car, K.plane(0.27, 0.165), new THREE.MeshBasicMaterial({ map: mapTex }), [0.62, 0.7, -0.703], null, null, true);
  for (const s of [-1, 1]) K.part(car, K.box(0.12, 0.6, 1.2), bodyM, [s * 1.0, 0.68, -0.15]);
  for (const s of [-1, 1]) K.part(car, K.tube([[s * 0.92, 0.94, -1.24], [s * 0.86, 1.3, -0.98], [s * 0.78, 1.7, -0.62]], 0.035, 10, 6), trimM);
  // instrument cluster behind the wheel
  const clusterTex = K.tex(256, 96, (g, w, h) => {
    g.fillStyle = "#16181e"; g.fillRect(0, 0, w, h);
    for (const [cx, label] of [[70, "km/h"], [186, "fuel"]]) {
      g.strokeStyle = "#e8eef8"; g.lineWidth = 3; g.beginPath(); g.arc(cx, 56, 36, PI * 0.8, PI * 2.2); g.stroke();
      for (let i = 0; i <= 8; i++) { const a = PI * 0.8 + i * PI * 1.4 / 8; g.beginPath(); g.moveTo(cx + Math.cos(a) * 30, 56 + Math.sin(a) * 30); g.lineTo(cx + Math.cos(a) * 36, 56 + Math.sin(a) * 36); g.stroke(); }
      g.strokeStyle = "#ff6a3a"; g.lineWidth = 4; const a = cx < 100 ? PI * 1.4 : PI * 1.9; g.beginPath(); g.moveTo(cx, 56); g.lineTo(cx + Math.cos(a) * 30, 56 + Math.sin(a) * 30); g.stroke();
      g.fillStyle = "#9aa4b8"; g.font = "14px sans-serif"; g.textAlign = "center"; g.fillText(label, cx, 84);
    }
  });
  K.part(car, K.box(0.62, 0.16, 0.16), dashM, [0, 0.98, -0.95]);
  K.part(car, K.plane(0.56, 0.15), new THREE.MeshBasicMaterial({ map: clusterTex }), [0, 1.0, -0.865], [-0.3, 0, 0], null, true);
  // rear-view mirror showing the road behind
  const mirTex = K.tex(160, 48, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#7fb4e4"); gr.addColorStop(0.55, "#d8ecf2"); gr.addColorStop(0.56, "#6aa04e"); gr.addColorStop(1, "#5a9044");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "#62666e"; g.beginPath(); g.moveTo(w / 2 - 3, h * 0.56); g.lineTo(w / 2 + 3, h * 0.56); g.lineTo(w * 0.85, h); g.lineTo(w * 0.15, h); g.fill();
    g.fillStyle = "#3f7f3a"; for (const x of [18, 34, 120, 140]) { g.beginPath(); g.arc(x, h * 0.48, 7, 0, PI * 2); g.fill(); }
  });
  const mir = K.group(car, [0, 1.5, -0.72], [0.22, 0, 0]);
  K.part(mir, K.box(0.38, 0.12, 0.03), trimM);
  K.part(mir, K.plane(0.34, 0.09), new THREE.MeshBasicMaterial({ map: mirTex }), [0, 0, 0.017], null, null, true);
  K.part(car, K.cyl(0.012, 0.012, 0.2, 6), trimM, [0, 1.62, -0.74]);
  // rubber duck on the dashboard
  const duck = K.group(car, [0.58, 0.95, -0.92], [0, 0.3, 0]), duckTop = K.group(duck);
  K.part(duckTop, K.sph(0.05, 14, 10), K.S(0xffd23a), [0, 0.04, 0], null, [1.25, 0.9, 1]);
  K.part(duckTop, K.sph(0.034, 12, 10), K.S(0xffd23a), [0, 0.1, 0.02]);
  K.part(duckTop, K.cone(0.016, 0.04, 8), K.S(0xff8a1a), [0, 0.095, 0.06], [PI / 2, 0, 0]);
  for (const s of [-1, 1]) K.part(duckTop, K.sph(0.006, 6, 5), K.S(0x111111), [s * 0.016, 0.112, 0.048], null, null, true);
  // steering wheel: the rim, spokes and hub turn with the phone; the green marker shows the goal
  const wheelBase = K.group(car, [0, 0.9, -0.5], [-0.42, 0, 0]);
  K.part(wheelBase, K.cyl(0.035, 0.045, 0.4, 10), trimM, [0, 0, -0.2], [PI / 2, 0, 0]);
  const spin = K.group(wheelBase);
  const rimM = K.S(0x24262c, { roughness: 0.55 });
  K.part(spin, K.tor(0.2, 0.024, 10, 48), rimM);
  K.part(spin, K.tor(0.2, 0.027, 8, 8, 0.32), K.S(0xffc83a, { roughness: 0.4 }), null, [0, 0, PI / 2 - 0.16]);
  K.part(spin, K.box(0.34, 0.035, 0.022), rimM);
  K.part(spin, K.box(0.035, 0.17, 0.022), rimM, [0, -0.095, 0]);
  K.part(spin, K.cyl(0.06, 0.066, 0.05, 24), K.S(0x34363c, { roughness: 0.5 }), [0, 0, 0.01], [PI / 2, 0, 0]);
  K.part(spin, K.cyl(0.024, 0.024, 0.012, 16), K.S(0xd23a3a), [0, 0, 0.04], [PI / 2, 0, 0], null, true);
  const skinM = K.S(0xe8b48c, { roughness: 0.7 }), sleeveM = K.S(0x4a6ad0, { roughness: 0.85 });
  const hands = [-1, 1].map((s) => {
    const h = K.group(spin, [s * 0.2, 0, 0]);
    K.part(h, K.sph(0.05, 14, 10), skinM, [0, 0.005, 0.012], null, [0.95, 1.35, 0.85]);
    K.part(h, K.sph(0.022, 10, 8), skinM, [-s * 0.035, 0.03, 0.035], null, [1, 1.4, 1]);
    K.part(h, K.tor(0.034, 0.016, 6, 10, PI), skinM, [s * 0.012, 0.01, -0.012], [0, s * PI / 2, PI / 2]);
    return h;
  });
  const arms = [-1, 1].map((s) => ({ sh: new THREE.Vector3(s * 0.25, 0.7, 0.28), m: K.part(car, K.post(0.042, 0.062, 1, 12), sleeveM) }));
  const goal = K.group(wheelBase);
  K.part(goal, K.cone(0.028, 0.06, 12), K.E(0x3ad06a), [0, 0.27, 0.01], [0, 0, PI], null, true);
  K.sprite(0x7af09a, 0.14, [0, 0.27, 0.02], 0.7, goal);

  const cam = new THREE.PerspectiveCamera(60, 16 / 9, 0.05, 900);
  cam.position.set(0, EYE, 0.12); cam.rotation.set(-0.11, 0, 0); car.add(cam);
  const tmp = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  let duckA = 0, duckV = 0, prevVx = 0;

  const world = {
    lowQuality(on) { if (K.sun.castShadow === on) K.sun.castShadow = !on; },
    // st: { s: metres driven, x: car across the road (m), vx, speed, wheel (deg, + = right), target (deg or null),
    //       gates: [{ id, d, lane, res: null|"ok"|"miss", tp, hit }] }
    frame(W, H, pr, st, t, dt) {
      const calm = K.calm, s = st.s || 0, x = st.x || 0, vx = st.vx || 0;
      cam.aspect = W / H; cam.fov = W / H < 1.2 ? 76 : 60; cam.updateProjectionMatrix();
      car.position.set(x, calm ? 0 : Math.sin(t * 11) * 0.004 + Math.sin(t * 2.3) * 0.003, -s);
      car.rotation.set(0, -Math.atan2(vx, Math.max(4, st.speed || 12)) * 1.1, calm ? 0 : -vx * 0.006);
      far.position.set(x, 0, -s);
      K.sun.position.set(sunOff.x + x, sunOff.y, sunOff.z - s - 10); K.sun.target.position.set(x, 0, -s - 10);
      for (const p of pieces) if (-(p.k + 1) * CH > -s + 12) { p.k += N; p.g.position.z = -p.k * CH; p.g.scale.x = Math.floor(p.k / N) % 2 ? -1 : 1; }
      // wheel, goal marker and arms
      spin.rotation.z = -Math.max(-160, Math.min(160, st.wheel || 0)) * D2R;
      goal.visible = st.target != null; if (goal.visible) goal.rotation.z = -st.target * D2R;
      car.updateMatrixWorld(true);
      arms.forEach((a, i) => {
        hands[i].getWorldPosition(tmp); car.worldToLocal(tmp); tmp.sub(a.sh);
        const len = tmp.length(); a.m.position.copy(a.sh); a.m.quaternion.setFromUnitVectors(up, tmp.normalize()); a.m.scale.set(1, len, 1);
      });
      // the duck wobbles when the car swerves
      if (!calm && dt > 0) { const acc = (vx - prevVx) / dt; duckV += (-duckA * 60 - duckV * 5 + acc * 0.05) * dt; duckA += duckV * dt; duckA = Math.max(-0.5, Math.min(0.5, duckA)); }
      prevVx = vx; duckTop.rotation.z = duckA;
      // gates
      slots.forEach((sl) => { sl.g.visible = false; });
      const nextId = (st.gates || []).find((q) => q.res == null);
      (st.gates || []).forEach((q) => {
        const sl = slots[q.id % slots.length]; if (q.d - s > 380) return;
        sl.g.visible = true; sl.g.position.set(0, 0, -q.d); sl.arch.position.x = q.lane * LANE;
        sl.guide.visible = nextId === q;
        const others = [-1, 0, 1].filter((l) => l !== q.lane);
        const u = q.res ? t - q.tp : 0;
        sl.blocks.forEach((b, j) => {
          b.position.set(others[j] * LANE, 0, 0); b.rotation.set(0, 0, 0); b.visible = true;
          if (q.res === "miss" && Math.abs(q.hit - others[j] * LANE) === Math.min(...others.map((l) => Math.abs(q.hit - l * LANE)))) {
            if (u > 1.6) { b.visible = false; return; }
            b.position.y = Math.max(0, 5 * u - 6 * u * u); b.position.z = -u * ((st.speed || 13) + 7); b.rotation.set(-u * 5, 0, (others[j] < q.lane ? -1 : 1) * u * 1.5);
          }
        });
        const pulse = q.res === "ok" && u < 1 ? Math.sin(u * PI) : 0;
        sl.arch.scale.setScalar(1 + pulse * 0.15); sl.glow.scale.setScalar(4 + pulse * 10); sl.glow.material.opacity = 0.5 + pulse * 0.4;
      });
      chevTex.offset.y = calm ? 0 : -t * 0.9;
      K.swayers.forEach((u) => { u.uT.value = t; });
      for (const f of K.tickers) f(calm ? 0 : t, dt);
      return S3.renderTo(R, scene, cam, W, H, pr);
    },
    // screen position of a point on the road d metres along, x across, y up
    toScreen(W, H, x, y, d) { tmp.set(x, y, -d); const v = tmp.clone().project(cam); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, front: v.z < 1 }; },
    dispose() { S3.dispose(scene, [K.glow]); },
  };
  return world;
};

RC.Drive3D = DR;
})();
