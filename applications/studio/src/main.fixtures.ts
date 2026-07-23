import { Option } from 'effect';

import { DrawerClosed, DrawerEditing, Entry, Model, ParticipationsData, SectionData } from './main';

// A single player record — enough columns to fill the drawer's fields and feed
// the stats chart. `values` line up with `playerColumns`; extras are ignored
// and short arrays fall back to '' in the view, so the exact length is loose.
export const samplePlayer: Entry = Entry.make({
  section: 'players',
  id: 'player-1',
  parentId: '',
  isDeleted: false,
  values: ['Sierra Pennock', 'Sparta Praha', 'Forward', '12', '5'],
});

export const sampleClub: Entry = Entry.make({
  section: 'clubs',
  id: 'club-1',
  parentId: '',
  isDeleted: false,
  values: ['Sparta Praha', 'Prague', '1893'],
});

// A competition and an edition that belongs to it. The edition stores its
// competition's id (parentId + the raw id in the "Competition" cell); the view
// resolves the name from the competitions section.
export const sampleCompetition: Entry = Entry.make({
  section: 'competitions',
  id: 'comp-1',
  parentId: '',
  isDeleted: false,
  values: ['First League', 'CZ1', 'Club'],
});

export const sampleEdition: Entry = Entry.make({
  section: 'editions',
  id: 'edition-1',
  parentId: 'comp-1',
  isDeleted: false,
  values: ['2025/2026', 'comp-1', '2025-08-01', '2026-05-31'],
});

// The signed-out boot model — mirrors `initialModel` in main.ts (kept here so a
// fixture tweak can never quietly reshape the app's real starting state).
export const signedOutModel = Model.make({
  email: '',
  password: '',
  isSignedIn: false,
  section: 'players',
  isMenuOpen: false,
  search: '',
  filters: [],
  drawer: DrawerClosed.make({}),
  nextLocalId: 1,
  editLog: [],
  chartError: Option.none(),
  players: SectionData.Idle(),
  clubs: SectionData.Idle(),
  nationals: SectionData.Idle(),
  competitions: SectionData.Idle(),
  editions: SectionData.Idle(),
  associations: SectionData.Idle(),
  participations: ParticipationsData.Idle(),
  playersPage: 1,
  playersTotal: 0,
  serverHealth: 'Unknown',
  clientPage: 1,
  linkError: '',
  isShowingDashboard: true,
  openFilterColumn: Option.none(),
});

// Signed in, on the dashboard landing page.
export const dashboardModel = Model.make({ ...signedOutModel, isSignedIn: true });

// Signed in, viewing the Players section list with one loaded row.
export const playersListModel = Model.make({
  ...signedOutModel,
  isSignedIn: true,
  isShowingDashboard: false,
  section: 'players',
  players: SectionData.Success({ data: [samplePlayer] }),
  playersTotal: 1,
  serverHealth: 'Ok',
});

// Signed in on the Editions list with both sections loaded — the edition's
// "Competition" cell must render the resolved name, not the stored id.
export const editionsListModel = Model.make({
  ...signedOutModel,
  isSignedIn: true,
  isShowingDashboard: false,
  section: 'editions',
  competitions: SectionData.Success({ data: [sampleCompetition] }),
  editions: SectionData.Success({ data: [sampleEdition] }),
  serverHealth: 'Ok',
});

// Signed in with a player record open in the drawer's Overview tab — the state
// that mounts the stats chart (a non-team record, so only the single host). The
// drawer addresses the record by id, resolved against the players section.
export const playerRecordModel = Model.make({
  ...playersListModel,
  drawer: DrawerEditing.make({
    section: 'players',
    id: samplePlayer.id,
    tab: 'Overview',
    draft: [...samplePlayer.values],
    isConfirmingDelete: false,
  }),
});
