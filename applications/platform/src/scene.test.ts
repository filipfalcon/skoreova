import { Scene } from 'foldkit';
import { describe, test } from 'vite-plus/test';

import {
  clubsModel,
  competitionFirstRoundModel,
  herGameModel,
  herGamePinnedModel,
  welcomeModel,
} from './main.fixtures';
import { update, view } from './main';

describe('view', () => {
  test('the welcome screen renders inside the platform shell', () => {
    Scene.scene(
      { update, view },
      Scene.with(welcomeModel),
      // The header account control and the shell footer are on every screen —
      // stable proof the shell mounted around the screen.
      Scene.expect(Scene.label('Account')).toExist(),
      Scene.expect(
        Scene.text('Beta version — all data is placeholder while the platform wires up.'),
      ).toExist(),
    );
  });

  test('an empty Her Game feed shows the pin invitation, not a tile', () => {
    Scene.scene(
      { update, view },
      Scene.with(herGameModel),
      Scene.expect(
        Scene.text('Pin any tile or chart and it lands here — your own front page.'),
      ).toExist(),
      Scene.expect(Scene.text('Saved charts')).toExist(),
    );
  });

  test('a pinned tile appears in the Her Game feed with its own title', () => {
    Scene.scene(
      { update, view },
      Scene.with(herGamePinnedModel),
      // Each pinned tile carries its own self-describing title in the feed.
      Scene.expect(Scene.text('Trending · Sparta Praha')).toExist(),
      // …and its pin control now offers to remove it.
      Scene.expect(Scene.role('button', { name: 'Unpin Sparta Praha from Her Game' })).toExist(),
    );
  });

  // The round pager’s end-stops are the app’s one blocked control, and the
  // blocked half is what has broken elsewhere in this repo — a state announced
  // through an attribute the markup never carried, or styled through a selector
  // that never matched. On matchday 1 "Previous round" must be announced as
  // disabled and dimmed, while its live twin beside it proves the two looks are
  // genuinely different strings rather than one that lost the cascade.
  test('a blocked round arrow announces and dims, its live twin does neither', () => {
    Scene.scene(
      { update, view },
      Scene.with(competitionFirstRoundModel),
      Scene.expect(Scene.role('button', { name: 'Previous round' })).toHaveAttr(
        'aria-disabled',
        'true',
      ),
      Scene.expect(Scene.role('button', { name: 'Previous round' })).toHaveClass('text-ink/20'),
      Scene.expect(Scene.role('button', { name: 'Next round' })).not.toHaveAttr('aria-disabled'),
      Scene.expect(Scene.role('button', { name: 'Next round' })).not.toHaveClass('text-ink/20'),
    );
  });

  test('the clubs directory renders its search field', () => {
    Scene.scene(
      { update, view },
      Scene.with(clubsModel),
      Scene.expect(Scene.label('Search clubs')).toExist(),
    );
  });

  // The one INTERACTION scene: everything above renders a fixed model, which
  // proves the view but not the loop. Typing goes through UpdatedClubQuery and
  // back out as a re-rendered grid, so this covers input → update → view.
  test('typing in the search box filters the grid down to the match', () => {
    Scene.scene(
      { update, view },
      Scene.with(clubsModel),
      // Each card carries its crest, so the alt text is the grid’s identity.
      Scene.expect(Scene.altText('Sparta Praha crest')).toExist(),
      Scene.type(Scene.label('Search clubs'), 'slovacko'),
      // Diacritics-insensitive, so an ASCII query still finds Slovácko —
      // and every club it doesn’t name leaves the grid.
      Scene.expect(Scene.altText('Slovácko crest')).toExist(),
      Scene.expect(Scene.altText('Sparta Praha crest')).toBeAbsent(),
    );
  });
});
