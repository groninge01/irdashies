import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { TrackDriver, TrackDrawing } from './TrackCanvas';
import { getColor, getTailwindStyle } from '@irdashies/utils/colors';
import { useDriverOffTrack } from './hooks/useDriverOffTrack';

export interface MiniMapSvgProps {
  trackDrawing: TrackDrawing;
  drivers: TrackDriver[];
  highlightColor?: number;
  showCarNumbers?: boolean;
  displayMode?: 'carNumber' | 'sessionPosition' | 'livePosition';
  driverCircleSize?: number;
  playerCircleSize?: number;
  trackLineWidth?: number;
  trackOutlineWidth?: number;
  invertTrackColors?: boolean;
  forwardDistanceMeters?: number;
  backwardDistanceMeters?: number;
  lateralFovMeters?: number;
  carAnchorY?: number;
  headingSampleDistanceMeters?: number;
  rotationSmoothing?: number;
  scaleSmoothing?: number;
  minHeadingDeltaDegrees?: number;
  tiltAmount?: number;
  // Storybook-only animation controls (ignored by renderer).
  playerSpeedKph?: number;
  otherSpeedKph?: number;
  tickMs?: number;
}

type PositionedDriver = TrackDriver & {
  position: { x: number; y: number };
  length: number;
};

const mod = (value: number, total: number) => {
  if (total === 0) return 0;
  return ((value % total) + total) % total;
};

const getPointAtLength = (
  trackPathPoints: { x: number; y: number }[],
  totalLength: number,
  length: number
) => {
  if (!trackPathPoints.length) return { x: 0, y: 0 };
  if (trackPathPoints.length === 1 || totalLength <= 0)
    return trackPathPoints[0];

  const clampedLength = mod(length, totalLength);
  const pointPosition =
    (clampedLength / totalLength) * (trackPathPoints.length - 1);
  const pointIndex = Math.floor(pointPosition);
  const nextIndex = Math.min(pointIndex + 1, trackPathPoints.length - 1);
  const t = pointPosition - pointIndex;
  const a = trackPathPoints[pointIndex];
  const b = trackPathPoints[nextIndex];

  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
};

export const MiniMapSvg = ({
  trackDrawing,
  drivers,
  highlightColor,
  showCarNumbers = true,
  displayMode = 'carNumber',
  driverCircleSize = 40,
  playerCircleSize = 40,
  trackLineWidth = 20,
  trackOutlineWidth = 40,
  invertTrackColors = false,
  forwardDistanceMeters = 170,
  backwardDistanceMeters = 18,
  lateralFovMeters = 130,
  carAnchorY = 0.93,
  headingSampleDistanceMeters = 45,
  minHeadingDeltaDegrees = 1.0,
  tiltAmount = 0.97,
}: MiniMapSvgProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const driversOffTrack = useDriverOffTrack();
  const clipId = useId().replace(/:/g, '_');

  const driverColors = useMemo(() => {
    const isMultiClass =
      new Set(drivers.map((d) => d.driver.CarClassID)).size > 1;
    const colors: Record<number, { fill: string; text: string }> = {};
    drivers.forEach(({ driver, isPlayer }) => {
      if (isPlayer) {
        if (highlightColor !== undefined) {
          colors[driver.CarIdx] = {
            fill: `#${highlightColor.toString(16).padStart(6, '0')}`,
            text: 'white',
          };
        } else {
          colors[driver.CarIdx] = { fill: getColor('amber'), text: 'white' };
        }
      } else {
        const style = getTailwindStyle(
          driver.CarClassColor,
          undefined,
          isMultiClass
        );
        colors[driver.CarIdx] = { fill: style.canvasFill, text: 'white' };
      }
    });
    return colors;
  }, [drivers, highlightColor]);

  const positionedDrivers = useMemo<PositionedDriver[]>(() => {
    if (
      !trackDrawing?.active?.trackPathPoints ||
      !trackDrawing?.active?.totalLength ||
      !trackDrawing?.startFinish?.point?.length
    ) {
      return [];
    }

    const trackPathPoints = trackDrawing.active.trackPathPoints;
    const totalLength = trackDrawing.active.totalLength;
    const intersectionLength = trackDrawing.startFinish.point.length;
    const direction = trackDrawing.startFinish.direction;

    return drivers.map((entry) => {
      const adjustedLength = mod(totalLength * entry.progress, totalLength);
      const length =
        direction === 'anticlockwise'
          ? mod(intersectionLength + adjustedLength, totalLength)
          : mod(intersectionLength - adjustedLength, totalLength);

      return {
        ...entry,
        position: getPointAtLength(trackPathPoints, totalLength, length),
        length,
      };
    });
  }, [drivers, trackDrawing]);

  const player = useMemo(
    () => positionedDrivers.find((driver) => driver.isPlayer) ?? null,
    [positionedDrivers]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener('resize', resize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  const geometry = useMemo(() => {
    if (
      !player ||
      size.width <= 0 ||
      size.height <= 0 ||
      !trackDrawing?.active?.trackPathPoints ||
      !trackDrawing?.active?.totalLength ||
      !trackDrawing?.startFinish?.direction
    ) {
      return null;
    }

    const totalLength = trackDrawing.active.totalLength;
    const trackPathPoints = trackDrawing.active.trackPathPoints;
    const travelSign =
      trackDrawing.startFinish.direction === 'anticlockwise' ? 1 : -1;
    const clampedTilt = Math.min(1.35, Math.max(0, tiltAmount));
    const effectiveForwardDistance = Math.max(1, forwardDistanceMeters);
    const effectiveBackwardDistance = Math.max(0, backwardDistanceMeters);
    const effectiveLateralFov = Math.max(1, lateralFovMeters);

    const lookAheadPoint = getPointAtLength(
      trackPathPoints,
      totalLength,
      player.length + headingSampleDistanceMeters * travelSign
    );
    const lookBehindPoint = getPointAtLength(
      trackPathPoints,
      totalLength,
      player.length - headingSampleDistanceMeters * travelSign
    );

    const headingX = lookAheadPoint.x - lookBehindPoint.x;
    const headingY = lookAheadPoint.y - lookBehindPoint.y;
    const headingAngle = Math.atan2(headingY, headingX);
    const rawRotation = -Math.PI / 2 - headingAngle;
    const minStepRad = Math.max(0, (minHeadingDeltaDegrees * Math.PI) / 180);
    const rotation =
      minStepRad > 0
        ? Math.round(rawRotation / minStepRad) * minStepRad
        : rawRotation;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    const rotateAroundPlayer = (point: { x: number; y: number }) => {
      const dx = point.x - player.position.x;
      const dy = point.y - player.position.y;
      return {
        x: dx * cos - dy * sin,
        y: dx * sin + dy * cos,
      };
    };

    // Project onto a single tilted plane (affine transform), avoiding nonlinear squash.
    const applyTilt = (point: { x: number; y: number }) => {
      if (clampedTilt <= 0) return point;
      const pitchScaleY = Math.max(0.08, 1 - clampedTilt * 0.9);
      return {
        x: point.x,
        y: point.y * pitchScaleY,
      };
    };

    const padding = 12;
    const anchorX = size.width / 2;
    const anchorY = size.height * carAnchorY;
    const availableHalfWidth = size.width / 2 - padding;
    const availableUp = anchorY - padding;
    const availableDown = size.height - padding - anchorY;

    const lateralHalf = Math.max(1, effectiveLateralFov / 2);
    const scaleX = availableHalfWidth / lateralHalf;
    const scaleUp = availableUp / effectiveForwardDistance;
    const scaleDown =
      effectiveBackwardDistance > 0
        ? availableDown / Math.max(1, effectiveBackwardDistance)
        : Number.POSITIVE_INFINITY;
    const baseScale = Math.max(0.01, Math.min(scaleX, scaleUp, scaleDown));
    const fillBoost = 1.65 + clampedTilt * 0.2;
    const scale = Math.min(12, baseScale * fillBoost);

    const toSvgPoint = (point: { x: number; y: number }) => {
      const transformed = applyTilt(rotateAroundPlayer(point));
      return {
        x: anchorX + transformed.x * scale,
        y: anchorY + transformed.y * scale,
      };
    };

    const trackPoints = trackPathPoints.map(toSvgPoint);
    const trackPathD =
      trackPoints.length > 0
        ? `M ${trackPoints[0].x} ${trackPoints[0].y} ${trackPoints
            .slice(1)
            .map((p) => `L ${p.x} ${p.y}`)
            .join(' ')} Z`
        : '';

    const topInset = padding + (size.width * (0.06 + clampedTilt * 0.08)) / 2;
    const bottomInset = padding;
    const clipPolygon = `${topInset},${padding} ${size.width - topInset},${padding} ${size.width - bottomInset},${size.height - padding} ${bottomInset},${size.height - padding}`;

    const filteredDrivers = [...positionedDrivers].sort(
      (a, b) => Number(a.isPlayer) - Number(b.isPlayer)
    );
    const projectedDrivers = filteredDrivers.map((d) => ({
      ...d,
      point: toSvgPoint(d.position),
    }));

    return {
      clampedTilt,
      trackPathD,
      clipPolygon,
      projectedDrivers,
      width: size.width,
      height: size.height,
    };
  }, [
    player,
    size,
    trackDrawing,
    positionedDrivers,
    forwardDistanceMeters,
    backwardDistanceMeters,
    lateralFovMeters,
    carAnchorY,
    headingSampleDistanceMeters,
    minHeadingDeltaDegrees,
    tiltAmount,
  ]);

  if (!geometry) {
    return <div ref={containerRef} className="w-full h-full" />;
  }

  const outlineColor = invertTrackColors ? '#e5e7eb' : '#111827';
  const trackColor = invertTrackColors ? '#111827' : '#6b7280';
  const trackLineOpacity = 0.5;
  const miniMapTrackLineWidth = Math.max(2, trackLineWidth * 0.2);
  const miniMapTrackOutlineWidth = Math.max(
    miniMapTrackLineWidth + 1,
    trackOutlineWidth * 0.2
  );

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id={clipId}>
            {geometry.clampedTilt > 0 ? (
              <polygon points={geometry.clipPolygon} />
            ) : (
              <rect
                x={12}
                y={12}
                width={Math.max(1, geometry.width - 24)}
                height={Math.max(1, geometry.height - 24)}
              />
            )}
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <path
            d={geometry.trackPathD}
            fill="none"
            stroke={outlineColor}
            strokeWidth={miniMapTrackOutlineWidth}
            strokeLinecap="butt"
            strokeLinejoin="round"
          />
          <path
            d={geometry.trackPathD}
            fill="none"
            stroke={trackColor}
            strokeOpacity={trackLineOpacity}
            strokeWidth={miniMapTrackLineWidth}
            strokeLinecap="butt"
            strokeLinejoin="round"
          />

          {geometry.projectedDrivers.map(
            ({ driver, isPlayer, classPosition, point }) => {
              const color = driverColors[driver.CarIdx];
              if (!color) return null;

              const circleRadius =
                (isPlayer ? playerCircleSize : driverCircleSize) * 0.25;
              const fontSize = circleRadius * 0.75;
              const displayText =
                displayMode === 'sessionPosition' ||
                displayMode === 'livePosition'
                  ? classPosition !== undefined && classPosition > 0
                    ? classPosition.toString()
                    : ''
                  : driver.CarNumber;

              return (
                <g key={driver.CarIdx}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={circleRadius}
                    fill={color.fill}
                  />
                  {driversOffTrack[driver.CarIdx] ? (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={circleRadius}
                      fill="none"
                      stroke={getColor('yellow', 400)}
                      strokeWidth={2}
                    />
                  ) : null}
                  {showCarNumbers && displayText ? (
                    <text
                      x={point.x}
                      y={point.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={fontSize}
                      fill={color.text}
                      fontFamily="sans-serif"
                    >
                      {displayText}
                    </text>
                  ) : null}
                </g>
              );
            }
          )}
        </g>
      </svg>
    </div>
  );
};
