// Shared pieces for the 3D exercises (Lantern Lift, Pour the Tea).
// three.js (vendor/three, MIT) is an ES module, so it is loaded on demand with import() the first time a
// 3D exercise opens. Until it has loaded, or where WebGL isn't available, each exercise draws a flat 2D view.
(() => {
"use strict";
const RC = window.RC;
const S3 = { THREE: null, failed: false, loading: null, renderer: null };

S3.ensure = function () {
  if (S3.THREE || S3.failed || S3.loading) return;
  S3.loading = import(new URL("vendor/three/three.module.min.js", document.baseURI).href)
    .then((m) => { S3.THREE = m; })
    .catch(() => { S3.failed = true; });
};
S3.ready = () => !!S3.THREE && !S3.failed;

// One WebGL renderer is shared by every session and exercise, so playing again doesn't leak GPU contexts.
S3.getRenderer = function () {
  if (S3.renderer || S3.failed || !S3.THREE) return S3.renderer;
  const THREE = S3.THREE;
  try {
    const r = new THREE.WebGLRenderer({ canvas: document.createElement("canvas"), antialias: true, powerPreference: "high-performance" });
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    S3.renderer = r;
  } catch (e) { S3.failed = true; }
  return S3.renderer;
};

// Draw the scene at the stage's size and pixel ratio; returns the canvas to copy onto the stage.
S3.renderTo = function (R, scene, cam, W, H, pr) {
  const w = Math.round(W * pr), h = Math.round(H * pr), cv = R.domElement;
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

// Frame-rate guard. After a second of warm-up it averages the time between frames; if 3D is too slow
// (under about 22 frames a second) it steps down: 0 = full quality, 1 = lower resolution and no shadows,
// 2 = give up on 3D and draw the flat 2D view, so a slow computer still gets a playable game. Once that
// happens, S3.off keeps the 3D exercises flat for the rest of the visit.
S3.quality = function () {
  return {
    level: 0, n: 0, sum: 0, warm: 0,
    sample(raw) {
      if (!(raw > 0) || raw > 1) return this.level; // first frame, or the tab was hidden
      this.warm += raw; if (this.warm < 1) return this.level;
      this.n++; this.sum += raw;
      if (this.n >= 12) { if (this.sum / this.n > 0.045 && this.level < 2) { this.level++; this.warm = 0.4; } this.n = 0; this.sum = 0; }
      return this.level;
    },
  };
};

RC.Scene3D = S3;
})();
