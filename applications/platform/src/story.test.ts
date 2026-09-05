import { Option } from 'effect';
import { Story } from 'foldkit';
import { UrlRequest } from 'foldkit/navigation';
import { fromString } from 'foldkit/url';
import { expect, test } from 'vite-plus/test';

import {
  clubProfileModel,
  clubsModel,
  feedCappedModel,
  feedEmptyModel,
  feedLabelledModel,
  welcomeModel,
} from './main.fixtures';
import { feedKey } from './model';
import { AppRoute } from './route';
import { FEED_ATTENDANCE, FEED_FEATURED_MATCHES, FEED_LABEL, FEED_TOP_SCORERS } from './widgets';
import {
  Load,
  Message,
  Navigate,
  RevealJumpChip,
  ScrollTrending,
  WritePins,
  init,
  update,
} from './main';
import { trending } from './data';

// Builds a parsed Url from a path, the way the runtime hands one to
// ClickedLink/ChangedUrl. An absolute URL guarantees a well-formed pathname.
const url = (path: string) => Option.getOrThrow(fromString(`https://skoreova.example${path}`));

// main.fixtures' welcomeModel is hand-written to mirror `initialModel`, and
// every other fixture spreads over it — so a field added to the Model and
// forgotten there would quietly test a state the app never boots into.
test('the boot fixture still mirrors what init actually produces', () => {
  const boot = init(url('/'));
  expect(boot.model).toEqual(welcomeModel);
  // Boot hydrates the pins from storage and nothing else.
  expect(boot.commands ?? []).toHaveLength(1);
});

test('selecting a chart metric records it and fires no command', () => {
  Story.story(
    update,
    Story.given(welcomeModel),
    Story.message(Message.SelectedMetric({ metric: 'Attendance' })),
    Story.model((model) => {
      expect(model.metric).toBe('Attendance');
    }),
    Story.Command.expectNone(),
  );
});

test('scope is a field write; edition and round fold their current sentinel to None', () => {
  Story.story(
    update,
    Story.given(welcomeModel),
    Story.message(Message.SelectedScorerScope({ scope: 'League' })),
    Story.message(Message.SelectedCompetitionEdition({ label: '2023/24' })),
    // The round is clamped against the competition the message names, not
    // the open route — /matches pages two leagues with no profile open.
    Story.message(Message.SelectedCompetitionRound({ slug: 'first-league', round: 7 })),
    Story.model((model) => {
      expect(model.scorerScope).toBe('League');
      expect(model.competitionEdition).toEqual(Option.some('2023/24'));
      expect(model.competitionRounds).toEqual({ 'first-league': 7 });
    }),
    // The chip sends '' / 0 for the current edition / matchday; the Model holds
    // None and a missing key so neither sentinel lives in the state.
    Story.message(Message.SelectedCompetitionEdition({ label: '' })),
    Story.message(Message.SelectedCompetitionRound({ slug: 'first-league', round: 0 })),
    Story.model((model) => {
      expect(model.competitionEdition).toEqual(Option.none());
      expect(model.competitionRounds).toEqual({});
    }),
    Story.Command.expectNone(),
  );
});

test('each competition keeps its own round, clamped against its own schedule', () => {
  Story.story(
    update,
    Story.given(welcomeModel),
    // Both league panels are on screen at once on /matches: a pick past one
    // league’s end-stop clamps to THAT league’s last round, and neither
    // pick moves the other panel.
    Story.message(Message.SelectedCompetitionRound({ slug: 'first-league', round: 11 })),
    Story.message(Message.SelectedCompetitionRound({ slug: 'second-league', round: 99 })),
    Story.model((model) => {
      expect(model.competitionRounds['first-league']).toBe(11);
      expect(model.competitionRounds['second-league']).toBe(22);
    }),
    Story.Command.expectNone(),
  );
});

test('a route change clears the per-screen pickers and keeps the durable lists', () => {
  Story.story(
    update,
    Story.given({
      ...clubsModel,
      clubQuery: 'sparta',
      featuredClub: 2,
      competitionRounds: { 'first-league': 5 },
      competitionEdition: Option.some('2023/24'),
      scorerScope: 'Cup',
      competitionTab: 'Europe',
      expandedClubSections: ['standings'],
      followed: ['sparta-praha'],
      pinned: ['trending:sparta-praha'],
    }),
    Story.message(Message.ChangedUrl({ url: url('/competitions/second-league') })),
    Story.model((model) => {
      // Transient — these belong to the screen you just left.
      expect(model.clubQuery).toBe('');
      expect(model.featuredClub).toBe(0);
      expect(model.expandedClubSections).toEqual([]);
      expect(model.competitionTab).toBe('League');
      expect(model.competitionRounds).toEqual({});
      expect(model.competitionEdition).toEqual(Option.none());
      // The scorers scope survives anything but opening a club profile.
      expect(model.scorerScope).toBe('Cup');
      // Durable — a visitor’s own lists outlive navigation.
      expect(model.followed).toEqual(['sparta-praha']);
      expect(model.pinned).toEqual(['trending:sparta-praha']);
    }),
    // …and opening a club profile is the one route that resets the scope.
    Story.message(Message.ChangedUrl({ url: url('/clubs/slavia-praha') })),
    Story.model((model) => {
      expect(model.scorerScope).toBe('All');
    }),
    Story.Command.expectNone(),
  );
});

test('following a club adds the slug, following again removes it', () => {
  Story.story(
    update,
    Story.given(welcomeModel),
    Story.message(Message.ToggledFollow({ slug: 'sparta-praha' })),
    Story.model((model) => {
      expect(model.followed).toContain('sparta-praha');
    }),
    Story.message(Message.ToggledFollow({ slug: 'sparta-praha' })),
    Story.model((model) => {
      expect(model.followed).not.toContain('sparta-praha');
    }),
    Story.Command.expectNone(),
  );
});

test('pinning a tile updates the model and mirrors it out through WritePins', () => {
  Story.story(
    update,
    Story.given(welcomeModel),
    Story.message(Message.ToggledPin({ id: 'trending:sparta-praha' })),
    Story.model((model) => {
      expect(model.pinned).toEqual(['trending:sparta-praha']);
    }),
    // The write is fire-and-forget: WritePins carries the new list and resolves
    // with CompletedWritePins, which folds nothing back in.
    Story.Command.expectHas(WritePins),
    Story.Command.resolve(WritePins, Message.CompletedWritePins()),
  );
});

test('unpinning the last tile writes the now-empty list', () => {
  Story.story(
    update,
    Story.given({ ...welcomeModel, pinned: ['trending:sparta-praha'] }),
    Story.message(Message.ToggledPin({ id: 'trending:sparta-praha' })),
    Story.model((model) => {
      expect(model.pinned).toEqual([]);
    }),
    Story.Command.resolve(WritePins, Message.CompletedWritePins()),
  );
});

test('ReadPins hydration seeds the pinned list via LoadedPins', () => {
  Story.story(
    update,
    Story.given(welcomeModel),
    Story.message(Message.LoadedPins({ ids: ['best:sparta', 'trending:pardubice'] })),
    Story.model((model) => {
      expect(model.pinned).toEqual(['best:sparta', 'trending:pardubice']);
    }),
    Story.Command.expectNone(),
  );
});

test('an internal link only pushes the url — ChangedUrl applies the route', () => {
  Story.story(
    update,
    Story.given(welcomeModel),
    Story.message(Message.ClickedLink({ request: UrlRequest.Internal({ url: url('/her-game') }) })),
    // The model is untouched until the runtime answers with ChangedUrl —
    // applying eagerly here too would double-apply every navigation.
    Story.model((model) => {
      expect(model.route._tag).toBe('Welcome');
    }),
    Story.Command.expectHas(Navigate),
    Story.Command.resolve(Navigate, Message.CompletedNavigate()),
    Story.message(Message.ChangedUrl({ url: url('/her-game') })),
    Story.model((model) => {
      expect(model.route._tag).toBe('HerGame');
    }),
  );
});

test('a browser back/forward to a club profile applies the slug route', () => {
  Story.story(
    update,
    Story.given(clubsModel),
    Story.message(Message.ChangedUrl({ url: url('/clubs/sparta-praha') })),
    Story.model((model) => {
      expect(model.route._tag).toBe('Club');
      if (model.route._tag === 'Club') {
        expect(model.route.slug).toBe('sparta-praha');
      }
    }),
    Story.Command.expectNone(),
  );
});

test('an external link leaves the model and loads the href', () => {
  Story.story(
    update,
    Story.given(welcomeModel),
    Story.message(
      Message.ClickedLink({ request: UrlRequest.External({ href: 'https://uefa.com' }) }),
    ),
    Story.model((model) => {
      expect(model.route._tag).toBe('Welcome');
    }),
    Story.Command.expectHas(Load),
    Story.Command.resolve(Load, Message.CompletedLoad()),
  );
});

test('the manage switch toggles the feed in and out of its manage state', () => {
  Story.story(
    update,
    Story.given(welcomeModel),
    Story.message(Message.ToggledFeedEditing()),
    Story.model((model) => {
      expect(model.isFeedEditing).toBe(true);
    }),
    Story.message(Message.ToggledFeedEditing()),
    Story.model((model) => {
      expect(model.isFeedEditing).toBe(false);
    }),
  );
});

test('unpinning a block takes it out of the feed and writes nothing', () => {
  Story.story(
    update,
    Story.given({ ...welcomeModel, isFeedEditing: true }),
    Story.message(Message.UnpinnedFeedBlock({ key: feedKey(1) })),
    Story.model((model) => {
      expect(model.feedBlocks.map((block) => block.key)).toEqual([feedKey(2), feedKey(3)]);
      // The feed is session-only, so unpinning must NOT reach the pins port —
      // that storage belongs to the boards pinned to Her Game.
      expect(model.pinned).toEqual([]);
    }),
  );
});

test('unpinning one block leaves its twin where it is', () => {
  Story.story(
    update,
    Story.given({ ...feedLabelledModel, isFeedEditing: true }),
    Story.message(Message.UnpinnedFeedBlock({ key: feedKey(1) })),
    Story.model((model) => {
      expect(model.feedBlocks.map((block) => block.key)).toEqual([
        feedKey(7),
        feedKey(2),
        feedKey(3),
        feedKey(8),
      ]);
      // The survivor is the OTHER featured-matches block — a feed keyed by
      // kind would have taken both.
      expect(model.feedBlocks.map((block) => block.kind)).toEqual([
        FEED_LABEL,
        FEED_TOP_SCORERS,
        FEED_ATTENDANCE,
        FEED_FEATURED_MATCHES,
      ]);
    }),
  );
});

test('a heading is rewritten on its own block and on no other', () => {
  Story.story(
    update,
    Story.given({ ...feedLabelledModel, isFeedEditing: true }),
    Story.message(Message.RenamedFeedLabel({ key: feedKey(8), text: 'To watch' })),
    Story.model((model) => {
      expect(model.feedBlocks.map((block) => Option.getOrNull(block.label))).toEqual([
        'My clubs',
        'Featured matches',
        'Top scorers',
        'Attendance',
        'To watch',
      ]);
    }),
  );
});

test('a heading removed is gone, and one put back is the kind default', () => {
  Story.story(
    update,
    Story.given({ ...feedLabelledModel, isFeedEditing: true }),
    Story.message(Message.RemovedFeedLabel({ key: feedKey(8) })),
    Story.model((model) => {
      expect(Option.isNone(model.feedBlocks[4]!.label)).toBe(true);
    }),
    Story.message(Message.RestoredFeedLabel({ key: feedKey(8) })),
    Story.model((model) => {
      // 'Cup week' does not come back — what the reader wrote left with the
      // removal, so the kind's own default is what returns.
      expect(Option.getOrNull(model.feedBlocks[4]!.label)).toBe('Featured matches');
    }),
  );
});

test('a standalone heading refuses to give up the heading that IS its block', () => {
  Story.story(
    update,
    Story.given({ ...feedLabelledModel, isFeedEditing: true }),
    Story.message(Message.RemovedFeedLabel({ key: feedKey(7) })),
    Story.model((model) => {
      expect(Option.getOrNull(model.feedBlocks[0]!.label)).toBe('My clubs');
    }),
  );
});

test('a widget added arrives carrying its kind default as a heading', () => {
  Story.story(
    update,
    Story.given(feedEmptyModel),
    Story.message(Message.AddedFeedBlock({ kind: FEED_FEATURED_MATCHES })),
    Story.message(Message.AddedFeedBlock({ kind: FEED_LABEL })),
    Story.model((model) => {
      // Keys keep minting from where the default feed left the counter, so an
      // emptied feed can never re-issue a key an unpinned block once held.
      expect(model.feedBlocks.map((block) => block.key)).toEqual([feedKey(4), feedKey(5)]);
      expect(Option.getOrNull(model.feedBlocks[0]!.label)).toBe('Featured matches');
      // A standalone heading is the reader's own words from the start, so it
      // arrives blank rather than carrying the word "Label".
      expect(Option.getOrNull(model.feedBlocks[1]!.label)).toBe('');
      expect(model.nextFeedKey).toBe(6);
    }),
  );
});

test('the same widget goes into a feed twice', () => {
  Story.story(
    update,
    Story.given(feedEmptyModel),
    Story.message(Message.AddedFeedBlock({ kind: FEED_FEATURED_MATCHES })),
    Story.message(Message.AddedFeedBlock({ kind: FEED_FEATURED_MATCHES })),
    Story.model((model) => {
      expect(model.feedBlocks.map((block) => block.kind)).toEqual([
        FEED_FEATURED_MATCHES,
        FEED_FEATURED_MATCHES,
      ]);
      expect(model.isWidgetAddRefused).toBe(false);
    }),
  );
});

test('a signed-out feed carries three widgets and refuses a fourth', () => {
  Story.story(
    update,
    Story.given({ ...feedCappedModel, isWidgetCatalogOpen: true }),
    Story.message(Message.AddedFeedBlock({ kind: FEED_FEATURED_MATCHES })),
    Story.model((model) => {
      expect(model.feedBlocks).toHaveLength(3);
      expect(model.isWidgetAddRefused).toBe(true);
    }),
    // Shutting the catalog clears the refusal, so it never greets a reader who
    // comes back to open it again.
    Story.message(Message.ToggledWidgetCatalog()),
    Story.model((model) => {
      expect(model.isWidgetAddRefused).toBe(false);
    }),
  );
});

// The two allowances are counted apart, so a feed full of widgets has spent
// none of its headings — otherwise three widgets, each arriving with a heading
// of its own, would leave a signed-out reader unable to place a divider.
test('a feed full of widgets has spent none of its heading allowance', () => {
  Story.story(
    update,
    Story.given(feedCappedModel),
    Story.message(Message.AddedFeedBlock({ kind: FEED_LABEL })),
    Story.model((model) => {
      expect(model.feedBlocks).toHaveLength(4);
      expect(model.isWidgetAddRefused).toBe(false);
    }),
  );
});

test('an account is what lifts the cap', () => {
  Story.story(
    update,
    Story.given({ ...feedCappedModel, isSignedIn: true }),
    Story.message(Message.AddedFeedBlock({ kind: FEED_FEATURED_MATCHES })),
    Story.model((model) => {
      expect(model.feedBlocks).toHaveLength(4);
      expect(model.isWidgetAddRefused).toBe(false);
    }),
  );
});

// THE TRENDING COUNTDOWN. The Model advances first and the scroll follows as
// a Command, so the whole move asserts without a DOM.
test('the countdown advances the trending track and scrolls it after', () => {
  Story.story(
    update,
    Story.given(welcomeModel),
    Story.message(Message.AdvancedTrending()),
    Story.model((model) => {
      expect(model.trendingIndex).toBe(1);
    }),
    Story.Command.expectExact(ScrollTrending),
    Story.Command.resolve(ScrollTrending, Message.CompletedScrollTrending()),
    Story.Command.expectNone(),
  );
});

test('the countdown wraps from the last tile back to the first', () => {
  Story.story(
    update,
    Story.given({ ...welcomeModel, trendingIndex: trending.length - 1 }),
    Story.message(Message.AdvancedTrending()),
    Story.model((model) => {
      expect(model.trendingIndex).toBe(0);
    }),
    Story.Command.resolve(ScrollTrending, Message.CompletedScrollTrending()),
  );
});

// A swipe answers with the tile it landed on and nothing else — no scroll
// command, or the reader's own gesture would be answered with a second one.
test('a hand scroll syncs the index without scrolling back', () => {
  Story.story(
    update,
    Story.given(welcomeModel),
    Story.message(Message.ScrolledTrending({ index: 4 })),
    Story.model((model) => {
      expect(model.trendingIndex).toBe(4);
    }),
    Story.Command.expectNone(),
  );
});

test('presence and the motion preference are plain field writes', () => {
  Story.story(
    update,
    Story.given(welcomeModel),
    Story.message(Message.HeldTrending({ isHeld: true })),
    Story.model((model) => {
      expect(model.isTrendingHeld).toBe(true);
    }),
    Story.Command.expectNone(),
  );
  Story.story(
    update,
    Story.given(welcomeModel),
    Story.message(Message.ChangedReducedMotion({ reduce: true })),
    Story.model((model) => {
      expect(model.prefersReducedMotion).toBe(true);
    }),
    Story.Command.expectNone(),
  );
});

// THE FOLDED CLUB SECTIONS. Opening is a toggle on the anchor; a hash jump
// within the profile re-applies the same route and must not fold anything.
test('a club section opens, folds back, and survives a jump within the profile', () => {
  Story.story(
    update,
    Story.given(clubProfileModel),
    Story.message(Message.ToggledClubSection({ anchor: 'standings' })),
    Story.model((model) => {
      expect(model.expandedClubSections).toEqual(['standings']);
    }),
    Story.message(Message.ChangedUrl({ url: url('/clubs/sparta-praha#standings') })),
    Story.model((model) => {
      expect(model.expandedClubSections).toEqual(['standings']);
    }),
    Story.message(Message.ToggledClubSection({ anchor: 'standings' })),
    Story.model((model) => {
      expect(model.expandedClubSections).toEqual([]);
    }),
    Story.Command.expectNone(),
  );
});

// THE SCROLL-SPY. A report names the section in view and brings its chip into the jump row; the hero's report ('') clears the mark and moves nothing. A hash jump within the profile keeps the mark, and leaving the page clears it.
test('the jump row marks the section in view and follows it', () => {
  Story.story(
    update,
    Story.given(clubProfileModel),
    Story.message(Message.ScrolledClubPage({ anchor: 'standings' })),
    Story.model((model) => {
      expect(model.activeClubSection).toEqual(Option.some('standings'));
    }),
    Story.Command.expectExact(RevealJumpChip),
    Story.Command.resolve(RevealJumpChip, Message.CompletedRevealJumpChip()),
    Story.message(Message.ChangedUrl({ url: url('/clubs/sparta-praha#standings') })),
    Story.model((model) => {
      expect(model.activeClubSection).toEqual(Option.some('standings'));
    }),
    Story.message(Message.ScrolledClubPage({ anchor: '' })),
    Story.model((model) => {
      expect(model.activeClubSection).toEqual(Option.none());
    }),
    Story.Command.expectNone(),
  );
  Story.story(
    update,
    Story.given({ ...clubProfileModel, activeClubSection: Option.some('history') }),
    Story.message(Message.ChangedUrl({ url: url('/clubs') })),
    Story.model((model) => {
      expect(model.activeClubSection).toEqual(Option.none());
    }),
  );
});

test('the commentary measurement is a plain field write', () => {
  Story.story(
    update,
    Story.given(clubProfileModel),
    Story.message(Message.MeasuredQuoteOverflow({ isOverflowing: true })),
    Story.model((model) => {
      expect(model.isQuoteOverflowing).toBe(true);
    }),
    Story.Command.expectNone(),
  );
});

// THE CLUB FILTER on /matches is a query on the one matches route, so the plain screen and the narrowed one are the same route with and without a club.
test('the matches route carries an optional club', () => {
  Story.story(
    update,
    Story.given(welcomeModel),
    Story.message(Message.ChangedUrl({ url: url('/matches?club=sparta-praha') })),
    Story.model((model) => {
      expect(model.route).toEqual(AppRoute.Matches({ club: 'sparta-praha' }));
    }),
    Story.message(Message.ChangedUrl({ url: url('/matches') })),
    Story.model((model) => {
      expect(model.route._tag).toBe('Matches');
      expect(model.route._tag === 'Matches' ? model.route.club : 'set').toBeUndefined();
    }),
  );
});
