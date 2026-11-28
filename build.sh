#!/usr/bin/env bash
# build.sh - compose the app tree and build it for one platform.
#
# Usage: ./build.sh [linux|windows|macos|android] [--release]
#
# No platform: the host OS is used. No flag: a debug build. Releases come from
# CI, so --release is for a deliberate local run only.
#
# Requires: flutter on PATH, node >= 20 (for the yuri-sync pkg binary).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$ROOT/.build/app"

usage() {
  cat >&2 <<'EOF'
usage: ./build.sh [linux|windows|macos|android] [--release]

  (no platform)  build for the host OS
  --release      release build (default is debug)
EOF
}

PLATFORM=""
MODE="debug"
for arg in "$@"; do
  case "$arg" in
    --release) MODE="release" ;;
    -h|--help) usage; exit 0 ;;
    linux|windows|macos|android) PLATFORM="$arg" ;;
    *) echo "error: unknown argument: $arg" >&2; usage; exit 1 ;;
  esac
done

if [ -z "$PLATFORM" ]; then
  case "$(uname -s)" in
    Linux) PLATFORM=linux ;;
    Darwin) PLATFORM=macos ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM=windows ;;
    *) echo "error: cannot tell the host platform from '$(uname -s)'; name one explicitly" >&2; exit 1 ;;
  esac
fi

# One row per platform: flutter target, which yuri-sync binary fits it, and
# where the bundle ends up. Nothing else in this script branches on platform.
RELEASE_PROFILE="Release"
[ "$MODE" = "debug" ] && RELEASE_PROFILE="Debug"
case "$PLATFORM" in
  linux)
    FLUTTER_TARGET="linux"; PKG_GLOB="*linux"
    BUNDLE="$OUT/build/linux/x64/$MODE/bundle/yurireader" ;;
  windows)
    FLUTTER_TARGET="windows"; PKG_GLOB="*win*"
    BUNDLE="$OUT/build/windows/x64/runner/$RELEASE_PROFILE/yurireader.exe" ;;
  macos)
    FLUTTER_TARGET="macos"; PKG_GLOB="*macos*"
    BUNDLE="$OUT/build/macos/Build/Products/$RELEASE_PROFILE/yurireader.app" ;;
  android)
    FLUTTER_TARGET="apk"; PKG_GLOB="*linux"
    BUNDLE="$OUT/build/app/outputs/flutter-apk/app-$MODE.apk" ;;
esac

echo "=== build: $PLATFORM / $MODE ==="
if [ "$MODE" = "release" ]; then
  echo "note: releases are published by CI; a local release build is for testing only"
fi

echo "=== [1/5] compose ==="
"$ROOT/.scripts/build/compose.sh" "$OUT"

# Android signing config is written after compose, which wipes the tree.
# Without the secrets the APK is unsigned, which is fine for local testing.
if [ "$PLATFORM" = "android" ] && [ -n "${ANDROID_KEYSTORE_BASE64:-}" ]; then
  for n in ANDROID_KEYSTORE_BASE64 ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_ALIAS ANDROID_KEY_PASSWORD; do
    eval "v=\$$n"
    [ -n "$v" ] || { echo "error: missing $n" >&2; exit 1; }
  done
  printf '%s' "$ANDROID_KEYSTORE_BASE64" | tr -d '\n\r ' \
    | base64 --decode --ignore-garbage > "$OUT/android/app/yurireader.jks"
  test -s "$OUT/android/app/yurireader.jks"
  cat > "$OUT/android/key.properties" <<EOF
storePassword=$ANDROID_KEYSTORE_PASSWORD
keyPassword=$ANDROID_KEY_PASSWORD
keyAlias=$ANDROID_KEY_ALIAS
storeFile=yurireader.jks
EOF
elif [ "$PLATFORM" = "android" ]; then
  echo "warning: no ANDROID_KEYSTORE_BASE64 - the APK will be unsigned" >&2
fi

echo "=== [2/5] yuri-sync binary ==="
PKG_BIN="$(ls "$ROOT"/ts/dist/binaries/$PKG_GLOB 2>/dev/null | head -1 || true)"
mkdir -p "$OUT/assets/yuri-sync"
if [ -n "$PKG_BIN" ] && [ -f "$PKG_BIN" ]; then
  cp "$PKG_BIN" "$OUT/assets/yuri-sync/yuri-sync"
  chmod +x "$OUT/assets/yuri-sync/yuri-sync"
else
  # The app still runs without it; only the tracker bridge is dead.
  echo "warning: no ts/dist/binaries binary matching $PKG_GLOB - the tracker bridge will not work" >&2
fi

echo "=== [3/5] pub get ==="
cd "$OUT"
flutter pub get
dart pub get --directory=rust_builder/cargokit/build_tool

echo "=== [4/5] launcher icons ==="
dart run flutter_launcher_icons

echo "=== [5/5] flutter build $FLUTTER_TARGET --$MODE ==="
flutter build "$FLUTTER_TARGET" "--$MODE"

# --- bundle libmpv and its codec stack (Linux only) -------------------------
# media_kit links libmpv.so.2, but a raw Flutter bundle ships only Flutter's own
# libraries. On a host without mpv - and in the Flatpak runtime - the app then
# dies at launch with "libmpv.so.2: cannot open shared object file".
if [ "$PLATFORM" = "linux" ]; then
  bundle="$OUT/build/linux/x64/$MODE/bundle"
  libdir="$bundle/lib"
  mpv="$(ldconfig -p | awk '/libmpv\.so\.2 /{print $NF; exit}')"
  if [ -z "$mpv" ]; then
    echo "error: libmpv.so.2 not found on the build host (install libmpv-dev)" >&2
    exit 1
  fi
  mkdir -p "$libdir"
  # The closure is copied by name so the bundle keeps working when the host's
  # library versions move on.
  ldd "$mpv" | awk '/=> \//{print $3}' | while read -r lib; do
    case "$(basename "$lib")" in
      libc.so*|libm.so*|libpthread.so*|libdl.so*|librt.so*|ld-linux*) continue ;;
    esac
    cp -L "$lib" "$libdir/" 2>/dev/null || true
  done
  cp -L "$mpv" "$libdir/libmpv.so.2"
fi

echo "bundle: $BUNDLE"
