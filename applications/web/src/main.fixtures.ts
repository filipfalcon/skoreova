import { Option } from 'effect';

import { Model } from './main';

// The landing page at rest — mirrors `initialModel` in main.ts.
export const landingModel = Model.make({
  isMenuOpen: false,
  activeSection: Option.none(),
  mapLeague: 'All',
  mapClub: Option.none(),
  isMapAreaImperial: true,
  heroPastHeader: false,
  prefersReducedMotion: false,
});

// The full-screen menu overlay open.
export const menuOpenModel = Model.make({ ...landingModel, isMenuOpen: true });

// The map filtered to the second league, with a club card open over it.
export const secondLeagueMapModel = Model.make({
  ...landingModel,
  mapLeague: 'Second',
  mapClub: Option.some('sparta-praha'),
});
