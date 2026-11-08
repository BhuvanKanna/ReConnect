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
| `js/link.js`, `js/relay.js`, `js/config.js` | Pairing: PeerJS (WebRTC) plus optional Cloudflare relay |
| `relay/` | Cloudflare Worker relay (see `relay/README.md`) |
| `vendor/` | PeerJS 1.5.4 and qrcode-generator 1.4.4 (MIT). Loaded by relative path; don't move them |
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

This repo is edited from two computers, with Claude Code and Cursor. GitHub is the only thing they share.

1. Start by syncing: run `/sync-repo` in Claude Code (or ask any agent to "sync repo"). It pulls the latest
   `main` safely; the steps are in `.claude/skills/sync-repo/SKILL.md`.
2. Make changes, run the tests above.
3. Commit app changes with a clear message and `git push` before switching computers.

### Context files sync automatically

Context files are: `CLAUDE.md`, `AGENTS.md`, everything in `.claude/` (settings, hooks, skills) and `.cursor/`.

- **Rule:** any change to a context file must be committed and pushed to GitHub right after the response that
  made it, so the other computer gets it.
- **Claude Code does this automatically.** `.claude/settings.json` has a Stop hook that runs
  `.claude/hooks/sync-context.sh` after every response. The script commits only the context files that changed
  (never app code), pulls with rebase, and pushes. It prints a one-line "Context sync" message saying what it
  pushed or what failed. A new or changed hook only loads after restarting Claude Code (or opening `/hooks`).
- **Other agents (Cursor, Codex):** after changing a context file, run `bash .claude/hooks/sync-context.sh`
  yourself.
- Keep durable knowledge here, not in Claude's memory folder (`~/.claude/...`), which is per machine and
  does not sync. `.claude/settings.local.json` is for per-machine settings and is git-ignored.
- `.gitattributes` keeps `.sh` files on LF line endings so the hook runs on Windows.
