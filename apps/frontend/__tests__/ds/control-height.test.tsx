import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Button from "../../src/components/ds/Button/Button";
import Input from "../../src/components/ds/Input/Input";
import { controlHeight } from "../../src/components/ds/states";

describe("control height", () => {
  it("buttons and inputs share one height", () => {
    expect(renderToStaticMarkup(<Button>Go</Button>)).toContain(controlHeight);
    expect(
      renderToStaticMarkup(<Button variant="secondary">Go</Button>),
    ).toContain(controlHeight);
    expect(renderToStaticMarkup(<Input />)).toContain(controlHeight);
  });
});
