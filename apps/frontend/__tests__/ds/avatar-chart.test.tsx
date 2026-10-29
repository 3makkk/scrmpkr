import { UserRole } from "@scrmpkr/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BarVoteChart from "../../src/components/ds/BarVoteChart/BarVoteChart";
import UserAvatar from "../../src/components/ds/UserAvatar/UserAvatar";

const avatar = (role: UserRole) =>
  renderToStaticMarkup(<UserAvatar name="Ann Lee" role={role} />);

const row = (value: number | "?") =>
  renderToStaticMarkup(
    <BarVoteChart numberOfVoters={2}>
      <BarVoteChart.Row value={value}>
        <BarVoteChart.Name>Ann</BarVoteChart.Name>
      </BarVoteChart.Row>
    </BarVoteChart>,
  );

describe("UserAvatar", () => {
  it("looks the same for every role", () => {
    expect(avatar(UserRole.PARTICIPANT)).toBe(avatar(UserRole.FACILITATOR));
    expect(avatar(UserRole.PARTICIPANT)).toBe(avatar(UserRole.VISITOR));
  });
});

describe("BarVoteChart", () => {
  it("numeric bars are accent, the unknown bar is neutral", () => {
    expect(row(5)).toContain("bg-accent");
    expect(row("?")).not.toContain("bg-accent");
    expect(row("?")).toContain("bg-fg-muted");
  });
});
