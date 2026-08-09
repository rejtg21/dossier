import { defineConfig, devices } from "@playwright/test";

/**
 * The port is deliberately not 3000: that port is occupied on this machine by
 * an unrelated process, and `next start` does not work under `output: "export"`
 * anyway.
 */
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    testIdAttribute: "data-testid",
  },
  webServer: {
    // The artefact under test is the static export, not a dev server: the
    // routing behaviour these specs assert (clean URLs, 404s, the client
    // router rehydrating over pre-rendered HTML) only exists once `out/` is
    // built and served. This is what `npm start` does, on a free port.
    command: `npm run build && npx serve out -l ${PORT} --no-clipboard`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    // The site is fully public — there is no sign-in, so no `setup` project
    // and no `storageState`. Add both here if auth is ever introduced.
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
