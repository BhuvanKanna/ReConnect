// Language (aphasia) practice, all multiple choice: naming with hints, word–picture matching,
// semantic feature analysis, sentence completion and spelling. Pictures are drawn with the system's
// picture characters, large, as the thing to name.
(() => {
"use strict";
const RC = window.RC;
const { clamp, TAU, T, alpha, txt, rr, fmtTime } = RC;
const { base, bg, dots, Quiz, randInt, pick, shuffle, inRect, defineArt } = RC.kit;

// word, picture, group, what you do with it, where you find it, what it is like, level (1 common … 3 harder)
const BANK = [
  ["apple", "🍎", "fruit", "eat it", "in the kitchen", "red and crunchy", 1], ["banana", "🍌", "fruit", "peel and eat it", "in the kitchen", "long and yellow", 1],
  ["bread", "🍞", "food", "make toast", "in the kitchen", "soft", 1], ["cheese", "🧀", "food", "put it on a sandwich", "in the fridge", "yellow with holes", 2],
  ["egg", "🥚", "food", "cook it for breakfast", "in the fridge", "oval with a shell", 1], ["carrot", "🥕", "vegetable", "eat it raw or cooked", "in the garden", "long and orange", 1],
  ["cup", "☕", "kitchen item", "drink from it", "in the kitchen", "holds hot drinks", 1], ["spoon", "🥄", "kitchen item", "stir or eat soup", "in a drawer", "metal and curved", 1],
  ["knife", "🔪", "kitchen item", "cut food", "in a drawer", "sharp", 1], ["chair", "🪑", "furniture", "sit on it", "at the table", "has four legs", 1],
  ["bed", "🛏️", "furniture", "sleep in it", "in the bedroom", "soft with a pillow", 1], ["key", "🔑", "tool", "open a lock", "in your pocket", "small and metal", 1],
  ["clock", "⏰", "household item", "tell the time", "by the bed", "ticks", 2], ["phone", "📱", "device", "call someone", "in your pocket", "has a screen", 1],
  ["book", "📖", "household item", "read it", "on a shelf", "has pages", 1], ["pen", "🖊️", "stationery", "write a note", "on a desk", "has ink", 1],
  ["scissors", "✂️", "tool", "cut paper", "in a drawer", "has two blades", 3], ["umbrella", "☂️", "household item", "stay dry in the rain", "by the front door", "opens up", 3],
  ["shoe", "👟", "clothing", "wear it on your foot", "by the door", "has laces", 1], ["glasses", "👓", "accessory", "see more clearly", "on your face", "has two lenses", 2],
  ["dog", "🐕", "animal", "take it for a walk", "at home", "barks", 1], ["cat", "🐈", "animal", "stroke it", "at home", "purrs", 1],
  ["bird", "🐦", "animal", "listen to it sing", "in a tree", "has feathers", 1], ["fish", "🐟", "animal", "watch it swim", "in water", "has fins", 1],
  ["cow", "🐄", "animal", "get milk from it", "on a farm", "says moo", 1], ["horse", "🐎", "animal", "ride it", "on a farm", "gallops", 2],
  ["car", "🚗", "vehicle", "drive it", "on the road", "has four wheels", 1], ["bus", "🚌", "vehicle", "ride it to town", "at a bus stop", "carries many people", 1],
  ["bicycle", "🚲", "vehicle", "pedal it", "on a bike path", "has two wheels", 3], ["house", "🏠", "building", "live in it", "on a street", "has a roof", 1],
  ["tree", "🌳", "plant", "sit in its shade", "in a park", "has leaves", 1], ["flower", "🌻", "plant", "smell it", "in the garden", "has petals", 2],
  ["moon", "🌙", "sky", "see it at night", "in the sky", "shines at night", 2], ["ball", "⚽", "toy", "kick it", "in a park", "round and bouncy", 1],
  ["guitar", "🎸", "instrument", "play music", "on a stage", "has strings", 3], ["drum", "🥁", "instrument", "beat it", "in a band", "loud", 2],
  ["hammer", "🔨", "tool", "hit a nail", "in a toolbox", "heavy", 2], ["toothbrush", "🪥", "bathroom item", "brush your teeth", "in the bathroom", "has bristles", 3],
  ["soap", "🧼", "bathroom item", "wash your hands", "by the sink", "slippery", 2], ["lamp", "💡", "household item", "light a room", "on a table", "glows", 2],
  ["door", "🚪", "part of a house", "open and close it", "in every room", "has a handle", 1], ["socks", "🧦", "clothing", "keep your feet warm", "in a drawer", "come in pairs", 2],
  ["shirt", "👕", "clothing", "wear it", "in the wardrobe", "has sleeves", 1], ["cake", "🎂", "food", "eat it at a birthday", "at a party", "sweet", 2],
  ["pizza", "🍕", "food", "eat it in slices", "at a restaurant", "round and cheesy", 2], ["kettle", "🫖", "kitchen item", "boil water", "in the kitchen", "whistles", 3],
].map(([word, pic, group, use, where, like, level]) => ({ word, pic, group, use, where, like, level }));
const pool = (S) => BANK.filter((b) => b.level <= Math.max(1, S.level));
const picture = (g, b, cx, cy, size) => { g.fillStyle = "#000"; g.globalAlpha = 1; g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(b.pic, cx, cy + size * 0.05); };
function say(text) { try { if (window.speechSynthesis) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 0.85; speechSynthesis.speak(u); } } catch (_) {} }
function distractors(item, list, n, sameGroupFirst) {
  const same = shuffle(list.filter((b) => b !== item && b.group === item.group)), other = shuffle(list.filter((b) => b !== item && b.group !== item.group));
  return (sameGroupFirst ? same.slice(0, 1).concat(other) : other.concat(same)).slice(0, n);
}

// ---- Name It: picture naming with hints (first letter, then what it's used for)
function NameIt(S) {
  const items = shuffle(pool(S));
  return Quiz(S, { round: (i) => {
    const b = items[i % items.length], opts = shuffle([b].concat(distractors(b, BANK, 3, true)));
    return { title: "What is this called?", text: "Say it out loud, then tap the word.", options: opts.map((o) => o.word), answer: opts.indexOf(b), explain: `It's a ${b.word}.`,
      hints: [`It starts with "${b.word[0]}".`, `You ${b.use}.`], draw: (g, A) => picture(g, b, A.x + A.w / 2, A.y + A.h / 2, Math.min(A.h * 0.8, 150)) };
  } });
}

// ---- Word to Picture: hear and read the word, pick the picture
function WordPic(S) {
  const items = shuffle(pool(S));
  let spoken = -1;
  const G = Quiz(S, { round: (i) => {
    const b = items[i % items.length], opts = shuffle([b].concat(distractors(b, BANK, 3, S.level > 1)));
    return { title: "Tap the picture that matches the word", options: opts.map((o) => o.word), answer: opts.indexOf(b), explain: `That's the ${b.word}.`, layout: "row",
      label: (k) => (g, r) => picture(g, opts[k], r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) * 0.62),
      draw: (g, A) => { txt(g, b.word, A.x + A.w / 2, A.y + A.h / 2, Math.min(70, A.h * 0.45), T.ink, { font: T.body }); }, word: b.word };
  } });
  const up = G.update;
  G.update = function (dt, a) { up.call(this, dt, a); const k = G.debug().round; if (k !== spoken && !G.done) { spoken = k; say(items[k % items.length].word); } };
  return G;
}

// ---- Word Web: semantic feature analysis — group, use, place and description of each picture
function WordWeb(S) {
  const items = shuffle(pool(S)), Q = [["group", "What group does it belong to?"], ["use", "What do you do with it?"], ["where", "Where would you find it?"], ["like", "What is it like?"]];
  return Quiz(S, { round: (i) => {
    const b = items[Math.floor(i / 4) % items.length], [field, question] = Q[i % 4];
    const wrong = shuffle([...new Set(BANK.filter((x) => x[field] !== b[field]).map((x) => x[field]))]).slice(0, 3);
    const opts = shuffle([b[field]].concat(wrong));
    return { title: question, text: `Think about the ${b.word}.`, options: opts, answer: opts.indexOf(b[field]), explain: `A ${b.word}: ${b.group}, you ${b.use}, found ${b.where}, ${b.like}.`, layout: "grid",
      draw: (g, A) => { picture(g, b, A.x + A.w * 0.35, A.y + A.h / 2, Math.min(A.h * 0.7, 120)); txt(g, b.word, A.x + A.w * 0.62, A.y + A.h / 2, 40, T.ink, { font: T.body, align: "left" }); } };
  }, split: 0.4 });
}

// ---- Finish the Sentence
const SENTENCES = [
  ["I drink my tea from a", "cup"], ["We cut the paper with", "scissors"], ["Please lock the door with the", "key"], ["The dog wagged its", "tail"],
  ["I brush my teeth with a", "toothbrush"], ["In the rain I open my", "umbrella"], ["At night I sleep in my", "bed"], ["She wrote a letter with a", "pen"],
  ["The bird built a", "nest"], ["We boil water in the", "kettle"], ["I wash my hands with", "soap"], ["He rides his", "bicycle"],
  ["The cow gives us", "milk"], ["Put on your socks and your", "shoes"], ["I read a good", "book"], ["We sat down on the", "chair"],
  ["The moon shines at", "night"], ["She called her friend on the", "phone"], ["He hit the nail with a", "hammer"], ["Let's kick the", "ball"],
  ["I eat soup with a", "spoon"], ["The fish swims in the", "water"], ["Light the room with the", "lamp"], ["We blew out the candles on the", "cake"],
];
const FILLERS = ["window", "pillow", "river", "garden", "cloud", "basket", "ladder", "button", "carpet", "mirror", "sugar", "train", "jacket", "bottle"];
function Sentence(S) {
  const list = shuffle(SENTENCES);
  return Quiz(S, { round: (i) => {
    const [stem, ans] = list[i % list.length], opts = shuffle([ans].concat(shuffle(FILLERS.concat(SENTENCES.map((x) => x[1])).filter((w) => w !== ans)).slice(0, 3)));
    return { title: "Which word finishes the sentence?", options: opts, answer: opts.indexOf(ans), explain: `${stem} ${ans}.`,
      draw: (g, A) => { const s = `${stem} ______.`; txt(g, s, A.x + A.w / 2, A.y + A.h / 2, Math.min(40, (A.w / s.length) * 1.9), T.ink, { font: T.body }); } };
  } });
}

// ---- Spell It: tap the scrambled letters in the right order
const EXTRA_WORDS = { 1: ["sun", "hat", "map", "cup", "pen", "bus", "egg", "key", "dog", "cat"], 2: ["chair", "bread", "clock", "horse", "flower", "socks", "glass", "plate"], 3: ["kitchen", "blanket", "scissors", "umbrella", "bicycle", "garden", "doctor"] };
function SpellIt(S) {
  const rounds = S.reps || 5, G = base(S, rounds);
  const [lo, hi] = { 1: [3, 5], 2: [5, 7], 3: [7, 10] }[S.level] || [3, 5];
  const words = shuffle(BANK.map((b) => b.word).concat(EXTRA_WORDS[S.level] || []).filter((w) => w.length >= lo && w.length <= hi && /^[a-z]+$/.test(w)));
  let word = "", tiles = [], typed = [], rects = [], back = null, fbT = 0, t = 0, right = 0, slips = 0, shake = 0;
  function newWord() { word = words[G._reps % words.length]; tiles = shuffle(word.split("").map((ch, i) => ({ ch, i, used: false }))); typed = []; }
  newWord();
  function tapTile(k) {
    const tl = tiles[k]; if (!tl || tl.used || fbT > 0) return;
    if (tl.ch === word[typed.length]) { tl.used = true; typed.push(k); G.events.push("tick"); if (typed.length === word.length) { right++; G._reps++; fbT = 1; G.events.push("success"); } }
    else { slips++; shake = 0.3; G.events.push("error"); }
  }
  G.update = function (dt) { t += dt; shake = Math.max(0, shake - dt); if (fbT > 0) { fbT -= dt; if (fbT <= 0) { if (G._reps >= rounds) G.done = true; else newWord(); } } };
  G.pointer = (e) => {
    if (e.type !== "down") return;
    if (back && inRect(e.x, e.y, back) && typed.length) { tiles[typed.pop()].used = false; return; }
    tapTile(rects.findIndex((r) => inRect(e.x, e.y, r)));
  };
  const b = () => BANK.find((x) => x.word === word);
  G.status = () => (fbT > 0 ? { title: `"${word}"`, text: "Spelled right.", tone: "good" } : { title: "Spell the word", text: b() ? "Tap the letters in order. The picture is a clue." : `Tap the letters in order. It has ${word.length} letters.` });
  G.stats = () => [["Words spelled", `${right} / ${rounds}`], ["Wrong letters tapped", String(slips)], ["Time", fmtTime(t)]];
  G.debug = () => ({ word, tiles, rects, next: tiles.findIndex((tl) => !tl.used && tl.ch === word[typed.length]) });
  G.draw = function (g, W, H) {
    bg(g, W, H, true); dots(g, W, rounds, G._reps);
    if (b()) picture(g, b(), W / 2, 200, 90);
    const n = word.length, s = Math.min(76, (W - 80) / n - 10), x0 = W / 2 - (n * (s + 10) - 10) / 2, off = shake > 0 ? Math.sin(t * 60) * 6 : 0;
    for (let i = 0; i < n; i++) { rr(g, x0 + i * (s + 10) + off, 270, s, s, 12); g.fillStyle = i < typed.length ? alpha(T.go, 0.18) : alpha(T.ink, 0.06); g.fill(); if (i < typed.length) txt(g, word[i], x0 + i * (s + 10) + s / 2 + off, 270 + s / 2, s * 0.5, T.ink, { font: T.body }); }
    const y = Math.min(H - s - 90, 300 + s + 30);
    rects = tiles.map((_, i) => ({ x: x0 + i * (s + 10), y, w: s, h: s }));
    tiles.forEach((tl, i) => { const r = rects[i]; rr(g, r.x, r.y, r.w, r.h, 12); g.fillStyle = tl.used ? alpha(T.ink, 0.04) : T.surface; g.fill(); if (!tl.used) txt(g, tl.ch, r.x + s / 2, r.y + s / 2, s * 0.5, T.ink, { font: T.body }); });
    back = { x: W / 2 - 80, y: H - 64, w: 160, h: 46 };
    rr(g, back.x, back.y, back.w, back.h, 12); g.fillStyle = T.surface; g.fill(); txt(g, "← Undo", W / 2, back.y + 23, 17, T.ink, { font: T.body });
  };
  return G;
}

const brain = { control: "touch", mount: "" };
const ROUNDS = { params: { reps: [6, 10, 15], level: [1, 2, 3], durationS: null }, defaults: { reps: 10, level: 1, durationS: null } };
[
  Object.assign({ id: "nameit", name: "Name It", movement: "Naming · word finding",
    desc: "Name the picture out loud, then tap the right word. Hints give the first letter, then what it's for.", source: "Picture naming with cueing (Tactus Naming Therapy; VoiceAdapt trial).",
    how: ["Look at the picture and try to say its name.", "Tap Hint if the word won't come.", "Tap the matching word."], make: NameIt }, brain, ROUNDS),
  Object.assign({ id: "wordpic", name: "Word to Picture", movement: "Word comprehension",
    desc: "Hear and read a word, then tap the matching picture.", source: "Constant Therapy auditory and reading comprehension.",
    how: ["Turn the sound on to hear the word.", "Read the word at the top.", "Tap the picture it names."], make: WordPic }, brain, ROUNDS),
  Object.assign({ id: "wordweb", name: "Word Web", movement: "Word meaning · semantic features",
    desc: "For each picture, choose its group, what it's used for, where it's found and what it's like.", source: "Semantic Feature Analysis for aphasia.",
    params: { reps: [8, 12, 16], level: [1, 2, 3], durationS: null }, defaults: { reps: 8, level: 1, durationS: null },
    how: ["Look at the picture and its name.", "Answer each question about it.", "Saying the answer out loud helps."], make: WordWeb }, brain),
  Object.assign({ id: "sentence", name: "Finish the Sentence", movement: "Sentence comprehension",
    desc: "Pick the word that best finishes each sentence.", source: "Constant Therapy sentence completion and reading comprehension.",
    how: ["Read the sentence out loud.", "Think what word fits the gap.", "Tap it."], make: Sentence }, brain, ROUNDS),
  Object.assign({ id: "spell", name: "Spell It", movement: "Spelling",
    desc: "Tap the scrambled letters in the right order to spell the word.", source: "Constant Therapy spelling and anagram tasks.",
    params: { reps: [5, 8, 10], level: [1, 2, 3], durationS: null }, defaults: { reps: 5, level: 1, durationS: null },
    how: ["Look at the picture clue.", "Tap the first letter, then the next.", "Tap Undo to take a letter back."], make: SpellIt }, brain),
].forEach((d) => RC.register(Object.assign({ section: "language" }, d)));

defineArt("nameit", '<rect x="40" y="6" width="40" height="34" rx="6" fill="var(--a-bg)"/><circle cx="60" cy="23" r="9" fill="var(--a-hi)"/><rect x="34" y="46" width="52" height="10" rx="4" fill="var(--a-mute)" opacity=".35"/>');
defineArt("wordpic", '<text x="60" y="22" font-size="13" font-weight="700" text-anchor="middle" fill="var(--a-ink)">apple</text><rect x="22" y="30" width="22" height="22" rx="4" fill="var(--a-bg)"/><rect x="49" y="30" width="22" height="22" rx="4" fill="var(--a-bg)" stroke="var(--a-go)" stroke-width="2"/><rect x="76" y="30" width="22" height="22" rx="4" fill="var(--a-bg)"/><circle cx="60" cy="41" r="6" fill="var(--a-hi)"/>');
defineArt("wordweb", '<circle cx="60" cy="32" r="9" fill="var(--a-hi)"/>' + [[28, 14], [92, 14], [28, 50], [92, 50]].map(([x, y]) => `<path d="M60 32 L${x} ${y}" stroke="var(--a-mute)" stroke-width="1.5"/><rect x="${x - 12}" y="${y - 6}" width="24" height="12" rx="4" fill="var(--a-bg)"/>`).join(""));
defineArt("sentence", '<path d="M18 30 h20 M42 30 h16" stroke="var(--a-mute)" stroke-width="4" stroke-linecap="round"/><path d="M64 34 h26" stroke="var(--a-hi)" stroke-width="3" stroke-dasharray="4 3"/><path d="M94 30 h8" stroke="var(--a-mute)" stroke-width="4" stroke-linecap="round"/>');
defineArt("spell", '<rect x="22" y="20" width="18" height="22" rx="4" fill="var(--a-bg)"/><rect x="44" y="20" width="18" height="22" rx="4" fill="var(--a-bg)"/><rect x="66" y="20" width="18" height="22" rx="4" fill="var(--a-go)" opacity=".25"/><text x="31" y="36" font-size="13" font-weight="700" text-anchor="middle" fill="var(--a-ink)">c</text><text x="53" y="36" font-size="13" font-weight="700" text-anchor="middle" fill="var(--a-ink)">a</text><text x="75" y="36" font-size="13" font-weight="700" text-anchor="middle" fill="var(--a-ink)">t</text>');
})();
