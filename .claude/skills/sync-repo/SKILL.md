---
name: sync-repo
description: Pull the most recent version of this repo from GitHub (origin/main) so this computer matches the other one. Use when the user says "sync", "sync repo", "pull latest", "get the latest version", or at the start of a session on a computer that may be behind.
---

# Sync repo

Bring this checkout up to date with GitHub without losing local work.

1. Show where things stand:
   ```bash
   git status -sb
   git fetch origin
   git log --oneline HEAD..@{u}     # commits on GitHub not here yet
   git log --oneline @{u}..HEAD     # local commits not pushed yet
   ```
2. If there are uncommitted changes, tell the user which files. This repo auto-pushes all changes
   (`.claude/hooks/auto-sync.sh`), so normally commit them; `--autostash` keeps them safe either way.
3. Pull:
   ```bash
   git pull --rebase --autostash
   ```
   If there is a conflict, stop, show the conflicting files and the two versions, and ask the user how to
   resolve them. Never force-push and never discard their changes. To back out: `git rebase --abort`.
4. If there are local commits that weren't pushed, push them: `git push`.
5. Report in a few lines: how many commits came in (with their one-line messages), what was pushed, and
   anything left uncommitted.
6. If the pull changed `CLAUDE.md`, `AGENTS.md` or `.claude/`, re-read the changed files. If
   `.claude/settings.json` or `.claude/hooks/` changed, tell the user to restart Claude Code (or open
   `/hooks`) so the new hooks load.
