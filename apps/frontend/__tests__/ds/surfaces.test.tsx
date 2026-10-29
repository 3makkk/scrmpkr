import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Badge from "../../src/components/ds/Badge/Badge";
import Card from "../../src/components/ds/Card/Card";
import Input from "../../src/components/ds/Input/Input";

const render = (element: ReactElement) => renderToStaticMarkup(element);

describe("DS surfaces", () => {
  it("Card is a raised surface", () => {
    expect(render(<Card />)).toMatch(
      /rounded-card.*border-line.*bg-surface-raised/,
    );
  });

  it("Input is inset with the shared focus ring", () => {
    const markup = render(<Input />);
    expect(markup).toContain("bg-surface-inset");
    expect(markup).toContain("rounded-control");
    expect(markup).toContain("focus-visible:outline-2");
  });

  it("Badge uses the chip radius", () => {
    expect(render(<Badge>1</Badge>)).toContain("rounded-chip");
  });
});
