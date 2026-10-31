// Trunk, head, balance & legs, part 3: phone-motion versions of well-known rehab exercises and games.
// Standing ones carry safety:"standing" and stay locked until the provider turns them on.
(() => {
"use strict";
const RC = window.RC;
const { Reach, defineArt } = RC.kit;
const M = RC.moves, { scene, lvl } = M;
const abs = (k) => (a) => Math.abs(a[k]);
const most = (a) => Math.max(Math.abs(a.pitch), Math.abs(a.roll));
const cap = (v, m) => Math.min(v, m);
const reps = (list, d) => ({ params: { reps: list, level: [1, 2, 3], durationS: null }, defaults: { reps: d, level: 1, durationS: null } });
const timed = { params: { reps: null, level: [1, 2, 3], durationS: [30, 60, 90] }, defaults: { reps: null, level: 1, durationS: 30 } };
const steady = (S) => lvl(S, { 1: 8, 2: 5, 3: 3 });
const STEP = { 1: 1.2, 2: 1.5, 3: 2 };

const TRUNK = [
  Object.assign({ id: "leanhold", name: "Lean Forward and Hold", movement: "Trunk flexion · sustained", control: "tilt", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.", art: ["hold", "🙇"],
    desc: "Lean forward from your hips, as if getting ready to stand, and hold.", source: "Forward weight shift practice before sit-to-stand training.",
    how: ["Sit tall with your feet flat.", "Lean forward from your hips into the band.", "Hold it there, then sit back up."],
    make: (S) => M.Hold(S, { signal: (a) => a.pitch, band: (S) => [S.amp * 0.6, S.amp * 1.2], holdS: (S) => lvl(S, { 1: 4, 2: 6, 3: 10 }), restBelow: (S) => S.amp * 0.3, emoji: "🙇", cues: { below: "Lean forward a little more", above: "Not quite so far", in: "Hold the lean", rest: "Sit back up and rest" } }) }, reps([3, 5, 8], 3)),
  { id: "crossreach", name: "Reach Across", movement: "Seated trunk rotation", control: "tilt", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.", art: ["slide", "↪️"],
    desc: "Turn your upper body to reach across toward the other side, then come back.", source: "Seated trunk rotation from the Trunk Impairment Scale and trunk training programs.",
    how: ["Sit tall with your feet flat.", "Turn your shoulders to face one side.", "Hold, then turn back to the front."],
    make: (S) => Reach(S, { signal: abs("yaw"), target: (S) => S.amp * 1.1, rest: (S) => S.amp * 0.3, hold: 1, label: "Turn", title: "Turn and reach across", draw: scene.slide("↪️", "Turn line") }) },
  { id: "neckturn", name: "Head Turns", movement: "Neck rotation", control: "tilt", pose: "head", mount: "Hold the phone flat on top of your head with one hand, screen up, top edge pointing forward.", art: ["swing", "🙂"],
    desc: "Turn your head slowly to one side, then the other, keeping the phone in front of your nose.", source: "Cervical range-of-motion exercises from physiotherapy home programs.",
    how: ["Sit tall with the phone on your head.", "Turn your head to one side.", "Then slowly to the other."],
    make: (S) => M.Swing(S, { signal: (a) => a.yaw, targets: (S) => [S.amp * 0.9, -S.amp * 0.9], hold: 0.4, cues: ["Turn your head one way", "Now the other way"], labels: ["One side", "Other side"], emoji: "🙂" }) },
  { id: "nod", name: "Yes Nods", movement: "Neck flexion and extension", control: "tilt", pose: "head", mount: "Hold the phone flat on top of your head with one hand, screen up, top edge pointing forward.", art: ["swingv", "🙂"],
    desc: "Nod slowly: chin down toward your chest, then up to look at the ceiling.", source: "Cervical range-of-motion exercises from physiotherapy home programs.",
    how: ["Sit tall with the phone on your head.", "Tip your chin down.", "Then lift it to look up."],
    make: (S) => M.Swing(S, { signal: (a) => a.pitch, targets: (S) => [S.amp * 0.6, -S.amp * 0.6], hold: 0.4, cues: ["Look up", "Chin down"], labels: ["Up", "Down"], emoji: "🙂", vertical: true }) },
  Object.assign({ id: "gaze", name: "Gaze Stabilization", movement: "Head turns with eyes fixed · balance", control: "tilt", pose: "head", mount: "Hold the phone flat on top of your head with one hand, screen up, top edge pointing forward.", art: ["wave", "👁️"],
    desc: "Keep your eyes on the letter on the phone while you turn your head side to side.", source: "Vestibular rehab gaze-stabilization (VOR x1) exercises, as in Cawthorne-Cooksey programs.",
    how: ["Look at the eye in the middle of the computer screen.", "Keep your eyes on it as you turn your head left.", "Then right. Small, steady turns."],
    make: (S) => M.Wave(S, { signal: (a) => a.yaw, thr: (S) => S.amp * 0.3, emoji: "👁️", cues: ["Turn your head one way", "Now the other way"] }) }, reps([10, 20, 30], 10)),
  { id: "eartilt", name: "Ear to Shoulder", movement: "Neck side bend", control: "tilt", pose: "head", mount: "Hold the phone flat on top of your head with one hand, screen up, top edge pointing forward.", art: ["swing", "🙂"],
    desc: "Tip your head to bring your ear toward your shoulder, then to the other side.", source: "Cervical range-of-motion exercises from physiotherapy home programs.",
    how: ["Sit tall with the phone on your head.", "Tip your head toward one shoulder.", "Then toward the other."],
    make: (S) => M.Swing(S, { signal: (a) => a.roll, targets: (S) => [S.amp * 0.6, -S.amp * 0.6], hold: 0.4, cues: ["Ear to one shoulder", "Ear to the other"], labels: ["One side", "Other side"], emoji: "🙂" }) },
  Object.assign({ id: "sidebendhold", name: "Side Bend Hold", movement: "Trunk side flexion · sustained", control: "tilt", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.", art: ["hold", "🧍"],
    desc: "Lean your upper body to one side and hold it in the band.", source: "Lateral trunk flexion from the Trunk Impairment Scale and trunk training.",
    how: ["Sit tall with your feet flat.", "Lean sideways into the green band.", "Hold, then sit back up straight."],
    make: (S) => M.Hold(S, { signal: abs("roll"), band: (S) => [S.amp * 0.5, S.amp * 1.1], holdS: (S) => lvl(S, { 1: 4, 2: 6, 3: 8 }), restBelow: (S) => S.amp * 0.25, emoji: "🧍", cues: { below: "Lean a little further", above: "Not quite so far", in: "Hold the lean", rest: "Sit up straight and rest" } }) }, reps([3, 5, 8], 3)),
  Object.assign({ id: "kneelift", name: "Knee Lift Hold", movement: "Seated hip flexion · sustained", control: "tilt", pose: "thigh", mount: "Sitting, lay the phone flat on top of your affected thigh near the knee, screen up, top edge toward the knee. A strap or tight pocket helps keep it there.", art: ["hold", "🦵"],
    desc: "Lift your knee up off the chair and hold it there.", source: "Seated hip flexion holds from post-stroke leg strengthening programs.",
    how: ["Sit with both feet flat.", "Lift your knee into the green band.", "Hold, then lower your foot to the floor."],
    make: (S) => M.Hold(S, { signal: (a) => a.pitch, band: (S) => [S.amp * 0.5, S.amp * 1.3], holdS: (S) => lvl(S, { 1: 3, 2: 5, 3: 8 }), restBelow: (S) => S.amp * 0.25, emoji: "🦵", cues: { below: "Lift your knee higher", above: "A little lower", in: "Hold the knee up", rest: "Lower your foot and rest" } }) }, reps([3, 5, 8], 3)),
  { id: "penalty", name: "Penalty Kick", movement: "Knee extension · force control", control: "accel", pose: "shin", mount: "Strap the phone to the front of your affected shin just below the knee, or tuck it into a long sock, screen facing out.", art: ["throw", "⚽"],
    desc: "Kick your lower leg forward to shoot. A harder kick goes further.", source: "Kicking games from Kinect-based lower-limb stroke rehab.",
    how: ["Sit with your foot on the floor.", "Kick your lower leg forward.", "Kick harder or softer to land in the green zone."],
    make: (S) => M.Throw(S, { cue: "Kick into the green zone", emoji: "⚽", thrower: "🦵" }) },
  Object.assign({ id: "anklecircles", name: "Ankle Circles", movement: "Ankle circumduction", control: "tilt", pose: "foot", mount: "Lay the phone flat on top of your affected foot, screen up, top edge toward your toes, held by a sock or a band.", art: ["circles", "🦶"],
    desc: "Lift your foot slightly and draw big circles with your toes, one way then the other.", source: "Ankle circles from standard ankle range-of-motion programs.",
    how: ["Sit with your heel on the floor.", "Tip your foot out to the ring and circle all the way round.", "Halfway through, circle the other way."],
    make: (S) => M.Circles(S, { emoji: "🦶", cue: "Circle your foot" }) }, reps([4, 6, 10], 4)),
  { id: "anklerock", name: "Ankle In and Out", movement: "Ankle inversion and eversion", control: "tilt", pose: "foot", mount: "Lay the phone flat on top of your affected foot, screen up, top edge toward your toes, held by a sock or a band.", art: ["swing", "🦶"],
    desc: "Roll your foot to stand on its outside edge, then its inside edge.", source: "Ankle inversion and eversion from standard ankle range-of-motion programs.",
    how: ["Sit with your foot flat on the floor.", "Roll it onto its outer edge.", "Then onto its inner edge."],
    make: (S) => M.Swing(S, { signal: (a) => a.roll, targets: (S) => [S.amp * 0.5, -S.amp * 0.5], hold: 0.4, cues: ["Roll to the outside edge", "Roll to the inside edge"], labels: ["Outside", "Inside"], emoji: "🦶" }) },
  { id: "gaspedal", name: "Gas Pedal", movement: "Ankle control · precise", control: "tilt", pose: "foot", mount: "Lay the phone flat on top of your affected foot, screen up, top edge toward your toes, held by a sock or a band.", art: ["dial", "🚗"],
    desc: "Press the pedal with your foot to reach exactly the right speed, then hold it.", source: "Ankle control training for driving after stroke.",
    how: ["Sit with your heel on the floor.", "Point or lift your foot to match the green mark.", "Hold steady while the ring fills."],
    make: (S) => M.Dial(S, { signal: (a) => a.pitch, cue: "Hold the speed on the green mark", more: "Lift your toes a little", less: "Press down a little", emoji: "🚗" }) },
  Object.assign({ id: "cycling", name: "Seated Cycling", movement: "Alternating leg pedaling", control: "tilt", pose: "thigh", mount: "Sitting, lay the phone flat on top of your affected thigh near the knee, screen up, top edge toward the knee. A strap or tight pocket helps keep it there.", art: ["wave", "🚴"],
    desc: "Pedal your legs as if riding a bike, or use a pedal exerciser.", source: "Cycling and pedal-exerciser training (such as MOTOmed) for lower-limb rehab.",
    how: ["Sit with your feet on the pedals or the floor.", "Push your leg forward and down.", "Then bring it back up. Keep a steady rhythm."],
    make: (S) => M.Wave(S, { signal: (a) => a.pitch, thr: (S) => S.amp * 0.3, emoji: "🚴", cues: ["Push down", "Bring it up"] }) }, reps([15, 25, 40], 15)),
  { id: "sidelegs", name: "Side-Lying Leg Lift", movement: "Hip abduction", control: "tilt", pose: "sideLying", mount: "Lie on your side with the affected leg on top. Lay the phone flat on the outside of your top thigh near the knee, screen up.", art: ["rise", "🦵"],
    desc: "Lying on your side, lift your top leg up toward the ceiling.", source: "Side-lying hip abduction from lower-limb strengthening programs.",
    how: ["Lie on your side, bottom knee bent.", "Lift your top leg up, keeping it straight.", "Hold, then lower it slowly."],
    make: (S) => Reach(S, { signal: most, target: (S) => S.amp * 0.8, rest: (S) => S.amp * 0.3, hold: 1, label: "Leg lift", title: "Lift your top leg", draw: scene.rise("🦵", "Lift line") }) },
  { id: "kneerolls", name: "Knee Rolls", movement: "Lower trunk rotation", control: "tilt", pose: "thighLying", mount: "Lie on your back with your knees bent and lay the phone flat on your affected thigh, screen up, top edge toward the knee.", art: ["swing", "🛏️"],
    desc: "Let both knees roll slowly to one side, then to the other.", source: "Lower trunk rotation from bed-based trunk programs after stroke.",
    how: ["Lie on your back, knees bent and together.", "Roll both knees to one side.", "Bring them back over to the other side."],
    make: (S) => M.Swing(S, { signal: (a) => a.roll, targets: (S) => [S.amp, -S.amp], hold: 0.5, cues: ["Roll your knees one way", "Now the other way"], labels: ["One side", "Other side"], emoji: "🛏️" }) },
  Object.assign({ id: "slalom", name: "Ski Slalom", movement: "Standing weight shift · side to side", control: "tilt", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up. Hold a counter or sturdy chair with your other hand.", safety: "standing", art: ["steer", "⛷️"],
    desc: "Shift your weight left and right to ski through each gate.", source: "Wii Fit ski slalom, used in balance-training studies after stroke.",
    how: ["Stand tall holding the counter.", "Shift your weight left or right to steer.", "Line up with each gate before it arrives."],
    make: (S) => M.Steer(S, { signal: (a) => a.roll * 3, emoji: "⛷️", cue: "Ski through the gates" }) }, reps([10, 15, 20], 10)),
  { id: "heeltoe", name: "Heel-Toe Rock", movement: "Ankle dorsiflexion and plantarflexion", control: "tilt", pose: "foot", mount: "Lay the phone flat on top of your affected foot, screen up, top edge toward your toes, held by a sock or a band.", art: ["swingv", "🦶"],
    desc: "Rock your foot up onto your heel, then down onto your toes.", source: "Ankle range-of-motion exercises from FitMi and Otago programs.",
    how: ["Sit with your foot flat on the floor.", "Lift your toes to rock onto your heel.", "Then press down onto your toes."],
    make: (S) => M.Swing(S, { signal: (a) => a.pitch, targets: (S) => [S.amp * 0.7, -S.amp * 0.5], hold: 0.3, cues: ["Toes up", "Toes down"], labels: ["Toes up", "Toes down"], emoji: "🦶", vertical: true }) },
  { id: "chestup", name: "Sit Up Tall", movement: "Upper-back extension · posture", control: "tilt", pose: "chest", mount: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.", art: ["rise", "🧘"],
    desc: "Lift your chest and sit up tall, leaning back slightly, then relax.", source: "Thoracic extension and posture exercises from trunk training programs.",
    how: ["Sit near the front of the chair.", "Lift your chest and lean back a little.", "Hold, then relax forward."],
    make: (S) => Reach(S, { signal: (a) => -a.pitch, target: (S) => S.amp * 0.5, rest: (S) => S.amp * 0.15, hold: 1.5, label: "Chest lift", title: "Lift your chest", draw: scene.rise("🧘", "Tall") }) },
  Object.assign({ id: "toeshold", name: "Toes Up Hold", movement: "Ankle dorsiflexion · sustained", control: "tilt", pose: "foot", mount: "Lay the phone flat on top of your affected foot, screen up, top edge toward your toes, held by a sock or a band.", art: ["hold", "🦶"],
    desc: "Lift your toes up toward your shin and hold them there.", source: "Isometric dorsiflexion for foot drop, from post-stroke ankle programs.",
    how: ["Sit with your heel on the floor.", "Lift your toes into the green band.", "Hold, then lower your foot."],
    make: (S) => M.Hold(S, { signal: (a) => a.pitch, band: (S) => [S.amp * 0.5, S.amp * 1.2], holdS: (S) => lvl(S, { 1: 3, 2: 5, 3: 8 }), restBelow: (S) => S.amp * 0.2, emoji: "🦶", cues: { below: "Lift your toes higher", above: "A little lower", in: "Hold your toes up", rest: "Lower your foot and rest" } }) }, reps([3, 5, 8], 3)),
];
TRUNK.forEach((d) => { defineArt(d.id, M.art(...d.art)); RC.register(Object.assign({ section: "trunk" }, d)); });
})();
