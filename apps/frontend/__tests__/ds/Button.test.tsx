import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Button from "../../src/components/ds/Button/Button";

type Variant = "primary" | "secondary" | "tertiary" | "danger";

const html = (props: { variant?: Variant }) =>
  renderToStaticMarkup(<Button {...props}>Label</Button>);

describe("Button", () => {
  it("primary is solid accent", () => {
    expect(html({ variant: "primary" })).toMatch(
      /bg-accent\b.*hover:bg-accent-hover/,
    );
  });

  it("secondary is an outline without fill", () => {
    const markup = html({ variant: "secondary" });
    expect(markup).toContain("border-line-strong");
    expect(markup).toContain("bg-transparent");
    expect(markup).not.toMatch(/bg-accent\b/);
  });

  it("tertiary has no border and muted text", () => {
    const markup = html({ variant: "tertiary" });
    expect(markup).toContain("text-fg-muted");
    expect(markup).toContain("hover:text-fg");
    expect(markup).not.toContain("border-line");
  });

  it("danger is a red outline", () => {
    expect(html({ variant: "danger" })).toMatch(/border-danger.*text-danger/);
  });

  it("no variant scales or casts a shadow, all share the focus ring", () => {
    for (const variant of [
      "primary",
      "secondary",
      "tertiary",
      "danger",
    ] as const) {
      const markup = html({ variant });
      expect(markup).not.toMatch(/scale-|shadow/);
      expect(markup).toContain("focus-visible:outline-2");
    }
  });
});
