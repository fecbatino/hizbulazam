#!/usr/bin/env bash
# Nimmt einen SHA-256-Fingerprint (mit Doppelpunkten) in assetlinks.json auf.
# Aufruf: bash deploy/add-assetlink-fingerprint.sh "AA:BB:..."
set -euo pipefail
fp="${1:?SHA-256-Fingerprint erwartet, z. B. AB:CD:...}"
[[ "$fp" =~ ^([0-9A-F]{2}:){31}[0-9A-F]{2}$ ]] || { echo "Format ungültig (32 Byte, Großbuchstaben, Doppelpunkte)"; exit 1; }
file="$(dirname "$0")/../public/.well-known/assetlinks.json"
python3 - "$file" "$fp" <<'PY'
import json, sys
path, fp = sys.argv[1], sys.argv[2]
data = json.load(open(path))
targets = data[0]["target"]["sha256_cert_fingerprints"]
if fp not in targets:
    targets.append(fp)
json.dump(data, open(path, "w"), indent=2)
open(path, "a").write("\n")
print("Fingerprints:", *targets, sep="\n  ")
PY
