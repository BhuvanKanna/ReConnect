// Arm & shoulder, part 3: phone-motion versions of well-known rehab exercises and games.
(() => {
"use strict";
const RC = window.RC;
const { Reach, defineArt } = RC.kit;
const M = RC.moves, { scene, lvl } = M;
// Draw with a 3D scene from js/play3d-scenes.js when the computer can (the engine still does the scoring).
const in3D = (G, id) => (RC.Play3D ? RC.Play3D.wrap(G, id) : G);
const abs = (k) => (a) => Math.abs(a[k]);
const cap = (v, m) => Math.min(v, m);
const reps = (list, d) => ({ params: { reps: list, level: [1, 2, 3], durationS: null }, defaults: { reps: d, level: 1, durationS: null } });
const timed = { params: { reps: null, level: [1, 2, 3], durationS: [30, 60, 90] }, defaults: { reps: null, level: 1, durationS: 30 } };

const ARM = [
  { id: "drawsword", name: "Draw the Sword", movement: "Diagonal reach · PNF D2 flexion", control: "tilt", pose: "handleArm", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up.", art: ["seq", "⚔️"],
    desc: "Start with your hand by the opposite hip, then sweep it up and out, as if drawing a sword.", source: "Proprioceptive neuromuscular facilitation (PNF) D2 flexion pattern.",
    how: ["Start with your hand near your opposite hip.", "Sweep it up across your body and out to the side.", "Hold at the top, then bring it back down."],
    make: (S) => M.Seq(S, { steps: (S) => [{ axis: "pitch", target: S.amp, hold: 0.4, cue: "Sweep your arm up", short: "Up", emoji: "⬆️" }, { axis: "yaw", target: S.amp, hold: 0.6, cue: "And out to the side", short: "Out", emoji: "⚔️" }], restCue: "Bring your hand back to your hip" }) },
  { id: "bowling", name: "Bowling", movement: "Shoulder swing · force control", control: "accel", pose: "handleArm", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Use a wrist strap and never let go of it.", art: ["throw", "🎳"],
    desc: "Swing your arm back and forward to bowl. A harder swing rolls further.", source: "Bowling (Wii Sports) in virtual-reality stroke-rehab trials such as EVREST.",
    how: ["Hold the phone tightly. Do not let go.", "Swing your arm back, then forward as if bowling.", "Swing harder or softer to stop in the green zone."],
    make: (S) => M.Throw(S, { cue: "Bowl into the green zone", emoji: "🎳", thrower: "🙋" }) },
  { id: "pressdown", name: "Press Down", movement: "Elbow extension · triceps", control: "tilt", pose: "handleArm", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Bend your elbow so your forearm points up and forward.", art: ["rise", "⬇️"],
    desc: "Start with your forearm raised, then straighten your elbow to press down.", source: "Triceps press-down exercise from resistance-band arm programs.",
    how: ["Bend your elbow so your forearm points up and forward.", "Push your hand down until your arm is straight.", "Hold, then let it come back up."],
    make: (S) => in3D(Reach(S, { signal: (a) => -a.pitch, target: (S) => S.amp, rest: (S) => S.amp * 0.3, hold: 1, label: "Press down", title: "Press your hand down", draw: scene.rise("⬇️", "Press line") }), "pressdown") },
  { id: "spotlight", name: "Aim the Spotlight", movement: "Precise shoulder control", control: "tilt", pose: "handleArm", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up.", art: ["dial", "🔦"],
    desc: "Raise or lower your arm to point the spotlight exactly at the target, and hold it there.", source: "Precision aiming tasks for graded shoulder control.",
    how: ["Rest your forearm on the table.", "Raise or lower your arm to line up the beam.", "Hold steady on the green mark."],
    make: (S) => M.Dial(S, { signal: (a) => a.pitch, cue: "Aim at the green mark", more: "Raise your arm a little", less: "Lower it a little", emoji: "🔦" }) },
  { id: "tennis", name: "Tennis Swing", movement: "Shoulder rotation · forehand and backhand", control: "tilt", pose: "handleArm", mount: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Use a wrist strap and never let go of it.", art: ["swing", "🎾"],
    desc: "Swing forehand to one side, then backhand to the other.", source: "Tennis (Wii Sports) in virtual-reality stroke-rehab trials such as EVREST.",
    how: ["Hold the phone like a racket, arm in front.", "Swing across to the forehand side.", "Then across to the backhand side."],
    make: (S) => in3D(M.Swing(S, { signal: (a) => a.yaw, targets: (S) => [S.amp, -S.amp], hold: 0.15, cues: ["Forehand!", "Backhand!"], labels: ["Forehand", "Backhand"], emoji: "🎾" }), "tennis") },
  Object.assign({ id: "airplane", name: "Airplane Arms", movement: "Shoulder abduction · sustained", control: "tilt", pose: "handleHang", mount: "Grip the bottom of the phone in your fist, thumb forward, and let your arm hang straight down at your side, so the phone points at the floor with the screen facing forward. Keep your elbow straight.", art: ["hold", "✈️"],
    desc: "Lift your arm out to the side like an airplane wing and hold it there.", source: "Isometric shoulder abduction holds from post-stroke strength programs.",
    how: ["Let your arm hang at your side.", "Lift it straight out to the side into the green band.", "Hold it there, then lower and rest."],
    make: (S) => in3D(M.Hold(S, { signal: abs("roll"), band: (S) => [S.amp * 0.8, S.amp * 1.6], holdS: (S) => lvl(S, { 1: 4, 2: 7, 3: 10 }), restBelow: (S) => S.amp * 0.4, emoji: "✈️", cues: { below: "Lift your arm out higher", above: "A little lower", in: "Hold your wing out", rest: "Lower your arm and rest" } }), "airplane") }, reps([3, 5, 8], 3)),
];
ARM.forEach((d) => { defineArt(d.id, M.art(...d.art)); RC.register(Object.assign({ section: "arm" }, d)); });
})();
