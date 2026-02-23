import { useDashboard } from '@irdashies/context';
import { TrackMapWidgetSettings } from '../../Settings/types';

export const useMiniMapSettings = () => {
  const { currentDashboard } = useDashboard();

  const settings = currentDashboard?.widgets.find(
    (widget) => widget.id === 'minimap'
  )?.config;
  return settings as TrackMapWidgetSettings['config'];
};
