(() => {
"use strict";
const RC = window.RC;
const LEVEL_AMP = { 1: 15, 2: 30, 3: 45 };
const SECTIONS = [["arm", "Arm & shoulder"], ["wrist", "Wrist & forearm"], ["hand", "Hand & fingers"], ["trunk", "Trunk & legs"], ["sessions", "Therapy sessions"], ["scanning", "Visual scanning"], ["attention", "Attention"], ["memory", "Memory"], ["reasoning", "Reasoning"], ["language", "Language"]];
const EXERCISES = [];
function register(def) {
  if (EXERCISES.some((d) => d.id === def.id)) throw new Error("duplicate exercise id " + def.id);
  EXERCISES.push(Object.assign({ control: "tilt", cursor: false, pad: null, safety: null, params: { reps: [6, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 2, durationS: null } }, def));
}
const exercise = (id) => EXERCISES.find((d) => d.id === id);
Object.assign(RC, { LEVEL_AMP, SECTIONS, EXERCISES, register, exercise });
})();
