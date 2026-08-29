import { RadioGroup } from '@foldkit/ui';
import { Schema as S } from 'effect';
import { defineMessageUnion } from 'foldkit/message';
import { UrlRequest } from 'foldkit/navigation';
import { Url } from 'foldkit/url';

import { Metric, ScorerScope } from './model';

export const Message = defineMessageUnion({
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  CompletedNavigate: {},
  CompletedLoad: {},
  SelectedMetric: { metric: Metric },
  SelectedScorerScope: { scope: ScorerScope },
  SelectedCompetitionEdition: { label: S.String },
  // The pager carries the competition it belongs to: two panels can be on
  // screen at once (/matches), so a round means nothing without its league.
  SelectedCompetitionRound: {
    slug: S.String,
    round: S.Number,
  },
  UpdatedClubQuery: { query: S.String },
  // The radio groups are Submodels, so their Messages arrive wrapped and are
  // folded back into the group's own Model. The COMMITTED value does not travel
  // this way — it arrives as a `Selected` OutMessage and lands in the field the
  // group reads its selection from.
  GotScopeGroupMessage: { message: RadioGroup.Message },
  GotEditionGroupMessage: { message: RadioGroup.Message },
  SelectedFeaturedClub: { index: S.Number },
  ToggledFollow: { slug: S.String },
  // Pins: ReadPins hands the stored ids back through LoadedPins; a pin toggle
  // updates the model and mirrors it out through WritePins, whose completion
  // is CompletedWritePins (nothing to fold back in — the write is fire-and-forget).
  LoadedPins: { ids: S.Array(S.String) },
  ToggledPin: { id: S.String },
  CompletedWritePins: {},
  // The feed's manage state, where a block offers to leave and a label offers
  // its text. Unpinning carries the block's KEY rather than its kind, so taking
  // out one label leaves every other label where it is.
  ToggledFeedEditing: {},
  UnpinnedFeedBlock: { key: S.String },
  // A heading is the block's, so all three carry the block's key. Taking one
  // away and blanking it are separate messages because they are separate
  // outcomes: a blank heading still holds its line, a removed one does not.
  RenamedFeedLabel: { key: S.String, text: S.String },
  RemovedFeedLabel: { key: S.String },
  RestoredFeedLabel: { key: S.String },
  // The catalog under the invitation, and the pick it exists to carry. Adding
  // names a kind, since the block that results does not exist yet to have a key.
  ToggledWidgetCatalog: {},
  AddedFeedBlock: { kind: S.String },
});
export type Message = typeof Message.Type;
