#!/usr/bin/env bash
# Exercises deploy/publish.sh against a built dist/ in a temp directory.
# Usage: npm run build && bash deploy/test-publish.sh
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
qa="$(mktemp -d)"
trap 'rm -rf -- "$qa"' EXIT
export HZA_STAGING_ROOT="$qa/releases" HZA_WEBROOT="$qa/webroot"
mkdir -p "$HZA_STAGING_ROOT"
sha() { printf '%040d' "$1"; }
release() {
  local dir="$HZA_STAGING_ROOT/$(sha "$1")"
  cp -a "$repo"/dist "$dir"
  printf 'r%s\n' "$1" > "$dir/assets/only-r$1.js"
}
publish() { bash "$repo"/deploy/publish.sh "$(sha "$1")"; }
fail() { echo "FAIL: $*"; exit 1; }

# 1-7 published in order; nothing is old enough yet, so no asset is removed.
for i in 1 2 3 4 5 6 7; do release "$i"; publish "$i" >/dev/null; done
count=$(find "$HZA_STAGING_ROOT" -mindepth 1 -maxdepth 1 -type d | wc -l)
[[ $count == 5 ]] || fail "expected 5 releases, got $count"
[[ -d "$HZA_STAGING_ROOT/$(sha 7)" && -d "$HZA_STAGING_ROOT/$(sha 3)" ]] || fail "newest 5 not kept"
[[ ! -d "$HZA_STAGING_ROOT/$(sha 2)" ]] || fail "release 2 not removed"
for i in 1 2 3 4 5 6 7; do [[ -f "$HZA_WEBROOT/assets/only-r$i.js" ]] || fail "young asset r$i removed"; done
echo "PASS: 5 newest releases kept, young assets of dropped releases retained"

# Age every webroot asset; a fresh orphan must survive.
find "$HZA_WEBROOT/assets" -type f -exec touch -d '40 days ago' {} +
printf 'fresh\n' > "$HZA_WEBROOT/assets/fresh-orphan.js"

# Dry run reports but deletes nothing.
release 8
out=$(HZA_RETENTION_DRY_RUN=1 publish 8)
[[ -f "$HZA_WEBROOT/assets/only-r1.js" && -d "$HZA_STAGING_ROOT/$(sha 3)" ]] || fail "dry run deleted"
grep -q "Would remove .*only-r1.js" <<<"$out" || fail "dry run did not report r1"
echo "PASS: dry run deletes nothing"

publish 8 >/dev/null
for i in 1 2 3; do [[ ! -f "$HZA_WEBROOT/assets/only-r$i.js" ]] || fail "old asset r$i kept"; done
for i in 4 5 6 7 8; do [[ -f "$HZA_WEBROOT/assets/only-r$i.js" ]] || fail "kept release asset r$i removed"; done
[[ -f "$HZA_WEBROOT/assets/fresh-orphan.js" ]] || fail "fresh orphan removed"
for f in "$repo"/dist/assets/*.js; do [[ -f "$HZA_WEBROOT/assets/$(basename "$f")" ]] || fail "current bundle missing"; done
[[ "$(cat "$HZA_WEBROOT/deployed-sha.txt")" == "$(sha 8)" ]] || fail "marker"
echo "PASS: old orphans removed; kept releases, fresh files and current bundle intact"

# Rollback to 4 makes it newest; 5 stays, nothing current is lost.
publish 4 >/dev/null
[[ -d "$HZA_STAGING_ROOT/$(sha 4)" && -d "$HZA_STAGING_ROOT/$(sha 8)" ]] || fail "rollback pruned"
[[ "$(cat "$HZA_WEBROOT/deployed-sha.txt")" == "$(sha 4)" ]] || fail "rollback marker"
echo "PASS: rollback keeps the rolled-back and newer releases"

if HZA_KEEP_RELEASES=1 publish 4 >/dev/null 2>&1; then fail "keep=1 accepted"; fi
if HZA_ASSET_MAX_AGE_DAYS=1 publish 4 >/dev/null 2>&1; then fail "max age 1 accepted"; fi
echo "PASS: unsafe limits rejected"
