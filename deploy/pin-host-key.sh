#!/usr/bin/env bash
# Trust exactly the ed25519 host key that matches the pinned fingerprint.
# Env: PIN, HOST, PORT; optional KNOWN_HOSTS (secret SSH_KNOWN_HOSTS);
# SCAN_SERVER=1 also scans the server even when the secret is set.
# Writes known_hosts with only that key and an ssh config for HOST that refuses
# any other host key type, so a second key next to the pinned one is useless.
set -euo pipefail
: "${PIN:?}" "${HOST:?}" "${PORT:?}"
dir="${SSH_DIR:-$HOME/.ssh}"
mkdir -p "$dir"
chmod 700 "$dir"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
# ssh looks up port 22 under the bare host, other ports as [host]:port.
lookup="$HOST"
[[ "$PORT" == 22 ]] || lookup="[$HOST]:$PORT"
: > "$work/trusted"

# Keeps the ed25519 entries for $lookup from a source and requires every one
# of them to be the pinned key. Entries for other hosts are ignored.
check() {
  local label="$1" source="$2" entries=0 fingerprint
  # -F also resolves hashed entries; markers and comments are dropped.
  ssh-keygen -F "$lookup" -f "$source" 2>/dev/null |
    grep -E '^[^@#[:space:]][^[:space:]]*[[:space:]]+ssh-ed25519[[:space:]]' \
      > "$work/match" || true
  [[ -s "$work/match" ]] ||
    { echo "$label: kein ed25519-Schluessel fuer $lookup"; exit 1; }
  while read -r _ fingerprint _; do
    [[ "$fingerprint" == "$PIN" ]] ||
      { echo "$label: Host-Schluessel passt nicht zum gepinnten Fingerprint"; exit 1; }
    entries=$((entries + 1))
  done < <(ssh-keygen -lf "$work/match")
  [[ "$entries" -eq "$(wc -l < "$work/match")" ]] ||
    { echo "$label: unlesbarer Eintrag"; exit 1; }
  cat "$work/match" >> "$work/trusted"
  echo "$label: Host-Schluessel entspricht dem Pin"
}

if [[ -n "${KNOWN_HOSTS:-}" ]]; then
  # Secrets pasted on Windows carry \r, which ssh-keygen cannot decode.
  printf '%s\n' "$KNOWN_HOSTS" | tr -d '\r' > "$work/secret"
  check "Secret" "$work/secret"
fi
if [[ -z "${KNOWN_HOSTS:-}" || "${SCAN_SERVER:-}" == 1 ]]; then
  ssh-keyscan -t ed25519 -p "$PORT" "$HOST" > "$work/scan" 2>/dev/null || true
  check "Server" "$work/scan"
fi

sort -u "$work/trusted" > "$dir/known_hosts"
cat > "$dir/config" <<EOF
Host $HOST
  HostKeyAlgorithms ssh-ed25519
  StrictHostKeyChecking yes
  UserKnownHostsFile $dir/known_hosts
  GlobalKnownHostsFile /dev/null
EOF
chmod 600 "$dir/config" "$dir/known_hosts"
