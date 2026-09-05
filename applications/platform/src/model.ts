import { RadioGroup } from '@foldkit/ui';
import { Option, Schema as S } from 'effect';

import { AppRoute } from './route';
import { FEED_ATTENDANCE, FEED_FEATURED_MATCHES, FEED_TOP_SCORERS, FEED_LABEL } from './widgets';

// A MOCK of the platform: the shell, the navigation, and every screen are
// real Foldkit views, but all data is hardcoded placeholder. There is NO
// account gate — the platform’s free plan is open to everyone, so every
// deep link from the landing page drops straight onto content. The model
// carries the route and nothing but the state the route can’t express: the
// per-screen pickers, the clubs search, and the two lists a visitor builds
// by tapping (followed clubs, pinned boards).

export const Screen = S.Literals([
  'Welcome',
  'HerGame',
  'Clubs',
  'Players',
  'Matches',
  'Competitions',
  'Officials',
]);
export type Screen = typeof Screen.Type;

export const Metric = S.Literals(['Goals', 'Attendance', 'Conversion']);
export type Metric = typeof Metric.Type;

// Which competition the club profile’s TOP SCORERS board shows — one
// component, scoped by chips (user call).
export const ScorerScope = S.Literals(['All', 'League', 'Cup']);
export type ScorerScope = typeof ScorerScope.Type;

/**
 * The kinds of competition a club can be in at once, and so the tabs of a profile's COMPETITIONS
 * section: its league, the domestic cup, and one European campaign.
 */
export const CompetitionKind = S.Literals(['League', 'Cup', 'Europe']);
export type CompetitionKind = typeof CompetitionKind.Type;

// ONE BLOCK in a feed. The kind stays an open string rather than a union of
// the widgets that exist, so a widget joining the catalog does not move the
// model's type. The key is what makes a block an instance rather than a
// singleton: a feed can carry the same widget twice, and taking one out has to
// leave the other where it is.
export const FeedBlock = S.Struct({
  kind: S.String,
  key: S.String,
  // The block's own heading, which every block arrives carrying and the reader
  // can then rewrite or take away. None is a heading DELETED rather than one
  // left blank — a blank one still holds its line, a deleted one does not, so
  // the two cannot share a representation.
  label: S.Option(S.String),
});
export type FeedBlock = typeof FeedBlock.Type;

export const Model = S.Struct({
  // The current route is THE source of truth for what’s on screen — the
  // visible screen and any open club/competition slug are derived from it in
  // the view (see screenOf / routeClubSlug / routeCompetitionSlug), so the
  // impossible states a screen+slug pair allowed (a slug set on the wrong
  // screen, both slugs at once) can’t be represented.
  route: AppRoute,
  // Which of the open competition’s EDITIONS is showing (None = the current
  // one). Every competition is a series of editions — one per season — and
  // the profile carries a picker; the backend exposes them via
  // /editions?competitionId= once real data lands.
  competitionEdition: S.Option(S.String),
  // Which matchday each competition’s matches panel shows, keyed by the
  // competition slug (a missing key = that competition’s current matchday).
  // Keyed rather than one shared field because /matches renders BOTH league
  // panels at once: a single round made them page in lockstep, and it could
  // only ever be clamped against whatever competition the route had open —
  // which on /matches is none, so every pick collapsed to round 1.
  competitionRounds: S.Record(S.String, S.Number),
  // The clubs directory’s search box ('' = show everything).
  clubQuery: S.String,
  // Which of the featured EUROPEAN CONTENDERS the clubs carousel shows.
  featuredClub: S.Number,
  // Which trending tile leads the track. The countdown advances it (see
  // subscription.ts) and the track's own scroll observer corrects it, so a
  // reader who swipes ahead is never yanked back to where the timer stood.
  trendingIndex: S.Number,
  // Whether the reader is IN the trending board — pointer over it or focus
  // inside it. The countdown holds while they are; leaving starts a fresh
  // cycle rather than resuming a part-spent one, so the drawn line and the
  // timer behind it can never disagree.
  isTrendingHeld: S.Boolean,
  // The OS-level reduced-motion preference. The served Model says false —
  // one document answers every visitor, so it cannot carry a personal
  // setting — and the reducedMotion subscription corrects it as the runtime
  // subscribes, before any frame the reader could act on.
  prefersReducedMotion: S.Boolean,
  // Slugs of the clubs the visitor follows (mock — session only; feeds
  // HER GAME once the real accounts land).
  followed: S.Array(S.String),
  // Ids of the boards and charts pinned to HER GAME. Unlike `followed`
  // this DOES survive a reload — it is mirrored to storage through the
  // pins port (see `pinsStore`). Seeded from storage by the ReadPins
  // command fired in `init`.
  pinned: S.Array(S.String),
  scorerScope: ScorerScope,
  // The club-profile sections the reader has opened past their first bite, by section anchor. Session-only, and cleared when the route changes to another page, so every profile opens folded; a hash jump within one profile re-applies the same route and leaves them as the reader had them.
  expandedClubSections: S.Array(S.String),
  // The club-profile section under the reader's eye, by anchor, kept by the scroll-spy subscription so the jump row can mark it. None while the hero is in view. Reset like the open sections: cleared on leaving the page, kept across a hash jump within it.
  activeClubSection: S.Option(S.String),
  // Whether the folded commentary hides lines, as its own mount measures it. False until measured, and from md up, where nothing folds; the More control is drawn only while this is true.
  isQuoteOverflowing: S.Boolean,
  // Which competition the profile's COMPETITIONS section shows. The league is every club's default and what a fresh profile opens on; kept across a hash jump within the profile.
  competitionTab: CompetitionKind,
  // The competition picker's own state, on the scope picker's terms: the committed tab stays in `competitionTab` above.
  competitionGroup: RadioGroup.Model,
  // The scope picker's own state. It owns keyboard focus; the committed
  // scope stays in `scorerScope` above and is handed back to the group as a
  // view input, so the selection has exactly one owner.
  scopeGroup: RadioGroup.Model,
  // The edition picker's own state, on the same terms — the committed
  // edition lives in `competitionEdition`.
  editionGroup: RadioGroup.Model,
  metric: Metric,
  // Whether the visitor is SIGNED IN, which is the whole of what makes `/`
  // two pages: signed out it is the landing, signed in it is Her Game. No
  // message sets this yet, so it holds its initial value until accounts land
  // and the signed-in half is reachable from the fixtures.
  isSignedIn: S.Boolean,
  // The blocks the feed is carrying. Mock — session only, and deliberately
  // NOT the `pinned` array above: that one is replaced wholesale by whatever
  // storage returns, which on a first visit is nothing, and a feed that opens
  // empty for every new reader is not a feed.
  feedBlocks: S.Array(FeedBlock),
  // Whether the feed is in its MANAGE state, where every block it carries
  // offers to leave and every label it carries offers its text. Transient: a
  // route change drops it, so nobody returns to the page still holding a
  // screwdriver.
  isFeedEditing: S.Boolean,
  // Whether the catalog is open under the invitation, showing every widget
  // that exists rather than only the ones this feed already carries.
  isWidgetCatalogOpen: S.Boolean,
  // Set when a pick is refused for filling a signed-out feed to its cap.
  // Cleared whenever the catalog is thrown shut, so a refusal never outlives
  // the state that produced it.
  isWidgetAddRefused: S.Boolean,
  // The number the next key is minted from. A counter rather than a random or
  // time-derived id keeps the reducer pure, which is what lets a story assert
  // the key a block was added under.
  nextFeedKey: S.Number,
});
export type Model = typeof Model.Type;

/**
 * The key identifying the nth block a feed has been given.
 *
 * @param sequence The value `nextFeedKey` held when the block was added.
 */
export const feedKey = (sequence: number): string => `feed-block-${sequence}`;

// What a feed opens with before the reader has touched it. The invitation to
// add a widget is not among them: it is part of the frame, so no feed can end
// up without one.
export const DEFAULT_FEED_BLOCKS: ReadonlyArray<FeedBlock> = [
  { kind: FEED_FEATURED_MATCHES, key: feedKey(1), label: Option.some('Featured matches') },
  { kind: FEED_TOP_SCORERS, key: feedKey(2), label: Option.some('Top scorers') },
  { kind: FEED_ATTENDANCE, key: feedKey(3), label: Option.some('Attendance') },
];

export const DEFAULT_NEXT_FEED_KEY = 4;

// What a feed carries before an account pays for more. The two are counted
// apart because every widget arrives with a heading of its own: counted
// together, three widgets would spend the label allowance as well and a reader
// signed out could never place a divider at all.
export const SIGNED_OUT_WIDGET_LIMIT = 3;
export const SIGNED_OUT_LABEL_LIMIT = 3;

/**
 * Whether a block is a standalone heading rather than a widget carrying one.
 *
 * @param block The block to weigh.
 */
export const isLabelBlock = (block: FeedBlock): boolean => block.kind === FEED_LABEL;

/**
 * How many of the blocks a feed is carrying count against the same allowance as the given kind.
 *
 * @param blocks The feed's blocks.
 * @param kind The kind being weighed.
 */
export const countTowardLimit = (blocks: ReadonlyArray<FeedBlock>, kind: string): number =>
  blocks.filter((block) => isLabelBlock(block) === (kind === FEED_LABEL)).length;

/**
 * The most blocks of the given kind a feed carries without an account.
 *
 * @param kind The kind being weighed.
 */
export const limitFor = (kind: string): number =>
  kind === FEED_LABEL ? SIGNED_OUT_LABEL_LIMIT : SIGNED_OUT_WIDGET_LIMIT;
