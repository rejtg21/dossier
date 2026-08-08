import { expect, test } from "@playwright/test";

import { navItem, pageHeading, routes, wordmark } from "../../support/site";

/**
 * Proves clicking a nav link actually moves the user to that page.
 *
 * The component test renders `SiteNav` with a mocked `usePathname` and asserts
 * on hrefs — it cannot click, because jsdom has no router, no history, and no
 * document to navigate to. It also cannot fail on an overlay swallowing the
 * click: `click()` runs Playwright's actionability checks (visible, stable,
 * receives events, enabled) against the real sticky, backdrop-blurred nav.
 */
test.describe("nav link navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  for (const route of routes) {
    test(`clicking "${route.label}" navigates to ${route.path}`, async ({
      page,
    }) => {
      await navItem(page, route.label).click();

      await expect(page).toHaveURL(route.path);
      await expect(pageHeading(page)).toHaveText(route.heading);
    });
  }

  test("the wordmark returns to Home from a deep route", async ({ page }) => {
    await navItem(page, "Philosophy").click();
    await expect(page).toHaveURL("/philosophy");

    await wordmark(page).click();

    await expect(page).toHaveURL("/");
    await expect(pageHeading(page)).toHaveText("Rej Mediodia");
  });

  test("the back button returns to the previous page", async ({ page }) => {
    await navItem(page, "Projects").click();
    await expect(pageHeading(page)).toHaveText("Notable Production Projects");

    await page.goBack();

    await expect(page).toHaveURL("/");
    await expect(pageHeading(page)).toHaveText("Rej Mediodia");
  });
});
