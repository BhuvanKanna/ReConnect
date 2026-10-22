// More exercise engines for the expanded motion library. Each returns a game object with the
// same surface as the ones in kit.js: update, status, stats, debug, draw (and pointer/pad/key
// for touch work). debug().kind tells the engine test which strategy plays it.
(() => {
"use strict";
const RC = window.RC;
const { clamp, lerp, TAU, T, alpha, txt, rr, fmtTime, Game } = RC;
const { base, bg, dots, Cursor, rand, pick } = RC.kit;

const ring = (g, x, y, r, p, color) => {
  if (!(p > 0)) return;
  g.strokeStyle = color || T.go; g.lineWidth = 6; g.lineCap = "round";
  g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(p, 0, 1)); g.stroke(); g.lineCap = "butt";
};
const icon = (g, s, x, y, size) => txt(g, s, x, y, size, T.ink, { font: T.body, weight: 400 });
const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const secs = (xs) => (xs.length ? `${avg(xs).toFixed(1)} s` : "–");
const deg = (v) => `${Math.round(v)}°`;
const lvl = (S, m) => m[S.level] != null ? m[S.level] : m[2];
// Remember the stage size from draw() so update() can place things before the first frame.
const stage = () => ({ W: Game.W || 900, H: Game.H || 560 });

// ---------------------------------------------------------------- stage pictures
// Shared scenes for the reach-style exercises. o = { val, target, prog } from the engine.
const scene = {
  // A marker that climbs toward a target line as the measured angle grows.
  rise(emoji, label) {
    return (g, W, H, o) => {
      const top = 170, bottom = H - 80, x = W * 0.4, span = Math.max(10, Math.abs(o.target) * 1.3);
      const yOf = (v) => lerp(bottom, top, clamp(Math.abs(v) / span, 0, 1.05)), ty = yOf(o.target), y = yOf(o.val);
      g.fillStyle = alpha(T.accent, 0.12); g.fillRect(40, ty - 16, Math.max(80, W - 320), 32);
      g.setLineDash([10, 8]); g.strokeStyle = T.accent; g.lineWidth = 3; g.beginPath(); g.moveTo(40, ty); g.lineTo(Math.max(120, W - 280), ty); g.stroke(); g.setLineDash([]);
      g.strokeStyle = alpha(T.ink, 0.18); g.lineWidth = 3; g.beginPath(); g.moveTo(x, bottom + 40); g.lineTo(x, y); g.stroke();
      g.beginPath(); g.arc(x, y, 34, 0, TAU); g.fillStyle = T.surface; g.fill(); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke();
      icon(g, emoji, x, y + 2, 34); ring(g, x, y, 46, o.prog);
      if (label) txt(g, label, x, bottom + 56, 15, T.muted, { font: T.body, weight: 400 });
    };
  },
  // The same, moving sideways: for turns and side-to-side reaches.
  slide(emoji, label) {
    return (g, W, H, o) => {
      const left = W * 0.12, right = W * 0.72, y = H * 0.56, span = Math.max(10, Math.abs(o.target) * 1.3);
      const xOf = (v) => lerp(left, right, clamp(Math.abs(v) / span, 0, 1.05)), tx = xOf(o.target), x = xOf(o.val);
      g.fillStyle = alpha(T.accent, 0.12); g.fillRect(tx - 16, 160, 32, H - 230);
      g.setLineDash([10, 8]); g.strokeStyle = T.accent; g.lineWidth = 3; g.beginPath(); g.moveTo(tx, 160); g.lineTo(tx, H - 70); g.stroke(); g.setLineDash([]);
      g.strokeStyle = alpha(T.ink, 0.18); g.lineWidth = 3; g.beginPath(); g.moveTo(left - 30, y); g.lineTo(x, y); g.stroke();
      g.beginPath(); g.arc(x, y, 34, 0, TAU); g.fillStyle = T.surface; g.fill(); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke();
      icon(g, emoji, x, y + 2, 34); ring(g, x, y, 46, o.prog);
      if (label) txt(g, label, left, H - 40, 15, T.muted, { font: T.body, weight: 400, align: "left" });
    };
  },
  // Two targets on one axis, for back-and-forth work. o = { val, targets, side, prog }
  swing(emoji, vertical) {
    return (g, W, H, o) => {
      const span = Math.max(10, Math.abs(o.targets[0]), Math.abs(o.targets[1])) * 1.3;
      const c = vertical ? { x: W * 0.42, y: (160 + H - 60) / 2 } : { x: W * 0.45, y: H * 0.58 };
      const half = vertical ? (H - 220) / 2 : W * 0.32;
      const at = (v) => (vertical ? { x: c.x, y: c.y - clamp(v / span, -1.1, 1.1) * half } : { x: c.x + clamp(v / span, -1.1, 1.1) * half, y: c.y });
      g.strokeStyle = alpha(T.ink, 0.12); g.lineWidth = 14; g.lineCap = "round"; g.beginPath();
      const a0 = at(-span), a1 = at(span); g.moveTo(a0.x, a0.y); g.lineTo(a1.x, a1.y); g.stroke(); g.lineCap = "butt";
      o.targets.forEach((tv, i) => {
        const p = at(tv); g.beginPath(); g.arc(p.x, p.y, 26, 0, TAU);
        g.fillStyle = i === o.side ? alpha(T.accent, 0.85) : alpha(T.accent, 0.2); g.fill();
      });
      const p = at(o.val);
      g.beginPath(); g.arc(p.x, p.y, 32, 0, TAU); g.fillStyle = T.surface; g.fill(); g.strokeStyle = T.ink; g.lineWidth = 3; g.stroke();
      icon(g, emoji, p.x, p.y + 2, 30); ring(g, p.x, p.y, 42, o.prog);
    };
  },
};

// ---------------------------------------------------------------- Swing: two targets in turn
// Reach target 0, then target 1 (each held `hold` s); both is one rep. dirs[i] says whether the
// value must go above (+1) or below (-1) the target; by default it follows the target's sign.
function Swing(S, spec) {
  const G = base(S, S.reps), tg = spec.targets(S), hold = spec.hold == null ? 0.4 : spec.hold;
  const dirs = spec.dirs || tg.map((v) => (v >= 0 ? 1 : -1)), draw = spec.draw || scene.swing(spec.emoji || "●", spec.vertical);
  let side = 0, dwell = 0, val = 0, ext = [0, 0], t = 0, t0 = 0, times = [];
  const reached = (v, i) => (dirs[i] > 0 ? v >= tg[i] - Math.abs(tg[i]) * 0.1 : v <= tg[i] + Math.abs(tg[i]) * 0.1);
  G.update = function (dt, a) {
    t += dt; val = spec.signal(a);
    ext = [dirs[0] > 0 ? Math.max(ext[0], val) : Math.min(ext[0], val), dirs[1] > 0 ? Math.max(ext[1], val) : Math.min(ext[1], val)];
    if (reached(val, side)) {
      dwell += dt;
      if (dwell >= hold) {
        dwell = 0;
        if (side === 1) { this._reps++; times.push(t - t0); t0 = t; this.events.push("success"); if (this._reps >= S.reps) this.done = true; }
        else this.events.push("tick");
        side = 1 - side;
      }
    } else dwell = Math.max(0, dwell - dt * 2);
  };
  G.status = () => (hold >= 0.8 && dwell > 0.05 ? { title: "Hold it there", text: `${Math.max(0, hold - dwell).toFixed(1)} s`, tone: "good" } : { title: spec.cues[side], text: `${G._reps} of ${S.reps} done` });
  G.stats = () => [[spec.labels[0], deg(Math.abs(ext[0]))], [spec.labels[1], deg(Math.abs(ext[1]))], ["Average time per rep", secs(times)]].concat(spec.stats ? spec.stats(times) : []);
  G.debug = () => ({ kind: "value", target: tg[side], val, side });
  G.draw = function (g, W, H, a, tt) {
    Game.W = W; Game.H = H; bg(g, W, H); dots(g, W, S.reps, this._reps);
    draw(g, W, H, { val, targets: tg, side, prog: hold >= 0.2 ? dwell / hold : 0, reps: this._reps, a, t: tt });
  };
  return G;
}

// ---------------------------------------------------------------- Bursts: acceleration spikes
// Each spike above `thr` (after the reading settles) is one movement; `per` movements make a rep.
function Bursts(S, spec) {
  const G = base(S, S.reps), thr = lvl(S, spec.thr || { 1: 1.5, 2: 2, 3: 3 }), gap = spec.gap || 0.4, per = spec.per || 1;
  let t = 0, last = -9, armed = true, phase = 0, times = [], acc = 0, repStart = 0, peak = 0, peaks = [];
  G.update = function (dt, a) {
    t += dt; acc = a.acc;
    if (!armed) peak = Math.max(peak, a.acc);
    if (armed && a.acc > thr && t - last > gap) {
      armed = false; last = t; phase++; peak = a.acc;
      if (phase >= per) { phase = 0; this._reps++; times.push(t - repStart); repStart = t; this.events.push("success"); if (this._reps >= S.reps) this.done = true; }
      else this.events.push("tick");
    }
    if (!armed && a.acc < thr * 0.4) { armed = true; peaks.push(peak); }
  };
  G.status = () => ({ title: spec.cues[phase], text: `${G._reps} of ${S.reps} done` });
  G.stats = () => [["Reps", `${G._reps} / ${S.reps}`], ["Average time per rep", secs(times)], ["Strongest movement", peaks.length ? `${Math.max(...peaks).toFixed(1)} m/s²` : "–"]];
  G.debug = () => ({ kind: "spikes", thr, armed, acc });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    const cx = W / 2, cy = H * 0.5, up = acc > thr;
    const pics = spec.pics || [spec.emoji || "💪"];
    icon(g, pics[phase % pics.length], cx, cy - (up ? 24 : 0), Math.min(120, H * 0.22));
    rr(g, W * 0.25, H - 70, W * 0.5, 14, 7); g.fillStyle = alpha(T.ink, 0.08); g.fill();
    rr(g, W * 0.25, H - 70, W * 0.5 * clamp(acc / (thr * 2), 0, 1), 14, 7); g.fillStyle = up ? T.go : alpha(T.ink, 0.25); g.fill();
    txt(g, "Movement", W * 0.25, H - 40, 14, T.muted, { align: "left", font: T.body, weight: 400 });
  };
  return G;
}

// ---------------------------------------------------------------- Hold: stay in a band
// Keep the value inside [lo, hi] for `holdS` seconds in total (leaving pauses the timer), then
// relax for a moment. Measures the longest unbroken hold and how much the value wobbled.
function Hold(S, spec) {
  const G = base(S, S.reps), band = spec.band(S), need = spec.holdS(S), cues = spec.cues;
  let state = "go", held = 0, cur = 0, best = 0, val = 0, brk = 0, sum = 0, sum2 = 0, n = 0;
  const inBand = (v) => v >= band[0] && v <= band[1];
  G.update = function (dt, a) {
    val = spec.signal(a);
    if (state === "go") {
      if (inBand(val)) {
        held += dt; cur += dt; best = Math.max(best, cur); sum += val; sum2 += val * val; n++;
        if (held >= need) { this._reps++; this.events.push("success"); state = "rest"; held = 0; cur = 0; brk = 0; if (this._reps >= S.reps) this.done = true; }
      } else cur = 0;
    } else {
      brk += dt;
      const relaxed = spec.restBelow == null || val < spec.restBelow(S);
      if (relaxed && brk >= (spec.breakS || 1.5)) state = "go";
    }
  };
  G.status = function () {
    if (state === "rest") return { title: cues.rest || "Relax for a moment", text: `${G._reps} of ${S.reps} done`, tone: "good" };
    if (inBand(val)) return { title: cues.in || "Hold it steady", text: `${Math.max(0, need - held).toFixed(1)} s to go`, tone: "good" };
    return { title: val < band[0] ? cues.below : cues.above, text: `Hold for ${need} s` };
  };
  const sd = () => (n > 1 ? Math.sqrt(Math.max(0, sum2 / n - (sum / n) ** 2)) : 0);
  G.stats = () => [["Holds", `${G._reps} / ${S.reps}`], ["Longest steady hold", `${best.toFixed(1)} s`], ["Wobble while holding", `${sd().toFixed(1)}°`]];
  G.debug = () => ({ kind: "value", target: state === "go" ? (band[0] + Math.min(band[1], band[0] + 40)) / 2 : (spec.restBelow ? spec.restBelow(S) - 10 : (band[0] + Math.min(band[1], band[0] + 40)) / 2), val, state });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    const top = 160, bottom = H - 70, x = W * 0.42, maxV = Math.max(10, Math.min(band[1], band[0] + 40) * 1.25, band[0] * 1.4);
    const yOf = (v) => lerp(bottom, top, clamp(v / maxV, -0.05, 1.05));
    const y0 = yOf(Math.min(band[1], maxV * 1.05)), y1 = yOf(band[0]);
    rr(g, x - 90, y0, 180, y1 - y0, 14); g.fillStyle = alpha(T.go, state === "go" ? 0.18 : 0.08); g.fill(); g.strokeStyle = T.go; g.lineWidth = 2; g.stroke();
    const y = yOf(val);
    g.beginPath(); g.arc(x, y, 32, 0, TAU); g.fillStyle = T.surface; g.fill(); g.strokeStyle = inBand(val) ? T.go : T.accent; g.lineWidth = 4; g.stroke();
    icon(g, spec.emoji || "●", x, y + 2, 30); ring(g, x, y, 44, held / need);
    const bx = W * 0.7, bh = H - 260;
    rr(g, bx, 170, 26, bh, 13); g.fillStyle = alpha(T.ink, 0.08); g.fill();
    rr(g, bx, 170 + bh * (1 - held / need), 26, bh * (held / need), 13); g.fillStyle = T.go; g.fill();
    txt(g, `${Math.ceil(Math.max(0, need - held))} s`, bx + 13, 150, 18, T.ink, { font: T.mono, weight: 600 });
  };
  return G;
}

// ---------------------------------------------------------------- Track: follow a moving target
// A target drifts smoothly up and down; keep your marker on it. Score is the share of time on it.
function Track(S, spec) {
  const dur = S.durationS || 60, G = base(S, 1), [lo, hi] = spec.range(S), tol = lvl(S, { 1: 0.16, 2: 0.12, 3: 0.08 }) * (hi - lo);
  const speed = lvl(S, { 1: 0.35, 2: 0.5, 3: 0.7 }), ph = rand(0, 6);
  // two slow waves mixed, easing out from the middle over the first 3 seconds
  const target = (t) => lerp(lo, hi, 0.5 + 0.5 * clamp(t / 3, 0, 1) * (0.6 * Math.sin(t * speed + ph) + 0.4 * Math.sin(t * speed * 1.7 + ph * 2)));
  let t = 0, on = 0, val = 0, err = 0, n = 0, hist = [];
  G.update = function (dt, a) {
    t += dt; val = spec.signal(a);
    const d = Math.abs(val - target(t)); err += d; n++;
    if (d <= tol) on += dt;
    hist.push([t, val]); if (hist.length > 240) hist.shift();
    if (t >= dur) { this._reps = 1; this.done = true; }
  };
  G.status = () => (Math.abs(val - target(t)) <= tol ? { title: "On it. Keep following.", text: `${fmtTime(Math.max(0, dur - t))} left`, tone: "good" } : { title: spec.cue || "Follow the moving target", text: val < target(t) ? "A little higher" : "A little lower" });
  G.stats = () => [["Time on target", `${Math.round((on / Math.max(0.1, t)) * 100)}%`], ["Average distance", `${(err / Math.max(1, n)).toFixed(1)}°`]];
  G.debug = () => ({ kind: "value", target: target(t), val });
  G.draw = function (g, W, H) {
    bg(g, W, H);
    const top = 160, bottom = H - 60, x0 = W * 0.28, pps = (W - x0 - 40) / 4;
    const yOf = (v) => lerp(bottom, top, clamp((v - lo) / (hi - lo), -0.1, 1.1));
    g.strokeStyle = alpha(T.accent, 0.3); g.lineWidth = Math.max(8, ((yOf(lo) - yOf(lo + tol)) * 2)); g.lineCap = "round"; g.beginPath();
    for (let k = 0; k <= 40; k++) { const tt = t + k * 0.1, X = x0 + k * 0.1 * pps, Y = yOf(target(tt)); k ? g.lineTo(X, Y) : g.moveTo(X, Y); }
    g.stroke(); g.lineCap = "butt";
    g.strokeStyle = alpha(T.ink, 0.35); g.lineWidth = 2; g.beginPath();
    hist.forEach(([tt, v], i) => { const X = x0 - (t - tt) * pps, Y = yOf(v); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke();
    const ty = yOf(target(t)); g.beginPath(); g.arc(x0, ty, 30, 0, TAU); g.strokeStyle = T.accent; g.lineWidth = 4; g.stroke();
    icon(g, spec.emoji || "🌙", x0 + 70, ty, 26);
    g.beginPath(); g.arc(x0, yOf(val), 14, 0, TAU); g.fillStyle = Math.abs(val - target(t)) <= tol ? T.go : T.ink; g.fill();
    g.strokeStyle = T.go; g.lineWidth = 8; g.lineCap = "round"; g.beginPath(); g.moveTo(W * 0.2, 135); g.lineTo(lerp(W * 0.2, W * 0.8, clamp(1 - t / dur, 0, 1)), 135); g.stroke(); g.lineCap = "butt";
  };
  return G;
}

// ---------------------------------------------------------------- Catch: move a basket under falling things
function Catch(S, spec) {
  const G = base(S, S.reps), span = S.amp * 0.9, bw = lvl(S, { 1: 0.32, 2: 0.24, 3: 0.17 }), fall = lvl(S, { 1: 0.22, 2: 0.3, 3: 0.4 });
  const items = spec.items || ["🍎", "🍐", "🍊", "🍋"];
  let item = null, sent = 0, caught = 0, missed = 0, val = 0, flashT = 0, flashOk = true, wait = 1;
  const pos = () => clamp(val / span, -1, 1);
  function spawn() { item = { u: rand(-0.85, 0.85), y: 0, e: pick(items) }; sent++; }
  G.update = function (dt, a) {
    val = spec.signal(a); flashT = Math.max(0, flashT - dt);
    if (!item) { wait -= dt; if (wait <= 0 && sent < S.reps) spawn(); return; }
    item.y += fall * dt;
    if (item.y >= 1) {
      const ok = Math.abs(item.u - pos()) <= bw;
      if (ok) { caught++; this._reps = caught; this.events.push("success"); } else { missed++; this.events.push("error"); }
      flashOk = ok; flashT = 0.6; item = null; wait = 0.5;
      if (sent >= S.reps) this.done = true;
    }
  };
  G.status = () => (flashT > 0 ? (flashOk ? { title: "Caught it", text: `${caught} caught`, tone: "good" } : { title: "Missed that one", text: "Move under the next one early.", tone: "warn" }) : { title: spec.cue, text: `${caught} caught · ${S.reps - sent} to come` });
  G.stats = () => [["Caught", `${caught} / ${S.reps}`], ["Missed", String(missed)]];
  G.debug = () => ({ kind: "value", target: item ? item.u * span : 0, val });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, sent - (item ? 1 : 0));
    const top = 150, floor = H - 70, cx = W / 2, half = W * 0.38;
    if (item) icon(g, item.e, cx + item.u * half, lerp(top, floor - 30, item.y), 44);
    const bx = cx + pos() * half, w = bw * half * 2;
    rr(g, bx - w / 2, floor - 24, w, 44, 12); g.fillStyle = flashT > 0 && flashOk ? T.go : T.accent; g.fill();
    icon(g, spec.basket || "🧺", bx, floor - 2, 30);
  };
  return G;
}

// ---------------------------------------------------------------- Steer: guide through gaps
// Gates come toward you; steer so you pass through each gap. vertical: up/down (a kite),
// otherwise left/right (a car on a road).
function Steer(S, spec) {
  const G = base(S, S.reps), span = S.amp * 0.9, gapW = lvl(S, { 1: 0.38, 2: 0.28, 3: 0.2 }), speed = lvl(S, { 1: 0.22, 2: 0.3, 3: 0.38 });
  let gates = [], sent = 0, passed = 0, cleared = 0, val = 0, flashT = 0, flashOk = true;
  const pos = () => clamp(val / span, -1, 1);
  function add(u) { gates.push({ u, c: rand(-0.75, 0.75) }); sent++; }
  add(1.1);
  G.update = function (dt, a) {
    val = spec.signal(a); flashT = Math.max(0, flashT - dt);
    gates.forEach((q) => (q.u -= speed * dt));
    if (sent < S.reps && gates.length && gates[gates.length - 1].u < 0.55) add(1.1);
    while (gates.length && gates[0].u <= 0) {
      const q = gates.shift(), ok = Math.abs(pos() - q.c) <= gapW; passed++;
      if (ok) { cleared++; this._reps = cleared; this.events.push("success"); } else this.events.push("error");
      flashOk = ok; flashT = 0.6;
      if (passed >= S.reps) this.done = true;
    }
  };
  G.status = () => (flashT > 0 && !flashOk ? { title: "Missed the gap", text: "Line up with the next one early.", tone: "warn" } : { title: spec.cue, text: `${cleared} of ${S.reps} through` });
  G.stats = () => [["Through the gap", `${cleared} / ${S.reps}`], ["Missed", String(passed - cleared)]];
  G.debug = () => ({ kind: "value", target: gates.length ? gates[0].c * span : 0, val });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, passed);
    const vert = !!spec.vertical, top = 150;
    const P = vert ? { x0: W * 0.18, x1: W - 40, cy: (top + H - 40) / 2, half: (H - top - 60) / 2 } : { y0: H - 70, y1: top, cx: W / 2, half: W * 0.36 };
    const map = (u, v) => (vert ? { x: lerp(P.x0, P.x1, u), y: P.cy - v * P.half } : { x: P.cx + v * P.half, y: lerp(P.y0, P.y1, u) });
    if (!vert) { g.fillStyle = alpha(T.ink, 0.06); g.fillRect(P.cx - P.half - 30, top, P.half * 2 + 60, H - top); }
    for (const q of gates) {
      if (q.u > 1.05) continue;
      const a0 = map(q.u, -1.15), a1 = map(q.u, q.c - gapW), b0 = map(q.u, q.c + gapW), b1 = map(q.u, 1.15);
      g.strokeStyle = T.accent; g.lineWidth = 14; g.lineCap = "round";
      g.beginPath(); g.moveTo(a0.x, a0.y); g.lineTo(a1.x, a1.y); g.moveTo(b0.x, b0.y); g.lineTo(b1.x, b1.y); g.stroke(); g.lineCap = "butt";
    }
    const p = map(0, pos()); icon(g, spec.emoji, p.x, p.y, 44);
  };
  return G;
}

// ---------------------------------------------------------------- Circles: draw circles by tilting
// The tilt direction (roll, pitch) must sweep all the way around while staying past a minimum
// tilt. The first half of the reps go one way, the second half the other way.
function Circles(S, spec) {
  const G = base(S, S.reps), minR = S.amp * 0.5;
  let sum = 0, prev = null, x = 0, y = 0, rs = [], wrongT = 0;
  const dir = () => (G._reps < Math.ceil(S.reps / 2) ? 1 : -1);
  G.update = function (dt, a) {
    x = a.roll; y = a.pitch; wrongT = Math.max(0, wrongT - dt);
    const r = Math.hypot(x, y);
    if (r < minR) { prev = null; return; }
    const th = Math.atan2(y, x);
    if (prev != null) { let d = th - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; sum += d; rs.push(r); }
    prev = th;
    if (sum * dir() >= TAU) { this._reps++; sum = 0; this.events.push("success"); if (this._reps >= S.reps) this.done = true; else if (this._reps === Math.ceil(S.reps / 2)) this.events.push("tick"); }
    else if (sum * dir() <= -TAU * 0.5) { sum = 0; wrongT = 1.5; }
  };
  const way = () => (dir() > 0 ? "counterclockwise" : "clockwise");
  G.status = () => (wrongT > 0 ? { title: `Other way: go ${way()}`, text: "Follow the arrow around the ring.", tone: "warn" } : Math.hypot(x, y) < minR ? { title: spec.cue, text: `Tilt further to reach the ring, then go ${way()}` } : { title: `Keep going ${way()}`, text: `${G._reps} of ${S.reps} circles` });
  G.stats = () => [["Circles", `${G._reps} / ${S.reps}`], ["Average tilt while circling", rs.length ? deg(avg(rs)) : "–"]];
  G.debug = () => ({ kind: "circles", dir: dir(), sum, r: minR });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    const cx = W / 2, cy = H * 0.57, sc = Math.min(W * 0.3, (H - 200) * 0.45) / (S.amp * 1.2), R = minR * 1.4 * sc;
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.strokeStyle = alpha(T.accent, 0.35); g.lineWidth = 26; g.stroke();
    g.beginPath(); g.arc(cx, cy, minR * sc, 0, TAU); g.strokeStyle = alpha(T.ink, 0.12); g.lineWidth = 2; g.setLineDash([6, 6]); g.stroke(); g.setLineDash([]);
    // progress arc and direction arrow (math angles run counterclockwise; screen y is flipped)
    g.strokeStyle = T.go; g.lineWidth = 10; g.lineCap = "round"; g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 - dir() * clamp(Math.abs(sum) / TAU, 0, 1) * TAU, dir() > 0); g.stroke(); g.lineCap = "butt";
    icon(g, dir() > 0 ? "↺" : "↻", cx, cy, 54);
    const px = cx + clamp(x, -S.amp * 1.3, S.amp * 1.3) * sc, py = cy - clamp(y, -S.amp * 1.3, S.amp * 1.3) * sc;
    g.beginPath(); g.arc(px, py, 18, 0, TAU); g.fillStyle = T.surface; g.fill(); icon(g, spec.emoji || "●", px, py + 1, 24);
  };
  return G;
}

// ---------------------------------------------------------------- Wave: quick back-and-forth
// Past +thr, then past -thr, is one cycle. Counts cycles and their pace.
function Wave(S, spec) {
  const G = base(S, S.reps), thr = spec.thr(S);
  let want = 1, val = 0, t = 0, first = null, lastRep = 0;
  G.update = function (dt, a) {
    t += dt; val = spec.signal(a);
    if (want > 0 && val >= thr) { want = -1; if (first == null) first = t; }
    else if (want < 0 && val <= -thr) { want = 1; this._reps++; lastRep = t; this.events.push("tick"); if (this._reps >= S.reps) { this.events.push("success"); this.done = true; } }
  };
  const pace = () => (G._reps > 1 && first != null ? (G._reps / Math.max(0.1, lastRep - first)).toFixed(2) : "–");
  G.status = () => ({ title: spec.cues[want > 0 ? 0 : 1], text: `${G._reps} of ${S.reps}` });
  G.stats = () => [["Cycles", `${G._reps} / ${S.reps}`], ["Pace", `${pace()} per second`]];
  G.debug = () => ({ kind: "value", target: want * thr * 1.25, val });
  G.draw = function (g, W, H, a, tt) {
    bg(g, W, H); dots(g, W, Math.min(S.reps, 30), Math.round((this._reps / S.reps) * Math.min(S.reps, 30)));
    if (spec.draw) { spec.draw(g, W, H, { val, thr, prog: this._reps / S.reps, want }); return; }
    const cx = W / 2, cy = H * 0.56, R = Math.min(W * 0.3, H * 0.3);
    for (const s of [1, -1]) { const A = -Math.PI / 2 + s * 0.9; g.beginPath(); g.arc(cx + Math.cos(A) * R, cy + Math.sin(A) * R, 22, 0, TAU); g.fillStyle = (s > 0) === (want > 0) ? T.accent : alpha(T.accent, 0.2); g.fill(); }
    g.save(); g.translate(cx, cy); g.rotate(clamp(val / (thr * 1.4), -1.2, 1.2) * 0.9); icon(g, spec.emoji || "●", 0, -R * 0.55, 60); g.restore();
  };
  return G;
}

// ---------------------------------------------------------------- Throw: power to distance
// A quick throwing push sets the distance (peak acceleration). In mouse mode, hold the button
// longer for a longer throw. Land it in the target zone.
function Throw(S, spec) {
  const G = base(S, S.reps), thr = lvl(S, { 1: 1.5, 2: 2, 3: 2.5 }), top = thr * 4, width = lvl(S, { 1: 0.22, 2: 0.16, 3: 0.11 });
  let phase = "aim", zone = rand(0.35, 0.85), peak = 0, win = 0, power = 0, hits = 0, showT = 0, charge = 0, ok = false, fly = 0, dists = [];
  G.update = function (dt, a) {
    if (phase === "aim") {
      if (a.demo) { if (a.acc > 0) { charge += dt; phase = "charge"; } }
      else if (a.acc > thr) { phase = "throw"; peak = a.acc; win = 0; }
    } else if (phase === "charge") {
      if (a.acc > 0) charge += dt; else { power = clamp(charge / 1.6, 0, 1); land(); }
    } else if (phase === "throw") {
      peak = Math.max(peak, a.acc); win += dt;
      if (win >= 0.35) { power = clamp((peak - thr) / (top - thr), 0, 1); land(); }
    } else if (phase === "show") {
      fly = Math.min(1, fly + dt * 2.5); showT -= dt;
      if (showT <= 0 && (a.demo || a.acc < thr * 0.5)) { if (this._reps >= S.reps) this.done = true; else { phase = "aim"; zone = rand(0.35, 0.85); charge = 0; } }
    }
  };
  function land() {
    ok = Math.abs(power - zone) <= width / 2; if (ok) hits++;
    G._reps++; dists.push(power); G.events.push(ok ? "success" : "error");
    phase = "show"; showT = 1.2; fly = 0;
  }
  G.status = function () {
    if (phase === "show") return ok ? { title: "Right in the target", text: `${hits} hits`, tone: "good" } : { title: power < zone ? "A bit short" : "A bit long", text: power < zone ? "Throw a little harder." : "Throw a little softer.", tone: "warn" };
    return { title: spec.cue, text: "Mouse: hold the button longer to throw further." };
  };
  G.stats = () => [["Throws", `${G._reps} / ${S.reps}`], ["In the target", `${hits} / ${G._reps}`]];
  G.debug = () => ({ kind: "throw", phase, zone, thr, top });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    const x0 = W * 0.12, x1 = W * 0.9, y = H - 90, xOf = (p) => lerp(x0 + 60, x1, p);
    g.fillStyle = alpha(T.ink, 0.06); g.fillRect(x0, y, x1 - x0, 14);
    rr(g, xOf(zone - width / 2), y - 30, xOf(zone + width / 2) - xOf(zone - width / 2), 44, 10); g.fillStyle = alpha(T.go, 0.3); g.fill(); g.strokeStyle = T.go; g.lineWidth = 2; g.stroke();
    icon(g, spec.thrower || "🙋", x0 + 20, y - 30, 44);
    if (phase === "show") { const px = lerp(x0 + 40, xOf(power), fly), py = y - 20 - Math.sin(fly * Math.PI) * (H * 0.35); icon(g, spec.emoji || "🟠", px, py, 30); }
    else if (phase === "charge") { rr(g, x0, y + 30, (x1 - x0) * clamp(charge / 1.6, 0, 1), 12, 6); g.fillStyle = T.accent; g.fill(); }
  };
  return G;
}

// ---------------------------------------------------------------- Seq: a movement in steps
// Steps run in order (each { axis, target, hold, cue }), then return to rest; that is one rep.
// `steps(S, rep)` can vary the targets from rep to rep.
function Seq(S, spec) {
  const G = base(S, S.reps);
  let steps = spec.steps(S, 0), k = 0, dwell = 0, need = false, val = 0, restT = 0, t = 0, t0 = 0, times = [];
  const reached = (st, v) => (st.target >= 0 ? v >= st.target * 0.9 : v <= st.target * 0.9);
  G.update = function (dt, a) {
    t += dt;
    if (need) {
      val = [a.pitch, a.roll, a.yaw].reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m), 0); // furthest from rest
      if (Math.abs(a.pitch) < S.amp * 0.3 && Math.abs(a.roll) < S.amp * 0.3 && Math.abs(a.yaw) < S.amp * 0.4) { restT += dt; if (restT >= 0.4) { need = false; k = 0; steps = spec.steps(S, G._reps); t0 = t; } } else restT = 0;
      return;
    }
    const st = steps[k]; val = a[st.axis];
    if (reached(st, val)) {
      dwell += dt;
      if (dwell >= (st.hold || 0.5)) {
        dwell = 0; k++;
        if (k >= steps.length) { this._reps++; times.push(t - t0); this.events.push("success"); need = true; restT = 0; if (this._reps >= S.reps) this.done = true; }
        else this.events.push("tick");
      }
    } else dwell = Math.max(0, dwell - dt * 2);
  };
  G.status = () => (need ? { title: spec.restCue || "Back to your starting position", text: `${G._reps} of ${S.reps} done` } : { title: steps[k].cue, text: `Step ${k + 1} of ${steps.length}` });
  G.stats = () => [["Reps", `${G._reps} / ${S.reps}`], ["Average time per rep", secs(times)]];
  G.debug = () => ({ kind: "value", target: need ? 0 : steps[k].target, val });
  G.draw = function (g, W, H, a) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    const n = steps.length, w = Math.min(220, (W - 80) / n - 20), x0 = W / 2 - (n * (w + 20) - 20) / 2, y = 190;
    steps.forEach((st, i) => {
      const on = !need && i === k, done = need || i < k, x = x0 + i * (w + 20);
      rr(g, x, y, w, 96, 16); g.fillStyle = done ? alpha(T.go, 0.18) : on ? alpha(T.accent, 0.16) : T.surface; g.fill();
      g.strokeStyle = on ? T.accent : alpha(T.ink, 0.12); g.lineWidth = on ? 3 : 1.5; g.stroke();
      icon(g, st.emoji || "●", x + w / 2, y + 36, 34);
      txt(g, `${i + 1}`, x + 18, y + 18, 13, T.muted, { font: T.mono, weight: 600 });
      txt(g, st.short || st.cue, x + w / 2, y + 76, 14, T.ink, { font: T.body, weight: on ? 700 : 400 });
    });
    if (!need) {
      const st = steps[k], v = a[st.axis], p = clamp(Math.abs(v) / Math.abs(st.target), 0, 1.05) * (Math.sign(v) === Math.sign(st.target) ? 1 : 0);
      const bx = W * 0.2, bw = W * 0.6, by = H - 110;
      rr(g, bx, by, bw, 22, 11); g.fillStyle = alpha(T.ink, 0.08); g.fill();
      rr(g, bx, by, bw * Math.min(1, p), 22, 11); g.fillStyle = p >= 0.9 ? T.go : T.accent; g.fill();
      ring(g, W / 2, by - 40, 22, dwell / (st.hold || 0.5));
    }
  };
  return G;
}

// ---------------------------------------------------------------- Dial: fine control to a spot
// Turn to the exact target and hold it there; targets jump around the dial.
function Dial(S, spec) {
  const G = base(S, S.reps), range = S.amp * 1.2, tol = lvl(S, { 1: 6, 2: 4, 3: 2.5 }), HOLD = 1.2;
  const next = (old) => { let v; do { v = rand(-range, range); } while (old != null && Math.abs(v - old) < range * 0.5); return v; };
  let target = next(), val = 0, dwell = 0, t = 0, t0 = 0, times = [], errs = [];
  G.update = function (dt, a) {
    t += dt; val = spec.signal(a);
    if (Math.abs(val - target) <= tol) {
      dwell += dt;
      if (dwell >= HOLD) { this._reps++; times.push(t - t0); errs.push(Math.abs(val - target)); t0 = t; dwell = 0; this.events.push("success"); if (this._reps >= S.reps) this.done = true; else target = next(target); }
    } else dwell = Math.max(0, dwell - dt * 2);
  };
  G.status = () => (dwell > 0 ? { title: "Right there. Hold still.", text: `${Math.max(0, HOLD - dwell).toFixed(1)} s`, tone: "good" } : { title: spec.cue, text: val < target ? spec.more : spec.less });
  G.stats = () => [["Found", `${G._reps} / ${S.reps}`], ["Average time to find", secs(times)], ["Accuracy", errs.length ? `±${avg(errs).toFixed(1)}°` : "–"]];
  G.debug = () => ({ kind: "value", target, val });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    const cx = W / 2, cy = H - 80, R = Math.min(W * 0.38, H - 220), ang = (v) => -Math.PI / 2 + clamp(v / range, -1.15, 1.15) * 1.2;
    g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2 - 1.3, -Math.PI / 2 + 1.3); g.strokeStyle = alpha(T.ink, 0.1); g.lineWidth = 40; g.stroke();
    for (let k = -10; k <= 10; k++) { const A = ang((k / 10) * range); g.beginPath(); g.moveTo(cx + Math.cos(A) * (R - 14), cy + Math.sin(A) * (R - 14)); g.lineTo(cx + Math.cos(A) * (R + (k % 5 ? 2 : 12)), cy + Math.sin(A) * (R + (k % 5 ? 2 : 12))); g.strokeStyle = alpha(T.ink, 0.35); g.lineWidth = 2; g.stroke(); }
    const a0 = ang(target - tol), a1 = ang(target + tol);
    g.beginPath(); g.arc(cx, cy, R, a0, a1); g.strokeStyle = T.go; g.lineWidth = 40; g.stroke();
    icon(g, spec.emoji || "📻", cx + Math.cos(ang(target)) * (R + 46), cy + Math.sin(ang(target)) * (R + 46), 30);
    const A = ang(val); g.strokeStyle = T.accent; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(A) * (R + 20), cy + Math.sin(A) * (R + 20)); g.stroke(); g.lineCap = "butt";
    ring(g, cx, cy, 30, dwell / HOLD);
  };
  return G;
}

// ---------------------------------------------------------------- Timed: move when the moment comes
// A timer runs (cooking, waiting); move past `target` only once it says "now". Too early or too
// late both count against you. Used for flipping a pancake.
function Timed(S, spec) {
  const G = base(S, S.reps), target = spec.target(S), window_ = lvl(S, { 1: 2.4, 2: 1.8, 3: 1.2 });
  let phase = "wait", t = 0, wait = rand(1.5, 3), val = 0, early = 0, late = 0, rts = [], tries = 0, flashT = 0, msg = null;
  G.update = function (dt, a) {
    val = spec.signal(a); t += dt; flashT = Math.max(0, flashT - dt);
    const moved = Math.abs(val) >= Math.abs(target) * 0.9;
    if (phase === "wait") { if (moved) { early++; msg = "early"; flashT = 1.2; phase = "back"; this.events.push("error"); } else if (t >= wait) { phase = "now"; t = 0; } }
    else if (phase === "now") {
      if (moved) { this._reps++; rts.push(t); msg = "good"; flashT = 0.9; phase = "back"; tries++; this.events.push("success"); }
      else if (t >= window_) { late++; tries++; msg = "late"; flashT = 1.2; phase = "back"; this.events.push("error"); }
    } else if (Math.abs(val) < Math.abs(target) * 0.3) {
      if (this._reps >= S.reps || tries >= S.reps * 2) this.done = true;
      else { phase = "wait"; t = 0; wait = rand(1.5, 3); }
    }
  };
  G.status = function () {
    if (flashT > 0 && msg) return { good: { title: spec.good, text: `${G._reps} of ${S.reps}`, tone: "good" }, early: { title: "Too early", text: spec.wait, tone: "warn" }, late: { title: spec.late, text: "Move as soon as it says now.", tone: "warn" } }[msg];
    if (phase === "back") return { title: "Back to the start", text: `${G._reps} of ${S.reps}` };
    return phase === "now" ? { title: spec.now, text: "Go!", tone: "good" } : { title: spec.wait, text: "Wait for it…" };
  };
  G.stats = () => [["On time", `${G._reps} / ${S.reps}`], ["Too early", String(early)], ["Too late", String(late)], ["Reaction time", secs(rts)]];
  G.debug = () => ({ kind: "value", target: phase === "now" ? target * 1.05 : 0, val });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    const cx = W / 2, cy = H * 0.55, now = phase === "now";
    g.beginPath(); g.ellipse(cx, cy + 40, Math.min(W * 0.25, 220), 40, 0, 0, TAU); g.fillStyle = alpha(T.ink, now ? 0.2 : 0.1); g.fill();
    g.save(); g.translate(cx, cy); g.rotate(clamp(val / Math.abs(target), -1.1, 1.1) * Math.PI * 0.5); icon(g, spec.emoji, 0, 0, 90); g.restore();
    const p = phase === "wait" ? clamp(t / wait, 0, 1) : now ? 1 - clamp(t / window_, 0, 1) : 0;
    rr(g, W * 0.25, 150, W * 0.5 * p, 14, 7); g.fillStyle = now ? T.go : alpha(T.accent, 0.7); g.fill();
    if (now) txt(g, "NOW", cx, cy - 110, 44, T.go, { font: T.body });
  };
  return G;
}

// ---------------------------------------------------------------- Direction: quick reaction reaches
// Hold still in the middle; when an arrow shows, tilt that way as fast as you can.
function Direction(S, spec) {
  const G = base(S, S.reps), amp = S.amp * 0.8;
  const DIRS = { 1: [[1, 0], [-1, 0]], 2: [[1, 0], [-1, 0], [0, 1], [0, -1]], 3: [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]] }[S.level] || [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let phase = "center", t = 0, wait = rand(0.8, 2), d = pick(DIRS), rts = [], wrong = 0, x = 0, y = 0, early = 0;
  G.update = function (dt, a) {
    x = a.roll; y = a.pitch; t += dt;
    const r = Math.hypot(x, y), along = x * d[0] + y * d[1];
    if (phase === "center") { if (r < amp * 0.3) { if (t >= wait) { phase = "go"; t = 0; } } else if (t > 0.2 && r > amp * 0.8) { early++; t = 0; } }
    else if (phase === "go") {
      if (along >= amp * 0.85) { this._reps++; rts.push(t); this.events.push("success"); phase = "back"; if (this._reps >= S.reps) this.done = true; }
      else if (r >= amp * 0.85) { wrong++; this.events.push("error"); phase = "back"; }
    } else if (r < amp * 0.3) { phase = "center"; t = 0; wait = rand(0.8, 2); let n; do { n = pick(DIRS); } while (DIRS.length > 1 && n === d); d = n; }
  };
  const NAME = (v) => (v[1] > 0.5 && Math.abs(v[0]) < 0.5 ? "up" : v[1] < -0.5 && Math.abs(v[0]) < 0.5 ? "down" : v[0] > 0.5 && Math.abs(v[1]) < 0.5 ? "right" : v[0] < -0.5 && Math.abs(v[1]) < 0.5 ? "left" : `${v[1] > 0 ? "up" : "down"} and ${v[0] > 0 ? "right" : "left"}`);
  G.status = () => (phase === "go" ? { title: `Quick: ${NAME(d)}!`, text: "Reach toward the arrow.", tone: "good" } : phase === "back" ? { title: "Back to the middle", text: `${G._reps} of ${S.reps}` } : { title: spec.cue, text: "Wait for the arrow." });
  G.stats = () => [["Reaches", `${G._reps} / ${S.reps}`], ["Reaction time", secs(rts)], ["Fastest", rts.length ? `${Math.min(...rts).toFixed(2)} s` : "–"], ["Wrong way", String(wrong)]];
  G.debug = () => ({ kind: "direction", phase, dir: d, amp });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    const cx = W / 2, cy = H * 0.57, R = Math.min(W * 0.3, (H - 200) * 0.45), sc = R / (amp * 1.2);
    g.beginPath(); g.arc(cx, cy, amp * 0.3 * sc, 0, TAU); g.fillStyle = alpha(T.go, phase === "center" ? 0.2 : 0.08); g.fill();
    DIRS.forEach((v) => { g.beginPath(); g.arc(cx + v[0] * amp * sc, cy - v[1] * amp * sc, 24, 0, TAU); g.fillStyle = phase === "go" && v === d ? T.accent : alpha(T.ink, 0.06); g.fill(); });
    if (phase === "go") { g.save(); g.translate(cx, cy); g.rotate(Math.atan2(-d[1], d[0])); g.fillStyle = T.accent; g.beginPath(); g.moveTo(80, 0); g.lineTo(30, -32); g.lineTo(30, 32); g.closePath(); g.fill(); g.fillRect(-10, -10, 44, 20); g.restore(); }
    g.beginPath(); g.arc(cx + clamp(x, -amp * 1.2, amp * 1.2) * sc, cy - clamp(y, -amp * 1.2, amp * 1.2) * sc, 14, 0, TAU); g.fillStyle = T.ink; g.fill();
  };
  return G;
}

// ---------------------------------------------------------------- pointer games (tilt cursor)
// All steer RC.kit's Cursor by tilting (the mouse stands in), so they train controlled reaching.
function pointerGame(S, goal) {
  const G = base(S, goal), cur = Cursor({ amp: S.amp });
  G.cur = cur;
  G.track = function (dt, a) { const { W, H } = stage(); cur.update(dt, a, W, H); cur.active = true; };
  return G;
}
const near = (c, p, r) => Math.hypot(c.x - p.x, c.y - p.y) <= r;

// Bubbles float up; touch each with the pointer before it gets away.
function Pop(S, spec) {
  const G = pointerGame(S, S.reps), r = lvl(S, { 1: 46, 2: 36, 3: 28 }), every = lvl(S, { 1: 1.4, 2: 1.1, 3: 0.85 }), rise = lvl(S, { 1: 50, 2: 70, 3: 95 });
  let bubbles = [], t = 0, nextT = 0.3, popped = 0, got = 0, sent = 0;
  G.update = function (dt, a) {
    this.track(dt, a); t += dt;
    const { W, H } = stage();
    if (t >= nextT && sent < S.reps * 3) { bubbles.push({ x: rand(W * 0.14, W * 0.86), y: H + r, e: pick(spec.items || ["🫧"]) }); sent++; nextT = t + every; }
    bubbles.forEach((b) => (b.y -= rise * dt));
    const before = bubbles.length;
    bubbles = bubbles.filter((b) => { if (near(this.cur, b, r + 8)) { popped++; this._reps = popped; this.events.push("success"); return false; } return b.y > 140; });
    got += before - bubbles.length;
    if (popped >= S.reps || (sent >= S.reps * 3 && !bubbles.length)) this.done = true;
  };
  G.status = () => ({ title: spec.cue, text: `${popped} of ${S.reps}` });
  G.stats = () => [["Popped", `${popped} / ${S.reps}`], ["Got away", String(Math.max(0, got - popped))]];
  G.debug = () => ({ kind: "points", targets: bubbles.slice().sort((p, q) => p.y - q.y).map((b) => ({ x: b.x, y: b.y })), cursor: { x: G.cur.x, y: G.cur.y }, dwell: 0 });
  G.draw = function (g, W, H) {
    Game.W = W; Game.H = H; bg(g, W, H); dots(g, W, S.reps, popped);
    for (const b of bubbles) { g.beginPath(); g.arc(b.x, b.y, r, 0, TAU); g.fillStyle = alpha(T.accent, 0.18); g.fill(); g.strokeStyle = T.accent; g.lineWidth = 2; g.stroke(); icon(g, b.e, b.x, b.y + 2, r * 0.9); }
    this.cur.draw(g);
  };
  return G;
}

// Pick: rest on the item to pick it up, then carry it to the drop spot and rest there.
function Pick(S, spec) {
  const G = pointerGame(S, S.reps), DW = 0.7;
  let item = null, carrying = false, drop = null, held = 0, t = 0, t0 = 0, times = [];
  const place = () => { const { W, H } = stage(); item = { x: rand(W * 0.18, W * 0.82), y: rand(170, H * 0.5), e: pick(spec.items) }; carrying = false; };
  G.update = function (dt, a) {
    this.track(dt, a); t += dt;
    const { W, H } = stage(); drop = { x: W / 2, y: H - 80 };
    if (!item) place();
    const goal = carrying ? drop : item;
    if (near(this.cur, goal, 40)) { held += dt; if (held >= DW) { held = 0; if (!carrying) { carrying = true; this.events.push("tick"); } else { this._reps++; times.push(t - t0); t0 = t; this.events.push("success"); if (this._reps >= S.reps) this.done = true; else place(); } } }
    else held = Math.max(0, held - dt * 2);
  };
  G.status = () => (carrying ? { title: spec.carry, text: "Hold still over it to let go." } : { title: spec.cue, text: `${G._reps} of ${S.reps} · hold still on it to pick it up` });
  G.stats = () => [["Done", `${G._reps} / ${S.reps}`], ["Average time each", secs(times)]];
  G.debug = () => ({ kind: "points", targets: item ? [carrying ? drop : item] : [], cursor: { x: G.cur.x, y: G.cur.y }, dwell: DW });
  G.draw = function (g, W, H) {
    Game.W = W; Game.H = H; bg(g, W, H); dots(g, W, S.reps, this._reps);
    if (spec.backdrop) spec.backdrop(g, W, H);
    const d = { x: W / 2, y: H - 80 };
    rr(g, d.x - 60, d.y - 36, 120, 72, 18); g.fillStyle = alpha(T.go, 0.15); g.fill(); g.strokeStyle = T.go; g.lineWidth = 2; g.setLineDash([8, 6]); g.stroke(); g.setLineDash([]);
    icon(g, spec.dropIcon || "🧺", d.x, d.y + 2, 40);
    if (item) { const p = carrying ? this.cur : item; icon(g, item.e, p.x, p.y - (carrying ? 30 : 0), 44); }
    ring(g, (carrying ? d : item || d).x, (carrying ? d : item || d).y, 40, held / DW);
    this.cur.draw(g);
  };
  return G;
}

// Dots: rest on each numbered dot in order to draw the picture.
function Dots(S) {
  const G = pointerGame(S, S.reps), DW = 0.5, n = S.reps;
  let pts = null, k = 0, held = 0;
  function build(W, H) {
    const cx = W / 2, cy = H * 0.58, R = Math.min(W * 0.32, (H - 200) * 0.46);
    // a star outline, walking around its points and dents
    return Array.from({ length: n }, (_, i) => { const A = -Math.PI / 2 + (i / n) * TAU, rad = i % 2 ? R * 0.5 : R; return { x: cx + Math.cos(A) * rad, y: cy + Math.sin(A) * rad }; });
  }
  G.update = function (dt, a) {
    this.track(dt, a);
    if (!pts) { const { W, H } = stage(); pts = build(W, H); }
    if (near(this.cur, pts[k], 28)) { held += dt; if (held >= DW) { held = 0; k++; this._reps = k; this.events.push(k >= n ? "success" : "tick"); if (k >= n) this.done = true; } }
    else held = Math.max(0, held - dt * 2);
  };
  G.status = () => ({ title: `Go to dot ${Math.min(n, k + 1)}`, text: "Hold still on it to join it up." });
  G.stats = () => [["Dots joined", `${k} / ${n}`]];
  G.debug = () => ({ kind: "points", targets: pts && k < n ? [pts[k]] : [], cursor: { x: G.cur.x, y: G.cur.y }, dwell: DW });
  G.draw = function (g, W, H) {
    if (!pts || Game.W !== W || Game.H !== H) { Game.W = W; Game.H = H; pts = build(W, H); }
    bg(g, W, H);
    g.strokeStyle = T.go; g.lineWidth = 5; g.lineCap = "round"; g.beginPath(); pts.slice(0, k).forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); if (k >= n) g.closePath(); g.stroke(); g.lineCap = "butt";
    pts.forEach((p, i) => { g.beginPath(); g.arc(p.x, p.y, 18, 0, TAU); g.fillStyle = i < k ? T.go : i === k ? T.accent : alpha(T.ink, 0.1); g.fill(); txt(g, String(i + 1), p.x, p.y, 13, i <= k ? T.surface : T.ink, { font: T.mono, weight: 600 }); });
    if (k < n) ring(g, pts[k].x, pts[k].y, 28, held / DW);
    this.cur.draw(g);
  };
  return G;
}

// Cover: sweep the pointer over the whole area (cleaning a window, painting a wall).
function Cover(S, spec) {
  const goal = Math.max(1, Math.round(S.reps / 5)), G = pointerGame(S, goal), COLS = 8, ROWS = 5, brush = lvl(S, { 1: 70, 2: 55, 3: 42 });
  let cells = null, box = null;
  const fresh = () => Array.from({ length: COLS * ROWS }, () => 1);
  const centerOf = (i) => ({ x: box.x + ((i % COLS) + 0.5) * (box.w / COLS), y: box.y + (Math.floor(i / COLS) + 0.5) * (box.h / ROWS) });
  G.update = function (dt, a) {
    this.track(dt, a);
    const { W, H } = stage(); box = { x: W * 0.14, y: 160, w: W * 0.72, h: H - 210 };
    if (!cells) cells = fresh();
    cells.forEach((c, i) => { if (c > 0 && near(this.cur, centerOf(i), brush)) cells[i] = Math.max(0, c - dt * 3); });
    if (cells.filter((c) => c <= 0).length >= cells.length * 0.92) { this._reps++; this.events.push("success"); if (this._reps >= goal) this.done = true; else cells = fresh(); }
  };
  const left = () => (cells ? cells.filter((c) => c > 0).length : COLS * ROWS);
  G.status = () => ({ title: spec.cue, text: `${Math.round((1 - left() / (COLS * ROWS)) * 100)}% done · ${G._reps + 1} of ${goal}` });
  G.stats = () => [[spec.unit, `${G._reps} / ${goal}`]];
  G.debug = () => { const i = cells ? cells.findIndex((c) => c > 0) : -1; return { kind: "points", targets: i >= 0 && box ? [centerOf(i)] : [], cursor: { x: G.cur.x, y: G.cur.y }, dwell: 0.4 }; };
  G.draw = function (g, W, H) {
    Game.W = W; Game.H = H; bg(g, W, H); dots(g, W, goal, this._reps);
    box = { x: W * 0.14, y: 160, w: W * 0.72, h: H - 210 };
    rr(g, box.x, box.y, box.w, box.h, 12); g.fillStyle = alpha(T["sky-top"] || T.surface, 0.9); g.fill(); g.strokeStyle = T.ink; g.lineWidth = 4; g.stroke();
    if (cells) cells.forEach((c, i) => { if (c <= 0) return; const cw = box.w / COLS, ch = box.h / ROWS; g.fillStyle = alpha(spec.dirt || "#8a7a5a", 0.25 + c * 0.45); g.fillRect(box.x + (i % COLS) * cw, box.y + Math.floor(i / COLS) * ch, cw + 0.5, ch + 0.5); });
    g.beginPath(); g.arc(this.cur.x, this.cur.y, brush * 0.7, 0, TAU); g.fillStyle = alpha(T.surface, 0.35); g.fill();
    icon(g, spec.emoji || "🧽", this.cur.x, this.cur.y, 34);
  };
  return G;
}

// Search: a torch lights up only near the pointer; find the hidden things and rest on each.
function Search(S, spec) {
  const G = pointerGame(S, S.reps), light = lvl(S, { 1: 120, 2: 95, 3: 72 }), DW = 0.6;
  let things = null, held = 0, t = 0, t0 = 0, times = [];
  function hide(W, H) { const out = []; while (out.length < S.reps) { const p = { x: rand(W * 0.1, W * 0.9), y: rand(170, H - 50), e: pick(spec.items), found: false }; if (out.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 90)) out.push(p); } return out; }
  G.update = function (dt, a) {
    this.track(dt, a); t += dt;
    if (!things) { const { W, H } = stage(); things = hide(W, H); }
    const tg = things.find((p) => !p.found && near(this.cur, p, 34));
    if (tg) { held += dt; if (held >= DW) { tg.found = true; held = 0; this._reps++; times.push(t - t0); t0 = t; this.events.push("success"); if (this._reps >= S.reps) this.done = true; } }
    else held = Math.max(0, held - dt * 2);
  };
  G.status = () => ({ title: spec.cue, text: `${G._reps} of ${S.reps} found · hold the light on one to pick it` });
  G.stats = () => [["Found", `${G._reps} / ${S.reps}`], ["Average time each", secs(times)]];
  G.debug = () => ({ kind: "points", targets: things ? things.filter((p) => !p.found).slice(0, 1) : [], cursor: { x: G.cur.x, y: G.cur.y }, dwell: DW });
  G.draw = function (g, W, H) {
    if (!things || Game.W !== W || Game.H !== H) { Game.W = W; Game.H = H; if (!things) things = hide(W, H); }
    bg(g, W, H);
    for (const p of things) icon(g, p.e, p.x, p.y, 38);
    // darkness everywhere except the torch beam and what has been found
    g.save(); g.beginPath(); g.rect(0, 140, W, H - 140); g.clip();
    g.fillStyle = alpha(T.ink, 0.9); g.beginPath(); g.rect(0, 140, W, H - 140);
    g.moveTo(this.cur.x + light, this.cur.y); g.arc(this.cur.x, this.cur.y, light, 0, TAU, true);
    for (const p of things) if (p.found) { g.moveTo(p.x + 30, p.y); g.arc(p.x, p.y, 30, 0, TAU, true); }
    g.fill("evenodd"); g.restore();
    for (const p of things) if (p.found) { g.beginPath(); g.arc(p.x, p.y, 30, 0, TAU); g.strokeStyle = T.go; g.lineWidth = 3; g.stroke(); }
    dots(g, W, S.reps, this._reps);
    const tg = things.find((p) => !p.found && near(this.cur, p, 34)); if (tg) ring(g, tg.x, tg.y, 34, held / DW);
    this.cur.draw(g);
  };
  return G;
}

// Path: steer the pointer along a line from start to end (letters, shapes). Accuracy is the share
// of time spent on the line.
const LETTERS = {
  C: [[0.7, -0.7], [0, -0.95], [-0.7, -0.6], [-0.85, 0], [-0.7, 0.6], [0, 0.95], [0.7, 0.7]],
  L: [[-0.5, -0.9], [-0.5, 0.9], [0.6, 0.9]],
  M: [[-0.8, 0.9], [-0.8, -0.9], [0, 0.2], [0.8, -0.9], [0.8, 0.9]],
  N: [[-0.6, 0.9], [-0.6, -0.9], [0.6, 0.9], [0.6, -0.9]],
  S: [[0.6, -0.75], [0, -0.95], [-0.6, -0.6], [0, -0.05], [0.6, 0.5], [0, 0.95], [-0.65, 0.7]],
  U: [[-0.6, -0.9], [-0.6, 0.4], [0, 0.95], [0.6, 0.4], [0.6, -0.9]],
  V: [[-0.7, -0.9], [0, 0.9], [0.7, -0.9]],
  W: [[-0.9, -0.9], [-0.45, 0.9], [0, -0.3], [0.45, 0.9], [0.9, -0.9]],
  Z: [[-0.6, -0.9], [0.6, -0.9], [-0.6, 0.9], [0.6, 0.9]],
  2: [[-0.6, -0.55], [0, -0.95], [0.6, -0.5], [-0.6, 0.9], [0.65, 0.9]],
  3: [[-0.6, -0.85], [0.5, -0.75], [0, -0.05], [0.55, 0.45], [0, 0.95], [-0.6, 0.8]],
  7: [[-0.6, -0.9], [0.6, -0.9], [-0.2, 0.9]],
};
const SHAPES = {
  circle: Array.from({ length: 25 }, (_, i) => [Math.cos(-Math.PI / 2 + (i / 24) * TAU) * 0.9, Math.sin(-Math.PI / 2 + (i / 24) * TAU) * 0.9]),
  zigzag: [[-0.9, 0.5], [-0.45, -0.5], [0, 0.5], [0.45, -0.5], [0.9, 0.5]],
  wave: Array.from({ length: 25 }, (_, i) => [-0.9 + (i / 24) * 1.8, Math.sin((i / 24) * TAU) * 0.6]),
  square: [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8], [-0.8, -0.8]],
  triangle: [[0, -0.9], [0.85, 0.8], [-0.85, 0.8], [0, -0.9]],
};
function Path(S, spec) {
  const goal = Math.max(1, Math.round(S.reps / 5)), G = pointerGame(S, goal), tol = lvl(S, { 1: 40, 2: 32, 3: 24 });
  let name = null, pts = [], idx = 0, onT = 0, total = 0, scores = [], W0 = 0, H0 = 0;
  const pool = () => Object.keys(spec.set === "letters" ? LETTERS : SHAPES);
  function load(W, H) {
    const src = spec.set === "letters" ? LETTERS : SHAPES, cx = W / 2, cy = (160 + H - 30) / 2, R = Math.min(W * 0.3, (H - 200) * 0.48);
    const poly = src[name].map(([x, y]) => [cx + x * R, cy + y * R]); pts = [];
    for (let i = 0; i < poly.length - 1; i++) { const [x0, y0] = poly[i], [x1, y1] = poly[i + 1], n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 12)); for (let k = 0; k < n; k++) pts.push([lerp(x0, x1, k / n), lerp(y0, y1, k / n)]); }
    pts.push(poly[poly.length - 1]);
  }
  function choose() { let n; do { n = pick(pool()); } while (n === name && pool().length > 1); name = n; idx = 0; onT = 0; total = 0; const { W, H } = stage(); load(W, H); }
  G.update = function (dt, a) {
    this.track(dt, a);
    if (!name) choose();
    total += dt;
    for (let k = idx; k < Math.min(pts.length, idx + 8); k++) if (Math.hypot(pts[k][0] - this.cur.x, pts[k][1] - this.cur.y) < tol) { idx = k + 1; break; }
    const p = pts[Math.min(idx, pts.length - 1)];
    if (Math.hypot(p[0] - this.cur.x, p[1] - this.cur.y) < tol * 1.6) onT += dt;
    if (idx >= pts.length - 1) { scores.push(Math.round((onT / Math.max(0.1, total)) * 100)); this._reps++; this.events.push("success"); if (this._reps >= goal) this.done = true; else choose(); }
  };
  G.status = () => ({ title: `${spec.cue}${name && spec.set === "letters" ? ` "${name}"` : ""}`, text: "Start at the orange dot and follow the line." });
  G.stats = () => [[spec.set === "letters" ? "Letters" : "Shapes", `${G._reps} / ${goal}`], ["Accuracy", scores.length ? `${Math.round(avg(scores))}%` : "–"]];
  G.debug = () => ({ kind: "points", targets: pts.length ? [{ x: pts[Math.min(idx + 2, pts.length - 1)][0], y: pts[Math.min(idx + 2, pts.length - 1)][1] }] : [], cursor: { x: G.cur.x, y: G.cur.y }, dwell: 0, follow: true });
  G.draw = function (g, W, H) {
    Game.W = W; Game.H = H; if (name && (W !== W0 || H !== H0)) load(W, H); W0 = W; H0 = H;
    bg(g, W, H); dots(g, W, goal, this._reps);
    if (!pts.length) return;
    g.lineCap = "round"; g.lineJoin = "round";
    g.strokeStyle = alpha(T.ink, 0.12); g.lineWidth = tol * 1.2; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    g.strokeStyle = T.go; g.lineWidth = 8; g.beginPath(); pts.slice(0, idx + 1).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.lineCap = "butt";
    const n = pts[Math.min(idx, pts.length - 1)]; g.beginPath(); g.arc(n[0], n[1], 12, 0, TAU); g.fillStyle = T.accent; g.fill();
    this.cur.draw(g);
  };
  return G;
}

RC.moves = { scene, Swing, Bursts, Hold, Track, Catch, Steer, Circles, Wave, Throw, Seq, Dial, Timed, Direction, Pop, Pick, Dots, Cover, Search, Path, icon, ring, lvl, avg, secs };
})();
