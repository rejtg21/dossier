import { expect, test, type Page } from "@playwright/test";

/**
 * The contact page is two columns at desktop and one at mobile.
 *
 * Which column an element lands in is a grid resolution, so jsdom cannot see
 * it: every box there measures 0×0 and a side-by-side layout is
 * indistinguishable from a stacked one.
 */
const introLinks = (page: Page) =>
  page.getByRole("link", { name: "rejtg21@gmail.com", exact: true });

const form = (page: Page) => page.getByRole("form", { name: /send a message/i });

const boxOf = async (page: Page, which: "links" | "form") => {
  const box = await (which === "links" ? introLinks(page) : form(page)).boundingBox();
  expect(box, `${which} should have a layout box`).not.toBeNull();
  return box!;
};

test.describe("contact layout at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("puts the details and the form side by side", async ({ page }) => {
    const links = await boxOf(page, "links");
    const formBox = await boxOf(page, "form");

    // Strictly to the right, with no horizontal overlap: two real columns.
    expect(formBox.x).toBeGreaterThanOrEqual(links.x + links.width);

    // ...and level with each other, rather than merely offset.
    const overlap =
      Math.min(links.y + links.height, formBox.y + formBox.height) -
      Math.max(links.y, formBox.y);
    expect(overlap).toBeGreaterThan(0);
  });

  test("aligns the intro left rather than centred", async ({ page }) => {
    const align = await page
      .getByRole("heading", { level: 1 })
      .evaluate((el) => getComputedStyle(el).textAlign);

    expect(align).toBe("left");
  });

  test("does not scroll sideways", async ({ page }) => {
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("contact layout at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("stacks the form below the details", async ({ page }) => {
    const links = await boxOf(page, "links");
    const formBox = await boxOf(page, "form");

    expect(formBox.y).toBeGreaterThanOrEqual(links.y + links.height);
  });

  test("keeps the intro centred, as the mockup has it", async ({ page }) => {
    const align = await page
      .getByRole("heading", { level: 1 })
      .evaluate((el) => getComputedStyle(el).textAlign);

    expect(align).toBe("center");
  });

  test("does not scroll sideways", async ({ page }) => {
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);
  });
});
