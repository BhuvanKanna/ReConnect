"""3D stays on: an exercise must keep its 3D scene through the things that used to switch every
exercise to the flat picture for the rest of the visit: a run of slow frames, an error while drawing the
scene, and the graphics card dropping its WebGL context. Then other 3D exercises must still open in 3D.

Usage:
    pip install playwright && python -m playwright install chromium
    python tests/scene3d_test.py
"""
import os, sys
import functools, http.server, socketserver, threading
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Q, directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")))
threading.Thread(target=srv.serve_forever, daemon=True).start()
log = []
VIEW = "(() => { const i = window.__mend.Game.inst; return i ? i.debug().view : null; })()"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 1100, "height": 700})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"http://127.0.0.1:{srv.server_address[1]}/"); pg.wait_for_timeout(800)
    def start(ex):
        pg.evaluate(f"RC.openActivity(RC.exercise('{ex}'))"); pg.wait_for_timeout(300); pg.click("#goMouse")
        pg.wait_for_function(VIEW + " === '3d'", timeout=30000)
    def stop():
        pg.click("#btnBack"); pg.wait_for_timeout(300)
    def res(name):
        pg.wait_for_timeout(2500)
        line = f"{name:42s} -> {pg.evaluate(VIEW)}"; print(line); log.append(line)
    start("sideraise"); res("start")
    # 1) a long stall: block the page for 2.5 s in a row of slow frames
    pg.evaluate("(() => { let n = 0; const slow = () => { const t = performance.now(); while (performance.now() - t < 120) {} if (++n < 40) requestAnimationFrame(slow); }; requestAnimationFrame(slow); })()")
    pg.wait_for_timeout(6000); res("after 5 s of very slow frames")
    # 2) an error while drawing the scene
    pg.evaluate("(() => { const S3 = RC.Scene3D, f = S3.renderTo; let k = 0; S3.renderTo = function (...a) { if (k++ < 3) throw new Error('test failure'); return f.apply(this, a); }; })()")
    res("after errors while drawing")
    # 3) the graphics card drops the WebGL context and never gives it back
    pg.evaluate("RC.Scene3D.renderer.getContext().getExtension('WEBGL_lose_context').loseContext()")
    pg.wait_for_timeout(3500); res("after the WebGL context was lost")
    renderer_ok = pg.evaluate("!RC.Scene3D.renderer.getContext().isContextLost()")
    print("new renderer working:", renderer_ok)
    stop()
    # 4) every other kind of 3D exercise still opens in 3D afterwards
    for ex in ["lift", "pour", "twist", "eartilt", "wheel", "maze", "march"]:
        start(ex); res(f"{ex} opens afterwards"); stop()
    bad = [e for e in errs if "test failure" not in e]
    print("page errors:", bad)
fails = [l for l in log if not l.endswith("3d")] + (["new renderer"] if not renderer_ok else []) + bad
print("ALL PASSED" if not fails else f"FAILED: {fails}")
sys.exit(1 if fails else 0)
