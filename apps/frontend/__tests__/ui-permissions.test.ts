import { describe, expect, it } from "vitest";
import {
  shouldShowSessionControls,
  shouldShowVotingControls,
} from "../src/utils/ui-permissions";

describe("Frontend UI Permission Utilities", () => {
  describe("UI Control Visibility", () => {
    it("should correctly show voting controls based on role", () => {
      expect(shouldShowVotingControls("participant")).toBe(true);
      expect(shouldShowVotingControls("visitor")).toBe(false);
    });

    it("should correctly show session controls based on role", () => {
      expect(shouldShowSessionControls("participant")).toBe(true);
      expect(shouldShowSessionControls("visitor")).toBe(false);
    });
  });
});
