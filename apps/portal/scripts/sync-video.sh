#!/usr/bin/env bash
# Auto-sync intro video from source to public/ directory.
# Skips if ffmpeg is unavailable or source hasn't changed.

set -euo pipefail

SOURCE="../../assets/intro.mp4"
TARGET="public/intro.mp4"

if [ ! -f "$SOURCE" ]; then
  echo "  [video] Source not found: $SOURCE — skipping"
  exit 0
fi

if ! command -v ffmpeg > /dev/null 2>&1; then
  echo "  [video] ffmpeg not found — skipping re-encode"
  exit 0
fi

# Only re-encode if source is newer than target
if [ -f "$TARGET" ] && [ "$SOURCE" -ot "$TARGET" ]; then
  echo "  [video] intro.mp4 is up to date — skipping"
  exit 0
fi

echo "  [video] Re-encoding intro.mp4 from assets..."
ffmpeg -y -i "$SOURCE" \
  -c:v libx264 -profile:v baseline -level 3.1 \
  -pix_fmt yuv420p -movflags +faststart -an \
  "$TARGET" 2>/dev/null && \
echo "  [video] Done" || \
echo "  [video] Failed"
