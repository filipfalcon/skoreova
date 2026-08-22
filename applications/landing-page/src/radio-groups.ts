import { RadioGroup } from '@foldkit/ui';

import type { MapLeague } from './model';

// Created once at module scope so the view and the update fold share one
// Value-typed pair — a per-render `create` would hand `toView` a bare string
// where the league union belongs.

/**
 * The DOM id of the club map's league filter.
 */
export const MAP_LEAGUE_GROUP_ID = 'map-league-filter';

/**
 * The map's league filter, typed to the leagues the map can show.
 */
export const MapLeagueRadioGroup = RadioGroup.create<MapLeague>();
