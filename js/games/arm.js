(() => {
"use strict";
const RC = window.RC;
const { $, clamp, lerp, TAU, reduceMotion, store, settings, saveSettings, T, alpha, txt, rr, chime, esc, fmtTime, Game, readTheme } = RC;
const { base, drawGonio } = RC.kit;
// ---- 1. Lantern Lift: shoulder flexion with hold --------------------------------
function LanternLift(S) {
  const amp = S.amp, G = base(S, S.reps), HOLD = 1.2;
  const newTarget = () => amp * (0.9 + Math.random() * 0.2);
  const rc = RC.kit.RepCounter({ target: newTarget(), rest: amp * 0.35, hold: HOLD, reps: S.reps });
  const peaks = rc.peaks, NAMES = { rest: "rest", move: "raise", return: "lower" };
  let state = "rest", hold = 0, target = rc.target, sparkle = [];
  G.update = function (dt, a) {
    const before = rc.state;
    if (rc.update(dt, a.pitch) === "rep") { this._reps++; this.events.push("success"); burst(); }
    if (before === "return" && rc.state === "rest") { if (this._reps >= S.reps) this.done = true; else rc.target = newTarget(); }
    state = NAMES[rc.state]; hold = rc.holdT; target = rc.target;
    sparkle = sparkle.filter((s) => (s.life -= dt) > 0); sparkle.forEach((s) => { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 40 * dt; });
  };
  function burst() { if (reduceMotion) return; for (let i = 0; i < 18; i++) { const ang = Math.random() * TAU, sp = 40 + Math.random() * 90; sparkle.push({ x: 0, y: 0, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.8 }); } }
  G.status = function () {
    if (state === "rest") return { title: "Rest your arm", text: "Lower your arm to start the next lift." };
    if (state === "raise") return hold > 0.05 ? { title: "Hold it there", text: `${Math.max(0, HOLD - hold).toFixed(1)} s`, tone: "good" } : { title: "Raise your arm to the line", text: `Target ${Math.round(target)}°` };
    return { title: "Good. Lower slowly.", text: `${this._reps} of ${S.reps} done`, tone: "good" };
  };
  G.stats = () => [["Best lift", peaks.length ? `${Math.round(Math.max(...peaks))}°` : "–"], ["Average lift", peaks.length ? `${Math.round(peaks.reduce((s, x) => s + x, 0) / peaks.length)}°` : "–"]];
  G.draw = function (g, W, H, a, t) {
    const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, T["sky-top"]); grd.addColorStop(1, T["sky-bot"]);
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // hills
    g.fillStyle = T.hill; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) g.lineTo(x, H - 60 - Math.sin(x / 140) * 18 - Math.sin(x / 57) * 6);
    g.lineTo(W, H); g.fill();
    const top = 170, bottom = H - 80;
    const yOf = (deg) => lerp(bottom, top, clamp((deg + 5) / (amp * 1.35 + 5), 0, 1));
    // target line
    const ty = yOf(target);
    g.setLineDash([10, 8]); g.strokeStyle = T.accent; g.lineWidth = 3; g.beginPath(); g.moveTo(40, ty); g.lineTo(W - 90, ty); g.stroke(); g.setLineDash([]);
    txt(g, `${Math.round(target)}°`, W - 80, ty, 16, T["accent-ink"], { align: "left", font: T.mono, weight: 600 });
    // lantern
    const lx = W * 0.42, ly = yOf(a.pitch);
    g.strokeStyle = alpha(T.ink, 0.35); g.lineWidth = 2; g.beginPath(); g.moveTo(lx, ly + 34); g.lineTo(lx, H); g.stroke();
    const glow = g.createRadialGradient(lx, ly, 4, lx, ly, 70); glow.addColorStop(0, alpha(T.accent, 0.55)); glow.addColorStop(1, alpha(T.accent, 0));
    g.fillStyle = glow; g.beginPath(); g.arc(lx, ly, 70, 0, TAU); g.fill();
    rr(g, lx - 22, ly - 30, 44, 60, 14); g.fillStyle = T.accent; g.fill();
    g.fillStyle = alpha(T.surface, 0.6); rr(g, lx - 12, ly - 18, 24, 36, 8); g.fill();
    if (state === "raise" && hold > 0) { g.strokeStyle = T.go; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.arc(lx, ly, 46, -Math.PI / 2, -Math.PI / 2 + TAU * (hold / HOLD)); g.stroke(); g.lineCap = "butt"; }
    g.fillStyle = T.accent; sparkle.forEach((s) => { g.globalAlpha = clamp(s.life / 0.8, 0, 1); g.beginPath(); g.arc(lx + s.x, ty + s.y, 3, 0, TAU); g.fill(); }); g.globalAlpha = 1;
    // goniometer
    drawGonio(g, W - 230, H - 24, Math.min(110, W * 0.12), a.pitch, target, "Arm raise");
  };
  return G;
}

RC.register(Object.assign({ section: "arm" }, {
    id: "lift", name: "Lantern Lift", movement: "Shoulder flexion · arm raise", axes: "Pitch",
    brain: false, mount: "Strap the phone to the forearm of your affected arm, screen up, top edge toward your hand. Or hold it flat in your palm.",
    desc: "Raise your arm to lift the lantern to the line, hold it there, then lower slowly.",
    source: "FitMi and Flint arm raises; Penumbra REAL shoulder range-of-motion activities.",
    how: ["Sit tall with your arm resting on the table.", "Raise your arm forward until the lantern touches the line.", "Hold while the ring fills, then lower slowly to rest."],
    make: (S) => LanternLift(S),
  }));

// ================================================================ more arm & shoulder exercises
const { Reach, Cursor, RepCounter, bg, dots, randInt, defineArt } = RC.kit;
const mountPalm = "Hold the phone flat in your affected hand, screen up.";

// A target band across the stage and a marker that rises with the measured angle.
function drawBar(g, W, H, o, label, color) {
  const top = 170, bottom = H - 70, x = W * 0.36, span = Math.max(20, Math.abs(o.target) * 1.4);
  const yOf = (v) => lerp(bottom, top, clamp(Math.abs(v) / span, 0, 1.05));
  const ty = yOf(o.target);
  g.fillStyle = alpha(T.accent, 0.14); g.fillRect(40, ty - 14, W - 300, 28);
  g.setLineDash([10, 8]); g.strokeStyle = T.accent; g.lineWidth = 3; g.beginPath(); g.moveTo(40, ty); g.lineTo(W - 260, ty); g.stroke(); g.setLineDash([]);
  const y = yOf(o.val);
  g.strokeStyle = alpha(T.ink, 0.2); g.lineWidth = 3; g.beginPath(); g.moveTo(x, bottom + 30); g.lineTo(x, y); g.stroke();
  g.beginPath(); g.arc(x, y, 26, 0, TAU); g.fillStyle = color || T.accent; g.fill();
  if (o.prog > 0) { g.strokeStyle = T.go; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.arc(x, y, 36, -Math.PI / 2, -Math.PI / 2 + TAU * o.prog); g.stroke(); g.lineCap = "butt"; }
  txt(g, label, x, bottom + 50, 15, T.muted, { font: T.body, weight: 400 });
}

// ---- Side Raise: shoulder abduction (phone on the upper arm, measured as roll)
function SideRaise(S) {
  return Reach(S, {
    signal: (a) => Math.abs(a.roll), target: (S) => S.amp, rest: (S) => S.amp * 0.35, hold: 1, label: "Side raise",
    title: "Lift your arm out to the side", restTitle: "Arm down by your side",
    draw: (g, W, H, o) => {
      // a figure from the front: the arm swings out to the side
      const cx = W * 0.4, cy = H * 0.5, L = Math.min(H * 0.32, 170);
      g.fillStyle = alpha(T.ink, 0.1); g.beginPath(); g.arc(cx, cy - L * 0.75, 26, 0, TAU); g.fill(); rr(g, cx - 34, cy - L * 0.55, 68, L * 1.05, 26); g.fill();
      const ang = (deg) => Math.PI / 2 - (clamp(deg, 0, 100) * Math.PI) / 180;
      const sx = cx + 34, sy = cy - L * 0.45;
      g.setLineDash([8, 7]); g.strokeStyle = T.accent; g.lineWidth = 3; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(ang(Math.abs(o.target))) * L * 1.1, sy + Math.sin(ang(Math.abs(o.target))) * L * 1.1); g.stroke(); g.setLineDash([]);
      g.strokeStyle = T.accent; g.lineWidth = 22; g.lineCap = "round"; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(ang(o.val)) * L, sy + Math.sin(ang(o.val)) * L); g.stroke(); g.lineCap = "butt";
      if (o.prog > 0) { g.strokeStyle = T.go; g.lineWidth = 6; g.beginPath(); g.arc(sx, sy, 40, -Math.PI / 2, -Math.PI / 2 + TAU * o.prog); g.stroke(); }
    },
  });
}

// ---- Cup to Mouth: elbow flexion, lifting a cup to drink and holding
function CupToMouth(S) {
  return Reach(S, {
    signal: (a) => a.pitch, target: (S) => Math.min(S.amp * 1.5, 55), rest: (S) => S.amp * 0.4, hold: 1.5, label: "Elbow bend",
    title: "Bring the cup to your mouth", restTitle: "Lower the cup to the table", restText: "Rest your forearm, then lift again.",
    draw: (g, W, H, o) => {
      const x = W * 0.36, top = 190, bottom = H - 90, y = lerp(bottom, top, clamp(o.val / Math.max(1, o.target), 0, 1.05));
      g.fillStyle = alpha(T.ink, 0.1); g.beginPath(); g.ellipse(x, top - 40, 60, 46, 0, 0, TAU); g.fill(); // face
      g.strokeStyle = alpha(T.ink, 0.35); g.lineWidth = 4; g.beginPath(); g.arc(x, top - 30, 16, 0.2, Math.PI - 0.2); g.stroke(); // mouth
      g.fillStyle = T.surface; g.strokeStyle = T.ink; g.lineWidth = 3; rr(g, x - 26, y - 30, 52, 60, 10); g.fill(); g.stroke();
      g.fillStyle = T.accent; rr(g, x - 23, y - 8, 46, 35, 8); g.fill();
      g.beginPath(); g.arc(x + 32, y, 14, -Math.PI / 2, Math.PI / 2); g.stroke();
      if (o.prog > 0) { g.strokeStyle = T.go; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.arc(x, y, 48, -Math.PI / 2, -Math.PI / 2 + TAU * o.prog); g.stroke(); g.lineCap = "butt"; }
    },
  });
}

// ---- Bowl Lift: both hands hold the phone like a bowl; reps only count while it stays level
function BowlLift(S) {
  let levelT = 0, total = 0;
  const G = Reach(S, {
    signal: (a) => a.pitch, target: (S) => S.amp, rest: (S) => S.amp * 0.35, hold: 1.2, label: "Two-hand lift",
    valid: (a) => Math.abs(a.roll) < 8,
    title: "Lift the bowl with both hands", cue: "Keep it level so nothing spills.", restTitle: "Bowl down on the table",
    stats: () => [["Kept level", total ? `${Math.round((levelT / total) * 100)}%` : "–"]],
    draw: (g, W, H, o) => {
      const x = W * 0.38, top = 180, bottom = H - 90, y = lerp(bottom, top, clamp(o.val / Math.max(1, o.target), 0, 1.05));
      const tilt = clamp(o.a.roll, -30, 30) * Math.PI / 180, spill = Math.abs(o.a.roll) >= 8;
      g.save(); g.translate(x, y); g.rotate(tilt);
      g.fillStyle = spill ? alpha(T.accent, 0.8) : T.accent; g.beginPath(); g.ellipse(0, -6, 64, 12, 0, 0, TAU); g.fill();
      g.fillStyle = T.surface; g.strokeStyle = T.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(-70, -6); g.quadraticCurveTo(0, 70, 70, -6); g.closePath(); g.fill(); g.stroke();
      g.restore();
      txt(g, spill ? "Level it out" : "Level", x, y + 70, 16, spill ? T["accent-ink"] : T.go, { font: T.body });
      if (o.prog > 0) { g.strokeStyle = T.go; g.lineWidth = 6; g.beginPath(); g.arc(x, y + 10, 84, Math.PI, Math.PI + Math.PI * o.prog); g.stroke(); }
    },
  });
  const up = G.update;
  G.update = function (dt, a) { total += dt; if (Math.abs(a.roll) < 8) levelT += dt; up.call(this, dt, a); };
  return G;
}

// ---- Reach Targets: tilt-steer a cursor onto the lit target of a 3×3 board (GRASP target board)
function ReachTargets(S) {
  const G = base(S, S.reps), cur = Cursor({ amp: S.amp });
  let rects = [], lit = randInt(0, 8), t0 = 0, t = 0, times = [];
  const DWELL = 0.8;
  G.update = function (dt, a) {
    t += dt;
    cur.update(dt, a, Game.W || 800, Game.H || 500); cur.active = true; // motion exercise: the mouse stands in for tilt
    const hit = cur.dwell(dt, rects.map((r, i) => (i === lit ? r : null)), DWELL);
    if (hit === lit) {
      this._reps++; times.push(t - t0); t0 = t; this.events.push("success");
      let n; do { n = randInt(0, 8); } while (n === lit); lit = n;
      if (this._reps >= S.reps) this.done = true;
    }
  };
  G.status = () => ({ title: "Reach for the lit circle", text: "Tilt to move the dot there, then hold still." });
  G.stats = () => [["Targets hit", `${G._reps} / ${S.reps}`], ["Average time to target", times.length ? `${(times.reduce((s, x) => s + x, 0) / times.length).toFixed(1)} s` : "–"]];
  G.debug = () => ({ lit, rects, cursor: { x: cur.x, y: cur.y } });
  G.draw = function (g, W, H) {
    Game.W = W; Game.H = H;
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    const size = Math.min(W * 0.62, H - 190), cell = size / 3, x0 = W / 2 - size / 2, y0 = 160 + (H - 170 - size) / 2;
    rects = [];
    for (let i = 0; i < 9; i++) {
      const cx = x0 + (i % 3) * cell + cell / 2, cy = y0 + Math.floor(i / 3) * cell + cell / 2, r = cell * 0.3;
      rects.push({ x: cx - r, y: cy - r, w: r * 2, h: r * 2 });
      g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fillStyle = i === lit ? T.accent : alpha(T.ink, 0.06); g.fill();
    }
    cur.draw(g, DWELL);
  };
  return G;
}

// ---- Push Away: a forward push shows up as an acceleration spike, then the arm settles back
function PushAway(S) {
  const G = base(S, S.reps), thr = { 1: 2, 2: 3, 3: 4 }[S.level] || 3;
  let phase = "ready", still = 0, peak = 0, peaks = [], ball = 0, accNow = 0;
  G.update = function (dt, a) {
    accNow = a.acc;
    if (phase === "ready" && a.acc > thr) { phase = "push"; peak = a.acc; this.events.push("tick"); }
    else if (phase === "push") {
      peak = Math.max(peak, a.acc);
      if (a.acc < 1) { still += dt; if (still > 0.6) { phase = "ready"; still = 0; peaks.push(peak); this._reps++; this.events.push("success"); if (this._reps >= S.reps) this.done = true; } } else still = 0;
    }
    ball = phase === "push" ? Math.min(1, ball + dt * 3) : Math.max(0, ball - dt * 1.5);
  };
  G.status = () => (phase === "ready" ? { title: "Push your hand forward", text: "Straighten your arm in one smooth push." } : { title: "Now bring it back and rest", text: "Hold still for a moment." });
  G.stats = () => [["Pushes", `${G._reps} / ${S.reps}`], ["Strongest push", peaks.length ? `${Math.max(...peaks).toFixed(1)} m/s²` : "–"]];
  G.debug = () => ({ phase, accNow });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    const y = H * 0.58, x0 = W * 0.15, x1 = W * 0.8;
    rr(g, x0, y - 6, x1 - x0, 12, 6); g.fillStyle = alpha(T.ink, 0.1); g.fill();
    g.fillStyle = alpha(T.go, 0.25); g.fillRect(x1 - 10, y - 50, 10, 100);
    const bx = lerp(x0 + 30, x1 - 40, ball);
    g.beginPath(); g.arc(bx, y, 30, 0, TAU); g.fillStyle = T.accent; g.fill();
    const m = clamp(accNow / (thr * 2), 0, 1);
    rr(g, x0, y + 70, (x1 - x0) * m, 14, 7); g.fillStyle = accNow > thr ? T.go : alpha(T.ink, 0.25); g.fill();
    txt(g, "Push strength", x0, y + 100, 14, T.muted, { align: "left", font: T.body, weight: 400 });
  };
  return G;
}

// ---- Table Slide: slide the phone out across the table and back (yaw swing, or two accel spikes)
function TableSlide(S) {
  const G = base(S, S.reps), rc = RepCounter({ target: S.amp * 0.7, rest: S.amp * 0.25, hold: 0.25, reps: S.reps });
  let spikes = [], t = 0, yaw = 0;
  G.update = function (dt, a) {
    t += dt; yaw = a.yaw;
    let rep = rc.update(dt, Math.abs(a.yaw)) === "rep";
    if (!a.demo && a.acc > 2 && (!spikes.length || t - spikes[spikes.length - 1] > 0.4)) spikes.push(t);
    spikes = spikes.filter((s) => t - s < 3);
    if (spikes.length >= 2) { spikes = []; rep = true; }
    if (rep) { this._reps++; this.events.push("success"); if (this._reps >= S.reps) this.done = true; }
  };
  G.status = () => ({ title: "Slide the phone out and back", text: "Keep your hand on it and glide along the table." });
  G.stats = () => [["Slides", `${G._reps} / ${S.reps}`]];
  G.debug = () => ({ yaw, state: rc.state });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    const y = H * 0.55, cx = W / 2, span = W * 0.32, x = cx + clamp(yaw / (S.amp * 0.7), -1.2, 1.2) * span;
    rr(g, cx - span - 40, y - 50, span * 2 + 80, 100, 24); g.fillStyle = alpha(T.ink, 0.05); g.fill();
    g.setLineDash([8, 7]); g.strokeStyle = T.accent; g.lineWidth = 3;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * span, y - 46); g.lineTo(cx + s * span, y + 46); g.stroke(); }
    g.setLineDash([]); rr(g, x - 26, y - 40, 52, 80, 12); g.fillStyle = T.accent; g.fill();
  };
  return G;
}

// ---- Trace It: steer a cursor along a shape; score is how much of the path stayed on the line
function TraceIt(S) {
  const shapesGoal = Math.max(1, Math.round(S.reps / 5)), G = base(S, shapesGoal), cur = Cursor({ amp: S.amp });
  let path = [], idx = 0, onT = 0, total = 0, scores = [], W0 = 0, H0 = 0;
  function build(W, H) {
    const cx = W / 2, cy = H * 0.56, R = Math.min(W * 0.26, (H - 200) * 0.42), pts = [], N = 120;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      if (S.level === 1) pts.push([cx + Math.cos(u * TAU - Math.PI / 2) * R, cy + Math.sin(u * TAU - Math.PI / 2) * R]);
      else if (S.level === 2) { const s = u * 4, k = Math.floor(s) % 4, f = s - Math.floor(s), c = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]]; pts.push([cx + lerp(c[k][0], c[k + 1][0], f) * R, cy + lerp(c[k][1], c[k + 1][1], f) * R]); }
      else pts.push([cx + Math.sin(u * TAU) * R, cy + Math.sin(u * TAU * 2) * R * 0.55]);
    }
    return pts;
  }
  G.update = function (dt, a) {
    if (!path.length) return;
    cur.update(dt, a, W0, H0); cur.active = true;
    total += dt;
    const tol = 34;
    for (let k = idx; k < Math.min(path.length, idx + 8); k++) if (Math.hypot(path[k][0] - cur.x, path[k][1] - cur.y) < tol) { idx = k + 1; break; }
    if (Math.hypot(path[Math.min(idx, path.length - 1)][0] - cur.x, path[Math.min(idx, path.length - 1)][1] - cur.y) < tol * 1.6) onT += dt;
    if (idx >= path.length - 1) {
      scores.push(Math.round((onT / Math.max(0.1, total)) * 100)); this._reps++; this.events.push("success");
      idx = 0; onT = 0; total = 0; if (this._reps >= shapesGoal) this.done = true;
    }
  };
  G.status = () => ({ title: "Trace the shape", text: "Follow the line from the dot. Slow and steady is best." });
  G.stats = () => [["Shapes", `${G._reps} / ${shapesGoal}`], ["Accuracy", scores.length ? `${Math.round(scores.reduce((s, x) => s + x, 0) / scores.length)}%` : "–"]];
  G.debug = () => ({ idx, n: path.length, next: path[Math.min(idx + 3, path.length - 1)], cursor: { x: cur.x, y: cur.y } });
  G.draw = function (g, W, H) {
    if (W !== W0 || H !== H0) { W0 = W; H0 = H; path = build(W, H); }
    bg(g, W, H); dots(g, W, shapesGoal, this._reps);
    g.lineCap = "round"; g.lineJoin = "round";
    g.strokeStyle = alpha(T.ink, 0.12); g.lineWidth = 30; g.beginPath(); path.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    g.strokeStyle = T.go; g.lineWidth = 8; g.beginPath(); path.slice(0, idx + 1).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    const n = path[Math.min(idx, path.length - 1)]; g.beginPath(); g.arc(n[0], n[1], 12, 0, TAU); g.fillStyle = T.accent; g.fill();
    g.lineCap = "butt"; cur.draw(g);
  };
  return G;
}

const ARM = [
  { id: "sideraise", name: "Side Raise", movement: "Shoulder abduction", control: "tilt", mount: "Strap the phone to the outside of your affected upper arm, screen facing out.",
    desc: "Lift your arm out to the side to the line, hold, then lower.", source: "FitMi side arm raise; GRASP arm strengthening.",
    how: ["Sit tall with your arm by your side.", "Lift it out to the side until the arm reaches the dashed line.", "Hold while the ring fills, then lower slowly."], make: SideRaise },
  { id: "reach", name: "Reach Targets", movement: "Diagonal reach · aiming", control: "tilt", mount: mountPalm,
    desc: "Reach toward the lit circle on a 3×3 board and hold still on it.", source: "GRASP target board; FitMi diagonal reach.",
    how: ["Rest your forearm on the table.", "Tilt toward the lit circle to move the dot there.", "Hold still until the ring fills; a new circle lights up."], make: ReachTargets },
  { id: "cupmouth", name: "Cup to Mouth", movement: "Elbow flexion · drinking", control: "tilt", mount: "Hold the phone upright in your affected hand like a cup.",
    desc: "Lift the cup to your mouth, hold for a sip, then lower it.", source: "mRehab Sip from Mug; FitMi bicep curl.",
    how: ["Start with your forearm resting on the table.", "Bend your elbow to bring the phone toward your mouth.", "Hold for a sip while the ring fills, then lower."], make: CupToMouth },
  { id: "push", name: "Push Away", movement: "Elbow extension · forward push", control: "accel", mount: "Hold the phone in your affected hand, arm bent, elbow at your side.",
    desc: "Push your hand forward in one smooth movement, then bring it back.", source: "FitMi straight push and forward punches.",
    how: ["Start with your elbow bent and your hand near your chest.", "Push your hand straight forward.", "Bring it back and hold still before the next push."], make: PushAway },
  { id: "slide", name: "Table Slide", movement: "Horizontal reach across a table", control: "accel", mount: "Put the phone flat on the table under your affected hand.",
    desc: "Slide the phone out across the table and back again.", source: "mRehab horizontal bowl and mug.",
    how: ["Rest your hand on the phone on the table.", "Slide it out to one side, as far as is comfortable.", "Slide it back to the middle."], make: TableSlide },
  { id: "bowl", name: "Bowl Lift", movement: "Two-handed lift · keeping level", control: "tilt", mount: "Hold the phone flat between both hands like a bowl.",
    desc: "Lift the bowl with both hands and keep it level so nothing spills.", source: "mRehab vertical bowl; GRASP repetitions using both arms.",
    how: ["Hold the phone flat in both hands.", "Lift it to the line, keeping it level.", "Hold, then lower it to the table."], make: BowlLift },
  { id: "trace", name: "Trace It", movement: "Controlled multi-direction reaching", control: "tilt", mount: mountPalm,
    desc: "Steer the dot along a circle, a square or a figure-8.", source: "Penumbra REAL range-of-motion activities; RAPAEL house painting.",
    params: { reps: [5, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null },
    how: ["Rest your forearm on the table.", "Tilt slowly to move the dot along the line.", "Finish the shape; level 2 is a square, level 3 a figure-8."], make: TraceIt },
];
ARM.forEach((d) => RC.register(Object.assign({ section: "arm" }, d)));

defineArt("sideraise", '<circle cx="48" cy="18" r="7" fill="var(--a-mute)" opacity=".35"/><rect x="40" y="27" width="16" height="30" rx="7" fill="var(--a-mute)" opacity=".35"/><path d="M56 31 L92 14" stroke="var(--a-hi)" stroke-width="7" stroke-linecap="round"/><path d="M56 31 L100 31" stroke="var(--a-hi)" stroke-width="2" stroke-dasharray="4 4"/>');
defineArt("reach", Array.from({ length: 9 }, (_, i) => `<circle cx="${36 + (i % 3) * 24}" cy="${10 + Math.floor(i / 3) * 22}" r="7" fill="${i === 2 ? "var(--a-hi)" : "var(--a-mute)"}" opacity="${i === 2 ? 1 : 0.25}"/>`).join("") + '<circle cx="66" cy="36" r="4" fill="var(--a-ink)"/>');
defineArt("cupmouth", '<ellipse cx="60" cy="14" rx="18" ry="11" fill="var(--a-mute)" opacity=".3"/><rect x="50" y="30" width="20" height="24" rx="4" fill="var(--a-bg)" stroke="var(--a-ink)" stroke-width="2"/><rect x="51" y="40" width="18" height="13" rx="3" fill="var(--a-hi)"/><path d="M60 28 V22" stroke="var(--a-go)" stroke-width="2" stroke-dasharray="3 3"/>');
defineArt("push", '<rect x="18" y="38" width="84" height="6" rx="3" fill="var(--a-mute)" opacity=".25"/><circle cx="70" cy="41" r="11" fill="var(--a-hi)"/><path d="M34 41 H52" stroke="var(--a-ink)" stroke-width="2.5" stroke-linecap="round"/><path d="M48 36 L54 41 L48 46" fill="none" stroke="var(--a-ink)" stroke-width="2.5" stroke-linecap="round"/>');
defineArt("slide", '<rect x="16" y="22" width="88" height="26" rx="10" fill="var(--a-mute)" opacity=".15"/><rect x="66" y="25" width="14" height="20" rx="3" fill="var(--a-hi)"/><path d="M24 22 V48 M96 22 V48" stroke="var(--a-hi)" stroke-width="2" stroke-dasharray="3 3"/><path d="M40 35 H58" stroke="var(--a-ink)" stroke-width="2.5" stroke-linecap="round"/>');
defineArt("bowl", '<ellipse cx="60" cy="26" rx="26" ry="5" fill="var(--a-hi)"/><path d="M33 26 Q60 58 87 26 Z" fill="var(--a-bg)" stroke="var(--a-ink)" stroke-width="2"/><path d="M20 26 H100" stroke="var(--a-go)" stroke-width="1.5" stroke-dasharray="3 4"/>');
defineArt("trace", '<path d="M30 32 C30 8 90 8 90 32 C90 56 30 56 30 32" fill="none" stroke="var(--a-mute)" stroke-opacity=".3" stroke-width="7"/><path d="M30 32 C30 8 90 8 90 32" fill="none" stroke="var(--a-go)" stroke-width="3"/><circle cx="90" cy="32" r="4" fill="var(--a-hi)"/>');
})();
