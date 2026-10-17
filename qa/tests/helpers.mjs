import fs from "node:fs";
import { expect } from "@playwright/test";
export const contract = JSON.parse(fs.readFileSync("qa/approved/content.json"));
export async function ready(page, url = "/review/") {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });
  await page.evaluate(() =>
    Promise.all([
      document.fonts.ready,
      ...[...document.images].map((i) =>
        i.complete
          ? Promise.resolve()
          : new Promise((r) => {
              i.addEventListener("load", r, { once: true });
              i.addEventListener("error", r, { once: true });
            }),
      ),
    ]),
  );
}
export async function openIdeas(page) {
  if (
    (await page.locator("#exploreBtn").getAttribute("aria-expanded")) !== "true"
  )
    await page.locator("#exploreBtn").click();
  await expect(page.locator("#collection")).toBeVisible();
}
export async function clipboard(page, mode = "success") {
  await page.addInitScript((mode) => {
    window.__writes = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__writes.push(text);
          if (mode === "reject")
            throw new DOMException("Denied", "NotAllowedError");
        },
      },
    });
  }, mode);
}
export async function snapReady(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.evaluate((sel) => {
    document.documentElement.style.scrollBehavior = "auto";
    const e = document.querySelector(sel);
    scrollTo(0, e.getBoundingClientRect().top + scrollY - 70);
  }, selector);
  await page.waitForTimeout(80);
  await page.mouse.move(0, 0);
}
export async function touchable(locator) {
  await expect(locator).toBeVisible();
  const b = await locator.boundingBox();
  expect(b.width).toBeGreaterThanOrEqual(24);
  expect(b.height).toBeGreaterThanOrEqual(24);
  expect(
    await locator.evaluate((e) => {
      const r = e.getBoundingClientRect();
      return (
        e.scrollWidth <= e.clientWidth + 1 &&
        r.left >= 0 &&
        r.right <= innerWidth + 1
      );
    }),
  ).toBe(true);
}
