import fs from "node:fs";
import { execFileSync } from "node:child_process";
const approved = "24d8c4ec9a8c6e0755daff3df803165d5bab7b5e";
const base = process.env.QA_BASE_SHA || approved;
const changed = execFileSync("git", ["diff", "--name-only", base, "HEAD"], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);
const production = changed.filter((p) =>
  /^(review\/|assets\/|index\.html$|vercel\.json$|\.nojekyll$)/.test(p),
);
if (production.length)
  throw Error("Locked production files changed: " + production.join(", "));
let installed = false;
try {
  execFileSync("git", ["cat-file", "-e", base + ":qa/approved/release.json"], {
    stdio: "ignore",
  });
  installed = true;
} catch {}
if (installed) {
  const protectedPaths = changed.filter((p) =>
    /^qa\/(approved\/|baselines\/|guard-lock\.mjs$)|^\.github\/workflows\/magazine-regression\.yml$/.test(
      p,
    ),
  );
  if (protectedPaths.length)
    throw Error(
      "Approval required: immutable QA baseline or guard changed: " +
        protectedPaths.join(", "),
    );
}
console.log("Approval lock passed. Published edition is untouched.");
