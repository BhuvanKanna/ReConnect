(() => {
"use strict";
const RC = window.RC;
const { $, clamp, lerp, TAU, reduceMotion, store, settings, saveSettings, T, alpha, txt, rr, chime, esc, fmtTime, Game, readTheme } = RC;
const { base, drawGonio } = RC.kit;
// Draw with a 3D scene from the js/play3d-scenes files when the computer can (the game still does the scoring).
const in3D = (G, id) => (RC.Play3D ? RC.Play3D.wrap(G, id) : G);
// ---- 2. Pour the Tea: controlled supination/pronation --------------------------
// Drawn as a 3D kitchen table (js/pour3d.js); a flat 2D view stands in until three.js loads or without WebGL.
function PourTea(S) {
  const amp = S.amp, G = base(S, S.reps);
  const thr = amp * 0.55, vmax = { 1: 55, 2: 70, 3: 85 }[S.level];
  let cup = 0, fill = 0, state = "pour", prevR = 0, vel = 0, spills = 0, overT = 0, drops = [], spillFlash = 0, pourTime = 0;
  let world = null, lastT = null, tipNow = 0, idle = 0;
  const quality = RC.Scene3D ? RC.Scene3D.quality() : { sample: () => 2 };
  const P3 = RC.Pour3D; if (P3) P3.ensure();
  const dir = () => (cup % 2 === 0 ? 1 : -1);
  G.update = function (dt, a) {
    const r = a.roll;
    vel += ((r - prevR) / Math.max(dt, 0.008) - vel) * (1 - Math.exp(-dt / 0.12));
    idle = Math.abs(r - prevR) > 0.3 ? 0 : idle + dt; prevR = r;
    const tip = r * dir(); tipNow = tip;
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
  const pouring = () => (state === "pour" || state === "return") && tipNow > thr;
  const overflowing = () => state === "return" && tipNow > thr;
  const tooFast = () => Math.abs(vel) > vmax * 0.8;
  // Short words: one instruction at a time; the cup, line and speed meter show the rest.
  G.status = function () {
    const side = dir() > 0 ? "right" : "left", n = `Cup ${Math.min(this._reps + 1, S.reps)} of ${S.reps}`;
    if (state === "spilled") return { title: "Too fast! It spilled", text: "Turn the pot back up. Then go slower.", tone: "warn" };
    if (state === "return") return overflowing() ? { title: "Stop! Turn the pot back up", text: "The cup is overflowing", tone: "warn" } : { title: "Full! Turn the pot back up", text: n, tone: "good" };
    if (pouring()) return { title: `Turn your hand to the ${side} to pour`, text: tooFast() ? "Slow down" : "Slow and steady", tone: tooFast() ? "warn" : undefined };
    if (tipNow < -thr) return { title: `Turn your hand to the ${side} to pour`, text: "Other way: the cup is on the " + side, tone: "warn" };
    return { title: `Turn your hand to the ${side} to pour`, text: n };
  };
  G.stats = () => [["Spills", String(spills)], ["Pour time", `${pourTime.toFixed(1)} s`]];
  G.dispose = () => { if (world) { world.dispose(); world = null; } };
  G.debug = () => ({ state, val: prevR, fill, cup, view: world ? "3d" : "2d", quality: quality.level });
  G.draw = function (g, W, H, a, t) {
    const raw = lastT == null ? 0 : t - lastT, dt = Math.min(0.05, Math.max(0, raw)); lastT = t;
    const q = world ? quality.sample() : 0;
    if (q >= 2 && world) { world.dispose(); world = null; RC.Scene3D.off = true; }
    if (!world && !RC.Scene3D.off && P3 && P3.ready()) world = P3.create({ count: S.reps, dir: dir(), calm: reduceMotion });
    if (!world) { drawFlat(g, W, H, a, t); drawSpeed(g, W, H, 1); return; }
    world.lowQuality(q >= 1);
    const pr = (g.getTransform ? g.getTransform().a : 1) * (q >= 1 ? 0.6 : 1), tip = a.roll * dir();
    const st = { roll: a.roll, dir: dir(), cup: G._reps, fill, pouring: pouring(), rate: clamp((tip - thr) / (amp * 0.5), 0.15, 1), full: state === "return", spills, overflow: overflowing() };
    g.drawImage(world.frame(W, H, pr, st, t, dt), 0, 0, W, H);
    const unit = Math.min(W, H) / 600;
    // "Fill to here" tag beside the cup's green line
    if (state === "pour" && fill < 0.98) {
      const p = world.toScreen(world.lineAt, W, H), d = dir(), x = p.x + d * 26 * unit;
      g.save(); g.font = `600 ${Math.round(17 * unit)}px ${T.display}`;
      const label = "Fill to here", tw = g.measureText(label).width, bw = tw + 24 * unit, bh = 32 * unit;
      const bx = d > 0 ? x : x - bw;
      g.fillStyle = "rgba(255,255,255,0.92)"; rr(g, bx, p.y - bh / 2, bw, bh, bh / 2); g.fill();
      g.strokeStyle = "#22b866"; g.lineWidth = 2.5 * unit; g.stroke();
      g.fillStyle = "#22b866"; g.beginPath(); g.moveTo(p.x + d * 8 * unit, p.y); g.lineTo(x + d * 2 * unit, p.y - 7 * unit); g.lineTo(x + d * 2 * unit, p.y + 7 * unit); g.fill();
      g.fillStyle = "#15603a"; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(label, bx + 12 * unit, p.y + 1);
      g.restore();
    }
    // curved arrow around the pot: which way to turn, or back to upright
    const c = world.toScreen(world.pot, W, H), rad = 190 * unit;
    if (state === "pour" && tip < thr * 0.9) turnArrow(g, c.x, c.y, rad, -90 + dir() * 62, -90 + dir() * 112, unit, t, idle > 3);
    else if ((state === "return" || state === "spilled") && Math.abs(a.roll) > amp * 0.3) turnArrow(g, c.x, c.y, rad, -90 + Math.sign(a.roll) * 112, -90 + Math.sign(a.roll) * 62, unit, t, false);
    drawSpeed(g, W, H, unit);
  };
  // Arrow along an arc (angles in degrees; -90 is straight up, positive turns clockwise on screen).
  function turnArrow(g, cx, cy, r, a0, a1, unit, t, strong) {
    if (Math.abs(a1 - a0) < 8) return;
    const A0 = a0 * Math.PI / 180, A1 = a1 * Math.PI / 180, ccw = a1 < a0;
    const pulse = reduceMotion ? 1 : 0.75 + 0.25 * Math.sin(t * 4);
    g.save(); g.globalAlpha = strong ? 1 : 0.9 * pulse; g.lineCap = "round"; g.lineJoin = "round";
    for (const [w, col] of [[20, "rgba(40,25,10,0.6)"], [11, "#ffcf5a"]]) {
      g.lineWidth = w * unit; g.strokeStyle = col; g.beginPath(); g.arc(cx, cy, r, A0, A1, ccw); g.stroke();
      const ex = cx + Math.cos(A1) * r, ey = cy + Math.sin(A1) * r, tx = -Math.sin(A1) * (ccw ? -1 : 1), ty = Math.cos(A1) * (ccw ? -1 : 1), s = (w + 14) * unit;
      g.fillStyle = col; g.beginPath(); g.moveTo(ex + tx * s, ey + ty * s); g.lineTo(ex - ty * s * 0.75 - tx * s * 0.2, ey + tx * s * 0.75 - ty * s * 0.2); g.lineTo(ex + ty * s * 0.75 - tx * s * 0.2, ey - tx * s * 0.75 - ty * s * 0.2); g.fill();
    }
    g.restore();
  }
  // Speed meter: how fast the forearm is turning; the red zone spills.
  function drawSpeed(g, W, H, unit) {
    const u = Math.max(0.8, unit), gw = 26 * u, gh = Math.min(H * 0.5, 260 * u), gx = 30 * u, gy = (H - gh) / 2 + 10 * u;
    g.save();
    g.fillStyle = "rgba(255,255,255,0.88)"; rr(g, gx - 16 * u, gy - 44 * u, gw + 32 * u, gh + 76 * u, 16 * u); g.fill();
    txt(g, "Speed", gx + gw / 2, gy - 24 * u, 15 * u, T.ink, { weight: 600 });
    const lim = 1 / 1.4, ly = gy + gh * (1 - lim);
    rr(g, gx, gy, gw, gh, gw / 2); g.fillStyle = "rgba(0,0,0,0.08)"; g.fill();
    g.save(); rr(g, gx, gy, gw, gh, gw / 2); g.clip();
    g.fillStyle = "rgba(230,80,60,0.22)"; g.fillRect(gx, gy, gw, ly - gy);
    const frac = clamp(Math.abs(vel) / (vmax * 1.4), 0, 1), fast = Math.abs(vel) > vmax, warm = Math.abs(vel) > vmax * 0.8;
    g.fillStyle = fast ? "#e5533d" : warm ? "#f0a640" : "#22b866"; g.fillRect(gx, gy + gh * (1 - frac), gw, gh * frac);
    g.restore();
    g.strokeStyle = "#e5533d"; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(gx - 6 * u, ly); g.lineTo(gx + gw + 6 * u, ly); g.stroke();
    txt(g, "Too", gx + gw / 2, gy + 14 * u, 12 * u, "#b8321f", { weight: 600 });
    txt(g, "fast", gx + gw / 2, gy + 28 * u, 12 * u, "#b8321f", { weight: 600 });
    txt(g, "Slow", gx + gw / 2, gy + gh + 18 * u, 13 * u, "#15603a", { weight: 600 });
    g.restore();
  }
  function drawFlat(g, W, H, a, t) {
    g.fillStyle = T.stage; g.fillRect(0, 0, W, H);
    const tableY = H * 0.8;
    g.fillStyle = alpha(T.ink, 0.07); g.fillRect(0, tableY, W, H - tableY);
    g.strokeStyle = T.line; g.lineWidth = 2; g.beginPath(); g.moveTo(0, tableY); g.lineTo(W, tableY); g.stroke();
    const d = dir(), cupX = W / 2 + d * Math.min(W * 0.2, 210), cupW = 92, cupH = 104, cupTop = tableY - cupH;
    g.fillStyle = T.surface; g.strokeStyle = T.ink; g.lineWidth = 3;
    g.beginPath(); g.moveTo(cupX - cupW / 2, cupTop); g.lineTo(cupX - cupW / 2 + 8, tableY); g.lineTo(cupX + cupW / 2 - 8, tableY); g.lineTo(cupX + cupW / 2, cupTop); g.closePath(); g.fill(); g.stroke();
    const lvl = cupTop + cupH * (1 - fill * 0.82);
    g.save(); g.clip(); g.fillStyle = alpha(T.accent, 0.75); g.fillRect(cupX - cupW / 2, lvl, cupW, tableY - lvl); g.restore();
    const lineY = cupTop + cupH * 0.18;
    g.setLineDash([5, 5]); g.strokeStyle = T.go; g.lineWidth = 2; g.beginPath(); g.moveTo(cupX - cupW / 2 - 10, lineY); g.lineTo(cupX + cupW / 2 + 10, lineY); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.arc(cupX + d * (cupW / 2 + 4), cupTop + 42, 16, -Math.PI / 2, Math.PI / 2, d < 0); g.strokeStyle = T.ink; g.lineWidth = 3; g.stroke();
    for (let i = 0; i < S.reps; i++) { const x = W - 28 - (S.reps - 1 - i) * 22, y = H - 28; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fillStyle = i < G._reps ? T.go : alpha(T.ink, 0.18); g.fill(); }
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
  }
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
  let roll = 0;
  G.update = function (dt, a) {
    phaseT += dt; roll = a.roll;
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
  // For the 3D scene: dial is the number under the pointer (0..9, fractional while turning).
  G.view = () => ({ type: "lock", phase, code, entered, len, dial: dialVal(roll), armed, prog: armed ? dwell / 1.0 : 0, opened: phase === "reveal" && entered.every((x, i) => x === code[i]), rounds, reps: G._reps, goal: S.reps });
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
  let maze, ball, hits = 0, hitCool = 0, mazeT = 0, times = [], win = 0, tilt = { x: 0, y: 0 };
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
    tilt = { x: tx, y: ty };
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
  // For the 3D scene: the maze, the ball (in cell units) and the tilt that is rolling it.
  G.view = () => ({ type: "maze", maze, ball, rad: RAD, win, tilt, reps: G._reps, goal: G.goal() });
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
    brain: false, pose: "handleTable", mount: "Hold the phone like a pan handle: screen up, pointing forward. Rest your forearm on the table.",
    desc: "Turn your hand to tip the teapot. Fill each cup to the green line.",
    source: "mRehab Slow Pour and Quick Twist; RAPAEL Smart Glove pouring and supination–pronation games.",
    make: (S) => PourTea(S),
  }));
RC.register(Object.assign({ section: "wrist" }, {
    id: "lock", name: "Combination Lock", movement: "Forearm rotation · working memory", axes: "Roll",
    brain: true, pose: "handleTable", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Rest your forearm on the table. Turn your hand as if turning a key.",
    desc: "Memorize the code, then turn your wrist to dial each number and hold it there.",
    source: "mRehab Unlock with Key and Turn Doorknob; Constant Therapy visual memory tasks.",
    make: (S) => in3D(ComboLock(S), "lock"),
  }));
RC.register(Object.assign({ section: "wrist" }, {
    id: "maze", name: "Tilt Maze", movement: "Wrist tilt and forearm rotation", axes: "Pitch + Roll",
    brain: true, pose: "handleTable", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Rest your forearm on the table.",
    desc: "Tilt your hand like a tray to roll the ball to the flag without bumping the walls.",
    source: "RAPAEL Smart Glove wrist flexion/extension and radial/ulnar deviation games.",
    make: (S) => in3D(TiltMaze(S), "maze"),
  }));

// ================================================================ more wrist & forearm exercises
const { bg, dots, defineArt } = RC.kit;

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
  // For the 3D scenes: the same fields as the Swing engine's view in js/moves.js.
  G.view = () => { const tg = spec.targets(S), pos = Math.max(1, ...tg.filter((v) => v > 0)), neg = Math.max(1, ...tg.filter((v) => v < 0).map(Math.abs)); return { type: "swing", val, targets: tg, side, x: val >= 0 ? val / pos : val / neg, prog: dwell / spec.hold, reps: G._reps, goal: S.reps }; };
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
    signal: (a) => a.yaw, targets: (S) => [S.amp, -S.amp], hold: 0.4,
    cues: ["Sweep your hand to the right", "Now sweep it to the left"], rangeLabels: ["Right", "Left"],
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
  // For the 3D scene: tilt and the allowed circle on a scale where 1 is 30 degrees.
  G.view = () => ({ type: "steady", x: x / 30, y: y / 30, r: radius() / 30, inside: Math.hypot(x, y) <= radius(), prog: t / dur, reps: G._reps, goal: 1 });
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
  { id: "wristbend", name: "Wrist Bend", movement: "Wrist flexion and extension", pose: "edgeDown", mount: "Rest your forearm on the table with your wrist just past the edge. Palm down, grip the phone flat against your palm: screen facing the floor, top edge toward your fingertips.",
    desc: "Bend your wrist up to the top line, then down to the bottom one.", source: "FitMi wrist bend; RAPAEL wrist flexion and extension.",
    make: (S) => in3D(WristBend(S), "wristbend") },
  { id: "wiper", name: "Wrist Wiper", movement: "Radial and ulnar deviation", pose: "palmDown", mount: "Put your hand on top of the phone, palm down, and grip its sides: screen facing the table, top edge toward your fingertips. Rest your forearm on the table.",
    desc: "Sweep your hand side to side like a windscreen wiper.", source: "RAPAEL radial and ulnar deviation; GRASP wrist range of motion.",
    make: (S) => in3D(WristWiper(S), "wiper") },
  { id: "steady", name: "Steady Cup", movement: "Holding still · steadiness", pose: "palm", mount: "Lay the phone flat on your open palm, screen up, top edge toward your fingertips. Rest your forearm on the table.",
    desc: "Keep the dot inside the circle as it slowly gets smaller.", source: "mRehab Walk with Mug (keeping a cup level).",
    params: { reps: null, level: [1, 2, 3], durationS: [30, 60, 90] }, defaults: { reps: null, level: 2, durationS: 30 },
    make: (S) => in3D(SteadyCup(S), "steady") },
].forEach((d) => RC.register(Object.assign({ section: "wrist", control: "tilt" }, d)));

defineArt("wristbend", '<rect x="18" y="32" width="46" height="12" rx="6" fill="var(--a-mute)" opacity=".3"/><rect x="62" y="20" width="32" height="12" rx="6" fill="var(--a-hi)" transform="rotate(-24 64 38)"/><path d="M64 38 L100 16 M64 38 L100 54" stroke="var(--a-hi)" stroke-width="1.5" stroke-dasharray="3 3"/>');
defineArt("wiper", '<path d="M24 56 A36 36 0 0 1 96 56" fill="var(--a-mute)" opacity=".15"/><path d="M60 56 L84 26" stroke="var(--a-ink)" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="34" r="6" fill="var(--a-hi)" opacity=".35"/><circle cx="88" cy="34" r="6" fill="var(--a-hi)"/>');
defineArt("steady", '<circle cx="60" cy="32" r="22" fill="var(--a-mute)" opacity=".12"/><circle cx="60" cy="32" r="11" fill="var(--a-go)" opacity=".2" stroke="var(--a-go)" stroke-width="2"/><circle cx="63" cy="30" r="5" fill="var(--a-hi)"/>');
})();
