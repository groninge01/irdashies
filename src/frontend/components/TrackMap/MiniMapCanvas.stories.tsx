import { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import tracks from './tracks/tracks.json';
import { MiniMapCanvas } from './MiniMapCanvas';
import { TrackDrawing, TrackDriver } from './TrackCanvas';

const trackDrawing = (tracks as unknown as Record<string, TrackDrawing>)['249'];

const sampleDrivers: TrackDriver[] = [
  {
    driver: {
      CarIdx: 24,
      CarNumber: '24',
      CarClassID: 2,
      CarClassColor: 16734344,
      CarClassEstLapTime: 126.9374,
    },
    progress: 0.9262315034866333,
    isPlayer: true,
    classPosition: 1,
  },
  {
    driver: {
      CarIdx: 9,
      CarNumber: '38',
      CarClassID: 1,
      CarClassColor: 16767577,
      CarClassEstLapTime: 113.6302,
    },
    progress: 0.936923086643219,
    isPlayer: false,
    classPosition: 3,
  },
  {
    driver: {
      CarIdx: 10,
      CarNumber: '39',
      CarClassID: 1,
      CarClassColor: 16767577,
      CarClassEstLapTime: 113.6302,
    },
    progress: 0.06046311929821968,
    isPlayer: false,
    classPosition: 2,
  },
  {
    driver: {
      CarIdx: 36,
      CarNumber: '16',
      CarClassID: 3,
      CarClassColor: 11430911,
      CarClassEstLapTime: 126.2284,
    },
    progress: 0.8526926636695862,
    isPlayer: false,
    classPosition: 4,
  },
];

export default {
  component: MiniMapCanvas,
  title: 'widgets/TrackMap/components/MiniMapCanvas',
  args: {
    trackDrawing,
    drivers: sampleDrivers,
    showCarNumbers: true,
    displayMode: 'carNumber',
    driverCircleSize: 40,
    playerCircleSize: 40,
    trackLineWidth: 20,
    trackOutlineWidth: 40,
    invertTrackColors: false,
    forwardDistanceMeters: 250,
    backwardDistanceMeters: 100,
    lateralFovMeters: 140,
    carAnchorY: 0.78,
    headingSampleDistanceMeters: 45,
    rotationSmoothing: 0.08,
    scaleSmoothing: 0.18,
    minHeadingDeltaDegrees: 1.0,
    fovShape: 'circle',
  },
  argTypes: {
    showCarNumbers: { control: { type: 'boolean' } },
    displayMode: {
      control: { type: 'select' },
      options: ['carNumber', 'sessionPosition'],
    },
    invertTrackColors: { control: { type: 'boolean' } },
    driverCircleSize: {
      control: { type: 'range', min: 10, max: 100, step: 1 },
    },
    playerCircleSize: {
      control: { type: 'range', min: 10, max: 100, step: 1 },
    },
    trackLineWidth: { control: { type: 'range', min: 5, max: 100, step: 1 } },
    trackOutlineWidth: {
      control: { type: 'range', min: 5, max: 150, step: 1 },
    },
    forwardDistanceMeters: {
      control: { type: 'range', min: 100, max: 1200, step: 25 },
    },
    backwardDistanceMeters: {
      control: { type: 'range', min: 0, max: 300, step: 10 },
    },
    lateralFovMeters: {
      control: { type: 'range', min: 60, max: 400, step: 10 },
      description:
        'Horizontal field of view in meters (smaller = narrower view).',
    },
    carAnchorY: { control: { type: 'range', min: 0.5, max: 0.95, step: 0.01 } },
    headingSampleDistanceMeters: {
      control: { type: 'range', min: 5, max: 80, step: 1 },
      description: 'Distance used to estimate heading around the player.',
    },
    rotationSmoothing: {
      control: { type: 'range', min: 0.01, max: 1, step: 0.01 },
      description: 'Lower = less twitchy, higher = more responsive.',
    },
    scaleSmoothing: {
      control: { type: 'range', min: 0.01, max: 1, step: 0.01 },
      description: 'Lower = less zoom pumping, higher = faster zoom updates.',
    },
    minHeadingDeltaDegrees: {
      control: { type: 'range', min: 0, max: 5, step: 0.1 },
      description: 'Ignore tiny heading changes to reduce visible jitter.',
    },
    fovShape: {
      control: { type: 'inline-radio' },
      options: ['circle', 'rectangle'],
    },
    highlightColor: {
      control: { type: 'number' },
      description: 'RGB number (e.g. amber is 16096779).',
    },
  },
} as Meta<typeof MiniMapCanvas>;

type Story = StoryObj<typeof MiniMapCanvas>;

const FovSizedPreview = (
  args: ComponentProps<typeof MiniMapCanvas>,
  children: ReactNode
) => {
  const lateral = Math.max(1, args.lateralFovMeters ?? 140);
  const depth = Math.max(
    1,
    (args.forwardDistanceMeters ?? 250) + (args.backwardDistanceMeters ?? 100)
  );
  const isCircle = (args.fovShape ?? 'circle') === 'circle';
  const aspect = lateral / depth;
  const maxWidth = 560;
  const maxHeight = 420;
  const widthFromHeight = isCircle ? maxHeight : Math.round(maxHeight * aspect);
  const width = Math.max(220, Math.min(maxWidth, widthFromHeight));
  const height = isCircle ? width : Math.max(180, Math.round(width / aspect));

  return (
    <div className="w-full flex items-center justify-center p-4 bg-gray-900">
      <div style={{ width: `${width}px`, height: `${height}px` }}>
        {children}
      </div>
    </div>
  );
};

export const Primary: Story = {
  render: (args) => FovSizedPreview(args, <MiniMapCanvas {...args} />),
};

export const CirclingAround: Story = {
  argTypes: {
    playerSpeedPerTick: {
      control: { type: 'range', min: 0.0001, max: 0.005, step: 0.0001 },
      description: 'Progress increment every 50ms for the player car.',
    },
    otherSpeedPerTick: {
      control: { type: 'range', min: 0.0001, max: 0.005, step: 0.0001 },
      description: 'Progress increment every 50ms for non-player cars.',
    },
  },
  render: (args) => {
    const [drivers, setDrivers] = useState<TrackDriver[]>(
      args.drivers ?? sampleDrivers
    );
    const playerSpeedPerTick = args.playerSpeedPerTick ?? 0.0009;
    const otherSpeedPerTick = args.otherSpeedPerTick ?? 0.0006;

    useEffect(() => {
      const interval = setInterval(() => {
        setDrivers((prevDrivers) =>
          prevDrivers.map((driver) => ({
            ...driver,
            progress:
              (driver.progress +
                (driver.isPlayer ? playerSpeedPerTick : otherSpeedPerTick)) %
              1,
          }))
        );
      }, 50);

      return () => clearInterval(interval);
    }, [playerSpeedPerTick, otherSpeedPerTick]);

    return FovSizedPreview(args, <MiniMapCanvas {...args} drivers={drivers} />);
  },
  args: {
    playerSpeedPerTick: 0.0009,
    otherSpeedPerTick: 0.0006,
    trackLineWidth: 30,
    trackOutlineWidth: 40,
    forwardDistanceMeters: 150,
    backwardDistanceMeters: 50,
    lateralFovMeters: 100,
    fovShape: 'circle',
  },
};
