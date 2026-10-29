import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PokerCard from "../../src/components/ds/PokerCard/PokerCard";

const card = (props: { value: number | "?"; isSelected?: boolean }) =>
  renderToStaticMarkup(<PokerCard {...props} onValueClick={() => {}} />);

describe("PokerCard", () => {
  it("selected card lifts with the shared selected look, no scale or glow", () => {
    const markup = card({ value: 5, isSelected: true });
    expect(markup).toContain("border-accent-strong");
    expect(markup).toContain("bg-accent-soft");
    expect(markup).toContain("-translate-y-2");
    expect(markup).not.toMatch(/scale-|shadow-\[/);
  });

  it("selected card drops the grey gradient so the accent wash shows", () => {
    const button = card({ value: 5, isSelected: true }).match(
      /<button[^>]*>/,
    )?.[0];
    expect(button).not.toContain("bg-linear-to-br");
  });

  it("all values share one face colour", () => {
    const classesOf = (value: number | "?") =>
      [...card({ value }).matchAll(/class="([^"]*)"/g)].map(
        (match) => match[1],
      );
    expect(classesOf(1)).toEqual(classesOf(8));
  });

  it("keeps the playing-card face", () => {
    const markup = card({ value: 3 });
    expect(markup).toContain("❖");
    expect(markup.match(/>3</g)?.length).toBe(3);
  });
});
