// Wrist & forearm, continued: more motion exercises, all measured by the phone.
(() => {
"use strict";
const RC = window.RC;
const { clamp, TAU, T, alpha, rr, txt } = RC;
const { Reach, defineArt } = RC.kit;
const M = RC.moves, { scene, icon, lvl } = M;
const table = "Hold the phone flat in your affected hand, forearm resting on the table, wrist over the edge.";
const turnHold = "Hold the phone flat in your affected hand, palm down, elbow bent and resting on the table.";
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
  { id: "key", name: "Turn the Key", movement: "Forearm supination · turning", mount: turnHold,
    desc: "Turn your hand as if turning a key in a lock, hold, then turn back.", source: "Wolf Motor Function Test (turning a key in a lock); mRehab unlock with key.",
    how: ["Rest your elbow on the table, palm down.", "Turn your palm up as far as is comfortable.", "Hold, then turn it back down."],
    make: (S) => Reach(S, { signal: (a) => Math.abs(a.roll), target: (S) => cap(S.amp * 1.6, 80), rest: (S) => S.amp * 0.4, hold: 0.8, label: "Turn", title: "Turn the key", draw: scene.slide("🔑", "Turn it all the way") }) },
  { id: "pages", name: "Turn the Pages", movement: "Pronation and supination", mount: turnHold,
    desc: "Turn your palm up to lift the page, then down to lay it flat, back and forth.", source: "Constraint-induced therapy shaping tasks (turning pages); Wolf Motor Function Test flipping cards.",
    how: ["Rest your elbow on the table.", "Turn your palm up to the first target.", "Then turn it down to the other one."],
    make: (S) => M.Swing(S, { signal: (a) => a.roll, targets: (S) => [cap(S.amp * 1.4, 75), -cap(S.amp * 1.4, 75)], hold: 0.3, cues: ["Turn your palm up", "Now turn it down"], labels: ["Palm up", "Palm down"], emoji: "📖" }) },
  Object.assign({ id: "pancake", name: "Flip the Pancake", movement: "Quick forearm rotation · timing", mount: turnHold.replace("palm down", "like holding a frying pan"),
    desc: "Wait while the pancake cooks. When it says now, flip it with a quick turn of your forearm.", source: "Quick forearm rotation (mRehab quick twist); cooking tasks from RAPAEL daily-activity games.",
    how: ["Hold the pan level and wait.", "When it says NOW, turn your forearm quickly to flip.", "Bring the pan back level for the next one."],
    make: (S) => M.Timed(S, { signal: (a) => a.roll, target: (S) => cap(S.amp * 1.5, 80), emoji: "🥞", wait: "Wait for it to cook", now: "Flip it now!", good: "Perfect flip", late: "It burnt" }) }, { params: { reps: [6, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 6, level: 1, durationS: null } }),
  { id: "screw", name: "Screwdriver", movement: "Repeated forearm rotation", mount: "Hold the phone in your affected hand like a screwdriver handle, elbow on the table.",
    desc: "Twist back and forth to drive the screw all the way in.", source: "Repetitive forearm rotation with a tool (task-specific practice).",
    params: { reps: [10, 20, 30], level: [1, 2, 3], durationS: null }, defaults: { reps: 20, level: 1, durationS: null },
    how: ["Rest your elbow on the table.", "Twist your hand one way, then the other.", "Keep going until the screw is in."],
    make: (S) => M.Wave(S, { signal: (a) => a.roll, thr: (S) => Math.max(8, S.amp * 0.4), cues: ["Twist one way", "Twist back"], draw: screwDraw }) },
  { id: "wave", name: "Wave Hello", movement: "Wrist flexion and extension · speed", mount: table,
    desc: "Wave your hand up and down at the wrist, as many times as the count.", source: "Repetitive wrist flexion and extension (FitMi wrist exercises).",
    params: { reps: [10, 20, 30], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null },
    how: ["Rest your forearm on the table, wrist over the edge.", "Bend the wrist up, then down.", "Keep the forearm still: only the wrist moves."],
    make: (S) => M.Wave(S, { signal: (a) => a.pitch, thr: (S) => S.amp * 0.5, emoji: "👋", cues: ["Wrist up", "Wrist down"] }) },
  { id: "drawbridge", name: "Raise the Drawbridge", movement: "Wrist extension · sustained hold", mount: table,
    desc: "Lift your hand up at the wrist and hold it there while the count runs.", source: "Wrist-extension holds (Fugl-Meyer wrist stability; RAPAEL wrist extension).",
    params: { reps: [3, 5, 8], level: [1, 2, 3], durationS: null }, defaults: { reps: 3, level: 1, durationS: null },
    how: ["Rest your forearm on the table, wrist over the edge.", "Lift your hand up at the wrist into the green band.", "Hold until the bar fills, then relax."],
    make: (S) => M.Hold(S, { signal: (a) => a.pitch, band: (S) => [S.amp * 0.7, 90], holdS: (S) => lvl(S, { 1: 5, 2: 8, 3: 12 }), restBelow: (S) => S.amp * 0.3, emoji: "🏰", cues: { below: "Lift your hand at the wrist", above: "", in: "Hold the bridge up", rest: "Lower and relax" } }) },
  Object.assign({ id: "wheel", name: "Steering Wheel", movement: "Two-handed forearm rotation", mount: "Hold the phone upright in both hands like a steering wheel.",
    desc: "Turn the wheel to steer the car through each gap.", source: "Bilateral steering tasks (driving simulation in stroke rehab).",
    how: ["Hold the phone with both hands like a wheel.", "Turn it left or right to steer.", "Line up with each gap before you reach it."],
    make: (S) => M.Steer(S, { signal: (a) => a.roll, emoji: "🚗", cue: "Steer through the gaps" }) }, { params: { reps: [10, 15, 20], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } }),
  { id: "radio", name: "Tune the Radio", movement: "Fine forearm control · precision", mount: turnHold,
    desc: "Turn your hand slowly to tune the needle onto the station, and hold it there.", source: "Precision forearm-rotation games (RAPAEL fine-control tasks).",
    how: ["Rest your elbow on the table.", "Turn your hand slowly to move the needle onto the green station.", "Hold very still to lock it in."],
    make: (S) => M.Dial(S, { signal: (a) => a.roll, emoji: "📻", cue: "Tune into the station", more: "Turn a little to the right", less: "Turn a little to the left" }) },
  { id: "flashlight", name: "Flashlight Search", movement: "Wrist control · visual search", mount: table,
    desc: "Move the torch beam with your wrist to find the hidden things in the dark.", source: "Wrist range-of-motion practice combined with visual scanning.",
    params: { reps: [5, 8, 12], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null },
    how: ["Rest your forearm on the table.", "Tilt your wrist to move the beam around.", "Hold the beam on each thing you find."],
    make: (S) => M.Search(S, { items: ["🐱", "🔑", "⭐", "🍪", "🦉", "🎁", "🧦", "🐟"], cue: "Find the hidden things" }) },
  Object.assign({ id: "wristcircle", name: "Wrist Circles", movement: "Wrist circumduction", mount: table,
    desc: "Make slow circles with your hand at the wrist, one way and then the other.", source: "Fugl-Meyer upper-extremity item (wrist circumduction).",
    how: ["Rest your forearm on the table, wrist over the edge.", "Tilt your hand out to the ring and circle round.", "Halfway through, circle the other way."],
    make: (S) => M.Circles(S, { emoji: "✋", cue: "Circle your hand at the wrist" }) }, { params: { reps: [4, 6, 10], level: [1, 2, 3], durationS: null }, defaults: { reps: 4, level: 1, durationS: null } }),
  { id: "water", name: "Water the Plants", movement: "Aim, then pour", mount: "Hold the phone in your affected hand like a watering can, forearm on the table.",
    desc: "Turn toward each plant, then tip the can to water it.", source: "Daily-activity task practice (pouring); mRehab slow pour.",
    how: ["Turn your hand toward the plant shown.", "Tip the can and hold it while the water pours.", "Bring it back to the middle for the next plant."],
    make: (S) => M.Seq(S, { steps: (S, k) => { const s = k % 2 ? -1 : 1; return [{ axis: "yaw", target: s * S.amp, hold: 0.5, cue: `Turn toward the ${s > 0 ? "right" : "left"} plant`, short: "Aim", emoji: "🪴" }, { axis: "roll", target: S.amp, hold: 1.5, cue: "Tip the can to pour", short: "Pour", emoji: "💧" }]; }, restCue: "Back to the middle" }) },
];
WRIST.forEach((d) => RC.register(Object.assign({ section: "wrist", control: "tilt" }, d)));

defineArt("key", '<circle cx="44" cy="32" r="10" fill="none" stroke="var(--a-hi)" stroke-width="4"/><path d="M54 32 H88 M80 32 v8 M72 32 v6" stroke="var(--a-hi)" stroke-width="4" stroke-linecap="round"/><path d="M40 12 a20 20 0 0 1 22 4" stroke="var(--a-ink)" stroke-width="2" fill="none"/>');
defineArt("pages", '<path d="M60 14 L60 54 L26 50 L26 10z" fill="var(--a-mute)" opacity=".25"/><path d="M60 14 L60 54 L94 50 L94 10z" fill="var(--a-mute)" opacity=".25"/><path d="M60 14 Q74 4 88 16 L60 54z" fill="var(--a-hi)"/>');
defineArt("pancake", '<ellipse cx="60" cy="48" rx="30" ry="7" fill="var(--a-mute)" opacity=".35"/><ellipse cx="60" cy="22" rx="18" ry="6" fill="var(--a-hi)" transform="rotate(-20 60 22)"/><path d="M80 34 a14 14 0 0 0 -6 -18" stroke="var(--a-ink)" stroke-width="2" fill="none"/>');
defineArt("screw", '<rect x="24" y="44" width="72" height="12" rx="3" fill="var(--a-mute)" opacity=".3"/><path d="M60 44 V22 M52 18 H68" stroke="var(--a-ink)" stroke-width="4" stroke-linecap="round"/><path d="M40 20 a22 8 0 0 1 40 0" stroke="var(--a-hi)" stroke-width="2.5" fill="none"/>');
defineArt("wave", '<rect x="18" y="32" width="44" height="12" rx="6" fill="var(--a-mute)" opacity=".3"/><rect x="60" y="22" width="30" height="12" rx="6" fill="var(--a-hi)" transform="rotate(-25 62 38)"/><path d="M96 14 q6 8 0 16 M100 36 q6 8 0 16" stroke="var(--a-ink)" stroke-width="2" fill="none"/>');
defineArt("drawbridge", '<rect x="16" y="22" width="22" height="34" fill="var(--a-mute)" opacity=".3"/><rect x="82" y="22" width="22" height="34" fill="var(--a-mute)" opacity=".3"/><path d="M38 50 L70 22" stroke="var(--a-hi)" stroke-width="6" stroke-linecap="round"/><path d="M38 56 H82" stroke="var(--a-go)" stroke-width="2" stroke-dasharray="3 3"/>');
defineArt("wheel", '<circle cx="60" cy="32" r="22" fill="none" stroke="var(--a-hi)" stroke-width="5"/><circle cx="60" cy="32" r="5" fill="var(--a-ink)"/><path d="M38 32 H82 M60 32 V54" stroke="var(--a-ink)" stroke-width="3"/>');
defineArt("radio", '<path d="M24 50 A36 36 0 0 1 96 50" stroke="var(--a-mute)" stroke-opacity=".3" stroke-width="10" fill="none"/><path d="M66 16 A36 36 0 0 1 78 22" stroke="var(--a-go)" stroke-width="10" fill="none"/><path d="M60 52 L72 20" stroke="var(--a-hi)" stroke-width="3" stroke-linecap="round"/>');
defineArt("flashlight", '<rect x="10" y="6" width="100" height="52" rx="6" fill="var(--a-ink)" opacity=".75"/><circle cx="72" cy="30" r="16" fill="var(--a-bg)"/><circle cx="72" cy="30" r="5" fill="var(--a-hi)"/>');
defineArt("wristcircle", '<rect x="14" y="30" width="46" height="12" rx="6" fill="var(--a-mute)" opacity=".3"/><circle cx="80" cy="36" r="16" fill="none" stroke="var(--a-hi)" stroke-width="3" stroke-dasharray="5 4"/><circle cx="92" cy="28" r="5" fill="var(--a-hi)"/>');
defineArt("water", '<path d="M30 30 h28 l8 -8 M40 30 v-8" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M72 30 v10 M78 32 v8" stroke="var(--a-go)" stroke-width="2" stroke-dasharray="2 3"/><path d="M66 46 h22 l-3 10 h-16z" fill="var(--a-mute)" opacity=".4"/><path d="M77 46 q-4 -8 0 -10 q4 2 0 10" fill="var(--a-go)"/>');
})();
