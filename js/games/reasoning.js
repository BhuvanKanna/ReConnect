(() => {
"use strict";
const RC = window.RC;
const { $, clamp, lerp, TAU, reduceMotion, store, settings, saveSettings, T, alpha, txt, rr, chime, esc, fmtTime, Game, readTheme } = RC;
const { base, drawGonio } = RC.kit;
// ---- 5. Sort It: rotation + semantic categories ------------------------------
const WORDS = {
  1: [["Food", ["apple", "bread", "carrot", "cheese", "banana", "soup", "rice", "egg", "grapes", "pasta"]], ["Clothing", ["shirt", "sock", "hat", "coat", "shoe", "scarf", "glove", "belt", "jacket", "skirt"]]],
  2: [["Kitchen", ["spoon", "kettle", "plate", "whisk", "ladle", "toaster", "bowl", "frying pan", "cutting board", "oven mitt"]], ["Garden", ["rake", "hose", "shovel", "seeds", "trowel", "wheelbarrow", "sprinkler", "flower pot", "watering can", "compost"]]],
  3: [["Swims", ["salmon", "dolphin", "shark", "otter", "seal", "trout", "whale", "eel", "octopus", "penguin"]], ["Flies", ["eagle", "sparrow", "bat", "owl", "moth", "pelican", "hawk", "bee", "dragonfly", "crow"]]],
};
function SortIt(S) {
  const amp = S.amp, G = base(S, S.reps);
  const cats = WORDS[S.level].slice(); if (Math.random() < 0.5) cats.reverse();
  const [L, Rt] = cats;
  const deck = []; for (const w of L[1]) deck.push({ w, side: -1 }); for (const w of Rt[1]) deck.push({ w, side: 1 });
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  let i = 0, phase = "center", ct = 0, dwell = 0, dwellSide = 0, rt = [], ok = 0, bad = 0, fb = null, fbT = 0, cardT = 0, flyX = 0;
  G.update = function (dt, a) {
    const r = a.roll;
    if (phase === "center") { if (Math.abs(r) < amp * 0.3) { ct += dt; if (ct > 0.35) { phase = "card"; cardT = 0; dwell = 0; } } else ct = 0; return; }
    if (phase === "feedback") { fbT -= dt; flyX += fb.side * dt * 900; if (fbT <= 0) { if (this._reps >= S.reps) this.done = true; else { i = (i + 1) % deck.length; phase = "center"; ct = 0; } } return; }
    cardT += dt;
    const side = r > amp * 0.7 ? 1 : r < -amp * 0.7 ? -1 : 0;
    if (side && side === dwellSide) { dwell += dt; if (dwell > 0.5) {
      const right = side === deck[i].side; this._reps++; rt.push(cardT);
      if (right) { ok++; this.events.push("success"); } else { bad++; this.events.push("error"); }
      fb = { side, right }; fbT = 0.9; flyX = 0; phase = "feedback";
    } } else { dwellSide = side; dwell = 0; }
  };
  G.status = function () {
    if (phase === "center") return { title: "Bring your hand level", text: "The next word appears when you are centered." };
    if (phase === "feedback") return fb.right ? { title: "Correct", text: `${deck[i].w} goes with ${(deck[i].side < 0 ? L : Rt)[0].toLowerCase()}`, tone: "good" } : { title: "Not quite", text: `${deck[i].w} goes with ${(deck[i].side < 0 ? L : Rt)[0].toLowerCase()}`, tone: "warn" };
    return { title: `Where does "${deck[i].w}" go?`, text: `Turn left for ${L[0].toLowerCase()}, right for ${Rt[0].toLowerCase()}` };
  };
  G.stats = () => [["Sorted correctly", `${ok} / ${ok + bad}`], ["Average decision time", rt.length ? `${(rt.reduce((s, x) => s + x, 0) / rt.length).toFixed(1)} s` : "–"]];
  G.draw = function (g, W, H, a, t) {
    g.fillStyle = T.stage; g.fillRect(0, 0, W, H);
    const bw = Math.min(W * 0.26, 260), bh = H * 0.5, by = H * 0.32;
    for (const [s, cat] of [[-1, L], [1, Rt]]) {
      const x = s < 0 ? 24 : W - 24 - bw;
      const lit = phase === "card" && dwellSide === s;
      rr(g, x, by, bw, bh, 18); g.fillStyle = lit ? alpha(T.accent, 0.22) : T.surface; g.fill(); g.strokeStyle = lit ? T.accent : T.line; g.lineWidth = 3; g.stroke();
      txt(g, cat[0], x + bw / 2, by + 44, Math.min(34, bw / 6), T.ink);
      txt(g, s < 0 ? "Turn left" : "Turn right", x + bw / 2, by + bh - 28, 13, T.muted, { font: T.mono, weight: 500 });
      if (lit) { g.strokeStyle = T.go; g.lineWidth = 6; g.beginPath(); g.moveTo(x + 20, by + bh - 52); g.lineTo(x + 20 + (bw - 40) * clamp(dwell / 0.5, 0, 1), by + bh - 52); g.stroke(); }
    }
    if (phase !== "center") {
      const off = phase === "card" ? clamp(a.roll / amp, -1, 1) * W * 0.08 : flyX;
      const cw = Math.min(W * 0.34, 340), ch = 130, cx = W / 2 - cw / 2 + off, cy = H * 0.42;
      g.save(); g.translate(cx + cw / 2, cy + ch / 2); g.rotate(clamp(a.roll, -30, 30) * 0.004);
      rr(g, -cw / 2, -ch / 2, cw, ch, 16); g.fillStyle = T.surface; g.fill();
      g.strokeStyle = phase === "feedback" ? (fb.right ? T.go : T.warn) : T.ink; g.lineWidth = 3; g.stroke();
      const w = deck[i].w; txt(g, w, 0, 2, Math.min(48, (cw - 30) / Math.max(4, w.length) * 1.8), T.ink);
      g.restore();
    } else {
      txt(g, "Hand level to continue", W / 2, H * 0.5, 20, T.muted, { font: T.body, weight: 400 });
    }
  };
  return G;
}

RC.register(Object.assign({ section: "reasoning" }, {
    id: "sort", name: "Sort It", movement: "Forearm rotation · word categories", axes: "Roll",
    brain: true, mount: "Hold the phone in your affected hand, screen up, forearm resting on the table.",
    desc: "Read the word and turn your hand toward the group it belongs to.",
    source: "Constant Therapy categorization and reading tasks; FitMi object rotation.",
    how: ["Start with your hand level.", "Read the word in the middle.", "Turn left or right toward its group and hold for a moment."],
    make: (S) => SortIt(S),
  }));
})();
