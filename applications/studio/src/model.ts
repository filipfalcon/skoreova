// The studio's Model, the record Entry, and the drawer state union.

import { Schema as S } from 'effect';
import { DatePicker, Dialog, Listbox, Tabs } from '@foldkit/ui';
import { AsyncData, Calendar } from 'foldkit';

import { ParticipationResponse } from './participationsApi';
import { Section } from './section';

// The one Dialog instance the app renders (the record drawer). The id keys the
// native <dialog> element and the framework's per-dialog resource accounting.
export const DRAWER_DIALOG_ID = 'record-drawer';

// Who is using the studio. A tagged union so the credential inputs only
// exist while signing in — after sign-in the model carries the email alone,
// and the plaintext password can't linger in state (or DevTools snapshots).
export const Anonymous = S.TaggedStruct('Anonymous', {
  emailInput: S.String,
  passwordInput: S.String,
});
export const SignedIn = S.TaggedStruct('SignedIn', { email: S.String });
export const Session = S.Union([Anonymous, SignedIn]);
export type Session = typeof Session.Type;

// One record. `values` line up with the section's columns (see `sectionData`).
export const Entry = S.Struct({
  section: Section,
  values: S.Array(S.String),
  // Soft-deleted rather than removed, so its index stays stable for `editLog`.
  isDeleted: S.Boolean,
  // Server-assigned UUID once this record is backed by the API, '' for
  // records that only exist locally (mock rows, or a record not yet saved).
  id: S.String,
  // Generic "belongs to" reference, e.g. an edition's owning competition.
  // '' when not applicable.
  parentId: S.String,
});
export type Entry = typeof Entry.Type;

export const DrawerTab = S.Literals(['Overview', 'Persistency', 'History']);
export type DrawerTab = typeof DrawerTab.Type;

// The drawer's Tabs instance, Value-typed so its Selected OutMessage carries a
// DrawerTab (not a bare string). The id keys the tab/panel DOM ids the
// component's roving focus targets.
export const DRAWER_TABS_ID = 'drawer-tabs';
// The annotation keeps the declaration emit portable (the inferred type would
// reference foldkit internals — TS2883).
export const DrawerTabs: ReturnType<typeof Tabs.create<DrawerTab>> = Tabs.create<DrawerTab>();

// The multi-select Listbox behind every checkbox column filter. One shared
// component pair; each column gets its own Model instance in
// `filterListboxes` (see `initialFilterListboxes` in data.ts).
export const FilterListbox: ReturnType<typeof Listbox.Multi.create<string>> =
  Listbox.Multi.create<string>();

// A date column's from/to range filter as typed CalendarDates — replaces the
// old comma-joined "from,to" string that rode in the `filters` slot. Either
// side may be unset.
export const DateRangeFilter = S.Struct({
  from: S.Option(Calendar.CalendarDate),
  to: S.Option(Calendar.CalendarDate),
});
export type DateRangeFilter = typeof DateRangeFilter.Type;

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
  isConfirmingDelete: S.Boolean,
});
export const DrawerState = S.Union([DrawerClosed, DrawerCreating, DrawerEditing]);
export type DrawerState = typeof DrawerState.Type;

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

// A section's fetch is a six-state AsyncData: Idle before sign-in, Loading on
// the first fetch, Success holding its rows, Failure holding the error, and
// Refreshing/Stale for stale-while-revalidate on retry. This replaces the flat
// `xRequest`/`xError` pair per section, so a "loaded" state can't carry a stale
// error, and the rows live inside Success (there's no separate flat array to
// drift out of sync).
export const SectionData = AsyncData.Schema(S.Array(Entry), S.String);
export type SectionData = typeof SectionData.schema.Type;

// Participations are a pure join (no list UI), so they carry their own decoded
// rows rather than Entry rows.
export const ParticipationsData = AsyncData.Schema(S.Array(ParticipationResponse), S.String);

export const Model = S.Struct({
  session: Session,
  section: Section,
  // Whether the nav is open. Only affects small screens; from `md:` up the
  // sidebar is always visible.
  isMenuOpen: S.Boolean,
  search: S.String,
  // One dropdown filter per column of the current section. `filters[i]` is the
  // selected value for `columns[i]`, or '' for "All". Index 0 (the title
  // column) is unused but kept so indices line up with `columns`.
  filters: S.Array(S.String),
  // The profile drawer: closed, creating a new record, or editing one by id.
  drawer: DrawerState,
  // The Dialog submodel presenting the drawer: the native <dialog> element,
  // its backdrop, focus trap, Escape handling, and scroll lock. `drawer` stays
  // the source of truth for WHAT is open; this owns HOW it is presented, so
  // every handler that opens/closes `drawer` threads the dialog alongside.
  dialog: Dialog.Model,
  // The drawer's Tabs submodel (roving focus, activation mode). The active tab
  // itself is parent-owned: it lives on DrawerEditing's `tab`.
  tabs: Tabs.Model,
  // Client-side id source for records created in the mock (the backend would
  // assign one). Monotonic so a created row gets a stable, unique id the
  // drawer and keyed lists can address.
  nextLocalId: S.Number,
  // History of committed field edits, across all records.
  editLog: S.Array(LogEntry),
  // Message from the last chart mount/sync attempt, or '' if it's fine.
  chartError: S.Option(S.String),
  // Each section's fetch state, holding its own rows in Success. Field names
  // match the Section literals, so `model[section]` selects a section's state.
  players: SectionData.schema,
  clubs: SectionData.schema,
  nationals: SectionData.schema,
  competitions: SectionData.schema,
  editions: SectionData.schema,
  associations: SectionData.schema,
  // Which team played in which edition. Not browsable as its own section —
  // only used to resolve an edition's participating teams in its Overview tab.
  participations: ParticipationsData.schema,
  // Only /players is paginated server-side right now; Clubs/Nationals fetch
  // everything in one request.
  playersPage: S.Number,
  playersTotal: S.Number,
  // Whether the backend is reachable at all, via GET /health — shown as the
  // diode on every API-backed section's Refresh button. Separate from each
  // section's own request status, since a health check is cheaper/faster
  // than waiting on a full list fetch to fail.
  serverHealth: S.Literals(['Unknown', 'Ok', 'Down']),
  // Page within the current section's *filtered* list, for every section
  // other than Players (which pages server-side instead). Resets to 1 on
  // section switch, search, or filter change.
  clientPage: S.Number,
  // Set when a shared record link couldn't be resolved (e.g. a deleted team,
  // or a player not on the currently loaded page — see FetchTeamById).
  linkError: S.String,
  // Whether the dashboard landing page is shown instead of a section's list.
  // This is the default entrypoint right after signing in.
  isShowingDashboard: S.Boolean,
  // One multi-select Listbox submodel per checkbox filter column (see
  // checkboxColumns), keyed by the column's name. Only interaction state
  // lives here — the selection stays in `filters` as the excluded set.
  filterListboxes: S.Record(S.String, Listbox.Multi.Model),
  // The active from/to range per date filter column (see dateColumns), keyed
  // by the column's name. Absent key = no range set.
  dateFilters: S.Record(S.String, DateRangeFilter),
  // One from/to pair of DatePicker submodels per date filter column. Only
  // interaction state (popover, visible month) lives here — the selection is
  // parent-owned in `dateFilters`. Empty until FetchToday resolves at boot,
  // which is invisible: the pickers only render after sign-in.
  dateFilterPickers: S.Record(S.String, S.Struct({ from: DatePicker.Model, to: DatePicker.Model })),
});
export type Model = typeof Model.Type;
