import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { ready, openIdeas, snapReady } from "./helpers.mjs";
if (process.env.CI && process.env.QA_CAPTURE_REFERENCE)
  throw Error("CI cannot update committed screenshot baselines");
const shots = [
  ["cover-photo", ".cover"],
  ["cover-introduction", ".cover-discovery"],
  ["video", ".reel"],
  ["photo-invitation", ".try-chatgpt:nth-of-type(1)"],
  ["night-invitation", ".spread .try-chatgpt"],
  ["bill-invitation", ".spread .try-chatgpt"],
  ["carson-introduction", "#essay .grid"],
  ["carson-name", "#essay .say.carson"],
  ["ideas-first", "#index"],
  ["ideas-last", "#r-23"],
  ["closing", "#buy"],
];
async function position(p, name, selector) {
  if (name.startsWith("ideas-")) {
    await openIdeas(p);
    for (const r of await p
      .locator('#index .row-btn[aria-expanded="true"]')
      .all())
      await r.click();
  }
  if (name === "video") {
    await p.locator("#reel").evaluate(async (v) => {
      userPaused = true; // Freeze only the screenshot; actual playback is tested separately.
      const image = new Image();
      image.src = v.poster;
      await image.decode();
      const rect = v.getBoundingClientRect();
      v.style.height = rect.height + "px";
      if (!v.paused)
        await new Promise((resolve) => {
          v.addEventListener("pause", resolve, { once: true });
          v.pause();
        });
      v.removeAttribute("src");
      v.querySelectorAll("source").forEach((s) => s.remove());
      v.load();
      v.style.backgroundImage = `url("${v.poster}")`;
      v.style.backgroundSize = "contain";
      v.style.backgroundPosition = "center";
      v.style.backgroundRepeat = "no-repeat";
    });
  }
  let target = selector;
  if (name === "photo-invitation") target = "#studio .try-chatgpt";
  if (name === "night-invitation") target = ".spread .try-chatgpt >> nth=0";
  if (name === "bill-invitation") target = ".spread .try-chatgpt >> nth=1";
  const e = p.locator(target);
  await e.scrollIntoViewIfNeeded();
  await e.evaluate((el) => {
    document.documentElement.style.scrollBehavior = "auto";
    scrollTo(0, el.getBoundingClientRect().top + scrollY - 100);
  });
  await p.mouse.move(0, 0);
  await p.waitForTimeout(250);
  await e.evaluate((el) =>
    scrollTo(0, Math.round(el.getBoundingClientRect().top + scrollY) - 100),
  );
  await p.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  return e;
}
test("visual regression against checksum-verified approved archive, never the candidate", async ({
  page,
  context,
}, info) => {
  test.skip(
    !info.project.name.startsWith("webkit"),
    "WebKit owns the approved visual profiles; other engine runs interaction tests",
  );
  const reference = await context.newPage();
  await ready(reference, "/approved/");
  await ready(page);
  for (const [name, selector] of shots) {
    const refElement = await position(reference, name, selector);
    const candidateElement = await position(page, name, selector);
    const expected = await refElement.screenshot({ animations: "disabled" });
    const actual = await candidateElement.screenshot({
      animations: "disabled",
    });
    const a = PNG.sync.read(actual),
      e = PNG.sync.read(expected);
    expect({ width: a.width, height: a.height }).toEqual({
      width: e.width,
      height: e.height,
    });
    const diff = new PNG({ width: a.width, height: a.height });
    const changed = pixelmatch(a.data, e.data, diff.data, a.width, a.height, {
      threshold: 0.1,
    });
    await info.attach(name + "-approved", {
      body: expected,
      contentType: "image/png",
    });
    await info.attach(name + "-candidate", {
      body: actual,
      contentType: "image/png",
    });
    if (changed)
      await info.attach(name + "-diff", {
        body: PNG.sync.write(diff),
        contentType: "image/png",
      });
    expect(
      changed,
      `${name}: ${changed} pixels differ from the immutable approved source`,
    ).toBe(0);
    if (
      process.env.QA_CAPTURE_REFERENCE === "1" &&
      info.project.name === "webkit-390"
    ) {
      fs.mkdirSync("qa/baselines", { recursive: true });
      const dir = process.env.QA_REFERENCE_DIR || "qa/baselines";
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, name + ".png");
      if (fs.existsSync(file))
        throw Error("Refusing to overwrite an approved screenshot: " + file);
      fs.writeFileSync(file, expected);
    }
  }
  await reference.close();
});
