"""End-to-end smoke test for ReConnect.

Opens the computer page and a simulated phone in headless Chromium, pairs them through
PeerJS, plays one full Lantern Lift session with simulated phone tilt, then plays every
activity to completion in mouse mode.

Usage:
    pip install playwright && python -m playwright install chromium
    python tests/smoke_test.py                                   # serves this folder locally, public PeerJS broker
    python tests/smoke_test.py --site https://USER.github.io/REPO/   # test the deployed site
    python tests/smoke_test.py --broker localhost:9000           # use a local broker (npx peerjs --port 9000)

Exit code 0 means every check passed.
"""
import argparse, collections, functools, http.server, json, math, os, socketserver, sys, threading, time
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument("--site", help="Base URL of a deployed site. Default: serve this repo on localhost.")
ap.add_argument("--broker", help="host:port of a local PeerJS server instead of the public one.")
ap.add_argument("--skip-games", action="store_true", help="Only test phone pairing.")
args = ap.parse_args()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
failures = []


def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond:
        failures.append(msg)


if args.site:
    base = args.site.rstrip("/") + "/"
else:
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    handler.log_message = lambda *a: None
    srv = socketserver.TCPServer(("127.0.0.1", 0), handler)
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
    con.wait_for_function("/^\\d{6}$/.test(document.getElementById('pCode').textContent.trim())", timeout=20000)
    code = con.inner_text("#pCode").strip()
    check(True, f"computer registered pairing code {code}")
    check(con.locator("#qrBox svg").count() == 1, "QR code rendered")
    con.click("#segReps button[data-v='6']")
    con.click("#segLevel button[data-v='2']")

    # ---- simulated phone
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

    con.click(".card[data-id='lift']")
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

    # ---- every activity in mouse mode
    if not args.skip_games:
        con.click("#home")
        con.click("#useMouse")
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

        def play(gid, step, limit):
            if con.is_visible("#btnBack"):
                con.click("#btnBack")
            con.click(f".card[data-id='{gid}']")
            con.click("#goMouse")
            setang(0, 0); time.sleep(0.3)
            t0 = time.time()
            while state() != "results" and time.time() - t0 < limit:
                step()
            check(state() == "results", f"{gid} completes in mouse mode")

        play("lift", lambda: (mramp(0, 0, 0, 0, 0.6), mramp(0, 0, 34, 0, 1.0), mramp(34, 0, 34, 0, 1.5), mramp(34, 0, 0, 0, 1.0)), 60)

        cup = [0]
        def pour_step():
            d = 1 if cup[0] % 2 == 0 else -1
            mramp(0, 0, 0, d * 28, 1.2); t0 = time.time()
            while title().startswith("Turn your hand") and time.time() - t0 < 8: time.sleep(0.1)
            mramp(0, d * 28, 0, 0, 1.0); time.sleep(0.3); cup[0] += 1
        play("pour", pour_step, 90)

        k = [0]
        def lock_step():
            if title().startswith("Dial"):
                dgt = [2, 7][k[0] % 2]; k[0] += 1
                setang(0, dgt / 9 * 2 * AMP - AMP); time.sleep(1.4)
            else: time.sleep(0.2)
        play("lock", lock_step, 90)

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
        play("maze", maze_step, 120)

        side = [1]
        def sort_step():
            if title().startswith("Where does"):
                mramp(0, 0, 0, side[0] * 28, 0.4); time.sleep(0.8); mramp(0, side[0] * 28, 0, 0, 0.4); side[0] = -side[0]
            time.sleep(0.15)
        play("sort", sort_step, 60)

        def simon_step():
            if title().startswith("Move"):
                dd = con.evaluate("(() => { const x = window.__mend.Game.inst.debug(); return x.seq[x.step] })()")
                pr = {0: (26, 0), 1: (0, 26), 2: (-26, 0), 3: (0, -26)}[dd]
                mramp(0, 0, pr[0], pr[1], 0.35); time.sleep(0.25); mramp(pr[0], pr[1], 0, 0, 0.35); time.sleep(0.25)
            else: time.sleep(0.15)
        play("simon", simon_step, 120)

        con.click("#btnBack"); con.click("#tabLog")
        check(con.locator("#logBody tbody tr").count() >= 6, "session log lists the sessions")

    b.close()

check(not errors, "no JavaScript errors" + ("" if not errors else ": " + "; ".join(errors[:5])))
print("\nALL CHECKS PASSED" if not failures else f"\n{len(failures)} CHECK(S) FAILED")
sys.exit(1 if failures else 0)
