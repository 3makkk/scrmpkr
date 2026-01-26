import { expect, within } from "storybook/test";
import Card from "./Card";

export default {
  title: "DS/Card",
  component: Card,
};

export const Basic = {
  render: () => (
    <div className="p-6">
      <Card>
        <h3 className="text-white text-xl mb-2">Card Title</h3>
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
