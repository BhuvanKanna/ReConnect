(() => {
"use strict";
const RC = window.RC;
const { $, clamp, Game } = RC;
// ---------------------------------------------------------------- input
// Phone: tilt (b = pitch, g = roll), compass heading (a = yaw) and acceleration magnitude (mag;
// `lin` says whether gravity is already removed). Mouse mode stands in for all of them.
const Input = {
  phone: false, raw: { b: 0, g: 0, a: 0, mag: 0, lin: true }, f: { b: 0, g: 0, a: 0 }, neutral: { b: 0, g: 0, a: 0 }, lastAt: 0,
  mouse: { p: 0, r: 0, acc: 0 }, mf: { p: 0, r: 0 }, mode: "mouse",
};
function wrap180(d) { return ((d + 540) % 360) - 180; }
function angles() {
  if (Input.mode === "phone") {
    const acc = Input.raw.lin ? Input.raw.mag : Math.abs(Input.raw.mag - 9.81);
    return { pitch: Input.f.b - Input.neutral.b, roll: wrap180(Input.f.g - Input.neutral.g), yaw: wrap180(Input.f.a - Input.neutral.a), acc, demo: false };
  }
  // Mouse mode: horizontal position doubles as yaw; holding the button or Space is a push/lift spike.
  return { pitch: Input.mf.p, roll: Input.mf.r, yaw: Input.mf.r, acc: Input.mouse.acc, demo: true };
}
function smoothInput(dt) {
  const k = 1 - Math.exp(-dt * 14);
  Input.f.b += (Input.raw.b - Input.f.b) * k;
  Input.f.g += wrap180(Input.raw.g - Input.f.g) * k;
  Input.f.a += wrap180(Input.raw.a - Input.f.a) * k;
  Input.mf.p += (Input.mouse.p - Input.mf.p) * k;
  Input.mf.r += (Input.mouse.r - Input.mf.r) * k;
}

const stageWrap = $("stageWrap");
const playing = () => Game.state === "play" && Game.inst;
// Pointer on the stage: in mouse mode its position stands in for tilt; every exercise that takes
// taps or drags also gets the raw pointer events in stage pixels.
function routePointer(type, e) {
  const r = stageWrap.getBoundingClientRect();
  if (type === "move") {
    Input.mouse.r = clamp(((e.clientX - r.left) / r.width - 0.5) * 2 * 60, -60, 60);
    Input.mouse.p = clamp(-((e.clientY - r.top) / r.height - 0.5) * 2 * 60, -60, 60);
  }
  if (type === "down") Input.mouse.acc = 6;
  if (type === "up") Input.mouse.acc = 0;
  if (playing() && Game.inst.pointer && e.target.closest("#stage")) {
    Game.inst.pointer({ type, x: e.clientX - r.left, y: e.clientY - r.top });
    if (type === "down") Game.padAck = true;
  }
}
stageWrap.addEventListener("pointermove", (e) => routePointer("move", e));
stageWrap.addEventListener("pointerdown", (e) => routePointer("down", e));
window.addEventListener("pointerup", (e) => routePointer("up", e));

window.addEventListener("keydown", (e) => {
  if ($("vPlay").hidden) return;
  if (playing() && Game.inst.key && !e.repeat && (e.key === " " || e.key === "Enter" || /^[0-9]$/.test(e.key))) {
    Game.inst.key(e.key); e.preventDefault(); return;
  }
  if (Input.mode !== "mouse") return;
  const step = e.shiftKey ? 10 : 4;
  if (e.key === "ArrowUp") Input.mouse.p = clamp(Input.mouse.p + step, -60, 60);
  else if (e.key === "ArrowDown") Input.mouse.p = clamp(Input.mouse.p - step, -60, 60);
  else if (e.key === "ArrowLeft") Input.mouse.r = clamp(Input.mouse.r - step, -60, 60);
  else if (e.key === "ArrowRight") Input.mouse.r = clamp(Input.mouse.r + step, -60, 60);
  else if (e.key === " ") Input.mouse.acc = 6;
  else return;
  e.preventDefault();
});
window.addEventListener("keyup", (e) => { if (e.key === " ") Input.mouse.acc = 0; });
Object.assign(RC, { Input, angles, smoothInput, wrap180 });
})();
