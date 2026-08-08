import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Chip } from "@/components/chip";

const ALL_SIZE_CLASSES = ["text-[13px]", "text-[13.5px]", "text-[14px]"];

function sizeClassesOf(element: HTMLElement): string[] {
  return ALL_SIZE_CLASSES.filter((className) =>
    element.classList.contains(className),
  );
}

describe("Chip", () => {
  it("renders its children", () => {
    render(<Chip>PostgreSQL</Chip>);

    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });

  it("renders non-text children", () => {
    render(
      <Chip>
        <span>Nested</span>
      </Chip>,
    );

    expect(screen.getByText("Nested")).toBeInTheDocument();
  });

  it("uses the 13.5px size by default", () => {
    render(<Chip>Redis</Chip>);

    expect(sizeClassesOf(screen.getByText("Redis"))).toEqual(["text-[13.5px]"]);
  });

  it.each([["13"], ["13.5"], ["14"]] as const)(
    "applies exactly the %s size class when asked",
    (size) => {
      render(<Chip size={size}>Redis</Chip>);

      expect(sizeClassesOf(screen.getByText("Redis"))).toEqual([
        `text-[${size}px]`,
      ]);
    },
  );

  it("keeps the shared chip surface across sizes", () => {
    render(<Chip size="14">Redis</Chip>);

    expect(screen.getByText("Redis")).toHaveClass("bg-surface", "text-item");
  });
});
