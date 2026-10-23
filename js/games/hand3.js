// Hand & fingers, part 3: grip and pinch tasks measured by how the phone moves in the hand.
(() => {
"use strict";
const RC = window.RC;
const { Reach, defineArt } = RC.kit;
const M = RC.moves, { scene, lvl } = M;
const pinch = "Pinch the phone's edge between your thumb and fingers, forearm resting on the table.";
const grip = "Hold the phone firmly in your affected hand (use a wrist strap). Never let go of it.";
const abs = (k) => (a) => Math.abs(a[k]);
const reps = (list, d) => ({ params: { reps: list, level: [1, 2, 3], durationS: null }, defaults: { reps: d, level: 1, durationS: null } });

const HAND = [
  Object.assign({ id: "liftplace", name: "Lift and Place", movement: "Grasp, lift and release", control: "accel", mount: "Put the phone flat on the table in front of you.", art: ["bursts", "📱"],
    desc: "Grasp the phone, lift it off the table, and set it back down gently.", source: "Action Research Arm Test grasp items; Box and Block style grasp-and-release practice.",
    how: ["Reach for the phone and grasp it.", "Lift it a little way off the table.", "Set it back down. Lift and set down is one rep."],
    make: (S) => M.Bursts(S, { per: 2, gap: 0.6, thr: { 1: 1.2, 2: 1.6, 3: 2 }, cues: ["Grasp and lift", "Set it down"], pics: ["📱", "✋"] }) }, reps([6, 10, 15], 6)),
  { id: "cointurn", name: "Turn the Coin", movement: "Pinch grip with forearm rotation", control: "tilt", mount: pinch, art: ["slide", "🪙"],
    desc: "Keep your pinch on the phone's edge and turn your hand over, like flipping a coin.", source: "Action Research Arm Test pinch items; coin-turning practice from hand therapy.",
    how: ["Pinch the phone between your thumb and fingers.", "Keep the pinch and turn your hand over.", "Hold, then turn back."],
    make: (S) => Reach(S, { signal: abs("roll"), target: (S) => S.amp * 1.1, rest: (S) => S.amp * 0.3, hold: 1, label: "Turn", title: "Turn the coin over", draw: scene.slide("🪙", "Turned over") }) },
  { id: "pengrip", name: "Pen Grip Drawing", movement: "Tripod grip · fine control", control: "tilt", mount: "Hold the phone upright like a big pen, between your thumb, pointer and middle fingers.", art: ["path", "✏️"],
    desc: "Hold the phone like a pen and trace each shape.", source: "Handwriting retraining with a tripod (pen) grip from occupational therapy.",
    params: { reps: [5, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null },
    how: ["Hold the phone like a pen.", "Tilt it to move the dot to the orange start.", "Follow the shape's line to the end."],
    make: (S) => M.Path(S, { set: "shapes", cue: "Draw the shape" }) },
  Object.assign({ id: "griphold", name: "Grip and Hold Up", movement: "Grip endurance", control: "tilt", mount: grip, art: ["hold", "✊"],
    desc: "Grip the phone and hold it upright, keeping it steady in the band.", source: "Sustained grip practice from GRASP and hand-therapy programs.",
    how: ["Hold the phone upright in your fist.", "Keep it standing in the green band.", "Hold until the bar fills, then relax your grip."],
    make: (S) => M.Hold(S, { signal: (a) => a.pitch, band: (S) => [S.amp * 1.2, 90], holdS: (S) => lvl(S, { 1: 5, 2: 8, 3: 12 }), restBelow: (S) => S.amp * 0.5, emoji: "✊", cues: { below: "Stand it up straighter", above: "A little less", in: "Hold it steady", rest: "Lay it down and relax" } }) }, reps([3, 5, 8], 3)),
  { id: "cardflip", name: "Flip the Card", movement: "Pinch grip with full turn", control: "tilt", mount: pinch, art: ["swing", "🎴"],
    desc: "Pinch the card and flip it face up, then face down again.", source: "Wolf Motor Function Test flip-cards item.",
    how: ["Pinch the phone's edge like a card.", "Flip it over one way.", "Then flip it back."],
    make: (S) => M.Swing(S, { signal: (a) => a.roll, targets: (S) => [S.amp, -S.amp * 0.5], hold: 0.3, cues: ["Flip it face up", "Flip it back down"], labels: ["Face up", "Face down"], emoji: "🎴" }) },
  Object.assign({ id: "passhands", name: "Pass It Over", movement: "Hand-to-hand transfer · bilateral", control: "accel", mount: "Hold the phone in your affected hand, with your other hand ready beside it.", art: ["bursts", "🤲"],
    desc: "Pass the phone from your affected hand to your other hand, and back again.", source: "Bilateral hand-to-hand transfer tasks from occupational therapy.",
    how: ["Hold the phone in your affected hand.", "Pass it across to your other hand.", "Pass it back. Across and back is one rep."],
    make: (S) => M.Bursts(S, { per: 2, gap: 0.7, thr: { 1: 1.2, 2: 1.6, 3: 2 }, cues: ["Pass it across", "Pass it back"], pics: ["🤲"] }) }, reps([6, 10, 15], 6)),
  Object.assign({ id: "wring", name: "Wring the Towel", movement: "Two-hand grip and twist", control: "tilt", mount: "Hold the phone in both hands, one at each end, like a rolled-up towel.", art: ["wave", "🧺"],
    desc: "Grip with both hands and twist back and forth to wring out the towel.", source: "Towel wringing, a classic occupational-therapy grip task.",
    how: ["Hold the phone in both hands.", "Twist your hands one way.", "Then the other way, gripping firmly."],
    make: (S) => M.Wave(S, { signal: (a) => a.roll, thr: (S) => S.amp * 0.5, emoji: "🧺", cues: ["Twist one way", "Twist the other way"] }) }, reps([8, 12, 20], 8)),
  Object.assign({ id: "boltpinch", name: "Tighten the Nut", movement: "Pinch with small, quick twists", control: "tilt", mount: pinch, art: ["wave", "🔩"],
    desc: "Keep your pinch and twist in small, quick turns to tighten the nut.", source: "Pinch-and-twist tasks with nuts and bolts from hand therapy.",
    how: ["Pinch the phone's edge.", "Twist a little one way.", "Then a little the other way, quickly."],
    make: (S) => M.Wave(S, { signal: (a) => a.roll, thr: (S) => S.amp * 0.3, emoji: "🔩", cues: ["Twist", "And back"] }) }, reps([10, 20, 30], 10)),
];
HAND.forEach((d) => { defineArt(d.id, M.art(...d.art)); RC.register(Object.assign({ section: "hand" }, d)); });
})();
