import * as echarts from 'echarts/core';
import { Clock, Effect, Match as M, Option, Schema as S } from 'effect';
import { Input } from '@foldkit/ui';
import { Command, Mount, Runtime } from 'foldkit';
import { html } from 'foldkit/html';
import type { Document, Html } from 'foldkit/html';
// `Html` is `VNode | null` — the node type is not parameterized by Message.
import { m } from 'foldkit/message';
import { UrlRequest, load, pushUrl } from 'foldkit/navigation';
import { evo } from 'foldkit/struct';
import { Url, toString as urlToString } from 'foldkit/url';

import loginBackground from './assets/login-background.jpg';
import { PAGE_SIZE } from './api';
import {
  AssociationsResponse,
  associationColumns,
  associationToRow,
  associationsUrl,
} from './associationsApi';
import { getChart, removeChart, setChart } from './chartHost';
import { HealthResponse, healthUrl } from './healthApi';
import {
  CompetitionsResponse,
  competitionColumns,
  competitionToRow,
  competitionsUrl,
} from './competitionsApi';
import { makePointsOption, makeStatsOption } from './echarts';
import {
  EditionResponse,
  EditionsResponse,
  editionColumns,
  editionToRow,
  editionsUrl,
} from './editionsApi';
import {
  ParticipationResponse,
  ParticipationsResponse,
  participationsUrl,
} from './participationsApi';
import { PlayersPage, playerColumns, playerToRow, playersUrl } from './playersApi';
import type { AppRoute } from './route';
import { homeRouter, recordRouter, sectionRouter, urlToAppRoute } from './route';
import { Section } from './section';
import {
  TeamResponse,
  TeamsResponse,
  teamByIdUrl,
  teamColumns,
  teamToRow,
  teamsUrl,
} from './teamsApi';

export { Section } from './section';

// MODEL

// One record. `values` line up with the section's columns (see `sectionData`).
export const Entry = S.Struct({
  section: Section,
  values: S.Array(S.String),
  // Soft-deleted rather than removed, so its index stays stable for `editLog`.
  deleted: S.Boolean,
  // Server-assigned UUID once this record is backed by the API, '' for
  // records that only exist locally (mock rows, or a record not yet saved).
  id: S.String,
  // Generic "belongs to" reference, e.g. an edition's owning competition.
  // '' when not applicable.
  parentId: S.String,
});
export type Entry = typeof Entry.Type;

export const DrawerTab = S.Literals(['overview', 'persistency', 'history']);
export type DrawerTab = typeof DrawerTab.Type;

// The profile drawer's state. A tagged union so its shape can't drift into an
// impossible state (a draft with the drawer closed, a delete-confirm on a
// record that isn't open). An open record is addressed by its stable
// section+id, NOT a row index, so a background refetch that rebuilds `rows`
// can't repoint the drawer at a different record.
export const DrawerClosed = S.TaggedStruct('Closed', {});
export const DrawerCreating = S.TaggedStruct('Creating', {
  section: Section,
  draft: S.Array(S.String),
});
export const DrawerEditing = S.TaggedStruct('Editing', {
  section: Section,
  id: S.String,
  tab: DrawerTab,
  draft: S.Array(S.String),
  confirmingDelete: S.Boolean,
});
export const DrawerState = S.Union([DrawerClosed, DrawerCreating, DrawerEditing]);
export type DrawerState = typeof DrawerState.Type;

// Status of a section's fetch from the real API. Every section uses this.
export const RequestStatus = S.Literals(['idle', 'loading', 'loaded', 'failed']);
export type RequestStatus = typeof RequestStatus.Type;

// One recorded change to a field, for the drawer's History tab. Keyed by the
// record's id (not its row index), so the log stays attached to its record
// across refetches.
export const LogEntry = S.Struct({
  recordId: S.String,
  field: S.String,
  from: S.String,
  to: S.String,
  at: S.String,
});
export type LogEntry = typeof LogEntry.Type;

export const Model = S.Struct({
  email: S.String,
  password: S.String,
  signedIn: S.Boolean,
  section: Section,
  // Whether the nav is open. Only affects small screens; from `md:` up the
  // sidebar is always visible.
  menuOpen: S.Boolean,
  search: S.String,
  // One dropdown filter per column of the current section. `filters[i]` is the
  // selected value for `columns[i]`, or '' for "All". Index 0 (the title
  // column) is unused but kept so indices line up with `columns`.
  filters: S.Array(S.String),
  // The loaded dataset. Kept flat; each record carries its own id, which is
  // how the drawer and edit log address a record (never a row index).
  rows: S.Array(Entry),
  // The profile drawer: closed, creating a new record, or editing one by id.
  drawer: DrawerState,
  // Client-side id source for records created in the mock (the backend would
  // assign one). Monotonic so a created row gets a stable, unique id the
  // drawer and keyed lists can address.
  nextLocalId: S.Number,
  // History of committed field edits, across all records.
  editLog: S.Array(LogEntry),
  // Message from the last chart mount/sync attempt, or '' if it's fine.
  chartError: S.String,
  // Status of fetching each section from the real API.
  playersRequest: RequestStatus,
  playersError: S.String,
  // Only /players is paginated server-side right now; Clubs/Nationals fetch
  // everything in one request.
  playersPage: S.Number,
  playersTotal: S.Number,
  clubsRequest: RequestStatus,
  clubsError: S.String,
  nationalsRequest: RequestStatus,
  nationalsError: S.String,
  competitionsRequest: RequestStatus,
  competitionsError: S.String,
  editionsRequest: RequestStatus,
  editionsError: S.String,
  associationsRequest: RequestStatus,
  associationsError: S.String,
  // Which team played in which edition. Not browsable as its own section —
  // only used to resolve an edition's participating teams in its Overview tab.
  participations: S.Array(ParticipationResponse),
  participationsRequest: RequestStatus,
  participationsError: S.String,
  // Whether the backend is reachable at all, via GET /health — shown as the
  // diode on every API-backed section's Refresh button. Separate from each
  // section's own request status, since a health check is cheaper/faster
  // than waiting on a full list fetch to fail.
  serverHealth: S.Literals(['unknown', 'ok', 'down']),
  // Page within the current section's *filtered* list, for every section
  // other than Players (which pages server-side instead). Resets to 1 on
  // section switch, search, or filter change.
  clientPage: S.Number,
  // Set when a shared record link couldn't be resolved (e.g. a deleted team,
  // or a player not on the currently loaded page — see FetchTeamById).
  linkError: S.String,
  // Whether the dashboard landing page is shown instead of a section's list.
  // This is the default entrypoint right after signing in.
  showDashboard: S.Boolean,
  // Index of the column whose checkbox filter dropdown (see checkboxColumns)
  // is currently open, or -1 if none is.
  openFilterColumn: S.Number,
});
export type Model = typeof Model.Type;

// MESSAGE

export const EnteredEmail = m('EnteredEmail', { value: S.String });
export const EnteredPassword = m('EnteredPassword', { value: S.String });
export const ClickedSignIn = m('ClickedSignIn');
export const ClickedSignOut = m('ClickedSignOut');
export const SelectedSection = m('SelectedSection', { section: Section });
export const ToggledMenu = m('ToggledMenu');
export const EnteredSearch = m('EnteredSearch', { value: S.String });
export const SelectedFilter = m('SelectedFilter', { columnIndex: S.Number, value: S.String });
export const ClickedAddNew = m('ClickedAddNew');
export const ClickedRecord = m('ClickedRecord', { section: Section, id: S.String });
export const EditedField = m('EditedField', { index: S.Number, value: S.String });
export const ClickedSaveRecord = m('ClickedSaveRecord');
// Carries the edit-log timestamp fetched from the clock by StampSave, so the
// commit stays out of `update`'s pure path.
export const SavedRecordAt = m('SavedRecordAt', { at: S.String });
export const ClickedCloseDrawer = m('ClickedCloseDrawer');
export const SelectedDrawerTab = m('SelectedDrawerTab', { tab: DrawerTab });
export const SucceededMountChart = m('SucceededMountChart', { hostId: S.String });
export const FailedMountChart = m('FailedMountChart', { reason: S.String });
export const CompletedSyncChart = m('CompletedSyncChart');
export const FailedSyncChart = m('FailedSyncChart', { reason: S.String });
export const ClickedDeleteRecord = m('ClickedDeleteRecord');
export const ClickedConfirmDelete = m('ClickedConfirmDelete');
export const ClickedCancelDelete = m('ClickedCancelDelete');
export const SucceededFetchPlayers = m('SucceededFetchPlayers', {
  entries: S.Array(Entry),
  total: S.Number,
});
export const FailedFetchPlayers = m('FailedFetchPlayers', { reason: S.String });
export const ClickedRetryPlayers = m('ClickedRetryPlayers');
export const ClickedPlayersPage = m('ClickedPlayersPage', { page: S.Number });
export const ClickedClientPage = m('ClickedClientPage', { page: S.Number });
export const SucceededFetchClubs = m('SucceededFetchClubs', { entries: S.Array(Entry) });
export const FailedFetchClubs = m('FailedFetchClubs', { reason: S.String });
export const ClickedRetryClubs = m('ClickedRetryClubs');
export const SucceededFetchNationals = m('SucceededFetchNationals', { entries: S.Array(Entry) });
export const FailedFetchNationals = m('FailedFetchNationals', { reason: S.String });
export const ClickedRetryNationals = m('ClickedRetryNationals');
export const SucceededFetchCompetitions = m('SucceededFetchCompetitions', {
  entries: S.Array(Entry),
});
export const FailedFetchCompetitions = m('FailedFetchCompetitions', { reason: S.String });
export const ClickedRetryCompetitions = m('ClickedRetryCompetitions');
// Carries the raw parsed editions (not yet Entry-mapped) — the update handler
// resolves each one's competition name using the already-loaded Competitions
// list, which a Command's isolated effect can't see.
export const SucceededFetchEditions = m('SucceededFetchEditions', {
  editions: S.Array(EditionResponse),
});
export const FailedFetchEditions = m('FailedFetchEditions', { reason: S.String });
export const ClickedRetryEditions = m('ClickedRetryEditions');
export const SucceededFetchAssociations = m('SucceededFetchAssociations', {
  entries: S.Array(Entry),
});
export const FailedFetchAssociations = m('FailedFetchAssociations', { reason: S.String });
export const ClickedRetryAssociations = m('ClickedRetryAssociations');
export const SucceededFetchParticipations = m('SucceededFetchParticipations', {
  participations: S.Array(ParticipationResponse),
});
export const FailedFetchParticipations = m('FailedFetchParticipations', { reason: S.String });
export const ClickedRetryParticipations = m('ClickedRetryParticipations');
export const SucceededFetchHealth = m('SucceededFetchHealth');
export const FailedFetchHealth = m('FailedFetchHealth', { reason: S.String });
export const ClickedLink = m('ClickedLink', { request: UrlRequest });
export const ChangedUrl = m('ChangedUrl', { url: Url });
export const CompletedNavigate = m('CompletedNavigate');
export const CompletedLoad = m('CompletedLoad');
export const SucceededFetchTeamById = m('SucceededFetchTeamById', { entry: Entry });
export const FailedFetchTeamById = m('FailedFetchTeamById', { reason: S.String });
export const ClickedDashboard = m('ClickedDashboard');
export const ToggledFilterDropdown = m('ToggledFilterDropdown', { columnIndex: S.Number });
export const ToggledFilterValue = m('ToggledFilterValue', {
  columnIndex: S.Number,
  value: S.String,
});

export const Message = S.Union([
  EnteredEmail,
  EnteredPassword,
  ClickedSignIn,
  ClickedSignOut,
  SelectedSection,
  ToggledMenu,
  EnteredSearch,
  SelectedFilter,
  ClickedAddNew,
  ClickedRecord,
  EditedField,
  ClickedSaveRecord,
  SavedRecordAt,
  ClickedCloseDrawer,
  SelectedDrawerTab,
  SucceededMountChart,
  FailedMountChart,
  CompletedSyncChart,
  FailedSyncChart,
  ClickedDeleteRecord,
  ClickedConfirmDelete,
  ClickedCancelDelete,
  SucceededFetchPlayers,
  FailedFetchPlayers,
  ClickedRetryPlayers,
  ClickedPlayersPage,
  ClickedClientPage,
  SucceededFetchClubs,
  FailedFetchClubs,
  ClickedRetryClubs,
  SucceededFetchNationals,
  FailedFetchNationals,
  ClickedRetryNationals,
  SucceededFetchCompetitions,
  FailedFetchCompetitions,
  ClickedRetryCompetitions,
  SucceededFetchEditions,
  FailedFetchEditions,
  ClickedRetryEditions,
  SucceededFetchAssociations,
  FailedFetchAssociations,
  ClickedRetryAssociations,
  SucceededFetchParticipations,
  FailedFetchParticipations,
  ClickedRetryParticipations,
  SucceededFetchHealth,
  FailedFetchHealth,
  ClickedLink,
  ChangedUrl,
  CompletedNavigate,
  CompletedLoad,
  SucceededFetchTeamById,
  FailedFetchTeamById,
  ClickedDashboard,
  ToggledFilterDropdown,
  ToggledFilterValue,
]);
export type Message = typeof Message.Type;

// UPDATE

// A fresh signed-out model. `rows` starts empty — every section is fetched
// from the real API at sign-in, there's no mock seed data anymore.
const initialModel = (): Model => ({
  email: '',
  password: '',
  signedIn: false,
  section: 'players',
  menuOpen: false,
  search: '',
  filters: [],
  rows: [],
  drawer: DrawerClosed.make({}),
  nextLocalId: 1,
  editLog: [],
  chartError: '',
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

const upsertEntry = (rows: ReadonlyArray<Entry>, entry: Entry): ReadonlyArray<Entry> => [
  ...rows.filter((row) => !(row.section === entry.section && row.id === entry.id)),
  entry,
];

// The record the drawer is editing, resolved by id from the current rows
// (undefined when the drawer is closed, creating, or the record is gone).
const drawerRecord = (model: Model): Entry | undefined => {
  const drawer = model.drawer;
  if (drawer._tag !== 'Editing') return undefined;
  return model.rows.find((row) => row.section === drawer.section && row.id === drawer.id);
};

// The edit buffer of whichever open drawer state carries one ([] when closed).
const draftOf = (drawer: DrawerState): ReadonlyArray<string> =>
  drawer._tag === 'Closed' ? [] : drawer.draft;

// Replaces the draft on whichever open drawer state carries one.
const withDraft = (drawer: DrawerState, draft: ReadonlyArray<string>): DrawerState => {
  if (drawer._tag === 'Creating') return evo(drawer, { draft: () => draft });
  if (drawer._tag === 'Editing') return evo(drawer, { draft: () => draft });
  return drawer;
};

// Opens the drawer on an existing record, populating the edit buffer from it.
const editRecord = (entry: Entry): DrawerState =>
  DrawerEditing.make({
    section: entry.section,
    id: entry.id,
    tab: 'overview',
    draft: [...entry.values],
    confirmingDelete: false,
  });

// Editions and Competitions can finish fetching in either order. Whichever
// arrives second re-derives every edition's "Competition" column (index 1)
// from `rows` as it stands right now, so it's never stuck showing the raw
// competitionId just because Competitions hadn't loaded yet when Editions did.
const withResolvedEditionCompetitionNames = (rows: ReadonlyArray<Entry>): ReadonlyArray<Entry> =>
  rows.map((row) => {
    if (row.section !== 'editions') return row;
    const competition = rows.find(
      (candidate) => candidate.section === 'competitions' && candidate.id === row.parentId,
    );
    if (!competition) return row;
    const values = [...row.values];
    values[1] = competition.values[0] ?? values[1] ?? '';
    return evo(row, { values: () => values });
  });

// Applies a parsed URL to the model — used both for the initial load and for
// browser back/forward (ChangedUrl). Deep-linking to a specific record is
// fully reliable for Clubs/Nationals (fetched by id via GET /teams/{id} if
// not already loaded); other sections have no single-record endpoint, so a
// link only opens the record if it's already in the currently loaded list —
// otherwise it falls back to that section's list.
const applyRoute = (
  model: Model,
  route: AppRoute,
): readonly [Model, ReadonlyArray<Command.Command<Message>>] =>
  M.value(route).pipe(
    M.withReturnType<readonly [Model, ReadonlyArray<Command.Command<Message>>]>(),
    M.tagsExhaustive({
      // The dashboard landing page — the default entrypoint after signing in.
      HomeRoute: () => [
        evo(model, {
          showDashboard: () => true,
          menuOpen: () => false,
          drawer: () => DrawerClosed.make({}),
        }),
        [],
      ],
      NotFoundRoute: () => [
        evo(model, {
          showDashboard: () => true,
          menuOpen: () => false,
          drawer: () => DrawerClosed.make({}),
        }),
        [],
      ],
      SectionRoute: ({ section }) => [
        evo(model, {
          section: () => section,
          showDashboard: () => false,
          menuOpen: () => false,
          drawer: () => DrawerClosed.make({}),
        }),
        [],
      ],
      RecordRoute: ({ section, id }) => {
        const entry = model.rows.find(
          (row) => row.section === section && row.id === id && !row.deleted,
        );
        if (entry) {
          return [
            evo(model, {
              section: () => section,
              showDashboard: () => false,
              menuOpen: () => false,
              drawer: () => editRecord(entry),
              chartError: () => '',
              linkError: () => '',
            }),
            [],
          ];
        }
        if (section === 'clubs' || section === 'nationals') {
          return [
            evo(model, {
              section: () => section,
              showDashboard: () => false,
              menuOpen: () => false,
            }),
            [FetchTeamById({ section, id })],
          ];
        }
        // No single-record endpoint for this section (or it's mock-only) —
        // fall back to the section's list instead of a broken "open" state.
        return [
          evo(model, {
            section: () => section,
            showDashboard: () => false,
            menuOpen: () => false,
            drawer: () => DrawerClosed.make({}),
          }),
          [],
        ];
      },
    }),
  );

export const update = (
  model: Model,
  message: Message,
): readonly [Model, ReadonlyArray<Command.Command<Message>>] =>
  M.value(message).pipe(
    M.withReturnType<readonly [Model, ReadonlyArray<Command.Command<Message>>]>(),
    M.tagsExhaustive({
      EnteredEmail: ({ value }) => [evo(model, { email: () => value }), []],
      EnteredPassword: ({ value }) => [evo(model, { password: () => value }), []],
      // TODO: Replace this with real backend authentication. For now any
      // credentials (including empty ones) are accepted.
      // Kick off the Players/Clubs/Nationals fetches the first time we land
      // on the dashboard.
      ClickedSignIn: () => {
        // Kick off every still-idle fetch, and flip each of those requests to
        // 'loading' in one evolve. `start` leaves an already-running or done
        // request untouched, so the model transform mirrors the command list.
        const commands: Array<Command.Command<Message>> = [];
        if (model.playersRequest === 'idle')
          commands.push(FetchPlayers({ page: model.playersPage }));
        if (model.clubsRequest === 'idle') commands.push(FetchClubs());
        if (model.nationalsRequest === 'idle') commands.push(FetchNationals());
        if (model.competitionsRequest === 'idle') commands.push(FetchCompetitions());
        if (model.editionsRequest === 'idle') commands.push(FetchEditions());
        if (model.associationsRequest === 'idle') commands.push(FetchAssociations());
        if (model.participationsRequest === 'idle') commands.push(FetchParticipations());
        commands.push(FetchHealth());
        const start = (status: RequestStatus): RequestStatus =>
          status === 'idle' ? 'loading' : status;
        return [
          evo(model, {
            signedIn: () => true,
            playersRequest: start,
            clubsRequest: start,
            nationalsRequest: start,
            competitionsRequest: start,
            editionsRequest: start,
            associationsRequest: start,
            participationsRequest: start,
          }),
          commands,
        ];
      },
      ClickedSignOut: () => [initialModel(), []],
      // Switching section closes the mobile nav and drawer, and clears filters.
      SelectedSection: ({ section }) => [
        evo(model, {
          section: () => section,
          showDashboard: () => false,
          menuOpen: () => false,
          search: () => '',
          filters: () => [],
          drawer: () => DrawerClosed.make({}),
          clientPage: () => 1,
          linkError: () => '',
          openFilterColumn: () => -1,
        }),
        [Navigate({ url: sectionRouter({ section }) })],
      ],
      // Back to the dashboard landing page.
      ClickedDashboard: () => [
        evo(model, { showDashboard: () => true, menuOpen: () => false, linkError: () => '' }),
        [Navigate({ url: homeRouter() })],
      ],
      ToggledMenu: () => [evo(model, { menuOpen: (open) => !open }), []],
      EnteredSearch: ({ value }) => [evo(model, { search: () => value, clientPage: () => 1 }), []],
      SelectedFilter: ({ columnIndex, value }) => {
        const filters = [...model.filters];
        filters[columnIndex] = value;
        return [evo(model, { filters: () => filters, clientPage: () => 1 }), []];
      },
      // Opens/closes a checkbox filter's dropdown panel; picking a new one
      // closes whatever else was open.
      ToggledFilterDropdown: ({ columnIndex }) => [
        evo(model, { openFilterColumn: (open) => (open === columnIndex ? -1 : columnIndex) }),
        [],
      ],
      // Flips one value's membership in a checkbox filter's *excluded*
      // (unchecked) set, stored comma-joined in the same `filters[columnIndex]`
      // slot exact-match filters use for a single value. Empty = nothing
      // excluded = all checked (the default).
      ToggledFilterValue: ({ columnIndex, value }) => {
        const current = (model.filters[columnIndex] ?? '').split(',').filter((v) => v !== '');
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        const filters = [...model.filters];
        filters[columnIndex] = next.join(',');
        return [evo(model, { filters: () => filters, clientPage: () => 1 }), []];
      },
      // Open the drawer in creation mode: a blank draft, no existing record.
      ClickedAddNew: () => {
        const columns = sectionData[model.section].columns;
        return [
          evo(model, {
            drawer: () =>
              DrawerCreating.make({ section: model.section, draft: columns.map(() => '') }),
            chartError: () => '',
          }),
          [],
        ];
      },
      // Open the profile drawer with a working copy of the record's values.
      ClickedRecord: ({ section, id }) => {
        const entry = model.rows.find((row) => row.section === section && row.id === id);
        if (!entry) return [model, []];
        return [
          evo(model, {
            drawer: () => editRecord(entry),
            chartError: () => '',
            linkError: () => '',
          }),
          [Navigate({ url: recordRouter({ section, id }) })],
        ];
      },
      EditedField: ({ index, value }) => [
        evo(model, {
          drawer: (drawer) =>
            withDraft(
              drawer,
              draftOf(drawer).map((current, i) => (i === index ? value : current)),
            ),
        }),
        [],
      ],
      // Commit the draft — either creating a new record or updating an
      // existing one (logging which fields changed, for the History tab).
      // Mock only, no backend yet.
      ClickedSaveRecord: () => {
        const drawer = model.drawer;
        if (drawer._tag === 'Creating') {
          const entry: Entry = {
            section: drawer.section,
            values: drawer.draft,
            deleted: false,
            id: `local-${model.nextLocalId}`,
            parentId: '',
          };
          return [
            evo(model, {
              rows: (rows) => [...rows, entry],
              nextLocalId: (n) => n + 1,
              drawer: () => DrawerClosed.make({}),
            }),
            [Navigate({ url: sectionRouter({ section: drawer.section }) })],
          ];
        }
        if (drawer._tag !== 'Editing') return [model, []];
        // Editing commits with a timestamped edit log. The timestamp comes from
        // the clock via StampSave (keeping `update` pure); SavedRecordAt then
        // does the commit with it.
        return [model, [StampSave()]];
      },
      SavedRecordAt: ({ at }) => {
        const drawer = model.drawer;
        if (drawer._tag !== 'Editing') return [model, []];
        const { section, id, draft } = drawer;
        const entry = model.rows.find((row) => row.section === section && row.id === id);
        if (!entry) return [model, []];

        const columns = sectionData[section].columns;
        const changes: ReadonlyArray<LogEntry> = columns.flatMap((field, i) => {
          const from = entry.values[i] ?? '';
          const to = draft[i] ?? '';
          return from === to ? [] : [{ recordId: id, field, from, to, at }];
        });

        const rows = model.rows.map((row) =>
          row.section === section && row.id === id ? evo(row, { values: () => draft }) : row,
        );
        return [
          evo(model, {
            rows: () => rows,
            editLog: (log) => [...changes, ...log],
            drawer: () => DrawerClosed.make({}),
          }),
          [Navigate({ url: sectionRouter({ section }) })],
        ];
      },
      ClickedCloseDrawer: () => [
        evo(model, { drawer: () => DrawerClosed.make({}) }),
        [Navigate({ url: sectionRouter({ section: model.section }) })],
      ],
      SelectedDrawerTab: ({ tab }) => [
        evo(model, {
          drawer: (drawer) =>
            drawer._tag === 'Editing' ? evo(drawer, { tab: () => tab }) : drawer,
        }),
        [],
      ],
      ClickedDeleteRecord: () => [
        evo(model, {
          drawer: (drawer) =>
            drawer._tag === 'Editing' ? evo(drawer, { confirmingDelete: () => true }) : drawer,
        }),
        [],
      ],
      ClickedCancelDelete: () => [
        evo(model, {
          drawer: (drawer) =>
            drawer._tag === 'Editing' ? evo(drawer, { confirmingDelete: () => false }) : drawer,
        }),
        [],
      ],
      // Soft-delete: mark the record and close the drawer (mock — no backend yet).
      ClickedConfirmDelete: () => {
        const drawer = model.drawer;
        if (drawer._tag !== 'Editing') return [model, []];
        const { section, id } = drawer;
        const rows = model.rows.map((row) =>
          row.section === section && row.id === id ? evo(row, { deleted: () => true }) : row,
        );
        return [
          evo(model, { rows: () => rows, drawer: () => DrawerClosed.make({}) }),
          [Navigate({ url: sectionRouter({ section }) })],
        ];
      },
      // Once a chart's host element is mounted, push the current record's
      // data into it (mirrors Foldkit's charting example: Mount only creates
      // the chart instance, Command feeds it data). Two hosts share this
      // message — branch on which one just mounted.
      SucceededMountChart: ({ hostId }) => {
        const entry = drawerRecord(model);
        if (!entry) return [evo(model, { chartError: () => '' }), []];
        if (hostId === POINTS_CHART_HOST_ID) {
          return [
            evo(model, { chartError: () => '' }),
            [SyncPointsChart({ hostId, ...pointsFor(entry) })],
          ];
        }
        return [evo(model, { chartError: () => '' }), [SyncChart({ hostId, ...statsFor(entry) })]];
      },
      FailedMountChart: ({ reason }) => [evo(model, { chartError: () => reason }), []],
      CompletedSyncChart: () => [model, []],
      FailedSyncChart: ({ reason }) => [evo(model, { chartError: () => reason }), []],
      // Each page replaces the previous one's rows rather than appending —
      // pagination shows one page of players at a time, not the running total.
      SucceededFetchPlayers: ({ entries, total }) => [
        evo(model, {
          rows: (rows) => [...rows.filter((row) => row.section !== 'players'), ...entries],
          playersRequest: () => 'loaded',
          playersTotal: () => total,
        }),
        [],
      ],
      FailedFetchPlayers: ({ reason }) => [
        evo(model, { playersRequest: () => 'failed', playersError: () => reason }),
        [],
      ],
      ClickedRetryPlayers: () => [
        evo(model, { playersRequest: () => 'loading', playersError: () => '' }),
        [FetchPlayers({ page: model.playersPage }), FetchHealth()],
      ],
      ClickedPlayersPage: ({ page }) => [
        evo(model, { playersRequest: () => 'loading', playersPage: () => page }),
        [FetchPlayers({ page })],
      ],
      ClickedClientPage: ({ page }) => [evo(model, { clientPage: () => page }), []],
      // Replaces rather than appends — otherwise a Refresh (or a record
      // fetched by id just before this resolves) would leave duplicate rows.
      SucceededFetchClubs: ({ entries }) => [
        evo(model, {
          rows: (rows) => [...rows.filter((row) => row.section !== 'clubs'), ...entries],
          clubsRequest: () => 'loaded',
        }),
        [],
      ],
      FailedFetchClubs: ({ reason }) => [
        evo(model, { clubsRequest: () => 'failed', clubsError: () => reason }),
        [],
      ],
      ClickedRetryClubs: () => [
        evo(model, { clubsRequest: () => 'loading', clubsError: () => '' }),
        [FetchClubs(), FetchHealth()],
      ],
      SucceededFetchNationals: ({ entries }) => [
        evo(model, {
          rows: (rows) => [...rows.filter((row) => row.section !== 'nationals'), ...entries],
          nationalsRequest: () => 'loaded',
        }),
        [],
      ],
      FailedFetchNationals: ({ reason }) => [
        evo(model, { nationalsRequest: () => 'failed', nationalsError: () => reason }),
        [],
      ],
      ClickedRetryNationals: () => [
        evo(model, { nationalsRequest: () => 'loading', nationalsError: () => '' }),
        [FetchNationals(), FetchHealth()],
      ],
      SucceededFetchCompetitions: ({ entries }) => [
        evo(model, {
          rows: (rows) =>
            withResolvedEditionCompetitionNames([
              ...rows.filter((row) => row.section !== 'competitions'),
              ...entries,
            ]),
          competitionsRequest: () => 'loaded',
        }),
        [],
      ],
      FailedFetchCompetitions: ({ reason }) => [
        evo(model, { competitionsRequest: () => 'failed', competitionsError: () => reason }),
        [],
      ],
      ClickedRetryCompetitions: () => [
        evo(model, { competitionsRequest: () => 'loading', competitionsError: () => '' }),
        [FetchCompetitions(), FetchHealth()],
      ],
      // The "Competition" column starts as the raw id and gets resolved to a
      // name below by withResolvedEditionCompetitionNames — immediately if
      // Competitions already loaded, otherwise once it does (see
      // SucceededFetchCompetitions, which re-resolves for the reverse race).
      SucceededFetchEditions: ({ editions }) => {
        const entries: ReadonlyArray<Entry> = editions.map((edition) => ({
          section: 'editions' as const,
          id: edition.id,
          deleted: false,
          parentId: edition.competitionId,
          values: editionToRow(edition, edition.competitionId),
        }));
        return [
          evo(model, {
            rows: (rows) =>
              withResolvedEditionCompetitionNames([
                ...rows.filter((row) => row.section !== 'editions'),
                ...entries,
              ]),
            editionsRequest: () => 'loaded',
          }),
          [],
        ];
      },
      FailedFetchEditions: ({ reason }) => [
        evo(model, { editionsRequest: () => 'failed', editionsError: () => reason }),
        [],
      ],
      ClickedRetryEditions: () => [
        evo(model, { editionsRequest: () => 'loading', editionsError: () => '' }),
        [FetchEditions(), FetchHealth()],
      ],
      SucceededFetchAssociations: ({ entries }) => [
        evo(model, {
          rows: (rows) => [...rows.filter((row) => row.section !== 'associations'), ...entries],
          associationsRequest: () => 'loaded',
        }),
        [],
      ],
      FailedFetchAssociations: ({ reason }) => [
        evo(model, { associationsRequest: () => 'failed', associationsError: () => reason }),
        [],
      ],
      ClickedRetryAssociations: () => [
        evo(model, { associationsRequest: () => 'loading', associationsError: () => '' }),
        [FetchAssociations(), FetchHealth()],
      ],
      SucceededFetchParticipations: ({ participations }) => [
        evo(model, {
          participations: () => participations,
          participationsRequest: () => 'loaded',
        }),
        [],
      ],
      FailedFetchParticipations: ({ reason }) => [
        evo(model, { participationsRequest: () => 'failed', participationsError: () => reason }),
        [],
      ],
      ClickedRetryParticipations: () => [
        evo(model, { participationsRequest: () => 'loading', participationsError: () => '' }),
        [FetchParticipations(), FetchHealth()],
      ],
      SucceededFetchHealth: () => [evo(model, { serverHealth: () => 'ok' }), []],
      FailedFetchHealth: () => [evo(model, { serverHealth: () => 'down' }), []],
      // Internal anchor clicks (e.g. the decorative "Forgot password?" link)
      // navigate within the app; anything else is a real page load.
      ClickedLink: ({ request }) =>
        M.value(request).pipe(
          M.withReturnType<readonly [Model, ReadonlyArray<Command.Command<Message>>]>(),
          M.tagsExhaustive({
            Internal: ({ url }) => [model, [Navigate({ url: urlToString(url) })]],
            External: ({ href }) => [model, [Load({ href })]],
          }),
        ),
      // Fires on browser back/forward (pushUrl from our own Navigate command
      // updates the model directly instead, so this only reacts to real
      // navigation).
      ChangedUrl: ({ url }) => applyRoute(model, urlToAppRoute(url)),
      CompletedNavigate: () => [model, []],
      CompletedLoad: () => [model, []],
      // The record wasn't in the currently loaded list, so it was fetched
      // directly by id — open its drawer now that we have it.
      SucceededFetchTeamById: ({ entry }) => [
        evo(model, {
          rows: (rows) => upsertEntry(rows, entry),
          drawer: () => editRecord(entry),
          chartError: () => '',
          linkError: () => '',
        }),
        [],
      ],
      FailedFetchTeamById: ({ reason }) => [evo(model, { linkError: () => reason }), []],
    }),
  );

// INIT

export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) =>
  applyRoute(initialModel(), urlToAppRoute(url));

// MENU

interface MenuLeaf {
  readonly section: Section;
  readonly label: string;
}

interface MenuGroup {
  readonly label: string;
  readonly items: ReadonlyArray<MenuLeaf>;
}

type MenuNode = { readonly group: MenuGroup } | { readonly leaf: MenuLeaf };

const menu: ReadonlyArray<MenuNode> = [
  { leaf: { section: 'players', label: 'Players' } },
  {
    group: {
      label: 'Teams',
      items: [
        { section: 'clubs', label: 'Clubs' },
        { section: 'nationals', label: 'Nationals' },
      ],
    },
  },
  {
    group: {
      label: 'Tournaments',
      items: [
        { section: 'competitions', label: 'Competitions' },
        { section: 'editions', label: 'Editions' },
      ],
    },
  },
  { leaf: { section: 'associations', label: 'Associations' } },
];

const sectionLabels: Record<Section, string> = {
  players: 'Players',
  clubs: 'Clubs',
  nationals: 'Nationals',
  competitions: 'Competitions',
  editions: 'Editions',
  associations: 'Associations',
};

// Singular form for the drawer header's type pill, e.g. "Klára Nováková (Player)".
const sectionSingularLabels: Record<Section, string> = {
  players: 'Player',
  clubs: 'Club',
  nationals: 'National',
  competitions: 'Competition',
  editions: 'Edition',
  associations: 'Association',
};

// Country/Nationality render their value as a flag (in the card pill and the
// drawer's Overview summary) rather than the raw code.
const flagColumns = new Set(['Country', 'Nationality']);

// These get a From/To date-range filter instead of an exact-match dropdown —
// filtering an ISO date by exact value isn't useful.
const dateColumns = new Set(['Established', 'Date of birth', 'Starts on', 'Ends on']);

// These get a checkbox dropdown (multiple values at once) instead of the
// default single-value exact-match dropdown.
const checkboxColumns = new Set([
  'Country',
  'Nationality',
  'Team kind',
  'Club',
  'Position',
  'Sex',
  'Competition',
  'Kind',
]);

const countryFlags: Record<string, string> = {
  AUT: '🇦🇹',
  CZE: '🇨🇿',
  GER: '🇩🇪',
  POL: '🇵🇱',
  SVK: '🇸🇰',
};

// Full country names for labels; the stored/filtered value stays the code.
const countryNames: Record<string, string> = {
  AUT: 'Austria',
  CZE: 'Czechia',
  GER: 'Germany',
  POL: 'Poland',
  SVK: 'Slovakia',
};

interface Table {
  // columns[0] is the entry title; columns[1..] each get their own dropdown filter.
  readonly columns: ReadonlyArray<string>;
}

// Every section is backed by the real API — see the FetchX commands below.
// Data starts empty and is fetched at sign-in; only column layout lives here.
const sectionData: Record<Section, Table> = {
  players: { columns: playerColumns },
  clubs: { columns: teamColumns },
  nationals: { columns: teamColumns },
  competitions: { columns: competitionColumns },
  editions: { columns: editionColumns },
  associations: { columns: associationColumns },
};

const sectionOrder: ReadonlyArray<Section> = [
  'players',
  'clubs',
  'nationals',
  'competitions',
  'editions',
  'associations',
];

// CHART
//
// A small bar chart of mock "season stats" for the Overview tab. Values are
// derived deterministically from the record's own fields, so the same record
// always shows the same numbers without needing real data.

const metricsBySection: Record<Section, ReadonlyArray<string>> = {
  players: ['Matches', 'Goals', 'Assists'],
  clubs: ['Matches', 'Wins', 'Draws'],
  nationals: ['Matches', 'Wins', 'Draws'],
  competitions: ['Teams', 'Rounds', 'Matches'],
  editions: ['Matches', 'Teams', 'Goals'],
  associations: ['Members', 'Competitions', 'Years active'],
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const statsFor = (
  entry: Entry,
): { title: string; categories: ReadonlyArray<string>; values: ReadonlyArray<number> } => {
  const seed = hashString(entry.values.join('|'));
  const categories = metricsBySection[entry.section];
  const values = categories.map((_, index) => 5 + ((seed >> (index * 4)) % 40));
  return { title: 'Season stats', categories, values };
};

const MATCHDAYS = 10;

// A cumulative points-over-time series for team records (Clubs/Nationals),
// derived deterministically from the entry — same win/draw/loss shape every
// time, no real match results yet.
const pointsFor = (
  entry: Entry,
): { title: string; weeks: ReadonlyArray<string>; points: ReadonlyArray<number> } => {
  const seed = hashString(`points:${entry.values.join('|')}`);
  let cumulative = 0;
  const weeks: Array<string> = [];
  const points: Array<number> = [];
  for (let matchday = 0; matchday < MATCHDAYS; matchday++) {
    const roll = (seed >> (matchday * 3)) % 10;
    const result = roll < 4 ? 3 : roll < 7 ? 1 : 0; // win : draw : loss
    cumulative += result;
    weeks.push(`MD${matchday + 1}`);
    points.push(cumulative);
  }
  return { title: 'Points over time', weeks, points };
};

export const CHART_HOST_ID = 'studio-record-chart';
export const POINTS_CHART_HOST_ID = 'studio-record-points-chart';

// Mounts an ECharts instance into the host element and tears it down when the
// element is removed (e.g. switching drawer tabs or closing the drawer).
export const MountChart = Mount.define(
  'MountChart',
  { hostId: S.String },
  SucceededMountChart,
  FailedMountChart,
)(
  ({ hostId }) =>
    (element) =>
      Effect.gen(function* () {
        if (!(element instanceof HTMLElement)) {
          return FailedMountChart({ reason: 'Chart host is not an HTMLElement.' });
        }

        return yield* Effect.acquireRelease(
          Effect.try({
            try: () => {
              const chart = echarts.init(element, undefined, { renderer: 'canvas' });
              const resizeObserver = new ResizeObserver(() => chart.resize());
              resizeObserver.observe(element);
              setChart(hostId, chart);
              return resizeObserver;
            },
            catch: (error) =>
              error instanceof Error ? error : new Error(`Failed to mount chart: ${error}`),
          }),
          (resizeObserver) =>
            Effect.sync(() => {
              resizeObserver.disconnect();
              removeChart(hostId);
            }),
        ).pipe(
          Effect.map(() => SucceededMountChart({ hostId })),
          Effect.catch((error) => Effect.succeed(FailedMountChart({ reason: error.message }))),
        );
      }),
);

// Pushes the given stats into an already-mounted chart instance.
export const SyncChart = Command.define(
  'SyncChart',
  {
    hostId: S.String,
    title: S.String,
    categories: S.Array(S.String),
    values: S.Array(S.Number),
  },
  CompletedSyncChart,
  FailedSyncChart,
)((args) =>
  Effect.sync(() => {
    const maybeChart = getChart(args.hostId);
    if (Option.isNone(maybeChart)) {
      return FailedSyncChart({ reason: `No live chart for hostId ${args.hostId}.` });
    }
    try {
      maybeChart.value.setOption(makeStatsOption(args), true);
      return CompletedSyncChart();
    } catch (error) {
      return FailedSyncChart({
        reason: error instanceof Error ? error.message : `${error}`,
      });
    }
  }),
);

// Same shape as SyncChart but for the points-over-time line chart, shown
// only for team records (Clubs/Nationals) — see POINTS_CHART_HOST_ID.
export const SyncPointsChart = Command.define(
  'SyncPointsChart',
  {
    hostId: S.String,
    title: S.String,
    weeks: S.Array(S.String),
    points: S.Array(S.Number),
  },
  CompletedSyncChart,
  FailedSyncChart,
)((args) =>
  Effect.sync(() => {
    const maybeChart = getChart(args.hostId);
    if (Option.isNone(maybeChart)) {
      return FailedSyncChart({ reason: `No live chart for hostId ${args.hostId}.` });
    }
    try {
      maybeChart.value.setOption(makePointsOption(args), true);
      return CompletedSyncChart();
    } catch (error) {
      return FailedSyncChart({
        reason: error instanceof Error ? error.message : `${error}`,
      });
    }
  }),
);

// Fetches one page of the real player roster and maps it into `Entry` rows.
// Every other section (see below) fetches everything at once — theirs
// aren't paginated.
export const FetchPlayers = Command.define(
  'FetchPlayers',
  { page: S.Number },
  SucceededFetchPlayers,
  FailedFetchPlayers,
)((args) =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(playersUrl(args.page));
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }
      const json: unknown = await response.json();
      return S.decodeUnknownSync(PlayersPage)(json);
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error))),
  }).pipe(
    Effect.map((page) =>
      SucceededFetchPlayers({
        entries: page.items.map((player) => ({
          section: 'players' as const,
          id: player.id,
          deleted: false,
          parentId: '',
          values: playerToRow(player),
        })),
        total: page.total,
      }),
    ),
    Effect.catch((error) => Effect.succeed(FailedFetchPlayers({ reason: error.message }))),
  ),
);

// Fetches teams filtered by kind and maps them into `Entry` rows for the
// given section. Clubs and Nationals both use this — same backend shape,
// different `kind` query param. Only the fetch/parse/map is shared; each
// Command below wraps the result in its own success/failure message so the
// types line up with what `Command.define` expects.
const fetchTeamEntries = (
  kind: 'CLUB' | 'NATIONAL',
  section: 'clubs' | 'nationals',
): Effect.Effect<ReadonlyArray<Entry>, Error> =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(teamsUrl(kind));
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }
      const json: unknown = await response.json();
      return S.decodeUnknownSync(TeamsResponse)(json);
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error))),
  }).pipe(
    Effect.map((teams) =>
      teams.map((team) => ({
        section,
        id: team.id,
        deleted: false,
        parentId: '',
        values: teamToRow(team),
      })),
    ),
  );

export const FetchClubs = Command.define(
  'FetchClubs',
  SucceededFetchClubs,
  FailedFetchClubs,
)(
  fetchTeamEntries('CLUB', 'clubs').pipe(
    Effect.map((entries) => SucceededFetchClubs({ entries })),
    Effect.catch((error) => Effect.succeed(FailedFetchClubs({ reason: error.message }))),
  ),
);

export const FetchNationals = Command.define(
  'FetchNationals',
  SucceededFetchNationals,
  FailedFetchNationals,
)(
  fetchTeamEntries('NATIONAL', 'nationals').pipe(
    Effect.map((entries) => SucceededFetchNationals({ entries })),
    Effect.catch((error) => Effect.succeed(FailedFetchNationals({ reason: error.message }))),
  ),
);

// Fetches every competition in one request (this endpoint isn't paginated).
export const FetchCompetitions = Command.define(
  'FetchCompetitions',
  SucceededFetchCompetitions,
  FailedFetchCompetitions,
)(
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(competitionsUrl());
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }
      const json: unknown = await response.json();
      return S.decodeUnknownSync(CompetitionsResponse)(json);
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error))),
  }).pipe(
    Effect.map((competitions) =>
      SucceededFetchCompetitions({
        entries: competitions.map((competition) => ({
          section: 'competitions' as const,
          id: competition.id,
          deleted: false,
          parentId: '',
          values: competitionToRow(competition),
        })),
      }),
    ),
    Effect.catch((error) => Effect.succeed(FailedFetchCompetitions({ reason: error.message }))),
  ),
);

// Fetches every edition across all competitions in one request (this
// endpoint isn't paginated). Returns the raw parsed editions rather than
// Entry rows — see SucceededFetchEditions for why.
export const FetchEditions = Command.define(
  'FetchEditions',
  SucceededFetchEditions,
  FailedFetchEditions,
)(
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(editionsUrl());
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }
      const json: unknown = await response.json();
      return S.decodeUnknownSync(EditionsResponse)(json);
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error))),
  }).pipe(
    Effect.map((editions) => SucceededFetchEditions({ editions })),
    Effect.catch((error) => Effect.succeed(FailedFetchEditions({ reason: error.message }))),
  ),
);

// Fetches every team/edition pairing in one request (this endpoint isn't
// paginated) — used only to resolve an edition's participating teams.
export const FetchParticipations = Command.define(
  'FetchParticipations',
  SucceededFetchParticipations,
  FailedFetchParticipations,
)(
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(participationsUrl());
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }
      const json: unknown = await response.json();
      return S.decodeUnknownSync(ParticipationsResponse)(json);
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error))),
  }).pipe(
    Effect.map((participations) => SucceededFetchParticipations({ participations })),
    Effect.catch((error) => Effect.succeed(FailedFetchParticipations({ reason: error.message }))),
  ),
);

// Fetches every association in one request (this endpoint isn't paginated).
export const FetchAssociations = Command.define(
  'FetchAssociations',
  SucceededFetchAssociations,
  FailedFetchAssociations,
)(
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(associationsUrl());
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }
      const json: unknown = await response.json();
      return S.decodeUnknownSync(AssociationsResponse)(json);
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error))),
  }).pipe(
    Effect.map((associations) =>
      SucceededFetchAssociations({
        entries: associations.map((association) => ({
          section: 'associations' as const,
          id: association.id,
          deleted: false,
          parentId: '',
          values: associationToRow(association),
        })),
      }),
    ),
    Effect.catch((error) => Effect.succeed(FailedFetchAssociations({ reason: error.message }))),
  ),
);

// Whether the backend is up at all — drives the diode on every API-backed
// section's Refresh button (see serverHealth on the Model).
export const FetchHealth = Command.define(
  'FetchHealth',
  SucceededFetchHealth,
  FailedFetchHealth,
)(
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(healthUrl());
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }
      const json: unknown = await response.json();
      S.decodeUnknownSync(HealthResponse)(json);
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error))),
  }).pipe(
    Effect.map(() => SucceededFetchHealth()),
    Effect.catch((error) => Effect.succeed(FailedFetchHealth({ reason: error.message }))),
  ),
);

// Reads the wall clock (through Effect's Clock, so it's swappable in tests) and
// hands the formatted timestamp back as SavedRecordAt — the record commit needs
// a timestamp for its edit log, and this keeps `new Date()` out of `update`.
export const StampSave = Command.define(
  'StampSave',
  SavedRecordAt,
)(
  Clock.currentTimeMillis.pipe(
    Effect.map((millis) => SavedRecordAt({ at: new Date(millis).toLocaleString('en-US') })),
  ),
);

// ROUTING
//
// Navigate/Load are the two effects any URL change eventually goes through:
// Navigate updates the address bar for in-app moves (record opened/closed,
// section switched), Load is a real page navigation for external links.

export const Navigate = Command.define(
  'Navigate',
  { url: S.String },
  CompletedNavigate,
)(({ url }) => pushUrl(url).pipe(Effect.as(CompletedNavigate())));

export const Load = Command.define(
  'Load',
  { href: S.String },
  CompletedLoad,
)(({ href }) => load(href).pipe(Effect.as(CompletedLoad())));

// Resolves a single team by id (GET /teams/{id}) when a shared record link
// points at a team that isn't already in the loaded list.
export const FetchTeamById = Command.define(
  'FetchTeamById',
  { section: S.Literals(['clubs', 'nationals']), id: S.String },
  SucceededFetchTeamById,
  FailedFetchTeamById,
)((args) =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(teamByIdUrl(args.id));
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }
      const json: unknown = await response.json();
      return S.decodeUnknownSync(S.NullOr(TeamResponse))(json);
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error))),
  }).pipe(
    Effect.map((team) =>
      team === null
        ? FailedFetchTeamById({ reason: 'This team no longer exists.' })
        : SucceededFetchTeamById({
            entry: {
              section: args.section,
              id: team.id,
              deleted: false,
              parentId: '',
              values: teamToRow(team),
            },
          }),
    ),
    Effect.catch((error) => Effect.succeed(FailedFetchTeamById({ reason: error.message }))),
  ),
);

// VIEW

export const view = (model: Model): Document =>
  model.signedIn ? dashboardView(model) : loginView(model);

const loginView = (model: Model): Document => {
  const h = html<Message>();

  return {
    title: 'Skóreová Studio — Sign in',
    body: h.div(
      [h.Class('relative min-h-screen overflow-hidden')],
      [
        h.img([
          h.Src(loginBackground),
          h.Alt(''),
          h.Class('absolute inset-0 h-full w-full object-cover object-top'),
        ]),
        h.main(
          [
            h.Class(
              'relative flex min-h-screen items-center justify-center p-6 md:justify-start md:pl-[8%]',
            ),
          ],
          [
            h.div(
              [h.Class(cardStyle)],
              [
                h.div(
                  [h.Class('flex items-center justify-between')],
                  [
                    h.span([h.Class('text-lg font-semibold text-white')], ['Skóreová']),
                    h.span([h.Class(chipStyle)], ['Studio']),
                  ],
                ),
                h.h1([h.Class('mt-8 text-3xl font-medium text-white')], ['Sign in']),
                h.div(
                  [h.Class('mt-6 flex flex-col gap-3')],
                  [
                    // The fields carry only a placeholder visually; the real
                    // <label> is sr-only so each is a properly labeled form
                    // control without changing the card's look.
                    Input.view({
                      id: 'signin-email',
                      type: 'email',
                      placeholder: 'email address',
                      value: model.email,
                      onInput: (value) => EnteredEmail({ value }),
                      toView: (attributes) =>
                        h.div(
                          [],
                          [
                            h.label([...attributes.label, h.Class('sr-only')], ['Email address']),
                            h.input([
                              ...attributes.input,
                              h.Name('email'),
                              h.Autocomplete('email'),
                              h.Class(inputStyle),
                            ]),
                          ],
                        ),
                    }),
                    Input.view({
                      id: 'signin-password',
                      type: 'password',
                      placeholder: 'password',
                      value: model.password,
                      onInput: (value) => EnteredPassword({ value }),
                      toView: (attributes) =>
                        h.div(
                          [],
                          [
                            h.label([...attributes.label, h.Class('sr-only')], ['Password']),
                            h.input([
                              ...attributes.input,
                              h.Name('password'),
                              h.Autocomplete('current-password'),
                              h.Class(inputStyle),
                            ]),
                          ],
                        ),
                    }),
                  ],
                ),
                h.a([h.Href('#'), h.Class(forgotStyle)], ['Forgot password?']),
                h.div(
                  [h.Class('mt-8 flex items-end justify-between gap-4')],
                  [
                    h.p(
                      [h.Class('max-w-52 text-xs leading-relaxed text-white/80')],
                      [
                        'The Skóreová editorial workspace. Access is limited to members of the editorial team.',
                      ],
                    ),
                    h.button([h.OnClick(ClickedSignIn()), h.Class(submitStyle)], ['→']),
                  ],
                ),
              ],
            ),
          ],
        ),
      ],
    ),
  };
};

const dashboardView = (model: Model): Document => {
  const h = html<Message>();
  const account = model.email.length > 0 ? model.email : 'editor';

  return {
    title: 'Skóreová Studio — Dashboard',
    body: h.div(
      [h.Class('min-h-screen bg-neutral-100 text-neutral-900')],
      [
        h.header(
          [h.Class(headerStyle)],
          [
            h.div(
              [h.Class('flex items-center gap-3')],
              [
                h.button([h.OnClick(ClickedDashboard()), h.Class(brandButtonStyle)], ['Skóreová']),
                h.span([h.Class(dashboardChipStyle)], ['Studio']),
              ],
            ),
            h.div(
              [h.Class('flex items-center gap-3')],
              [
                h.span(
                  [h.Class('hidden text-sm text-neutral-500 sm:inline')],
                  [`Signed in as ${account}`],
                ),
                h.button([h.OnClick(ClickedSignOut()), h.Class(signOutStyle)], ['Sign out']),
                h.button(
                  [h.OnClick(ToggledMenu()), h.Class(menuToggleStyle)],
                  [model.menuOpen ? '✕' : '☰'],
                ),
              ],
            ),
          ],
        ),
        h.div(
          [
            h.Class(
              'mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:gap-8 md:px-6 md:py-8',
            ),
          ],
          [
            sidebar(model.section, model.menuOpen, model.showDashboard),
            model.showDashboard ? dashboardHome(model) : content(model),
          ],
        ),
        drawer(model),
      ],
    ),
  };
};

const sidebar = (current: Section, open: boolean, showDashboard: boolean): Html => {
  const h = html<Message>();

  const leafItem = (leaf: MenuLeaf): Html =>
    h.button(
      [
        h.OnClick(SelectedSection({ section: leaf.section })),
        h.Class(!showDashboard && leaf.section === current ? navItemActiveStyle : navItemStyle),
      ],
      [leaf.label],
    );

  const node = (entry: MenuNode): Html =>
    'group' in entry
      ? h.div(
          [h.Class('flex flex-col gap-1')],
          [
            h.span([h.Class(navGroupLabelStyle)], [entry.group.label]),
            ...entry.group.items.map(leafItem),
          ],
        )
      : leafItem(entry.leaf);

  const dashboardItem: Html = h.button(
    [h.OnClick(ClickedDashboard()), h.Class(showDashboard ? navItemActiveStyle : navItemStyle)],
    ['Dashboard'],
  );

  return h.nav(
    [h.Class(`${open ? 'flex' : 'hidden'} w-full flex-col gap-6 md:flex md:w-56 md:shrink-0`)],
    [dashboardItem, ...menu.map(node)],
  );
};

// The default landing page right after signing in — an overview of every
// section, each linking straight into its list.
const dashboardHome = (model: Model): Html => {
  const h = html<Message>();
  const account = model.email.length > 0 ? model.email : 'editor';

  const countFor = (section: Section): number =>
    model.rows.filter((row) => row.section === section && !row.deleted).length;

  const card = (section: Section): Html => {
    const count = countFor(section);
    return h.button(
      [h.OnClick(SelectedSection({ section })), h.Class(homeCardStyle)],
      [
        h.span([h.Class(homeCardCountStyle)], [count.toString()]),
        h.span([h.Class(homeCardLabelStyle)], [sectionLabels[section]]),
      ],
    );
  };

  return h.main(
    [h.Class('flex-1')],
    [
      h.h1([h.Class('text-2xl font-medium md:text-3xl')], [`Welcome back, ${account}`]),
      h.p([h.Class('mt-1 text-sm text-neutral-500')], ['Pick a section below to get started.']),
      h.div([h.Class('mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3')], sectionOrder.map(card)),
    ],
  );
};

const content = (model: Model): Html => {
  const h = html<Message>();
  const current = model.section;
  const label = sectionLabels[current];
  const meta = sectionData[current];
  const columns = meta.columns;
  // Every column but the title (index 0) gets its own dropdown filter.
  const filterColumns = columns.map((column, index) => ({ column, index })).slice(1);
  const query = model.search.trim().toLowerCase();

  const entries = model.rows
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.section === current && !entry.deleted);

  const optionsFor = (columnIndex: number) =>
    [...new Set(entries.map(({ entry }) => entry.values[columnIndex] ?? ''))].sort();

  // Date columns encode their filter as "from,to" (either side may be empty)
  // in the same model.filters[index] slot exact-match columns use for a
  // single selected value.
  const visible = entries.filter(({ entry }) => {
    const matchesFilters = filterColumns.every(({ column, index }) => {
      const selected = model.filters[index] ?? '';
      if (selected === '') return true;
      const value = entry.values[index] ?? '';
      if (dateColumns.has(column)) {
        const [from = '', to = ''] = selected.split(',');
        if (from === '' && to === '') return true;
        if (from !== '' && value < from) return false;
        if (to !== '' && value > to) return false;
        return true;
      }
      if (checkboxColumns.has(column)) {
        // Stored value is the *excluded* (unchecked) set; a row passes unless
        // its value is in it.
        return !selected.split(',').includes(value);
      }
      return value === selected;
    });
    const matchesQuery =
      query === '' || entry.values.some((cell) => cell.toLowerCase().includes(query));
    return matchesFilters && matchesQuery;
  });

  // A two-part pill: the column label on a darker segment, then the value
  // (or its flag) on a lighter one.
  const fieldBadge = (column: string, value: string): Html =>
    h.span(
      [h.Class(pillWrapStyle)],
      [
        h.span([h.Class(pillLabelStyle)], [column]),
        h.span(
          [h.Class(pillValueStyle)],
          [flagColumns.has(column) ? (countryFlags[value] ?? value) : value],
        ),
      ],
    );

  // Keyed by record id so re-sorting under search/filter/pagination patches by
  // identity, not position — otherwise a card's OnClick(ClickedRecord) can end
  // up over a different row.
  const entryCard = ({ entry }: { entry: Entry }): Html =>
    h.keyed('div')(
      entry.id,
      [h.OnClick(ClickedRecord({ section: entry.section, id: entry.id })), h.Class(entryCardStyle)],
      [
        h.span([h.Class('font-medium text-neutral-900')], [entry.values[0] ?? '']),
        h.div(
          [h.Class('mt-1 flex flex-wrap items-center gap-2')],
          columns.slice(1).map((column, i) => fieldBadge(column, entry.values[i + 1] ?? '')),
        ),
      ],
    );

  const filterSelect = (column: string, columnIndex: number): Html => {
    const selected = model.filters[columnIndex] ?? '';

    const option = (optionValue: string, optionLabel: string): Html =>
      h.option([h.Value(optionValue), h.Selected(optionValue === selected)], [optionLabel]);

    return h.select(
      [h.OnChange((value) => SelectedFilter({ columnIndex, value })), h.Class(filterSelectStyle)],
      [
        option('', `All ${column}`),
        ...optionsFor(columnIndex).map((value) => option(value, value)),
      ],
    );
  };

  const filterRange = (column: string, columnIndex: number): Html => {
    const [from = '', to = ''] = (model.filters[columnIndex] ?? '').split(',');

    return h.div(
      [h.Class('flex items-center gap-1')],
      [
        h.input([
          h.Type('date'),
          h.AriaLabel(`${column} from`),
          h.Value(from),
          h.OnInput((value) => SelectedFilter({ columnIndex, value: `${value},${to}` })),
          h.Class(filterSelectStyle),
        ]),
        h.span([h.Class('text-sm text-neutral-400')], ['–']),
        h.input([
          h.Type('date'),
          h.AriaLabel(`${column} to`),
          h.Value(to),
          h.OnInput((value) => SelectedFilter({ columnIndex, value: `${from},${value}` })),
          h.Class(filterSelectStyle),
        ]),
      ],
    );
  };

  const filterCheckbox = (column: string, columnIndex: number): Html => {
    // Stored value is the set of *excluded* (unchecked) values, comma-joined.
    // Empty = nothing excluded = every option checked, which is the default.
    const excludedValues = (model.filters[columnIndex] ?? '').split(',').filter((v) => v !== '');
    const isOpen = model.openFilterColumn === columnIndex;

    return h.div(
      [h.Class('relative')],
      [
        // Label is always just the column name, regardless of what's selected.
        h.button(
          [h.OnClick(ToggledFilterDropdown({ columnIndex })), h.Class(filterSelectStyle)],
          [column],
        ),
        isOpen
          ? h.div(
              [h.Class(filterDropdownPanelStyle)],
              optionsFor(columnIndex).map((value) =>
                h.label(
                  [h.Class(filterDropdownRowStyle)],
                  [
                    h.input([
                      h.Type('checkbox'),
                      h.Checked(!excludedValues.includes(value)),
                      h.OnClick(ToggledFilterValue({ columnIndex, value })),
                    ]),
                    h.span(
                      [],
                      [
                        countryFlags[value]
                          ? `${countryFlags[value]} ${countryNames[value] ?? value}`
                          : value,
                      ],
                    ),
                  ],
                ),
              ),
            )
          : h.div([], []),
      ],
    );
  };

  // Every section is backed by the real API.
  const apiSectionStatus: Partial<
    Record<
      Section,
      { readonly request: RequestStatus; readonly error: string; readonly retry: Message }
    >
  > = {
    players: {
      request: model.playersRequest,
      error: model.playersError,
      retry: ClickedRetryPlayers(),
    },
    clubs: { request: model.clubsRequest, error: model.clubsError, retry: ClickedRetryClubs() },
    nationals: {
      request: model.nationalsRequest,
      error: model.nationalsError,
      retry: ClickedRetryNationals(),
    },
    competitions: {
      request: model.competitionsRequest,
      error: model.competitionsError,
      retry: ClickedRetryCompetitions(),
    },
    editions: {
      request: model.editionsRequest,
      error: model.editionsError,
      retry: ClickedRetryEditions(),
    },
    associations: {
      request: model.associationsRequest,
      error: model.associationsError,
      retry: ClickedRetryAssociations(),
    },
  };
  const status = apiSectionStatus[current];
  const showSkeleton = status?.request === 'loading';

  const skeletonBar = (widthClass: string): Html =>
    h.div([h.Class(`h-3 rounded bg-neutral-200 ${widthClass}`)], []);

  const skeletonCard = (): Html =>
    h.div(
      [h.Class(skeletonCardStyle)],
      [
        skeletonBar('h-4 w-1/3'),
        h.div(
          [h.Class('mt-2 flex flex-wrap gap-x-4 gap-y-1')],
          [skeletonBar('w-20'), skeletonBar('w-24'), skeletonBar('w-16')],
        ),
      ],
    );

  // Players pages server-side (see FetchPlayers), 10 records per request.
  // Every other section fetches its full list and pages through it
  // client-side, 10 records per page, over the already search/filtered list.
  const clientTotalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const clientPage = Math.min(Math.max(1, model.clientPage), clientTotalPages);
  const pageItems =
    current === 'players'
      ? visible
      : visible.slice((clientPage - 1) * PAGE_SIZE, clientPage * PAGE_SIZE);

  const pageButton = (label: string, disabled: boolean, onClick: Message): Html =>
    h.button([h.OnClick(onClick), h.Disabled(disabled), h.Class(paginationButtonStyle)], [label]);

  const pagination = (): Html => {
    if (current === 'players') {
      if (model.playersRequest === 'idle') return h.div([], []);
      const totalPages = Math.max(1, Math.ceil(model.playersTotal / PAGE_SIZE));
      const page = model.playersPage;
      const busy = model.playersRequest === 'loading';

      return h.div(
        [h.Class('mt-6 flex items-center justify-between border-t border-neutral-200 pt-4')],
        [
          h.span(
            [h.Class('text-sm text-neutral-500')],
            [`Page ${page} of ${totalPages} — ${model.playersTotal} total`],
          ),
          h.div(
            [h.Class('flex gap-2')],
            [
              pageButton('Previous', busy || page <= 1, ClickedPlayersPage({ page: page - 1 })),
              pageButton(
                'Next',
                busy || page >= totalPages,
                ClickedPlayersPage({ page: page + 1 }),
              ),
            ],
          ),
        ],
      );
    }

    if (visible.length <= PAGE_SIZE) return h.div([], []);

    return h.div(
      [h.Class('mt-6 flex items-center justify-between border-t border-neutral-200 pt-4')],
      [
        h.span(
          [h.Class('text-sm text-neutral-500')],
          [`Page ${clientPage} of ${clientTotalPages} — ${visible.length} total`],
        ),
        h.div(
          [h.Class('flex gap-2')],
          [
            pageButton('Previous', clientPage <= 1, ClickedClientPage({ page: clientPage - 1 })),
            pageButton(
              'Next',
              clientPage >= clientTotalPages,
              ClickedClientPage({ page: clientPage + 1 }),
            ),
          ],
        ),
      ],
    );
  };

  const sectionStatusBanner = (): Html => {
    if (!status || status.request !== 'failed') return h.div([], []);
    return h.div(
      [
        h.Class(
          'mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3',
        ),
      ],
      [
        h.span(
          [h.Class('text-sm text-rose-700')],
          [`Couldn't load ${label.toLowerCase()}: ${status.error}`],
        ),
        h.button([h.OnClick(status.retry), h.Class(retryButtonStyle)], ['Retry']),
      ],
    );
  };

  // A shared link couldn't resolve its record (e.g. a deleted team, or a
  // player not on the currently loaded page).
  const linkErrorBanner = (): Html => {
    if (model.linkError === '') return h.div([], []);
    return h.div(
      [
        h.Class(
          'mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3',
        ),
      ],
      [
        h.span(
          [h.Class('text-sm text-amber-800')],
          [`Couldn't open the shared link: ${model.linkError}`],
        ),
      ],
    );
  };

  return h.main(
    [h.Class('flex-1')],
    [
      h.div(
        [h.Class('flex items-start justify-between gap-4')],
        [
          h.div(
            [],
            [
              h.h1([h.Class('text-2xl font-medium md:text-3xl')], [label]),
              showSkeleton
                ? h.div([h.Class('mt-2 h-4 w-20 rounded bg-neutral-200')], [])
                : h.p(
                    [h.Class('mt-1 text-sm text-neutral-500')],
                    [`${visible.length} ${visible.length === 1 ? 'entry' : 'entries'}`],
                  ),
            ],
          ),
          h.div(
            [h.Class('flex shrink-0 gap-2')],
            [
              // Only sections backed by the real API have anything to refresh.
              // The left segment is just a health diode (from GET /health) —
              // not clickable; only the label on the right triggers a refetch.
              status
                ? h.div(
                    [h.Class(refreshControlStyle)],
                    [
                      h.span(
                        [
                          h.AriaLabel(
                            model.serverHealth === 'down'
                              ? 'Server unreachable'
                              : 'Server reachable',
                          ),
                          h.Class(`${diodeStyle} ${diodeColorStyle[model.serverHealth]}`),
                        ],
                        [],
                      ),
                      h.button(
                        [
                          h.OnClick(status.retry),
                          h.Disabled(status.request === 'loading'),
                          h.Class(refreshButtonStyle),
                        ],
                        [
                          status.request === 'loading'
                            ? 'Refreshing…'
                            : model.serverHealth === 'down'
                              ? 'Retry'
                              : 'Refresh',
                        ],
                      ),
                    ],
                  )
                : h.div([], []),
              h.button([h.OnClick(ClickedAddNew()), h.Class(addNewStyle)], ['+ Add new']),
            ],
          ),
        ],
      ),
      sectionStatusBanner(),
      linkErrorBanner(),
      // Placeholder-only visually; the real <label> is sr-only so the search
      // field is properly labeled without a visible caption.
      Input.view({
        id: 'section-search',
        type: 'search',
        placeholder: `Search ${label.toLowerCase()}…`,
        value: model.search,
        onInput: (value) => EnteredSearch({ value }),
        toView: (attributes) =>
          h.div(
            [h.Class('mt-6')],
            [
              h.label([...attributes.label, h.Class('sr-only')], [`Search ${label}`]),
              h.input([...attributes.input, h.Class(searchInputStyle)]),
            ],
          ),
      }),
      h.div(
        [h.Class('mt-3 flex flex-wrap gap-2')],
        filterColumns.map(({ column, index }) => {
          if (dateColumns.has(column)) return filterRange(column, index);
          if (checkboxColumns.has(column)) return filterCheckbox(column, index);
          return filterSelect(column, index);
        }),
      ),
      showSkeleton
        ? h.div(
            [h.Class('mt-6 flex flex-col gap-2')],
            Array.from({ length: 5 }, () => skeletonCard()),
          )
        : pageItems.length > 0
          ? h.div([h.Class('mt-6 flex flex-col gap-2')], pageItems.map(entryCard))
          : h.p([h.Class('mt-6 text-sm text-neutral-500')], ['No matches.']),
      pagination(),
    ],
  );
};

// The profile drawer slides in from the right, on top of everything. It is
// always mounted so the open/close transform can animate; its content renders
// only while a record is open.
const drawerTabs: ReadonlyArray<{ readonly tab: DrawerTab; readonly label: string }> = [
  { tab: 'overview', label: 'Overview' },
  { tab: 'persistency', label: 'Persistency' },
  { tab: 'history', label: 'History' },
];

const drawer = (model: Model): Html => {
  const h = html<Message>();
  const drawerState = model.drawer;
  const open = drawerState._tag !== 'Closed';
  const creating = drawerState._tag === 'Creating';
  // The record being edited, resolved by id (undefined while creating/closed
  // or if it has since gone).
  const entry = drawerRecord(model);
  const draft = draftOf(drawerState);
  const tab = drawerState._tag === 'Editing' ? drawerState.tab : 'overview';
  const confirmingDelete = drawerState._tag === 'Editing' ? drawerState.confirmingDelete : false;
  const editingId = drawerState._tag === 'Editing' ? drawerState.id : '';
  // The section this drawer is scoped to: the record's own section when
  // editing, or the target section when creating a new one.
  const drawerSection = drawerState._tag === 'Closed' ? undefined : drawerState.section;
  const columns = drawerSection ? sectionData[drawerSection].columns : [];

  const field = (column: string, index: number): Html =>
    h.label(
      [h.Class('flex flex-col gap-1')],
      [
        h.span([h.Class('text-sm font-medium text-neutral-700')], [column]),
        h.input([
          h.Type('text'),
          h.Value(draft[index] ?? ''),
          h.OnInput((value) => EditedField({ index, value })),
          h.Class(drawerInputStyle),
        ]),
      ],
    );

  const overviewTab = (): Html => {
    if (!entry) return h.div([], []);
    const isTeam = entry.section === 'clubs' || entry.section === 'nationals';
    const isCompetition = entry.section === 'competitions';
    const isEdition = entry.section === 'editions';

    // A competition's own editions, each opening its own drawer on click.
    const editionsList = (): Html => {
      if (!isCompetition) return h.div([], []);
      const editions = model.rows.filter(
        (row) => row.section === 'editions' && row.parentId === entry.id && !row.deleted,
      );

      return h.div(
        [h.Class('flex flex-col gap-2')],
        [
          h.span([h.Class('text-sm font-medium text-neutral-700')], ['Editions']),
          editions.length > 0
            ? h.div(
                [h.Class('flex flex-col gap-2')],
                editions.map((row) =>
                  h.keyed('div')(
                    row.id,
                    [
                      h.OnClick(ClickedRecord({ section: row.section, id: row.id })),
                      h.Class(entryCardStyle),
                    ],
                    [h.span([h.Class('font-medium text-neutral-900')], [row.values[0] ?? ''])],
                  ),
                ),
              )
            : h.p([h.Class('text-sm text-neutral-500')], ['No editions yet.']),
        ],
      );
    };

    // An edition's participating teams (Clubs/Nationals), resolved via
    // GET /participations — a join with no display fields of its own.
    const participatingTeamsList = (): Html => {
      if (!isEdition) return h.div([], []);

      if (model.participationsRequest === 'failed') {
        return h.div(
          [h.Class('flex flex-col gap-2')],
          [
            h.span([h.Class('text-sm font-medium text-neutral-700')], ['Teams']),
            h.div(
              [h.Class('flex flex-wrap items-center gap-3 text-sm text-rose-700')],
              [
                h.span([], [`Couldn't load teams: ${model.participationsError}`]),
                h.button(
                  [h.OnClick(ClickedRetryParticipations()), h.Class(retryButtonStyle)],
                  ['Retry'],
                ),
              ],
            ),
          ],
        );
      }

      if (model.participationsRequest === 'loading' || model.participationsRequest === 'idle') {
        return h.div(
          [h.Class('flex flex-col gap-2')],
          [
            h.span([h.Class('text-sm font-medium text-neutral-700')], ['Teams']),
            h.p([h.Class('text-sm text-neutral-500')], ['Loading teams…']),
          ],
        );
      }

      const teamIds = new Set(
        model.participations
          .filter((participation) => participation.editionId === entry.id)
          .map((participation) => participation.teamId),
      );
      const teams = model.rows.filter(
        (row) =>
          (row.section === 'clubs' || row.section === 'nationals') &&
          teamIds.has(row.id) &&
          !row.deleted,
      );

      return h.div(
        [h.Class('flex flex-col gap-2')],
        [
          h.span([h.Class('text-sm font-medium text-neutral-700')], ['Teams']),
          teams.length > 0
            ? h.div(
                [h.Class('flex flex-col gap-2')],
                teams.map((row) =>
                  h.keyed('div')(
                    row.id,
                    [
                      h.OnClick(ClickedRecord({ section: row.section, id: row.id })),
                      h.Class(entryCardStyle),
                    ],
                    [h.span([h.Class('font-medium text-neutral-900')], [row.values[0] ?? ''])],
                  ),
                ),
              )
            : h.p([h.Class('text-sm text-neutral-500')], ['No teams yet.']),
        ],
      );
    };

    return h.div(
      [h.Class('flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6')],
      [
        // Keyed by record id so opening a different record from an already-open
        // drawer tears the host down and remounts it — OnMount refires, and the
        // new record's data is synced in (an unkeyed host would keep the prior
        // record's chart, since OnMount only fires once per element).
        h.keyed('div')(
          `chart-${entry.id}`,
          [
            h.OnMount(MountChart({ hostId: CHART_HOST_ID })),
            h.AriaLabel('Record stats chart'),
            h.Class('h-56 w-full'),
          ],
          [],
        ),
        // Points-over-time only makes sense for a team's league campaign.
        isTeam
          ? h.keyed('div')(
              `points-${entry.id}`,
              [
                h.OnMount(MountChart({ hostId: POINTS_CHART_HOST_ID })),
                h.AriaLabel('Points over time chart'),
                h.Class('h-56 w-full'),
              ],
              [],
            )
          : h.div([], []),
        model.chartError === ''
          ? h.div([], [])
          : h.p([h.Class('text-xs text-rose-600')], [model.chartError]),
        h.div(
          [h.Class('flex flex-col gap-2')],
          columns.map((column, index) => {
            const value = entry.values[index] ?? '';
            return h.div(
              [
                h.Class(
                  'flex items-center justify-between border-b border-neutral-100 py-2 text-sm',
                ),
              ],
              [
                h.span([h.Class('text-neutral-500')], [column]),
                h.span(
                  [h.Class('font-medium text-neutral-900')],
                  [flagColumns.has(column) ? (countryFlags[value] ?? value) : value],
                ),
              ],
            );
          }),
        ),
        editionsList(),
        participatingTeamsList(),
      ],
    );
  };

  const dangerZone = (): Html =>
    h.div(
      [h.Class('mt-2 rounded-lg border border-rose-200 bg-rose-50 p-4')],
      [
        h.span([h.Class('text-sm font-semibold text-rose-900')], ['Danger zone']),
        h.p(
          [h.Class('mt-1 text-sm text-rose-700')],
          ['Deleting this record removes it from the list. This cannot be undone.'],
        ),
        confirmingDelete
          ? h.div(
              [h.Class('mt-3 flex items-center gap-3')],
              [
                h.span([h.Class('text-sm font-medium text-rose-900')], ['Delete this record?']),
                h.button(
                  [h.OnClick(ClickedConfirmDelete()), h.Class(dangerConfirmStyle)],
                  ['Yes, delete'],
                ),
                h.button(
                  [h.OnClick(ClickedCancelDelete()), h.Class(dangerCancelStyle)],
                  ['Cancel'],
                ),
              ],
            )
          : h.button(
              [h.OnClick(ClickedDeleteRecord()), h.Class(dangerButtonStyle)],
              ['Delete record'],
            ),
      ],
    );

  const persistencyTab = (): Html =>
    h.div(
      [h.Class('flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6')],
      [...columns.map(field), dangerZone()],
    );

  const historyTab = (): Html => {
    const changes = model.editLog.filter((change) => change.recordId === editingId);

    const changeCard = (change: LogEntry): Html =>
      h.div(
        [h.Class('rounded-lg border border-neutral-200 px-3 py-2 text-sm')],
        [
          h.div(
            [h.Class('flex items-center justify-between')],
            [
              h.span([h.Class('font-medium text-neutral-900')], [change.field]),
              h.span([h.Class('text-xs text-neutral-400')], [change.at]),
            ],
          ),
          h.div(
            [h.Class('mt-1 text-neutral-500')],
            [`${change.from === '' ? '—' : change.from} → ${change.to === '' ? '—' : change.to}`],
          ),
        ],
      );

    return h.div(
      [h.Class('flex flex-1 flex-col gap-2 overflow-y-auto px-6 py-6')],
      changes.length > 0
        ? changes.map(changeCard)
        : [h.p([h.Class('text-sm text-neutral-500')], ['No changes yet.'])],
    );
  };

  const tabContent = (): Html =>
    M.value(tab).pipe(
      M.when('overview', overviewTab),
      M.when('persistency', persistencyTab),
      M.when('history', historyTab),
      M.exhaustive,
    );

  const tabButton = ({ tab: buttonTab, label }: { tab: DrawerTab; label: string }): Html =>
    h.button(
      [
        h.OnClick(SelectedDrawerTab({ tab: buttonTab })),
        h.Class(tab === buttonTab ? drawerTabActiveStyle : drawerTabStyle),
      ],
      [label],
    );

  const panel: ReadonlyArray<Html> =
    open && drawerSection
      ? [
          h.div(
            [h.Class('flex items-start justify-between border-b border-neutral-200 px-6 py-4')],
            [
              h.h2(
                [h.Class('flex items-center gap-2 text-lg font-semibold text-neutral-900')],
                [
                  creating ? `New ${sectionSingularLabels[drawerSection]}` : (draft[0] ?? ''),
                  h.span([h.Class(drawerTypePillStyle)], [sectionSingularLabels[drawerSection]]),
                ],
              ),
              h.button([h.OnClick(ClickedCloseDrawer()), h.Class(drawerCloseStyle)], ['✕']),
            ],
          ),
          // Creating a new record skips Overview/History (nothing to show yet)
          // and the tab bar entirely — just the fields to fill in.
          ...(creating
            ? [
                h.div(
                  [h.Class('flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6')],
                  columns.map(field),
                ),
              ]
            : [
                h.nav(
                  [h.Class('flex gap-1 border-b border-neutral-200 px-6 pt-3')],
                  drawerTabs.map(tabButton),
                ),
                tabContent(),
              ]),
          h.div(
            [h.Class('flex justify-end gap-3 border-t border-neutral-200 px-6 py-4')],
            [
              h.button([h.OnClick(ClickedCloseDrawer()), h.Class(drawerCancelStyle)], ['Cancel']),
              h.button([h.OnClick(ClickedSaveRecord()), h.Class(drawerSaveStyle)], ['Save']),
            ],
          ),
        ]
      : [];

  return h.div(
    [h.Class('contents')],
    [
      h.div(
        [
          h.OnClick(ClickedCloseDrawer()),
          h.Class(
            `fixed inset-0 z-40 bg-black/30 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`,
          ),
        ],
        [],
      ),
      h.aside(
        [
          h.Class(
            `fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`,
          ),
        ],
        panel,
      ),
    ],
  );
};

// STYLE

const cardStyle =
  'w-full max-w-md rounded-3xl border border-white/30 bg-white/15 p-8 shadow-2xl backdrop-blur-xl';

const chipStyle = 'rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-sm text-white';

const inputStyle =
  'w-full rounded-full border border-white/30 bg-white/25 px-5 py-3 text-white placeholder-white/70 outline-none transition focus:border-white/60 focus:bg-white/35';

const forgotStyle =
  'mt-4 inline-block text-sm text-white/90 underline underline-offset-4 hover:text-white';

const submitStyle =
  'flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-neutral-950 text-xl text-white transition hover:bg-neutral-800 disabled:opacity-60';

const headerStyle =
  'flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4';

const dashboardChipStyle =
  'rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600';

const brandButtonStyle = 'cursor-pointer text-lg font-semibold text-neutral-900';

const signOutStyle =
  'cursor-pointer rounded-full bg-neutral-950 px-4 py-2 text-sm text-white transition hover:bg-neutral-800';

const menuToggleStyle =
  'cursor-pointer rounded-full border border-neutral-300 px-3 py-2 text-sm leading-none text-neutral-700 transition hover:bg-neutral-100 md:hidden';

const navGroupLabelStyle = 'px-3 text-xs font-semibold uppercase tracking-wide text-neutral-400';

const navItemStyle =
  'cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-200';

const navItemActiveStyle =
  'cursor-pointer rounded-lg bg-neutral-900 px-3 py-2 text-left text-sm font-medium text-white';

const homeCardStyle =
  'flex cursor-pointer flex-col items-start gap-1 rounded-2xl border border-neutral-200 bg-white p-5 text-left transition hover:border-neutral-400';

const homeCardCountStyle = 'text-3xl font-semibold text-neutral-900';

const homeCardLabelStyle = 'text-sm text-neutral-500';

const entryCardStyle =
  'cursor-pointer rounded-xl border border-neutral-200 bg-white px-4 py-3 transition hover:border-neutral-400';

const pillWrapStyle = 'inline-flex items-stretch overflow-hidden rounded-full text-xs';

const pillLabelStyle =
  'flex items-center bg-neutral-200 px-2.5 py-0.5 font-medium uppercase tracking-wide text-neutral-600';

const pillValueStyle = 'flex items-center bg-neutral-100 px-2.5 py-0.5 text-neutral-700';

const skeletonCardStyle = 'animate-pulse rounded-xl border border-neutral-200 bg-white px-4 py-3';

const addNewStyle =
  'shrink-0 cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800';

const refreshControlStyle =
  'flex items-stretch overflow-hidden rounded-lg border border-neutral-300 bg-white';

const diodeStyle = 'w-2.5 shrink-0';

const diodeColorStyle: Record<Model['serverHealth'], string> = {
  unknown: 'bg-neutral-300',
  ok: 'bg-emerald-500',
  down: 'bg-rose-500',
};

const refreshButtonStyle =
  'cursor-pointer px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50';

const retryButtonStyle =
  'cursor-pointer rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100';

const paginationButtonStyle =
  'cursor-pointer rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50';

const searchInputStyle =
  'w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-500';

const filterSelectStyle =
  'cursor-pointer rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 outline-none transition hover:border-neutral-400 focus:border-neutral-500';

const filterDropdownPanelStyle =
  'absolute left-0 top-full z-10 mt-1 flex min-w-40 flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg';

const filterDropdownRowStyle =
  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100';

const drawerInputStyle =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500';

const drawerCloseStyle =
  'cursor-pointer rounded-full px-2 text-lg leading-none text-neutral-500 transition hover:text-neutral-900';

const drawerCancelStyle =
  'cursor-pointer rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100';

const drawerSaveStyle =
  'cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800';

const drawerTabStyle =
  'cursor-pointer border-b-2 border-transparent px-3 pb-3 text-sm text-neutral-500 transition hover:text-neutral-900';

const drawerTabActiveStyle =
  'cursor-pointer border-b-2 border-neutral-900 px-3 pb-3 text-sm font-medium text-neutral-900';

const drawerTypePillStyle =
  'rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600';

const dangerButtonStyle =
  'mt-3 cursor-pointer rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100';

const dangerConfirmStyle =
  'cursor-pointer rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700';

const dangerCancelStyle =
  'cursor-pointer rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm text-rose-700 transition hover:bg-rose-100';
