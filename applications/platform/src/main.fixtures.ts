import { Model } from './main';

// The boot model — mirrors `initialModel` in main.ts (kept here so a fixture
// tweak can never quietly reshape the app's real starting state). Every screen
// derives from this by spreading over the one or two fields that differ.
export const welcomeModel = Model.make({
  screen: 'welcome',
  clubSlug: '',
  competitionSlug: '',
  competitionEdition: '',
  competitionRound: 0,
  clubQuery: '',
  featuredClub: 0,
  followed: [],
  pinned: [],
  scorerScope: 'all',
  metric: 'goals',
});

export const herGameModel = Model.make({ ...welcomeModel, screen: 'hergame' });

// A Her Game feed with one board already pinned — exercises the pinned-tile
// branch of the view (empty vs populated).
export const herGamePinnedModel = Model.make({
  ...welcomeModel,
  screen: 'hergame',
  pinned: ['trending:sparta-praha'],
});

export const clubsModel = Model.make({ ...welcomeModel, screen: 'clubs' });
