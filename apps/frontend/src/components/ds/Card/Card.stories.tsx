import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import Card from "./Card";

const meta: Meta<typeof Card> = {
  title: "DS/Card",
  component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <div className="p-6">
      <Card>
        <h3 className="mb-2 text-white text-xl">Card Title</h3>
        <p className="text-white/70">This is card content.</p>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByText("Card Title");
    const content = canvas.getByText("This is card content.");

    await expect(title).toBeInTheDocument();
    await expect(content).toBeInTheDocument();
  },
};
