(() => {
"use strict";
const RC = window.RC;
const { $, clamp, lerp, TAU, reduceMotion, store, settings, saveSettings, T, alpha, txt, rr, chime, esc, fmtTime, Game, readTheme } = RC;
// ---------------------------------------------------------------- input
const Input = {
  phone: false, raw: { b: 0, g: 0 }, f: { b: 0, g: 0 }, neutral: { b: 0, g: 0 }, lastAt: 0,
  mouse: { p: 0, r: 0 }, mf: { p: 0, r: 0 }, mode: "mouse",
};
function wrap180(d) { return ((d + 540) % 360) - 180; }
function angles() {
  if (Input.mode === "phone") return { pitch: Input.f.b - Input.neutral.b, roll: wrap180(Input.f.g - Input.neutral.g), demo: false };
  return { pitch: Input.mf.p, roll: Input.mf.r, demo: true };
}
function smoothInput(dt) {
  const k = 1 - Math.exp(-dt * 14);
  Input.f.b += (Input.raw.b - Input.f.b) * k;
  Input.f.g += wrap180(Input.raw.g - Input.f.g) * k;
  Input.mf.p += (Input.mouse.p - Input.mf.p) * k;
  Input.mf.r += (Input.mouse.r - Input.mf.r) * k;
}

// Mouse / touch stand-in: position on the stage = tilt of the hand. Up = raise / tilt top edge up.
const stageWrap = $("stageWrap");
stageWrap.addEventListener("pointermove", (e) => {
  const r = stageWrap.getBoundingClientRect();
  Input.mouse.r = clamp(((e.clientX - r.left) / r.width - 0.5) * 2 * 60, -60, 60);
  Input.mouse.p = clamp(-((e.clientY - r.top) / r.height - 0.5) * 2 * 60, -60, 60);
});
window.addEventListener("keydown", (e) => {
  if ($("vPlay").hidden || Input.mode !== "mouse") return;
  const step = e.shiftKey ? 10 : 4;
  if (e.key === "ArrowUp") Input.mouse.p = clamp(Input.mouse.p + step, -60, 60);
  else if (e.key === "ArrowDown") Input.mouse.p = clamp(Input.mouse.p - step, -60, 60);
  else if (e.key === "ArrowLeft") Input.mouse.r = clamp(Input.mouse.r - step, -60, 60);
  else if (e.key === "ArrowRight") Input.mouse.r = clamp(Input.mouse.r + step, -60, 60);
  else return;
  e.preventDefault();
});
Object.assign(RC, { Input, angles, smoothInput, wrap180 });
})();
