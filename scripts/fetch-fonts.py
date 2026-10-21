
import os, re, subprocess, hashlib

css = open("/tmp/f.css", encoding="utf-8").read()
blocks = re.findall(r"/\*\s*([\w\-\[\]]+)\s*\*/\s*@font-face\s*\{(.*?)\}", css, re.S)
if not blocks:
    blocks = [("", b) for b in re.findall(r"@font-face\s*\{(.*?)\}", css, re.S)]

KEEP = ("arabic", "latin")
out = []
total = 0
os.makedirs("public/fonts", exist_ok=True)

for subset, body in blocks:
    if subset and not any(k in subset for k in KEEP):
        continue
    family = re.search(r"font-family:\s*'([^']+)'", body).group(1)
    style = re.search(r"font-style:\s*(\w+)", body).group(1)
    weight = re.search(r"font-weight:\s*(\d+)", body).group(1)
    url = re.search(r"url\((https://[^)]+)\)", body).group(1)
    urange = re.search(r"unicode-range:\s*([^;]+);", body)
    slug = family.lower().replace(" ", "-")
    name = f"{slug}-{weight}-{style}-{subset or 'all'}.woff2"
    path = f"public/fonts/{name}"
    subprocess.run(["curl","-sL","--max-time","40",url,"-o",path], check=True)
    size = os.path.getsize(path)
    total += size
    out.append((f"@font-face {{\n  font-family: '{family}';\n  font-style: {style};\n"
                f"  font-weight: {weight};\n  font-display: swap;\n"
                f"  src: url('/fonts/{name}') format('woff2');\n"
                + (f"  unicode-range: {urange.group(1).strip()};\n" if urange else "")
                + "}"))

with open("public/fonts/fonts.css","w",encoding="utf-8") as f:
    f.write("/* Selbst gehostet - erzeugt aus Google-Fonts-CSS, nur arabic + latin */\n")
    f.write("\n".join(out) + "\n")

print(f"Schriften: {len(out)} · gesamt {total/1024:.1f} KiB")
for line in sorted(os.listdir("public/fonts")):
    if line.endswith(".woff2"):
        print(f"  {line:44} {os.path.getsize('public/fonts/'+line)//1024:>4} KiB")
