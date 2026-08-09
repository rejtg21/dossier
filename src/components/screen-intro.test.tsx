import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScreenIntro } from "@/components/screen-intro";

describe("ScreenIntro", () => {
  it("renders the title as the page heading", () => {
    render(<ScreenIntro title="Expertise" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Expertise" }),
    ).toBeInTheDocument();
  });

  it("renders the subtitle when one is given", () => {
    render(<ScreenIntro title="Projects" subtitle="Case studies." />);

    expect(screen.getByText("Case studies.")).toBeInTheDocument();
  });

  it("renders no subtitle paragraph when subtitle is omitted", () => {
    const { container } = render(<ScreenIntro title="Contact" />);

    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("renders no subtitle paragraph for an empty subtitle", () => {
    const { container } = render(<ScreenIntro title="Contact" subtitle="" />);

    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("applies the default heading spacing", () => {
    render(<ScreenIntro title="Leadership" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("mb-2");
  });

  it("lets the caller override the heading spacing", () => {
    render(<ScreenIntro title="Leadership" titleClassName="mb-12" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("mb-12");
    expect(heading).not.toHaveClass("mb-2");
  });

  it("keeps the shared heading type scale alongside an override", () => {
    render(<ScreenIntro title="Leadership" titleClassName="mb-12" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveClass(
      "font-display",
      "font-semibold",
    );
  });

  it("applies the default subtitle styling", () => {
    render(<ScreenIntro title="Philosophy" subtitle="How I work." />);

    expect(screen.getByText("How I work.")).toHaveClass("text-muted");
  });

  it("lets the caller override the subtitle styling", () => {
    render(
      <ScreenIntro
        title="Philosophy"
        subtitle="How I work."
        subtitleClassName="text-[19px]"
      />,
    );

    const subtitle = screen.getByText("How I work.");
    expect(subtitle).toHaveClass("text-[19px]");
    expect(subtitle).not.toHaveClass("text-muted");
  });

  it("applies a wrapper class when given, and none by default", () => {
    const { container: withClass } = render(
      <ScreenIntro title="A" className="mb-10" />,
    );
    expect(withClass.firstElementChild).toHaveClass("mb-10");

    const { container: withoutClass } = render(<ScreenIntro title="B" />);
    expect(withoutClass.firstElementChild).toHaveAttribute("class", "");
  });
});
