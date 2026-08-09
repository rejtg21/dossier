import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccentChip } from "@/components/accent-chip";

describe("AccentChip", () => {
  it("renders its children", () => {
    render(<AccentChip>Scalability needs</AccentChip>);

    expect(screen.getByText("Scalability needs")).toBeInTheDocument();
  });

  it("renders non-text children", () => {
    render(
      <AccentChip>
        <span>Nested</span>
      </AccentChip>,
    );

    expect(screen.getByText("Nested")).toBeInTheDocument();
  });

  it("renders as an accented outline chip", () => {
    render(<AccentChip>Clean code</AccentChip>);

    expect(screen.getByText("Clean code")).toHaveClass(
      "border",
      "border-accent/40",
      "text-accent",
    );
  });
});
