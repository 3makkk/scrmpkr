import type { Meta, StoryObj } from "@storybook/react";
import BarVoteChart, { type BarVoteItem } from "./BarVoteChart";
import "../../index.css";

const meta: Meta<typeof BarVoteChart> = {
  title: "DS/BarVoteChart",
  component: BarVoteChart,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    sortBy: { control: { type: "radio" }, options: ["value", "count"] },
    order: { control: { type: "radio" }, options: ["asc", "desc"] },
  },
};

export default meta;
type Story = StoryObj<typeof BarVoteChart>;

const sample = (data: Array<[number | "?", string[]]>): BarVoteItem[] =>
  data.map(([value, names]) => ({ value, names }));

export const MixedValues: Story = {
  args: {
    items: sample([
      [8, ["Alice", "Bob"]],
      [5, ["Charlie"]],
      [13, ["Dana", "Eve", "Frank"]],
      ["?", ["Pat"]],
      [3, ["Grace"]],
    ]),
    sortBy: "value",
    order: "desc",
  },
};

export const GroupedCounts: Story = {
  args: {
    items: sample([
      [5, ["A", "B", "C", "D"]],
      [8, ["E"]],
      [3, ["F", "G"]],
      [13, ["H", "I", "J"]],
    ]),
    sortBy: "count",
    order: "desc",
  },
};

export const Consensus: Story = {
  args: {
    items: sample([[5, ["Alice", "Bob", "Charlie", "Dana"]]]),
    sortBy: "value",
    order: "desc",
  },
};

export const WithUnknownsOnly: Story = {
  args: {
    items: sample([["?", ["X", "Y", "Z"]]]),
  },
};

export const DenseNames: Story = {
  args: {
    items: sample([
      [8, [
        "Alex", "Bailey", "Casey", "Dakota", "Emerson", "Finley",
        "Gray", "Harper", "Indy", "Jules", "Kai", "Logan",
      ]],
      [5, ["Morgan", "Nico"]],
      [3, ["Quinn"]],
    ]),
  },
};

export const FullWidthBars: Story = {
  args: {
    items: sample([
      [13, ["Alice", "Bob", "Charlie"]],
      [8, ["Dana"]],
      [5, ["Eve", "Frank"]],
      ["?", ["Grace"]],
    ]),
    showCount: true,
  },
};
