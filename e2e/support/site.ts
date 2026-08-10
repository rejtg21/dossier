import { expect, type Locator, type Page } from "@playwright/test";

import { contactLinks } from "@/data/contact";

/**
 * The expected shape of the site, written out as literals on purpose.
 *
 * Deriving these from `src/data/nav.ts` would make the specs agree with the
 * app by construction — a renamed route or a dropped page would still pass.
 * The duplication is the assertion.
 */
export const routes = [
  {
    path: "/",
    label: "Home",
    heading: "Rej Mediodia",
    // The home page is the one that names the role instead of a section.
    title: "Rej Mediodia — Software Architect & Lead Engineer",
  },
  {
    path: "/expertise",
    label: "Expertise",
    heading: "Technical Expertise",
    title: "Rej Mediodia - Expertise",
  },
  {
    path: "/projects",
    label: "Projects",
    heading: "Notable Production Projects",
    title: "Rej Mediodia - Projects",
  },
  {
    path: "/leadership",
    label: "Leadership",
    heading: "Engineering Leadership",
    title: "Rej Mediodia - Leadership",
  },
  {
    path: "/philosophy",
    label: "Philosophy",
    heading: "Engineering Philosophy",
    title: "Rej Mediodia - Philosophy",
  },
  {
    path: "/contact",
    label: "Contact",
    // Straight ASCII apostrophe (U+0027), matching `contactHeading` in
    // src/data/contact.ts. A typographic U+2019 here would not match.
    heading: "Let's talk",
    title: "Rej Mediodia - Contact",
  },
] as const;

/**
 * The production origin, written out for the same reason as the routes: the
 * canonical and Open Graph URLs must point at the live site no matter which
 * host the export is being served from, so deriving them from `baseURL` would
 * assert nothing.
 */
export const productionOrigin = "https://resmediodia.space";

/**
 * Read from the app data, unlike `routes` above — deliberately the opposite
 * call.
 *
 * A route's path and heading are the contract: renaming one is a change worth
 * failing over. A contact address is not. The specs that use these labels
 * assert *layout* — that a label fits its box on one line, which column it
 * lands in — and that is true of whatever address is configured. Pinning the
 * string here only means the suite goes red when the address changes rather
 * than when the layout breaks.
 */
export const contactLinkLabels = contactLinks.map((link) => link.label);

/** The email link specifically, which is the longest and so the one that wraps first. */
export const contactEmailLabel = contactLinks.find((link) =>
  link.href.startsWith("mailto:"),
)!.label;

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
