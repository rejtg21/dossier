import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExpertiseCard } from "@/components/expertise-card";
import type { ExpertiseCategory } from "@/data/types";

const category: ExpertiseCategory = {
  title: "Backend Development",
  groups: [
    { label: "Primary technologies", items: ["Laravel / PHP", "Node.js"] },
    { label: "Experience building", items: ["Webhooks"] },
  ],
};

/** A group renders as `<div><Eyebrow label /><div>chips…</div></div>`. */
function groupBlockFor(label: string): HTMLElement {
  const block = screen.getByText(label).parentElement;
  if (block === null) throw new Error(`no group block for "${label}"`);
  return block;
}

function itemsIn(block: HTMLElement): string[] {
  const chipRow = block.lastElementChild;
  if (chipRow === null) throw new Error("group block has no chip row");
  return Array.from(chipRow.children).map((chip) => chip.textContent ?? "");
}

describe("ExpertiseCard", () => {
  it("renders the category title as a heading", () => {
    render(<ExpertiseCard category={category} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Backend Development" }),
    ).toBeInTheDocument();
  });

  it("renders every group label", () => {
    render(<ExpertiseCard category={category} />);

    expect(screen.getByText("Primary technologies")).toBeInTheDocument();
    expect(screen.getByText("Experience building")).toBeInTheDocument();
  });

  it("renders every item of every group", () => {
    render(<ExpertiseCard category={category} />);

    expect(screen.getByText("Laravel / PHP")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(screen.getByText("Webhooks")).toBeInTheDocument();
  });

  it("keeps each group's items inside that group's block", () => {
    render(<ExpertiseCard category={category} />);

    const primary = groupBlockFor("Primary technologies");
    expect(within(primary).getByText("Laravel / PHP")).toBeInTheDocument();
    expect(within(primary).getByText("Node.js")).toBeInTheDocument();
    expect(within(primary).queryByText("Webhooks")).toBeNull();

    const experience = groupBlockFor("Experience building");
    expect(within(experience).getByText("Webhooks")).toBeInTheDocument();
    expect(within(experience).queryByText("Node.js")).toBeNull();
  });

  it("renders one item element per item and no extras", () => {
    render(<ExpertiseCard category={category} />);

    expect(itemsIn(groupBlockFor("Primary technologies"))).toEqual([
      "Laravel / PHP",
      "Node.js",
    ]);
    expect(itemsIn(groupBlockFor("Experience building"))).toEqual(["Webhooks"]);
  });

  it("renders a group that has a single item", () => {
    const single: ExpertiseCategory = {
      title: "AI Engineering",
      groups: [{ label: "Platforms", items: ["Claude"] }],
    };
    render(<ExpertiseCard category={single} />);

    expect(itemsIn(groupBlockFor("Platforms"))).toEqual(["Claude"]);
  });
});
