import { expect, test } from "@playwright/test";

import { navItem, routes } from "../../support/site";

/**
 * Guards a regression that shipped once already: at 390px the six nav items
 * wrapped onto three rows with the wordmark stranded beside them.
 *
 * This cannot live in Vitest. Whether flex children wrap is decided by the
 * layout engine from measured text advances — jsdom reports every box as 0×0,
 * so a wrapped nav and a single-row nav are indistinguishable there.
 */
test.describe("nav layout at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("all six nav items sit on one row", async ({ page }) => {
    const tops: number[] = [];

    for (const route of routes) {
      const box = await navItem(page, route.label).boundingBox();
      expect(box, `${route.label} should have a layout box`).not.toBeNull();
      tops.push(box!.y);
    }

    // Same row means the same top edge; a wrap pushes items a row-height down.
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(1);
  });

  test("the nav strip absorbs the overflow by scrolling", async ({ page }) => {
    // The six items are far wider than 390px, so the strip *must* be scrollable.
    // If this is false the items fit only because they wrapped.
    const strip = navItem(page, "Home").locator("..");

    const scrollable = await strip.evaluate(
      (el) => el.scrollWidth > el.clientWidth,
    );

    expect(scrollable).toBe(true);
  });

  test("the document itself does not scroll sideways", async ({ page }) => {
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);
  });
});
