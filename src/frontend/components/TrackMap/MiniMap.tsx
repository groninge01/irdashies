import { useSessionVisibility, useTelemetryValue } from '@irdashies/context';
import tracks from './tracks/tracks.json';
import { useTrackId } from './hooks/useTrackId';
import { useDriverProgress } from './hooks/useDriverProgress';
import { useMiniMapSettings } from './hooks/useMiniMapSettings';
import { useHighlightColor } from './hooks/useHighlightColor';
import { MiniMapCanvas } from './MiniMapCanvas';
import { TrackDrawing } from './TrackCanvas';

const debug = import.meta.env.DEV || import.meta.env.MODE === 'storybook';

export interface MiniMapConfig {
  forwardDistanceMeters?: number;
  backwardDistanceMeters?: number;
  lateralFovMeters?: number;
  carAnchorY?: number;
  headingSampleDistanceMeters?: number;
  rotationSmoothing?: number;
  scaleSmoothing?: number;
  minHeadingDeltaDegrees?: number;
  tiltAmount?: number;
}

export const MiniMap = (config?: MiniMapConfig) => {
  const trackId = useTrackId();
  const driversTrackData = useDriverProgress();
  const settings = useMiniMapSettings();
  const highlightColor = useHighlightColor();
  const isOnTrack = useTelemetryValue('IsOnTrack');

  if (!useSessionVisibility(settings?.sessionVisibility)) return <></>;

  if (settings?.showOnlyWhenOnTrack && !isOnTrack) {
    return <></>;
  }

  const trackDrawing = trackId
    ? (tracks as unknown as TrackDrawing[])[trackId]
    : null;

  if (!trackId || !trackDrawing) {
    return debug ? (
      <div className="w-full h-full flex items-center justify-center text-white">
        <p>No track data available</p>
      </div>
    ) : (
      <></>
    );
  }

  return (
    <div className="w-full h-full">
      <MiniMapCanvas
        trackDrawing={trackDrawing}
        drivers={driversTrackData}
        highlightColor={
          settings?.useHighlightColor ? highlightColor : undefined
        }
        showCarNumbers={settings?.showCarNumbers ?? true}
        displayMode={settings?.displayMode ?? 'carNumber'}
        driverCircleSize={settings?.driverCircleSize ?? 40}
        playerCircleSize={settings?.playerCircleSize ?? 40}
        trackLineWidth={settings?.trackLineWidth ?? 20}
        trackOutlineWidth={settings?.trackOutlineWidth ?? 40}
        invertTrackColors={settings?.invertTrackColors ?? false}
        forwardDistanceMeters={config?.forwardDistanceMeters ?? 170}
        backwardDistanceMeters={config?.backwardDistanceMeters ?? 18}
        lateralFovMeters={config?.lateralFovMeters ?? 130}
        carAnchorY={config?.carAnchorY ?? 0.93}
        headingSampleDistanceMeters={config?.headingSampleDistanceMeters ?? 45}
        rotationSmoothing={config?.rotationSmoothing ?? 0.08}
        scaleSmoothing={config?.scaleSmoothing ?? 0.18}
        minHeadingDeltaDegrees={config?.minHeadingDeltaDegrees ?? 1.0}
        tiltAmount={config?.tiltAmount ?? 0.9}
      />
    </div>
  );
};
