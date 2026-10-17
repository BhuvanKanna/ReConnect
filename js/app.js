(() => {
"use strict";
const RC = window.RC;
const { $, clamp, lerp, TAU, reduceMotion, store, settings, saveSettings, T, alpha, txt, rr, chime, esc, fmtTime, Game, readTheme } = RC;
const { Input, Link, startPeer, renderConn, pushStatus, openActivity, renderEvidence } = RC;
const ACTIVITIES = RC.EXERCISES;
const db = (RC.db = RC.data.createData(store, () => new Date()));
db.ensureSeed();
// ---------------------------------------------------------------- views
const VIEWS = ["vPatient", "vProvider", "vPlay", "vAbout", "vLog"];
function show(id) {
  for (const v of VIEWS) $(v).hidden = v !== id;
  document.querySelectorAll("nav.tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.view === id || (id === "vPlay" && b.dataset.view === "vPatient"))));
  if (id === "vLog") renderLog();
  window.scrollTo({ top: 0 });
}
function goHome() {
  RC.endPad();
  Game.state = "idle"; Game.current = null; Game.inst = null;
  const provider = db.role() === "provider";
  if (provider) RC.provider.render(); else RC.patient.render();
  show(provider ? "vProvider" : "vPatient"); pushStatus(true);
}
document.querySelectorAll("nav.tabs button").forEach((b) => b.addEventListener("click", () => { if (b.dataset.view === "vPatient") goHome(); else { Game.state = "idle"; Game.current = null; Game.inst = null; show(b.dataset.view); pushStatus(true); } }));
$("btnBack").addEventListener("click", goHome);
$("btnSound").addEventListener("click", () => { settings.sound = !settings.sound; saveSettings(); renderSound(); });
function renderSound() { $("btnSound").textContent = settings.sound ? "Sound on" : "Sound off"; $("btnSound").setAttribute("aria-pressed", String(settings.sound)); }

function drawGlyphs() {
  document.querySelectorAll("canvas[data-glyph]").forEach((cv) => {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = Math.max(200, r.width || 250), h = 92;
    cv.width = w * dpr; cv.height = h * dpr; const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = T.stage; c.fillRect(0, 0, w, h);
    const id = cv.dataset.glyph, mx = w / 2, my = h / 2;
    c.lineWidth = 3; c.strokeStyle = T.ink; c.fillStyle = T.accent;
    if (id === "lift") { c.setLineDash([6, 5]); c.strokeStyle = T.accent; c.beginPath(); c.moveTo(20, 26); c.lineTo(w - 20, 26); c.stroke(); c.setLineDash([]); rr(c, mx - 12, 34, 24, 34, 8); c.fill(); c.strokeStyle = alpha(T.ink, .4); c.beginPath(); c.moveTo(mx, 68); c.lineTo(mx, h); c.stroke(); }
    if (id === "pour") { c.save(); c.translate(mx - 30, 40); c.rotate(0.5); c.fillStyle = T.ink; c.beginPath(); c.ellipse(0, 0, 26, 20, 0, 0, TAU); c.fill(); c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(20, -4); c.lineTo(40, -18); c.stroke(); c.restore(); c.fillStyle = T.surface; c.strokeStyle = T.ink; c.lineWidth = 2; c.fillRect(mx + 20, 50, 34, 34); c.strokeRect(mx + 20, 50, 34, 34); c.fillStyle = T.accent; c.fillRect(mx + 21, 62, 32, 21); }
    if (id === "lock") { for (let n = 0; n <= 9; n++) { const an = Math.PI + n / 9 * Math.PI; c.fillStyle = n === 6 ? T.accent : T.muted; c.font = `600 13px ${T.mono}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(n), mx + Math.cos(an) * 56, 82 + Math.sin(an) * 56); } c.lineCap = "round"; c.beginPath(); c.moveTo(mx, 82); c.lineTo(mx + Math.cos(Math.PI * 1.66) * 38, 82 + Math.sin(Math.PI * 1.66) * 38); c.stroke(); c.lineCap = "butt"; }
    if (id === "maze") { const s = 18, ox = mx - 54, oy = 14; c.lineWidth = 3; c.strokeRect(ox, oy, s * 6, s * 4); c.beginPath(); c.moveTo(ox + s * 2, oy); c.lineTo(ox + s * 2, oy + s * 3); c.moveTo(ox + s * 4, oy + s); c.lineTo(ox + s * 4, oy + s * 4); c.moveTo(ox + s * 2, oy + s * 2); c.lineTo(ox + s * 3, oy + s * 2); c.stroke(); c.beginPath(); c.arc(ox + s * 0.6, oy + s * 0.6, 6, 0, TAU); c.fill(); c.fillStyle = T.go; c.fillRect(ox + s * 5, oy + s * 3, s, s); }
    if (id === "sort") { c.strokeStyle = T.line; c.lineWidth = 2; rr(c, 14, 22, 54, 56, 8); c.stroke(); rr(c, w - 68, 22, 54, 56, 8); c.stroke(); c.fillStyle = T.surface; rr(c, mx - 40, 30, 80, 36, 8); c.fill(); c.strokeStyle = T.ink; c.stroke(); c.fillStyle = T.ink; c.font = `700 15px ${T.display}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("kettle", mx, 49); }
    if (id === "simon") { const s = 22; [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy], i) => { c.fillStyle = i === 1 ? T.accent : T.surface; rr(c, mx + dx * 26 - s / 2, my + dy * 26 - s / 2, s, s, 6); c.fill(); c.strokeStyle = T.line; c.stroke(); }); }
  });
}

// ---------------------------------------------------------------- session log
function renderLog() {
  const log = db.sessions(db.activePatientId()).slice().reverse();
  if (!log.length) {
    $("logBody").innerHTML = `<div class="empty"><b>No sessions yet</b><span>Finish any activity and it appears here with repetitions, range of motion and smoothness.</span><button class="btn amber" id="logStart">Choose an activity</button></div>`;
    $("logStart").onclick = goHome; return;
  }
  const fr = (r) => r ? `${r[0]}° to ${r[1]}°` : "–";
  $("logBody").innerHTML = `<div class="tablewrap"><table><thead><tr><th>Date</th><th>Activity</th><th>Side</th><th>Reps</th><th>Time</th><th>Pitch range</th><th>Roll range</th><th>Smoothness</th><th>Details</th></tr></thead><tbody>${
    log.map((e) => `<tr><td class="num">${new Date(e.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td><td><b>${esc(e.name)}</b>${e.input === "mouse" ? ' <span class="chip">mouse</span>' : ""}</td><td>${esc(e.side)}</td><td class="num">${e.reps} / ${e.goal}</td><td class="num">${fmtTime(e.seconds)}</td><td class="num">${fr(e.pitch)}</td><td class="num">${fr(e.roll)}</td><td class="num">${e.peaksPerRep == null ? "–" : e.peaksPerRep + " pk/rep"}</td><td>${(e.extra || []).map(([k, v]) => `${esc(k)}: ${esc(v)}`).join("<br>")}</td></tr>`).join("")
  }</tbody></table></div>`;
}
$("btnCopy").addEventListener("click", () => {
  const log = db.sessions(db.activePatientId());
  const lines = ["ReConnect home rehab summary", `Generated ${new Date().toLocaleString()}`, ""];
  if (!log.length) lines.push("No sessions recorded yet.");
  for (const e of log.slice(-30)) {
    lines.push(`${new Date(e.at).toLocaleDateString()} · ${e.name} (${e.movement}) · ${e.side} side · ${e.reps}/${e.goal} reps in ${fmtTime(e.seconds)}` +
      ` · pitch ${e.pitch ? e.pitch.join("° to ") + "°" : "–"} · roll ${e.roll ? e.roll.join("° to ") + "°" : "–"}` +
      (e.peaksPerRep != null ? ` · ${e.peaksPerRep} speed peaks/rep` : "") + (e.input === "mouse" ? " · MOUSE MODE (not patient data)" : "") +
      ((e.extra || []).length ? ` · ${(e.extra || []).map(([k, v]) => `${k} ${v}`).join(", ")}` : ""));
  }
  const text = lines.join("\n");
  const fallback = () => { const ta = $("copyFallback"); ta.hidden = false; ta.value = text; ta.focus(); ta.select(); $("copyMsg").textContent = "Copying is blocked here. The summary is selected below; press Ctrl+C or Cmd+C."; };
  try { navigator.clipboard.writeText(text).then(() => { $("copyMsg").textContent = "Summary copied. Paste it into an email or patient portal message."; }, fallback); } catch (_) { fallback(); }
});
let clearArmed = false;
$("btnClear").addEventListener("click", () => {
  if (!clearArmed) { clearArmed = true; $("btnClear").textContent = "Tap again to delete all sessions"; setTimeout(() => { clearArmed = false; $("btnClear").textContent = "Clear log"; }, 3000); return; }
  db.clearSessions(db.activePatientId()); clearArmed = false; $("btnClear").textContent = "Clear log"; renderLog(); RC.patient.render();
});
RC.drawGlyphs = drawGlyphs;
Object.assign(RC, { show, goHome });
// ---------------------------------------------------------------- boot
renderEvidence(); renderSound();
Input.mode = "mouse";
Link.hosted = typeof window.Peer === "function" && /^https?:$/.test(location.protocol);
$("pHosted").hidden = !Link.hosted; $("pArtifact").hidden = Link.hosted;
if (Link.hosted) startPeer();
renderConn();
window.addEventListener("resize", () => drawGlyphs());
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { readTheme(); drawGlyphs(); });
// ---------------------------------------------------------------- demo role switch, patient picker, pairing drawer
function renderRole() {
  const role = db.role();
  $("rolePatient").setAttribute("aria-pressed", String(role === "patient"));
  $("roleProvider").setAttribute("aria-pressed", String(role === "provider"));
  $("navPatient").hidden = role !== "patient";
  $("patientSel").hidden = role !== "patient";
  const active = db.activePatientId();
  $("patientSel").innerHTML = db.patients().map((p) => `<option value="${esc(p.id)}"${p.id === active ? " selected" : ""}>${esc(p.name)}</option>`).join("");
}
RC.renderRole = renderRole;
function setRole(role) { db.setRole(role); renderRole(); goHome(); }
$("roleSwitch").addEventListener("click", (e) => { const b = e.target.closest("button[data-role]"); if (b) setRole(b.dataset.role); });
$("patientSel").addEventListener("change", (e) => { db.setActivePatient(e.target.value); renderRole(); goHome(); });
function setDrawer(open) { $("pairDrawer").hidden = !open; $("conn").setAttribute("aria-expanded", String(open)); }
$("conn").addEventListener("click", (e) => { e.stopPropagation(); setDrawer($("pairDrawer").hidden); });
$("pairClose").addEventListener("click", () => setDrawer(false));
document.addEventListener("click", (e) => { if (!$("pairDrawer").hidden && !e.target.closest("#pairDrawer")) setDrawer(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setDrawer(false); });
renderRole();
goHome();

// Roll the Today bar over to a new day without a reload (app left open past midnight).
let shownDay = RC.plan.dateKey(new Date());
function checkDay(force) {
  const k = RC.plan.dateKey(new Date());
  if ((force || k !== shownDay) && !$("vPatient").hidden) RC.patient.render();
  shownDay = k;
}
setInterval(() => checkDay(false), 60000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkDay(true); });
window.addEventListener("focus", () => checkDay(false));

window.__mend = { Game, Input, data: db, plan: RC.plan }; // read by the automated tests

})();
