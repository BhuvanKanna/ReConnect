// How to hold the phone for each exercise: one picture and one sentence per position, shared by
// the computer (setup sheet) and the phone (shown while you get into position and calibrate).
// Pictures are simple side views with the person facing right, so "forward" is to the right.
// The phone is drawn as a bar whose bright edge is the screen; the dark tip is its top edge.
// flip.roll: the screen faces away from you, so the phone's own right is your left.
(() => {
"use strict";
const RC = (window.RC = window.RC || {});

// ---- drawing pieces (viewBox 0 0 200 150)
const limb = (x1, y1, x2, y2, w = 12) => `<line class="pz-b" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w}"/>`;
const dot = (x, y, r) => `<circle class="pz-f" cx="${x}" cy="${y}" r="${r}"/>`;
const line = (x1, y1, x2, y2) => `<line class="pz-g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const label = (x, y, s, anchor = "middle") => `<text class="pz-t" x="${x}" y="${y}" text-anchor="${anchor}">${s}</text>`;
// Phone seen edge-on: centre (x, y), length, angle in degrees (0 = top edge pointing right),
// screen on the side given by `face` (-1 = the side that is up when angle is 0, 1 = down).
function bar(x, y, len, ang, face = -1) {
  const h = len / 2;
  return `<g transform="translate(${x} ${y}) rotate(${ang})"><rect class="pz-p" x="${-h}" y="-4" width="${len}" height="8" rx="2.5"/>` +
    `<rect class="pz-s" x="${-h + 3}" y="${face < 0 ? -4 : 2}" width="${len - 6}" height="2.4" rx="1"/><rect class="pz-top" x="${h - 4}" y="-4" width="4" height="8" rx="1.5"/></g>`;
}
// Phone seen face-on (screen toward you), top edge at the top unless rotated.
function face(x, y, w, h, ang = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${ang})"><rect class="pz-p" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="5"/>` +
    `<rect class="pz-scr" x="${-w / 2 + 3}" y="${-h / 2 + 6}" width="${w - 6}" height="${h - 12}" rx="2"/><rect class="pz-top" x="${-w / 6}" y="${-h / 2 + 1.5}" width="${w / 3}" height="2.5" rx="1"/></g>`;
}
const table = (x1, x2, y) => `<line class="pz-g" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke-width="3"/><line class="pz-g" x1="${x1 + 14}" y1="${y}" x2="${x1 + 14}" y2="148" stroke-width="3"/>`;
const chair = (x, y) => `<path class="pz-g" d="M${x - 30} ${y} H${x + 8} M${x - 30} ${y} V${y - 50} M${x - 26} ${y} V148 M${x + 4} ${y} V148" fill="none" stroke-width="3"/>`;
const seated = (hx = 46, hy = 22) => dot(hx, hy, 11) + limb(hx, hy + 12, hx, hy + 70, 14) + limb(hx, hy + 70, hx + 46, hy + 72, 14) + limb(hx + 46, hy + 72, hx + 48, hy + 118, 12);

const POSES = {
  handleTable: {
    name: "Pan-handle grip, forearm on the table",
    text: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up. Rest your forearm on the table.",
    svg: () => table(20, 196, 106) + dot(30, 22, 11) + limb(30, 34, 34, 92, 14) + limb(34, 70, 62, 100) + limb(62, 100, 118, 100) + dot(124, 98, 9) + bar(150, 96, 44, 0) + label(150, 82, "screen up") + label(120, 132, "thumb on top"),
  },
  handleArm: {
    name: "Pan-handle grip, arm free",
    text: "Grip the bottom of the phone in your fist like a pan handle: thumb on top, phone flat and pointing straight ahead, screen up.",
    svg: () => seated() + limb(48, 44, 110, 50) + dot(116, 50, 9) + bar(142, 48, 44, 0) + label(142, 34, "screen up") + label(150, 70, "top edge points ahead"),
  },
  handleHang: {
    name: "Pan-handle grip, arm hanging",
    text: "Grip the bottom of the phone in your fist, thumb forward, and let your arm hang straight down at your side, so the phone points at the floor with the screen facing forward.",
    svg: () => dot(80, 18, 11) + limb(80, 30, 80, 96, 16) + limb(80, 96, 80, 146, 12) + limb(86, 38, 92, 92) + dot(93, 98, 8) + bar(93, 124, 40, 90, -1) + label(128, 128, "screen faces", "start") + label(128, 142, "forward", "start"),
  },
  palm: {
    name: "Flat on your open palm",
    text: "Lay the phone flat on your open palm, screen up, top edge toward your fingertips. Rest your forearm on the table.",
    svg: () => table(20, 196, 106) + dot(30, 22, 11) + limb(30, 34, 34, 92, 14) + limb(34, 70, 62, 100) + limb(62, 100, 120, 100) + limb(120, 99, 160, 99, 6) + bar(142, 91, 44, 0) + label(142, 76, "screen up"),
  },
  palmDown: {
    name: "Under your palm, screen down",
    text: "Put your hand on top of the phone, palm down, and grip its sides: screen facing the table, top edge toward your fingertips. Rest your forearm on the table.",
    svg: () => table(20, 196, 106) + dot(30, 22, 11) + limb(30, 34, 34, 92, 14) + limb(34, 70, 62, 94) + limb(62, 94, 118, 94) + limb(118, 93, 160, 93, 6) + bar(142, 100, 44, 0, 1) + label(142, 126, "screen faces the table"),
  },
  edgeDown: {
    name: "Hand past the table edge, palm down",
    text: "Rest your forearm on the table with your wrist just past the edge. Palm down, grip the phone flat against your palm: screen facing the floor, top edge toward your fingertips.",
    svg: () => `<path class="pz-g" d="M10 100 H112 V148" fill="none" stroke-width="3"/>` + dot(24, 22, 11) + limb(24, 34, 28, 90, 14) + limb(28, 70, 54, 90) + limb(54, 90, 110, 90) + limb(112, 90, 150, 90, 7) + bar(134, 98, 40, 0, 1) + label(150, 124, "screen faces the floor") + label(60, 118, "table edge"),
  },
  upright: {
    name: "Upright in your fist",
    text: "Hold the phone upright in your fist, top edge up, screen facing you.",
    svg: () => face(100, 52, 40, 76) + `<rect class="pz-f" x="80" y="88" width="40" height="30" rx="12"/>` + limb(100, 118, 100, 148, 16) + label(152, 52, "screen", "start") + label(152, 66, "facing you", "start"),
  },
  pinch: {
    name: "Pinched at its bottom edge",
    text: "Pinch the bottom edge of the phone between your thumb (on top) and fingers, so it points straight ahead, screen up. Rest your forearm on the table.",
    svg: () => table(20, 196, 106) + dot(30, 22, 11) + limb(30, 34, 34, 92, 14) + limb(34, 70, 62, 100) + limb(62, 100, 116, 100) + limb(116, 96, 130, 92, 5) + limb(116, 102, 130, 100, 5) + bar(154, 96, 44, 0) + label(154, 82, "screen up") + label(122, 128, "thumb and fingers pinch the end"),
  },
  twoHands: {
    name: "Flat in both hands",
    text: "Hold the phone flat between both hands, one on each side, screen up, top edge pointing away from you.",
    svg: () => label(100, 14, "seen from above: top edge away from you") + face(100, 78, 46, 84) + `<ellipse class="pz-f" cx="68" cy="88" rx="12" ry="20"/><ellipse class="pz-f" cx="132" cy="88" rx="12" ry="20"/>` + label(100, 140, "screen up"),
  },
  towel: {
    name: "Sideways in both hands",
    text: "Hold the phone sideways, long edge from left to right, with one hand at each end, screen up.",
    svg: () => label(100, 18, "seen from above") + face(100, 78, 44, 104, 90) + `<ellipse class="pz-f" cx="42" cy="78" rx="14" ry="20"/><ellipse class="pz-f" cx="158" cy="78" rx="14" ry="20"/>` + label(100, 132, "screen up"),
  },
  wheel: {
    name: "Upright in both hands",
    text: "Hold the phone upright (tall) in both hands, one on each side, screen facing you.",
    svg: () => face(100, 70, 44, 82) + `<ellipse class="pz-f" cx="70" cy="80" rx="12" ry="22"/><ellipse class="pz-f" cx="130" cy="80" rx="12" ry="22"/>` + label(100, 132, "screen facing you, top edge up") + label(100, 146, "turn it like a steering wheel"),
  },
  table: {
    name: "Flat on the table",
    text: "Lay the phone flat on the table in front of you, screen up.",
    svg: () => label(100, 14, "seen from above") + `<rect class="pz-g" x="20" y="24" width="160" height="112" rx="6" fill="none" stroke-width="2"/>` + face(110, 80, 38, 70) + `<ellipse class="pz-f" cx="110" cy="96" rx="24" ry="18" opacity=".55"/>` + limb(110, 112, 90, 150, 16),
  },
  chest: {
    name: "Against your chest",
    text: "Hold the phone flat against your breastbone (or tuck it upright in a shirt pocket), screen facing out, top edge up.",
    flip: { roll: true },
    svg: () => dot(70, 20, 12) + `<path class="pz-f" d="M58 36 Q90 36 92 60 L90 104 Q76 112 58 108 Z"/>` + bar(98, 62, 40, -90, 1) + label(108, 46, "screen faces out", "start") + label(108, 60, "top edge up", "start") + limb(64, 108, 64, 146, 14),
  },
  head: {
    name: "On top of your head",
    text: "Hold the phone flat on top of your head with one hand, screen up, top edge pointing forward.",
    svg: () => `<circle class="pz-f" cx="90" cy="70" r="30"/><path class="pz-f" d="M74 98 L106 98 L112 146 L68 146 Z"/>` + bar(92, 36, 46, 0) + limb(56, 128, 52, 70, 10) + limb(52, 70, 78, 40, 9) + label(92, 20, "screen up, top edge forward"),
  },
  belly: {
    name: "Against your lower belly",
    text: "Sit tall and hold the phone flat against your lower belly, screen facing out, top edge up.",
    flip: { roll: true },
    svg: () => chair(60, 108) + seated(56, 22) + bar(80, 82, 34, -90, 1) + label(92, 62, "screen faces out", "start") + label(92, 76, "top edge up", "start"),
  },
  pocket: {
    name: "In your front trouser pocket",
    text: "Put the phone in the front trouser pocket on your affected side.",
    svg: () => dot(90, 16, 11) + limb(90, 28, 90, 82, 16) + limb(90, 82, 90, 146, 14) + `<rect class="pz-p" x="96" y="88" width="9" height="34" rx="2.5"/>` + label(112, 106, "front pocket", "start"),
  },
  thigh: {
    name: "Flat on your thigh",
    text: "Sitting, lay the phone flat on top of your affected thigh near the knee, screen up, top edge toward the knee. A strap or tight pocket helps keep it there.",
    svg: () => chair(60, 108) + seated(56, 22) + bar(90, 87, 30, 0) + label(120, 72, "top edge toward the knee") + label(96, 60, "screen up"),
  },
  thighLying: {
    name: "On your thigh, lying down",
    text: "Lie on your back with your knees bent and lay the phone flat on your affected thigh, screen up, top edge toward the knee.",
    svg: () => `<line class="pz-g" x1="6" y1="124" x2="196" y2="124" stroke-width="3"/>` + dot(22, 106, 11) + limb(34, 110, 96, 110, 15) + limb(96, 110, 134, 76, 14) + limb(134, 76, 164, 116, 12) + bar(118, 86, 30, -42) + label(110, 40, "screen up") + label(110, 54, "top edge toward the knee"),
  },
  shin: {
    name: "On the front of your shin",
    text: "Strap the phone to the front of your affected shin just below the knee, or tuck it into a long sock, screen facing out.",
    svg: () => chair(60, 108) + seated(56, 22) + bar(112, 116, 30, -90, 1) + label(122, 104, "screen", "start") + label(122, 118, "faces out", "start"),
  },
  foot: {
    name: "On top of your foot",
    text: "Lay the phone flat on top of your affected foot, screen up, top edge toward your toes, held by a sock or a band.",
    svg: () => limb(70, 10, 74, 118, 14) + `<path class="pz-f" d="M64 112 L82 108 Q130 116 150 132 L150 140 L64 140 Z"/>` + bar(112, 112, 34, 14) + label(150, 70, "screen up") + label(150, 84, "top edge toward your toes") + line(20, 141, 190, 141),
  },
  sideLying: {
    name: "On your side, phone on your top leg",
    text: "Lie on your side with the affected leg on top. Lay the phone flat on the outside of your top thigh near the knee, screen up.",
    svg: () => `<line class="pz-g" x1="6" y1="128" x2="196" y2="128" stroke-width="3"/>` + dot(24, 104, 11) + limb(36, 108, 98, 108, 16) + limb(98, 108, 140, 96, 14) + limb(140, 96, 176, 116, 12) + bar(122, 88, 30, -16) + label(118, 66, "screen up, on the outside of the thigh"),
  },
};

// Which position each motion exercise uses. Touch-pad and follow-along exercises have none.
const USE = {
  handleTable: "pour lock maze key pages pancake screw radio water doorknob jar faucet bike sail hourglass reel hitchhike lever hammer griphold simon sort trail pairs tower rotate ruleswitch cancel",
  handleArm: "lift shelf comb paint torch moon kite reachturn wallslide drawsword seatbelt curl spotlight rainbow ladder zipper gate curtains nose pressdown toss jab bowling darts freethrow saw flag conductor swim bandrow tennis ringbell brushteeth push reach trace apples balloons dots window fruit quickreach letters goalie eggs groceries blocks stars roller clockreach cupstack flies shapes flick frisbee cast whisk salt maracas pingpong bulb soup shake passhands",
  handleHang: "sideraise pendulum airplane",
  palm: "steady",
  palmDown: "wiper",
  edgeDown: "wristbend wave drawbridge flashlight wristcircle thermostat scoophold plane",
  upright: "cupmouth fill stir pengrip",
  pinch: "pinchhold cointurn cardflip boltpinch",
  twoHands: "bowl golf wandlift sanding row",
  towel: "wring",
  wheel: "wheel",
  table: "slide liftplace",
  chest: "lean twist sit2stand balance floor sidereach rock trunkcircle standshift standreach leanhold crossreach lookback sidebendhold chestup tandem onelegstand slalom header followsway conereach turnaround",
  head: "neckturn nod gaze eartilt",
  belly: "pelvictilt hipcircles",
  pocket: "march marchstand minisquat stepups sidesteps backsteps",
  thigh: "kneeout kneelift cycling wallsit",
  thighLying: "bridge bridgehold kneerolls",
  shin: "kneeext penalty heelslide slr",
  foot: "foottilt ankletrace toetap anklecircles anklerock gaspedal heeltoe toeshold",
  sideLying: "clamshell sidelegs",
};
const POSE_OF = {};
for (const [p, ids] of Object.entries(USE)) for (const id of ids.split(/\s+/)) POSE_OF[id] = p;

// Pointing exercises steer left and right by turning the phone (yaw) instead of tipping it
// (roll), so the whole arm reaches, the way you would aim a torch or a remote.
const POINT = new Set("reach trace apples balloons dots window fruit quickreach letters goalie eggs groceries blocks stars roller clockreach cupstack flies shapes swim flashlight wristcircle".split(" "));
// Exercises whose directions are anatomical (palm up, across the body, outer edge of the foot):
// for a left affected side, roll and yaw are mirrored so the cue means the same movement.
const MIRROR = new Set("drawsword seatbelt tennis pingpong pages hourglass cardflip anklerock".split(" "));

function svg(id) {
  const p = POSES[id];
  return p ? `<svg class="pose-art" viewBox="0 0 200 150" role="img" aria-label="${p.name}">${p.svg()}</svg>` : "";
}
const poseOf = (def) => (def && (def.pose || POSE_OF[def.id])) || null;
const poseFlip = (def) => { const p = POSES[poseOf(def)]; return (p && p.flip) || null; };

RC.poses = { POSES, POSE_OF, POINT, MIRROR, svg, poseOf };
RC.poseFlip = poseFlip;
})();
