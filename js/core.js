(() => {
"use strict";
const RC = (window.RC = window.RC || {});
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------------- storage
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
};
const settings = Object.assign({ side: "right", level: 2, reps: 10, mouse: false, sound: true }, store.get("mend.settings", {}));
const saveSettings = () => store.set("mend.settings", settings);

// ---------------------------------------------------------------- theme colors for canvas
let T = {};
function readTheme() {
  const cs = getComputedStyle(document.documentElement);
  for (const k of ["paper","surface","ink","muted","line","accent","accent-ink","go","warn","sky-top","sky-bot","hill","stage"]) T[k] = cs.getPropertyValue("--" + k).trim();
  T.display = cs.getPropertyValue("--display"); T.mono = cs.getPropertyValue("--mono"); T.body = cs.getPropertyValue("--body");
}
readTheme();
const drawGlyphs = () => RC.drawGlyphs && RC.drawGlyphs();
if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { readTheme(); drawGlyphs(); });
new MutationObserver(() => { readTheme(); drawGlyphs(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

function alpha(color, a) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(color).trim());
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
function txt(g, s, x, y, size, color, opts = {}) {
  g.font = `${opts.weight || 700} ${size}px ${opts.font || T.display}`;
  g.fillStyle = color; g.textAlign = opts.align || "center"; g.textBaseline = opts.base || "middle";
  g.fillText(s, x, y);
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }

// ---------------------------------------------------------------- sound
let actx = null;
function chime(kind) {
  if (!settings.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = kind === "success" ? [660, 880] : kind === "big" ? [523, 659, 784, 1047] : kind === "error" ? [220, 180] : [520];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), v = actx.createGain(), t0 = actx.currentTime + i * 0.09;
      o.type = kind === "error" ? "triangle" : "sine"; o.frequency.value = f;
      v.gain.setValueAtTime(0.0001, t0); v.gain.exponentialRampToValueAtTime(0.18, t0 + 0.015); v.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
      o.connect(v).connect(actx.destination); o.start(t0); o.stop(t0 + 0.3);
    });
  } catch (_) {}
}
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function fmtTime(s) { const m = Math.floor(s / 60); return m ? `${m}m ${String(Math.round(s % 60)).padStart(2, "0")}s` : `${Math.round(s)}s`; }

// Shared session state; the engine drives it, the phone link reads it.
const Game = {
  state: "idle", current: null, inst: null, rec: [], t0: 0, now: 0, banner: null,
  statusText() {
    if (this.state === "setup") return { title: "Get into position", text: this.current.def.mount };
    if (this.state === "calibrate") return { title: "Hold still", text: "Finding your resting position", tone: "" };
    if (this.state === "paused") return { title: "Paused", text: "Reconnecting to this phone", tone: "warn" };
    if (this.state === "results") return { title: "Session complete", text: "Nice work. See your results on the computer.", tone: "good" };
    if (this.inst) { const s = this.inst.status(); return { title: s.title, text: s.text, tone: s.tone }; }
    return { title: "", text: "" };
  },
};

Object.assign(RC, { $, clamp, lerp, TAU, reduceMotion, store, settings, saveSettings, T, alpha, txt, rr, chime, esc, fmtTime, Game, readTheme });
})();
