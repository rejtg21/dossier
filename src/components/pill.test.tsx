import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Pill } from "@/components/pill";

describe("Pill", () => {
  it("renders its children", () => {
    render(<Pill>Healthcare</Pill>);

    expect(screen.getByText("Healthcare")).toBeInTheDocument();
  });

  it("uses the default variant when none is given", () => {
    render(<Pill>Healthcare</Pill>);

    const pill = screen.getByText("Healthcare");
    expect(pill).toHaveClass("border-line", "text-item");
    expect(pill).not.toHaveClass("text-accent");
  });

  it("uses the accent variant when asked", () => {
    render(<Pill variant="accent">CTO</Pill>);

    const pill = screen.getByText("CTO");
    expect(pill).toHaveClass("border-accent/40", "text-accent", "font-mono");
    expect(pill).not.toHaveClass("border-line");
    expect(pill).not.toHaveClass("text-item");
  });

  it("keeps the rounded pill shape for every variant", () => {
    render(
      <>
        <Pill>Default</Pill>
        <Pill variant="accent">Accent</Pill>
      </>,
    );

    expect(screen.getByText("Default")).toHaveClass("rounded-full", "border");
    expect(screen.getByText("Accent")).toHaveClass("rounded-full", "border");
  });
});
