# Agent instructions

All project context and conventions for this repo live in [`CLAUDE.md`](CLAUDE.md). Read it first and follow it.
This applies to every coding agent (Cursor, Codex, Claude Code and others).

Short version:

- Static site, no build step. Run `node --test "tests/*.test.js"` before committing; push when done.
- **Start of a session / "sync repo":** follow `.claude/skills/sync-repo/SKILL.md` to pull the latest `main`.
- **Context files** (`CLAUDE.md`, `AGENTS.md`, `.claude/`, `.cursor/`): whenever you change one, commit and
  push it right after your response by running `bash .claude/hooks/sync-context.sh`. Claude Code runs this
  automatically through a Stop hook; other agents must run it themselves.
