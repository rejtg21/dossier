import { expect, test } from "@playwright/test";

import { pageHeading, routes } from "../../support/site";

/**
 * Proves every route actually exists as a served document.
 *
 * A component test renders a page module it imported by hand, so it passes even
 * if the route never gets exported, the static host does not resolve the clean
 * URL to `<route>.html`, or the file 404s. Only a real request over HTTP can
 * tell those apart — that is the whole point of this file.
 *
 * The single-`<h1>` count is here rather than in Vitest because it is a
 * property of the assembled document (layout + page), not of any one component.
 */
test.describe("route reachability", () => {
  for (const route of routes) {
    test(`${route.path} responds 200 and renders "${route.heading}"`, async ({
      page,
    }) => {
      const response = await page.goto(route.path);

      expect(response?.status()).toBe(200);
      await expect(pageHeading(page)).toHaveCount(1);
      await expect(pageHeading(page)).toHaveText(route.heading);
    });
  }

  test("an unknown route does not resolve to a page", async ({ page }) => {
    // Guards the inverse of the above: if the host fell back to serving
    // index.html for everything, all six checks would pass for the wrong
    // reason.
    const response = await page.goto("/not-a-real-route");

    expect(response?.status()).toBe(404);
  });
});
