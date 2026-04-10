# Local view/apply guide (without Codex branch access)

If the Codex branch/PR URL shows 404, use local commands directly in your repo.

## 1) Move to local root

```bash
cd /Users/mac/Desktop/협업/wedding-app
```

## 2) Confirm whether reconcile files already exist

```bash
git status --short
ls scripts/reconcile-ai-snap.ts scripts/reconcile-stuck-ai-snaps.ts
ls server/src/services/aiSnapReconcile.ts
```

## 3) If the local apply script exists, run it

```bash
python3 scripts/apply_ai_snap_reconcile_local.py /Users/mac/Desktop/협업/wedding-app
```

## 4) Validate compile

```bash
cd /Users/mac/Desktop/협업/wedding-app/server && npx prisma generate && npm run build
cd /Users/mac/Desktop/협업/wedding-app/client && npm run build
```

## 5) If script is missing

Ask for a split response containing:
- `cat <<'EOF'` blocks by file (2-3 files per message), or
- a single inline Python patch script.

This avoids relying on branch URLs.
