// Shared pieces for every 3D exercise: loading three.js, the one renderer, and keeping 3D running.
// three.js (vendor/three, MIT) is an ES module, so it is loaded on demand with import() the first time a
// 3D exercise opens. Only until it has loaded (or on a computer with no WebGL at all) does an exercise draw
// its flat 2D view; loading and the renderer are retried, so 3D comes back by itself.
(() => {
"use strict";
const RC = window.RC;
const S3 = { THREE: null, loading: null, renderer: null, loadRetry: 0, rendererRetry: 0, lostAt: 0, coolUntil: 0 };
const now = () => performance.now();

// The exercises are always meant to be 3D. Nothing here gives up on 3D for good: if three.js fails to load
// (a network blip) or the renderer can't be made, it tries again a few seconds later, and the exercise draws
// its flat picture only until then.
S3.ensure = function () {
  if (S3.THREE || S3.loading || now() < S3.loadRetry) return;
  S3.loading = import(new URL("vendor/three/three.module.min.js", document.baseURI).href)
    .then((m) => { S3.THREE = m; })
    .catch(() => { S3.loadRetry = now() + 3000; })
    .finally(() => { S3.loading = null; });
};
S3.ready = function () {
  if (!S3.THREE) { S3.ensure(); return false; }
  return now() >= S3.coolUntil && !!S3.getRenderer();
};

// One WebGL renderer is shared by every session and exercise, so playing again doesn't leak GPU contexts.
// If the graphics card drops its context and doesn't give it back within 2 seconds, a new renderer takes
// over; scenes are not tied to a renderer, so they carry on with the new one.
S3.getRenderer = function () {
  if (S3.renderer && S3.lostAt && now() - S3.lostAt > 2000) {
    try { S3.renderer.dispose(); } catch (e) { /* already gone */ }
    S3.renderer = null; S3.lostAt = 0;
  }
  if (S3.renderer || !S3.THREE || now() < S3.rendererRetry) return S3.renderer;
  const THREE = S3.THREE;
  try {
    const cv = document.createElement("canvas");
    cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); S3.lostAt = now(); });
    cv.addEventListener("webglcontextrestored", () => { S3.lostAt = 0; });
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: "high-performance" });
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    S3.renderer = r;
  } catch (e) { S3.rendererRetry = now() + 3000; }
  return S3.renderer;
};

// Keep a game's 3D drawing going through errors: if drawing a frame throws, the game's scene is freed
// (G.dispose) and rebuilt from scratch a moment later, instead of the exercise staying flat.
S3.guard = function (G, draw) {
  return function (...args) {
    try { return draw.apply(this, args); } catch (e) {
      console.error("3D scene error; rebuilding it", e);
      try { if (G.dispose) G.dispose(); } catch (e2) { /* nothing left to free */ }
      S3.coolUntil = now() + 600;
    }
  };
};

// Draw the scene at the stage's size and pixel ratio; returns the canvas to copy onto the stage.
S3.renderTo = function (R0, scene, cam, W, H, pr) {
  const R = S3.getRenderer() || R0, w = Math.round(W * pr), h = Math.round(H * pr), cv = R.domElement;
  if (cv.width !== w || cv.height !== h) R.setSize(w, h, false);
  R.render(scene, cam);
  return cv;
};
S3.toScreen = function (cam, p, W, H) { const v = p.clone().project(cam); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H }; };
S3.dispose = function (scene, keep) {
  scene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    ms.forEach((m) => { if (m.map && !keep.includes(m.map)) m.map.dispose(); m.dispose(); });
  });
  keep.forEach((t) => t.dispose());
};

S3.glowTexture = function () {
  const THREE = S3.THREE, c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.25, "rgba(255,255,255,0.55)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
S3.woodTexture = function (base, w, h) {
  const THREE = S3.THREE, c = document.createElement("canvas"); c.width = w || 512; c.height = h || 64;
  const g = c.getContext("2d"); g.fillStyle = base || "#8a5a36"; g.fillRect(0, 0, c.width, c.height);
  let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < c.height * 1.1; i++) {
    g.strokeStyle = `rgba(${rnd() < 0.5 ? "60,34,18" : "170,118,74"},${0.12 + rnd() * 0.22})`; g.lineWidth = 1 + rnd() * 2;
    const y = rnd() * c.height; g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= c.width; x += 32) g.lineTo(x, y + Math.sin(x / 60 + i) * 2.5);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};

// Frame-rate guard. After a second of warm-up it averages the real time between frames (wall clock, not
// game time, so a slow software renderer is caught too). If 3D is slow (under about 22 frames a second) it
// steps down to level 1: lower resolution and no shadows. It never switches 3D off; a slow moment (another
// program busy, the phone reconnecting) only costs some sharpness, and it steps back up when frames are fast.
S3.quality = function () {
  return {
    level: 0, n: 0, sum: 0, warm: 0,
    sample() {
      const t = now() / 1000, raw = this.last == null ? 0 : t - this.last; this.last = t;
      if (!(raw > 0) || raw > 1) return this.level; // first frame, or the tab was hidden
      this.warm += raw; if (this.warm < 1) return this.level;
      this.n++; this.sum += raw;
      if (this.n >= 12) {
        const avg = this.sum / this.n;
        if (avg > 0.045 && this.level < 1) { this.level = 1; this.warm = 0.4; this.fast = 0; }
        else if (this.level === 1 && avg < 0.022) { if (++this.fast >= 25) { this.level = 0; this.fast = 0; this.warm = 0.4; } }
        else this.fast = 0;
        this.n = 0; this.sum = 0;
      }
      return this.level;
    },
  };
};

RC.Scene3D = S3;
})();
