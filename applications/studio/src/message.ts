// Every studio Message.

import { Schema } from 'effect';
import { DatePicker, Dialog, Listbox, Tabs } from '@foldkit/ui';
import { Calendar } from 'foldkit';
import { defineMessageUnion } from 'foldkit/message';
import { UrlRequest } from 'foldkit/navigation';
import { Url } from 'foldkit/url';

import { ParticipationResponse } from './participationsApi';
import { Section } from './section';
import { Entry } from './model';

export const Message = defineMessageUnion({
  UpdatedEmail: { value: Schema.String },
  UpdatedPassword: { value: Schema.String },
  // The sign-in form’s submit — fired by the arrow button and by Enter in
  // either field (the view is a real h.form with OnSubmit).
  SubmittedSignIn: {},
  ClickedSignOut: {},
  SelectedSection: { section: Section },
  ToggledMenu: {},
  UpdatedSearch: { value: Schema.String },
  // A dropdown column’s exact-match choice ('' clears it back to "All").
  SelectedFilter: { column: Schema.String, value: Schema.String },
  ClickedAddNew: {},
  ClickedRecord: { section: Section, id: Schema.String },
  UpdatedDraftField: { index: Schema.Number, value: Schema.String },
  ClickedSaveRecord: {},
  // Carries the edit-log timestamp fetched from the clock by StampSave, so the
  // commit stays out of `update`'s pure path.
  SavedRecordAt: { at: Schema.String },
  // Same shape for the delete: its own Command reads the clock, so the History
  // event carries a real timestamp instead of one invented in `update`.
  DeletedRecordAt: { at: Schema.String },
  // Wraps a Dialog submodel message for delegation. The drawer’s close controls
  // (✕, Cancel, backdrop, Escape) all flow through here as RequestedClose; the
  // close intent comes back out as the Dialog’s Closed OutMessage.
  GotDialogMessage: { message: Dialog.Message },
  // Wraps a Tabs submodel message for delegation. A committed tab comes back out
  // as the Tabs' Selected OutMessage, folded into DrawerEditing’s `tab`.
  GotTabsMessage: { message: Tabs.Message },
  SucceededMountChart: { hostId: Schema.String },
  FailedMountChart: { reason: Schema.String },
  SucceededSyncChart: {},
  FailedSyncChart: { reason: Schema.String },
  ClickedDeleteRecord: {},
  ClickedConfirmDelete: {},
  ClickedCancelDelete: {},
  SucceededFetchPlayers: {
    entries: Schema.Array(Entry),
    total: Schema.Number,
  },
  FailedFetchPlayers: { reason: Schema.String },
  ClickedRetryPlayers: {},
  ClickedPlayersPage: { page: Schema.Number },
  ClickedClientPage: { page: Schema.Number },
  SucceededFetchClubs: { entries: Schema.Array(Entry) },
  FailedFetchClubs: { reason: Schema.String },
  ClickedRetryClubs: {},
  SucceededFetchNationals: { entries: Schema.Array(Entry) },
  FailedFetchNationals: { reason: Schema.String },
  ClickedRetryNationals: {},
  SucceededFetchCompetitions: {
    entries: Schema.Array(Entry),
  },
  FailedFetchCompetitions: { reason: Schema.String },
  ClickedRetryCompetitions: {},
  SucceededFetchEditions: { entries: Schema.Array(Entry) },
  FailedFetchEditions: { reason: Schema.String },
  ClickedRetryEditions: {},
  SucceededFetchAssociations: {
    entries: Schema.Array(Entry),
  },
  FailedFetchAssociations: { reason: Schema.String },
  ClickedRetryAssociations: {},
  SucceededFetchParticipations: {
    participations: Schema.Array(ParticipationResponse),
  },
  FailedFetchParticipations: { reason: Schema.String },
  ClickedRetryParticipations: {},
  SucceededFetchHealth: {},
  FailedFetchHealth: { reason: Schema.String },
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  CompletedNavigate: {},
  CompletedLoad: {},
  SucceededFetchTeamById: { entry: Entry },
  FailedFetchTeamById: { reason: Schema.String },
  ClickedDashboard: {},
  // Wraps a checkbox filter Listbox message for delegation, keyed by the
  // column the instance belongs to. A toggled value comes back out as the
  // Listbox’s Selected OutMessage, folded into that column’s excluded set.
  GotFilterListboxMessage: {
    column: Schema.String,
    message: Listbox.Message,
  },
  // Carries the current calendar date fetched from the clock by FetchToday at
  // boot — the date filter DatePickers open their grid onto it.
  FetchedToday: { today: Calendar.CalendarDate },
  // Wraps a date filter DatePicker message for delegation, keyed by the column
  // and which bound of its range the instance edits. A committed date comes
  // back out as the DatePicker’s SelectedDate OutMessage, folded into
  // `dateFilters`.
  GotDateFilterMessage: {
    column: Schema.String,
    bound: Schema.Literals(['from', 'to']),
    message: DatePicker.Message,
  },
  // Clears both bounds of a date column’s range filter. Purely parent-side:
  // the DatePickers hold no selection state to reset.
  ClearedDateFilter: { column: Schema.String },
});
export type Message = typeof Message.Type;
