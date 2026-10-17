"""End-to-end smoke test for ReConnect.

Opens the computer page and a simulated phone in headless Chromium, pairs them through
PeerJS, plays one full Lantern Lift session with simulated phone tilt, then plays every
activity to completion in mouse mode, then walks the patient Today flow.

Usage:
    pip install playwright && python -m playwright install chromium
    python tests/smoke_test.py                                   # serves this folder locally, public PeerJS broker
    python tests/smoke_test.py --site https://USER.github.io/REPO/   # test the deployed site
    python tests/smoke_test.py --broker localhost:9000           # use a local broker (npx peerjs --port 9000)
    python tests/smoke_test.py --no-phone                        # skip pairing (offline runs)

Exit code 0 means every check passed.
"""
import argparse, collections, datetime, re, functools, http.server, json, math, os, socketserver, sys, threading, time
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument("--site", help="Base URL of a deployed site. Default: serve this repo on localhost.")
ap.add_argument("--broker", help="host:port of a local PeerJS server instead of the public one.")
ap.add_argument("--skip-games", action="store_true", help="Only test phone pairing.")
ap.add_argument("--no-phone", action="store_true", help="Skip the phone pairing section.")
ap.add_argument("--quick", action="store_true", help="Skip the free-play run of every exercise (faster iteration).")
args = ap.parse_args()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
failures = []


def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg, flush=True)
    if not cond:
        failures.append(msg)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


if args.site:
    base = args.site.rstrip("/") + "/"
else:
    # Threaded: the page loads ~17 scripts in parallel, which a single-threaded server refuses.
    socketserver.ThreadingTCPServer.daemon_threads = True
    socketserver.ThreadingTCPServer.request_queue_size = 64
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://localhost:{srv.server_address[1]}/"

init = ""
if args.broker:
    host, port = args.broker.split(":")
    init = "window.MEND_PEER_OPTS = " + json.dumps({"host": host, "port": int(port), "path": "/", "secure": False}) + ";"

AMP = 30
errors = []

with sync_playwright() as p:
    b = p.chromium.launch()
    desk = b.new_context(viewport={"width": 1366, "height": 900})
    if init:
        desk.add_init_script(init)
    con = desk.new_page()
    con.on("pageerror", lambda e: errors.append("computer: " + str(e)))
    con.goto(base)
    con.evaluate("window.__mend.data.resetDemo(); window.__mend.data.setRole('patient'); window.__mend.data.setActivePatient('p_mei')")  # no plan: free play keeps its own settings
    con.reload()

    def set_reps(n):
        btn = con.locator(f"#setReps button[data-v='{n}']")
        if btn.count() and btn.is_enabled():
            btn.click()

    # ---- simulated phone
    if not args.no_phone:
        con.wait_for_function("/^\\d{6}$/.test(document.getElementById('pCode').textContent.trim())", timeout=20000)
        code = con.inner_text("#pCode").strip()
        check(True, f"computer registered pairing code {code}")
        check(con.locator("#qrBox svg").count() == 1, "QR code rendered")
        mob = desk.browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True,
                                       permissions=["accelerometer", "gyroscope", "magnetometer"])
        if init:
            mob.add_init_script(init)
        ph = mob.new_page()
        ph.on("pageerror", lambda e: errors.append("phone: " + str(e)))
        ph.goto(base + f"phone.html?c={code}")
        ph.wait_for_selector("#vMotion:not([hidden])", timeout=10000)
        ph.wait_for_function("document.getElementById('pillText').textContent.startsWith('Paired')", timeout=20000)
        check(True, "phone paired with computer")
        ph.click("#btnMotion")
        ph.wait_for_selector("#vLive:not([hidden])", timeout=5000)

        def orient(beta, gamma):
            ph.evaluate(f"window.dispatchEvent(new DeviceOrientationEvent('deviceorientation',{{alpha:0,beta:{beta},gamma:{gamma}}}))")

        orient(5, 0)
        con.wait_for_function("document.getElementById('connText').textContent === 'Phone connected'", timeout=8000)
        check(True, "computer receives phone motion")

        con.click(".tile[data-id='lift']")
        set_reps(6)
        con.wait_for_selector("#goPhone:not([disabled])", timeout=5000)
        con.click("#goPhone")
        t_end = time.time() + 3.6
        while time.time() < t_end:
            orient(10, 0); time.sleep(0.05)

        def ramp(a, b_, dur):
            n = int(dur / 0.04)
            for i in range(n + 1):
                orient(a + (b_ - a) * (0.5 - 0.5 * math.cos(math.pi * i / n)), 0); time.sleep(0.04)

        for _ in range(9):  # 6 reps needed; spare cycles absorb relay lag
            ramp(10, 10, 0.7); ramp(10, 48, 1.2); ramp(48, 48, 1.8); ramp(48, 8, 1.2)
            if con.is_visible("#again"):
                break
        ramp(8, 8, 1.0)
        done = con.is_visible("#again") or con.wait_for_selector("#again", timeout=6000)
        check(bool(done), "phone-controlled Lantern Lift session completed")
        check("Session complete" in ph.inner_text("#stTitle"), "phone shows the session result")
        con.click("#home")

        # ---- phone touch pad, and falling back to the stage when the phone goes away (Review Focus 5)
        con.evaluate("""RC.register({ id: "__padtest", name: "Pad test", section: "hand", control: "touch", pad: "keys",
            movement: "test", desc: "test", mount: "", source: "test", how: ["a", "b", "c"], params: { reps: null, level: [1, 2, 3], durationS: null },
            make: (S) => { const G = RC.kit.base(S, 99), kp = RC.kit.Keypad({ labels: ["1","2","3","4","5","6","7","8","9","←","0","OK"] }); let last = null;
              G.update = () => {}; G.status = () => ({ title: "Tap a key", text: String(last) }); G.stats = () => [];
              G.pad = (e) => { last = e.key; }; G.pointer = (e) => { if (e.type === "down") { const k = kp.hit(e.x, e.y); if (k) last = k; } };
              G.draw = (g, W, H) => { g.fillStyle = RC.T.stage; g.fillRect(0, 0, W, H); kp.place({ x: W * 0.3, y: H * 0.2, w: W * 0.4, h: H * 0.7 }); kp.draw(g, last); };
              G.debug = () => ({ last, rects: kp.rects }); return G; } }); RC.patient.render()""")
        con.click(".tile[data-id='__padtest']")
        con.click("#goPhone")
        ph.wait_for_selector("#pad:not([hidden]) button", timeout=8000)
        check(ph.locator("#pad button").count() == 12, "phone shows a 12-key touch pad")
        ph.click("#pad button[data-key='5']")
        con.wait_for_function("window.__mend.Game.inst && window.__mend.Game.inst.debug().last === '5'", timeout=8000)
        check(True, "a tap on the phone pad reaches the exercise")
        ph.close()
        con.wait_for_function("document.getElementById('bTitle').textContent.includes('Phone disconnected')", timeout=30000)
        check(con.evaluate("window.__mend.Game.state") == "play", "exercise keeps running when the phone disconnects")
        r = con.evaluate("window.__mend.Game.inst.debug().rects['7']"); bx = con.locator("#stageWrap").bounding_box()
        con.mouse.click(bx["x"] + r["x"] + r["w"] / 2, bx["y"] + r["y"] + r["h"] / 2)
        check(con.evaluate("window.__mend.Game.inst.debug().last") == "7", "stage keys take over after the phone disconnects")
        con.evaluate("window.__mend.Game.finishNow()")

    if not args.skip_games:
        # ---- helpers for mouse-mode play
        con.click("#conn")  # pairing drawer holds the mouse toggle
        if con.is_enabled("#useMouse") and not con.is_checked("#useMouse"):
            con.click("#useMouse")
        con.keyboard.press("Escape")
        BX = {}

        def setang(pitch, roll):
            bx = BX.get("b") or con.locator("#stageWrap").bounding_box(); BX["b"] = bx
            con.mouse.move(bx["x"] + (roll / 120 + 0.5) * bx["width"], bx["y"] + (0.5 - pitch / 120) * bx["height"])

        def mramp(p0, r0, p1, r1, dur):
            n = max(1, int(dur / 0.03))
            for i in range(n + 1):
                u = 0.5 - 0.5 * math.cos(math.pi * i / n)
                setang(p0 + (p1 - p0) * u, r0 + (r1 - r0) * u); time.sleep(0.03)

        title = lambda: con.evaluate("(() => { const i = window.__mend.Game.inst; return i ? i.status().title : '' })()")
        state = lambda: con.evaluate("window.__mend.Game.state")

        def run(gid, step, limit, label=None):
            """The setup sheet is open: start in mouse mode and play until results."""
            set_reps(6)
            con.click("#goMouse")
            setang(0, 0); time.sleep(0.3)
            t0 = time.time()
            while state() != "results" and time.time() - t0 < limit:
                step()
            check(state() == "results", label or f"{gid} completes in mouse mode")

        def play(gid, step, limit):
            if con.is_visible("#btnBack"):
                con.click("#btnBack")
            con.click(f".tile[data-id='{gid}']")
            run(gid, step, limit)

        lift_step = lambda: (mramp(0, 0, 0, 0, 0.6), mramp(0, 0, 34, 0, 1.0), mramp(34, 0, 34, 0, 1.5), mramp(34, 0, 0, 0, 1.0))
        if not args.quick: play("lift", lift_step, 60)

        cup = [0]
        def pour_step():
            d = 1 if cup[0] % 2 == 0 else -1
            mramp(0, 0, 0, d * 28, 1.2); t0 = time.time()
            while title().startswith("Turn your hand") and time.time() - t0 < 8: time.sleep(0.1)
            mramp(0, d * 28, 0, 0, 1.0); time.sleep(0.3); cup[0] += 1
        if not args.quick: play("pour", pour_step, 90)

        k = [0]
        def lock_step():
            if title().startswith("Dial"):
                dgt = [2, 7][k[0] % 2]; k[0] += 1
                setang(0, dgt / 9 * 2 * AMP - AMP); time.sleep(1.4)
            else: time.sleep(0.2)
        if not args.quick: play("lock", lock_step, 90)

        def maze_step():
            d = con.evaluate("(() => { const d = window.__mend.Game.inst.debug(); return { C: d.maze.C, R: d.maze.R, cells: d.maze.cells.map(c => [c.n,c.e,c.s,c.w]), x: d.ball.x, y: d.ball.y, vx: d.ball.vx, vy: d.ball.vy } })()")
            C, R = d["C"], d["R"]; start = (min(C - 1, int(d["x"])), min(R - 1, int(d["y"]))); goal = (C - 1, R - 1)
            prev = {start: None}; q = collections.deque([start])
            while q:
                x, y = q.popleft()
                if (x, y) == goal: break
                n, e, s_, w = d["cells"][y * C + x]
                for dx, dy, wall in [(0, -1, n), (1, 0, e), (0, 1, s_), (-1, 0, w)]:
                    nx, ny = x + dx, y + dy
                    if not wall and 0 <= nx < C and 0 <= ny < R and (nx, ny) not in prev:
                        prev[(nx, ny)] = (x, y); q.append((nx, ny))
            path = []; node = goal
            while node and node in prev: path.append(node); node = prev[node]
            path.reverse(); tgt = path[1] if len(path) > 1 else goal
            ax = max(-1, min(1, 1.6 * (tgt[0] + 0.5 - d["x"]) - 0.9 * d["vx"]))
            ay = max(-1, min(1, 1.6 * (tgt[1] + 0.5 - d["y"]) - 0.9 * d["vy"]))
            setang(-ay * AMP * 0.9, ax * AMP * 0.9); time.sleep(0.04)
        if not args.quick: play("maze", maze_step, 120)

        side = [1]
        def sort_step():
            if title().startswith("Where does"):
                mramp(0, 0, 0, side[0] * 28, 0.4); time.sleep(0.8); mramp(0, side[0] * 28, 0, 0, 0.4); side[0] = -side[0]
            time.sleep(0.15)
        if not args.quick: play("sort", sort_step, 60)

        def simon_step():
            if title().startswith("Move"):
                dd = con.evaluate("(() => { const x = window.__mend.Game.inst.debug(); return x.seq[x.step] })()")
                pr = {0: (26, 0), 1: (0, 26), 2: (-26, 0), 3: (0, -26)}[dd]
                mramp(0, 0, pr[0], pr[1], 0.35); time.sleep(0.25); mramp(pr[0], pr[1], 0, 0, 0.35); time.sleep(0.25)
            else: time.sleep(0.15)
        if not args.quick:
            play("simon", simon_step, 120)
            con.click("#home")

        # ---- patient Today flow
        items = [{"exerciseId": g, "reps": 6, "level": 2, "durationS": None} for g in ("lift", "pour", "sort")]
        con.evaluate(f"window.__mend.data.resetDemo({{ todayItems: {json.dumps(items)} }}); window.__mend.data.setActivePatient('p_ruth'); RC.patient.render()")
        check(con.get_attribute("#todayBar", "data-state") == "progress", "Today bar shows goals in progress")
        steps = {"lift": lift_step, "pour": pour_step, "sort": sort_step}
        for n, gid in enumerate(("lift", "pour", "sort")):
            con.click("#todayStart")
            if n == 0:
                check("Set by your therapist" in con.inner_text("#sheet"), "assigned settings are shown as set by the therapist")
            check(con.inner_text("#pTitle") == con.evaluate(f"RC.exercise('{gid}').name"), f"Start opens the next assigned exercise ({gid})")
            run(gid, steps[gid], 90, f"assigned {gid} completes")
            con.click("#home")
            check(con.get_attribute(f"#todaySteps li:nth-child({n + 1})", "data-done") == "true", f"Today step {n + 1} ticks off")
        check(con.get_attribute("#todayBar", "data-state") == "done", "Today bar shows all done")
        check("That's today's plan, done." in con.inner_text("#todayBar"), "all-done message is shown")
        check("3" in con.inner_text("#myProgress"), "My progress shows today's sessions")
        play("sort", sort_step, 60)
        con.click("#home")
        check(con.evaluate("window.__mend.data.sessions('p_ruth').at(-1).assigned") is False, "extra session after goals is recorded as extra")

        # ---- no plan, locked tiles
        con.select_option("#patientSel", "p_mei")
        check(con.get_attribute("#todayBar", "data-state") == "none" and "No plan for today" in con.inner_text("#todayBar"), "patient without a plan sees 'No plan for today'")
        con.click(".tile[data-id='sort']")
        check(con.is_visible("#vPlay"), "library still opens exercises without a plan")
        con.click("#btnBack")
        con.evaluate("""RC.register({ id: "__locked", name: "Locked test", section: "trunk", safety: "standing", control: "guided",
            movement: "test", desc: "test", mount: "", source: "test", how: ["a", "b", "c"], make: () => null }); RC.patient.render()""")
        check(con.get_attribute(".tile[data-id='__locked']", "aria-disabled") == "true", "safety-locked tile is disabled")
        con.click(".tile[data-id='__locked']", force=True)
        check(not con.is_visible("#vPlay"), "locked tile does not open")

        # ---- provider: patients and plan builder
        con.click("#roleProvider")
        n_pts = con.locator("#pvPatients .pt").count()
        con.click("#pvAddPatient"); con.fill("#pvNewName", "Tom B."); con.click("#pvNewSave")
        check(con.locator("#pvPatients .pt").count() == n_pts + 1, "provider can add a patient")
        con.click("#pvPatients .pt[data-id='p_mei']")
        today = con.evaluate("RC.plan.dateKey(new Date())")
        con.fill("#pvStart", today); con.dispatch_event("#pvStart", "change")
        check(con.locator(".calday").count() == 30, "a 30-day calendar appears once a start date is set")
        con.click(".calday[data-day='0']")
        con.fill("#pvPickQ", "Lantern"); con.click(".pick[data-id='lift']")
        con.select_option(".item[data-index='0'] select[name=reps]", "6")
        con.select_option(".item[data-index='0'] select[name=level]", "1")
        con.fill("#pvPickQ", ""); con.click(".pick[data-id='sort']")
        con.fill("#pvPickQ", "Locked"); con.click(".pick[data-id='__locked']")
        check(con.is_visible("#pvSafety"), "picking a safety-flagged exercise asks for confirmation")
        con.click("#pvSafetyNo")
        check(con.locator(".item").count() == 2, "declining the safety confirmation adds nothing")
        con.click(".calday[data-day='1']"); con.check("#pvRest")
        con.click("#pvCopyWeek")
        check(con.locator(".calday[data-day='7'] .chip").count() == 2, "copy week 1 repeats day 1's exercises on day 8")
        check("Rest" in con.inner_text(".calday[data-day='8']"), "copy week 1 repeats the rest day")
        check(con.evaluate("window.__mend.data.plan('p_mei').days[0].items[0].reps") == 6, "plan edits are saved")
        # ---- provider: progress and export
        con.click("#pvPatients .pt[data-id='p_ruth']"); con.click("#pvTabProgress")
        check(re.match(r"^\d+/\d+$", con.inner_text("#pvKpiDays").strip()) is not None, "progress shows assigned days done as N/M")
        strip = [con.get_attribute(f".strip span:nth-child({i + 1})", "data-status") for i in range(con.locator(".strip span").count())]
        check(len(strip) == 30 and "missed" in strip and "partly" in strip, "adherence strip has 30 days including missed and partly done")
        check(con.inner_text("#pvSessions tbody tr:first-child td.kind") in ("Assigned", "Extra", "Before plan"), "sessions are tagged Assigned or Extra")
        with con.expect_download() as dl_info:
            con.click("#pvExportCsv")
        dl = dl_info.value
        first_line = open(dl.path(), encoding="utf-8").readline()
        check(dl.suggested_filename.startswith("reconnect-ruth") and first_line.startswith("at,id,name"), f"CSV export downloads ({dl.suggested_filename})")
        check(con.locator("#pvPrint").count() == 1, "print report button is present")
        con.click("#pvTabPlan")
        con.click("#rolePatient")
        con.select_option("#patientSel", "p_mei")
        check(con.locator("#todaySteps li").count() == 2, "patient sees the provider's plan in the Today bar")

        # ---- exercise families: every tile opens, and one per family plays to the end
        con.evaluate("(() => { const d = window.__mend.data, p = d.patients().find(x => x.id === 'p_mei'); p.enabled = { sit2stand: true, balance: true }; d.savePatient(p); d.setActivePatient('p_mei'); RC.patient.render(); })()")
        dbg = lambda: con.evaluate("window.__mend.Game.inst.debug()")

        def stage_click(x, y):
            bx = con.locator("#stageWrap").bounding_box()
            con.mouse.click(bx["x"] + x, bx["y"] + y)

        def center(r):
            return r["x"] + r["w"] / 2, r["y"] + r["h"] / 2

        def tile_opens(gid):
            if con.is_visible("#btnBack"):
                con.click("#btnBack")
            con.click(f".tile[data-id='{gid}']")
            con.click("#goMouse")
            time.sleep(1.5)
            t, st = title(), state()
            con.evaluate("window.__mend.Game.finishNow()")
            check(bool(t) and st == "play", f"{gid} opens and runs ({t})")

        def family(name, ids, rep_id, rep_step, limit=120):
            for gid in ids:
                tile_opens(gid)
            play(rep_id, rep_step, limit)
            con.click("#home")

        def sideraise_step():
            mramp(0, 0, 0, 0, 0.5); mramp(0, 0, 0, 34, 0.9); mramp(0, 34, 0, 34, 1.4); mramp(0, 34, 0, 0, 0.9)
        family("arm", ["sideraise", "reach", "cupmouth", "push", "slide", "bowl", "trace"], "sideraise", sideraise_step, 90)

        def wristbend_step():
            mramp(0, 0, 0, 0, 0.4); mramp(0, 0, 34, 0, 0.6); mramp(34, 0, 34, 0, 0.6); mramp(34, 0, -24, 0, 0.9); mramp(-24, 0, -24, 0, 0.6); mramp(-24, 0, 0, 0, 0.5)
        family("wrist", ["wristbend", "wiper", "steady"], "wristbend", wristbend_step, 90)

        def tap_step():
            d = dbg()
            if d.get("rects") and d.get("lit") is not None and d["lit"] < len(d["rects"]):
                stage_click(*center(d["rects"][d["lit"]]))
            time.sleep(0.08)
        family("hand", ["tap", "rhythm", "dial", "pinch", "grip", "putty", "curls", "thumbs", "clothespin", "coins", "buttons", "knifefork"], "tap", tap_step, 60)

        con.click("#toLog")
        check(con.locator("#logBody tbody tr").count() >= 6, "session log lists the sessions")

    # ---- midnight rollover (Review Focus 1)
    night = b.new_context(viewport={"width": 1366, "height": 900})
    pg = night.new_page()
    pg.on("pageerror", lambda e: errors.append("night: " + str(e)))
    pg.clock.install(time=datetime.datetime(2026, 10, 20, 23, 59, 30))
    pg.goto(base)
    pg.evaluate("window.__mend.data.resetDemo(); window.__mend.data.setActivePatient('p_ruth'); RC.patient.render()")
    before = pg.inner_text("#todayDay")
    pg.clock.run_for(61000)
    pg.wait_for_timeout(100)
    check(pg.inner_text("#todayDay") != before, f"Today bar rolls over at midnight without reload ({before} -> {pg.inner_text('#todayDay')})")

    b.close()

check(not errors, "no JavaScript errors" + ("" if not errors else ": " + "; ".join(errors[:5])))
print("\nALL CHECKS PASSED" if not failures else f"\n{len(failures)} CHECK(S) FAILED")
sys.exit(1 if failures else 0)
