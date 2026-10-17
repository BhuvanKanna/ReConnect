// Visual scanning for one-sided neglect: find targets across the whole page, with the left side
// reported separately because neglect usually hides the left.
(() => {
"use strict";
const RC = window.RC;
const { clamp, lerp, TAU, T, alpha, txt, rr, fmtTime } = RC;
const { base, bg, dots, Cursor, rand, randInt, shuffle, inRect, defineArt } = RC.kit;

function star(g, x, y, r, fill) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr_ = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr_, y + Math.sin(a) * rr_); }
  g.closePath(); g.fillStyle = fill; g.fill();
}
function shape(g, kind, x, y, r, fill) {
  g.fillStyle = fill; g.beginPath();
  if (kind === "circle") g.arc(x, y, r * 0.8, 0, TAU);
  else if (kind === "square") g.rect(x - r * 0.7, y - r * 0.7, r * 1.4, r * 1.4);
  else if (kind === "triangle") { g.moveTo(x, y - r); g.lineTo(x + r * 0.9, y + r * 0.7); g.lineTo(x - r * 0.9, y + r * 0.7); g.closePath(); }
  else if (kind === "diamond") { g.moveTo(x, y - r); g.lineTo(x + r * 0.8, y); g.lineTo(x, y + r); g.lineTo(x - r * 0.8, y); g.closePath(); }
  g.fill();
}
// Scatter n points over the stage without overlaps (positions as fractions, so resizing keeps them).
function scatter(n, minGap) {
  const pts = [];
  for (let tries = 0; pts.length < n && tries < n * 400; tries++) {
    const p = { fx: rand(0.05, 0.95), fy: rand(0.06, 0.94) };
    if (pts.every((q) => Math.hypot(q.fx - p.fx, (q.fy - p.fy) * 0.62) > minGap)) pts.push(p);
  }
  return pts;
}
const area = (W, H) => ({ x: 30, y: 150, w: W - 60, h: H - 210 });
const at = (p, A) => ({ x: A.x + p.fx * A.w, y: A.y + p.fy * A.h });

// ---- Cancel It: tap every star on the page (star cancellation)
function CancelIt(S) {
  const nItems = { 1: 24, 2: 36, 3: 48 }[S.level] || 36, nTargets = { 1: 8, 2: 12, 3: 16 }[S.level] || 12, pages = S.reps || 1, G = base(S, pages);
  const KINDS = ["circle", "square", "triangle", "diamond"];
  let items = [], A = { x: 0, y: 0, w: 1, h: 1 }, finish = { x: 0, y: 0, w: 0, h: 0 }, falseTaps = 0, t = 0, missedL = 0, missedR = 0, foundL = 0, foundR = 0;
  const cur = Cursor({ amp: S.amp });
  function newPage() {
    const pts = shuffle(scatter(nItems, 0.07));
    items = pts.map((p, i) => Object.assign(p, { target: i < nTargets, kind: KINDS[i % 4], found: false }));
  }
  newPage();
  function endPage() {
    for (const it of items) if (it.target) { const left = it.fx < 0.5; if (it.found) left ? foundL++ : foundR++; else left ? missedL++ : missedR++; }
    G._reps++; G.events.push("success");
    if (G._reps >= pages) G.done = true; else newPage();
  }
  function tapAt(x, y) {
    if (inRect(x, y, finish)) { endPage(); return; }
    const hit = items.find((it) => { const p = at(it, A); return Math.hypot(p.x - x, p.y - y) < 26; });
    if (!hit) return;
    if (hit.target && !hit.found) { hit.found = true; G.events.push("tick"); if (items.every((it) => !it.target || it.found)) endPage(); }
    else if (!hit.target) falseTaps++;
  }
  G.update = function (dt, a) {
    t += dt; cur.update(dt, a, A.x * 2 + A.w, A.y + A.h + 60);
    const i = cur.dwell(dt, items.map((it) => { const p = at(it, A); return { x: p.x - 22, y: p.y - 22, w: 44, h: 44 }; }));
    if (i >= 0) { const p = at(items[i], A); tapAt(p.x, p.y); }
  };
  G.pointer = (e) => { if (e.type === "down") tapAt(e.x, e.y); };
  G.status = () => ({ title: "Tap every star", text: `${items.filter((it) => it.target && it.found).length} of ${nTargets} found · look all the way to the left edge` });
  G.stats = () => [["Stars found", `${foundL + foundR} / ${(foundL + foundR + missedL + missedR)}`], ["Missed on the left", String(missedL)], ["Missed on the right", String(missedR)], ["Taps on other shapes", String(falseTaps)], ["Time", fmtTime(t)]];
  G.debug = () => ({ targets: items.filter((it) => it.target).map((it) => Object.assign(at(it, A), { found: it.found })), finish });
  G.draw = function (g, W, H) {
    bg(g, W, H, true); A = area(W, H);
    for (const it of items) {
      const p = at(it, A);
      if (it.target) star(g, p.x, p.y, 17, it.found ? alpha(T.go, 0.35) : T.ink); else shape(g, it.kind, p.x, p.y, 14, alpha(T.ink, 0.35));
      if (it.found) { g.strokeStyle = T.go; g.lineWidth = 4; g.beginPath(); g.moveTo(p.x - 12, p.y); g.lineTo(p.x - 3, p.y + 9); g.lineTo(p.x + 13, p.y - 9); g.stroke(); }
    }
    finish = { x: W / 2 - 120, y: H - 54, w: 240, h: 44 };
    rr(g, finish.x, finish.y, finish.w, finish.h, 12); g.fillStyle = T.surface; g.fill();
    txt(g, "I've found them all", finish.x + finish.w / 2, finish.y + 22, 16, T.ink, { font: T.body });
    cur.draw(g);
  };
  return G;
}

// ---- Look Left Search: find the one star; a pulsing left anchor reminds you to start on the left
function LookLeft(S) {
  const rounds = S.reps || 10, n = { 1: 12, 2: 20, 3: 30 }[S.level] || 20, G = base(S, rounds);
  let items = [], A = { x: 0, y: 0, w: 1, h: 1 }, t = 0, startT = 0, lookedLeft = false, timesL = [], timesR = [], wrong = 0;
  const KINDS = ["circle", "square", "triangle", "diamond"];
  function newRound() {
    const pts = scatter(n, 0.09), targetLeft = G._reps % 2 === 0;
    let ti = pts.findIndex((p) => (targetLeft ? p.fx < 0.4 : p.fx > 0.6)); if (ti < 0) ti = 0;
    items = pts.map((p, i) => Object.assign(p, { target: i === ti, kind: KINDS[i % 4] }));
    startT = t; lookedLeft = false;
  }
  newRound();
  G.update = (dt) => { t += dt; };
  G.pointer = (e) => {
    if (e.type !== "down") return;
    if (e.x < A.x + A.w / 2) lookedLeft = true;
    const hit = items.find((it) => { const p = at(it, A); return Math.hypot(p.x - e.x, p.y - e.y) < 28; });
    if (hit && hit.target) { (hit.fx < 0.5 ? timesL : timesR).push(t - startT); G._reps++; G.events.push("success"); if (G._reps >= rounds) G.done = true; else newRound(); }
    else if (hit) wrong++;
  };
  const avg = (a) => (a.length ? `${(a.reduce((s, x) => s + x, 0) / a.length).toFixed(1)} s` : "–");
  G.status = () => ({ title: "Find the star", text: lookedLeft ? `${G._reps + 1} of ${rounds}` : "Start at the left edge and sweep across" });
  G.stats = () => [["Average time, star on the left", avg(timesL)], ["Average time, star on the right", avg(timesR)], ["Other shapes tapped", String(wrong)]];
  G.debug = () => ({ target: (() => { const it = items.find((x) => x.target); return at(it, A); })() });
  G.draw = function (g, W, H) {
    bg(g, W, H, true); dots(g, W, rounds, G._reps); A = area(W, H);
    if (!lookedLeft) { const pulse = 0.5 + 0.5 * Math.sin(t * 5); g.fillStyle = alpha(T.accent, 0.25 + pulse * 0.45); rr(g, 8, A.y, 12, A.h, 6); g.fill(); }
    for (const it of items) { const p = at(it, A); if (it.target) star(g, p.x, p.y, 18, T.ink); else shape(g, it.kind, p.x, p.y, 15, alpha(T.ink, 0.35)); }
  };
  return G;
}

// ---- Find the Middle: tap the centre of each line (line bisection)
function FindMiddle(S) {
  const rounds = S.reps || 10, G = base(S, rounds);
  let line = null, errs = [], mark = null, markT = 0, W0 = 800;
  function newLine(W) { const len = rand(0.3, 0.75) * (W - 80), x0 = rand(40, W - 40 - len); line = { x0, x1: x0 + len, fy: rand(0.35, 0.8) }; }
  G.update = function (dt) { if (markT > 0) { markT -= dt; if (markT <= 0) { mark = null; if (G._reps >= rounds) G.done = true; else newLine(W0); } } };
  G.pointer = (e) => {
    if (e.type !== "down" || markT > 0 || !line) return;
    const mid = (line.x0 + line.x1) / 2, err = ((e.x - mid) / (line.x1 - line.x0)) * 100;
    errs.push(err); mark = e.x; markT = 0.9; G._reps++; G.events.push(Math.abs(err) < 5 ? "success" : "tick");
  };
  const mean = () => (errs.length ? errs.reduce((s, x) => s + x, 0) / errs.length : 0);
  G.status = () => (markT > 0 ? { title: Math.abs(errs[errs.length - 1]) < 5 ? "Right in the middle" : "Here's the middle", text: "Next line coming up." } : { title: "Tap the middle of the line", text: `${G._reps + 1} of ${rounds}` });
  G.stats = () => [["Average distance from centre", errs.length ? `${(errs.reduce((s, x) => s + Math.abs(x), 0) / errs.length).toFixed(1)}%` : "–"], ["Lean of your marks", errs.length ? `${Math.abs(mean()).toFixed(1)}% to the ${mean() < 0 ? "left" : "right"}` : "–"]];
  G.debug = () => ({ line, H: 0 });
  G.draw = function (g, W, H) {
    if (!line) newLine(W); W0 = W;
    bg(g, W, H, true); dots(g, W, rounds, G._reps);
    const y = 150 + line.fy * (H - 200);
    g.strokeStyle = T.ink; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.moveTo(line.x0, y); g.lineTo(line.x1, y); g.stroke(); g.lineCap = "butt";
    if (mark != null) {
      const mid = (line.x0 + line.x1) / 2;
      g.strokeStyle = T.go; g.lineWidth = 3; g.beginPath(); g.moveTo(mid, y - 30); g.lineTo(mid, y + 30); g.stroke();
      g.strokeStyle = T.accent; g.lineWidth = 4; g.beginPath(); g.moveTo(mark, y - 22); g.lineTo(mark, y + 22); g.stroke();
    }
  };
  return G;
}

const brain = { control: "touch", mount: "" };
[
  Object.assign({ id: "cancel", name: "Cancel It", movement: "Visual scanning · neglect", cursor: true,
    desc: "Tap every star on the page. Look all the way to the left edge.", source: "Star and letter cancellation tasks used for neglect; Behavioural Inattention Test.",
    params: { reps: [1, 2, 3], level: [1, 2, 3], durationS: null }, defaults: { reps: 1, level: 1, durationS: null },
    how: ["Start at the top left corner.", "Sweep across each row and tap every star.", "Tap 'I've found them all' when you're sure."], make: CancelIt }, brain),
  Object.assign({ id: "lookleft", name: "Look Left Search", movement: "Visual search · left-side cue",
    desc: "Find the single star. A glowing bar on the left reminds you where to start.", source: "Visual scanning training with left anchoring (neglect rehabilitation trials).",
    how: ["Look at the glowing bar on the left edge first.", "Sweep your eyes from left to right.", "Tap the star as soon as you see it."], make: LookLeft }, brain),
  Object.assign({ id: "bisect", name: "Find the Middle", movement: "Line bisection · spatial attention",
    desc: "Tap the exact middle of each line.", source: "Line bisection test used to assess and train neglect.",
    how: ["Look at both ends of the line.", "Tap where you think the middle is.", "The green mark shows the true middle."], make: FindMiddle }, brain),
].forEach((d) => RC.register(Object.assign({ section: "scanning" }, d)));

const starPath = (x, y, r) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.45 : r; return `${(x + Math.cos(a) * q).toFixed(1)},${(y + Math.sin(a) * q).toFixed(1)}`; }).join(" ");
defineArt("cancel", `<polygon points="${starPath(30, 20, 7)}" fill="var(--a-ink)"/><polygon points="${starPath(78, 44, 7)}" fill="var(--a-ink)"/><polygon points="${starPath(54, 18, 7)}" fill="var(--a-go)" opacity=".4"/><circle cx="44" cy="44" r="5" fill="var(--a-mute)" opacity=".4"/><rect x="88" y="14" width="9" height="9" fill="var(--a-mute)" opacity=".4"/>`);
defineArt("lookleft", `<rect x="10" y="8" width="5" height="48" rx="2" fill="var(--a-hi)"/><polygon points="${starPath(84, 30, 8)}" fill="var(--a-ink)"/><circle cx="40" cy="22" r="5" fill="var(--a-mute)" opacity=".4"/><rect x="56" y="40" width="9" height="9" fill="var(--a-mute)" opacity=".4"/>`);
defineArt("bisect", '<path d="M22 32 H98" stroke="var(--a-ink)" stroke-width="4" stroke-linecap="round"/><path d="M60 20 V44" stroke="var(--a-go)" stroke-width="2.5"/><path d="M55 22 V42" stroke="var(--a-hi)" stroke-width="2.5"/>');
})();
