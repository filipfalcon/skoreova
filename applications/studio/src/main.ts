import { Match as M, Option, Result } from 'effect';
import { DatePicker, Dialog, Tabs } from '@foldkit/ui';
import type { Runtime } from 'foldkit';
import { AsyncData, Calendar, Command } from 'foldkit';
import { evo } from 'foldkit/struct';
import { toString as urlToString } from 'foldkit/url';

import type { AppRoute } from './route';
import {
  HomeRoute,
  RecordRoute,
  SectionRoute,
  homeRouter,
  recordRouter,
  routeSection,
  sectionRouter,
  urlToAppRoute,
} from './route';
import { editionToRow } from './editionsApi';
import { Section } from './section';
export { Section } from './section';
import {
  Anonymous,
  DRAWER_DIALOG_ID,
  DRAWER_TABS_ID,
  DrawerClosed,
  DrawerCreating,
  DrawerTabs,
  Entry,
  ExactFilter,
  ExcludedFilter,
  FilterListbox,
  LogEntry,
  Model,
  ParticipationsData,
  SectionData,
  SignedIn,
} from './model';

import {
  draftOf,
  drawerRecord,
  editRecord,
  findRecord,
  initialDateFilterPickers,
  initialFilterListboxes,
  pointsFor,
  sectionData,
  statsFor,
  withDraft,
} from './data';
import {
  POINTS_CHART_HOST_ID,
  fetchAssociations,
  fetchClubs,
  fetchCompetitions,
  fetchEditions,
  fetchHealth,
  fetchNationals,
  fetchParticipations,
  fetchPlayers,
  fetchTeamById,
  fetchToday,
  load,
  navigate,
  stampSave,
  syncChart,
  syncPointsChart,
} from './command';
import {
  GotDateFilterMessage,
  GotDialogMessage,
  GotFilterListboxMessage,
  GotTabsMessage,
  Message,
} from './message';

// The public surface — Model, messages, commands, routes, and the view —
// re-exported so fixtures and tests keep importing from the app entry.
export * from './model';
export * from './message';
export * from './command';
export * from './route';
export { view } from './page';

// UPDATE

// A fresh signed-out model. Every section starts Idle — nothing is fetched
// until sign-in, and there's no mock seed data.
const initialModel = (): Model => ({
  session: Anonymous.make({ emailInput: '', passwordInput: '' }),
  route: HomeRoute(),
  isMenuOpen: false,
  search: '',
  filters: {},
  drawer: DrawerClosed.make({}),
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
  linkError: '',
  filterListboxes: initialFilterListboxes(),
  dateFilters: {},
  dateFilterPickers: {},
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
      HomeRoute: () => {
        const [withDialog, dialogCommands] = closeDialog(model);
        return [
          evo(withDialog, {
            route: () => route,
            isMenuOpen: () => false,
            drawer: () => DrawerClosed.make({}),
          }),
          dialogCommands,
        ];
      },
      NotFoundRoute: () => {
        const [withDialog, dialogCommands] = closeDialog(model);
        return [
          evo(withDialog, {
            route: () => route,
            isMenuOpen: () => false,
            drawer: () => DrawerClosed.make({}),
          }),
          dialogCommands,
        ];
      },
      SectionRoute: () => {
        const [withDialog, dialogCommands] = closeDialog(model);
        return [
          evo(withDialog, {
            route: () => route,
            isMenuOpen: () => false,
            drawer: () => DrawerClosed.make({}),
          }),
          dialogCommands,
        ];
      },
      RecordRoute: ({ section, id }) => {
        const found = findRecord(model, section, id);
        const entry = found && !found.isDeleted ? found : undefined;
        if (entry) {
          const [withDialog, dialogCommands] = openDialog(model);
          return [
            evo(withDialog, {
              route: () => route,
              isMenuOpen: () => false,
              drawer: () => editRecord(entry),
              chartError: () => Option.none(),
              linkError: () => '',
            }),
            dialogCommands,
          ];
        }
        if (section === 'clubs' || section === 'nationals') {
          return [
            evo(model, {
              route: () => route,
              isMenuOpen: () => false,
            }),
            [fetchTeamById(section, id)],
          ];
        }
        // No single-record endpoint for this section (or it's mock-only) —
        // fall back to the section's list instead of a broken "open" state
        // (routeSection still selects the list to show).
        const [withDialog, dialogCommands] = closeDialog(model);
        return [
          evo(withDialog, {
            route: () => route,
            isMenuOpen: () => false,
            drawer: () => DrawerClosed.make({}),
          }),
          dialogCommands,
        ];
      },
    }),
  );

// The browsable sections and the fetch each kicks off at sign-in. Driving the
// fan-out from this list keeps SubmittedSignIn declarative instead of an
// imperative push per section. (Participations isn't here — it has no section
// UI and is fetched alongside.)
const SIGN_IN_SECTIONS: ReadonlyArray<{
  readonly section: Section;
  readonly fetch: (model: Model) => Command.Command<Message>;
}> = [
  { section: 'players', fetch: (model) => fetchPlayers(model.playersPage) },
  { section: 'clubs', fetch: () => fetchClubs() },
  { section: 'nationals', fetch: () => fetchNationals() },
  { section: 'competitions', fetch: () => fetchCompetitions() },
  { section: 'editions', fetch: () => fetchEditions() },
  { section: 'associations', fetch: () => fetchAssociations() },
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

// Programmatic Dialog open/close from the drawer's domain handlers, lifting
// the component's Commands into the parent Message. The Dialog's OutMessage is
// dropped here: these run from handlers that already evolve the drawer state
// themselves (the OutMessage path is for user-initiated closes — see
// GotDialogMessage). Both are no-ops when the dialog is already in the target
// state, so callers can thread them unconditionally.
const openDialog = (model: Model): UpdateReturn => {
  const [dialog, commands] = Dialog.open(model.dialog);
  return [
    evo(model, { dialog: () => dialog }),
    Command.mapMessages(commands, (message) => GotDialogMessage({ message })),
  ];
};

const closeDialog = (model: Model): UpdateReturn => {
  const [dialog, commands] = Dialog.close(model.dialog);
  return [
    evo(model, { dialog: () => dialog }),
    Command.mapMessages(commands, (message) => GotDialogMessage({ message })),
  ];
};

export const update = (model: Model, message: Message): UpdateReturn =>
  M.value(message).pipe(
    withUpdateReturn,
    M.tagsExhaustive({
      // The credential fields only exist while signed out — a stray input
      // message after sign-in has nothing to write into.
      UpdatedEmail: ({ value }) => [
        evo(model, {
          session: (session) =>
            session._tag === 'Anonymous' ? evo(session, { emailInput: () => value }) : session,
        }),
        [],
      ],
      UpdatedPassword: ({ value }) => [
        evo(model, {
          session: (session) =>
            session._tag === 'Anonymous' ? evo(session, { passwordInput: () => value }) : session,
        }),
        [],
      ],
      // NOTE: mock sign-in — there is no backend authentication endpoint
      // yet, so any credentials (including empty ones) are accepted. Signing
      // in kicks off every section's first fetch.
      SubmittedSignIn: () => {
        // Fan out over the section list: fetch each still-idle section and flip
        // it to Loading in the same pass. `start` leaves an already-running or
        // loaded section untouched, so the evolve mirrors the command list.
        const start = (data: SectionData): SectionData =>
          data._tag === 'Idle' ? SectionData.Loading() : data;
        const idleFetches = SIGN_IN_SECTIONS.filter(
          (entry) => model[entry.section]._tag === 'Idle',
        ).map((entry) => entry.fetch(model));
        const participationsFetch =
          model.participations._tag === 'Idle' ? [fetchParticipations()] : [];
        return [
          evo(model, {
            // Only the email crosses into the signed-in state — the password
            // input is dropped here, not carried along.
            session: (session) =>
              session._tag === 'Anonymous' ? SignedIn.make({ email: session.emailInput }) : session,
            players: start,
            clubs: start,
            nationals: start,
            competitions: start,
            editions: start,
            associations: start,
            participations: (data) => (data._tag === 'Idle' ? ParticipationsData.Loading() : data),
          }),
          [...idleFetches, ...participationsFetch, fetchHealth()],
        ];
      },
      // Signing out swaps in the fresh model but keeps the live dialog
      // submodel: the login view doesn't render the dialog, so if the drawer
      // was open its element unmounts and the component's Unmounted backstop
      // reclaims the scroll lock and focus trap (a fresh closed dialog model
      // would skip that release). The date filter pickers survive too — they
      // are seeded once by FetchToday at boot.
      ClickedSignOut: () => [
        evo(initialModel(), {
          dialog: () => model.dialog,
          dateFilterPickers: () => model.dateFilterPickers,
        }),
        [],
      ],
      // Switching section closes the mobile nav and drawer, and clears filters.
      SelectedSection: ({ section }) => {
        const [withDialog, dialogCommands] = closeDialog(model);
        return [
          evo(withDialog, {
            route: () => SectionRoute({ section }),
            isMenuOpen: () => false,
            search: () => '',
            filters: () => ({}),
            dateFilters: () => ({}),
            drawer: () => DrawerClosed.make({}),
            clientPage: () => 1,
            linkError: () => '',
            // Fresh closed instances, so a dropdown left open on the previous
            // section can't carry its open state across.
            filterListboxes: () => initialFilterListboxes(),
          }),
          [...dialogCommands, navigate(sectionRouter({ section }))],
        ];
      },
      // Back to the dashboard landing page.
      ClickedDashboard: () => [
        evo(model, {
          route: () => HomeRoute(),
          isMenuOpen: () => false,
          linkError: () => '',
        }),
        [navigate(homeRouter())],
      ],
      ToggledMenu: () => [evo(model, { isMenuOpen: (open) => !open }), []],
      UpdatedSearch: ({ value }) => [evo(model, { search: () => value, clientPage: () => 1 }), []],
      // A dropdown column's exact-match choice; '' (the "All" option) drops
      // the column's filter entirely.
      SelectedFilter: ({ column, value }) => {
        const { [column]: _removed, ...rest } = model.filters;
        return [
          evo(model, {
            filters: () =>
              value === '' ? rest : { ...rest, [column]: ExactFilter.make({ value }) },
            clientPage: () => 1,
          }),
          [],
        ];
      },
      // Delegates to a checkbox column's filter Listbox. Its Selected
      // OutMessage flips the value's membership in that column's *excluded*
      // (unchecked) set. An emptied set drops the column's filter — nothing
      // excluded = all checked (the default).
      GotFilterListboxMessage: ({ column, message }) => {
        const listbox = model.filterListboxes[column];
        if (!listbox) return [model, []];
        const [next, listboxCommands, maybeOutMessage] = FilterListbox.update(listbox, message);
        const commands = Command.mapMessages(listboxCommands, (message) =>
          GotFilterListboxMessage({ column, message }),
        );
        const withListbox = evo(model, {
          filterListboxes: (boxes) => ({ ...boxes, [column]: next }),
        });
        return Option.match(maybeOutMessage, {
          onNone: () => [withListbox, commands],
          onSome: ({ value }) => {
            const current = model.filters[column];
            const excluded = current?._tag === 'ExcludedFilter' ? current.excluded : [];
            const nextExcluded = excluded.includes(value)
              ? excluded.filter((v) => v !== value)
              : [...excluded, value];
            const { [column]: _removed, ...rest } = model.filters;
            return [
              evo(withListbox, {
                filters: () =>
                  nextExcluded.length === 0
                    ? rest
                    : { ...rest, [column]: ExcludedFilter.make({ excluded: nextExcluded }) },
                clientPage: () => 1,
              }),
              commands,
            ];
          },
        });
      },
      // Today's date arrived from the clock at boot — seed the date filter
      // DatePickers with it so their calendar grids open onto it.
      FetchedToday: ({ today }) => [
        evo(model, { dateFilterPickers: () => initialDateFilterPickers(today) }),
        [],
      ],
      // Delegates to one bound of a date column's filter DatePicker. Its
      // SelectedDate OutMessage commits that bound of the column's range;
      // ChangedViewMonth is just the visible month moving.
      GotDateFilterMessage: ({ column, bound, message }) => {
        const pair = model.dateFilterPickers[column];
        if (!pair) return [model, []];
        const [picker, pickerCommands, maybeOutMessage] = DatePicker.update(pair[bound], message);
        const commands = Command.mapMessages(pickerCommands, (message) =>
          GotDateFilterMessage({ column, bound, message }),
        );
        const withPicker = evo(model, {
          dateFilterPickers: (pickers) => ({ ...pickers, [column]: { ...pair, [bound]: picker } }),
        });
        const setBound = (date: Option.Option<typeof Calendar.CalendarDate.Type>): UpdateReturn => [
          evo(withPicker, {
            dateFilters: (ranges) => ({
              ...ranges,
              [column]: {
                ...(ranges[column] ?? { from: Option.none(), to: Option.none() }),
                [bound]: date,
              },
            }),
            clientPage: () => 1,
          }),
          commands,
        ];
        return Option.match(maybeOutMessage, {
          onNone: () => [withPicker, commands],
          onSome: M.type<DatePicker.OutMessage>().pipe(
            withUpdateReturn,
            M.tagsExhaustive({
              ChangedViewMonth: () => [withPicker, commands],
              SelectedDate: ({ date }) => setBound(Option.some(date)),
              ClearedDate: () => setBound(Option.none()),
            }),
          ),
        });
      },
      // Drops both bounds of a date column's range. Purely parent-side — the
      // DatePickers hold no selection state to reset.
      ClearedDateFilter: ({ column }) => {
        const { [column]: _removed, ...rest } = model.dateFilters;
        return [evo(model, { dateFilters: () => rest, clientPage: () => 1 }), []];
      },
      // Open the drawer in creation mode: a blank draft, no existing record.
      // Only reachable from a section list — on the dashboard there is no
      // section to create into.
      ClickedAddNew: () =>
        Option.match(routeSection(model.route), {
          onNone: () => [model, []],
          onSome: (section) => {
            const columns = sectionData[section].columns;
            const [withDialog, dialogCommands] = openDialog(model);
            return [
              evo(withDialog, {
                drawer: () => DrawerCreating.make({ section, draft: columns.map(() => '') }),
                chartError: () => Option.none(),
              }),
              dialogCommands,
            ];
          },
        }),
      // Open the profile drawer with a working copy of the record's values.
      ClickedRecord: ({ section, id }) => {
        const entry = findRecord(model, section, id);
        if (!entry) return [model, []];
        const [withDialog, dialogCommands] = openDialog(model);
        return [
          evo(withDialog, {
            route: () => RecordRoute({ section, id }),
            drawer: () => editRecord(entry),
            chartError: () => Option.none(),
            linkError: () => '',
          }),
          [...dialogCommands, navigate(recordRouter({ section, id }))],
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
          const [withDialog, dialogCommands] = closeDialog(withRow);
          return [
            evo(withDialog, {
              route: () => SectionRoute({ section }),
              nextLocalId: (n) => n + 1,
              drawer: () => DrawerClosed.make({}),
            }),
            [...dialogCommands, navigate(sectionRouter({ section }))],
          ];
        }
        if (drawer._tag !== 'Editing') return [model, []];
        // Editing commits with a timestamped edit log. The timestamp comes from
        // the clock via StampSave (keeping `update` pure); SavedRecordAt then
        // does the commit with it.
        return [model, [stampSave()]];
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
        const [withDialog, dialogCommands] = closeDialog(withRows);
        return [
          evo(withDialog, {
            route: () => SectionRoute({ section }),
            editLog: (log) => [...changes, ...log],
            drawer: () => DrawerClosed.make({}),
          }),
          [...dialogCommands, navigate(sectionRouter({ section }))],
        ];
      },
      // Delegates to the Dialog submodel. Its Closed OutMessage is the user's
      // close intent (Escape, backdrop click, the ✕/Cancel controls) — fold it
      // back into the drawer state and return to the section's list URL.
      GotDialogMessage: ({ message }) => {
        const [dialog, dialogCommands, maybeOutMessage] = Dialog.update(model.dialog, message);
        const commands = Command.mapMessages(dialogCommands, (message) =>
          GotDialogMessage({ message }),
        );
        const withDialog = evo(model, { dialog: () => dialog });
        return Option.match(maybeOutMessage, {
          onNone: () => [withDialog, commands],
          onSome: M.type<Dialog.OutMessage>().pipe(
            withUpdateReturn,
            M.tagsExhaustive({
              Opened: () => [withDialog, commands],
              // Closing returns to the current section's list URL — or the
              // dashboard if no section route is active.
              Closed: () =>
                Option.match(routeSection(model.route), {
                  onNone: () => [
                    evo(withDialog, {
                      route: () => HomeRoute(),
                      drawer: () => DrawerClosed.make({}),
                    }),
                    [...commands, navigate(homeRouter())],
                  ],
                  onSome: (section) => [
                    evo(withDialog, {
                      route: () => SectionRoute({ section }),
                      drawer: () => DrawerClosed.make({}),
                    }),
                    [...commands, navigate(sectionRouter({ section }))],
                  ],
                }),
            }),
          ),
        });
      },
      // Delegates to the Tabs submodel. Its Selected OutMessage is a committed
      // tab switch — fold the DrawerTab value into the editing state the
      // parent owns.
      GotTabsMessage: ({ message }) => {
        const [tabs, tabsCommands, maybeOutMessage] = DrawerTabs.update(model.tabs, message);
        const commands = Command.mapMessages(tabsCommands, (message) =>
          GotTabsMessage({ message }),
        );
        const withTabs = evo(model, { tabs: () => tabs });
        return Option.match(maybeOutMessage, {
          onNone: () => [withTabs, commands],
          onSome: ({ value }) => [
            evo(withTabs, {
              drawer: (drawer) =>
                drawer._tag === 'Editing' ? evo(drawer, { tab: () => value }) : drawer,
            }),
            commands,
          ],
        });
      },
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
        const [withDialog, dialogCommands] = closeDialog(withRows);
        return [
          evo(withDialog, {
            route: () => SectionRoute({ section }),
            drawer: () => DrawerClosed.make({}),
          }),
          [...dialogCommands, navigate(sectionRouter({ section }))],
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
            [syncPointsChart({ hostId, ...pointsFor(entry) })],
          ];
        }
        return [
          evo(model, { chartError: () => Option.none() }),
          [syncChart({ hostId, ...statsFor(entry) })],
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
        retrySection(model, 'players', [fetchPlayers(model.playersPage), fetchHealth()]),
      ClickedPlayersPage: ({ page }) => [
        evo(model, {
          players: (data) => Option.getOrElse(AsyncData.revalidateOrLoad(data), () => data),
          playersPage: () => page,
        }),
        [fetchPlayers(page)],
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
      ClickedRetryClubs: () => retrySection(model, 'clubs', [fetchClubs(), fetchHealth()]),
      SucceededFetchNationals: ({ entries }) => [
        evo(model, { nationals: () => SectionData.Success({ data: entries }) }),
        [],
      ],
      FailedFetchNationals: ({ reason }) => [
        evo(model, { nationals: () => AsyncData.settle(model.nationals, Result.fail(reason)) }),
        [],
      ],
      ClickedRetryNationals: () =>
        retrySection(model, 'nationals', [fetchNationals(), fetchHealth()]),
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
        retrySection(model, 'competitions', [fetchCompetitions(), fetchHealth()]),
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
      ClickedRetryEditions: () => retrySection(model, 'editions', [fetchEditions(), fetchHealth()]),
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
        retrySection(model, 'associations', [fetchAssociations(), fetchHealth()]),
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
            [fetchParticipations(), fetchHealth()],
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
            Internal: ({ url }) => [model, [navigate(urlToString(url))]],
            External: ({ href }) => [model, [load(href)]],
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
      SucceededFetchTeamById: ({ entry }) => {
        const [withDialog, dialogCommands] = openDialog(
          evolveSection(model, entry.section, (data) => upsertRecord(data, entry)),
        );
        return [
          evo(withDialog, {
            drawer: () => editRecord(entry),
            chartError: () => Option.none(),
            linkError: () => '',
          }),
          dialogCommands,
        ];
      },
      FailedFetchTeamById: ({ reason }) => [evo(model, { linkError: () => reason }), []],
    }),
  );

// INIT

// Boot applies the initial URL and fetches today's date for the date filter
// pickers (see FetchedToday).
export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) => {
  const [model, commands] = applyRoute(initialModel(), urlToAppRoute(url));
  return [model, [...commands, fetchToday()]];
};
