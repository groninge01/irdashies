import { useTelemetryValue } from '@irdashies/context';
import { CarLeftRight } from '@irdashies/types';

const normalizeStatus = (status?: number): CarLeftRight => {
  if (
    typeof status === 'number' &&
    status >= CarLeftRight.Off &&
    status <= CarLeftRight.Cars2Right
  ) {
    return status as CarLeftRight;
  }

  return CarLeftRight.Off;
};

const getLaneCounts = (
  status: CarLeftRight
): { left: number; right: number } => {
  switch (status) {
    case CarLeftRight.CarLeft:
      return { left: 1, right: 0 };
    case CarLeftRight.CarRight:
      return { left: 0, right: 1 };
    case CarLeftRight.CarLeftRight:
      return { left: 1, right: 1 };
    case CarLeftRight.Cars2Left:
      return { left: 2, right: 0 };
    case CarLeftRight.Cars2Right:
      return { left: 0, right: 2 };
    default:
      return { left: 0, right: 0 };
  }
};

const MAX_LANE_SLOTS = 2;

const RadarLane = ({
  align,
  count,
}: {
  align: 'left' | 'right';
  count: number;
}) => {
  const directionClass =
    align === 'left'
      ? 'flex-row-reverse justify-start'
      : 'flex-row justify-start';
  const cars = Array.from({ length: count }, (_, index) => (
    <div
      key={`${align}-${index}`}
      className="h-8 w-6 rounded-sm bg-orange-500"
      aria-label="Other car"
    />
  ));
  const placeholders = Array.from({ length: Math.max(0, MAX_LANE_SLOTS - count) }, (_, index) => (
    <div
      key={`${align}-placeholder-${index}`}
      className="h-8 w-6 rounded-sm opacity-0"
      aria-hidden
    />
  ));

  return (
    <div className={`flex h-10 w-20 shrink-0 items-center gap-1 ${directionClass}`}>
      {cars.concat(placeholders)}
    </div>
  );
};

export interface RadarDisplayProps {
  status?: CarLeftRight;
  className?: string;
}

export const RadarDisplay = ({
  status = CarLeftRight.Off,
  className,
}: RadarDisplayProps) => {
  const { left, right } = getLaneCounts(status);

  return (
    <div
      className={`inline-flex flex-col items-center gap-2 rounded-sm bg-slate-800/60 p-3 text-slate-100 ${
        className ?? ''
      }`}
    >
      <div className="flex w-full items-center justify-center gap-6">
        <RadarLane align="left" count={left} />
        <div className="flex items-center justify-center">
          <div
            className="h-10 w-6 rounded-sm bg-yellow-400"
            aria-label="Your car"
          />
        </div>
        <RadarLane align="right" count={right} />
      </div>
    </div>
  );
};

export interface RadarProps {
  className?: string;
}

export const Radar = ({ className }: RadarProps) => {
  const telemetryValue = useTelemetryValue<number>('CarLeftRight');
  const status = normalizeStatus(telemetryValue);

  return <RadarDisplay status={status} className={className} />;
};
