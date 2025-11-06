import { useDashboard } from '@irdashies/context';

interface TrackMapSettings {
  enabled: boolean;
  config: {
    showTurnNumbers: boolean;
    showTurnNames: boolean;
  };
}

export const useTrackMapSettings = () => {
  const { currentDashboard } = useDashboard();

  const settings = currentDashboard?.widgets.find(
    (widget) => widget.id === 'map'
  )?.config;

  // Add type guard to ensure settings matches expected shape
  if (
    settings &&
    typeof settings === 'object' &&
    'showTurnNumbers' in settings &&
    typeof settings.showTurnNumbers === 'boolean' &&
    'showTurnNames' in settings &&
    typeof settings.showTurnNames === 'boolean'
  ) {
    return settings as TrackMapSettings['config'];
  }

  return undefined;
};
