// Hand & fingers, continued: more touch work (the phone becomes the touch pad when paired) and
// hand exercises measured by the phone's motion sensors.
(() => {
"use strict";
const RC = window.RC;
const { clamp, lerp, TAU, T, alpha, txt, rr, fmtTime, Game } = RC;
const { base, bg, dots, Keypad, randInt, rand, pick, shuffle, inRect, defineArt } = RC.kit;
const M = RC.moves, { icon, ring, lvl, secs } = M;
const FINGERS = ["Index", "Middle", "Ring", "Little"];
const NINE = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
// Send the phone a new pad when an exercise changes its keys part-way through.
const repad = (layout, labels) => { if (Game.padActive) RC.sendPhone({ type: "pad", layout, labels }); };
function laneRects(W, H, n, top = 150) {
  const gap = 12, w = Math.min(160, (W * 0.7 - gap * (n - 1)) / n), x0 = W / 2 - (w * n + gap * (n - 1)) / 2;
  return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (w + gap), y: top, w, h: H - top - 30 }));
}
// Wire stage clicks, keyboard digits and the phone pad to one press(key) function.
function keys(G, press, hit) {
  G.pointer = (e) => { if (e.type === "down") { const k = hit(e.x, e.y); if (k != null) press(k); } };
  G.pad = (e) => press(String(e.key));
  G.key = (k) => { if (/^[0-9]$/.test(k)) press(k); else if (k === " " || k === "Enter") press("Tap"); };
}

// ---- Whack-a-Mole: tap the hole the mole pops out of, before it hides
function Mole(S) {
  const G = base(S, S.reps), up = lvl(S, { 1: 1.8, 2: 1.3, 3: 0.9 }), kp = Keypad({ labels: NINE });
  let hole = -1, t = 0, wait = 0.8, hits = 0, shown = 0, misses = 0, wrong = 0, rts = [], bonk = -1, bonkT = 0;
  const next = () => { hole = -1; wait = rand(0.3, 0.9); if (hits >= S.reps || shown >= S.reps * 2) G.done = true; };
  G.update = function (dt) {
    bonkT = Math.max(0, bonkT - dt);
    if (hole < 0) { wait -= dt; if (wait <= 0 && !G.done) { let h; do { h = randInt(0, 8); } while (h === bonk); hole = h; t = 0; shown++; } return; }
    t += dt; if (t >= up) { misses++; next(); }
  };
  function press(k) {
    const i = NINE.indexOf(k); if (i < 0 || hole < 0) return;
    if (i === hole) { hits++; G._reps = hits; rts.push(t); G.events.push("success"); bonk = i; bonkT = 0.25; next(); } else wrong++;
  }
  keys(G, press, (x, y) => kp.hit(x, y));
  G.padLabels = () => NINE;
  G.status = () => ({ title: "Tap the mole", text: `${hits} of ${S.reps} · it hides quickly` });
  G.stats = () => [["Moles tapped", `${hits} / ${S.reps}`], ["Missed", String(misses)], ["Wrong hole", String(wrong)], ["Reaction time", secs(rts)]];
  G.debug = () => ({ kind: "pad", key: hole >= 0 ? NINE[hole] : null });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, hits);
    const side = Math.min(W * 0.6, H - 180); kp.place({ x: W / 2 - side / 2, y: 150, w: side, h: H - 170 });
    NINE.forEach((l, i) => {
      const r = kp.rects[l]; if (!r) return; const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      g.beginPath(); g.ellipse(cx, cy + r.h * 0.18, r.w * 0.4, r.h * 0.16, 0, 0, TAU); g.fillStyle = alpha(T.ink, 0.25); g.fill();
      if (i === hole) icon(g, "🐹", cx, cy - r.h * 0.02 - Math.min(1, t * 6) * r.h * 0.06, r.h * 0.5);
      if (i === bonk && bonkT > 0) icon(g, "💥", cx, cy, r.h * 0.5);
      txt(g, l, r.x + 14, r.y + 16, 13, T.muted, { font: T.mono, weight: 600 });
    });
  };
  return G;
}

// ---- Piano Scales: play a finger pattern in order as smoothly as you can
const SCALES = { 1: [1, 2, 3, 4], 2: [1, 2, 3, 4, 4, 3, 2, 1], 3: [1, 3, 2, 4, 1, 3, 2, 4] };
function Scales(S) {
  const seq = SCALES[S.level] || SCALES[2], G = base(S, S.reps);
  let k = 0, rects = [], t = 0, t0 = 0, times = [], errors = 0, lit = -1, litT = 0;
  function press(key) {
    const i = Number(key) - 1; if (!(i >= 0 && i < 4) || G.done) return;
    lit = i; litT = 0.15;
    if (i + 1 === seq[k]) { k++; if (k >= seq.length) { G._reps++; times.push(t - t0); t0 = t; k = 0; G.events.push("success"); if (G._reps >= S.reps) G.done = true; } }
    else { errors++; G.events.push("error"); }
  }
  G.update = (dt) => { t += dt; litT = Math.max(0, litT - dt); };
  keys(G, press, (x, y) => { const i = rects.findIndex((r) => inRect(x, y, r)); return i >= 0 ? String(i + 1) : null; });
  G.padLabels = () => ["1", "2", "3", "4"];
  G.status = () => ({ title: `Play ${seq.join(" ")}`, text: `Next: ${FINGERS[seq[k] - 1]} finger · ${G._reps} of ${S.reps}` });
  G.stats = () => [["Scales played", `${G._reps} / ${S.reps}`], ["Average time per scale", secs(times)], ["Wrong notes", String(errors)]];
  G.debug = () => ({ kind: "pad", key: String(seq[k]) });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, G._reps); rects = laneRects(W, H, 4, 200);
    seq.forEach((n, i) => txt(g, String(n), W / 2 + (i - (seq.length - 1) / 2) * 34, 165, 24, i < k ? T.go : i === k ? T.accent : T.muted, { font: T.mono, weight: 700 }));
    rects.forEach((r, i) => { rr(g, r.x, r.y, r.w, r.h, 14); g.fillStyle = i === lit && litT > 0 ? T.go : i + 1 === seq[k] ? alpha(T.accent, 0.35) : T.surface; g.fill(); g.strokeStyle = alpha(T.ink, 0.15); g.lineWidth = 1.5; g.stroke(); txt(g, FINGERS[i], r.x + r.w / 2, r.y + r.h - 24, 15, T.muted, { font: T.body }); });
  };
  return G;
}

// ---- Drum Roll: alternate two fingers as fast as you can until time runs out
function DrumRoll(S) {
  const dur = S.durationS || 20, pair = { 1: [0, 1], 2: [0, 2], 3: [1, 3] }[S.level] || [0, 1], G = base(S, 1);
  let t = 0, want = 0, taps = 0, errors = 0, rects = [], flashT = 0;
  function press(key) {
    const i = Number(key) - 1; if (G.done || !(i >= 0 && i < 4)) return;
    if (i === pair[want]) { taps++; want = 1 - want; flashT = 0.1; } else errors++;
  }
  G.update = function (dt) { t += dt; flashT = Math.max(0, flashT - dt); if (t >= dur) { this._reps = 1; this.done = true; } };
  keys(G, press, (x, y) => { const i = rects.findIndex((r) => inRect(x, y, r)); return i >= 0 ? String(i + 1) : null; });
  G.padLabels = () => ["1", "2", "3", "4"];
  G.status = () => ({ title: `Alternate ${FINGERS[pair[0]].toLowerCase()} and ${FINGERS[pair[1]].toLowerCase()}`, text: `${fmtTime(Math.max(0, dur - t))} left · ${taps} taps` });
  G.stats = () => [["Taps", String(taps)], ["Taps per second", (taps / Math.max(1, Math.min(t, dur))).toFixed(1)], ["Wrong finger", String(errors)]];
  G.debug = () => ({ kind: "pad", key: String(pair[want] + 1) });
  G.draw = function (g, W, H) {
    bg(g, W, H); rects = laneRects(W, H, 4);
    rects.forEach((r, i) => { const on = i === pair[want], used = pair.includes(i); rr(g, r.x, r.y, r.w, r.h, 18); g.fillStyle = on ? (flashT > 0 ? T.go : T.accent) : used ? alpha(T.accent, 0.2) : alpha(T.ink, 0.05); g.fill(); txt(g, FINGERS[i], r.x + r.w / 2, r.y + r.h - 28, 16, on ? T.surface : T.muted, { font: T.body }); });
    icon(g, "🥁", W / 2, 130, 30);
    g.strokeStyle = T.go; g.lineWidth = 8; g.lineCap = "round"; g.beginPath(); g.moveTo(W * 0.2, 130); g.lineTo(lerp(W * 0.2, W * 0.8, clamp(1 - t / dur, 0, 1)), 130); g.stroke(); g.lineCap = "butt";
  };
  return G;
}

// ---- Tap the Beat: tap in time with a steady beat (rhythmic cueing)
function Beat(S) {
  const bpm = lvl(S, { 1: 50, 2: 70, 3: 90 }), gap = 60 / bpm, win = Math.min(0.3, gap * 0.4), n = S.reps, G = base(S, n);
  const beats = Array.from({ length: n }, (_, i) => ({ t: 2 + i * gap, hit: null, err: null }));
  let t = 0, btn = { x: 0, y: 0, w: 0, h: 0 }, pulse = 0, extra = 0, ticked = -1;
  function press() {
    if (G.done) return;
    pulse = 1;
    const b = beats.find((x) => x.hit === null && Math.abs(x.t - t) <= win);
    if (b) { b.hit = true; b.err = t - b.t; G._reps++; G.events.push("success"); } else extra++;
  }
  G.update = function (dt) {
    t += dt; pulse = Math.max(0, pulse - dt * 4);
    const i = beats.findIndex((x) => x.t > t - dt && x.t <= t); if (i >= 0 && i !== ticked) { ticked = i; this.events.push("tick"); }
    for (const b of beats) if (b.hit === null && t - b.t > win) b.hit = false;
    if (beats.every((b) => b.hit !== null)) this.done = true;
  };
  G.pointer = (e) => { if (e.type === "down" && inRect(e.x, e.y, btn)) press(); };
  G.pad = () => press();
  G.key = (k) => { if (k === " " || k === "Enter") press(); };
  G.padLabels = () => ["Tap"];
  const errs = () => beats.filter((b) => b.hit).map((b) => Math.abs(b.err) * 1000);
  G.status = () => ({ title: t < 2 ? "Get ready: tap on every beat" : "Tap with the beat", text: `${bpm} beats a minute · ${G._reps} on time` });
  G.stats = () => [["On the beat", `${G._reps} / ${n}`], ["Average timing error", errs().length ? `${Math.round(M.avg(errs()))} ms` : "–"], ["Extra taps", String(extra)]];
  G.debug = () => { const b = beats.find((x) => x.hit === null); return { kind: "pad", key: b && Math.abs(b.t - t) < 0.04 ? "Tap" : null }; };
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, Math.min(n, 32), Math.round((beats.filter((b) => b.hit !== null).length / n) * Math.min(n, 32)));
    const cx = W / 2, cy = H * 0.5, phase = t < 2 ? 0 : ((t - 2) % gap) / gap, beatGlow = Math.max(0, 1 - phase * 4);
    g.beginPath(); g.arc(cx, cy, 60 + beatGlow * 30, 0, TAU); g.fillStyle = alpha(T.accent, 0.15 + beatGlow * 0.4); g.fill();
    icon(g, "🎵", cx, cy, 48);
    btn.w = Math.min(320, W * 0.4); btn.h = 80; btn.x = cx - btn.w / 2; btn.y = H - 130;
    rr(g, btn.x - pulse * 5, btn.y - pulse * 5, btn.w + pulse * 10, btn.h + pulse * 10, 20); g.fillStyle = T.go; g.fill();
    txt(g, "Tap", cx, btn.y + btn.h / 2, 28, T.surface, { font: T.body });
  };
  return G;
}

// ---- Number Hunt: the keys are shuffled; tap 1 to 9 in order
function NumberHunt(S) {
  const G = base(S, S.reps);
  let order = shuffle(NINE), kp = Keypad({ labels: order }), k = 1, t = 0, t0 = 0, times = [], errors = 0, lit = null, litT = 0;
  function press(key) {
    if (G.done || !NINE.includes(key)) return;
    lit = key; litT = 0.15;
    if (Number(key) === k) { k++; if (k > 9) { G._reps++; times.push(t - t0); t0 = t; G.events.push("success"); if (G._reps >= S.reps) G.done = true; else { k = 1; order = shuffle(NINE); kp = Keypad({ labels: order }); repad("keys", order); } } }
    else { errors++; G.events.push("error"); }
  }
  G.update = (dt) => { t += dt; litT = Math.max(0, litT - dt); };
  keys(G, press, (x, y) => kp.hit(x, y));
  G.padLabels = () => order;
  G.status = () => ({ title: `Find ${Math.min(9, k)}`, text: `Tap 1 to 9 in order · round ${G._reps + 1} of ${S.reps}` });
  G.stats = () => [["Rounds", `${G._reps} / ${S.reps}`], ["Average time per round", secs(times)], ["Wrong keys", String(errors)]];
  G.debug = () => ({ kind: "pad", key: k <= 9 ? String(k) : null });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, G._reps);
    const side = Math.min(W * 0.55, H - 180); kp.place({ x: W / 2 - side / 2, y: 150, w: side, h: H - 170 });
    kp.draw(g, litT > 0 ? lit : null);
    order.forEach((l) => { if (Number(l) < k) { const r = kp.rects[l]; g.fillStyle = alpha(T.go, 0.25); rr(g, r.x, r.y, r.w, r.h, 14); g.fill(); } });
  };
  return G;
}

// ---- Type the Word: type a short word on a letter pad
const WORDS = { 1: ["CAT", "SUN", "CUP", "HAT", "MAP", "BED", "PEN", "BUS", "JAM", "DOG"], 2: ["LAMP", "FISH", "BOOK", "MILK", "DOOR", "CAKE", "RING", "SOCK", "COAT", "BELL"], 3: ["CHAIR", "PLANT", "BREAD", "GLASS", "PHONE", "CLOCK", "WATER", "TRAIN", "HOUSE", "SPOON"] };
function TypeWord(S) {
  const pool = shuffle(WORDS[S.level] || WORDS[2]), G = base(S, S.reps);
  let word = "", typed = "", labels = [], kp = null, right = 0, errors = 0, fb = null, fbT = 0, lit = null, litT = 0;
  function load() {
    word = pool[G._reps % pool.length]; typed = "";
    const letters = [...new Set(word.split(""))];
    while (letters.length < 10) { const c = String.fromCharCode(65 + randInt(0, 25)); if (!letters.includes(c)) letters.push(c); }
    labels = shuffle(letters).concat(["←", "OK"]); kp = Keypad({ labels }); repad("keys", labels);
  }
  load();
  function submit() { const ok = typed === word; if (ok) right++; fb = ok; fbT = 1; G._reps++; G.events.push(ok ? "success" : "error"); }
  function press(key) {
    if (G.done || fbT > 0 || !labels.includes(key)) return;
    lit = key; litT = 0.15;
    if (key === "←") typed = typed.slice(0, -1);
    else if (key === "OK") submit();
    else { typed += key; if (typed.length >= word.length) submit(); }
    if (typed.length && !word.startsWith(typed)) errors++;
  }
  G.update = function (dt) { litT = Math.max(0, litT - dt); if (fbT > 0) { fbT -= dt; if (fbT <= 0) { if (G._reps >= S.reps) G.done = true; else load(); } } };
  keys(G, press, (x, y) => kp.hit(x, y));
  G.padLabels = () => labels;
  G.status = () => (fbT > 0 ? { title: fb ? "Spelled right" : "Not quite", text: `The word was ${word}`, tone: fb ? "good" : "warn" } : { title: `Type ${word}`, text: `${G._reps + 1} of ${S.reps} · ← fixes a mistake` });
  G.stats = () => [["Words right", `${right} / ${G._reps}`], ["Wrong letters", String(errors)]];
  G.debug = () => ({ kind: "pad", key: fbT > 0 ? null : word.startsWith(typed) ? word[typed.length] : "←" });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, G._reps);
    const wide = W > 720, cx = wide ? W * 0.28 : W / 2;
    txt(g, word, cx, wide ? H * 0.4 : 180, 48, T.ink, { font: T.body });
    const shown = word.split("").map((c, i) => typed[i] || "_").join(" ");
    txt(g, shown, cx, (wide ? H * 0.4 : 180) + 70, 34, T.accent, { font: T.mono, weight: 600 });
    kp.place(wide ? { x: W * 0.52, y: 140, w: W * 0.42, h: H - 160 } : { x: W / 2 - 170, y: 290, w: 340, h: H - 300 }); kp.draw(g, litT > 0 ? lit : null);
  };
  return G;
}

// ---- Count the Taps: tap exactly the number shown
function TapCount(S) {
  const range = { 1: [2, 5], 2: [3, 7], 3: [4, 9] }[S.level] || [3, 7], G = base(S, S.reps);
  let n = randInt(...range), taps = 0, since = 0, right = 0, fb = null, fbT = 0, btn = { x: 0, y: 0, w: 0, h: 0 }, pulse = 0;
  function press() { if (G.done || fbT > 0) return; taps++; since = 0; pulse = 1; G.events.push("tick"); }
  G.update = function (dt) {
    pulse = Math.max(0, pulse - dt * 4);
    if (fbT > 0) { fbT -= dt; if (fbT <= 0) { if (G._reps >= S.reps) G.done = true; else { let m; do { m = randInt(...range); } while (m === n); n = m; taps = 0; } } return; }
    if (taps > 0) { since += dt; if (since >= 1.3) { const ok = taps === n; if (ok) right++; fb = ok; fbT = 1.2; G._reps++; G.events.push(ok ? "success" : "error"); } }
  };
  G.pointer = (e) => { if (e.type === "down" && inRect(e.x, e.y, btn)) press(); };
  G.pad = () => press();
  G.key = (k) => { if (k === " " || k === "Enter") press(); };
  G.padLabels = () => ["Tap"];
  G.status = () => (fbT > 0 ? { title: fb ? "Exactly right" : `You tapped ${taps}`, text: `The number was ${n}`, tone: fb ? "good" : "warn" } : { title: `Tap ${n} times`, text: taps ? `${taps} so far · stop and wait to finish` : `${G._reps + 1} of ${S.reps}` });
  G.stats = () => [["Exactly right", `${right} / ${G._reps}`]];
  G.debug = () => ({ kind: "pad", key: fbT <= 0 && taps < n ? "Tap" : null });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, G._reps);
    const cx = W / 2;
    txt(g, String(n), cx, H * 0.36, 96, T.ink, { font: T.body });
    for (let i = 0; i < n; i++) { g.beginPath(); g.arc(cx + (i - (n - 1) / 2) * 34, H * 0.36 + 80, 11, 0, TAU); g.fillStyle = i < taps ? T.go : alpha(T.ink, 0.12); g.fill(); }
    btn.w = Math.min(320, W * 0.4); btn.h = 84; btn.x = cx - btn.w / 2; btn.y = H - 130;
    rr(g, btn.x - pulse * 5, btn.y - pulse * 5, btn.w + pulse * 10, btn.h + pulse * 10, 20); g.fillStyle = T.go; g.fill();
    txt(g, "Tap", cx, btn.y + btn.h / 2, 28, T.surface, { font: T.body });
  };
  return G;
}

// ---- Peg Board: drag each peg into a hole, as quickly as you can (like the nine-hole peg test)
function PegBoard(S) {
  const n = S.reps, snap = lvl(S, { 1: 34, 2: 26, 3: 20 }), G = base(S, n);
  let pegs = null, holes = [], drag = null, t = 0, misses = 0, W0 = 0, H0 = 0;
  function layout(W, H) {
    const cols = 3, rows = Math.ceil(n / cols), gx = Math.min(90, (W * 0.36) / cols), x0 = W * 0.62, y0 = 170 + ((H - 200) - rows * gx) / 2;
    holes = Array.from({ length: n }, (_, i) => ({ x: x0 + (i % cols) * gx + gx / 2, y: y0 + Math.floor(i / cols) * gx + gx / 2, peg: holes[i] ? holes[i].peg : false }));
    if (!pegs) pegs = Array.from({ length: n }, (_, i) => ({ x: W * 0.12 + (i % 3) * 56 + rand(-8, 8), y: 190 + Math.floor(i / 3) * 56 + rand(-8, 8), placed: false }));
  }
  G.update = (dt) => { if (!G.done && pegs) t += dt; };
  G.pointer = (e) => {
    if (!pegs) return;
    if (e.type === "down") { const i = pegs.findIndex((p) => !p.placed && Math.hypot(p.x - e.x, p.y - e.y) < 26); if (i >= 0) drag = { i, ox: e.x - pegs[i].x, oy: e.y - pegs[i].y, sx: pegs[i].x, sy: pegs[i].y }; }
    else if (e.type === "move" && drag) { pegs[drag.i].x = e.x - drag.ox; pegs[drag.i].y = e.y - drag.oy; }
    else if (e.type === "up" && drag) {
      const p = pegs[drag.i], h = holes.find((q) => !q.peg && Math.hypot(q.x - p.x, q.y - p.y) <= snap);
      if (h) { h.peg = true; p.placed = true; p.x = h.x; p.y = h.y; G._reps++; G.events.push("tick"); if (G._reps >= n) { G.events.push("success"); G.done = true; } }
      else { misses++; p.x = drag.sx; p.y = drag.sy; }
      drag = null;
    }
  };
  G.status = () => ({ title: "Drag each peg into a hole", text: `${G._reps} of ${n} · ${fmtTime(t)}` });
  G.stats = () => [["Pegs placed", `${G._reps} / ${n}`], ["Time", fmtTime(t)], ["Missed the hole", String(misses)]];
  G.debug = () => { const p = pegs && pegs.find((q) => !q.placed), h = holes.find((q) => !q.peg); return { kind: "drag", from: p ? { x: p.x, y: p.y } : null, to: h ? { x: h.x, y: h.y } : null }; };
  G.draw = function (g, W, H) {
    if (W !== W0 || H !== H0) { W0 = W; H0 = H; layout(W, H); }
    bg(g, W, H); dots(g, W, n, G._reps);
    rr(g, W * 0.58, 150, W * 0.38, H - 180, 18); g.fillStyle = alpha(T.ink, 0.06); g.fill();
    for (const h of holes) { g.beginPath(); g.arc(h.x, h.y, 16, 0, TAU); g.fillStyle = alpha(T.ink, 0.3); g.fill(); }
    pegs.forEach((p, i) => { g.beginPath(); g.arc(p.x, p.y, 14, 0, TAU); g.fillStyle = p.placed ? T.go : drag && drag.i === i ? T.go : T.accent; g.fill(); g.beginPath(); g.arc(p.x - 4, p.y - 4, 4, 0, TAU); g.fillStyle = alpha(T.surface, 0.5); g.fill(); });
  };
  return G;
}

const touch = { control: "touch", mount: "" };
const rounds = (r, d) => ({ params: { reps: r, level: [1, 2, 3], durationS: null }, defaults: { reps: d, level: 1, durationS: null } });
[
  Object.assign({ id: "mole", name: "Whack-a-Mole", movement: "Finger reach · reaction", pad: "keys",
    desc: "Tap the hole the mole pops out of before it hides again.", source: "Finger-tapping reaction games used in hand rehab apps; Reha@Stroke touch exercises.",
    how: ["Rest your affected hand by the screen or the phone.", "When a mole pops up, tap that hole.", "Higher levels hide it faster."], make: Mole }, touch, rounds([10, 15, 25], 10)),
  Object.assign({ id: "scales", name: "Piano Scales", movement: "Finger sequencing · individuation", pad: "fingers",
    desc: "Play a finger pattern in order, like practising scales on a piano.", source: "Finger sequencing practice (MusicGlove-style finger tasks; piano training after stroke).",
    how: ["Put one finger over each lane.", "Tap the numbers shown, in order: 1 is your index finger.", "Level 2 goes up and back; level 3 skips around."], make: Scales }, touch, rounds([3, 5, 8], 3)),
  Object.assign({ id: "drum", name: "Drum Roll", movement: "Alternating finger taps · speed", pad: "fingers",
    desc: "Alternate two fingers as fast as you can until the time runs out.", source: "Alternating finger tapping (a standard measure of hand dexterity after stroke).",
    params: { reps: null, level: [1, 2, 3], durationS: [20, 30, 60] }, defaults: { reps: null, level: 1, durationS: 20 },
    how: ["Put your fingers over the lit lanes.", "Tap one, then the other, back and forth.", "Level 2 and 3 use fingers further apart."], make: DrumRoll }, touch),
  Object.assign({ id: "beat", name: "Tap the Beat", movement: "Timing · rhythmic cueing", pad: "done",
    desc: "Tap exactly in time with a steady beat.", source: "Rhythmic auditory cueing (metronome-paced movement) used in stroke motor training.",
    how: ["Turn the sound on.", "Listen to the beat for a moment.", "Tap the button exactly on each beat."], make: Beat }, touch, rounds([16, 24, 32], 16)),
  Object.assign({ id: "numhunt", name: "Number Hunt", movement: "Finger reach · visual search", pad: "keys",
    desc: "The keys are shuffled. Tap 1 to 9 in order as quickly as you can.", source: "Number-sequence tapping, a touch version of Trail Making A.",
    how: ["Find the 1 and tap it.", "Then 2, 3, and on to 9.", "The keys shuffle for every round."], make: NumberHunt }, touch, rounds([2, 3, 5], 2)),
  Object.assign({ id: "typeword", name: "Type the Word", movement: "Finger accuracy · spelling", pad: "keys",
    desc: "Type a short word on a letter pad.", source: "Typing practice for hand function and literacy (mRehab-style phone tasks).",
    how: ["Read the word.", "Tap its letters in order with your affected hand.", "Use ← to fix a mistake."], make: TypeWord }, touch, rounds([3, 5, 8], 3)),
  Object.assign({ id: "tapcount", name: "Count the Taps", movement: "Controlled tapping · counting", pad: "done",
    desc: "Tap exactly the number of times shown, then stop.", source: "Graded finger tapping with counting (dual-task hand practice).",
    how: ["Read the number.", "Tap that many times at your own pace.", "Stop and wait; it checks your count."], make: TapCount }, touch, rounds([5, 8, 10], 5)),
  Object.assign({ id: "pegboard", name: "Peg Board", movement: "Pinch and place · speed",
    desc: "Drag each peg into a hole as quickly as you can. Higher levels need more precise drops.", source: "Nine-Hole Peg Test (a standard measure of finger dexterity).",
    how: ["Use your affected hand on the touchscreen or trackpad.", "Press on a peg and drag it to a hole.", "Let go over the hole. Fill them all."], make: PegBoard }, touch, rounds([6, 9, 12], 9)),
  { id: "shake", name: "Shake the Bottle", movement: "Grip · forearm endurance", control: "accel", mount: "Hold the phone firmly in your affected hand, like a bottle. Use a wrist strap if you have one.",
    desc: "Shake the bottle up and down to mix it. Every shake counts.", source: "Repetitive grip-and-shake task practice (FitMi-style speed exercises).",
    params: { reps: [20, 30, 40], level: [1, 2, 3], durationS: null }, defaults: { reps: 20, level: 1, durationS: null },
    how: ["Hold the phone tightly.", "Shake it up and down in short movements.", "Keep going until the bottle is mixed."], make: (S) => M.Bursts(S, { thr: { 1: 2, 2: 2.5, 3: 3 }, gap: 0.12, cues: ["Shake, shake, shake"], pics: ["🧴"] }) },
  { id: "pinchhold", name: "Pinch & Hold", movement: "Pinch grip · steadiness", control: "tilt", mount: "Pinch the phone between your thumb and fingers, screen up, forearm on the table.",
    desc: "Hold the phone level in a pinch grip for the whole count.", source: "Sustained pinch with stability (Fugl-Meyer grasp items; grip-control training).",
    params: { reps: [3, 5, 8], level: [1, 2, 3], durationS: null }, defaults: { reps: 3, level: 1, durationS: null },
    how: ["Pinch the phone, keeping it level.", "Hold it steady until the bar fills.", "Rest your hand, then pinch again."],
    make: (S) => M.Hold(S, { signal: (a) => Math.hypot(a.pitch, a.roll), band: (S) => [0, lvl(S, { 1: 10, 2: 7, 3: 5 })], holdS: (S) => lvl(S, { 1: 5, 2: 8, 3: 12 }), breakS: 2, emoji: "🤏", cues: { in: "Steady. Keep it level.", above: "Level it out", below: "Level it out", rest: "Relax your fingers" } }) },
].forEach((d) => RC.register(Object.assign({ section: "hand" }, d)));

defineArt("mole", Array.from({ length: 9 }, (_, i) => `<ellipse cx="${38 + (i % 3) * 22}" cy="${14 + Math.floor(i / 3) * 18}" rx="8" ry="3.5" fill="var(--a-mute)" opacity=".35"/>`).join("") + '<circle cx="60" cy="27" r="6" fill="var(--a-hi)"/>');
defineArt("scales", [0, 1, 2, 3].map((i) => `<rect x="${30 + i * 16}" y="${40 - i * 8}" width="12" height="${14 + i * 8}" rx="3" fill="var(--a-hi)" opacity="${0.4 + i * 0.2}"/>`).join(""));
defineArt("drum", '<ellipse cx="60" cy="38" rx="26" ry="9" fill="var(--a-mute)" opacity=".3"/><path d="M40 14 L56 34 M80 14 L64 34" stroke="var(--a-hi)" stroke-width="4" stroke-linecap="round"/>');
defineArt("beat", '<circle cx="60" cy="32" r="20" fill="var(--a-hi)" opacity=".25"/><circle cx="60" cy="32" r="10" fill="var(--a-hi)"/><path d="M22 32 h8 M90 32 h8" stroke="var(--a-mute)" stroke-width="3" stroke-linecap="round"/>');
defineArt("numhunt", ["7", "2", "9", "4", "1", "6"].map((n, i) => `<text x="${40 + (i % 3) * 20}" y="${24 + Math.floor(i / 3) * 22}" font-size="14" text-anchor="middle" fill="${n === "1" ? "var(--a-hi)" : "var(--a-ink)"}" font-weight="700">${n}</text>`).join(""));
defineArt("typeword", '<rect x="26" y="12" width="68" height="16" rx="4" fill="var(--a-mute)" opacity=".2"/><text x="60" y="25" font-size="12" text-anchor="middle" fill="var(--a-ink)" font-weight="700">C A T</text>' + [0, 1, 2, 3].map((i) => `<rect x="${32 + i * 15}" y="36" width="11" height="11" rx="3" fill="var(--a-hi)" opacity="${i === 1 ? 1 : 0.35}"/>`).join(""));
defineArt("tapcount", '<text x="60" y="30" font-size="22" text-anchor="middle" fill="var(--a-ink)" font-weight="700">4</text>' + [0, 1, 2, 3].map((i) => `<circle cx="${42 + i * 12}" cy="46" r="4" fill="var(--a-hi)" opacity="${i < 3 ? 1 : 0.3}"/>`).join(""));
defineArt("pegboard", Array.from({ length: 9 }, (_, i) => `<circle cx="${70 + (i % 3) * 12}" cy="${18 + Math.floor(i / 3) * 12}" r="4" fill="${i < 4 ? "var(--a-go)" : "var(--a-mute)"}" opacity="${i < 4 ? 1 : 0.35}"/>`).join("") + '<circle cx="34" cy="30" r="5" fill="var(--a-hi)"/><circle cx="44" cy="42" r="5" fill="var(--a-hi)"/>');
defineArt("shake", '<rect x="52" y="14" width="16" height="36" rx="5" fill="var(--a-hi)"/><rect x="56" y="8" width="8" height="8" rx="2" fill="var(--a-ink)"/><path d="M40 20 v24 M80 20 v24" stroke="var(--a-mute)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 4"/>');
defineArt("pinchhold", '<rect x="40" y="28" width="40" height="8" rx="3" fill="var(--a-hi)"/><path d="M36 20 q4 8 8 8 M84 44 q-4 -8 -8 -8" stroke="var(--a-ink)" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M24 50 H96" stroke="var(--a-go)" stroke-width="1.5" stroke-dasharray="3 4"/>');
})();
