"""Plays every exercise of the expanded motion library to the end, at all three levels.

Each exercise is built straight from its definition in the browser and driven frame by frame with
simulated phone readings (tilt, heading, acceleration) or taps, chosen from what its debug() says
it is waiting for. Every frame is also drawn, so drawing errors show up too. A pass means the
exercise finishes, scores full marks for the perfect input, and its status and stats render.

Usage:
    pip install playwright && python -m playwright install chromium
    python tests/engines_test.py            # all new exercises
    python tests/engines_test.py stir wheel # just some
"""
import functools, http.server, json, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEW = """shelf comb curtains gate paint hammer torch moon stir pendulum toss row apples balloons dots window fruit kite
quickreach letters reachturn nose key pages pancake screw wave drawbridge wheel radio flashlight wristcircle water
mole scales drum beat numhunt typeword tapcount pegboard shake pinchhold floor sidereach rock trunkcircle kneeext
kneeout foottilt ankletrace toetap bridge heelslide standshift minisquat marchstand standreach""".split()

AUTOPILOT = r"""
(args) => {
  const def = RC.exercise(args.id), W = 1000, H = 600, DT = 1 / 30;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
  const p = def.params || {}, d0 = def.defaults || {};
  const S = { amp: RC.LEVEL_AMP[args.level], level: args.level, reps: d0.reps, durationS: d0.durationS, side: "right" };
  const inst = def.make(S); inst.S = S;
  let v = 0, th = 0, pulse = 0, cool = 0, tapT = 0, t = 0;
  const errors = [];
  const step = () => {
    const d = inst.debug ? inst.debug() : {};
    const a = { pitch: 0, roll: 0, yaw: 0, acc: 0, demo: false };
    let kind = d.kind || (d.state ? "reach" : null);
    if (kind === "reach") kind = "value", d.target = d.state === "move" ? d.target * 1.05 : 0;
    if (kind === "value") { v += Math.max(-6, Math.min(6, (d.target - d.val) * 0.5)); a.pitch = a.roll = a.yaw = v; }
    else if (kind === "spikes") { pulse = (pulse + DT) % 0.8; a.acc = pulse < 0.15 ? d.thr * 1.6 : 0; }
    else if (kind === "circles") { th += d.dir * 2.5 * DT; a.roll = d.r * 1.6 * Math.cos(th); a.pitch = d.r * 1.6 * Math.sin(th); }
    else if (kind === "throw") { if (d.phase === "aim" && cool <= 0) { pulse = 0.5; cool = 1; } pulse -= DT; cool -= DT; a.acc = pulse > 0 ? d.thr + d.zone * (d.top - d.thr) : 0; }
    else if (kind === "direction") { if (d.phase === "go") { a.roll = d.dir[0] * d.amp * 1.15; a.pitch = d.dir[1] * d.amp * 1.15; } }
    else if (kind === "points") {
      const q = d.targets[0];
      if (q) { a.roll = ((q.x - W / 2) / (W * 0.42)) * S.amp; a.pitch = (-(q.y - H / 2) / (H * 0.4)) * S.amp; }
    } else if (kind === "pad") { tapT -= DT; if (d.key && tapT <= 0) { inst.pad({ type: "tap", key: d.key }); tapT = 0.12; } }
    else if (kind === "drag") { if (d.from && d.to) { inst.pointer({ type: "down", x: d.from.x, y: d.from.y }); inst.pointer({ type: "move", x: d.to.x, y: d.to.y }); inst.pointer({ type: "up", x: d.to.x, y: d.to.y }); } }
    else return "no strategy for kind " + JSON.stringify(d);
    inst.update(DT, a); inst.events.splice(0);
    return null;
  };
  try {
    inst.draw(g, W, H, { pitch: 0, roll: 0, yaw: 0, acc: 0, demo: false }, 0);
    while (!inst.done && t < args.limit) {
      const bad = step(); if (bad) return { ok: false, why: bad };
      t += DT;
      inst.draw(g, W, H, { pitch: v, roll: v, yaw: v, acc: 0, demo: false }, t);
      if (Math.round(t / DT) % 30 === 0) { const s = inst.status(); if (!s || !s.title) errors.push("empty status at " + t.toFixed(1)); }
    }
  } catch (e) { return { ok: false, why: String(e && e.stack || e) }; }
  const stats = inst.stats(), text = JSON.stringify(stats);
  if (/NaN|undefined|Infinity/.test(text)) errors.push("bad stats " + text);
  return { ok: inst.done && inst.reps() >= inst.goal() && !errors.length, done: inst.done, reps: inst.reps(), goal: inst.goal(), t: +t.toFixed(1), stats, errors };
}
"""


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    ids = sys.argv[1:] or NEW
    socketserver.ThreadingTCPServer.daemon_threads = True
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    fails, page_errors = [], []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        pg.on("pageerror", lambda e: page_errors.append(str(e)))
        pg.goto(f"http://localhost:{srv.server_address[1]}/")
        have = set(pg.evaluate("RC.EXERCISES.map(d => d.id)"))
        missing = [i for i in ids if i not in have]
        if missing:
            fails.append(f"not registered: {missing}")
        if ids is NEW:
            print(f"{len(NEW)} new exercises registered; library has {len(have)} in total")
            if len(NEW) < 50:
                fails.append("fewer than 50 new exercises")
            guided = pg.evaluate(f"{json.dumps(NEW)}.filter(id => RC.exercise(id) && RC.exercise(id).control === 'guided')")
            if guided:
                fails.append(f"follow-along (guided) exercises in the new set: {guided}")
        for gid in [i for i in ids if i in have]:
            for level in (1, 2, 3):
                r = pg.evaluate(AUTOPILOT, {"id": gid, "level": level, "limit": 900})
                tag = f"{gid} L{level}"
                if r["ok"]:
                    print(f"PASS {tag}: {r['reps']}/{r['goal']} in {r['t']} s", flush=True)
                else:
                    print(f"FAIL {tag}: {json.dumps(r)[:400]}", flush=True)
                    fails.append(tag)
        b.close()
    if page_errors:
        fails.append(f"page errors: {page_errors[:3]}")
    print("ALL PASSED" if not fails else f"{len(fails)} FAILED: {fails}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
