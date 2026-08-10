import { expect, test } from "@playwright/test";

import { productionOrigin, routes } from "../../support/site";

/**
 * Guards the metadata a crawler or a link unfurler actually receives.
 *
 * This belongs in e2e rather than Vitest because none of it is a property of a
 * component. A page's `metadata` export is only half the story: Next merges it
 * with the root layout, and it replaces `openGraph` per segment instead of
 * merging it — so a page can look correct in isolation and still ship without
 * a card image. Only the assembled document proves otherwise.
 *
 * The card image, sitemap, and robots file are checked over HTTP for the same
 * reason the reachability spec exists: a metadata route that fails to make it
 * into the static export is invisible until something requests it.
 */
const ogImageUrl = `${productionOrigin}/opengraph-image.png`;

test.describe("page metadata", () => {
  for (const route of routes) {
    test(`${route.path} is titled "${route.title}"`, async ({ page }) => {
      await page.goto(route.path);

      await expect(page).toHaveTitle(route.title);
    });

    test(`${route.path} canonicalises to itself on the production origin`, async ({
      page,
    }) => {
      await page.goto(route.path);

      // Trailing slashes are dropped, so "/" canonicalises to the bare origin.
      const canonical =
        route.path === "/" ? productionOrigin : productionOrigin + route.path;

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        canonical,
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        "content",
        canonical,
      );
    });

    test(`${route.path} carries the shared social card`, async ({ page }) => {
      await page.goto(route.path);

      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        ogImageUrl,
      );
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
        "content",
        "website",
      );
      await expect(
        page.locator('meta[property="og:site_name"]'),
      ).toHaveAttribute("content", "Rej Mediodia");
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        "content",
        "summary_large_image",
      );
    });

    test(`${route.path} describes itself in its own words`, async ({
      page,
    }) => {
      await page.goto(route.path);

      const description = page.locator('meta[name="description"]');
      await expect(description).toHaveAttribute("content", /\S/);

      // og:description must say the same thing as the meta description, or a
      // shared link and a search result advertise the page differently.
      await expect(
        page.locator('meta[property="og:description"]'),
      ).toHaveAttribute("content", (await description.getAttribute("content"))!);
    });
  }

  test("every page's title is distinct", async ({ page }) => {
    const titles: string[] = [];

    for (const route of routes) {
      await page.goto(route.path);
      titles.push(await page.title());
    }

    expect(new Set(titles).size).toBe(routes.length);
  });

  test("the home page ships Person structured data", async ({ page }) => {
    await page.goto("/");

    const raw = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    const person = JSON.parse(raw ?? "{}");

    expect(person["@type"]).toBe("Person");
    expect(person.name).toBe("Rej Mediodia");
    expect(person.url).toBe(productionOrigin);
    // An absolute image: a crawler reading this has no page to resolve it from.
    expect(person.image).toBe(ogImageUrl);
  });

  test("the social card image is served", async ({ page }) => {
    const response = await page.request.get("/opengraph-image.png");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  });

  test("robots.txt allows crawling and points at the sitemap", async ({
    page,
  }) => {
    const response = await page.request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain("Allow: /");
    expect(body).toContain(`Sitemap: ${productionOrigin}/sitemap.xml`);
  });

  test("the sitemap lists every route at its canonical url", async ({
    page,
  }) => {
    const response = await page.request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const body = await response.text();
    for (const route of routes) {
      const canonical =
        route.path === "/" ? productionOrigin : productionOrigin + route.path;
      expect(body).toContain(`<loc>${canonical}</loc>`);
    }
  });
});
