import { RadioGroup } from '@foldkit/ui';
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
// The pager carries the competition it belongs to: two panels can be on
// screen at once (/matches), so a round means nothing without its league.
export const SelectedCompetitionRound = m('SelectedCompetitionRound', {
  slug: S.String,
  round: S.Number,
});
export const UpdatedClubQuery = m('UpdatedClubQuery', { query: S.String });
// The radio groups are Submodels, so their Messages arrive wrapped and are
// folded back into the group's own Model. The COMMITTED value does not travel
// this way — it arrives as a `Selected` OutMessage and lands in the field the
// group reads its selection from.
export const GotScopeGroupMessage = m('GotScopeGroupMessage', { message: RadioGroup.Message });
export const GotEditionGroupMessage = m('GotEditionGroupMessage', { message: RadioGroup.Message });
export const SelectedFeaturedClub = m('SelectedFeaturedClub', { index: S.Number });
export const ToggledFollow = m('ToggledFollow', { slug: S.String });
// Pins: ReadPins hands the stored ids back through LoadedPins; a pin toggle
// updates the model and mirrors it out through WritePins, whose completion
// is CompletedWritePins (nothing to fold back in — the write is fire-and-forget).
export const LoadedPins = m('LoadedPins', { ids: S.Array(S.String) });
export const ToggledPin = m('ToggledPin', { id: S.String });
export const CompletedWritePins = m('CompletedWritePins');
// The feed's manage state, where a block offers to leave and a label offers
// its text. Unpinning carries the block's KEY rather than its kind, so taking
// out one label leaves every other label where it is.
export const ToggledFeedEditing = m('ToggledFeedEditing');
export const UnpinnedFeedBlock = m('UnpinnedFeedBlock', { key: S.String });
// A heading is the block's, so all three carry the block's key. Taking one
// away and blanking it are separate messages because they are separate
// outcomes: a blank heading still holds its line, a removed one does not.
export const RenamedFeedLabel = m('RenamedFeedLabel', { key: S.String, text: S.String });
export const RemovedFeedLabel = m('RemovedFeedLabel', { key: S.String });
export const RestoredFeedLabel = m('RestoredFeedLabel', { key: S.String });
// The catalog under the invitation, and the pick it exists to carry. Adding
// names a kind, since the block that results does not exist yet to have a key.
export const ToggledWidgetCatalog = m('ToggledWidgetCatalog');
export const AddedFeedBlock = m('AddedFeedBlock', { kind: S.String });

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
  GotScopeGroupMessage,
  GotEditionGroupMessage,
  SelectedFeaturedClub,
  ToggledFollow,
  LoadedPins,
  ToggledPin,
  CompletedWritePins,
  ToggledFeedEditing,
  UnpinnedFeedBlock,
  RenamedFeedLabel,
  RemovedFeedLabel,
  RestoredFeedLabel,
  ToggledWidgetCatalog,
  AddedFeedBlock,
]);
export type Message = typeof Message.Type;
