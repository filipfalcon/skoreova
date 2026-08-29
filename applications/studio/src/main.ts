import { Array, Option, Result, pipe } from 'effect';
import { DatePicker, Dialog, Tabs } from '@foldkit/ui';
import type { Runtime } from 'foldkit';
import { AsyncData, Calendar, Command, Update } from 'foldkit';
import { evo } from 'foldkit/struct';
import { UrlRequest } from 'foldkit/navigation';
import { toString as urlToString } from 'foldkit/url';

import {
  AppRoute,
  homeRouter,
  recordRouter,
  routeSection,
  sectionRouter,
  urlToAppRoute,
} from './route';
import { PAGE_SIZE } from './api';
import type { Column } from './api';
import { Section } from './section';
export { Section } from './section';
import {
  ColumnFilter,
  DRAWER_DIALOG_ID,
  DRAWER_TABS_ID,
  DrawerState,
  DrawerTabs,
  Entry,
  FilterListbox,
  LOCAL_ID_PREFIX,
  LogEntry,
  Model,
  ParticipationsData,
  SectionData,
  Session,
} from './model';
import type { DrawerTab } from './model';

import * as FieldValidation from 'foldkit/fieldValidation';

import {
  columnRules,
  draftOf,
  draftValues,
  emptyDraft,
  isDraftSavable,
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
  stampDelete,
  stampSave,
  syncChart,
  syncPointsChart,
} from './command';
import { Message } from './message';

// The public surface — Model, messages, commands, routes, and the view —
// re-exported so fixtures and tests keep importing from the app entry.
export * from './model';
export * from './message';
export * from './command';
export * from './route';
export { view } from './view';

// UPDATE

// A fresh signed-out model. Every section starts Idle — nothing is fetched
// until sign-in, and there’s no mock seed data.
const initialModel = (): Model => ({
  session: Session.Anonymous({ emailInput: '', passwordInput: '' }),
  route: AppRoute.Home(),
  isMenuOpen: false,
  search: '',
  filters: {},
  drawer: DrawerState.Closed(),
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
  linkError: '',
  pendingLogRecordId: '',
  filterListboxes: initialFilterListboxes(),
  dateFilters: {},
  dateFilterPickers: {},
});

const upsertEntry = (rows: ReadonlyArray<Entry>, entry: Entry): ReadonlyArray<Entry> => [
  ...rows.filter((row) => !(row.section === entry.section && row.id === entry.id)),
  entry,
];

// Evolves ONE section’s AsyncData field by name. The field names match the
// Section literals, but `evo` needs a literal key, so the switch is what turns
// a runtime section into the right field — every handler that touches a
// section’s rows goes through here rather than naming the field itself.
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

// LOCAL EDITS THE WIRE DOESN’T KNOW ABOUT. Deletes are soft and creates are
// client-side — neither ever reaches the backend, because there is no write
// endpoint yet. So any response that REPLACES a section’s rows would undo both:
// a Refresh, a Retry, or a fetch already in flight when the editor pressed
// delete. Fixing only the Back-button path (see applyRoute) left those open.
//
// The deleted ids come from the MODEL, not from the rows on hand. Deriving them
// from the loaded rows works for the five sections that load whole and fails on
// the one that doesn’t: Players pages server-side, so a merge against page 2
// never sees the id deleted on page 1 and quietly drops the marker.
//
// Locally created rows ride along on every page of a paged section, which is
// visibly odd on Players — but losing an unsaved record outright is worse, and
// both go away the moment a real save endpoint exists. (Signing out is NOT one
// of these paths: it swaps in a fresh model, ledger included, on purpose.)
const deletedKey = (section: Section, id: string): string => `${section}:${id}`;

const mergeLocalEdits = (
  current: SectionData,
  incoming: ReadonlyArray<Entry>,
  section: Section,
  deletedRecordIds: ReadonlyArray<string>,
): ReadonlyArray<Entry> => {
  const deleted = new Set(deletedRecordIds);
  const known = Option.getOrElse(AsyncData.getData(current), () => []);
  const localOnly = known.filter((row) => row.id.startsWith(LOCAL_ID_PREFIX));
  return [
    ...incoming.map((row) =>
      deleted.has(deletedKey(section, row.id)) ? evo(row, { isDeleted: () => true }) : row,
    ),
    ...localOnly,
  ];
};

// The column descriptors behind whichever drawer state is open ([] when shut).
const drawerColumns = (drawer: Model['drawer']): ReadonlyArray<Column> =>
  drawer._tag === 'Closed' ? [] : sectionData[drawer.section].columns;

// IS THIS RECORD DELETED? Ask the LEDGER, not the rows. The row’s `isDeleted`
// flag is a render signal and a fallback: the row can be absent entirely — a
// list response that no longer carries it — while the ledger still knows. Both
// the route guard and the by-id response used `findRecord` alone, so once a
// refetch dropped the row they let the record back in live, and the NEXT
// refetch flipped it deleted again.
const isLedgerDeleted = (model: Model, section: Section, id: string): boolean =>
  model.deletedRecordIds.includes(deletedKey(section, id)) ||
  findRecord(model, section, id)?.isDeleted === true;

// Upserts a record into a section’s rows, forcing the section to Success —
// the row has to be there whatever state the list is in. Both callers need
// that: a deep-linked record can arrive before the section’s list has been
// fetched, and a newly created one can be saved after that fetch failed.
const upsertRecord = (data: SectionData, entry: Entry): SectionData =>
  SectionData.Success({
    data: upsertEntry(
      Option.getOrElse(AsyncData.getData(data), () => []),
      entry,
    ),
  });

// Maps a section’s loaded rows in place (no-op unless it holds data).
const mapSectionRows = (
  data: SectionData,
  f: (rows: ReadonlyArray<Entry>) => ReadonlyArray<Entry>,
): SectionData => AsyncData.map(data, f);

// The record an update returns, named because the helpers below share it with
// `update` itself.
type UpdateReturn = Update.Return<Model, Message>;

// Programmatic Dialog open/close from the drawer’s domain handlers, lifting
// the component’s Commands into the parent Message. The Dialog’s OutMessage
// stops here (the foldOutMessage Step changes nothing): these run from
// handlers that already evolve the drawer state themselves — the OutMessage
// path is for user-initiated closes (see GotDialogMessage). Both are no-ops
// when the dialog is already in the target state, so callers can thread them
// unconditionally.
const foldDialogOpen = Update.foldChildStep({
  update: Dialog.open,
  read: (model: Model) => Option.some(model.dialog),
  write: (model: Model, dialog) => evo(model, { dialog: () => dialog }),
  toParentMessage: (message) => Message.GotDialogMessage({ message }),
  foldOutMessage: () => (stepModel: Model) => ({ model: stepModel }),
});

const closeDialog = Update.foldChildStep({
  update: Dialog.close,
  read: (model: Model) => Option.some(model.dialog),
  write: (model: Model, dialog) => evo(model, { dialog: () => dialog }),
  toParentMessage: (message) => Message.GotDialogMessage({ message }),
  foldOutMessage: () => (stepModel: Model) => ({ model: stepModel }),
});

// Signed out there is no drawer in the DOM at all — the login view replaces
// the whole shell — so a show command would target a missing <dialog>. A
// pre-auth deep link still records what should be open in `drawer`; sign-in
// re-applies the route and opens it for real then.
const openDialog: Update.Step<Model, Message> = (model) =>
  model.session._tag === 'Anonymous' ? { model } : foldDialogOpen(model);

// Every route that shows a LIST lands on the same state: the route stored, the
// nav closed, and the drawer shut for real — the Dialog submodel included, so
// a back button out of an open record releases the scroll lock and focus trap
// rather than leaving them behind. Home, NotFound, Section and the
// record-that-can’t-be-opened fallback are all this.
const showList = (route: AppRoute): Update.Step<Model, Message> =>
  Update.combine([
    closeDialog,
    (stepModel) => ({
      model: evo(stepModel, {
        route: () => route,
        isMenuOpen: () => false,
        drawer: () => DrawerState.Closed(),
        // Whatever went wrong reaching a record belongs to that attempt, not to
        // the list you land on. Callers that DO want to explain themselves set
        // linkError after this (see the deleted-record guard in applyRoute).
        linkError: () => '',
      }),
    }),
  ]);

// Applies a parsed URL to the model — used both for the initial load and for
// browser back/forward (ChangedUrl). Deep-linking to a specific record is
// fully reliable for Clubs/Nationals (fetched by id via GET /teams/{id} if
// not already loaded); other sections have no single-record endpoint, so a
// link only opens the record if it’s already in the currently loaded list —
// otherwise it falls back to that section’s list.
const applyRoute = (model: Model, route: AppRoute): UpdateReturn =>
  AppRoute.match<UpdateReturn>(route, {
    // The dashboard landing page — the default entrypoint after signing in.
    Home: () => showList(route)(model),
    NotFound: () => showList(route)(model),
    Section: () => showList(route)(model),
    Record: ({ section, id }) => {
      const found = findRecord(model, section, id);
      // A row that IS loaded and soft-deleted is not the same as one that
      // isn’t loaded, and collapsing the two RESURRECTED it: the id fetch
      // below still succeeds (the delete is mock-only and never reached the
      // backend), and SucceededFetchTeamById upserts what comes back as
      // live. Delete a club, land on the section list, press Back — the
      // record returned and its drawer reopened on it. This is one of three
      // doors: SucceededFetchTeamById guards the in-flight response, and
      // mergeLocalEdits guards every full section refetch.
      if (isLedgerDeleted(model, section, id)) {
        return Update.combine(model, [
          showList(route),
          (stepModel) => ({
            model: evo(stepModel, { linkError: () => 'That record was deleted.' }),
          }),
        ]);
      }
      const entry = found;
      if (entry) {
        return Update.combine(model, [
          openDialog,
          (stepModel) => ({
            model: evo(stepModel, {
              route: () => route,
              isMenuOpen: () => false,
              drawer: () => editRecord(entry),
              chartError: () => Option.none(),
              linkError: () => '',
            }),
          }),
        ]);
      }
      if (section === 'clubs' || section === 'nationals') {
        return {
          model: evo(model, {
            route: () => route,
            isMenuOpen: () => false,
          }),
          // Not while signed out: the shell isn’t on screen to show the
          // record, and sign-in re-applies this very route — which fetched
          // the same team a second time for nothing.
          commands: model.session._tag === 'Anonymous' ? [] : [fetchTeamById(section, id)],
        };
      }
      // No single-record endpoint for this section (or it’s mock-only) —
      // fall back to the section’s list instead of a broken "open" state
      // (routeSection still selects the list to show).
      return showList(route)(model);
    },
  });

// The browsable sections and the fetch each kicks off at sign-in. Driving the
// fan-out from this list keeps SubmittedSignIn declarative instead of an
// imperative push per section. (Participations isn’t here — it has no section
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
// and re-fetches; if it’s already pending, revalidateOrLoad returns None and
// nothing happens (no double-fetch).
const retrySection = (
  model: Model,
  section: Section,
  commands: Update.Commands<Message>,
): UpdateReturn =>
  Option.match(AsyncData.revalidateOrLoad(model[section]), {
    onNone: () => ({ model }),
    onSome: (next) => ({ model: evolveSection(model, section, () => next), commands }),
  });

// The user-initiated close intent (Escape, backdrop click, the ✕/Cancel
// controls) arrives as the Dialog’s Closed OutMessage — fold it back into the
// drawer state and return to the current section’s list URL, or the dashboard
// if no section route is active.
const returnToList: Update.Step<Model, Message> = (stepModel) =>
  Option.match(routeSection(stepModel.route), {
    onNone: () => ({
      model: evo(stepModel, {
        route: () => AppRoute.Home(),
        drawer: () => DrawerState.Closed(),
      }),
      commands: [navigate(homeRouter())],
    }),
    onSome: (section) => ({
      model: evo(stepModel, {
        route: () => AppRoute.Section({ section }),
        drawer: () => DrawerState.Closed(),
      }),
      commands: [navigate(sectionRouter({ section }))],
    }),
  });

// Delegates to the Dialog submodel presenting the drawer (see GotDialogMessage).
const foldDialogMessage = Update.foldChild({
  update: Dialog.update,
  read: (model: Model) => Option.some(model.dialog),
  write: (model: Model, dialog) => evo(model, { dialog: () => dialog }),
  toParentMessage: (message) => Message.GotDialogMessage({ message }),
  foldOutMessage: (outMessage: Dialog.OutMessage) =>
    Dialog.OutMessage.match<Update.Step<Model, Message>>(outMessage, {
      Opened: () => (stepModel) => ({ model: stepModel }),
      Closed: () => returnToList,
    }),
});

// Delegates to the drawer’s Tabs submodel. Its Selected OutMessage is a
// committed tab switch — fold the DrawerTab value into the editing state the
// parent owns (see GotTabsMessage).
const foldTabsMessage = Update.foldChild({
  update: DrawerTabs.update,
  read: (model: Model) => Option.some(model.tabs),
  write: (model: Model, tabs) => evo(model, { tabs: () => tabs }),
  toParentMessage: (message) => Message.GotTabsMessage({ message }),
  foldOutMessage:
    ({ value }: Tabs.OutMessage<DrawerTab>) =>
    (stepModel: Model) => ({
      model: evo(stepModel, {
        drawer: (drawer) =>
          drawer._tag === 'Editing' ? evo(drawer, { tab: () => value }) : drawer,
      }),
    }),
});

// Commits one bound of a date column’s range filter (see GotDateFilterMessage).
const setDateBound =
  (
    column: string,
    bound: 'from' | 'to',
    date: Option.Option<typeof Calendar.CalendarDate.Type>,
  ): Update.Step<Model, Message> =>
  (stepModel) => ({
    model: evo(stepModel, {
      dateFilters: (ranges) => ({
        ...ranges,
        [column]: {
          ...(ranges[column] ?? { from: Option.none(), to: Option.none() }),
          [bound]: date,
        },
      }),
      clientPage: () => 1,
    }),
  });

export const update = (model: Model, message: Message): UpdateReturn =>
  Message.match<UpdateReturn>(message, {
    // The credential fields only exist while signed out — a stray input
    // message after sign-in has nothing to write into.
    UpdatedEmail: ({ value }) => ({
      model: evo(model, {
        session: (session) =>
          session._tag === 'Anonymous' ? evo(session, { emailInput: () => value }) : session,
      }),
    }),
    UpdatedPassword: ({ value }) => ({
      model: evo(model, {
        session: (session) =>
          session._tag === 'Anonymous' ? evo(session, { passwordInput: () => value }) : session,
      }),
    }),
    // NOTE: mock sign-in — there is no backend authentication endpoint
    // yet, so any credentials (including empty ones) are accepted. Signing
    // in kicks off every section’s first fetch.
    SubmittedSignIn: () => {
      // Fan out over the section list: every section that isn’t already in
      // flight gets fetched, flipping to Loading — or to Refreshing, which
      // keeps what it holds on screen meanwhile. Fetching only the IDLE
      // sections stranded any section a pre-sign-in deep link had already
      // force-populated with its single record (upsertRecord makes that a
      // Success): it stayed a one-row list until a manual Refresh.
      // Sections and participations are different AsyncData instances but
      // the same six tags, so the in-flight question is asked once — over the
      // union of the two, not over a bare `{_tag: string}` that would accept
      // any struct and let a misspelled tag through.
      const isInFlight = (data: SectionData | ParticipationsData): boolean =>
        data._tag === 'Loading' || data._tag === 'Refreshing';
      const start = (data: SectionData): SectionData =>
        isInFlight(data)
          ? data
          : Option.match(AsyncData.getData(data), {
              onNone: () => SectionData.Loading(),
              onSome: (rows) => SectionData.Refreshing({ data: rows }),
            });
      const startParticipations = (data: ParticipationsData): ParticipationsData =>
        isInFlight(data)
          ? data
          : Option.match(AsyncData.getData(data), {
              onNone: () => ParticipationsData.Loading(),
              onSome: (rows) => ParticipationsData.Refreshing({ data: rows }),
            });
      const sectionFetches = SIGN_IN_SECTIONS.filter(
        (entry) => !isInFlight(model[entry.section]),
      ).map((entry) => entry.fetch(model));
      // Participations gets the same treatment for the same reason: an
      // Idle-only guard stranded a Failure (or a pre-auth deep link’s
      // forced Success) until someone hit Retry by hand.
      const participationsFetch = isInFlight(model.participations) ? [] : [fetchParticipations()];
      const signedIn: Model = evo(model, {
        // Only the email crosses into the signed-in state — the password
        // input is dropped here, not carried along.
        session: (session) =>
          session._tag === 'Anonymous' ? Session.SignedIn({ email: session.emailInput }) : session,
        players: start,
        clubs: start,
        nationals: start,
        competitions: start,
        editions: start,
        associations: start,
        participations: startParticipations,
      });
      // Re-apply the route now that the shell is on screen: a deep link that
      // arrived before sign-in parked its Record route in the model, but the
      // drawer couldn’t be presented from behind the login view (openDialog
      // no-ops while Anonymous). This is what finally opens it.
      return Update.combine(signedIn, [
        (stepModel) => applyRoute(stepModel, stepModel.route),
        (stepModel) => ({
          model: stepModel,
          commands: [...sectionFetches, ...participationsFetch, fetchHealth()],
        }),
      ]);
    },
    // Signing out swaps in the fresh model but keeps the live dialog
    // submodel: the login view doesn’t render the dialog, so if the drawer
    // was open its element unmounts and the component’s Unmounted backstop
    // reclaims the scroll lock and focus trap (a fresh closed dialog model
    // would skip that release). The date filter pickers survive too — they
    // are seeded once by FetchToday at boot. The URL returns home with the
    // model (leaving /players in the bar would deep-link the next sign-in).
    ClickedSignOut: () => ({
      model: evo(initialModel(), {
        dialog: () => model.dialog,
        dateFilterPickers: () => model.dateFilterPickers,
      }),
      commands: [navigate(homeRouter())],
    }),
    // Switching section closes the mobile nav and drawer, and clears filters.
    SelectedSection: ({ section }) =>
      Update.combine(model, [
        closeDialog,
        (stepModel) => ({
          model: evo(stepModel, {
            route: () => AppRoute.Section({ section }),
            isMenuOpen: () => false,
            search: () => '',
            filters: () => ({}),
            dateFilters: () => ({}),
            drawer: () => DrawerState.Closed(),
            clientPage: () => 1,
            linkError: () => '',
            // Fresh closed instances, so a dropdown left open on the previous
            // section can’t carry its open state across.
            filterListboxes: () => initialFilterListboxes(),
          }),
          commands: [navigate(sectionRouter({ section }))],
        }),
      ]),
    // Back to the dashboard landing page.
    ClickedDashboard: () => ({
      model: evo(model, {
        route: () => AppRoute.Home(),
        isMenuOpen: () => false,
        linkError: () => '',
      }),
      commands: [navigate(homeRouter())],
    }),
    ToggledMenu: () => ({ model: evo(model, { isMenuOpen: (open) => !open }) }),
    UpdatedSearch: ({ value }) => ({
      model: evo(model, { search: () => value, clientPage: () => 1 }),
    }),
    // A dropdown column’s exact-match choice; '' (the "All" option) drops
    // the column’s filter entirely.
    SelectedFilter: ({ column, value }) => {
      const { [column]: _removed, ...rest } = model.filters;
      return {
        model: evo(model, {
          filters: () =>
            value === '' ? rest : { ...rest, [column]: ColumnFilter.Exact({ value }) },
          clientPage: () => 1,
        }),
      };
    },
    // Delegates to a checkbox column’s filter Listbox. Its Selected
    // OutMessage flips the value’s membership in that column’s *excluded*
    // (unchecked) set. An emptied set drops the column’s filter — nothing
    // excluded = all checked (the default).
    GotFilterListboxMessage: ({ column, message }) =>
      Update.foldChild({
        update: FilterListbox.update,
        read: (parent: Model) => Option.fromUndefinedOr(parent.filterListboxes[column]),
        write: (parent: Model, listbox) =>
          evo(parent, { filterListboxes: (boxes) => ({ ...boxes, [column]: listbox }) }),
        toParentMessage: (childMessage) =>
          Message.GotFilterListboxMessage({ column, message: childMessage }),
        foldOutMessage:
          ({ value }) =>
          (stepModel: Model) => {
            const current = stepModel.filters[column];
            const excluded = current?._tag === 'Excluded' ? current.excluded : [];
            const nextExcluded = excluded.includes(value)
              ? excluded.filter((v) => v !== value)
              : [...excluded, value];
            const { [column]: _removed, ...rest } = stepModel.filters;
            return {
              model: evo(stepModel, {
                filters: () =>
                  Array.isReadonlyArrayEmpty(nextExcluded)
                    ? rest
                    : { ...rest, [column]: ColumnFilter.Excluded({ excluded: nextExcluded }) },
                clientPage: () => 1,
              }),
            };
          },
      })(message)(model),
    // Today’s date arrived from the clock at boot — seed the date filter
    // DatePickers with it so their calendar grids open onto it.
    FetchedToday: ({ today }) => ({
      model: evo(model, { dateFilterPickers: () => initialDateFilterPickers(today) }),
    }),
    // Delegates to one bound of a date column’s filter DatePicker. Its
    // SelectedDate OutMessage commits that bound of the column’s range;
    // ChangedViewMonth is just the visible month moving.
    GotDateFilterMessage: ({ column, bound, message }) =>
      Update.foldChild({
        update: DatePicker.update,
        read: (parent: Model) =>
          Option.map(
            Option.fromUndefinedOr(parent.dateFilterPickers[column]),
            (pair) => pair[bound],
          ),
        write: (parent: Model, picker) =>
          evo(parent, {
            dateFilterPickers: (pickers) => {
              const pair = pickers[column];
              return pair === undefined
                ? pickers
                : { ...pickers, [column]: { ...pair, [bound]: picker } };
            },
          }),
        toParentMessage: (childMessage) =>
          Message.GotDateFilterMessage({ column, bound, message: childMessage }),
        foldOutMessage: (outMessage: DatePicker.OutMessage) =>
          DatePicker.OutMessage.match<Update.Step<Model, Message>>(outMessage, {
            ChangedViewMonth: () => (stepModel) => ({ model: stepModel }),
            SelectedDate: ({ date }) => setDateBound(column, bound, Option.some(date)),
            ClearedDate: () => setDateBound(column, bound, Option.none()),
          }),
      })(message)(model),
    // Drops both bounds of a date column’s range. Purely parent-side — the
    // DatePickers hold no selection state to reset.
    ClearedDateFilter: ({ column }) => {
      const { [column]: _removed, ...rest } = model.dateFilters;
      return { model: evo(model, { dateFilters: () => rest, clientPage: () => 1 }) };
    },
    // Open the drawer in creation mode: a blank draft, no existing record.
    // Only reachable from a section list — on the dashboard there is no
    // section to create into.
    ClickedAddNew: () =>
      Option.match(routeSection(model.route), {
        onNone: () => ({ model }),
        onSome: (section) =>
          Update.combine(model, [
            openDialog,
            (stepModel) => ({
              model: evo(stepModel, {
                drawer: () => DrawerState.Creating({ section, draft: emptyDraft(section) }),
                chartError: () => Option.none(),
              }),
            }),
          ]),
      }),
    // Open the profile drawer with a working copy of the record’s values.
    ClickedRecord: ({ section, id }) => {
      const entry = findRecord(model, section, id);
      if (!entry) return { model };
      return Update.combine(model, [
        openDialog,
        (stepModel) => ({
          model: evo(stepModel, {
            route: () => AppRoute.Record({ section, id }),
            drawer: () => editRecord(entry),
            chartError: () => Option.none(),
            linkError: () => '',
          }),
          commands: [navigate(recordRouter({ section, id }))],
        }),
      ]);
    },
    // Every keystroke is judged by the column’s own rules, and the verdict is
    // what the Model holds — so the view renders an error without deciding
    // what an error is, and the save asks the same question the field already
    // answered rather than re-implementing it.
    UpdatedDraftField: ({ index, value }) => ({
      model: evo(model, {
        drawer: (drawer) => {
          const column = drawerColumns(drawer)[index];
          const judge = (text: string): FieldValidation.Field<string> =>
            column === undefined
              ? FieldValidation.NotValidated({ value: text })
              : FieldValidation.validate(columnRules(column))(text);
          return withDraft(
            drawer,
            draftOf(drawer).map((current, i) => (i === index ? judge(value) : current)),
          );
        },
      }),
    }),
    // Commit the draft — either creating a new record or updating an
    // existing one (logging which fields changed, for the History tab).
    // Mock only, no backend yet.
    ClickedSaveRecord: () => {
      const drawer = model.drawer;
      if (drawer._tag === 'Creating') {
        const { section } = drawer;
        // A derived column’s draft cell holds the PARENT’S ID — creating is
        // the one mode where it’s editable, and the drawer renders it as a
        // picker over the referenced section. Lifting it into parentId is
        // what actually files the record under its parent: a new edition
        // used to be born with parentId '' and no way to fix it, since the
        // cell goes read-only the moment the record exists.
        const columns = sectionData[section].columns;
        const values = draftValues(drawer);
        const referenceIndex = Array.findFirstIndex(
          columns,
          (column) => column.derived !== undefined,
        );
        const parentId = pipe(
          referenceIndex,
          Option.flatMap((index) => Array.get(values, index)),
          Option.getOrElse(() => ''),
        );
        // The same question the drawer asks to block Save, asked of the same
        // rules — not a second implementation of it. A held Enter or a
        // replayed message must not file a record the form would refuse.
        if (!isDraftSavable(section, drawer.draft)) return { model };
        const entry: Entry = {
          section,
          values,
          isDeleted: false,
          id: `${LOCAL_ID_PREFIX}${model.nextLocalId}`,
          parentId,
        };
        // Forced in rather than mapped over the loaded rows: AsyncData.map
        // is a no-op on Idle/Loading/Failure, so saving a new record after a
        // failed section fetch used to discard it silently while the drawer
        // closed as though it had saved.
        const withRow = evolveSection(model, section, (data) => upsertRecord(data, entry));
        return Update.combine(withRow, [
          closeDialog,
          (stepModel) => ({
            model: evo(stepModel, {
              route: () => AppRoute.Section({ section }),
              nextLocalId: (n) => n + 1,
              drawer: () => DrawerState.Closed(),
              // The record exists NOW; its History entry needs a clock, which
              // `update` can’t read. StampSave answers with SavedRecordAt, and
              // the drawer is closed by then — that is how the handler knows a
              // create is what it is stamping (see SavedRecordAt).
              pendingLogRecordId: () => entry.id,
            }),
            commands: [stampSave(), navigate(sectionRouter({ section }))],
          }),
        ]);
      }
      if (drawer._tag !== 'Editing') return { model };
      // Editing commits with a timestamped edit log. The timestamp comes from
      // the clock via StampSave (keeping `update` pure); SavedRecordAt then
      // does the commit with it.
      return { model, commands: [stampSave()] };
    },
    SavedRecordAt: ({ at }) => {
      // A create left its id behind and closed the drawer; an edit still has
      // it open. One stamp, two events.
      if (model.pendingLogRecordId !== '') {
        return {
          model: evo(model, {
            editLog: (log) => [
              LogEntry.RecordCreated({ recordId: model.pendingLogRecordId, at }),
              ...log,
            ],
            pendingLogRecordId: () => '',
          }),
        };
      }
      const drawer = model.drawer;
      if (drawer._tag !== 'Editing') return { model };
      const { section, id } = drawer;
      const entry = findRecord(model, section, id);
      if (!entry) return { model };

      const draft = draftValues(drawer);
      const columns = sectionData[section].columns;
      const changes: ReadonlyArray<LogEntry> = columns.flatMap((column, i) => {
        const from = entry.values[i] ?? '';
        const to = draft[i] ?? '';
        return from === to
          ? []
          : [LogEntry.FieldChanged({ recordId: id, field: column.label, from, to, at })];
      });

      const withRows = evolveSection(model, section, (data) =>
        mapSectionRows(data, (rows) =>
          rows.map((row) => (row.id === id ? evo(row, { values: () => draft }) : row)),
        ),
      );
      return Update.combine(withRows, [
        closeDialog,
        (stepModel) => ({
          model: evo(stepModel, {
            route: () => AppRoute.Section({ section }),
            editLog: (log) => [...changes, ...log],
            drawer: () => DrawerState.Closed(),
          }),
          commands: [navigate(sectionRouter({ section }))],
        }),
      ]);
    },
    // Delegates to the Dialog submodel. Its Closed OutMessage is the user’s
    // close intent (Escape, backdrop click, the ✕/Cancel controls) — fold it
    // back into the drawer state and return to the section’s list URL.
    GotDialogMessage: ({ message }) => foldDialogMessage(message)(model),
    // Delegates to the Tabs submodel. Its Selected OutMessage is a committed
    // tab switch — fold the DrawerTab value into the editing state the
    // parent owns.
    GotTabsMessage: ({ message }) => foldTabsMessage(message)(model),
    ClickedDeleteRecord: () => ({
      model: evo(model, {
        drawer: (drawer) =>
          drawer._tag === 'Editing' ? evo(drawer, { isConfirmingDelete: () => true }) : drawer,
      }),
    }),
    ClickedCancelDelete: () => ({
      model: evo(model, {
        drawer: (drawer) =>
          drawer._tag === 'Editing' ? evo(drawer, { isConfirmingDelete: () => false }) : drawer,
      }),
    }),
    // Soft-delete: mark the record and close the drawer (mock — no backend yet).
    ClickedConfirmDelete: () => {
      const drawer = model.drawer;
      if (drawer._tag !== 'Editing') return { model };
      const { section, id } = drawer;
      const withRows = evolveSection(model, section, (data) =>
        mapSectionRows(data, (rows) =>
          rows.map((row) => (row.id === id ? evo(row, { isDeleted: () => true }) : row)),
        ),
      );
      return Update.combine(withRows, [
        closeDialog,
        (stepModel) => ({
          model: evo(stepModel, {
            route: () => AppRoute.Section({ section }),
            drawer: () => DrawerState.Closed(),
            // The ledger, not the row flag, is what survives a refetch.
            deletedRecordIds: (ids) => [...ids, deletedKey(section, id)],
            pendingLogRecordId: () => id,
          }),
          commands: [stampDelete(), navigate(sectionRouter({ section }))],
        }),
      ]);
    },
    DeletedRecordAt: ({ at }) => ({
      model: evo(model, {
        editLog: (log) =>
          model.pendingLogRecordId === ''
            ? log
            : [LogEntry.RecordDeleted({ recordId: model.pendingLogRecordId, at }), ...log],
        pendingLogRecordId: () => '',
      }),
    }),
    // Once a chart’s host element is mounted, push the current record’s
    // data into it (mirrors Foldkit’s charting example: Mount only creates
    // the chart instance, Command feeds it data). Two hosts share this
    // message — branch on which one just mounted.
    SucceededMountChart: ({ hostId }) => {
      const entry = drawerRecord(model);
      if (!entry) return { model: evo(model, { chartError: () => Option.none() }) };
      if (hostId === POINTS_CHART_HOST_ID) {
        return {
          model: evo(model, { chartError: () => Option.none() }),
          commands: [syncPointsChart({ hostId, ...pointsFor(entry) })],
        };
      }
      return {
        model: evo(model, { chartError: () => Option.none() }),
        commands: [syncChart({ hostId, ...statsFor(entry) })],
      };
    },
    FailedMountChart: ({ reason }) => ({
      model: evo(model, { chartError: () => Option.some(reason) }),
    }),
    SucceededSyncChart: () => ({ model }),
    FailedSyncChart: ({ reason }) => ({
      model: evo(model, { chartError: () => Option.some(reason) }),
    }),
    // A fetched page replaces the section’s rows (one page at a time, not the
    // running total). settle folds the result into the AsyncData: success →
    // Success, failure → Failure or, if a prior page is still shown, Stale.
    SucceededFetchPlayers: ({ entries, total }) => ({
      model: evo(model, {
        players: (data) =>
          SectionData.Success({
            data: mergeLocalEdits(data, entries, 'players', model.deletedRecordIds),
          }),
        playersTotal: () => total,
      }),
    }),
    FailedFetchPlayers: ({ reason }) => ({
      model: evo(model, { players: (data) => AsyncData.settle(data, Result.fail(reason)) }),
    }),
    ClickedRetryPlayers: () =>
      retrySection(model, 'players', [fetchPlayers(model.playersPage), fetchHealth()]),
    // Clamped against the advertised page count, and a no-op while a page
    // fetch is already in flight (revalidateOrLoad answers None) — the
    // arrows disable themselves, but a double click or a held key can still
    // land two messages before the view catches up.
    ClickedPlayersPage: ({ page }) => {
      const totalPages = Math.max(1, Math.ceil(model.playersTotal / PAGE_SIZE));
      const target = Math.min(totalPages, Math.max(1, page));
      return Option.match(AsyncData.revalidateOrLoad(model.players), {
        onNone: () => ({ model }),
        onSome: (players) => ({
          model: evo(model, { players: () => players, playersPage: () => target }),
          commands: [fetchPlayers(target)],
        }),
      });
    },
    ClickedClientPage: ({ page }) => ({ model: evo(model, { clientPage: () => page }) }),
    SucceededFetchClubs: ({ entries }) => ({
      model: evo(model, {
        clubs: (data) =>
          SectionData.Success({
            data: mergeLocalEdits(data, entries, 'clubs', model.deletedRecordIds),
          }),
      }),
    }),
    FailedFetchClubs: ({ reason }) => ({
      model: evo(model, { clubs: (data) => AsyncData.settle(data, Result.fail(reason)) }),
    }),
    ClickedRetryClubs: () => retrySection(model, 'clubs', [fetchClubs(), fetchHealth()]),
    SucceededFetchNationals: ({ entries }) => ({
      model: evo(model, {
        nationals: (data) =>
          SectionData.Success({
            data: mergeLocalEdits(data, entries, 'nationals', model.deletedRecordIds),
          }),
      }),
    }),
    FailedFetchNationals: ({ reason }) => ({
      model: evo(model, { nationals: (data) => AsyncData.settle(data, Result.fail(reason)) }),
    }),
    ClickedRetryNationals: () =>
      retrySection(model, 'nationals', [fetchNationals(), fetchHealth()]),
    SucceededFetchCompetitions: ({ entries }) => ({
      model: evo(model, {
        competitions: (data) =>
          SectionData.Success({
            data: mergeLocalEdits(data, entries, 'competitions', model.deletedRecordIds),
          }),
      }),
    }),
    FailedFetchCompetitions: ({ reason }) => ({
      model: evo(model, {
        competitions: (data) => AsyncData.settle(data, Result.fail(reason)),
      }),
    }),
    ClickedRetryCompetitions: () =>
      retrySection(model, 'competitions', [fetchCompetitions(), fetchHealth()]),
    SucceededFetchEditions: ({ entries }) => ({
      model: evo(model, {
        editions: (data) =>
          SectionData.Success({
            data: mergeLocalEdits(data, entries, 'editions', model.deletedRecordIds),
          }),
      }),
    }),
    FailedFetchEditions: ({ reason }) => ({
      model: evo(model, { editions: (data) => AsyncData.settle(data, Result.fail(reason)) }),
    }),
    ClickedRetryEditions: () => retrySection(model, 'editions', [fetchEditions(), fetchHealth()]),
    SucceededFetchAssociations: ({ entries }) => ({
      model: evo(model, {
        associations: (data) =>
          SectionData.Success({
            data: mergeLocalEdits(data, entries, 'associations', model.deletedRecordIds),
          }),
      }),
    }),
    FailedFetchAssociations: ({ reason }) => ({
      model: evo(model, {
        associations: (data) => AsyncData.settle(data, Result.fail(reason)),
      }),
    }),
    ClickedRetryAssociations: () =>
      retrySection(model, 'associations', [fetchAssociations(), fetchHealth()]),
    SucceededFetchParticipations: ({ participations }) => ({
      model: evo(model, {
        participations: () => ParticipationsData.Success({ data: participations }),
      }),
    }),
    FailedFetchParticipations: ({ reason }) => ({
      model: evo(model, {
        participations: (data) => AsyncData.settle(data, Result.fail(reason)),
      }),
    }),
    ClickedRetryParticipations: () =>
      Option.match(AsyncData.revalidateOrLoad(model.participations), {
        onNone: () => ({ model }),
        onSome: (next) => ({
          model: evo(model, { participations: () => next }),
          commands: [fetchParticipations(), fetchHealth()],
        }),
      }),
    SucceededFetchHealth: () => ({ model: evo(model, { serverHealth: () => 'Ok' }) }),
    FailedFetchHealth: () => ({ model: evo(model, { serverHealth: () => 'Down' }) }),
    // Internal anchor clicks navigate within the app; anything else is a
    // real page load.
    ClickedLink: ({ request }) =>
      UrlRequest.match<UpdateReturn>(request, {
        Internal: ({ url }) => ({ model, commands: [navigate(urlToString(url))] }),
        External: ({ href }) => ({ model, commands: [load(href)] }),
      }),
    // Fires on browser back/forward (pushUrl from our own Navigate command
    // updates the model directly instead, so this only reacts to real
    // navigation).
    ChangedUrl: ({ url }) => applyRoute(model, urlToAppRoute(url)),
    CompletedNavigate: () => ({ model }),
    CompletedLoad: () => ({ model }),
    // The record wasn’t in the currently loaded list, so it was fetched
    // directly by id — insert it into its section and open its drawer.
    SucceededFetchTeamById: ({ entry }) => {
      // The response is authoritative about the record’s FIELDS and knows
      // nothing about the editor deleting it — and this fetch can still be in
      // flight when they do. Landing it as live would resurrect the record and
      // reopen its drawer, which is the same defect the route guard fixes from
      // the other side.
      if (isLedgerDeleted(model, entry.section, entry.id)) {
        return { model: evo(model, { linkError: () => 'That record was deleted.' }) };
      }
      const withRow = evolveSection(model, entry.section, (data) => upsertRecord(data, entry));
      return Update.combine(withRow, [
        openDialog,
        (stepModel) => ({
          model: evo(stepModel, {
            drawer: () => editRecord(entry),
            chartError: () => Option.none(),
            linkError: () => '',
          }),
        }),
      ]);
    },
    FailedFetchTeamById: ({ reason }) => ({ model: evo(model, { linkError: () => reason }) }),
  });

// INIT

// Boot applies the initial URL and fetches today’s date for the date filter
// pickers (see FetchedToday).
export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) =>
  Update.combine(initialModel(), [
    (stepModel) => applyRoute(stepModel, urlToAppRoute(url)),
    (stepModel) => ({ model: stepModel, commands: [fetchToday()] }),
  ]);
