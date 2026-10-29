import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RoleOptionCard from "../../src/components/auth/RoleOptionCard";
import { ROLE_OPTIONS } from "../../src/components/auth/roleOptions";

const cardHtml = (props: { selected: boolean; disabled?: boolean }) =>
  renderToStaticMarkup(
    <RoleOptionCard
      option={ROLE_OPTIONS[0]}
      onSelect={() => {}}
      testid="role-option"
      {...props}
    />,
  );

describe("RoleOptionCard", () => {
  it("selected option uses the shared selected look", () => {
    expect(cardHtml({ selected: true })).toContain("bg-accent-soft");
  });

  it("current role (selected + disabled) stays at full opacity", () => {
    const markup = cardHtml({ selected: true, disabled: true });
    expect(markup).not.toContain("opacity-50");
    expect(markup).toContain("bg-accent-soft");
  });

  it("renders a line icon, not emoji", () => {
    expect(cardHtml({ selected: false })).toContain("<svg");
  });
});
