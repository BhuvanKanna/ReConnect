// Building blocks shared by the exercises. RepCounter is pure (also loaded by the Node tests);
// everything else draws on the stage canvas and only loads in the browser.
(function (root) {
"use strict";

// Rest → reach the target → hold → return, the cycle behind most motion exercises.
// `target` may be negative (reach in the negative direction) and may change between reps.
function RepCounter(opts) {
  const o = Object.assign({ target: 30, rest: 10, hold: 1.2, reps: 10, settle: 0.4 }, opts);
  const rc = { state: "rest", holdT: 0, peaks: [], target: o.target, count: 0 };
  let restT = 0, peak = 0;
  rc.update = function (dt, value) {
    const sgn = rc.target < 0 ? -1 : 1, v = value * sgn, tgt = Math.abs(rc.target);
    if (rc.state === "rest") {
      if (v < o.rest) { restT += dt; if (restT >= o.settle) { rc.state = "move"; peak = v; rc.holdT = 0; } } else restT = 0;
      return null;
    }
    peak = Math.max(peak, v);
    if (rc.state === "move") {
      if (v >= tgt * 0.9) { rc.holdT += dt; if (rc.holdT >= o.hold) { rc.state = "return"; rc.count++; rc.peaks.push(peak * sgn); return "rep"; } }
      else rc.holdT = Math.max(0, rc.holdT - dt * 1.5);
      return null;
    }
    // return: keep the peak up to date until the limb is back at rest
    rc.peaks[rc.peaks.length - 1] = peak * sgn;
    if (v < o.rest) { rc.state = "rest"; restT = 0; }
    return null;
  };
  rc.progress = () => (rc.state === "move" ? Math.min(1, rc.holdT / o.hold) : 0);
  return rc;
}

if (typeof module === "object" && module.exports) { module.exports = { RepCounter }; return; }

const RC = root.RC;
const { clamp, TAU, T, alpha, txt, rr, fmtTime } = RC;
const inRect = (x, y, r) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

function base(S, goal) {
  return { S, events: [], done: false, _reps: 0, reps() { return this._reps; }, goal() { return goal; } };
}

function drawGonio(g, cx, cy, R, deg, target, label) {
  g.save();
  g.fillStyle = alpha(T.surface, 0.85); g.beginPath(); g.arc(cx, cy, R + 14, Math.PI, TAU); g.fill();
  // 0° at left horizontal, 90° straight up, 180° at right: use 0..90 across the left half to top
  const ang = (d) => Math.PI + clamp(d, -10, 120) / 180 * Math.PI;
  g.lineWidth = 1.5; g.strokeStyle = T.muted;
  for (let d = 0; d <= 120; d += 15) {
    const A = ang(d); g.beginPath(); g.moveTo(cx + Math.cos(A) * (R - (d % 45 ? 6 : 12)), cy + Math.sin(A) * (R - (d % 45 ? 6 : 12))); g.lineTo(cx + Math.cos(A) * R, cy + Math.sin(A) * R); g.stroke();
    if (d % 45 === 0) txt(g, `${d}`, cx + Math.cos(A) * (R - 24), cy + Math.sin(A) * (R - 24), 11, T.muted, { font: T.mono, weight: 500 });
  }
  if (target != null) { const A = ang(target); g.strokeStyle = T.accent; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + Math.cos(A) * (R - 16), cy + Math.sin(A) * (R - 16)); g.lineTo(cx + Math.cos(A) * (R + 6), cy + Math.sin(A) * (R + 6)); g.stroke(); }
  const A = ang(deg); g.strokeStyle = T.ink; g.lineWidth = 3; g.lineCap = "round";
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(A) * (R - 10), cy + Math.sin(A) * (R - 10)); g.stroke();
  g.beginPath(); g.arc(cx, cy, 5, 0, TAU); g.fillStyle = T.ink; g.fill();
  txt(g, `${Math.round(deg)}°`, cx + 34, cy - 14, 18, T.ink, { font: T.mono, weight: 600 });
  txt(g, label, cx + 34, cy - 34, 11, T.muted, { font: T.mono, weight: 500 });
  g.restore();
}

// Tilt-driven pointer for playing touch exercises with the phone: hold still over a target to pick it.
function Cursor(opts) {
  const amp = (opts && opts.amp) || 30;
  const c = { x: 0, y: 0, dwellT: 0, idx: -1, active: false };
  c.update = function (dt, a, W, H) {
    c.active = !a.demo;
    c.x = W / 2 + clamp(a.roll / amp, -1.2, 1.2) * W * 0.42;
    c.y = H / 2 - clamp(a.pitch / amp, -1.2, 1.2) * H * 0.4;
  };
  // Returns the index of the rect the cursor has rested on for `seconds`, else -1.
  c.dwell = function (dt, rects, seconds = 0.8) {
    if (!c.active) return -1;
    const i = rects.findIndex((r) => inRect(c.x, c.y, r));
    if (i !== c.idx) { c.idx = i; c.dwellT = 0; return -1; }
    if (i < 0) return -1;
    c.dwellT += dt;
    if (c.dwellT >= seconds) { c.dwellT = -0.5; return i; } // brief cool-down before the next pick
    return -1;
  };
  c.draw = function (g, seconds = 0.8) {
    if (!c.active) return;
    g.beginPath(); g.arc(c.x, c.y, 14, 0, TAU); g.fillStyle = alpha(T.ink, 0.15); g.fill();
    g.beginPath(); g.arc(c.x, c.y, 6, 0, TAU); g.fillStyle = T.ink; g.fill();
    if (c.idx >= 0 && c.dwellT > 0) { g.strokeStyle = T.go; g.lineWidth = 4; g.beginPath(); g.arc(c.x, c.y, 18, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(c.dwellT / seconds, 0, 1)); g.stroke(); }
  };
  return c;
}

// Large answer cards laid out in a row or grid inside `area`.
function Choice(opts) {
  const ch = { options: opts.options.slice(), rects: [], layout: opts.layout || "row" };
  ch.place = function (area) {
    const n = ch.options.length, gap = 14;
    const cols = ch.layout === "grid" ? Math.ceil(Math.sqrt(n)) : n, rows = Math.ceil(n / cols);
    const w = (area.w - gap * (cols - 1)) / cols, h = Math.min(140, (area.h - gap * (rows - 1)) / rows);
    ch.rects = ch.options.map((_, i) => ({ x: area.x + (i % cols) * (w + gap), y: area.y + Math.floor(i / cols) * (h + gap), w, h }));
    return ch.rects;
  };
  ch.hit = (x, y) => ch.rects.findIndex((r) => inRect(x, y, r));
  // mark(i) → null | "good" | "bad" | "hover"; label(i) → string (drawn) or a function(g, rect)
  ch.draw = function (g, mark = () => null, label = (i) => String(ch.options[i])) {
    ch.rects.forEach((r, i) => {
      const m = mark(i);
      rr(g, r.x, r.y, r.w, r.h, 16);
      g.fillStyle = m === "good" ? alpha(T.go, 0.18) : m === "bad" ? alpha(T.accent, 0.2) : m === "hover" ? alpha(T.go, 0.08) : T.surface; g.fill();
      g.strokeStyle = m === "good" ? T.go : m === "bad" ? T.accent : alpha(T.ink, 0.12); g.lineWidth = m ? 3 : 1.5; g.stroke();
      const L = label(i);
      if (typeof L === "function") L(g, r);
      else txt(g, L, r.x + r.w / 2, r.y + r.h / 2, Math.min(34, r.h * 0.32, (r.w - 16) / Math.max(3, L.length) * 1.7), T.ink, { font: T.body });
    });
  };
  return ch;
}

// On-stage keypad that mirrors the phone's touch pad, so a pad exercise still works without the phone.
function Keypad(opts) {
  const kp = { labels: opts.labels, cols: opts.cols || 3, rects: {} };
  kp.place = function (area) {
    const rows = Math.ceil(kp.labels.length / kp.cols), gap = 10;
    const s = Math.min((area.w - gap * (kp.cols - 1)) / kp.cols, (area.h - gap * (rows - 1)) / rows);
    const x0 = area.x + (area.w - (s * kp.cols + gap * (kp.cols - 1))) / 2;
    kp.rects = {};
    kp.labels.forEach((l, i) => { kp.rects[l] = { x: x0 + (i % kp.cols) * (s + gap), y: area.y + Math.floor(i / kp.cols) * (s + gap), w: s, h: s }; });
    return kp.rects;
  };
  kp.hit = (x, y) => { for (const l of kp.labels) if (inRect(x, y, kp.rects[l])) return l; return null; };
  kp.draw = function (g, lit) {
    for (const l of kp.labels) {
      const r = kp.rects[l]; if (!r) continue;
      rr(g, r.x, r.y, r.w, r.h, 14); g.fillStyle = lit === l ? alpha(T.go, 0.25) : T.surface; g.fill();
      g.strokeStyle = alpha(T.ink, 0.12); g.lineWidth = 1.5; g.stroke();
      txt(g, l, r.x + r.w / 2, r.y + r.h / 2, Math.min(30, r.h * 0.42), T.ink, { font: T.body });
    }
  };
  return kp;
}

// A guided exercise the phone can't measure: instructions, a counter or timer, and a big Done button.
// mode "reps": each Done (Space, click, phone pad) is one rep. mode "time": runs for S.durationS,
// stepping through the instructions; Done moves to the next instruction.
function Guided(S, opts) {
  const mode = opts.mode || (S.durationS ? "time" : "reps");
  const steps = opts.steps, G = base(S, mode === "reps" ? S.reps : steps.length);
  let t = 0, step = 0, lastTap = -9, pulse = 0;
  const btn = { x: 0, y: 0, w: 0, h: 0 };
  const stepLen = () => (S.durationS || 60) / steps.length;
  function tap() {
    if (G.done || t - lastTap < 0.35) return;
    lastTap = t; pulse = 1; G.events.push("success");
    if (mode === "reps") { G._reps++; if (G._reps >= S.reps) G.done = true; }
    else if (step >= steps.length - 1) t = S.durationS || 60; // Done on the last step finishes the session
    else { step = step + 1; t = Math.max(t, step * stepLen()); }
  }
  G.update = function (dt, a) {
    t += dt; pulse = Math.max(0, pulse - dt * 3);
    if (mode === "time") {
      step = Math.min(steps.length - 1, Math.max(step, Math.floor(t / stepLen())));
      G._reps = step + (t >= S.durationS ? 1 : 0);
      if (t >= S.durationS) { G._reps = steps.length; G.done = true; }
    } else if (opts.accel && a.acc > 4 && !a.demo) tap();
  };
  G.key = (k) => { if (k === " " || k === "Enter") tap(); };
  G.pad = () => tap();
  G.pointer = (ev) => { if (ev.type === "down" && inRect(ev.x, ev.y, btn)) tap(); };
  G.padLabels = () => ["Done"];
  G.status = function () {
    if (mode === "reps") return { title: `${G._reps} of ${S.reps}`, text: opts.cue || "Press Done (or Space) after each one." };
    return { title: steps[step], text: `${fmtTime(Math.max(0, (S.durationS || 60) - t))} left · press Done to move on` };
  };
  G.stats = () => [[mode === "reps" ? "Completed" : "Steps done", mode === "reps" ? `${G._reps} / ${S.reps}` : `${Math.min(steps.length, step + 1)} / ${steps.length}`], ["Active time", fmtTime(t)]];
  G.debug = () => ({ mode, step, t });
  G.draw = function (g, W, H) {
    g.fillStyle = T.stage; g.fillRect(0, 0, W, H);
    const lx = Math.max(24, W * 0.06), top = 120, colW = Math.min(W * 0.46, 460);
    steps.forEach((s, i) => {
      const y = top + i * 54, on = mode === "time" ? i === step : i === G._reps % steps.length;
      rr(g, lx, y, colW, 44, 12); g.fillStyle = on ? alpha(T.go, 0.14) : alpha(T.surface, 0.7); g.fill();
      txt(g, `${i + 1}.  ${s}`, lx + 16, y + 22, 17, on ? T.ink : T.muted, { align: "left", font: T.body, weight: on ? 700 : 400 });
    });
    const cx = lx + colW + (W - lx - colW) / 2, cy = H * 0.42;
    const big = mode === "reps" ? `${G._reps}/${S.reps}` : fmtTime(Math.max(0, (S.durationS || 60) - t));
    txt(g, big, cx, cy, Math.min(96, W * 0.09), T.ink, { font: T.body });
    btn.w = Math.min(280, W * 0.3); btn.h = 76; btn.x = cx - btn.w / 2; btn.y = cy + 70;
    rr(g, btn.x - pulse * 4, btn.y - pulse * 4, btn.w + pulse * 8, btn.h + pulse * 8, 18); g.fillStyle = T.go; g.fill();
    txt(g, mode === "reps" ? "Done" : "Next step", cx, btn.y + btn.h / 2, 26, T.surface, { font: T.body });
    txt(g, "or press Space", cx, btn.y + btn.h + 24, 14, T.muted, { font: T.body, weight: 400 });
  };
  return G;
}

// Small inline-SVG pictures for library tiles. Exercises register their own with defineArt.
const ART = {};
const defineArt = (id, svg) => { ART[id] = svg; };
const art = (id) => (ART[id] ? `<svg viewBox="0 0 120 64" aria-hidden="true" class="art">${ART[id]}</svg>` : null);

// Small shared helpers for the exercise families.
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function bg(g, W, H, brain) { g.fillStyle = brain ? alpha(T.brain || "#5b4bb5", 0.06) : T.stage; g.fillRect(0, 0, W, H); if (brain) { g.fillStyle = alpha(T.surface, 0.55); g.fillRect(0, 0, W, H); } }
// Progress dots along the top of the stage.
function dots(g, W, n, done, y = 122) {
  const gap = Math.min(26, (W - 80) / Math.max(1, n)), x0 = W / 2 - ((n - 1) * gap) / 2;
  for (let k = 0; k < n; k++) { g.beginPath(); g.arc(x0 + k * gap, y, 6, 0, TAU); g.fillStyle = k < done ? T.go : alpha(T.ink, 0.15); g.fill(); }
}
// A simple hold-to-target motion exercise: RepCounter on one signal plus a target bar and gauge.
// spec: { signal(a) -> number, target(S), rest(S), hold, label, title, cue, gauge }
function Reach(S, spec) {
  const G = base(S, S.reps), tgt = () => spec.target(S);
  const rc = RepCounter({ target: tgt(), rest: spec.rest(S), hold: spec.hold || 1, reps: S.reps });
  let val = 0;
  G.update = function (dt, a) {
    val = spec.signal(a);
    const before = rc.state;
    if (spec.valid && rc.state === "move" && !spec.valid(a)) rc.holdT = 0;
    if (rc.update(dt, val) === "rep") { this._reps++; this.events.push("success"); }
    if (before === "return" && rc.state === "rest" && this._reps >= S.reps) this.done = true;
  };
  G.status = function () {
    if (rc.state === "rest") return { title: spec.restTitle || "Back to rest", text: spec.restText || "Relax to start the next one." };
    if (rc.state === "move") return rc.holdT > 0.05 ? { title: "Hold it there", text: `${Math.max(0, (spec.hold || 1) - rc.holdT).toFixed(1)} s`, tone: "good" } : { title: spec.title, text: spec.cue || `Target ${Math.round(Math.abs(rc.target))}°` };
    return { title: "Good. Back to rest.", text: `${this._reps} of ${S.reps} done`, tone: "good" };
  };
  const best = () => (rc.peaks.length ? Math.round(Math.max(...rc.peaks.map(Math.abs))) : null);
  G.stats = () => [["Best", best() == null ? "–" : `${best()}°`], ["Average", rc.peaks.length ? `${Math.round(rc.peaks.reduce((s, x) => s + Math.abs(x), 0) / rc.peaks.length)}°` : "–"]].concat(spec.stats ? spec.stats() : []);
  G.debug = () => ({ state: rc.state, target: rc.target, val });
  G.draw = function (g, W, H, a, t) {
    bg(g, W, H);
    dots(g, W, S.reps, this._reps);
    spec.draw(g, W, H, { val, target: rc.target, prog: rc.progress(), state: rc.state, a, t });
    if (spec.gauge !== false) drawGonio(g, W - 200, H - 24, Math.min(100, W * 0.11), Math.abs(val), Math.abs(rc.target), spec.label);
  };
  return G;
}

// Answer-card rounds: each round shows a prompt (drawn by the exercise) and 2–6 answer cards.
// spec.round(i) → { title, text, options, answer (index or [indices]), draw(g, area, t), label(i), explain, hints[] }
// Cards are picked by pointer, number keys, or (spec.cursor) by resting the tilt cursor on them.
function Quiz(S, spec) {
  const n = spec.rounds != null ? spec.rounds : S.reps || 10, G = base(S, n), cur = Cursor({ amp: S.amp });
  let r = null, ch = null, fb = null, fbT = 0, t = 0, startT = 0, correct = 0, times = [], hint = 0, hintsUsed = 0, hintRect = null, W0 = 800, H0 = 500;
  const isAns = (i) => (Array.isArray(r.answer) ? r.answer.includes(i) : i === r.answer);
  function load() { r = spec.round(G._reps); ch = Choice({ options: r.options, layout: r.layout || (r.options.length > 4 ? "grid" : "row") }); startT = t; hint = 0; }
  load();
  function choose(i) {
    if (fbT > 0 || i < 0 || i >= r.options.length) return;
    const ok = isAns(i); fb = { i, ok }; fbT = ok ? 0.8 : 1.6;
    if (ok) correct++; times.push(t - startT); G.events.push(ok ? "success" : "error");
    if (spec.onAnswer) spec.onAnswer(ok, r);
  }
  G.update = function (dt, a) {
    t += dt;
    if (spec.cursor) { cur.update(dt, a, W0, H0); const i = cur.dwell(dt, ch.rects); if (i >= 0) choose(i); }
    if (fbT > 0) { fbT -= dt; if (fbT <= 0) { G._reps++; fb = null; if (G._reps >= n) G.done = true; else load(); } }
  };
  G.pointer = (e) => {
    if (e.type !== "down") return;
    if (hintRect && inRect(e.x, e.y, hintRect) && r.hints && hint < r.hints.length && !fb) { hint++; hintsUsed++; return; }
    choose(ch.hit(e.x, e.y));
  };
  G.key = (k) => { if (/^[1-9]$/.test(k)) choose(Number(k) - 1); };
  const answerLabel = () => { const i = Array.isArray(r.answer) ? r.answer[0] : r.answer; const L = r.label ? r.label(i) : r.options[i]; return typeof L === "string" ? L : String(r.options[i]); };
  G.status = function () {
    if (fb) return fb.ok ? { title: r.good || "Correct", text: r.explain || "", tone: "good" } : { title: "Not quite", text: r.explain || `The answer was ${answerLabel()}.`, tone: "warn" };
    return { title: r.title, text: hint ? r.hints[hint - 1] : r.text || "" };
  };
  G.stats = () => [["Correct", `${correct} / ${G._reps}`], ["Average time", times.length ? `${(times.reduce((s, x) => s + x, 0) / times.length).toFixed(1)} s` : "–"]]
    .concat(hintsUsed ? [["Hints used", String(hintsUsed)]] : []).concat(spec.stats ? spec.stats() : []);
  G.debug = () => ({ answer: Array.isArray(r.answer) ? r.answer[0] : r.answer, rects: ch.rects, fb: !!fb, round: G._reps });
  G.draw = function (g, W, H) {
    W0 = W; H0 = H;
    bg(g, W, H, true); dots(g, W, n, G._reps);
    const top = 140, split = spec.split || 0.5;
    if (r.draw) r.draw(g, { x: 40, y: top, w: W - 80, h: (H - top) * split - 10 }, t);
    ch.place({ x: W * 0.08, y: top + (H - top) * split, w: W * 0.84, h: (H - top) * (1 - split) - 24 });
    ch.draw(g, (i) => (fb ? (i === fb.i ? (fb.ok ? "good" : "bad") : !fb.ok && isAns(i) ? "good" : null) : cur.active && cur.idx === i ? "hover" : null), (i) => (r.label ? r.label(i) : String(r.options[i])));
    hintRect = null;
    if (r.hints && r.hints.length) {
      hintRect = { x: W - 150, y: top, w: 110, h: 44 };
      rr(g, hintRect.x, hintRect.y, hintRect.w, hintRect.h, 12); g.fillStyle = hint >= r.hints.length ? alpha(T.ink, 0.06) : T.surface; g.fill();
      txt(g, "Hint", hintRect.x + hintRect.w / 2, hintRect.y + 22, 17, hint >= r.hints.length ? T.muted : T.ink, { font: T.body });
    }
    cur.draw(g);
  };
  return G;
}

RC.kit = { base, drawGonio, RepCounter, Cursor, Choice, Keypad, Guided, defineArt, art, inRect, rand, randInt, pick, shuffle, bg, dots, Reach, Quiz };
})(typeof self !== "undefined" ? self : this);
