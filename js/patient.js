// Patient home: the Today goals bar (what the provider assigned for today, and the next one to do),
// the full exercise library below it, and a light "My progress" panel.
(() => {
"use strict";
const RC = window.RC;
const { $, esc } = RC;
const P = RC.plan;
const BRAIN = new Set(["scanning", "attention", "memory", "reasoning", "language"]);
const ICON = {
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
  touch: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 4.5a7.5 7.5 0 0 1 7.5 7.5M4.5 12A7.5 7.5 0 0 1 12 4.5"/></svg>',
  guided: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M10 2.5h4"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};
const CONTROL = { tilt: ["phone", "Phone motion"], accel: ["phone", "Phone motion"], touch: ["touch", "Touch"], guided: ["guided", "Guided"] };
let filter = "all";

const db = () => RC.db;
function patient() { const d = db(), id = d.activePatientId(); return d.patients().find((p) => p.id === id) || { id, name: "", enabled: {} }; }
function todayState() {
  const d = db(), pt = patient(), key = P.dateKey(new Date()), pl = d.plan(pt.id);
  const todays = d.sessions(pt.id).filter((s) => P.sessionDay(s) === key);
  const t = P.today(pl, key, todays);
  const items = t.items.map((it) => Object.assign({}, it, { def: RC.exercise(it.exerciseId) }));
  return { pt, key, pl, todays, t, items, next: items.find((i) => !i.done && i.def) || null };
}
function isLocked(def, pt) { return !!def.safety && !(pt.enabled || {})[def.id]; }
function itemDetail(it) {
  const bits = [];
  if (it.reps) bits.push(`${it.reps} reps`);
  if (it.durationS) bits.push(RC.fmtTime(it.durationS));
  if (it.level) bits.push(`level ${it.level}`);
  return bits.join(" · ");
}
function dayLabel(pl, key) {
  const i = P.dayIndex(pl, key);
  if (i >= 0) return `Day ${i + 1} of ${pl.days.length}`;
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function renderBar(S) {
  const { pt, key, pl, t, items, next } = S;
  const first = (pt.name || "").split(" ")[0] || "there";
  const pct = t.total ? t.doneCount / t.total : 0;
  const copy = {
    progress: next ? [`Next up: ${next.def.name}`, `${t.doneCount} of ${t.total} done today${itemDetail(next) ? " · " + itemDetail(next) : ""}`] : ["Today's plan", "The remaining exercises aren't available in this version."],
    done: ["That's today's plan, done.", `Nice work, ${first}. Anything you play from here is bonus practice your therapist will see too.`],
    rest: ["Rest day", "Nothing is assigned today. Anything you play counts as bonus practice."],
    none: ["No plan for today", "Your therapist hasn't set a plan for today. You can still practise anything below."],
  }[t.state];
  const C = 2 * Math.PI * 26;
  const ring = t.state === "done"
    ? `<span class="ring-done">${ICON.check}</span>`
    : `<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="ring-track" cx="32" cy="32" r="26"/><circle class="ring-fill" cx="32" cy="32" r="26" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg><span class="ring-num num">${t.total ? `${t.doneCount}/${t.total}` : "–"}</span>`;
  $("todayWrap").innerHTML = `
    <section id="todayBar" class="todaybar" data-state="${t.state}" aria-live="polite">
      <div class="ring" id="todayRing" role="img" aria-label="${t.doneCount} of ${t.total} assigned exercises done">${ring}</div>
      <div class="tb-main">
        <p class="tb-hi">Hi ${esc(first)} · <span id="todayDay">${esc(dayLabel(pl, key))}</span></p>
        <h2>${esc(copy[0])}</h2>
        <p class="tb-sub">${esc(copy[1])}</p>
        ${items.length ? `<ol id="todaySteps" class="tb-steps">${items.map((i) => `<li data-done="${i.done}" class="${i === next ? "next" : ""}${i.def ? "" : " na"}">${i.done ? ICON.check : ""}<span>${i.def ? esc(i.def.name) : "Not available in this version"}</span></li>`).join("")}</ol>` : ""}
      </div>
      ${next ? `<button class="btn tb-go" id="todayStart">Start ${esc(next.def.name)}</button>` : ""}
    </section>`;
  if (next) $("todayStart").onclick = () => RC.openActivity(next.def, { item: next });
}

function renderLibrary(S) {
  const { pt, items } = S;
  const todayIds = new Map(items.map((i) => [i.exerciseId, i.done]));
  const sections = RC.SECTIONS.filter(([id]) => RC.EXERCISES.some((d) => d.section === id));
  if (filter !== "all" && !sections.some(([id]) => id === filter)) filter = "all";
  const tile = (d) => {
    const [icon, label] = CONTROL[d.control] || CONTROL.tilt, locked = isLocked(d, pt);
    const tag = todayIds.has(d.id) ? `<span class="tile-tag${todayIds.get(d.id) ? " done" : ""}">${todayIds.get(d.id) ? "✓ Today" : "Today"}</span>` : "";
    return `<button class="tile${BRAIN.has(d.section) ? " brain" : ""}" data-id="${esc(d.id)}" aria-disabled="${locked}">
      <span class="tile-art">${RC.kit.art(d.id) || `<canvas data-glyph="${esc(d.id)}"></canvas>`}</span>
      <span class="tile-name">${esc(d.name)}</span>
      <span class="tile-meta">${locked ? "Your therapist turns this on" : `${ICON[icon]}${label}`}</span>${tag}</button>`;
  };
  $("library").innerHTML = `
    <div class="libhead"><h2>All exercises</h2>
      <div class="libtabs" id="libTabs" role="tablist" aria-label="Filter exercises">
        <button data-section="all" aria-pressed="${filter === "all"}">All ${RC.EXERCISES.length}</button>
        ${sections.map(([id, name]) => `<button data-section="${id}" aria-pressed="${filter === id}">${esc(name)}</button>`).join("")}
      </div></div>
    ${sections.filter(([id]) => filter === "all" || filter === id).map(([id, name]) => `
      <section class="libsec"><h3>${esc(name)}</h3>
        <div class="tiles">${RC.EXERCISES.filter((d) => d.section === id).map(tile).join("")}</div></section>`).join("")}`;
  RC.drawGlyphs && RC.drawGlyphs();
}

function renderProgress(S) {
  const { pt, key, pl, todays } = S, d = db(), all = d.sessions(pt.id);
  const days = Array.from({ length: 7 }, (_, k) => P.addDays(key, k - 6));
  const status = (k) => { if (!pl) return "outside"; return P.dayStatus(pl, k, all.filter((s) => P.sessionDay(s) === k), key); };
  const short = (k) => { const [y, m, dd] = k.split("-").map(Number); return new Date(y, m - 1, dd).toLocaleDateString([], { weekday: "narrow" }); };
  const recent = all.slice(-3).reverse();
  $("myProgress").innerHTML = `
    <h3>My progress</h3>
    <div class="mp-today"><b class="num">${todays.length}</b><span>${todays.length === 1 ? "session" : "sessions"} today</span></div>
    <div class="mp-week" aria-label="Last 7 days">${days.map((k) => `<span class="mp-day" data-status="${status(k)}" title="${esc(k)}: ${status(k)}"><i></i>${short(k)}</span>`).join("")}</div>
    ${recent.length ? `<ul class="mp-recent">${recent.map((s) => `<li><span>${esc(s.name)}</span><span class="muted">${s.assigned ? "Assigned" : s.legacy ? "Before plan" : "Extra"}</span></li>`).join("")}</ul>` : ""}
    <button class="btn alt" id="toLog">See all sessions</button>`;
}

function render() {
  const S = todayState();
  renderBar(S); renderLibrary(S); renderProgress(S);
}

// One delegated listener for tiles, filters and the log link (the markup is re-rendered often).
document.addEventListener("click", (e) => {
  const tab = e.target.closest("#libTabs button[data-section]");
  if (tab) { filter = tab.dataset.section; renderLibrary(todayState()); return; }
  if (e.target.closest("#toLog")) { RC.show("vLog"); return; }
  const t = e.target.closest("#library .tile[data-id]");
  if (!t || t.getAttribute("aria-disabled") === "true") return;
  const def = RC.exercise(t.dataset.id), S = todayState();
  // An outstanding assigned item opened from the library still counts, so it uses the assigned settings.
  const item = S.items.find((i) => i.exerciseId === def.id && !i.done);
  RC.openActivity(def, item ? { item } : {});
});

RC.patient = { render };
})();
