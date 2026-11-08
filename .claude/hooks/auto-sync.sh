#!/usr/bin/env bash
# Commits and pushes ALL changes in the repo (app code and context files) to GitHub.
# Runs as a Claude Code Stop hook after every response, and can be run by hand or by
# other agents:  bash .claude/hooks/auto-sync.sh
# .gitignore is respected. Files that look like secrets, and files over 50 MB, are
# never committed; they are left in place and reported.

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}" 2>/dev/null || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

say() { printf '{"systemMessage": "%s"}\n' "$1"; }

# Don't interfere with a merge or rebase someone is in the middle of.
gitdir=$(git rev-parse --git-dir)
if [ -d "$gitdir/rebase-merge" ] || [ -d "$gitdir/rebase-apply" ] || [ -f "$gitdir/MERGE_HEAD" ]; then
  say "Auto-sync skipped: a merge or rebase is in progress. Finish it, then run /sync-repo."
  exit 0
fi

git add -A 2>/dev/null

# Unstage anything that looks like a secret or is too big for GitHub.
held=()
while IFS= read -r f; do
  [ -z "$f" ] && continue
  base=$(basename "$f")
  size=$(wc -c <"$f" 2>/dev/null || echo 0)
  case "$base" in
    .env|.env.*|.dev.vars|*.pem|*.key|*.p12|*.pfx|id_rsa*|id_ed25519*|*secret*|*credential*)
      git reset -q -- "$f"; held+=("$f") ;;
    *)
      if [ "$size" -gt 52428800 ]; then git reset -q -- "$f"; held+=("$f"); fi ;;
  esac
done < <(git diff --cached --name-only --diff-filter=AM)

note=""
[ ${#held[@]} -gt 0 ] && note=" Not committed (secret-like or >50 MB): ${held[*]}."

if git diff --cached --quiet; then
  [ -n "$note" ] && say "Auto-sync:$note"
  exit 0
fi

changed=$(git diff --cached --name-only | head -8 | tr '\n' ' ' | sed 's/ $//')
count=$(git diff --cached --name-only | wc -l | tr -d ' ')
[ "$count" -gt 8 ] && changed="$changed (+$((count - 8)) more)"

git commit -q -m "Auto-sync: $changed

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || { say "Auto-sync: commit failed.$note"; exit 0; }

if ! git pull -q --rebase --autostash 2>/dev/null; then
  git rebase --abort 2>/dev/null
  say "Auto-sync: committed locally but pull failed (conflict?). Run /sync-repo to resolve, then push.$note"
  exit 0
fi
if git push -q 2>/dev/null; then
  say "Auto-sync: pushed $changed.$note"
else
  say "Auto-sync: committed locally but push failed. Run git push.$note"
fi
exit 0
