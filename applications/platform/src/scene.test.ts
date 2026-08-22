import { Scene } from 'foldkit';
import { describe, test } from 'vite-plus/test';

import {
  clubProfileModel,
  clubsModel,
  competitionFirstRoundModel,
  feedHeadlessModel,
  feedLabelledModel,
  feedRefusedModel,
  herGameModel,
  signedInModel,
  welcomeModel,
  widgetCatalogModel,
} from './main.fixtures';
import { update, view } from './main';

describe('view', () => {
  test('the Her Game front page renders inside the platform shell', () => {
    Scene.scene(
      { update, view },
      Scene.given(herGameModel),
      // The nav's own short label for the competitions section appears nowhere
      // else in the document, and the footer note is on every screen — between
      // them, stable proof the shell mounted around the screen.
      Scene.expect(Scene.text('Leagues')).toExist(),
      Scene.expect(
        Scene.text('Beta version — all data is placeholder while the platform wires up.'),
      ).toExist(),
    );
  });

  test('the root is the landing until the visitor signs in', () => {
    Scene.scene(
      { update, view },
      Scene.given(welcomeModel),
      // The tape, the trending board and the feed are the landing, and what
      // sits behind the sign-in must not leak onto it. The feed carries the
      // week's fixtures, so the pulse's own chip stays off this page.
      Scene.expect(Scene.text('Slavia Praha')).toExist(),
      Scene.expect(Scene.text('Trending')).toExist(),
      Scene.expect(Scene.text('Feed')).toExist(),
      Scene.expect(Scene.text('This week')).not.toExist(),
      Scene.expect(Scene.text('Goals')).not.toExist(),
      // A pin sends a tile to Her Game, which the reader has no way to reach
      // from here — so the landing's tiles carry no pin control.
      Scene.expect(Scene.role('button', { name: 'Pin Sierra Pennock to Her Game' })).not.toExist(),
    );
  });

  test('signing in turns the same route into Her Game', () => {
    Scene.scene(
      { update, view },
      Scene.given(signedInModel),
      // The stat boards are the half of the page that an account buys.
      Scene.expect(Scene.text('Goals')).toExist(),
      // The same tiles, but pinnable now that there is somewhere to pin them.
      Scene.expect(Scene.role('button', { name: 'Pin Sierra Pennock to Her Game' })).toExist(),
    );
  });

  // The catalog is the platform's answer to "what else could be here", so what
  // it must show is EVERY widget, always addable — a feed can carry the same
  // one as many times as the reader wants it.
  test('the catalog offers every widget, whatever the feed already carries', () => {
    Scene.scene(
      { update, view },
      Scene.given(widgetCatalogModel),
      Scene.expect(Scene.role('button', { name: 'Add Label to your feed' })).toExist(),
      Scene.expect(Scene.role('button', { name: 'Add Featured matches to your feed' })).toExist(),
    );
  });

  test('a pick that would overfill a signed-out feed is refused out loud', () => {
    Scene.scene(
      { update, view },
      Scene.given(feedRefusedModel),
      Scene.expect(Scene.role('alert')).toExist(),
      Scene.expect(
        Scene.text(
          'Three widgets and three headings is the most a feed carries without an account.',
        ),
      ).toExist(),
    );
  });

  // Every block arrives carrying a heading, so the default feed's own board is
  // headed too — which is what the reader sees before touching anything.
  test('the default feed heads its board without being asked', () => {
    Scene.scene(
      { update, view },
      Scene.given(welcomeModel),
      Scene.expect(Scene.role('heading', { name: 'Featured matches' })).toExist(),
    );
  });

  test('two blocks of one kind read as two headings', () => {
    Scene.scene(
      { update, view },
      Scene.given(feedLabelledModel),
      Scene.expect(Scene.role('heading', { name: 'My clubs' })).toExist(),
      Scene.expect(Scene.role('heading', { name: 'Featured matches' })).toExist(),
      Scene.expect(Scene.role('heading', { name: 'Cup week' })).toExist(),
    );
  });

  // A heading REMOVED and a heading left BLANK look alike in a model that
  // cannot tell them apart. This is the scene that proves they are not: the
  // blank one still holds its line, the removed one draws nothing.
  test('a blank heading holds its line, a removed one does not', () => {
    Scene.scene(
      { update, view },
      Scene.given(feedHeadlessModel),
      Scene.expect(Scene.role('heading', { name: 'Untitled label' })).toExist(),
      Scene.expect(Scene.role('heading', { name: 'Featured matches' })).not.toExist(),
    );
  });

  test('managing the feed gives every block its own field and controls', () => {
    Scene.scene(
      { update, view },
      Scene.given({ ...feedLabelledModel, isFeedEditing: true }),
      Scene.expect(Scene.role('heading', { name: 'My clubs' })).not.toExist(),
      Scene.expectAll(Scene.all.role('textbox')).toHaveCount(3),
      // Two blocks of one kind must not answer to one name. A control named
      // after the KIND would give both featured-matches blocks the same one,
      // which is the defect a feed of singletons could never have had.
      Scene.expect(Scene.role('textbox', { name: 'Featured matches' })).toHaveValue(
        'Featured matches',
      ),
      Scene.expect(Scene.role('textbox', { name: 'Cup week' })).toHaveValue('Cup week'),
      Scene.expect(Scene.role('button', { name: 'Unpin Cup week from the feed' })).toExist(),
      Scene.expect(Scene.role('button', { name: 'Remove the Cup week heading' })).toExist(),
      // A standalone heading IS its block, so it is offered no way to shed the
      // heading — only the block's own way out.
      Scene.expect(Scene.role('button', { name: 'Unpin My clubs from the feed' })).toExist(),
      Scene.expect(Scene.role('button', { name: 'Remove the My clubs heading' })).not.toExist(),
    );
  });

  test('a block with no heading is offered one back', () => {
    Scene.scene(
      { update, view },
      Scene.given({ ...feedHeadlessModel, isFeedEditing: true }),
      Scene.expect(Scene.role('button', { name: 'Give the Featured matches a heading' })).toExist(),
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
      Scene.given(competitionFirstRoundModel),
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
      Scene.given(clubProfileModel),
      Scene.expect(Scene.role('heading', { name: 'Sparta Praha' })).toExist(),
      Scene.expect(Scene.role('button', { name: 'Follow Sparta Praha' })).toExist(),
      Scene.expect(Scene.text('Top scorers')).toExist(),
    );
  });

  test('the clubs directory renders its search field', () => {
    Scene.scene(
      { update, view },
      Scene.given(clubsModel),
      Scene.expect(Scene.label('Search clubs')).toExist(),
    );
  });

  // The one INTERACTION scene: everything above renders a fixed model, which
  // proves the view but not the loop. Typing goes through UpdatedClubQuery and
  // back out as a re-rendered grid, so this covers input → update → view.
  test('typing in the search box filters the grid down to the match', () => {
    Scene.scene(
      { update, view },
      Scene.given(clubsModel),
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
