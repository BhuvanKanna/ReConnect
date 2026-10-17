// Trunk & legs: seated trunk control, standing work (locked until the provider turns it on) and leg reps.
(() => {
"use strict";
const RC = window.RC;
const { clamp, lerp, TAU, T, alpha, txt, rr, fmtTime } = RC;
const { base, bg, dots, Guided, defineArt } = RC.kit;
const pocket = "Put the phone upright in a shirt pocket or hold it flat against your chest.";

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
function TrunkTwist(S) {
  const G = base(S, S.reps), tgt = { 1: 20, 2: 30, 3: 40 }[S.level] || 30;
  let side = 0, dwell = 0, yaw = 0, range = [0, 0];
  G.update = function (dt, a) {
    yaw = a.yaw; range = [Math.min(range[0], yaw), Math.max(range[1], yaw)];
    const want = side === 0 ? tgt : -tgt;
    if ((want > 0 ? yaw >= want * 0.9 : yaw <= want * 0.9)) { dwell += dt; if (dwell >= 1) { dwell = 0; if (side === 1) { this._reps++; this.events.push("success"); if (this._reps >= S.reps) this.done = true; } else this.events.push("tick"); side = 1 - side; } }
    else dwell = Math.max(0, dwell - dt * 2);
  };
  G.status = () => ({ title: side === 0 ? "Turn your shoulders to the right" : "Now turn to the left", text: "Keep your hips facing forward." });
  G.stats = () => [["Turned left", `${Math.round(-range[0])}°`], ["Turned right", `${Math.round(range[1])}°`]];
  G.debug = () => ({ side, yaw });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    const cx = W / 2, cy = H * 0.6, R = Math.min(W * 0.32, H * 0.36);
    g.fillStyle = alpha(T.ink, 0.06); g.beginPath(); g.ellipse(cx, cy, R, R * 0.45, 0, 0, TAU); g.fill();
    for (const s of [1, -1]) { const A = (-90 + s * tgt * 1.6) * Math.PI / 180; g.beginPath(); g.arc(cx + Math.cos(A) * R, cy + Math.sin(A) * R * 0.45, 20, 0, TAU); g.fillStyle = (s === 1) === (side === 0) ? T.accent : alpha(T.accent, 0.2); g.fill(); }
    const A = (-90 + clamp(yaw, -60, 60) * 1.6) * Math.PI / 180;
    g.strokeStyle = T.ink; g.lineWidth = 16; g.lineCap = "round"; g.beginPath(); g.moveTo(cx - Math.cos(A) * R * 0.7, cy - Math.sin(A) * R * 0.32); g.lineTo(cx + Math.cos(A) * R * 0.7, cy + Math.sin(A) * R * 0.32); g.stroke(); g.lineCap = "butt";
    g.beginPath(); g.arc(cx, cy, 22, 0, TAU); g.fillStyle = alpha(T.ink, 0.25); g.fill();
  };
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
  { id: "lean", name: "Lean & Shift", movement: "Seated weight shift", control: "tilt", mount: pocket,
    desc: "Lean to the left, to the right and forward, holding each lean for two seconds.", source: "Home weight-transfer programs after stroke; FitMi oblique work.",
    how: ["Sit on a firm chair with your feet flat.", "Lean toward the lit target and hold.", "Come back to the middle before the next one."], make: LeanShift },
  { id: "twist", name: "Trunk Twist", movement: "Seated trunk rotation", control: "tilt", mount: pocket,
    desc: "Turn your shoulders to the right and then to the left while your hips stay facing forward.", source: "FitMi seated twists and trunk rotation; GRASP trunk control.",
    how: ["Sit tall with your feet flat.", "Turn your shoulders toward the lit target.", "Hold for a moment, then turn the other way."], make: TrunkTwist },
  Object.assign({ id: "sit2stand", name: "Sit to Stand", movement: "Standing up from a chair", control: "accel", safety: "standing", mount: pocket,
    desc: "Stand up from a chair and sit down again, slowly and with control.", source: "Otago exercise programme (sit to stand), used in stroke balance trials.",
    how: ["Only with a sturdy chair behind you and someone nearby.", "Feet back, lean forward, and stand up.", "Sit down slowly, reaching back for the chair."], make: SitToStand }, { params: { reps: [5, 8, 10], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null } }),
  { id: "balance", name: "Balance Hold", movement: "Standing balance", control: "tilt", safety: "standing", mount: pocket,
    desc: "Stand still for the whole time. Your sway is measured.", source: "Otago balance exercises (standing, tandem and one-leg stance).",
    params: { reps: null, level: [1, 2, 3], durationS: [20, 30, 60] }, defaults: { reps: null, level: 1, durationS: 20 },
    how: ["Stand next to a counter you can hold, with someone nearby.", "Feet apart on level 1, together on level 2, one in front on level 3.", "Stand tall and keep the dot in the middle."], make: BalanceHold },
  Object.assign({ id: "march", name: "Seated March", movement: "Hip flexion · seated stepping", control: "accel", mount: "Put the phone in your trouser pocket on the affected side.",
    desc: "March in your chair, lifting one knee and then the other.", source: "FitMi seated marching.",
    how: ["Sit tall with your feet flat.", "Lift your knee as high as is comfortable.", "Lower it and lift the other one."], make: SeatedMarch }, REPS),
  Object.assign({ id: "heelraise", name: "Heel Raises", movement: "Calf strength · ankle", control: "guided", pad: "done", mount: "",
    desc: "Lift your heels off the floor, hold, and lower. Seated or holding a counter.", source: "Otago heel raises.",
    how: ["Sit, or stand holding a counter.", "Lift both heels and hold for a count of two.", "Lower slowly and press Done."], make: (S) => Guided(S, { steps: ["Lift your heels", "Hold for two", "Lower slowly"], accel: true }) }, REPS),
  Object.assign({ id: "anklepump", name: "Ankle Pumps", movement: "Ankle dorsiflexion", control: "guided", pad: "done", mount: "",
    desc: "Point your toes up toward you, then down, in a steady rhythm.", source: "FitMi ankle dorsiflexion.",
    how: ["Sit with your feet flat.", "Pull your toes up toward your shins.", "Point them down, then press Done."], make: (S) => Guided(S, { steps: ["Toes up", "Toes down"] }) }, REPS),
].forEach((d) => RC.register(Object.assign({ section: "trunk" }, d)));

defineArt("lean", '<circle cx="60" cy="34" r="22" fill="var(--a-mute)" opacity=".12"/><circle cx="38" cy="34" r="6" fill="var(--a-hi)"/><circle cx="82" cy="34" r="6" fill="var(--a-hi)" opacity=".35"/><circle cx="60" cy="14" r="6" fill="var(--a-hi)" opacity=".35"/><circle cx="48" cy="34" r="4" fill="var(--a-ink)"/>');
defineArt("twist", '<ellipse cx="60" cy="38" rx="34" ry="14" fill="var(--a-mute)" opacity=".15"/><path d="M36 30 L84 46" stroke="var(--a-ink)" stroke-width="5" stroke-linecap="round"/><path d="M78 20 a26 14 0 0 1 14 12" stroke="var(--a-hi)" stroke-width="2.5" fill="none"/>');
defineArt("sit2stand", '<rect x="70" y="10" width="5" height="46" rx="2" fill="var(--a-mute)" opacity=".4"/><rect x="52" y="34" width="22" height="4" rx="2" fill="var(--a-mute)" opacity=".4"/><circle cx="44" cy="12" r="6" fill="var(--a-hi)"/><rect x="38" y="20" width="12" height="32" rx="5" fill="var(--a-hi)"/>');
defineArt("balance", '<circle cx="60" cy="32" r="22" fill="none" stroke="var(--a-mute)" stroke-opacity=".3"/><circle cx="60" cy="32" r="12" fill="none" stroke="var(--a-mute)" stroke-opacity=".3"/><circle cx="62" cy="30" r="5" fill="var(--a-hi)"/>');
defineArt("march", '<rect x="44" y="20" width="12" height="34" rx="5" fill="var(--a-mute)" opacity=".3"/><rect x="64" y="12" width="12" height="34" rx="5" fill="var(--a-hi)"/>');
defineArt("heelraise", '<path d="M30 50 H90" stroke="var(--a-mute)" stroke-width="2"/><path d="M48 50 L56 34 H76 L80 44" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
defineArt("anklepump", '<path d="M40 14 V40 H70" stroke="var(--a-mute)" stroke-width="6" stroke-opacity=".35" fill="none" stroke-linecap="round"/><path d="M40 40 L64 24" stroke="var(--a-hi)" stroke-width="5" stroke-linecap="round"/>');
})();
