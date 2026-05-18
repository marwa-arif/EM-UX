#!/usr/bin/env bash
# Run once after cloning: bash scripts/install-hooks.sh
set -e
ROOT="$(git rev-parse --show-toplevel)"
HOOKS_SRC="$ROOT/scripts/hooks"
HOOKS_DEST="$ROOT/.git/hooks"

echo "Installing git hooks from scripts/hooks/ → .git/hooks/"

for hook in "$HOOKS_SRC"/*; do
  name=$(basename "$hook")
  cp "$hook" "$HOOKS_DEST/$name"
  chmod +x "$HOOKS_DEST/$name"
  echo "  ✓ $name"
done

echo ""
echo "Done. Hooks active:"
echo "  pre-push   — blocks push when [Unreleased] has content"
echo "  post-merge — stamps CHANGELOG.md after every pull/merge"
