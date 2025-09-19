import type { Meta, StoryObj } from "@storybook/react-vite";
import BarVoteChart from "./BarVoteChart";

const meta: Meta<typeof BarVoteChart> = {
  title: "DS/BarVoteChart",
  component: BarVoteChart,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof BarVoteChart>;

export const MixedValues: Story = {
  render: () => (
    <BarVoteChart numberOfVoters={8}>
      <BarVoteChart.Row value={13}>
        <BarVoteChart.Name>Dana</BarVoteChart.Name>
        <BarVoteChart.Name>Eve</BarVoteChart.Name>
        <BarVoteChart.Name>Frank</BarVoteChart.Name>
      </BarVoteChart.Row>
      <BarVoteChart.Row value={8}>
        <BarVoteChart.Name>Alice</BarVoteChart.Name>
        <BarVoteChart.Name>Bob</BarVoteChart.Name>
      </BarVoteChart.Row>
      <BarVoteChart.Row value={5}>
        <BarVoteChart.Name>Charlie</BarVoteChart.Name>
      </BarVoteChart.Row>
      <BarVoteChart.Row value={3}>
        <BarVoteChart.Name>Grace</BarVoteChart.Name>
      </BarVoteChart.Row>
      <BarVoteChart.Row value="?">
        <BarVoteChart.Name>Pat</BarVoteChart.Name>
      </BarVoteChart.Row>
    </BarVoteChart>
  ),
};

export const GroupedCounts: Story = {
  render: () => (
    <BarVoteChart numberOfVoters={10}>
      <BarVoteChart.Row value={5}>
        <BarVoteChart.Name>A</BarVoteChart.Name>
        <BarVoteChart.Name>B</BarVoteChart.Name>
        <BarVoteChart.Name>C</BarVoteChart.Name>
        <BarVoteChart.Name>D</BarVoteChart.Name>
      </BarVoteChart.Row>
      <BarVoteChart.Row value={13}>
        <BarVoteChart.Name>H</BarVoteChart.Name>
        <BarVoteChart.Name>I</BarVoteChart.Name>
        <BarVoteChart.Name>J</BarVoteChart.Name>
      </BarVoteChart.Row>
      <BarVoteChart.Row value={3}>
        <BarVoteChart.Name>F</BarVoteChart.Name>
        <BarVoteChart.Name>G</BarVoteChart.Name>
      </BarVoteChart.Row>
      <BarVoteChart.Row value={8}>
        <BarVoteChart.Name>E</BarVoteChart.Name>
      </BarVoteChart.Row>
    </BarVoteChart>
  ),
};

export const Consensus: Story = {
  render: () => (
    <BarVoteChart numberOfVoters={4}>
      <BarVoteChart.Row value={5}>
        <BarVoteChart.Name>Alice</BarVoteChart.Name>
        <BarVoteChart.Name>Bob</BarVoteChart.Name>
        <BarVoteChart.Name>Charlie</BarVoteChart.Name>
        <BarVoteChart.Name>Dana</BarVoteChart.Name>
      </BarVoteChart.Row>
    </BarVoteChart>
  ),
};

export const WithUnknownsOnly: Story = {
  render: () => (
    <BarVoteChart numberOfVoters={3}>
      <BarVoteChart.Row value="?">
        <BarVoteChart.Name>X</BarVoteChart.Name>
        <BarVoteChart.Name>Y</BarVoteChart.Name>
        <BarVoteChart.Name>Z</BarVoteChart.Name>
      </BarVoteChart.Row>
    </BarVoteChart>
  ),
};

export const DenseNames: Story = {
  render: () => (
    <BarVoteChart numberOfVoters={15}>
      <BarVoteChart.Row value={8}>
        {[
          "Alex",
          "Bailey",
          "Casey",
          "Dakota",
          "Emerson",
          "Finley",
          "Gray",
          "Harper",
          "Indy",
          "Jules",
          "Kai",
          "Logan",
        ].map((n) => (
          <BarVoteChart.Name key={n}>{n}</BarVoteChart.Name>
        ))}
      </BarVoteChart.Row>
      <BarVoteChart.Row value={5}>
        <BarVoteChart.Name>Morgan</BarVoteChart.Name>
        <BarVoteChart.Name>Nico</BarVoteChart.Name>
      </BarVoteChart.Row>
      <BarVoteChart.Row value={3}>
        <BarVoteChart.Name>Quinn</BarVoteChart.Name>
      </BarVoteChart.Row>
    </BarVoteChart>
  ),
};

export const FullWidthBars: Story = {
  render: () => (
    <BarVoteChart numberOfVoters={7}>
      <BarVoteChart.Row value={13}>
        <BarVoteChart.Name>Alice</BarVoteChart.Name>
        <BarVoteChart.Name>Bob</BarVoteChart.Name>
        <BarVoteChart.Name>Charlie</BarVoteChart.Name>
      </BarVoteChart.Row>
      <BarVoteChart.Row value={8}>
        <BarVoteChart.Name>Dana</BarVoteChart.Name>
      </BarVoteChart.Row>
      <BarVoteChart.Row value={5}>
        <BarVoteChart.Name>Eve</BarVoteChart.Name>
        <BarVoteChart.Name>Frank</BarVoteChart.Name>
      </BarVoteChart.Row>
      <BarVoteChart.Row value="?">
        <BarVoteChart.Name>Grace</BarVoteChart.Name>
      </BarVoteChart.Row>
    </BarVoteChart>
  ),
};
