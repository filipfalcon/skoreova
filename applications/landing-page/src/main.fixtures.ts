import { RadioGroup } from '@foldkit/ui';
import { Option } from 'effect';

import { Model } from './main';
import { MAP_LEAGUE_GROUP_ID } from './radio-groups';
import { AppRoute } from './route';

// The landing page at rest — mirrors `initialModel` in main.ts.
export const landingModel = Model.make({
  route: AppRoute.Home(),
  isMenuOpen: false,
  activeSection: Option.none(),
  mapLeague: 'All',
  mapLeagueGroup: RadioGroup.init({ id: MAP_LEAGUE_GROUP_ID }),
  mapClub: Option.none(),
  isMapAreaImperial: true,
  heroPastHeader: false,
  prefersReducedMotion: false,
  reveals: {},
});

// The full-screen menu overlay open.
export const menuOpenModel = Model.make({ ...landingModel, isMenuOpen: true });

// The map filtered to the second league, with a club card open over it.
export const secondLeagueMapModel = Model.make({
  ...landingModel,
  mapLeague: 'Second',
  mapClub: Option.some('sparta-praha'),
});
