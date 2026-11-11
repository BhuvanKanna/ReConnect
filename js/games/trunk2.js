// Trunk & legs, continued: seated and lying leg work, trunk control, and standing work that stays
// locked until the provider turns it on. All measured by the phone.
(() => {
"use strict";
const RC = window.RC;
const { Reach, defineArt } = RC.kit;
const M = RC.moves, { scene } = M;
const cap = (v, m) => Math.min(v, m);
const in3D = (G, id) => (RC.Play3D ? RC.Play3D.wrap(G, id) : G);
const reach = (signal, target, hold, title, emoji, label) => (S) => Reach(S, { signal, target, rest: (S) => S.amp * 0.3, hold, label, title, draw: scene.rise(emoji, label) });
// The phone's top edge can point either way along the leg, so leg lifts use the size of the tilt.
const pitch = (a) => a.pitch, absPitch = (a) => Math.abs(a.pitch), absRoll = (a) => Math.abs(a.roll);
const REPS = { params: { reps: [10, 15, 20], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } };

const TRUNK = [
  { id: "floor", name: "Reach to the Floor", movement: "Seated forward reach · trunk flexion", control: "tilt", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.",
    desc: "Lean forward from your hips to reach toward the floor, then sit back up.", source: "Berg Balance Scale item (picking up an object from the floor), practised seated.",
    make: (S) => in3D(reach(pitch, (S) => cap(S.amp * 1.5, 60), 1.2, "Reach toward the floor", "⬇️", "Forward lean")(S), "floor") },
  { id: "sidereach", name: "Side Reach", movement: "Seated lateral reach · weight shift", control: "tilt", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.",
    desc: "Reach out sideways past your knee, shifting your weight onto that hip, then come back.", source: "Seated reaching beyond arm's length (seated reach training after stroke).",
    make: (S) => in3D(Reach(S, { signal: absRoll, target: (S) => S.amp * 1.1, rest: (S) => S.amp * 0.3, hold: 1.5, label: "Side lean", title: "Reach out to the side", draw: scene.slide("🫲", "Reach past your knee") }), "sidereach") },
  { id: "rock", name: "Forward and Back", movement: "Seated trunk flexion and extension", control: "tilt", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.",
    desc: "Rock your upper body slowly forward, then back to sitting tall and slightly back.", source: "Seated pelvic tilts and trunk flexion-extension (trunk training programs after stroke).",
    make: (S) => in3D(M.Swing(S, { signal: pitch, targets: (S) => [S.amp * 0.7, -S.amp * 0.35], hold: 0.6, cues: ["Lean forward", "Now sit back"], labels: ["Forward", "Back"], emoji: "🪑", vertical: true }), "rock") },
  Object.assign({ id: "trunkcircle", name: "Trunk Circles", movement: "Seated trunk control · circles", control: "tilt", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.",
    desc: "Move your upper body in a slow circle: forward, to the side, back and round.", source: "Seated trunk-control training (trunk exercises in stroke rehab trials).",
    make: (S) => in3D(M.Circles(S, { emoji: "🔄", cue: "Circle your upper body" }), "trunkcircle") }, { params: { reps: [4, 6, 8], level: [1, 2, 3], durationS: null }, defaults: { reps: 4, level: 1, durationS: null } }),
  Object.assign({ id: "kneeext", name: "Knee Straighten", movement: "Seated knee extension · quadriceps", control: "tilt", pose: "shin", mount: "Strap the phone to the front of your affected shin just below the knee, or tuck it into a long sock, screen facing out.",
    desc: "Straighten your knee to lift your foot, hold, then lower it slowly.", source: "Otago exercise programme (knee extensor strengthening).",
    make: (S) => in3D(reach(absPitch, (S) => cap(S.amp * 1.6, 70), 2, "Straighten your knee", "🦵", "Knee straight")(S), "kneeext") }, REPS),
  Object.assign({ id: "kneeout", name: "Knees Apart", movement: "Seated hip abduction", control: "tilt", pose: "thigh", mount: "Sitting, lay the phone flat on top of your affected thigh near the knee, screen up, top edge toward the knee. A strap or tight pocket helps keep it there.",
    desc: "Move your affected knee out to the side, then back in line.", source: "Seated hip-abduction strengthening (home leg programs after stroke).",
    make: (S) => in3D(Reach(S, { signal: absRoll, target: (S) => S.amp * 0.8, rest: (S) => S.amp * 0.25, hold: 1, label: "Knee out", title: "Move your knee out to the side", draw: scene.slide("🦵", "Knee out") }), "kneeout") }, REPS),
  Object.assign({ id: "foottilt", name: "Foot Lift", movement: "Ankle dorsiflexion · measured", control: "tilt", pose: "foot", mount: "Lay the phone flat on top of your affected foot, screen up, top edge toward your toes, held by a sock or a band.",
    desc: "Pull your toes and the front of your foot up, keeping your heel down, then lower.", source: "FitMi ankle dorsiflexion; Otago toe raises.",
    make: (S) => in3D(reach(pitch, (S) => S.amp * 0.8, 1.5, "Lift the front of your foot", "🦶", "Foot up")(S), "foottilt") }, REPS),
  { id: "ankletrace", name: "Ankle Trace", movement: "Ankle control in all directions", control: "tilt", pose: "foot", mount: "Lay the phone flat on top of your affected foot, screen up, top edge toward your toes, held by a sock or a band.",
    desc: "Steer the dot along a shape by tilting your foot.", source: "Ankle alphabet and ankle-circle exercises from home ankle programs.",
    params: { reps: [5, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null },
    make: (S) => in3D(M.Path(S, { set: "shapes", cue: "Trace the shape with your foot" }), "ankletrace") },
  Object.assign({ id: "toetap", name: "Toe Taps", movement: "Foot placement · seated stepping", control: "accel", pose: "foot", mount: "Lay the phone flat on top of your affected foot, screen up, top edge toward your toes, held by a sock or a band.",
    desc: "Tap your foot forward and bring it back, again and again.", source: "Seated stepping and toe taps for foot clearance (Berg alternate-foot item, seated).",
    make: (S) => in3D(M.Bursts(S, { thr: { 1: 1.2, 2: 1.5, 3: 2 }, gap: 0.35, cues: ["Tap your foot forward"], pics: ["🦶"] }), "toetap") }, REPS),
  Object.assign({ id: "bridge", name: "Bridges", movement: "Hip extension · lying", control: "tilt", pose: "thighLying", mount: "Lie on your back with your knees bent and lay the phone flat on your affected thigh, screen up, top edge toward the knee.",
    desc: "Lying on your back, lift your hips off the bed, hold, and lower.", source: "Bridging exercises from post-stroke lower-limb and trunk programs.",
    make: (S) => in3D(reach(absPitch, (S) => S.amp * 0.5, 3, "Lift your hips", "🌉", "Hips up")(S), "bridge") }, REPS),
  Object.assign({ id: "standshift", name: "Standing Weight Shift", movement: "Standing balance · side to side", control: "tilt", safety: "standing", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.",
    desc: "Standing at a counter, shift your weight onto one leg, then the other.", source: "Otago exercise programme and Berg Balance Scale weight-shifting tasks.",
    make: (S) => in3D(M.Swing(S, { signal: (a) => a.roll, targets: (S) => [S.amp * 0.35, -S.amp * 0.35], hold: 1, cues: ["Shift your weight to the right", "Now shift to the left"], labels: ["Right", "Left"], emoji: "🧍" }), "standshift") }, REPS),
  Object.assign({ id: "minisquat", name: "Mini Squats", movement: "Standing knee bends", control: "tilt", safety: "standing", pose: "pocket", mount: "Put the phone in the front trouser pocket on your affected side.",
    desc: "Holding a counter, bend your knees a little as if sitting back, then stand tall.", source: "Otago exercise programme (knee bends).",
    make: (S) => in3D(reach(absPitch, (S) => S.amp * 0.8, 1, "Bend your knees a little", "🧎", "Knee bend")(S), "minisquat") }, REPS),
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
defineArt("standshift", '<circle cx="60" cy="12" r="6" fill="var(--a-hi)"/><path d="M60 20 V40 M52 56 L60 40 L68 56" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M36 32 h-10 M84 32 h10" stroke="var(--a-ink)" stroke-width="2.5" stroke-linecap="round"/>');
defineArt("minisquat", '<circle cx="56" cy="12" r="6" fill="var(--a-hi)"/><path d="M56 20 L58 36 L46 44 L56 56" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M84 18 V56" stroke="var(--a-mute)" stroke-width="4"/>');
})();
