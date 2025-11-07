import type { ComponentType } from 'react';

import { Standings } from './components/Standings/Standings';
import { Input } from './components/Input';
import { Relative } from './components/Standings/Relative';
import { TrackMap } from './components/TrackMap/TrackMap';
import { Radar } from './components/Radar/Radar';
import { Weather } from './components/Weather';
import { FasterCarsFromBehind } from './components/FasterCarsFromBehind/FasterCarsFromBehind';

// TODO: type this better, right now the config comes from settings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WIDGET_MAP: Record<string, ComponentType<any>> = {
  standings: Standings,
  input: Input,
  relative: Relative,
  map: TrackMap,
  radar: Radar,
  weather: Weather,
  fastercarsfrombehind: FasterCarsFromBehind,
};
