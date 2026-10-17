// Unit tests for the pure parts of js/kit.js (run: node --test "tests/*.test.js")
const test = require("node:test");
const assert = require("node:assert/strict");
const { RepCounter } = require("../js/kit.js");

// Feed a piecewise-linear signal [[seconds, value], ...] at 50 Hz; return the reps counted.
function feed(rc, points) {
  let reps = 0;
  for (let i = 1; i < points.length; i++) {
    const [t0, v0] = points[i - 1], [t1, v1] = points[i];
    for (let t = t0; t < t1; t += 0.02) {
      const v = v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
      if (rc.update(0.02, v) === "rep") reps++;
    }
  }
  return reps;
}
function sweeps(n, peak) {
  const pts = [[0, 0]];
  let t = 0;
  for (let i = 0; i < n; i++) pts.push([(t += 1), 0], [(t += 1), peak], [(t += 1.5), peak], [(t += 1), 0]);
  pts.push([(t += 1), 0]);
  return pts;
}

test("counts one rep per reach-hold-return sweep", () => {
  const rc = RepCounter({ target: 30, rest: 10, hold: 1.2, reps: 10 });
  assert.equal(feed(rc, sweeps(3, 32)), 3);
  assert.equal(rc.peaks.length, 3);
  assert.ok(rc.peaks.every((p) => p >= 31));
});

test("a reach that never gets near the target does not count", () => {
  const rc = RepCounter({ target: 30, rest: 10, hold: 1.2, reps: 10 });
  assert.equal(feed(rc, sweeps(3, 20)), 0);
});

test("a reach released before the hold time does not count", () => {
  const rc = RepCounter({ target: 30, rest: 10, hold: 1.2, reps: 10 });
  assert.equal(feed(rc, [[0, 0], [1, 0], [2, 32], [2.6, 32], [3.4, 0], [5, 0]]), 0);
});

test("jitter around rest never produces reps", () => {
  const rc = RepCounter({ target: 30, rest: 10, hold: 1.2, reps: 10 });
  const pts = [];
  for (let i = 0; i <= 200; i++) pts.push([i * 0.05, i % 2 ? 3 : -3]);
  assert.equal(feed(rc, pts), 0);
});

test("the target can change between reps", () => {
  const rc = RepCounter({ target: 30, rest: 10, hold: 1, reps: 10 });
  assert.equal(feed(rc, sweeps(1, 32)), 1);
  rc.target = 45;
  assert.equal(feed(rc, sweeps(1, 32)), 0);
  assert.equal(feed(rc, sweeps(1, 47)), 1);
});

test("negative targets count reaches in the negative direction", () => {
  const rc = RepCounter({ target: -25, rest: 8, hold: 1, reps: 10 });
  assert.equal(feed(rc, sweeps(2, -28)), 2);
  assert.equal(feed(rc, sweeps(2, 28)), 0);
});
