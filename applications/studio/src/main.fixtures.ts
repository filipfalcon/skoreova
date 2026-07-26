import { Option } from 'effect';
import { Dialog, Tabs } from '@foldkit/ui';
import { NotValidated } from 'foldkit/fieldValidation';

import { initialDateFilterPickers, initialFilterListboxes } from './data';
import {
  Anonymous,
  DRAWER_DIALOG_ID,
  DRAWER_TABS_ID,
  DrawerClosed,
  DrawerEditing,
  Entry,
  HomeRoute,
  Model,
  ParticipationsData,
  SectionData,
  SectionRoute,
  SignedIn,
} from './main';

// A single player record — enough columns to fill the drawer’s fields and feed
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
// competition’s id (parentId + the raw id in the "Competition" cell); the view
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
// fixture tweak can never quietly reshape the app’s real starting state).
export const signedOutModel = Model.make({
  session: Anonymous({ emailInput: '', passwordInput: '' }),
  route: HomeRoute(),
  isMenuOpen: false,
  search: '',
  filters: {},
  drawer: DrawerClosed(),
  dialog: Dialog.init({ id: DRAWER_DIALOG_ID }),
  tabs: Tabs.init({ id: DRAWER_TABS_ID }),
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
  deletedRecordIds: [],
  pendingLogRecordId: '',
  linkError: '',
  filterListboxes: initialFilterListboxes(),
  dateFilters: {},
  // A fixed "today" keeps the fixture deterministic (production seeds this
  // from the clock via FetchToday).
  dateFilterPickers: initialDateFilterPickers({ year: 2026, month: 6, day: 1 }),
});

// Signed in, on the dashboard landing page. A blank email signs in as the
// generic 'editor'.
export const dashboardModel = Model.make({
  ...signedOutModel,
  session: SignedIn({ email: '' }),
});

// Signed in, viewing the Players section list with one loaded row.
export const playersListModel = Model.make({
  ...signedOutModel,
  session: SignedIn({ email: '' }),
  route: SectionRoute({ section: 'players' }),
  players: SectionData.Success({ data: [samplePlayer] }),
  playersTotal: 1,
  serverHealth: 'Ok',
});

// Signed in on the Editions list with both sections loaded — the edition’s
// "Competition" cell must render the resolved name, not the stored id.
export const editionsListModel = Model.make({
  ...signedOutModel,
  session: SignedIn({ email: '' }),
  route: SectionRoute({ section: 'editions' }),
  competitions: SectionData.Success({ data: [sampleCompetition] }),
  editions: SectionData.Success({ data: [sampleEdition] }),
  serverHealth: 'Ok',
});

// Signed in on the Clubs list with its one row open in the drawer. A club is a
// TEAM record, so its Overview mounts the points-over-time host as well as the
// stats one — the only state that exercises SyncPointsChart.
export const clubRecordModel = Model.make({
  ...signedOutModel,
  session: SignedIn({ email: '' }),
  route: SectionRoute({ section: 'clubs' }),
  clubs: SectionData.Success({ data: [sampleClub] }),
  serverHealth: 'Ok',
  drawer: DrawerEditing({
    section: 'clubs',
    id: sampleClub.id,
    tab: 'Overview',
    draft: sampleClub.values.map((value) => NotValidated({ value })),
    isConfirmingDelete: false,
  }),
  dialog: Dialog.init({ id: DRAWER_DIALOG_ID, isOpen: true }),
});

// Signed in with a player record open in the drawer’s Overview tab — the state
// that mounts the stats chart (a non-team record, so only the single host). The
// drawer addresses the record by id, resolved against the players section.
export const playerRecordModel = Model.make({
  ...playersListModel,
  drawer: DrawerEditing({
    section: 'players',
    id: samplePlayer.id,
    tab: 'Overview',
    draft: samplePlayer.values.map((value) => NotValidated({ value })),
    isConfirmingDelete: false,
  }),
  // The drawer’s content only renders while its Dialog is open.
  dialog: Dialog.init({ id: DRAWER_DIALOG_ID, isOpen: true }),
});
