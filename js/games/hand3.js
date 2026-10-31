// Hand & fingers, part 3: grip and pinch tasks measured by how the phone moves in the hand.
(() => {
"use strict";
const RC = window.RC;
const { Reach, defineArt } = RC.kit;
const M = RC.moves, { scene, lvl } = M;
const abs = (k) => (a) => Math.abs(a[k]);
const reps = (list, d) => ({ params: { reps: list, level: [1, 2, 3], durationS: null }, defaults: { reps: d, level: 1, durationS: null } });

const HAND = [
  { id: "pengrip", name: "Pen Grip Drawing", movement: "Tripod grip · fine control", control: "tilt", pose: "upright", mount: "Hold the phone upright in your fist, top edge up, screen facing you. Rest your forearm on the table.", art: ["path", "✏️"],
    desc: "Hold the phone like a pen and trace each shape.", source: "Handwriting retraining with a tripod (pen) grip from occupational therapy.",
    params: { reps: [5, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null },
    how: ["Hold the phone like a pen.", "Tilt it to move the dot to the orange start.", "Follow the shape's line to the end."],
    make: (S) => M.Path(S, { set: "shapes", cue: "Draw the shape" }) },
];
HAND.forEach((d) => { defineArt(d.id, M.art(...d.art)); RC.register(Object.assign({ section: "hand" }, d)); });
})();
