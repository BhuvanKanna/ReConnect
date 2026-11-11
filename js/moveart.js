// "Move like this" pictures for the setup sheet: two small panels per exercise, 1 Start and 2 Move. Panel 2
// shows the start pose faded, the end pose solid and a big orange arrow along the movement, so a patient who
// can't read well (or a child) can still see what to do. Every picture is drawn from the joint angles in
// ART below (one entry per exercise), using a few views:
//   side   person seen from the side, facing right (seated, standing or lying)
//   front  person facing you (left and right in the picture are the person's right and left, like a mirror)
//   top    seen from above, screen at the top: for turning the shoulders, head or arm
//   hand   the hand coming toward you, for turning the forearm (palm down to palm up)
//   wrist  forearm on the table seen from the side, for bending the wrist
//   wtop   forearm on the table seen from above, for side-to-side wrist sweeps
//   foot   lower leg and foot from the side;  footf: the foot from the front
//   knees  lying on your back, knees seen from your feet
// Angles are in degrees. For limbs in side and front views, 0 points straight down and 90 straight
// forward (side) or out to the side (front).
(() => {
"use strict";
const RC = (window.RC = window.RC || {});
const D = Math.PI / 180;
const C = { skin: "#f2c6a0", skinD: "#e0ab82", hair: "#6b4a32", shirt: "#2e9488", shirtD: "#22756c", pants: "#46598a", pantsD: "#384a75",
  shoe: "#4a4f5c", phone: "#1d2733", screen: "#69dcca", top: "#f0a640", wood: "#c89a6c", woodD: "#a77d53", line: "#9fb4b1", arrow: "#ef7d22", bed: "#cfdcf0" };
const f1 = (n) => Math.round(n * 10) / 10;
const P = (x, y) => ({ x, y });
const add = (a, b, k = 1) => P(a.x + b.x * k, a.y + b.y * k);
const dirSide = (a) => P(Math.sin(a * D), Math.cos(a * D)); // 0 = down, 90 = forward (right)
const seg = (a, b, w, col) => `<line x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
const circ = (c, r, col, extra = "") => `<circle cx="${f1(c.x)}" cy="${f1(c.y)}" r="${r}" fill="${col}" ${extra}/>`;
// Phone seen edge-on along direction `ang` (degrees, 0 = pointing right), screen side up (s = -1) or down (1).
function phoneBar(c, ang, len = 26, s = -1) {
  return `<g transform="translate(${f1(c.x)} ${f1(c.y)}) rotate(${f1(ang)})"><rect x="${-len / 2}" y="-3.5" width="${len}" height="7" rx="2.5" fill="${C.phone}"/>` +
    `<rect x="${-len / 2 + 2.5}" y="${s < 0 ? -3.5 : 1.5}" width="${len - 5}" height="2" rx="1" fill="${C.screen}"/><rect x="${len / 2 - 3.5}" y="-3.5" width="3.5" height="7" rx="1.2" fill="${C.top}"/></g>`;
}
// Phone seen face-on, centre c, rotated `ang`.
function phoneFace(c, w, h, ang = 0) {
  return `<g transform="translate(${f1(c.x)} ${f1(c.y)}) rotate(${f1(ang)})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${w * 0.14}" fill="${C.phone}"/>` +
    `<rect x="${-w / 2 + 3}" y="${-h / 2 + 5}" width="${w - 6}" height="${h - 10}" rx="2" fill="${C.screen}"/><rect x="${-w / 6}" y="${-h / 2 + 1.4}" width="${w / 3}" height="2.4" rx="1" fill="${C.top}"/></g>`;
}

// ---------------------------------------------------------------- props
const FLOOR = 160;
const floor = () => `<line x1="4" y1="${FLOOR}" x2="236" y2="${FLOOR}" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>`;
const chairSide = (h) => `<path d="M${h.x - 30} ${h.y + 10} H${h.x + 22} M${h.x - 30} ${h.y + 10} V${h.y - 50} M${h.x - 26} ${h.y + 10} V${FLOOR} M${h.x + 18} ${h.y + 10} V${FLOOR}" stroke="${C.woodD}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
const tableSide = (x, y) => `<path d="M${x} ${y} H236" stroke="${C.wood}" stroke-width="7" stroke-linecap="round"/><path d="M${x + 18} ${y} V${FLOOR}" stroke="${C.woodD}" stroke-width="4"/>`;
const counter = (x, w = 46) => `<rect x="${x}" y="78" width="${w}" height="${FLOOR - 78}" rx="3" fill="${C.wood}" opacity=".85"/><rect x="${x - 4}" y="74" width="${w + 8}" height="7" rx="3" fill="${C.woodD}"/>`;
const bed = (y) => `<rect x="4" y="${y}" width="232" height="12" rx="6" fill="${C.bed}"/>`;
const screenTop = () => `<rect x="70" y="6" width="100" height="12" rx="3" fill="${C.phone}"/><rect x="74" y="8" width="92" height="8" rx="2" fill="#7fb0e8"/>`;

// ---------------------------------------------------------------- side view
// p: hip [x, y], tr torso lean (+ forward, -90 lying on your back), hd head nod (+ chin down), sh/el near
// upper arm and forearm, fsh/fel far arm, th/kn/ft near thigh, shin and foot (ft 90 = flat), fth/fkn far leg,
// ph where the phone is: "hand", "handUp" (upright in the fist), "chest", "head", "thigh", "shin", "foot",
// "pocket"; seat: draw a chair; table: table top height.
function side(p) {
  const H = P(p.hip[0], p.hip[1]), up = P(Math.sin(p.tr * D), -Math.cos(p.tr * D));
  const S = add(H, up, 46), sh = add(S, up, -5), hd = p.tr + (p.hd || 0), head = add(S, P(Math.sin(hd * D), -Math.cos(hd * D)), 16);
  const E = add(sh, dirSide(p.sh), 27), Hd = add(E, dirSide(p.el), 25);
  const fE = add(sh, dirSide(p.fsh ?? 15), 27), fHd = add(fE, dirSide(p.fel ?? 75), 25);
  const leg = (th, kn, ft) => { const K = add(H, dirSide(th), 40), A = add(K, dirSide(kn), 38); return { K, A, T: add(A, dirSide(ft), 15), B: add(A, dirSide(ft), -4) }; };
  const L = leg(p.th, p.kn, p.ft ?? 90), F = leg(p.fth ?? p.th, p.fkn ?? p.kn, p.fft ?? p.ft ?? 90);
  let s = "";
  s += seg(H, F.K, 15, C.pantsD) + seg(F.K, F.A, 13, C.pantsD) + seg(F.B, F.T, 8, C.shoe);
  s += seg(sh, fE, 11, C.shirtD) + seg(fE, fHd, 9, C.skinD) + circ(fHd, 5, C.skinD);
  s += seg(H, S, 24, C.shirt) + circ(H, 11, C.pants);
  // head: face toward the front, hair at the back
  const fwd = P(Math.cos(hd * D), Math.sin(hd * D));
  s += circ(head, 13, C.skin) + `<path d="M${f1(head.x - fwd.x * 13)} ${f1(head.y - fwd.y * 13)} A13 13 0 0 1 ${f1(head.x + up.x * 13 + fwd.x * 4)} ${f1(head.y + up.y * 13 + fwd.y * 4)}" stroke="${C.hair}" stroke-width="7" fill="none"/>`;
  const eye = add(add(head, fwd, 6), P(Math.sin(hd * D), -Math.cos(hd * D)), 2.5);
  s += circ(eye, 1.8, "#2b2b2b");
  s += seg(H, L.K, 15, C.pants) + seg(L.K, L.A, 13, C.pants) + seg(L.B, L.T, 8, C.shoe);
  s += seg(sh, E, 11, C.shirt) + seg(E, Hd, 9, C.skin) + circ(Hd, 5.5, C.skin);
  const ph = p.ph;
  if (ph === "hand") s += phoneBar(add(Hd, dirSide(p.el), 9), 90 - p.el + (p.pa || 0));
  if (ph === "handUp") s += phoneBar(add(Hd, P(0, -9)), -90 + (p.pa || 0), 24, 1);
  if (ph === "chest") s += phoneBar(add(add(H, up, 32), P(Math.cos(p.tr * D), Math.sin(p.tr * D)), 14), p.tr - 90, 24, 1);
  if (ph === "head") s += phoneBar(add(head, P(Math.sin(hd * D), -Math.cos(hd * D)), 16), hd, 26);
  if (ph === "thigh") s += phoneBar(add(add(H, dirSide(p.th), 30), dirSide(p.th - 90), 10), 90 - p.th, 22);
  if (ph === "shin") s += phoneBar(add(add(L.K, dirSide(p.kn), 14), dirSide(p.kn + 90), 9), -90 - p.kn + 180, 20, 1);
  if (ph === "foot") s += phoneBar(add(add(L.A, dirSide(p.ft ?? 90), 6), dirSide((p.ft ?? 90) - 90), 7), 90 - (p.ft ?? 90), 16);
  if (ph === "pocket") s += `<rect x="${f1(H.x + 8)}" y="${f1(H.y - 3)}" width="14" height="7" rx="2" fill="${C.phone}" transform="rotate(${f1(90 - p.th)} ${f1(H.x)} ${f1(H.y)})"/>`;
  return { svg: s, pts: { hand: Hd, elbow: E, sh, neck: S, head, chest: add(H, up, 30), hip: H, knee: L.K, foot: L.T, ankle: L.A } };
}
const SEAT = [98, 106];
const seated = (o) => Object.assign({ hip: SEAT, tr: 0, sh: 15, el: 75, th: 90, kn: 0, ft: 90 }, o);
const standing = (o) => Object.assign({ hip: [110, 82], tr: 0, sh: 2, el: 2, fsh: -2, fel: -2, th: 0, kn: 0, ft: 90, fth: 0, fkn: 0 }, o);

// ---------------------------------------------------------------- front view
// tr side lean (+ toward the picture's right), hd head tilt, ra/re right-hand arm (the one on the picture's
// right; + = out to the side, negative = across the body), la/le the other arm, ko knee out (seated), shift
// hips sideways (standing, feet stay), lo leg out (standing, picture's right leg), rot turns the whole
// picture (lying on your side).
function front(p) {
  const H = P(p.hip[0] + (p.shift || 0), p.hip[1]), up = P(Math.sin(p.tr * D), -Math.cos(p.tr * D)), perp = P(Math.cos(p.tr * D), Math.sin(p.tr * D));
  const S = add(H, up, 46), SR = add(add(S, perp, 15), up, -4), SL = add(add(S, perp, -15), up, -4);
  const hdA = p.tr + (p.hd || 0), head = add(S, P(Math.sin(hdA * D), -Math.cos(hdA * D)), 16);
  const arm = (Sx, a, e, side) => { const E = add(Sx, P(side * Math.sin(a * D), Math.cos(a * D)), 27); return { E, Hd: add(E, P(side * Math.sin(e * D), Math.cos(e * D)), 25) }; };
  const R = arm(SR, p.ra ?? 8, p.re ?? (p.ra ?? 8), 1), Lf = arm(SL, p.la ?? 8, p.le ?? (p.la ?? 8), -1);
  let s = "";
  const HR = P(H.x + 10, H.y + 4), HL = P(H.x - 10, H.y + 4);
  if (p.stand) {
    const footR = P(p.hip[0] + 15, FLOOR - 4), footL = P(p.hip[0] - 15, FLOOR - 4);
    const legTo = (Hx, foot, out, sgn) => out ? add(Hx, P(sgn * Math.sin(out * D), Math.cos(out * D)), 84) : foot;
    const AR = legTo(HR, footR, p.lo, 1), AL = legTo(HL, footL, 0, -1);
    s += seg(HL, AL, 15, C.pants) + seg(HR, AR, 15, C.pants);
    s += `<ellipse cx="${f1(AL.x - 3)}" cy="${f1(AL.y + 1)}" rx="9" ry="5" fill="${C.shoe}"/><ellipse cx="${f1(AR.x + 3)}" cy="${f1(AR.y + 1)}" rx="9" ry="5" fill="${C.shoe}" transform="rotate(${f1(-(p.lo || 0))} ${f1(AR.x)} ${f1(AR.y)})"/>`;
  } else {
    const KR = add(HR, P(4 + Math.sin((p.ko || 0) * D) * 26, 10)), KL = add(HL, P(-4, 10)), AR = P(HR.x + 5, FLOOR - 6), AL = P(HL.x - 5, FLOOR - 6);
    s += `<rect x="${f1(H.x - 34)}" y="${f1(H.y + 12)}" width="68" height="7" rx="3" fill="${C.wood}"/>`;
    s += seg(KL, AL, 13, C.pants) + seg(KR, AR, 13, C.pants) + seg(HL, KL, 16, C.pants) + seg(HR, KR, 16, C.pants) + circ(KL, 8, C.pants) + circ(KR, 8, C.pants);
    s += `<ellipse cx="${f1(AL.x - 2)}" cy="${f1(AL.y + 2)}" rx="9" ry="5" fill="${C.shoe}"/><ellipse cx="${f1(AR.x + 2)}" cy="${f1(AR.y + 2)}" rx="9" ry="5" fill="${C.shoe}"/>`;
  }
  s += `<path d="M${f1(SL.x)} ${f1(SL.y)} L${f1(SR.x)} ${f1(SR.y)} L${f1(H.x + 13)} ${f1(H.y + 4)} L${f1(H.x - 13)} ${f1(H.y + 4)} Z" fill="${C.shirt}" stroke="${C.shirt}" stroke-width="10" stroke-linejoin="round"/>`;
  s += seg(SL, Lf.E, 11, C.shirt) + seg(Lf.E, Lf.Hd, 9, C.skin) + circ(Lf.Hd, 5.5, C.skin);
  s += seg(SR, R.E, 11, C.shirt) + seg(R.E, R.Hd, 9, C.skin) + circ(R.Hd, 5.5, C.skin);
  s += circ(head, 13, C.skin) + `<path d="M${f1(head.x - 13)} ${f1(head.y - 1)} A13 13 0 0 1 ${f1(head.x + 13)} ${f1(head.y - 1)}" stroke="${C.hair}" stroke-width="6" fill="none" transform="rotate(${f1(hdA)} ${f1(head.x)} ${f1(head.y)})"/>`;
  s += `<g transform="rotate(${f1(hdA)} ${f1(head.x)} ${f1(head.y)})">${circ(P(head.x - 4.5, head.y + 1), 1.7, "#2b2b2b")}${circ(P(head.x + 4.5, head.y + 1), 1.7, "#2b2b2b")}<path d="M${f1(head.x - 4)} ${f1(head.y + 6)} Q${f1(head.x)} ${f1(head.y + 9)} ${f1(head.x + 4)} ${f1(head.y + 6)}" stroke="#7a4a3a" stroke-width="1.5" fill="none"/></g>`;
  if (p.ph === "hand") s += phoneBar(add(R.Hd, P(Math.sin((p.re ?? p.ra ?? 8) * D), Math.cos((p.re ?? p.ra ?? 8) * D)), 9), 90 - (p.re ?? p.ra ?? 8), 22);
  if (p.ph === "chest") s += phoneFace(add(H, up, 30), 13, 22, p.tr);
  if (p.ph === "head") s += phoneBar(add(head, P(Math.sin(hdA * D), -Math.cos(hdA * D)), 15), hdA, 22);
  if (p.ph === "thigh") s += phoneFace(add(HR, P(3 + Math.sin((p.ko || 0) * D) * 14, 4)), 10, 14, 0);
  if (p.ph === "pocket") s += `<rect x="${f1(HR.x - 2)}" y="${f1(HR.y + 4)}" width="8" height="14" rx="2" fill="${C.phone}"/>`;
  const out = `<g${p.rot ? ` transform="rotate(${p.rot} 120 90)"` : ""}>${s}</g>`;
  const rp = (q) => { if (!p.rot) return q; const a = p.rot * D, dx = q.x - 120, dy = q.y - 90; return P(120 + dx * Math.cos(a) - dy * Math.sin(a), 90 + dx * Math.sin(a) + dy * Math.cos(a)); };
  const footR = p.stand ? add(HR, P(Math.sin((p.lo || 0) * D), Math.cos((p.lo || 0) * D)), 84) : null;
  return { svg: out, pts: { hand: rp(R.Hd), elbow: rp(R.E), sr: rp(SR), neck: rp(S), lhand: rp(Lf.Hd), head: rp(head), chest: rp(add(H, up, 30)), hip: rp(H), hipR: rp(HR), knee: rp(add(HR, P(4 + Math.sin((p.ko || 0) * D) * 26, 10))), foot: footR && rp(footR) } };
}
const sitF = (o) => Object.assign({ hip: [120, 100], tr: 0 }, o);
const standF = (o) => Object.assign({ hip: [120, 78], tr: 0, stand: true }, o);

// ---------------------------------------------------------------- top view (screen at the top)
// tw shoulders turn (+ to the right), hd head turn on top of that, arm: right arm angle (0 = straight ahead,
// + = to the right), elbow: the arm starts at the elbow (upper arm tucked at your side), seat: show the chair.
function top(p) {
  const c = P(120, 104), tw = (p.tw || 0) * D, hd = tw + (p.hd || 0) * D, r = P(Math.cos(tw), Math.sin(tw));
  const SR = add(c, r, 30), SL = add(c, r, -30);
  let s = screenTop() + `<rect x="84" y="86" width="72" height="62" rx="12" fill="${C.wood}" opacity=".7"/>`;
  if (p.arm != null) {
    const a = (p.arm + (p.tw || 0)) * D, base = p.elbow ? add(SR, P(-Math.sin(tw), Math.cos(tw)), 2) : SR, len = p.elbow ? 38 : 60;
    const Hd = add(base, P(Math.sin(a), -Math.cos(a)), len);
    s += seg(base, Hd, p.elbow ? 9 : 11, p.elbow ? C.skin : C.shirt) + circ(Hd, 6.5, C.skin) + phoneBar(add(Hd, P(Math.sin(a), -Math.cos(a)), 10), p.arm + (p.tw || 0) - 90, 24);
    var hand = Hd, armBase = base;
  }
  s += seg(SL, SR, 26, C.shirt);
  const nose = add(c, P(Math.sin(hd), -Math.cos(hd)), 16);
  s += `<polygon points="${f1(nose.x)},${f1(nose.y)} ${f1(c.x + Math.cos(hd) * 6 + Math.sin(hd) * 8)},${f1(c.y + Math.sin(hd) * 6 - Math.cos(hd) * 8)} ${f1(c.x - Math.cos(hd) * 6 + Math.sin(hd) * 8)},${f1(c.y - Math.sin(hd) * 6 - Math.cos(hd) * 8)}" fill="${C.skin}"/>`;
  s += circ(c, 14, C.hair) + `<circle cx="${f1(c.x + Math.sin(hd) * 4)}" cy="${f1(c.y - Math.cos(hd) * 4)}" r="9" fill="${C.skin}"/>`;
  if (p.ph === "head") s += phoneBar(c, (p.tw || 0) + (p.hd || 0) - 90, 20);
  if (p.star) s += `<text x="120" y="40" text-anchor="middle" font-size="18">⭐</text>`;
  return { svg: s, pts: { hand, base: armBase, nose, c, sr: SR, sl: SL } };
}

// ---------------------------------------------------------------- the hand coming toward you
// rot: the forearm's turn (0 = palm down, phone flat, + = turning the thumb out toward palm up);
// up: the phone stands upright in the fist (a jug or a cup); two: both hands on an upright phone (wheel).
function hand(p) {
  const c = P(120, 92), a = p.rot || 0;
  let s = `<rect x="40" y="128" width="160" height="10" rx="5" fill="${C.wood}"/>`;
  if (p.two) {
    s += `<g transform="rotate(${a} ${c.x} ${c.y})">${phoneFace(c, 40, 70)}<ellipse cx="${c.x - 28}" cy="${c.y + 6}" rx="11" ry="20" fill="${C.skin}"/><ellipse cx="${c.x + 28}" cy="${c.y + 6}" rx="11" ry="20" fill="${C.skin}"/></g>`;
    return { svg: s, pts: { c } };
  }
  s += `<circle cx="${c.x}" cy="${c.y + 4}" r="24" fill="${C.shirt}"/>`;
  s += `<g transform="rotate(${a} ${c.x} ${c.y})">`;
  if (p.up) s += phoneFace(P(c.x, c.y - 40), 26, 50) + `<rect x="${c.x - 18}" y="${c.y - 22}" width="36" height="34" rx="12" fill="${C.skin}"/>`;
  else s += `<rect x="${c.x - 40}" y="${c.y - 5}" width="80" height="10" rx="3" fill="${C.phone}"/><rect x="${c.x - 37}" y="${c.y - 5}" width="74" height="3" rx="1.5" fill="${C.screen}"/>` +
    `<rect x="${c.x - 17}" y="${c.y - 14}" width="34" height="32" rx="12" fill="${C.skin}"/><ellipse cx="${c.x}" cy="${c.y - 15}" rx="7" ry="5" fill="${C.skinD}"/>`;
  s += `</g>`;
  return { svg: s, pts: { c } };
}

// ---------------------------------------------------------------- forearm on the table, from the side
// w: the hand's angle at the wrist (0 = straight ahead, + up); edge: the wrist is past the table edge;
// up: the phone is upright in the fist; flat: the phone lies on the open palm.
function wrist(p) {
  const W = P(126, 88), w = (p.w || 0) * D, dir = P(Math.cos(w), -Math.sin(w));
  let s = p.edge ? `<path d="M6 ${W.y + 10} H118" stroke="${C.wood}" stroke-width="8" stroke-linecap="round"/><path d="M118 ${W.y + 10} V${FLOOR}" stroke="${C.woodD}" stroke-width="5"/>` : `<path d="M6 ${W.y + 10} H234" stroke="${C.wood}" stroke-width="8" stroke-linecap="round"/>`;
  s += seg(P(10, W.y), P(64, W.y), 18, C.shirt) + seg(P(64, W.y), W, 15, C.skin);
  const T = add(W, dir, 34);
  if (p.up) {
    s += seg(W, add(W, dir, 14), 16, C.skin) + phoneBar(add(add(W, dir, 10), P(dir.y, -dir.x), 18), -90 + -(p.w || 0), 30) + `<rect x="${f1(W.x)}" y="${f1(W.y - 10)}" width="20" height="20" rx="7" fill="${C.skin}" transform="rotate(${f1(-(p.w || 0))} ${W.x} ${W.y})"/>`;
    return { svg: s, pts: { tip: add(add(W, dir, 10), P(dir.y, -dir.x), 34), w: W } };
  }
  s += seg(W, T, 14, C.skin) + circ(T, 6.5, C.skin);
  const n = P(-dir.y, -dir.x); // the side of the hand away from the palm (palm down: up)
  s += p.flat ? phoneBar(add(add(W, dir, 18), n, 10), -(p.w || 0), 34) : phoneBar(add(add(W, dir, 16), n, -10), -(p.w || 0), 32, 1);
  return { svg: s, pts: { tip: T, w: W } };
}

// ---------------------------------------------------------------- forearm on the table, from above
function wtop(p) {
  const W = P(120, 92), a = (p.w || 0) * D, dir = P(Math.sin(a), -Math.cos(a));
  let s = `<rect x="20" y="26" width="200" height="134" rx="10" fill="${C.wood}" opacity=".45"/>`;
  s += seg(P(120, 168), P(120, 130), 24, C.shirt) + seg(P(120, 130), W, 20, C.skin);
  const T = add(W, dir, 40);
  s += phoneFace(add(W, dir, 22), 26, 48, p.w || 0) + seg(W, add(W, dir, 30), 22, C.skin) + circ(add(W, dir, 34), 10, C.skin);
  return { svg: s, pts: { tip: T, w: W } };
}

// ---------------------------------------------------------------- lower leg and foot from the side
// f: foot angle (90 = flat, more = toes up, less = toes down); pivot: "heel" (toes lift) or "toe" (heel lifts).
function foot(p) {
  const f = (p.f ?? 90) - 90, len = 62, pivot = p.pivot || (f < 0 ? "toe" : "heel");
  const heel0 = P(78, FLOOR - 6), toe0 = P(78 + len, FLOOR - 6);
  let heel, toe;
  if (pivot === "toe") { toe = toe0; heel = add(toe, P(-Math.cos(f * D), Math.sin(f * D)), len); }
  else { heel = heel0; toe = add(heel, P(Math.cos(f * D), -Math.sin(f * D)), len); }
  const A = add(heel, P(toe.x - heel.x, toe.y - heel.y), 0.18), ank = add(A, P(-(toe.y - heel.y), toe.x - heel.x), -0.26);
  let s = floor() + seg(P(ank.x - 3, 30), ank, 24, C.pants) + seg(P(ank.x - 3, 30), P(ank.x - 3, 30), 1, C.pants);
  const ang0 = Math.atan2(toe.y - heel.y, toe.x - heel.x) / D;
  s += `<g transform="translate(${f1(heel.x)} ${f1(heel.y)}) rotate(${f1(ang0)})"><path d="M-6 6 L${len + 4} 6 Q${len + 8} -4 ${len - 6} -8 L22 -14 Q6 -24 -2 -12 Z" fill="${C.shoe}"/><rect x="-6" y="3" width="${len + 10}" height="4" rx="2" fill="#2c2f36"/></g>` + circ(ank, 10, C.shoe);
  const mid = add(heel, P(toe.x - heel.x, toe.y - heel.y), 0.55), ang = Math.atan2(toe.y - heel.y, toe.x - heel.x) / D;
  s += phoneBar(add(mid, P(Math.sin(ang * D), -Math.cos(ang * D)), 13), ang, 28);
  return { svg: s, pts: { toe, heel, ank } };
}
function footf(p) {
  const r = p.roll || 0, c = P(120, FLOOR - 14);
  let s = floor() + seg(P(120, 8), P(120, 112), 26, C.pants);
  s += `<g transform="rotate(${r} 120 ${FLOOR - 6})"><path d="M94 ${FLOOR - 6} Q94 ${FLOOR - 34} 120 ${FLOOR - 36} Q146 ${FLOOR - 34} 146 ${FLOOR - 6} Z" fill="${C.shoe}"/>${phoneBar(P(120, FLOOR - 40), 0, 34)}</g>`;
  return { svg: s, pts: { c, l: P(96, FLOOR - 30), r: P(144, FLOOR - 30) } };
}
// Lying on your back with knees bent, seen from your feet: both knees roll side to side.
function knees(p) {
  const r = p.roll || 0, base = P(120, 140);
  let s = bed(146) + `<circle cx="120" cy="100" r="15" fill="${C.skin}"/><circle cx="120" cy="96" r="15" fill="${C.hair}" opacity=".9"/>`;
  s += `<g transform="rotate(${r} ${base.x} ${base.y})">${seg(P(104, 140), P(112, 74), 18, C.pantsD)}${seg(P(136, 140), P(128, 74), 18, C.pants)}${circ(P(112, 72), 10, C.pantsD)}${circ(P(128, 72), 10, C.pants)}${phoneBar(P(134, 104), -80, 22)}</g>`;
  const k = P(120 + Math.sin(r * D) * 68, 140 - Math.cos(r * D) * 68);
  return { svg: s, pts: { k, base } };
}

// ---------------------------------------------------------------- arrows
function head(at, ang, size = 11) {
  const a1 = ang + 2.6, a2 = ang - 2.6;
  return `<polygon points="${f1(at.x)},${f1(at.y)} ${f1(at.x + Math.cos(a1) * size)},${f1(at.y + Math.sin(a1) * size)} ${f1(at.x + Math.cos(a2) * size)},${f1(at.y + Math.sin(a2) * size)}" fill="${C.arrow}"/>`;
}
// A bent arrow from a to b; bend: how far the middle bows out (px, sign picks the side); both: arrowheads on both ends.
function arc(a, b, bend = 20, both = false, gap = 10) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, n = P(-dy / L, dx / L);
  const pa = add(a, P(dx / L, dy / L), gap), pb = add(b, P(dx / L, dy / L), -gap), m = add(P((pa.x + pb.x) / 2, (pa.y + pb.y) / 2), n, bend);
  const endAng = Math.atan2(pb.y - m.y, pb.x - m.x), startAng = Math.atan2(pa.y - m.y, pa.x - m.x);
  return `<path d="M${f1(pa.x)} ${f1(pa.y)} Q${f1(m.x)} ${f1(m.y)} ${f1(pb.x)} ${f1(pb.y)}" stroke="${C.arrow}" stroke-width="5" fill="none" stroke-linecap="round"/>` + head(add(pb, P(Math.cos(endAng), Math.sin(endAng)), 4), endAng) + (both ? head(add(pa, P(Math.cos(startAng), Math.sin(startAng)), 4), startAng) : "");
}
// Around a point: from angle a0 to a1 (degrees, 0 = right, clockwise), arrowhead at the end (and start if both).
function turn(c, r, a0, a1, both = false) {
  const p0 = add(c, P(Math.cos(a0 * D), Math.sin(a0 * D)), r), p1 = add(c, P(Math.cos(a1 * D), Math.sin(a1 * D)), r);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0, sweep = a1 > a0 ? 1 : 0, tan = (a1 > a0 ? 1 : -1) * Math.PI / 2;
  return `<path d="M${f1(p0.x)} ${f1(p0.y)} A${r} ${r} 0 ${large} ${sweep} ${f1(p1.x)} ${f1(p1.y)}" stroke="${C.arrow}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    head(add(p1, P(Math.cos(a1 * D + tan), Math.sin(a1 * D + tan)), 4), a1 * D + tan) + (both ? head(add(p0, P(Math.cos(a0 * D - tan), Math.sin(a0 * D - tan)), 4), a0 * D - tan) : "");
}
const circleArrow = (c, r) => turn(c, r, -60, 240);
// Around joint `c` (a point name), following point `k` from the start pose to the end pose, `extra` px
// outside it: the arrow follows the limb's path without crossing the body.
const orbit = (c, k, extra = 16, both = false) => (A, B) => {
  const o = A.pts[c], p0 = A.pts[k], p1 = B.pts[k];
  const a0 = Math.atan2(p0.y - o.y, p0.x - o.x) / D, a1 = Math.atan2(p1.y - o.y, p1.x - o.x) / D;
  let d = a1 - a0; while (d > 180) d -= 360; while (d < -180) d += 360;
  const r = Math.hypot(p0.x - o.x, p0.y - o.y) + extra, pad = Math.min(10, Math.abs(d) * 0.15) * Math.sign(d);
  return turn(o, r, a0 + pad, a0 + d - pad * 0.3, both);
};
// Four short arrows out from a point: move in any direction.
const burst = (c, r = 16, len = 18) => [0, 90, 180, 270].map((a) => { const u = P(Math.cos(a * D), Math.sin(a * D)), s0 = add(c, u, r), s1 = add(c, u, r + len); return `<path d="M${f1(s0.x)} ${f1(s0.y)} L${f1(s1.x)} ${f1(s1.y)}" stroke="${C.arrow}" stroke-width="5" stroke-linecap="round"/>` + head(add(s1, u, 4), a * D, 9); }).join("");
const tag = (x, y, s) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="15" font-weight="700" fill="${C.arrow}" font-family="Fredoka, Verdana, sans-serif">${s}</text>`;

// ---------------------------------------------------------------- the exercises
// a: start pose, b: end pose (same view), arrow(A, B): the arrow drawn on panel 2 from the two poses' points,
// props: what to draw behind, still: no panel 2 (hold still).
const V = { side, front, top, hand, wrist, wtop, foot, footf, knees };
const chair = (s) => chairSide(P(s.hip[0], s.hip[1]));
// Chair plus a table whose top is just under the start pose's elbow (or hand), so the arm rests on it.
const deskAt = (k, dy = 9) => (s, A) => chair(s) + tableSide(Math.min(A.pts.elbow.x, A.pts.hand.x) - 6, A.pts[k].y + dy);
const rotArrow = (a0, a1, both) => () => turn(P(120, 92), 64, -90 + a0, -90 + a1, both);
const ART = {
  // arm and shoulder
  lift: { v: "side", a: seated({ sh: 28, el: 90, ph: "hand" }), b: seated({ sh: 150, el: 150, ph: "hand" }), arrow: orbit("sh", "hand", 18), props: deskAt("elbow") },
  sideraise: { v: "front", a: sitF({ ra: 4, ph: "hand" }), b: sitF({ ra: 88, ph: "hand" }), arrow: orbit("sr", "hand", 14) },
  reach: { t: ["Point at the screen", "Point up, down, left, right"], v: "side", a: seated({ sh: 88, el: 90, ph: "hand" }), b: seated({ sh: 88, el: 90, ph: "hand" }), arrow: (A) => burst(add(A.pts.hand, P(16, 0)), 22, 16), props: chair },
  cupmouth: { v: "side", a: seated({ sh: 12, el: 90, ph: "handUp" }), b: seated({ sh: 30, el: 168, ph: "handUp" }), arrow: orbit("elbow", "hand", 22), props: deskAt("elbow") },
  push: { v: "side", a: seated({ sh: -12, el: 115, ph: "hand" }), b: seated({ sh: 86, el: 88, ph: "hand" }), arrow: (A, B) => arc(add(A.pts.hand, P(4, 18)), add(B.pts.hand, P(10, 18)), 0, false, 0), props: chair },
  trace: { t: ["Point at the screen", "Draw the shape"], v: "side", a: seated({ sh: 88, el: 92, ph: "hand" }), b: seated({ sh: 88, el: 92, ph: "hand" }), arrow: (A) => circleArrow(add(A.pts.hand, P(22, 0)), 24), props: chair },
  gate: { v: "top", a: { arm: 0, elbow: true }, b: { arm: 65, elbow: true }, arrow: orbit("base", "hand", 14) },
  paint: { v: "side", a: seated({ sh: 55, el: 58, ph: "hand" }), b: seated({ sh: 128, el: 130, ph: "hand" }), arrow: orbit("sh", "hand", 18, true), props: chair },
  moon: { v: "side", a: seated({ sh: 58, el: 62, ph: "hand" }), b: seated({ sh: 118, el: 120, ph: "hand" }), arrow: orbit("sh", "hand", 18, true), props: chair },
  stir: { t: ["Phone like a spoon", "Stir in circles"], v: "side", a: seated({ sh: 30, el: 95, ph: "handUp" }), b: seated({ sh: 30, el: 95, ph: "handUp" }), arrow: (A) => circleArrow(add(A.pts.hand, P(0, -6)), 24), props: deskAt("hand", 6) },
  pendulum: { v: "front", a: standF({ ra: -22, ph: "hand", la: 30, le: 70 }), b: standF({ ra: 24, ph: "hand", la: 30, le: 70 }), arrow: orbit("sr", "hand", 14, true), props: () => counter(10, 40) },
  fruit: { v: "top", a: { arm: -28 }, b: { arm: 28 }, arrow: orbit("base", "hand", 14, true) },
  quickreach: { t: ["Wait in the middle", "Reach quickly"], v: "side", a: seated({ sh: 88, el: 90, ph: "hand" }), b: seated({ sh: 88, el: 90, ph: "hand" }), arrow: (A) => burst(add(A.pts.hand, P(16, 0)), 22, 16), props: chair },
  reachturn: { v: "side", a: seated({ sh: 18, el: 92, ph: "hand" }), b: seated({ sh: 108, el: 110, ph: "hand" }), arrow: (A, B) => orbit("sh", "hand", 18)(A, B) + turn(add(B.pts.hand, P(10, -4)), 18, 160, 380), props: deskAt("elbow") },
  drawsword: { v: "front", a: sitF({ ra: -40, re: -70, ph: "hand" }), b: sitF({ ra: 138, re: 150, ph: "hand" }), arrow: (A, B) => arc(A.pts.hand, B.pts.hand, 40) },
  bowling: { v: "side", a: standing({ sh: -45, el: -45, ph: "hand" }), b: standing({ sh: 75, el: 78, ph: "hand" }), arrow: orbit("sh", "hand", 16) },
  spotlight: { v: "side", a: seated({ sh: 60, el: 64, ph: "hand" }), b: seated({ sh: 110, el: 112, ph: "hand" }), arrow: orbit("sh", "hand", 18, true), props: chair },
  pressdown: { v: "side", a: seated({ sh: 8, el: 150, ph: "hand" }), b: seated({ sh: 22, el: 28, ph: "hand" }), arrow: orbit("elbow", "hand", 18), props: chair },
  tennis: { v: "top", a: { arm: 55 }, b: { arm: -55 }, arrow: orbit("base", "hand", 14, true) },
  airplane: { v: "front", a: sitF({ ra: 4, ph: "hand" }), b: sitF({ ra: 88, ph: "hand" }), arrow: orbit("sr", "hand", 14) },
  // wrist and forearm
  pour: { t: ["Phone flat", "Tip it like a teapot"], v: "hand", a: { rot: 0 }, b: { rot: 70 }, arrow: rotArrow(0, 70) },
  lock: { t: ["Turn one way", "Turn to each number"], v: "hand", a: { rot: -40 }, b: { rot: 40 }, arrow: rotArrow(-40, 40, true) },
  maze: { v: "wrist", a: { w: 22, edge: true }, b: { w: -22, edge: true }, arrow: orbit("w", "tip", 14, true) },
  wristbend: { v: "wrist", a: { w: 40, edge: true }, b: { w: -40, edge: true }, arrow: orbit("w", "tip", 14, true) },
  wiper: { v: "wtop", a: { w: -30 }, b: { w: 30 }, arrow: orbit("w", "tip", 14, true) },
  steady: { v: "wrist", a: { flat: true }, still: "Keep it flat and still" },
  key: { t: ["Thumb on top", "Turn your palm up"], v: "hand", a: { rot: 0 }, b: { rot: 85 }, arrow: rotArrow(0, 85) },
  drawbridge: { v: "wrist", a: { w: 0, edge: true }, b: { w: 40, edge: true }, arrow: orbit("w", "tip", 14) },
  wheel: { t: ["Hold it like a wheel", "Turn left and right"], v: "hand", a: { two: true, rot: -32 }, b: { two: true, rot: 32 }, arrow: rotArrow(-32, 32, true) },
  wristcircle: { t: ["Wrist over the edge", "Make circles"], v: "wrist", a: { w: 0, edge: true }, b: { w: 0, edge: true }, arrow: (A) => circleArrow(add(A.pts.tip, P(12, 0)), 22) },
  water: { v: "wtop", a: { w: 0 }, b: { w: 32 }, arrow: orbit("w", "tip", 14) },
  jar: { t: ["Twist one way", "Twist back and forth"], v: "hand", a: { rot: -38 }, b: { rot: 38 }, arrow: rotArrow(-38, 38, true) },
  scoophold: { v: "wrist", a: { w: 0, edge: true }, b: { w: -45, edge: true }, arrow: orbit("w", "tip", 14) },
  fill: { t: ["Phone upright", "Tip it to pour"], v: "hand", a: { up: true, rot: 0 }, b: { up: true, rot: 50 }, arrow: rotArrow(0, 50) },
  soup: { v: "side", a: seated({ sh: 16, el: 84, ph: "hand" }), b: seated({ sh: 30, el: 165, ph: "hand" }), arrow: (A, B) => turn(add(A.pts.hand, P(14, 6)), 14, 160, 380) + orbit("elbow", "hand", 22)(A, B), props: deskAt("elbow") },
  sail: { t: ["Hand in the middle", "Turn left and right"], v: "hand", a: { rot: -30 }, b: { rot: 30 }, arrow: rotArrow(-30, 30, true) },
  pengrip: { t: ["Hold it like a pen", "Draw the shape"], v: "wrist", a: { up: true }, b: { up: true }, arrow: (A) => circleArrow(add(A.pts.tip, P(0, -4)), 22) },
  shake: { t: ["Hold tight", "Shake up and down"], v: "side", a: seated({ sh: 8, el: 92, ph: "hand" }), b: seated({ sh: 8, el: 92, ph: "hand" }), arrow: (A) => arc(add(A.pts.hand, P(34, -30)), add(A.pts.hand, P(34, 26)), 0, true, 0), props: chair },
  // trunk and legs
  lean: { v: "front", a: sitF({ ph: "chest" }), b: sitF({ tr: 24, ph: "chest", ra: 14 }), arrow: (A, B) => orbit("hip", "head", 14)(A, B) + turn(A.pts.hip, 78, -98, -122) },
  twist: { v: "top", a: { tw: 0, ph: "head" }, b: { tw: 45, ph: "head" }, arrow: () => turn(P(120, 104), 50, -135, -45, true) },
  sit2stand: { v: "side", a: seated({ ph: "chest", tr: 28, kn: -10 }), b: standing({ hip: [146, 82], ph: "chest" }), arrow: (A, B) => arc(add(A.pts.chest, P(16, 0)), add(B.pts.chest, P(14, 6)), -26, false, 0), props: () => chairSide(P(98, 106)) },
  balance: { v: "front", a: standF({ ph: "chest", la: 34, le: 70 }), still: "Stand tall and still", props: () => counter(14, 40) },
  march: { v: "side", a: seated({ ph: "pocket" }), b: seated({ ph: "pocket", th: 120, kn: 18 }), arrow: orbit("hip", "knee", 14), props: chair },
  floor: { v: "side", a: seated({ ph: "chest" }), b: seated({ ph: "chest", tr: 62, sh: 30, el: 25 }), arrow: orbit("hip", "head", 16), props: chair },
  sidereach: { v: "front", a: sitF({ ph: "chest", ra: 12 }), b: sitF({ ph: "chest", tr: 26, ra: 70, re: 72 }), arrow: orbit("hip", "head", 14) },
  rock: { v: "side", a: seated({ ph: "chest", tr: -14 }), b: seated({ ph: "chest", tr: 34 }), arrow: orbit("hip", "head", 16, true), props: chair },
  trunkcircle: { t: ["Sit tall", "Circle your body"], v: "front", a: sitF({ ph: "chest" }), b: sitF({ ph: "chest" }), arrow: (A) => circleArrow(A.pts.head, 32) },
  kneeext: { v: "side", a: seated({}), b: seated({ kn: 82, ft: 150 }), arrow: orbit("knee", "foot", 14), props: chair, ph: "shin" },
  kneeout: { v: "front", a: sitF({ ph: "thigh" }), b: sitF({ ph: "thigh", ko: 40 }), arrow: (A, B) => arc(add(A.pts.knee, P(12, -12)), add(B.pts.knee, P(16, -10)), -10, false, 0) },
  foottilt: { v: "foot", a: { f: 90 }, b: { f: 116 }, arrow: orbit("heel", "toe", 14) },
  ankletrace: { t: ["Heel on the floor", "Tilt your foot to steer"], v: "foot", a: { f: 100 }, b: { f: 100 }, arrow: (A) => burst(add(A.pts.toe, P(8, -12)), 16, 14) },
  toetap: { v: "side", a: seated({ ph: "foot" }), b: seated({ ph: "foot", kn: 34 }), arrow: orbit("knee", "foot", 12, true), props: chair },
  bridge: { v: "side", a: { hip: [126, 138], tr: -90, sh: 90, el: 90, th: 135, kn: 32, ft: 120, ph: "thigh" }, b: { hip: [126, 116], tr: -110, sh: 100, el: 95, th: 110, kn: 30, ft: 120, ph: "thigh" }, arrow: (A, B) => arc(add(A.pts.hip, P(0, 6)), add(B.pts.hip, P(0, -16)), 0, false, 0), props: () => bed(150) },
  standshift: { v: "front", a: standF({ ph: "chest", shift: -14 }), b: standF({ ph: "chest", shift: 14 }), arrow: (A, B) => arc(add(A.pts.head, P(0, -24)), add(B.pts.head, P(0, -24)), -8, true, 0), props: () => counter(196, 40) },
  minisquat: { v: "side", a: standing({ ph: "pocket" }), b: standing({ hip: [104, 98], ph: "pocket", tr: 18, th: 38, kn: -22, fth: 38, fkn: -22 }), arrow: (A, B) => arc(add(A.pts.hip, P(-24, 0)), add(B.pts.hip, P(-24, 0)), 0, false, 0), props: () => counter(178, 46) },
  leanhold: { v: "side", a: seated({ ph: "chest" }), b: seated({ ph: "chest", tr: 36 }), arrow: orbit("hip", "head", 16), props: chair },
  crossreach: { v: "top", a: { tw: 0 }, b: { tw: -55 }, arrow: () => turn(P(120, 104), 50, -90, -145) },
  neckturn: { v: "top", a: { hd: -50, ph: "head" }, b: { hd: 50, ph: "head" }, arrow: () => turn(P(120, 104), 36, -140, -40, true) },
  nod: { v: "side", a: seated({ hd: -24, ph: "head" }), b: seated({ hd: 30, ph: "head" }), arrow: orbit("neck", "head", 20, true), props: chair },
  gaze: { v: "top", a: { hd: -28, ph: "head", star: true }, b: { hd: 28, ph: "head", star: true }, arrow: () => turn(P(120, 104), 36, -118, -62, true) },
  eartilt: { v: "front", a: sitF({ ph: "head" }), b: sitF({ ph: "head", hd: 30 }), arrow: orbit("neck", "head", 16) },
  sidebendhold: { v: "front", a: sitF({ ph: "chest" }), b: sitF({ ph: "chest", tr: 26, ra: 18 }), arrow: orbit("hip", "head", 14) },
  kneelift: { v: "side", a: seated({ ph: "thigh" }), b: seated({ ph: "thigh", th: 120, kn: 16 }), arrow: orbit("hip", "knee", 14), props: chair },
  penalty: { v: "side", a: seated({ kn: -8, ph: "shin" }), b: seated({ kn: 80, ft: 150, ph: "shin" }), arrow: orbit("knee", "foot", 14), props: chair },
  anklecircles: { t: ["Heel on the floor", "Draw circles with your toes"], v: "foot", a: { f: 100 }, b: { f: 100 }, arrow: (A) => circleArrow(add(A.pts.toe, P(4, -18)), 18) },
  anklerock: { v: "footf", a: { roll: -18 }, b: { roll: 18 }, arrow: () => turn(P(120, FLOOR - 6), 62, -125, -55, true) },
  gaspedal: { v: "foot", a: { f: 110 }, b: { f: 72 }, arrow: orbit("heel", "toe", 14, true) },
  cycling: { t: ["Feet on the pedals", "Pedal round"], v: "side", a: seated({ ph: "thigh", th: 108, kn: 20 }), b: seated({ ph: "thigh", th: 108, kn: 20 }), arrow: (A) => circleArrow(add(A.pts.ankle, P(-4, -10)), 24), props: chair },
  sidelegs: { v: "front", a: standF({ ph: "pocket", rot: -90, hip: [120, 70] }), b: standF({ ph: "pocket", rot: -90, hip: [120, 70], lo: 34 }), arrow: (A, B) => arc(A.pts.foot, B.pts.foot, 16), props: () => bed(140) },
  kneerolls: { v: "knees", a: { roll: -32 }, b: { roll: 32 }, arrow: orbit("base", "k", 12, true) },
  slalom: { v: "front", a: standF({ ph: "chest", shift: -14 }), b: standF({ ph: "chest", shift: 14 }), arrow: (A, B) => arc(add(A.pts.head, P(0, -24)), add(B.pts.head, P(0, -24)), -8, true, 0), props: () => counter(196, 40) },
  heeltoe: { v: "foot", a: { f: 112 }, b: { f: 70 }, arrow: (A, B) => { const F = foot({ f: 90 }); return arc(add(F.pts.toe, P(10, -6)), add(A.pts.toe, P(10, -4)), -6, false, 0) + arc(add(F.pts.heel, P(-14, -4)), add(B.pts.heel, P(-14, -2)), 6, false, 0); } },
  chestup: { v: "side", a: seated({ ph: "chest", tr: 16, hd: 14 }), b: seated({ ph: "chest", tr: -10, hd: -6 }), arrow: orbit("hip", "head", 16), props: chair },
  toeshold: { v: "foot", a: { f: 90 }, b: { f: 118 }, arrow: orbit("heel", "toe", 14) },
  heelraise: { v: "foot", a: { f: 90 }, b: { f: 66 }, arrow: orbit("toe", "heel", 14) },
  anklepump: { v: "foot", a: { f: 118 }, b: { f: 72 }, arrow: orbit("heel", "toe", 14, true) },
  // brain games played by moving the hand
  simon: { t: ["Hand flat", "Tilt to each flower"], v: "wtop", a: { w: 0 }, b: { w: 0 }, arrow: (A) => burst(add(A.pts.tip, P(0, -8)), 28, 16) },
  sort: { t: ["Hand in the middle", "Turn left or right"], v: "hand", a: { rot: -35 }, b: { rot: 35 }, arrow: rotArrow(-35, 35, true) },
};
// The phone's place when an entry gives it outside the poses.
for (const k of Object.keys(ART)) { const e = ART[k]; if (e.ph) { e.a = Object.assign({}, e.a, { ph: e.ph }); if (e.b) e.b = Object.assign({}, e.b, { ph: e.ph }); } }

const panel = (n, title, body) => `<figure class="mv-panel"><figcaption><span class="mv-n">${n}</span>${title}</figcaption><svg viewBox="0 0 240 170" role="img" aria-label="${title}">${body}</svg></figure>`;
function svg(id) {
  const e = ART[id];
  if (!e) return "";
  const view = V[e.v], A = view(e.a);
  const base = (e.props ? e.props(e.a, A) : "") + (e.v === "side" || e.v === "front" ? floor() : "");
  if (e.still) return `<div class="mv">${panel(1, e.still, base + A.svg)}</div>`;
  const B = view(e.b), t = e.t || ["Start", "Move"];
  return `<div class="mv">${panel(1, t[0], base + A.svg)}${panel(2, t[1], base + `<g opacity=".28">${A.svg}</g>` + B.svg + e.arrow(A, B))}</div>`;
}

RC.moveArt = { svg, has: (id) => !!ART[id], ART };
})();
