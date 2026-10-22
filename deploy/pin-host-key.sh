#!/usr/bin/env bash
# Trust exactly the ed25519 host key that matches the pinned fingerprint.
# Env: PIN, HOST, PORT; optional KNOWN_HOSTS (secret SSH_KNOWN_HOSTS).
# Writes known_hosts with only that key and an ssh config that refuses any
# other host key type, so a second key next to the pinned one cannot be used.
set -euo pipefail
: "${PIN:?}" "${HOST:?}" "${PORT:?}"
dir="${SSH_DIR:-$HOME/.ssh}"
mkdir -p "$dir"
chmod 700 "$dir"
candidates="$(mktemp)"
trap 'rm -f "$candidates"' EXIT
if [[ -n "${KNOWN_HOSTS:-}" ]]; then
  printf '%s\n' "$KNOWN_HOSTS" > "$candidates"
else
  ssh-keyscan -t ed25519 -p "$PORT" "$HOST" > "$candidates" 2>/dev/null || true
  echo "Hinweis: Secret SSH_KNOWN_HOSTS fehlt, Host-Schluessel per Fingerprint geprueft"
fi
# Keep plain ed25519 entries only; other types (and @cert-authority/@revoked
# markers) are dropped, ssh is limited to ed25519 below anyway.
grep -E '^[^@#[:space:]][^[:space:]]*[[:space:]]+ssh-ed25519[[:space:]]' \
  "$candidates" > "$dir/known_hosts" || true
[[ -s "$dir/known_hosts" ]] || { echo "Kein ed25519-Host-Schluessel gefunden"; exit 1; }
# Every remaining entry must be the pinned key, not just one of them.
entries=0
while read -r _ fingerprint _; do
  [[ "$fingerprint" == "$PIN" ]] ||
    { echo "Host-Schluessel passt nicht zum gepinnten Fingerprint"; exit 1; }
  entries=$((entries + 1))
done < <(ssh-keygen -lf "$dir/known_hosts")
[[ "$entries" -eq "$(wc -l < "$dir/known_hosts")" ]] ||
  { echo "Unlesbarer Eintrag in known_hosts"; exit 1; }
cat > "$dir/config" <<EOF
Host *
  HostKeyAlgorithms ssh-ed25519
  StrictHostKeyChecking yes
  UserKnownHostsFile $dir/known_hosts
  GlobalKnownHostsFile /dev/null
EOF
chmod 600 "$dir/config" "$dir/known_hosts"
echo "Host-Schluessel gepinnt: $PIN"
