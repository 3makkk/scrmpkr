import { UserRole } from "@scrmpkr/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ParticipantRow, {
  type RowStatus,
} from "../../src/components/room/status/ParticipantRow";

const row = (
  props: { status?: RowStatus; isYou?: boolean; displayName?: string } = {},
) =>
  renderToStaticMarkup(
    <ParticipantRow
      name="Anna"
      displayName={props.displayName ?? "Anna"}
      role={UserRole.PARTICIPANT}
      isYou={props.isYou ?? false}
      status={props.status ?? { kind: "thinking" }}
      nameTestId="participant-name-Anna"
    />,
  );

describe("ParticipantRow", () => {
  it("voted shows a green check and the word", () => {
    const markup = row({ status: { kind: "voted" } });
    expect(markup).toContain("text-success");
    expect(markup).toContain("voted");
    expect(markup).toContain("<svg");
  });

  it("revealed without a vote shows a neutral dash chip", () => {
    expect(row({ status: { kind: "revealed", value: null } })).toMatch(
      /rounded-chip[^>]*>—</,
    );
  });

  it("you are highlighted in grey, not accent", () => {
    const markup = row({ isYou: true });
    expect(markup).toContain("bg-surface-hover");
    expect(markup).not.toContain("accent");
  });

  it("long names truncate", () => {
    expect(row({ displayName: "x".repeat(50) })).toMatch(
      /min-w-0[^"]*truncate|truncate[^"]*min-w-0/,
    );
  });
});
