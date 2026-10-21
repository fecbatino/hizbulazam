
import json, os, subprocess, sys
root = "/opt/data/cache/scratch/hza-review"
os.chdir(root)
# TS -> ESM bündeln
subprocess.run(["npx","esbuild","hooks/duas.ts","--bundle","--format=esm",
                "--outfile=/tmp/duas.mjs","--log-level=error"], check=True)
out = subprocess.run(["node","-e",
  "import('/tmp/duas.mjs').then(m=>{console.log(JSON.stringify(m.DUA_DATA))})"],
  capture_output=True, text=True, check=True)
data = json.loads(out.stdout)
print("Sammlungen:", len(data), "| Duas:", sum(len(c['duas']) for c in data))

os.makedirs("public/data", exist_ok=True)
index = []
for order, col in enumerate(data):
    slug = col["day"]
    payload = {
        "day": slug,
        "order": order,
        "name": col["name"],
        "hizbTitle": col["hizbTitle"],
        "duas": col["duas"],
    }
    with open(f"public/data/day-{slug}.json","w",encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",",":"))
    index.append({"day": slug, "order": order, "name": col["name"],
                  "hizbTitle": col["hizbTitle"], "count": len(col["duas"]),
                  "ids": [d["id"] for d in col["duas"]]})

with open("public/data/collections.json","w",encoding="utf-8") as f:
    json.dump({"collections": index}, f, ensure_ascii=False, separators=(",",":"))

# Suchindex: nur die Felder, die die Suche braucht
search = []
for col in data:
    for d in col["duas"]:
        search.append({
            "id": d["id"], "day": col["day"], "dayName": col["name"],
            "ar": d["arabic_text"],
            "de": d.get("translation_de",""), "en": d.get("translation_en",""),
            "fr": d.get("translation_fr",""),
            "ctx": d.get("source_context_de") or d.get("source_context_en",""),
        })
with open("public/data/search-index.json","w",encoding="utf-8") as f:
    json.dump(search, f, ensure_ascii=False, separators=(",",":"))

for p in sorted(os.listdir("public/data")):
    print(f"  {p:32} {os.path.getsize('public/data/'+p):>7} B")
