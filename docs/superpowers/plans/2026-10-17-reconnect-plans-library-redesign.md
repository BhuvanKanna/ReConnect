# ReConnect plans, library and redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn ReConnect into a demo with a provider side (patients, 30-day plans, progress) and a patient side
(Today goals bar + 63-exercise library), restyled in the approved theme B.

**Architecture:** Still a static site with no build step. The 1,300-line `index.html` is split into a CSS file
and classic `<script defer>` files that share one global namespace `window.RC` (classic scripts, not ES
modules, so `file://` previews keep working). Pure logic (plan rules, storage shape, demo seed) lives in UMD
files that also run under Node for unit tests. Exercises register themselves into a registry; shared "kits"
(rep counter, tilt cursor, multiple choice, guided session) keep each exercise small.

**Tech Stack:** Vanilla HTML/CSS/JS, Canvas 2D, PeerJS 1.5.4 (vendored), Node 24 `node --test` for unit tests,
Python 3 + Playwright for end-to-end tests.

**Spec:** `docs/superpowers/specs/2026-10-17-reconnect-plans-library-redesign-design.md`

## Global Constraints

- Static site, no build step, no bundler; must work from `https://bhuvankanna.github.io/ReConnect/` and from `file://` (pairing excepted).
- Keep `.nojekyll`, `vendor/`, relative paths. New libraries only if vendored into `vendor/`.
- Keep existing `localStorage` keys `mend.settings`, `mend.log`, `mend.code6` and the PeerJS prefix `mend-rehab-`. New keys use the `mend.` prefix too.
- Theme B tokens: background `#eef3f2`, surface `#ffffff`, primary `#0f766e`, ink `#0e2a2b`, muted `#4d6a6b`, brain accent `#5b4bb5`.
- Typeface Atkinson Hyperlegible (Google Fonts) with system fallback; patient-side base font ≥ 18px; targets ≥ 48px.
- All-done copy, in this spirit: "That's today's plan, done. Nice work, {first name}. Anything you play from here is bonus practice your therapist will see too."
- Tone: plain, adult, encouraging; never "fail"/"wrong" in red; no recovery claims.
- Motion: UI transitions 150–250ms ease-out; nothing animates on high-frequency actions; everything respects `prefers-reduced-motion`.
- Language tasks are multiple choice (no microphone). Sit to Stand and Balance Hold are locked unless the provider enables them per patient.
- `window.__mend` stays as the test hook (extended, never removed).

## Review Focus

1. **Midnight rollover / app left open overnight** → the Today bar must switch to the new day without a reload (re-evaluate on `visibilitychange`, on window focus, and once a minute). Test: Task 5.
2. **Provider edits today's plan after some exercises are done** → done ticks are recomputed from sessions, nothing crashes, removed items vanish, already-finished sessions of removed items become extra. Test: Task 2.
3. **`localStorage` empty, blocked, or holding corrupt JSON** → app renders with the demo seed and never throws. Test: Task 3.
4. **Patient with no plan, or plan finished (day 31+)** → Today bar shows a plain "No plan for today" state; library still works; provider progress shows the finished plan. Test: Tasks 2 and 5.
5. **Phone disconnects during a touch-pad exercise** → the exercise falls back to computer pointer input with a banner; it never waits forever for pad taps. Test: Task 8.

---

## File structure

| File | Responsibility |
|---|---|
| `index.html` | Markup shell only: header, views (`vPatient`, `vProvider`, `vPlay`, `vAbout`), pairing drawer, script tags |
| `css/app.css` | Theme B tokens (light + dark), components, layout |
| `js/core.js` | `RC` namespace, DOM/math helpers, `store`, `settings`, theme colours for canvas, `chime` |
| `js/input.js` | `Input`, `angles()`, smoothing, mouse/keyboard stand-in, pointer routing to the running exercise |
| `js/link.js` | PeerJS pairing, `sendPhone`, `pushStatus`, phone message handling, touch-pad protocol |
| `js/kit.js` | Shared exercise building blocks: `base`, `drawGonio`, `RepCounter`, `Cursor`, `Choice`, `Guided`, `art` helpers |
| `js/registry.js` | `RC.SECTIONS`, `RC.EXERCISES`, `RC.register(def)`, `RC.exercise(id)` |
| `js/games/arm.js` … `js/games/language.js` | One file per library section; each calls `RC.register` |
| `js/plan.js` | UMD, pure: dates, plan shape, matching sessions to assigned items, day status, progress summary, copy week |
| `js/data.js` | UMD, pure over an injected store: load/save patients, plans, sessions; legacy-log migration; demo seed |
| `js/engine.js` | `Game`, setup sheet, calibration, play loop, finish → session record (with `patientId`, `assigned`) |
| `js/patient.js` | Today bar, library tiles + filters, My progress |
| `js/provider.js` | Patient sidebar, plan builder, progress, CSV export, print report |
| `js/about.js` | "About these exercises" (moved EVIDENCE data + render) |
| `js/app.js` | Boot, view routing, demo role switch, day-rollover timer |
| `phone.html` | Adds touch-pad mode |
| `tests/plan.test.js`, `tests/data.test.js` | Node unit tests |
| `tests/smoke_test.py` | End-to-end (updated selectors + new flows + every-tile check) |

Script order in `index.html` (all `defer`): `vendor/peerjs.min.js`, `vendor/qrcode.js`, `js/core.js`, `js/input.js`,
`js/link.js`, `js/kit.js`, `js/registry.js`, `js/games/*.js` (alphabetical), `js/plan.js`, `js/data.js`,
`js/engine.js`, `js/patient.js`, `js/provider.js`, `js/about.js`, `js/app.js`.

UMD wrapper for `plan.js` and `data.js`:

```js
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.RC = root.RC || {}).plan = api; // data.js uses .data
})(typeof self !== "undefined" ? self : this, function () { /* ... */ return { /* exports */ }; });
```

## Shared shapes (used by several tasks)

```js
// Exercise definition (registry)
{ id: "wiper", name: "Wrist Wiper", section: "wrist",            // section ids: see Task 1
  control: "tilt" | "touch" | "guided" | "accel",
  cursor: false,            // touch exercise also playable with the tilt cursor
  pad: null | "keys" | "fingers" | "done",  // phone touch-pad layout when paired
  safety: null | "standing",                // locked unless patient.enabled[id]
  movement, desc, mount, source, how: [s1, s2, s3],
  params: { reps: [6, 10, 15] | null, level: [1, 2, 3], durationS: [60, 120, 180] | null },
  defaults: { reps: 10, level: 2, durationS: null },
  make: (S) => instance }
// S passed to make(): { amp, level, reps, durationS, side }   amp = {1:15, 2:30, 3:45}[level]

// Exercise instance (existing contract, plus optional hooks)
{ S, events: [], done: false, reps(), goal(), update(dt, a), status() -> {title, text, tone},
  stats() -> [[label, value]], draw(g, W, H, a, t),
  pointer?(ev),   // ev: { type: "down"|"move"|"up", x, y } in stage CSS px
  pad?(ev),       // ev: { type: "tap", key: string } from the phone touch pad
  debug?() }
// a (input sample): { pitch, roll, yaw, acc, demo }   acc = |accel| − 9.81, m/s² (0 when unknown)

// Patient / plan / session (storage)
patient = { id: "p_ruth", name: "Ruth A.", side: "right", enabled: { sit2stand: false, balance: false } }
plan    = { patientId, start: "YYYY-MM-DD", days: [ { rest: false, items: [ { exerciseId, reps, level, durationS } ] } ×30 ] }
session = { at: ISO, id: exerciseId, name, movement, side, targetDeg, reps, goal, level, seconds, input,
            pitch, roll, peaksPerRep, activeS, extra: [[k, v]],      // existing fields, unchanged
            patientId, assigned: true|false, completed: true|false }  // new
```

---

### Task 1: Split `index.html` into CSS + script files (no behaviour change)

**Files:**
- Create: `css/app.css` (current `<style>` block, lines 15–169), `js/core.js`, `js/input.js`, `js/link.js`, `js/kit.js`, `js/registry.js`, `js/engine.js`, `js/games/arm.js` (Lantern Lift), `js/games/wrist.js` (Pour, Lock, Maze), `js/games/reasoning.js` (Sort It + `WORDS`), `js/games/memory.js` (Memory Moves), `js/about.js` (EVIDENCE), `js/app.js` (boot, views, cards, log)
- Modify: `index.html` (drop inline CSS/JS, add `<link>` and `<script defer>` tags in the order above)

**Interfaces:**
- Produces: `RC.$, RC.clamp, RC.lerp, RC.TAU, RC.reduceMotion, RC.store, RC.settings, RC.saveSettings, RC.T, RC.readTheme, RC.alpha, RC.txt, RC.rr, RC.chime, RC.esc, RC.fmtTime` (core); `RC.Input, RC.angles()` (input); `RC.Link, RC.sendPhone(obj), RC.pushStatus(force)` (link); `RC.kit.base(S, goal), RC.kit.drawGonio(g, cx, cy, R, deg, target, label)` (kit); `RC.SECTIONS, RC.EXERCISES, RC.register(def), RC.exercise(id)` (registry); `RC.Game, RC.openActivity(def, opts)` (engine).
- `RC.SECTIONS` = `[["arm","Arm & shoulder"],["wrist","Wrist & forearm"],["hand","Hand & fingers"],["trunk","Trunk & legs"],["sessions","Therapy sessions"],["scanning","Visual scanning"],["attention","Attention"],["memory","Memory"],["reasoning","Reasoning"],["language","Language"]]`.
- Existing 6 defs gain `section`, `control: "tilt"`, `params`, `defaults` (reps 10, level 2).

- [ ] **Step 1:** Run the current suite to record a baseline: `python tests/smoke_test.py` → `ALL CHECKS PASSED`.
- [ ] **Step 2:** Move code as listed; replace the IIFE-local references with `RC.*`. Keep every element id and `window.__mend`.
- [ ] **Step 3:** Run `python tests/smoke_test.py` → `ALL CHECKS PASSED`. Also open `index.html` via `file://` in Playwright and assert no page errors.
- [ ] **Step 4:** Commit: `git commit -m "refactor: split index.html into css and script files"`.

### Task 2: Plan model (`js/plan.js`)

**Files:** Create `js/plan.js`, `tests/plan.test.js`

**Interfaces (all pure, exported on `RC.plan` / `module.exports`):**
- `dateKey(d: Date) -> "YYYY-MM-DD"` (local time)
- `addDays(key: string, n: number) -> string`
- `emptyPlan(patientId: string, start: string) -> plan` (30 days, `rest: false`, no items)
- `dayIndex(plan, key) -> number` (0–29, or −1 outside the plan)
- `itemsFor(plan, key) -> item[]` (empty on rest days / outside)
- `meets(session, item) -> boolean` — same exercise, `completed`, and (`item.reps` ? `session.reps >= item.reps` : true) and (`session.level >= item.level`) and (`item.durationS` ? `session.seconds >= item.durationS * 0.9` : true)
- `matchDay(items, sessions) -> { done: boolean[], assignedAt: Set<string> }` — sessions are that day's, that patient's, chronological; each session fills the first not-done item it `meets`; `assignedAt` holds the `at` of sessions that filled an item
- `dayStatus(plan, key, sessions, todayKey) -> "done"|"partly"|"missed"|"rest"|"future"|"today"|"outside"` (`"today"` = today with items not all done)
- `today(plan, todayKey, sessions) -> { state: "progress"|"done"|"rest"|"none", items: [{...item, done}], next: item|null, doneCount, total }`
- `progress(plan, sessions, todayKey) -> { daysDone, daysDue, extra, strip: status[30], range: { first: number, last: number } | null }` — `range` from Lantern Lift sessions' `pitch[1]` (first vs latest)
- `copyWeek(plan) -> plan` — days 7–29 become copies of day `i % 7`

- [ ] **Step 1: Write failing tests** in `tests/plan.test.js` (`node:test`, `node:assert/strict`), including:

```js
test("matchDay fills items in order and counts repeats as extra", () => {
  const items = [{ exerciseId: "lift", reps: 10, level: 2 }, { exerciseId: "pairs", reps: null, level: 3 }];
  const s = (id, reps, level, at) => ({ id, reps, level, seconds: 60, completed: true, at });
  const r = plan.matchDay(items, [s("lift", 10, 2, "a"), s("lift", 10, 2, "b"), s("pairs", 0, 3, "c")]);
  assert.deepEqual(r.done, [true, true]);
  assert.deepEqual([...r.assignedAt].sort(), ["a", "c"]);
});
test("a session below the assigned reps does not tick the goal", ...);            // lift reps 6 vs item 10 → done [false]
test("today() reports next item and done state", ...);                           // 1 of 2 done → state "progress", next = item 2; 2 of 2 → "done", next null
test("rest day and outside-plan days", ...);                                     // rest → "rest"; day 30 → "none"; dayStatus → "rest"/"outside"
test("past day with nothing done is missed, with some done is partly", ...);
test("editing today's plan recomputes ticks", ...);                              // Review Focus 2: remove item 1 after it was done → today().items has 1 item, done false; that session not in assignedAt
test("copyWeek repeats week 1", ...);                                            // days[8] deep-equals days[1], and is a copy (mutating one does not change the other)
test("progress counts due days, done days and extras", ...);
```

- [ ] **Step 2:** `node --test tests/` → FAIL (module not found).
- [ ] **Step 3:** Implement `js/plan.js` with the UMD wrapper.
- [ ] **Step 4:** `node --test tests/` → all pass.
- [ ] **Step 5:** Commit `feat: plan model with assignment matching`.

### Task 3: Storage, legacy migration and demo seed (`js/data.js`)

**Files:** Create `js/data.js`, `tests/data.test.js`

**Interfaces (`RC.data` / `module.exports`):**
- `createData(store: {get(k, d), set(k, v)}, now: () => Date) -> api` where api is:
  - `patients() -> patient[]`, `savePatient(p)`, `plan(patientId) -> plan|null`, `savePlan(plan)`
  - `sessions(patientId?) -> session[]` (chronological), `addSession(session)` (keeps last 2,000)
  - `role() -> "patient"|"provider"`, `setRole(r)`, `activePatientId() -> string`, `setActivePatient(id)`
  - `ensureSeed()` — if `mend.patients` is missing/invalid, write the demo seed; idempotent
  - `resetDemo(opts?: { todayItems?: item[] })` — overwrite patients/plans/sessions with a fresh seed (legacy sessions kept); `todayItems` (tests only) replaces Ruth's items for today and clears her sessions for today
- Keys: `mend.patients`, `mend.plans` (object by patientId), `mend.log` (sessions, existing key), `mend.demo` (`{role, patientId}`).
- Legacy migration: sessions in `mend.log` without `patientId` get `patientId: "p_ruth"`, `assigned: false`, `completed: true`, `legacy: true` on first load (shown as "before plan").
- Seed: patients Ruth A. (right side, plan started 11 days before today, mixed history: days 0–10 mostly done, day 8 missed, day 2 partly, several extras), James O. (left side, plan started 4 days ago, behind), Mei L. (no plan yet). Ruth's plan uses a repeating week of the six existing ids (`lift`, `pour`, `lock`, `maze`, `sort`, `simon`), two or three per day, with rest on days 5–6 of each week (Task 20 swaps in new exercises once they exist). Seed sessions use `input: "phone"` and plausible ranges (lift peak pitch rising 32° → 41°).

- [ ] **Step 1: Failing tests**, including:

```js
test("corrupt or missing storage falls back to the seed", () => {   // Review Focus 3
  const mem = { "mend.patients": "{not json" };
  const store = { get: (k, d) => { try { return k in mem ? JSON.parse(mem[k]) : d; } catch { return d; } }, set: (k, v) => { mem[k] = JSON.stringify(v); } };
  const D = data.createData(store, () => new Date(2026, 9, 17));
  D.ensureSeed();
  assert.equal(D.patients()[0].name, "Ruth A.");
  assert.equal(D.plan("p_ruth").start, "2026-10-06");
});
test("legacy log entries are attributed to the demo patient as before-plan history", ...);
test("ensureSeed is idempotent and never overwrites provider edits", ...);
test("store that throws on every call still lets the app read defaults", ...);  // get/set throw → patients() returns seed in memory, no throw
```

- [ ] **Step 2:** `node --test tests/` → FAIL. **Step 3:** implement. **Step 4:** PASS. **Step 5:** commit `feat: storage layer, legacy migration, demo seed`.

### Task 4: Theme B shell and demo switch

**Files:** Modify `css/app.css`, `index.html`, `js/app.js`

**Interfaces:**
- Produces DOM ids: header `#roleSwitch` with buttons `#rolePatient`, `#roleProvider` (aria-pressed); patient picker `#patientSel` (shown in patient role); `#conn` pill opens pairing drawer `#pairDrawer` (contains existing `#pCode`, `#qrBox`, `#pUrl`, `#pStatus`, `#useMouse`); views `#vPatient`, `#vProvider`, `#vPlay`, `#vAbout`; `#resetDemo` in provider view.
- `RC.app.show(viewId)`, `RC.app.role()`.

- [ ] **Step 1:** Before styling, read the design guidance used for this redesign: `gh api repos/leonxlnx/taste-skill/contents/skills/redesign-skill/SKILL.md --jq .content | base64 -d` and `gh api repos/emilkowalski/skills/contents/skills/emil-design-eng/SKILL.md --jq .content | base64 -d` (read-only references; skip if the skills are installed locally).
- [ ] **Step 2:** Replace tokens with theme B (Global Constraints) plus a matching dark theme; drop Bricolage/IBM Plex Mono except tabular numerals (keep a mono for numbers only). Header: logo "ReConnect." (teal dot), demo switch labelled "Demo: Patient | Provider", phone pill.
- [ ] **Step 3:** Update `tests/smoke_test.py` pairing section: open drawer (`con.click("#conn")`) before `#useMouse`; everything else for pairing unchanged.
- [ ] **Step 4:** Playwright screenshot at 1366×900 and 390×844 of both roles into the scratchpad; check no horizontal overflow (`scrollWidth <= innerWidth`).
- [ ] **Step 5:** `python tests/smoke_test.py --skip-games` → pairing checks PASS. Commit `feat: theme B shell with demo role switch`.

### Task 5: Patient Today bar, library and recording

**Files:** Create `js/patient.js`; Modify `js/engine.js`, `js/app.js`, `css/app.css`, `tests/smoke_test.py`

**Interfaces:**
- Consumes: `RC.plan.today`, `RC.data.*`, `RC.EXERCISES`, `RC.SECTIONS`.
- Produces: `#todayBar[data-state]` (`progress|done|rest|none`), `#todayRing`, `#todaySteps li[data-done]`, `#todayStart`; library `#libTabs button[data-section]` (`all` + section ids), tiles `.tile[data-id]` with `.tile-tag` ("Today" / "✓ Today"); locked tiles have `aria-disabled="true"` and explain "Your therapist turns this on"; `#myProgress`.
- `RC.openActivity(def, { item })` — `item` (plan item or undefined) supplies reps/level/durationS; otherwise patient's last settings for that exercise from `mend.settings.per[id]`, default `def.defaults`.
- Setup sheet gets per-exercise controls `#setLevel button[data-v]`, `#setReps button[data-v]` (hidden when `params.reps` is null), `#setDur button[data-v]` (when `params.durationS`). When opened from the Today bar, controls show the assigned values and a note "Set by your therapist".
- `finish()` builds the session (shape above) with `patientId = data.activePatientId()`, `completed = true`, and `assigned` = whether `plan.matchDay(itemsFor(today), [...todaySessions, session])` puts this session's `at` into `assignedAt`. Exiting early via back records nothing (unchanged behaviour).
- `RC.patient.render()` re-renders bar + tiles; `app.js` calls it on boot, after `finish()`, on `visibilitychange`/`focus`, and every 60s when `dateKey(new Date())` changed.
- Today items whose exercise id is not registered render as disabled steps ("Not available in this version") and are skipped by `#todayStart`.
- Test hooks: `window.__mend = { Game, Input, data, plan }`; `Game.finishNow()` ends the running session as `completed: false`, records it, and returns to the library.

- [ ] **Step 1: Extend smoke test (fails first):** reset demo, choose Ruth, assert `#todayBar[data-state=progress]`; click `#todayStart` → setup shows "Set by your therapist"; play it in mouse mode (existing step helpers); back on home, the first `#todaySteps li` has `data-done="true"`; complete the remaining items (set via `window.__mend.data.resetDemo({ todayItems: [lift reps 6 level 2, pour reps 6 level 2, sort reps 6 level 2] })`); assert `#myProgress` shows today with 3 sessions; assert `data-state="done"` and the all-done text contains "That's today's plan, done."; play one more tile → `window.__mend.data.sessions('p_ruth').at(-1).assigned === false`.
- [ ] **Step 2: Midnight test (Review Focus 1):** via `page.clock` (Playwright clock API) set time to 23:59:30, load, complete nothing, advance 61s → bar shows the next day's items (different `#todaySteps` text) without reload.
- [ ] **Step 3: No-plan test (Review Focus 4):** choose Mei → `#todayBar[data-state=none]` with "No plan for today"; tiles still open.
- [ ] **Step 3b: Locked tile test:** register a test-only def `__locked` with `safety: "standing"` (when `window.__mend_test`); for Ruth its `.tile` has `aria-disabled="true"` and clicking it does not open `#vPlay`.
- [ ] **Step 4:** Implement. Library tiles: section headings in `RC.SECTIONS` order, tabs filter, control badge (📱 Phone / 👆 Touch / 🧭 Guided), small inline-SVG art from `kit.art(id)` (Task 8 provides real art; until then a neutral glyph).
- [ ] **Step 5:** `python tests/smoke_test.py` → PASS. Commit `feat: patient Today bar and library`.

### Task 6: Provider sidebar and plan builder

**Files:** Create `js/provider.js`; Modify `css/app.css`, `tests/smoke_test.py`

**Interfaces:**
- Produces: `#pvPatients .pt[data-id]` (+ status dot: on track if ≥ 80% of due days done), `#pvAddPatient` (inline name + side form), tabs `#pvTabPlan`, `#pvTabProgress`; plan: `#pvStart` (date input; creates `emptyPlan` if none), calendar `.calday[data-day]` (0–29; shows weekday/date, item chips, "Rest"), selected-day editor `#pvDay` with `#pvRest` checkbox, item rows `.item[data-index]` each with `select[name=level]`, `select[name=reps]` / `select[name=durationS]`, `button.remove`; exercise picker `#pvPick` (search input `#pvPickQ`, results `.pick[data-id]` grouped by section); `#pvCopyWeek`; safety toggles `#pvEnable-sit2stand`, `#pvEnable-balance` on the patient header. Every edit saves immediately via `data.savePlan`.
- Picking a `safety` exercise while it is disabled shows an inline confirm with the safety note; confirming enables it for that patient.

- [ ] **Step 1: Failing smoke steps:** switch to provider, select Mei, set start = today, add `lift` (reps 6, level 1) and `sort` to day 0, mark day 1 rest, click `#pvCopyWeek` → `.calday[data-day="7"]` shows 2 chips, `.calday[data-day="8"]` shows "Rest"; switch to patient Mei → `#todaySteps li` count is 2.
- [ ] **Step 2:** Implement. Calendar is 5 rows × 7 columns aligned to weekdays; today outlined.
- [ ] **Step 3:** PASS. Commit `feat: provider plan builder`.

### Task 7: Provider progress, CSV export, print report

**Files:** Modify `js/provider.js`, `css/app.css`, `tests/smoke_test.py`

**Interfaces:**
- Consumes `RC.plan.progress`, `RC.plan.dayStatus`.
- Produces: KPI cards `#pvKpiDays` ("10/11"), `#pvKpiExtra` ("+14"), `#pvKpiRange` ("32° → 41°" or "–"); `.strip span[data-status]` ×30 with legend; `#pvSessions tbody tr` (newest first; columns Day, Date, Exercise, Result (reps/goal or score from `extra`), Range, `td.kind` = "Assigned" | "Extra" | "Before plan"); `#pvExportCsv` downloads `reconnect-<patient>-<YYYY-MM-DD>.csv` (one row per session, all session fields flattened, `extra` as `k=v; k=v`); `#pvPrint` opens a print view (`body.printing` CSS: KPIs, strip, sessions table, plan summary) and calls `window.print()`.

- [ ] **Step 1: Failing smoke steps:** reset demo → provider → Ruth → Progress: `#pvKpiDays` text matches `/^\d+\/\d+$/`; strip has 30 spans with at least one `missed` and one `partly`; first `td.kind` row is "Assigned" or "Extra"; clicking `#pvExportCsv` triggers a download (`page.expect_download()`) whose first line starts with `at,id,name` (column order: the session fields in the order of the session shape above).
- [ ] **Step 2:** Implement. **Step 3:** PASS. Commit `feat: provider progress and export`.

### Task 8: Input extensions, phone touch pad, and exercise kits

**Files:** Modify `js/input.js`, `js/link.js`, `js/kit.js`, `js/engine.js`, `phone.html`, `tests/smoke_test.py`

**Interfaces:**
- `a.yaw` = wrapped `alpha` delta from calibration neutral (phone already sends `a`); `a.acc` = `mag − 9.81` from phone (`mag` already sent). Mouse mode: `yaw` from mouse X when `def.control` uses yaw (Shift held), `acc` = 6 while the primary mouse button / Space is held, else 0.
- Pointer routing: `pointerdown/move/up` on `#stageWrap` → `Game.inst.pointer?.({type, x, y})` in CSS px; arrow-key tilt stays.
- Touch pad protocol: computer → phone `{type:"pad", layout: "keys"|"fingers"|"done"|null, labels?: string[]}` sent when an exercise with `def.pad` starts with a paired phone (and `null` on finish/exit); phone → computer `{type:"tap", key}`; engine forwards to `Game.inst.pad?.({type:"tap", key})`. Phone renders: `keys` = 3×4 dial pad (labels optional), `fingers` = 4 large lanes, `done` = one huge "Done" button. Pad uses ≥ 64px targets and vibrates 30ms per tap.
- If the phone disconnects while a pad exercise is running (Review Focus 5): engine sets `Game.padFallback = true`, shows banner "Phone disconnected: use the mouse or touchscreen", and instances accept `pointer` input for the same keys (each pad exercise also draws clickable keys on the stage).
- Kits (`RC.kit`):
  - `RepCounter({ axis: "pitch"|"roll"|"yaw"|"acc", target: number, rest: number, hold: number, reps: number }) -> { update(dt, value) -> "rep"|null, state: "rest"|"move"|"hold"|"return", holdT, peaks: number[] }` — the rest → reach target → hold → return cycle used by Lantern Lift, generalised.
  - `Cursor({ amp })` → `{ update(dt, a, W, H) , x, y, dwellOn(targetRect, seconds=0.8) -> boolean }` maps tilt to a stage point for 📱 play of 👆 games.
  - `Choice({ options: string[], answer: number, layout: "row"|"grid" })` → `{ draw(g, W, H), hit(x, y) -> index|-1, rects }` large tappable answer cards; selection by pointer, or by `Cursor` dwell.
  - `Guided({ steps: string[], reps?: number, durationS?: number, cue: string })` → full exercise instance (instructions, big timer, rep counter, "Done" via Space / click / phone pad `done`); `completed` once reps reached or time elapsed.
  - `art(id) -> string` inline SVG (64×40 viewBox) per exercise; theme colours via CSS variables.

- [ ] **Step 1: Failing tests:** smoke with simulated phone: start a test-only exercise `__padtest` (registered only when `window.__mend_test` is set by the test's init script) with `pad: "keys"`; phone shows `#pad button` ×12; tapping "5" on the phone makes `window.__mend.Game.inst.debug().last === "5"`; then close the phone page → stage banner contains "Phone disconnected" and a stage click on key "7" sets `last === "7"`.
- [ ] **Step 2:** Node unit test for `RepCounter` fed a synthetic sine sweep (amp 30, target 30, hold 1.2) → exactly 3 reps for 3 sweeps; small jitter ±3° near rest produces 0 extra reps. (`kit.js` exposes `RepCounter` via the same UMD pattern for this.)
- [ ] **Step 3:** Implement; refactor Lantern Lift to use `RepCounter` (its smoke test must still pass).
- [ ] **Step 4:** PASS. Commit `feat: yaw/accel input, phone touch pad, exercise kits`.

---

### Tasks 9–18: Exercise families

Each family task has the same shape, so the shape is written once here and the per-family table says what to build.

**Files:** Create/modify `js/games/<section>.js`; extend `docs/exercise-catalog.md` rows; extend `tests/smoke_test.py`.

**Every exercise must:** register with all definition fields; have 3 levels; support the params in its row; record
`stats()` named in its row; show plain-language `status()` at every phase; draw in theme B; respect
`reduceMotion`; include `kit.art(id)`.

**Test steps for every family task:**
- [ ] **Step 1: Failing smoke check `every tile opens`:** for each new id in the family: open its tile (patient side), start in mouse mode, wait 1.5s, assert `status().title` is non-empty and no page errors, then call `window.__mend.Game.finishNow()` (test hook added in Task 5: ends the session as `completed: false` and returns to library) .
- [ ] **Step 2: Failing smoke check `<family> representative completes`:** fully play the row marked ★ to `state === "results"` using pointer clicks (touch) or `mramp`/`setang` (tilt) or Space presses (guided), reading targets from `debug()`.
- [ ] **Step 3:** Implement the family.
- [ ] **Step 4:** `python tests/smoke_test.py` → PASS (all earlier checks too).
- [ ] **Step 5:** Commit `feat: <family> exercises`.

#### Task 9: Arm & shoulder (`js/games/arm.js`)

| id | Name | Control | Mechanic → completion | stats() |
|---|---|---|---|---|
| `lift` | Lantern Lift | tilt | existing | existing |
| `sideraise` ★ | Side Raise | tilt (roll, phone on upper arm) | `RepCounter` on roll to `amp`, hold 1s | best/avg raise |
| `reach` | Reach Targets | tilt | targets appear on a 3×3 board; `Cursor` dwell 0.8s to hit; `reps` hits | hits, avg time to target |
| `cupmouth` | Cup to Mouth | tilt (pitch, phone in palm) | `RepCounter` pitch to `amp*1.5`, hold 1.5s ("sip") | best/avg |
| `push` | Push Away | accel | push spike `acc > {1:2,2:3,3:4}` then return still 0.6s = rep | reps, peak push |
| `slide` | Table Slide | accel + yaw | slide out (acc spike + yaw/roll change) and back = rep; mouse: drag stage left↔right | reps |
| `bowl` | Bowl Lift | tilt (both hands hold phone) | `RepCounter` pitch, but rep only counts while `|roll| < 8°` (level bowl) | level-hold %, reps |
| `trace` | Trace It | tilt | `Cursor` follows a shape path (circle, square, figure-8 by level); score = % of path within tolerance | accuracy %, shapes |

#### Task 10: Wrist & forearm (`js/games/wrist.js`)

| `pour`, `lock`, `maze` | existing | | | |
|---|---|---|---|---|
| `wristbend` ★ | Wrist Bend | tilt pitch, forearm on table | `RepCounter` up to +amp, then down to −amp*0.6 = 1 rep | range up/down |
| `wiper` | Wrist Wiper | tilt roll | alternate left/right targets at ±amp, dwell 0.4s each; pair = rep | reps, range |
| `steady` | Steady Cup | tilt | keep cursor inside a shrinking circle for `durationS` (30/60/90) | % time steady, sway (deg RMS) |

#### Task 11: Hand & fingers (`js/games/hand.js`)

| id | Name | Control | Mechanic → completion | stats() |
|---|---|---|---|---|
| `tap` ★ | Finger Tap | touch, pad `fingers` | tap the lit lane as fast as possible for 20s; levels change lanes 1/2/4 | taps, taps/s |
| `rhythm` | Finger Rhythm | touch, pad `fingers` | notes scroll to a hit line; tap matching lane on time (±200/150/100ms) | hit %, longest streak |
| `dial` | Dial a Number | touch, pad `keys` | show 7/10/10-digit number (level 3 hides it after 3s); type it | accuracy, seconds |
| `pinch` | Pinch & Place | touch (pointer drag) | drag small items into a box; item size 48/36/28px | placed, misses |
| `grip`, `putty`, `curls`, `thumbs` | Grip & Release, Putty Squeeze, Finger Curls, Thumb Touches | guided, pad `done` | `kit.Guided` with 3 steps each; reps 10/15/20 | reps, seconds |
| `clothespin`, `coins`, `buttons`, `knifefork` | Clothespins, Coins, Buttons, Knife & Fork | guided, pad `done` | `kit.Guided`; durationS 120/180/300; source GRASP hand skills | seconds |

#### Task 12: Trunk & legs (`js/games/trunk.js`)

| id | Name | Control | Mechanic → completion | stats() |
|---|---|---|---|---|
| `lean` ★ | Lean & Shift | tilt (phone in shirt pocket) | lean to left/right/forward targets, hold 2s; reps targets | range L/R/F |
| `twist` | Trunk Twist | yaw | rotate to ±{20,30,40}°, hold 1s; pair = rep | range L/R |
| `sit2stand` | Sit to Stand | accel, `safety: "standing"` | stand (acc spike up + pitch change) then sit = rep; pre-screen "Chair behind you, someone nearby" | reps, avg seconds/rep |
| `balance` | Balance Hold | tilt, `safety: "standing"` | stand still for `durationS` 20/30/60; sway = RMS of tilt | sway, time held |
| `march` | Seated March | accel | knee lift = acc spike; reps 10/20/30 | reps |
| `heelraise`, `anklepump` | Heel Raises, Ankle Pumps | guided (accel counts if paired, else Space) | `kit.Guided` + acc spike counting | reps |

#### Task 13: Therapy sessions (`js/games/sessions.js`)

| `mirror` ★ | Mirror Therapy | guided | `kit.Guided` session: setup steps (mirror between arms), then 6 timed movement prompts × `durationS/6`; patient presses Done to finish each | seconds |
|---|---|---|---|---|
| `imagery` | Mental Practice | guided | spoken script via `speechSynthesis` (fallback: on-screen text) of 6 imagined movements with pauses; finish when script ends | seconds |

#### Task 14: Visual scanning (`js/games/scanning.js`)

| id | Name | Control | Mechanic → completion | stats() |
|---|---|---|---|---|
| `cancel` ★ | Cancel It | touch, cursor | page of letters/shapes; tap every target (24/36/48 items, 8/12/16 targets); finish button | found, missed **left** vs **right** half |
| `lookleft` | Look Left Search | touch | find one target; a left-edge anchor line pulses until first look/tap on left half; 10 rounds | avg time, left vs right times |
| `bisect` | Find the Middle | touch, cursor | tap the midpoint of a horizontal line (varying length/position); 10 lines | avg error % (signed: left/right bias) |

#### Task 15: Attention (`js/games/attention.js`)

| id | Name | Control | Mechanic → completion | stats() |
|---|---|---|---|---|
| `quick` ★ | Quick Catch | touch, cursor | tap a shape when it appears (random delay 1–3s); 15 rounds | avg reaction ms, best |
| `gonogo` | Go / No-Go | touch, cursor | tap on green, hold back on red (no-go 25/30/35%); 30 trials | correct taps, correct holds |
| `watch` | Night Watch | touch | rare target among stream for `durationS` 60/120/180 | hits, false taps |
| `twoatonce` | Two at Once | touch | tap when a number is even (left) AND keep a ball in the cup by tapping when it drops (right); 60s | both-task accuracy |
| `trail` | Trail Connect | touch, cursor | level 1: 1→8, level 2: 1→12, level 3: 1-A-2-B…→6-F; connect in order | seconds, errors |

#### Task 16: Memory (`js/games/memory.js`)

| id | Name | Control | Mechanic → completion | stats() |
|---|---|---|---|---|
| `simon` | Memory Moves | tilt | existing | existing |
| `pairs` ★ | Card Pairs | touch, cursor | flip cards to match; 6/8/12 pairs | pairs, flips, seconds |
| `nback` | N-Back | touch | press "Same" when the item matches 1/1/2 back; 20 items | accuracy |
| `span` | Number Span | touch, pad `keys` | watch digits, then type them back; length adapts 3→9 | longest span |
| `wordlist` | Word Recall | touch | study 5/7/9 words, then pick them from a list with distractors | recalled, false picks |
| `shopping` | Shopping List | touch | study a list, then "shop" by tapping items on shelves | items right |
| `faces` | Names & Faces | touch | study 3/4/6 illustrated faces with names (inline-SVG avatars), then match | matches |

#### Task 17: Reasoning (`js/games/reasoning.js`)

| id | Name | Control | Mechanic → completion | stats() |
|---|---|---|---|---|
| `sort` | Sort It | tilt | existing | existing |
| `tower` ★ | Tower Puzzle | touch, cursor | Tower of Hanoi, 3/4/5 discs; tap peg to pick, tap peg to drop | moves vs minimum, seconds |
| `errands` | Errand Planner | touch | choose the order of 3/4/5 errands on a simple map with opening times; check route | valid on first try, attempts |
| `next` | What Comes Next | touch | pattern sequences (shape/colour/number), 4 choices; 10 items | correct |
| `rotate` | Turn the Shape | touch, cursor | is the shape the same or mirrored after rotation? 12 items | correct, avg time |
| `change` | Make Change | touch | pay a total with coins/notes; level adds change calculation | correct, seconds |
| `clock` | Tell the Time | touch | read an analog clock (4 choices) → level 3 set the hands by dragging | correct |
| `ruleswitch` | Rule Switch | touch, cursor | sort cards by colour; rule switches silently after 6 correct (WCST-style) | switches found, perseverative errors |

#### Task 18: Language (`js/games/language.js`)

| id | Name | Control | Mechanic → completion | stats() |
|---|---|---|---|---|
| `nameit` ★ | Name It | touch | picture (emoji or inline SVG) + 4 written names; hint button reveals first letter, then a semantic cue; 10 items | correct, hints used |
| `wordpic` | Word to Picture | touch | word shown (and spoken via `speechSynthesis` if available), pick 1 of 4 pictures | correct |
| `wordweb` | Word Web | touch | semantic feature analysis: for a picture, pick group, use, location, property from options | features right |
| `sentence` | Finish the Sentence | touch | choose the word that completes a sentence (4 choices) | correct |
| `spell` | Spell It | touch | tap scrambled letter tiles into order; length 3–5/5–7/7–9 | correct, seconds |

Word/picture banks live in `js/games/language.js` as plain arrays (≥ 40 items per level), everyday nouns only.

### Task 19: About page and catalog

**Files:** Modify `js/about.js`, `docs/exercise-catalog.md`, `README.md`

- [ ] **Step 1:** Add EVIDENCE entries for GRASP, RehaCom, Otago (stroke trials), neglect scanning research, computerised cognitive training review, aphasia naming research (sources listed in the spec conversation; reuse URLs from `docs/exercise-catalog.md` style) and fill every "In ReConnect" cell that now has a matching exercise.
- [ ] **Step 2:** README: describe Provider/Patient demo, the 63 exercises by section, how to run unit tests (`node --test tests/`) and the smoke test, and the known pairing/TURN issue.
- [ ] **Step 3:** Smoke: `#vAbout` lists ≥ 13 systems and no row still shows "–" for an exercise ReConnect now covers (check by id list). Commit `docs: catalog and about page for the full library`.

### Task 20: Motion and polish pass, full verification, deploy

**Files:** `css/app.css`, `js/patient.js`, `js/provider.js`, `js/engine.js`

- [ ] **Step 0:** Update the demo seed week to mix new exercises (`lift`, `pairs`, `wiper`, `pour`, `trail`, `cancel`, `reach`) and re-run `node --test tests/`.
- [ ] **Step 1:** Apply the motion rules: goal tick (check draws + ring fills, 220ms ease-out), all-done bar colour change (250ms), tile hover lift 2px (desktop only, 150ms), sheet open (scale .98→1 + fade, 180ms); disable all under `prefers-reduced-motion`. No animation on library filtering or per-frame game updates beyond what games already draw.
- [ ] **Step 2:** Run the taste-skill critique checklist (`references/critique.md`, `references/tells.md` from the repo) and the Emil `review-animations` standards against screenshots of: patient progress, patient done, provider plan, provider progress, a motion game, a brain game, phone pad. Fix any issues found; note them in the commit message.
- [ ] **Step 3:** Full verification: `node --test tests/` → all pass; `python tests/smoke_test.py` → `ALL CHECKS PASSED`; screenshots at 390px width show no horizontal overflow on every view.
- [ ] **Step 4:** Ask the user before pushing (the push updates the public live site). After approval: `git push`, wait for the Pages build to report `built`, run `python tests/smoke_test.py --site https://bhuvankanna.github.io/ReConnect/`.
