// Attention and processing speed: reaction time, response inhibition, vigilance, divided attention
// and the trail-making connect-the-dots task.
(() => {
"use strict";
const RC = window.RC;
const { clamp, lerp, TAU, T, alpha, txt, rr, fmtTime } = RC;
const { base, bg, dots, Cursor, rand, randInt, pick, shuffle, inRect, defineArt } = RC.kit;
const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

// One big round "button" in the middle of the stage, used by the reaction-style tasks.
function centerRect(W, H, s = 0.26) { const r = Math.min(W, H - 150) * s; return { x: W / 2 - r, y: 150 + (H - 150) / 2 - r, w: r * 2, h: r * 2 }; }

// ---- Quick Catch: tap the shape as soon as it appears
function QuickCatch(S) {
  const rounds = S.reps || 10, G = base(S, rounds);
  let t = 0, showAt = rand(1, 3), shown = false, rect = { x: 0, y: 0, w: 0, h: 0 }, times = [], early = 0, fbT = 0, last = 0;
  function respond() {
    if (fbT > 0) return;
    if (!shown) { early++; showAt = t + rand(1.2, 3); G.events.push("error"); return; }
    last = t - showAt; times.push(last); shown = false; fbT = 0.7; G._reps++; G.events.push("success");
  }
  G.update = function (dt) {
    t += dt;
    if (fbT > 0) { fbT -= dt; if (fbT <= 0) { if (G._reps >= rounds) G.done = true; else showAt = t + rand(1, 3); } return; }
    if (!shown && t >= showAt) shown = true;
  };
  G.pointer = (e) => { if (e.type === "down") respond(); };
  G.key = () => respond(); G.pad = () => respond(); G.padLabels = () => ["Tap"];
  G.status = () => (fbT > 0 ? { title: `${Math.round(last * 1000)} ms`, text: "Get ready for the next one.", tone: "good" } : shown ? { title: "Tap now", text: "" } : { title: "Wait for the circle", text: "Tap the moment it appears." });
  G.stats = () => [["Average reaction", times.length ? `${Math.round(avg(times) * 1000)} ms` : "–"], ["Fastest", times.length ? `${Math.round(Math.min(...times) * 1000)} ms` : "–"], ["Too early", String(early)]];
  G.debug = () => ({ shown, rect });
  G.draw = function (g, W, H) {
    bg(g, W, H, true); dots(g, W, rounds, G._reps); rect = centerRect(W, H);
    g.beginPath(); g.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w / 2, 0, TAU); g.fillStyle = shown ? T.accent : alpha(T.ink, 0.05); g.fill();
  };
  return G;
}

// ---- Go / No-Go: tap on green, hold back on red
function GoNoGo(S) {
  const trials = S.reps || 20, pNo = { 1: 0.25, 2: 0.3, 3: 0.35 }[S.level] || 0.3, G = base(S, trials);
  let t = 0, cur = null, phase = "gap", phaseT = 0.8, goHit = 0, goMiss = 0, noHold = 0, noTap = 0, rect = { x: 0, y: 0, w: 0, h: 0 }, fb = null;
  function respond() {
    if (phase !== "show" || cur.tapped) return;
    cur.tapped = true; if (cur.go) { goHit++; fb = "good"; G.events.push("success"); } else { noTap++; fb = "bad"; G.events.push("error"); }
    phase = "fb"; phaseT = 0.5;
  }
  G.update = function (dt) {
    t += dt; phaseT -= dt;
    if (phaseT > 0) return;
    if (phase === "gap") { cur = { go: Math.random() > pNo, tapped: false }; phase = "show"; phaseT = { 1: 1.4, 2: 1.1, 3: 0.9 }[S.level] || 1.1; fb = null; }
    else if (phase === "show" || phase === "fb") {
      if (phase === "show") { if (cur.go) { goMiss++; fb = "slow"; } else { noHold++; fb = "held"; G.events.push("success"); } }
      G._reps++; if (G._reps >= trials) { G.done = true; return; }
      phase = "gap"; phaseT = rand(0.5, 1.0);
    }
  };
  G.pointer = (e) => { if (e.type === "down") respond(); };
  G.key = () => respond(); G.pad = () => respond(); G.padLabels = () => ["Tap"];
  G.status = () => ({ title: "Tap on green. Hold back on orange.", text: `${G._reps} of ${trials}` });
  G.stats = () => [["Green tapped", `${goHit} / ${goHit + goMiss}`], ["Red held back", `${noHold} / ${noHold + noTap}`]];
  G.debug = () => ({ phase, go: cur && cur.go, rect });
  G.draw = function (g, W, H) {
    bg(g, W, H, true); dots(g, W, trials, G._reps); rect = centerRect(W, H);
    const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
    g.beginPath(); g.arc(cx, cy, rect.w / 2, 0, TAU);
    g.fillStyle = phase === "show" || phase === "fb" ? (cur.go ? T.go : T.accent) : alpha(T.ink, 0.05); g.fill();
    if (phase === "show" || phase === "fb") txt(g, cur.go ? "Tap" : "Wait", cx, cy, Math.min(48, rect.w / 4), T.surface, { font: T.body });
  };
  return G;
}

// ---- Night Watch: a slow stream of shapes; tap only when the rare star appears
function NightWatch(S) {
  const dur = S.durationS || 60, G = base(S, 1);
  let t = 0, next = 1, item = null, hits = 0, misses = 0, falseTaps = 0, stars = 0;
  function respond() { if (!item) { falseTaps++; return; } if (item.star && !item.tapped) { item.tapped = true; hits++; G.events.push("success"); } else if (!item.star) { falseTaps++; G.events.push("error"); } }
  G.update = function (dt) {
    t += dt;
    if (item && t > item.until) { if (item.star && !item.tapped) misses++; item = null; }
    if (!item && t >= next) { const isStar = Math.random() < 0.15; if (isStar) stars++; item = { star: isStar, kind: pick(["circle", "square", "triangle"]), until: t + 1.0, tapped: false }; next = t + rand(1.4, 2.4); }
    if (t >= dur) { G._reps = 1; G.done = true; }
  };
  G.pointer = (e) => { if (e.type === "down") respond(); };
  G.key = () => respond(); G.pad = () => respond(); G.padLabels = () => ["Star"];
  G.status = () => ({ title: "Tap only when you see a star", text: `${fmtTime(Math.max(0, dur - t))} left` });
  G.stats = () => [["Stars caught", `${hits} / ${stars}`], ["Taps on other shapes", String(falseTaps)]];
  G.draw = function (g, W, H) {
    bg(g, W, H, true);
    const r = centerRect(W, H, 0.16), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    if (item) {
      g.fillStyle = item.star ? T.accent : alpha(T.ink, 0.4); g.beginPath();
      if (item.star) { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r.w * 0.22 : r.w / 2; g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } }
      else if (item.kind === "circle") g.arc(cx, cy, r.w * 0.4, 0, TAU);
      else if (item.kind === "square") g.rect(cx - r.w * 0.35, cy - r.w * 0.35, r.w * 0.7, r.w * 0.7);
      else { g.moveTo(cx, cy - r.w * 0.42); g.lineTo(cx + r.w * 0.4, cy + r.w * 0.3); g.lineTo(cx - r.w * 0.4, cy + r.w * 0.3); }
      g.closePath(); g.fill();
    }
    g.strokeStyle = T.go; g.lineWidth = 8; g.lineCap = "round"; g.beginPath(); g.moveTo(W * 0.2, 130); g.lineTo(lerp(W * 0.2, W * 0.8, clamp(1 - t / dur, 0, 1)), 130); g.stroke(); g.lineCap = "butt";
  };
  return G;
}

// ---- Two at Once: tap even numbers on the left while switching off the lamp on the right
function TwoAtOnce(S) {
  const dur = S.durationS || 60, G = base(S, 1);
  let t = 0, num = null, numNext = 1, lamp = false, lampAt = rand(2, 5), lampOn = 0, numRight = 0, numAll = 0, lampRight = 0, lampAll = 0, numFalse = 0, W0 = 800;
  G.update = function (dt) {
    t += dt;
    if (num && t > num.until) { if (num.v % 2 === 0 && !num.tapped) numAll++; num = null; }
    if (!num && t >= numNext) { num = { v: randInt(1, 19), until: t + 1.3, tapped: false }; numNext = t + 1.8; }
    if (!lamp && t >= lampAt) { lamp = true; lampOn = t; lampAll++; }
    if (lamp && t - lampOn > 2.5) { lamp = false; lampAt = t + rand(2, 5); }
    if (t >= dur) { G._reps = 1; G.done = true; }
  };
  function tapLeft() { if (!num || num.tapped) { numFalse++; return; } num.tapped = true; if (num.v % 2 === 0) { numRight++; numAll++; G.events.push("tick"); } else numFalse++; }
  function tapRight() { if (lamp) { lamp = false; lampRight++; lampAt = t + rand(2, 5); G.events.push("tick"); } }
  G.pointer = (e) => { if (e.type === "down") (e.x < W0 / 2 ? tapLeft : tapRight)(); };
  G.pad = (e) => (e.key === "Even" ? tapLeft : tapRight)(); G.padLabels = () => ["Even", "Lamp"];
  G.status = () => ({ title: "Left: tap even numbers · Right: switch off the lamp", text: `${fmtTime(Math.max(0, dur - t))} left` });
  G.stats = () => [["Even numbers caught", `${numRight} / ${numAll}`], ["Lamps switched off", `${lampRight} / ${lampAll}`], ["Extra taps", String(numFalse)]];
  G.draw = function (g, W, H) {
    W0 = W; bg(g, W, H, true);
    const cy = 150 + (H - 150) / 2;
    rr(g, 24, 150, W / 2 - 36, H - 180, 20); g.fillStyle = alpha(T.surface, 0.8); g.fill();
    rr(g, W / 2 + 12, 150, W / 2 - 36, H - 180, 20); g.fill();
    if (num) txt(g, String(num.v), W / 4, cy, Math.min(120, W / 8), num.tapped ? T.go : T.ink, { font: T.body });
    g.beginPath(); g.arc(W * 0.75, cy, Math.min(80, W / 10), 0, TAU); g.fillStyle = lamp ? T.accent : alpha(T.ink, 0.08); g.fill();
    txt(g, "Even numbers", W / 4, H - 52, 15, T.muted, { font: T.body, weight: 400 }); txt(g, "Lamp", W * 0.75, H - 52, 15, T.muted, { font: T.body, weight: 400 });
  };
  return G;
}

// ---- Trail Connect: tap the circles in order (1→2→3…, or 1→A→2→B… on level 3)
function TrailConnect(S) {
  const boards = S.reps || 1, G = base(S, boards), cur = Cursor({ amp: S.amp });
  let labels = [], pts = [], step = 0, errors = 0, t = 0, A = { x: 0, y: 0, w: 1, h: 1 }, flash = -1, flashT = 0;
  function newBoard() {
    if (S.level === 3) { labels = []; for (let i = 0; i < 6; i++) labels.push(String(i + 1), "ABCDEF"[i]); }
    else labels = Array.from({ length: S.level === 1 ? 8 : 12 }, (_, i) => String(i + 1));
    pts = []; for (let k = 0; pts.length < labels.length && k < 5000; k++) { const p = { fx: rand(0.06, 0.94), fy: rand(0.08, 0.92) }; if (pts.every((q) => Math.hypot(q.fx - p.fx, (q.fy - p.fy) * 0.6) > 0.13)) pts.push(p); }
    step = 0;
  }
  newBoard();
  const pos = (i) => ({ x: A.x + pts[i].fx * A.w, y: A.y + pts[i].fy * A.h });
  function tapIndex(i) {
    if (i === step) { step++; G.events.push("tick"); if (step >= labels.length) { G._reps++; G.events.push("success"); if (G._reps >= boards) G.done = true; else newBoard(); } }
    else if (i > step) { errors++; flash = i; flashT = 0.5; G.events.push("error"); }
  }
  G.update = function (dt, a) {
    t += dt; flashT = Math.max(0, flashT - dt);
    cur.update(dt, a, A.w + A.x * 2, A.y + A.h + 40);
    const i = cur.dwell(dt, pts.map((_, k) => { const p = pos(k); return { x: p.x - 28, y: p.y - 28, w: 56, h: 56 }; }));
    if (i >= 0) tapIndex(i);
  };
  G.pointer = (e) => { if (e.type !== "down") return; const i = pts.findIndex((_, k) => { const p = pos(k); return Math.hypot(p.x - e.x, p.y - e.y) < 30; }); if (i >= 0) tapIndex(i); };
  G.status = () => ({ title: step < labels.length ? `Find ${labels[step]}` : "Done", text: S.level === 3 ? "Alternate numbers and letters: 1, A, 2, B…" : "Tap the circles in order." });
  G.stats = () => [["Time", fmtTime(t)], ["Wrong taps", String(errors)]];
  G.debug = () => ({ next: step < labels.length ? pos(step) : null });
  G.draw = function (g, W, H) {
    bg(g, W, H, true); A = { x: 40, y: 150, w: W - 80, h: H - 190 };
    g.strokeStyle = alpha(T.go, 0.6); g.lineWidth = 4; g.beginPath();
    for (let k = 0; k < step; k++) { const p = pos(k); k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); } g.stroke();
    pts.forEach((_, k) => {
      const p = pos(k); g.beginPath(); g.arc(p.x, p.y, 26, 0, TAU);
      g.fillStyle = k < step ? alpha(T.go, 0.25) : k === flash && flashT > 0 ? alpha(T.accent, 0.4) : T.surface; g.fill();
      g.strokeStyle = alpha(T.ink, 0.2); g.lineWidth = 2; g.stroke();
      txt(g, labels[k], p.x, p.y + 1, 20, T.ink, { font: T.body });
    });
    cur.draw(g);
  };
  return G;
}

const brain = { control: "touch", mount: "" };
const ROUNDS = { params: { reps: [6, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } };
const TIMED = { params: { reps: null, level: [1, 2, 3], durationS: [60, 120, 180] }, defaults: { reps: null, level: 1, durationS: 60 } };
[
  Object.assign({ id: "quick", name: "Quick Catch", movement: "Reaction time · alertness", pad: "done",
    desc: "Tap the moment the circle appears.", source: "RehaCom alertness; reaction-time training in attention rehabilitation.",
    how: ["Keep your hand ready over the screen or the phone.", "Wait for the circle.", "Tap as soon as it appears; tapping early doesn't count."], make: QuickCatch }, brain, ROUNDS),
  Object.assign({ id: "gonogo", name: "Go / No-Go", movement: "Response control", pad: "done",
    desc: "Tap when the circle is green; hold back when it is orange.", source: "Go/no-go tasks in computerised executive-function training after stroke.",
    params: { reps: [10, 20, 30], level: [1, 2, 3], durationS: null }, defaults: { reps: 20, level: 1, durationS: null },
    how: ["Watch the circle.", "Green means tap.", "Orange means wait; let it pass."], make: GoNoGo }, brain),
  Object.assign({ id: "watch", name: "Night Watch", movement: "Sustained attention", pad: "done",
    desc: "Shapes appear one at a time. Tap only for the star.", source: "RehaCom vigilance; sustained attention training.",
    how: ["Keep watching the middle of the screen.", "Most shapes are not stars; let them go.", "Tap when a star appears."], make: NightWatch }, brain, TIMED),
  Object.assign({ id: "twoatonce", name: "Two at Once", movement: "Divided attention", pad: "keys",
    desc: "Tap even numbers on the left and switch off the lamp on the right, both at once.", source: "RehaCom divided attention; dual-task training after stroke.",
    how: ["Watch both halves of the screen.", "Tap the left side when an even number shows.", "Tap the right side when the lamp lights up."], make: TwoAtOnce }, brain, TIMED),
  Object.assign({ id: "trail", name: "Trail Connect", movement: "Visual search · task switching", cursor: true,
    desc: "Connect the circles in order. Level 3 alternates numbers and letters.", source: "Trail Making Test A and B, used in stroke cognitive rehabilitation.",
    params: { reps: [1, 2, 3], level: [1, 2, 3], durationS: null }, defaults: { reps: 1, level: 1, durationS: null },
    how: ["Find circle 1 and tap it.", "Then tap 2, 3 and so on.", "On level 3, go 1, A, 2, B, 3, C…"], make: TrailConnect }, brain),
].forEach((d) => RC.register(Object.assign({ section: "attention" }, d)));

defineArt("quick", '<circle cx="60" cy="32" r="20" fill="var(--a-hi)"/><path d="M60 6 v6 M60 52 v6 M34 32 h-6 M86 32 h6" stroke="var(--a-ink)" stroke-width="2.5" stroke-linecap="round"/>');
defineArt("gonogo", '<circle cx="42" cy="32" r="16" fill="var(--a-go)"/><circle cx="80" cy="32" r="16" fill="var(--a-hi)" opacity=".75"/>');
defineArt("watch", '<circle cx="34" cy="32" r="8" fill="var(--a-mute)" opacity=".35"/><rect x="52" y="24" width="16" height="16" fill="var(--a-mute)" opacity=".35"/><polygon points="88,18 91,28 102,28 93,34 96,45 88,38 80,45 83,34 74,28 85,28" fill="var(--a-hi)"/>');
defineArt("twoatonce", '<rect x="14" y="10" width="44" height="44" rx="8" fill="var(--a-bg)"/><text x="36" y="40" font-size="22" font-weight="700" text-anchor="middle" fill="var(--a-ink)">8</text><rect x="62" y="10" width="44" height="44" rx="8" fill="var(--a-bg)"/><circle cx="84" cy="32" r="12" fill="var(--a-hi)"/>');
defineArt("trail", '<path d="M30 46 L58 20 L86 40" stroke="var(--a-go)" stroke-width="2.5" fill="none"/>' + [[30, 46, "1"], [58, 20, "A"], [86, 40, "2"]].map(([x, y, l]) => `<circle cx="${x}" cy="${y}" r="9" fill="var(--a-bg)" stroke="var(--a-mute)"/><text x="${x}" y="${y + 4}" font-size="10" font-weight="700" text-anchor="middle" fill="var(--a-ink)">${l}</text>`).join(""));
})();
