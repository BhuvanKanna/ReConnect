(() => {
"use strict";
const RC = window.RC;
const { $, clamp, lerp, TAU, reduceMotion, store, settings, saveSettings, T, alpha, txt, rr, chime, esc, fmtTime, Game, readTheme } = RC;
const { Input, angles, smoothInput, Link, sendPhone, pushStatus, renderConn, LEVEL_AMP } = RC;
const stageWrap = $("stageWrap");
const show = (...a) => RC.show(...a);
const goHome = (...a) => RC.goHome(...a);
const canvas = $("stage"), g = canvas.getContext("2d");
let W = 800, H = 500, DPR = 1;
function resize() {
  const r = stageWrap.getBoundingClientRect(); DPR = Math.min(2, window.devicePixelRatio || 1);
  W = Math.max(300, r.width); H = Math.max(300, r.height);
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
}
new ResizeObserver(() => { resize(); }).observe(stageWrap);


function fx(kind) {
  chime(kind);
  sendPhone({ type: "haptic", pattern: kind === "error" ? [120, 60, 120] : kind === "big" ? [60, 40, 60, 40, 120] : [50] });
}

// Settings come from the provider's plan item when there is one, otherwise from what this
// patient last used for the exercise, otherwise from the exercise's defaults.
function openActivity(def, opts = {}) {
  const db = RC.db, pt = db && db.patients().find((p) => p.id === db.activePatientId());
  if (def.safety && !(pt && pt.enabled && pt.enabled[def.id])) return; // standing work stays locked until the provider turns it on
  const per = (settings.per = settings.per || {});
  const base = Object.assign({}, def.defaults, per[def.id] || {});
  const item = opts.item || null;
  const pick = (k) => (item && item[k] != null ? item[k] : base[k]);
  Game.current = { def, item, cfg: { reps: pick("reps"), level: pick("level"), durationS: pick("durationS") } };
  Game.inst = null; Game.state = "setup";
  $("pTitle").textContent = def.name; $("pMove").textContent = def.movement;
  show("vPlay"); resize(); renderSetup(); pushStatus(true);
}

function patientSide() {
  const db = RC.db, pt = db && db.patients().find((p) => p.id === db.activePatientId());
  return pt ? pt.side : settings.side;
}
function settingsObj() {
  const c = Game.current.cfg;
  return { amp: LEVEL_AMP[c.level], level: c.level, reps: c.reps, durationS: c.durationS, side: patientSide() };
}
function setupControls() {
  const d = Game.current.def, c = Game.current.cfg, locked = !!Game.current.item, p = d.params || {};
  const lvl = (v) => (d.control === "tilt" ? `${LEVEL_AMP[v]}°` : ["Easy", "Medium", "Hard"][v - 1] || v);
  const seg = (id, key, vals, label, fmt) => (vals ? `<div class="field"><label>${label}</label><div class="seg" id="${id}" data-key="${key}">${vals.map((v) => `<button data-v="${v}" aria-pressed="${v === c[key]}"${locked ? " disabled" : ""}>${fmt(v)}</button>`).join("")}</div></div>` : "");
  return `<div class="setctl">${seg("setLevel", "level", p.level, d.control === "tilt" ? "Range target" : "Level", lvl)}${seg("setReps", "reps", p.reps, "Repetitions", String)}${seg("setDur", "durationS", p.durationS, "Time", fmtTime)}</div>
    ${locked ? '<p class="note assigned">Set by your therapist for today.</p>' : ""}`;
}

function renderSetup() {
  const d = Game.current.def; const sideTxt = patientSide() === "left" ? "left" : "right";
  const phoneReady = Input.phone && !settings.mouse;
  $("overlay").hidden = false; $("banner").hidden = true;
  $("sheet").innerHTML = `
    <span class="eyebrow">${d.movement}</span>
    <h2>${d.name}</h2>
    <p>${d.desc}</p>
    ${d.mount ? `<p class="muted"><b>Phone:</b> ${d.mount.replace("affected", sideTxt + " (affected)")}</p>` : ""}
    <ol class="howto">${d.how.map((h) => `<li>${h}</li>`).join("")}</ol>
    ${setupControls()}
    <p class="note">Sit in a sturdy chair. Stop if anything hurts.</p>
    <div class="actions">
      <button class="btn amber" id="goPhone" ${phoneReady ? "" : "disabled"}>Start with phone</button>
      <button class="btn alt" id="goMouse">${phoneReady ? "Use mouse instead" : "Start in mouse mode"}</button>
    </div>
    ${phoneReady ? "" : `<p class="note">${Link.hosted ? "Tap the phone button at the top right and scan the QR code to connect your phone." : "Mouse mode: move the pointer over the stage (or use the arrow keys). Up means raise or tip the top edge up."}</p>`}`;
  // Touch and guided exercises use the phone as a tap pad, so there is no tilt to calibrate.
  $("goPhone").onclick = () => { Input.mode = "phone"; if ((d.control === "touch" && !d.cursor) || d.control === "guided") begin(); else startCalibration(); };
  $("goMouse").onclick = () => { Input.mode = "mouse"; renderConn(); begin(); };
  $("sheet").querySelectorAll(".setctl .seg").forEach((el) => el.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || b.disabled) return;
    Game.current.cfg[el.dataset.key] = Number(b.dataset.v);
    settings.per[d.id] = Object.assign({}, Game.current.cfg); saveSettings();
    renderSetup();
  }));
}

function startCalibration() {
  Game.state = "calibrate"; pushStatus(true);
  let n = 3; const samples = [];
  $("sheet").innerHTML = `<span class="eyebrow">Calibrating</span><h2>Rest in your starting position and hold still</h2><div class="count num" id="cnt">3</div><p class="muted">This sets the zero point, so every target is measured from where your arm is comfortable.</p>`;
  const iv = setInterval(() => {
    samples.push({ b: Input.f.b, g: Input.f.g, a: Input.f.a });
    if (samples.length % 10 === 0) { n--; const el = $("cnt"); if (el) el.textContent = Math.max(n, 1); chime("tick"); }
    if (samples.length >= 30) {
      clearInterval(iv);
      const tail = samples.slice(-12);
      const avg = (k) => tail.reduce((s, x) => s + x[k], 0) / tail.length;
      Input.neutral = { b: avg("b"), g: avg("g"), a: Input.f.a };
      sendPhone({ type: "calibrated" });
      begin();
    }
  }, 100);
}

function begin() {
  const S = settingsObj();
  Game.inst = Game.current.def.make(S);
  Game.inst.S = S;
  Game.rec = []; Game.t0 = performance.now(); Game.state = "play";
  Input.mouse = { p: 0, r: 0 }; Input.mf = { p: 0, r: 0 };
  $("overlay").hidden = true; $("banner").hidden = false;
  startPad();
  pushStatus(true);
}

// Phone touch pad: shown on the phone while a pad exercise runs. If the phone drops out mid-way the
// exercise keeps going and its on-stage keys take over.
function startPad() {
  const d = Game.current.def;
  Game.padActive = false; Game.padFallback = false; Game.padAck = false;
  if (d.pad && Input.phone && Link.conn && Link.conn.open) {
    sendPhone({ type: "pad", layout: d.pad, labels: Game.inst.padLabels ? Game.inst.padLabels() : null });
    Game.padActive = true;
  }
}
function endPad() { if (Game.padActive) sendPhone({ type: "pad", layout: null }); Game.padActive = false; Game.padFallback = false; }
function padDisconnected() {
  if (!Game.padActive || Game.state !== "play") return false;
  Game.padActive = false; Game.padFallback = true; Game.padAck = false;
  return true;
}

function pauseForPhone() {
  Game.state = "paused";
  $("overlay").hidden = false;
  $("sheet").innerHTML = `<span class="eyebrow">Paused</span><h2>The phone disconnected</h2><p class="muted">Keep the ReConnect page open on the phone. The activity resumes as soon as it reconnects.</p><div class="actions"><button class="btn alt" id="resMouse">Continue in mouse mode</button></div>`;
  $("resMouse").onclick = () => { Input.mode = "mouse"; settings.mouse = true; renderConn(); resume(); };
}
function resume() { Game.state = "play"; $("overlay").hidden = true; pushStatus(true); }

let flashT = 0;
function flash(title, text, tone) { Game.banner = { title, text, tone }; flashT = performance.now() + 1600; }

// Build and save the session; `assigned` says whether it filled one of today's plan items.
function record(completed) {
  const def = Game.current.def, inst = Game.inst, S = inst.S;
  const a = analyze(Game.rec, inst.reps());
  const own = inst.stats();
  const entry = {
    at: new Date().toISOString(), id: def.id, name: def.name, movement: def.movement, side: S.side, targetDeg: S.amp,
    reps: inst.reps(), goal: inst.goal(), level: S.level, targetReps: S.reps, durationS: S.durationS,
    seconds: Math.round((performance.now() - Game.t0) / 1000), input: Input.mode,
    pitch: a.pitch, roll: a.roll, peaksPerRep: a.peaksPerRep, activeS: Math.round(a.activeS),
    extra: own.map(([k, v]) => [k, String(v)]),
  };
  const db = RC.db, P = RC.plan, pid = db.activePatientId(), key = P.dateKey(new Date());
  const todays = db.sessions(pid).filter((s) => P.sessionDay(s) === key);
  Object.assign(entry, { patientId: pid, completed });
  entry.assigned = completed && P.matchDay(P.itemsFor(db.plan(pid), key), todays.concat(entry)).assignedAt.has(entry.at);
  db.addSession(entry);
  return { entry, a, own };
}
// Test hook: end the running exercise now (recorded as not completed) and return to the library.
Game.finishNow = function () { if (Game.inst && Game.state === "play") record(false); goHome(); };

function finish() {
  Game.state = "results";
  const def = Game.current.def;
  const { entry, a, own } = record(true);
  endPad();
  fx("big");
  $("overlay").hidden = false; $("banner").hidden = true;
  const fmtR = (r) => r ? `${r[0] > 0 ? "+" : ""}${r[0]}° to ${r[1] > 0 ? "+" : ""}${r[1]}°` : "–";
  const stats = [
    ["Repetitions", `${entry.reps} / ${entry.goal}`],
    ["Time", fmtTime(entry.seconds)],
    ...own,
    ["Pitch range", fmtR(a.pitch)],
    ["Roll range", fmtR(a.roll)],
    ["Speed peaks per rep (smoothness)", a.peaksPerRep == null ? "–" : String(a.peaksPerRep)],
  ];
  $("sheet").innerHTML = `
    <span class="eyebrow">Session complete · ${entry.input === "mouse" ? "mouse mode" : "phone"}</span>
    <h2>${def.name}: ${entry.reps} repetitions in ${fmtTime(entry.seconds)}</h2>
    <div class="stats">${stats.map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join("")}</div>
    <p class="note">${entry.assigned ? "This counts toward today's plan." : "Saved as bonus practice."} Smoothness counts speed peaks per repetition, as mRehab does with its jerk score; fewer peaks means a smoother movement.</p>
    <div class="actions"><button class="btn" id="home">Back to today</button><button class="btn alt" id="again">Play again</button></div>`;
  $("again").onclick = () => renderSetupAgain();
  $("home").onclick = () => goHome();
  pushStatus(true);
  if (RC.patient) RC.patient.render();
}
function renderSetupAgain() { Game.state = "setup"; renderSetup(); pushStatus(true); }

// Range of motion and a simple smoothness measure from the recorded angles.
// Angles are resampled to 20 Hz, angular speed is smoothed, and prominent speed peaks are counted.
// A smooth out-and-back repetition has about two peaks; jerky, corrected movements have more.
function analyze(rec, reps) {
  if (rec.length < 5) return { pitch: null, roll: null, peaksPerRep: null, activeS: 0 };
  let pMin = Infinity, pMax = -Infinity, rMin = Infinity, rMax = -Infinity;
  for (const s of rec) { pMin = Math.min(pMin, s.p); pMax = Math.max(pMax, s.p); rMin = Math.min(rMin, s.r); rMax = Math.max(rMax, s.r); }
  const DT = 0.05, rs = []; let j = 0;
  for (let t = rec[0].t; t <= rec[rec.length - 1].t; t += DT) {
    while (j < rec.length - 2 && rec[j + 1].t < t) j++;
    const a = rec[j], b = rec[j + 1], u = clamp((t - a.t) / Math.max(1e-6, b.t - a.t), 0, 1);
    rs.push({ p: lerp(a.p, b.p, u), r: lerp(a.r, b.r, u) });
  }
  const sp = []; for (let i = 1; i < rs.length; i++) sp.push(Math.hypot(rs[i].p - rs[i - 1].p, rs[i].r - rs[i - 1].r) / DT);
  const sm = sp.map((_, i) => { let s = 0, n = 0; for (let k = Math.max(0, i - 2); k <= Math.min(sp.length - 1, i + 2); k++) { s += sp[k]; n++; } return s / n; });
  const sorted = sm.slice().sort((x, y) => x - y), p90 = sorted.length ? sorted[Math.floor(sorted.length * 0.9)] : 0, thr = Math.max(10, p90 * 0.25);
  let peaks = 0, inPeak = false, pk = 0, trough = Infinity, activeS = 0;
  for (const v of sm) {
    if (v > 6) activeS += DT;
    if (!inPeak) { trough = Math.min(trough, v); if (v > thr && v > trough * 1.6 + 2) { inPeak = true; pk = v; } }
    else { pk = Math.max(pk, v); if (v < pk * 0.6) { peaks++; inPeak = false; trough = v; } }
  }
  if (inPeak) peaks++;
  const R = (x) => Math.round(x);
  return { pitch: [R(pMin), R(pMax)], roll: [R(rMin), R(rMax)], peaksPerRep: reps ? +(peaks / reps).toFixed(1) : null, activeS };
}

// ---------------------------------------------------------------- main loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  smoothInput(dt);
  const a = angles();
  if (!$("vPlay").hidden) {
    $("gP").textContent = (a.pitch >= 0 ? "+" : "") + Math.round(a.pitch) + "°";
    $("gR").textContent = (a.roll >= 0 ? "+" : "") + Math.round(a.roll) + "°";
    if (Game.state === "play" && Game.inst) {
      Game.inst.update(dt, a);
      Game.rec.push({ t: (now - Game.t0) / 1000, p: a.pitch, r: a.roll });
      if (Game.rec.length > 40000) Game.rec.splice(0, 1000);
      for (const e of Game.inst.events.splice(0)) fx(e);
      if (Game.inst.done) finish();
      if (Input.mode === "phone" && Input.phone && Game.current.def.control !== "touch" && Game.current.def.control !== "guided" && now - Input.lastAt > 3000) flash("No motion data from the phone", "Check that the phone screen is on and ReConnect is open.", "warn");
    }
    $("gReps").textContent = Game.inst ? `${Game.inst.reps()} / ${Game.inst.goal()}` : `0 / ${settings.reps}`;
    draw(a, now);
    if (Game.state === "play") pushStatus(false);
  }
  requestAnimationFrame(frame);
}

function draw(a, now) {
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.clearRect(0, 0, W, H);
  if (Game.inst && (Game.state === "play" || Game.state === "paused" || Game.state === "results")) Game.inst.draw(g, W, H, a, now / 1000);
  else drawIdle(a, now / 1000);
  // live tilt cursor in the corner shows the input is alive (motion exercises only)
  const ctl = Game.current && Game.current.def.control;
  if (!ctl || ctl === "tilt" || ctl === "accel") {
    const cx = W - 46, cy = H - 46, R = 30;
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fillStyle = alpha(T.surface, 0.85); g.fill(); g.strokeStyle = T.line; g.lineWidth = 1; g.stroke();
    g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
    const dx = clamp(a.roll / 60, -1, 1) * (R - 7), dy = -clamp(a.pitch / 60, -1, 1) * (R - 7);
    g.beginPath(); g.arc(cx + dx, cy + dy, 6, 0, TAU); g.fillStyle = T.accent; g.fill();
  }
  // banner
  let b = null;
  if (Game.state === "play" && Game.inst) b = Game.inst.status();
  if (flashT > now && Game.banner) b = Game.banner;
  if (Game.padFallback && !Game.padAck) b = { title: "Phone disconnected", text: "Use the mouse or touchscreen to keep going.", tone: "warn" };
  const bn = $("banner");
  if (b && Game.state === "play") {
    bn.hidden = false;
    if ($("bTitle").textContent !== b.title) $("bTitle").textContent = b.title;
    if ($("bText").textContent !== (b.text || "")) $("bText").textContent = b.text || "";
    bn.className = "banner " + (b.tone || "");
  }
}
function drawIdle(a, t) {
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, T["sky-top"]); grd.addColorStop(1, T["sky-bot"]);
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
}
Object.assign(RC, { openActivity, renderSetup, flash, pauseForPhone, resume, finish, endPad, padDisconnected });
requestAnimationFrame(frame);
})();
