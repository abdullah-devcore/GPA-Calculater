const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST_ROOT = path.resolve(__dirname, "..", "dist");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".otf":  "font/otf",
  ".map":  "application/json",
  ".webmanifest": "application/manifest+json",
};

const port = parseInt(process.env.PORT || "3000", 10);

const server = http.createServer((req, res) => {
  let pathname = new URL(req.url || "/", `http://localhost`).pathname;

  // Sanitise path traversal
  const safe = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  let filePath = path.join(DIST_ROOT, safe);

  // If it's a directory, look for index.html inside
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  // SPA fallback — any unknown route serves the root index.html
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_ROOT, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { "content-type": contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Serving GPA Calculator web app on port ${port}`);
});
