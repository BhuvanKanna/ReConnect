(() => {
"use strict";
const RC = window.RC;
const { $, clamp, lerp, TAU, reduceMotion, store, settings, saveSettings, T, alpha, txt, rr, chime, esc, fmtTime, Game, readTheme } = RC;
function base(S, goal) {
  return { S, events: [], done: false, _reps: 0, reps() { return this._reps; }, goal() { return goal; } };
}

function drawGonio(g, cx, cy, R, deg, target, label) {
  g.save();
  g.fillStyle = alpha(T.surface, 0.85); g.beginPath(); g.arc(cx, cy, R + 14, Math.PI, TAU); g.fill();
  // 0° at left horizontal, 90° straight up, 180° at right: use 0..90 across the left half to top
  const ang = (d) => Math.PI + clamp(d, -10, 120) / 180 * Math.PI;
  g.lineWidth = 1.5; g.strokeStyle = T.muted;
  for (let d = 0; d <= 120; d += 15) {
    const A = ang(d); g.beginPath(); g.moveTo(cx + Math.cos(A) * (R - (d % 45 ? 6 : 12)), cy + Math.sin(A) * (R - (d % 45 ? 6 : 12))); g.lineTo(cx + Math.cos(A) * R, cy + Math.sin(A) * R); g.stroke();
    if (d % 45 === 0) txt(g, `${d}`, cx + Math.cos(A) * (R - 24), cy + Math.sin(A) * (R - 24), 11, T.muted, { font: T.mono, weight: 500 });
  }
  if (target != null) { const A = ang(target); g.strokeStyle = T.accent; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + Math.cos(A) * (R - 16), cy + Math.sin(A) * (R - 16)); g.lineTo(cx + Math.cos(A) * (R + 6), cy + Math.sin(A) * (R + 6)); g.stroke(); }
  const A = ang(deg); g.strokeStyle = T.ink; g.lineWidth = 3; g.lineCap = "round";
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(A) * (R - 10), cy + Math.sin(A) * (R - 10)); g.stroke();
  g.beginPath(); g.arc(cx, cy, 5, 0, TAU); g.fillStyle = T.ink; g.fill();
  txt(g, `${Math.round(deg)}°`, cx + 34, cy - 14, 18, T.ink, { font: T.mono, weight: 600 });
  txt(g, label, cx + 34, cy - 34, 11, T.muted, { font: T.mono, weight: 500 });
  g.restore();
}
RC.kit = { base, drawGonio };
})();
