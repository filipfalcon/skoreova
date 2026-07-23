import { Match as M, Option, Result } from 'effect';
import type { Runtime } from 'foldkit';
import { AsyncData, Command } from 'foldkit';
import { evo } from 'foldkit/struct';
import { toString as urlToString } from 'foldkit/url';

import type { AppRoute } from './route';
import { homeRouter, recordRouter, sectionRouter, urlToAppRoute } from './route';
import { editionToRow } from './editionsApi';
import { Section } from './section';
export { Section } from './section';
import {
  DrawerClosed,
  DrawerCreating,
  Entry,
  LogEntry,
  Model,
  ParticipationsData,
  SectionData,
} from './model';

import {
  draftOf,
  drawerRecord,
  editRecord,
  findRecord,
  pointsFor,
  sectionData,
  statsFor,
  withDraft,
} from './data';
import {
  FetchAssociations,
  FetchClubs,
  FetchCompetitions,
  FetchEditions,
  FetchHealth,
  FetchNationals,
  FetchParticipations,
  FetchPlayers,
  FetchTeamById,
  Load,
  Navigate,
  POINTS_CHART_HOST_ID,
  StampSave,
  SyncChart,
  SyncPointsChart,
} from './command';

// MODEL lives in model.ts — re-exported so fixtures and tests keep importing
// from the app entry.
export * from './model';
import { Message } from './message';

// MESSAGE re-exported for fixtures and tests.
export * from './message';

// MESSAGE

// MESSAGE lives in message.ts now.
// UPDATE

// A fresh signed-out model. Every section starts Idle — nothing is fetched
// until sign-in, and there's no mock seed data.
const initialModel = (): Model => ({
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

const upsertEntry = (rows: ReadonlyArray<Entry>, entry: Entry): ReadonlyArray<Entry> => [
  ...rows.filter((row) => !(row.section === entry.section && row.id === entry.id)),
  entry,
];

// The rows a section currently holds (its Success/Refreshing/Stale data), or []
// if it hasn't loaded. `model[section]` selects the section's AsyncData.
const evolveSection = (
  model: Model,
  section: Section,
  f: (data: SectionData) => SectionData,
): Model => {
  switch (section) {
    case 'players':
      return evo(model, { players: f });
    case 'clubs':
      return evo(model, { clubs: f });
    case 'nationals':
      return evo(model, { nationals: f });
    case 'competitions':
      return evo(model, { competitions: f });
    case 'editions':
      return evo(model, { editions: f });
    case 'associations':
      return evo(model, { associations: f });
  }
};

// Upserts a record into a section's rows, forcing the section to Success (a
// deep-linked record can arrive before the section's list has been fetched).
const upsertRecord = (data: SectionData, entry: Entry): SectionData =>
  SectionData.Success({
    data: upsertEntry(
      Option.getOrElse(AsyncData.getData(data), () => []),
      entry,
    ),
  });

// Maps a section's loaded rows in place (no-op unless it holds data).
const mapSectionRows = (
  data: SectionData,
  f: (rows: ReadonlyArray<Entry>) => ReadonlyArray<Entry>,
): SectionData => AsyncData.map(data, f);

// Applies a parsed URL to the model — used both for the initial load and for
// browser back/forward (ChangedUrl). Deep-linking to a specific record is
// fully reliable for Clubs/Nationals (fetched by id via GET /teams/{id} if
// not already loaded); other sections have no single-record endpoint, so a
// link only opens the record if it's already in the currently loaded list —
// otherwise it falls back to that section's list.
// The pair returned by `update` and the helpers it delegates to: the next
// model and the commands to run. Named once rather than spelled out at every
// signature and withReturnType.
type UpdateReturn = readonly [Model, ReadonlyArray<Command.Command<Message>>];
const withUpdateReturn = M.withReturnType<UpdateReturn>();

const applyRoute = (model: Model, route: AppRoute): UpdateReturn =>
  M.value(route).pipe(
    withUpdateReturn,
    M.tagsExhaustive({
      // The dashboard landing page — the default entrypoint after signing in.
      HomeRoute: () => [
        evo(model, {
          isShowingDashboard: () => true,
          isMenuOpen: () => false,
          drawer: () => DrawerClosed.make({}),
        }),
        [],
      ],
      NotFoundRoute: () => [
        evo(model, {
          isShowingDashboard: () => true,
          isMenuOpen: () => false,
          drawer: () => DrawerClosed.make({}),
        }),
        [],
      ],
      SectionRoute: ({ section }) => [
        evo(model, {
          section: () => section,
          isShowingDashboard: () => false,
          isMenuOpen: () => false,
          drawer: () => DrawerClosed.make({}),
        }),
        [],
      ],
      RecordRoute: ({ section, id }) => {
        const found = findRecord(model, section, id);
        const entry = found && !found.isDeleted ? found : undefined;
        if (entry) {
          return [
            evo(model, {
              section: () => section,
              isShowingDashboard: () => false,
              isMenuOpen: () => false,
              drawer: () => editRecord(entry),
              chartError: () => Option.none(),
              linkError: () => '',
            }),
            [],
          ];
        }
        if (section === 'clubs' || section === 'nationals') {
          return [
            evo(model, {
              section: () => section,
              isShowingDashboard: () => false,
              isMenuOpen: () => false,
            }),
            [FetchTeamById({ section, id })],
          ];
        }
        // No single-record endpoint for this section (or it's mock-only) —
        // fall back to the section's list instead of a broken "open" state.
        return [
          evo(model, {
            section: () => section,
            isShowingDashboard: () => false,
            isMenuOpen: () => false,
            drawer: () => DrawerClosed.make({}),
          }),
          [],
        ];
      },
    }),
  );

// The browsable sections and the fetch each kicks off at sign-in. Driving the
// fan-out from this list keeps ClickedSignIn declarative instead of an
// imperative push per section. (Participations isn't here — it has no section
// UI and is fetched alongside.)
const SIGN_IN_SECTIONS: ReadonlyArray<{
  readonly section: Section;
  readonly fetch: (model: Model) => Command.Command<Message>;
}> = [
  { section: 'players', fetch: (model) => FetchPlayers({ page: model.playersPage }) },
  { section: 'clubs', fetch: () => FetchClubs() },
  { section: 'nationals', fetch: () => FetchNationals() },
  { section: 'competitions', fetch: () => FetchCompetitions() },
  { section: 'editions', fetch: () => FetchEditions() },
  { section: 'associations', fetch: () => FetchAssociations() },
];

// A retry transitions the section to Refreshing (if it holds data) or Loading
// and re-fetches; if it's already pending, revalidateOrLoad returns None and
// nothing happens (no double-fetch).
const retrySection = (
  model: Model,
  section: Section,
  commands: ReadonlyArray<Command.Command<Message>>,
): UpdateReturn =>
  Option.match(AsyncData.revalidateOrLoad(model[section]), {
    onNone: () => [model, []],
    onSome: (next) => [evolveSection(model, section, () => next), commands],
  });

export const update = (model: Model, message: Message): UpdateReturn =>
  M.value(message).pipe(
    withUpdateReturn,
    M.tagsExhaustive({
      UpdatedEmail: ({ value }) => [evo(model, { email: () => value }), []],
      UpdatedPassword: ({ value }) => [evo(model, { password: () => value }), []],
      // TODO: Replace this with real backend authentication. For now any
      // credentials (including empty ones) are accepted.
      // Kick off the Players/Clubs/Nationals fetches the first time we land
      // on the dashboard.
      ClickedSignIn: () => {
        // Fan out over the section list: fetch each still-idle section and flip
        // it to Loading in the same pass. `start` leaves an already-running or
        // loaded section untouched, so the evolve mirrors the command list.
        const start = (data: SectionData): SectionData =>
          data._tag === 'Idle' ? SectionData.Loading() : data;
        const idleFetches = SIGN_IN_SECTIONS.filter(
          (entry) => model[entry.section]._tag === 'Idle',
        ).map((entry) => entry.fetch(model));
        const participationsFetch =
          model.participations._tag === 'Idle' ? [FetchParticipations()] : [];
        return [
          evo(model, {
            isSignedIn: () => true,
            players: start,
            clubs: start,
            nationals: start,
            competitions: start,
            editions: start,
            associations: start,
            participations: (data) => (data._tag === 'Idle' ? ParticipationsData.Loading() : data),
          }),
          [...idleFetches, ...participationsFetch, FetchHealth()],
        ];
      },
      ClickedSignOut: () => [initialModel(), []],
      // Switching section closes the mobile nav and drawer, and clears filters.
      SelectedSection: ({ section }) => [
        evo(model, {
          section: () => section,
          isShowingDashboard: () => false,
          isMenuOpen: () => false,
          search: () => '',
          filters: () => [],
          drawer: () => DrawerClosed.make({}),
          clientPage: () => 1,
          linkError: () => '',
          openFilterColumn: () => Option.none(),
        }),
        [Navigate({ url: sectionRouter({ section }) })],
      ],
      // Back to the dashboard landing page.
      ClickedDashboard: () => [
        evo(model, {
          isShowingDashboard: () => true,
          isMenuOpen: () => false,
          linkError: () => '',
        }),
        [Navigate({ url: homeRouter() })],
      ],
      ToggledMenu: () => [evo(model, { isMenuOpen: (open) => !open }), []],
      UpdatedSearch: ({ value }) => [evo(model, { search: () => value, clientPage: () => 1 }), []],
      SelectedFilter: ({ columnIndex, value }) => {
        const filters = [...model.filters];
        filters[columnIndex] = value;
        return [evo(model, { filters: () => filters, clientPage: () => 1 }), []];
      },
      // Opens/closes a checkbox filter's dropdown panel; picking a new one
      // closes whatever else was open.
      ToggledFilterDropdown: ({ columnIndex }) => [
        evo(model, {
          openFilterColumn: (open) =>
            Option.contains(open, columnIndex) ? Option.none() : Option.some(columnIndex),
        }),
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
            chartError: () => Option.none(),
          }),
          [],
        ];
      },
      // Open the profile drawer with a working copy of the record's values.
      ClickedRecord: ({ section, id }) => {
        const entry = findRecord(model, section, id);
        if (!entry) return [model, []];
        return [
          evo(model, {
            drawer: () => editRecord(entry),
            chartError: () => Option.none(),
            linkError: () => '',
          }),
          [Navigate({ url: recordRouter({ section, id }) })],
        ];
      },
      UpdatedDraftField: ({ index, value }) => [
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
          const { section } = drawer;
          const entry: Entry = {
            section,
            values: drawer.draft,
            isDeleted: false,
            id: `local-${model.nextLocalId}`,
            parentId: '',
          };
          const withRow = evolveSection(model, section, (data) =>
            mapSectionRows(data, (rows) => [...rows, entry]),
          );
          return [
            evo(withRow, {
              nextLocalId: (n) => n + 1,
              drawer: () => DrawerClosed.make({}),
            }),
            [Navigate({ url: sectionRouter({ section }) })],
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
        const entry = findRecord(model, section, id);
        if (!entry) return [model, []];

        const columns = sectionData[section].columns;
        const changes: ReadonlyArray<LogEntry> = columns.flatMap((field, i) => {
          const from = entry.values[i] ?? '';
          const to = draft[i] ?? '';
          return from === to ? [] : [{ recordId: id, field, from, to, at }];
        });

        const withRows = evolveSection(model, section, (data) =>
          mapSectionRows(data, (rows) =>
            rows.map((row) => (row.id === id ? evo(row, { values: () => draft }) : row)),
          ),
        );
        return [
          evo(withRows, {
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
            drawer._tag === 'Editing' ? evo(drawer, { isConfirmingDelete: () => true }) : drawer,
        }),
        [],
      ],
      ClickedCancelDelete: () => [
        evo(model, {
          drawer: (drawer) =>
            drawer._tag === 'Editing' ? evo(drawer, { isConfirmingDelete: () => false }) : drawer,
        }),
        [],
      ],
      // Soft-delete: mark the record and close the drawer (mock — no backend yet).
      ClickedConfirmDelete: () => {
        const drawer = model.drawer;
        if (drawer._tag !== 'Editing') return [model, []];
        const { section, id } = drawer;
        const withRows = evolveSection(model, section, (data) =>
          mapSectionRows(data, (rows) =>
            rows.map((row) => (row.id === id ? evo(row, { isDeleted: () => true }) : row)),
          ),
        );
        return [
          evo(withRows, { drawer: () => DrawerClosed.make({}) }),
          [Navigate({ url: sectionRouter({ section }) })],
        ];
      },
      // Once a chart's host element is mounted, push the current record's
      // data into it (mirrors Foldkit's charting example: Mount only creates
      // the chart instance, Command feeds it data). Two hosts share this
      // message — branch on which one just mounted.
      SucceededMountChart: ({ hostId }) => {
        const entry = drawerRecord(model);
        if (!entry) return [evo(model, { chartError: () => Option.none() }), []];
        if (hostId === POINTS_CHART_HOST_ID) {
          return [
            evo(model, { chartError: () => Option.none() }),
            [SyncPointsChart({ hostId, ...pointsFor(entry) })],
          ];
        }
        return [
          evo(model, { chartError: () => Option.none() }),
          [SyncChart({ hostId, ...statsFor(entry) })],
        ];
      },
      FailedMountChart: ({ reason }) => [evo(model, { chartError: () => Option.some(reason) }), []],
      SucceededSyncChart: () => [model, []],
      FailedSyncChart: ({ reason }) => [evo(model, { chartError: () => Option.some(reason) }), []],
      // A fetched page replaces the section's rows (one page at a time, not the
      // running total). settle folds the result into the AsyncData: success →
      // Success, failure → Failure or, if a prior page is still shown, Stale.
      SucceededFetchPlayers: ({ entries, total }) => [
        evo(model, {
          players: () => SectionData.Success({ data: entries }),
          playersTotal: () => total,
        }),
        [],
      ],
      FailedFetchPlayers: ({ reason }) => [
        evo(model, { players: () => AsyncData.settle(model.players, Result.fail(reason)) }),
        [],
      ],
      ClickedRetryPlayers: () =>
        retrySection(model, 'players', [FetchPlayers({ page: model.playersPage }), FetchHealth()]),
      ClickedPlayersPage: ({ page }) => [
        evo(model, {
          players: (data) => Option.getOrElse(AsyncData.revalidateOrLoad(data), () => data),
          playersPage: () => page,
        }),
        [FetchPlayers({ page })],
      ],
      ClickedClientPage: ({ page }) => [evo(model, { clientPage: () => page }), []],
      SucceededFetchClubs: ({ entries }) => [
        evo(model, { clubs: () => SectionData.Success({ data: entries }) }),
        [],
      ],
      FailedFetchClubs: ({ reason }) => [
        evo(model, { clubs: () => AsyncData.settle(model.clubs, Result.fail(reason)) }),
        [],
      ],
      ClickedRetryClubs: () => retrySection(model, 'clubs', [FetchClubs(), FetchHealth()]),
      SucceededFetchNationals: ({ entries }) => [
        evo(model, { nationals: () => SectionData.Success({ data: entries }) }),
        [],
      ],
      FailedFetchNationals: ({ reason }) => [
        evo(model, { nationals: () => AsyncData.settle(model.nationals, Result.fail(reason)) }),
        [],
      ],
      ClickedRetryNationals: () =>
        retrySection(model, 'nationals', [FetchNationals(), FetchHealth()]),
      // Editions store their competition's id (in parentId); the name is
      // resolved in the view, so competitions and editions can land in either
      // order with no re-resolution here.
      SucceededFetchCompetitions: ({ entries }) => [
        evo(model, { competitions: () => SectionData.Success({ data: entries }) }),
        [],
      ],
      FailedFetchCompetitions: ({ reason }) => [
        evo(model, {
          competitions: () => AsyncData.settle(model.competitions, Result.fail(reason)),
        }),
        [],
      ],
      ClickedRetryCompetitions: () =>
        retrySection(model, 'competitions', [FetchCompetitions(), FetchHealth()]),
      SucceededFetchEditions: ({ editions }) => {
        const entries: ReadonlyArray<Entry> = editions.map((edition) => ({
          section: 'editions' as const,
          id: edition.id,
          isDeleted: false,
          parentId: edition.competitionId,
          values: editionToRow(edition, edition.competitionId),
        }));
        return [evo(model, { editions: () => SectionData.Success({ data: entries }) }), []];
      },
      FailedFetchEditions: ({ reason }) => [
        evo(model, { editions: () => AsyncData.settle(model.editions, Result.fail(reason)) }),
        [],
      ],
      ClickedRetryEditions: () => retrySection(model, 'editions', [FetchEditions(), FetchHealth()]),
      SucceededFetchAssociations: ({ entries }) => [
        evo(model, { associations: () => SectionData.Success({ data: entries }) }),
        [],
      ],
      FailedFetchAssociations: ({ reason }) => [
        evo(model, {
          associations: () => AsyncData.settle(model.associations, Result.fail(reason)),
        }),
        [],
      ],
      ClickedRetryAssociations: () =>
        retrySection(model, 'associations', [FetchAssociations(), FetchHealth()]),
      SucceededFetchParticipations: ({ participations }) => [
        evo(model, { participations: () => ParticipationsData.Success({ data: participations }) }),
        [],
      ],
      FailedFetchParticipations: ({ reason }) => [
        evo(model, {
          participations: () => AsyncData.settle(model.participations, Result.fail(reason)),
        }),
        [],
      ],
      ClickedRetryParticipations: () =>
        Option.match(AsyncData.revalidateOrLoad(model.participations), {
          onNone: () => [model, []],
          onSome: (next) => [
            evo(model, { participations: () => next }),
            [FetchParticipations(), FetchHealth()],
          ],
        }),
      SucceededFetchHealth: () => [evo(model, { serverHealth: () => 'Ok' }), []],
      FailedFetchHealth: () => [evo(model, { serverHealth: () => 'Down' }), []],
      // Internal anchor clicks (e.g. the decorative "Forgot password?" link)
      // navigate within the app; anything else is a real page load.
      ClickedLink: ({ request }) =>
        M.value(request).pipe(
          withUpdateReturn,
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
      // directly by id — insert it into its section and open its drawer.
      SucceededFetchTeamById: ({ entry }) => [
        evo(
          evolveSection(model, entry.section, (data) => upsertRecord(data, entry)),
          {
            drawer: () => editRecord(entry),
            chartError: () => Option.none(),
            linkError: () => '',
          },
        ),
        [],
      ],
      FailedFetchTeamById: ({ reason }) => [evo(model, { linkError: () => reason }), []],
    }),
  );

// INIT

export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) =>
  applyRoute(initialModel(), urlToAppRoute(url));

// MENU

// Re-exported for fixtures and tests.
export * from './command';
// VIEW lives in page.ts.
export { view } from './page';
