// Care-plan rules: which exercises are due on a day, and which sessions satisfied them.
// Pure functions, shared by the browser (RC.plan) and the Node unit tests.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.RC = root.RC || {}).plan = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const DAYS = 30;
  const pad = (n) => String(n).padStart(2, "0");
  const clone = (x) => JSON.parse(JSON.stringify(x));

  function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function parseKey(key) { const [y, m, d] = key.split("-").map(Number); return { y, m, d }; }
  function addDays(key, n) { const { y, m, d } = parseKey(key); return dateKey(new Date(y, m - 1, d + n)); }
  // Day difference via UTC so daylight-saving changes never shift a day.
  function diffDays(a, b) { const A = parseKey(a), B = parseKey(b); return Math.round((Date.UTC(B.y, B.m - 1, B.d) - Date.UTC(A.y, A.m - 1, A.d)) / 864e5); }
  const sessionDay = (s) => dateKey(new Date(s.at));

  function emptyPlan(patientId, start) {
    return { patientId, start, days: Array.from({ length: DAYS }, () => ({ rest: false, items: [] })) };
  }
  function dayIndex(plan, key) {
    if (!plan) return -1;
    const i = diffDays(plan.start, key);
    return i >= 0 && i < plan.days.length ? i : -1;
  }
  function itemsFor(plan, key) {
    const i = dayIndex(plan, key);
    if (i < 0 || plan.days[i].rest) return [];
    return plan.days[i].items;
  }

  function meets(session, item) {
    if (!session.completed || session.id !== item.exerciseId) return false;
    if (item.reps && !(session.reps >= item.reps)) return false;
    if (item.level && !(session.level >= item.level)) return false;
    if (item.durationS && !(session.seconds >= item.durationS * 0.9)) return false;
    return true;
  }
  // Each session (in time order) fills the first assigned item it satisfies; the rest are extra.
  function matchDay(items, sessions) {
    const done = items.map(() => false), assignedAt = new Set();
    for (const s of sessions) {
      const k = items.findIndex((it, i) => !done[i] && meets(s, it));
      if (k >= 0) { done[k] = true; assignedAt.add(s.at); }
    }
    return { done, assignedAt };
  }

  function dayStatus(plan, key, sessions, todayKey) {
    if (dayIndex(plan, key) < 0) return "outside";
    const items = itemsFor(plan, key);
    if (!items.length) return "rest";
    if (key > todayKey) return "future";
    const { done } = matchDay(items, sessions);
    if (done.every(Boolean)) return "done";
    if (key === todayKey) return "today";
    return done.some(Boolean) ? "partly" : "missed";
  }

  function today(plan, todayKey, sessions) {
    if (dayIndex(plan, todayKey) < 0) return { state: "none", items: [], next: null, doneCount: 0, total: 0 };
    const items = itemsFor(plan, todayKey);
    if (!items.length) return { state: "rest", items: [], next: null, doneCount: 0, total: 0 };
    const { done } = matchDay(items, sessions);
    const list = items.map((it, i) => Object.assign({}, it, { done: done[i] }));
    const doneCount = done.filter(Boolean).length;
    return { state: doneCount === items.length ? "done" : "progress", items: list, next: list.find((x) => !x.done) || null, doneCount, total: items.length };
  }

  function progress(plan, sessions, todayKey) {
    const byDay = new Map();
    for (const s of sessions) { const k = sessionDay(s); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(s); }
    const assigned = new Set(), strip = [];
    let daysDone = 0, daysDue = 0;
    if (plan) {
      for (let i = 0; i < plan.days.length; i++) {
        const key = addDays(plan.start, i), daySessions = byDay.get(key) || [];
        const st = dayStatus(plan, key, daySessions, todayKey);
        strip.push(st);
        if (st === "done") { daysDone++; daysDue++; } else if (st === "partly" || st === "missed") daysDue++;
        for (const at of matchDay(itemsFor(plan, key), daySessions).assignedAt) assigned.add(at);
      }
    }
    const extra = sessions.filter((s) => !s.legacy && !assigned.has(s.at)).length;
    const lifts = sessions.filter((s) => s.id === "lift" && Array.isArray(s.pitch) && s.completed !== false);
    const range = lifts.length ? { first: lifts[0].pitch[1], last: lifts[lifts.length - 1].pitch[1] } : null;
    return { daysDone, daysDue, extra, strip, range };
  }

  function copyWeek(plan) {
    const p = clone(plan);
    for (let i = 7; i < p.days.length; i++) p.days[i] = clone(p.days[i % 7]);
    return p;
  }

  return { DAYS, dateKey, addDays, diffDays, sessionDay, emptyPlan, dayIndex, itemsFor, meets, matchDay, dayStatus, today, progress, copyWeek };
});
