#!/usr/bin/env bash
# Publish assets first; retain previous hashed bundles for already-open clients.
set -euo pipefail
release="${1:?Expected a full Git commit SHA}"
[[ "$release" =~ ^[0-9a-f]{40}$ ]] || { echo "Invalid release"; exit 1; }
staging_root="${HZA_STAGING_ROOT:-/opt/stacks/hizbulazam/releases}"
webroot="${HZA_WEBROOT:-/var/www/hza}"
source_dir="$(realpath -e "$staging_root/$release")"
[[ "$source_dir" == "$(realpath -e "$staging_root")/$release" ]] || exit 1
[[ "$webroot" == /* && "$webroot" != / ]] || exit 1
for file in index.html sw.js manifest.webmanifest; do
  [[ -s "$source_dir/$file" ]] || { echo "Missing $file"; exit 1; }
done
[[ -d "$source_dir/assets/content" ]] || { echo "Missing versioned content"; exit 1; }
mkdir -p "$webroot"
# No --delete: active clients may still need a previous lazy-loaded JS chunk.
rsync -a --exclude=/index.html --exclude=/sw.js "$source_dir/" "$webroot/"
for file in index.html sw.js; do
  install -m 0644 "$source_dir/$file" "$webroot/.$file-$release"
  mv -f "$webroot/.$file-$release" "$webroot/$file"
done
printf '%s\n' "$release" > "$webroot/.deployed-sha-$release"
mv -f "$webroot/.deployed-sha-$release" "$webroot/deployed-sha.txt"
echo "Published $release"
