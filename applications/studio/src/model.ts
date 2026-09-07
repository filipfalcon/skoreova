// The studio’s Model, the record Entry, and the drawer state union.

import { Schema } from 'effect';
import { DatePicker, Dialog, Listbox, Tabs } from '@foldkit/ui';
import { AsyncData, Calendar } from 'foldkit';
import { Field } from 'foldkit/fieldValidation';
import { defineTaggedUnion } from 'foldkit/schema';

import { ParticipationResponse } from './participationsApi';
import { AppRoute } from './route';
import { Section } from './section';

// The one Dialog instance the app renders (the record drawer). The id keys the
// native <dialog> element and the framework’s per-dialog resource accounting.
export const DRAWER_DIALOG_ID = 'record-drawer';

// Who is using the studio. A tagged union so the credential inputs only
// exist while signing in — after sign-in the model carries the email alone,
// and the plaintext password can’t linger in state (or DevTools snapshots).
export const Session = defineTaggedUnion({
  Anonymous: {
    emailInput: Schema.String,
    passwordInput: Schema.String,
  },
  SignedIn: { email: Schema.String },
});
export type Session = typeof Session.Type;

// One record. `values` line up with the section’s columns (see `sectionData`).
export const Entry = Schema.Struct({
  section: Section,
  values: Schema.Array(Schema.String),
  // Soft-deleted rather than removed, so its index stays stable for `editLog`.
  isDeleted: Schema.Boolean,
  // Server-assigned UUID for a record backed by the API; a record created in
  // the studio gets a local `local-<n>` id from `nextLocalId` until a save
  // endpoint exists to hand out a real one. Either way it is never blank —
  // the drawer and the keyed lists address a record by it.
  id: Schema.String,
  // Generic "belongs to" reference, e.g. an edition’s owning competition.
  // '' when not applicable.
  parentId: Schema.String,
});
export type Entry = typeof Entry.Type;

// Records created in the studio carry this prefix until a real save endpoint
// exists to hand out server ids — it is how a fetch response tells "this row
// came from the wire" from "this row only exists here" (see mergeLocalEdits).
export const LOCAL_ID_PREFIX = 'local-';

export const DrawerTab = Schema.Literals(['Overview', 'Persistency', 'History']);
export type DrawerTab = typeof DrawerTab.Type;

// The drawer’s Tabs instance, Value-typed so its Selected OutMessage carries a
// DrawerTab (not a bare string). The id keys the tab/panel DOM ids the
// component’s roving focus targets.
export const DRAWER_TABS_ID = 'drawer-tabs';
// The annotation keeps the declaration emit portable (the inferred type would
// reference foldkit internals — TS2883).
export const DrawerTabs: ReturnType<typeof Tabs.create<DrawerTab>> = Tabs.create<DrawerTab>();

// The multi-select Listbox behind every checkbox column filter. One shared
// component pair; each column gets its own Model instance in
// `filterListboxes` (see `initialFilterListboxes` in data.ts).
export const FilterListbox: ReturnType<typeof Listbox.Multi.create<string>> =
  Listbox.Multi.create<string>();

// One column’s list filter, keyed by column name in `Model.filters` (an
// absent key means "All"). Exact is a dropdown column’s single choice;
// Excluded is a checkbox column’s *unchecked* set — a row passes unless its
// value is in it. Tagged variants replace the old per-index string slot that
// multiplexed both encodings comma-joined (a value containing a comma
// corrupted the excluded set).
export const ColumnFilter = defineTaggedUnion({
  Exact: { value: Schema.String },
  Excluded: { excluded: Schema.Array(Schema.String) },
});
export type ColumnFilter = typeof ColumnFilter.Type;

// A date column’s from/to range filter as typed CalendarDates — replaces the
// old comma-joined "from,to" string that rode in the `filters` slot. Either
// side may be unset.
export const DateRangeFilter = Schema.Struct({
  from: Schema.Option(Calendar.CalendarDate),
  to: Schema.Option(Calendar.CalendarDate),
});
export type DateRangeFilter = typeof DateRangeFilter.Type;

// The profile drawer’s state. A tagged union so its shape can’t drift into an
// impossible state (a draft with the drawer closed, a delete-confirm on a
// record that isn’t open). An open record is addressed by its stable
// section+id, NOT a row index, so a background refetch that rebuilds `rows`
// can’t repoint the drawer at a different record.
// The draft carries each cell’s VALIDATION STATE, not a bare string — the
// four-state Field the framework models a form cell with (see
// foldkit/fieldValidation). The rules live beside the column descriptors in
// data.ts; this is where the answer for the value currently typed lives, so
// the view can render an error without re-deriving it and the save can refuse
// without a bespoke check of its own.
export const DrawerState = defineTaggedUnion({
  Closed: {},
  Creating: {
    section: Section,
    draft: Schema.Array(Field(Schema.String)),
  },
  Editing: {
    section: Section,
    id: Schema.String,
    tab: DrawerTab,
    draft: Schema.Array(Field(Schema.String)),
    isConfirmingDelete: Schema.Boolean,
  },
});
export type DrawerState = typeof DrawerState.Type;

// One recorded change to a field, for the drawer’s History tab. Keyed by the
// record’s id (not its row index), so the log stays attached to its record
// across refetches.
// THE RECORD’S HISTORY, as tagged events rather than one struct shaped like a
// field edit. Creating and deleting are not field changes — they have no field,
// no from and no to — so logging them through that shape meant either lying
// with empty strings or not logging them at all, and it was the second. Every
// event carries a clock-stamped `at`: each intent has its own Command, so none
// of them has to invent a timestamp inside `update`.
export const LogEntry = defineTaggedUnion({
  FieldChanged: {
    recordId: Schema.String,
    field: Schema.String,
    from: Schema.String,
    to: Schema.String,
    at: Schema.String,
  },
  RecordCreated: { recordId: Schema.String, at: Schema.String },
  RecordDeleted: { recordId: Schema.String, at: Schema.String },
});
export type LogEntry = typeof LogEntry.Type;

// A section’s fetch is a six-state AsyncData: Idle before sign-in, Loading on
// the first fetch, Success holding its rows, Failure holding the error, and
// Refreshing/Stale for stale-while-revalidate on retry. This replaces the flat
// `xRequest`/`xError` pair per section, so a "loaded" state can’t carry a stale
// error, and the rows live inside Success (there’s no separate flat array to
// drift out of sync).
export const SectionData = AsyncData.Schema(Schema.Array(Entry), Schema.String);
export type SectionData = typeof SectionData.schema.Type;

// Participations are a pure join (no list UI), so they carry their own decoded
// rows rather than Entry rows.
export const ParticipationsData = AsyncData.Schema(
  Schema.Array(ParticipationResponse),
  Schema.String,
);
export type ParticipationsData = typeof ParticipationsData.schema.Type;

export const Model = Schema.Struct({
  session: Session,
  // The current route is the source of truth for what’s on screen — the
  // section list (or the dashboard landing page) is derived from it via
  // routeSection, so no separate section/dashboard flags can drift out of
  // sync with the URL.
  route: AppRoute,
  // Whether the nav is open. Only affects small screens; from `md:` up the
  // sidebar is always visible.
  isMenuOpen: Schema.Boolean,
  search: Schema.String,
  // The active list filter per column of the current section, keyed by the
  // column’s name (see ColumnFilter). Absent key = "All".
  filters: Schema.Record(Schema.String, ColumnFilter),
  // The profile drawer: closed, creating a new record, or editing one by id.
  drawer: DrawerState,
  // The Dialog submodel presenting the drawer: the native <dialog> element,
  // its backdrop, focus trap, Escape handling, and scroll lock. `drawer` stays
  // the source of truth for WHAT is open; this owns HOW it is presented, so
  // every handler that opens/closes `drawer` threads the dialog alongside.
  dialog: Dialog.Model,
  // The drawer’s Tabs submodel (roving focus, activation mode). The active tab
  // itself is parent-owned: it lives on DrawerEditing’s `tab`.
  tabs: Tabs.Model,
  // Client-side id source for records created in the mock (the backend would
  // assign one). Monotonic so a created row gets a stable, unique id the
  // drawer and keyed lists can address.
  nextLocalId: Schema.Number,
  // History of committed field edits, across all records.
  editLog: Schema.Array(LogEntry),
  // Why the last chart mount/sync failed; None when there is nothing wrong.
  chartError: Schema.Option(Schema.String),
  // Each section’s fetch state, holding its own rows in Success. Field names
  // match the Section literals, so `model[section]` selects a section’s state.
  players: SectionData.schema,
  clubs: SectionData.schema,
  nationals: SectionData.schema,
  competitions: SectionData.schema,
  editions: SectionData.schema,
  associations: SectionData.schema,
  // Which team played in which edition. Not browsable as its own section —
  // only used to resolve an edition’s participating teams in its Overview tab.
  participations: ParticipationsData.schema,
  // Only /players is paginated server-side right now; Clubs/Nationals fetch
  // everything in one request.
  playersPage: Schema.Number,
  playersTotal: Schema.Number,
  // Whether the backend is reachable at all, via GET /health — shown as the
  // diode on every API-backed section’s Refresh button. Separate from each
  // section’s own request status, since a health check is cheaper/faster
  // than waiting on a full list fetch to fail.
  serverHealth: Schema.Literals(['Unknown', 'Ok', 'Down']),
  // Page within the current section’s *filtered* list, for every section
  // other than Players (which pages server-side instead). Resets to 1 on
  // section switch, search, or filter change.
  clientPage: Schema.Number,
  // THE DELETE LEDGER: `section:id` for every record soft-deleted this
  // session. The row’s own `isDeleted` flag is what the list renders from, but
  // it cannot be the source of truth — a fetch response replaces the rows, and
  // on Players it replaces them with a DIFFERENT PAGE, where the deleted id
  // isn’t present to be preserved. Deleting on page 1 and paging to page 2 lost
  // the marker outright. This ledger outlives any page (see mergeLocalEdits).
  deletedRecordIds: Schema.Array(Schema.String),
  // The record a clock read is in flight for: a create or a delete has already
  // committed, and its History event is waiting on StampSave/StampDelete to
  // answer with a timestamp. '' when nothing is pending.
  pendingLogRecordId: Schema.String,
  // Set when a shared record link couldn’t be resolved (e.g. a deleted team,
  // or a player not on the currently loaded page — see FetchTeamById).
  linkError: Schema.String,
  // One multi-select Listbox submodel per checkbox filter column (see
  // checkboxColumnLabels in data.ts), keyed by the column’s name. Only interaction state
  // lives here — the selection stays in `filters` as the excluded set.
  filterListboxes: Schema.Record(Schema.String, Listbox.Multi.Model),
  // The active from/to range per date filter column (see dateColumnLabels in
  // data.ts), keyed by the column’s name. Absent key = no range set.
  dateFilters: Schema.Record(Schema.String, DateRangeFilter),
  // One from/to pair of DatePicker submodels per date filter column. Only
  // interaction state (popover, visible month) lives here — the selection is
  // parent-owned in `dateFilters`. Empty until FetchToday resolves at boot,
  // which is invisible: the pickers only render after sign-in.
  dateFilterPickers: Schema.Record(
    Schema.String,
    Schema.Struct({ from: DatePicker.Model, to: DatePicker.Model }),
  ),
});
export type Model = typeof Model.Type;
