import { Scene } from 'foldkit';
import { describe, test } from 'vitest';

import { clubsModel, herGameModel, herGamePinnedModel, welcomeModel } from './main.fixtures';
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
        Scene.text('Preview build — all data is placeholder while the platform wires up.'),
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

  test('the clubs directory renders its search field', () => {
    Scene.scene(
      { update, view },
      Scene.with(clubsModel),
      Scene.expect(Scene.label('Search clubs')).toExist(),
    );
  });
});
