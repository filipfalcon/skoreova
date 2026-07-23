import { Option } from 'effect';
import { Story } from 'foldkit';
import { External, Internal } from 'foldkit/navigation';
import { fromString } from 'foldkit/url';
import { expect, test } from 'vitest';

import { clubsModel, welcomeModel } from './main.fixtures';
import {
  ChangedUrl,
  ClickedLink,
  CompletedLoad,
  CompletedNavigate,
  Load,
  Navigate,
  PinsLoaded,
  PinsSynced,
  SelectedCompetitionEdition,
  SelectedCompetitionRound,
  SelectedMetric,
  SelectedScorerScope,
  ToggledFollow,
  ToggledPin,
  WritePins,
  update,
} from './main';

// Builds a parsed Url from a path, the way the runtime hands one to
// ClickedLink/ChangedUrl. An absolute URL guarantees a well-formed pathname.
const url = (path: string) => Option.getOrThrow(fromString(`https://skoreova.example${path}`));

test('selecting a chart metric records it and fires no command', () => {
  Story.story(
    update,
    Story.with(welcomeModel),
    Story.message(SelectedMetric({ metric: 'attendance' })),
    Story.model((model) => {
      expect(model.metric).toBe('attendance');
    }),
    Story.Command.expectNone(),
  );
});

test('the top-scorers scope, edition, and round are plain field writes', () => {
  Story.story(
    update,
    Story.with(welcomeModel),
    Story.message(SelectedScorerScope({ scope: 'league' })),
    Story.message(SelectedCompetitionEdition({ label: '2023/24' })),
    Story.message(SelectedCompetitionRound({ round: 7 })),
    Story.model((model) => {
      expect(model.scorerScope).toBe('league');
      expect(model.competitionEdition).toBe('2023/24');
      expect(model.competitionRound).toBe(7);
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
    // with PinsSynced, which folds nothing back in.
    Story.Command.expectHas(WritePins),
    Story.Command.resolve(WritePins, PinsSynced()),
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
    Story.Command.resolve(WritePins, PinsSynced()),
  );
});

test('ReadPins hydration seeds the pinned list via PinsLoaded', () => {
  Story.story(
    update,
    Story.with(welcomeModel),
    Story.message(PinsLoaded({ ids: ['best:sparta', 'trending:pardubice'] })),
    Story.model((model) => {
      expect(model.pinned).toEqual(['best:sparta', 'trending:pardubice']);
    }),
    Story.Command.expectNone(),
  );
});

test('an internal link applies the route and pushes it through Navigate', () => {
  Story.story(
    update,
    Story.with(welcomeModel),
    Story.message(ClickedLink({ request: Internal({ url: url('/her-game') }) })),
    Story.model((model) => {
      expect(model.screen).toBe('hergame');
    }),
    Story.Command.expectHas(Navigate),
    Story.Command.resolve(Navigate, CompletedNavigate()),
  );
});

test('a browser back/forward to a club profile applies the slug route', () => {
  Story.story(
    update,
    Story.with(clubsModel),
    Story.message(ChangedUrl({ url: url('/clubs/sparta-praha') })),
    Story.model((model) => {
      expect(model.screen).toBe('clubs');
      expect(model.clubSlug).toBe('sparta-praha');
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
      expect(model.screen).toBe('welcome');
    }),
    Story.Command.expectHas(Load),
    Story.Command.resolve(Load, CompletedLoad()),
  );
});
