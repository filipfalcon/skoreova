import { Option } from 'effect';
import { Story } from 'foldkit';
import { External, Internal } from 'foldkit/navigation';
import { fromString } from 'foldkit/url';
import { expect, test } from 'vite-plus/test';

import { clubsModel, welcomeModel } from './main.fixtures';
import {
  ChangedUrl,
  ClickedLink,
  CompletedLoad,
  CompletedNavigate,
  Load,
  Navigate,
  LoadedPins,
  CompletedWritePins,
  SelectedCompetitionEdition,
  SelectedCompetitionRound,
  SelectedMetric,
  SelectedScorerScope,
  ToggledFollow,
  ToggledPin,
  WritePins,
  init,
  update,
} from './main';

// Builds a parsed Url from a path, the way the runtime hands one to
// ClickedLink/ChangedUrl. An absolute URL guarantees a well-formed pathname.
const url = (path: string) => Option.getOrThrow(fromString(`https://skoreova.example${path}`));

// main.fixtures' welcomeModel is hand-written to mirror `initialModel`, and
// every other fixture spreads over it — so a field added to the Model and
// forgotten there would quietly test a state the app never boots into.
test('the boot fixture still mirrors what init actually produces', () => {
  const [booted, commands] = init(url('/'));
  expect(booted).toEqual(welcomeModel);
  // Boot hydrates the pins from storage and nothing else.
  expect(commands).toHaveLength(1);
});

test('selecting a chart metric records it and fires no command', () => {
  Story.story(
    update,
    Story.with(welcomeModel),
    Story.message(SelectedMetric({ metric: 'Attendance' })),
    Story.model((model) => {
      expect(model.metric).toBe('Attendance');
    }),
    Story.Command.expectNone(),
  );
});

test('scope is a field write; edition and round fold their current sentinel to None', () => {
  Story.story(
    update,
    Story.with(welcomeModel),
    Story.message(SelectedScorerScope({ scope: 'League' })),
    Story.message(SelectedCompetitionEdition({ label: '2023/24' })),
    // The round is clamped against the competition the message names, not
    // the open route — /matches pages two leagues with no profile open.
    Story.message(SelectedCompetitionRound({ slug: 'first-league', round: 7 })),
    Story.model((model) => {
      expect(model.scorerScope).toBe('League');
      expect(model.competitionEdition).toEqual(Option.some('2023/24'));
      expect(model.competitionRounds).toEqual({ 'first-league': 7 });
    }),
    // The chip sends '' / 0 for the current edition / matchday; the Model holds
    // None and a missing key so neither sentinel lives in the state.
    Story.message(SelectedCompetitionEdition({ label: '' })),
    Story.message(SelectedCompetitionRound({ slug: 'first-league', round: 0 })),
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
    Story.with(welcomeModel),
    // Both league panels are on screen at once on /matches: a pick past one
    // league's end-stop clamps to THAT league's last round, and neither
    // pick moves the other panel.
    Story.message(SelectedCompetitionRound({ slug: 'first-league', round: 11 })),
    Story.message(SelectedCompetitionRound({ slug: 'second-league', round: 99 })),
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
    Story.with({
      ...clubsModel,
      clubQuery: 'sparta',
      featuredClub: 2,
      competitionRounds: { 'first-league': 5 },
      competitionEdition: Option.some('2023/24'),
      scorerScope: 'Cup',
      followed: ['sparta-praha'],
      pinned: ['trending:sparta-praha'],
    }),
    Story.message(ChangedUrl({ url: url('/competitions/second-league') })),
    Story.model((model) => {
      // Transient — these belong to the screen you just left.
      expect(model.clubQuery).toBe('');
      expect(model.featuredClub).toBe(0);
      expect(model.competitionRounds).toEqual({});
      expect(model.competitionEdition).toEqual(Option.none());
      // The scorers scope survives anything but opening a club profile.
      expect(model.scorerScope).toBe('Cup');
      // Durable — a visitor's own lists outlive navigation.
      expect(model.followed).toEqual(['sparta-praha']);
      expect(model.pinned).toEqual(['trending:sparta-praha']);
    }),
    // …and opening a club profile is the one route that resets the scope.
    Story.message(ChangedUrl({ url: url('/clubs/slavia-praha') })),
    Story.model((model) => {
      expect(model.scorerScope).toBe('All');
    }),
    Story.Command.expectNone(),
  );
});

test('following a club adds the slug, following again removes it', () => {
  Story.story(
    update,
    Story.with(welcomeModel),
    Story.message(ToggledFollow({ slug: 'sparta-praha' })),
    Story.model((model) => {
      expect(model.followed).toContain('sparta-praha');
    }),
    Story.message(ToggledFollow({ slug: 'sparta-praha' })),
    Story.model((model) => {
      expect(model.followed).not.toContain('sparta-praha');
    }),
    Story.Command.expectNone(),
  );
});

test('pinning a tile updates the model and mirrors it out through WritePins', () => {
  Story.story(
    update,
    Story.with(welcomeModel),
    Story.message(ToggledPin({ id: 'trending:sparta-praha' })),
    Story.model((model) => {
      expect(model.pinned).toEqual(['trending:sparta-praha']);
    }),
    // The write is fire-and-forget: WritePins carries the new list and resolves
    // with CompletedWritePins, which folds nothing back in.
    Story.Command.expectHas(WritePins),
    Story.Command.resolve(WritePins, CompletedWritePins()),
  );
});

test('unpinning the last tile writes the now-empty list', () => {
  Story.story(
    update,
    Story.with({ ...welcomeModel, pinned: ['trending:sparta-praha'] }),
    Story.message(ToggledPin({ id: 'trending:sparta-praha' })),
    Story.model((model) => {
      expect(model.pinned).toEqual([]);
    }),
    Story.Command.resolve(WritePins, CompletedWritePins()),
  );
});

test('ReadPins hydration seeds the pinned list via LoadedPins', () => {
  Story.story(
    update,
    Story.with(welcomeModel),
    Story.message(LoadedPins({ ids: ['best:sparta', 'trending:pardubice'] })),
    Story.model((model) => {
      expect(model.pinned).toEqual(['best:sparta', 'trending:pardubice']);
    }),
    Story.Command.expectNone(),
  );
});

test('an internal link only pushes the url — ChangedUrl applies the route', () => {
  Story.story(
    update,
    Story.with(welcomeModel),
    Story.message(ClickedLink({ request: Internal({ url: url('/her-game') }) })),
    // The model is untouched until the runtime answers with ChangedUrl —
    // applying eagerly here too would double-apply every navigation.
    Story.model((model) => {
      expect(model.route._tag).toBe('WelcomeRoute');
    }),
    Story.Command.expectHas(Navigate),
    Story.Command.resolve(Navigate, CompletedNavigate()),
    Story.message(ChangedUrl({ url: url('/her-game') })),
    Story.model((model) => {
      expect(model.route._tag).toBe('HerGameRoute');
    }),
  );
});

test('a browser back/forward to a club profile applies the slug route', () => {
  Story.story(
    update,
    Story.with(clubsModel),
    Story.message(ChangedUrl({ url: url('/clubs/sparta-praha') })),
    Story.model((model) => {
      expect(model.route._tag).toBe('ClubRoute');
      if (model.route._tag === 'ClubRoute') {
        expect(model.route.slug).toBe('sparta-praha');
      }
    }),
    Story.Command.expectNone(),
  );
});

test('an external link leaves the model and loads the href', () => {
  Story.story(
    update,
    Story.with(welcomeModel),
    Story.message(ClickedLink({ request: External({ href: 'https://uefa.com' }) })),
    Story.model((model) => {
      expect(model.route._tag).toBe('WelcomeRoute');
    }),
    Story.Command.expectHas(Load),
    Story.Command.resolve(Load, CompletedLoad()),
  );
});
