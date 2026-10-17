// Provider side: patient list, the 30-day plan builder, and (Task 7) progress.
(() => {
"use strict";
const RC = window.RC;
const { $, esc } = RC;
const P = RC.plan;
const db = () => RC.db;
const UI = { patientId: null, day: 0, tab: "plan", q: "", adding: false, safety: null };
const LEVELS = { 1: "Easy", 2: "Medium", 3: "Hard" };

function patients() { return db().patients(); }
function current() { const list = patients(); return list.find((p) => p.id === UI.patientId) || list[0] || null; }
function todayKey() { return P.dateKey(new Date()); }
function onTrack(p) {
  const pl = db().plan(p.id);
  if (!pl) return "none";
  const pr = P.progress(pl, db().sessions(p.id), todayKey());
  return !pr.daysDue || pr.daysDone / pr.daysDue >= 0.8 ? "ok" : "behind";
}

function renderSidebar() {
  const cur = current();
  return `<aside class="pv-side">
    <p class="pv-label">Patients</p>
    <ul id="pvPatients" class="pv-patients">${patients().map((p) => `
      <li><button class="pt${cur && p.id === cur.id ? " on" : ""}" data-id="${esc(p.id)}"><span>${esc(p.name)}</span><i class="dot ${onTrack(p)}" title="${{ ok: "On track", behind: "Behind", none: "No plan" }[onTrack(p)]}"></i></button></li>`).join("")}
    </ul>
    ${UI.adding ? `<form class="pv-new" id="pvNewForm">
        <label for="pvNewName">Name</label><input id="pvNewName" autocomplete="off" required>
        <label for="pvNewSide">Affected side</label><select id="pvNewSide"><option value="right">Right</option><option value="left">Left</option></select>
        <div class="actions"><button class="btn" id="pvNewSave" type="submit">Add</button><button class="btn alt" type="button" id="pvNewCancel">Cancel</button></div>
      </form>` : `<button class="pv-add" id="pvAddPatient">+ Add patient</button>`}
    <button class="pv-reset" id="resetDemo">Reset demo data</button>
  </aside>`;
}

function chipsFor(day) {
  if (day.rest) return '<span class="cal-rest">Rest</span>';
  return day.items.map((it) => { const d = RC.exercise(it.exerciseId); return `<span class="chip${d && ["scanning", "attention", "memory", "reasoning", "language"].includes(d.section) ? " brain" : ""}">${esc(d ? d.name : it.exerciseId)}</span>`; }).join("");
}

function renderCalendar(pl) {
  const [y, m, d] = pl.start.split("-").map(Number);
  const lead = (new Date(y, m - 1, d).getDay() + 6) % 7; // Monday-first grid
  const tk = todayKey();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<span class="calpad"></span>');
  pl.days.forEach((day, i) => {
    const key = P.addDays(pl.start, i), [yy, mm, dd] = key.split("-").map(Number);
    const label = new Date(yy, mm - 1, dd).toLocaleDateString([], { month: "short", day: "numeric" });
    cells.push(`<button class="calday${i === UI.day ? " sel" : ""}${key === tk ? " today" : ""}${day.rest ? " rest" : ""}" data-day="${i}" aria-pressed="${i === UI.day}">
      <span class="cal-date"><b>${i + 1}</b> ${esc(label)}</span>${chipsFor(day)}</button>`);
  });
  return `<div class="calhead">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => `<span>${w}</span>`).join("")}</div><div class="cal">${cells.join("")}</div>`;
}

function itemRow(it, i) {
  const d = RC.exercise(it.exerciseId) || { name: it.exerciseId, params: {} }, p = d.params || {};
  const opt = (vals, cur, fmt) => vals.map((v) => `<option value="${v}"${v === cur ? " selected" : ""}>${fmt(v)}</option>`).join("");
  return `<li class="item" data-index="${i}">
    <span class="item-name">${esc(d.name)}${d.safety ? ' <span class="warn-tag">Standing</span>' : ""}</span>
    <label>Level <select name="level">${opt(p.level || [1, 2, 3], it.level, (v) => LEVELS[v] || v)}</select></label>
    ${p.reps ? `<label>Reps <select name="reps">${opt(p.reps, it.reps, String)}</select></label>` : ""}
    ${p.durationS ? `<label>Time <select name="durationS">${opt(p.durationS, it.durationS, RC.fmtTime)}</select></label>` : ""}
    <button class="iconbtn remove" aria-label="Remove ${esc(d.name)}">×</button></li>`;
}

function renderPicker() {
  const q = UI.q.trim().toLowerCase();
  const hits = RC.EXERCISES.filter((d) => !q || d.name.toLowerCase().includes(q) || (d.movement || "").toLowerCase().includes(q));
  return RC.SECTIONS.map(([id, name]) => {
    const list = hits.filter((d) => d.section === id);
    return list.length ? `<div class="pick-sec"><p>${esc(name)}</p>${list.map((d) => `<button class="pick" data-id="${esc(d.id)}">+ ${esc(d.name)}${d.safety ? " ⚠︎" : ""}</button>`).join("")}</div>` : "";
  }).join("") || '<p class="muted">No exercise matches that search.</p>';
}

function renderDay(pt, pl) {
  const day = pl.days[UI.day], key = P.addDays(pl.start, UI.day);
  const [y, m, d] = key.split("-").map(Number);
  const when = new Date(y, m - 1, d).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const s = UI.safety && RC.exercise(UI.safety);
  return `<div class="pv-day" id="pvDay">
    <div class="pv-dayhead"><h3>Day ${UI.day + 1} · ${esc(when)}</h3>
      <label class="toggle"><input type="checkbox" id="pvRest"${day.rest ? " checked" : ""}> Rest day</label></div>
    ${day.rest ? '<p class="muted">Nothing is assigned on rest days.</p>' : `
      ${day.items.length ? `<ul class="items">${day.items.map(itemRow).join("")}</ul>` : '<p class="muted">No exercises yet. Add some below.</p>'}
      ${s ? `<div class="pv-safety" id="pvSafety" role="alert"><p><b>${esc(s.name)} is done standing.</b> Only assign it if ${esc(pt.name)} can stand safely with a chair behind them and someone nearby. Assigning it turns it on for this patient.</p>
        <div class="actions"><button class="btn" id="pvSafetyYes">Turn on and assign</button><button class="btn alt" id="pvSafetyNo">Cancel</button></div></div>` : ""}
      <div class="pv-pick"><label for="pvPickQ">Add an exercise</label><input id="pvPickQ" type="search" placeholder="Search by name or movement" value="${esc(UI.q)}" autocomplete="off">
        <div class="pick-list" id="pvPick">${renderPicker()}</div></div>`}
  </div>`;
}

function renderPlanTab(pt) {
  const pl = db().plan(pt.id);
  if (!pl) return `<div class="pv-card pv-start"><h3>No plan yet</h3><p class="muted">Choose the first day of ${esc(pt.name)}'s 30-day plan.</p>
    <label>Start date <input type="date" id="pvStart"></label></div>`;
  return `<div class="pv-card">
      <div class="pv-planhead"><label>Start date <input type="date" id="pvStart" value="${esc(pl.start)}"></label>
        <button class="btn alt" id="pvCopyWeek">Copy week 1 to all weeks</button></div>
      ${renderCalendar(pl)}</div>
    <div class="pv-card">${renderDay(pt, pl)}</div>`;
}

function render() {
  const pt = current();
  if (pt) UI.patientId = pt.id;
  const enabled = (pt && pt.enabled) || {};
  $("vProvider").innerHTML = `<div class="pv">
    ${renderSidebar()}
    <div class="pv-main">${pt ? `
      <div class="pv-head"><div><h1>${esc(pt.name)}</h1><p class="muted">${esc(pt.side === "left" ? "Left" : "Right")} side affected</p></div>
        <div class="seg" role="tablist"><button id="pvTabPlan" aria-pressed="${UI.tab === "plan"}">Plan</button><button id="pvTabProgress" aria-pressed="${UI.tab === "progress"}">Progress</button></div></div>
      <div class="pv-flags"><span class="muted">Standing exercises:</span>
        <label class="toggle"><input type="checkbox" id="pvEnable-sit2stand"${enabled.sit2stand ? " checked" : ""}> Sit to Stand</label>
        <label class="toggle"><input type="checkbox" id="pvEnable-balance"${enabled.balance ? " checked" : ""}> Balance Hold</label></div>
      ${UI.tab === "plan" ? renderPlanTab(pt) : (RC.providerProgress ? RC.providerProgress(pt) : '<div class="pv-card"><p class="muted">Progress is coming next.</p></div>')}` : '<p class="muted">Add a patient to get started.</p>'}
    </div></div>`;
}

function mutatePlan(fn) { const pt = current(), pl = db().plan(pt.id); fn(pl); db().savePlan(pl); render(); }
function addItem(id) {
  const d = RC.exercise(id), def = d.defaults || {};
  mutatePlan((pl) => pl.days[UI.day].items.push({ exerciseId: id, reps: d.params && d.params.reps ? def.reps : null, level: def.level || 2, durationS: d.params && d.params.durationS ? def.durationS || d.params.durationS[0] : null }));
}

const pv = $("vProvider");
pv.addEventListener("click", (e) => {
  const t = e.target;
  const pt = t.closest(".pt[data-id]");
  if (pt) { UI.patientId = pt.dataset.id; UI.day = 0; UI.safety = null; render(); return; }
  if (t.closest("#pvAddPatient")) { UI.adding = true; render(); $("pvNewName").focus(); return; }
  if (t.closest("#pvNewCancel")) { UI.adding = false; render(); return; }
  if (t.closest("#resetDemo")) { db().resetDemo(); UI.patientId = null; render(); RC.renderRole && RC.renderRole(); return; }
  if (t.closest("#pvTabPlan")) { UI.tab = "plan"; render(); return; }
  if (t.closest("#pvTabProgress")) { UI.tab = "progress"; render(); return; }
  const day = t.closest(".calday[data-day]");
  if (day) { UI.day = +day.dataset.day; UI.safety = null; render(); return; }
  if (t.closest("#pvCopyWeek")) { const p = current(); db().savePlan(P.copyWeek(db().plan(p.id))); render(); return; }
  const pick = t.closest(".pick[data-id]");
  if (pick) {
    const d = RC.exercise(pick.dataset.id), p = current();
    if (d.safety && !(p.enabled || {})[d.id]) { UI.safety = d.id; render(); return; }
    addItem(d.id); return;
  }
  if (t.closest("#pvSafetyYes")) {
    const p = current(); p.enabled = Object.assign({}, p.enabled, { [UI.safety]: true }); db().savePatient(p);
    const id = UI.safety; UI.safety = null; addItem(id); return;
  }
  if (t.closest("#pvSafetyNo")) { UI.safety = null; render(); return; }
  const rm = t.closest(".item .remove");
  if (rm) { const i = +rm.closest(".item").dataset.index; mutatePlan((pl) => pl.days[UI.day].items.splice(i, 1)); }
});
pv.addEventListener("change", (e) => {
  const t = e.target;
  if (t.id === "pvStart" && t.value) {
    const p = current(), old = db().plan(p.id);
    db().savePlan(old ? Object.assign(old, { start: t.value }) : P.emptyPlan(p.id, t.value));
    render(); return;
  }
  if (t.id === "pvRest") { mutatePlan((pl) => { pl.days[UI.day].rest = t.checked; }); return; }
  if (t.id && t.id.startsWith("pvEnable-")) { const p = current(); p.enabled = Object.assign({}, p.enabled, { [t.id.slice(9)]: t.checked }); db().savePatient(p); render(); return; }
  const row = t.closest(".item[data-index]");
  if (row && t.name) { const i = +row.dataset.index; mutatePlan((pl) => { pl.days[UI.day].items[i][t.name] = Number(t.value); }); }
});
pv.addEventListener("input", (e) => {
  if (e.target.id !== "pvPickQ") return;
  UI.q = e.target.value; $("pvPick").innerHTML = renderPicker();
});
pv.addEventListener("submit", (e) => {
  if (e.target.id !== "pvNewForm") return;
  e.preventDefault();
  const name = $("pvNewName").value.trim(); if (!name) return;
  const id = "p_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + Date.now().toString(36);
  db().savePatient({ id, name, side: $("pvNewSide").value, enabled: { sit2stand: false, balance: false } });
  UI.adding = false; UI.patientId = id; render(); RC.renderRole && RC.renderRole();
});

RC.provider = { render, ui: UI };
})();
