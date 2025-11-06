import { useState } from 'react';
import { BaseSettingsSection } from '../components/BaseSettingsSection';
import { useDashboard } from '@irdashies/context';
import { ToggleSwitch } from '../components/ToggleSwitch';

const SETTING_ID = 'map';

interface TrackMapSettings {
  enabled: boolean;
  config: {
    showTurnNumbers: boolean;
    showTurnNames: boolean;
  };
}

const defaultConfig: TrackMapSettings['config'] = {
  showTurnNumbers: false,
  showTurnNames: false,
};

export const TrackMapSettings = () => {
  const { currentDashboard } = useDashboard();
  const [settings, setSettings] = useState<TrackMapSettings>({
    enabled: currentDashboard?.widgets.find(w => w.id === SETTING_ID)?.enabled ?? false,
    config: currentDashboard?.widgets.find(w => w.id === SETTING_ID)?.config as TrackMapSettings['config'] ?? defaultConfig,
  });

  if (!currentDashboard) {
    return <>Loading...</>;
  }

  return (
    <BaseSettingsSection
      title="Track Map Settings"
      description="Configure track map visualization settings."
      settings={settings}
      onSettingsChange={setSettings}
      widgetId="map"
    >
      {(handleConfigChange) => (
        <div className="space-y-4">
          <div className="bg-yellow-600/20 text-yellow-100 p-4 rounded-md mb-4">
            <p>This is still a work in progress. There are several tracks still missing, please report any issues/requests.</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-slate-300">Show Turn Numbers</span>
              <p className="text-xs text-slate-400">
                Display the numeric label for each turn on the map
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.config.showTurnNumbers}
              onToggle={(enabled) =>
                handleConfigChange({
                  showTurnNumbers: enabled,
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-slate-300">Show Turn Names</span>
              <p className="text-xs text-slate-400">
                Display the descriptive name for each turn on the map
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.config.showTurnNames}
              onToggle={(enabled) =>
                handleConfigChange({
                  showTurnNames: enabled,
                })
              }
            />
          </div>
        </div>
      )}
    </BaseSettingsSection>
  );
}; 