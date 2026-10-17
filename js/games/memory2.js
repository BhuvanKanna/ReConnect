// Memory: card pairs, n-back, number span, word lists, a shopping list, and names with faces.
(() => {
"use strict";
const RC = window.RC;
const { clamp, lerp, TAU, T, alpha, txt, rr, fmtTime } = RC;
const { base, bg, dots, Cursor, Keypad, Quiz, rand, randInt, pick, shuffle, inRect, defineArt } = RC.kit;

// Simple drawn symbols for cards (no emoji): a shape in one of several colours.
const COLORS = ["#0f766e", "#c9821f", "#5b4bb5", "#b4443a", "#2563eb", "#4d7c0f"];
const SHAPES = ["circle", "square", "triangle", "diamond", "star", "ring"];
function symbol(g, k, cx, cy, r) {
  const shape = SHAPES[k % SHAPES.length], col = COLORS[Math.floor(k / SHAPES.length + k) % COLORS.length];
  g.fillStyle = col; g.strokeStyle = col; g.beginPath();
  if (shape === "circle") g.arc(cx, cy, r, 0, TAU);
  else if (shape === "square") g.rect(cx - r * 0.85, cy - r * 0.85, r * 1.7, r * 1.7);
  else if (shape === "triangle") { g.moveTo(cx, cy - r); g.lineTo(cx + r, cy + r * 0.8); g.lineTo(cx - r, cy + r * 0.8); g.closePath(); }
  else if (shape === "diamond") { g.moveTo(cx, cy - r); g.lineTo(cx + r * 0.8, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r * 0.8, cy); g.closePath(); }
  else if (shape === "star") { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.45 : r; g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } g.closePath(); }
  if (shape === "ring") { g.lineWidth = r * 0.35; g.arc(cx, cy, r * 0.75, 0, TAU); g.stroke(); } else g.fill();
}

// ---- Card Pairs: flip two cards at a time to find matching pairs
function CardPairs(S) {
  const pairs = { 1: 6, 2: 8, 3: 12 }[S.level] || 8, G = base(S, pairs), cur = Cursor({ amp: S.amp });
  const cards = shuffle(Array.from({ length: pairs * 2 }, (_, i) => ({ sym: Math.floor(i / 2) * 7 % 36, up: false, matched: false })));
  let open = [], waitT = 0, flips = 0, t = 0, rects = [];
  function flip(i) {
    const c = cards[i];
    if (!c || waitT > 0 || c.up || c.matched) return;
    c.up = true; open.push(i); flips++;
    if (open.length === 2) {
      const [a, b] = open.map((k) => cards[k]);
      if (a.sym === b.sym) { a.matched = b.matched = true; open = []; G._reps++; G.events.push("success"); if (G._reps >= pairs) G.done = true; }
      else { waitT = 0.9; G.events.push("tick"); }
    }
  }
  G.update = function (dt, a) {
    t += dt;
    if (waitT > 0) { waitT -= dt; if (waitT <= 0) { open.forEach((k) => (cards[k].up = false)); open = []; } }
    cur.update(dt, a, (G.W || 800), (G.H || 500));
    const i = cur.dwell(dt, rects); if (i >= 0) flip(i);
  };
  G.pointer = (e) => { if (e.type === "down") flip(rects.findIndex((r) => inRect(e.x, e.y, r))); };
  G.status = () => ({ title: "Find the matching pairs", text: `${G._reps} of ${pairs} pairs · ${flips} flips` });
  G.stats = () => [["Pairs", `${G._reps} / ${pairs}`], ["Flips", String(flips)], ["Time", fmtTime(t)]];
  G.debug = () => ({ busy: waitT > 0 || open.length > 0, cards: cards.map((c, i) => Object.assign({ sym: c.sym, matched: c.matched }, rects[i])) });
  G.draw = function (g, W, H) {
    G.W = W; G.H = H;
    bg(g, W, H, true);
    const n = cards.length, cols = n <= 12 ? 4 : 6, rows = Math.ceil(n / cols), gap = 12;
    const cw = Math.min(130, (W - 80 - gap * (cols - 1)) / cols), chh = Math.min(cw * 1.15, (H - 170 - gap * (rows - 1)) / rows);
    const x0 = W / 2 - (cw * cols + gap * (cols - 1)) / 2, y0 = 150;
    rects = cards.map((_, i) => ({ x: x0 + (i % cols) * (cw + gap), y: y0 + Math.floor(i / cols) * (chh + gap), w: cw, h: chh }));
    cards.forEach((c, i) => {
      const r = rects[i]; rr(g, r.x, r.y, r.w, r.h, 14);
      g.fillStyle = c.matched ? alpha(T.go, 0.12) : c.up ? T.surface : T.brain || "#5b4bb5"; g.fill();
      if (c.up || c.matched) symbol(g, c.sym, r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) * 0.26);
    });
    cur.draw(g);
  };
  return G;
}

// ---- N-Back: is this letter the same as the one N steps back?
function NBack(S) {
  const nb = S.level === 3 ? 2 : 1, total = S.reps || 20, G = base(S, total);
  const LET = "BCDFGHKLMNPRST".split("");
  const seq = []; for (let i = 0; i < total + nb; i++) seq.push(i >= nb && Math.random() < 0.33 ? seq[i - nb] : pick(LET));
  let i = 0, t = 0, showT = 0, answered = false, right = 0, fb = null, btns = [];
  const isSame = () => i >= nb && seq[i] === seq[i - nb];
  function answer(same) {
    if (i < nb || answered) return;
    answered = true; const ok = same === isSame(); if (ok) right++; fb = ok; G._reps++; G.events.push(ok ? "success" : "error");
  }
  G.update = function (dt) {
    t += dt; showT += dt;
    const limit = i < nb ? 1.6 : answered ? 0.7 : { 1: 4, 2: 3, 3: 3.5 }[S.level] || 3;
    if (showT >= limit) {
      if (i >= nb && !answered) { G._reps++; fb = false; }
      i++; showT = 0; answered = false; fb = null;
      if (i >= seq.length) { G._reps = total; G.done = true; i = seq.length - 1; }
    }
  };
  G.pointer = (e) => { if (e.type !== "down") return; const k = btns.findIndex((r) => inRect(e.x, e.y, r)); if (k >= 0) answer(k === 0); };
  G.key = (k) => { if (k === "1") answer(true); if (k === "2") answer(false); };
  G.pad = (e) => answer(e.key === "Same"); G.padLabels = () => ["Same", "Different"];
  G.status = () => (i < nb ? { title: "Remember this letter", text: nb === 2 ? "Compare each new letter with the one two before it." : "Compare each new letter with the one before it." } : { title: nb === 2 ? "Same as two letters ago?" : "Same as the last letter?", text: `${G._reps} of ${total}` });
  G.stats = () => [["Correct", `${right} / ${total}`], ["Steps back", String(nb)]];
  G.debug = () => ({ same: isSame(), btns, i });
  G.draw = function (g, W, H) {
    bg(g, W, H, true); dots(g, W, total, G._reps);
    const cy = 150 + (H - 150) * 0.32;
    rr(g, W / 2 - 90, cy - 90, 180, 180, 24); g.fillStyle = fb === true ? alpha(T.go, 0.2) : fb === false ? alpha(T.accent, 0.2) : T.surface; g.fill();
    txt(g, seq[i], W / 2, cy + 4, 110, T.ink, { font: T.body });
    const bw = Math.min(260, W * 0.3), by = H - 140;
    btns = [{ x: W / 2 - bw - 12, y: by, w: bw, h: 90 }, { x: W / 2 + 12, y: by, w: bw, h: 90 }];
    ["Same", "Different"].forEach((l, k) => { const r = btns[k]; rr(g, r.x, r.y, r.w, r.h, 18); g.fillStyle = i < nb ? alpha(T.ink, 0.05) : T.surface; g.fill(); txt(g, l, r.x + r.w / 2, r.y + 45, 26, i < nb ? T.muted : T.ink, { font: T.body }); });
  };
  return G;
}

// ---- Number Span: watch the digits, then type them back; the length adapts
function NumberSpan(S) {
  const rounds = S.reps || 5, G = base(S, rounds);
  const kp = Keypad({ labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "←", "0", "OK"] });
  let len = { 1: 3, 2: 4, 3: 5 }[S.level] || 4, digits = [], phase = "watch", t = 0, typed = "", longest = 0, fb = null, fbT = 0;
  function newRound() { digits = Array.from({ length: len }, () => randInt(0, 9)); phase = "watch"; t = 0; typed = ""; }
  newRound();
  function press(k) {
    if (phase !== "type") return;
    if (k === "←") typed = typed.slice(0, -1);
    else if (k === "OK") submit();
    else { typed += k; if (typed.length === len) submit(); }
  }
  function submit() {
    const ok = typed === digits.join(""); fb = ok; fbT = 1.2; phase = "fb"; G._reps++;
    if (ok) { longest = Math.max(longest, len); len = Math.min(9, len + 1); G.events.push("success"); } else { len = Math.max(3, len - 1); G.events.push("error"); }
  }
  G.update = function (dt) {
    t += dt;
    if (phase === "watch" && t > digits.length * 1.0 + 0.4) phase = "type";
    if (phase === "fb") { fbT -= dt; if (fbT <= 0) { if (G._reps >= rounds) G.done = true; else newRound(); } }
  };
  G.pointer = (e) => { if (e.type === "down") { const k = kp.hit(e.x, e.y); if (k) press(k); } };
  G.pad = (e) => press(e.key);
  G.key = (k) => { if (/^[0-9]$/.test(k)) press(k); else if (k === "Enter") press("OK"); };
  G.status = () => (phase === "watch" ? { title: "Watch the numbers", text: `${len} digits` } : phase === "type" ? { title: "Type them in the same order", text: `${typed.length} of ${len}` } : fb ? { title: "Exactly right", text: "Next one is a digit longer.", tone: "good" } : { title: "Not quite", text: `It was ${digits.join(" ")}`, tone: "warn" });
  G.stats = () => [["Longest span", longest ? String(longest) : "–"], ["Rounds", `${G._reps} / ${rounds}`]];
  G.debug = () => ({ digits: digits.join(""), phase, rects: kp.rects });
  G.draw = function (g, W, H) {
    bg(g, W, H, true); dots(g, W, rounds, G._reps);
    const wide = W > 720, cx = wide ? W * 0.3 : W / 2, cy = wide ? H * 0.5 : 200;
    if (phase === "watch") { const k = Math.floor(t / 1.0); if (k < digits.length && t % 1.0 < 0.75) txt(g, String(digits[k]), cx, cy, 120, T.ink, { font: T.body }); }
    else txt(g, phase === "type" ? (typed.split("").join(" ") || "…") : digits.join(" "), cx, cy, 48, phase === "fb" ? (fb ? T.go : T["accent-ink"]) : T.ink, { font: T.body });
    kp.place(wide ? { x: W * 0.56, y: 140, w: W * 0.38, h: H - 160 } : { x: W / 2 - 160, y: 280, w: 320, h: H - 290 });
    if (phase === "type") kp.draw(g, null);
  };
  return G;
}

// ---- Study then pick: Word Recall and Shopping List share this
const WORDS = ["apple", "chair", "river", "candle", "garden", "window", "pencil", "basket", "mirror", "ladder", "button", "blanket", "kettle", "hammer", "pillow", "carrot", "ticket", "wallet", "bucket", "lemon", "rocket", "violin", "anchor", "tunnel", "saddle", "parrot", "jacket", "cactus", "magnet", "helmet"];
const GROCERIES = ["milk", "bread", "eggs", "butter", "cheese", "apples", "rice", "pasta", "soup", "tea", "coffee", "sugar", "honey", "yogurt", "carrots", "onions", "bananas", "oranges", "flour", "beans", "jam", "cereal", "tomatoes", "potatoes"];
function StudyPick(S, spec) {
  const rounds = S.reps || 1, count = spec.count[S.level] || spec.count[2], G = base(S, rounds);
  let targets = [], board = [], chosen = new Set(), phase = "study", t = 0, rects = [], doneBtn = null, recalled = 0, falsePicks = 0, totalT = 0;
  function newRound() {
    const pool = shuffle(spec.bank); targets = pool.slice(0, count);
    board = shuffle(targets.concat(pool.slice(count, count * 2))); chosen = new Set(); phase = "study"; t = 0;
  }
  newRound();
  function submit() {
    for (const w of chosen) targets.includes(w) ? recalled++ : falsePicks++;
    totalT += targets.length; G._reps++; G.events.push("success");
    if (G._reps >= rounds) G.done = true; else newRound();
  }
  G.update = (dt) => { t += dt; if (phase === "study" && t > count * spec.perItem + 2) phase = "pick"; };
  G.pointer = (e) => {
    if (e.type !== "down") return;
    if (doneBtn && inRect(e.x, e.y, doneBtn)) { if (phase === "study") phase = "pick"; else submit(); return; }
    if (phase !== "pick") return;
    const i = rects.findIndex((r) => inRect(e.x, e.y, r)); if (i < 0) return;
    const w = board[i]; chosen.has(w) ? chosen.delete(w) : chosen.add(w);
  };
  G.status = () => (phase === "study" ? { title: spec.studyTitle, text: `${count} ${spec.noun} · ${Math.max(0, Math.ceil(count * spec.perItem + 2 - t))} s` } : { title: spec.pickTitle, text: `${chosen.size} picked · tap Done when finished` });
  G.stats = () => [[spec.rightLabel, `${recalled} / ${totalT}`], ["Picked by mistake", String(falsePicks)]];
  G.debug = () => ({ phase, targets, board, rects, doneBtn });
  G.draw = function (g, W, H) {
    bg(g, W, H, true); dots(g, W, rounds, G._reps);
    const list = phase === "study" ? targets : board, cols = phase === "study" ? Math.min(3, list.length) : 4, gap = 12;
    const cw = Math.min(220, (W - 80 - gap * (cols - 1)) / cols), chh = 64, rows = Math.ceil(list.length / cols);
    const x0 = W / 2 - (cw * cols + gap * (cols - 1)) / 2, y0 = 150 + Math.max(0, (H - 240 - rows * (chh + gap)) / 2);
    rects = list.map((_, i) => ({ x: x0 + (i % cols) * (cw + gap), y: y0 + Math.floor(i / cols) * (chh + gap), w: cw, h: chh }));
    list.forEach((w, i) => {
      const r = rects[i], on = phase === "pick" && chosen.has(w);
      rr(g, r.x, r.y, r.w, r.h, 14); g.fillStyle = on ? alpha(T.go, 0.2) : T.surface; g.fill();
      if (on) { g.strokeStyle = T.go; g.lineWidth = 3; g.stroke(); }
      if (spec.swatch) { g.beginPath(); g.arc(r.x + 26, r.y + r.h / 2, 10, 0, TAU); g.fillStyle = COLORS[spec.bank.indexOf(w) % COLORS.length]; g.fill(); }
      txt(g, w, r.x + r.w / 2 + (spec.swatch ? 12 : 0), r.y + r.h / 2, 22, T.ink, { font: T.body });
    });
    doneBtn = { x: W / 2 - 110, y: H - 76, w: 220, h: 56 };
    rr(g, doneBtn.x, doneBtn.y, doneBtn.w, doneBtn.h, 16); g.fillStyle = T.go; g.fill();
    txt(g, phase === "study" ? "I'm ready" : "Done", W / 2, doneBtn.y + 28, 22, T.surface, { font: T.body });
  };
  return G;
}

// ---- Names & Faces: study faces with names, then name each face
const NAMES = ["Rosa", "Kofi", "Hana", "Malik", "Ines", "Tom", "Priya", "Lars", "Amara", "Diego", "Yuki", "Omar"];
const SKIN = ["#f1c9a5", "#d9a47c", "#a86b45", "#7a4a2b", "#e8b48f", "#c08a5f"];
const HAIR = ["#2b1d14", "#7a4a1d", "#c9a14a", "#9b9b9b", "#a2361f", "#111111"];
function face(g, f, cx, cy, s) {
  g.fillStyle = HAIR[f.hair]; g.beginPath();
  if (f.style === 0) g.arc(cx, cy - s * 0.08, s * 0.58, Math.PI, TAU); else if (f.style === 1) g.ellipse(cx, cy - s * 0.05, s * 0.62, s * 0.7, 0, 0, TAU); else { g.ellipse(cx, cy - s * 0.3, s * 0.5, s * 0.34, 0, Math.PI, TAU); }
  g.fill();
  g.fillStyle = SKIN[f.skin]; g.beginPath(); g.ellipse(cx, cy + s * 0.05, s * 0.45, s * 0.55, 0, 0, TAU); g.fill();
  g.fillStyle = "#1d1d1d"; for (const dx of [-0.17, 0.17]) { g.beginPath(); g.arc(cx + dx * s, cy - s * 0.02, s * 0.05, 0, TAU); g.fill(); }
  if (f.glasses) { g.strokeStyle = "#1d1d1d"; g.lineWidth = Math.max(2, s * 0.03); for (const dx of [-0.17, 0.17]) { g.beginPath(); g.arc(cx + dx * s, cy - s * 0.02, s * 0.11, 0, TAU); g.stroke(); } }
  g.strokeStyle = "#5a2d2d"; g.lineWidth = Math.max(2, s * 0.03); g.beginPath(); g.arc(cx, cy + s * 0.18, s * 0.14, 0.2, Math.PI - 0.2); g.stroke();
  if (f.beard) { g.fillStyle = HAIR[f.hair]; g.beginPath(); g.ellipse(cx, cy + s * 0.42, s * 0.3, s * 0.16, 0, 0, Math.PI); g.fill(); }
}
function NamesFaces(S) {
  const count = { 1: 3, 2: 4, 3: 6 }[S.level] || 4;
  const people = shuffle(NAMES).slice(0, count).map((name, i) => ({ name, skin: (i * 2 + randInt(0, 5)) % 6, hair: (i + randInt(0, 5)) % 6, style: i % 3, glasses: Math.random() < 0.4, beard: Math.random() < 0.3 }));
  let phase = "study", t = 0, readyBtn = null;
  const order = shuffle(people);
  const quiz = Quiz(S, {
    rounds: count,
    round: (i) => {
      const p = order[i], opts = shuffle([p.name].concat(shuffle(people.filter((q) => q !== p).map((q) => q.name)).slice(0, Math.min(3, count - 1))));
      return { title: "What is this person's name?", options: opts, answer: opts.indexOf(p.name), explain: `This is ${p.name}.`, draw: (g, A) => face(g, p, A.x + A.w / 2, A.y + A.h / 2 + 6, Math.min(A.h * 0.42, 110)) };
    },
  });
  const G = Object.create(quiz);
  G.update = function (dt, a) { t += dt; if (phase === "study") { if (t > count * 4 + 2) phase = "quiz"; return; } quiz.update.call(quiz, dt, a); G.done = quiz.done; G._reps = quiz._reps; };
  G.pointer = (e) => { if (phase === "study") { if (e.type === "down" && readyBtn && inRect(e.x, e.y, readyBtn)) phase = "quiz"; return; } quiz.pointer(e); };
  G.key = (k) => { if (phase === "quiz") quiz.key(k); };
  G.status = () => (phase === "study" ? { title: "Learn each name", text: `${Math.max(0, Math.ceil(count * 4 + 2 - t))} s · tap I'm ready when you know them` } : quiz.status());
  G.reps = () => quiz.reps(); G.goal = () => quiz.goal(); G.stats = () => quiz.stats();
  Object.defineProperty(G, "events", { get: () => quiz.events });
  G.draw = function (g, W, H, a, tt) {
    if (phase !== "study") { quiz.draw(g, W, H, a, tt); return; }
    bg(g, W, H, true);
    const cols = Math.min(count, 3), rows = Math.ceil(count / cols), cw = Math.min(220, (W - 80) / cols), chh = Math.min(220, (H - 260) / rows);
    const x0 = W / 2 - (cw * cols) / 2;
    people.forEach((p, i) => { const cx = x0 + (i % cols) * cw + cw / 2, cy = 160 + Math.floor(i / cols) * chh + chh * 0.42; face(g, p, cx, cy, Math.min(cw, chh) * 0.32); txt(g, p.name, cx, cy + Math.min(cw, chh) * 0.42, 22, T.ink, { font: T.body }); });
    readyBtn = { x: W / 2 - 110, y: H - 76, w: 220, h: 56 };
    rr(g, readyBtn.x, readyBtn.y, readyBtn.w, readyBtn.h, 16); g.fillStyle = T.go; g.fill();
    txt(g, "I'm ready", W / 2, readyBtn.y + 28, 22, T.surface, { font: T.body });
  };
  G.debug = () => Object.assign({ phase, readyBtn }, quiz.debug());
  return G;
}

const brain = { control: "touch", mount: "" };
[
  Object.assign({ id: "pairs", name: "Card Pairs", movement: "Visual memory", cursor: true,
    desc: "Flip two cards at a time and find all the matching pairs.", source: "RehaCom figural memory; concentration-style memory games in stroke cognitive training.",
    params: { reps: null, level: [1, 2, 3], durationS: null }, defaults: { reps: null, level: 1, durationS: null },
    how: ["Tap a card to turn it over.", "Tap a second card. If they match, they stay up.", "Remember where each picture was."], make: CardPairs }, brain),
  Object.assign({ id: "nback", name: "N-Back", movement: "Working memory", pad: "keys",
    desc: "Say whether each letter is the same as the one before (or two before, on level 3).", source: "N-back working-memory training (Cogmed-style programs) after stroke.",
    params: { reps: [15, 20, 30], level: [1, 2, 3], durationS: null }, defaults: { reps: 20, level: 1, durationS: null },
    how: ["Watch the letter in the box.", "Tap Same if it matches the earlier letter.", "Otherwise tap Different."], make: NBack }, brain),
  Object.assign({ id: "span", name: "Number Span", movement: "Short-term memory", pad: "keys",
    desc: "Watch a string of digits, then type it back. It gets longer when you get it right.", source: "Digit span; RehaCom working memory.",
    params: { reps: [5, 8, 10], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null },
    how: ["Watch the digits appear one at a time.", "Type them back in the same order.", "Each right answer adds a digit."], make: NumberSpan }, brain),
  Object.assign({ id: "wordlist", name: "Word Recall", movement: "Verbal memory",
    desc: "Study a list of words, then pick them out from a larger list.", source: "RehaCom verbal memory; word-list learning tasks.",
    params: { reps: [1, 2, 3], level: [1, 2, 3], durationS: null }, defaults: { reps: 1, level: 1, durationS: null },
    how: ["Read each word and try to remember it.", "Tap I'm ready when you know them.", "Pick the words you studied, then tap Done."],
    make: (S) => StudyPick(S, { bank: WORDS, count: { 1: 5, 2: 7, 3: 9 }, perItem: 2.5, noun: "words", studyTitle: "Remember these words", pickTitle: "Which words were on the list?", rightLabel: "Words remembered" }) }, brain),
  Object.assign({ id: "shopping", name: "Shopping List", movement: "Everyday memory",
    desc: "Memorise a shopping list, then fill the basket from the shelves.", source: "Everyday memory training (prospective and list memory) in stroke rehabilitation.",
    params: { reps: [1, 2, 3], level: [1, 2, 3], durationS: null }, defaults: { reps: 1, level: 1, durationS: null },
    how: ["Read the shopping list.", "Tap I'm ready.", "Tap each item from your list on the shelves, then tap Done."],
    make: (S) => StudyPick(S, { bank: GROCERIES, count: { 1: 4, 2: 6, 3: 8 }, perItem: 2.5, noun: "items", swatch: true, studyTitle: "Your shopping list", pickTitle: "Fill your basket", rightLabel: "Items bought" }) }, brain),
  Object.assign({ id: "faces", name: "Names & Faces", movement: "Face–name memory",
    desc: "Learn a few people's names, then name each face.", source: "RehaCom physiognomic memory; face–name association training.",
    params: { reps: null, level: [1, 2, 3], durationS: null }, defaults: { reps: null, level: 1, durationS: null },
    how: ["Look at each face and its name.", "Tap I'm ready when you know them.", "Pick the right name for each face."], make: NamesFaces }, brain),
].forEach((d) => RC.register(Object.assign({ section: "memory" }, d)));

defineArt("pairs", '<rect x="24" y="12" width="20" height="26" rx="4" fill="var(--a-brain)"/><rect x="50" y="12" width="20" height="26" rx="4" fill="var(--a-bg)"/><circle cx="60" cy="25" r="6" fill="var(--a-hi)"/><rect x="76" y="12" width="20" height="26" rx="4" fill="var(--a-bg)"/><circle cx="86" cy="25" r="6" fill="var(--a-hi)"/>');
defineArt("nback", '<rect x="26" y="14" width="26" height="30" rx="5" fill="var(--a-bg)"/><text x="39" y="35" font-size="18" font-weight="700" text-anchor="middle" fill="var(--a-ink)">K</text><rect x="64" y="14" width="26" height="30" rx="5" fill="var(--a-bg)" stroke="var(--a-go)" stroke-width="2"/><text x="77" y="35" font-size="18" font-weight="700" text-anchor="middle" fill="var(--a-ink)">K</text>');
defineArt("span", '<text x="60" y="38" font-size="20" font-weight="700" text-anchor="middle" fill="var(--a-ink)" letter-spacing="3">4 7 2 9</text>');
defineArt("wordlist", '<rect x="34" y="8" width="52" height="48" rx="6" fill="var(--a-bg)"/><path d="M42 20 h34 M42 30 h28 M42 40 h32" stroke="var(--a-mute)" stroke-width="3" stroke-linecap="round"/>');
defineArt("shopping", '<path d="M34 22 h52 l-6 26 h-40z" fill="var(--a-bg)" stroke="var(--a-ink)" stroke-width="2"/><circle cx="48" cy="54" r="3" fill="var(--a-ink)"/><circle cx="74" cy="54" r="3" fill="var(--a-ink)"/><circle cx="52" cy="32" r="5" fill="var(--a-hi)"/><circle cx="66" cy="34" r="5" fill="var(--a-go)"/>');
defineArt("faces", '<circle cx="46" cy="30" r="13" fill="#e8b48f"/><path d="M33 26 a13 13 0 0 1 26 0" fill="#2b1d14"/><circle cx="80" cy="30" r="13" fill="#a86b45"/><path d="M67 27 a13 13 0 0 1 26 0" fill="#9b9b9b"/><rect x="34" y="48" width="24" height="7" rx="3" fill="var(--a-mute)" opacity=".4"/><rect x="68" y="48" width="24" height="7" rx="3" fill="var(--a-mute)" opacity=".4"/>');
})();
