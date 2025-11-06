import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radar, RadarDisplay, type RadarDisplayProps } from './Radar';
import { TelemetryDecorator } from '@irdashies/storybook';
import { CarLeftRight } from '@irdashies/types';

const statusEntries = Object.entries(CarLeftRight).filter(
  (entry): entry is [string, CarLeftRight] => typeof entry[1] === 'number'
);
const statusOptions = statusEntries.map(([, value]) => value);
const statusLabels = statusEntries.reduce<Record<string, string>>(
  (acc, [label, value]) => {
    acc[value.toString()] = label;
    return acc;
  },
  {}
);

const meta: Meta<typeof RadarDisplay> = {
  component: RadarDisplay,
  argTypes: {
    status: {
      control: { type: 'select', labels: statusLabels },
      options: statusOptions,
    },
  },
  args: {
    status: CarLeftRight.Clear,
  },
};

export default meta;

type Story = StoryObj<typeof RadarDisplay>;

export const Playground: Story = {
  render: (args: RadarDisplayProps) => (
    <div className="w-[180px]">
      <RadarDisplay {...args} />
    </div>
  ),
};

export const LiveTelemetry: Story = {
  render: () => (
    <div className="w-[180px]">
      <Radar />
    </div>
  ),
  decorators: [TelemetryDecorator()],
};
