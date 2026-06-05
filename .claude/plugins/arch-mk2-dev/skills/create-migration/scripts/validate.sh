#!/usr/bin/env bash
# validate.sh — sanity-check a new SQL migration file
# Usage: validate.sh <path-to-migration.sql>
#
# Checks:
#   1. Filename matches NNN_description.sql
#   2. Path is packages/database/migrations/ (NOT the deploy copy)
#   3. File has a header comment with a date
#   4. If file contains CREATE TABLE, it must also contain ENABLE ROW LEVEL SECURITY

set -euo pipefail

FILE="${1:-}"
if [[ -z "$FILE" ]]; then
  echo "usage: validate.sh <path-to-migration.sql>" >&2
  exit 2
fi
if [[ ! -f "$FILE" ]]; then
  echo "validate: file not found: $FILE" >&2
  exit 2
fi

errors=0

# 1. Filename pattern
filename=$(basename "$FILE")
if [[ ! "$filename" =~ ^[0-9]{3}_[a-z0-9_]+\.sql$ ]]; then
  echo "validate: filename '$filename' does not match NNN_description.sql" >&2
  errors=$((errors + 1))
fi

# 2. Path is the source of truth, not the deploy copy
if [[ "$FILE" == */packages/supabase/supabase/migrations/* ]]; then
  echo "validate: $FILE is the deploy-time copy. Edit packages/database/migrations/* instead." >&2
  errors=$((errors + 1))
fi
if [[ "$FILE" != */packages/database/migrations/* ]]; then
  echo "validate: $FILE is not in packages/database/migrations/. New migrations belong there." >&2
  errors=$((errors + 1))
fi

# 3. Header comment with a date (loose: any YYYY-MM-DD or YYYY/MM/DD in first 10 lines)
head_text=$(head -10 "$FILE" || true)
if ! echo "$head_text" | grep -qE '20[0-9]{2}[-/][0-9]{2}[-/][0-9]{2}'; then
  echo "validate: no date (YYYY-MM-DD) found in first 10 lines of $FILE" >&2
  errors=$((errors + 1))
fi

# 4. RLS paired with CREATE TABLE
if grep -qiE '\bCREATE\s+TABLE\b' "$FILE"; then
  if ! grep -qiE '\bENABLE\s+ROW\s+LEVEL\s+SECURITY\b' "$FILE"; then
    if ! grep -qE 'INTENTIONAL:' "$FILE"; then
      echo "validate: $FILE has CREATE TABLE but no ENABLE ROW LEVEL SECURITY (and no INTENTIONAL: comment)." >&2
      errors=$((errors + 1))
    fi
  fi
fi

if [[ $errors -gt 0 ]]; then
  echo "validate: $errors issue(s) in $FILE" >&2
  exit 1
fi
echo "validate: $FILE OK"
