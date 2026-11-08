#!/usr/bin/env bash
# Pulls the latest main from GitHub when a Claude Code session starts, so this computer
# always begins from the newest version. Runs as a SessionStart hook; can also be run by
# hand or by other agents:  bash .claude/hooks/auto-pull.sh
# Never discards local work (uses --autostash) and never force-anything. On a conflict it
# backs out and asks for /sync-repo.

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}" 2>/dev/null || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

say() {
  # systemMessage is shown to the user; additionalContext tells Claude what happened.
  printf '{"systemMessage": "%s", "hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "%s"}}\n' "$1" "$1"
}

gitdir=$(git rev-parse --git-dir)
if [ -d "$gitdir/rebase-merge" ] || [ -d "$gitdir/rebase-apply" ] || [ -f "$gitdir/MERGE_HEAD" ]; then
  say "Auto-pull skipped: a merge or rebase is in progress. Finish it, then run /sync-repo."
  exit 0
fi

if ! git fetch -q origin 2>/dev/null; then
  say "Auto-pull: could not reach GitHub (offline?). Working on the local copy; run /sync-repo later."
  exit 0
fi

upstream=$(git rev-parse --abbrev-ref '@{u}' 2>/dev/null) || exit 0
behind=$(git rev-list --count "HEAD..$upstream" 2>/dev/null || echo 0)

if [ "$behind" -eq 0 ]; then
  say "Auto-pull: already up to date with $upstream."
  exit 0
fi

before=$(git rev-parse HEAD)
if ! git pull -q --rebase --autostash >/dev/null 2>&1; then
  git rebase --abort 2>/dev/null
  say "Auto-pull: $behind new commit(s) on GitHub but the pull hit a conflict, so nothing changed. Run /sync-repo to resolve."
  exit 0
fi

msgs=$(git log --format='%s' "$before..HEAD" | head -5 | tr '\n' ';' | sed 's/;$//; s/;/; /g; s/["\\]//g')
note=""
if git diff --name-only "$before" HEAD | grep -qE '^(CLAUDE\.md|AGENTS\.md|\.claude/)'; then
  note=" Project instructions or hooks changed; re-read CLAUDE.md, and restart Claude Code if .claude/settings.json or hooks changed."
fi
say "Auto-pull: pulled $behind new commit(s) from GitHub: $msgs.$note"
exit 0
