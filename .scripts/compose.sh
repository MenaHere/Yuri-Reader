#!/usr/bin/env bash
# compose.sh - build the Yuri-Reader app tree from upstream mangayomi + dart overlay.
#
# The Yuri-Reader repo no longer contains the mangayomi app tree. Instead:
#   dart/vendor/mangayomi  - upstream mangayomi submodule (pinned SHA)
#   dart/      - Yuri-Reader's own files (replace or add to upstream)
# This script combines them into a buildable app tree:
#   1. copy upstream tree
#   2. apply the fork's global renames (package name, rust lib, app id,
#      binary names, display names) - matching exactly what the fork renamed
#      and what it deliberately left alone (runtime strings, l10n, iOS/macOS)
#   3. overlay the dart files
#
# Usage: compose.sh [OUT_DIR]   (default: <repo>/.build/app)
# Env:   SRC=<upstream tree>    (default: <repo>/dart/vendor/mangayomi)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${SRC:-$ROOT/dart/vendor/mangayomi}"
OUT="${1:-$ROOT/.build/app}"

if [ ! -f "$SRC/pubspec.yaml" ]; then
  echo "error: upstream mangayomi not found at $SRC" >&2
  echo "       run: git submodule update --init --recursive" >&2
  exit 1
fi

rm -rf "$OUT"
mkdir -p "$OUT"
cp -a "$SRC/." "$OUT/"

# --- Pass 1: Dart files - package + rust lib renames only -------------------
# The fork renamed imports (package:mangayomi -> package:yuri_reader) and the
# rust lib name everywhere, but KEPT runtime strings in Dart code
# (user-data paths, URL schemes, display text, github URLs).
find "$OUT" -name "*.dart" \
  ! -path "$OUT/lib/l10n/*" \
  ! -path "$OUT/lib/src/rust/frb_generated.io.dart" \
  -print0 | xargs -0 sed -i \
    -e 's/package:mangayomi/package:yuri_reader/g' \
    -e 's/rust_lib_mangayomi/rust_lib_yuri_reader/g'

# --- Pass 2: platform / config files - full rename set ----------------------
# The fork renamed app id, binary names, display names and rust symbols in
# platform configs. Files the fork left untouched (iOS/macOS project files,
# stale bindings) are excluded so the composed tree matches the fork exactly.
find "$OUT" -type f \
  \( -name "*.gradle" -o -name "*.xml" -o -name "*.plist" -o -name "*.xcconfig" \
     -o -name "*.rc" -o -name "*.cpp" -o -name "*.cc" -o -name "*.yaml" \
     -o -name "*.json" -o -name "*.sh" -o -name "*.desktop" -o -name "*.podspec" \
     -o -name "*.toml" -o -name "*.lock" -o -name "*.cmake" -o -name "*.rs" \
     -o -name "*.go" -o -name "*.kt" -o -name "CMakeLists.txt" \) \
  ! -path "$OUT/ios/*" \
  ! -path "$OUT/macos/*" \
  -print0 | xargs -0 sed -i \
    -e 's/rust_lib_mangayomi/rust_lib_yuri_reader/g' \
    -e 's/com\.kodjodevf\.mangayomi/com.kodjodevf.yurireader/g' \
    -e 's/mangayomi_rust/yuri_reader_rust/g' \
    -e 's/mangayomi/yurireader/g' \
    -e 's/Mangayomi/YuriReader/g'

# ios/macos display-name files (the fork renamed these, kept the rest as-is)
sed -i -e 's/mangayomi/yurireader/g' -e 's/Mangayomi/YuriReader/g' \
  "$OUT/ios/Runner/Info.plist" \
  "$OUT/macos/Runner/Configs/AppInfo.xcconfig" \
  "$OUT/macos/Runner/Info.plist"

# --- directory / file renames ----------------------------------------------
mv "$OUT/android/app/src/main/kotlin/com/kodjodevf/mangayomi" \
   "$OUT/android/app/src/main/kotlin/com/kodjodevf/yurireader"
mv "$OUT/linux/mangayomi.desktop" "$OUT/linux/yurireader.desktop"
mv "$OUT/rust_builder/ios/rust_lib_mangayomi.podspec" \
   "$OUT/rust_builder/ios/rust_lib_yuri_reader.podspec"
mv "$OUT/rust_builder/macos/rust_lib_mangayomi.podspec" \
   "$OUT/rust_builder/macos/rust_lib_yuri_reader.podspec"

# --- bridge custom files ---------------------------------------------------
rsync -a --exclude vendor "$ROOT/dart/." "$OUT/"

echo "composed: $OUT"