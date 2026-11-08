# Agent instructions

All project context and conventions for this repo live in [`CLAUDE.md`](CLAUDE.md). Read it first and follow it.
This applies to every coding agent (Cursor, Codex, Claude Code and others).

Short version:

- Static site, no build step. Run `node --test "tests/*.test.js"` before finishing app changes.
- **Start of a session:** run `bash .claude/hooks/auto-pull.sh` to pull the latest `main` (Claude Code does this
  automatically through a SessionStart hook). For "sync repo", follow `.claude/skills/sync-repo/SKILL.md`.
- **Auto-push everything:** at the end of every response that changed files (app code or context files),
  run `bash .claude/hooks/auto-sync.sh`. It commits all changes, pulls, and pushes to GitHub. Claude Code
  runs it automatically through a Stop hook; other agents must run it themselves.
- Pushing to `main` deploys the live site, so don't end a response with broken or half-finished app code.
