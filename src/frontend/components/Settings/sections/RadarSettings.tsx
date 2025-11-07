import { useState } from 'react';
import { BaseSettingsSection } from '../components/BaseSettingsSection';
import { useDashboard } from '@irdashies/context';

const SETTING_ID = 'radar';

type RadarConfig = Record<string, never>;

interface RadarSettingsState {
  enabled: boolean;
  config: RadarConfig;
}

const defaultConfig: RadarConfig = {};

export const RadarSettings = () => {
  const { currentDashboard } = useDashboard();
  const savedSettings = currentDashboard?.widgets.find((w) => w.id === SETTING_ID);
  const [settings, setSettings] = useState<RadarSettingsState>({
    enabled: savedSettings?.enabled ?? false,
    config: (savedSettings?.config as RadarConfig) ?? defaultConfig,
  });

  if (!currentDashboard) {
    return <>Loading...</>;
  }

  return (
    <BaseSettingsSection
      title="Radar Settings"
      description="Toggle the radar widget visibility."
      settings={settings}
      onSettingsChange={setSettings}
      widgetId={SETTING_ID}
    />
  );
};
