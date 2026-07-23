import { Model } from './main';

// The landing page at rest — mirrors `initialModel` in main.ts.
export const landingModel = Model.make({
  menuOpen: false,
  activeSection: '',
  mapLeague: 'all',
  mapClub: '',
  mapAreaImperial: true,
  heroPastHeader: false,
});

// The full-screen menu overlay open.
export const menuOpenModel = Model.make({ ...landingModel, menuOpen: true });

// The map filtered to the second league, with a club card open over it.
export const secondLeagueMapModel = Model.make({
  ...landingModel,
  mapLeague: 'second',
  mapClub: 'sparta-praha',
});
