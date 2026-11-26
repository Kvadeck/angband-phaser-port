#!/usr/bin/env bash
# Sync server-side parity.json → pull latest → rebuild parity-board dist.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REMOTE="${REMOTE:-origin}"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$BRANCH" != "master" ]]; then
  echo "Refusing to deploy from branch '$BRANCH' (expected master)" >&2
  exit 1
fi

unexpected="$(git status --porcelain --untracked-files=no | grep -vE '^([ M]M|M |MM) parity\.json$' || true)"
if [[ -n "$unexpected" ]]; then
  echo "Working tree has unexpected local changes; resolve them before deploy:" >&2
  echo "$unexpected" >&2
  exit 1
fi

parity_dirty=0
if ! git diff --quiet -- parity.json || ! git diff --cached --quiet -- parity.json; then
  parity_dirty=1
fi

if [[ "$parity_dirty" -eq 1 ]]; then
  echo "parity.json has local edits — committing and syncing to $REMOTE"
  git add -- parity.json
  git -c user.name="parity-board-bot" \
      -c user.email="parity-board-bot@users.noreply.github.com" \
      commit -m "Sync parity.json from parity-board [skip ci]"
fi

echo "Pulling latest from $REMOTE/$BRANCH"
git fetch "$REMOTE" "$BRANCH"
git pull --rebase "$REMOTE" "$BRANCH"

if [[ "$parity_dirty" -eq 1 ]] || [[ -n "$(git log "$REMOTE/$BRANCH"..HEAD --oneline)" ]]; then
  echo "Pushing local commits to $REMOTE"
  git push "$REMOTE" "HEAD:$BRANCH"
fi

echo "Installing root deps"
npm ci

echo "Building parity-board"
(
  cd parity-board
  npm ci
  npm run build
)

echo "Deploy complete"
