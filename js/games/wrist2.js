// Wrist & forearm, continued: more motion exercises, all measured by the phone.
(() => {
"use strict";
const RC = window.RC;
const { clamp, TAU, T, alpha, rr, txt } = RC;
const { Reach, defineArt } = RC.kit;
const M = RC.moves, { scene, icon, lvl } = M;
const cap = (v, m) => Math.min(v, m);

// Screwdriver: the screw sinks as the turns add up
const screwDraw = (g, W, H, o) => {
  const cx = W / 2, top = 190, depth = clamp(o.prog, 0, 1);
  g.fillStyle = alpha(T.ink, 0.12); rr(g, cx - 180, H - 110, 360, 60, 10); g.fill();
  const sy = top + depth * 110;
  g.fillStyle = alpha(T.ink, 0.5); g.fillRect(cx - 6, sy, 12, H - 110 - sy + 20);
  g.save(); g.translate(cx, sy - 10); g.rotate((o.val / Math.max(1, o.thr)) * 0.8); g.fillStyle = alpha(T.ink, 0.7); rr(g, -26, -8, 52, 16, 5); g.fill(); g.restore();
  icon(g, "🪛", cx + 120, top, 56);
  txt(g, o.want > 0 ? "Turn one way" : "Turn back", cx - 160, top, 20, T.ink, { font: T.body });
};

const WRIST = [
  { id: "key", name: "Turn the Key", movement: "Forearm supination · turning", pose: "handleTable", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Rest your forearm on the table.",
    desc: "Turn your hand as if turning a key in a lock, hold, then turn back.", source: "Wolf Motor Function Test (turning a key in a lock); mRehab unlock with key.",
    how: ["Rest your forearm on the table, thumb up.", "Turn your palm up as far as is comfortable.", "Hold, then turn it back."],
    make: (S) => Reach(S, { signal: (a) => Math.abs(a.roll), target: (S) => cap(S.amp * 1.6, 80), rest: (S) => S.amp * 0.4, hold: 0.8, label: "Turn", title: "Turn the key", draw: scene.slide("🔑", "Turn it all the way") }) },
  { id: "drawbridge", name: "Raise the Drawbridge", movement: "Wrist extension · sustained hold", pose: "edgeDown", mount: "Rest your forearm on the table with your wrist just past the edge. Palm down, grip the phone flat against your palm: screen facing the floor, top edge toward your fingertips.",
    desc: "Lift your hand up at the wrist and hold it there while the count runs.", source: "Wrist-extension holds (Fugl-Meyer wrist stability; RAPAEL wrist extension).",
    params: { reps: [3, 5, 8], level: [1, 2, 3], durationS: null }, defaults: { reps: 3, level: 1, durationS: null },
    how: ["Rest your forearm on the table, wrist over the edge.", "Lift your hand up at the wrist into the green band.", "Hold until the bar fills, then relax."],
    make: (S) => M.Hold(S, { signal: (a) => a.pitch, band: (S) => [S.amp * 0.7, 90], holdS: (S) => lvl(S, { 1: 5, 2: 8, 3: 12 }), restBelow: (S) => S.amp * 0.3, emoji: "🏰", cues: { below: "Lift your hand at the wrist", above: "", in: "Hold the bridge up", rest: "Lower and relax" } }) },
  Object.assign({ id: "wheel", name: "Steering Wheel", movement: "Two-handed forearm rotation", pose: "wheel", mount: "Hold the phone upright (tall) in both hands, one on each side, screen facing you.",
    desc: "Turn the wheel to steer the car through each gap.", source: "Bilateral steering tasks (driving simulation in stroke rehab).",
    how: ["Hold the phone with both hands like a wheel.", "Turn it left or right to steer.", "Line up with each gap before you reach it."],
    make: (S) => M.Steer(S, { signal: (a) => a.roll, emoji: "🚗", cue: "Steer through the gaps" }) }, { params: { reps: [10, 15, 20], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } }),
  Object.assign({ id: "wristcircle", name: "Wrist Circles", movement: "Wrist circumduction", pose: "edgeDown", mount: "Rest your forearm on the table with your wrist just past the edge. Palm down, grip the phone flat against your palm: screen facing the floor, top edge toward your fingertips.",
    desc: "Make slow circles with your hand at the wrist, one way and then the other.", source: "Fugl-Meyer upper-extremity item (wrist circumduction).",
    how: ["Rest your forearm on the table, wrist over the edge.", "Tilt your hand out to the ring and circle round.", "Halfway through, circle the other way."],
    make: (S) => M.Circles(S, { emoji: "✋", cue: "Circle your hand at the wrist" }) }, { params: { reps: [4, 6, 10], level: [1, 2, 3], durationS: null }, defaults: { reps: 4, level: 1, durationS: null } }),
  { id: "water", name: "Water the Plants", movement: "Aim, then pour", pose: "handleTable", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Rest your forearm on the table.",
    desc: "Turn toward each plant, then tip the can to water it.", source: "Daily-activity task practice (pouring); mRehab slow pour.",
    how: ["Turn your hand toward the plant shown.", "Tip the front of the phone down and hold it while the water pours.", "Bring it back to the middle for the next plant."],
    make: (S) => M.Seq(S, { steps: (S, k) => { const s = k % 2 ? -1 : 1; return [{ axis: "yaw", target: s * S.amp, hold: 0.5, cue: `Turn toward the ${s > 0 ? "right" : "left"} plant`, short: "Aim", emoji: "🪴" }, { axis: "pitch", target: -S.amp * 0.8, hold: 1.5, cue: "Tip the spout down to pour", short: "Pour", emoji: "💧" }]; }, restCue: "Back to the middle" }) },
];
WRIST.forEach((d) => RC.register(Object.assign({ section: "wrist", control: "tilt" }, d)));

defineArt("key", '<circle cx="44" cy="32" r="10" fill="none" stroke="var(--a-hi)" stroke-width="4"/><path d="M54 32 H88 M80 32 v8 M72 32 v6" stroke="var(--a-hi)" stroke-width="4" stroke-linecap="round"/><path d="M40 12 a20 20 0 0 1 22 4" stroke="var(--a-ink)" stroke-width="2" fill="none"/>');
defineArt("drawbridge", '<rect x="16" y="22" width="22" height="34" fill="var(--a-mute)" opacity=".3"/><rect x="82" y="22" width="22" height="34" fill="var(--a-mute)" opacity=".3"/><path d="M38 50 L70 22" stroke="var(--a-hi)" stroke-width="6" stroke-linecap="round"/><path d="M38 56 H82" stroke="var(--a-go)" stroke-width="2" stroke-dasharray="3 3"/>');
defineArt("wheel", '<circle cx="60" cy="32" r="22" fill="none" stroke="var(--a-hi)" stroke-width="5"/><circle cx="60" cy="32" r="5" fill="var(--a-ink)"/><path d="M38 32 H82 M60 32 V54" stroke="var(--a-ink)" stroke-width="3"/>');
defineArt("wristcircle", '<rect x="14" y="30" width="46" height="12" rx="6" fill="var(--a-mute)" opacity=".3"/><circle cx="80" cy="36" r="16" fill="none" stroke="var(--a-hi)" stroke-width="3" stroke-dasharray="5 4"/><circle cx="92" cy="28" r="5" fill="var(--a-hi)"/>');
defineArt("water", '<path d="M30 30 h28 l8 -8 M40 30 v-8" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M72 30 v10 M78 32 v8" stroke="var(--a-go)" stroke-width="2" stroke-dasharray="2 3"/><path d="M66 46 h22 l-3 10 h-16z" fill="var(--a-mute)" opacity=".4"/><path d="M77 46 q-4 -8 0 -10 q4 2 0 10" fill="var(--a-go)"/>');
})();
