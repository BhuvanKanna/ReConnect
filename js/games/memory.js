(() => {
"use strict";
const RC = window.RC;
const { $, clamp, lerp, TAU, reduceMotion, store, settings, saveSettings, T, alpha, txt, rr, chime, esc, fmtTime, Game, readTheme } = RC;
const { base, drawGonio } = RC.kit;
// ---- 6. Memory Moves: sequence memory with four tilt directions ---------------
function MemoryMoves(S) {
  const amp = S.amp, G = base(S, S.reps);
  const DIRS = ["up", "right", "down", "left"];
  let len = { 1: 2, 2: 3, 3: 3 }[S.level], seq = [], step = 0, phase = "watch", pt = 0, lit = -1, needCenter = false, longest = 0, rounds = 0, wins = 0, mistakes = 0, flashDir = -1, flashOk = true, flashT = 0;
  function newRound() { seq = Array.from({ length: len }, () => Math.floor(Math.random() * 4)); step = 0; phase = "watch"; pt = -0.6; rounds++; }
  newRound();
  G.update = function (dt, a) {
    pt += dt; flashT = Math.max(0, flashT - dt);
    if (phase === "watch") {
      const k = Math.floor(pt / 1.0); lit = pt >= 0 && k < seq.length && (pt % 1.0) < 0.72 ? seq[k] : -1;
      if (pt >= 0 && k >= seq.length) { phase = "repeat"; pt = 0; needCenter = true; lit = -1; }
      return;
    }
    if (phase === "result") { if (pt > 1.4) { if (this._reps >= S.reps) this.done = true; else newRound(); } return; }
    const mag = Math.max(Math.abs(a.pitch), Math.abs(a.roll));
    if (needCenter) { if (mag < amp * 0.3) needCenter = false; return; }
    if (mag > amp * 0.65) {
      const d = Math.abs(a.pitch) > Math.abs(a.roll) ? (a.pitch > 0 ? 0 : 2) : (a.roll > 0 ? 1 : 3);
      needCenter = true; flashDir = d; flashT = 0.5;
      if (d === seq[step]) {
        step++; this._reps++; flashOk = true; this.events.push("success");
        if (step === seq.length) { wins++; longest = Math.max(longest, len); len = Math.min(len + 1, 8); phase = "result"; pt = 0; this.events.push("big"); }
        else if (this._reps >= S.reps) { phase = "result"; pt = 0; }
      } else {
        mistakes++; flashOk = false; this.events.push("error"); len = Math.max(2, len - 1); phase = "result"; pt = 0;
      }
    }
  };
  G.status = function () {
    if (phase === "watch") return { title: "Watch the pattern", text: `${seq.length} moves` };
    if (phase === "result") return flashOk ? { title: "Pattern complete", text: "Next one is a step longer.", tone: "good" } : { title: "Different move", text: "Try a shorter pattern next.", tone: "warn" };
    if (needCenter) return { title: "Back to level", text: `Move ${step + 1} of ${seq.length} next` };
    return { title: `Move ${step + 1} of ${seq.length}`, text: "Tilt toward the next arrow." };
  };
  G.debug = () => ({ seq, step });
  G.stats = () => [["Longest pattern", String(longest || "–")], ["Patterns completed", `${wins} / ${rounds}`], ["Wrong moves", String(mistakes)]];
  G.draw = function (g, W, H, a, t) {
    g.fillStyle = T.stage; g.fillRect(0, 0, W, H);
    const s = Math.min(W * 0.16, (H - 170) / 3.9), off = s * 1.25, cx = W / 2, cy = 150 + off + s / 2 + (H - 150 - (off * 2 + s)) / 2 - 10;
    const pos = [[0, -off], [off, 0], [0, off], [-off, 0]];
    pos.forEach(([dx, dy], i) => {
      const x = cx + dx, y = cy + dy;
      const on = lit === i || (flashT > 0 && flashDir === i);
      const col = flashT > 0 && flashDir === i ? (flashOk ? T.go : T.warn) : T.accent;
      rr(g, x - s / 2, y - s / 2, s, s, 18); g.fillStyle = on ? col : T.surface; g.fill(); g.strokeStyle = on ? col : T.line; g.lineWidth = 3; g.stroke();
      g.save(); g.translate(x, y); g.rotate(i * Math.PI / 2);
      g.fillStyle = on ? T.surface : T.ink; g.beginPath(); g.moveTo(0, -s * 0.26); g.lineTo(s * 0.22, s * 0.06); g.lineTo(s * 0.08, s * 0.06); g.lineTo(s * 0.08, s * 0.24); g.lineTo(-s * 0.08, s * 0.24); g.lineTo(-s * 0.08, s * 0.06); g.lineTo(-s * 0.22, s * 0.06); g.closePath(); g.fill();
      g.restore();
    });
    // center: live tilt cursor
    g.beginPath(); g.arc(cx, cy, s * 0.42, 0, TAU); g.fillStyle = T.surface; g.fill(); g.strokeStyle = T.line; g.lineWidth = 2; g.stroke();
    const dx = clamp(a.roll / amp, -1.4, 1.4) * s * 0.32, dy = -clamp(a.pitch / amp, -1.4, 1.4) * s * 0.32;
    g.beginPath(); g.arc(cx + dx, cy + dy, s * 0.11, 0, TAU); g.fillStyle = T.ink; g.fill();
    // progress dots
    const n = seq.length, gap = 26, x0 = cx - (n - 1) * gap / 2;
    for (let k = 0; k < n; k++) { g.beginPath(); g.arc(x0 + k * gap, 124, 8, 0, TAU); g.fillStyle = phase === "watch" ? (lit >= 0 && k === Math.floor(pt / 1.0) ? T.accent : T.line) : k < step ? T.go : T.line; g.fill(); }
  };
  return G;
}

RC.register(Object.assign({ section: "memory" }, {
    id: "simon", name: "Memory Moves", movement: "Multi-direction tilt · sequence memory", axes: "Pitch + Roll",
    brain: true, mount: "Hold the phone flat in your affected hand, screen up.",
    desc: "Watch the arrows light up, then repeat the pattern by tilting your hand in each direction.",
    source: "Simon-style serious games for stroke rehab; Constant Therapy sequence and memory tasks.",
    how: ["Watch the whole pattern first.", "Tilt your hand toward each arrow in order.", "Return to level between moves."],
    make: (S) => MemoryMoves(S),
  }));
})();
