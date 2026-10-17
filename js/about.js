(() => {
"use strict";
const RC = window.RC;
const { $, clamp, lerp, TAU, reduceMotion, store, settings, saveSettings, T, alpha, txt, rr, chime, esc, fmtTime, Game, readTheme } = RC;
// ---------------------------------------------------------------- evidence library
const EVIDENCE = [
  { sys: "mRehab", kind: "Smartphone + 3D-printed objects · University at Buffalo", ev: "18 people with chronic stroke used it at home for 6 weeks and improved upper-limb mobility. The phone measured repetitions, duration and movement smoothness.", full: true,
    rows: [["Vertical bowl", "Two-handed lift onto a box and back", "lift"], ["Horizontal bowl", "Two-handed slide across a panel", ""], ["Vertical mug", "Lift a mug onto a box and back", "lift"], ["Horizontal mug", "Move a mug side to side", ""], ["Sip from mug", "Bring mug to mouth and hold", "lift"], ["Quick twist mug", "Fast forearm rotation and return", "pour"], ["Slow pour", "Slow controlled pour; warns if too fast", "pour"], ["Walk with mug", "Walk 10 s keeping the mug level", ""], ["Unlock with key", "Rotate key clockwise and back", "lock"], ["Turn doorknob", "Rotate knob clockwise and back", "lock"], ["Phone number", "Type a number quickly and accurately", ""], ["Quick tap", "Tap circles fast with several fingers", ""]] },
  { sys: "FitMi", kind: "Two motion-sensing pucks + computer game · Flint Rehab", ev: "In a randomized trial in subacute stroke, FitMi reduced arm impairment more than a paper home-exercise book. It has 40 exercises across hands, arms, trunk and legs with 10 difficulty levels.", full: false,
    note: "Flint names about 20 of the 40 exercises publicly; the full list is in the trial's supplement.",
    rows: [["Diagonal reach", "Arm and shoulder", "lift"], ["Object rotation", "Forearm", "sort"], ["Wrist flexion", "Wrist", "maze"], ["Gross grasp", "Hand", ""], ["Seated twists", "Trunk", ""], ["Oblique crunches", "Trunk", ""], ["Seated marching", "Hip", ""], ["Ankle dorsiflexion", "Ankle", ""], ["Straight push", "Arm", ""], ["Pushing movement", "Arm", ""], ["Weighted bicep curl", "Elbow", ""], ["Open arm movement", "Shoulder", "lift"], ["Side arm raise", "Shoulder", "lift"], ["Palm up and down", "Forearm rotation", "pour"], ["Wrist bend", "Wrist", "maze"], ["Grip and release", "Hand", ""], ["Pen spin", "Fingers", ""], ["Finger curl", "Fingers", ""], ["Toe taps", "Core", ""], ["Forward punches", "Core and arm", ""], ["Knee to chest", "Core and hip", ""], ["Trunk rotation", "Core", ""], ["Knee extension", "Knee", ""], ["Hip adductions", "Hip", ""]] },
  { sys: "RAPAEL Smart Glove", kind: "Sensor glove + games · Neofect", ev: "Tested in a Stanford phase 2 randomized trial (vREHAB) and a 20-patient unsupervised home study. Games are built on daily activities and adapt their difficulty.", full: false,
    rows: [["Forearm supination and pronation", "Turning the palm up and down", "pour"], ["Wrist flexion and extension", "Bending the wrist forward and back", "maze"], ["Wrist radial and ulnar deviation", "Tilting the wrist side to side", "maze"], ["Finger flexion and extension", "Opening and closing the hand", ""], ["Pouring", "Daily-activity game", "pour"], ["Cutting vegetables", "Daily-activity game", ""], ["Turning book pages", "Daily-activity game", ""], ["Darts, tennis, house painting", "Arcade-style games", ""]] },
  { sys: "MusicGlove", kind: "Sensor glove + rhythm game · Flint Rehab", ev: "In a 12-person trial, people improved their ability to grasp small objects more than with conventional hand therapy, and found it more motivating. Sessions reach about 2,000 movements in 45 minutes.", full: true,
    rows: [["Pincer grip", "Thumb to index fingertip", ""], ["Key-pinch grip", "Thumb to side of index finger", ""], ["Finger–thumb opposition", "Thumb to each fingertip", ""]] },
  { sys: "REAL System", kind: "Clinic virtual reality · Penumbra", ev: "FDA-listed VR system used in hospitals with therapist supervision. It records range of motion each session. Individual activity names are proprietary.", full: false,
    rows: [["Shoulder range of motion and flexion", "Proximal arm activities", "lift"], ["Wrist and forearm range of motion", "Distal arm activities", "pour"], ["Core and balance", "Full-body sensor version", ""], ["Daily-living practice (grocery shopping, self-care)", "Functional activities", ""], ["Cognitive stimulation", "Thinking tasks", "simon"]] },
  { sys: "Constant Therapy", kind: "Speech, language and cognitive app · Boston University spinout", ev: "In 3,686 people with post-stroke aphasia, home users mastered tasks in a median of 6 days versus 12 for clinic users. Therapists assign tasks and see results remotely.", full: false,
    note: "The app has 80+ task types inside these 17 categories, each with levels 1–10.",
    rows: [["Attention", "Cognitive", "simon"], ["Auditory memory", "Cognitive", ""], ["Visual memory", "Cognitive", "lock"], ["Analytical reasoning", "Cognitive", "sort"], ["Quantitative reasoning", "Cognitive", ""], ["Arithmetic", "Cognitive", ""], ["Visuospatial processing", "Cognitive", "maze"], ["Auditory comprehension", "Language", ""], ["Word retrieval", "Language", ""], ["Naming", "Language", ""], ["Repetition", "Language", ""], ["Oral reading", "Language", ""], ["Sentence production", "Language", ""], ["Talking about everyday things", "Language", ""], ["Reading comprehension", "Language", "sort"], ["Spelling", "Language", ""], ["Phonological processing", "Language", ""]] },
  { sys: "Reha@Stroke", kind: "Smartphone-only serious game · TU Wien", ev: "Designed with a therapist and 13 stroke patients. It uses only the phone's built-in sensors, with levels for movement, gesture and touch exercises.", full: true,
    rows: [["Movement exercises", "Arm moves while holding the phone", "lift"], ["Gesture exercises", "Wrist and forearm gestures", "simon"], ["Touch exercises", "Finger taps and swipes", ""]] },
];
function renderEvidence() {
  const nameOf = (id) => (RC.EXERCISES.find((a) => a.id === id) || {}).name;
  $("evgrid").innerHTML = EVIDENCE.map((s) => `
    <article class="sys">
      <header><h2>${s.sys}</h2><span class="kind">${s.kind}</span></header>
      <p class="evidence">${s.ev}</p>
      ${s.note ? `<p class="note">${s.note}</p>` : ""}
      <div class="tablewrap"><table><thead><tr><th>Exercise</th><th>Movement or type</th><th>In ReConnect</th></tr></thead><tbody>
      ${s.rows.map(([n, m, id]) => `<tr><td>${n}</td><td class="muted">${m}</td><td class="inmend">${id ? `<span class="tag">${nameOf(id)}</span>` : '<span class="muted">–</span>'}</td></tr>`).join("")}
      </tbody></table></div>
    </article>`).join("");
}
RC.renderEvidence = renderEvidence;
})();
