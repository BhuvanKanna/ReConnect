// Unit tests for js/plan.js (run: node --test tests/)
const test = require("node:test");
const assert = require("node:assert/strict");
const plan = require("../js/plan.js");

const S = (id, reps, level, at, extra = {}) => Object.assign({ id, reps, level, seconds: 60, completed: true, at }, extra);
const LIFT = { exerciseId: "lift", reps: 10, level: 2, durationS: null };
const PAIRS = { exerciseId: "pairs", reps: null, level: 3, durationS: null };

function planWith(start, dayItems) {
  const p = plan.emptyPlan("p1", start);
  dayItems.forEach((items, i) => { if (items === "rest") p.days[i].rest = true; else p.days[i].items = items; });
  return p;
}

test("dateKey uses local time and addDays crosses months", () => {
  assert.equal(plan.dateKey(new Date(2026, 9, 17, 23, 59)), "2026-10-17");
  assert.equal(plan.addDays("2026-10-30", 3), "2026-11-02");
  assert.equal(plan.addDays("2026-11-02", -3), "2026-10-30");
});

test("emptyPlan has 30 working days with no items", () => {
  const p = plan.emptyPlan("p1", "2026-10-06");
  assert.equal(p.days.length, 30);
  assert.ok(p.days.every((d) => d.rest === false && d.items.length === 0));
  assert.equal(plan.dayIndex(p, "2026-10-06"), 0);
  assert.equal(plan.dayIndex(p, "2026-11-04"), 29);
  assert.equal(plan.dayIndex(p, "2026-11-05"), -1);
  assert.equal(plan.dayIndex(p, "2026-10-05"), -1);
});

test("matchDay fills items in order and counts repeats as extra", () => {
  const r = plan.matchDay([LIFT, PAIRS], [S("lift", 10, 2, "a"), S("lift", 10, 2, "b"), S("pairs", 0, 3, "c")]);
  assert.deepEqual(r.done, [true, true]);
  assert.deepEqual([...r.assignedAt].sort(), ["a", "c"]);
});

test("a session below the assigned reps or level does not tick the goal", () => {
  assert.deepEqual(plan.matchDay([LIFT], [S("lift", 6, 2, "a")]).done, [false]);
  assert.deepEqual(plan.matchDay([LIFT], [S("lift", 10, 1, "a")]).done, [false]);
  assert.deepEqual(plan.matchDay([LIFT], [S("lift", 10, 2, "a", { completed: false })]).done, [false]);
});

test("guided items need about the assigned duration", () => {
  const item = { exerciseId: "putty", reps: null, level: 1, durationS: 120 };
  assert.deepEqual(plan.matchDay([item], [S("putty", 0, 1, "a", { seconds: 100 })]).done, [false]);
  assert.deepEqual(plan.matchDay([item], [S("putty", 0, 1, "a", { seconds: 110 })]).done, [true]);
});

test("today() reports next item and done state", () => {
  const p = planWith("2026-10-17", [[LIFT, PAIRS]]);
  const t1 = plan.today(p, "2026-10-17", [S("lift", 10, 2, "a")]);
  assert.equal(t1.state, "progress");
  assert.equal(t1.doneCount, 1);
  assert.equal(t1.total, 2);
  assert.equal(t1.next.exerciseId, "pairs");
  assert.deepEqual(t1.items.map((i) => i.done), [true, false]);
  const t2 = plan.today(p, "2026-10-17", [S("lift", 10, 2, "a"), S("pairs", 0, 3, "b")]);
  assert.equal(t2.state, "done");
  assert.equal(t2.next, null);
});

test("rest day and outside-plan days", () => {
  const p = planWith("2026-10-17", [[LIFT], "rest"]);
  assert.equal(plan.today(p, "2026-10-18", []).state, "rest");
  assert.equal(plan.today(p, "2026-11-16", []).state, "none");
  assert.equal(plan.today(null, "2026-10-18", []).state, "none");
  assert.equal(plan.dayStatus(p, "2026-10-18", [], "2026-10-20"), "rest");
  assert.equal(plan.dayStatus(p, "2026-11-16", [], "2026-11-20"), "outside");
});

test("past day with nothing done is missed, with some done is partly", () => {
  const p = planWith("2026-10-17", [[LIFT, PAIRS], [LIFT], [LIFT], [LIFT]]);
  const sessions = [S("lift", 10, 2, "2026-10-17T10:00:00"), S("lift", 10, 2, "2026-10-18T10:00:00")];
  const day = (k) => plan.dayStatus(p, k, sessions.filter((s) => s.at.startsWith(k)), "2026-10-19");
  assert.equal(day("2026-10-17"), "partly");
  assert.equal(day("2026-10-18"), "done");
  assert.equal(day("2026-10-19"), "today");
  assert.equal(day("2026-10-20"), "future");
  assert.equal(plan.dayStatus(p, "2026-10-17", [], "2026-10-19"), "missed");
});

test("editing today's plan after a session recomputes the ticks", () => {
  const p = planWith("2026-10-17", [[LIFT, PAIRS]]);
  const sessions = [S("lift", 10, 2, "a")];
  p.days[0].items = [PAIRS]; // provider removed Lantern Lift after it was done
  const t = plan.today(p, "2026-10-17", sessions);
  assert.equal(t.items.length, 1);
  assert.equal(t.items[0].done, false);
  assert.equal(plan.matchDay(p.days[0].items, sessions).assignedAt.has("a"), false);
});

test("copyWeek repeats week 1 as independent copies", () => {
  const p = planWith("2026-10-17", [[LIFT], "rest", [PAIRS]]);
  const c = plan.copyWeek(p);
  assert.deepEqual(c.days[8], c.days[1]);
  assert.equal(c.days[8].rest, true);
  assert.deepEqual(c.days[23], c.days[2]);
  c.days[7].items[0].reps = 99;
  assert.equal(c.days[0].items[0].reps, 10);
  assert.equal(p.days[7].items.length, 0, "original plan is not mutated");
});

test("progress counts due days, done days, extras and lift range", () => {
  const p = planWith("2026-10-17", [[LIFT], [LIFT], "rest", [LIFT]]);
  const sessions = [
    S("lift", 10, 2, "2026-10-17T09:00:00", { pitch: [0, 32] }),
    S("lift", 10, 2, "2026-10-17T18:00:00", { pitch: [0, 35] }), // extra
    S("sort", 10, 2, "2026-10-18T09:00:00"),                    // extra, day 2 missed
    S("lift", 10, 2, "2026-10-20T09:00:00", { pitch: [0, 41] }),
  ];
  const r = plan.progress(p, sessions, "2026-10-21");
  assert.equal(r.daysDue, 3);   // days 0, 1, 3 (day 2 is rest)
  assert.equal(r.daysDone, 2);
  assert.equal(r.extra, 2);
  assert.equal(r.strip.length, 30);
  // day 4 has no items: a working day with nothing assigned is treated as rest
  assert.deepEqual(r.strip.slice(0, 5), ["done", "missed", "rest", "done", "rest"]);
  assert.deepEqual(r.range, { first: 32, last: 41 });
});
