// Phone orientation math, shared by the computer (index.html) and the phone page (phone.html).
//
// The phone sends W3C deviceorientation angles (alpha, beta, gamma: Z-X'-Y'' Euler angles).
// Reading beta and gamma directly breaks in two common holds: with the phone upright (chest,
// face, cup grip) gamma and alpha swap freely near beta = 90 (gimbal lock), and with the screen
// facing down beta flips between +180 and -180. So the angles are rebuilt from the full rotation,
// measured from the calibrated resting pose, which is never near a singularity.
//
// Results, all in degrees from the resting pose:
//   pitch  top edge up (phone flat, screen up or down), or top edge toward the screen side
//          (phone upright), or top edge up (phone on its long edge)
//   roll   right side down (the phone's right edge as you look at the screen)
//   yaw    turning to the right (clockwise seen from above)
(() => {
"use strict";
const D = 180 / Math.PI, R = Math.PI / 180;
const wrap180 = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

function qmul(a, b) {
  return [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
}
const qinv = (q) => [q[0], -q[1], -q[2], -q[3]];
function qnorm(q) { const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / n, q[1] / n, q[2] / n, q[3] / n]; }

// Device-to-earth rotation for deviceorientation angles: Rz(alpha) Rx(beta) Ry(gamma).
function quat(alpha, beta, gamma) {
  const h = (d) => (d || 0) * R / 2;
  const z = [Math.cos(h(alpha)), 0, 0, Math.sin(h(alpha))], x = [Math.cos(h(beta)), Math.sin(h(beta)), 0, 0], y = [Math.cos(h(gamma)), 0, Math.sin(h(gamma)), 0];
  return qnorm(qmul(qmul(z, x), y));
}
// Earth's up direction in the phone's own axes (x right, y toward the top edge, z out of the screen).
function up(q) {
  const [w, x, y, z] = q;
  return [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)];
}
// Blend toward b by t (0..1), taking the short way round.
function nlerp(a, b, t) {
  const s = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3] < 0 ? -1 : 1;
  return qnorm([a[0] + (s * b[0] - a[0]) * t, a[1] + (s * b[1] - a[1]) * t, a[2] + (s * b[2] - a[2]) * t, a[3] + (s * b[3] - a[3]) * t]);
}
function average(qs) {
  const acc = [0, 0, 0, 0];
  for (const q of qs) { const s = q[0] * qs[0][0] + q[1] * qs[0][1] + q[2] * qs[0][2] + q[3] * qs[0][3] < 0 ? -1 : 1; for (let i = 0; i < 4; i++) acc[i] += s * q[i]; }
  return qnorm(acc);
}

// The resting pose: which phone axis points most nearly up decides how pitch and roll are read.
// flip: { roll, pitch } mirrors them, for holds where the screen faces away from the person.
function frame(q0, flip) {
  const u0 = up(q0), m = u0.map(Math.abs);
  const k = m[2] >= m[0] && m[2] >= m[1] ? "z" : m[1] >= m[0] ? "y" : "x";
  const s = Math.sign(k === "z" ? u0[2] : k === "y" ? u0[1] : u0[0]) || 1;
  const f = { q0, u0, k, s, flipRoll: !!(flip && flip.roll), flipPitch: !!(flip && flip.pitch) };
  f.p0 = pitchOf(u0, f); f.r0 = rollOf(u0, f);
  return f;
}
function pitchOf(u, f) {
  if (f.k === "x") return Math.asin(Math.max(-1, Math.min(1, u[1]))) * D;
  return Math.atan2(u[1], (f.k === "z" ? f.s : 1) * u[2]) * D;
}
function rollOf(u, f) {
  if (f.k === "x") return Math.atan2(u[2], f.s * u[0]) * D;
  return f.s * Math.asin(Math.max(-1, Math.min(1, -u[0]))) * D;
}
function angles(q, f) {
  const u = up(q);
  let pitch = wrap180(pitchOf(u, f) - f.p0), roll = wrap180(rollOf(u, f) - f.r0);
  if (f.flipPitch) pitch = -pitch;
  if (f.flipRoll) roll = -roll;
  const r = qmul(q, qinv(f.q0)); // the turn since rest, in earth axes
  const yaw = wrap180(-2 * Math.atan2(r[3], r[0]) * D);
  return { pitch, roll, yaw };
}

const Orient = { quat, up, nlerp, average, frame, angles, wrap180, qmul, qinv };
if (typeof window !== "undefined") (window.RC = window.RC || {}).Orient = Orient;
if (typeof module !== "undefined") module.exports = Orient;
})();
