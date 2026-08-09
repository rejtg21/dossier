import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BulletList } from "@/components/bullet-list";

const items = ["Architecture decisions", "Code reviews", "Sprint planning"];

describe("BulletList", () => {
  it("renders one list item per item, in order", () => {
    render(<BulletList items={items} />);

    const rendered = screen
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(rendered).toHaveLength(3);
    for (const [index, item] of items.entries()) {
      expect(rendered[index]).toContain(item);
    }
  });

  it("renders a list element even when there are no items", () => {
    render(<BulletList items={[]} />);

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("hides the decorative bullet marker from assistive tech", () => {
    render(<BulletList items={["Code reviews"]} />);

    const marker = screen.getByRole("listitem").firstElementChild;
    expect(marker).toHaveTextContent("›");
    expect(marker).toHaveAttribute("aria-hidden", "true");
  });

  it("does not announce the marker as part of the item", () => {
    render(<BulletList items={["Code reviews"]} />);

    const item = screen.getByRole("listitem");

    // Strip aria-hidden nodes the way assistive tech does, then compare.
    const announced = item.cloneNode(true) as HTMLElement;
    announced
      .querySelectorAll("[aria-hidden='true']")
      .forEach((node) => node.remove());

    expect(announced.textContent?.trim()).toBe("Code reviews");
    expect(item.textContent).toContain("›");
  });

  it("uses the 15px size by default", () => {
    render(<BulletList items={["Code reviews"]} />);

    const item = screen.getByRole("listitem");
    expect(item).toHaveClass("text-[15px]");
    expect(item).not.toHaveClass("text-[14.5px]");
  });

  it("uses the 14.5px size when asked", () => {
    render(<BulletList items={["Code reviews"]} size="14.5" />);

    const item = screen.getByRole("listitem");
    expect(item).toHaveClass("text-[14.5px]");
    expect(item).not.toHaveClass("text-[15px]");
  });

  it("uses the stacked layout by default", () => {
    render(<BulletList items={items} />);

    expect(screen.getByRole("list")).toHaveClass("flex", "flex-col", "gap-2");
  });

  it("lets the caller replace the layout classes", () => {
    render(<BulletList items={items} className="grid grid-cols-2" />);

    const list = screen.getByRole("list");
    expect(list).toHaveClass("grid", "grid-cols-2");
    expect(list).not.toHaveClass("flex-col");
  });
});
