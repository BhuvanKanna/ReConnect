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


// Free whatever the running exercise holds (its 3D scene) before it is dropped.
Game.release = function () { const i = Game.inst; if (i && i.dispose) { try { i.dispose(); } catch (e) { /* already gone */ } } };

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
  if (def.scenes) Game.current.cfg.scene = def.scenes.some((s) => s.id === base.scene) ? base.scene : def.scenes[0].id;
  Game.release(); Game.inst = null; Game.state = "setup";
  $("pTitle").textContent = def.name; $("pMove").textContent = def.movement;
  show("vPlay"); resize(); renderSetup(); pushStatus(true);
}

function patientSide() {
  const db = RC.db, pt = db && db.patients().find((p) => p.id === db.activePatientId());
  return pt ? pt.side : settings.side;
}
function settingsObj() {
  const c = Game.current.cfg;
  return { amp: LEVEL_AMP[c.level], level: c.level, reps: c.reps, durationS: c.durationS, side: patientSide(), scene: c.scene };
}
function setupControls() {
  const d = Game.current.def, c = Game.current.cfg, locked = !!Game.current.item, p = d.params || {};
  const lvl = (v) => (d.control === "tilt" ? `${LEVEL_AMP[v]}°` : ["Easy", "Medium", "Hard"][v - 1] || v);
  const seg = (id, key, vals, label, fmt) => (vals ? `<div class="field"><label>${label}</label><div class="seg" id="${id}" data-key="${key}">${vals.map((v) => `<button data-v="${v}" aria-pressed="${v === c[key]}"${locked ? " disabled" : ""}>${fmt(v)}</button>`).join("")}</div></div>` : "");
  // Exercises with several worlds to choose from (Trunk Twist): the patient can always pick, even for assigned work.
  const scenes = d.scenes ? `<div class="field scenefield"><label>Scene</label><div class="scenes" id="setScene">${d.scenes.map((s) => `<button data-s="${s.id}" aria-pressed="${s.id === c.scene}"><span class="sc-ic" aria-hidden="true">${s.icon}</span>${s.name}</button>`).join("")}</div></div>` : "";
  return `${scenes}<div class="setctl">${seg("setLevel", "level", p.level, d.control === "tilt" ? "Range target" : "Level", lvl)}${seg("setReps", "reps", p.reps, "Repetitions", String)}${seg("setDur", "durationS", p.durationS, "Time", fmtTime)}</div>
    ${locked ? '<p class="note assigned">Set by your therapist for today.</p>' : ""}`;
}

// The instructions for one exercise (js/guides.js), falling back to its short description.
const guideOf = (d) => (RC.GUIDES && RC.GUIDES[d.id]) || { goal: d.desc, steps: [], unit: "" };
// "lift" -> "lifts"; "glass|glasses" names an irregular plural.
function plural(unit, n) {
  const [one, many] = unit.split("|");
  if (n === 1) return one;
  if (many) return many;
  return /(s|sh|ch|x)$/.test(one) ? one + "es" : /[^aeiou]y$/.test(one) ? one.slice(0, -1) + "ies" : one + "s";
}
const spoken = (s) => (s < 60 ? `${s} seconds` : s % 60 ? fmtTime(s) : `${s / 60} minute${s === 60 ? "" : "s"}`);
// The safety line: the guide's own, or one chosen from where the exercise is done.
function safetyOf(d, gd) {
  if (gd.safe) return gd.safe;
  const pose = RC.poses.poseOf(d);
  if (d.safety === "standing") return "Stand at a sturdy counter you can hold, with a chair behind you and someone nearby. Sit down if you feel dizzy or unsteady.";
  if (pose === "thighLying" || pose === "sideLying") return "Lie on a firm bed or a mat. Take your time getting down and back up.";
  if (pose === "head") return "Move slowly and only as far as is comfortable. Stop if you feel dizzy.";
  if (d.control === "tilt" || d.control === "accel") return "Sit in a sturdy chair without wheels. Move only as far as is comfortable, and stop if anything hurts.";
  if (d.control === "guided") return "Go at your own pace, and stop if anything hurts.";
  return null; // tap and brain games
}

function renderSetup() {
  const d = Game.current.def, c = Game.current.cfg, gd = guideOf(d), sideTxt = patientSide() === "left" ? "left" : "right";
  const phoneReady = Input.phone && !settings.mouse, pose = d.mount ? RC.poses.poseOf(d) : null;
  // Today's amount in words, from the settings below (they re-render this sheet when changed).
  const amount = c.durationS ? `for ${spoken(c.durationS)}` : c.reps && gd.unit ? `${c.reps} ${plural(gd.unit, c.reps)}` : c.reps ? `${c.reps} times` : "";
  const safe = safetyOf(d, gd);
  const phoneTxt = d.mount ? d.mount.replace("affected", sideTxt + " (affected)") : "";
  const level = d.params && d.params.level ? (d.control === "tilt" ? `${LEVEL_AMP[c.level]}° range` : `${["Easy", "Medium", "Hard"][c.level - 1]} level`) : "";
  stageWrap.classList.add("briefing");
  $("overlay").hidden = false; $("banner").hidden = true;
  $("sheet").innerHTML = `
    <div class="brief-head">
      <h2>${d.name}</h2>
      <p class="brief-goal">${gd.goal}</p>
      ${amount || level ? `<p class="brief-today"><span class="btag">Today</span>${[amount, level].filter(Boolean).map((s) => `<b>${s}</b>`).join('<span aria-hidden="true">·</span>')}</p>` : ""}
    </div>
    ${!pose && (gd.ready || d.mount) ? `<p class="brief-note"><span class="btag">Get ready</span>${[gd.ready, d.mount ? `<b>Phone:</b> ${phoneTxt}` : ""].filter(Boolean).join(" ")}</p>` : ""}
    <div class="brief-grid${pose ? " two" : ""}">
      ${pose ? `<section class="brief-card ready" aria-labelledby="bReady">
        <h3 id="bReady">Get ready</h3>
        ${RC.poses.svg(pose)}
        ${gd.ready ? `<p>${gd.ready}</p>` : ""}
        <p class="brief-phone"><b>Phone:</b> ${phoneTxt}</p>
      </section>` : ""}
      <section class="brief-card do" aria-labelledby="bDo">
        <h3 id="bDo">What to do</h3>
        <ol class="brief-steps">${gd.steps.map((h) => `<li><span>${h}</span></li>`).join("")}</ol>
        ${gd.rep ? `<p class="brief-rep"><b>One ${gd.unit ? plural(gd.unit, 1) : "repetition"}:</b> ${gd.rep}</p>` : c.durationS ? `<p class="brief-rep"><b>Keep going for ${spoken(c.durationS)}.</b> It ends by itself when the time is up.</p>` : ""}
      </section>
    </div>
    ${gd.tip ? `<p class="brief-note"><span class="btag tip">Tip</span>${gd.tip}</p>` : ""}
    ${safe ? `<p class="brief-note"><span class="btag safe">Safety</span>${safe}</p>` : ""}
    ${setupControls()}
    <div class="actions">
      <button class="btn amber" id="goPhone" ${phoneReady ? "" : "disabled"}>Start with phone</button>
      <button class="btn alt" id="goMouse">${phoneReady ? "Use mouse instead" : "Start in mouse mode"}</button>
    </div>
    ${phoneReady ? "" : `<p class="note">${Link.hosted ? "Tap the phone button at the top right and scan the QR code to connect your phone." : "Mouse mode: move the pointer over the stage (or use the arrow keys). Up means raise or tip the top edge up."}</p>`}`;
  // Touch and guided exercises use the phone as a tap pad, so there is no tilt to calibrate.
  $("goPhone").onclick = () => { Input.mode = "phone"; if ((d.control === "touch" && !d.cursor) || d.control === "guided") begin(); else startCalibration(); };
  $("goMouse").onclick = () => { Input.mode = "mouse"; renderConn(); begin(); };
  const sc = $("setScene");
  if (sc) sc.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-s]"); if (!b) return;
    Game.current.cfg.scene = b.dataset.s;
    settings.per[d.id] = Object.assign({}, settings.per[d.id] || {}, { scene: b.dataset.s }); saveSettings();
    renderSetup();
  });
  $("sheet").querySelectorAll(".setctl .seg").forEach((el) => el.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || b.disabled) return;
    Game.current.cfg[el.dataset.key] = Number(b.dataset.v);
    settings.per[d.id] = Object.assign({}, Game.current.cfg); saveSettings();
    renderSetup();
  }));
}

function startCalibration() {
  Game.state = "calibrate"; pushStatus(true); stageWrap.classList.remove("briefing");
  let n = 3; const samples = [];
  $("sheet").innerHTML = `<span class="eyebrow">Calibrating</span><h2>Rest in your starting position and hold still</h2>${RC.poses.svg(RC.poses.poseOf(Game.current.def))}<div class="count num" id="cnt">3</div><p class="muted">This sets the zero point, so every target is measured from where your arm is comfortable.</p>`;
  const iv = setInterval(() => {
    samples.push(Input.q);
    if (samples.length % 10 === 0) { n--; const el = $("cnt"); if (el) el.textContent = Math.max(n, 1); chime("tick"); }
    if (samples.length >= 30) {
      clearInterval(iv);
      Input.q = RC.Orient.average(samples.slice(-12));
      RC.setRest(RC.poseFlip(Game.current.def));
      sendPhone({ type: "calibrated" });
      begin();
    }
  }, 100);
}

function begin() {
  const S = settingsObj();
  Game.release();
  Game.inst = Game.current.def.make(S);
  Game.inst.S = S;
  Game.rec = []; Game.t0 = performance.now(); Game.state = "play"; stageWrap.classList.remove("briefing");
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
      const ai = forExercise(a);
      Game.inst.update(dt, ai);
      Game.rec.push({ t: (now - Game.t0) / 1000, p: ai.pitch, r: ai.roll });
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

// Phone angles as this exercise reads them: pointing exercises steer sideways by turning (yaw),
// and anatomical directions are mirrored for a left affected side. Mouse mode is left as it is.
function forExercise(a) {
  if (Input.mode !== "phone" || !Game.current) return a;
  const id = Game.current.def.id, P = RC.poses;
  let b = a;
  if (P.POINT.has(id)) b = Object.assign({}, b, { roll: b.yaw });
  if (P.MIRROR.has(id) && patientSide() === "left") b = Object.assign({}, b, { roll: -b.roll, yaw: -b.yaw });
  return b;
}

function draw(a, now) {
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.clearRect(0, 0, W, H);
  if (Game.inst && (Game.state === "play" || Game.state === "paused" || Game.state === "results")) Game.inst.draw(g, W, H, forExercise(a), now / 1000);
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
