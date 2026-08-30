#!/usr/bin/env bash
# build.sh - compose the app tree and build it for one platform.
#
# Usage: build.sh [linux|windows|macos]   (default: linux)
# Requires: flutter on PATH, node 18 (for the yuri-sync pkg binary)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLATFORM="${1:-linux}"
OUT="$ROOT/.build/app"

"$ROOT/.scripts/compose.sh" "$OUT"

# --- yuri-sync binary (platform-specific, built from ts) -------------
# The malsync submodule lives at ts/vendor/malsync, so its deps resolve
# naturally from ts/node_modules - no root symlink needed.
(cd "$ROOT/ts" && npm ci && npm run build && npm run build:binary)

case "$PLATFORM" in
  linux)   PKG_GLOB="*linux-x64*" ;;
  windows) PKG_GLOB="*win-x64*" ;;
  macos)   PKG_GLOB="*macos-x64*" ;;
  *) echo "error: unsupported platform: $PLATFORM" >&2; exit 1 ;;
esac

PKG_BIN="$(ls "$ROOT"/ts/dist/binaries/$PKG_GLOB 2>/dev/null | head -1)"
if [ -z "$PKG_BIN" ]; then
  echo "error: no pkg binary matching $PKG_GLOB in ts/dist/binaries/" >&2
  exit 1
fi
cp "$PKG_BIN" "$OUT/assets/yuri-sync/yuri-sync"
chmod +x "$OUT/assets/yuri-sync/yuri-sync"

# --- flutter build ----------------------------------------------------------
cd "$OUT"
flutter pub get
dart pub get --directory=rust_builder/cargokit/build_tool
flutter build "$PLATFORM" --release