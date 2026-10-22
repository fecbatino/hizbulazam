#!/usr/bin/env bash
# Bring the server checkout to the released commit; apply compose/nginx changes.
set -euo pipefail
release="${1:?Expected a full Git commit SHA}"
[[ "$release" =~ ^[0-9a-f]{40}$ ]] || { echo "Invalid release"; exit 1; }
stack="${HZA_STACK_DIR:-/opt/stacks/hizbulazam}"
cd "$stack"
previous="$(git rev-parse HEAD)"
git fetch --quiet origin main
# Fast-forward only: local edits or a diverged checkout stop the deploy.
git merge --ff-only --quiet "$release"
# Test the new config in a throwaway container before the live one sees it.
image="$(docker compose config --images | head -n 1)"
if ! docker run --rm --network none \
  -v "$stack/deploy/nginx:/etc/nginx/conf.d:ro" "$image" nginx -t -q; then
  git reset --quiet --keep "$previous"
  echo "nginx config invalid; checkout reset to $previous"
  exit 1
fi
# Recreates the container only when the compose file changed.
docker compose up -d --wait
docker compose exec -T hizbulazam nginx -s reload
echo "Stack at $release"
