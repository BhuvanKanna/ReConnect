// Trunk & legs: seated trunk control, standing work (locked until the provider turns it on) and leg reps.
(() => {
"use strict";
const RC = window.RC;
const { clamp, lerp, TAU, T, alpha, txt, rr, fmtTime } = RC;
const { base, bg, dots, Guided, defineArt } = RC.kit;
// Draw with a 3D scene from the js/play3d-scenes files when the computer can (the game still does the scoring).
const in3D = (G, id) => (RC.Play3D ? RC.Play3D.wrap(G, id) : G);

// ---- Lean & Shift: seated weight shift to the left, right and forward
function LeanShift(S) {
  const G = base(S, S.reps), DIRS = ["left", "right", "forward"], amp = S.amp * 0.6, HOLD = 2;
  let k = 0, hold = 0, need = false, pitch = 0, roll = 0, best = { left: 0, right: 0, forward: 0 };
  const dir = () => DIRS[k % 3];
  const along = (d) => (d === "left" ? -roll : d === "right" ? roll : pitch);
  G.update = function (dt, a) {
    pitch = a.pitch; roll = a.roll;
    best.left = Math.max(best.left, -roll); best.right = Math.max(best.right, roll); best.forward = Math.max(best.forward, pitch);
    if (need) { if (Math.hypot(pitch, roll) < amp * 0.35) need = false; return; }
    if (along(dir()) >= amp * 0.9) { hold += dt; if (hold >= HOLD) { this._reps++; this.events.push("success"); hold = 0; need = true; k++; if (this._reps >= S.reps) this.done = true; } }
    else hold = Math.max(0, hold - dt * 1.5);
  };
  G.status = () => (need ? { title: "Sit up tall in the middle", text: "Then lean to the next target." } : hold > 0.05 ? { title: "Hold the lean", text: `${Math.max(0, HOLD - hold).toFixed(1)} s`, tone: "good" } : { title: `Lean ${dir() === "forward" ? "forward" : "to the " + dir()}`, text: "Keep both feet flat on the floor." });
  G.stats = () => [["Leaned left", `${Math.round(best.left)}°`], ["Leaned right", `${Math.round(best.right)}°`], ["Leaned forward", `${Math.round(best.forward)}°`]];
  G.debug = () => ({ dir: dir(), need, hold });
  // For the 3D scene and the direction pad (js/play3d.js): x, y are the lean as a share of the target lean.
  const PAD = { left: [-0.9, 0], right: [0.9, 0], forward: [0, 0.9] }, PADS = [PAD.left, PAD.right, PAD.forward];
  G.view = () => ({ type: "direction", lean: true, phase: need ? "back" : "go", dir: dir(), d: PAD[dir()], dirs: PADS, x: roll / amp, y: pitch / amp, prog: hold / HOLD, reps: G._reps, goal: S.reps });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    const cx = W / 2, cy = H * 0.58, R = Math.min(W * 0.3, H * 0.34), sc = R / (amp * 1.4);
    g.fillStyle = alpha(T.ink, 0.05); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    const pos = { left: [-amp, 0], right: [amp, 0], forward: [0, amp] };
    for (const d of DIRS) { const [x, y] = pos[d]; g.beginPath(); g.arc(cx + x * sc, cy - y * sc, 26, 0, TAU); g.fillStyle = d === dir() && !need ? T.accent : alpha(T.accent, 0.2); g.fill(); }
    const px = cx + clamp(roll, -amp * 1.4, amp * 1.4) * sc, py = cy - clamp(pitch, -amp * 1.4, amp * 1.4) * sc;
    g.beginPath(); g.arc(px, py, 14, 0, TAU); g.fillStyle = T.ink; g.fill();
    if (hold > 0) { g.strokeStyle = T.go; g.lineWidth = 6; g.beginPath(); g.arc(px, py, 24, -Math.PI / 2, -Math.PI / 2 + TAU * (hold / HOLD)); g.stroke(); }
  };
  return G;
}

// ---- Trunk Twist: rotate the upper body left and right (yaw)
// A 3D world you look around in (js/twist3d.js, scene picked on the setup screen): turning your shoulders
// turns the view, and an animal waits on one side to be found. Hold still on it for a moment, then turn
// to the other side for the next one. Right then left is one repetition. Draws flat until 3D is ready.
function TrunkTwist(S) {
  const G = base(S, S.reps), tgt = { 1: 20, 2: 30, 3: 40 }[S.level] || 30, GAIN = 2.4, HOLD = 1;
  const TW = RC.Twist3D, scn = TW ? TW.sceneOf(S.scene) : { id: "jungle", name: "Jungle" };
  const quality = RC.Scene3D ? RC.Scene3D.quality() : { sample: () => 2 };
  if (TW) TW.ensure();
  let side = 0, dwell = 0, yaw = 0, range = [0, 0], found = 0, view = 0, lastT = null, world = null, shown = -1, sparkle = [], pop = 0;
  G.update = function (dt, a) {
    yaw = a.yaw; range = [Math.min(range[0], yaw), Math.max(range[1], yaw)];
    const want = side === 0 ? tgt : -tgt;
    if ((want > 0 ? yaw >= want * 0.9 : yaw <= want * 0.9)) {
      dwell += dt;
      if (dwell >= HOLD) {
        const n = name(); dwell = 0; found++; pop = 1;
        if (n && RC.flash && !this.done) RC.flash(`You found the ${n}!`, side === 0 ? "Now turn to the left" : "Now turn to the right", "good");
        if (side === 1) { this._reps++; this.events.push("success"); if (this._reps >= S.reps) this.done = true; } else this.events.push("tick");
        side = 1 - side;
      }
    } else dwell = Math.max(0, dwell - dt * 2);
  };
  const name = () => (world ? world.name(found) : "");
  // Short words: which way to turn, and what you're looking for.
  G.status = function () {
    const n = name(), dir = side === 0 ? "right" : "left";
    if (dwell > 0.05) return { title: n ? `Keep looking at the ${n}` : "Hold it there", text: "Hold still", tone: "good" };
    const done = G._reps ? `${G._reps} of ${S.reps} done` : "";
    return { title: `Turn to the ${dir}`, text: n ? `Find the ${n}` + (done ? ` · ${done}` : "") : done || "Keep your hips facing forward" };
  };
  G.stats = () => [["Turned left", `${Math.round(-range[0])}°`], ["Turned right", `${Math.round(range[1])}°`], ["Scene", scn.name]];
  G.dispose = () => { if (world) { world.dispose(); world = null; } };
  G.debug = () => ({ kind: "value", target: side === 0 ? tgt : -tgt, val: yaw, side, view: world ? "3d" : "2d", quality: quality.level, found, name: name() });
  G.draw = function (g, W, H, a, t) {
    const raw = lastT == null ? 0 : t - lastT, dt = Math.min(0.05, Math.max(0, raw)); lastT = t;
    const q = world ? quality.sample() : 0;
    if (q >= 2 && world) { world.dispose(); world = null; RC.Scene3D.off = true; }
    if (!world && !RC.Scene3D.off && TW && TW.ready()) { world = TW.create({ scene: scn.id, bearing: tgt * GAIN, calm: RC.reduceMotion }); shown = -1; }
    if (!world) return drawFlat(g, W, H);
    if (shown !== found) { if (shown >= 0) world.cheer(); world.show(found, (side === 0 ? 1 : -1) * tgt * GAIN); shown = found; if (pop) burst(); }
    view += (clamp(yaw * GAIN, -160, 160) - view) * Math.min(1, dt * 9);
    world.lowQuality(q >= 1);
    const pr = (g.getTransform ? g.getTransform().a : 1) * (q >= 1 ? 0.6 : 1);
    g.drawImage(world.frame(W, H, pr, { view }, t, dt), 0, 0, W, H);
    pop = Math.max(0, pop - dt);
    const unit = Math.min(W, H) / 600, sp = world.spotScreen(W, H, view);
    sparkle = sparkle.filter((s) => (s.life -= dt) > 0); sparkle.forEach((s) => { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 60 * dt; });
    g.fillStyle = "#ffd27a"; sparkle.forEach((s) => { g.globalAlpha = clamp(s.life / 0.9, 0, 1); g.beginPath(); g.arc(W / 2 + s.x * unit, H * 0.5 + s.y * unit, 5 * unit, 0, TAU); g.fill(); }); g.globalAlpha = 1;
    if (!sp) return;
    if (sp.front && Math.abs(sp.off) < 30) {
      const r = sp.r * (1 + (RC.reduceMotion ? 0 : Math.sin(t * 4) * 0.04));
      g.save(); g.lineWidth = 6 * unit; g.strokeStyle = "rgba(255,255,255,0.8)"; g.setLineDash([14 * unit, 10 * unit]); g.beginPath(); g.arc(sp.x, sp.y, r, 0, TAU); g.stroke(); g.setLineDash([]);
      if (dwell > 0) { g.lineCap = "round"; g.lineWidth = 11 * unit; g.strokeStyle = "#5ee0a0"; g.beginPath(); g.arc(sp.x, sp.y, r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(dwell / HOLD, 0, 1)); g.stroke(); }
      g.restore();
      label(g, sp.name.charAt(0).toUpperCase() + sp.name.slice(1), sp.x, Math.max(30 * unit, sp.y - r - 26 * unit), unit);
    }
    if (!sp.front || Math.abs(sp.off) > 14) arrow(g, W, H, sp.off > 0 ? 1 : -1, t, unit);
  };
  function burst() { if (RC.reduceMotion) return; for (let i = 0; i < 26; i++) { const ang = Math.random() * TAU, v = 60 + Math.random() * 140; sparkle.push({ x: 0, y: 0, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 40, life: 0.9 }); } }
  function label(g, s, x, y, unit) {
    g.save(); g.font = `700 ${Math.round(22 * unit)}px ${T.display || "sans-serif"}`;
    const w = g.measureText(s).width + 28 * unit, h = 38 * unit;
    g.fillStyle = "rgba(20,24,40,0.72)"; rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fill();
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(s, x, y + 1); g.restore();
  }
  // Big chevrons near the screen edge pointing the way to turn, with the words underneath
  function arrow(g, W, H, dir, t, unit) {
    const x0 = dir > 0 ? W - 150 * unit : 150 * unit, y = H * 0.52, n = 3, ph = RC.reduceMotion ? 0.5 : (t * 0.9) % 1, sz = 30 * unit;
    g.save(); g.lineJoin = "round"; g.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const u = (i + ph) / n, x = x0 + dir * (u - 0.5) * 120 * unit;
      g.globalAlpha = clamp(0.3 + Math.sin(u * Math.PI) * 0.7, 0, 1);
      g.beginPath(); g.moveTo(x - dir * sz * 0.55, y - sz); g.lineTo(x + dir * sz * 0.45, y); g.lineTo(x - dir * sz * 0.55, y + sz);
      g.lineWidth = 18 * unit; g.strokeStyle = "rgba(20,16,40,0.7)"; g.stroke(); g.lineWidth = 10 * unit; g.strokeStyle = "#ffd27a"; g.stroke();
    }
    g.globalAlpha = 1; g.restore(); label(g, dir > 0 ? "Turn right" : "Turn left", x0, y + 64 * unit, unit);
  }
  function drawFlat(g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, G._reps);
    const cx = W / 2, cy = H * 0.6, R = Math.min(W * 0.32, H * 0.36);
    g.fillStyle = alpha(T.ink, 0.06); g.beginPath(); g.ellipse(cx, cy, R, R * 0.45, 0, 0, TAU); g.fill();
    for (const s of [1, -1]) { const A = (-90 + s * tgt * 1.6) * Math.PI / 180; g.beginPath(); g.arc(cx + Math.cos(A) * R, cy + Math.sin(A) * R * 0.45, 20, 0, TAU); g.fillStyle = (s === 1) === (side === 0) ? T.accent : alpha(T.accent, 0.2); g.fill(); }
    const A = (-90 + clamp(yaw, -60, 60) * 1.6) * Math.PI / 180;
    g.strokeStyle = T.ink; g.lineWidth = 16; g.lineCap = "round"; g.beginPath(); g.moveTo(cx - Math.cos(A) * R * 0.7, cy - Math.sin(A) * R * 0.32); g.lineTo(cx + Math.cos(A) * R * 0.7, cy + Math.sin(A) * R * 0.32); g.stroke(); g.lineCap = "butt";
    g.beginPath(); g.arc(cx, cy, 22, 0, TAU); g.fillStyle = alpha(T.ink, 0.25); g.fill();
  }
  return G;
}

// ---- Spike counter: each acceleration spike (after a short settle) is a movement; used by
// Sit to Stand (two spikes: stand, then sit) and Seated March (one spike per knee lift).
function Spikes(S, spec) {
  const G = base(S, S.reps);
  let t = 0, last = -9, armed = true, phase = 0, times = [], acc = 0, repStart = 0;
  G.update = function (dt, a) {
    t += dt; acc = a.acc;
    if (armed && a.acc > spec.thr && t - last > spec.gap) {
      armed = false; last = t; phase++;
      if (phase >= spec.per) { phase = 0; this._reps++; times.push(t - repStart); repStart = t; this.events.push("success"); if (this._reps >= S.reps) this.done = true; }
      else this.events.push("tick");
    }
    if (!armed && a.acc < spec.thr * 0.4) armed = true;
  };
  G.status = () => ({ title: spec.cues[phase], text: `${G._reps} of ${S.reps} done` });
  G.stats = () => [["Reps", `${G._reps} / ${S.reps}`], ["Average time per rep", times.length ? `${(times.reduce((s, x) => s + x, 0) / times.length).toFixed(1)} s` : "–"]];
  G.debug = () => ({ phase, acc });
  // For the 3D scenes: the same fields as the Bursts engine's view in js/moves.js.
  G.view = () => ({ type: "bursts", acc, thr: spec.thr, a: acc / spec.thr, armed, phase, per: spec.per, beat: G._reps * spec.per + phase, reps: G._reps, goal: S.reps });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    spec.draw(g, W, H, { phase, acc, thr: spec.thr });
  };
  return G;
}
function SitToStand(S) {
  return Spikes(S, { thr: 2, gap: 0.8, per: 2, cues: ["Stand up", "Now sit down slowly"], draw: (g, W, H, o) => {
    const cx = W / 2, base0 = H - 80, up = o.phase === 1;
    g.fillStyle = alpha(T.ink, 0.12); rr(g, cx + 30, base0 - 120, 90, 14, 6); g.fill(); rr(g, cx + 106, base0 - 230, 14, 230, 6); g.fill(); // chair
    const hy = up ? base0 - 300 : base0 - 210;
    g.fillStyle = T.accent; g.beginPath(); g.arc(cx, hy, 26, 0, TAU); g.fill(); rr(g, cx - 24, hy + 32, 48, up ? 150 : 90, 20); g.fill();
    txt(g, "Chair behind you · someone nearby", cx, base0 + 40, 15, T.muted, { font: T.body, weight: 400 });
  } });
}
function SeatedMarch(S) {
  return Spikes(S, { thr: 1.5, gap: 0.5, per: 1, cues: ["Lift one knee, then the other"], draw: (g, W, H, o) => {
    const cx = W / 2, cy = H * 0.6, up = (o.acc > o.thr);
    for (const s of [-1, 1]) { rr(g, cx + s * 50 - 22, cy - (up && s === 1 ? 60 : 0), 44, 120, 18); g.fillStyle = up && s === 1 ? T.accent : alpha(T.ink, 0.15); g.fill(); }
    rr(g, W * 0.25, H - 60, W * 0.5 * clamp(o.acc / (o.thr * 2), 0, 1), 12, 6); g.fillStyle = up ? T.go : alpha(T.ink, 0.2); g.fill();
  } });
}

// ---- Balance Hold: stand still; sway is the spread of the phone's tilt
function BalanceHold(S) {
  const dur = S.durationS || 30, G = base(S, 1);
  let t = 0, sum2 = 0, n = 0, x = 0, y = 0;
  G.update = function (dt, a) { t += dt; x = a.roll; y = a.pitch; sum2 += x * x + y * y; n++; if (t >= dur) { this._reps = 1; this.done = true; } };
  G.status = () => ({ title: "Stand tall and hold still", text: `${fmtTime(Math.max(0, dur - t))} left · hold the counter if you need to` });
  G.stats = () => [["Time held", fmtTime(Math.min(t, dur))], ["Sway", `${Math.sqrt(sum2 / Math.max(1, n)).toFixed(1)}° RMS`]];
  // For the 3D scene: sway on a scale where 1 is 24 degrees; inside the small circle counts as steady.
  G.view = () => ({ type: "steady", x: x / 24, y: y / 24, r: 6 / 24, inside: Math.hypot(x, y) <= 6, prog: t / dur, reps: G._reps, goal: 1 });
  G.draw = function (g, W, H) {
    bg(g, W, H);
    const cx = W / 2, cy = H * 0.56, sc = Math.min(W, H - 160) / 60;
    for (const r of [24, 14, 6]) { g.beginPath(); g.arc(cx, cy, r * sc, 0, TAU); g.strokeStyle = alpha(T.ink, 0.1); g.lineWidth = 2; g.stroke(); }
    g.beginPath(); g.arc(cx + clamp(x, -24, 24) * sc, cy - clamp(y, -24, 24) * sc, 14, 0, TAU); g.fillStyle = T.accent; g.fill();
    g.strokeStyle = T.go; g.lineWidth = 8; g.lineCap = "round"; g.beginPath(); g.arc(cx, cy, 24 * sc + 16, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(t / dur, 0, 1)); g.stroke(); g.lineCap = "butt";
  };
  return G;
}

const REPS = { params: { reps: [10, 20, 30], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } };
[
  { id: "lean", name: "Lean & Shift", movement: "Seated weight shift", control: "tilt", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.",
    desc: "Lean to the left, to the right and forward, holding each lean for two seconds.", source: "Home weight-transfer programs after stroke; FitMi oblique work.",
    make: (S) => in3D(LeanShift(S), "lean") },
  { id: "twist", name: "Trunk Twist", movement: "Seated trunk rotation", control: "tilt", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.",
    desc: "Turn your shoulders to look around. Find the animals on each side.", source: "FitMi seated twists and trunk rotation; GRASP trunk control.",
    scenes: RC.Twist3D ? RC.Twist3D.SCENES : null,
    make: TrunkTwist },
  Object.assign({ id: "sit2stand", name: "Sit to Stand", movement: "Standing up from a chair", control: "accel", safety: "standing", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.",
    desc: "Stand up from a chair and sit down again, slowly and with control.", source: "Otago exercise programme (sit to stand), used in stroke balance trials.",
    make: (S) => in3D(SitToStand(S), "sit2stand") }, { params: { reps: [5, 8, 10], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null } }),
  { id: "balance", name: "Balance Hold", movement: "Standing balance", control: "tilt", safety: "standing", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.",
    desc: "Stand still for the whole time. Your sway is measured.", source: "Otago balance exercises (standing, tandem and one-leg stance).",
    params: { reps: null, level: [1, 2, 3], durationS: [20, 30, 60] }, defaults: { reps: null, level: 1, durationS: 20 },
    make: (S) => in3D(BalanceHold(S), "balance") },
  Object.assign({ id: "march", name: "Seated March", movement: "Hip flexion · seated stepping", control: "accel", pose: "pocket", mount: "Put the phone in the front trouser pocket on your affected side.",
    desc: "March in your chair, lifting one knee and then the other.", source: "FitMi seated marching.",
    make: (S) => in3D(SeatedMarch(S), "march") }, REPS),
  Object.assign({ id: "heelraise", name: "Heel Raises", movement: "Calf strength · ankle", control: "guided", pad: "done", mount: "",
    desc: "Lift your heels off the floor, hold, and lower. Seated or holding a counter.", source: "Otago heel raises.",
    make: (S) => Guided(S, { steps: ["Lift your heels", "Hold for two", "Lower slowly"], accel: true }) }, REPS),
  Object.assign({ id: "anklepump", name: "Ankle Pumps", movement: "Ankle dorsiflexion", control: "guided", pad: "done", mount: "",
    desc: "Point your toes up toward you, then down, in a steady rhythm.", source: "FitMi ankle dorsiflexion.",
    make: (S) => Guided(S, { steps: ["Toes up", "Toes down"] }) }, REPS),
].forEach((d) => RC.register(Object.assign({ section: "trunk" }, d)));

defineArt("lean", '<circle cx="60" cy="34" r="22" fill="var(--a-mute)" opacity=".12"/><circle cx="38" cy="34" r="6" fill="var(--a-hi)"/><circle cx="82" cy="34" r="6" fill="var(--a-hi)" opacity=".35"/><circle cx="60" cy="14" r="6" fill="var(--a-hi)" opacity=".35"/><circle cx="48" cy="34" r="4" fill="var(--a-ink)"/>');
defineArt("twist", '<ellipse cx="60" cy="38" rx="34" ry="14" fill="var(--a-mute)" opacity=".15"/><path d="M36 30 L84 46" stroke="var(--a-ink)" stroke-width="5" stroke-linecap="round"/><path d="M78 20 a26 14 0 0 1 14 12" stroke="var(--a-hi)" stroke-width="2.5" fill="none"/>');
defineArt("sit2stand", '<rect x="70" y="10" width="5" height="46" rx="2" fill="var(--a-mute)" opacity=".4"/><rect x="52" y="34" width="22" height="4" rx="2" fill="var(--a-mute)" opacity=".4"/><circle cx="44" cy="12" r="6" fill="var(--a-hi)"/><rect x="38" y="20" width="12" height="32" rx="5" fill="var(--a-hi)"/>');
defineArt("balance", '<circle cx="60" cy="32" r="22" fill="none" stroke="var(--a-mute)" stroke-opacity=".3"/><circle cx="60" cy="32" r="12" fill="none" stroke="var(--a-mute)" stroke-opacity=".3"/><circle cx="62" cy="30" r="5" fill="var(--a-hi)"/>');
defineArt("march", '<rect x="44" y="20" width="12" height="34" rx="5" fill="var(--a-mute)" opacity=".3"/><rect x="64" y="12" width="12" height="34" rx="5" fill="var(--a-hi)"/>');
defineArt("heelraise", '<path d="M30 50 H90" stroke="var(--a-mute)" stroke-width="2"/><path d="M48 50 L56 34 H76 L80 44" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
defineArt("anklepump", '<path d="M40 14 V40 H70" stroke="var(--a-mute)" stroke-width="6" stroke-opacity=".35" fill="none" stroke-linecap="round"/><path d="M40 40 L64 24" stroke="var(--a-hi)" stroke-width="5" stroke-linecap="round"/>');
})();
