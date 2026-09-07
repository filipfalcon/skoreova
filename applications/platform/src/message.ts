import { RadioGroup } from '@foldkit/ui';
import { Schema } from 'effect';
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
  SelectedCompetitionEdition: { label: Schema.String },
  // The pager carries the competition it belongs to: two panels can be on
  // screen at once (/matches), so a round means nothing without its league.
  SelectedCompetitionRound: {
    slug: Schema.String,
    round: Schema.Number,
  },
  UpdatedClubQuery: { query: Schema.String },
  // The radio groups are Submodels, so their Messages arrive wrapped and are
  // folded back into the group's own Model. The COMMITTED value does not travel
  // this way — it arrives as a `Selected` OutMessage and lands in the field the
  // group reads its selection from.
  GotScopeGroupMessage: { message: RadioGroup.Message },
  GotEditionGroupMessage: { message: RadioGroup.Message },
  GotCompetitionGroupMessage: { message: RadioGroup.Message },
  SelectedFeaturedClub: { index: Schema.Number },
  // The trending countdown ran out — the track moves one tile right.
  AdvancedTrending: {},
  // The reader entered or left the trending board; the countdown holds
  // while they are in it.
  HeldTrending: { isHeld: Schema.Boolean },
  // The track was scrolled — by hand or by ScrollTrending — and this is the
  // tile now leading it. Keeps the timer advancing from what the reader
  // actually sees rather than from where it last left the track.
  ScrolledTrending: { index: Schema.Number },
  ChangedReducedMotion: { reduce: Schema.Boolean },
  CompletedScrollTrending: {},
  ToggledFollow: { slug: Schema.String },
  // A club-profile section opened past its first bite, or folded back; the anchor names the section.
  ToggledClubSection: { anchor: Schema.String },
  // The scroll-spy's report of the club section under the reader's eye; '' while the hero is in view. Carries a string because a Message field holds no Option — the handler folds it.
  ScrolledClubPage: { anchor: Schema.String },
  // The commentary's own measurement: whether the folded statement hides any of its lines. Measured, not guessed from length, so the More control never appears over a statement that is already whole.
  CompletedRevealJumpChip: {},
  CompletedMatchStripScroll: {},
  // Pins: ReadPins hands the stored ids back through LoadedPins; a pin toggle
  // updates the model and mirrors it out through WritePins, whose completion
  // is CompletedWritePins (nothing to fold back in — the write is fire-and-forget).
  LoadedPins: { ids: Schema.Array(Schema.String) },
  ToggledPin: { id: Schema.String },
  CompletedWritePins: {},
  // The feed's manage state, where a block offers to leave and a label offers
  // its text. Unpinning carries the block's KEY rather than its kind, so taking
  // out one label leaves every other label where it is.
  ToggledFeedEditing: {},
  UnpinnedFeedBlock: { key: Schema.String },
  // A heading is the block's, so all three carry the block's key. Taking one
  // away and blanking it are separate messages because they are separate
  // outcomes: a blank heading still holds its line, a removed one does not.
  RenamedFeedLabel: { key: Schema.String, text: Schema.String },
  RemovedFeedLabel: { key: Schema.String },
  RestoredFeedLabel: { key: Schema.String },
  // The catalog under the invitation, and the pick it exists to carry. Adding
  // names a kind, since the block that results does not exist yet to have a key.
  ToggledWidgetCatalog: {},
  AddedFeedBlock: { kind: Schema.String },
});
export type Message = typeof Message.Type;
