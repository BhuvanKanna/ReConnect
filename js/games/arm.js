(() => {
"use strict";
const RC = window.RC;
const { $, clamp, lerp, TAU, reduceMotion, store, settings, saveSettings, T, alpha, txt, rr, chime, esc, fmtTime, Game, readTheme } = RC;
const { base, drawGonio } = RC.kit;
// ---- 1. Lantern Lift: shoulder flexion with hold --------------------------------
function LanternLift(S) {
  const amp = S.amp, G = base(S, S.reps);
  let state = "rest", restT = 0, hold = 0, target = amp, peak = -99, peaks = [], holdTimes = [], sparkle = [];
  const HOLD = 1.2;
  G.update = function (dt, a) {
    const p = a.pitch;
    if (state === "rest") {
      if (p < amp * 0.35) { restT += dt; if (restT > 0.4) { state = "raise"; restT = 0; peak = -99; hold = 0; target = amp * (0.9 + Math.random() * 0.2); } } else restT = 0;
    } else if (state === "raise") {
      peak = Math.max(peak, p);
      if (p >= target * 0.9) { hold += dt; if (hold >= HOLD) { this._reps++; peaks.push(peak); state = "lower"; this.events.push("success"); burst(); } }
      else hold = Math.max(0, hold - dt * 1.5);
    } else if (state === "lower") {
      peak = Math.max(peak, p);
      if (p < amp * 0.35) { if (peaks.length) peaks[peaks.length - 1] = peak; state = "rest"; restT = 0; if (this._reps >= S.reps) this.done = true; }
    }
    sparkle = sparkle.filter((s) => (s.life -= dt) > 0); sparkle.forEach((s) => { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 40 * dt; });
  };
  function burst() { if (reduceMotion) return; for (let i = 0; i < 18; i++) { const ang = Math.random() * TAU, sp = 40 + Math.random() * 90; sparkle.push({ x: 0, y: 0, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.8 }); } }
  G.status = function () {
    if (state === "rest") return { title: "Rest your arm", text: "Lower your arm to start the next lift." };
    if (state === "raise") return hold > 0.05 ? { title: "Hold it there", text: `${Math.max(0, HOLD - hold).toFixed(1)} s`, tone: "good" } : { title: "Raise your arm to the line", text: `Target ${Math.round(target)}°` };
    return { title: "Good. Lower slowly.", text: `${this._reps} of ${S.reps} done`, tone: "good" };
  };
  G.stats = () => [["Best lift", peaks.length ? `${Math.round(Math.max(...peaks))}°` : "–"], ["Average lift", peaks.length ? `${Math.round(peaks.reduce((s, x) => s + x, 0) / peaks.length)}°` : "–"]];
  G.draw = function (g, W, H, a, t) {
    const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, T["sky-top"]); grd.addColorStop(1, T["sky-bot"]);
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // hills
    g.fillStyle = T.hill; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) g.lineTo(x, H - 60 - Math.sin(x / 140) * 18 - Math.sin(x / 57) * 6);
    g.lineTo(W, H); g.fill();
    const top = 170, bottom = H - 80;
    const yOf = (deg) => lerp(bottom, top, clamp((deg + 5) / (amp * 1.35 + 5), 0, 1));
    // target line
    const ty = yOf(target);
    g.setLineDash([10, 8]); g.strokeStyle = T.accent; g.lineWidth = 3; g.beginPath(); g.moveTo(40, ty); g.lineTo(W - 90, ty); g.stroke(); g.setLineDash([]);
    txt(g, `${Math.round(target)}°`, W - 80, ty, 16, T["accent-ink"], { align: "left", font: T.mono, weight: 600 });
    // lantern
    const lx = W * 0.42, ly = yOf(a.pitch);
    g.strokeStyle = alpha(T.ink, 0.35); g.lineWidth = 2; g.beginPath(); g.moveTo(lx, ly + 34); g.lineTo(lx, H); g.stroke();
    const glow = g.createRadialGradient(lx, ly, 4, lx, ly, 70); glow.addColorStop(0, alpha(T.accent, 0.55)); glow.addColorStop(1, alpha(T.accent, 0));
    g.fillStyle = glow; g.beginPath(); g.arc(lx, ly, 70, 0, TAU); g.fill();
    rr(g, lx - 22, ly - 30, 44, 60, 14); g.fillStyle = T.accent; g.fill();
    g.fillStyle = alpha(T.surface, 0.6); rr(g, lx - 12, ly - 18, 24, 36, 8); g.fill();
    if (state === "raise" && hold > 0) { g.strokeStyle = T.go; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.arc(lx, ly, 46, -Math.PI / 2, -Math.PI / 2 + TAU * (hold / HOLD)); g.stroke(); g.lineCap = "butt"; }
    g.fillStyle = T.accent; sparkle.forEach((s) => { g.globalAlpha = clamp(s.life / 0.8, 0, 1); g.beginPath(); g.arc(lx + s.x, ty + s.y, 3, 0, TAU); g.fill(); }); g.globalAlpha = 1;
    // goniometer
    drawGonio(g, W - 230, H - 24, Math.min(110, W * 0.12), a.pitch, target, "Arm raise");
  };
  return G;
}

RC.register(Object.assign({ section: "arm" }, {
    id: "lift", name: "Lantern Lift", movement: "Shoulder flexion · arm raise", axes: "Pitch",
    brain: false, mount: "Strap the phone to the forearm of your affected arm, screen up, top edge toward your hand. Or hold it flat in your palm.",
    desc: "Raise your arm to lift the lantern to the line, hold it there, then lower slowly.",
    source: "FitMi and Flint arm raises; Penumbra REAL shoulder range-of-motion activities.",
    how: ["Sit tall with your arm resting on the table.", "Raise your arm forward until the lantern touches the line.", "Hold while the ring fills, then lower slowly to rest."],
    make: (S) => LanternLift(S),
  }));
})();
