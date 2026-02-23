import { useEffect, useMemo, useRef, useState } from 'react';
import { TrackDriver, TrackDrawing } from './TrackCanvas';
import { getColor, getTailwindStyle } from '@irdashies/utils/colors';
import { useDriverOffTrack } from './hooks/useDriverOffTrack';

export interface MiniMapCanvasProps {
  trackDrawing: TrackDrawing;
  drivers: TrackDriver[];
  highlightColor?: number;
  showCarNumbers?: boolean;
  displayMode?: 'carNumber' | 'sessionPosition';
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
  fovShape?: 'circle' | 'rectangle';
}

type PositionedDriver = TrackDriver & {
  position: { x: number; y: number };
  length: number;
};

const mod = (value: number, total: number) => {
  if (total === 0) return 0;
  return ((value % total) + total) % total;
};

const normalizeAngle = (angle: number) => {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;
  return normalized;
};

const getPointAtLength = (
  trackPathPoints: { x: number; y: number }[],
  totalLength: number,
  length: number
) => {
  if (!trackPathPoints.length) {
    return { x: 0, y: 0 };
  }
  if (trackPathPoints.length === 1 || totalLength <= 0) {
    return trackPathPoints[0];
  }

  const clampedLength = mod(length, totalLength);
  const pointPosition = (clampedLength / totalLength) * (trackPathPoints.length - 1);
  const pointIndex = Math.floor(pointPosition);
  const nextIndex = Math.min(pointIndex + 1, trackPathPoints.length - 1);
  const t = pointPosition - pointIndex;
  const a = trackPathPoints[pointIndex];
  const b = trackPathPoints[nextIndex];

  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
};

export const MiniMapCanvas = ({
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
  forwardDistanceMeters = 250,
  backwardDistanceMeters = 100,
  lateralFovMeters = 140,
  carAnchorY = 0.78,
  headingSampleDistanceMeters = 45,
  rotationSmoothing = 0.08,
  scaleSmoothing = 0.18,
  minHeadingDeltaDegrees = 1.0,
  fovShape = 'circle',
}: MiniMapCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const driversOffTrack = useDriverOffTrack();
  const rotationRef = useRef<number | null>(null);
  const scaleRef = useRef<number | null>(null);

  const isMultiClass = useMemo(() => {
    if (!drivers || drivers.length === 0) return false;
    const uniqueClassIds = new Set(drivers.map(({ driver }) => driver.CarClassID));
    return uniqueClassIds.size > 1;
  }, [drivers]);

  const driverColors = useMemo(() => {
    const colors: Record<number, { fill: string; text: string }> = {};
    drivers?.forEach(({ driver, isPlayer }) => {
      if (isPlayer) {
        if (highlightColor) {
          const highlightColorHex = `#${highlightColor.toString(16).padStart(6, '0')}`;
          colors[driver.CarIdx] = { fill: highlightColorHex, text: 'white' };
        } else {
          colors[driver.CarIdx] = { fill: getColor('amber'), text: 'white' };
        }
      } else {
        const style = getTailwindStyle(driver.CarClassColor, undefined, isMultiClass);
        colors[driver.CarIdx] = { fill: style.canvasFill, text: 'white' };
      }
    });
    return colors;
  }, [drivers, isMultiClass, highlightColor]);

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
  }, [
    drivers,
    trackDrawing?.active?.trackPathPoints,
    trackDrawing?.active?.totalLength,
    trackDrawing?.startFinish?.point?.length,
    trackDrawing?.startFinish?.direction,
  ]);

  const player = useMemo(
    () => positionedDrivers.find((driver) => driver.isPlayer) ?? null,
    [positionedDrivers]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      setCanvasSize({ width: rect.width, height: rect.height });
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    window.addEventListener('resize', resize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || canvasSize.width === 0 || canvasSize.height === 0 || !player) {
      return;
    }
    if (
      !trackDrawing?.active?.trackPathPoints ||
      !trackDrawing?.active?.totalLength ||
      !trackDrawing?.startFinish?.direction
    ) {
      return;
    }

    const totalLength = trackDrawing.active.totalLength;
    const trackPathPoints = trackDrawing.active.trackPathPoints;
    const travelSign = trackDrawing.startFinish.direction === 'anticlockwise' ? 1 : -1;

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
    const heading = {
      x: lookAheadPoint.x - lookBehindPoint.x,
      y: lookAheadPoint.y - lookBehindPoint.y,
    };
    const headingAngle = Math.atan2(heading.y, heading.x);
    // In canvas coordinates, "up" is -PI/2.
    const targetRotation = -Math.PI / 2 - headingAngle;
    const currentRotation = rotationRef.current;
    let rotation =
      currentRotation === null
        ? targetRotation
        : currentRotation +
          normalizeAngle(targetRotation - currentRotation) *
            Math.min(1, Math.max(0.01, rotationSmoothing));
    if (currentRotation !== null) {
      const minDelta = (minHeadingDeltaDegrees * Math.PI) / 180;
      if (Math.abs(normalizeAngle(rotation - currentRotation)) < minDelta) {
        rotation = currentRotation;
      }
    }
    rotationRef.current = rotation;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    const segmentDistance = forwardDistanceMeters + backwardDistanceMeters;
    const sampleCount = Math.max(80, Math.ceil(segmentDistance / 3));
    const segmentPoints = [];
    for (let i = 0; i <= sampleCount; i++) {
      const ratio = i / sampleCount;
      const relativeDistance =
        -backwardDistanceMeters + ratio * (forwardDistanceMeters + backwardDistanceMeters);
      const targetLength = mod(player.length + relativeDistance * travelSign, totalLength);
      segmentPoints.push(getPointAtLength(trackPathPoints, totalLength, targetLength));
    }

    const rotateAroundPlayer = (point: { x: number; y: number }) => {
      const dx = point.x - player.position.x;
      const dy = point.y - player.position.y;
      return {
        x: dx * cos - dy * sin,
        y: dx * sin + dy * cos,
      };
    };

    const rotatedSegment = segmentPoints.map(rotateAroundPlayer);

    const padding = 12;
    const anchorX = canvasSize.width / 2;
    const anchorY = canvasSize.height * carAnchorY;
    const viewportCenterX = canvasSize.width / 2;
    const viewportCenterY = canvasSize.height / 2;
    const viewportRadius = Math.max(
      1,
      Math.min(canvasSize.width, canvasSize.height) / 2 - padding
    );
    const lateralHalf = Math.max(1, lateralFovMeters / 2);
    const availableHalfWidth =
      fovShape === 'circle'
        ? Math.max(1, viewportRadius - Math.abs(anchorX - viewportCenterX))
        : canvasSize.width / 2 - padding;
    const availableUp =
      fovShape === 'circle'
        ? Math.max(1, anchorY - (viewportCenterY - viewportRadius))
        : anchorY - padding;
    const availableDown =
      fovShape === 'circle'
        ? Math.max(1, viewportCenterY + viewportRadius - anchorY)
        : canvasSize.height - padding - anchorY;

    // Use fixed framing references so zoom does not pump while the segment shape changes.
    const scaleX = availableHalfWidth / lateralHalf;
    const scaleUp =
      forwardDistanceMeters > 0
        ? availableUp / Math.max(1, forwardDistanceMeters)
        : Number.POSITIVE_INFINITY;
    const scaleDown =
      backwardDistanceMeters > 0
        ? availableDown / Math.max(1, backwardDistanceMeters)
        : Number.POSITIVE_INFINITY;
    const targetScale = Math.max(0.01, Math.min(scaleX, scaleUp, scaleDown));
    const previousScale = scaleRef.current ?? targetScale;
    const scale =
      previousScale + (targetScale - previousScale) * Math.min(1, Math.max(0.01, scaleSmoothing));
    scaleRef.current = scale;

    const toCanvasPoint = (point: { x: number; y: number }) => {
      const rotated = rotateAroundPlayer(point);
      return {
        x: anchorX + rotated.x * scale,
        y: anchorY + rotated.y * scale,
      };
    };

    const getRelativeTravelDistance = (driverLength: number) => {
      const forwardDistance =
        travelSign > 0
          ? mod(driverLength - player.length, totalLength)
          : mod(player.length - driverLength, totalLength);

      if (forwardDistance <= forwardDistanceMeters) return forwardDistance;

      const behindDistance = totalLength - forwardDistance;
      if (behindDistance <= backwardDistanceMeters) return -behindDistance;

      return null;
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (fovShape === 'circle') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(viewportCenterX, viewportCenterY, viewportRadius, 0, 2 * Math.PI);
      ctx.clip();
    }

    const outlineColor = invertTrackColors ? 'white' : 'black';
    const trackColor = invertTrackColors ? 'black' : 'white';

    const miniMapTrackLineWidth = Math.max(2, trackLineWidth * 0.25);
    const miniMapTrackOutlineWidth = Math.max(
      miniMapTrackLineWidth + 2,
      trackOutlineWidth * 0.25
    );

    // Keep segment ends visually open (no rounded end caps).
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    rotatedSegment.forEach((point, index) => {
      const x = anchorX + point.x * scale;
      const y = anchorY + point.y * scale;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = miniMapTrackOutlineWidth;
    ctx.stroke();

    ctx.beginPath();
    rotatedSegment.forEach((point, index) => {
      const x = anchorX + point.x * scale;
      const y = anchorY + point.y * scale;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = miniMapTrackLineWidth;
    ctx.stroke();

    positionedDrivers
      .filter((driver) => getRelativeTravelDistance(driver.length) !== null)
      .sort((a, b) => Number(a.isPlayer) - Number(b.isPlayer))
      .forEach(({ driver, position, isPlayer, classPosition }) => {
        const color = driverColors[driver.CarIdx];
        if (!color) return;

        const point = toCanvasPoint(position);
        const circleRadius = (isPlayer ? playerCircleSize : driverCircleSize) * 0.25;
        const fontSize = circleRadius * 0.75;

        ctx.fillStyle = color.fill;
        ctx.beginPath();
        ctx.arc(point.x, point.y, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        if (driversOffTrack[driver.CarIdx]) {
          ctx.strokeStyle = getColor('yellow', 400);
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (showCarNumbers) {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = color.text;
          ctx.font = `${fontSize}px sans-serif`;
          const displayText =
            displayMode === 'sessionPosition'
              ? classPosition !== undefined && classPosition > 0
                ? classPosition.toString()
                : ''
              : driver.CarNumber;
          if (displayText) {
            ctx.fillText(displayText, point.x, point.y);
          }
        }
      });

    if (fovShape === 'circle') {
      ctx.restore();
    }
  }, [
    carAnchorY,
    canvasSize,
    displayMode,
    driverCircleSize,
    driverColors,
    driversOffTrack,
    forwardDistanceMeters,
    backwardDistanceMeters,
    lateralFovMeters,
    headingSampleDistanceMeters,
    invertTrackColors,
    minHeadingDeltaDegrees,
    fovShape,
    player,
    playerCircleSize,
    positionedDrivers,
    showCarNumbers,
    rotationSmoothing,
    scaleSmoothing,
    trackDrawing?.active?.trackPathPoints,
    trackDrawing?.active?.totalLength,
    trackDrawing?.startFinish?.direction,
    trackLineWidth,
    trackOutlineWidth,
  ]);

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
