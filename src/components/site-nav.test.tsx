import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SiteNav } from "@/components/site-nav";
import { navItems } from "@/data/nav";

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn<() => string>(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

/** The nav's wordmark also points at "/", so it has to be excluded by name. */
const WORDMARK_NAME = "rej.mediodia";

function renderNavAt(pathname: string) {
  usePathnameMock.mockReturnValue(pathname);
  return render(<SiteNav />);
}

function navLink(label: string) {
  return screen.getByRole("link", { name: label });
}

beforeEach(() => {
  usePathnameMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("SiteNav links", () => {
  it("renders every nav item with its label and href, in order", () => {
    renderNavAt("/");

    const rendered = screen
      .getAllByRole("link")
      .filter((link) => link.textContent !== WORDMARK_NAME)
      .map((link) => ({
        label: link.textContent,
        href: link.getAttribute("href"),
      }));

    expect(rendered).toEqual([
      { label: "Home", href: "/" },
      { label: "Expertise", href: "/expertise" },
      { label: "Projects", href: "/projects" },
      { label: "Leadership", href: "/leadership" },
      { label: "Philosophy", href: "/philosophy" },
      { label: "Contact", href: "/contact" },
    ]);
  });
});

describe("SiteNav active state", () => {
  // The regression this suite exists for: "/" is a prefix of every other
  // route, so a `startsWith` match would light up Home on every page.
  it("does not mark Home active on a non-home route", () => {
    renderNavAt("/projects");

    const home = navLink("Home");
    expect(home).not.toHaveAttribute("aria-current");
    expect(home).toHaveClass("text-muted");
    expect(home).not.toHaveClass("bg-surface-active");

    const projects = navLink("Projects");
    expect(projects).toHaveAttribute("aria-current", "page");
    expect(projects).toHaveClass("bg-surface-active", "text-fg");
    expect(projects).not.toHaveClass("text-muted");
  });

  it("marks Home active on the home route", () => {
    renderNavAt("/");

    const home = navLink("Home");
    expect(home).toHaveAttribute("aria-current", "page");
    expect(home).toHaveClass("bg-surface-active", "text-fg");

    expect(navLink("Contact")).not.toHaveAttribute("aria-current");
  });

  it.each(navItems.map((item) => [item.href, item.label] as const))(
    "marks exactly one item active on %s",
    (href, label) => {
      renderNavAt(href);

      const active = screen.getAllByRole("link", { current: "page" });
      expect(active).toHaveLength(1);
      expect(active[0]).toHaveTextContent(label);
      expect(active[0]).toHaveAttribute("href", href);
    },
  );

  it.each(navItems.map((item) => [item.href] as const))(
    "styles every inactive item as muted on %s",
    (href) => {
      renderNavAt(href);

      for (const item of navItems) {
        if (item.href === href) continue;

        const link = navLink(item.label);
        expect(link).not.toHaveAttribute("aria-current");
        expect(link).toHaveClass("text-muted");
        expect(link).not.toHaveClass("bg-surface-active");
      }
    },
  );

  it("marks nothing active on a route that is not in the nav", () => {
    renderNavAt("/not-a-route");

    expect(screen.queryAllByRole("link", { current: "page" })).toHaveLength(0);
  });
});
