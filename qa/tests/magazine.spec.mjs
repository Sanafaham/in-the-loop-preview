import { test, expect } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import {
  contract,
  ready,
  openIdeas,
  clipboard,
  touchable,
  snapReady,
} from "./helpers.mjs";
const release = JSON.parse(fs.readFileSync("qa/approved/release.json"));
test("all approved runtime content, captions, links and source media are intact", async ({
  page,
}) => {
  await ready(page);
  expect(await page.evaluate(() => ({ W, FREE, THREE }))).toEqual({
    W: contract.W,
    FREE: contract.FREE,
    THREE: contract.THREE,
  });
  expect(
    await page
      .locator("a")
      .evaluateAll((es) => es.map((e) => e.getAttribute("href"))),
  ).toEqual(contract.links);
  expect(
    await page
      .locator("img")
      .evaluateAll((es) =>
        es.map((e) =>
          Object.fromEntries(
            [...e.attributes]
              .filter((a) => !["style", "class"].includes(a.name))
              .map((a) => [a.name, a.value]),
          ),
        ),
      ),
  ).toEqual(contract.images);
  await expect(page.locator("#essay")).toContainText("سيدتي الجميلة");
  await expect(page.locator("#essay")).toContainText("My beautiful lady.");
  expect(
    (await page.locator("main").innerText())
      .trim()
      .endsWith("The key is in your hands. What will you unlock?"),
  ).toBe(true);
});
test("all image, poster, font and video assets load with approved bytes", async ({
  page,
  request,
}) => {
  await ready(page);
  expect(
    await page
      .locator("img")
      .evaluateAll((es) =>
        es.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src),
      ),
  ).toEqual([]);
  for (const [file, hash] of Object.entries(release.files).filter(([p]) =>
    p.startsWith("review/assets/"),
  )) {
    const r = await request.get("/" + file);
    expect(r.ok(), file).toBe(true);
    const b = await r.body();
    expect(b.length).toBeGreaterThan(0);
    expect(crypto.createHash("sha256").update(b).digest("hex"), file).toBe(
      hash,
    );
  }
  await expect(page.locator("#reel")).toHaveAttribute(
    "poster",
    "assets/reel-poster.jpg",
  );
  await expect(page.locator(".reel-bar figcaption")).toHaveText(
    "Same brief, two tools. Midjourney and Runway, side by side.",
  );
});
for (const ext of ["mp4", "webm"])
  test(`${ext}: real play, sound, pause and mobile controls`, async ({
    page,
  }) => {
    await ready(page);
    await page.locator("#reel").scrollIntoViewIfNeeded();
    await page.evaluate(async (ext) => {
      userPaused = true; // Isolate source-format controls from the independent scroll-autoplay observer.
      const v = document.querySelector("#reel");
      if (!v.paused)
        await new Promise((resolve) => {
          v.addEventListener("pause", resolve, { once: true });
          v.pause();
        });
      v.src = new URL("assets/reel." + ext, location.href).href;
      v.load();
    }, ext);
    await page.locator("#reel").evaluate(async (v) => {
      if (v.readyState < 1)
        await new Promise((resolve, reject) => {
          v.addEventListener("loadedmetadata", resolve, { once: true });
          v.addEventListener(
            "error",
            () => reject(Error("Media load error " + v.error?.code)),
            { once: true },
          );
        });
      v.pause();
    });
    await expect(page.locator("#reelToggle")).toHaveText("Play");
    await page.locator("#reelToggle").click();
    await expect
      .poll(async () => {
        const state = await page.locator("#reel").evaluate((v) => ({
          time: v.currentTime,
          paused: v.paused,
          readyState: v.readyState,
          networkState: v.networkState,
          error: v.error
            ? { code: v.error.code, message: v.error.message }
            : null,
          src: v.currentSrc,
          rect: {
            top: v.getBoundingClientRect().top,
            bottom: v.getBoundingClientRect().bottom,
          },
        }));
        console.log("Media diagnostic", ext, JSON.stringify(state));
        return state.time;
      })
      .toBeGreaterThan(0.15);
    await page.locator("#reelSound").click();
    await expect(page.locator("#reelSound")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      await page
        .locator("#reel")
        .evaluate((v) => !v.muted && v.volume > 0 && !v.paused),
    ).toBe(true);
    await expect(page.locator("#reelToggle")).toHaveText("Pause");
    await page.locator("#reelToggle").click();
    expect(await page.locator("#reel").evaluate((v) => v.paused)).toBe(true);
    const t = await page.locator("#reel").evaluate((v) => v.currentTime);
    await page.waitForTimeout(350);
    expect(
      Math.abs(
        (await page.locator("#reel").evaluate((v) => v.currentTime)) - t,
      ),
    ).toBeLessThan(0.06);
    await expect(page.locator("#reelToggle")).toHaveText("Play");
    await touchable(page.locator("#reelToggle"));
    await touchable(page.locator("#reelSound"));
    const r = await page.locator("#reel").boundingBox();
    expect(r.width / r.height).toBeCloseTo(16 / 9, 1);
    expect(r.x + r.width).toBeLessThanOrEqual(page.viewportSize().width);
  });
test("blocked autoplay still permits an actual reader Play click", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    window.__manual = false;
    window.__blocked = 0;
    document.addEventListener(
      "click",
      (e) => {
        if (e.isTrusted && e.target.closest("#reelToggle"))
          window.__manual = true;
      },
      true,
    );
    HTMLMediaElement.prototype.play = function () {
      if (!window.__manual) {
        window.__blocked++;
        return Promise.reject(
          new DOMException("Autoplay blocked", "NotAllowedError"),
        );
      }
      return play.call(this);
    };
  });
  await ready(page);
  await page.locator("#reel").scrollIntoViewIfNeeded();
  await page.locator("#reel").evaluate((v) => v.play().catch(() => {}));
  expect(await page.evaluate(() => window.__blocked)).toBeGreaterThan(0);
  expect(await page.locator("#reel").evaluate((v) => v.paused)).toBe(true);
  await page.locator("#reelToggle").click();
  await expect
    .poll(() => page.locator("#reel").evaluate((v) => v.currentTime))
    .toBeGreaterThan(0.1);
});
for (const [i, c] of contract.invitations.entries()) {
  test(`invitation ${i + 1}: exact independent prompt copied by real click`, async ({
    page,
  }) => {
    await clipboard(page);
    await ready(page);
    const card = page.locator(".try-chatgpt").nth(i);
    await expect(card.locator("h3")).toHaveText(c.title);
    expect(await card.locator(".try-prompt").textContent()).toBe(c.prompt);
    await expect(card.locator(".try-copy")).toHaveAttribute(
      "data-copy-prompt",
      c.copyPrompt,
    );
    await card.locator(".try-copy").click();
    await expect(card.locator(".try-copy")).toHaveText("Copied ✓");
    expect(await page.evaluate(() => window.__writes)).toEqual([c.prompt]);
    for (const j of [0, 1, 2].filter((j) => j !== i))
      expect(
        await page
          .locator(".try-chatgpt")
          .nth(j)
          .locator(".try-copy")
          .innerText(),
      ).toBe("Copy the idea");
    await touchable(card.locator(".try-copy"));
    await touchable(card.locator(".try-open"));
  });
  test(`invitation ${i + 1}: actual new-tab Open ChatGPT click`, async ({
    page,
    context,
  }) => {
    await ready(page);
    await context.route("https://chatgpt.com/**", (r) =>
      r.fulfill({
        body: "Destination confirmed without sending a prompt",
        contentType: "text/html",
      }),
    );
    const popup = page.waitForEvent("popup");
    await page.locator(".try-chatgpt").nth(i).locator(".try-open").click();
    const p = await popup;
    await p.waitForLoadState();
    expect(p.url()).toBe(c.href);
    await p.close();
  });
  test(`invitation ${i + 1}: denied clipboard gives visible recovery feedback`, async ({
    page,
  }) => {
    await clipboard(page, "reject");
    await ready(page);
    const card = page.locator(".try-chatgpt").nth(i);
    await card.locator(".try-copy").click();
    await expect(card.locator(".try-copy")).toHaveText("Select the idea above");
    expect(await page.evaluate(() => window.__writes)).toEqual([c.prompt]);
    await expect(card.locator(".try-prompt")).toHaveText(c.prompt);
    await expect(card.locator(".try-copy")).toHaveText("Copy the idea", {
      timeout: 4000,
    });
  });
}
test("all 23 ideas retain exact headings, descriptions and order; all 69 tool tabs copy all 71 exact prompt variants", async ({
  page,
}) => {
  test.setTimeout(180000); // 71 real copy actions must also finish on a busy CI runner.
  await clipboard(page);
  await ready(page);
  await openIdeas(page);
  expect(await page.locator("#index .row-t").allTextContents()).toEqual(
    contract.W.map((w) => w[0]),
  );
  expect(await page.locator("#index .row-p").allTextContents()).toEqual(
    contract.W.map((w) => w[2]),
  );
  const writes = [];
  for (let n = 1; n <= 23; n++) {
    const row = page.locator("#r-" + n);
    if ((await row.getAttribute("aria-expanded")) !== "true") await row.click();
    for (const app of ["chatgpt", "gemini", "claude"]) {
      await page.locator(`#t-${n}-${app}`).click();
      const d = contract.FREE[n][app];
      const prompts = d.ps || [{ p: d.p }];
      expect(await page.locator(`#d-${n} .ptext`).allTextContents()).toEqual(
        prompts.map((x) => x.p),
      );
      for (let k = 0; k < prompts.length; k++) {
        await page.locator(`#d-${n} .copy`).nth(k).click();
        writes.push(prompts[k].p);
        await expect(page.locator(`#d-${n} .copy`).nth(k)).toHaveText(
          "Copied ✓",
        );
      }
    }
    await row.click();
  }
  expect(writes.length).toBe(71);
  expect(await page.evaluate(() => window.__writes)).toEqual(writes);
});
test("idea-copy clipboard failure selects complete text for manual copying", async ({
  page,
}) => {
  await clipboard(page, "reject");
  await ready(page);
  await openIdeas(page);
  if ((await page.locator("#r-1").getAttribute("aria-expanded")) !== "true")
    await page.locator("#r-1").click();
  await page.locator("#d-1 .copy").evaluate((button) => {
    window.__fallbackFeedback = [];
    new MutationObserver(() =>
      window.__fallbackFeedback.push({
        label: button.textContent,
        selected: getSelection().toString(),
        toast: document.querySelector("#toast").textContent,
        shown: document.querySelector("#toast").classList.contains("show"),
      }),
    ).observe(button, { childList: true, subtree: true, characterData: true });
  });
  await page.locator("#d-1 .copy").click();
  // WebKit can finish its native selection handling after the brief label resets.
  // Observe the real feedback event rather than requiring a later polling tick.
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__fallbackFeedback.find((x) => x.label === "Selected"),
      ),
    )
    .toEqual({
      label: "Selected",
      selected: contract.FREE[1].chatgpt.p,
      toast: "Text selected. Use your device's Copy.",
      shown: true,
    });
  expect(await page.evaluate(() => window.__writes)).toEqual([
    contract.FREE[1].chatgpt.p,
  ]);
  expect(await page.evaluate(() => getSelection().toString())).toBe(
    contract.FREE[1].chatgpt.p,
  );
  await expect(page.locator("#toast")).toContainText("Use your device's Copy");
});
test("Contents, every navigation target and Start Reading remain usable", async ({
  page,
}) => {
  await ready(page);
  expect(
    await page
      .locator('a[href^="#"]')
      .evaluateAll((es) =>
        es
          .filter((a) => !document.getElementById(a.hash.slice(1)))
          .map((a) => a.hash),
      ),
  ).toEqual([]);
  await page.locator('.cover-buy a[href="#already"]').click();
  await expect
    .poll(() =>
      page
        .locator("#already")
        .evaluate((e) => Math.round(e.getBoundingClientRect().top)),
    )
    .toBeGreaterThanOrEqual(50);
  expect(
    await page
      .locator("#already")
      .evaluate((e) => e.getBoundingClientRect().top),
  ).toBeLessThan(100);
  if (await page.locator("#menuBtn").isVisible()) {
    for (const hash of await page
      .locator("#menu a")
      .evaluateAll((es) => es.map((a) => a.hash))) {
      await page.locator("#menuBtn").click();
      await expect(page.locator("#menu")).toBeVisible();
      await page.locator(`#menu a[href="${hash}"]`).first().click();
      await expect(page.locator("#menu")).toBeHidden();
      const target = page.locator(hash);
      await expect(target).toBeVisible();
      const navBottom = await page
        .locator(".topbar")
        .evaluate((e) => e.getBoundingClientRect().bottom);
      const top = await target.evaluate((e) => e.getBoundingClientRect().top);
      expect(top, hash).toBeGreaterThanOrEqual(navBottom - 3);
    }
    await page.locator("#menuBtn").click();
    await page.keyboard.press("Escape");
    await expect(page.locator("#menu")).toBeHidden();
  } else {
    for (const a of await page.locator("#nav a").all()) {
      const hash = await a.getAttribute("href");
      await a.click();
      await expect(page.locator(hash)).toBeVisible();
    }
  }
});
test("filters, featured cards, comparison tabs and questions respond to clicks", async ({
  page,
}) => {
  await ready(page);
  for (const app of ["chatgpt", "gemini", "claude"]) {
    await page.locator(`#threeTabs [data-id="${app}"]`).click();
    await expect(page.locator(`#threeTabs [data-id="${app}"]`)).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#threePanel")).toContainText(
      contract.THREE.find((x) => x.id === app).title,
    );
  }
  for (const card of await page.locator(".fcard-q").all()) {
    await card.click();
    await expect(card).toHaveAttribute("aria-expanded", "true");
    for (const tab of await card.locator("..").locator(".tab").all()) {
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
    }
    await card.click();
  }
  await openIdeas(page);
  for (const chip of await page.locator(".chip").all()) {
    const f = await chip.getAttribute("data-f");
    await chip.click();
    await expect(page.locator("#index > li")).toHaveCount(
      f === "all" ? 23 : contract.W.filter((w) => w[1] === f).length,
    );
  }
  for (const q of await page.locator(".faq details").all()) {
    await q.locator("summary").click();
    expect(await q.getAttribute("open")).not.toBeNull();
    await q.locator("summary").click();
  }
});
test("responsive typography, controls, dark-section contrast and zero application errors", async ({
  page,
}) => {
  const errors = [],
    bad = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) bad.push(r.url());
  });
  await ready(page);
  for (const section of await page
    .locator("main > section,main > aside")
    .all()) {
    await section.scrollIntoViewIfNeeded();
    const issues = await section.evaluate((root) => {
      const issues = [];
      for (const e of root.querySelectorAll("p,h1,h2,h3,button,a.btn")) {
        const r = e.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (
          r.left < -0.5 ||
          r.right > innerWidth + 0.5 ||
          e.scrollWidth > e.clientWidth + 2
        )
          issues.push("clipped: " + e.textContent.slice(0, 50));
        if (
          e.matches("p") &&
          e.textContent.length > 130 &&
          r.width < Math.min(160, innerWidth - 40)
        )
          issues.push("narrow: " + e.textContent.slice(0, 50));
      }
      for (const c of root.querySelectorAll(".ed,.story,.prose")) {
        const ps = [...c.children].filter(
          (e) => e.getBoundingClientRect().height,
        );
        for (let i = 1; i < ps.length; i++)
          if (
            ps[i].getBoundingClientRect().top <
            ps[i - 1].getBoundingClientRect().bottom - 2
          )
            issues.push("overlap: " + ps[i].textContent.slice(0, 50));
      }
      return issues;
    });
    expect(issues).toEqual([]);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  for (const card of await page.locator(".try-chatgpt").all()) {
    await card.scrollIntoViewIfNeeded();
    await touchable(card.locator("button"));
    await touchable(card.locator("a"));
  }
  for (const card of await page.locator(".spread .try-chatgpt").all())
    expect(
      await card
        .locator(".try-prompt")
        .evaluate((e) => getComputedStyle(e).color),
    ).toBe("rgb(12, 11, 11)");
  expect(errors).toEqual([]);
  expect(bad).toEqual([]);
});
test("native browser clipboard read-back when platform permission is available", async ({
  page,
}) => {
  await ready(page);
  for (const [i, c] of contract.invitations.entries()) {
    await page.locator(".try-chatgpt").nth(i).locator(".try-copy").click();
    await expect(
      page.locator(".try-chatgpt").nth(i).locator(".try-copy"),
    ).toHaveText("Copied ✓");
    const r = await page.evaluate(async () => {
      try {
        return await Promise.race([
          navigator.clipboard.readText().then((text) => ({ text })),
          new Promise((r) =>
            setTimeout(
              () =>
                r({
                  unavailable:
                    "Read permission did not resolve within 1 second",
                }),
              1000,
            ),
          ),
        ]);
      } catch (e) {
        return { unavailable: e.name + ": " + e.message };
      }
    });
    test.skip(
      !!r.unavailable,
      "Native clipboard read-back unavailable in this automation platform: " +
        r.unavailable,
    );
    expect(r.text).toBe(c.prompt);
  }
});
