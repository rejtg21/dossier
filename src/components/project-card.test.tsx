import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectCard } from "@/components/project-card";
import type { Project } from "@/data/types";

const NOTE = "Reached staging before being paused.";

const base: Project = {
  name: "Testbed",
  tagline: "Healthcare SaaS Platform",
  country: "Canada",
  description: "A referral platform built with Laravel and React.",
  responsibilities: ["System architecture", "Backend development"],
  tech: ["Laravel", "React"],
};

const withLinks: Project = {
  ...base,
  links: [
    { label: "testbed.com", url: "https://testbed.com/" },
    { label: "App Store", url: "https://apps.apple.com/app/id1" },
  ],
};

describe("ProjectCard core fields", () => {
  it("renders the name as a heading", () => {
    render(<ProjectCard project={base} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Testbed" }),
    ).toBeInTheDocument();
  });

  it("renders tagline, country and description", () => {
    render(<ProjectCard project={base} />);

    expect(screen.getByText("Healthcare SaaS Platform")).toBeInTheDocument();
    expect(screen.getByText("Canada")).toBeInTheDocument();
    expect(
      screen.getByText("A referral platform built with Laravel and React."),
    ).toBeInTheDocument();
  });

  it("renders one list item per responsibility", () => {
    render(<ProjectCard project={base} />);

    const items = screen
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(items).toHaveLength(2);
    expect(items[0]).toContain("System architecture");
    expect(items[1]).toContain("Backend development");
  });

  it("renders every tech entry", () => {
    render(<ProjectCard project={base} />);

    expect(screen.getByText("Laravel")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });
});

describe("ProjectCard optional links and note", () => {
  it("renders both when links and note are present", () => {
    render(<ProjectCard project={{ ...withLinks, note: NOTE }} />);

    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByText(NOTE)).toBeInTheDocument();
  });

  it("renders neither when links and note are both absent", () => {
    render(<ProjectCard project={base} />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryByText(NOTE)).toBeNull();
  });

  it("renders links but no note when only links are present", () => {
    render(<ProjectCard project={withLinks} />);

    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.queryByText(NOTE)).toBeNull();
  });

  it("renders the note but no links when only a note is present", () => {
    render(<ProjectCard project={{ ...base, note: NOTE }} />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText(NOTE)).toBeInTheDocument();
  });

  it("renders an empty links array as no links", () => {
    render(<ProjectCard project={{ ...base, links: [] }} />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("gives each link its url, arrow-prefixed label, and safe target", () => {
    render(<ProjectCard project={withLinks} />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://testbed.com/",
      "https://apps.apple.com/app/id1",
    ]);
    expect(links.map((link) => link.textContent)).toEqual([
      "→ testbed.com",
      "→ App Store",
    ]);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
