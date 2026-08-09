import { expect, type Locator, type Page } from "@playwright/test";

/**
 * The expected shape of the site, written out as literals on purpose.
 *
 * Deriving these from `src/data/nav.ts` would make the specs agree with the
 * app by construction — a renamed route or a dropped page would still pass.
 * The duplication is the assertion.
 */
export const routes = [
  { path: "/", label: "Home", heading: "Rej Mediodia" },
  { path: "/expertise", label: "Expertise", heading: "Technical Expertise" },
  {
    path: "/projects",
    label: "Projects",
    heading: "Notable Production Projects",
  },
  { path: "/leadership", label: "Leadership", heading: "Engineering Leadership" },
  { path: "/philosophy", label: "Philosophy", heading: "Engineering Philosophy" },
  // Straight ASCII apostrophe (U+0027), matching `contactHeading` in
  // src/data/contact.ts. A typographic U+2019 here would not match.
  { path: "/contact", label: "Contact", heading: "Let's talk" },
] as const;

export type Route = (typeof routes)[number];

/** The nav's wordmark is a second link to "/", so nav links are matched exactly. */
export function navItem(page: Page, label: string): Locator {
  return page
    .getByRole("navigation")
    .getByRole("link", { name: label, exact: true });
}

export function wordmark(page: Page): Locator {
  return page
    .getByRole("navigation")
    .getByRole("link", { name: "rej.mediodia", exact: true });
}

export function pageHeading(page: Page): Locator {
  return page.getByRole("heading", { level: 1 });
}

/**
 * Asserts that exactly one nav item carries `aria-current="page"`, and that it
 * is `activeLabel`.
 *
 * Playwright's `getByRole` has no `current` option, so "exactly one" is
 * expressed by walking every nav item by name: one must have the attribute and
 * the other five must not. The wordmark is checked too — it also points at "/"
 * and must never be marked current.
 */
export async function expectActiveNavItem(page: Page, activeLabel: string) {
  for (const route of routes) {
    const link = navItem(page, route.label);

    if (route.label === activeLabel) {
      await expect(link).toHaveAttribute("aria-current", "page");
    } else {
      await expect(link).not.toHaveAttribute("aria-current");
    }
  }

  await expect(wordmark(page)).not.toHaveAttribute("aria-current");
}
