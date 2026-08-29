// Every studio Message.

import { Schema as S } from 'effect';
import { DatePicker, Dialog, Listbox, Tabs } from '@foldkit/ui';
import { Calendar } from 'foldkit';
import { defineMessageUnion } from 'foldkit/message';
import { UrlRequest } from 'foldkit/navigation';
import { Url } from 'foldkit/url';

import { ParticipationResponse } from './participationsApi';
import { Section } from './section';
import { Entry } from './model';

export const Message = defineMessageUnion({
  UpdatedEmail: { value: S.String },
  UpdatedPassword: { value: S.String },
  // The sign-in form’s submit — fired by the arrow button and by Enter in
  // either field (the view is a real h.form with OnSubmit).
  SubmittedSignIn: {},
  ClickedSignOut: {},
  SelectedSection: { section: Section },
  ToggledMenu: {},
  UpdatedSearch: { value: S.String },
  // A dropdown column’s exact-match choice ('' clears it back to "All").
  SelectedFilter: { column: S.String, value: S.String },
  ClickedAddNew: {},
  ClickedRecord: { section: Section, id: S.String },
  UpdatedDraftField: { index: S.Number, value: S.String },
  ClickedSaveRecord: {},
  // Carries the edit-log timestamp fetched from the clock by StampSave, so the
  // commit stays out of `update`'s pure path.
  SavedRecordAt: { at: S.String },
  // Same shape for the delete: its own Command reads the clock, so the History
  // event carries a real timestamp instead of one invented in `update`.
  DeletedRecordAt: { at: S.String },
  // Wraps a Dialog submodel message for delegation. The drawer’s close controls
  // (✕, Cancel, backdrop, Escape) all flow through here as RequestedClose; the
  // close intent comes back out as the Dialog’s Closed OutMessage.
  GotDialogMessage: { message: Dialog.Message },
  // Wraps a Tabs submodel message for delegation. A committed tab comes back out
  // as the Tabs' Selected OutMessage, folded into DrawerEditing’s `tab`.
  GotTabsMessage: { message: Tabs.Message },
  SucceededMountChart: { hostId: S.String },
  FailedMountChart: { reason: S.String },
  SucceededSyncChart: {},
  FailedSyncChart: { reason: S.String },
  ClickedDeleteRecord: {},
  ClickedConfirmDelete: {},
  ClickedCancelDelete: {},
  SucceededFetchPlayers: {
    entries: S.Array(Entry),
    total: S.Number,
  },
  FailedFetchPlayers: { reason: S.String },
  ClickedRetryPlayers: {},
  ClickedPlayersPage: { page: S.Number },
  ClickedClientPage: { page: S.Number },
  SucceededFetchClubs: { entries: S.Array(Entry) },
  FailedFetchClubs: { reason: S.String },
  ClickedRetryClubs: {},
  SucceededFetchNationals: { entries: S.Array(Entry) },
  FailedFetchNationals: { reason: S.String },
  ClickedRetryNationals: {},
  SucceededFetchCompetitions: {
    entries: S.Array(Entry),
  },
  FailedFetchCompetitions: { reason: S.String },
  ClickedRetryCompetitions: {},
  SucceededFetchEditions: { entries: S.Array(Entry) },
  FailedFetchEditions: { reason: S.String },
  ClickedRetryEditions: {},
  SucceededFetchAssociations: {
    entries: S.Array(Entry),
  },
  FailedFetchAssociations: { reason: S.String },
  ClickedRetryAssociations: {},
  SucceededFetchParticipations: {
    participations: S.Array(ParticipationResponse),
  },
  FailedFetchParticipations: { reason: S.String },
  ClickedRetryParticipations: {},
  SucceededFetchHealth: {},
  FailedFetchHealth: { reason: S.String },
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  CompletedNavigate: {},
  CompletedLoad: {},
  SucceededFetchTeamById: { entry: Entry },
  FailedFetchTeamById: { reason: S.String },
  ClickedDashboard: {},
  // Wraps a checkbox filter Listbox message for delegation, keyed by the
  // column the instance belongs to. A toggled value comes back out as the
  // Listbox’s Selected OutMessage, folded into that column’s excluded set.
  GotFilterListboxMessage: {
    column: S.String,
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
    column: S.String,
    bound: S.Literals(['from', 'to']),
    message: DatePicker.Message,
  },
  // Clears both bounds of a date column’s range filter. Purely parent-side:
  // the DatePickers hold no selection state to reset.
  ClearedDateFilter: { column: S.String },
});
export type Message = typeof Message.Type;
