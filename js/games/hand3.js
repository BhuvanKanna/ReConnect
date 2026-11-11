// Hand & fingers, part 3: grip and pinch tasks measured by how the phone moves in the hand.
(() => {
"use strict";
const RC = window.RC;
const { Reach, defineArt } = RC.kit;
const M = RC.moves, { scene, lvl } = M;
// Draw with a 3D scene from the js/play3d-scenes files when the computer can (the engine still does the scoring).
const in3D = (G, id) => (RC.Play3D ? RC.Play3D.wrap(G, id) : G);
const abs = (k) => (a) => Math.abs(a[k]);
const reps = (list, d) => ({ params: { reps: list, level: [1, 2, 3], durationS: null }, defaults: { reps: d, level: 1, durationS: null } });

const HAND = [
  { id: "pengrip", name: "Pen Grip Drawing", movement: "Tripod grip · fine control", control: "tilt", pose: "upright", mount: "Hold the phone upright in your fist, top edge up, screen facing you. Rest your forearm on the table.", art: ["path", "✏️"],
    desc: "Hold the phone like a pen and trace each shape.", source: "Handwriting retraining with a tripod (pen) grip from occupational therapy.",
    params: { reps: [5, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null },
    make: (S) => in3D(M.Path(S, { set: "shapes", cue: "Draw the shape" }), "pengrip") },
];
HAND.forEach((d) => { defineArt(d.id, M.art(...d.art)); RC.register(Object.assign({ section: "hand" }, d)); });
})();
