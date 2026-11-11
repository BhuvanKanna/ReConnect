# ReConnect

Phone-controlled home stroke rehab prototype (Sling Health neuroscience team, UT Austin). A provider assigns a
30-day plan; the patient plays exercises on a computer using their phone as a motion controller or tap pad.
Not a medical device.

- **Live site:** https://bhuvankanna.github.io/ReConnect/ (GitHub Pages, `main` branch, repo root)
- **Repo:** https://github.com/BhuvanKanna/ReConnect
- Static files only, no build step. A push to `main` deploys automatically.

`README.md` is the full description of the app (features, the 126 exercises, phone⇄computer message format,
privacy, known limits). Read it before larger changes.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | Computer app shell: library, Today bar, provider/patient demo, pairing panel |
| `phone.html` | Phone controller page opened from the QR code |
| `css/app.css` | Theme (Fredoka font throughout, matches the logo) |
| `js/` | Plain scripts sharing a `window.RC` namespace; no modules, no bundler |
| `js/plan.js`, `js/data.js` | Pure plan rules and storage/demo seed, unit-tested in Node |
| `js/kit.js` | Shared building blocks: rep counter, tilt cursor, answer cards, keypad, guided session |
| `js/games/*.js` | One file per library section (arm, wrist, hand, trunk, memory, ...) |
| `js/guides.js` | The setup sheet's instructions for every exercise, keyed by id: goal, getting ready, numbered steps, what one rep is, a tip, the rep's name (`unit`). A new exercise needs an entry here; the sheet is drawn by `renderSetup()` in `js/engine.js` |
| `js/link.js`, `js/relay.js`, `js/config.js` | Pairing: PeerJS (WebRTC) plus optional Cloudflare relay |
| `relay/` | Cloudflare Worker relay (see `relay/README.md`) |
| `js/scene3d.js`, `js/lift3d.js`, `js/pour3d.js`, `js/tilt3d.js`, `js/drive3d.js` | 3D scenes for Lantern Lift, Pour the Tea, Ear to Shoulder and Steering Wheel: shared three.js loader and renderer, then one scene per exercise. Each game keeps a 2D fallback in its `js/games/*.js` file and frees its scene through `G.dispose()` |
| `js/play3d.js`, `js/play3d-scenes.js` … `js/play3d-scenes5.js` | 3D scenes for the other 71 motion exercises (every phone-motion exercise is 3D). The game keeps scoring and gives a `view()` (each engine in `js/moves.js` and `RC.kit.Reach` have one, as do the games with their own code in `arm.js`, `wrist.js`, `trunk.js`, `memory.js` and `reasoning.js`); `RC.Play3D.wrap(game, id)` swaps the drawing for the scene registered under `id` plus a gauge chosen by `view().type`. Scene files share helpers through `RC.Play3D.lib` (set in `play3d-scenes2.js`, extended in `play3d-scenes3.js` and `play3d-scenes4.js`, so keep that load order). A scene can set `flip` to run its gauge the other way or `gauge: "none"` to hide it. Games whose layout depends on the stage size expose `onStage(W, H)`. Falls back to the flat drawing |
| `js/twist3d.js`, `js/twist-animals.js`, `js/twist-scenes.js` | Trunk Twist's look-around worlds: the shape kit and world (also used by `tilt3d.js`, `drive3d.js` and the `play3d-scenes` files), the animals to find, and the nine scenes the patient picks from |
| `vendor/` | PeerJS 1.5.4, qrcode-generator 1.4.4 and three.js r170 (all MIT). Loaded by relative path; don't move them |
| `brand/` | Logo, icon and favicons |
| `docs/exercise-catalog.md` | Sources for every exercise |
| `docs/superpowers/` | Design spec and implementation plan from the Oct 2026 plans/library redesign |
| `tests/` | Node unit tests, engine test, Playwright end-to-end smoke test |

## Develop and test

```bash
python -m http.server 8000             # open http://localhost:8000
node --test "tests/*.test.js"          # plan, storage, rep-counter unit tests
python tests/engines_test.py           # plays every motion exercise at all three levels
python tests/smoke_test.py             # end to end (needs: pip install playwright && python -m playwright install chromium)
```

Phone motion sensors need https, so test real phone control on the live site.

## Conventions

- Keep it static: no frameworks, bundlers or build steps (GitHub Pages serves files as-is; keep `.nojekyll`).
- Each exercise has three levels and an assignable amount (reps, rounds or time). Motion exercises should each be
  a distinct phone movement in a distinct phone position (duplicates were removed in Oct 2026).
- Run the unit tests (and the smoke test for UI/pairing changes) before committing.
- Never commit tokens or credentials; never force-push.

## Working from more than one computer

Two people edit this repo from separate computers, with Claude Code and Cursor: Bhuvan (GitHub `BhuvanKanna`,
the repo owner) and Basant (GitHub `BasantKanna`, a collaborator with push access). GitHub is the only thing
the computers share. Each person commits under their own git identity; the repo and live site stay under
`BhuvanKanna`. Because two people may work at the same time, always sync first, and keep each response's
changes small so auto-sync rebases cleanly.

1. Start by syncing. **Claude Code does this automatically:** a SessionStart hook runs
   `.claude/hooks/auto-pull.sh` when a session starts (also on resume and `/clear`), fetches GitHub and pulls
   `main` if this computer is behind (`--rebase --autostash`, never discards local work). It prints a one-line
   "Auto-pull" message. On a conflict it backs out and says to run `/sync-repo`. Other agents (Cursor, Codex)
   should run `bash .claude/hooks/auto-pull.sh` at the start of a session, or follow
   `.claude/skills/sync-repo/SKILL.md` when asked to "sync repo".
   - **Open Claude Code in the repo root** (the folder containing this file and `.claude/`). Project skills
     like `/sync-repo` and these hooks only load from the folder Claude Code was started in; starting it in a
     parent folder means none of them appear.
2. Make changes, run the tests above.
3. Changes are pushed automatically (below).

### Every change is pushed automatically

- **Rule:** every change, app code and context files alike, is committed and pushed to GitHub right after
  the response that made it, so the other computer always has the latest version.
- **Claude Code does this automatically.** `.claude/settings.json` has a Stop hook that runs
  `.claude/hooks/auto-sync.sh` after every response. The script commits all changes (respecting
  `.gitignore`), pulls with rebase, and pushes. It prints a one-line "Auto-sync" message saying what it
  pushed or what failed. A new or changed hook only loads after restarting Claude Code (or opening `/hooks`).
- **Safety:** files that look like secrets (`.env*`, `.dev.vars`, `*.pem`, `*.key`, names containing
  `secret` or `credential`) and files over 50 MB are never auto-committed; they are reported instead. It
  skips the run if a merge or rebase is in progress, and never force-pushes.
- **Pushing to `main` deploys the live site** (GitHub Pages), so run the tests before ending a response that
  changed app code, and don't leave half-finished app changes at the end of a response.
- **Other agents (Cursor, Codex):** after making changes, run `bash .claude/hooks/auto-sync.sh` yourself at
  the end of each response.
- Keep durable knowledge here, not in Claude's memory folder (`~/.claude/...`), which is per machine and
  does not sync. `.claude/settings.local.json` is for per-machine settings and is git-ignored.
- `.gitattributes` keeps `.sh` files on LF line endings so the hook runs on Windows.
