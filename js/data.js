// Storage for patients, plans and sessions, plus the demo seed. Pure over an injected store,
// so it runs in the browser (RC.data) and under the Node unit tests.
(function (root, factory) {
  const plan = typeof module === "object" && module.exports ? require("./plan.js") : root.RC.plan;
  const api = factory(plan);
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.RC = root.RC || {}).data = api;
})(typeof self !== "undefined" ? self : this, function (plan) {
  "use strict";
  const K = { patients: "mend.patients", plans: "mend.plans", log: "mend.log", demo: "mend.demo" };
  const MAX_SESSIONS = 2000;
  const NAMES = { lift: "Lantern Lift", pour: "Pour the Tea", lock: "Combination Lock", maze: "Tilt Maze", sort: "Sort It", simon: "Memory Moves",
    pairs: "Card Pairs", wiper: "Wrist Wiper", trail: "Trail Connect", cancel: "Cancel It", reach: "Reach Targets" };
  const item = (exerciseId, reps = 10, level = 2) => ({ exerciseId, reps, level, durationS: null });

  // Small deterministic random so the demo looks the same every time.
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function seedData(now) {
    const today = plan.dateKey(now), rand = rng(7);
    const patients = [
      { id: "p_ruth", name: "Ruth A.", side: "right", enabled: { sit2stand: false, balance: false } },
      { id: "p_james", name: "James O.", side: "left", enabled: { sit2stand: false, balance: false } },
      { id: "p_mei", name: "Mei L.", side: "right", enabled: { sit2stand: false, balance: false } },
    ];
    // A week mixing arm, wrist and brain work; brain exercises are assigned by level only (no reps).
    const week = [[item("lift"), item("pairs", null, 1)], [item("pour"), item("trail", 1, 1)], [item("reach"), item("wiper")], [item("lift"), item("cancel", 1, 1)], [item("pour"), item("pairs", null, 1), item("wiper")], "rest", "rest"];
    const ruth = plan.emptyPlan("p_ruth", plan.addDays(today, -11));
    ruth.days.forEach((d, i) => { const w = week[i % 7]; if (w === "rest") d.rest = true; else d.items = w.map((x) => Object.assign({}, x)); });
    const james = plan.emptyPlan("p_james", plan.addDays(today, -4));
    james.days.forEach((d) => { d.items = [item("lift", 10, 1), item("pour", 10, 1)]; });

    const sessions = [];
    const at = (key, hour, min) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d, hour, min).toISOString(); };
    function session(patientId, side, id, key, hour, min, it, liftPeak) {
      const level = it ? it.level : 2, reps = it ? it.reps : 10, motion = ["lift", "pour", "reach", "wiper"].includes(id);
      return {
        at: at(key, hour, min), id, name: NAMES[id], movement: "", side, targetDeg: { 1: 15, 2: 30, 3: 45 }[level],
        reps: reps == null ? (id === "pairs" ? 6 : 1) : reps, goal: reps == null ? (id === "pairs" ? 6 : 1) : reps, targetReps: reps, level, seconds: Math.round(90 + rand() * 110), input: motion ? "phone" : "mouse",
        pitch: id === "lift" ? [-3, liftPeak] : [-4, Math.round(8 + rand() * 14)], roll: [Math.round(-10 - rand() * 18), Math.round(10 + rand() * 18)],
        peaksPerRep: +(2.1 + rand() * 1.3).toFixed(1), activeS: Math.round(40 + rand() * 60), extra: [], patientId, completed: true, seed: true,
      };
    }
    function day(p, patient, i, ids, extras) {
      const key = plan.addDays(p.start, i), peak = 32 + Math.round((9 * i) / 10), list = [];
      const itemOf = (id) => p.days[i].items.find((x) => x.exerciseId === id) || p.days.flatMap((d) => d.items).find((x) => x.exerciseId === id);
      ids.forEach((id, k) => list.push(session(patient.id, patient.side, id, key, 10, k * 25, itemOf(id), peak)));
      (extras || []).forEach((id, k) => list.push(session(patient.id, patient.side, id, key, 17, k * 25, itemOf(id), peak)));
      const { assignedAt } = plan.matchDay(plan.itemsFor(p, key), list);
      list.forEach((s) => { s.assigned = assignedAt.has(s.at); sessions.push(s); });
    }
    const ruthDays = { 0: [["lift", "pairs"], ["trail"]], 1: [["pour", "trail"]], 2: [["reach"]], 3: [["lift", "cancel"], ["pairs"]], 4: [["pour", "pairs", "wiper"]],
      6: [[], ["lift"]], 7: [["lift", "pairs"]], 9: [["reach", "wiper"], ["cancel"]], 10: [["lift", "cancel"]] }; // day 8 missed, day 2 partly
    for (const [i, [ids, extras]] of Object.entries(ruthDays)) day(ruth, patients[0], +i, ids, extras);
    day(james, patients[1], 0, ["lift", "pour"]); day(james, patients[1], 1, ["lift"]);
    return { patients, plans: { p_ruth: ruth, p_james: james }, sessions };
  }

  function createData(store, now) {
    const mem = {};
    const get = (k, d) => { let v; try { v = store.get(k, undefined); } catch (_) { v = undefined; } if (v === undefined) v = mem[k]; return v === undefined ? d : v; };
    const set = (k, v) => { mem[k] = v; try { store.set(k, v); } catch (_) {} };
    const byAt = (a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0);
    const log = () => { const l = get(K.log, []); return Array.isArray(l) ? l : []; };
    const validPatients = (p) => Array.isArray(p) && p.length > 0 && p.every((x) => x && x.id && x.name);
    const demo = () => Object.assign({ role: "patient", patientId: null }, get(K.demo, {}));

    function patients() { const p = get(K.patients, null); return validPatients(p) ? p : []; }
    function savePatient(p) { const list = patients().filter((x) => x.id !== p.id); list.push(p); set(K.patients, list); }
    function plans() { const p = get(K.plans, {}); return p && typeof p === "object" ? p : {}; }
    function planOf(patientId) { return plans()[patientId] || null; }
    function savePlan(p) { const all = plans(); all[p.patientId] = p; set(K.plans, all); }
    function sessions(patientId) { return log().filter((s) => !patientId || s.patientId === patientId).sort(byAt); }
    function addSession(s) { const l = log(); l.push(s); set(K.log, l.length > MAX_SESSIONS ? l.sort(byAt).slice(-MAX_SESSIONS) : l); }

    // Sessions recorded before plans existed belong to the demo patient as "before plan" history.
    function migrate() {
      const l = log();
      if (!l.some((s) => !s.patientId)) return;
      set(K.log, l.map((s) => (s.patientId ? s : Object.assign({}, s, { patientId: "p_ruth", assigned: false, completed: true, legacy: true }))));
    }
    function writeSeed(opts) {
      const s = seedData(now());
      if (opts && opts.todayItems) {
        const i = plan.dayIndex(s.plans.p_ruth, plan.dateKey(now()));
        if (i >= 0) { s.plans.p_ruth.days[i].rest = false; s.plans.p_ruth.days[i].items = opts.todayItems.map((x) => Object.assign({}, x)); }
      }
      set(K.patients, s.patients);
      set(K.plans, s.plans);
      set(K.log, log().filter((x) => x.legacy).concat(s.sessions).sort(byAt));
    }
    function ensureSeed() { migrate(); if (!validPatients(get(K.patients, null))) writeSeed(); }
    function resetDemo(opts) { migrate(); writeSeed(opts); }

    return {
      patients, savePatient, plan: planOf, savePlan, sessions, addSession, ensureSeed, resetDemo,
      clearSessions: (patientId) => set(K.log, log().filter((s) => s.patientId !== patientId || s.legacy)),
      role: () => (demo().role === "provider" ? "provider" : "patient"),
      setRole: (r) => set(K.demo, Object.assign(demo(), { role: r })),
      activePatientId: () => { const id = demo().patientId, list = patients(); return list.some((p) => p.id === id) ? id : (list[0] || {}).id; },
      setActivePatient: (id) => set(K.demo, Object.assign(demo(), { patientId: id })),
    };
  }

  return { createData, seedData, KEYS: K };
});
