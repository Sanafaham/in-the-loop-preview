import { defineConfig } from "@playwright/test";
if (process.argv.some((x) => x.startsWith("--update-snapshots")))
  throw Error(
    "Automatic snapshot approval is disabled. Baselines come only from the checksum-verified approved archive.",
  );
const local = process.env.QA_WEBKIT_EXECUTABLE;
const profiles = [
  ["webkit-375", "webkit", 375],
  ["webkit-390", "webkit", 390],
  ["webkit-414", "webkit", 414],
  ["webkit-desktop", "webkit", 1440],
  ["firefox-mobile", "firefox", 390],
  ["firefox-desktop", "firefox", 1440],
];
export default defineConfig({
  testDir: "qa/tests",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  timeout: 90000,
  expect: { timeout: 7000 },
  forbidOnly: !!process.env.CI,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    colorScheme: "light",
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: profiles.map(([name, browserName, width]) => ({
    name,
    use: {
      browserName,
      viewport: { width, height: 844 },
      isMobile: browserName === "webkit" && width < 500,
      launchOptions:
        browserName === "webkit" && local ? { executablePath: local } : {},
    },
  })),
  webServer: {
    command: "node qa/server.mjs",
    url: "http://127.0.0.1:4173/review/",
    reuseExistingServer: false,
  },
});
