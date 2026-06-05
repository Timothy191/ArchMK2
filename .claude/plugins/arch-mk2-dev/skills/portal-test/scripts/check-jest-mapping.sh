#!/usr/bin/env bash
# check-jest-mapping.sh — verify Jest moduleNameMapper coverage for portal imports
# Usage: check-jest-mapping.sh [path-to-file-to-check]
#        If no file given, scans all of apps/portal/{app,features,components,lib}/.
#
# Reports imports of @repo/* that have no explicit moduleNameMapper entry.

set -euo pipefail

PORTAL_JEST="apps/portal/jest.config.js"
if [[ ! -f "$PORTAL_JEST" ]]; then
  echo "check-jest-mapping: $PORTAL_JEST not found" >&2
  exit 2
fi

# Extract existing @repo mappings: lines like  '^@repo/foo$': '...',
existing=$(grep -oE "'@repo/[a-z0-9_-]+(/[a-z0-9_-]+)?(\\\$)?'" "$PORTAL_JEST" | sort -u || true)

# Determine scan target
target="${1:-}"
if [[ -z "$target" ]]; then
  # Scan the common portal dirs
  target=$(find apps/portal/app apps/portal/features apps/portal/components apps/portal/lib \
    -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null || true)
else
  target=$(cat "$target")
fi

# Extract @repo imports
imports=$(echo "$target" | xargs grep -hE "from ['\"]@repo/" 2>/dev/null \
  | sed -E "s/.*from ['\"]@repo\/([^'\"]+).*/\1/" \
  | sort -u || true)

if [[ -z "$imports" ]]; then
  echo "check-jest-mapping: no @repo/* imports found in scan"
  exit 0
fi

missing=0
for imp in $imports; do
  # Check exact match
  if ! echo "$existing" | grep -q "'@repo/${imp}\$'"; then
    # Check root package match (e.g. import '@repo/ui/widgets/X' but mapping for '@repo/ui')
    root="${imp%%/*}"
    if ! echo "$existing" | grep -q "'@repo/${root}\$'"; then
      echo "MISSING: @repo/${imp}  (no moduleNameMapper entry for @repo/${root} either)"
      missing=$((missing + 1))
    fi
  fi
done

if [[ $missing -gt 0 ]]; then
  echo "check-jest-mapping: $missing unmapped @repo/* import(s) — add explicit entries to $PORTAL_JEST"
  exit 1
fi
echo "check-jest-mapping: all @repo/* imports have moduleNameMapper coverage"
