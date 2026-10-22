import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const root = "dist";
const files = fs.readdirSync(path.join(root, "assets"));
const main = files.filter((file) => /^index-.*\.js$/.test(file));
if (
  main.length !== 1 ||
  fs.statSync(path.join(root, "assets", main[0])).size >= 40000
)
  throw new Error("Main JS exceeds 40 kB budget");
if (/https?:\/\//.test(fs.readFileSync(path.join(root, "index.html"), "utf8")))
  throw new Error("External origin in HTML");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"),
);
for (const icon of manifest.icons)
  if (!fs.existsSync(path.join(root, icon.src)))
    throw new Error("Missing icon " + icon.src);
const contentRoot = path.join(root, "assets/content");
const revisions = fs.readdirSync(contentRoot);
if (revisions.length !== 1) throw new Error("Unexpected content revisions");
const offline = JSON.parse(
  fs.readFileSync(
    path.join(contentRoot, revisions[0], "offline-manifest.json"),
    "utf8",
  ),
);
for (const resource of offline.resources) {
  const file = path.join(root, resource.url.replace(/^\//, ""));
  if (
    createHash("sha256").update(fs.readFileSync(file)).digest("hex") !==
    resource.sha256
  )
    throw new Error("Content digest mismatch " + resource.url);
}
for (const file of fs
  .readdirSync("public/data")
  .filter((file) => file.endsWith(".json"))) {
  if (
    !fs
      .readFileSync(path.join("public/data", file))
      .equals(fs.readFileSync(path.join(contentRoot, revisions[0], file)))
  )
    throw new Error("Content changed during build " + file);
}
console.log(
  "Build verified: main JS <40 kB, local origins, icons and immutable offline content complete.",
);
