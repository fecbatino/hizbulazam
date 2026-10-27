import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { checkAgentHttp } from "./check-agent-http.mjs";

const root = process.cwd();
const image = /image:\s*(\S+)/.exec(fs.readFileSync("docker-compose.yml", "utf8"))[1];
const docker = (...args) => execFileSync("docker", args, { encoding: "utf8" }).trim();
const id = docker("run", "--rm", "-d", "-p", "127.0.0.1::80", "--mount", `type=bind,source=${path.join(root, "dist")},target=/usr/share/nginx/html,readonly`, "--mount", `type=bind,source=${path.join(root, "deploy/nginx")},target=/etc/nginx/conf.d,readonly`, image);
try {
  const port = docker("port", id, "80/tcp").split(":").at(-1);
  const baseURL = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { ready = (await fetch(baseURL)).ok; } catch { /* nginx is starting */ }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, "nginx did not start");
  await checkAgentHttp(baseURL);
  let files = 0;
  for (const entry of fs.readdirSync("dist", { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const file = path.join(entry.parentPath, entry.name);
    const url = "/" + path.relative(path.resolve("dist"), path.resolve(file)).split(path.sep).join("/");
    const response = await fetch(baseURL + url, { headers: { Accept: url.endsWith(".md") ? "text/markdown" : "*/*" } });
    assert.equal(response.status, url.startsWith("/404.") ? 404 : 200, url);
    const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
    assert.equal(digest(Buffer.from(await response.arrayBuffer())), digest(fs.readFileSync(file)), url);
    files++;
  }
  console.log(`All ${files} build files verified over HTTP, including JSON data, offline manifest, fonts and Digital Asset Links.`);
  execFileSync(process.execPath, ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)], { stdio: "inherit", env: { ...process.env, HZA_E2E_URL: baseURL } });
} catch (error) {
  console.error(docker("logs", "--tail", "50", id));
  throw error;
} finally {
  docker("rm", "-f", id);
}
