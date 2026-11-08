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

// ---- Ear to Shoulder: a balance game (3D scene in js/tilt3d.js)
// The picture slowly tips to one side, tipping the board so the beach ball starts to roll. Tip your head
// the other way to bring the picture back level, and hold it there. Then the picture eases back and tips
// the other way. One side and then the other is one repetition. Draws a flat version until 3D is ready.
function EarBalance(S) {
  const { base, bg } = RC.kit, { clamp, TAU, T, alpha, rr } = RC;
  const G = base(S, S.reps), amp = S.amp, D = amp * 0.6, HOLD = 1.5, TOL = Math.max(4, amp * 0.18);
  const RATE = D / 3.5, ROLLK = { 1: 1.3, 2: 1.8, 3: 2.2 }[S.level] || 1.8;
  const B = RC.Tilt3D, quality = RC.Scene3D ? RC.Scene3D.quality() : { sample: () => 2 };
  if (B) B.ensure();
  let k = 0, phase = "tip", drift = 0, roll = 0, net = 0, hold = 0, ballX = 0, ballV = 0, fallT = -1, fallSide = 1, spawnT = 9, falls = 0;
  let levelT = 0, total = 0, ext = [0, 0], lastT = null, world = null, sparkle = [], cheer = 0;
  const dir = () => (k % 2 === 0 ? 1 : -1); // +1: the picture turns clockwise, so the head tips left to fix it
  G.update = function (dt, a) {
    roll = a.roll; ext = [Math.min(ext[0], roll), Math.max(ext[1], roll)];
    const goal = phase === "back" ? 0 : dir() * D;
    drift += clamp(goal - drift, -RATE * dt * (phase === "back" ? 1.6 : 1), RATE * dt * (phase === "back" ? 1.6 : 1));
    if (phase === "tip" && Math.abs(drift - goal) < 0.01) phase = "hold";
    if (phase === "back" && Math.abs(drift) < 0.01) phase = "tip";
    net = drift + roll; total += dt;
    const level = Math.abs(net) < TOL; if (level) levelT += dt;
    if (phase === "hold") {
      if (level && fallT < 0) hold += dt; else hold = Math.max(0, hold - dt);
      if (hold >= HOLD) {
        hold = 0; k++; phase = "back"; cheer = 1; burst();
        if (k % 2 === 0) { this._reps++; this.events.push("success"); if (this._reps >= S.reps) this.done = true; } else this.events.push("tick");
      }
    } else hold = 0;
    // the ball rolls toward the low end of the board; a slight dip in the middle settles it back
    spawnT += dt; cheer = Math.max(0, cheer - dt);
    if (fallT < 0) {
      ballV += (ROLLK * Math.sin(net * Math.PI / 180) - 0.4 * ballX) * dt; ballV *= 1 - Math.min(1, 1.3 * dt); ballX += ballV * dt;
      if (Math.abs(ballX) > 1) { fallT = 0; fallSide = Math.sign(ballX); falls++; hold = 0; this.events.push("error"); }
    } else if ((fallT += dt) > 1.6) { fallT = -1; ballX = 0; ballV = 0; spawnT = 0; }
  };
  G.status = function () {
    if (fallT >= 0) return { title: "Oops! The ball rolled off", text: "Here comes another one", tone: "warn" };
    if (phase === "back") return { title: "Good! Now lift your head up straight", text: `${G._reps} of ${S.reps} done`, tone: "good" };
    const need = dir() > 0 ? "left" : "right";
    if (phase === "hold" && Math.abs(net) < TOL) return { title: "Level! Hold it there", text: "Keep the ball on the board", tone: "good" };
    if (Math.sign(net) === -dir() && Math.abs(net) >= TOL) return { title: "A little less", text: "Ease your head back a bit" };
    return { title: `Tip your head to the ${need}`, text: "Make the picture level again" };
  };
  G.stats = () => [["Head tipped left", `${Math.round(-ext[0])}°`], ["Head tipped right", `${Math.round(ext[1])}°`], ["Time level", `${Math.round(100 * levelT / Math.max(1, total))}%`], ["Balls dropped", String(falls)]];
  G.dispose = () => { if (world) { world.dispose(); world = null; } };
  G.debug = () => ({ kind: "value", target: -drift, val: roll, phase, net, ballX, view: world ? "3d" : "2d", quality: quality.level });
  G.draw = function (g, W, H, a, t) {
    const raw = lastT == null ? 0 : t - lastT, dt = Math.min(0.05, Math.max(0, raw)); lastT = t;
    const q = world ? quality.sample() : 0;
    if (q >= 2 && world) { world.dispose(); world = null; RC.Scene3D.off = true; }
    if (!world && !RC.Scene3D.off && B && B.ready()) world = B.create({ calm: RC.reduceMotion });
    const unit = Math.min(W, H) / 600;
    let bx = W / 2, by = H * 0.55;
    if (world) {
      world.lowQuality(q >= 1);
      const pr = (g.getTransform ? g.getTransform().a : 1) * (q >= 1 ? 0.6 : 1);
      g.drawImage(world.frame(W, H, pr, { net, ballX, fallT, fallSide, spawnT }, t, dt), 0, 0, W, H);
      const p = world.ballScreen(W, H); bx = p.x; by = p.y;
    } else drawFlat(g, W, H);
    level(g, W, H, unit, t);
    sparkle = sparkle.filter((s) => (s.life -= dt) > 0); sparkle.forEach((s) => { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 70 * dt; });
    g.fillStyle = "#ffd27a"; sparkle.forEach((s) => { g.globalAlpha = clamp(s.life / 0.9, 0, 1); g.beginPath(); g.arc(bx + s.x * unit, by + s.y * unit, 5 * unit, 0, TAU); g.fill(); }); g.globalAlpha = 1;
  };
  function burst() { if (RC.reduceMotion) return; for (let i = 0; i < 24; i++) { const ang = Math.random() * TAU, v = 60 + Math.random() * 120; sparkle.push({ x: 0, y: 0, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 50, life: 0.9 }); } }
  // A spirit level fixed to the screen: the bubble shows how tipped the picture is; middle = level.
  // A curved arrow beside it shows which way to tip your head.
  function level(g, W, H, unit, t) {
    const w = Math.min(W * 0.5, 420 * unit), h = 46 * unit, x = W / 2 - w / 2, y = H - h - 26 * unit, ok = Math.abs(net) < TOL;
    g.save();
    g.fillStyle = "rgba(20,24,40,0.55)"; rr(g, x - 10 * unit, y - 10 * unit, w + 20 * unit, h + 20 * unit, (h + 20 * unit) / 2); g.fill();
    g.fillStyle = ok ? "rgba(140,240,180,0.9)" : "rgba(230,240,170,0.9)"; rr(g, x, y, w, h, h / 2); g.fill();
    const zw = (TOL / (D * 1.6)) * w;
    g.strokeStyle = "rgba(20,40,30,0.7)"; g.lineWidth = 3 * unit; g.beginPath(); g.moveTo(W / 2 - zw, y + 6 * unit); g.lineTo(W / 2 - zw, y + h - 6 * unit); g.moveTo(W / 2 + zw, y + 6 * unit); g.lineTo(W / 2 + zw, y + h - 6 * unit); g.stroke();
    const bxp = W / 2 + clamp(-net / (D * 1.6), -0.5, 0.5) * (w - h);
    g.fillStyle = "rgba(255,255,255,0.95)"; g.beginPath(); g.ellipse(bxp, y + h / 2, h * 0.62, h * 0.36, 0, 0, TAU); g.fill();
    if (phase === "hold" && hold > 0) { g.strokeStyle = "#2fbf72"; g.lineWidth = 7 * unit; g.lineCap = "round"; g.beginPath(); g.arc(W / 2, y + h / 2, h * 0.9, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(hold / HOLD, 0, 1)); g.stroke(); }
    g.restore();
    // turn arrow: shows the way to tip the head (counter-clockwise = left)
    if (phase !== "back" && !ok && fallT < 0) {
      const sgn = Math.sign(net), cx = W / 2, cy = H * 0.7, R = Math.min(W, H) * 0.34, a0 = -Math.PI / 2 + sgn * 0.35, a1 = -Math.PI / 2 - sgn * 0.35;
      g.save(); g.lineCap = "round"; g.globalAlpha = 0.6 + 0.3 * Math.sin(t * 4);
      for (const [lw, c] of [[18 * unit, "rgba(20,16,40,0.6)"], [10 * unit, "#ffd27a"]]) {
        g.lineWidth = lw; g.strokeStyle = c; g.beginPath(); g.arc(cx, cy, R, Math.min(a0, a1), Math.max(a0, a1)); g.stroke();
        const ex = cx + Math.cos(a1) * R, ey = cy + Math.sin(a1) * R, tx = -Math.sin(a1) * -sgn, ty = Math.cos(a1) * -sgn, s = 26 * unit;
        g.beginPath(); g.moveTo(ex - tx * s - ty * s * 0.7, ey - ty * s + tx * s * 0.7); g.lineTo(ex + tx * s * 0.2, ey + ty * s * 0.2); g.lineTo(ex - tx * s + ty * s * 0.7, ey - ty * s - tx * s * 0.7); g.stroke();
      }
      g.restore();
    }
  }
  function drawFlat(g, W, H) {
    bg(g, W, H);
    g.save(); g.translate(W / 2, H * 0.55); g.rotate(net * Math.PI / 180);
    g.fillStyle = "#9fd0f0"; g.fillRect(-W * 1.5, -H * 1.5, W * 3, H * 1.5); g.fillStyle = "#3a7ab0"; g.fillRect(-W * 1.5, 0, W * 3, H * 1.5);
    const L = Math.min(W * 0.32, 260);
    g.fillStyle = "#c89858"; rr(g, -L, 40, L * 2, 18, 6); g.fill(); g.fillStyle = "#6a4a30"; g.fillRect(-8, 58, 16, 60);
    const x = fallT >= 0 ? fallSide * (L + 30) : ballX * L;
    g.fillStyle = "#e63a3a"; g.beginPath(); g.arc(x, 40 - 26, 26, 0, TAU); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(x, 14, 26, -0.5, 0.5); g.lineTo(x, 14); g.fill();
    g.restore();
  }
  return G;
}

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
    desc: "The picture tips. Tip your head the other way to level it and keep the ball on the board.", source: "Cervical range-of-motion exercises from physiotherapy home programs.",
    how: ["Sit tall with the phone on your head.", "When the picture tips, tip your head the other way.", "Hold it level. Keep the ball on the board."],
    make: EarBalance },
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
