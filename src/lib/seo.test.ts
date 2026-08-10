import { describe, expect, it } from "vitest";

import { contactLinks } from "@/data/contact";
import { navItems } from "@/data/nav";
import { name, roleLine } from "@/data/profile";
import { ogImage, siteUrl } from "@/data/site";
import { openGraphBase, pageMetadata, personJsonLd } from "@/lib/seo";

describe("pageMetadata", () => {
  const projects = pageMetadata({
    title: "Projects",
    description: "Notable production work.",
    path: "/projects",
  });

  it("keeps the bare title so the layout template can prefix the name", () => {
    // "Rej Mediodia - Projects" is assembled by the template in the root
    // layout; a page that prefixed it itself would double the name.
    expect(projects.title).toBe("Projects");
  });

  it("canonicalises the page to its own path, not the site root", () => {
    expect(projects.alternates?.canonical).toBe("/projects");
  });

  it("gives Open Graph the page's own url, title, and description", () => {
    expect(projects.openGraph).toMatchObject({
      title: "Projects",
      description: "Notable production work.",
      url: "/projects",
    });
  });

  it("restates the shared Open Graph fields, which do not merge from the layout", () => {
    // Next replaces `openGraph` per segment. Dropping these would strip the
    // card image and site name from every page except the home page.
    expect(projects.openGraph).toMatchObject(openGraphBase);
    expect(projects.openGraph?.images).toEqual([ogImage]);
  });

  it("stays silent on Twitter so the layout's large card survives", () => {
    // A `twitter` block here would replace the layout's, and with it the
    // `summary_large_image` card, downgrading the preview to a thumbnail.
    expect(projects.twitter).toBeUndefined();
  });

  it("leaves the genuinely global fields to the root layout", () => {
    expect(projects.robots).toBeUndefined();
    expect(projects.metadataBase).toBeUndefined();
    expect(projects.keywords).toBeUndefined();
  });

  it("marks a title absolute so the home page is not prefixed with its own name", () => {
    const home = pageMetadata({
      title: "Rej Mediodia — Software Architect & Lead Engineer",
      description: "",
      path: "/",
      absoluteTitle: true,
    });

    expect(home.title).toEqual({
      absolute: "Rej Mediodia — Software Architect & Lead Engineer",
    });
    expect(home.openGraph?.title).toEqual(home.title);
  });

  it("gives every navigable page a distinct canonical", () => {
    const canonicals = navItems
      .filter((item) => item.href !== "/")
      .map(
        (item) =>
          pageMetadata({ title: item.label, description: "", path: item.href })
            .alternates?.canonical,
      );

    expect(new Set(canonicals).size).toBe(canonicals.length);
  });
});

describe("personJsonLd", () => {
  const person = personJsonLd();

  it("declares a Person that search engines can attribute to the site", () => {
    expect(person["@context"]).toBe("https://schema.org");
    expect(person["@type"]).toBe("Person");
    expect(person.name).toBe(name);
    expect(person.url).toBe(siteUrl);
  });

  it("points at an absolute image, since a crawler has no page to resolve against", () => {
    expect(person.image).toMatch(/^https:\/\//);
  });

  it("splits the role line into the topics the person is known for", () => {
    expect(person.knowsAbout).toEqual([
      "Software Architect",
      "Lead Engineer",
      "Former CTO",
    ]);
    expect(roleLine).toContain("Former CTO");
  });

  it("takes the email from the contact data rather than repeating it", () => {
    const mailto = contactLinks.find((link) =>
      link.href.startsWith("mailto:"),
    )?.href;

    expect(person.email).toBe(mailto?.replace("mailto:", ""));
    expect(person.email).not.toContain("mailto:");
  });

  it("lists the linked profiles as sameAs, and only the web ones", () => {
    expect(person.sameAs).toEqual(
      contactLinks
        .filter((link) => link.href.startsWith("http"))
        .map((link) => link.href),
    );
  });
});
