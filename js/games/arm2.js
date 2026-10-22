// Arm & shoulder, continued: more motion exercises, all measured by the phone.
(() => {
"use strict";
const RC = window.RC;
const { clamp, lerp, TAU, T, alpha, rr } = RC;
const { Reach, defineArt } = RC.kit;
const M = RC.moves, { scene, icon, lvl } = M;
const forearm = "Strap the phone to the forearm of your affected arm, screen up, or hold it flat in your palm.";
const palm = "Hold the phone flat in your affected hand, screen up, forearm resting on the table.";
const abs = (k) => (a) => Math.abs(a[k]);
const cap = (v, m) => Math.min(v, m);

// Hammer: the nail sinks a little with every strike
const hammerDraw = (g, W, H, o) => {
  const cx = W * 0.42, base0 = H - 80, depth = (o.reps % 4) / 4;
  g.fillStyle = alpha(T.ink, 0.14); rr(g, cx - 160, base0, 320, 40, 8); g.fill();
  g.fillStyle = alpha(T.ink, 0.55); g.fillRect(cx - 5, base0 - 70 + depth * 60, 10, 70 - depth * 60); g.fillRect(cx - 16, base0 - 76 + depth * 60, 32, 8);
  const up = clamp(o.val / Math.max(1, o.targets[0]), -0.2, 1.1);
  g.save(); g.translate(cx + 120, base0 - 70); g.rotate(-up * 1.1); icon(g, "🔨", -70, 0, 70); g.restore();
  RC.txt(g, o.side === 0 ? "Lift" : "Strike!", cx + 60, base0 - 170, 24, T.ink, { font: T.body });
};

const ARM = [
  { id: "shelf", name: "High Shelf", movement: "Shoulder flexion · overhead reach", control: "tilt", mount: forearm,
    desc: "Reach up to put the box on a high shelf, hold it there, then lower your arm.", source: "Fugl-Meyer upper-extremity item (shoulder flexion 90–180°); Wolf Motor Function Test hand-to-box task.",
    how: ["Sit tall with your arm resting on the table.", "Raise your arm forward and up until the box reaches the shelf line.", "Hold while the ring fills, then lower slowly."],
    make: (S) => Reach(S, { signal: (a) => a.pitch, target: (S) => cap(S.amp * 1.6, 75), rest: (S) => S.amp * 0.4, hold: 1.2, label: "Overhead reach", title: "Reach up to the shelf", draw: scene.rise("📦", "Shelf height") }) },
  { id: "comb", name: "Hand to Head", movement: "Shoulder and elbow flexion · grooming", control: "tilt", mount: forearm,
    desc: "Bring your hand up to the top of your head, as if combing your hair, and hold.", source: "Action Research Arm Test gross-movement item (hand to top of head).",
    how: ["Start with your forearm on the table.", "Lift your hand to the top of your head.", "Hold for a moment, then lower."],
    make: (S) => Reach(S, { signal: (a) => a.pitch, target: (S) => cap(S.amp * 1.8, 80), rest: (S) => S.amp * 0.4, hold: 2, label: "Hand to head", title: "Bring your hand to your head", draw: scene.rise("💇", "Top of head") }) },
  { id: "curtains", name: "Open the Curtains", movement: "Shoulder horizontal abduction", control: "tilt", mount: palm.replace(", forearm resting on the table", ", arm straight out in front"),
    desc: "With your arm out in front, sweep it out to the side to open the curtain, then bring it back.", source: "Standard post-stroke shoulder range-of-motion exercise (horizontal abduction).",
    how: ["Hold your arm out in front at chest height.", "Sweep it out to the side as far as is comfortable.", "Hold, then bring it back to the front."],
    make: (S) => Reach(S, { signal: abs("yaw"), target: (S) => S.amp * 1.2, rest: (S) => S.amp * 0.3, hold: 1, label: "Arm sweep", title: "Sweep your arm out to the side", draw: scene.slide("🪟", "Pull the curtain open") }) },
  { id: "gate", name: "Swing the Gate", movement: "Shoulder external rotation", control: "tilt", mount: "Hold the phone flat in your affected hand, elbow bent at your side.",
    desc: "Keep your elbow tucked in and swing your forearm out like a gate, then back in.", source: "Fugl-Meyer upper-extremity item (shoulder external rotation).",
    how: ["Tuck your elbow against your side, bent to a right angle.", "Swing your forearm outward, keeping the elbow in.", "Hold, then swing it back in."],
    make: (S) => Reach(S, { signal: abs("yaw"), target: (S) => S.amp, rest: (S) => S.amp * 0.3, hold: 1, label: "Outward turn", title: "Swing your forearm outward", draw: scene.slide("🚪", "Open the gate") }) },
  { id: "paint", name: "Paint the Fence", movement: "Shoulder and elbow · up-and-down strokes", control: "tilt", mount: forearm,
    desc: "Paint the fence with long up-and-down strokes.", source: "Repetitive task practice with painting strokes (RAPAEL house-painting game).",
    how: ["Hold your arm as if holding a brush.", "Stroke up to the top target.", "Then down to the bottom one. Keep a steady rhythm."],
    make: (S) => M.Swing(S, { signal: (a) => a.pitch, targets: (S) => [S.amp, -S.amp * 0.4], hold: 0.15, cues: ["Brush up", "Brush down"], labels: ["Highest stroke", "Lowest stroke"], emoji: "🖌️", vertical: true }) },
  { id: "hammer", name: "Hammer the Nail", movement: "Elbow flexion and extension · speed", control: "tilt", mount: "Hold the phone in your affected hand like a hammer handle.",
    desc: "Lift the hammer, then bring it down to strike the nail. Four strikes sink each nail.", source: "Task-oriented training with tool use (hammering).",
    how: ["Rest your forearm on the table.", "Lift your hand up by bending at the elbow.", "Bring it down firmly to strike, then lift again."],
    make: (S) => M.Swing(S, { signal: (a) => a.pitch, targets: (S) => [S.amp, S.amp * 0.15], dirs: [1, -1], hold: 0.05, cues: ["Lift the hammer", "Strike!"], labels: ["Highest lift", "Lowest strike"], draw: hammerDraw }) },
  { id: "torch", name: "Hold the Torch", movement: "Shoulder endurance · sustained hold", control: "tilt", mount: forearm,
    desc: "Hold your arm up in the green band like holding a torch, for the whole count.", source: "Sustained shoulder holds for endurance (graded isometric arm training).",
    params: { reps: [3, 5, 8], level: [1, 2, 3], durationS: null }, defaults: { reps: 3, level: 1, durationS: null },
    how: ["Raise your arm until the torch is in the green band.", "Keep it there until the bar fills. Dipping out pauses the count.", "Lower and rest before the next one."],
    make: (S) => M.Hold(S, { signal: (a) => a.pitch, band: (S) => [S.amp * 0.8, S.amp * 1.4], holdS: (S) => lvl(S, { 1: 5, 2: 8, 3: 12 }), restBelow: (S) => S.amp * 0.4, emoji: "🔦", cues: { below: "Raise your arm into the band", above: "A little lower", in: "Hold it there", rest: "Lower your arm and rest" } }) },
  { id: "moon", name: "Follow the Moon", movement: "Smooth arm control · tracking", control: "tilt", mount: forearm,
    desc: "The moon drifts slowly up and down. Raise and lower your arm to stay on it.", source: "Pursuit-tracking tasks from robot-assisted and virtual-reality arm therapy.",
    params: { reps: null, level: [1, 2, 3], durationS: [30, 60, 90] }, defaults: { reps: null, level: 1, durationS: 30 },
    how: ["Rest your forearm on the table.", "Raise or lower your arm to keep the dot inside the moon's ring.", "Smooth, slow movements work best."],
    make: (S) => M.Track(S, { signal: (a) => a.pitch, range: (S) => [0, S.amp * 1.3], emoji: "🌙", cue: "Stay with the moon" }) },
  { id: "stir", name: "Stir the Pot", movement: "Shoulder and elbow circles", control: "tilt", mount: "Hold the phone upright in your affected hand like a big spoon.",
    desc: "Stir the pot in big, slow circles: one way, then the other.", source: "Circle-drawing tasks from robot-assisted arm therapy; Fugl-Meyer circumduction.",
    params: { reps: [4, 6, 10], level: [1, 2, 3], durationS: null }, defaults: { reps: 4, level: 1, durationS: null },
    how: ["Hold the phone like a spoon in a pot.", "Tip it out to the ring and stir all the way round.", "Halfway through, switch direction."],
    make: (S) => M.Circles(S, { emoji: "🥄", cue: "Stir in a big circle" }) },
  { id: "pendulum", name: "Pendulum Swing", movement: "Shoulder mobility · gentle swing", control: "tilt", mount: "Lean forward with your good hand on a table. Let your affected arm hang down, holding the phone.",
    desc: "Let your arm hang and swing it gently side to side, like a pendulum.", source: "Codman pendulum exercises for shoulder mobility.",
    params: { reps: [10, 20, 30], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null },
    how: ["Lean on a table with your good hand.", "Let the affected arm hang loose.", "Swing it gently left and right. Let the body rock it."],
    make: (S) => M.Wave(S, { signal: (a) => a.roll, thr: (S) => S.amp * 0.4, emoji: "🕰️", cues: ["Swing to one side", "Now to the other side"] }) },
  { id: "toss", name: "Bean Bag Toss", movement: "Throwing motion · force control", control: "accel", mount: "Hold the phone firmly in your affected hand (use a wrist strap). Never let go of it.",
    desc: "Make a throwing motion to toss the bag into the target. Harder throws go further.", source: "Graded throwing practice from task-oriented arm training.",
    how: ["Hold the phone tightly. Do not let go.", "Swing your arm forward as if tossing a bean bag.", "Throw harder or softer to land in the green zone."],
    make: (S) => M.Throw(S, { cue: "Toss the bag into the green zone", emoji: "🟠" }) },
  Object.assign({ id: "row", name: "Row the Boat", movement: "Two-arm pull and push", control: "accel", mount: "Hold the phone in both hands like the handles of oars.",
    desc: "Pull both arms back toward your chest, then push them forward again.", source: "Bilateral arm training with rowing movements.",
    how: ["Sit tall holding the phone in both hands.", "Pull back toward your chest.", "Push forward again. That's one stroke."],
    make: (S) => M.Bursts(S, { per: 2, gap: 0.5, cues: ["Pull back", "Push forward"], pics: ["🚣"] }) }, { params: { reps: [10, 15, 20], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } }),
  { id: "apples", name: "Pick the Apples", movement: "Reach, grasp and place", control: "tilt", mount: palm,
    desc: "Reach up to pick an apple, then bring it down to the basket.", source: "Reach-to-grasp practice; Wolf Motor Function Test reach-and-retrieve task.",
    how: ["Tilt to move the pointer to an apple.", "Hold still to pick it.", "Carry it down to the basket and hold still to drop it."],
    make: (S) => M.Pick(S, { items: ["🍎", "🍏", "🍐"], cue: "Pick an apple", carry: "Bring it to the basket" }) },
  Object.assign({ id: "balloons", name: "Pop the Balloons", movement: "Quick reaching · coordination", control: "tilt", mount: palm,
    desc: "Balloons float up. Touch each one with the pointer before it gets away.", source: "Target-popping reaching games used in virtual-reality arm rehab trials.",
    how: ["Tilt to move the pointer.", "Touch a balloon to pop it.", "Go for the highest ones first."],
    make: (S) => M.Pop(S, { items: ["🎈"], cue: "Pop the balloons" }) }, { params: { reps: [10, 15, 25], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } }),
  Object.assign({ id: "dots", name: "Connect the Dots", movement: "Point-to-point reaching", control: "tilt", mount: palm,
    desc: "Steer to each numbered dot in order to draw a star.", source: "Point-to-point reaching targets from robot-assisted arm therapy.",
    how: ["Tilt to move the pointer to dot 1.", "Hold still to join it up.", "Carry on in order until the star is done."],
    make: (S) => M.Dots(S) }, { params: { reps: [8, 12, 16], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } }),
  { id: "window", name: "Clean the Window", movement: "Wide reaching · wiping", control: "tilt", mount: palm,
    desc: "Wipe the whole window clean with the sponge.", source: "Table- and window-wiping shaping tasks from constraint-induced movement therapy.",
    params: { reps: [5, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null },
    how: ["Tilt to move the sponge.", "Wipe over every dirty patch.", "Reach into the corners too."],
    make: (S) => M.Cover(S, { cue: "Wipe the window clean", unit: "Windows", emoji: "🧽" }) },
  Object.assign({ id: "fruit", name: "Fruit Catch", movement: "Side-to-side control · timing", control: "tilt", mount: palm,
    desc: "Tip your hand left and right to move the basket under the falling fruit.", source: "Catching games used in Kinect and virtual-reality stroke rehab studies.",
    how: ["Rest your forearm on the table.", "Tip your hand left or right to move the basket.", "Get under each piece of fruit before it lands."],
    make: (S) => M.Catch(S, { signal: (a) => a.roll, cue: "Catch the fruit" }) }, { params: { reps: [10, 15, 20], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } }),
  Object.assign({ id: "kite", name: "Fly the Kite", movement: "Up-and-down arm control", control: "tilt", mount: forearm,
    desc: "Raise and lower your arm to fly the kite through each gap.", source: "Continuous steering games from smartphone and virtual-reality arm rehab.",
    how: ["Rest your forearm on the table.", "Raise your arm to fly higher, lower it to dip.", "Line up with each gap before it arrives."],
    make: (S) => M.Steer(S, { signal: (a) => a.pitch - S.amp * 0.6, vertical: true, emoji: "🪁", cue: "Fly through the gaps" }) }, { params: { reps: [10, 15, 20], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } }),
  Object.assign({ id: "quickreach", name: "Quick Reach", movement: "Reaction speed · reaching", control: "tilt", mount: palm,
    desc: "Hold still in the middle. When the arrow appears, reach that way as fast as you can.", source: "Choice-reaction reaching for movement speed (common in robot and VR arm therapy).",
    how: ["Rest in the middle until the arrow shows.", "Reach quickly toward the arrow.", "Come back to the middle and wait for the next one."],
    make: (S) => M.Direction(S, { cue: "Hold still in the middle" }) }, { params: { reps: [8, 12, 16], level: [1, 2, 3], durationS: null }, defaults: { reps: 8, level: 1, durationS: null } }),
  { id: "letters", name: "Write Letters", movement: "Fine arm control · pre-writing", control: "tilt", mount: palm,
    desc: "Steer the dot along the shape of a letter or number.", source: "Letter-tracing pre-writing practice used in occupational therapy.",
    params: { reps: [5, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null },
    how: ["Rest your forearm on the table.", "Start at the orange dot.", "Follow the letter's line to the end."],
    make: (S) => M.Path(S, { set: "letters", cue: "Write the letter" }) },
  { id: "reachturn", name: "Reach and Turn", movement: "Reach, then forearm rotation", control: "tilt", mount: forearm,
    desc: "Reach up for the door handle, then turn your hand to open it.", source: "Wolf Motor Function Test (turning a key in a lock); reach-and-manipulate task practice.",
    how: ["Start with your forearm on the table.", "Lift your arm to reach the handle.", "Turn your palm to open it, then come back to rest."],
    make: (S) => M.Seq(S, { steps: (S) => [{ axis: "pitch", target: S.amp, hold: 0.6, cue: "Reach up for the handle", short: "Reach", emoji: "🚪" }, { axis: "roll", target: S.amp, hold: 0.8, cue: "Turn your hand to open it", short: "Turn", emoji: "🔄" }], restCue: "Lower your arm to rest" }) },
  { id: "nose", name: "Finger to Nose", movement: "Coordination · elbow flexion and extension", control: "tilt", mount: "Hold the phone in your affected hand with your pointer finger along its edge.",
    desc: "Touch your nose, then reach out in front of you, back and forth.", source: "Fugl-Meyer coordination test (finger to nose).",
    how: ["Start with your arm out in front.", "Bring your finger to your nose.", "Reach straight out again. Smooth and steady."],
    make: (S) => M.Swing(S, { signal: (a) => a.pitch, targets: (S) => [cap(S.amp * 1.6, 75), S.amp * 0.3], dirs: [1, -1], hold: 0.3, cues: ["Touch your nose", "Reach out in front"], labels: ["Nose", "Reach"], emoji: "👃", vertical: true }) },
];
ARM.forEach((d) => RC.register(Object.assign({ section: "arm" }, d)));

defineArt("shelf", '<path d="M20 16 H100" stroke="var(--a-ink)" stroke-width="3"/><rect x="54" y="20" width="18" height="14" rx="2" fill="var(--a-hi)"/><path d="M63 54 V38" stroke="var(--a-go)" stroke-width="2" stroke-dasharray="3 3"/>');
defineArt("comb", '<circle cx="60" cy="30" r="14" fill="var(--a-mute)" opacity=".3"/><path d="M46 18 q14 -10 28 0" stroke="var(--a-hi)" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="50" y="46" width="20" height="10" rx="4" fill="var(--a-mute)" opacity=".3"/>');
defineArt("curtains", '<rect x="24" y="8" width="72" height="48" rx="3" fill="var(--a-mute)" opacity=".12"/><path d="M24 8 q10 24 0 48 h14 q-6 -24 0 -48z" fill="var(--a-hi)"/><path d="M96 8 q-4 24 0 48 h-30 q8 -24 0 -48z" fill="var(--a-hi)" opacity=".5"/>');
defineArt("gate", '<path d="M30 54 V14 M30 20 L78 14 M30 48 L78 42 M78 14 V42" stroke="var(--a-hi)" stroke-width="3" fill="none"/><path d="M84 30 a10 10 0 0 1 4 12" stroke="var(--a-ink)" stroke-width="2" fill="none"/>');
defineArt("paint", '<path d="M30 54 V14 M46 54 V14 M62 54 V14 M78 54 V14" stroke="var(--a-mute)" stroke-width="10" stroke-opacity=".25"/><path d="M62 54 V24" stroke="var(--a-hi)" stroke-width="10"/><path d="M90 16 V40" stroke="var(--a-ink)" stroke-width="2" stroke-dasharray="3 3"/>');
defineArt("hammer", '<rect x="20" y="48" width="80" height="8" rx="2" fill="var(--a-mute)" opacity=".3"/><path d="M48 48 V36 M43 36 H53" stroke="var(--a-ink)" stroke-width="3"/><path d="M70 16 L56 32" stroke="var(--a-ink)" stroke-width="4" stroke-linecap="round"/><rect x="64" y="8" width="18" height="10" rx="2" fill="var(--a-hi)" transform="rotate(40 73 13)"/>');
defineArt("torch", '<rect x="36" y="14" width="48" height="16" rx="4" fill="var(--a-go)" opacity=".2" stroke="var(--a-go)"/><circle cx="60" cy="22" r="6" fill="var(--a-hi)"/><path d="M60 30 V54" stroke="var(--a-mute)" stroke-width="3"/>');
defineArt("moon", '<path d="M14 40 C34 10 50 10 66 30 S98 50 108 20" stroke="var(--a-hi)" stroke-width="6" stroke-opacity=".35" fill="none" stroke-linecap="round"/><circle cx="66" cy="30" r="8" fill="none" stroke="var(--a-hi)" stroke-width="3"/><circle cx="66" cy="31" r="3" fill="var(--a-ink)"/>');
defineArt("stir", '<ellipse cx="60" cy="40" rx="30" ry="12" fill="var(--a-mute)" opacity=".25"/><ellipse cx="60" cy="38" rx="20" ry="6" fill="none" stroke="var(--a-hi)" stroke-width="2.5" stroke-dasharray="4 3"/><path d="M66 38 L80 8" stroke="var(--a-ink)" stroke-width="4" stroke-linecap="round"/>');
defineArt("pendulum", '<path d="M60 6 L44 46" stroke="var(--a-ink)" stroke-width="3"/><circle cx="44" cy="48" r="7" fill="var(--a-hi)"/><path d="M34 56 Q60 64 86 56" stroke="var(--a-mute)" stroke-width="2" fill="none" stroke-dasharray="3 3"/>');
defineArt("toss", '<path d="M24 46 Q60 -6 92 40" stroke="var(--a-mute)" stroke-width="2" fill="none" stroke-dasharray="3 4"/><circle cx="58" cy="17" r="6" fill="var(--a-hi)"/><rect x="80" y="42" width="24" height="8" rx="3" fill="var(--a-go)" opacity=".5"/>');
defineArt("row", '<path d="M20 44 Q60 58 100 44" stroke="var(--a-hi)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M34 14 L52 46 M86 14 L68 46" stroke="var(--a-ink)" stroke-width="3" stroke-linecap="round"/>');
defineArt("apples", '<circle cx="60" cy="22" r="20" fill="var(--a-go)" opacity=".2"/><circle cx="50" cy="18" r="5" fill="var(--a-hi)"/><circle cx="68" cy="26" r="5" fill="var(--a-hi)"/><path d="M48 46 h24 l-3 12 h-18z" fill="var(--a-mute)" opacity=".4"/>');
defineArt("balloons", '<ellipse cx="44" cy="22" rx="9" ry="11" fill="var(--a-hi)"/><ellipse cx="74" cy="30" rx="8" ry="10" fill="var(--a-hi)" opacity=".5"/><path d="M44 33 q-3 10 2 20 M74 40 q3 8 -1 16" stroke="var(--a-mute)" stroke-width="1.5" fill="none"/><circle cx="54" cy="14" r="3" fill="var(--a-ink)"/>');
defineArt("dots", '<path d="M60 8 L68 26 L88 28 L72 40" stroke="var(--a-go)" stroke-width="2.5" fill="none"/>' + [[60, 8], [68, 26], [88, 28], [72, 40], [78, 58], [60, 48], [42, 58], [48, 40], [32, 28], [52, 26]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${i < 4 ? "var(--a-go)" : i === 4 ? "var(--a-hi)" : "var(--a-mute)"}"/>`).join(""));
defineArt("window", '<rect x="26" y="8" width="68" height="48" rx="3" fill="var(--a-mute)" opacity=".35"/><path d="M26 8 h40 v48 h-40z" fill="var(--a-bg)"/><path d="M60 8 v48 M26 32 h68" stroke="var(--a-ink)" stroke-width="2"/><rect x="58" y="24" width="14" height="10" rx="3" fill="var(--a-hi)"/>');
defineArt("fruit", '<circle cx="74" cy="14" r="6" fill="var(--a-hi)"/><path d="M74 22 V34" stroke="var(--a-mute)" stroke-width="2" stroke-dasharray="2 3"/><path d="M58 44 h32 l-4 12 h-24z" fill="var(--a-hi)" opacity=".5"/>');
defineArt("kite", '<path d="M86 30 h10 M86 6 v14 M86 40 v18" stroke="var(--a-hi)" stroke-width="5" stroke-linecap="round"/><path d="M40 20 l10 -10 l10 10 l-10 14z" fill="var(--a-hi)"/><path d="M50 34 q-6 10 -18 14" stroke="var(--a-mute)" stroke-width="1.5" fill="none"/>');
defineArt("quickreach", '<circle cx="60" cy="32" r="22" fill="var(--a-mute)" opacity=".1"/><path d="M60 32 H84" stroke="var(--a-hi)" stroke-width="5" stroke-linecap="round"/><path d="M80 24 L90 32 L80 40" fill="var(--a-hi)"/><circle cx="60" cy="32" r="4" fill="var(--a-ink)"/>');
defineArt("letters", '<path d="M40 52 L40 12 L80 52 L80 12" stroke="var(--a-mute)" stroke-opacity=".3" stroke-width="8" fill="none" stroke-linejoin="round"/><path d="M40 52 L40 12 L60 32" stroke="var(--a-go)" stroke-width="3" fill="none"/><circle cx="60" cy="32" r="4" fill="var(--a-hi)"/>');
defineArt("reachturn", '<rect x="58" y="10" width="34" height="8" rx="4" fill="var(--a-hi)"/><path d="M30 54 L54 22" stroke="var(--a-ink)" stroke-width="4" stroke-linecap="round"/><path d="M48 12 a10 10 0 1 1 -6 14" stroke="var(--a-go)" stroke-width="2.5" fill="none"/>');
defineArt("nose", '<circle cx="36" cy="28" r="16" fill="var(--a-mute)" opacity=".25"/><path d="M50 30 L96 30" stroke="var(--a-hi)" stroke-width="3" stroke-dasharray="4 4"/><circle cx="52" cy="30" r="4" fill="var(--a-hi)"/><circle cx="96" cy="30" r="4" fill="var(--a-hi)" opacity=".5"/>');
})();
