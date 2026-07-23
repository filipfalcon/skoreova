import { Model } from './main';

// The landing page at rest — mirrors `initialModel` in main.ts.
export const landingModel = Model.make({
  isMenuOpen: false,
  activeSection: '',
  mapLeague: 'All',
  mapClub: '',
  isMapAreaImperial: true,
  heroPastHeader: false,
});

// The full-screen menu overlay open.
export const menuOpenModel = Model.make({ ...landingModel, isMenuOpen: true });

// The map filtered to the second league, with a club card open over it.
export const secondLeagueMapModel = Model.make({
  ...landingModel,
  mapLeague: 'Second',
  mapClub: 'sparta-praha',
});
