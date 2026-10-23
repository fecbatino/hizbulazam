#!/usr/bin/env bash
# Nimmt einen SHA-256-Fingerprint in assetlinks.json auf.
# Akzeptiert Gross-/Kleinbuchstaben, mit oder ohne Doppelpunkte.
# Aufruf: bash deploy/add-assetlink-fingerprint.sh "AA:BB:..."
set -euo pipefail

raw="${1:?SHA-256-Fingerprint erwartet, z. B. AB:CD:...}"
hex="$(printf '%s' "$raw" | tr -d '[:space:]' | tr 'a-f' 'A-F' | tr -d ':')"
if ! [[ "$hex" =~ ^[0-9A-F]{64}$ ]]; then
  echo "Format ungueltig: erwartet 32 Byte (64 Hex-Zeichen), erhalten ${#hex} Zeichen" >&2
  exit 1
fi
fp="$(printf '%s' "$hex" | sed 's/../&:/g; s/:$//')"

file="$(dirname "$0")/../public/.well-known/assetlinks.json"
python3 - "$file" "$fp" <<'PY'
import json, sys
path, fp = sys.argv[1], sys.argv[2]
with open(path) as fh:
    data = json.load(fh)
targets = data[0]["target"]["sha256_cert_fingerprints"]
if fp in targets:
    print("bereits vorhanden:", fp)
else:
    targets.append(fp)
    with open(path, "w") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")
    print("hinzugefuegt:", fp)
print("aktuell:")
for item in targets:
    print(" ", item)
PY
