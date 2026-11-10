// 3D scenes for exercises that use the shared engines (Reach in kit.js; Hold, Swing, Wave and the rest in moves.js).
// The engine still does all the counting and scoring; RC.Play3D.wrap(game, id) only replaces how it is drawn.
// Each scene (js/play3d-scenes.js) builds a small world from the shape kit in js/twist3d.js and moves it
// from the engine's view(): how far the patient has moved, the target, the hold timer and the reps done.
// On top of the picture sits a gauge that shows the movement against the green target zone, so the goal
// is always clear whatever the scene. Until three.js has loaded, without WebGL, or on a computer too slow
// for 3D, the exercise draws its usual flat picture instead.
(() => {
"use strict";
const RC = window.RC;
const S3 = RC.Scene3D;
const P3 = { builders: {} };
P3.add = (id, build) => { P3.builders[id] = build; };
P3.ensure = () => S3 && S3.ensure();
P3.ready = () => !!S3 && S3.ready() && !!(RC.Twist3D && RC.Twist3D.kit);

P3.create = function (id, S) {
  const build = P3.builders[id];
  if (!build || !P3.ready()) return null;
  const THREE = S3.THREE, R = S3.getRenderer();
  if (!R) return null;
  const scene = new THREE.Scene(), K = RC.Twist3D.kit(THREE, scene, { calm: RC.reduceMotion, avoid: [] });
  const cam = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 900);
  cam.rotation.order = "YXZ";
  const def = build(K, THREE, cam, S) || {};
  const tmp = new THREE.Vector3();
  return {
    gauge: def.gauge || "h", flip: !!def.flip,
    lowQuality(on) { if (K.sun && K.sun.castShadow === on) K.sun.castShadow = !on; },
    frame(W, H, pr, v, t, dt) {
      cam.aspect = W / H; cam.fov = W / H < 1.2 ? (def.fovTall || (def.fov || 55) + 14) : (def.fov || 55); cam.updateProjectionMatrix();
      K.swayers.forEach((u) => { u.uT.value = t; });
      for (const f of K.tickers) f(K.calm ? 0 : t, dt);
      if (def.update) def.update(v, t, dt);
      return S3.renderTo(R, scene, cam, W, H, pr);
    },
    // where on screen the action is, for the sparkles when a rep is done
    focus(W, H) { if (!def.focus) return null; def.focus(tmp); return S3.toScreen(cam, tmp, W, H); },
    dispose() { S3.dispose(scene, [K.glow].concat(def.keep || [])); },
  };
};

// Gauge layout for each engine: the range shown and the target zones. Values are in the units of view().
function gaugeOf(v) {
  if (v.type === "reach") return { lo: 0, hi: 1.35, val: v.u, zones: [{ a: 0.9, b: 1.35, on: v.state === "move" }], fill: v.prog };
  if (v.type === "hold") {
    const top = Math.max(1.5, Math.min(v.hi, 2.2) * 1.12);
    return { lo: 0, hi: top, val: v.u, zones: [{ a: 1, b: Math.min(v.hi, top), on: v.state === "go" }], fill: v.state === "go" ? v.prog : 0 };
  }
  if (v.type === "swing") {
    const plus = v.targets[v.side] > 0;
    return { lo: -1.35, hi: 1.35, val: v.x, zones: [{ a: -1.35, b: -0.9, on: !plus }, { a: 0.9, b: 1.35, on: plus }], fill: v.prog };
  }
  if (v.type === "wave") return { lo: -1.6, hi: 1.6, val: v.x, zones: [{ a: -1.6, b: -1, on: v.want < 0 }, { a: 1, b: 1.6, on: v.want > 0 }], fill: 0 };
  if (v.type === "track") return { lo: -1.15, hi: 1.15, val: v.x, zones: [{ a: v.tx - v.tw, b: v.tx + v.tw, on: true }], fill: 0 };
  if (v.type === "dial") return { lo: -1.2, hi: 1.2, val: v.x, zones: [{ a: v.tx - v.tw, b: v.tx + v.tw, on: true }], fill: v.prog };
  if (v.type === "catch") return { lo: -1.1, hi: 1.1, val: v.x, zones: v.item ? [{ a: v.item.u - v.bw, b: v.item.u + v.bw, on: true }] : [], fill: 0 };
  if (v.type === "steer") { const q = v.gates.find((g) => g.u <= 1); return { lo: -1.1, hi: 1.1, val: v.x, zones: q ? [{ a: q.c - v.gapW, b: q.c + v.gapW, on: true }] : [], fill: 0 }; }
  if (v.type === "seq") return { lo: 0, hi: 1.35, val: v.u, zones: [{ a: 0.9, b: 1.35, on: !v.need }], fill: v.prog };
  if (v.type === "throw") return { lo: 0, hi: 1, val: v.phase === "charge" ? v.charge : v.phase === "show" ? v.power : 0, zones: [{ a: v.zone - v.width / 2, b: v.zone + v.width / 2, on: true }], fill: 0 };
  if (v.type === "bursts") return { lo: 0, hi: 2, val: Math.min(2, v.a), zones: [{ a: 1, b: 2, on: v.armed }], fill: 0 };
  return null;
}

// Circles: a small ring with the tilt as a dot, the minimum tilt dashed and the lap so far in green.
// Direction: a pad with the possible directions, the one asked for lit. Steady: the circle to stay inside and the time so far.
function drawPad(g, W, H, v) {
  const { clamp, TAU } = RC, unit = Math.min(W, H) / 600, R = 62 * unit, cx = W - R - 34 * unit, cy = H / 2 + 20 * unit;
  g.save();
  g.beginPath(); g.arc(cx, cy, R + 12 * unit, 0, TAU); g.fillStyle = "rgba(18,22,38,0.55)"; g.fill();
  const sc = R / 1.25, px = cx + clamp(v.x, -1.3, 1.3) * sc, py = cy - clamp(v.y, -1.3, 1.3) * sc;
  if (v.type === "circles") {
    g.beginPath(); g.arc(cx, cy, Math.max(v.minR, 0.5) * sc * 1.4, 0, TAU); g.strokeStyle = "rgba(255,255,255,0.25)"; g.lineWidth = 12 * unit; g.stroke();
    g.beginPath(); g.arc(cx, cy, v.minR * sc, 0, TAU); g.strokeStyle = "rgba(255,255,255,0.4)"; g.lineWidth = 2 * unit; g.setLineDash([5 * unit, 5 * unit]); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.arc(cx, cy, Math.max(v.minR, 0.5) * sc * 1.4, -Math.PI / 2, -Math.PI / 2 - v.dir * clamp(v.prog, 0, 1) * TAU, v.dir > 0); g.strokeStyle = v.wrong ? "#ff8a5a" : "#5ad88c"; g.lineWidth = 8 * unit; g.lineCap = "round"; g.stroke(); g.lineCap = "butt";
    g.fillStyle = "#ffffff"; g.font = `700 ${Math.round(26 * unit)}px Fredoka, Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(v.dir > 0 ? "↺" : "↻", cx, cy);
  } else if (v.type === "steady") {
    g.beginPath(); g.arc(cx, cy, v.r * sc, 0, TAU); g.fillStyle = v.inside ? "rgba(90,220,140,0.55)" : "rgba(90,220,140,0.25)"; g.fill(); g.strokeStyle = "#5ad88c"; g.lineWidth = 2 * unit; g.stroke();
    g.beginPath(); g.arc(cx, cy, R + 6 * unit, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(v.prog, 0, 1)); g.strokeStyle = "#5ad88c"; g.lineWidth = 5 * unit; g.lineCap = "round"; g.stroke(); g.lineCap = "butt";
  } else {
    g.beginPath(); g.arc(cx, cy, 0.3 * sc, 0, TAU); g.fillStyle = v.phase === "center" || v.phase === "back" ? "rgba(90,220,140,0.45)" : "rgba(255,255,255,0.15)"; g.fill();
    for (const d of v.dirs) {
      const on = v.phase === "go" && d === v.d, dx = cx + d[0] * sc, dy = cy - d[1] * sc;
      g.beginPath(); g.arc(dx, dy, 9 * unit, 0, TAU); g.fillStyle = on ? "#5ad88c" : "rgba(255,255,255,0.3)"; g.fill();
      if (on && v.prog > 0) { g.beginPath(); g.arc(dx, dy, 14 * unit, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(v.prog, 0, 1)); g.strokeStyle = "#ffffff"; g.lineWidth = 3 * unit; g.stroke(); }
    }
  }
  g.beginPath(); g.arc(px, py, 8 * unit, 0, TAU); g.fillStyle = "#ffffff"; g.fill(); g.lineWidth = 3 * unit; g.strokeStyle = "#2a3350"; g.stroke();
  g.restore();
}

// Seq: one chip per step above the gauge, the current one lit.
function drawSteps(g, W, H, v) {
  const unit = Math.min(W, H) / 600, r = 15 * unit, gap = 40 * unit, n = v.n, y = H - 92 * unit, x0 = W / 2 - ((n - 1) * gap) / 2;
  g.save(); g.font = `700 ${Math.round(15 * unit)}px Fredoka, Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
  for (let i = 0; i < n; i++) {
    const done = v.need || i < v.k, on = !v.need && i === v.k;
    g.beginPath(); g.arc(x0 + i * gap, y, r, 0, RC.TAU); g.fillStyle = done ? "#5ad88c" : on ? "#ffffff" : "rgba(18,22,38,0.55)"; g.fill();
    g.fillStyle = done || !on ? "#ffffff" : "#1f2a44"; g.fillText(done ? "✓" : String(i + 1), x0 + i * gap, y + 1);
  }
  g.restore();
}

function drawGauge(g, W, H, v, vertical, flip) {
  const { clamp, rr, TAU } = RC, unit = Math.min(W, H) / 600, q = gaugeOf(v);
  if (!q) return;
  const len = vertical ? Math.min(H * 0.5, 330 * unit) : Math.min(W * 0.46, 430 * unit), th = 26 * unit, pad = 9 * unit;
  const x0 = vertical ? W - th - 30 * unit : W / 2 - len / 2, y0 = vertical ? H / 2 - len / 2 + 20 * unit : H - th - 28 * unit;
  let k = (val) => clamp((val - q.lo) / (q.hi - q.lo), 0, 1);
  if (flip) { const k0 = k; k = (val) => 1 - k0(val); }
  const at = (u) => (vertical ? { x: x0 + th / 2, y: y0 + len * (1 - u) } : { x: x0 + len * u, y: y0 + th / 2 });
  g.save();
  g.fillStyle = "rgba(18,22,38,0.55)";
  if (vertical) rr(g, x0 - pad, y0 - pad, th + pad * 2, len + pad * 2, (th + pad * 2) / 2); else rr(g, x0 - pad, y0 - pad, len + pad * 2, th + pad * 2, (th + pad * 2) / 2);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.22)";
  if (vertical) rr(g, x0, y0, th, len, th / 2); else rr(g, x0, y0, len, th, th / 2);
  g.fill();
  for (const z of q.zones) {
    const a = Math.min(k(z.a), k(z.b)), b = Math.max(k(z.a), k(z.b));
    g.fillStyle = z.on ? "rgba(90,220,140,0.95)" : "rgba(90,220,140,0.3)";
    if (vertical) rr(g, x0, y0 + len * (1 - b), th, len * (b - a), th / 2); else rr(g, x0 + len * a, y0, len * (b - a), th, th / 2);
    g.fill();
    if (z.on && q.fill > 0) {
      const f = clamp(q.fill, 0, 1); g.fillStyle = "#1f9a5a";
      if (vertical && flip) rr(g, x0 + 4 * unit, y0 + len * (1 - b), th - 8 * unit, len * (b - a) * f, (th - 8 * unit) / 2);
      else if (vertical) rr(g, x0 + 4 * unit, y0 + len * (1 - a) - len * (b - a) * f, th - 8 * unit, len * (b - a) * f, (th - 8 * unit) / 2);
      else if (flip) rr(g, x0 + len * b - len * (b - a) * f, y0 + 4 * unit, len * (b - a) * f, th - 8 * unit, (th - 8 * unit) / 2);
      else rr(g, x0 + len * a, y0 + 4 * unit, len * (b - a) * f, th - 8 * unit, (th - 8 * unit) / 2);
      g.fill();
    }
  }
  const p = at(k(q.val)), inZone = q.zones.some((z) => z.on && q.val >= Math.min(z.a, z.b) && q.val <= Math.max(z.a, z.b));
  g.beginPath(); g.arc(p.x, p.y, th * 0.78, 0, TAU); g.fillStyle = "#ffffff"; g.fill();
  g.lineWidth = 4 * unit; g.strokeStyle = inZone ? "#1f9a5a" : "#2a3350"; g.stroke();
  g.restore();
}

// Reps done, as a row of dots in the bottom-left corner (the status card covers the top middle).
function drawDots(g, W, H, v) {
  const n = Math.min(v.goal, 30), done = Math.round((v.reps / Math.max(1, v.goal)) * n);
  const gap = Math.min(20, (W * 0.24) / Math.max(1, n)), w = gap * (n - 1) + 28, y = H - 34, x0 = 22 + w / 2;
  g.save();
  g.fillStyle = "rgba(18,22,38,0.5)"; RC.rr(g, x0 - w / 2, y - 13, w, 26, 13); g.fill();
  for (let i = 0; i < n; i++) { g.beginPath(); g.arc(x0 - (gap * (n - 1)) / 2 + i * gap, y, Math.min(6, gap * 0.36), 0, RC.TAU); g.fillStyle = i < done ? "#5ad88c" : "rgba(255,255,255,0.45)"; g.fill(); }
  g.restore();
}

// Give a game made by an engine a 3D scene. opts: { flip: true to run the gauge right-to-left }
P3.wrap = function (G, id, opts) {
  if (!G.view || !P3.builders) return G;
  const o = opts || {}, flat = G.draw, quality = S3 ? S3.quality() : { sample: () => 2, level: 2 }, debug = G.debug;
  let world = null, lastT = null, lastReps = 0, sparkle = [], sx = 0, sy = 0;
  P3.ensure();
  G.draw = function (g, W, H, a, t) {
    const raw = lastT == null ? 0 : t - lastT, dt = Math.min(0.05, Math.max(0, raw)); lastT = t;
    const q = world ? quality.sample() : 0;
    if (q >= 2 && world) { world.dispose(); world = null; S3.off = true; }
    if (!world && !(S3 && S3.off) && P3.ready()) world = P3.create(id, G.S || {});
    if (!world) return flat.call(this, g, W, H, a, t);
    if (G.onStage) G.onStage(W, H);
    const v = G.view();
    v.fresh = v.reps > lastReps; lastReps = v.reps; v.W = W; v.H = H;
    world.lowQuality(q >= 1);
    const pr = (g.getTransform ? g.getTransform().a : 1) * (q >= 1 ? 0.6 : 1);
    g.drawImage(world.frame(W, H, pr, v, t, dt), 0, 0, W, H);
    drawDots(g, W, H, v);
    if (v.type === "circles" || v.type === "direction" || v.type === "steady") drawPad(g, W, H, v);
    else if (world.gauge !== "none") drawGauge(g, W, H, v, world.gauge === "v", o.flip || world.flip);
    if (v.type === "seq") drawSteps(g, W, H, v);
    if (v.fresh && !RC.reduceMotion) {
      const f = world.focus(W, H) || { x: W / 2, y: H * 0.45 }; sx = f.x; sy = f.y;
      for (let i = 0; i < 26; i++) { const ang = Math.random() * RC.TAU, s = 70 + Math.random() * 140; sparkle.push({ x: 0, y: 0, vx: Math.cos(ang) * s, vy: Math.sin(ang) * s - 60, life: 1, c: ["#ffd27a", "#7ae0a0", "#ffffff", "#ff9ec0"][i % 4] }); }
    }
    sparkle = sparkle.filter((s) => (s.life -= dt) > 0);
    for (const s of sparkle) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 90 * dt; g.globalAlpha = Math.min(1, s.life * 1.4); g.fillStyle = s.c; g.beginPath(); g.arc(sx + s.x, sy + s.y, 5, 0, RC.TAU); g.fill(); }
    g.globalAlpha = 1;
  };
  const prev = G.dispose;
  G.dispose = () => { if (world) { world.dispose(); world = null; } if (prev) prev(); };
  G.debug = () => Object.assign(debug ? debug() : {}, { view: world ? "3d" : "2d", quality: quality.level });
  return G;
};

RC.Play3D = P3;
})();
