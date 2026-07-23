// Every studio Message.

import { Schema as S } from 'effect';
import { m } from 'foldkit/message';
import { UrlRequest } from 'foldkit/navigation';
import { Url } from 'foldkit/url';

import { EditionResponse } from './editionsApi';
import { ParticipationResponse } from './participationsApi';
import { Section } from './section';
import { DrawerTab, Entry } from './model';

export const UpdatedEmail = m('UpdatedEmail', { value: S.String });
export const UpdatedPassword = m('UpdatedPassword', { value: S.String });
export const ClickedSignIn = m('ClickedSignIn');
export const ClickedSignOut = m('ClickedSignOut');
export const SelectedSection = m('SelectedSection', { section: Section });
export const ToggledMenu = m('ToggledMenu');
export const UpdatedSearch = m('UpdatedSearch', { value: S.String });
export const SelectedFilter = m('SelectedFilter', { columnIndex: S.Number, value: S.String });
export const ClickedAddNew = m('ClickedAddNew');
export const ClickedRecord = m('ClickedRecord', { section: Section, id: S.String });
export const UpdatedDraftField = m('UpdatedDraftField', { index: S.Number, value: S.String });
export const ClickedSaveRecord = m('ClickedSaveRecord');
// Carries the edit-log timestamp fetched from the clock by StampSave, so the
// commit stays out of `update`'s pure path.
export const SavedRecordAt = m('SavedRecordAt', { at: S.String });
export const ClickedCloseDrawer = m('ClickedCloseDrawer');
export const SelectedDrawerTab = m('SelectedDrawerTab', { tab: DrawerTab });
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
export const ToggledFilterDropdown = m('ToggledFilterDropdown', { columnIndex: S.Number });
export const ToggledFilterValue = m('ToggledFilterValue', {
  columnIndex: S.Number,
  value: S.String,
});

export const Message = S.Union([
  UpdatedEmail,
  UpdatedPassword,
  ClickedSignIn,
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
  ClickedCloseDrawer,
  SelectedDrawerTab,
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
  ToggledFilterDropdown,
  ToggledFilterValue,
]);
export type Message = typeof Message.Type;
