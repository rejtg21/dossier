import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Eyebrow } from "@/components/eyebrow";

describe("Eyebrow", () => {
  it("renders its children", () => {
    render(<Eyebrow>Responsibilities</Eyebrow>);

    expect(screen.getByText("Responsibilities")).toBeInTheDocument();
  });

  it("uses the small size by default", () => {
    render(<Eyebrow>Stack</Eyebrow>);

    const eyebrow = screen.getByText("Stack");
    expect(eyebrow).toHaveClass("text-[12px]", "tracking-[0.06em]");
    expect(eyebrow).not.toHaveClass("text-[13px]");
  });

  it("uses the medium size when asked", () => {
    render(<Eyebrow size="md">Industries Experience</Eyebrow>);

    const eyebrow = screen.getByText("Industries Experience");
    expect(eyebrow).toHaveClass("text-[13px]", "tracking-[0.08em]");
    expect(eyebrow).not.toHaveClass("text-[12px]");
  });

  it("appends a caller class without dropping its own", () => {
    render(<Eyebrow className="mb-4">Stack</Eyebrow>);

    const eyebrow = screen.getByText("Stack");
    expect(eyebrow).toHaveClass("mb-4", "font-mono", "uppercase", "text-muted");
  });

  it("leaves no stray separator when no class is given", () => {
    render(<Eyebrow>Stack</Eyebrow>);

    const className = screen.getByText("Stack").getAttribute("class") ?? "";
    expect(className.trim()).toBe(className);
    expect(className).not.toMatch(/\s{2}/);
  });
});
