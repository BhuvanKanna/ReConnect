# ReConnect: provider plans, full exercise library, and redesign

Status: draft for approval · 2026-10-17

## Why

ReConnect is a phone-controlled stroke-rehab web app (static site on GitHub Pages; the phone pairs by QR code
and acts as a motion controller). It has 6 activities and no notion of a care plan.

In real use, a **medical provider assigns exercises to a patient on a month-long schedule**. The patient must
complete what is assigned each day and may do more if they want. The provider needs to see both. Separately,
the app has too few exercises compared with what clinicians actually use, and the UI looks generic.

This round is a **demonstration build**: one website that contains both the provider side and the patient side.
Real provider and patient accounts (logins, a server, remote report delivery) come later, so the data model
should not paint us into a corner, but no backend is built now.

## Goals

1. **Patient "Today" home**: a goals bar on top that shows today's assigned exercises, progress, and sends the
   patient straight to the next one; the full exercise library below, freely playable as extra practice.
2. **Provider side**: patient list, a 30-day plan builder, and a progress view with adherence, extra
   sessions, results, and an exportable report.
3. **Every commonly used post-stroke motion and brain exercise** (the 47 researched types (57 tiles once grouped items are split) plus the 6 existing),
   each playable in the app.
4. **Redesign** in the approved "calm clinical" direction (theme B), with considered motion.

## Non-goals (this round)

- Real accounts, authentication, a server, or syncing data between devices. Everything lives in the browser's
  `localStorage` on the one computer.
- Speech recognition. Language tasks are multiple choice.
- Fixing phone pairing on restrictive networks (needs a TURN relay; tracked separately, see "Known issue").
- Clinical claims. Copy says the provider assigned it; it never promises recovery.

## Anti-goals (would make this a failure even if it works)

- Looking like a generic AI-generated dashboard (purple gradients, emoji-heavy cards, identical tile grids with
  no hierarchy, filler copy).
- Feeling childish or patronising to adult patients. Games are dignified, plain-spoken.
- Overwhelming a patient with cognitive impairment: the next step must always be obvious from the top bar.
- Punishing language or red "failure" states. Misses are neutral; progress is encouraging.
- Small targets or low contrast. Many users are older, have low vision, tremor, or one-sided neglect.
- Breaking what works: pairing, the 6 existing games, mouse mode, session log, the smoke test.

## Constraints

- **Static site, no build step**, served from GitHub Pages at `https://bhuvankanna.github.io/ReConnect/`.
  Vanilla HTML/CSS/JS as today. External libraries only if vendored into `vendor/` (as PeerJS and qrcode are).
- Must keep `.nojekyll`, `vendor/`, and relative paths.
- Existing `localStorage` keys (`mend.settings`, `mend.log`, `mend.code6`) and the PeerJS id prefix
  `mend-rehab-` stay as they are so existing logs and pairing keep working.
- Works on a laptop/desktop browser (computer page) and a phone browser (controller page), iOS Safari and
  Android Chrome. Keyboard accessible; respects `prefers-reduced-motion`.

## Decided

### Visual direction: theme B "calm clinical" (approved via mockup)

- Background soft grey-teal (`#eef3f2`), white cards with soft layered shadow, primary deep teal (`#0f766e`),
  ink `#0e2a2b`, muted `#4d6a6b`. Brain exercises can use a secondary accent (muted violet `#5b4bb5`, as in the
  provider calendar chips) so motion vs brain is distinguishable at a glance.
- Typeface **Atkinson Hyperlegible** (designed for low vision) for body and UI; loaded from Google Fonts with a
  system fallback.
- Progress ring for the day's goals.
- Large type (base ≥ 18px on the patient side) and large targets (≥ 48px, primary buttons bigger).

### Patient home layout (approved via mockup)

- **Top bar ("Today")**: progress ring (e.g. 2/3), the list of today's assigned exercises with done ones struck
  through, the next one highlighted, and a big **Start** button that opens the next assigned exercise with the
  provider's settings already applied.
- **All-done state**: the bar turns solid teal with a message in this spirit: *"That's today's plan, done. Nice
  work, Ruth. Anything you play from here is bonus practice your therapist will see too."*
- **Rest day / no plan**: the bar says so plainly and the library is still open.
- **Library below**: every exercise as a tile, grouped by section (Arm & shoulder, Wrist & forearm, Hand &
  fingers, Trunk & legs, Therapy sessions, Visual scanning, Attention, Memory, Reasoning, Language) with filter
  tabs. Tiles show name, a small illustration, and how it is controlled (📱 phone motion / 👆 touch / 🧭
  guided). Tiles assigned today carry a "Today" tag (✓ when done).
- Anything played from the library that isn't an outstanding assigned item is recorded as **extra**.
- Pairing panel / phone status stays available (header pill opens it).

### Provider side (approved via mockup)

- Left sidebar: patient list with a status dot (on track / behind), "+ Add patient".
- **Plan tab**: a 30-day calendar from a chosen start date. Click a day → add exercises from the library, each
  with its own settings (reps, level/range, side, duration for guided items). Mark rest days. **"Copy week 1 →
  all weeks"**. Exercises with a safety flag show ⚠︎ and must be explicitly enabled.
- **Progress tab**: headline numbers (assigned days completed, extra sessions, change in a key measure such as
  shoulder range), a day-by-day adherence strip (done / partly / missed / rest / future), and a recent-sessions
  table with each row tagged Assigned or Extra. **Export**: CSV and a print-friendly report page (browser print
  to PDF).

### Demo mode

- A clearly labelled demo switch at the top toggles **Provider** ↔ **Patient**, and on the patient side picks
  which patient is "logged in". No passwords.
- First load seeds one demo patient (e.g. "Ruth A.") whose plan started 11 days ago, with realistic history, so
  both sides look alive. A "Reset demo data" control restores the seed.

### Assignment rules

- A day's plan is a list of items `{exerciseId, settings}`.
- An assigned item is **done** when a session of that exercise is finished on that calendar day (local time)
  with at least the assigned settings (reps/level). Sessions are matched to outstanding items in order; a second
  play of the same exercise counts as extra.
- Day status: **done** (all items), **partly** (some), **missed** (past day, none), **rest**, **future**.
- A session started from the library for an exercise that *is* outstanding today counts toward the goal
  (the patient shouldn't be penalised for not using the Start button).

### Exercise library (all of these ship)

Legend: 📱 phone motion · 👆 touch/click · 🧭 guided (instructions + timer + rep counter + patient confirms).
"New" = to build. Names are working titles.

**Arm & shoulder**
| # | Exercise | Control | Notes |
|---|---|---|---|
| – | Lantern Lift (shoulder flexion) | 📱 | existing |
| 1 | Side Raise (abduction) | 📱 | new |
| 2 | Reach Targets (diagonal reach, GRASP target board) | 📱 | new |
| 3 | Cup to Mouth (elbow flexion, drinking) | 📱 | new |
| 4 | Push Away (forward push/punch) | 📱 accel | new |
| 5 | Table Slide (slide object across table) | 📱 accel/yaw | new |
| 6 | Bowl Lift (two-handed) | 📱 | new |
| 7 | Trace It (shapes and circles) | 📱 | new |

**Wrist & forearm**
| – | Pour the Tea, Combination Lock, Tilt Maze | 📱 | existing |
| 8 | Wrist Bend (flexion/extension) | 📱 | new |
| 9 | Wrist Wiper (radial/ulnar deviation) | 📱 | new |
| 10 | Steady Cup (hold level, tremor/steadiness) | 📱 | new |

**Hand & fingers**
| 11 | Finger Tap (speed) | 👆 | new |
| 12 | Finger Rhythm (sequence, MusicGlove-style) | 👆 | new |
| 13 | Dial a Number (mRehab phone number) | 👆 | new |
| 14 | Pinch & Place (pinch/drag precision) | 👆 | new |
| 15a–d | Grip & Release, Putty Squeeze, Finger Curls, Thumb Touches | 🧭 | new, one tile each |
| 16a–d | Clothespins, Coins, Buttons, Knife & Fork (GRASP hand skills) | 🧭 | new, one tile each |

**Trunk & legs**
| 17 | Lean & Shift (seated weight shift, phone in shirt pocket) | 📱 | new |
| 18 | Trunk Twist (seated) | 📱 yaw | new |
| 19 | Sit to Stand (counter) | 📱 accel | new · ⚠︎ provider must enable |
| 20 | Balance Hold (standing, sway score) | 📱 | new · ⚠︎ provider must enable; "have someone nearby" screen |
| 21a–c | Seated March, Heel Raises, Ankle Pumps | 📱/🧭 | new, one tile each |

**Therapy sessions**
| 22 | Mirror Therapy (guided session) | 🧭 | new |
| 23 | Mental Practice (spoken guided imagery) | 🧭 | new |

**Visual scanning (neglect)**
| 24 | Cancel It (cancellation) | 👆/📱 | new |
| 25 | Look Left Search (visual search with left-side cue) | 👆 | new |
| 26 | Find the Middle (line bisection) | 👆 | new |

**Attention**
| 27 | Quick Catch (reaction time) | 👆/📱 | new |
| 28 | Go / No-Go | 👆/📱 | new |
| 29 | Night Watch (sustained attention) | 👆 | new |
| 30 | Two at Once (divided attention) | 👆 | new |
| 31 | Trail Connect (A: numbers, B: numbers–letters) | 👆/📱 | new |

**Memory**
| – | Memory Moves | 📱 | existing |
| 32 | Card Pairs | 👆/📱 | new |
| 33 | N-Back | 👆 | new |
| 34 | Number Span | 👆 | new |
| 35 | Word Recall | 👆 | new |
| 36a–b | Shopping List, Names & Faces (everyday memory) | 👆 | new, one tile each |

**Reasoning**
| – | Sort It | 📱 | existing |
| 37 | Tower Puzzle (planning) | 👆/📱 | new |
| 38 | Errand Planner (route/plan a trip) | 👆 | new |
| 39 | What Comes Next (pattern completion) | 👆 | new |
| 40 | Turn the Shape (mental rotation) | 👆/📱 | new |
| 41a–b | Make Change, Tell the Time (money and time) | 👆 | new, one tile each |
| 42 | Rule Switch (sort by colour, then shape) | 👆/📱 | new |

**Language (multiple choice, no microphone)**
| 43 | Name It (picture naming with hints) | 👆 | new |
| 44 | Word to Picture (matching) | 👆 | new |
| 45 | Word Web (semantic feature analysis) | 👆 | new |
| 46 | Finish the Sentence | 👆 | new |
| 47 | Spell It (spelling/anagram) | 👆 | new |

That is 6 existing + 57 new tiles = **63 tiles**. Each new exercise needs: a short description, a "how to"
(3 steps), a source line (program/study it comes from, matching the style of `docs/exercise-catalog.md`),
difficulty levels (at least 3), configurable reps/rounds or duration, and a finish summary that is recorded in
the session log (score/time/reps and, for motion, range of motion where measurable).

`docs/exercise-catalog.md` is updated with the new sources (GRASP, RehaCom, Otago, neglect scanning research,
computerised cognitive training review, aphasia naming research) and the ReConnect column filled in.

### Phone controller additions

The phone currently sends tilt only (`{type:"m", b, g}`). Extend it to also send:
- yaw (`alpha`) for twists,
- acceleration (from `devicemotion`) for push, slide, sit-to-stand and marching rep detection,
- **touch pad mode**: when a hand/finger exercise starts with a paired phone, the computer tells the phone to
  show a tap pad (targets laid out as the exercise needs); the phone sends taps back. Finger exercises are about
  the fingers, so they use the phone's touch screen when paired, and fall back to mouse/touch on the computer.

Brain exercises marked 👆/📱 can be played either by clicking/tapping on the computer or by a tilt cursor
with the phone (tilt to move, hold still to select), so a patient can practise arm control and cognition
together.

### Motion and polish

Follow the taste-skill and Emil Kowalski design-engineering guidance (if the skills are not installed
locally, read them from their GitHub repos as references):
- Short, purposeful animation: UI transitions ~150–250ms, ease-out; no animation on things that happen many
  times per minute; nothing that blocks input.
- Goal tick: a small, satisfying check + ring fill when an assigned item completes; a calm celebration (no
  confetti storm) when the day is done.
- Respect `prefers-reduced-motion` everywhere.
- Avoid generic-AI tells listed above; real hierarchy (the Today bar dominates, library is secondary).

### Calls made while writing this (not discussed; flag if wrong)

- **Settings move from global to per item.** Assigned items use the provider's settings. Extra practice uses
  the patient's last-used settings for that exercise (default level 2). The old global side/level/reps
  controls become per-exercise controls on the setup screen.
- **Existing session log** (`mend.log`, recorded before plans existed) is shown under the demo patient as
  "before plan" history, not deleted. New sessions carry a `patientId` and `assigned: true|false`.
- **Patient side keeps a light "My progress" view** (this week's days and recent sessions). The full log,
  adherence and export live on the provider side.
- **Evidence page stays**, reachable from both sides as "About these exercises".
- **Build order**: (1) redesign shell + plan model + patient Today + provider plan/progress + demo seed,
  (2) phone protocol additions, (3) new exercises family by family, each family shipped with its tests.

## Left to the builder

- File structure. (Suggested: split the current single `index.html` script into ES modules under `js/`, e.g.
  core/storage/input/link, one file per exercise family, plan model, patient UI, provider UI. No bundler.)
- Exact game mechanics, scoring, and level tuning for each new exercise, within the descriptions above.
- Illustrations for tiles and picture tasks (simple inline SVG drawn in-house or emoji; no third-party
  image packs that need licensing).
- Exact copy, within the tone rules above.
- Dark mode (nice to have, matching theme B).
- Thresholds for rep detection from acceleration.

## Testing

- Extend `tests/smoke_test.py`: switch to provider, build a short plan, switch to patient, follow the Today bar
  through the assigned items (mouse mode), confirm the all-done state, play one extra, confirm provider progress
  shows assigned vs extra. Open every exercise tile in mouse/click mode and finish or exit without JS errors.
- Keep the existing pairing + six-activity checks passing.

## Known issue (out of scope here)

Phone pairing fails with "Couldn't reach the computer" on networks that block direct peer-to-peer connections,
because PeerJS's free relay (TURN) servers aren't responding. Fix later by adding a working TURN service
(e.g. Metered Open Relay) via `window.MEND_PEER_OPTS`; that needs the user's account and a decision about
exposing relay credentials in a public repo.
