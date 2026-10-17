// Hand & fingers: touch exercises (the phone becomes the tap pad when paired) and guided hand work.
(() => {
"use strict";
const RC = window.RC;
const { clamp, lerp, TAU, T, alpha, txt, rr, fmtTime } = RC;
const { base, bg, dots, Keypad, Guided, randInt, inRect, defineArt } = RC.kit;
const FINGERS = ["Index", "Middle", "Ring", "Little"];

// Vertical lanes across the stage; lane i answers to phone key / keyboard key String(i + 1).
function laneRects(W, H, n, top = 150) {
  const gap = 12, w = Math.min(160, (W * 0.7 - gap * (n - 1)) / n), x0 = W / 2 - (w * n + gap * (n - 1)) / 2;
  return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (w + gap), y: top, w, h: H - top - 30 }));
}

// ---- Finger Tap: tap the lit lane as fast as you can
function FingerTap(S) {
  const dur = S.durationS || 20, n = { 1: 1, 2: 2, 3: 4 }[S.level] || 2, G = base(S, 1);
  let t = 0, lit = 0, taps = 0, misses = 0, rects = [], flashT = 0;
  function press(i) {
    if (G.done) return;
    if (i === lit) { taps++; flashT = 0.12; if (n > 1) { let k; do { k = randInt(0, n - 1); } while (k === lit && n > 1); lit = k; } }
    else misses++;
  }
  G.update = function (dt) { t += dt; flashT = Math.max(0, flashT - dt); if (t >= dur) { this._reps = 1; this.done = true; } };
  G.pointer = (e) => { if (e.type !== "down") return; const i = rects.findIndex((r) => inRect(e.x, e.y, r)); if (i >= 0) press(i); };
  G.pad = (e) => press(Number(e.key) - 1);
  G.key = (k) => { if (/^[1-4]$/.test(k)) press(Number(k) - 1); };
  G.padLabels = () => FINGERS.slice(0, n).map((_, i) => String(i + 1));
  G.status = () => ({ title: n === 1 ? "Tap as fast as you can" : "Tap the lit lane", text: `${fmtTime(Math.max(0, dur - t))} left · ${taps} taps` });
  G.stats = () => [["Taps", String(taps)], ["Taps per second", (taps / Math.max(1, Math.min(t, dur))).toFixed(1)], ["Wrong lane", String(misses)]];
  G.debug = () => ({ lit, rects, taps });
  G.draw = function (g, W, H) {
    bg(g, W, H); rects = laneRects(W, H, n);
    rects.forEach((r, i) => { rr(g, r.x, r.y, r.w, r.h, 18); g.fillStyle = i === lit ? (flashT > 0 ? T.go : T.accent) : alpha(T.ink, 0.06); g.fill(); txt(g, n === 1 ? "Tap" : FINGERS[i], r.x + r.w / 2, r.y + r.h - 28, 16, i === lit ? T.surface : T.muted, { font: T.body }); });
    g.strokeStyle = T.go; g.lineWidth = 8; g.lineCap = "round"; g.beginPath(); g.moveTo(W * 0.2, 130); g.lineTo(lerp(W * 0.2, W * 0.8, clamp(1 - t / dur, 0, 1)), 130); g.stroke(); g.lineCap = "butt";
  };
  return G;
}

// ---- Finger Rhythm: notes fall toward a line; tap the matching lane when they reach it
function FingerRhythm(S) {
  const total = S.reps || 20, win = { 1: 0.2, 2: 0.15, 3: 0.1 }[S.level] || 0.15, speed = { 1: 0.45, 2: 0.6, 3: 0.75 }[S.level] || 0.6, G = base(S, total);
  const notes = Array.from({ length: total }, (_, i) => ({ t: 2 + i * 0.95, lane: randInt(0, 3), hit: null }));
  let t = 0, streak = 0, best = 0, rects = [], hitY = 0, top = 150;
  function press(i) {
    const nt = notes.find((x) => x.hit === null && x.lane === i && Math.abs(x.t - t) <= win);
    if (nt) { nt.hit = true; streak++; best = Math.max(best, streak); G._reps++; G.events.push("tick"); } else streak = 0;
  }
  G.update = function (dt) {
    t += dt;
    for (const x of notes) if (x.hit === null && t - x.t > win) { x.hit = false; streak = 0; }
    if (notes.every((x) => x.hit !== null)) this.done = true;
  };
  G.pointer = (e) => { if (e.type !== "down") return; const i = rects.findIndex((r) => inRect(e.x, e.y, r)); if (i >= 0) press(i); };
  G.pad = (e) => press(Number(e.key) - 1);
  G.key = (k) => { if (/^[1-4]$/.test(k)) press(Number(k) - 1); };
  G.padLabels = () => ["1", "2", "3", "4"];
  G.status = () => ({ title: "Tap when a note reaches the line", text: streak > 2 ? `${streak} in a row` : "Match the lane of each note." });
  G.stats = () => { const hits = notes.filter((x) => x.hit).length; return [["Notes hit", `${hits} / ${total}`], ["Hit rate", `${Math.round((hits / total) * 100)}%`], ["Longest streak", String(best)]]; };
  G.debug = () => ({ t, notes, rects, win });
  G.draw = function (g, W, H) {
    bg(g, W, H); rects = laneRects(W, H, 4, top); hitY = H - 90;
    rects.forEach((r, i) => { rr(g, r.x, r.y, r.w, r.h, 18); g.fillStyle = alpha(T.ink, 0.05); g.fill(); txt(g, FINGERS[i], r.x + r.w / 2, r.y + r.h - 18, 14, T.muted, { font: T.body, weight: 400 }); });
    g.fillStyle = alpha(T.go, 0.3); g.fillRect(rects[0].x, hitY - 4, rects[3].x + rects[3].w - rects[0].x, 8);
    for (const x of notes) {
      if (x.hit === true) continue;
      const y = hitY - (x.t - t) * speed * (H - top);
      if (y < top - 30 || y > H) continue;
      const r = rects[x.lane]; g.beginPath(); g.arc(r.x + r.w / 2, y, Math.min(28, r.w * 0.3), 0, TAU); g.fillStyle = x.hit === false ? alpha(T.ink, 0.15) : T.accent; g.fill();
    }
  };
  return G;
}

// ---- Dial a Number: type the number shown (level 3 hides it after 3 seconds)
function DialNumber(S) {
  const len = { 1: 7, 2: 10, 3: 10 }[S.level] || 10, G = base(S, S.reps || 3);
  const kp = Keypad({ labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "←", "0", "OK"] });
  let target = "", typed = "", shownT = 0, t = 0, correct = 0, digitsRight = 0, digitsAll = 0, lit = null, litT = 0, feedback = null, fbT = 0;
  const newNumber = () => { target = Array.from({ length: len }, (_, i) => (i === 0 ? randInt(2, 9) : randInt(0, 9))).join(""); typed = ""; shownT = 0; };
  newNumber();
  function press(k) {
    if (G.done || fbT > 0) return;
    lit = k; litT = 0.15;
    if (k === "←") typed = typed.slice(0, -1);
    else if (k === "OK" || typed.length >= len) submit();
    else { typed += k; if (typed.length === len) submit(); }
  }
  function submit() {
    for (let i = 0; i < len; i++) { digitsAll++; if (typed[i] === target[i]) digitsRight++; }
    const ok = typed === target; if (ok) correct++;
    G._reps++; G.events.push(ok ? "success" : "error"); feedback = ok; fbT = 1.1;
  }
  G.update = function (dt) {
    t += dt; shownT += dt; litT = Math.max(0, litT - dt);
    if (fbT > 0) { fbT -= dt; if (fbT <= 0) { if (G._reps >= G.goal()) G.done = true; else newNumber(); } }
  };
  G.pointer = (e) => { if (e.type === "down") { const k = kp.hit(e.x, e.y); if (k) press(k); } };
  G.pad = (e) => press(e.key);
  G.key = (k) => { if (/^[0-9]$/.test(k)) press(k); else if (k === "Enter") press("OK"); };
  const hidden = () => S.level === 3 && shownT > 3 && fbT <= 0;
  G.status = () => (fbT > 0 ? { title: feedback ? "That's the number" : "Not quite", text: `It was ${target}`, tone: feedback ? "good" : "warn" } : { title: hidden() ? "Type the number from memory" : "Type this number", text: `${G._reps + 1} of ${G.goal()}` });
  G.stats = () => [["Numbers right", `${correct} / ${G._reps}`], ["Digits right", digitsAll ? `${Math.round((digitsRight / digitsAll) * 100)}%` : "–"], ["Time", fmtTime(t)]];
  G.debug = () => ({ target, typed, rects: kp.rects });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, G.goal(), G._reps);
    const fmt = (s) => s.replace(/^(\d{3})(\d{3})(\d*)$/, "$1 $2 $3").trim();
    // number and typed digits on the left, a large keypad on the right (stacked on narrow stages)
    const wide = W > 720, cx = wide ? W * 0.3 : W / 2, fw = wide ? W * 0.44 : Math.min(440, W - 40);
    txt(g, hidden() ? "•".repeat(len) : fmt(target), cx, wide ? H * 0.42 : 175, Math.min(46, fw / 9), T.ink, { font: T.body });
    rr(g, cx - fw / 2, (wide ? H * 0.42 : 175) + 36, fw, 60, 14); g.fillStyle = T.surface; g.fill();
    txt(g, typed ? fmt(typed) : " ", cx, (wide ? H * 0.42 : 175) + 66, 32, T.ink, { font: T.body });
    kp.place(wide ? { x: W * 0.56, y: 140, w: W * 0.38, h: H - 160 } : { x: W / 2 - 170, y: 300, w: 340, h: H - 310 }); kp.draw(g, litT > 0 ? lit : null);
  };
  return G;
}

// ---- Pinch & Place: drag small items into the box
function PinchPlace(S) {
  const size = { 1: 48, 2: 36, 3: 28 }[S.level] || 36, G = base(S, S.reps);
  let items = [], drag = null, box = { x: 0, y: 0, w: 0, h: 0 }, misses = 0, W0 = 0, H0 = 0, placed = 0;
  function spawn(W, H) { items = Array.from({ length: Math.min(6, S.reps - placed) }, () => ({ x: randInt(60, Math.max(80, W * 0.55)), y: randInt(170, Math.max(190, H - 70)) })); }
  G.update = function () {};
  G.pointer = (e) => {
    if (e.type === "down") { const i = items.findIndex((it) => Math.hypot(it.x - e.x, it.y - e.y) < size); if (i >= 0) drag = { i, ox: e.x - items[i].x, oy: e.y - items[i].y, sx: items[i].x, sy: items[i].y }; }
    else if (e.type === "move" && drag) { items[drag.i].x = e.x - drag.ox; items[drag.i].y = e.y - drag.oy; }
    else if (e.type === "up" && drag) {
      const it = items[drag.i];
      if (inRect(it.x, it.y, box)) { items.splice(drag.i, 1); placed++; G._reps = placed; G.events.push("success"); if (placed >= S.reps) G.done = true; else if (!items.length) spawn(W0, H0); }
      else { misses++; it.x = drag.sx; it.y = drag.sy; }
      drag = null;
    }
  };
  G.status = () => ({ title: "Pinch an item and drag it into the box", text: `${placed} of ${S.reps} placed` });
  G.stats = () => [["Placed", `${placed} / ${S.reps}`], ["Dropped outside", String(misses)]];
  G.debug = () => ({ items, box, size });
  G.draw = function (g, W, H) {
    if (W !== W0 || H !== H0) { W0 = W; H0 = H; if (!items.length) spawn(W, H); }
    bg(g, W, H); dots(g, W, S.reps, placed);
    box = { x: W * 0.68, y: H * 0.35, w: W * 0.24, h: H * 0.42 };
    rr(g, box.x, box.y, box.w, box.h, 20); g.fillStyle = alpha(T.go, 0.12); g.fill(); g.setLineDash([10, 8]); g.strokeStyle = T.go; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
    items.forEach((it, i) => { g.beginPath(); g.arc(it.x, it.y, size / 2, 0, TAU); g.fillStyle = drag && drag.i === i ? T.go : T.accent; g.fill(); });
  };
  return G;
}

const guided = (steps, opts) => (S) => Guided(S, Object.assign({ steps }, opts));
const REPS = { params: { reps: [10, 15, 20], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } };
const TIME = { params: { reps: null, level: [1, 2, 3], durationS: [120, 180, 300] }, defaults: { reps: null, level: 1, durationS: 120 } };
const touch = { control: "touch", mount: "" };

[
  Object.assign({ id: "tap", name: "Finger Tap", movement: "Finger speed · tapping", pad: "fingers", cursor: false,
    desc: "Tap the lit lane as fast as you can until the time runs out.", source: "mRehab Quick Tap; Reha@Stroke touch exercises.",
    params: { reps: null, level: [1, 2, 3], durationS: [20, 30, 60] }, defaults: { reps: null, level: 1, durationS: 20 },
    how: ["Rest your hand by the screen or the phone.", "Tap the lit lane with your affected hand.", "Level 2 and 3 move the light between fingers."], make: FingerTap }, touch),
  Object.assign({ id: "rhythm", name: "Finger Rhythm", movement: "Finger sequencing · timing", pad: "fingers",
    desc: "Tap the lane of each falling note as it reaches the line.", source: "MusicGlove rhythm game (finger–thumb opposition).",
    params: { reps: [10, 20, 30], level: [1, 2, 3], durationS: null }, defaults: { reps: 20, level: 1, durationS: null },
    how: ["Put one finger over each lane.", "Watch the notes fall.", "Tap the matching lane as each note reaches the green line."], make: FingerRhythm }, touch),
  Object.assign({ id: "dial", name: "Dial a Number", movement: "Finger accuracy · number memory", pad: "keys",
    desc: "Type the phone number you see. On level 3 it disappears after 3 seconds.", source: "mRehab Phone Number.",
    params: { reps: [3, 5, 8], level: [1, 2, 3], durationS: null }, defaults: { reps: 3, level: 1, durationS: null },
    how: ["Read the number.", "Type it on the keypad with your affected hand.", "Use ← to fix a mistake."], make: DialNumber }, touch),
  Object.assign({ id: "pinch", name: "Pinch & Place", movement: "Pinch grip · precise placing",
    desc: "Pinch small items and drag them into the box. Higher levels use smaller items.", source: "MusicGlove pincer grip; GRASP fine motor tasks.",
    params: { reps: [6, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 6, level: 1, durationS: null },
    how: ["Use your affected hand on the touchscreen or trackpad.", "Press on an item and drag it.", "Let go inside the green box."], make: PinchPlace }, touch),
  Object.assign({ id: "grip", name: "Grip & Release", movement: "Whole-hand grasp", pad: "done", desc: "Squeeze a soft ball or rolled towel, then open your hand wide.", source: "FitMi gross grasp; GRASP hand strengthening.",
    how: ["Hold a soft ball or rolled-up towel.", "Squeeze for a slow count of three.", "Open your fingers wide, then press Done."], make: guided(["Squeeze for three", "Open your hand wide", "Rest a moment"], {}) }, REPS),
  Object.assign({ id: "putty", name: "Putty Squeeze", movement: "Grip strength", pad: "done", desc: "Squeeze therapy putty or play dough in your fist, then roll it out.", source: "GRASP hand strengthening with therapy putty.",
    how: ["Hold a ball of putty in your affected hand.", "Squeeze it as hard as is comfortable.", "Roll it back into a ball, then press Done."], make: guided(["Squeeze the putty", "Roll it into a ball", "Rest"], {}) }, REPS),
  Object.assign({ id: "curls", name: "Finger Curls", movement: "Finger flexion and extension", pad: "done", desc: "Curl your fingers into a hook, then straighten them.", source: "FitMi finger curl; RAPAEL finger flexion and extension.",
    how: ["Rest your forearm on the table, palm up.", "Bend your fingers into a hook, keeping the knuckles straight.", "Straighten them fully, then press Done."], make: guided(["Curl into a hook", "Straighten fully", "Rest"], {}) }, REPS),
  Object.assign({ id: "thumbs", name: "Thumb Touches", movement: "Finger–thumb opposition", pad: "done", desc: "Touch your thumb to each fingertip in turn.", source: "MusicGlove finger–thumb opposition; key-pinch grip.",
    how: ["Hold your affected hand up, palm facing you.", "Touch your thumb to each fingertip, index to little.", "That's one. Press Done and repeat."], make: guided(["Thumb to index", "Thumb to middle", "Thumb to ring", "Thumb to little"], {}) }, REPS),
  Object.assign({ id: "clothespin", name: "Clothespins", movement: "Pinch strength · hand skill", pad: "done", desc: "Pinch clothespins open and clip them onto the edge of a box or cup.", source: "GRASP hand skills (clothespins).",
    how: ["Put a box or cup and some clothespins on the table.", "Pinch a clothespin open with your affected hand.", "Clip it on the edge; take them off again."], make: guided(["Clip pins onto the edge", "Take them off one by one", "Clip them back in a new spot"], { mode: "time" }) }, TIME),
  Object.assign({ id: "coins", name: "Coins", movement: "Fine pinch · picking up", pad: "done", desc: "Pick up coins one at a time and drop them into a cup.", source: "GRASP hand skills (coins).",
    how: ["Spread some coins on the table next to a cup.", "Pick them up one at a time with your affected hand.", "Drop them in the cup, then tip them out and repeat."], make: guided(["Pick up coins into the cup", "Flip coins over where they lie", "Stack coins into a tower"], { mode: "time" }) }, TIME),
  Object.assign({ id: "buttons", name: "Buttons", movement: "Two-handed fine motor · dressing", pad: "done", desc: "Do up and undo the buttons on a shirt.", source: "GRASP hand skills (buttoned shirt).",
    how: ["Lay a buttoned shirt on the table or wear one.", "Undo the buttons using both hands.", "Do them up again."], make: guided(["Undo the buttons", "Do them up again", "Try with your eyes on the button only"], { mode: "time" }) }, TIME),
  Object.assign({ id: "knifefork", name: "Knife & Fork", movement: "Utensil use · bilateral control", pad: "done", desc: "Practise cutting soft food or play dough with a knife and fork.", source: "GRASP hand skills (knife and fork); RAPAEL cutting vegetables.",
    how: ["Put play dough or soft food on a plate.", "Hold the fork in one hand and the knife in the other.", "Cut small pieces, then switch hands if you can."], make: guided(["Hold the food with the fork", "Cut small pieces", "Spear a piece and lift it"], { mode: "time" }) }, TIME),
].forEach((d) => RC.register(Object.assign({ section: "hand", control: "guided", mount: "" }, d)));

defineArt("tap", '<rect x="26" y="10" width="14" height="44" rx="5" fill="var(--a-mute)" opacity=".2"/><rect x="45" y="10" width="14" height="44" rx="5" fill="var(--a-hi)"/><rect x="64" y="10" width="14" height="44" rx="5" fill="var(--a-mute)" opacity=".2"/><rect x="83" y="10" width="14" height="44" rx="5" fill="var(--a-mute)" opacity=".2"/>');
defineArt("rhythm", '<path d="M24 50 H96" stroke="var(--a-go)" stroke-width="3"/><circle cx="36" cy="44" r="6" fill="var(--a-hi)"/><circle cx="60" cy="26" r="6" fill="var(--a-hi)"/><circle cx="84" cy="12" r="6" fill="var(--a-hi)"/>');
defineArt("dial", Array.from({ length: 9 }, (_, i) => `<rect x="${40 + (i % 3) * 14}" y="${8 + Math.floor(i / 3) * 16}" width="11" height="12" rx="3" fill="${i === 4 ? "var(--a-hi)" : "var(--a-mute)"}" opacity="${i === 4 ? 1 : 0.3}"/>`).join(""));
defineArt("pinch", '<rect x="74" y="16" width="30" height="34" rx="7" fill="var(--a-go)" opacity=".15" stroke="var(--a-go)" stroke-dasharray="4 3"/><circle cx="30" cy="38" r="6" fill="var(--a-hi)"/><circle cx="48" cy="22" r="6" fill="var(--a-hi)"/><circle cx="86" cy="34" r="6" fill="var(--a-hi)"/>');
const handArt = (extra) => `<path d="M42 54 V28 a5 5 0 0 1 10 0 V22 a5 5 0 0 1 10 0 V24 a5 5 0 0 1 10 0 V30 a5 5 0 0 1 10 0 V44 c0 8 -6 12 -14 12 h-12 c-8 0 -14 -2 -14 -2z" fill="var(--a-mute)" opacity=".28"/>${extra}`;
defineArt("grip", handArt('<circle cx="62" cy="44" r="9" fill="var(--a-hi)"/>'));
defineArt("putty", handArt('<ellipse cx="62" cy="46" rx="12" ry="7" fill="var(--a-hi)"/>'));
defineArt("curls", handArt('<path d="M88 30 q8 10 0 18" stroke="var(--a-hi)" stroke-width="3" fill="none" stroke-linecap="round"/>'));
defineArt("thumbs", handArt('<circle cx="47" cy="25" r="4" fill="var(--a-hi)"/><circle cx="57" cy="19" r="4" fill="var(--a-hi)" opacity=".5"/>'));
defineArt("clothespin", '<rect x="20" y="40" width="80" height="14" rx="3" fill="var(--a-mute)" opacity=".25"/><rect x="40" y="18" width="6" height="28" rx="2" fill="var(--a-hi)"/><rect x="58" y="18" width="6" height="28" rx="2" fill="var(--a-hi)"/><rect x="76" y="18" width="6" height="28" rx="2" fill="var(--a-hi)" opacity=".4"/>');
defineArt("coins", '<path d="M74 22 h24 l-3 30 h-18z" fill="var(--a-mute)" opacity=".25"/><circle cx="32" cy="44" r="7" fill="var(--a-hi)"/><circle cx="50" cy="40" r="7" fill="var(--a-hi)" opacity=".7"/><circle cx="86" cy="18" r="6" fill="var(--a-hi)"/>');
defineArt("buttons", '<path d="M40 8 h40 v48 h-40z" fill="var(--a-mute)" opacity=".2"/><path d="M60 8 v48" stroke="var(--a-ink)" stroke-width="1.5"/>' + [18, 32, 46].map((y) => `<circle cx="60" cy="${y}" r="4" fill="var(--a-hi)"/>`).join(""));
defineArt("knifefork", '<ellipse cx="60" cy="40" rx="34" ry="12" fill="var(--a-mute)" opacity=".2"/><path d="M42 10 v40 M38 10 v12 M46 10 v12" stroke="var(--a-ink)" stroke-width="2.5" stroke-linecap="round"/><path d="M80 10 q8 14 0 26 v14" stroke="var(--a-ink)" stroke-width="2.5" fill="none" stroke-linecap="round"/>');
})();
