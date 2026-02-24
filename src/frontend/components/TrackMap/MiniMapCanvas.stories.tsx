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
    } as unknown as TrackDriver['driver'],
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
    } as unknown as TrackDriver['driver'],
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
    } as unknown as TrackDriver['driver'],
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
    } as unknown as TrackDriver['driver'],
    progress: 0.8526926636695862,
    isPlayer: false,
    classPosition: 4,
  },
];

type MiniMapStoryArgs = ComponentProps<typeof MiniMapCanvas> & {
  playerSpeedKph?: number;
  otherSpeedKph?: number;
  tickMs?: number;
};

const meta = {
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
    forwardDistanceMeters: 170,
    backwardDistanceMeters: 18,
    lateralFovMeters: 130,
    carAnchorY: 0.93,
    headingSampleDistanceMeters: 45,
    rotationSmoothing: 0.08,
    scaleSmoothing: 0.18,
    minHeadingDeltaDegrees: 1.0,
    tiltAmount: 0.97,
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
    tiltAmount: {
      control: { type: 'range', min: 0, max: 1.35, step: 0.01 },
      description:
        'Pseudo-3D perspective tilt (higher = stronger drive-nav effect).',
    },
    highlightColor: {
      control: { type: 'number' },
      description: 'RGB number (e.g. amber is 16096779).',
    },
  },
} satisfies Meta<MiniMapStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

const FovSizedPreview = (args: MiniMapStoryArgs, children: ReactNode) => {
  const lateral = Math.max(1, args.lateralFovMeters ?? 130);
  const depth = Math.max(
    1,
    (args.forwardDistanceMeters ?? 170) + (args.backwardDistanceMeters ?? 18)
  );
  const aspect = lateral / depth;
  const maxWidth = 560;
  const maxHeight = 420;
  const widthFromHeight = Math.round(maxHeight * aspect);
  const width = Math.max(220, Math.min(maxWidth, widthFromHeight));
  const height = Math.max(180, Math.round(width / aspect));
  const padding = 12;
  const tilt = Math.min(1.35, Math.max(0, args.tiltAmount ?? 0.97));
  const showTrapezoid = tilt > 0;
  const topInset = padding + (width * (0.06 + tilt * 0.08)) / 2;
  const bottomInset = padding;
  const strokeColor = 'rgba(56, 189, 248, 0.95)';
  const strokeWidth = 2;

  return (
    <div className="w-full flex items-center justify-center p-4 bg-gray-900">
      <div
        style={{ width: `${width}px`, height: `${height}px` }}
        className="relative"
      >
        {children}
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 pointer-events-none"
        >
          {showTrapezoid ? (
            <polygon
              points={`${topInset},${padding} ${width - topInset},${padding} ${width - bottomInset},${height - padding} ${bottomInset},${height - padding}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray="6 4"
            />
          ) : (
            <rect
              x={padding}
              y={padding}
              width={Math.max(1, width - padding * 2)}
              height={Math.max(1, height - padding * 2)}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray="6 4"
            />
          )}
        </svg>
      </div>
    </div>
  );
};

export const Primary: Story = {
  render: (args) => FovSizedPreview(args, <MiniMapCanvas {...args} />),
};

export const CirclingAround: Story = {
  argTypes: {
    playerSpeedKph: {
      control: { type: 'range', min: 20, max: 350, step: 1 },
      description: 'Player speed in km/h (150 = 25 km in 10 min).',
    },
    otherSpeedKph: {
      control: { type: 'range', min: 20, max: 350, step: 1 },
      description: 'Other cars speed in km/h.',
    },
    tickMs: {
      control: { type: 'range', min: 16, max: 200, step: 1 },
      description: 'Animation update interval in milliseconds.',
    },
  },
  render: (args) => {
    const [drivers, setDrivers] = useState<TrackDriver[]>(
      args.drivers ?? sampleDrivers
    );
    const tickMs = Math.max(1, args.tickMs ?? 50);
    const trackLengthMeters = Math.max(
      1,
      args.trackDrawing?.active?.totalLength ??
        trackDrawing.active.totalLength ??
        1
    );
    const playerSpeedMps = Math.max(0, args.playerSpeedKph ?? 150) / 3.6;
    const otherSpeedMps = Math.max(0, args.otherSpeedKph ?? 145) / 3.6;
    const playerSpeedPerTick =
      (playerSpeedMps * tickMs) / 1000 / trackLengthMeters;
    const otherSpeedPerTick =
      (otherSpeedMps * tickMs) / 1000 / trackLengthMeters;

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
      }, tickMs);

      return () => clearInterval(interval);
    }, [playerSpeedPerTick, otherSpeedPerTick, tickMs]);

    return FovSizedPreview(args, <MiniMapCanvas {...args} drivers={drivers} />);
  },
  args: {
    playerSpeedKph: 150,
    otherSpeedKph: 145,
    tickMs: 50,
    trackLineWidth: 30,
    trackOutlineWidth: 40,
    forwardDistanceMeters: 170,
    backwardDistanceMeters: 18,
    lateralFovMeters: 130,
    carAnchorY: 0.93,
    tiltAmount: 0.97,
  },
};
