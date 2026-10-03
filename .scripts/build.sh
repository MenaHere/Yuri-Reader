#!/usr/bin/env bash
# build.sh - compose the app tree and build it for one platform.
#
# Usage: build.sh [linux|windows|macos]   (default: linux)
# Requires: flutter on PATH, node >= 20 (for the yuri-sync pkg binary)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLATFORM="${1:-linux}"
OUT="$ROOT/.build/app"

echo "=== [1/5] compose ==="
"$ROOT/.scripts/compose.sh" "$OUT"

# --- Android signing config (written after compose) -------------------
# compose.sh wipes .build/app, so the keystore and key.properties must be
# written after it. CI passes the secrets as env vars; a local build without
# them produces an unsigned APK.
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
fi

# --- yuri-sync binary (platform-specific, built from ts) -------------
# The malsync submodule lives at ts/vendor/malsync, so its deps resolve
# naturally from ts/node_modules - no root symlink needed.
echo "=== [2/5] npm ci ==="
(cd "$ROOT/ts" && npm ci)
echo "=== [3/5] tsc (build-ts.js) ==="
(cd "$ROOT/ts" && npm run build)
echo "=== [4/5] pkg (build:binary) ==="
(cd "$ROOT/ts" && npm run build:binary)
echo "--- dist/binaries after pkg:"
ls -la "$ROOT/ts/dist/binaries/" 2>&1 || true

case "$PLATFORM" in
  linux)   PKG_GLOB="*linux"   ; FLUTTER_TARGET="linux" ;;
  windows) PKG_GLOB="*win*"    ; FLUTTER_TARGET="windows" ;;
  macos)   PKG_GLOB="*macos*"  ; FLUTTER_TARGET="macos" ;;
  android) PKG_GLOB="*linux"   ; FLUTTER_TARGET="apk" ;;
  *) echo "error: unsupported platform: $PLATFORM" >&2; exit 1 ;;
esac

PKG_BIN="$(ls "$ROOT"/ts/dist/binaries/$PKG_GLOB 2>&1 | head -1)"
if [ -z "$PKG_BIN" ] || [ ! -f "$PKG_BIN" ]; then
  echo "error: no pkg binary matching $PKG_GLOB in ts/dist/binaries/ (pkg produced nothing?)" >&2
  exit 1
fi
mkdir -p "$OUT/assets/yuri-sync"
cp "$PKG_BIN" "$OUT/assets/yuri-sync/yuri-sync"
chmod +x "$OUT/assets/yuri-sync/yuri-sync"

# --- flutter build ----------------------------------------------------------
echo "=== [5/5] flutter build ==="
cd "$OUT"
flutter pub get
dart pub get --directory=rust_builder/cargokit/build_tool
# Regenerate the platform launcher icons from the fork's master PNG
# (assets/app_icons/icon.png) so every build carries the current icon.
dart run flutter_launcher_icons
flutter build "$FLUTTER_TARGET" --release

# --- bundle libmpv and its codec stack (Linux only) -------------------------
# media_kit links libmpv.so.2 at build time, but a raw Flutter bundle ships
# only Flutter's own libraries. On any host without mpv installed - and in the
# Flatpak runtime - the executable then dies at launch with
# "libmpv.so.2: cannot open shared object file". Copy libmpv and its
# shared-library closure into bundle/lib so the tar (and the Flatpak built
# from it) is self-contained.
if [ "$PLATFORM" = "linux" ]; then
  bundle="$OUT/build/linux/x64/release/bundle"
  libdir="$bundle/lib"
  mpv="$(ldconfig -p | awk '/libmpv\.so\.2 /{print $NF; exit}')"
  if [ -z "$mpv" ]; then
    echo "error: libmpv.so.2 not found on the build host (install libmpv-dev)" >&2
    exit 1
  fi

  copy_closure() {
    local lib="$1" base dep
    base="$(basename "$lib")"
    if [ -e "$libdir/$base" ]; then return 0; fi
    case "$base" in
      libc.so*|libm.so*|libdl.so*|libpthread.so*|librt.so*|libgcc_s.so*|libstdc++.so*|ld-linux*) return 0 ;;
    esac
    cp -L "$lib" "$libdir/$base"
    while read -r dep; do
      case "$dep" in /*) copy_closure "$dep" ;; esac
    done < <(ldd "$lib" 2>/dev/null | awk '/=> \//{print $3}')
    return 0
  }
  copy_closure "$mpv"

  # libmpv's own dependencies are transitive, and DT_RUNPATH is not inherited;
  # force a DT_RPATH on the executable so the loader searches lib/ for them.
  patchelf --force-rpath --set-rpath '$ORIGIN/lib' "$bundle/yurireader"
  echo "--- bundled media libs:"
  ls "$libdir" | grep -E '^lib(mpv|av|sw|ass|placebo)' || true
fi
