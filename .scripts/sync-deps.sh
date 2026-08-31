#!/usr/bin/env bash
# sync-deps.sh - sync dart/pubspec.yaml dependencies from the mangayomi submodule.
#
# The fork's pubspec.yaml is upstream's manifest with 6 fork-specific
# substitutions (name, version, rust lib name, yuri-sync asset, app name,
# repo URLs). When upstream adds/bumps/removes deps, this script re-copies
# the manifest and re-applies the substitutions so the fork follows.
#
# ts/package.json is NOT synced: it is the fork's own minimal manifest
# (malsync's is a webextension build manifest with webpack/vue/jquery deps
# the fork's service never uses). The vendored malsync code the fork compiles
# imports nothing external beyond the stubbed `vue`; if malsync's _provider
# code ever needs a new runtime dep, tsc fails and the build reports it.
#
# Usage: sync-deps.sh   (run from anywhere; operates on the repo)
# Prints "pubspec.yaml: unchanged" or "pubspec.yaml: synced".
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${SRC:-$ROOT/dart/vendor/mangayomi}"
DST="$ROOT/dart/pubspec.yaml"

[ -f "$SRC/pubspec.yaml" ] || { echo "error: upstream mangayomi not found at $SRC" >&2; exit 1; }

python3 - "$SRC/pubspec.yaml" "$DST" <<'EOF'
import re, sys

src, dst = sys.argv[1], sys.argv[2]

with open(src) as f:
    c = f.read()

# Keep the fork's version (the bot bumps it; upstream's 0.7.75+NN is not ours)
with open(dst) as f:
    cur_ver = re.search(r'^version: (.+)$', f.read(), re.M).group(1)

c = re.sub(r'^name: mangayomi$', 'name: yuri_reader', c, flags=re.M)
c = re.sub(r'^version: .+$', f'version: {cur_ver}', c, flags=re.M)
c = c.replace('rust_lib_mangayomi', 'rust_lib_yuri_reader')
c = re.sub(r'^  name: Mangayomi$', '  name: YuriReader', c, flags=re.M)
c = c.replace('https://github.com/kodjodevf/mangayomi/', 'https://github.com/kodjodevf/yuri_reader/')

# Re-add the yuri-sync asset (upstream has no such asset); keep the fork's
# original position (between trackers_icons and app_icons) so the sync is
# idempotent when the submodule has not moved.
if 'assets/yuri-sync/' not in c:
    c = c.replace('    - assets/trackers_icons/\n', '    - assets/trackers_icons/\n    - assets/yuri-sync/\n', 1)

with open(dst, 'w') as f:
    f.write(c)
EOF

if git -C "$ROOT" diff --quiet -- dart/pubspec.yaml; then
  echo "pubspec.yaml: unchanged"
else
  echo "pubspec.yaml: synced from mangayomi (deps updated)"
fi