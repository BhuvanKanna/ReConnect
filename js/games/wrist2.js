// Wrist & forearm, continued: more motion exercises, all measured by the phone.
(() => {
"use strict";
const RC = window.RC;
const { clamp, TAU, T, alpha, rr, txt } = RC;
const { Reach, defineArt } = RC.kit;
const M = RC.moves, { scene, icon, lvl } = M;
// Draw with a 3D scene from js/play3d-scenes.js when the computer can (the engine still does the scoring).
const in3D = (G, id) => (RC.Play3D ? RC.Play3D.wrap(G, id) : G);
const cap = (v, m) => Math.min(v, m);

// Screwdriver: the screw sinks as the turns add up
const screwDraw = (g, W, H, o) => {
  const cx = W / 2, top = 190, depth = clamp(o.prog, 0, 1);
  g.fillStyle = alpha(T.ink, 0.12); rr(g, cx - 180, H - 110, 360, 60, 10); g.fill();
  const sy = top + depth * 110;
  g.fillStyle = alpha(T.ink, 0.5); g.fillRect(cx - 6, sy, 12, H - 110 - sy + 20);
  g.save(); g.translate(cx, sy - 10); g.rotate((o.val / Math.max(1, o.thr)) * 0.8); g.fillStyle = alpha(T.ink, 0.7); rr(g, -26, -8, 52, 16, 5); g.fill(); g.restore();
  icon(g, "🪛", cx + 120, top, 56);
  txt(g, o.want > 0 ? "Turn one way" : "Turn back", cx - 160, top, 20, T.ink, { font: T.body });
};

// Steering Wheel: drive down a country road in first person (3D scene in js/drive3d.js). Turn the phone like
// a steering wheel; the car moves across the road as far as the wheel is turned. At each gate a green arch
// spans one lane and the other lanes are blocked. Most gates are in an outside lane and they swap sides, so
// each one asks for a real turn: 30° to reach an outside lane at level 1, 42° at level 2, 54° at level 3.
// Draws a flat version until 3D is ready (or if the computer is too slow for 3D).
function Drive(S) {
  const { base, bg, dots } = RC.kit, L = Math.min(3, Math.max(1, S.level || 1));
  const G = base(S, S.reps), LANE = 3.2;
  const SPAN = { 1: 30, 2: 42, 3: 54 }[L], TOL = { 1: 0.45, 2: 0.36, 3: 0.28 }[L], SPEED = { 1: 13, 2: 15, 3: 17 }[L], GAP = SPEED * { 1: 4.6, 2: 3.9, 3: 3.3 }[L];
  const D3 = RC.Drive3D, quality = RC.Scene3D ? RC.Scene3D.quality() : { sample: () => 2 };
  if (D3) D3.ensure();
  let s = 0, x = 0, vx = 0, wheel = 0, gates = [], sent = 0, passed = 0, cleared = 0, ext = [0, 0], flashT = 0, flashOk = true;
  let lastT = null, world = null, sparkle = [], tNow = 0, prevLane = 0;
  function add() {
    const lane = sent === 0 || prevLane === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.random() < 0.72 ? -prevLane : 0;
    prevLane = lane; gates.push({ id: sent, d: 75 + sent * GAP, lane, res: null, tp: 0, hit: 0 }); sent++;
  }
  const next = () => gates.find((q) => q.res == null);
  const ahead = () => gates.filter((q) => q.res == null).length;
  while (sent < S.reps && ahead() < 5) add();
  G.update = function (dt, a) {
    tNow += dt; wheel = a.roll; ext = [Math.min(ext[0], wheel), Math.max(ext[1], wheel)];
    const goal = clamp(wheel / SPAN, -1.3, 1.3) * LANE, want = clamp((goal - x) * 4, -10, 10);
    vx += (want - vx) * Math.min(1, dt * 8); x += vx * dt; s += SPEED * dt; flashT = Math.max(0, flashT - dt);
    for (const q of gates) {
      if (q.res != null || q.d > s) continue;
      const ok = Math.abs(x - q.lane * LANE) <= TOL * LANE;
      q.res = ok ? "ok" : "miss"; q.tp = tNow; q.hit = x; passed++; flashOk = ok; flashT = 1.2;
      if (ok) { cleared++; this._reps = cleared; this.events.push("success"); burst(); } else this.events.push("error");
      if (passed >= S.reps) this.done = true;
    }
    gates = gates.filter((q) => q.d > s - 45);
    while (sent < S.reps && ahead() < 5) add();
  };
  G.status = function () {
    const q = next();
    if (flashT > 0 && !flashOk) return { title: "Missed that one", text: "Line up with the green arch early", tone: "warn" };
    if (flashT > 0.5 && flashOk) return { title: "Through the gate!", text: `${cleared} of ${S.reps} done`, tone: "good" };
    if (!q) return { title: "Nice driving!", text: `${cleared} of ${S.reps} through`, tone: "good" };
    const off = q.lane * LANE - x;
    if (Math.abs(off) <= TOL * LANE) return { title: "Lined up! Hold the wheel there", text: `Drive through the green arch · ${cleared} of ${S.reps} done`, tone: "good" };
    return { title: `Turn the wheel to the ${off > 0 ? "right" : "left"}`, text: q.lane === 0 ? "Steer back to the middle lane" : `Steer into the lane with the green arch · ${cleared} of ${S.reps} done` };
  };
  G.stats = () => [["Through the gates", `${cleared} / ${S.reps}`], ["Missed", String(passed - cleared)], ["Wheel turned left", `${Math.round(-ext[0])}°`], ["Wheel turned right", `${Math.round(ext[1])}°`]];
  G.dispose = () => { if (world) { world.dispose(); world = null; } };
  G.debug = () => { const q = next(); return { kind: "value", target: q ? q.lane * SPAN : 0, val: wheel, x, cleared, passed, view: world ? "3d" : "2d", quality: quality.level }; };
  G.draw = function (g, W, H, a, t) {
    const raw = lastT == null ? 0 : t - lastT, dt = Math.min(0.05, Math.max(0, raw)); lastT = t;
    const qv = world ? quality.sample() : 0;
    if (qv >= 2 && world) { world.dispose(); world = null; RC.Scene3D.off = true; }
    if (!world && !RC.Scene3D.off && D3 && D3.ready()) world = D3.create({ calm: RC.reduceMotion });
    const q = next(), unit = Math.min(W, H) / 600;
    if (world) {
      world.lowQuality(qv >= 1);
      const pr = (g.getTransform ? g.getTransform().a : 1) * (qv >= 1 ? 0.6 : 1);
      g.drawImage(world.frame(W, H, pr, { s, x, vx, speed: SPEED, wheel, target: q ? q.lane * SPAN : null, gates }, t, dt), 0, 0, W, H);
    } else drawFlat(g, W, H);
    dots(g, W, S.reps, passed);
    // big arrow on the side to turn toward, while the car is out of line with the next arch
    if (q && Math.abs(q.lane * LANE - x) > TOL * LANE && !(flashT > 0 && !flashOk)) {
      const sg = Math.sign(q.lane * LANE - x), cx = W / 2 + sg * W * 0.36, cy = H * 0.42, sz = 34 * unit, pulse = RC.reduceMotion ? 0 : Math.sin(t * 5) * 6 * unit;
      g.save(); g.lineCap = "round"; g.lineJoin = "round";
      for (const [lw, c] of [[20 * unit, "rgba(20,16,40,0.55)"], [11 * unit, "#ffd27a"]]) {
        g.lineWidth = lw; g.strokeStyle = c;
        for (const k of [0, 1]) { const ox = cx + sg * (k * 30 * unit + pulse); g.beginPath(); g.moveTo(ox - sg * sz * 0.5, cy - sz); g.lineTo(ox + sg * sz * 0.5, cy); g.lineTo(ox - sg * sz * 0.5, cy + sz); g.stroke(); }
      }
      g.font = `600 ${Math.round(22 * unit)}px ${T.body}`; g.textAlign = "center"; g.textBaseline = "middle";
      g.lineWidth = 6 * unit; g.strokeStyle = "rgba(20,16,40,0.7)"; const lx = cx + sg * 15 * unit, ly = cy + sz + 30 * unit, label = `Turn ${sg > 0 ? "right" : "left"}`;
      g.strokeText(label, lx, ly); g.fillStyle = "#fff"; g.fillText(label, lx, ly);
      g.restore();
    }
    sparkle = sparkle.filter((p) => (p.life -= dt) > 0); sparkle.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; });
    sparkle.forEach((p) => { g.globalAlpha = clamp(p.life, 0, 1); g.fillStyle = p.c; g.beginPath(); g.arc(W / 2 + p.x * unit, H * 0.36 + p.y * unit, 6 * unit, 0, TAU); g.fill(); }); g.globalAlpha = 1;
  };
  function burst() { if (RC.reduceMotion) return; for (let i = 0; i < 30; i++) { const ang = Math.random() * TAU, v = 80 + Math.random() * 160; sparkle.push({ x: 0, y: 0, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 60, life: 1.0, c: ["#ffd27a", "#7af09a", "#ffffff", "#ff8aa8"][i % 4] }); } }
  // flat version: a road in simple perspective with the gates coming toward you
  function drawFlat(g, W, H) {
    bg(g, W, H);
    const hy = H * 0.42, sc = (dd) => 10 / (10 + dd), P = (lx, dd) => ({ x: W / 2 + (lx - x) * sc(dd) * W * 0.12, y: hy + (H - hy) * sc(dd) });
    g.fillStyle = "#a8d4f0"; g.fillRect(0, 0, W, hy); g.fillStyle = "#7ab85a"; g.fillRect(0, hy, W, H - hy);
    const a0 = P(-6, 0), a1 = P(6, 0), b0 = P(-6, 400), b1 = P(6, 400);
    g.fillStyle = "#5c6068"; g.beginPath(); g.moveTo(a0.x, a0.y); g.lineTo(a1.x, a1.y); g.lineTo(b1.x, b1.y); g.lineTo(b0.x, b0.y); g.fill();
    g.strokeStyle = "#f4f4ee"; g.lineWidth = 3;
    for (const lx of [-1.5, -0.5, 0.5, 1.5]) for (let dd = -(s % 10); dd < 300; dd += 10) {
      const p0 = P(lx * LANE, Math.max(0, dd)), p1 = P(lx * LANE, Math.max(0, dd + (Math.abs(lx) > 1 ? 10 : 4)));
      g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke();
    }
    for (const q of gates.slice().reverse()) {
      const dd = q.d - s; if (dd < 0 || dd > 300) continue;
      const k = sc(dd);
      for (const l of [-1, 0, 1]) {
        const p = P(l * LANE, dd), w = LANE * 0.8 * k * W * 0.12;
        if (l === q.lane) { g.strokeStyle = "#3ad06a"; g.lineWidth = Math.max(2, 10 * k); g.beginPath(); g.moveTo(p.x - w / 2, p.y); g.lineTo(p.x - w / 2, p.y - w * 1.1); g.lineTo(p.x + w / 2, p.y - w * 1.1); g.lineTo(p.x + w / 2, p.y); g.stroke(); }
        else { g.fillStyle = "#e8402a"; g.fillRect(p.x - w / 2, p.y - w * 0.35, w, w * 0.18); g.fillStyle = "#fff"; g.fillRect(p.x - w / 2, p.y - w * 0.17, w, w * 0.12); }
      }
    }
    g.fillStyle = "#d23a3a"; rr(g, W * 0.18, H * 0.86, W * 0.64, H * 0.2, 30); g.fill();
    g.save(); g.translate(W / 2, H * 0.95); g.rotate(clamp(wheel, -160, 160) * Math.PI / 180);
    g.strokeStyle = "#24262c"; g.lineWidth = 16; g.beginPath(); g.arc(0, 0, H * 0.14, 0, TAU); g.stroke();
    g.strokeStyle = "#ffc83a"; g.beginPath(); g.arc(0, 0, H * 0.14, -Math.PI / 2 - 0.15, -Math.PI / 2 + 0.15); g.stroke();
    g.restore();
  }
  return G;
}

const WRIST = [
  { id: "key", name: "Turn the Key", movement: "Forearm supination · turning", pose: "handleTable", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Rest your forearm on the table.",
    desc: "Turn your hand as if turning a key in a lock, hold, then turn back.", source: "Wolf Motor Function Test (turning a key in a lock); mRehab unlock with key.",
    how: ["Rest your forearm on the table, thumb up.", "Turn your palm up as far as is comfortable.", "Hold, then turn it back."],
    make: (S) => in3D(Reach(S, { signal: (a) => Math.abs(a.roll), target: (S) => cap(S.amp * 1.6, 80), rest: (S) => S.amp * 0.4, hold: 0.8, label: "Turn", title: "Turn the key", draw: scene.slide("🔑", "Turn it all the way") }), "key") },
  { id: "drawbridge", name: "Raise the Drawbridge", movement: "Wrist extension · sustained hold", pose: "edgeDown", mount: "Rest your forearm on the table with your wrist just past the edge. Palm down, grip the phone flat against your palm: screen facing the floor, top edge toward your fingertips.",
    desc: "Lift your hand up at the wrist and hold it there while the count runs.", source: "Wrist-extension holds (Fugl-Meyer wrist stability; RAPAEL wrist extension).",
    params: { reps: [3, 5, 8], level: [1, 2, 3], durationS: null }, defaults: { reps: 3, level: 1, durationS: null },
    how: ["Rest your forearm on the table, wrist over the edge.", "Lift your hand up at the wrist into the green band.", "Hold until the bar fills, then relax."],
    make: (S) => in3D(M.Hold(S, { signal: (a) => a.pitch, band: (S) => [S.amp * 0.7, 90], holdS: (S) => lvl(S, { 1: 5, 2: 8, 3: 12 }), restBelow: (S) => S.amp * 0.3, emoji: "🏰", cues: { below: "Lift your hand at the wrist", above: "", in: "Hold the bridge up", rest: "Lower and relax" } }), "drawbridge") },
  Object.assign({ id: "wheel", name: "Steering Wheel", movement: "Two-handed forearm rotation", pose: "wheel", mount: "Hold the phone upright (tall) in both hands, one on each side, screen facing you.",
    desc: "Drive down a country road. Turn the wheel to steer through the green arches.", source: "Bilateral steering tasks (driving simulation in stroke rehab).",
    how: ["Hold the phone with both hands like a wheel.", "Turn it to steer into the lane with the green arch.", "Line up early, then hold the wheel steady."],
    make: Drive }, { params: { reps: [10, 15, 20], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } }),
  Object.assign({ id: "wristcircle", name: "Wrist Circles", movement: "Wrist circumduction", pose: "edgeDown", mount: "Rest your forearm on the table with your wrist just past the edge. Palm down, grip the phone flat against your palm: screen facing the floor, top edge toward your fingertips.",
    desc: "Make slow circles with your hand at the wrist, one way and then the other.", source: "Fugl-Meyer upper-extremity item (wrist circumduction).",
    how: ["Rest your forearm on the table, wrist over the edge.", "Tilt your hand out to the ring and circle round.", "Halfway through, circle the other way."],
    make: (S) => in3D(M.Circles(S, { emoji: "✋", cue: "Circle your hand at the wrist" }), "wristcircle") }, { params: { reps: [4, 6, 10], level: [1, 2, 3], durationS: null }, defaults: { reps: 4, level: 1, durationS: null } }),
  { id: "water", name: "Water the Plants", movement: "Aim, then pour", pose: "handleTable", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Rest your forearm on the table.",
    desc: "Turn toward each plant, then tip the can to water it.", source: "Daily-activity task practice (pouring); mRehab slow pour.",
    how: ["Turn your hand toward the plant shown.", "Tip the front of the phone down and hold it while the water pours.", "Bring it back to the middle for the next plant."],
    make: (S) => in3D(M.Seq(S, { steps: (S, k) => { const s = k % 2 ? -1 : 1; return [{ axis: "yaw", target: s * S.amp, hold: 0.5, cue: `Turn toward the ${s > 0 ? "right" : "left"} plant`, short: "Aim", emoji: "🪴" }, { axis: "pitch", target: -S.amp * 0.8, hold: 1.5, cue: "Tip the spout down to pour", short: "Pour", emoji: "💧" }]; }, restCue: "Back to the middle" }), "water") },
];
WRIST.forEach((d) => RC.register(Object.assign({ section: "wrist", control: "tilt" }, d)));

defineArt("key", '<circle cx="44" cy="32" r="10" fill="none" stroke="var(--a-hi)" stroke-width="4"/><path d="M54 32 H88 M80 32 v8 M72 32 v6" stroke="var(--a-hi)" stroke-width="4" stroke-linecap="round"/><path d="M40 12 a20 20 0 0 1 22 4" stroke="var(--a-ink)" stroke-width="2" fill="none"/>');
defineArt("drawbridge", '<rect x="16" y="22" width="22" height="34" fill="var(--a-mute)" opacity=".3"/><rect x="82" y="22" width="22" height="34" fill="var(--a-mute)" opacity=".3"/><path d="M38 50 L70 22" stroke="var(--a-hi)" stroke-width="6" stroke-linecap="round"/><path d="M38 56 H82" stroke="var(--a-go)" stroke-width="2" stroke-dasharray="3 3"/>');
defineArt("wheel", '<circle cx="60" cy="32" r="22" fill="none" stroke="var(--a-hi)" stroke-width="5"/><circle cx="60" cy="32" r="5" fill="var(--a-ink)"/><path d="M38 32 H82 M60 32 V54" stroke="var(--a-ink)" stroke-width="3"/>');
defineArt("wristcircle", '<rect x="14" y="30" width="46" height="12" rx="6" fill="var(--a-mute)" opacity=".3"/><circle cx="80" cy="36" r="16" fill="none" stroke="var(--a-hi)" stroke-width="3" stroke-dasharray="5 4"/><circle cx="92" cy="28" r="5" fill="var(--a-hi)"/>');
defineArt("water", '<path d="M30 30 h28 l8 -8 M40 30 v-8" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M72 30 v10 M78 32 v8" stroke="var(--a-go)" stroke-width="2" stroke-dasharray="2 3"/><path d="M66 46 h22 l-3 10 h-16z" fill="var(--a-mute)" opacity=".4"/><path d="M77 46 q-4 -8 0 -10 q4 2 0 10" fill="var(--a-go)"/>');
})();
