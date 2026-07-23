import { Entry, Model } from './main';

// A single player record — enough columns to fill the drawer's fields and feed
// the stats chart. `values` line up with `playerColumns`; extras are ignored
// and short arrays fall back to '' in the view, so the exact length is loose.
export const samplePlayer: Entry = Entry.make({
  section: 'players',
  id: 'player-1',
  parentId: '',
  deleted: false,
  values: ['Sierra Pennock', 'Sparta Praha', 'Forward', '12', '5'],
});

export const sampleClub: Entry = Entry.make({
  section: 'clubs',
  id: 'club-1',
  parentId: '',
  deleted: false,
  values: ['Sparta Praha', 'Prague', '1893'],
});

// The signed-out boot model — mirrors `initialModel` in main.ts (kept here so a
// fixture tweak can never quietly reshape the app's real starting state).
export const signedOutModel = Model.make({
  email: '',
  password: '',
  signedIn: false,
  section: 'players',
  menuOpen: false,
  search: '',
  filters: [],
  rows: [],
  editingIndex: -1,
  draft: [],
  drawerTab: 'overview',
  editLog: [],
  chartError: '',
  deleteConfirming: false,
  creating: false,
  playersRequest: 'idle',
  playersError: '',
  playersPage: 1,
  playersTotal: 0,
  clubsRequest: 'idle',
  clubsError: '',
  nationalsRequest: 'idle',
  nationalsError: '',
  competitionsRequest: 'idle',
  competitionsError: '',
  editionsRequest: 'idle',
  editionsError: '',
  associationsRequest: 'idle',
  associationsError: '',
  participations: [],
  participationsRequest: 'idle',
  participationsError: '',
  serverHealth: 'unknown',
  clientPage: 1,
  linkError: '',
  showDashboard: true,
  openFilterColumn: -1,
});

// Signed in, on the dashboard landing page.
export const dashboardModel = Model.make({ ...signedOutModel, signedIn: true });

// Signed in, viewing the Players section list with one loaded row.
export const playersListModel = Model.make({
  ...signedOutModel,
  signedIn: true,
  showDashboard: false,
  section: 'players',
  rows: [samplePlayer],
  playersRequest: 'loaded',
  playersTotal: 1,
  serverHealth: 'ok',
});

// Signed in with a player record open in the drawer's Overview tab — the state
// that mounts the stats chart (a non-team record, so only the single host).
export const playerRecordModel = Model.make({
  ...playersListModel,
  editingIndex: 0,
  drawerTab: 'overview',
  draft: [...samplePlayer.values],
});
