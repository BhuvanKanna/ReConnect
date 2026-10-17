// Unit tests for js/data.js (run: node --test "tests/*.test.js")
const test = require("node:test");
const assert = require("node:assert/strict");
const data = require("../js/data.js");
const plan = require("../js/plan.js");

const NOW = () => new Date(2026, 9, 17, 12, 0); // Sat 17 Oct 2026, noon

function memStore(init = {}) {
  const mem = Object.assign({}, init);
  return {
    mem,
    get: (k, d) => { try { return k in mem ? JSON.parse(mem[k]) : d; } catch (_) { return d; } },
    set: (k, v) => { mem[k] = JSON.stringify(v); },
  };
}

test("corrupt or missing storage falls back to the seed", () => {
  const D = data.createData(memStore({ "mend.patients": "{not json" }), NOW);
  D.ensureSeed();
  assert.deepEqual(D.patients().map((p) => p.name), ["Ruth A.", "James O.", "Mei L."]);
  assert.equal(D.plan("p_ruth").start, "2026-10-06"); // 11 days before today
  assert.equal(D.plan("p_mei"), null);
});

test("seeded Ruth has done, partly and missed days and some extras", () => {
  const D = data.createData(memStore(), NOW);
  D.ensureSeed();
  const pr = plan.progress(D.plan("p_ruth"), D.sessions("p_ruth"), "2026-10-17");
  assert.equal(pr.strip[8], "missed");
  assert.equal(pr.strip[2], "partly");
  assert.ok(pr.daysDone >= 5);
  assert.ok(pr.extra >= 3);
  assert.ok(pr.range.first <= 33 && pr.range.last >= 40);
  const sessions = D.sessions("p_ruth");
  assert.ok(sessions.every((s, i) => i === 0 || sessions[i - 1].at <= s.at), "chronological");
  assert.ok(sessions.some((s) => s.assigned === false) && sessions.some((s) => s.assigned === true));
});

test("seeded plan mixes motion and brain exercises from the full library", () => {
  const D = data.createData(memStore(), NOW);
  D.ensureSeed();
  const ids = new Set(D.plan("p_ruth").days.flatMap((d) => d.items.map((i) => i.exerciseId)));
  for (const id of ["lift", "pairs", "wiper", "pour", "trail", "cancel", "reach"]) assert.ok(ids.has(id), `plan includes ${id}`);
  const pairs = D.plan("p_ruth").days.flatMap((d) => d.items).find((i) => i.exerciseId === "pairs");
  assert.equal(pairs.reps, null, "rounds-free exercises are assigned without reps");
  const names = new Set(D.sessions("p_ruth").map((s) => s.name));
  assert.ok(names.has("Card Pairs") && names.has("Cancel It"), "seed sessions carry real exercise names");
});

test("legacy log entries are attributed to the demo patient as before-plan history", () => {
  const legacy = [{ at: "2026-09-01T10:00:00.000Z", id: "lift", name: "Lantern Lift", reps: 10, goal: 10, seconds: 80 }];
  const st = memStore({ "mend.log": JSON.stringify(legacy) });
  const D = data.createData(st, NOW);
  D.ensureSeed();
  const old = D.sessions("p_ruth").find((s) => s.at === legacy[0].at);
  assert.equal(old.legacy, true);
  assert.equal(old.assigned, false);
  assert.equal(old.completed, true);
  D.ensureSeed();
  assert.equal(D.sessions("p_ruth").filter((s) => s.at === legacy[0].at).length, 1, "not duplicated");
});

test("ensureSeed is idempotent and never overwrites provider edits", () => {
  const st = memStore();
  const D = data.createData(st, NOW);
  D.ensureSeed();
  const p = D.plan("p_mei") || plan.emptyPlan("p_mei", "2026-10-17");
  p.days[0].items = [{ exerciseId: "sort", reps: 6, level: 1, durationS: null }];
  D.savePlan(p);
  D.savePatient({ id: "p_new", name: "New P.", side: "left", enabled: { sit2stand: false, balance: false } });
  const n = D.sessions().length;
  const D2 = data.createData(st, NOW);
  D2.ensureSeed();
  assert.equal(D2.plan("p_mei").days[0].items[0].exerciseId, "sort");
  assert.equal(D2.patients().length, 4);
  assert.equal(D2.sessions().length, n);
});

test("role and active patient persist with sensible defaults", () => {
  const st = memStore();
  const D = data.createData(st, NOW);
  D.ensureSeed();
  assert.equal(D.role(), "patient");
  assert.equal(D.activePatientId(), "p_ruth");
  D.setRole("provider"); D.setActivePatient("p_mei");
  const D2 = data.createData(st, NOW);
  assert.equal(D2.role(), "provider");
  assert.equal(D2.activePatientId(), "p_mei");
});

test("addSession appends and keeps the newest 2,000", () => {
  const D = data.createData(memStore(), NOW);
  D.ensureSeed();
  for (let i = 0; i < 2100; i++) D.addSession({ at: `2026-10-17T12:${String(i % 60).padStart(2, "0")}:00.${String(i).padStart(4, "0")}Z`, id: "sort", patientId: "p_mei", completed: true });
  assert.equal(D.sessions().length, 2000);
});

test("resetDemo can replace today's items for tests and clears today's sessions", () => {
  const D = data.createData(memStore(), NOW);
  D.ensureSeed();
  const items = [{ exerciseId: "lift", reps: 6, level: 2, durationS: null }, { exerciseId: "pour", reps: 6, level: 2, durationS: null }];
  D.addSession({ at: new Date(2026, 9, 17, 9).toISOString(), id: "lift", patientId: "p_ruth", completed: true, reps: 10, level: 2 });
  D.resetDemo({ todayItems: items });
  assert.deepEqual(plan.itemsFor(D.plan("p_ruth"), "2026-10-17"), items);
  assert.equal(D.sessions("p_ruth").filter((s) => plan.sessionDay(s) === "2026-10-17").length, 0);
});

test("a store that throws on every call still works from memory", () => {
  const boom = () => { throw new Error("blocked"); };
  const D = data.createData({ get: boom, set: boom }, NOW);
  assert.doesNotThrow(() => D.ensureSeed());
  assert.equal(D.patients()[0].name, "Ruth A.");
  D.setRole("provider");
  assert.equal(D.role(), "provider");
});

test("clearSessions removes one patient's recorded sessions and keeps everyone else's", () => {
  const D = data.createData(memStore(), NOW);
  D.ensureSeed();
  const ruthBefore = D.sessions("p_ruth").length;
  D.addSession({ at: "2026-10-17T11:00:00.000Z", id: "sort", patientId: "p_mei", completed: true });
  D.clearSessions("p_mei");
  assert.equal(D.sessions("p_mei").length, 0);
  assert.equal(D.sessions("p_ruth").length, ruthBefore);
});

test("a log that is valid JSON but not a list reads as empty", () => {
  const D = data.createData(memStore({ "mend.log": "{}" }), NOW);
  assert.deepEqual(D.sessions(), []);
});
