import { expect, test } from "@playwright/test";

/**
 * Guards the second regression that shipped: the contact links broke mid-word
 * ("rejmediod" / "ia") because the mockup's own numbers did not fit — 27
 * characters of 17px IBM Plex Mono needs ~275px, and a 320px box with 28px
 * side padding leaves 264px.
 *
 * Text advance width is a font-rasterisation result. jsdom has no fonts and no
 * line-breaking, so it cannot see this class of bug at any viewport.
 */
const viewports = [
  { name: "390px", viewport: { width: 390, height: 844 } },
  { name: "1440px", viewport: { width: 1440, height: 900 } },
] as const;

/** Literals on purpose, matching `support/site.ts`: the duplication is the assertion. */
const contactLinks = [
  { label: "rejtg21@gmail.com" },
  { label: "linkedin.com/in/rejmediodia" },
] as const;

for (const { name, viewport } of viewports) {
  test.describe(`contact links at ${name}`, () => {
    test.use({ viewport });

    test.beforeEach(async ({ page }) => {
      await page.goto("/contact");
    });

    for (const { label } of contactLinks) {
      test(`"${label}" renders on a single unbroken line`, async ({ page }) => {
        const link = page.getByRole("link", { name: label, exact: true });
        await expect(link).toBeVisible();

        // One line box per rendered line: a wrap produces two.
        const lineBoxes = await link.evaluate((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return range.getClientRects().length;
        });

        expect(lineBoxes, `"${label}" should occupy one line`).toBe(1);

        // `whitespace-nowrap` converts a would-be wrap into overflow, so the
        // line count alone is not enough — the text must also fit its box.
        const overflow = await link.evaluate(
          (el) => el.scrollWidth - el.clientWidth,
        );

        expect(overflow, `"${label}" should not overflow its box`)
          .toBeLessThanOrEqual(0);
      });
    }

    test("both links share the same width", async ({ page }) => {
      const widths: number[] = [];

      for (const { label } of contactLinks) {
        const box = await page
          .getByRole("link", { name: label, exact: true })
          .boundingBox();

        expect(box, `${label} should have a layout box`).not.toBeNull();
        widths.push(box!.width);
      }

      expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);
    });
  });
}
