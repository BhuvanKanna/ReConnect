// Therapy sessions: guided practice that is assigned like any exercise but isn't a game.
(() => {
"use strict";
const RC = window.RC;
const { Guided, defineArt } = RC.kit;

const MIRROR = [
  "Set up: mirror between your arms, affected arm hidden behind it",
  "Open and close your hand slowly while watching the mirror",
  "Turn your palm up, then down",
  "Bend and straighten your wrist",
  "Touch your thumb to each fingertip",
  "Slide your hand forward and back on the table",
];
const IMAGERY = [
  "Close your eyes. Picture your affected arm resting on the table.",
  "Imagine reaching for a cup. Feel your shoulder and elbow move.",
  "Imagine your fingers wrapping around the cup.",
  "Picture lifting the cup to your mouth and taking a sip.",
  "Imagine putting the cup down gently and letting go.",
  "Now try the same movement for real, slowly, if you can.",
];

// Mental Practice reads each step aloud when speech is available (and always shows it on screen).
function MentalPractice(S) {
  const G = Guided(S, { steps: IMAGERY, mode: "time" });
  let spoken = -1;
  const say = (text) => { try { if (window.speechSynthesis) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 0.9; speechSynthesis.speak(u); } } catch (_) {} };
  const up = G.update;
  G.update = function (dt, a) {
    up.call(this, dt, a);
    const step = G.debug().step;
    if (step !== spoken && !G.done) { spoken = step; say(IMAGERY[step]); }
    if (G.done) { try { window.speechSynthesis && speechSynthesis.cancel(); } catch (_) {} }
  };
  return G;
}

const TIME = { params: { reps: null, level: [1, 2, 3], durationS: [300, 600, 900] }, defaults: { reps: null, level: 1, durationS: 300 } };
[
  Object.assign({ id: "mirror", name: "Mirror Therapy", movement: "Visual feedback · both arms", control: "guided", pad: "done", mount: "",
    desc: "Move your stronger arm while watching its reflection, so the affected arm appears to move.", source: "Mirror therapy trials after stroke (upper-limb motor function).",
    how: ["Put a mirror upright on the table between your arms.", "Hide your affected arm behind the mirror.", "Do each movement with both arms while watching the mirror."], make: (S) => Guided(S, { steps: MIRROR, mode: "time" }) }, TIME),
  Object.assign({ id: "imagery", name: "Mental Practice", movement: "Motor imagery · guided", control: "guided", pad: "done", mount: "",
    desc: "A spoken script walks you through imagining a movement in detail, then trying it.", source: "Mental practice (motor imagery) added to therapy after stroke.",
    how: ["Sit somewhere quiet and turn the sound on.", "Listen and picture each movement in detail.", "Press Next step if you want to move on sooner."], make: MentalPractice }, TIME),
].forEach((d) => RC.register(Object.assign({ section: "sessions" }, d)));

defineArt("mirror", '<rect x="57" y="8" width="6" height="48" rx="2" fill="var(--a-go)" opacity=".5"/><path d="M28 44 q10 -22 24 -6" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M92 44 q-10 -22 -24 -6" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round" opacity=".35"/>');
defineArt("imagery", '<circle cx="48" cy="30" r="16" fill="var(--a-mute)" opacity=".25"/><path d="M70 22 q8 8 0 16 M78 16 q14 14 0 28" stroke="var(--a-hi)" stroke-width="3" fill="none" stroke-linecap="round"/>');
})();
