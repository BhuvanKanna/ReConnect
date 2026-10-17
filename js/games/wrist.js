(() => {
"use strict";
const RC = window.RC;
const { $, clamp, lerp, TAU, reduceMotion, store, settings, saveSettings, T, alpha, txt, rr, chime, esc, fmtTime, Game, readTheme } = RC;
const { base, drawGonio } = RC.kit;
// ---- 2. Pour the Tea: controlled supination/pronation --------------------------
function PourTea(S) {
  const amp = S.amp, G = base(S, S.reps);
  const thr = amp * 0.55, vmax = { 1: 55, 2: 70, 3: 85 }[S.level];
  let cup = 0, fill = 0, state = "pour", prevR = 0, vel = 0, spills = 0, overT = 0, drops = [], spillFlash = 0, pourTime = 0;
  const dir = () => (cup % 2 === 0 ? 1 : -1);
  G.update = function (dt, a) {
    const r = a.roll;
    vel += ((r - prevR) / Math.max(dt, 0.008) - vel) * (1 - Math.exp(-dt / 0.12)); prevR = r;
    const tip = r * dir();
    spillFlash = Math.max(0, spillFlash - dt);
    if (state === "pour") {
      if (tip > thr) {
        if (Math.abs(vel) > vmax && tip < amp * 1.2) { spills++; state = "spilled"; spillFlash = 1; this.events.push("error"); return; }
        const rate = clamp((tip - thr) / (amp * 0.5), 0.15, 1) * 0.32; fill += rate * dt; pourTime += dt;
        if (!reduceMotion && Math.random() < 0.6) drops.push({ k: 0 });
        if (fill >= 1) { fill = 1; state = "return"; overT = 0; this.events.push("success"); }
      }
    } else if (state === "return") {
      if (tip > thr && vel * dir() > -3) { overT += dt; if (overT > 1.5) { spills++; overT = -99; spillFlash = 1; this.events.push("error"); } }
      if (Math.abs(r) < amp * 0.25) { this._reps++; cup++; fill = 0; state = "pour"; if (this._reps >= S.reps) this.done = true; }
    } else if (state === "spilled") {
      if (Math.abs(r) < amp * 0.25) state = "pour";
    }
    drops.forEach((d) => (d.k += dt * 2.4)); drops = drops.filter((d) => d.k < 1);
  };
  G.status = function () {
    const side = dir() > 0 ? "right" : "left";
    if (state === "spilled") return { title: "Too fast, it spilled", text: "Bring the pot upright, then pour more slowly.", tone: "warn" };
    if (state === "return") return { title: "Full. Return the pot upright.", text: `${this._reps + 1} of ${S.reps}`, tone: "good" };
    return { title: `Turn your hand to the ${side} to pour`, text: "Slow and steady fills the cup." };
  };
  G.stats = () => [["Spills", String(spills)], ["Pour time", `${pourTime.toFixed(1)} s`]];
  G.draw = function (g, W, H, a, t) {
    g.fillStyle = T.stage; g.fillRect(0, 0, W, H);
    const tableY = H * 0.8;
    g.fillStyle = alpha(T.ink, 0.07); g.fillRect(0, tableY, W, H - tableY);
    g.strokeStyle = T.line; g.lineWidth = 2; g.beginPath(); g.moveTo(0, tableY); g.lineTo(W, tableY); g.stroke();
    const d = dir(), cupX = W / 2 + d * Math.min(W * 0.2, 210), cupW = 92, cupH = 104, cupTop = tableY - cupH;
    // cup
    g.fillStyle = T.surface; g.strokeStyle = T.ink; g.lineWidth = 3;
    g.beginPath(); g.moveTo(cupX - cupW / 2, cupTop); g.lineTo(cupX - cupW / 2 + 8, tableY); g.lineTo(cupX + cupW / 2 - 8, tableY); g.lineTo(cupX + cupW / 2, cupTop); g.closePath(); g.fill(); g.stroke();
    const lvl = cupTop + cupH * (1 - fill * 0.82);
    g.save(); g.clip(); g.fillStyle = alpha(T.accent, 0.75); g.fillRect(cupX - cupW / 2, lvl, cupW, tableY - lvl); g.restore();
    const lineY = cupTop + cupH * 0.18;
    g.setLineDash([5, 5]); g.strokeStyle = T.go; g.lineWidth = 2; g.beginPath(); g.moveTo(cupX - cupW / 2 - 10, lineY); g.lineTo(cupX + cupW / 2 + 10, lineY); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.arc(cupX + d * (cupW / 2 + 4), cupTop + 42, 16, -Math.PI / 2, Math.PI / 2, d < 0); g.strokeStyle = T.ink; g.lineWidth = 3; g.stroke();
    // done cups
    for (let i = 0; i < S.reps; i++) { const x = 28 + i * 22, y = H - 28; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fillStyle = i < G._reps ? T.go : alpha(T.ink, 0.18); g.fill(); }
    // pot
    const px = W / 2, py = H * 0.36, rot = clamp(a.roll, -95, 95) * Math.PI / 180;
    g.save(); g.translate(px, py); g.rotate(rot);
    g.fillStyle = T.ink; g.strokeStyle = T.ink;
    g.beginPath(); g.ellipse(0, 0, 70, 54, 0, 0, TAU); g.fill();
    g.fillStyle = T.accent; g.beginPath(); g.ellipse(0, -2, 70, 10, 0, 0, TAU); g.fill();
    g.fillStyle = T.ink; rr(g, -14, -70, 28, 18, 6); g.fill();
    g.lineWidth = 12; g.lineCap = "round";
    g.beginPath(); g.moveTo(d * 56, -8); g.quadraticCurveTo(d * 100, -18, d * 112, -50); g.stroke();
    g.lineWidth = 9; g.beginPath(); g.arc(-d * 72, 0, 30, -Math.PI / 2, Math.PI / 2, d > 0); g.stroke();
    g.restore();
    // stream
    const tip = a.roll * d;
    if ((state === "pour" || state === "return") && tip > thr) {
      const sx = px + Math.cos(rot) * (d * 112) - Math.sin(rot) * -50, sy = py + Math.sin(rot) * (d * 112) + Math.cos(rot) * -50;
      g.strokeStyle = alpha(T.accent, 0.85); g.lineWidth = 4 + clamp((tip - thr) / amp, 0, 1) * 6; g.lineCap = "round";
      g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(lerp(sx, cupX, 0.6), sy + 10, cupX + Math.sin(t * 12) * 3, Math.max(lvl, cupTop)); g.stroke(); g.lineCap = "butt";
    }
    if (spillFlash > 0) {
      g.fillStyle = alpha(T.warn, 0.55 * spillFlash);
      for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(cupX + (i - 3) * 22, tableY + 8 + (i % 2) * 6, 14, 5, 0, 0, TAU); g.fill(); }
    }
    // speed gauge: how fast the forearm is turning
    const gx = 28, gy = 130, gw = 18, gh = H * 0.4;
    rr(g, gx, gy, gw, gh, 9); g.fillStyle = alpha(T.ink, 0.08); g.fill();
    const frac = clamp(Math.abs(vel) / (vmax * 1.4), 0, 1);
    rr(g, gx, gy + gh * (1 - frac), gw, gh * frac, 9); g.fillStyle = Math.abs(vel) > vmax ? T.warn : T.go; g.fill();
    const ly = gy + gh * (1 - 1 / 1.4); g.strokeStyle = T.warn; g.lineWidth = 2; g.beginPath(); g.moveTo(gx - 4, ly); g.lineTo(gx + gw + 4, ly); g.stroke();
    txt(g, "Speed", gx + gw / 2, gy + gh + 18, 11, T.muted, { font: T.mono, weight: 500 });
  };
  return G;
}

// ---- 3. Combination Lock: rotation + working memory ----------------------------
function ComboLock(S) {
  const amp = S.amp, G = base(S, S.reps);
  const len = { 1: 2, 2: 3, 3: 4 }[S.level];
  let code = [], entered = [], phase = "show", phaseT = 0, dwell = 0, lastD = -1, armed = true, correct = 0, wrong = 0, codesOpened = 0, rounds = 0;
  function newCode() { code = []; while (code.length < len) { const d = Math.floor(Math.random() * 10); if (d !== code[code.length - 1]) code.push(d); } entered = []; phase = "show"; phaseT = 0; armed = false; lastD = -1; rounds++; }
  newCode();
  const dialVal = (r) => clamp(((r + amp) / (2 * amp)) * 9, 0, 9);
  G.update = function (dt, a) {
    phaseT += dt;
    if (phase === "show") { if (phaseT > 2.2 + len * 0.7) { phase = "dial"; phaseT = 0; dwell = 0; armed = false; lastD = Math.round(dialVal(a.roll)); } return; }
    if (phase === "reveal") { if (phaseT > 2.0) { if (this._reps >= S.reps) this.done = true; else newCode(); } return; }
    const d = Math.round(dialVal(a.roll));
    if (d !== lastD) { lastD = d; dwell = 0; armed = true; }
    else if (armed) {
      dwell += dt;
      if (dwell >= 1.0) {
        armed = false; dwell = 0; entered.push(d); this._reps++;
        if (d === code[entered.length - 1]) { correct++; this.events.push("success"); } else { wrong++; this.events.push("error"); }
        if (entered.length === len) { phase = "reveal"; phaseT = 0; if (entered.every((x, i) => x === code[i])) { codesOpened++; this.events.push("big"); } }
      }
    }
  };
  G.status = function () {
    if (phase === "show") return { title: "Remember this code", text: "It will hide in a moment." };
    if (phase === "reveal") { const ok = entered.every((x, i) => x === code[i]); return ok ? { title: "Unlocked", text: "Next code coming up.", tone: "good" } : { title: `The code was ${code.join(" ")}`, text: "Next code coming up.", tone: "warn" }; }
    return { title: `Dial number ${entered.length + 1} of ${len}`, text: "Turn your wrist, then hold still on the number." };
  };
  G.stats = () => [["Codes opened", `${codesOpened} / ${rounds}`], ["Digits correct", `${correct} / ${correct + wrong}`]];
  G.draw = function (g, W, H, a, t) {
    g.fillStyle = T.stage; g.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H - 44, R = Math.max(110, Math.min(W * 0.36, cy - 236, 300));
    const A = (v) => Math.PI + (v / 9) * Math.PI; // 0 at left, 9 at right, across the top
    g.beginPath(); g.arc(cx, cy, R + 18, Math.PI, TAU); g.lineTo(cx + R + 18, cy + 10); g.lineTo(cx - R - 18, cy + 10); g.closePath(); g.fillStyle = T.surface; g.fill(); g.strokeStyle = T.line; g.lineWidth = 2; g.stroke();
    const cur = dialVal(a.roll), curD = Math.round(cur);
    for (let n = 0; n <= 9; n++) {
      const an = A(n), x = cx + Math.cos(an) * (R - 30), y = cy + Math.sin(an) * (R - 30);
      const on = phase === "dial" && n === curD;
      if (on) { g.beginPath(); g.arc(x, y, 26, 0, TAU); g.fillStyle = alpha(T.accent, 0.3); g.fill(); if (armed) { g.strokeStyle = T.go; g.lineWidth = 5; g.beginPath(); g.arc(x, y, 26, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(dwell / 1.0, 0, 1)); g.stroke(); } }
      txt(g, String(n), x, y + 1, 30, on ? T.ink : T.muted, { font: T.mono, weight: 600 });
      g.strokeStyle = T.line; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + Math.cos(an) * (R + 4), cy + Math.sin(an) * (R + 4)); g.lineTo(cx + Math.cos(an) * (R + 16), cy + Math.sin(an) * (R + 16)); g.stroke();
    }
    // pointer
    const pa = A(cur); g.strokeStyle = T.ink; g.lineWidth = 6; g.lineCap = "round";
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(pa) * (R - 62), cy + Math.sin(pa) * (R - 62)); g.stroke(); g.lineCap = "butt";
    g.beginPath(); g.arc(cx, cy, 34, 0, TAU); g.fillStyle = T.ink; g.fill();
    g.beginPath(); g.arc(cx, cy, 12, 0, TAU); g.fillStyle = T.accent; g.fill();
    // code / slots
    const sw = 64, gap = 14, total = len * sw + (len - 1) * gap, sx = cx - total / 2, sy = 128;
    if (phase === "show") txt(g, "Memorize", cx, sy - 14, 14, T.muted, { font: T.mono, weight: 500 });
    for (let i = 0; i < len; i++) {
      const x = sx + i * (sw + gap);
      rr(g, x, sy, sw, 76, 12); g.fillStyle = T.surface; g.fill(); g.strokeStyle = i === entered.length && phase === "dial" ? T.accent : T.line; g.lineWidth = 3; g.stroke();
      let s = "", col = T.ink;
      if (phase === "show" || phase === "reveal") { s = String(code[i]); if (phase === "reveal") col = entered[i] === code[i] ? T.go : T.warn; }
      else if (i < entered.length) { s = String(entered[i]); col = entered[i] === code[i] ? T.go : T.warn; }
      if (s) txt(g, s, x + sw / 2, sy + 40, 44, col, { font: T.mono, weight: 600 });
    }
  };
  return G;
}

// ---- 4. Tilt Maze: 2-axis wrist control --------------------------------------
function TiltMaze(S) {
  const amp = S.amp, G = base(S, Math.max(2, Math.min(4, Math.round(S.reps / 4))));
  const dims = { 1: [5, 3], 2: [7, 4], 3: [9, 5] }[S.level];
  let maze, ball, hits = 0, hitCool = 0, mazeT = 0, times = [], win = 0;
  function build() {
    const [C, R] = dims, cells = [];
    for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) cells.push({ x, y, n: 1, e: 1, s: 1, w: 1, v: 0 });
    const at = (x, y) => cells[y * C + x], stack = [at(0, 0)]; at(0, 0).v = 1;
    while (stack.length) {
      const c = stack[stack.length - 1];
      const nb = [[0, -1, "n", "s"], [1, 0, "e", "w"], [0, 1, "s", "n"], [-1, 0, "w", "e"]].filter(([dx, dy]) => { const X = c.x + dx, Y = c.y + dy; return X >= 0 && Y >= 0 && X < C && Y < R && !at(X, Y).v; });
      if (!nb.length) { stack.pop(); continue; }
      const [dx, dy, k, o] = nb[Math.floor(Math.random() * nb.length)], nx = at(c.x + dx, c.y + dy);
      c[k] = 0; nx[o] = 0; nx.v = 1; stack.push(nx);
    }
    maze = { C, R, cells, at }; ball = { x: 0.5, y: 0.5, vx: 0, vy: 0 }; mazeT = 0;
  }
  build();
  const RAD = 0.22; // ball radius in cell units
  G.update = function (dt, a) {
    mazeT += dt; hitCool = Math.max(0, hitCool - dt);
    if (win > 0) { win -= dt; if (win <= 0) { if (this._reps >= this.goal()) this.done = true; else build(); } return; }
    const dz = amp * 0.12;
    const tx = Math.abs(a.roll) < dz ? 0 : clamp(a.roll / amp, -1.3, 1.3);
    const py = a.demo ? -a.pitch : a.pitch; // real phone: tipping the top edge down rolls the ball up the screen
    const ty = Math.abs(py) < dz ? 0 : clamp(py / amp, -1.3, 1.3);
    const acc = 7;
    ball.vx += tx * acc * dt; ball.vy += ty * acc * dt;
    const fr = Math.exp(-dt * 1.6); ball.vx *= fr; ball.vy *= fr;
    const vmax = 4.2, sp = Math.hypot(ball.vx, ball.vy); if (sp > vmax) { ball.vx *= vmax / sp; ball.vy *= vmax / sp; }
    // move in substeps and collide with walls of the current and neighbouring cells
    const steps = 4;
    for (let s = 0; s < steps; s++) {
      ball.x += ball.vx * dt / steps; ball.y += ball.vy * dt / steps;
      collide();
    }
    const cx = Math.floor(ball.x), cy = Math.floor(ball.y);
    if (cx === maze.C - 1 && cy === maze.R - 1 && Math.hypot(ball.x - (cx + 0.5), ball.y - (cy + 0.5)) < 0.3) {
      this._reps++; times.push(mazeT); win = 1.4; this.events.push("big");
    }
  };
  function collide() {
    const { C, R, at } = maze;
    ball.x = clamp(ball.x, RAD, C - RAD); ball.y = clamp(ball.y, RAD, R - RAD);
    const cx = clamp(Math.floor(ball.x), 0, C - 1), cy = clamp(Math.floor(ball.y), 0, R - 1), c = at(cx, cy);
    const hit = (v) => { if (Math.abs(v) > 1.2 && hitCool <= 0) { hits++; hitCool = 0.35; G.events.push("error"); } };
    if (c.w && ball.x - cx < RAD) { ball.x = cx + RAD; hit(ball.vx); ball.vx = Math.abs(ball.vx) * 0.25; }
    if (c.e && cx + 1 - ball.x < RAD) { ball.x = cx + 1 - RAD; hit(ball.vx); ball.vx = -Math.abs(ball.vx) * 0.25; }
    if (c.n && ball.y - cy < RAD) { ball.y = cy + RAD; hit(ball.vy); ball.vy = Math.abs(ball.vy) * 0.25; }
    if (c.s && cy + 1 - ball.y < RAD) { ball.y = cy + 1 - RAD; hit(ball.vy); ball.vy = -Math.abs(ball.vy) * 0.25; }
    // corner posts: push away from the nearest cell corner
    for (const [px, py] of [[cx, cy], [cx + 1, cy], [cx, cy + 1], [cx + 1, cy + 1]]) {
      const dx = ball.x - px, dy = ball.y - py, d = Math.hypot(dx, dy);
      if (d < RAD && d > 1e-4) { ball.x = px + dx / d * RAD; ball.y = py + dy / d * RAD; }
    }
  }
  G.debug = () => ({ maze, ball });
  G.status = function () {
    if (win > 0) return { title: "You made it", text: this._reps < this.goal() ? "Next maze coming up." : "Last maze done.", tone: "good" };
    return { title: "Roll the ball to the flag", text: `Maze ${this._reps + 1} of ${this.goal()} · gentle tilts work best` };
  };
  G.stats = () => [["Wall bumps", String(hits)], ["Average maze time", times.length ? `${(times.reduce((s, x) => s + x, 0) / times.length).toFixed(1)} s` : "–"]];
  G.draw = function (g, W, H, a, t) {
    g.fillStyle = T.stage; g.fillRect(0, 0, W, H);
    const { C, R, cells } = maze, pad = 30, top = 118;
    const cs = Math.min((W - pad * 2) / C, (H - top - pad) / R), ox = (W - cs * C) / 2, oy = top + (H - top - pad - cs * R) / 2;
    rr(g, ox - 8, oy - 8, cs * C + 16, cs * R + 16, 14); g.fillStyle = T.surface; g.fill();
    // goal
    const gx = ox + (C - 0.5) * cs, gy = oy + (R - 0.5) * cs;
    g.fillStyle = alpha(T.go, 0.18); g.fillRect(ox + (C - 1) * cs, oy + (R - 1) * cs, cs, cs);
    g.strokeStyle = T.go; g.lineWidth = 3; g.beginPath(); g.moveTo(gx - cs * 0.12, gy + cs * 0.28); g.lineTo(gx - cs * 0.12, gy - cs * 0.28); g.stroke();
    g.fillStyle = T.go; g.beginPath(); g.moveTo(gx - cs * 0.12, gy - cs * 0.28); g.lineTo(gx + cs * 0.22, gy - cs * 0.16); g.lineTo(gx - cs * 0.12, gy - cs * 0.04); g.fill();
    // walls
    g.strokeStyle = T.ink; g.lineWidth = Math.max(3, cs * 0.07); g.lineCap = "round"; g.beginPath();
    for (const c of cells) {
      const x = ox + c.x * cs, y = oy + c.y * cs;
      if (c.n) { g.moveTo(x, y); g.lineTo(x + cs, y); }
      if (c.w) { g.moveTo(x, y); g.lineTo(x, y + cs); }
      if (c.y === R - 1 && c.s) { g.moveTo(x, y + cs); g.lineTo(x + cs, y + cs); }
      if (c.x === C - 1 && c.e) { g.moveTo(x + cs, y); g.lineTo(x + cs, y + cs); }
      if (c.e && c.x < C - 1) { g.moveTo(x + cs, y); g.lineTo(x + cs, y + cs); }
      if (c.s && c.y < R - 1) { g.moveTo(x, y + cs); g.lineTo(x + cs, y + cs); }
    }
    g.stroke(); g.lineCap = "butt";
    // ball
    const bx = ox + ball.x * cs, by = oy + ball.y * cs;
    g.beginPath(); g.arc(bx + 3, by + 4, RAD * cs, 0, TAU); g.fillStyle = alpha(T.ink, 0.15); g.fill();
    g.beginPath(); g.arc(bx, by, RAD * cs, 0, TAU); g.fillStyle = T.accent; g.fill();
    g.beginPath(); g.arc(bx - RAD * cs * 0.3, by - RAD * cs * 0.3, RAD * cs * 0.3, 0, TAU); g.fillStyle = alpha(T.surface, 0.6); g.fill();
  };
  return G;
}

RC.register(Object.assign({ section: "wrist" }, {
    id: "pour", name: "Pour the Tea", movement: "Forearm rotation · slow control", axes: "Roll",
    brain: false, mount: "Hold the phone in your affected hand like a teapot handle, screen up, forearm resting on the table.",
    desc: "Turn your forearm to tip the pot and fill each cup to the line. Pour too fast and it spills.",
    source: "mRehab Slow Pour and Quick Twist; RAPAEL Smart Glove pouring and supination–pronation games.",
    how: ["Keep your elbow on the table.", "Turn your palm to tip the pot toward the cup.", "Pour slowly. Return upright when the cup is full."],
    make: (S) => PourTea(S),
  }));
RC.register(Object.assign({ section: "wrist" }, {
    id: "lock", name: "Combination Lock", movement: "Forearm rotation · working memory", axes: "Roll",
    brain: true, mount: "Hold the phone in your affected hand, screen up, like a key you are about to turn.",
    desc: "Memorize the code, then turn your wrist to dial each number and hold it there.",
    source: "mRehab Unlock with Key and Turn Doorknob; Constant Therapy visual memory tasks.",
    how: ["Read the code while it is showing.", "Turn your wrist to move the pointer to each number.", "Hold still on a number to enter it."],
    make: (S) => ComboLock(S),
  }));
RC.register(Object.assign({ section: "wrist" }, {
    id: "maze", name: "Tilt Maze", movement: "Wrist flexion, extension, and deviation", axes: "Pitch + Roll",
    brain: true, mount: "Hold the phone flat in your affected hand, screen up, like a tray.",
    desc: "Tilt your hand like a tray to roll the ball to the flag without bumping the walls.",
    source: "RAPAEL Smart Glove wrist flexion/extension and radial/ulnar deviation games.",
    how: ["Rest your forearm on the table so the wrist does the work.", "Tip your hand forward, back, left or right to roll the ball.", "Gentle tilts are enough. Bring your hand level to stop."],
    make: (S) => TiltMaze(S),
  }));

// ================================================================ more wrist & forearm exercises
const { bg, dots, defineArt } = RC.kit;
const mountTable = "Hold the phone flat in your affected hand, forearm resting on the table, wrist over the edge.";

// Two targets in turn, each held briefly; reaching both is one rep. Used by Wrist Bend and Wrist Wiper.
function Alternate(S, spec) {
  const G = base(S, S.reps);
  let side = 0, dwell = 0, val = 0, ranges = [0, 0];
  G.update = function (dt, a) {
    val = spec.signal(a);
    ranges = [Math.max(ranges[0], val), Math.min(ranges[1], val)];
    const tgt = spec.targets(S)[side], reached = tgt > 0 ? val >= tgt * 0.9 : val <= tgt * 0.9;
    if (reached) { dwell += dt; if (dwell >= spec.hold) { dwell = 0; this.events.push("tick"); if (side === 1) { this._reps++; this.events.push("success"); if (this._reps >= S.reps) this.done = true; } side = 1 - side; } }
    else dwell = Math.max(0, dwell - dt * 2);
  };
  G.status = () => ({ title: spec.cues[side], text: `${G._reps} of ${S.reps} done` });
  G.stats = () => [[spec.rangeLabels[0], `${Math.round(ranges[0])}°`], [spec.rangeLabels[1], `${Math.round(ranges[1])}°`]];
  G.debug = () => ({ side, val });
  G.draw = function (g, W, H) {
    bg(g, W, H); dots(g, W, S.reps, this._reps);
    spec.draw(g, W, H, { val, side, prog: dwell / spec.hold, targets: spec.targets(S) });
  };
  return G;
}

function WristBend(S) {
  return Alternate(S, {
    signal: (a) => a.pitch, targets: (S) => [S.amp, -S.amp * 0.6], hold: 0.4,
    cues: ["Bend your wrist up", "Now bend it down"], rangeLabels: ["Up", "Down"],
    draw: (g, W, H, o) => {
      const px = W * 0.34, py = H * 0.56, L = Math.min(W * 0.3, 240);
      g.fillStyle = alpha(T.ink, 0.1); rr(g, px - L, py - 18, L, 36, 18); g.fill(); // forearm
      const angOf = (deg) => -clamp(deg, -70, 70) * Math.PI / 180;
      o.targets.forEach((tg, i) => { const A = angOf(tg); g.setLineDash([8, 7]); g.strokeStyle = i === o.side ? T.accent : alpha(T.accent, 0.35); g.lineWidth = 3; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(A) * L * 0.75, py + Math.sin(A) * L * 0.75); g.stroke(); });
      g.setLineDash([]);
      const A = angOf(o.val); g.save(); g.translate(px, py); g.rotate(A); rr(g, 0, -22, L * 0.55, 44, 20); g.fillStyle = T.accent; g.fill(); g.restore();
      if (o.prog > 0) { g.strokeStyle = T.go; g.lineWidth = 6; g.beginPath(); g.arc(px, py, 34, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(o.prog, 0, 1)); g.stroke(); }
    },
  });
}

function WristWiper(S) {
  return Alternate(S, {
    signal: (a) => a.roll, targets: (S) => [S.amp, -S.amp], hold: 0.4,
    cues: ["Tilt your hand to the right", "Now tilt it to the left"], rangeLabels: ["Right", "Left"],
    draw: (g, W, H, o) => {
      // a windscreen wiper sweeping an arc
      const cx = W / 2, cy = H - 70, R = Math.min(W * 0.36, H - 200);
      g.fillStyle = alpha(T.ink, 0.06); g.beginPath(); g.arc(cx, cy, R, Math.PI, TAU); g.fill();
      const angOf = (deg) => -Math.PI / 2 + clamp(deg / 60, -1.1, 1.1) * (Math.PI / 2.3);
      o.targets.forEach((tg, i) => { const A = angOf(tg); g.beginPath(); g.arc(cx + Math.cos(A) * R * 0.86, cy + Math.sin(A) * R * 0.86, 22, 0, TAU); g.fillStyle = i === o.side ? T.accent : alpha(T.accent, 0.25); g.fill(); });
      const A = angOf(o.val); g.strokeStyle = T.ink; g.lineWidth = 10; g.lineCap = "round"; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(A) * R * 0.95, cy + Math.sin(A) * R * 0.95); g.stroke(); g.lineCap = "butt";
      if (o.prog > 0) { g.strokeStyle = T.go; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 30, Math.PI, Math.PI + Math.PI * clamp(o.prog, 0, 1)); g.stroke(); }
    },
  });
}

// ---- Steady Cup: keep the cup level inside a shrinking circle for the whole time
function SteadyCup(S) {
  const dur = S.durationS || 60, G = base(S, 1);
  let t = 0, inT = 0, sum2 = 0, n = 0, x = 0, y = 0;
  const radius = () => lerp({ 1: 14, 2: 10, 3: 7 }[S.level] || 10, ({ 1: 14, 2: 10, 3: 7 }[S.level] || 10) * 0.55, clamp(t / dur, 0, 1));
  G.update = function (dt, a) {
    t += dt; x = a.roll; y = a.pitch;
    const d = Math.hypot(x, y); sum2 += d * d; n++;
    if (d <= radius()) inT += dt;
    if (t >= dur) { this._reps = 1; this.done = true; }
  };
  G.status = () => (Math.hypot(x, y) <= radius() ? { title: "Steady. Keep it there.", text: `${RC.fmtTime(Math.max(0, dur - t))} left`, tone: "good" } : { title: "Bring the dot back to the middle", text: "Small, slow corrections." });
  G.stats = () => [["Time steady", `${Math.round((inT / Math.max(0.1, t)) * 100)}%`], ["Sway", `${Math.sqrt(sum2 / Math.max(1, n)).toFixed(1)}° RMS`]];
  G.debug = () => ({ t, r: radius() });
  G.draw = function (g, W, H) {
    bg(g, W, H);
    const cx = W / 2, cy = H * 0.56, scale = Math.min(W, H - 160) / 70;
    g.beginPath(); g.arc(cx, cy, 30 * scale, 0, TAU); g.fillStyle = alpha(T.ink, 0.05); g.fill();
    g.beginPath(); g.arc(cx, cy, radius() * scale, 0, TAU); g.fillStyle = alpha(T.go, 0.16); g.fill(); g.strokeStyle = T.go; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.arc(cx + clamp(x, -30, 30) * scale, cy - clamp(y, -30, 30) * scale, 16, 0, TAU); g.fillStyle = T.accent; g.fill();
    g.strokeStyle = T.go; g.lineWidth = 8; g.lineCap = "round"; g.beginPath(); g.arc(cx, cy, 30 * scale + 14, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(t / dur, 0, 1)); g.stroke(); g.lineCap = "butt";
  };
  return G;
}

[
  { id: "wristbend", name: "Wrist Bend", movement: "Wrist flexion and extension", mount: mountTable,
    desc: "Bend your wrist up to the top line, then down to the bottom one.", source: "FitMi wrist bend; RAPAEL wrist flexion and extension.",
    how: ["Rest your forearm on the table with the wrist free.", "Bend your wrist up until the hand reaches the line.", "Then bend it down to the lower line."], make: WristBend },
  { id: "wiper", name: "Wrist Wiper", movement: "Radial and ulnar deviation", mount: "Hold the phone flat in your affected hand, palm down, forearm on the table.",
    desc: "Sweep your hand side to side like a windscreen wiper.", source: "RAPAEL radial and ulnar deviation; GRASP wrist range of motion.",
    how: ["Keep your forearm still on the table.", "Tilt your hand toward the lit target on one side.", "Then sweep across to the other side."], make: WristWiper },
  { id: "steady", name: "Steady Cup", movement: "Holding still · steadiness", mount: "Hold the phone flat in your affected hand like a full cup.",
    desc: "Keep the dot inside the circle as it slowly gets smaller.", source: "mRehab Walk with Mug (keeping a cup level).",
    params: { reps: null, level: [1, 2, 3], durationS: [30, 60, 90] }, defaults: { reps: null, level: 2, durationS: 30 },
    how: ["Rest your forearm on the table, hand level.", "Keep the orange dot inside the green circle.", "Small, slow corrections are best."], make: SteadyCup },
].forEach((d) => RC.register(Object.assign({ section: "wrist", control: "tilt" }, d)));

defineArt("wristbend", '<rect x="18" y="32" width="46" height="12" rx="6" fill="var(--a-mute)" opacity=".3"/><rect x="62" y="20" width="32" height="12" rx="6" fill="var(--a-hi)" transform="rotate(-24 64 38)"/><path d="M64 38 L100 16 M64 38 L100 54" stroke="var(--a-hi)" stroke-width="1.5" stroke-dasharray="3 3"/>');
defineArt("wiper", '<path d="M24 56 A36 36 0 0 1 96 56" fill="var(--a-mute)" opacity=".15"/><path d="M60 56 L84 26" stroke="var(--a-ink)" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="34" r="6" fill="var(--a-hi)" opacity=".35"/><circle cx="88" cy="34" r="6" fill="var(--a-hi)"/>');
defineArt("steady", '<circle cx="60" cy="32" r="22" fill="var(--a-mute)" opacity=".12"/><circle cx="60" cy="32" r="11" fill="var(--a-go)" opacity=".2" stroke="var(--a-go)" stroke-width="2"/><circle cx="63" cy="30" r="5" fill="var(--a-hi)"/>');
})();
