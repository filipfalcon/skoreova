import { Scene } from 'foldkit';
import { describe, test } from 'vite-plus/test';

import {
  clubProfileModel,
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
  // disabled while its live twin beside it is not. The old class assertion
  // (`text-ink/20`) died with Tailwind: StyleX class names are hashed, so the
  // blocked LOOK is carried by the disjoint style pair in the view and the
  // testable contract is Ui.Button's data-disabled stamp — the same attribute
  // the blocked styling keys off, so a missing stamp fails here before it
  // fails on screen.
  test('a blocked round arrow announces itself, its live twin does not', () => {
    Scene.scene(
      { update, view },
      Scene.with(competitionFirstRoundModel),
      Scene.expect(Scene.role('button', { name: 'Previous round' })).toHaveAttr(
        'aria-disabled',
        'true',
      ),
      Scene.expect(Scene.role('button', { name: 'Previous round' })).toHaveAttr('data-disabled'),
      Scene.expect(Scene.role('button', { name: 'Next round' })).not.toHaveAttr('aria-disabled'),
      Scene.expect(Scene.role('button', { name: 'Next round' })).not.toHaveAttr('data-disabled'),
    );
  });

  // The club profile is the largest view in the app and the only screen no
  // other scene reaches — this render walks its every section (hero artwork,
  // honors, commentary, matches, standings, Europe, cup run, scorers,
  // history, follow) so a broken subtree fails here rather than on screen.
  test('the richest club profile renders end to end', () => {
    Scene.scene(
      { update, view },
      Scene.with(clubProfileModel),
      Scene.expect(Scene.role('heading', { name: 'Sparta Praha' })).toExist(),
      Scene.expect(Scene.role('button', { name: 'Follow Sparta Praha' })).toExist(),
      Scene.expect(Scene.text('Top scorers')).toExist(),
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
