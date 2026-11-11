// Wrist & forearm, part 3: phone-motion versions of well-known rehab exercises and games.
(() => {
"use strict";
const RC = window.RC;
const { Reach, defineArt } = RC.kit;
const M = RC.moves, { scene, lvl } = M;
// Draw with a 3D scene from js/play3d-scenes.js when the computer can (the engine still does the scoring).
const in3D = (G, id) => (RC.Play3D ? RC.Play3D.wrap(G, id) : G);
const abs = (k) => (a) => Math.abs(a[k]);
const reps = (list, d) => ({ params: { reps: list, level: [1, 2, 3], durationS: null }, defaults: { reps: d, level: 1, durationS: null } });
const timed = { params: { reps: null, level: [1, 2, 3], durationS: [30, 60, 90] }, defaults: { reps: null, level: 1, durationS: 30 } };

const WRIST = [
  Object.assign({ id: "jar", name: "Open the Jar", movement: "Repeated forearm twists", control: "tilt", pose: "handleTable", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Rest your forearm on the table.", art: ["wave", "🫙"],
    desc: "Twist the lid back and forth until the jar opens.", source: "Jar opening, a standard ADL task in hand and wrist therapy.",
    make: (S) => in3D(M.Wave(S, { signal: (a) => a.roll, thr: (S) => S.amp * 0.5, emoji: "🫙", cues: ["Twist the lid", "Twist back"] }), "jar") }, reps([8, 12, 20], 8)),
  Object.assign({ id: "scoophold", name: "Scoop and Hold", movement: "Wrist flexion · sustained", control: "tilt", pose: "edgeDown", mount: "Rest your forearm on the table with your wrist just past the edge. Palm down, grip the phone flat against your palm: screen facing the floor, top edge toward your fingertips.", art: ["hold", "🥄"],
    desc: "Curl your wrist down as if scooping, and hold it in the band.", source: "Isometric wrist flexion holds from hand-therapy programs.",
    make: (S) => in3D(M.Hold(S, { signal: (a) => -a.pitch, band: (S) => [S.amp * 0.6, S.amp * 1.4], holdS: (S) => lvl(S, { 1: 4, 2: 6, 3: 10 }), restBelow: (S) => S.amp * 0.3, emoji: "🥄", cues: { below: "Curl your wrist down further", above: "Not quite so far", in: "Hold it there", rest: "Relax your wrist" } }), "scoophold") }, reps([3, 5, 8], 3)),
  Object.assign({ id: "fill", name: "Fill to the Line", movement: "Forearm rotation · steady pour", control: "tilt", pose: "upright", mount: "Hold the phone upright in your fist, top edge up, screen facing you. Rest your forearm on the table.", art: ["hold", "🥛"],
    desc: "Tip the jug just enough to pour, and keep it steady until the glass is full.", source: "Pouring tasks from ADL training and the mRehab slow-pour exercise.",
    make: (S) => in3D(M.Hold(S, { signal: abs("roll"), band: (S) => [S.amp * 0.6, S.amp * 1.2], holdS: (S) => lvl(S, { 1: 4, 2: 6, 3: 8 }), restBelow: (S) => S.amp * 0.3, emoji: "🥛", cues: { below: "Tip a little more to pour", above: "Too much, tip back", in: "Pouring nicely", rest: "Set the jug upright" } }), "fill") }, reps([3, 5, 8], 3)),
  { id: "soup", name: "Spoon the Soup", movement: "Scoop, then lift to mouth", control: "tilt", pose: "handleArm", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up.", art: ["seq", "🥣"],
    desc: "Scoop the soup by turning your hand, then lift the spoon to your mouth.", source: "Feeding practice (eating with a spoon) from task-oriented ADL training.",
    make: (S) => in3D(M.Seq(S, { steps: (S) => [{ axis: "roll", abs: true, target: S.amp * 0.8, hold: 0.4, cue: "Turn to scoop the soup", short: "Scoop", emoji: "🥣" }, { axis: "pitch", target: S.amp * 1.2, hold: 0.6, cue: "Lift it to your mouth", short: "Lift", emoji: "😋" }], restCue: "Spoon back to the bowl" }), "soup") },
  Object.assign({ id: "sail", name: "Sail the Boat", movement: "Smooth forearm rotation · tracking", control: "tilt", pose: "handleTable", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Rest your forearm on the table.", art: ["track", "⛵"],
    desc: "Follow the wind as it shifts, turning your hand to keep the boat on course.", source: "Pursuit-tracking tasks from robot-assisted wrist therapy.",
    make: (S) => in3D(M.Track(S, { signal: (a) => a.roll, range: (S) => [-S.amp, S.amp], emoji: "⛵", cue: "Stay on course" }), "sail") }, timed),
];
WRIST.forEach((d) => { defineArt(d.id, M.art(...d.art)); RC.register(Object.assign({ section: "wrist" }, d)); });
})();
