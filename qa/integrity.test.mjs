import test from "node:test";
import os from "node:os";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
const SHA = "c5c4249f41027501fee7755f8b9926089f59e323524bafe5d3b97c9ce87e6837",
  COMMIT = "24d8c4ec9a8c6e0755daff3df803165d5bab7b5e";
const r = JSON.parse(fs.readFileSync("qa/approved/release.json"));
const hash = (b) => crypto.createHash("sha256").update(b).digest("hex");
const files = (d) =>
  fs
    .readdirSync(d, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? files(path.join(d, e.name))
        : [path.join(d, e.name).replaceAll("\\", "/")],
    );
test("immutable release archive and approved commit", () => {
  assert.equal(r.commit, COMMIT);
  assert.equal(r.archiveSha256, SHA);
  assert.equal(hash(fs.readFileSync("qa/approved/" + r.archive)), SHA);
  execFileSync("python3", ["qa/prepare-reference.py"]);
});
test("approved review file set and complete content hashes", () => {
  assert.deepEqual(files("review").sort(), Object.keys(r.files).sort());
  for (const [p, sha] of Object.entries(r.files))
    assert.equal(hash(fs.readFileSync(p)), sha, p);
});
test("all 12 assets are nonempty and byte-identical", () => {
  const assets = Object.entries(r.files).filter(([p]) =>
    p.startsWith("review/assets/"),
  );
  assert.equal(assets.length, 12);
  for (const [p, sha] of assets) {
    assert.ok(fs.statSync(p).size > 0, p);
    assert.equal(hash(fs.readFileSync(p)), sha, p);
  }
});
test("MP4, WebM and poster signatures are preserved", () => {
  assert.equal(
    fs.readFileSync("review/assets/reel.mp4").subarray(4, 8).toString(),
    "ftyp",
  );
  assert.equal(
    fs.readFileSync("review/assets/reel.webm").subarray(0, 4).toString("hex"),
    "1a45dfa3",
  );
  assert.equal(
    fs
      .readFileSync("review/assets/reel-poster.jpg")
      .subarray(0, 2)
      .toString("hex"),
    "ffd8",
  );
});
test("all local image, video and font references resolve", () => {
  const s = fs.readFileSync("review/index.html", "utf8");
  const refs = [
    ...s.matchAll(
      /(?:src|poster|href)="(assets\/[^"?#]+)"|url\("(assets\/[^"?#]+)"\)/g,
    ),
  ].map((m) => m[1] || m[2]);
  assert.deepEqual(
    [...new Set(refs)].sort(),
    Object.keys(r.files)
      .filter((p) => p.startsWith("review/assets/"))
      .map((p) => p.slice(7))
      .sort(),
  );
  for (const p of refs) assert.ok(fs.statSync("review/" + p).isFile(), p);
});
test("23 ideas, 69 prompt groups and three-model copy match fixed contract", () => {
  const s = fs.readFileSync("review/index.html", "utf8"),
    c = JSON.parse(fs.readFileSync("qa/approved/content.json"));
  for (const k of ["W", "FREE", "THREE"]) {
    const m = s.match(new RegExp("const " + k + " = ([\\s\\S]*?);\\n"));
    assert.ok(m, k);
    assert.deepEqual(
      JSON.parse(JSON.stringify(vm.runInNewContext("(" + m[1] + ")"))),
      c[k],
    );
  }
  assert.equal(c.W.length, 23);
  assert.equal(
    Object.values(c.FREE).flatMap((x) =>
      ["chatgpt", "gemini", "claude"].filter((a) => x[a]),
    ).length,
    69,
  );
});
test("review edition files remain identical to the approved Git commit", () => {
  const names = execFileSync("git", ["ls-tree", "-r", "--name-only", COMMIT], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(p=>p.startsWith("review/"));
  for (const p of names) {
    const expected = execFileSync("git", ["show", COMMIT + ":" + p]);
    assert.equal(hash(fs.readFileSync(p)), hash(expected), p);
  }
});
test("committed screenshot baselines cannot be silently changed or omitted", () => {
  const manifest = JSON.parse(
    fs.readFileSync("qa/approved/visual-manifest.json"),
  );
  assert.ok(Object.keys(manifest).length >= 8);
  assert.deepEqual(files("qa/baselines").sort(), Object.keys(manifest).sort());
  for (const [p, sha] of Object.entries(manifest))
    assert.equal(hash(fs.readFileSync(p)), sha, p);
});

// Exercise the installed lock in disposable Git repositories, not the real site.
test("installed approval lock rejects review and baseline changes while allowing unrelated pages", () => {
  const guard=fs.readFileSync("qa/guard-lock.mjs");
  for (const [changed, allowed] of [["index.html",true],["review/index.html",false],["qa/approved/release.json",false],[".github/workflows/magazine-regression.yml",false]]) {
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),"loop-lock-proof-"));
    const git=(...args)=>execFileSync("git",["-c","user.name=QA fixture","-c","user.email=qa@example.invalid",...args],{cwd:dir,stdio:["ignore","pipe","pipe"]});
    try {
      git("init","--quiet");
      for(const file of ["review/index.html","index.html","qa/approved/release.json",".github/workflows/magazine-regression.yml"]){fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true});fs.writeFileSync(path.join(dir,file),"approved fixture\n");}
      fs.writeFileSync(path.join(dir,"qa/guard-lock.mjs"),guard);git("add",".");git("commit","--quiet","-m","Fixture baseline");
      const base=git("rev-parse","HEAD").toString().trim();fs.appendFileSync(path.join(dir,changed),"changed\n");git("add",".");git("commit","--quiet","-m","Fixture mutation");
      let passed=true;try{execFileSync(process.execPath,["qa/guard-lock.mjs"],{cwd:dir,env:{...process.env,QA_BASE_SHA:base},stdio:"pipe"});}catch{passed=false;}
      assert.equal(passed,allowed,changed);
    } finally {fs.rmSync(dir,{recursive:true,force:true});}
  }
});
