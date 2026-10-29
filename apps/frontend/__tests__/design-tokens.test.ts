// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Guards the visual system (docs/DESIGN_PRINCIPLES.md): components use the
// design tokens from index.css instead of raw palette classes and one-off
// state styles.

const SRC = fileURLToPath(new URL("../src", import.meta.url));

const RULES: Record<string, RegExp> = {
  "raw-palette":
    /\b(bg|text|border|ring|from|via|to|shadow|outline|fill|stroke|placeholder|divide)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/g,
  "old-radius": /\brounded(-(sm|md|lg|xl|2xl|3xl))?\b(?!-)/g,
  "scale-hover": /(hover|active):-?scale-/g,
  "old-focus": /focus:(ring|outline-none)/g,
  weights: /font-(light|extrabold|black)/g,
  emoji: /[🗳🎬👁]/gu,
};

// Files not yet migrated to the tokens. Each migration task removes its files;
// the list must end up empty.
const PENDING: string[] = [
  "components/auth/AccountIndicator.tsx",
  "components/auth/LoginForm.tsx",
  "components/auth/UserInfoSection.tsx",
  "components/ds/Motion/Motion.tsx",
  "components/poker/results/VotingResults.tsx",
  "components/poker/voting/VotingDeck.tsx",
  "components/room/header/RoomContextBar.tsx",
  "pages/Home.tsx",
  "pages/Room.tsx",
];

function sourceFiles(): string[] {
  return (readdirSync(SRC, { recursive: true }) as string[])
    .filter((file) => /\.tsx?$/.test(file) && !file.endsWith(".stories.tsx"))
    .sort();
}

function violations(file: string): string[] {
  const source = readFileSync(join(SRC, file), "utf8");
  return Object.entries(RULES).flatMap(([rule, pattern]) =>
    [...source.matchAll(pattern)].map((match) => `${rule}: ${match[0]}`),
  );
}

describe("design tokens", () => {
  it("migrated files use design tokens only", () => {
    for (const file of sourceFiles().filter((f) => !PENDING.includes(f))) {
      expect(violations(file), file).toEqual([]);
    }
  });

  it("pending files are listed only while they still violate", () => {
    for (const file of PENDING) {
      expect(violations(file).length, file).toBeGreaterThan(0);
    }
  });

  it("index.css defines the token set", () => {
    const css = readFileSync(join(SRC, "index.css"), "utf8");
    for (const name of [
      "accent",
      "accent-hover",
      "accent-strong",
      "accent-soft",
      "focus",
      "success",
      "danger",
      "surface-page",
      "surface-raised",
      "surface-inset",
      "surface-hover",
      "line",
      "line-strong",
      "fg",
      "fg-muted",
    ]) {
      expect(css).toContain(`--color-${name}:`);
    }
    for (const radius of ["chip", "control", "card"]) {
      expect(css).toContain(`--radius-${radius}:`);
    }
    expect(css).not.toContain("--color-fg-subtle");
  });
});
