// The animals and things to find in the Trunk Twist worlds (js/twist3d.js). Each builder takes the
// kit K and returns { g: a three.js Group, idle(t) } with the model's front facing +z, standing on y = 0.
// The world scales every model to the same apparent size, so the sizes here only need to be in proportion.
(() => {
"use strict";
const A = {};
const PI = Math.PI;
const G = (K) => new K.THREE.Group();
const flap = (t, every, sharp) => Math.pow(Math.max(0, Math.sin(t * every)), sharp || 6);

// ---------------------------------------------------------------- jungle
A.monkey = (K) => {
  const g = G(K), fur = K.M(0x6e4326), face = K.M(0xe7c09a);
  K.part(g, K.cyl(0.45, 0.55, 0.6, 10), K.M(0x6b4a2e), [0, 0.3, 0]);
  K.part(g, K.cyl(0.43, 0.43, 0.03, 10), K.M(0xc9a27a), [0, 0.61, 0]);
  const by = 0.62;
  K.part(g, K.sph(1, 12, 10), fur, [0, by + 0.38, 0], null, [0.3, 0.4, 0.26]);
  K.part(g, K.sph(1, 10, 8), face, [0, by + 0.34, 0.12], null, [0.2, 0.28, 0.16]);
  for (const s of [-1, 1]) {
    K.part(g, K.cyl(0.08, 0.08, 0.38, 7), fur, [s * 0.16, by + 0.1, 0.2], [PI / 2, 0, 0]);
    K.part(g, K.sph(0.09, 8, 6), face, [s * 0.16, by + 0.1, 0.42], null, [1, 0.6, 1.3]);
  }
  const head = K.group(g, [0, by + 0.95, 0.02]);
  K.part(head, K.sph(0.27, 14, 10), fur);
  K.part(head, K.sph(1, 12, 10), face, [0, -0.03, 0.15], null, [0.2, 0.19, 0.14]);
  K.part(head, K.sph(1, 10, 8), face, [0, -0.11, 0.22], null, [0.14, 0.08, 0.08]);
  for (const s of [-1, 1]) { K.part(head, K.sph(0.1, 10, 8), fur, [s * 0.27, 0.02, 0], null, [0.5, 1, 1]); K.part(head, K.sph(0.065, 8, 6), face, [s * 0.295, 0.02, 0.01], null, [0.5, 1, 1]); }
  K.eyes(head, 0.08, 0.04, 0.25, 0.055);
  K.part(head, K.tor(0.05, 0.012, 6, 12, PI), K.M(0x3a2010), [0, -0.1, 0.3], [0, 0, PI]);
  const armL = K.group(g, [-0.27, by + 0.62, 0], [-0.4, 0, -0.25]);
  K.part(armL, K.cyl(0.06, 0.06, 0.5, 7), fur, [0, -0.25, 0]); K.part(armL, K.sph(0.07, 8, 6), face, [0, -0.5, 0]);
  const armR = K.group(g, [0.27, by + 0.62, 0], [0, 0, -0.5]);
  K.part(armR, K.cyl(0.06, 0.06, 0.5, 7), fur, [0, 0.25, 0]); K.part(armR, K.sph(0.075, 8, 6), face, [0, 0.52, 0]);
  K.part(g, K.tube([[0, by + 0.15, -0.22], [0.05, by + 0.05, -0.6], [0.15, by + 0.4, -0.85], [0.05, by + 0.7, -0.7]], 0.04, 20, 6), fur);
  return { g, idle: (t) => { armR.rotation.z = -0.5 + Math.sin(t * 6) * 0.35; head.rotation.z = Math.sin(t * 1.3) * 0.12; head.rotation.y = Math.sin(t * 0.6) * 0.2; } };
};

A.parrot = (K) => {
  const g = G(K), wood = K.M(0x6b4a2e), red = K.M(0xd8262b), blue = K.M(0x1e5bd8), yel = K.M(0xf5c518);
  K.part(g, K.cyl(0.05, 0.07, 1.4, 7), wood, [0, 0.7, -0.12]);
  K.part(g, K.cyl(0.05, 0.05, 0.9, 7), wood, [0, 1.42, -0.04], [0, 0, PI / 2]);
  K.part(g, K.cyl(0.25, 0.3, 0.06, 10), wood, [0, 0.03, -0.12]);
  const b = K.group(g, [0, 1.45, 0]);
  K.part(b, K.sph(1, 12, 10), red, [0, 0.3, 0], [-0.25, 0, 0], [0.17, 0.3, 0.17]);
  const head = K.group(b, [0, 0.64, 0.05]);
  K.part(head, K.sph(0.15, 12, 10), red);
  K.part(head, K.sph(1, 10, 8), K.M(0xf4efe6), [0, 0.0, 0.08], null, [0.11, 0.1, 0.08]);
  K.part(head, K.cone(0.06, 0.13, 8), K.M(0xeae2d0), [0, 0.0, 0.17], [PI / 2 + 0.5, 0, 0]);
  K.part(head, K.cone(0.04, 0.08, 8), K.M(0x2a2a2a), [0, -0.05, 0.15], [PI / 2 + 0.9, 0, 0]);
  K.eyes(head, 0.085, 0.035, 0.1, 0.035);
  const wings = [-1, 1].map((s) => {
    const w = K.group(b, [s * 0.15, 0.48, -0.02]);
    K.part(w, K.sph(1, 10, 8), blue, [s * 0.02, -0.14, 0], null, [0.06, 0.24, 0.13]);
    K.part(w, K.sph(1, 10, 8), yel, [s * 0.03, -0.03, 0.01], null, [0.055, 0.11, 0.12]);
    return w;
  });
  K.part(b, K.box(0.1, 0.55, 0.03), blue, [0, -0.06, -0.13], [0.35, 0, 0]);
  K.part(b, K.box(0.06, 0.48, 0.03), red, [0, -0.02, -0.11], [0.3, 0, 0]);
  for (const s of [-1, 1]) K.part(b, K.cyl(0.02, 0.02, 0.1, 5), K.M(0x555555), [s * 0.06, 0.0, 0.03]);
  return { g, idle: (t) => { const f = flap(t, 1.3, 8) * 1.1; wings[0].rotation.z = -f; wings[1].rotation.z = f; head.rotation.y = Math.sin(t * 0.9) * 0.45; head.rotation.x = Math.sin(t * 2.3) * 0.1; } };
};

A.elephant = (K) => {
  const grey = 0x8e8f99;
  const P = K.quad({ len: 2.4, wid: 1.5, hgt: 1.6, legH: 1.0, legR: 0.28, color: grey, head: 0.62, neckLen: 0.15, neckR: 0.5, neckAng: 0.2, neckY: 0.25, tailLen: 0.7, tailR: 0.05, tailAng: 0.3, tuft: 0.07, hoof: 0xd8d0c0, eye: 0.11 });
  const ears = [-1, 1].map((s) => {
    const e = K.group(P.head, [s * 0.5, 0.1, 0.05]);
    K.part(e, K.sph(1, 12, 8), K.M(grey), [s * 0.12, -0.05, -0.15], [0, s * 0.3, 0], [0.1, 0.62, 0.55]);
    K.part(e, K.sph(1, 12, 8), K.M(0xd9a0a0), [s * 0.07, -0.05, -0.08], [0, s * 0.3, 0], [0.06, 0.48, 0.42]);
    return e;
  });
  let seg = K.group(P.head, [0, -0.12, 0.66], [-0.4, 0, 0]); const trunk = [];
  for (let i = 0; i < 6; i++) {
    const r = 0.17 * (1 - i * 0.11);
    if (i) seg = K.group(seg, [0, -0.24, 0], [-0.12, 0, 0]);
    K.part(seg, K.cyl(r, r * 0.92, 0.26, 9), K.M(grey), [0, -0.12, 0]); trunk.push(seg);
  }
  for (const s of [-1, 1]) K.part(P.head, K.cone(0.07, 0.6, 8), K.S(0xf4ecd8), [s * 0.28, -0.42, 0.62], [PI * 0.72, 0, 0]);
  return { g: P.g, idle: (t) => { P.idle(t); trunk.forEach((sg, i) => { sg.rotation.x = (i ? -0.12 : -0.4) + Math.sin(t * 1.2 + i * 0.5) * 0.08; }); ears[0].rotation.y = Math.sin(t * 2) * 0.2; ears[1].rotation.y = -Math.sin(t * 2) * 0.2; } };
};

A.tiger = (K) => {
  const P = K.quad({ len: 1.9, wid: 0.75, hgt: 0.75, legH: 0.55, legR: 0.12, color: 0xe8822a, belly: 0xf6efe0, head: 0.38, neckLen: 0.12, neckR: 0.25, neckAng: 0.9, neckY: 0.2, snout: 0.75, snoutColor: 0xf6efe0, ears: "round", tailLen: 1.0, tailR: 0.06, tailAng: 0.9, tailTaper: 0.8, eye: 0.15, tuft: 0.07, tuftColor: 0x1c1c1c });
  const blk = K.M(0x1c1c1c);
  for (let z = -0.75; z <= 0.76; z += 0.21) {
    const k = Math.sqrt(Math.max(0.05, 1 - (z / 0.95) ** 2)) * 1.03;
    K.part(P.g, K.tor(1, 0.05, 5, 18, PI), blk, [0, P.by, z], [0, 0, 0.12 * Math.sign(z)], [0.375 * k, 0.375 * k, 1]);
  }
  for (const s of [-1, 1]) K.part(P.head, K.box(0.05, 0.14, 0.02), blk, [s * 0.1, 0.24, 0.38], [0, 0, s * 0.4]);
  K.part(P.head, K.sph(0.06, 8, 6), K.M(0xe07a8a), [0, -0.05, 0.62]);
  return { g: P.g, idle: P.idle };
};

A.frog = (K) => {
  const g = G(K), grn = K.M(0x4fbf3a), pale = K.M(0xd9f0a0);
  K.part(g, K.dod(0.7), K.M(0x6f7a68), [0, 0.25, 0], null, [1.2, 0.55, 1]);
  K.part(g, K.dod(0.5), K.M(0x5a8a3a), [0.1, 0.48, -0.1], null, [1.1, 0.25, 0.9]);
  const f = K.group(g, [0, 0.62, 0.05]);
  K.part(f, K.sph(1, 14, 10), grn, [0, 0.25, 0], [-0.3, 0, 0], [0.42, 0.3, 0.45]);
  K.part(f, K.sph(1, 12, 8), pale, [0, 0.2, 0.18], [-0.3, 0, 0], [0.3, 0.2, 0.3]);
  for (const s of [-1, 1]) {
    K.part(f, K.sph(0.13, 12, 10), grn, [s * 0.2, 0.55, 0.15]);
    K.part(f, K.sph(1, 10, 8), grn, [s * 0.36, 0.1, -0.1], null, [0.14, 0.12, 0.3]);
    K.part(f, K.sph(1, 8, 6), K.M(0x3a9a2a), [s * 0.4, 0.03, 0.22], null, [0.1, 0.04, 0.14]);
    K.part(f, K.cyl(0.05, 0.05, 0.25, 6), grn, [s * 0.24, 0.1, 0.3], [0.3, 0, 0]);
  }
  K.eyes(f, 0.2, 0.58, 0.22, 0.085);
  K.part(f, K.tor(0.16, 0.015, 5, 16, PI), K.M(0x2a5a1a), [0, 0.3, 0.38], [0.25, 0, PI]);
  const sac = K.part(f, K.sph(0.15, 10, 8), K.M(0xf2f0b0), [0, 0.13, 0.33]);
  return { g, idle: (t) => { const p = 0.6 + flap(t, 1.6, 4) * 0.7; sac.scale.setScalar(p); } };
};

// ---------------------------------------------------------------- dinosaurs
A.trex = (K) => {
  const g = G(K), c = K.M(0x5d8a3a), belly = K.M(0xc9d18a), dark = K.M(0x3f6a28);
  K.part(g, K.sph(1, 14, 10), c, [0, 2.0, 0], [-0.3, 0, 0], [0.7, 0.78, 1.25]);
  K.part(g, K.sph(1, 12, 8), belly, [0, 1.85, 0.35], [-0.3, 0, 0], [0.55, 0.6, 0.85]);
  for (const s of [-1, 1]) {
    K.part(g, K.sph(1, 10, 8), c, [s * 0.5, 1.6, -0.15], null, [0.33, 0.62, 0.45]);
    K.part(g, K.cyl(0.17, 0.12, 1.05, 8), c, [s * 0.55, 0.7, -0.05], [0.18, 0, 0]);
    K.part(g, K.box(0.32, 0.14, 0.6), dark, [s * 0.55, 0.07, 0.12]);
    for (const k of [-1, 0, 1]) K.part(g, K.cone(0.04, 0.14, 5), K.M(0xeeeedd), [s * 0.55 + k * 0.1, 0.07, 0.45], [PI / 2, 0, 0]);
  }
  const tail = K.group(g, [0, 2.0, -1.0]);
  K.part(tail, K.cone(0.55, 3.2, 10), c, [0, -0.2, -1.5], [-PI / 2 - 0.13, 0, 0]);
  K.part(g, K.cyl(0.32, 0.42, 0.9, 9), c, [0, 2.6, 0.95], [0.6, 0, 0]);
  const head = K.group(g, [0, 3.05, 1.3]);
  K.part(head, K.sph(1, 12, 10), c, [0, 0, 0.3], null, [0.45, 0.42, 0.72]);
  K.part(head, K.sph(1, 12, 8), c, [0, -0.04, 0.78], null, [0.36, 0.27, 0.5]);
  K.part(head, K.box(0.5, 0.08, 0.3), dark, [0, 0.33, 0.35]);
  const jaw = K.group(head, [0, -0.17, 0.1]);
  K.part(jaw, K.sph(1, 12, 8), belly, [0, -0.07, 0.5], null, [0.33, 0.13, 0.62]);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) K.part(head, K.cone(0.03, 0.1, 5), K.S(0xffffff), [s * (0.27 - i * 0.025), -0.27, 0.45 + i * 0.12], [PI, 0, 0]);
  K.eyes(head, 0.32, 0.17, 0.45, 0.1);
  for (const s of [-1, 1]) { const arm = K.group(g, [s * 0.45, 1.95, 0.75], [1.0, 0, 0]); K.part(arm, K.cyl(0.07, 0.05, 0.4, 6), c, [0, -0.2, 0]); }
  return { g, idle: (t) => { jaw.rotation.x = flap(t, 1.4, 3) * 0.4; head.rotation.y = Math.sin(t * 0.6) * 0.25; tail.rotation.y = Math.sin(t * 1.1) * 0.18; } };
};

A.longneck = (K) => {
  const P = K.quad({ len: 3.2, wid: 1.6, hgt: 1.6, legH: 1.3, legR: 0.32, color: 0x7f9a6a, belly: 0xb9c79b, head: 0.34, neckLen: 3.4, neckR: 0.24, neckAng: 0.45, neckY: 0.25, tailLen: 3.8, tailR: 0.4, tailAng: 1.25, tailTaper: 0.12, eye: 0.17, snout: 0.8 });
  for (let i = 0; i < 7; i++) K.part(P.g, K.sph(0.18, 8, 6), K.M(0x5f7a4f), [K.R(-0.4, 0.4), P.by + 0.68, K.R(-1.1, 1.1)], null, [1, 0.35, 1.3]);
  return { g: P.g, idle: (t) => { P.nk.rotation.x = 0.45 + Math.sin(t * 0.5) * 0.08; P.head.rotation.y = Math.sin(t * 0.8) * 0.3; if (P.tail) P.tail.rotation.z = Math.sin(t * 1.2) * 0.2; } };
};

A.triceratops = (K) => {
  const P = K.quad({ len: 2.4, wid: 1.3, hgt: 1.2, legH: 0.7, legR: 0.24, color: 0x9c6b3e, belly: 0xd8b98a, head: 0.55, neckLen: 0.12, neckR: 0.4, neckAng: 1.1, neckY: 0.1, headTip: 0.15, snout: 0.8, tailLen: 1.5, tailR: 0.3, tailAng: 1.2, tailTaper: 0.2, eye: 0.13 });
  K.part(P.head, K.cyl(0.95, 0.95, 0.1, 14), K.M(0xc8873e), [0, 0.45, -0.25], [-0.45, 0, 0]);
  for (let i = 0; i < 9; i++) { const a = PI * (0.1 + 0.8 * i / 8); K.part(P.head, K.cone(0.09, 0.22, 5), K.M(0x6b4423), [Math.cos(a) * 0.95, 0.45 + Math.sin(a) * 0.86, -0.25 - Math.sin(a) * 0.4], [-0.45, 0, a - PI / 2]); }
  for (const s of [-1, 1]) K.part(P.head, K.cone(0.09, 0.85, 8), K.S(0xf2e8d0), [s * 0.25, 0.42, 0.5], [1.15, 0, 0]);
  K.part(P.head, K.cone(0.08, 0.35, 8), K.S(0xf2e8d0), [0, 0.05, 1.05], [0.8, 0, 0]);
  return { g: P.g, idle: P.idle };
};

A.stego = (K) => {
  const P = K.quad({ len: 2.6, wid: 1.1, hgt: 1.3, legH: 0.75, legR: 0.22, color: 0x6e8f4e, belly: 0xb5c48a, head: 0.3, neckLen: 0.55, neckR: 0.2, neckAng: 1.75, neckY: -0.05, snout: 0.8, tailLen: 1.9, tailR: 0.28, tailAng: 1.3, tailTaper: 0.15, eye: 0.17 });
  const plate = K.M(0xd0603a);
  for (let i = 0; i < 9; i++) {
    const z = -1.15 + i * 0.29, k = Math.sqrt(Math.max(0, 1 - (z / 1.3) ** 2)), h = 0.32 + 0.38 * Math.sin(PI * (i + 0.5) / 9);
    K.part(P.g, K.box(0.06, h, h), plate, [(i % 2 ? 0.09 : -0.09), P.by + 0.65 * k + h * 0.15, z], [PI / 4, 0, 0]);
  }
  if (P.tail) for (const s of [-1, 1]) for (const y of [1.4, 1.7]) K.part(P.tail, K.cone(0.06, 0.5, 6), K.S(0xf2e8d0), [s * 0.15, -y, 0], [0, 0, -s * 1.2]);
  return { g: P.g, idle: P.idle };
};

A.babydino = (K) => {
  const g = G(K), straw = K.M(0x8a6a3a), shell = K.S(0xf4ecd8);
  K.part(g, K.tor(0.75, 0.24, 6, 14), straw, [0, 0.2, 0], [PI / 2, 0, 0]);
  K.part(g, K.cyl(0.8, 0.8, 0.12, 12), K.M(0x6e5530), [0, 0.06, 0]);
  for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; K.part(g, K.cyl(0.02, 0.02, 0.7, 4), straw, [Math.cos(a) * 0.8, 0.3, Math.sin(a) * 0.8], [K.R(-1, 1), a, K.R(1.2, 1.8)]); }
  for (const [x, z] of [[-0.42, -0.25], [0.4, -0.3]]) { const e = K.group(g, [x, 0.42, z], [0, 0, x * 0.4]); K.part(e, K.sph(1, 14, 10), shell, null, null, [0.26, 0.36, 0.26]); for (let i = 0; i < 5; i++) K.part(e, K.sph(0.045, 6, 4), K.M(0x9ab06a), [K.R(-0.2, 0.2), K.R(-0.2, 0.25), 0.22], null, [1, 1, 0.4]); }
  const cup = K.group(g, [0, 0.3, 0.12]);
  K.part(cup, K.hemi(1, 14), shell, [0, 0.12, 0], [PI, 0, 0], [0.34, 0.36, 0.34]);
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; K.part(cup, K.cone(0.06, 0.12, 4), shell, [Math.cos(a) * 0.31, 0.16, Math.sin(a) * 0.31]); }
  const baby = K.group(cup, [0, 0.12, 0]), c = K.M(0x7fcf5a);
  K.part(baby, K.sph(1, 12, 10), c, [0, 0.25, 0], null, [0.24, 0.3, 0.22]);
  const head = K.group(baby, [0, 0.62, 0.05]);
  K.part(head, K.sph(0.24, 14, 10), c);
  K.part(head, K.sph(1, 10, 8), c, [0, -0.06, 0.18], null, [0.17, 0.12, 0.14]);
  K.eyes(head, 0.11, 0.06, 0.17, 0.075);
  K.part(head, K.hemi(1, 12), shell, [0.04, 0.14, -0.02], [0, 0, 0.35], [0.2, 0.16, 0.2]);
  for (const s of [-1, 1]) K.part(baby, K.cyl(0.04, 0.03, 0.18, 6), c, [s * 0.2, 0.35, 0.12], [1.1, 0, -s * 0.3]);
  return { g, idle: (t) => { baby.position.y = 0.12 + Math.abs(Math.sin(t * 2.4)) * 0.08; head.rotation.z = Math.sin(t * 1.3) * 0.25; } };
};

// ---------------------------------------------------------------- space
A.astronaut = (K) => {
  const g = G(K), suit = K.S(0xf2f2f0, { roughness: 0.6 }), grey = K.M(0x9aa0a8), visor = K.S(0xd8a840, { metalness: 0.9, roughness: 0.15, emissive: 0x402a00 });
  for (const s of [-1, 1]) { K.part(g, K.cyl(0.13, 0.12, 0.7, 10), suit, [s * 0.15, 0.45, 0]); K.part(g, K.box(0.22, 0.14, 0.34), grey, [s * 0.15, 0.07, 0.05]); }
  K.part(g, K.cyl(0.3, 0.27, 0.75, 12), suit, [0, 1.15, 0]);
  K.part(g, K.box(0.24, 0.2, 0.04), K.M(0x3a6fd8), [0, 1.22, 0.29]);
  K.part(g, K.sph(0.035, 8, 6), K.E(0xff4040), [0.07, 1.25, 0.31]); K.part(g, K.sph(0.035, 8, 6), K.E(0x40ff60), [-0.05, 1.25, 0.31]);
  K.part(g, K.box(0.5, 0.65, 0.25), K.M(0xdcdcd8), [0, 1.2, -0.3]);
  const head = K.group(g, [0, 1.78, 0]);
  K.part(head, K.sph(0.3, 18, 14), suit);
  K.part(head, K.sph(1, 18, 12), visor, [0, 0.02, 0.12], null, [0.24, 0.2, 0.2]);
  K.part(head, K.cyl(0.02, 0.02, 0.3, 5), grey, [0.2, 0.3, -0.05]); K.part(head, K.sph(0.04, 8, 6), K.E(0xff5050), [0.2, 0.46, -0.05]);
  K.part(g, K.tor(0.24, 0.05, 8, 18), grey, [0, 1.53, 0], [PI / 2, 0, 0]);
  const armL = K.group(g, [-0.36, 1.45, 0], [0, 0, -0.25]); K.part(armL, K.cyl(0.1, 0.09, 0.6, 8), suit, [0, -0.3, 0]); K.part(armL, K.sph(0.11, 8, 6), grey, [0, -0.62, 0]);
  const armR = K.group(g, [0.36, 1.45, 0], [0, 0, -0.6]); K.part(armR, K.cyl(0.1, 0.09, 0.6, 8), suit, [0, 0.3, 0]); K.part(armR, K.sph(0.11, 8, 6), grey, [0, 0.62, 0]);
  return { g, idle: (t) => { armR.rotation.z = -0.6 + Math.sin(t * 5) * 0.35; head.rotation.y = Math.sin(t * 0.7) * 0.2; g.position.y = Math.sin(t * 1.2) * 0.06; } };
};

A.rocket = (K) => {
  const g = G(K), white = K.S(0xf4f4f6, { roughness: 0.35 }), red = K.S(0xe0322c, { roughness: 0.35 });
  K.part(g, K.cyl(1.1, 1.3, 0.25, 16), K.M(0x6a6e78), [0, 0.12, 0]);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; K.part(g, K.cyl(0.05, 0.05, 0.9, 6), K.M(0x8a8e98), [Math.cos(a) * 0.95, 0.6, Math.sin(a) * 0.95]); }
  const body = K.group(g, [0, 0.55, 0]);
  K.part(body, K.lathe([[0.001, 0], [0.42, 0.05], [0.5, 0.6], [0.5, 2.6], [0.42, 3.3], [0.001, 3.32]], 20), white, [0, 0.35, 0]);
  K.part(body, K.lathe([[0.001, 0], [0.43, 0], [0.3, 0.55], [0.001, 0.9]], 20), red, [0, 3.6, 0]);
  K.part(body, K.cone(0.38, 0.4, 16), K.M(0x55585f), [0, 0.2, 0], [PI, 0, 0]);
  K.part(body, K.tor(0.17, 0.04, 8, 20), K.S(0xb8bcc4, { metalness: 0.8 }), [0, 2.5, 0.49]);
  K.part(body, K.circle(0.16, 20), K.S(0x5ab8ff, { emissive: 0x1a4a7a }), [0, 2.5, 0.5]);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2; K.part(body, K.box(0.06, 0.9, 0.55), red, [Math.sin(a) * 0.55, 0.85, Math.cos(a) * 0.55], [0, a, 0]); }
  K.part(body, K.cyl(0.505, 0.505, 0.2, 20), red, [0, 1.6, 0]);
  const flame = K.sprite(0xff9a30, 1.6, [0, 0.0, 0], 0.9, body);
  return { g, idle: (t) => { flame.scale.set(1.2 + Math.sin(t * 20) * 0.15, 1.8 + Math.sin(t * 13) * 0.3, 1); body.position.y = 0.55 + Math.sin(t * 30) * 0.008; } };
};

A.alien = (K) => {
  const g = G(K), skin = K.S(0x6fdc5a, { roughness: 0.35 }), dark = K.S(0x0a0a12, { roughness: 0.05 });
  for (const s of [-1, 1]) { K.part(g, K.cyl(0.08, 0.07, 0.5, 8), skin, [s * 0.14, 0.25, 0]); K.part(g, K.sph(1, 10, 8), skin, [s * 0.15, 0.03, 0.06], null, [0.11, 0.05, 0.16]); }
  K.part(g, K.sph(1, 14, 12), skin, [0, 0.82, 0], null, [0.3, 0.42, 0.26]);
  K.part(g, K.sph(1, 12, 10), K.S(0xb6f0a4), [0, 0.78, 0.1], null, [0.2, 0.28, 0.18]);
  const head = K.group(g, [0, 1.48, 0]);
  K.part(head, K.sph(1, 18, 14), skin, null, null, [0.42, 0.36, 0.36]);
  for (const s of [-1, 1]) K.part(head, K.sph(1, 14, 10), dark, [s * 0.17, 0.02, 0.27], [0, 0, s * 0.45], [0.13, 0.08, 0.08]);
  K.part(head, K.tor(0.06, 0.012, 5, 14, PI), K.M(0x2a6a20), [0, -0.17, 0.3], [0.2, 0, PI]);
  const ants = [-1, 1].map((s) => { const a = K.group(head, [s * 0.15, 0.3, 0], [0, 0, -s * 0.3]); K.part(a, K.cyl(0.015, 0.015, 0.35, 5), skin, [0, 0.17, 0]); K.part(a, K.sph(0.06, 10, 8), K.E(0xfff060), [0, 0.37, 0]); return a; });
  const arms = [-1, 1].map((s) => { const a = K.group(g, [s * 0.27, 1.05, 0], [0, 0, s * 0.5]); K.part(a, K.cyl(0.05, 0.045, 0.5, 7), skin, [0, -0.25, 0]); K.part(a, K.sph(0.07, 8, 6), skin, [0, -0.52, 0]); return a; });
  return { g, idle: (t) => { g.position.y = Math.abs(Math.sin(t * 2.6)) * 0.12; ants.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * (0.3 + Math.sin(t * 4 + i) * 0.2); }); arms[1].rotation.z = 2.6 + Math.sin(t * 6) * 0.4; } };
};

A.ufo = (K) => {
  const g = G(K), metal = K.S(0xc8ccd6, { metalness: 0.85, roughness: 0.25 });
  const s = K.group(g, [0, 1.6, 0]);
  K.part(s, K.lathe([[0.001, -0.25], [0.7, -0.22], [1.6, 0], [0.8, 0.22], [0.001, 0.25]], 28), metal);
  const dome = K.part(s, K.hemi(0.62, 20), K.S(0x8ff6ff, { transparent: true, opacity: 0.55, emissive: 0x1a6a70, roughness: 0.05 }), [0, 0.2, 0]);
  dome.castShadow = false;
  const pilot = K.group(s, [0, 0.2, 0]); K.part(pilot, K.sph(0.22, 12, 10), K.S(0x6fdc5a), [0, 0.22, 0]); K.eyes(pilot, 0.08, 0.27, 0.17, 0.06);
  const lights = [];
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2, m = new K.THREE.MeshStandardMaterial({ color: i % 2 ? 0xffe14a : 0x4affc8, emissive: i % 2 ? 0xffe14a : 0x4affc8, emissiveIntensity: 1 }); lights.push(m); K.part(s, K.sph(0.08, 8, 6), m, [Math.cos(a) * 1.25, 0.02, Math.sin(a) * 1.25], null, null, true); }
  const beam = K.part(g, K.cyl(0.55, 1.1, 1.4, 20, true), new K.THREE.MeshBasicMaterial({ color: 0x9affd8, transparent: true, opacity: 0.22, blending: K.THREE.AdditiveBlending, depthWrite: false }), [0, 0.7, 0], null, null, true);
  return { g, idle: (t) => { s.rotation.y = t * 1.2; lights.forEach((m, i) => { m.emissiveIntensity = 0.3 + 1.2 * ((Math.floor(t * 6) + i) % 3 === 0 ? 1 : 0); }); beam.material.opacity = 0.16 + Math.sin(t * 3) * 0.06; } };
};

A.satellite = (K) => {
  const g = G(K), gold = K.S(0xd4a537, { metalness: 0.9, roughness: 0.3 });
  const panelTex = K.tex(128, 64, (c, w, h) => { c.fillStyle = "#16306e"; c.fillRect(0, 0, w, h); c.strokeStyle = "#7fa8ff"; c.lineWidth = 2; for (let x = 0; x <= w; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } });
  const panel = new K.THREE.MeshStandardMaterial({ map: panelTex, metalness: 0.6, roughness: 0.3 });
  const s = K.group(g, [0, 1.2, 0]);
  K.part(s, K.box(0.7, 0.8, 0.7), gold);
  for (const d of [-1, 1]) { K.part(s, K.cyl(0.03, 0.03, 0.5, 6), K.M(0x9aa0a8), [d * 0.6, 0, 0], [0, 0, PI / 2]); K.part(s, K.box(1.6, 0.04, 0.7), panel, [d * 1.65, 0, 0]); }
  K.part(s, K.lathe([[0.001, 0], [0.3, 0.08], [0.5, 0.25]], 18), K.S(0xf0f0f0), [0, 0.42, 0.1], [0.4, 0, 0]);
  K.part(s, K.cyl(0.015, 0.015, 0.5, 5), K.M(0x9aa0a8), [0, 0.6, 0.25], [0.4, 0, 0]);
  const blink = K.part(s, K.sph(0.05, 8, 6), K.E(0xff3030), [0.3, 0.45, 0.3]);
  return { g, idle: (t) => { s.rotation.y = Math.sin(t * 0.4) * 0.6; s.rotation.z = Math.sin(t * 0.3) * 0.15; blink.visible = Math.sin(t * 5) > 0; } };
};

// ---------------------------------------------------------------- ocean
A.turtle = (K) => {
  const g = G(K), skin = K.M(0x8aa86a), shell = K.M(0x6b5a2a);
  const b = K.group(g, [0, 0.4, 0]);
  K.part(b, K.hemi(1, 14), shell, [0, 0, 0], null, [0.75, 0.42, 0.9]);
  K.part(b, K.sph(1, 12, 6), K.M(0xd8c890), [0, 0, 0], null, [0.72, 0.1, 0.86]);
  for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2, r = i ? 0.42 : 0; K.part(b, K.sph(0.2, 7, 5), K.M(0x8a7234), [Math.cos(a) * r, i ? 0.27 : 0.4, Math.sin(a) * r * 1.15], null, [1, 0.4, 1]); }
  const head = K.group(b, [0, 0.08, 0.9]);
  K.part(head, K.sph(1, 12, 10), skin, [0, 0.04, 0.12], null, [0.2, 0.18, 0.26]);
  K.eyes(head, 0.13, 0.1, 0.22, 0.06);
  const fl = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
    const f = K.group(b, [sx * 0.6, 0, sz * 0.55]);
    K.part(f, K.sph(1, 10, 6), skin, [sx * 0.3, 0, sz * 0.1], [0, sx * sz * 0.6, 0], sz > 0 ? [0.42, 0.06, 0.16] : [0.22, 0.05, 0.12]);
    return f;
  });
  return { g, idle: (t) => { fl.forEach((f, i) => { f.rotation.z = Math.sin(t * 2.2 + (i % 2) * PI) * 0.4; }); head.rotation.y = Math.sin(t * 0.8) * 0.25; b.position.y = 0.4 + Math.sin(t * 1.1) * 0.08; } };
};

A.octopus = (K) => {
  const g = G(K), c = K.M(0xc8486a), pale = K.M(0xf0a8b8);
  K.part(g, K.dod(0.8), K.M(0x7a7f86), [0, 0.3, -0.1], null, [1.3, 0.55, 1]);
  const o = K.group(g, [0, 0.62, 0]);
  K.part(o, K.sph(1, 16, 12), c, [0, 0.75, -0.1], [-0.35, 0, 0], [0.48, 0.62, 0.5]);
  K.eyes(o, 0.2, 0.55, 0.32, 0.1);
  const arms = [];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * PI * 2 + PI / 8; let seg = K.group(o, [Math.sin(a) * 0.3, 0.3, Math.cos(a) * 0.3], [0, a, 0]); const chain = [];
    for (let k = 0; k < 6; k++) {
      const r = 0.12 * (1 - k * 0.14);
      if (k) seg = K.group(seg, [0, 0, 0.2]);
      K.part(seg, K.sph(r, 8, 6), k % 2 ? pale : c, [0, 0, 0.1], null, [1, 0.8, 1.4]); chain.push(seg);
    }
    arms.push(chain);
  }
  return { g, idle: (t) => { arms.forEach((ch, i) => ch.forEach((s, k) => { s.rotation.x = (k ? -0.25 : 0.25) + Math.sin(t * 2 + i + k * 0.6) * 0.18; })); o.position.y = Math.sin(t * 1.4) * 0.05; } };
};

A.clownfish = (K) => {
  const g = G(K);
  K.part(g, K.dod(0.5), K.M(0x8a8478), [0, 0.2, 0], null, [1.2, 0.5, 1]);
  const tm = K.swayM(0xb85ad8, 0.25, 2.2);
  const list = []; for (let i = 0; i < 40; i++) { const a = K.R(0, PI * 2), r = K.R(0, 0.45); list.push({ x: Math.cos(a) * r, y: 0.38, z: Math.sin(a) * r, rx: K.R(-0.4, 0.4), rz: K.R(-0.4, 0.4), s: K.R(0.7, 1.1) }); }
  const anem = new K.THREE.InstancedMesh(K.blade(0.05, 0.7, 5), tm, list.length); list.forEach((p, i) => K.setInst(anem, i, p)); anem.castShadow = true; g.add(anem);
  const f = K.group(g, [0, 1.25, 0]), org = K.M(0xff7a1a), wht = K.S(0xffffff), blk = K.M(0x1a1a1a);
  K.part(f, K.sph(1, 14, 10), org, [0, 0, 0], null, [0.22, 0.32, 0.5]);
  for (const z of [0.22, -0.08, -0.34]) { const k = Math.sqrt(Math.max(0.1, 1 - (z / 0.5) ** 2)) * 1.02; K.part(f, K.tor(1, 0.08, 5, 18), wht, [0, 0, z], null, [0.22 * k, 0.32 * k, 0.6]); }
  const tail = K.group(f, [0, 0, -0.48]); K.part(tail, K.sph(1, 8, 6), org, [0, 0, -0.12], null, [0.04, 0.25, 0.14]);
  K.part(f, K.sph(1, 8, 6), org, [0, 0.32, -0.05], null, [0.03, 0.12, 0.25]);
  for (const s of [-1, 1]) K.part(f, K.sph(1, 8, 6), org, [s * 0.2, -0.1, 0.12], [0, s * 0.5, 0], [0.03, 0.08, 0.14]);
  K.eyes(f, 0.12, 0.08, 0.36, 0.07);
  return { g, idle: (t) => { f.position.set(Math.sin(t * 0.9) * 0.25, 1.25 + Math.sin(t * 1.7) * 0.1, Math.cos(t * 0.9) * 0.1); f.rotation.y = Math.cos(t * 0.9) * 0.6; tail.rotation.y = Math.sin(t * 9) * 0.5; } };
};

A.jellyfish = (K) => {
  const g = G(K), bell = new K.THREE.MeshStandardMaterial({ color: 0xff9ad8, emissive: 0xb03a8a, emissiveIntensity: 0.6, transparent: true, opacity: 0.75, roughness: 0.2 });
  const j = K.group(g, [0, 1.6, 0]);
  const b = K.part(j, K.hemi(0.6, 20), bell, null, null, [1, 0.8, 1]);
  K.part(j, K.sph(0.3, 12, 8), K.E(0xffd0f0), [0, 0.12, 0], null, [1, 0.6, 1], true);
  K.eyes(j, 0.18, 0.18, 0.5, 0.07);
  const tm = new K.THREE.MeshStandardMaterial({ color: 0xffc0e8, emissive: 0x803070, transparent: true, opacity: 0.7 }), tent = [];
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2, r = i % 2 ? 0.45 : 0.2; const tg = K.group(j, [Math.cos(a) * r, 0, Math.sin(a) * r]); K.part(tg, K.tube([[0, 0, 0], [0.06, -0.4, 0], [-0.05, -0.8, 0.03], [0.04, -1.25, 0]], i % 2 ? 0.018 : 0.04, 16, 5), tm, null, null, null, true); tent.push(tg); }
  return { g, idle: (t) => { const p = Math.sin(t * 2.4); b.scale.set(1 + p * 0.08, 0.8 - p * 0.1, 1 + p * 0.08); j.position.y = 1.6 + Math.sin(t * 1.2) * 0.15; tent.forEach((q, i) => { q.rotation.x = Math.sin(t * 2 + i) * 0.15; q.rotation.z = Math.cos(t * 1.7 + i) * 0.15; }); } };
};

A.crab = (K) => {
  const g = G(K), red = K.M(0xe0482a), pale = K.M(0xf4a070);
  K.part(g, K.sph(1, 14, 10), red, [0, 0.42, 0], null, [0.55, 0.26, 0.42]);
  for (let i = 0; i < 6; i++) { const s = i < 3 ? -1 : 1, z = -0.2 + (i % 3) * 0.17; const l = K.group(g, [s * 0.45, 0.38, z], [0, 0, s * 0.9]); K.part(l, K.cyl(0.04, 0.03, 0.45, 5), red, [0, -0.22, 0]); }
  const claws = [-1, 1].map((s) => {
    const c = K.group(g, [s * 0.5, 0.48, 0.3], [0, -s * 0.5, 0]);
    K.part(c, K.cyl(0.06, 0.05, 0.3, 6), red, [0, 0, 0.12], [PI / 2, 0, 0]);
    K.part(c, K.sph(1, 10, 8), red, [0, 0.05, 0.4], null, [0.15, 0.18, 0.22]);
    const pin = K.group(c, [0, 0.12, 0.52]); K.part(pin, K.cone(0.07, 0.25, 6), pale, [0, 0, 0.1], [PI / 2, 0, 0]);
    K.part(c, K.cone(0.07, 0.25, 6), pale, [0, -0.03, 0.62], [PI / 2, 0, 0]);
    return pin;
  });
  for (const s of [-1, 1]) { K.part(g, K.cyl(0.02, 0.02, 0.25, 5), red, [s * 0.15, 0.7, 0.25]); }
  K.eyes(g, 0.15, 0.85, 0.25, 0.08);
  K.part(g, K.tor(0.08, 0.015, 5, 12, PI), K.M(0x5a1a10), [0, 0.42, 0.42], [0, 0, PI]);
  return { g, idle: (t) => { claws.forEach((c, i) => { c.rotation.x = -Math.abs(Math.sin(t * 3 + i)) * 0.5; }); g.rotation.z = Math.sin(t * 2) * 0.05; } };
};

// ---------------------------------------------------------------- farm
A.cow = (K) => {
  const P = K.quad({ len: 1.9, wid: 0.9, hgt: 0.95, legH: 0.75, legR: 0.12, color: 0xf4f1ea, hoof: 0x333333, head: 0.36, neckLen: 0.25, neckR: 0.25, neckAng: 1.0, neckY: 0.1, snout: 0.85, snoutColor: 0xf2b5b0, ears: "flop", tailLen: 0.8, tailR: 0.035, tailAng: 0.15, tuft: 0.07, eye: 0.15 });
  const blk = K.M(0x232323);
  for (const [x, y, z, s] of [[0.42, 0.1, 0.3, 0.3], [-0.42, 0.05, -0.2, 0.36], [0.4, 0.15, -0.5, 0.22], [-0.38, 0.2, 0.45, 0.2], [0, 0.45, -0.1, 0.3]]) K.part(P.g, K.sph(1, 10, 8), blk, [x, P.by + y, z], null, [x ? 0.08 : s, x ? s : 0.06, s]);
  for (const s of [-1, 1]) K.part(P.head, K.cone(0.05, 0.22, 6), K.S(0xf0e6c8), [s * 0.2, 0.32, 0.05], [0, 0, -s * 0.6]);
  K.part(P.g, K.sph(0.16, 10, 8), K.M(0xf2b5b0), [0, P.by - 0.42, -0.35]);
  K.part(P.nk, K.cyl(0.04, 0.04, 0.02, 6), K.M(0xd8a020), [0, 0.05, 0.25]);
  const bell = K.part(P.nk, K.cone(0.08, 0.14, 8), K.S(0xd8b030, { metalness: 0.8 }), [0, -0.05, 0.28]);
  return { g: P.g, idle: (t) => { P.idle(t); bell.rotation.z = Math.sin(t * 3) * 0.3; } };
};

A.sheep = (K) => {
  const dk = 0x2b2b2b;
  const P = K.quad({ len: 1.3, wid: 0.9, hgt: 0.85, legH: 0.42, legR: 0.07, color: 0xf4f2ec, legColor: dk, headColor: dk, head: 0.25, neckLen: 0.12, neckR: 0.18, neckAng: 0.9, snout: 0.75, ears: "flop", earColor: dk, eye: 0.2, tailLen: 0.18, tailR: 0.08 });
  const wool = K.M(0xf8f6f0);
  for (let i = 0; i < 16; i++) { const a = K.R(0, PI * 2), z = K.R(-0.55, 0.55); K.part(P.g, K.ico(0.2, 1), wool, [Math.cos(a) * 0.42, P.by + Math.abs(Math.sin(a)) * 0.38, z]); }
  K.part(P.head, K.ico(0.13, 1), wool, [0, 0.22, 0.05]);
  return { g: P.g, idle: P.idle };
};

A.pig = (K) => {
  const pink = 0xf3a7a8;
  const P = K.quad({ len: 1.3, wid: 0.85, hgt: 0.8, legH: 0.32, legR: 0.09, color: pink, hoof: 0x8a5a5a, head: 0.36, neckLen: 0.02, neckR: 0.3, neckAng: 0.1, neckY: 0.05, eye: 0.15, tailLen: 0.01 });
  K.part(P.head, K.cyl(0.15, 0.16, 0.14, 14), K.M(0xf08890), [0, -0.07, 0.4], [PI / 2, 0, 0]);
  for (const s of [-1, 1]) { K.part(P.head, K.sph(0.035, 6, 5), K.M(0x8a3a4a), [s * 0.055, -0.07, 0.48]); K.part(P.head, K.cone(0.1, 0.2, 5), K.M(0xf090a0), [s * 0.22, 0.3, 0.12], [0.6, 0, -s * 0.3]); }
  K.part(P.g, K.tor(0.07, 0.02, 5, 12, PI * 1.6), K.M(pink), [0, P.by + 0.15, -0.67], [0, PI / 2, 0]);
  K.part(P.g, K.cyl(0.9, 0.9, 0.04, 16), K.M(0x6a4a2e, { roughness: 0.4 }), [0, 0.02, 0], null, [1.1, 1, 1.3]);
  return { g: P.g, idle: P.idle };
};

A.chicken = (K) => {
  const g = G(K), w = K.M(0xfaf6ee), y = K.M(0xf5b324), red = K.M(0xe02a2a);
  for (const s of [-1, 1]) { K.part(g, K.cyl(0.025, 0.025, 0.35, 5), y, [s * 0.1, 0.17, 0]); K.part(g, K.box(0.12, 0.02, 0.14), y, [s * 0.1, 0.01, 0.04]); }
  const b = K.group(g, [0, 0.35, 0]);
  K.part(b, K.sph(1, 14, 10), w, [0, 0.25, 0], null, [0.3, 0.3, 0.4]);
  K.part(b, K.sph(1, 10, 8), w, [0, 0.42, -0.35], [-0.6, 0, 0], [0.18, 0.28, 0.12]);
  for (const s of [-1, 1]) K.part(b, K.sph(1, 10, 8), K.M(0xece4d4), [s * 0.28, 0.27, -0.03], null, [0.06, 0.2, 0.3]);
  const head = K.group(b, [0, 0.58, 0.28]);
  K.part(head, K.sph(0.17, 12, 10), w);
  for (let i = 0; i < 3; i++) K.part(head, K.sph(0.06, 8, 6), red, [0, 0.17, -0.06 + i * 0.07]);
  K.part(head, K.cone(0.05, 0.12, 6), y, [0, -0.01, 0.2], [PI / 2, 0, 0]);
  K.part(head, K.sph(1, 8, 6), red, [0, -0.1, 0.13], null, [0.04, 0.07, 0.04]);
  K.eyes(head, 0.1, 0.04, 0.11, 0.045);
  const chicks = [[-0.6, 0.2], [0.55, 0.35], [0.3, 0.7]].map(([x, z]) => { const c = K.group(g, [x, 0, z]); K.part(c, K.sph(0.13, 10, 8), K.M(0xffe24a), [0, 0.13, 0]); K.part(c, K.sph(0.09, 10, 8), K.M(0xffe24a), [0, 0.28, 0.06]); K.part(c, K.cone(0.025, 0.06, 5), y, [0, 0.27, 0.16], [PI / 2, 0, 0]); K.eyes(c, 0.045, 0.3, 0.13, 0.025); return c; });
  return { g, idle: (t) => { head.rotation.x = flap(t, 2.2, 6) * 0.6; chicks.forEach((c, i) => { c.position.y = Math.abs(Math.sin(t * 4 + i * 2)) * 0.05; c.rotation.y = Math.sin(t + i) * 0.8; }); } };
};

A.horse = (K) => {
  const P = K.quad({ len: 1.9, wid: 0.7, hgt: 0.85, legH: 1.05, legR: 0.09, color: 0x8b5a2b, hoof: 0x2a2a2a, head: 0.27, neckLen: 0.75, neckR: 0.19, neckAng: 0.55, neckY: 0.25, headTip: 0.8, snout: 1.15, ears: "cone", tailLen: 0.9, tailR: 0.09, tailTaper: 1.4, tailAng: 0.35, tailColor: 0x2e1f12, eye: 0.17 });
  for (let i = 0; i < 6; i++) K.part(P.nk, K.box(0.07, 0.14, 0.14), K.M(0x2e1f12), [0, 0.05 + i * 0.13, -0.17]);
  K.part(P.head, K.box(0.06, 0.18, 0.02), K.M(0xf4f0e6), [0, 0.1, 0.42], [0.4, 0, 0]);
  return { g: P.g, idle: P.idle };
};

// ---------------------------------------------------------------- snow
A.penguin = (K) => {
  const g = G(K), blk = K.M(0x1c2230), wht = K.S(0xf8f8f8), org = K.M(0xf59a20);
  const mk = (par, x, z, s, baby) => {
    const p = K.group(par, [x, 0, z], null, s);
    for (const d of [-1, 1]) K.part(p, K.sph(1, 8, 6), org, [d * 0.12, 0.03, 0.08], null, [0.1, 0.04, 0.16]);
    K.part(p, K.sph(1, 14, 12), baby ? K.M(0x9aa0aa) : blk, [0, 0.55, 0], null, [0.36, 0.55, 0.32]);
    K.part(p, K.sph(1, 14, 10), wht, [0, 0.5, 0.1], null, [0.28, 0.45, 0.25]);
    const head = K.group(p, [0, 1.12, 0]);
    K.part(head, K.sph(0.24, 14, 10), baby ? K.M(0x9aa0aa) : blk);
    K.part(head, K.sph(1, 10, 8), baby ? wht : K.S(0xffffff), [0, -0.02, 0.12], null, [0.17, 0.14, 0.13]);
    if (!baby) for (const d of [-1, 1]) K.part(head, K.sph(1, 8, 6), K.M(0xffc830), [d * 0.18, -0.08, 0.05], null, [0.05, 0.1, 0.06]);
    K.part(head, K.cone(0.05, 0.16, 6), org, [0, -0.04, 0.27], [PI / 2 + 0.2, 0, 0]);
    K.eyes(head, 0.08, 0.04, 0.2, 0.045);
    const fl = [-1, 1].map((d) => { const f = K.group(p, [d * 0.32, 0.8, 0], [0, 0, d * 0.2]); K.part(f, K.sph(1, 8, 6), baby ? K.M(0x9aa0aa) : blk, [d * 0.03, -0.25, 0], null, [0.06, 0.3, 0.14]); return f; });
    return { p, fl, head };
  };
  const a = mk(g, 0, 0, 1), b = mk(g, 0.55, 0.25, 0.5, true);
  K.part(g, K.cyl(1.0, 1.1, 0.12, 9), K.S(0xdff2ff, { roughness: 0.2 }), [0.2, -0.04, 0.1]);
  return { g, idle: (t) => { a.p.rotation.z = Math.sin(t * 3) * 0.07; a.fl[0].rotation.z = -0.2 - flap(t, 2, 4) * 0.8; a.fl[1].rotation.z = 0.2 + flap(t, 2, 4) * 0.8; b.p.rotation.z = Math.sin(t * 4 + 1) * 0.09; a.head.rotation.y = Math.sin(t * 0.8) * 0.3; } };
};

A.polarbear = (K) => {
  const P = K.quad({ len: 1.9, wid: 1.0, hgt: 1.0, legH: 0.6, legR: 0.17, color: 0xf2efe6, head: 0.35, neckLen: 0.35, neckR: 0.3, neckAng: 1.1, neckY: 0.1, snout: 0.8, ears: "round", tailLen: 0.15, tailR: 0.08, eye: 0.13 });
  K.part(P.head, K.sph(0.07, 8, 6), K.M(0x1a1a1a), [0, -0.08, 0.66]);
  return { g: P.g, idle: P.idle };
};

A.seal = (K) => {
  const g = G(K), grey = K.M(0x8a96a4), ice = K.S(0xe6f4ff, { roughness: 0.3 });
  K.part(g, K.cyl(1.0, 1.15, 0.3, 7), ice, [0, 0.15, 0]);
  const s = K.group(g, [0, 0.3, 0]);
  K.part(s, K.sph(1, 14, 10), grey, [0, 0.28, -0.25], [0.3, 0, 0], [0.38, 0.32, 0.75]);
  K.part(s, K.sph(1, 12, 10), grey, [0, 0.62, 0.3], [-0.6, 0, 0], [0.3, 0.42, 0.3]);
  const head = K.group(s, [0, 1.0, 0.42]);
  K.part(head, K.sph(0.25, 14, 10), grey);
  K.part(head, K.sph(1, 10, 8), K.M(0xb8c2cc), [0, -0.06, 0.18], null, [0.13, 0.09, 0.1]);
  K.part(head, K.sph(0.04, 6, 5), K.M(0x1a1a1a), [0, -0.02, 0.28]);
  K.eyes(head, 0.1, 0.07, 0.18, 0.06);
  for (const d of [-1, 1]) for (const k of [-1, 0, 1]) K.part(head, K.cyl(0.004, 0.004, 0.18, 3), K.M(0xffffff), [d * 0.1, -0.06 + k * 0.025, 0.24], [0, 0, PI / 2 + k * 0.15]);
  for (const d of [-1, 1]) K.part(s, K.sph(1, 8, 6), grey, [d * 0.3, 0.1, 0.35], [0, 0, d * 0.4], [0.18, 0.04, 0.12]);
  K.part(s, K.sph(1, 8, 6), grey, [0, 0.1, -0.95], null, [0.28, 0.04, 0.14]);
  const ball = K.group(head, [0, 0.42, 0.05]);
  ["#e63a3a", "#ffffff", "#2a7ae6", "#ffd23a"].forEach((c, i) => K.part(ball, new K.THREE.SphereGeometry(0.2, 16, 10, i * PI / 2, PI / 2), K.S(c)));
  return { g, idle: (t) => { ball.rotation.y = t * 2; ball.position.x = Math.sin(t * 2.2) * 0.04; head.rotation.z = -Math.sin(t * 2.2) * 0.1; } };
};

A.snowman = (K) => {
  const g = G(K), snow = K.S(0xfafcff, { roughness: 0.7 }), coal = K.M(0x222222);
  K.part(g, K.sph(0.6, 18, 14), snow, [0, 0.55, 0]);
  K.part(g, K.sph(0.45, 18, 14), snow, [0, 1.38, 0]);
  const head = K.group(g, [0, 2.0, 0]);
  K.part(head, K.sph(0.33, 18, 14), snow);
  K.part(head, K.cone(0.06, 0.35, 8), K.M(0xf57a20), [0, 0, 0.45], [PI / 2, 0, 0]);
  for (const d of [-1, 1]) K.part(head, K.sph(0.045, 8, 6), coal, [d * 0.11, 0.1, 0.29]);
  for (let i = 0; i < 5; i++) { const a = PI * (0.25 + i * 0.125); K.part(head, K.sph(0.03, 6, 5), coal, [Math.cos(a) * 0.15, -0.12 - Math.sin(a) * 0.04 + 0.06, 0.3]); }
  K.part(head, K.cyl(0.36, 0.36, 0.04, 16), coal, [0, 0.27, 0]); K.part(head, K.cyl(0.22, 0.24, 0.38, 16), coal, [0, 0.47, 0]); K.part(head, K.cyl(0.245, 0.245, 0.07, 16), K.M(0xc8202a), [0, 0.33, 0]);
  K.part(g, K.tor(0.33, 0.08, 8, 18), K.M(0xc8202a), [0, 1.72, 0], [PI / 2, 0, 0]);
  K.part(g, K.box(0.14, 0.45, 0.06), K.M(0xc8202a), [0.18, 1.5, 0.33], [0.2, 0, 0.15]);
  for (let i = 0; i < 3; i++) K.part(g, K.sph(0.05, 8, 6), coal, [0, 1.6 - i * 0.2, 0.44 - i * 0.01]);
  const wood = K.M(0x6a4a2a);
  const armL = K.group(g, [-0.4, 1.45, 0], [0, 0, 1.0]); K.part(armL, K.cyl(0.025, 0.02, 0.8, 5), wood, [0, 0.4, 0]); K.part(armL, K.cyl(0.015, 0.012, 0.25, 5), wood, [0.06, 0.65, 0], [0, 0, -0.6]);
  const armR = K.group(g, [0.4, 1.45, 0], [0, 0, -0.6]); K.part(armR, K.cyl(0.025, 0.02, 0.8, 5), wood, [0, 0.4, 0]); K.part(armR, K.cyl(0.015, 0.012, 0.25, 5), wood, [-0.06, 0.65, 0], [0, 0, 0.6]);
  return { g, idle: (t) => { armR.rotation.z = -0.6 + Math.sin(t * 5) * 0.3; head.rotation.z = Math.sin(t * 1.1) * 0.06; } };
};

A.reindeer = (K) => {
  const P = K.quad({ len: 1.6, wid: 0.65, hgt: 0.75, legH: 0.85, legR: 0.08, color: 0x8a6440, belly: 0xe8dcc8, hoof: 0x2a2a2a, head: 0.25, neckLen: 0.5, neckR: 0.16, neckAng: 0.5, neckY: 0.25, headTip: 0.5, snout: 1.0, ears: "cone", tailLen: 0.15, tailR: 0.06, tailColor: 0xf4f0e6, eye: 0.17 });
  const ant = K.M(0xd8c8a8);
  for (const s of [-1, 1]) {
    const a = K.group(P.head, [s * 0.12, 0.2, 0], [0, 0, -s * 0.4]);
    K.part(a, K.cyl(0.025, 0.035, 0.6, 5), ant, [0, 0.3, 0]);
    for (const [y, rz] of [[0.25, 0.8], [0.45, -0.7], [0.58, 0.6]]) K.part(a, K.cyl(0.018, 0.022, 0.28, 5), ant, [Math.sin(rz) * -0.12 * s, y + 0.12, 0.05], [0.3, 0, rz * s]);
  }
  K.part(P.head, K.sph(0.06, 8, 6), K.M(0x1a1a1a), [0, -0.05, 0.6]);
  K.part(P.nk, K.tor(0.17, 0.05, 6, 14), K.M(0xc8202a), [0, 0.1, 0], [PI / 2, 0, 0]);
  return { g: P.g, idle: P.idle };
};

// ---------------------------------------------------------------- island
A.dolphin = (K) => {
  const g = G(K), d = K.group(g, [0, 0.4, 0]), c = K.S(0x6a8ab0, { roughness: 0.3 }), b = K.S(0xe8eef4, { roughness: 0.3 });
  K.part(d, K.sph(1, 16, 10), c, [0, 0.5, 0], null, [0.32, 0.35, 1.0]);
  K.part(d, K.sph(1, 14, 8), b, [0, 0.38, 0.1], null, [0.26, 0.24, 0.85]);
  K.part(d, K.cone(0.12, 0.45, 8), c, [0, 0.45, 1.1], [PI / 2, 0, 0]);
  K.part(d, K.box(0.04, 0.4, 0.35), c, [0, 0.9, -0.05], [-0.6, 0, 0]);
  for (const s of [-1, 1]) K.part(d, K.sph(1, 8, 6), c, [s * 0.35, 0.3, 0.3], [0, s * 0.4, s * 0.5], [0.22, 0.04, 0.12]);
  const tail = K.group(d, [0, 0.5, -0.95]); K.part(tail, K.cone(0.15, 0.6, 8), c, [0, 0, -0.25], [-PI / 2, 0, 0]); K.part(tail, K.box(0.7, 0.04, 0.22), c, [0, 0, -0.55]);
  K.eyes(d, 0.25, 0.6, 0.62, 0.06);
  K.part(d, K.tor(0.12, 0.012, 5, 12, PI), K.M(0x3a4a60), [0, 0.38, 0.95], [-0.3, 0, PI]);
  const ring = K.part(g, K.tor(0.9, 0.06, 6, 24), K.S(0xffffff, { transparent: true, opacity: 0.8 }), [0, 0.02, 0], [PI / 2, 0, 0], null, true);
  return { g, idle: (t) => { const u = Math.sin(t * 1.5); d.position.y = 0.4 + Math.max(0, u) * 0.5; d.rotation.x = -Math.cos(t * 1.5) * 0.35; tail.rotation.x = Math.sin(t * 6) * 0.3; ring.scale.setScalar(1 + (t * 0.8 % 1) * 0.6); ring.material.opacity = 0.8 * (1 - (t * 0.8 % 1)); } };
};

A.seagull = (K) => {
  const g = G(K), w = K.S(0xffffff, { roughness: 0.6 }), grey = K.M(0x9aa4ae), wood = K.M(0x7a5a3a);
  K.part(g, K.cyl(0.18, 0.2, 1.5, 9), wood, [0, 0.75, 0]);
  K.part(g, K.cyl(0.2, 0.2, 0.06, 9), K.M(0xb89a6a), [0, 1.52, 0]);
  const b = K.group(g, [0, 1.55, 0]);
  for (const s of [-1, 1]) K.part(b, K.cyl(0.015, 0.015, 0.15, 4), K.M(0xf09030), [s * 0.06, 0.07, 0]);
  K.part(b, K.sph(1, 14, 10), w, [0, 0.3, 0], [0.25, 0, 0], [0.17, 0.17, 0.36]);
  const wings = [-1, 1].map((s) => { const wg = K.group(b, [s * 0.15, 0.36, -0.02]); K.part(wg, K.sph(1, 10, 6), grey, [s * 0.02, 0, -0.1], null, [0.05, 0.13, 0.33]); K.part(wg, K.box(0.03, 0.08, 0.15), K.M(0x222222), [s * 0.03, -0.02, -0.42]); return wg; });
  const head = K.group(b, [0, 0.52, 0.25]);
  K.part(head, K.sph(0.12, 12, 10), w);
  K.part(head, K.cone(0.03, 0.18, 6), K.M(0xf5c518), [0, -0.02, 0.18], [PI / 2 + 0.15, 0, 0]);
  K.eyes(head, 0.07, 0.03, 0.08, 0.03);
  return { g, idle: (t) => { const f = flap(t, 1.1, 10) * 1.3; wings[0].rotation.z = -f; wings[1].rotation.z = f; head.rotation.y = Math.sin(t * 1.4) * 0.5; } };
};

A.starfish = (K) => {
  const g = G(K), c = K.M(0xf27a4a), dot = K.M(0xffd0a0);
  K.part(g, K.cyl(0.9, 1.0, 0.25, 9), K.M(0xe8d4a8), [0, 0.12, 0]);
  const s = K.group(g, [0, 0.45, 0.1], [-0.9, 0, 0]);
  K.part(s, K.sph(0.22, 12, 8), c, null, null, [1, 1, 0.5]);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * PI * 2, arm = K.group(s, null, [0, 0, a]);
    K.part(arm, K.cone(0.16, 0.65, 7), c, [0, 0.38, 0], null, [1, 1, 0.5]);
    for (let k = 0; k < 3; k++) K.part(arm, K.sph(0.03, 5, 4), dot, [0, 0.2 + k * 0.15, 0.06]);
  }
  K.eyes(s, 0.07, 0.04, 0.1, 0.05);
  return { g, idle: (t) => { s.rotation.z = Math.sin(t * 0.8) * 0.15; } };
};

A.whale = (K) => {
  const g = G(K), c = K.S(0x3a5a80, { roughness: 0.4 }), belly = K.S(0xdde6ee);
  const w = K.group(g, [0, 0, 0]);
  K.part(w, K.sph(1, 18, 12), c, [0, 0.6, 0], null, [1.1, 0.9, 2.4]);
  K.part(w, K.sph(1, 14, 8), belly, [0, 0.35, 0.6], null, [0.95, 0.5, 1.6]);
  K.eyes(w, 0.95, 0.65, 1.2, 0.1);
  K.part(w, K.tor(0.5, 0.03, 5, 16, PI), K.M(0x203048), [0, 0.42, 2.0], [-0.3, 0, PI]);
  const tail = K.group(w, [0, 0.9, -2.2], [0.7, 0, 0]);
  K.part(tail, K.cone(0.35, 1.0, 8), c, [0, 0.3, 0]);
  K.part(tail, K.sph(1, 10, 6), c, [0, 0.85, 0], [0, 0, 0], [1.1, 0.25, 0.15]);
  const spout = K.group(w, [0, 1.45, 0.9]), drops = [];
  const dm = K.S(0xdff4ff, { transparent: true, opacity: 0.85 });
  for (let i = 0; i < 14; i++) drops.push({ m: K.part(spout, K.sph(0.09, 6, 5), dm, null, null, null, true), a: i / 14 * PI * 2, p: i / 14 });
  return { g, idle: (t) => {
    tail.rotation.x = 0.7 + Math.sin(t * 1.1) * 0.2; w.position.y = Math.sin(t * 0.8) * 0.06;
    drops.forEach((d) => { const u = (t * 0.7 + d.p) % 1, r = u * 0.6; d.m.position.set(Math.cos(d.a) * r, Math.sin(u * PI) * 1.4, Math.sin(d.a) * r); d.m.scale.setScalar(1 - u * 0.6); });
  } };
};

// ---------------------------------------------------------------- garden
A.crane = (K) => {
  const g = G(K), w = K.S(0xffffff, { roughness: 0.6 }), blk = K.M(0x1c1c1c), leg = K.M(0x4a4a4a);
  K.part(g, K.cyl(0.8, 0.8, 0.04, 20), K.S(0x6aa8c8, { roughness: 0.1, transparent: true, opacity: 0.85 }), [0, 0.02, 0]);
  for (const s of [-1, 1]) K.part(g, K.cyl(0.02, 0.02, 1.0, 5), leg, [s * 0.08, 0.5, 0]);
  const b = K.group(g, [0, 1.0, 0]);
  K.part(b, K.sph(1, 14, 10), w, [0, 0.2, 0], [0.2, 0, 0], [0.25, 0.27, 0.5]);
  K.part(b, K.sph(1, 10, 6), blk, [0, 0.22, -0.45], [0.5, 0, 0], [0.2, 0.12, 0.25]);
  const neck = K.group(b, [0, 0.3, 0.38]);
  K.part(neck, K.tube([[0, 0, 0], [0, 0.3, 0.15], [0, 0.6, 0.05], [0, 0.85, 0.12]], 0.06, 20, 7), w);
  K.part(neck, K.tube([[0, 0.3, 0.15], [0, 0.6, 0.05], [0, 0.75, 0.1]], 0.065, 16, 7), blk);
  const head = K.group(neck, [0, 0.88, 0.14]);
  K.part(head, K.sph(0.1, 12, 10), w);
  K.part(head, K.sph(0.06, 8, 6), K.M(0xd8202a), [0, 0.08, -0.01]);
  K.part(head, K.cone(0.03, 0.28, 6), K.M(0xb8a878), [0, -0.02, 0.2], [PI / 2 + 0.2, 0, 0]);
  K.eyes(head, 0.06, 0.02, 0.06, 0.028);
  return { g, idle: (t) => { neck.rotation.x = Math.sin(t * 0.9) * 0.15; head.rotation.y = Math.sin(t * 1.3) * 0.4; } };
};

A.panda = (K) => {
  const g = G(K), w = K.S(0xfafafa, { roughness: 0.8 }), blk = K.M(0x1f1f1f);
  K.part(g, K.sph(1, 16, 12), w, [0, 0.55, 0], null, [0.55, 0.55, 0.5]);
  K.part(g, K.tor(0.5, 0.16, 8, 20), blk, [0, 0.78, 0], [PI / 2, 0, 0], [1, 0.9, 1]);
  for (const s of [-1, 1]) { K.part(g, K.sph(1, 12, 8), blk, [s * 0.3, 0.2, 0.35], null, [0.2, 0.18, 0.3]); K.part(g, K.sph(0.09, 8, 6), K.M(0x555555), [s * 0.3, 0.22, 0.6]); }
  const head = K.group(g, [0, 1.3, 0.05]);
  K.part(head, K.sph(0.4, 18, 14), w, null, null, [1.05, 0.95, 0.95]);
  for (const s of [-1, 1]) { K.part(head, K.sph(0.13, 10, 8), blk, [s * 0.3, 0.32, -0.02]); K.part(head, K.sph(1, 10, 8), blk, [s * 0.14, 0.04, 0.32], [0, 0, s * 0.5], [0.1, 0.13, 0.05]); }
  K.eyes(head, 0.14, 0.06, 0.36, 0.045);
  K.part(head, K.sph(1, 10, 8), w, [0, -0.12, 0.33], null, [0.14, 0.1, 0.1]);
  K.part(head, K.sph(0.05, 8, 6), blk, [0, -0.08, 0.43]);
  const arm = K.group(g, [0.4, 0.95, 0.15], [-0.9, 0, -0.2]);
  K.part(arm, K.cyl(0.12, 0.11, 0.5, 8), blk, [0, -0.25, 0]);
  const bam = K.group(arm, [0, -0.5, 0.05], [1.2, 0, 0]);
  K.part(bam, K.cyl(0.035, 0.035, 1.0, 6), K.M(0x7ab840), [0, 0.2, 0]);
  for (let i = 0; i < 3; i++) K.part(bam, K.cone(0.05, 0.3, 4), K.M(0x5aa830), [0.08, 0.6 + i * 0.1, 0], [0, 0, -0.8], [1, 1, 0.3]);
  const armL = K.group(g, [-0.42, 0.95, 0.1], [-0.4, 0, 0.3]); K.part(armL, K.cyl(0.12, 0.11, 0.45, 8), blk, [0, -0.22, 0]);
  return { g, idle: (t) => { arm.rotation.x = -0.9 - flap(t, 1.8, 2) * 0.35; head.rotation.x = flap(t, 1.8, 2) * 0.12; } };
};

A.koi = (K) => {
  const g = G(K), stone = K.M(0x8a8a82);
  for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; K.part(g, K.dod(0.22), stone, [Math.cos(a) * 1.1, 0.12, Math.sin(a) * 0.9], [K.R(0, 3), K.R(0, 3), 0], [1, 0.7, 1]); }
  K.part(g, K.cyl(1.05, 1.05, 0.05, 24), K.S(0x2a7aa0, { roughness: 0.05, transparent: true, opacity: 0.85 }), [0, 0.1, 0], null, [1, 1, 0.84]);
  for (const [x, z] of [[-0.5, 0.2], [0.45, -0.3], [0.1, 0.5]]) K.part(g, K.cyl(0.18, 0.18, 0.02, 12), K.M(0x4a9a3a), [x, 0.13, z]);
  K.part(g, K.cone(0.1, 0.16, 8), K.M(0xf5a0c8), [0.1, 0.2, 0.5]);
  const f = K.group(g, [0, 0.3, 0]), fi = K.group(f, [0, 0, 0]);
  K.part(fi, K.sph(1, 12, 8), K.S(0xff7a2a), [0, 0, 0], null, [0.14, 0.13, 0.42]);
  K.part(fi, K.sph(1, 10, 6), K.S(0xffffff), [0, 0.06, 0.05], null, [0.1, 0.08, 0.25]);
  K.part(fi, K.sph(1, 8, 6), K.S(0xff7a2a), [0, 0, -0.5], null, [0.02, 0.14, 0.14]);
  K.eyes(fi, 0.07, 0.04, 0.32, 0.03);
  const splash = K.part(g, K.tor(0.25, 0.03, 5, 16), K.S(0xffffff, { transparent: true, opacity: 0.8 }), [0, 0.14, 0], [PI / 2, 0, 0], null, true);
  return { g, idle: (t) => {
    const u = (t * 0.45) % 1, jump = u < 0.45 ? Math.sin(u / 0.45 * PI) : 0;
    f.position.set(0, 0.15 + jump * 1.1, (u < 0.45 ? (u / 0.45 - 0.5) : 0) * 0.9); fi.rotation.x = u < 0.45 ? (u / 0.45 - 0.5) * 2 : 0.4; f.visible = u < 0.47;
    splash.scale.setScalar(1 + ((u + 0.55) % 1) * 2); splash.material.opacity = Math.max(0, 0.8 - ((u + 0.55) % 1) * 2);
  } };
};

A.rabbit = (K) => {
  const g = G(K), fur = K.S(0xb8a48a, { roughness: 0.9 }), pale = K.S(0xf4ece0, { roughness: 0.9 }), pink = K.M(0xf0a8b0);
  const r = K.group(g);
  K.part(r, K.sph(1, 14, 12), fur, [0, 0.38, -0.05], null, [0.33, 0.36, 0.42]);
  K.part(r, K.sph(1, 10, 8), pale, [0, 0.32, 0.12], null, [0.22, 0.25, 0.25]);
  K.part(r, K.sph(0.12, 10, 8), pale, [0, 0.4, -0.45]);
  for (const s of [-1, 1]) { K.part(r, K.sph(1, 10, 8), fur, [s * 0.2, 0.12, -0.05], null, [0.12, 0.1, 0.3]); K.part(r, K.sph(0.07, 8, 6), fur, [s * 0.12, 0.08, 0.28]); }
  const head = K.group(r, [0, 0.82, 0.18]);
  K.part(head, K.sph(0.23, 14, 12), fur, null, null, [1, 0.95, 1]);
  K.part(head, K.sph(1, 10, 8), pale, [0, -0.08, 0.17], null, [0.12, 0.09, 0.08]);
  K.part(head, K.sph(0.035, 6, 5), pink, [0, -0.02, 0.24]);
  K.eyes(head, 0.11, 0.05, 0.17, 0.05);
  const ears = [-1, 1].map((s) => { const e = K.group(head, [s * 0.09, 0.18, -0.02], [-0.15, 0, -s * 0.15]); K.part(e, K.sph(1, 10, 8), fur, [0, 0.25, 0], null, [0.07, 0.27, 0.04]); K.part(e, K.sph(1, 8, 6), pink, [0, 0.25, 0.02], null, [0.04, 0.2, 0.025]); return e; });
  return { g, idle: (t) => { ears[0].rotation.x = -0.15 - flap(t, 1.7, 8) * 0.4; ears[1].rotation.z = 0.15 + flap(t, 1.3, 8) * 0.3; r.position.y = flap(t, 1.1, 12) * 0.2; head.rotation.x = Math.sin(t * 8) * 0.03; } };
};

A.owl = (K) => {
  const g = G(K), brown = K.M(0x8a6440), light = K.M(0xe8d8b8), wood = K.M(0x5a4430);
  K.part(g, K.cyl(0.3, 0.38, 1.2, 9), wood, [0, 0.6, 0]);
  K.part(g, K.cyl(0.29, 0.29, 0.03, 9), K.M(0xb89a6a), [0, 1.21, 0]);
  const o = K.group(g, [0, 1.22, 0]);
  K.part(o, K.sph(1, 14, 12), brown, [0, 0.38, 0], null, [0.3, 0.4, 0.27]);
  K.part(o, K.sph(1, 12, 10), light, [0, 0.33, 0.1], null, [0.22, 0.3, 0.2]);
  for (let i = 0; i < 6; i++) K.part(o, K.sph(0.025, 5, 4), brown, [(i % 3 - 1) * 0.09, 0.2 + Math.floor(i / 3) * 0.12, 0.29]);
  for (const s of [-1, 1]) K.part(o, K.sph(1, 10, 8), K.M(0x6a4a2a), [s * 0.27, 0.36, -0.02], null, [0.06, 0.28, 0.2]);
  for (const s of [-1, 1]) K.part(o, K.box(0.08, 0.03, 0.1), K.M(0xe8b030), [s * 0.08, 0.0, 0.12]);
  const head = K.group(o, [0, 0.85, 0]);
  K.part(head, K.sph(0.26, 16, 12), brown, null, null, [1.05, 0.9, 0.95]);
  K.part(head, K.sph(1, 14, 10), light, [0, 0.0, 0.12], null, [0.22, 0.17, 0.13]);
  for (const s of [-1, 1]) {
    K.part(head, K.sph(0.08, 12, 10), K.S(0xffa020, { emissive: 0x4a2a00 }), [s * 0.1, 0.03, 0.2]);
    K.part(head, K.sph(0.045, 10, 8), K.S(0x0a0a0a, { roughness: 0.1 }), [s * 0.1, 0.03, 0.265]);
    K.part(head, K.sph(0.014, 6, 5), K.B(0xffffff), [s * 0.1 + 0.015, 0.05, 0.305]);
    K.part(head, K.cone(0.06, 0.18, 5), brown, [s * 0.17, 0.25, 0], [0, 0, -s * 0.3]);
  }
  K.part(head, K.cone(0.035, 0.09, 6), K.M(0xe8b030), [0, -0.06, 0.26], [PI / 2 + 0.6, 0, 0]);
  return { g, idle: (t) => { head.rotation.y = Math.sin(t * 0.7) * 0.9; head.rotation.z = Math.sin(t * 1.9) * 0.12; } };
};

// ---------------------------------------------------------------- desert
A.camel = (K) => {
  const P = K.quad({ len: 1.9, wid: 0.75, hgt: 0.85, legH: 1.2, legR: 0.08, color: 0xc9955a, head: 0.24, neckLen: 0.95, neckR: 0.13, neckAng: 0.95, neckY: 0.1, headTip: -0.55, snout: 1.25, ears: "round", tailLen: 0.5, tailR: 0.04, tailAng: 0.3, tuft: 0.06, tuftColor: 0x6a4a2a, eye: 0.18 });
  K.part(P.g, K.sph(1, 12, 10), K.M(0xc9955a), [0, P.by + 0.4, -0.05], null, [0.32, 0.38, 0.45]);
  const tex = K.tex(64, 64, (c, w, h) => { const cols = ["#c8302a", "#f2c230", "#2a5ac8", "#f2c230"]; for (let i = 0; i < 8; i++) { c.fillStyle = cols[i % 4]; c.fillRect(0, i * 8, w, 8); } });
  K.part(P.g, K.box(0.82, 0.5, 0.55), new K.THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), [0, P.by + 0.18, -0.05]);
  return { g: P.g, idle: P.idle };
};

A.meerkat = (K) => {
  const g = G(K), fur = K.M(0xc8a070), pale = K.M(0xead6b0), dk = K.M(0x3a2a1a);
  K.part(g, K.hemi(1, 14), K.M(0xd8b07a), [0, 0, 0], null, [0.9, 0.22, 0.8]);
  K.part(g, K.circle(0.26, 16), K.M(0x2a1a0a), [0.35, 0.16, 0.3], [-1.25, 0, 0]);
  const mk = (x, z, s) => {
    const m = K.group(g, [x, 0.12, z], null, s);
    K.part(m, K.sph(1, 12, 10), fur, [0, 0.55, 0], null, [0.18, 0.45, 0.16]);
    K.part(m, K.sph(1, 10, 8), pale, [0, 0.5, 0.08], null, [0.13, 0.36, 0.1]);
    K.part(m, K.cone(0.06, 0.6, 6), fur, [0, 0.15, -0.25], [-1.2, 0, 0]);
    for (const d of [-1, 1]) { K.part(m, K.cyl(0.035, 0.03, 0.22, 5), fur, [d * 0.1, 0.73, 0.12], [1.0, 0, 0]); K.part(m, K.sph(1, 8, 6), fur, [d * 0.1, 0.06, 0.06], null, [0.07, 0.06, 0.13]); }
    const head = K.group(m, [0, 1.05, 0.02]);
    K.part(head, K.sph(1, 12, 10), fur, null, null, [0.13, 0.13, 0.15]);
    K.part(head, K.cone(0.08, 0.16, 8), pale, [0, -0.03, 0.17], [PI / 2, 0, 0]);
    K.part(head, K.sph(0.025, 6, 5), dk, [0, -0.03, 0.26]);
    for (const d of [-1, 1]) { K.part(head, K.sph(1, 8, 6), dk, [d * 0.065, 0.03, 0.1], null, [0.05, 0.045, 0.03]); K.part(head, K.sph(0.035, 6, 5), dk, [d * 0.12, 0.06, -0.02]); }
    K.eyes(head, 0.065, 0.035, 0.115, 0.028);
    return head;
  };
  const h1 = mk(0, 0, 1), h2 = mk(0.42, -0.2, 0.8);
  return { g, idle: (t) => { h1.rotation.y = Math.sin(t * 0.8) * 0.7; h2.rotation.y = Math.sin(t * 0.8 + 2) * 0.7; } };
};

A.lizard = (K) => {
  const g = G(K), c = K.M(0x5aa83a), o = K.M(0xf09a3a);
  K.part(g, K.dod(0.6), K.M(0xb87a4a), [0, 0.3, 0], null, [1.3, 0.55, 1]);
  const l = K.group(g, [0, 0.6, 0]);
  K.part(l, K.sph(1, 14, 10), c, [0, 0.12, 0], null, [0.18, 0.12, 0.42]);
  K.part(l, K.sph(1, 10, 8), o, [0, 0.16, -0.05], null, [0.12, 0.08, 0.3]);
  K.part(l, K.tube([[0, 0.1, -0.38], [0.15, 0.08, -0.7], [0.4, 0.06, -0.85], [0.6, 0.05, -0.75]], 0.04, 16, 5), c);
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) K.part(l, K.cyl(0.03, 0.03, 0.22, 5), c, [sx * 0.2, 0.06, sz * 0.22], [0, 0, sx * 1.1]);
  const head = K.group(l, [0, 0.18, 0.42]);
  K.part(head, K.sph(1, 12, 8), c, [0, 0, 0.06], null, [0.13, 0.1, 0.18]);
  K.eyes(head, 0.1, 0.06, 0.05, 0.045);
  const throat = K.part(head, K.sph(0.06, 8, 6), K.M(0xf04a3a), [0, -0.08, 0.05]);
  return { g, idle: (t) => { l.position.y = 0.6 + flap(t, 1.5, 6) * 0.08; throat.scale.setScalar(0.5 + flap(t, 2.1, 6) * 0.8); head.rotation.y = Math.sin(t * 0.7) * 0.3; } };
};

A.fennec = (K) => {
  const P = K.quad({ len: 0.9, wid: 0.42, hgt: 0.42, legH: 0.32, legR: 0.045, color: 0xf0d6a8, belly: 0xfaf2e2, head: 0.22, neckLen: 0.12, neckR: 0.1, neckAng: 0.6, neckY: 0.2, snout: 0.9, snoutColor: 0xfaf2e2, eye: 0.2, tailLen: 0.5, tailR: 0.11, tailTaper: 1.0, tailAng: 1.0, tuft: 0.08, tuftColor: 0x3a2a1a });
  for (const s of [-1, 1]) { K.part(P.head, K.cone(0.13, 0.45, 6), K.M(0xf0d6a8), [s * 0.14, 0.32, -0.02], [0, 0, -s * 0.35]); K.part(P.head, K.cone(0.08, 0.32, 6), K.M(0xf4b8b0), [s * 0.14, 0.3, 0.02], [0, 0, -s * 0.35]); }
  K.part(P.head, K.sph(0.035, 6, 5), K.M(0x1a1a1a), [0, -0.05, 0.36]);
  return { g: P.g, idle: (t) => { P.idle(t); } };
};

A.balloon = (K) => {
  const g = G(K);
  const tex = K.tex(256, 64, (c, w, h) => { const cols = ["#e8402a", "#f6c23a", "#2a8ae8", "#f6f2e8", "#3ab86a", "#f6c23a"]; for (let i = 0; i < 12; i++) { c.fillStyle = cols[i % cols.length]; c.fillRect(i * w / 12, 0, w / 12 + 1, h); } });
  const env = new K.THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16, a = u * PI; pts.push([Math.max(0.001, Math.sin(a) * 1.1 * (u < 0.5 ? 1 : 1 - (u - 0.5) * 0.9) + (u < 0.15 ? 0.15 : 0)), -Math.cos(a) * 1.25]); }
  pts[0] = [0.35, -1.25];
  const b = K.group(g, [0, 2.0, 0]);
  K.part(b, K.lathe(pts, 24), env, [0, 1.1, 0]);
  for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2 + PI / 4; K.part(b, K.cyl(0.01, 0.01, 0.8, 3), K.M(0x5a4a3a), [Math.cos(a) * 0.3, -0.45, Math.sin(a) * 0.3], [Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12]); }
  K.part(b, K.box(0.5, 0.4, 0.5), K.M(0x9a6a3a), [0, -0.95, 0]);
  K.part(b, K.box(0.54, 0.06, 0.54), K.M(0x6a4422), [0, -0.75, 0]);
  const flame = K.sprite(0xffa040, 0.5, [0, -0.45, 0], 0.9, b);
  return { g, idle: (t) => { flame.scale.setScalar(0.35 + flap(t, 2.5, 3) * 0.35); b.rotation.z = Math.sin(t * 0.6) * 0.04; } };
};

window.RC.TwistAnimals = A;
})();
