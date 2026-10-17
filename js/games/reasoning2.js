// Reasoning and everyday problem solving: planning, sequences, mental rotation, money, time and
// rule switching.
(() => {
"use strict";
const RC = window.RC;
const { clamp, lerp, TAU, T, alpha, txt, rr, fmtTime } = RC;
const { base, bg, dots, Cursor, Quiz, rand, randInt, pick, shuffle, inRect, defineArt } = RC.kit;
const PAL = ["#b4443a", "#0f766e", "#c9821f", "#2563eb"];
function shapeAt(g, kind, x, y, r, col) {
  g.fillStyle = col; g.beginPath();
  if (kind === 0) { g.moveTo(x, y - r); g.lineTo(x + r, y + r * 0.8); g.lineTo(x - r, y + r * 0.8); g.closePath(); }
  else if (kind === 1) { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); }
  else if (kind === 2) { const w = r * 0.38; g.rect(x - w, y - r, w * 2, r * 2); g.rect(x - r, y - w, r * 2, w * 2); }
  else g.arc(x, y, r * 0.9, 0, TAU);
  g.fill();
}

// ---- Tower Puzzle: move the stack to the right-hand peg, never putting a bigger disc on a smaller one
function Tower(S) {
  const n = { 1: 3, 2: 4, 3: 5 }[S.level] || 3, G = base(S, 1), cur = Cursor({ amp: S.amp });
  const pegs = [Array.from({ length: n }, (_, i) => n - i), [], []];
  let held = -1, moves = 0, bad = -1, badT = 0, t = 0, rects = [];
  function tap(p) {
    if (p < 0 || G.done) return;
    if (held < 0) { if (pegs[p].length) held = p; return; }
    if (held === p) { held = -1; return; }
    const disc = pegs[held][pegs[held].length - 1], top = pegs[p][pegs[p].length - 1];
    if (top && top < disc) { bad = p; badT = 0.5; G.events.push("error"); held = -1; return; }
    pegs[p].push(pegs[held].pop()); held = -1; moves++; G.events.push("tick");
    if (pegs[2].length === n) { G._reps = 1; G.done = true; G.events.push("big"); }
  }
  G.update = function (dt, a) { t += dt; badT = Math.max(0, badT - dt); cur.update(dt, a, G.W || 800, G.H || 500); const i = cur.dwell(dt, rects); if (i >= 0) tap(i); };
  G.pointer = (e) => { if (e.type === "down") tap(rects.findIndex((r) => inRect(e.x, e.y, r))); };
  G.key = (k) => { if (/^[1-3]$/.test(k)) tap(Number(k) - 1); };
  G.status = () => (held >= 0 ? { title: "Now tap where it should go", text: "Smaller discs go on top." } : { title: "Move the whole stack to the right peg", text: `${moves} moves · best possible is ${2 ** n - 1}` });
  G.stats = () => [["Moves", `${moves} (best ${2 ** n - 1})`], ["Time", fmtTime(t)]];
  G.debug = () => ({ n, moves, held, rects, pegs });
  G.draw = function (g, W, H) {
    G.W = W; G.H = H; bg(g, W, H, true);
    const base0 = H - 60, pw = Math.min(260, (W - 100) / 3), ph = Math.min(260, H - 230);
    rects = [0, 1, 2].map((p) => ({ x: W / 2 + (p - 1) * (pw + 20) - pw / 2, y: base0 - ph - 20, w: pw, h: ph + 40 }));
    rects.forEach((r, p) => {
      rr(g, r.x, r.y, r.w, r.h, 18); g.fillStyle = held === p ? alpha(T.go, 0.1) : bad === p && badT > 0 ? alpha(T.accent, 0.15) : alpha(T.surface, 0.5); g.fill();
      const cx = r.x + r.w / 2; g.fillStyle = alpha(T.ink, 0.2); rr(g, cx - 5, base0 - ph, 10, ph, 5); g.fill(); rr(g, r.x + 10, base0, r.w - 20, 10, 5); g.fill();
      pegs[p].forEach((d, k) => { const w = lerp(pw * 0.3, pw * 0.9, (d - 1) / Math.max(1, n - 1)), lift = held === p && k === pegs[p].length - 1 ? 26 : 0; rr(g, cx - w / 2, base0 - (k + 1) * 30 - lift, w, 26, 10); g.fillStyle = PAL[(d - 1) % 4]; g.fill(); });
    });
    cur.draw(g);
  };
  return G;
}

// ---- Errand Planner: put errands in an order that fits every opening time (each takes an hour from 9:00)
const ERRANDS = ["Bank", "Pharmacy", "Post office", "Library", "Bakery", "Hairdresser", "Dry cleaner", "Garden centre"];
function Errands(S) {
  const rounds = S.reps || 3, k = { 1: 3, 2: 4, 3: 5 }[S.level] || 3, G = base(S, rounds);
  let list = [], order = [], rects = [], clearBtn = null, fb = null, fbT = 0, attempts = 0, firstTry = 0, tries = 0;
  const hh = (h) => `${h > 12 ? h - 12 : h}:00${h >= 12 ? " pm" : " am"}`;
  function newRound() {
    const names = shuffle(ERRANDS).slice(0, k), solution = shuffle(names.map((_, i) => i));
    list = names.map((name, i) => { const slot = solution.indexOf(i), start = 9 + slot; return Math.random() < 0.5 && slot > 0 ? { name, opens: start, closes: 18 } : { name, opens: 9, closes: start + 1 }; });
    order = []; tries = 0;
  }
  newRound();
  const rule = (e) => (e.opens > 9 ? `Opens at ${hh(e.opens)}` : `Closes at ${hh(e.closes)}`);
  function check() {
    const ok = order.every((i, slot) => list[i].opens <= 9 + slot && list[i].closes >= 10 + slot);
    attempts++; tries++; fb = ok; fbT = ok ? 1 : 1.6; G.events.push(ok ? "success" : "error");
    if (ok && tries === 1) firstTry++;
  }
  G.update = function (dt) {
    if (fbT > 0) { fbT -= dt; if (fbT <= 0) { if (fb || tries >= 3) { G._reps++; if (G._reps >= rounds) G.done = true; else newRound(); } else order = []; fb = null; } }
  };
  G.pointer = (e) => {
    if (e.type !== "down" || fbT > 0) return;
    if (clearBtn && inRect(e.x, e.y, clearBtn)) { order = []; return; }
    const i = rects.findIndex((r) => inRect(e.x, e.y, r));
    if (i >= 0 && !order.includes(i)) { order.push(i); if (order.length === k) check(); }
  };
  G.status = () => (fb === true ? { title: "That plan works", text: "Every stop is open when you get there.", tone: "good" } : fb === false ? { title: "One stop would be closed", text: tries >= 3 ? "Let's try a new day." : "Try a different order.", tone: "warn" } : { title: "Plan your morning", text: "Each errand takes an hour, starting at 9:00. Tap them in order." });
  G.stats = () => [["Plans that worked first time", `${firstTry} / ${G._reps}`], ["Attempts", String(attempts)]];
  G.debug = () => ({ list, order, rects });
  G.draw = function (g, W, H) {
    bg(g, W, H, true); dots(g, W, rounds, G._reps);
    const cw = Math.min(560, W - 80), chh = Math.min(70, (H - 260) / k - 10), x0 = W / 2 - cw / 2;
    rects = list.map((_, i) => ({ x: x0, y: 150 + i * (chh + 10), w: cw, h: chh }));
    list.forEach((e, i) => {
      const r = rects[i], pos = order.indexOf(i);
      rr(g, r.x, r.y, r.w, r.h, 14); g.fillStyle = pos >= 0 ? alpha(T.go, 0.14) : T.surface; g.fill();
      txt(g, e.name, r.x + 70, r.y + r.h / 2, 22, T.ink, { align: "left", font: T.body });
      txt(g, rule(e), r.x + r.w - 20, r.y + r.h / 2, 17, T.muted, { align: "right", font: T.body, weight: 400 });
      g.beginPath(); g.arc(r.x + 34, r.y + r.h / 2, 18, 0, TAU); g.fillStyle = pos >= 0 ? T.go : alpha(T.ink, 0.08); g.fill();
      if (pos >= 0) txt(g, hh(9 + pos).replace(":00", ""), r.x + 34, r.y + r.h / 2, 13, T.surface, { font: T.body });
    });
    clearBtn = { x: W / 2 - 80, y: H - 64, w: 160, h: 46 };
    rr(g, clearBtn.x, clearBtn.y, clearBtn.w, clearBtn.h, 12); g.fillStyle = T.surface; g.fill(); txt(g, "Start over", W / 2, clearBtn.y + 23, 17, T.ink, { font: T.body });
  };
  return G;
}

// ---- What Comes Next: number and shape sequences
function nextRound(S) {
  if (Math.random() < 0.55) {
    const a = randInt(1, 9), step = randInt(2, S.level === 1 ? 4 : 9), kind = S.level === 3 ? pick(["alt", "double", "add"]) : S.level === 2 ? pick(["add", "double", "sub"]) : "add";
    const seq = [a]; for (let i = 1; i < 5; i++) { const p = seq[i - 1]; seq.push(kind === "double" ? p * 2 : kind === "sub" ? p - step : kind === "alt" ? (i % 2 ? p + step : p - 1) : p + step); }
    if (kind === "sub") seq.forEach((_, i) => (seq[i] += step * 6));
    const ans = seq.pop(), opts = shuffle([ans, ans + 1, ans - 2, ans + randInt(3, 6)].filter((v, i, arr) => arr.indexOf(v) === i)).slice(0, 4);
    if (!opts.includes(ans)) opts[0] = ans;
    return { title: "What number comes next?", options: opts, answer: opts.indexOf(ans), explain: `The pattern continues with ${ans}.`, draw: (g, A) => txt(g, seq.join(",  ") + ",  ?", A.x + A.w / 2, A.y + A.h / 2, Math.min(52, A.w / 14), T.ink, { font: T.body }) };
  }
  const len = S.level === 1 ? 2 : 3, cyc = shuffle([0, 1, 2, 3]).slice(0, len).map((s, i) => ({ s, c: (i + randInt(0, 3)) % 4 })), shown = 5;
  const ans = cyc[shown % len], others = shuffle([0, 1, 2, 3].map((s) => ({ s, c: (s + 1) % 4 }))).filter((o) => !(o.s === ans.s && o.c === ans.c)).slice(0, 3);
  const opts = shuffle([ans].concat(others));
  return { title: "Which shape comes next?", options: opts, answer: opts.indexOf(ans), explain: "The shapes repeat in a cycle.",
    label: (i) => (g, r) => shapeAt(g, opts[i].s, r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) * 0.28, PAL[opts[i].c]),
    draw: (g, A) => { const step = Math.min(110, A.w / (shown + 1.5)); for (let i = 0; i <= shown; i++) { const x = A.x + A.w / 2 + (i - shown / 2) * step, y = A.y + A.h / 2; if (i < shown) shapeAt(g, cyc[i % len].s, x, y, step * 0.32, PAL[cyc[i % len].c]); else txt(g, "?", x, y, step * 0.6, T.muted, { font: T.body }); } } };
}

// ---- Turn the Shape: is the right-hand shape the same one turned, or a mirror image?
const POLY = { 1: [[0, 0], [0, 1], [0, 2], [1, 2]], 2: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]], 3: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 1], [2, 2]] };
function drawPoly(g, cells, cx, cy, s, angle, mirror, col) {
  const pts = cells.map(([x, y]) => [mirror ? -x : x, y]), mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  g.save(); g.translate(cx, cy); g.rotate(angle); g.fillStyle = col;
  for (const [x, y] of pts) { rr(g, (x - mx - 0.5) * s, (y - my - 0.5) * s, s - 3, s - 3, 5); g.fill(); }
  g.restore();
}
function rotateRound(S) {
  const cells = POLY[S.level] || POLY[2], mirror = Math.random() < 0.5, ang = pick([1, 2, 3]) * (Math.PI / 2), base0 = pick([0, 1, 2, 3]) * (Math.PI / 2);
  return { title: "Same shape turned, or a mirror image?", options: ["Same shape", "Mirror image"], answer: mirror ? 1 : 0, explain: mirror ? "It was flipped over, not just turned." : "It's the same shape, turned around.",
    draw: (g, A) => { const s = Math.min(46, A.h / 4.5); drawPoly(g, cells, A.x + A.w * 0.3, A.y + A.h / 2, s, base0, false, T.brain || "#5b4bb5"); drawPoly(g, cells, A.x + A.w * 0.7, A.y + A.h / 2, s, base0 + ang, mirror, T.brain || "#5b4bb5"); } };
}

// ---- Tell the Time: read the clock
function clockRound(S) {
  const h = randInt(1, 12), m = S.level === 1 ? 0 : S.level === 2 ? pick([0, 15, 30, 45]) : randInt(0, 11) * 5;
  const fmt = (hh, mm) => `${hh}:${String(mm).padStart(2, "0")}`, ans = fmt(h, m);
  const wrong = [fmt(h % 12 + 1, m), fmt(h, (m + 30) % 60), fmt((m / 5) || 12, (h * 5) % 60), fmt((h + 10) % 12 + 1, m)].filter((x) => x !== ans);
  const opts = shuffle([ans].concat(shuffle([...new Set(wrong)]).slice(0, 3)));
  return { title: "What time does the clock show?", options: opts, answer: opts.indexOf(ans), explain: `It shows ${ans}.`,
    draw: (g, A) => {
      const cx = A.x + A.w / 2, cy = A.y + A.h / 2, R = Math.min(A.h * 0.46, 120);
      g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fillStyle = T.surface; g.fill(); g.strokeStyle = T.ink; g.lineWidth = 4; g.stroke();
      for (let i = 1; i <= 12; i++) { const a = (i / 12) * TAU - Math.PI / 2; txt(g, String(i), cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8, R * 0.16, T.ink, { font: T.body }); }
      const ha = ((h % 12) / 12 + m / 720) * TAU - Math.PI / 2, ma = (m / 60) * TAU - Math.PI / 2;
      g.lineCap = "round"; g.strokeStyle = T.ink; g.lineWidth = 8; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ha) * R * 0.5, cy + Math.sin(ha) * R * 0.5); g.stroke();
      g.lineWidth = 5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ma) * R * 0.75, cy + Math.sin(ma) * R * 0.75); g.stroke(); g.lineCap = "butt";
    } };
}

// ---- Make Change: tap coins to pay exactly (levels 1–2) or work out the change (level 3)
const COINS = [500, 100, 50, 25, 10, 5];
const money = (c) => `$${(c / 100).toFixed(2)}`;
function MakeChange(S) {
  if (S.level === 3) {
    return Quiz(S, { round: () => {
      const price = randInt(150, 980), paid = price > 500 ? 1000 : 500, ans = paid - price;
      const opts = shuffle([ans, ans + 100, Math.max(5, ans - 50), ans + 25].filter((v, i, a) => a.indexOf(v) === i));
      return { title: `It costs ${money(price)}. You pay with ${money(paid)}.`, text: "How much change do you get?", options: opts.map(money), answer: opts.indexOf(ans), explain: `${money(paid)} − ${money(price)} = ${money(ans)}.`,
        draw: (g, A) => { rr(g, A.x + A.w / 2 - 150, A.y + A.h / 2 - 50, 300, 100, 18); g.fillStyle = T.surface; g.fill(); txt(g, money(price), A.x + A.w / 2, A.y + A.h / 2, 44, T.ink, { font: T.body }); } };
    } });
  }
  const rounds = S.reps || 5, G = base(S, rounds);
  let price = 0, paid = [], rects = [], undo = null, fbT = 0, t = 0, overs = 0;
  const coinsFor = S.level === 1 ? COINS.slice(1) : COINS;
  const newRound = () => { price = S.level === 1 ? randInt(3, 30) * 5 + 100 : randInt(40, 180) * 5; paid = []; };
  newRound();
  const sum = () => paid.reduce((s, c) => s + c, 0);
  G.update = function (dt) { t += dt; if (fbT > 0) { fbT -= dt; if (fbT <= 0) { if (G._reps >= rounds) G.done = true; else newRound(); } } };
  G.pointer = (e) => {
    if (e.type !== "down" || fbT > 0) return;
    if (undo && inRect(e.x, e.y, undo)) { paid.pop(); return; }
    const i = rects.findIndex((r) => inRect(e.x, e.y, r)); if (i < 0) return;
    paid.push(coinsFor[i]);
    if (sum() === price) { G._reps++; fbT = 1; G.events.push("success"); } else if (sum() > price) { overs++; G.events.push("error"); }
  };
  G.status = () => (fbT > 0 ? { title: "Exactly right", text: money(price), tone: "good" } : sum() > price ? { title: "That's too much", text: "Tap Undo to take a coin back.", tone: "warn" } : { title: `Pay exactly ${money(price)}`, text: `So far ${money(sum())}` });
  G.stats = () => [["Paid exactly", `${G._reps} / ${rounds}`], ["Went over", String(overs)], ["Time", fmtTime(t)]];
  G.debug = () => ({ price, rects, coins: coinsFor });
  G.draw = function (g, W, H) {
    bg(g, W, H, true); dots(g, W, rounds, G._reps);
    txt(g, money(price), W / 2, 185, 48, T.ink, { font: T.body });
    paid.slice(-12).forEach((c, i) => { g.beginPath(); g.arc(W / 2 - 160 + i * 28, 245, 16, 0, TAU); g.fillStyle = c >= 100 ? "#4d7c0f" : "#c9a14a"; g.fill(); });
    const n = coinsFor.length, s = Math.min(110, (W - 80) / n - 12), x0 = W / 2 - (n * (s + 12) - 12) / 2, y = H - s - 90;
    rects = coinsFor.map((c, i) => ({ x: x0 + i * (s + 12), y, w: s, h: s }));
    coinsFor.forEach((c, i) => { const r = rects[i]; g.beginPath(); if (c >= 100) rr(g, r.x, r.y + s * 0.2, r.w, r.h * 0.6, 10); else g.arc(r.x + s / 2, r.y + s / 2, s / 2, 0, TAU); g.fillStyle = c >= 100 ? "#4d7c0f" : "#c9a14a"; g.fill(); txt(g, c >= 100 ? `$${c / 100}` : `${c}¢`, r.x + s / 2, r.y + s / 2, s * 0.26, "#ffffff", { font: T.body }); });
    undo = { x: W / 2 - 70, y: H - 64, w: 140, h: 46 };
    rr(g, undo.x, undo.y, undo.w, undo.h, 12); g.fillStyle = T.surface; g.fill(); txt(g, "Undo", W / 2, undo.y + 23, 17, T.ink, { font: T.body });
  };
  return G;
}

// ---- Rule Switch: sort each card to a key card; the hidden rule changes after six right in a row
function RuleSwitch(S) {
  const trials = S.reps || 20, G = base(S, trials), RULES = ["colour", "shape", "count"];
  const keys = [0, 1, 2, 3].map((i) => ({ c: i, s: i, n: i + 1 }));
  let rule = 0, prevRule = -1, streak = 0, card = null, fb = null, fbT = 0, right = 0, persev = 0, switches = 0, rects = [];
  const newCard = () => { card = { c: randInt(0, 3), s: randInt(0, 3), n: randInt(1, 4) }; };
  newCard();
  const attr = (r, x) => (r === 0 ? x.c : r === 1 ? x.s : x.n);
  function choose(i) {
    if (fbT > 0 || i < 0) return;
    const ok = attr(rule, keys[i]) === attr(rule, card);
    if (ok) { right++; streak++; G.events.push("success"); } else { streak = 0; G.events.push("error"); if (prevRule >= 0 && attr(prevRule, keys[i]) === attr(prevRule, card)) persev++; }
    fb = ok; fbT = 0.8; G._reps++;
    if (streak >= 6) { prevRule = rule; rule = (rule + 1) % 3; streak = 0; switches++; }
  }
  G.update = function (dt) { if (fbT > 0) { fbT -= dt; if (fbT <= 0) { fb = null; if (G._reps >= trials) G.done = true; else newCard(); } } };
  G.pointer = (e) => { if (e.type === "down") choose(rects.findIndex((r) => inRect(e.x, e.y, r))); };
  G.key = (k) => { if (/^[1-4]$/.test(k)) choose(Number(k) - 1); };
  G.status = () => (fb === true ? { title: "Right", text: "", tone: "good" } : fb === false ? { title: "Not that one", text: "Work out the rule from the feedback.", tone: "warn" } : { title: "Which card does it go with?", text: "The rule is hidden, and it can change." });
  G.stats = () => [["Correct", `${right} / ${trials}`], ["Rule changes found", String(switches)], ["Stuck on an old rule", String(persev)]];
  G.debug = () => ({ rule: RULES[rule], answer: keys.findIndex((k) => attr(rule, k) === attr(rule, card)), rects });
  function drawCard(g, x, y, w, h, c, hi) {
    rr(g, x, y, w, h, 14); g.fillStyle = hi ? alpha(T.go, 0.15) : T.surface; g.fill();
    const r = Math.min(w, h) * 0.13, pos = [[0.5, 0.5], [0.3, 0.5, 0.7, 0.5], [0.5, 0.28, 0.3, 0.7, 0.7, 0.7], [0.3, 0.3, 0.7, 0.3, 0.3, 0.7, 0.7, 0.7]][c.n - 1];
    for (let i = 0; i < pos.length; i += 2) shapeAt(g, c.s, x + pos[i] * w, y + pos[i + 1] * h, r, PAL[c.c]);
  }
  G.draw = function (g, W, H) {
    bg(g, W, H, true); dots(g, W, trials, G._reps);
    const kh = Math.min(180, (H - 150 - 70) / 2.2), kw = Math.min(kh / 1.2, (W - 100) / 4 - 14), x0 = W / 2 - (kw * 4 + 14 * 3) / 2;
    rects = keys.map((_, i) => ({ x: x0 + i * (kw + 14), y: 150, w: kw, h: kh }));
    keys.forEach((k, i) => drawCard(g, rects[i].x, rects[i].y, kw, kh, k, false));
    drawCard(g, W / 2 - kw / 2, 150 + kh + 40, kw, kh, card, fb === true);
  };
  return G;
}

const brain = { control: "touch", mount: "" };
const ROUNDS = { params: { reps: [6, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } };
[
  Object.assign({ id: "tower", name: "Tower Puzzle", movement: "Planning · problem solving", cursor: true,
    desc: "Move the stack of discs to the right peg, one at a time, never a big disc on a small one.", source: "Tower of Hanoi/London planning tasks; RehaCom executive functions.",
    params: { reps: null, level: [1, 2, 3], durationS: null }, defaults: { reps: null, level: 1, durationS: null },
    how: ["Tap a peg to pick up its top disc.", "Tap another peg to put it down.", "Get the whole stack onto the right-hand peg."], make: Tower }, brain),
  Object.assign({ id: "errands", name: "Errand Planner", movement: "Planning · everyday reasoning",
    desc: "Put your errands in an order where every place is open when you arrive.", source: "RehaCom 'Plan a Vacation' and 'Shopping'; everyday planning tasks.",
    params: { reps: [3, 5, 8], level: [1, 2, 3], durationS: null }, defaults: { reps: 3, level: 1, durationS: null },
    how: ["Each errand takes one hour, starting at 9:00.", "Read when each place opens or closes.", "Tap the errands in the order you'd do them."], make: Errands }, brain),
  Object.assign({ id: "next", name: "What Comes Next", movement: "Pattern reasoning",
    desc: "Find the number or shape that continues the pattern.", source: "RehaCom logical reasoning; Constant Therapy analytical reasoning.",
    how: ["Look at the sequence.", "Work out the pattern.", "Tap the answer that comes next."], make: (S) => Quiz(S, { round: () => nextRound(S) }) }, brain, ROUNDS),
  Object.assign({ id: "rotate", name: "Turn the Shape", movement: "Mental rotation · visuospatial", cursor: true,
    desc: "Decide whether the shape on the right is the same one turned, or a mirror image.", source: "Mental rotation tasks; Constant Therapy visuospatial processing.",
    how: ["Look at both shapes.", "Imagine turning the left one.", "Tap Same shape or Mirror image."], make: (S) => Quiz(S, { round: () => rotateRound(S), cursor: true }) }, brain, ROUNDS),
  Object.assign({ id: "change", name: "Make Change", movement: "Money handling · arithmetic",
    desc: "Tap coins and notes to pay exactly. Level 3 asks for the change instead.", source: "Constant Therapy arithmetic and quantitative reasoning; daily-living money tasks.",
    params: { reps: [3, 5, 8], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null },
    how: ["Read the price.", "Tap coins and notes to add up to it.", "Tap Undo if you go over."], make: MakeChange }, brain),
  Object.assign({ id: "clock", name: "Tell the Time", movement: "Reading a clock · time",
    desc: "Read the analog clock and pick the right time.", source: "Daily-living time tasks in cognitive rehabilitation.",
    how: ["Look at the short hand for the hour.", "Look at the long hand for the minutes.", "Tap the matching time."], make: (S) => Quiz(S, { round: () => clockRound(S) }) }, brain, ROUNDS),
  Object.assign({ id: "ruleswitch", name: "Rule Switch", movement: "Flexible thinking · rule switching", cursor: true,
    desc: "Match each card to one of four by colour, shape or number. The rule changes without warning.", source: "Wisconsin Card Sorting-style set-shifting tasks.",
    params: { reps: [20, 30, 40], level: [1, 2, 3], durationS: null }, defaults: { reps: 20, level: 1, durationS: null },
    how: ["Tap the top card that the bottom card goes with.", "Use the right/wrong feedback to find the rule.", "When it starts saying 'Not that one', the rule has changed."], make: RuleSwitch }, brain),
].forEach((d) => RC.register(Object.assign({ section: "reasoning" }, d)));

defineArt("tower", '<path d="M30 54 H90" stroke="var(--a-mute)" stroke-width="3"/><path d="M40 20 V54 M60 20 V54 M80 20 V54" stroke="var(--a-mute)" stroke-width="2"/><rect x="28" y="44" width="24" height="8" rx="3" fill="var(--a-hi)"/><rect x="32" y="35" width="16" height="8" rx="3" fill="var(--a-go)"/><rect x="74" y="44" width="12" height="8" rx="3" fill="var(--a-brain)"/>');
defineArt("errands", '<rect x="28" y="10" width="64" height="12" rx="4" fill="var(--a-bg)"/><rect x="28" y="26" width="64" height="12" rx="4" fill="var(--a-bg)"/><rect x="28" y="42" width="64" height="12" rx="4" fill="var(--a-bg)"/><circle cx="34" cy="16" r="4" fill="var(--a-go)"/><circle cx="34" cy="32" r="4" fill="var(--a-go)"/>');
defineArt("next", '<text x="60" y="38" font-size="16" font-weight="700" text-anchor="middle" fill="var(--a-ink)">2, 4, 6, ?</text>');
defineArt("rotate", '<g fill="var(--a-brain)"><rect x="26" y="14" width="10" height="10"/><rect x="26" y="25" width="10" height="10"/><rect x="26" y="36" width="10" height="10"/><rect x="37" y="36" width="10" height="10"/></g><g fill="var(--a-brain)" transform="rotate(90 80 32)"><rect x="70" y="14" width="10" height="10"/><rect x="70" y="25" width="10" height="10"/><rect x="70" y="36" width="10" height="10"/><rect x="81" y="36" width="10" height="10"/></g>');
defineArt("change", '<circle cx="44" cy="34" r="12" fill="#c9a14a"/><circle cx="62" cy="38" r="9" fill="#c9a14a" opacity=".8"/><rect x="70" y="18" width="30" height="18" rx="3" fill="#4d7c0f"/>');
defineArt("clock", '<circle cx="60" cy="32" r="22" fill="var(--a-bg)" stroke="var(--a-ink)" stroke-width="2"/><path d="M60 32 V18 M60 32 L70 38" stroke="var(--a-ink)" stroke-width="3" stroke-linecap="round"/>');
defineArt("ruleswitch", '<rect x="18" y="14" width="18" height="24" rx="3" fill="var(--a-bg)"/><rect x="40" y="14" width="18" height="24" rx="3" fill="var(--a-bg)"/><rect x="62" y="14" width="18" height="24" rx="3" fill="var(--a-bg)"/><rect x="84" y="14" width="18" height="24" rx="3" fill="var(--a-bg)"/><circle cx="27" cy="26" r="4" fill="#b4443a"/><polygon points="49,20 54,31 44,31" fill="#0f766e"/><rect x="67" y="22" width="8" height="8" fill="#c9821f"/><circle cx="93" cy="26" r="4" fill="#2563eb"/><path d="M60 44 v8" stroke="var(--a-mute)" stroke-width="2"/>');
})();
