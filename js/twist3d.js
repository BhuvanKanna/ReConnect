// 3D "look around" worlds for Trunk Twist. You sit in the middle of a scene; turning your shoulders turns
// your view, and an animal (or rocket, or balloon) waits on one side to be found. The patient picks one of
// the scenes in TW.SCENES on the setup screen. The scenes themselves are built in js/twist-scenes.js
// from the small kit of shapes and helpers below (seeded, so a scene looks the same every visit).
//
// three.js is loaded on demand by js/scene3d.js; until then, or without WebGL, the exercise draws a flat 2D view.
(() => {
"use strict";
const RC = window.RC;
const S3 = RC.Scene3D;
const TW = { ensure: () => S3.ensure(), ready: () => S3.ready(), builders: {} };
TW.SCENES = [
  { id: "jungle", name: "Jungle", icon: "🐒" },
  { id: "dino", name: "Dinosaur Valley", icon: "🦕" },
  { id: "space", name: "Outer Space", icon: "🚀" },
  { id: "reef", name: "Coral Reef", icon: "🐠" },
  { id: "farm", name: "Farm", icon: "🐄" },
  { id: "arctic", name: "Snowy North", icon: "🐧" },
  { id: "island", name: "Tropical Island", icon: "🏝️" },
  { id: "garden", name: "Blossom Garden", icon: "🌸" },
  { id: "desert", name: "Desert Pyramids", icon: "🐪" },
];
TW.sceneOf = (id) => TW.SCENES.find((s) => s.id === id) || TW.SCENES[0];
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// ---------------------------------------------------------------- kit: shapes, materials, scatter, sky
function makeKit(THREE, scene, opts) {
  let seed = 9871;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const R = (a, b) => a + rnd() * (b - a);
  const geos = new Map(), mats = new Map(), tickers = [], swayers = [];
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  const memo = (map, key, make) => { if (!map.has(key)) map.set(key, make()); return map.get(key); };
  const K = { THREE, scene, rnd, R, tickers, calm: !!opts.calm, h: () => 0, glow: S3.glowTexture() };
  K.pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  K.sph = (r = 1, w = 12, h = 9) => memo(geos, `s${r},${w},${h}`, () => new THREE.SphereGeometry(r, w, h));
  K.hemi = (r = 1, w = 12) => memo(geos, `h${r},${w}`, () => new THREE.SphereGeometry(r, w, 6, 0, Math.PI * 2, 0, Math.PI / 2));
  K.box = (x = 1, y = 1, z = 1) => memo(geos, `b${x},${y},${z}`, () => new THREE.BoxGeometry(x, y, z));
  K.cyl = (a = 1, b = 1, h = 1, s = 8) => memo(geos, `c${a},${b},${h},${s}`, () => new THREE.CylinderGeometry(a, b, h, s));
  K.cone = (r = 1, h = 1, s = 8) => memo(geos, `k${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s));
  K.ico = (r = 1, d = 0) => memo(geos, `i${r},${d}`, () => new THREE.IcosahedronGeometry(r, d));
  K.dod = (r = 1) => memo(geos, `d${r}`, () => new THREE.DodecahedronGeometry(r, 0));
  K.tor = (r = 1, t = 0.1, rs = 8, ts = 24, arc = Math.PI * 2) => memo(geos, `t${r},${t},${rs},${ts},${arc}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc));
  K.circle = (r = 1, s = 24) => memo(geos, `o${r},${s}`, () => new THREE.CircleGeometry(r, s));
  K.blade = (r = 1, h = 1, s = 4) => memo(geos, `bl${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s).translate(0, h / 2, 0)); // pivots at its base
  K.post = (a = 1, b = 1, h = 1, s = 8) => memo(geos, `po${a},${b},${h},${s}`, () => new THREE.CylinderGeometry(a, b, h, s).translate(0, h / 2, 0));
  K.tex = (w, h, draw, rep) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  K.plane = (w = 1, h = 1) => memo(geos, `p${w},${h}`, () => new THREE.PlaneGeometry(w, h));
  // a tube along a list of [x,y,z] points
  K.tube = (pts, r, seg = 24, rs = 6) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), seg, r, rs, false);
  K.lathe = (pts, s = 16) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), s);
  K.M = (color, o) => memo(mats, color + (o ? JSON.stringify(o) : ""), () => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.82, flatShading: true }, o || {})));
  K.S = (color, o) => K.M(color, Object.assign({ flatShading: false, roughness: 0.45 }, o || {})); // smooth
  K.E = (color, o) => K.M(color, Object.assign({ emissive: color, emissiveIntensity: 1, flatShading: false }, o || {})); // glowing
  K.B = (color, o) => memo(mats, "basic" + color + (o ? JSON.stringify(o) : ""), () => new THREE.MeshBasicMaterial(Object.assign({ color }, o || {})));
  K.group = (parent, p, r, s) => {
    const g = new THREE.Group(); if (p) g.position.set(p[0], p[1], p[2]); if (r) g.rotation.set(r[0], r[1], r[2]);
    if (s != null) typeof s === "number" ? g.scale.setScalar(s) : g.scale.set(s[0], s[1], s[2]);
    (parent || scene).add(g); return g;
  };
  K.part = (parent, geo, mat, p, r, s, noShadow) => {
    const m = new THREE.Mesh(geo, mat);
    if (p) m.position.set(p[0], p[1], p[2]); if (r) m.rotation.set(r[0], r[1], r[2]);
    if (s != null) typeof s === "number" ? m.scale.setScalar(s) : m.scale.set(s[0], s[1], s[2]);
    m.castShadow = !noShadow; m.receiveShadow = true; (parent || scene).add(m); return m;
  };
  // Many copies of one shape in a single draw call. list items: {x,y,z, rx,ry,rz, s | sx,sy,sz, c}
  K.inst = (geo, mat, list, o = {}) => {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((p, i) => {
      dummy.position.set(p.x || 0, p.y || 0, p.z || 0); dummy.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0);
      const s = p.s == null ? 1 : p.s; dummy.scale.set(p.sx == null ? s : p.sx, p.sy == null ? s : p.sy, p.sz == null ? s : p.sz);
      dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); if (p.c != null) im.setColorAt(i, col.set(p.c));
    });
    im.castShadow = o.shadow !== false; im.receiveShadow = true; (o.parent || scene).add(im); return im;
  };
  K.setInst = (im, i, p) => {
    dummy.position.set(p.x || 0, p.y || 0, p.z || 0); dummy.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0);
    const s = p.s == null ? 1 : p.s; dummy.scale.set(p.sx == null ? s : p.sx, p.sy == null ? s : p.sy, p.sz == null ? s : p.sz);
    dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix);
  };
  // smooth value noise, 0..1
  const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  K.noise = (x, z) => {
    const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = hash(i, j) + (hash(i + 1, j) - hash(i, j)) * u, b = hash(i, j + 1) + (hash(i + 1, j + 1) - hash(i, j + 1)) * u;
    return a + (b - a) * v;
  };
  K.fbm = (x, z) => (K.noise(x, z) * 0.5 + K.noise(x * 2.03, z * 2.03) * 0.25 + K.noise(x * 4.1, z * 4.1) * 0.125) / 0.875;
  // Bearings: 0 = straight ahead (-z), positive = to the right (+x). Points to scatter things around the viewer,
  // keeping clear of the spots where the animals to find will stand (and of the viewer's own seat).
  K.at = (a, r) => ({ x: Math.sin(a) * r, z: -Math.cos(a) * r });
  K.blocked = (a, r) => r < 2.6 || (r < 17 && (opts.avoid || []).some((b) => Math.abs(wrap(a - b)) < 0.2 + 1.1 / r));
  K.ring = (n, r0, r1, o = {}) => {
    const out = []; let tries = 0;
    while (out.length < n && tries++ < n * 40) {
      const a = o.a0 != null ? R(o.a0, o.a1) : R(-Math.PI, Math.PI), r = Math.sqrt(R(r0 * r0, r1 * r1));
      if (!o.free && K.blocked(a, r)) continue;
      const p = K.at(a, r); if (o.ok && !o.ok(p.x, p.z, a, r)) continue;
      out.push({ x: p.x, z: p.z, a, r, y: K.h(p.x, p.z) });
    }
    return out;
  };
  // Ground: a big displaced plane coloured per vertex. o: {size, seg, h(x,z), color(x,z,y) -> hex}
  K.ground = (o) => {
    const size = o.size || 240, seg = o.seg || 110, geo = new THREE.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, cols = new Float32Array(pos.count * 3), h = o.h || (() => 0);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), y = h(x, z); pos.setY(i, y);
      col.set(o.color(x, z, y)); cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: 0.95, flatShading: o.flat !== false }, o.mat || {})));
    m.receiveShadow = true; scene.add(m); K.h = h; return m;
  };
  K.mix = (a, b, u) => col.set(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, u))).getHex();
  // Sky dome: three-colour gradient, optional sun glow
  K.sky = (top, mid, low, o = {}) => {
    const sd = new THREE.Vector3(...(o.sunDir || [0, 1, 0])).normalize();
    const m = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, low: { value: new THREE.Color(low) }, sunDir: { value: sd }, sunCol: { value: new THREE.Color(o.sunColor || 0xffffff) }, sunAmt: { value: o.sun || 0 }, hz: { value: o.horizon == null ? 0.18 : o.horizon } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 low; uniform vec3 sunDir; uniform vec3 sunCol; uniform float sunAmt; uniform float hz; varying vec3 vP; void main(){ float h = vP.y; vec3 c = mix(low, mid, smoothstep(-0.05, hz, h)); c = mix(c, top, smoothstep(hz, 0.85, h)); float d = max(dot(vP, sunDir), 0.0); c += sunCol * sunAmt * (pow(d, 300.0) * 3.0 + pow(d, 12.0) * 0.35); gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
    }));
    m.renderOrder = -1; scene.add(m); return m;
  };
  K.stars = (n, o = {}) => {
    const pos = new Float32Array(n * 3), cols = new Float32Array(n * 3), r = 380;
    for (let i = 0; i < n; i++) {
      const u = R(0, Math.PI * 2), v = R(o.minY == null ? 0.05 : o.minY, 1), s = Math.sqrt(1 - v * v);
      pos[i * 3] = Math.cos(u) * s * r; pos[i * 3 + 1] = v * r; pos[i * 3 + 2] = Math.sin(u) * s * r;
      col.set(K.pick(o.colors || [0xffffff, 0xffffff, 0xcfe0ff, 0xffe8c8])); cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    const p = new THREE.Points(geo, new THREE.PointsMaterial({ vertexColors: true, size: o.size || 1.7, sizeAttenuation: false, fog: false, transparent: true, opacity: o.opacity || 0.9, depthWrite: false }));
    scene.add(p); return p;
  };
  K.sprite = (color, scale, p, opacity = 0.8, parent) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glow, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    s.scale.setScalar(scale); if (p) s.position.set(p[0], p[1], p[2]); (parent || scene).add(s); return s;
  };
  K.lights = (o) => {
    scene.add(new THREE.HemisphereLight(o.sky, o.ground, o.hemi == null ? 1.4 : o.hemi));
    const sun = new THREE.DirectionalLight(o.sun || 0xffffff, o.sunI == null ? 2 : o.sunI);
    const d = new THREE.Vector3(...(o.dir || [0.4, 1, 0.3])).normalize(); sun.position.copy(d.multiplyScalar(60));
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const c = sun.shadow.camera; c.left = c.bottom = -24; c.right = c.top = 24; c.near = 1; c.far = 140;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
    scene.add(sun); scene.add(sun.target); K.sun = sun; return sun;
  };
  // Ring of far mountains (two instanced draws: rock and snow caps)
  K.peaks = (n, r0, r1, h0, h1, color, o = {}) => {
    const list = K.ring(n, r0, r1, { free: true, a0: o.a0, a1: o.a1 }).map((p) => { const h = R(h0, h1), w = h * R(o.w0 || 0.9, o.w1 || 1.5); return { x: p.x, z: p.z, y: (o.y || 0) + h / 2 - 1, sx: w, sz: w * R(0.8, 1.2), sy: h, ry: R(0, 6), c: o.colors ? K.pick(o.colors) : null }; });
    const segs = o.segs || 6;
    K.inst(K.cone(1, 1, segs), K.M(o.colors ? 0xffffff : color, { roughness: 1 }), list, { shadow: false });
    if (o.snow) K.inst(K.cone(1, 1, segs), K.M(o.snow, { roughness: 0.9 }), list.map((p) => ({ x: p.x, z: p.z, ry: p.ry, sx: p.sx * 0.32, sz: p.sz * 0.32, sy: p.sy * 0.32, y: p.y + p.sy * 0.34 + 0.05 })), { shadow: false });
    return list;
  };
  // Drifting clouds made of instanced puffs
  K.clouds = (n, o = {}) => {
    const g = K.group(scene), list = [];
    K.ring(n, o.r0 || 60, o.r1 || 140, { free: true }).forEach((p) => {
      const y = R(o.y0 || 28, o.y1 || 45), k = Math.round(R(4, 8)), sz = R(3, 6);
      for (let i = 0; i < k; i++) list.push({ x: p.x + R(-1.3, 1.3) * sz, y: y + R(-0.3, 0.6) * sz * 0.5, z: p.z + R(-0.6, 0.6) * sz, sx: sz * R(0.7, 1.2), sy: sz * R(0.45, 0.7), sz: sz * R(0.7, 1.1) });
    });
    K.inst(K.ico(1, 1), K.M(o.color || 0xffffff, { roughness: 1, emissive: o.color || 0xffffff, emissiveIntensity: o.glow == null ? 0.25 : o.glow }), list, { parent: g, shadow: false });
    K.tick((t) => { g.rotation.y = t * (o.speed || 0.004); });
    return g;
  };
  // A flock of simple birds circling (body + two flapping wings)
  K.flock = (n, o = {}) => {
    const birds = [];
    for (let i = 0; i < n; i++) {
      const b = K.group(scene), m = K.M(o.color || 0x333344), s = o.size || 0.5;
      K.part(b, K.cone(0.12 * s, 0.6 * s, 5), m, [0, 0, 0], [Math.PI / 2, 0, 0], null, true);
      const wings = [-1, 1].map((sd) => { const w = K.group(b); K.part(w, K.box(0.9 * s, 0.03 * s, 0.32 * s), K.M(o.wing || o.color || 0x333344), [sd * 0.45 * s, 0, 0], null, null, true); return w; });
      birds.push({ b, wings, r: R(o.r0 || 10, o.r1 || 25), y: R(o.y0 || 10, o.y1 || 18), ph: R(0, 6), sp: R(0.08, 0.16) * (rnd() < 0.5 ? -1 : 1), cx: o.cx || 0, cz: o.cz == null ? -10 : o.cz });
    }
    K.tick((t) => birds.forEach((q) => {
      const a = q.ph + t * q.sp; q.b.position.set(q.cx + Math.cos(a) * q.r, q.y + Math.sin(t * 0.7 + q.ph) * 0.8, q.cz + Math.sin(a) * q.r);
      q.b.rotation.y = -a - (q.sp > 0 ? 0 : Math.PI); const f = Math.sin(t * 7 + q.ph) * 0.55;
      q.wings[0].rotation.z = f; q.wings[1].rotation.z = -f;
    }));
    return birds;
  };
  // Material that sways in the wind (grass, seaweed, palm fronds): bends more higher up.
  K.swayM = (color, amp, speed, o) => {
    const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, flatShading: true }, o || {}));
    const u = { uT: { value: 0 }, uA: { value: K.calm ? 0 : amp }, uS: { value: speed } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = "uniform float uT; uniform float uA; uniform float uS;\n" + sh.vertexShader.replace("#include <begin_vertex>",
        "#include <begin_vertex>\nfloat ph = 0.0;\n#ifdef USE_INSTANCING\nph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.5;\n#else\nph = modelMatrix[3].x * 0.7 + modelMatrix[3].z * 0.5;\n#endif\nfloat hy = max(position.y, 0.0);\ntransformed.x += sin(uT * uS + ph) * uA * hy;\ntransformed.z += cos(uT * uS * 0.8 + ph) * uA * 0.6 * hy;");
    };
    swayers.push(u); return m;
  };
  // Water surface; waves move the vertices (flat shading makes them sparkle)
  K.water = (o) => {
    const geo = new THREE.PlaneGeometry(o.size || 200, o.size || 200, o.seg || 70, o.seg || 70); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: o.color, roughness: o.rough == null ? 0.15 : o.rough, metalness: 0.1, flatShading: true, transparent: o.opacity != null, opacity: o.opacity == null ? 1 : o.opacity, side: o.side || THREE.FrontSide, depthWrite: o.opacity == null }));
    m.position.set(o.x || 0, o.y || 0, o.z || 0); m.receiveShadow = true; scene.add(m);
    const pos = geo.attributes.position, amp = K.calm ? 0 : (o.amp == null ? 0.08 : o.amp), base = Float32Array.from(pos.array);
    if (amp > 0) K.tick((t) => {
      for (let i = 0; i < pos.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; pos.setY(i, Math.sin(x * 0.35 + t * 1.3) * amp + Math.cos(z * 0.42 + t * 1.1 + x * 0.1) * amp * 0.8); }
      pos.needsUpdate = true;
    });
    return m;
  };
  K.tick = (fn) => tickers.push(fn);
  K.swayers = swayers;
  K.eyes = (p, x, y, z, r) => {
    for (const s of [-1, 1]) {
      K.part(p, K.sph(r, 12, 10), K.S(0xffffff, { roughness: 0.25 }), [s * x, y, z], null, null, true);
      K.part(p, K.sph(r * 0.62, 10, 8), K.S(0x161616, { roughness: 0.15 }), [s * x * 1.02, y + r * 0.05, z + r * 0.5], null, null, true);
      K.part(p, K.sph(r * 0.18, 6, 5), K.B(0xffffff), [s * x * 1.02 + r * 0.2, y + r * 0.3, z + r * 0.95], null, null, true);
    }
  };
  // Generic four-legged animal built along +z (head toward +z). Returns its parts so the idle animation can move them.
  K.quad = (o) => {
    const g = new THREE.Group(), body = K.M(o.color), L = o.len, Wd = o.wid, Hh = o.hgt, by = o.legH + Hh * 0.45;
    K.part(g, K.sph(1, 14, 10), body, [0, by, 0], null, [Wd / 2, Hh / 2, L / 2]);
    if (o.belly) K.part(g, K.sph(1, 12, 8), K.M(o.belly), [0, by - Hh * 0.12, 0], null, [Wd * 0.42, Hh * 0.4, L * 0.42]);
    const legs = [], lh = by - Hh * 0.05;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const lg = K.group(g, [sx * Wd * 0.27, lh, sz * L * 0.3]);
      K.part(lg, K.cyl(o.legR, o.legR * 0.8, lh, 7), K.M(o.legColor || o.color), [0, -lh / 2, 0]);
      if (o.hoof) K.part(lg, K.cyl(o.legR * 0.82, o.legR * 0.95, lh * 0.12, 7), K.M(o.hoof), [0, -lh * 0.94, 0]);
      legs.push(lg);
    }
    const na = o.neckAng == null ? 0.5 : o.neckAng, NL = o.neckLen || 0;
    const nk = K.group(g, [0, by + Hh * (o.neckY == null ? 0.15 : o.neckY), L * 0.42], [na, 0, 0]);
    if (NL > 0) K.part(nk, K.cyl(o.neckR, o.neckR * 1.25, NL, 9), K.M(o.neckColor || o.color), [0, NL / 2, 0]);
    const head = K.group(nk, [0, NL, 0], [-na + (o.headTip || 0), 0, 0]), hr = o.head;
    K.part(head, K.sph(1, 14, 10), K.M(o.headColor || o.color), [0, 0, hr * 0.2], null, [hr * 0.85, hr * 0.8, hr]);
    if (o.snout) K.part(head, K.sph(1, 12, 8), K.M(o.snoutColor || o.headColor || o.color), [0, -hr * 0.25, hr * 0.95], null, [hr * 0.6 * o.snout, hr * 0.48 * o.snout, hr * 0.62 * o.snout]);
    K.eyes(head, hr * 0.42, hr * 0.28, hr * 0.82, hr * (o.eye || 0.17));
    if (o.ears) for (const s of [-1, 1]) {
      if (o.ears === "round") K.part(head, K.sph(hr * 0.28, 10, 8), K.M(o.earColor || o.headColor || o.color), [s * hr * 0.6, hr * 0.68, 0], null, [1, 1, 0.45]);
      else if (o.ears === "flop") K.part(head, K.sph(1, 8, 6), K.M(o.earColor || o.headColor || o.color), [s * hr * 0.85, hr * 0.25, 0], [0, 0, s * 0.5], [hr * 0.45, hr * 0.14, hr * 0.28]);
      else K.part(head, K.cone(hr * 0.24, hr * 0.55, 6), K.M(o.earColor || o.headColor || o.color), [s * hr * 0.5, hr * 0.8, 0], [0, 0, -s * 0.35]);
    }
    let tail = null;
    if (o.tailLen) {
      tail = K.group(g, [0, by + Hh * 0.15, -L * 0.47], [o.tailAng == null ? 0.5 : o.tailAng, 0, 0]);
      K.part(tail, K.cyl(o.tailR || 0.04, (o.tailR || 0.04) * (o.tailTaper == null ? 0.5 : o.tailTaper), o.tailLen, 7), K.M(o.tailColor || o.color), [0, -o.tailLen / 2, 0]);
      if (o.tuft) K.part(tail, K.sph(o.tuft, 8, 6), K.M(o.tuftColor || 0x222222), [0, -o.tailLen, 0], null, [1, 1.6, 1]);
    }
    const P = { g, head, nk, legs, tail, by, hr };
    P.idle = (t) => { head.rotation.y = Math.sin(t * 0.7) * 0.25; head.rotation.z = Math.sin(t * 0.5) * 0.06; if (tail) tail.rotation.z = Math.sin(t * 3.2) * 0.35; };
    return P;
  };
  return K;
}

// ---------------------------------------------------------------- world
TW.create = function (opts) {
  if (!TW.ready()) return null;
  const THREE = S3.THREE, R = S3.getRenderer();
  if (!R) return null;
  const build = TW.builders[opts.scene] || TW.builders[TW.SCENES[0].id];
  if (!build) return null;
  const scene = new THREE.Scene(), B = (opts.bearing || 50) * Math.PI / 180;
  const K = makeKit(THREE, scene, { calm: opts.calm, avoid: [B, -B] });
  const def = build(K) || {};
  const eye = def.eye || 1.6;
  const cam = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 900);
  cam.position.set(0, eye, 0); cam.rotation.order = "YXZ";

  // The things to find. One of each kind is built up front and reused in turn.
  const kinds = (def.spots || []).map((sp) => {
    const made = sp.make(K), model = made.g || made, outer = new THREE.Group(), inner = new THREE.Group();
    inner.add(model); outer.add(inner);
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    inner.position.set(-c.x, -box.min.y, -c.z);
    const d = sp.d || 8, big = Math.max(size.y, size.x * 0.75, size.z * 0.75), s = ((sp.fit || 0.27) * d) / big;
    outer.userData = { s, h: size.y * s, w: Math.max(size.x, size.z) * s };
    outer.visible = false; scene.add(outer);
    return { sp, outer, idle: made.idle || null };
  });
  let cur = null, old = null;
  function place(k, idx, bear) {
    const sp = k.sp, d = sp.d || 8, p = K.at(bear, d), side = Math.sign(bear) || 1;
    const gy = sp.y != null ? sp.y : K.h(p.x, p.z) + (sp.lift || 0);
    k.outer.position.set(p.x, gy, p.z);
    k.outer.rotation.set(0, -bear + (sp.turn == null ? 0.5 : sp.turn) * -side, 0);
    k.outer.visible = true; k.outer.scale.setScalar(0.001);
    return { k, idx, bear, gy, age: 0, cheer: -1, leave: -1, wait: 0 };
  }
  const tmp = new THREE.Vector3();
  const world = {
    kinds: kinds.map((k) => k.sp.name),
    name: (i) => (kinds.length ? kinds[i % kinds.length].sp.name : ""),
    // show spot number `idx` at bearing `deg` (right positive); the previous one leaves after its cheer
    show(idx, deg) {
      if (!kinds.length || (cur && cur.idx === idx)) return;
      if (old) old.k.outer.visible = false;
      old = cur; if (old) old.wait = old.cheer >= 0 ? Math.max(0, 1.2 - old.cheer) : 0.2;
      cur = place(kinds[idx % kinds.length], idx, deg * Math.PI / 180);
    },
    cheer() { if (cur && cur.cheer < 0) cur.cheer = 0; },
    lowQuality(on) { if (K.sun && K.sun.castShadow === on) K.sun.castShadow = !on; },
    frame(W, H, pr, st, t, dt) {
      cam.aspect = W / H; cam.fov = W / H < 1.2 ? 74 : 62; cam.updateProjectionMatrix();
      cam.rotation.set(def.pitch == null ? -0.05 : def.pitch, -(st.view || 0) * Math.PI / 180, 0);
      K.swayers.forEach((u) => { u.uT.value = t; });
      for (const f of K.tickers) f(K.calm ? 0 : t, dt);
      for (const s of [cur, old]) {
        if (!s) continue;
        const o = s.k.outer, base = o.userData.s; s.age += dt;
        let sc = Math.min(1, s.age / 0.7); sc = 1 + 2.2 * Math.pow(sc - 1, 3) + 1.2 * Math.pow(sc - 1, 2); // ease out with a little overshoot
        let y = 0, spin = 0;
        if (s.cheer >= 0) { s.cheer += dt; const u = Math.min(1, s.cheer / 1.1); y = Math.sin(u * Math.PI) * o.userData.h * 0.35; spin = u * Math.PI * 2; }
        if (s === old) {
          if (s.wait > 0) s.wait -= dt; else s.leave = Math.max(0, s.leave) + dt;
          if (s.leave > 0) sc *= Math.max(0, 1 - s.leave / 0.6);
          if (s.leave > 0.6) { o.visible = false; old = null; continue; }
        }
        o.scale.setScalar(Math.max(0.001, base * sc));
        o.position.y = s.gy + y + (s.k.sp.hover && !K.calm ? Math.sin(t * 1.5) * o.userData.h * 0.06 : 0);
        o.rotation.y = -s.bear + (s.k.sp.turn == null ? 0.5 : s.k.sp.turn) * -(Math.sign(s.bear) || 1) + spin;
        if (s.k.idle && !K.calm) s.k.idle(t);
      }
      return S3.renderTo(R, scene, cam, W, H, pr);
    },
    // Where the current spot is on screen: centre, radius in px, and how far it is from the middle of the view (degrees)
    spotScreen(W, H, viewDeg) {
      if (!cur) return null;
      const o = cur.k.outer, h = o.userData.h;
      tmp.set(o.position.x, cur.gy + h * 0.5, o.position.z);
      const v = tmp.clone().project(cam), off = wrap(cur.bear - viewDeg * Math.PI / 180) * 180 / Math.PI;
      const fv = cam.fov * Math.PI / 180, px = (Math.max(h, o.userData.w) * 0.62) / (cur.k.sp.d || 8) / Math.tan(fv / 2) * H / 2;
      return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, r: Math.max(40, px), front: v.z < 1 && Math.abs(v.x) < 1.05, off, name: cur.k.sp.name };
    },
    dispose() { S3.dispose(scene, [K.glow]); },
  };
  return world;
};

TW.kit = makeKit;
RC.Twist3D = TW;
})();
