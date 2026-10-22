// Trunk & legs, continued: seated and lying leg work, trunk control, and standing work that stays
// locked until the provider turns it on. All measured by the phone.
(() => {
"use strict";
const RC = window.RC;
const { Reach, defineArt } = RC.kit;
const M = RC.moves, { scene } = M;
const pocket = "Put the phone upright in a shirt pocket or hold it flat against your chest.";
const shin = "Strap the phone to the front of your affected shin, just below the knee, screen facing out.";
const thigh = "Put the phone flat on top of your affected thigh, near the knee (or strap it there).";
const foot = "Strap the phone flat on top of your affected foot (a sock or a band holds it).";
const cap = (v, m) => Math.min(v, m);
const reach = (signal, target, hold, title, emoji, label) => (S) => Reach(S, { signal, target, rest: (S) => S.amp * 0.3, hold, label, title, draw: scene.rise(emoji, label) });
const pitch = (a) => a.pitch, absRoll = (a) => Math.abs(a.roll);
const REPS = { params: { reps: [10, 15, 20], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } };

const TRUNK = [
  { id: "floor", name: "Reach to the Floor", movement: "Seated forward reach · trunk flexion", control: "tilt", mount: pocket,
    desc: "Lean forward from your hips to reach toward the floor, then sit back up.", source: "Berg Balance Scale item (picking up an object from the floor), practised seated.",
    how: ["Sit near the front of a sturdy chair, feet flat.", "Lean forward and reach down toward your feet.", "Hold, then sit back up tall."],
    make: reach(pitch, (S) => cap(S.amp * 1.5, 60), 1.2, "Reach toward the floor", "⬇️", "Forward lean") },
  { id: "sidereach", name: "Side Reach", movement: "Seated lateral reach · weight shift", control: "tilt", mount: pocket,
    desc: "Reach out sideways past your knee, shifting your weight onto that hip, then come back.", source: "Seated reaching beyond arm's length (seated reach training after stroke).",
    how: ["Sit tall, feet flat.", "Reach out to the side, leaning your body with it.", "Hold, then sit back up in the middle."],
    make: (S) => Reach(S, { signal: absRoll, target: (S) => S.amp * 1.1, rest: (S) => S.amp * 0.3, hold: 1.5, label: "Side lean", title: "Reach out to the side", draw: scene.slide("🫲", "Reach past your knee") }) },
  { id: "rock", name: "Forward and Back", movement: "Seated trunk flexion and extension", control: "tilt", mount: pocket,
    desc: "Rock your upper body slowly forward, then back to sitting tall and slightly back.", source: "Seated pelvic tilts and trunk flexion-extension (trunk training programs after stroke).",
    how: ["Sit on a firm chair with your feet flat.", "Lean forward from your hips to the front target.", "Then sit back past upright to the back target."],
    make: (S) => M.Swing(S, { signal: pitch, targets: (S) => [S.amp * 0.7, -S.amp * 0.35], hold: 0.6, cues: ["Lean forward", "Now sit back"], labels: ["Forward", "Back"], emoji: "🪑", vertical: true }) },
  Object.assign({ id: "trunkcircle", name: "Trunk Circles", movement: "Seated trunk control · circles", control: "tilt", mount: pocket,
    desc: "Move your upper body in a slow circle: forward, to the side, back and round.", source: "Seated trunk-control training (trunk exercises in stroke rehab trials).",
    how: ["Sit tall with your feet flat.", "Lean out to the ring, then circle your upper body round.", "Halfway through, circle the other way."],
    make: (S) => M.Circles(S, { emoji: "🔄", cue: "Circle your upper body" }) }, { params: { reps: [4, 6, 8], level: [1, 2, 3], durationS: null }, defaults: { reps: 4, level: 1, durationS: null } }),
  Object.assign({ id: "kneeext", name: "Knee Straighten", movement: "Seated knee extension · quadriceps", control: "tilt", mount: shin,
    desc: "Straighten your knee to lift your foot, hold, then lower it slowly.", source: "Otago exercise programme (knee extensor strengthening).",
    how: ["Sit tall with your feet flat.", "Straighten your knee to lift your foot off the floor.", "Hold, then lower slowly."],
    make: reach(pitch, (S) => cap(S.amp * 1.6, 70), 2, "Straighten your knee", "🦵", "Knee straight") }, REPS),
  Object.assign({ id: "kneeout", name: "Knees Apart", movement: "Seated hip abduction", control: "tilt", mount: thigh,
    desc: "Move your affected knee out to the side, then back in line.", source: "Seated hip-abduction strengthening (home leg programs after stroke).",
    how: ["Sit tall with your feet flat.", "Let your knee fall out to the side.", "Hold, then bring it back to the middle."],
    make: (S) => Reach(S, { signal: absRoll, target: (S) => S.amp * 0.8, rest: (S) => S.amp * 0.25, hold: 1, label: "Knee out", title: "Move your knee out to the side", draw: scene.slide("🦵", "Knee out") }) }, REPS),
  Object.assign({ id: "foottilt", name: "Foot Lift", movement: "Ankle dorsiflexion · measured", control: "tilt", mount: foot,
    desc: "Pull your toes and the front of your foot up, keeping your heel down, then lower.", source: "FitMi ankle dorsiflexion; Otago toe raises.",
    how: ["Sit with your foot flat on the floor.", "Lift your toes and the front of your foot.", "Hold, then put it down slowly."],
    make: reach(pitch, (S) => S.amp * 0.8, 1.5, "Lift the front of your foot", "🦶", "Foot up") }, REPS),
  { id: "ankletrace", name: "Ankle Trace", movement: "Ankle control in all directions", control: "tilt", mount: foot,
    desc: "Steer the dot along a shape by tilting your foot.", source: "Ankle alphabet and ankle-circle exercises from home ankle programs.",
    params: { reps: [5, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null },
    how: ["Sit with your heel resting on the floor.", "Tilt your foot up, down and to the sides to move the dot.", "Follow the line from the orange dot to the end."],
    make: (S) => M.Path(S, { set: "shapes", cue: "Trace the shape with your foot" }) },
  Object.assign({ id: "toetap", name: "Toe Taps", movement: "Foot placement · seated stepping", control: "accel", mount: foot,
    desc: "Tap your foot forward and bring it back, again and again.", source: "Seated stepping and toe taps for foot clearance (Berg alternate-foot item, seated).",
    how: ["Sit tall with your feet flat.", "Tap your affected foot forward on the floor.", "Bring it back. Keep a steady rhythm."],
    make: (S) => M.Bursts(S, { thr: { 1: 1.2, 2: 1.5, 3: 2 }, gap: 0.35, cues: ["Tap your foot forward"], pics: ["🦶"] }) }, REPS),
  Object.assign({ id: "bridge", name: "Bridges", movement: "Hip extension · lying", control: "tilt", mount: "Lie on your back on a bed, knees bent. Put the phone flat on your affected thigh.",
    desc: "Lying on your back, lift your hips off the bed, hold, and lower.", source: "Bridging exercises from post-stroke lower-limb and trunk programs.",
    how: ["Lie on your back with your knees bent and feet flat.", "Squeeze your buttocks and lift your hips.", "Hold, then lower slowly."],
    make: reach(pitch, (S) => S.amp * 0.5, 3, "Lift your hips", "🌉", "Hips up") }, REPS),
  Object.assign({ id: "heelslide", name: "Heel Slides", movement: "Knee and hip flexion · lying", control: "tilt", mount: "Lie on your back on a bed, legs straight. Strap the phone to the front of your affected shin.",
    desc: "Lying down, slide your heel up toward you so the knee bends, then slide it back.", source: "Heel slides (supine knee flexion) from home leg programs.",
    how: ["Lie on your back with your legs straight.", "Slide your heel along the bed toward your bottom.", "Hold, then slide it back down."],
    make: reach(pitch, (S) => cap(S.amp * 1.2, 60), 1, "Slide your heel up", "🦵", "Knee bend") }, REPS),
  Object.assign({ id: "standshift", name: "Standing Weight Shift", movement: "Standing balance · side to side", control: "tilt", safety: "standing", mount: pocket,
    desc: "Standing at a counter, shift your weight onto one leg, then the other.", source: "Otago exercise programme and Berg Balance Scale weight-shifting tasks.",
    how: ["Only at a counter you can hold, with someone nearby.", "Shift your weight onto one foot, keeping both on the floor.", "Then shift across to the other foot."],
    make: (S) => M.Swing(S, { signal: (a) => a.roll, targets: (S) => [S.amp * 0.35, -S.amp * 0.35], hold: 1, cues: ["Shift your weight to the right", "Now shift to the left"], labels: ["Right", "Left"], emoji: "🧍" }) }, REPS),
  Object.assign({ id: "minisquat", name: "Mini Squats", movement: "Standing knee bends", control: "tilt", safety: "standing", mount: "Put the phone in the front trouser pocket on your affected side.",
    desc: "Holding a counter, bend your knees a little as if sitting back, then stand tall.", source: "Otago exercise programme (knee bends).",
    how: ["Only at a counter you can hold, with someone nearby.", "Bend your knees a little, keeping your heels down.", "Hold, then straighten up."],
    make: reach(pitch, (S) => S.amp * 0.8, 1, "Bend your knees a little", "🧎", "Knee bend") }, REPS),
  Object.assign({ id: "marchstand", name: "March in Place", movement: "Standing stepping", control: "accel", safety: "standing", mount: "Put the phone in your trouser pocket on the affected side.",
    desc: "Holding a counter, march on the spot, lifting each knee in turn.", source: "Otago exercise programme (walking practice); standing marching for gait.",
    how: ["Only at a counter you can hold, with someone nearby.", "Lift one knee, then the other.", "Keep a steady, comfortable pace."],
    make: (S) => M.Bursts(S, { thr: { 1: 1.5, 2: 2, 3: 2.5 }, gap: 0.45, cues: ["Lift one knee, then the other"], pics: ["🚶"] }) }, { params: { reps: [10, 20, 30], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } }),
  Object.assign({ id: "standreach", name: "Standing Reach", movement: "Standing forward reach · balance", control: "tilt", safety: "standing", mount: pocket,
    desc: "Standing beside a counter, reach forward as far as you safely can, then stand tall.", source: "Functional Reach Test (forward reach while standing).",
    how: ["Only beside a counter you can hold, with someone nearby.", "Reach forward with your arm, leaning from the ankles.", "Hold, then come back to standing tall."],
    make: reach(pitch, (S) => S.amp * 0.5, 2, "Reach forward", "🙆", "Forward lean") }, { params: { reps: [5, 8, 10], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null } }),
];
TRUNK.forEach((d) => RC.register(Object.assign({ section: "trunk" }, d)));

defineArt("floor", '<path d="M20 56 H100" stroke="var(--a-mute)" stroke-width="2"/><circle cx="42" cy="12" r="6" fill="var(--a-mute)" opacity=".35"/><path d="M42 20 Q58 30 70 48" stroke="var(--a-hi)" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="74" cy="52" r="4" fill="var(--a-go)"/>');
defineArt("sidereach", '<circle cx="50" cy="14" r="6" fill="var(--a-mute)" opacity=".35"/><path d="M50 22 V46 M50 28 L86 18" stroke="var(--a-hi)" stroke-width="5" stroke-linecap="round"/><path d="M92 10 v20" stroke="var(--a-go)" stroke-width="2" stroke-dasharray="3 3"/>');
defineArt("rock", '<path d="M60 54 L46 14 M60 54 L74 18" stroke="var(--a-mute)" stroke-width="2" stroke-dasharray="3 3"/><path d="M60 54 L50 18" stroke="var(--a-hi)" stroke-width="6" stroke-linecap="round"/><circle cx="49" cy="12" r="5" fill="var(--a-hi)"/>');
defineArt("trunkcircle", '<ellipse cx="60" cy="40" rx="28" ry="10" fill="none" stroke="var(--a-hi)" stroke-width="2.5" stroke-dasharray="5 4"/><path d="M60 54 L66 18" stroke="var(--a-ink)" stroke-width="5" stroke-linecap="round"/><circle cx="67" cy="13" r="5" fill="var(--a-ink)"/>');
defineArt("kneeext", '<path d="M30 20 H58" stroke="var(--a-mute)" stroke-width="8" stroke-opacity=".35" stroke-linecap="round"/><path d="M58 20 L92 26" stroke="var(--a-hi)" stroke-width="8" stroke-linecap="round"/><path d="M58 20 L60 54" stroke="var(--a-mute)" stroke-width="2" stroke-dasharray="3 3"/>');
defineArt("kneeout", '<path d="M44 54 L44 22 M76 54 L76 22" stroke="var(--a-mute)" stroke-width="7" stroke-opacity=".3" stroke-linecap="round"/><path d="M76 54 L94 24" stroke="var(--a-hi)" stroke-width="7" stroke-linecap="round"/>');
defineArt("foottilt", '<path d="M30 54 H100" stroke="var(--a-mute)" stroke-width="2"/><path d="M40 20 V50 L58 50" stroke="var(--a-mute)" stroke-width="6" stroke-opacity=".35" fill="none" stroke-linecap="round"/><path d="M42 50 L80 36" stroke="var(--a-hi)" stroke-width="6" stroke-linecap="round"/>');
defineArt("ankletrace", '<path d="M30 40 L45 20 L60 40 L75 20 L90 40" stroke="var(--a-mute)" stroke-opacity=".3" stroke-width="7" fill="none" stroke-linejoin="round"/><path d="M30 40 L45 20 L54 32" stroke="var(--a-go)" stroke-width="3" fill="none"/><circle cx="54" cy="32" r="4" fill="var(--a-hi)"/>');
defineArt("toetap", '<path d="M20 54 H100" stroke="var(--a-mute)" stroke-width="2"/><path d="M50 14 V44 L80 50" stroke="var(--a-hi)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M88 40 q4 4 0 8" stroke="var(--a-ink)" stroke-width="2" fill="none"/>');
defineArt("bridge", '<path d="M16 50 H104" stroke="var(--a-mute)" stroke-width="2"/><path d="M24 46 L58 28 L76 32 L84 50" stroke="var(--a-hi)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="44" r="5" fill="var(--a-hi)"/>');
defineArt("heelslide", '<path d="M16 50 H104" stroke="var(--a-mute)" stroke-width="2"/><path d="M28 46 L64 46" stroke="var(--a-mute)" stroke-width="6" stroke-opacity=".35" stroke-linecap="round"/><path d="M28 46 L58 24 L82 46" stroke="var(--a-hi)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
defineArt("standshift", '<circle cx="60" cy="12" r="6" fill="var(--a-hi)"/><path d="M60 20 V40 M52 56 L60 40 L68 56" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M36 32 h-10 M84 32 h10" stroke="var(--a-ink)" stroke-width="2.5" stroke-linecap="round"/>');
defineArt("minisquat", '<circle cx="56" cy="12" r="6" fill="var(--a-hi)"/><path d="M56 20 L58 36 L46 44 L56 56" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M84 18 V56" stroke="var(--a-mute)" stroke-width="4"/>');
defineArt("marchstand", '<circle cx="56" cy="10" r="6" fill="var(--a-hi)"/><path d="M56 18 V38 L52 56 M56 38 L70 40 L70 52" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
defineArt("standreach", '<circle cx="48" cy="12" r="6" fill="var(--a-hi)"/><path d="M48 20 L52 40 L50 56 M50 26 L88 22" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M94 14 v16" stroke="var(--a-go)" stroke-width="2" stroke-dasharray="3 3"/>');
})();
