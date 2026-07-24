// Every studio Message.

import { Schema as S } from 'effect';
import { DatePicker, Dialog, Listbox, Tabs } from '@foldkit/ui';
import { Calendar } from 'foldkit';
import { m } from 'foldkit/message';
import { UrlRequest } from 'foldkit/navigation';
import { Url } from 'foldkit/url';

import { EditionResponse } from './editionsApi';
import { ParticipationResponse } from './participationsApi';
import { Section } from './section';
import { Entry } from './model';

export const UpdatedEmail = m('UpdatedEmail', { value: S.String });
export const UpdatedPassword = m('UpdatedPassword', { value: S.String });
// The sign-in form's submit — fired by the arrow button and by Enter in
// either field (the view is a real h.form with OnSubmit).
export const SubmittedSignIn = m('SubmittedSignIn');
export const ClickedSignOut = m('ClickedSignOut');
export const SelectedSection = m('SelectedSection', { section: Section });
export const ToggledMenu = m('ToggledMenu');
export const UpdatedSearch = m('UpdatedSearch', { value: S.String });
// A dropdown column's exact-match choice ('' clears it back to "All").
export const SelectedFilter = m('SelectedFilter', { column: S.String, value: S.String });
export const ClickedAddNew = m('ClickedAddNew');
export const ClickedRecord = m('ClickedRecord', { section: Section, id: S.String });
export const UpdatedDraftField = m('UpdatedDraftField', { index: S.Number, value: S.String });
export const ClickedSaveRecord = m('ClickedSaveRecord');
// Carries the edit-log timestamp fetched from the clock by StampSave, so the
// commit stays out of `update`'s pure path.
export const SavedRecordAt = m('SavedRecordAt', { at: S.String });
// Wraps a Dialog submodel message for delegation. The drawer's close controls
// (✕, Cancel, backdrop, Escape) all flow through here as RequestedClose; the
// close intent comes back out as the Dialog's Closed OutMessage.
export const GotDialogMessage = m('GotDialogMessage', { message: Dialog.Message });
// Wraps a Tabs submodel message for delegation. A committed tab comes back out
// as the Tabs' Selected OutMessage, folded into DrawerEditing's `tab`.
export const GotTabsMessage = m('GotTabsMessage', { message: Tabs.Message });
export const SucceededMountChart = m('SucceededMountChart', { hostId: S.String });
export const FailedMountChart = m('FailedMountChart', { reason: S.String });
export const SucceededSyncChart = m('SucceededSyncChart');
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
// Wraps a checkbox filter Listbox message for delegation, keyed by the
// column the instance belongs to. A toggled value comes back out as the
// Listbox's Selected OutMessage, folded into that column's excluded set.
export const GotFilterListboxMessage = m('GotFilterListboxMessage', {
  column: S.String,
  message: Listbox.Message,
});
// Carries the current calendar date fetched from the clock by FetchToday at
// boot — the date filter DatePickers open their grid onto it.
export const FetchedToday = m('FetchedToday', { today: Calendar.CalendarDate });
// Wraps a date filter DatePicker message for delegation, keyed by the column
// and which bound of its range the instance edits. A committed date comes
// back out as the DatePicker's SelectedDate OutMessage, folded into
// `dateFilters`.
export const GotDateFilterMessage = m('GotDateFilterMessage', {
  column: S.String,
  bound: S.Literals(['from', 'to']),
  message: DatePicker.Message,
});
// Clears both bounds of a date column's range filter. Purely parent-side:
// the DatePickers hold no selection state to reset.
export const ClearedDateFilter = m('ClearedDateFilter', { column: S.String });

export const Message = S.Union([
  UpdatedEmail,
  UpdatedPassword,
  SubmittedSignIn,
  ClickedSignOut,
  SelectedSection,
  ToggledMenu,
  UpdatedSearch,
  SelectedFilter,
  ClickedAddNew,
  ClickedRecord,
  UpdatedDraftField,
  ClickedSaveRecord,
  SavedRecordAt,
  GotDialogMessage,
  GotTabsMessage,
  SucceededMountChart,
  FailedMountChart,
  SucceededSyncChart,
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
  GotFilterListboxMessage,
  FetchedToday,
  GotDateFilterMessage,
  ClearedDateFilter,
]);
export type Message = typeof Message.Type;
