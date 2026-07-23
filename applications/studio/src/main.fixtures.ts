import { DrawerClosed, DrawerEditing, Entry, Model, ParticipationsData, SectionData } from './main';

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
  drawer: DrawerClosed.make({}),
  nextLocalId: 1,
  editLog: [],
  chartError: '',
  players: SectionData.Idle(),
  clubs: SectionData.Idle(),
  nationals: SectionData.Idle(),
  competitions: SectionData.Idle(),
  editions: SectionData.Idle(),
  associations: SectionData.Idle(),
  participations: ParticipationsData.Idle(),
  playersPage: 1,
  playersTotal: 0,
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
  players: SectionData.Success({ data: [samplePlayer] }),
  playersTotal: 1,
  serverHealth: 'ok',
});

// Signed in with a player record open in the drawer's Overview tab — the state
// that mounts the stats chart (a non-team record, so only the single host). The
// drawer addresses the record by id, resolved against the players section.
export const playerRecordModel = Model.make({
  ...playersListModel,
  drawer: DrawerEditing.make({
    section: 'players',
    id: samplePlayer.id,
    tab: 'overview',
    draft: [...samplePlayer.values],
    confirmingDelete: false,
  }),
});
