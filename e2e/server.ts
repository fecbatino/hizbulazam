import http from "node:http";
import fs from "node:fs";
import path from "node:path";
export async function appServer() {
  let revision = 1;
  let fail = "";
  const root = path.resolve("dist");
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(
      new URL(request.url!, "http://localhost").pathname,
    );
    const file = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (
      !file.startsWith(root + path.sep) ||
      !fs.existsSync(file) ||
      pathname === fail
    ) {
      response.writeHead(503);
      response.end();
      return;
    }
    const types: Record<string, string> = {
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".html": "text/html",
      ".woff2": "font/woff2",
      ".webmanifest": "application/manifest+json",
      ".svg": "image/svg+xml",
      ".png": "image/png",
    };
    response.setHeader(
      "Content-Type",
      types[path.extname(file)] ?? "application/octet-stream",
    );
    response.setHeader("Cache-Control", "no-store");
    if (pathname === "/sw.js") {
      response.end(
        fs.readFileSync(file, "utf8") + "\n// test revision " + revision,
      );
      return;
    }
    response.end(fs.readFileSync(file));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  return {
    url: "http://127.0.0.1:" + address.port,
    update() {
      revision++;
    },
    fail(pathname: string) {
      fail = pathname;
    },
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}
