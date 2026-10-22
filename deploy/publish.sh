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

# Retention: keep the newest releases (by publish time, so a rollback counts
# as newest) and drop hashed assets that no kept release ships, but only once
# they are older than the grace period that open clients may still need.
keep="${HZA_KEEP_RELEASES:-5}"
max_age="${HZA_ASSET_MAX_AGE_DAYS:-30}"
dry_run="${HZA_RETENTION_DRY_RUN:-}"
[[ "$keep" =~ ^[0-9]+$ ]] && (( keep >= 2 )) || { echo "Invalid keep"; exit 1; }
[[ "$max_age" =~ ^[0-9]+$ ]] && (( max_age >= 7 )) || { echo "Invalid max age"; exit 1; }
remove() {
  if [[ -n "$dry_run" ]]; then echo "Would remove $1"; else rm -rf -- "$1"; fi
}
touch "$source_dir"
staging="$(realpath -e "$staging_root")"
mapfile -t releases < <(find "$staging" -mindepth 1 -maxdepth 1 -type d \
  -regextype posix-extended -regex '.*/[0-9a-f]{40}' -printf '%T@ %p\n' |
  sort -rn | cut -d' ' -f2-)
kept=("$source_dir")
for dir in "${releases[@]}"; do
  [[ "$dir" == "$source_dir" ]] && continue
  if (( ${#kept[@]} < keep )); then kept+=("$dir"); else remove "$dir"; fi
done
declare -A shipped=()
for dir in "${kept[@]}"; do
  while IFS= read -r -d '' file; do shipped["${file#"$dir"/}"]=1; done \
    < <(find "$dir/assets" -type f -print0)
done
# The current release always ships assets; an empty set means a broken scan.
(( ${#shipped[@]} > 0 )) || { echo "No shipped assets found"; exit 1; }
stale=0
while IFS= read -r -d '' file; do
  [[ -n "${shipped["${file#"$webroot"/}"]:-}" ]] && continue
  remove "$file"
  stale=$((stale + 1))
done < <(find "$webroot/assets" -type f -mtime "+$max_age" -print0)
[[ -n "$dry_run" ]] || find "$webroot/assets" -mindepth 1 -type d -empty -delete
echo "Kept ${#kept[@]} releases; ${dry_run:+dry run, }$stale stale assets"
