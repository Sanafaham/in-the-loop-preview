import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
execFileSync("python3", ["qa/prepare-reference.py"], { stdio: "inherit" });
const roots = {
  candidate: path.resolve("review"),
  approved: path.resolve("qa/.approved-site"),
};
const mime = {
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
};
http
  .createServer((req, res) => {
    try {
      const u = new URL(req.url, "http://localhost");
      const ref = u.pathname.startsWith("/approved/");
      const root = ref ? roots.approved : roots.candidate;
      const rel = decodeURIComponent(
        u.pathname.replace(/^\/(approved|review)\//, ""),
      );
      const f = path.resolve(root, rel || "index.html");
      if (!f.startsWith(root + path.sep) || !fs.statSync(f).isFile())
        throw Error("not found");
      const data = fs.readFileSync(f);
      res.setHeader(
        "Content-Type",
        mime[path.extname(f)] || "application/octet-stream",
      );
      res.setHeader("Cache-Control", "no-store");
      const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
      if (range) {
        const start = +range[1],
          end = Math.min(
            range[2] ? +range[2] : data.length - 1,
            data.length - 1,
          );
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${data.length}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1,
        });
        res.end(data.subarray(start, end + 1));
      } else {
        res.setHeader("Content-Length", data.length);
        res.end(data);
      }
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("QA server http://127.0.0.1:4173/review/"),
  );
