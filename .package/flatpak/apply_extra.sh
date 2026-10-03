#!/bin/sh
# SPDX-License-Identifier: Apache-2.0
# Unpacks the Yuri-Reader Linux bundle downloaded by the Flatpak extra-data.
# Runs as root with all capabilities dropped, so it must not assume ownership.
set -eu

extra_root="${EXTRA_ROOT:-/app/extra}"
cd "$extra_root"

[ -f yuri-reader-linux.tar.gz ] || {
  echo 'missing extra-data: yuri-reader-linux.tar.gz' >&2
  exit 1
}

rm -rf bundle
tar --no-same-owner -xzf yuri-reader-linux.tar.gz
[ -x bundle/yurireader ] || {
  echo 'yurireader binary not found in the bundle' >&2
  exit 1
}
[ -x bundle/yuri-sync ] || {
  echo 'yuri-sync binary not found in the bundle' >&2
  exit 1
}

rm -f yuri-reader-linux.tar.gz
