#!/usr/bin/env bash
set -euo pipefail

# Generates copy-pasteable cat <<'EOF' blocks for the AiSnap reconcile patch files.
# Usage:
#   ./scripts/export-ai-snap-reconcile-cat-eof.sh /Users/mac/Desktop/협업/wedding-app

TARGET_ROOT="${1:-/Users/mac/Desktop/협업/wedding-app}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

FILES=(
  "client/src/pages/admin/AdminAiSnap.tsx"
  "scripts/reconcile-ai-snap.ts"
  "scripts/reconcile-stuck-ai-snaps.ts"
  "server/package.json"
  "server/prisma/migrations/20260409000000_add_ai_snap_reconcile_fields/migration.sql"
  "server/prisma/schema.prisma"
  "server/src/routes/aiSnap.ts"
  "server/src/routes/snapPack.ts"
  "server/src/services/aiSnapReconcile.ts"
  "server/src/utils/scheduler.ts"
)

printf 'cd %q\n\n' "$TARGET_ROOT"

for file in "${FILES[@]}"; do
  src="$REPO_ROOT/$file"
  if [[ ! -f "$src" ]]; then
    echo "# SKIP (missing): $file" >&2
    continue
  fi

  printf 'mkdir -p %q\n' "$(dirname "$file")"
  printf 'cat > %q <<'"'"'EOF'"'"'\n' "$file"
  cat "$src"
  printf '\nEOF\n\n'
done
