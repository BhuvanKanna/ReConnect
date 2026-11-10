// Arm & shoulder, continued: more motion exercises, all measured by the phone.
(() => {
"use strict";
const RC = window.RC;
const { clamp, lerp, TAU, T, alpha, rr } = RC;
const { Reach, defineArt } = RC.kit;
const M = RC.moves, { scene, icon, lvl } = M;
// Draw with a 3D scene from js/play3d-scenes.js when the computer can (the engine still does the scoring).
const in3D = (G, id) => (RC.Play3D ? RC.Play3D.wrap(G, id) : G);
const abs = (k) => (a) => Math.abs(a[k]);
const cap = (v, m) => Math.min(v, m);

// Hammer: the nail sinks a little with every strike
const hammerDraw = (g, W, H, o) => {
  const cx = W * 0.42, base0 = H - 80, depth = (o.reps % 4) / 4;
  g.fillStyle = alpha(T.ink, 0.14); rr(g, cx - 160, base0, 320, 40, 8); g.fill();
  g.fillStyle = alpha(T.ink, 0.55); g.fillRect(cx - 5, base0 - 70 + depth * 60, 10, 70 - depth * 60); g.fillRect(cx - 16, base0 - 76 + depth * 60, 32, 8);
  const up = clamp(o.val / Math.max(1, o.targets[0]), -0.2, 1.1);
  g.save(); g.translate(cx + 120, base0 - 70); g.rotate(-up * 1.1); icon(g, "🔨", -70, 0, 70); g.restore();
  RC.txt(g, o.side === 0 ? "Lift" : "Strike!", cx + 60, base0 - 170, 24, T.ink, { font: T.body });
};

const ARM = [
  { id: "gate", name: "Swing the Gate", movement: "Shoulder external rotation", control: "tilt", pose: "handleArm", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Tuck your elbow against your side, bent to a right angle.",
    desc: "Keep your elbow tucked in and swing your forearm out like a gate, then back in.", source: "Fugl-Meyer upper-extremity item (shoulder external rotation).",
    how: ["Tuck your elbow against your side, bent to a right angle.", "Swing your forearm outward, keeping the elbow in.", "Hold, then swing it back in."],
    make: (S) => in3D(Reach(S, { signal: abs("yaw"), target: (S) => S.amp, rest: (S) => S.amp * 0.3, hold: 1, label: "Outward turn", title: "Swing your forearm outward", draw: scene.slide("🚪", "Open the gate") }), "gate") },
  { id: "paint", name: "Paint the Fence", movement: "Shoulder and elbow · up-and-down strokes", control: "tilt", pose: "handleArm", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up.",
    desc: "Paint the fence with long up-and-down strokes.", source: "Repetitive task practice with painting strokes (RAPAEL house-painting game).",
    how: ["Hold your arm as if holding a brush.", "Stroke up to the top target.", "Then down to the bottom one. Keep a steady rhythm."],
    make: (S) => in3D(M.Swing(S, { signal: (a) => a.pitch, targets: (S) => [S.amp, -S.amp * 0.4], hold: 0.15, cues: ["Brush up", "Brush down"], labels: ["Highest stroke", "Lowest stroke"], emoji: "🖌️", vertical: true }), "paint") },
  { id: "moon", name: "Follow the Moon", movement: "Smooth arm control · tracking", control: "tilt", pose: "handleArm", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up.",
    desc: "The moon drifts slowly up and down. Raise and lower your arm to stay on it.", source: "Pursuit-tracking tasks from robot-assisted and virtual-reality arm therapy.",
    params: { reps: null, level: [1, 2, 3], durationS: [30, 60, 90] }, defaults: { reps: null, level: 1, durationS: 30 },
    how: ["Rest your forearm on the table.", "Raise or lower your arm to keep the dot inside the moon's ring.", "Smooth, slow movements work best."],
    make: (S) => M.Track(S, { signal: (a) => a.pitch, range: (S) => [0, S.amp * 1.3], emoji: "🌙", cue: "Stay with the moon" }) },
  { id: "stir", name: "Stir the Pot", movement: "Shoulder and elbow circles", control: "tilt", pose: "upright", mount: "Hold the phone upright in your fist, top edge up, screen facing you.",
    desc: "Stir the pot in big, slow circles: one way, then the other.", source: "Circle-drawing tasks from robot-assisted arm therapy; Fugl-Meyer circumduction.",
    params: { reps: [4, 6, 10], level: [1, 2, 3], durationS: null }, defaults: { reps: 4, level: 1, durationS: null },
    how: ["Hold the phone like a spoon in a pot.", "Tip it out to the ring and stir all the way round.", "Halfway through, switch direction."],
    make: (S) => M.Circles(S, { emoji: "🥄", cue: "Stir in a big circle" }) },
  { id: "pendulum", name: "Pendulum Swing", movement: "Shoulder mobility · gentle swing", control: "tilt", pose: "handleHang", mount: "Grip the bottom of the phone in your fist, thumb forward, and let your arm hang straight down at your side, so the phone points at the floor with the screen facing forward. Lean forward with your good hand on a table.",
    desc: "Let your arm hang and swing it gently side to side, like a pendulum.", source: "Codman pendulum exercises for shoulder mobility.",
    params: { reps: [10, 20, 30], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null },
    how: ["Lean on a table with your good hand.", "Let the affected arm hang loose.", "Swing it gently left and right. Let the body rock it."],
    make: (S) => in3D(M.Wave(S, { signal: (a) => a.roll, thr: (S) => S.amp * 0.4, emoji: "🕰️", cues: ["Swing to one side", "Now to the other side"] }), "pendulum") },
  Object.assign({ id: "fruit", name: "Fruit Catch", movement: "Side-to-side control · timing", control: "tilt", pose: "handleArm", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Point it at the screen and move your whole arm to steer.",
    desc: "Tip your hand left and right to move the basket under the falling fruit.", source: "Catching games used in Kinect and virtual-reality stroke rehab studies.",
    how: ["Hold your arm out, pointing the phone at the screen.", "Point left or right to move the basket.", "Get under each piece of fruit before it lands."],
    make: (S) => M.Catch(S, { signal: (a) => a.roll, cue: "Catch the fruit" }) }, { params: { reps: [10, 15, 20], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } }),
  Object.assign({ id: "quickreach", name: "Quick Reach", movement: "Reaction speed · reaching", control: "tilt", pose: "handleArm", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Point it at the screen and move your whole arm to steer.",
    desc: "Hold still in the middle. When the arrow appears, reach that way as fast as you can.", source: "Choice-reaction reaching for movement speed (common in robot and VR arm therapy).",
    how: ["Rest in the middle until the arrow shows.", "Reach quickly toward the arrow.", "Come back to the middle and wait for the next one."],
    make: (S) => M.Direction(S, { cue: "Hold still in the middle" }) }, { params: { reps: [8, 12, 16], level: [1, 2, 3], durationS: null }, defaults: { reps: 8, level: 1, durationS: null } }),
  { id: "reachturn", name: "Reach and Turn", movement: "Reach, then forearm rotation", control: "tilt", pose: "handleArm", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up.",
    desc: "Reach up for the door handle, then turn your hand to open it.", source: "Wolf Motor Function Test (turning a key in a lock); reach-and-manipulate task practice.",
    how: ["Start with your forearm on the table.", "Lift your arm to reach the handle.", "Turn your palm to open it, then come back to rest."],
    make: (S) => M.Seq(S, { steps: (S) => [{ axis: "pitch", target: S.amp, hold: 0.6, cue: "Reach up for the handle", short: "Reach", emoji: "🚪" }, { axis: "roll", abs: true, target: S.amp, hold: 0.8, cue: "Turn your hand to open it", short: "Turn", emoji: "🔄" }], restCue: "Lower your arm to rest" }) },
];
ARM.forEach((d) => RC.register(Object.assign({ section: "arm" }, d)));

defineArt("gate", '<path d="M30 54 V14 M30 20 L78 14 M30 48 L78 42 M78 14 V42" stroke="var(--a-hi)" stroke-width="3" fill="none"/><path d="M84 30 a10 10 0 0 1 4 12" stroke="var(--a-ink)" stroke-width="2" fill="none"/>');
defineArt("paint", '<path d="M30 54 V14 M46 54 V14 M62 54 V14 M78 54 V14" stroke="var(--a-mute)" stroke-width="10" stroke-opacity=".25"/><path d="M62 54 V24" stroke="var(--a-hi)" stroke-width="10"/><path d="M90 16 V40" stroke="var(--a-ink)" stroke-width="2" stroke-dasharray="3 3"/>');
defineArt("moon", '<path d="M14 40 C34 10 50 10 66 30 S98 50 108 20" stroke="var(--a-hi)" stroke-width="6" stroke-opacity=".35" fill="none" stroke-linecap="round"/><circle cx="66" cy="30" r="8" fill="none" stroke="var(--a-hi)" stroke-width="3"/><circle cx="66" cy="31" r="3" fill="var(--a-ink)"/>');
defineArt("stir", '<ellipse cx="60" cy="40" rx="30" ry="12" fill="var(--a-mute)" opacity=".25"/><ellipse cx="60" cy="38" rx="20" ry="6" fill="none" stroke="var(--a-hi)" stroke-width="2.5" stroke-dasharray="4 3"/><path d="M66 38 L80 8" stroke="var(--a-ink)" stroke-width="4" stroke-linecap="round"/>');
defineArt("pendulum", '<path d="M60 6 L44 46" stroke="var(--a-ink)" stroke-width="3"/><circle cx="44" cy="48" r="7" fill="var(--a-hi)"/><path d="M34 56 Q60 64 86 56" stroke="var(--a-mute)" stroke-width="2" fill="none" stroke-dasharray="3 3"/>');
defineArt("fruit", '<circle cx="74" cy="14" r="6" fill="var(--a-hi)"/><path d="M74 22 V34" stroke="var(--a-mute)" stroke-width="2" stroke-dasharray="2 3"/><path d="M58 44 h32 l-4 12 h-24z" fill="var(--a-hi)" opacity=".5"/>');
defineArt("quickreach", '<circle cx="60" cy="32" r="22" fill="var(--a-mute)" opacity=".1"/><path d="M60 32 H84" stroke="var(--a-hi)" stroke-width="5" stroke-linecap="round"/><path d="M80 24 L90 32 L80 40" fill="var(--a-hi)"/><circle cx="60" cy="32" r="4" fill="var(--a-ink)"/>');
defineArt("reachturn", '<rect x="58" y="10" width="34" height="8" rx="4" fill="var(--a-hi)"/><path d="M30 54 L54 22" stroke="var(--a-ink)" stroke-width="4" stroke-linecap="round"/><path d="M48 12 a10 10 0 1 1 -6 14" stroke="var(--a-go)" stroke-width="2.5" fill="none"/>');
})();
