import { expect, test, type Locator } from "@playwright/test";

/**
 * Proves the skip link is real rather than merely present.
 *
 * A component test can assert the markup exists and carries `sr-only`, but not
 * that it is the *first* thing a keyboard reaches, nor that focus genuinely
 * reveals it: jsdom has no sequential focus navigation and no cascade, so the
 * clip that hides it and the `focus:` rule that lifts the clip both resolve to
 * nothing there.
 */

/**
 * Tailwind's `sr-only` hides the link with `clip-path: inset(50%)`;
 * `focus:not-sr-only` lifts it to `none`.
 *
 * The clip is the assertion, not the box size — the sibling `focus:px-4` /
 * `focus:py-2` utilities widen the element on focus even when it stays clipped,
 * so a "box got bigger" check passes against a skip link no one can see.
 */
const clipPathOf = (link: Locator) =>
  link.evaluate((el) => getComputedStyle(el).clipPath);

test.describe("skip link", () => {
  test("is the first tab stop and is unclipped on focus", async ({ page }) => {
    await page.goto("/");

    const skip = page.getByRole("link", { name: "Skip to content" });

    expect(await clipPathOf(skip), "should be clipped before focus").toBe(
      "inset(50%)",
    );

    await page.keyboard.press("Tab");

    // First stop: nothing in the nav may come before it.
    await expect(skip).toBeFocused();

    expect(await clipPathOf(skip), "should be unclipped once focused").toBe(
      "none",
    );

    const box = await skip.boundingBox();
    expect(box, "focused skip link should have a layout box").not.toBeNull();
    expect(box!.width).toBeGreaterThan(1);
  });

  test("moves the user to the main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    await page.getByRole("link", { name: "Skip to content" }).press("Enter");

    await expect(page).toHaveURL("/#content");
    await expect(page.locator("main#content")).toBeVisible();
  });
});
