// 3D scene for Ear to Shoulder: a beach ball on a balance board at the end of a pier at sunset.
// The whole picture slowly tips (the camera rolls); tipping your head the other way brings it back level.
// While the picture is tipped the board is too, so the ball rolls toward the low end and can fall off.
// Uses the shape kit from js/twist3d.js; three.js is loaded on demand by js/scene3d.js.
(() => {
"use strict";
const RC = window.RC;
const S3 = RC.Scene3D;
const BAL = { ensure: () => S3.ensure(), ready: () => S3.ready() && !!(RC.Twist3D && RC.Twist3D.kit) };
const PI = Math.PI, D2R = PI / 180;
const BOARD_Y = 1.05, BOARD_Z = -2.6, HALF = 1.2, BALL_R = 0.2;

BAL.create = function (opts) {
  if (!BAL.ready()) return null;
  const THREE = S3.THREE, R = S3.getRenderer();
  if (!R) return null;
  const scene = new THREE.Scene(), K = RC.Twist3D.kit(THREE, scene, { calm: opts.calm, avoid: [] });
  K.sky(0x2f5aa8, 0xf0a070, 0xffc888, { sunDir: [-0.3, 0.05, -1], sun: 1.6, sunColor: 0xffa850, horizon: 0.12 });
  scene.fog = new THREE.Fog(0xf0b48a, 70, 320);
  K.lights({ sky: 0xffe2cc, ground: 0x4a3a3a, hemi: 1.5, sun: 0xffd0a0, sunI: 2.4, dir: [0.7, 0.55, 0.35] });
  const sc = K.sun.shadow.camera; sc.left = sc.bottom = -8; sc.right = sc.top = 8; sc.updateProjectionMatrix();

  // sea, setting sun and its reflection
  K.water({ size: 700, seg: 90, y: -0.7, color: 0x2a6aa0, amp: 0.1, rough: 0.12 });
  K.part(null, K.sph(14, 24, 16), K.B(0xffd08a, { fog: false }), [-90, 14, -300], null, null, true);
  K.sprite(0xffa050, 120, [-90, 16, -300], 0.6);
  const glint = K.sprite(0xffc070, 1, [-35, -0.5, -120], 0.45); glint.scale.set(14, 70, 1);
  // islands, a lighthouse, boats, clouds and gulls
  K.ring(7, 90, 220, { free: true, a0: -1.6, a1: 1.6 }).forEach((p) => { const s = K.R(8, 22); K.part(null, K.hemi(1, 16), K.M(K.pick([0x3a6a4a, 0x4a7a50, 0x5a6a58])), [p.x, -s * 0.2, p.z], null, [s * 1.7, s * 0.5, s], true); });
  const lp = K.at(0.55, 75), lh = K.group(null, [lp.x, -0.7, lp.z]);
  K.part(lh, K.dod(4), K.M(0x6a6058), null, null, [1.4, 0.7, 1.4]);
  for (let i = 0; i < 5; i++) K.part(lh, K.cyl(1.2 - i * 0.1, 1.3 - i * 0.1, 2, 12), K.M(i % 2 ? 0xd8342a : 0xf4f0ea), [0, 3 + i * 2, 0]);
  K.part(lh, K.cyl(0.8, 0.8, 1.2, 10), K.E(0xfff0a0), [0, 13.6, 0]); K.part(lh, K.cone(1.1, 1.2, 10), K.M(0xd8342a), [0, 14.8, 0]);
  const beam = K.sprite(0xfff0a0, 12, [0, 13.6, 0], 0.7, lh);
  const boats = K.ring(4, 35, 90, { free: true, a0: -1.3, a1: 1.3 }).map((p, i) => {
    const b = K.group(null, [p.x, -0.7, p.z], [0, K.R(0, 6), 0]);
    K.part(b, K.box(1.4, 0.6, 4), K.M(i % 2 ? 0xf4f4f4 : 0x2a4a98), [0, 0.2, 0]); K.part(b, K.cyl(0.06, 0.06, 5, 5), K.M(0x8a6a4a), [0, 2.8, 0.2]);
    const sail = new THREE.BufferGeometry(); sail.setAttribute("position", new THREE.Float32BufferAttribute([0, 0.8, 0.2, 0, 5.2, 0.25, 0, 0.8, -1.8, 0, 0.8, 0.4, 0, 4.6, 0.3, 0, 0.8, 2.0], 3)); sail.computeVertexNormals();
    K.part(b, sail, K.M(i % 3 ? 0xfff4e8 : 0xf8b040, { side: THREE.DoubleSide }));
    return { b, ph: K.R(0, 6) };
  });
  K.clouds(14, { y0: 26, y1: 40, color: 0xffd0b8, glow: 0.45 });
  K.flock(6, { color: 0xffffff, wing: 0xd8d8e0, size: 0.7, y0: 7, y1: 12, r0: 8, r1: 16, cz: -16 });

  // the pier: planks, posts, rope rails, lamps, a life ring, crates
  const plank = [], wood = [0x8a6040, 0x7a5434, 0x946a48, 0x845a3a];
  for (let z = 2; z > -9; z -= 0.3) plank.push({ x: K.R(-0.05, 0.05), y: -0.04, z, c: K.pick(wood) });
  K.inst(K.box(4.4, 0.08, 0.27), K.M(0xffffff, { roughness: 0.9 }), plank);
  const posts = [];
  for (let z = 1.5; z > -9; z -= 2.2) for (const x of [-2.2, 2.2]) posts.push({ x, y: -1.6, z, sy: 2.8 });
  K.inst(K.post(0.13, 0.15, 1, 8), K.M(0x5a3e2a), posts);
  for (const x of [-2.15, 2.15]) {
    const pts = []; for (let z = 1.5; z > -9; z -= 2.2) { pts.push([x, 0.95, z]); if (z - 2.2 > -9) pts.push([x, 0.75, z - 1.1]); }
    K.part(null, K.tube(pts, 0.025, 80, 5), K.M(0xd8c8a0));
  }
  for (const [x, z] of [[-2.2, -8.1], [2.2, -8.1]]) {
    const l = K.group(null, [x, 0, z]);
    K.part(l, K.cyl(0.05, 0.07, 2.6, 7), K.M(0x2a2a30), [0, 1.3, 0]); K.part(l, K.sph(0.16, 12, 10), K.E(0xffe0a0, { emissiveIntensity: 1.5 }), [0, 2.7, 0]);
    K.sprite(0xffc070, 1.6, [0, 2.7, 0], 0.7, l);
  }
  const ring = K.group(null, [2.18, 0.62, -3.2], [0, PI / 2, 0]);
  for (let i = 0; i < 8; i++) K.part(ring, K.tor(0.3, 0.08, 8, 6, PI / 4), K.S(i % 2 ? 0xffffff : 0xe8342a), null, [0, 0, i * PI / 4]);
  const crates = K.group(null, [-1.5, 0, -5.5], [0, 0.3, 0]);
  K.part(crates, K.box(0.7, 0.6, 0.7), K.M(0xb08850), [0, 0.3, 0]); K.part(crates, K.box(0.6, 0.5, 0.6), K.M(0xa07a48), [0.1, 0.85, 0.05], [0, 0.4, 0]);
  K.part(null, K.cyl(0.3, 0.3, 0.8, 12), K.M(0x6a4a30), [1.5, 0.4, -6.2]);
  const gull = RC.TwistAnimals && RC.TwistAnimals.seagull(K);
  if (gull) { const gg = K.group(null, [2.2, -0.3, -7.0], [0, -0.9, 0], 0.75); gg.add(gull.g); K.tick((t) => gull.idle(t)); }

  // balance board on its stand
  const stand = K.group(null, [0, 0, BOARD_Z]);
  K.part(stand, K.box(0.9, 0.12, 0.7), K.M(0x5a4030), [0, 0.06, 0]);
  K.part(stand, K.cyl(0.08, 0.1, 0.8, 8), K.M(0x6a4a34), [0, 0.5, 0]);
  K.part(stand, K.cyl(0.14, 0.14, 0.6, 3), K.M(0x5a4030), [0, 0.94, 0], [PI / 2, 0, PI]);
  const board = K.group(null, [0, BOARD_Y - 0.05, BOARD_Z]);
  K.part(board, K.box(HALF * 2 + 0.3, 0.1, 0.6), K.M(0xd8a868, { roughness: 0.7 }));
  K.part(board, K.box(0.5, 0.012, 0.6), K.M(0x6ad08a), [0, 0.056, 0]);
  for (const s of [-1, 1]) K.part(board, K.box(0.06, 0.012, 0.6), K.M(0xe8604a), [s * (HALF + 0.12), 0.056, 0]);
  // the beach ball
  const ball = K.group(null, [0, BOARD_Y + BALL_R, BOARD_Z]), spin = K.group(ball);
  ["#e63a3a", "#ffffff", "#2a7ae6", "#ffd23a", "#3ac86a", "#ffffff"].forEach((c, i) => K.part(spin, new THREE.SphereGeometry(BALL_R, 18, 12, i * PI / 3, PI / 3), K.S(c, { roughness: 0.35 })));
  K.part(spin, K.sph(BALL_R * 0.18, 8, 6), K.S(0xffffff), [0, BALL_R * 0.98, 0]);

  const cam = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 900);
  cam.position.set(0, 1.6, 0.4); cam.rotation.order = "YXZ";
  const pitch = Math.atan2(BOARD_Y + 0.15 - 1.6, -BOARD_Z + 0.4);
  const tmp = new THREE.Vector3();
  const world = {
    lowQuality(on) { if (K.sun.castShadow === on) K.sun.castShadow = !on; },
    // st: { net (deg, + = picture turned clockwise), ballX (-1..1 along the board), fallT, fallSide, spawnT }
    frame(W, H, pr, st, t, dt) {
      cam.aspect = W / H; cam.fov = W / H < 1.2 ? 72 : 58; cam.updateProjectionMatrix();
      cam.rotation.set(pitch, 0, (st.net || 0) * D2R);
      K.swayers.forEach((u) => { u.uT.value = t; });
      for (const f of K.tickers) f(K.calm ? 0 : t, dt);
      if (!K.calm) boats.forEach((q) => { q.b.position.y = -0.7 + Math.sin(t * 1.1 + q.ph) * 0.15; q.b.rotation.z = Math.sin(t * 0.8 + q.ph) * 0.06; });
      beam.material.opacity = K.calm ? 0.6 : 0.3 + 0.5 * Math.max(0, Math.sin(t * 1.5));
      // ball: on the board, falling off one end, or dropping in fresh from above
      let x, y = BOARD_Y + BALL_R, s = 1;
      if (st.fallT != null && st.fallT >= 0) {
        const u = st.fallT; x = st.fallSide * (HALF + 0.15 + u * 1.0);
        y = Math.max(BALL_R, BOARD_Y + BALL_R - 5 * u * u); if (y === BALL_R) y += Math.abs(Math.sin(u * 9)) * 0.25 * Math.max(0, 1 - u);
        s = u > 1.1 ? Math.max(0.001, 1 - (u - 1.1) * 2.5) : 1;
      } else {
        x = (st.ballX || 0) * HALF;
        if (st.spawnT != null && st.spawnT < 0.6) y += Math.pow(1 - st.spawnT / 0.6, 2) * 2.2;
      }
      ball.position.set(x, y, BOARD_Z); ball.scale.setScalar(s); spin.rotation.z = -x / BALL_R;
      return S3.renderTo(R, scene, cam, W, H, pr);
    },
    ballScreen(W, H) { tmp.copy(ball.position); return S3.toScreen(cam, tmp, W, H); },
    dispose() { S3.dispose(scene, [K.glow]); },
  };
  return world;
};

RC.Tilt3D = BAL;
})();
