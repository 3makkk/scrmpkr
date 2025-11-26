import type { Meta, StoryObj } from "@storybook/react-vite";
import PokerCard from "./PokerCard";

const meta: Meta<typeof PokerCard> = {
  title: "DS/PokerCard",
  component: PokerCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    value: {
      control: "select",
      options: [0, 1, 2, 3, 5, 8, 13, 21, "?"],
    },
    isSelected: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof PokerCard>;

export const Basic: Story = {
  args: {
    value: 5,
    onValueClick: (value) => console.log(`Clicked card with value: ${value}`),
  },
};

export const Selected: Story = {
  args: {
    value: 8,
    isSelected: true,
    onValueClick: (value) => console.log(`Clicked card with value: ${value}`),
  },
};

export const Disabled: Story = {
  args: {
    value: 13,
    disabled: true,
    onValueClick: (value) => console.log(`Clicked card with value: ${value}`),
  },
};

export const Unknown: Story = {
  args: {
    value: "?",
    onValueClick: (value) => console.log(`Clicked card with value: ${value}`),
  },
};

export const FibonacciSequence: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4 p-4" style={{ width: "400px" }}>
      {[1, 2, 3, 5, 8, 13, 21, "?"].map((value, index) => (
        <PokerCard
          key={value}
          value={value as number | "?"}
          onValueClick={(v) => console.log(`Clicked card with value: ${v}`)}
          isSelected={index === 2} // Select the third card
        />
      ))}
    </div>
  ),
};

export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 p-4" style={{ width: "300px" }}>
      <PokerCard value={5} onValueClick={(v) => console.log(`Normal: ${v}`)} />
      <PokerCard
        value={8}
        isSelected
        onValueClick={(v) => console.log(`Selected: ${v}`)}
      />
      <PokerCard
        value={13}
        disabled
        onValueClick={(v) => console.log(`Disabled: ${v}`)}
      />
    </div>
  ),
};
