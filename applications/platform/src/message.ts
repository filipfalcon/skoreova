import { Schema as S } from 'effect';
import { m } from 'foldkit/message';
import { UrlRequest } from 'foldkit/navigation';
import { Url } from 'foldkit/url';

import { Metric, ScorerScope } from './model';

export const ClickedLink = m('ClickedLink', { request: UrlRequest });
export const ChangedUrl = m('ChangedUrl', { url: Url });
export const CompletedNavigate = m('CompletedNavigate');
export const CompletedLoad = m('CompletedLoad');
export const SelectedMetric = m('SelectedMetric', { metric: Metric });
export const SelectedScorerScope = m('SelectedScorerScope', { scope: ScorerScope });
export const SelectedCompetitionEdition = m('SelectedCompetitionEdition', { label: S.String });
export const SelectedCompetitionRound = m('SelectedCompetitionRound', { round: S.Number });
export const UpdatedClubQuery = m('UpdatedClubQuery', { query: S.String });
export const SelectedFeaturedClub = m('SelectedFeaturedClub', { index: S.Number });
export const ToggledFollow = m('ToggledFollow', { slug: S.String });
// Pins: ReadPins hands the stored ids back through LoadedPins; a pin toggle
// updates the model and mirrors it out through WritePins, whose completion
// is CompletedWritePins (nothing to fold back in — the write is fire-and-forget).
export const LoadedPins = m('LoadedPins', { ids: S.Array(S.String) });
export const ToggledPin = m('ToggledPin', { id: S.String });
export const CompletedWritePins = m('CompletedWritePins');

export const Message = S.Union([
  ClickedLink,
  ChangedUrl,
  CompletedNavigate,
  CompletedLoad,
  SelectedMetric,
  SelectedScorerScope,
  SelectedCompetitionEdition,
  SelectedCompetitionRound,
  UpdatedClubQuery,
  SelectedFeaturedClub,
  ToggledFollow,
  LoadedPins,
  ToggledPin,
  CompletedWritePins,
]);
export type Message = typeof Message.Type;
