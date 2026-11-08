#!/usr/bin/env bash
# Commits and pushes changes to the repo's context files (CLAUDE.md, AGENTS.md,
# .claude/, .cursor/). Runs as a Claude Code Stop hook after every response, and
# can be run by hand or by other agents:  bash .claude/hooks/sync-context.sh
# Only these paths are ever staged or committed; other work is left alone.

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}" 2>/dev/null || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

say() { printf '{"systemMessage": "%s"}\n' "$1"; }

paths=()
for p in CLAUDE.md AGENTS.md .claude .cursor; do
  if [ -e "$p" ] || git ls-files --error-unmatch "$p" >/dev/null 2>&1; then
    paths+=("$p")
  fi
done
[ ${#paths[@]} -eq 0 ] && exit 0

git add -A -- "${paths[@]}"
git diff --cached --quiet -- "${paths[@]}" && exit 0

changed=$(git diff --cached --name-only -- "${paths[@]}" | tr '\n' ' ' | sed 's/ $//')
git commit -q -m "Sync context files: $changed

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- "${paths[@]}" || { say "Context sync: commit failed"; exit 0; }

if ! git pull -q --rebase --autostash 2>/dev/null; then
  git rebase --abort 2>/dev/null
  say "Context sync: committed locally but pull failed (conflict?). Run /sync-repo to resolve, then push."
  exit 0
fi
if git push -q 2>/dev/null; then
  say "Context sync: pushed $changed"
else
  say "Context sync: committed locally but push failed. Run git push."
fi
exit 0
